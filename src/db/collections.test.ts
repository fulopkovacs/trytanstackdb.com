import { createPacedMutations, debounceStrategy } from "@tanstack/react-db";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { api } from "@/api/client";
import { setNetworkConfig } from "@/api/network-config";
import { clearRequestLog, requestLogStore } from "@/api/request-log";

import { foldersCollection, notesCollection, saveNoteUpdates } from "./collections";
import { createNote, renameFolder, setNotePinned } from "./mutations";
import type { Note } from "./schema";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const requests = () => requestLogStore.get().map((entry) => `${entry.method} ${entry.url}`);

beforeAll(async () => {
  setNetworkConfig({ latencyMs: 0 });
  await Promise.all([foldersCollection.preload(), notesCollection.preload()]);
});

beforeEach(() => {
  setNetworkConfig({ latencyMs: 0, failNextRequest: false, failureRate: 0 });
  clearRequestLog();
});

describe("overlapping saves to one record", () => {
  it("end on the newest value, even when the older request is slower", async () => {
    setNetworkConfig({ latencyMs: 200 });
    const older = renameFolder("work", "Job");
    await sleep(10); // the older PATCH is in flight
    setNetworkConfig({ latencyMs: 0 });
    const newer = renameFolder("work", "Office");
    expect(foldersCollection.get("work")?.name).toBe("Office"); // still optimistic and instant

    await Promise.all([older.when("settled"), newer.when("settled")]);
    expect(foldersCollection.get("work")?.name).toBe("Office");
    expect((await api.get<{ name: string }>("/api/folders/work")).name).toBe("Office");
  });

  it("end on the newest edit across separate editor sessions", async () => {
    const editor = () =>
      createPacedMutations<string, Note>({
        onMutate: (title) =>
          notesCollection.update("note-01", (draft) => {
            draft.title = title;
          }),
        mutationFn: ({ transaction }) => saveNoteUpdates(transaction),
        strategy: debounceStrategy({ wait: 5 }),
      });
    setNetworkConfig({ latencyMs: 200 });
    const older = editor()("Older title");
    await sleep(30);
    setNetworkConfig({ latencyMs: 0 });
    const newer = editor()("Newer title");

    await Promise.all([older.when("settled"), newer.when("settled")]);
    expect(notesCollection.get("note-01")?.title).toBe("Newer title");
    expect((await api.get<Note>("/api/notes/note-01")).title).toBe("Newer title");
  });

  it("send an edit to a new note only after the note is created", async () => {
    setNetworkConfig({ latencyMs: 100 });
    const { note, tx: created } = createNote("work");
    setNetworkConfig({ latencyMs: 0 });
    const edited = notesCollection.update(note.id, (draft) => {
      draft.title = "Typed right away";
    });

    await Promise.all([created.when("settled"), edited.when("settled")]);
    expect(requests()).toEqual(["POST /api/notes", `PATCH /api/notes/${note.id}`]);
    expect(notesCollection.get(note.id)?.title).toBe("Typed right away");
  });

  it("don't send writes queued behind one the server rejected", async () => {
    setNetworkConfig({ latencyMs: 50 });
    const rejected = renameFolder("travel", "Personal");
    const queued = setNotePinned("note-02", true); // another record: not affected
    const behind = renameFolder("travel", "Trips");

    await expect(rejected.when("settled")).rejects.toMatchObject({ status: 409 });
    await expect(behind.when("settled")).rejects.toMatchObject({ status: 409 });
    await queued.when("settled");
    expect(requests().filter((request) => request.includes("/folders/travel"))).toHaveLength(1);
    expect(foldersCollection.get("travel")?.name).toBe("Travel");
    expect(notesCollection.get("note-02")?.pinned).toBe(true);
  });
});

describe("confirmed data", () => {
  it("comes from the write's response, so a failing read can't undo it", async () => {
    const tx = notesCollection.update("note-03", (draft) => {
      draft.title = "Reading list";
    });
    await tx.when("settled");
    expect(tx.state).toBe("completed");
    // No refetch: the PATCH response is the confirmed row.
    expect(requests()).toEqual(["PATCH /api/notes/note-03"]);
    expect(notesCollection.get("note-03")?.title).toBe("Reading list");

    // A read that fails afterwards keeps the confirmed value.
    setNetworkConfig({ failNextRequest: true });
    await notesCollection.utils.refetch();
    expect(requestLogStore.get().at(-1)).toMatchObject({ method: "GET", status: 500 });
    expect(notesCollection.get("note-03")?.title).toBe("Reading list");
    expect((await api.get<Note>("/api/notes/note-03")).title).toBe("Reading list");
  });

  it("uses the server's version of the row (its updatedAt)", async () => {
    const before = notesCollection.get("note-04")!.updatedAt;
    await notesCollection
      .update("note-04", (draft) => {
        draft.body = "Oat milk";
      })
      .when("settled");
    const server = await api.get<Note>("/api/notes/note-04");
    expect(notesCollection.get("note-04")?.updatedAt).toBe(server.updatedAt);
    expect(server.updatedAt).not.toBe(before);
  });
});
