import { createPacedMutations, debounceStrategy } from "@tanstack/react-db";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { api } from "@/api/client";
import { fakeFetch } from "@/api/fake-fetch";
import { setNetworkConfig } from "@/api/network-config";
import { clearRequestLog, requestLogStore } from "@/api/request-log";

import { foldersCollection, notesCollection, saveNoteUpdates } from "./collections";
import { subscribeToAppActions } from "@/lib/app-actions";
import type { AppActionEvent } from "@/lib/app-actions";

import {
  createNote,
  deleteNote,
  deleteNotePermanently,
  editNote,
  renameFolder,
  setNotePinned,
} from "./mutations";
import type { Note } from "./schema";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const requests = () => requestLogStore.get().map((entry) => `${entry.method} ${entry.url}`);

beforeAll(async () => {
  setNetworkConfig({ latencyMs: 0 });
  await Promise.all([foldersCollection.preload(), notesCollection.preload()]);
  // Like the app (`useAppData`): stay subscribed, so the query doesn't refetch
  // each time a test's watcher subscribes again.
  notesCollection.subscribeChanges(() => {});
  foldersCollection.subscribeChanges(() => {});
});

beforeEach(() => {
  setNetworkConfig({ latencyMs: 0, failNextRequest: false, failureRate: 0 });
  clearRequestLog();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Makes PATCH requests to `url` take `ms` longer than the others. */
function delayPatch(url: string, ms: number) {
  const patch = api.patch;
  vi.spyOn(api, "patch").mockImplementation(async (target, body) => {
    if (target === url) await sleep(ms);
    return patch(target, body);
  });
}

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

describe("note edits from several editors", () => {
  it("save in the order they were typed: a buffered older edit can't land last", async () => {
    // Editor A types, pauses (its save starts, slowly), then types more.
    setNetworkConfig({ latencyMs: 300 });
    const first = editNote("note-05", { title: "First" });
    await sleep(600);
    expect(requests()).toEqual(["PATCH /api/notes/note-05"]); // in flight
    setNetworkConfig({ latencyMs: 0 });
    editNote("note-05", { title: "Older buffered" });
    // Editor B (another mount or layout) edits the same note.
    const newest = editNote("note-05", { title: "Newest" });
    expect(notesCollection.get("note-05")?.title).toBe("Newest");

    await Promise.all([first.when("settled"), newest.when("settled")]);
    expect(notesCollection.get("note-05")?.title).toBe("Newest");
    expect((await api.get<Note>("/api/notes/note-05")).title).toBe("Newest");
  });
});

/** Every distinct value `pick` gives for a note while the collection changes. */
function watchNote<T>(noteId: string, pick: (note: Note | undefined) => T) {
  const values = [pick(notesCollection.get(noteId))];
  const subscription = notesCollection.subscribeChanges(() =>
    values.push(pick(notesCollection.get(noteId))),
  );
  return () => {
    subscription.unsubscribe();
    return values.filter((value, index) => index === 0 || value !== values[index - 1]);
  };
}

function watchRollbacks() {
  const rollbacks: AppActionEvent[] = [];
  const stop = subscribeToAppActions((event) => {
    if (event.status === "rolled-back") rollbacks.push(event);
  });
  return () => (stop(), rollbacks);
}

describe("a note action right after typing", () => {
  it.each([0, 100, 600])("pin doesn't flicker back (%i ms latency)", async (latencyMs) => {
    const noteId = `note-1${latencyMs === 0 ? 0 : latencyMs === 100 ? 1 : 2}`;
    await setNotePinned(noteId, false).when("settled");
    setNetworkConfig({ latencyMs });
    const pinned = watchNote(noteId, (note) => note?.pinned);
    const rollbacks = watchRollbacks();

    editNote(noteId, { title: "Edited" });
    await setNotePinned(noteId, true).when("settled");
    await sleep(latencyMs + 50);

    expect(pinned()).toEqual([false, true]);
    expect(rollbacks()).toEqual([]);
    expect(await api.get<Note>(`/api/notes/${noteId}`)).toMatchObject({
      title: "Edited",
      pinned: true,
    });
  });

  it.each([0, 100, 600])("delete doesn't bring the note back (%i ms)", async (latencyMs) => {
    const noteId = `note-1${latencyMs === 0 ? 3 : latencyMs === 100 ? 4 : 5}`;
    setNetworkConfig({ latencyMs });
    const deleted = watchNote(noteId, (note) => note?.deletedAt != null);
    const rollbacks = watchRollbacks();

    editNote(noteId, { title: "Edited" });
    await deleteNote(noteId).when("settled");
    await sleep(latencyMs + 50);

    expect(deleted()).toEqual([false, true]);
    expect(rollbacks()).toEqual([]);
    expect((await api.get<Note>(`/api/notes/${noteId}`)).deletedAt).not.toBeNull();
  });

  it.each([0, 100, 600])(
    "permanent delete drops the unsaved edit, without a failure (%i ms)",
    async (latencyMs) => {
      const noteId = `note-1${latencyMs === 0 ? 6 : latencyMs === 100 ? 7 : 8}`;
      setNetworkConfig({ latencyMs });
      const present = watchNote(noteId, (note) => note !== undefined);
      const rollbacks = watchRollbacks();

      editNote(noteId, { title: "Edited" });
      await deleteNotePermanently(noteId).when("settled");
      await sleep(latencyMs + 600); // past the editor's debounce

      expect(present()).toEqual([true, false]);
      expect(rollbacks()).toEqual([]);
      expect(requests()).toEqual([`DELETE /api/notes/${noteId}`]);
      expect((await fakeFetch(`/api/notes/${noteId}`)).status).toBe(404);
    },
  );

  it("permanent delete waits for an edit that's already saving", async () => {
    setNetworkConfig({ latencyMs: 300 });
    const present = watchNote("note-19", (note) => note !== undefined);
    const rollbacks = watchRollbacks();

    const saving = editNote("note-19", { title: "Edited" });
    await sleep(550); // the edit's PATCH is in flight
    await deleteNotePermanently("note-19").when("settled");
    await saving.when("settled");

    expect(present()).toEqual([true, false]);
    expect(rollbacks()).toEqual([]);
    expect(requests()).toEqual(["PATCH /api/notes/note-19", "DELETE /api/notes/note-19"]);
  });
});

describe("multi-record transactions", () => {
  it("confirm each record in order with later saves to it", async () => {
    // Note A and B saved together; B's request is slow.
    delayPatch("/api/notes/note-07", 200);
    const batch = notesCollection.update(["note-06", "note-07"], (drafts) => {
      for (const draft of drafts) draft.title = "Older batch";
    });
    await sleep(20);
    const newer = notesCollection.update("note-06", (draft) => {
      draft.title = "Newest";
    });

    await Promise.all([batch.when("settled"), newer.when("settled")]);
    expect(notesCollection.get("note-06")?.title).toBe("Newest");
    expect((await api.get<Note>("/api/notes/note-06")).title).toBe("Newest");
    expect(notesCollection.get("note-07")?.title).toBe("Older batch");
  });

  it("keep the records the server accepted when another one is rejected", async () => {
    const tx = notesCollection.update(["note-08", "note-09"], ([accepted, rejected]) => {
      accepted!.title = "Saved";
      rejected!.title = "x".repeat(101); // over the server's limit: 422
    });
    const rejectedBefore = (await api.get<Note>("/api/notes/note-09")).title;

    await expect(tx.when("settled")).rejects.toMatchObject({ status: 422 });
    // The transaction rolled back, but note-08 shows what the server saved.
    expect(notesCollection.get("note-08")?.title).toBe("Saved");
    expect((await api.get<Note>("/api/notes/note-08")).title).toBe("Saved");
    expect(notesCollection.get("note-09")?.title).toBe(rejectedBefore);
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
