import { describe, expect, it } from "vite-plus/test";

import { matchesAppAction } from "@/lib/app-actions";
import type { AppActionEvent } from "@/lib/app-actions";

import { sectionsDoneBy } from "./section-progress";

const rejectedRename: AppActionEvent = {
  type: "folder.renamed",
  folderId: "work",
  name: "Personal",
  status: "rolled-back",
};

describe("matchesAppAction", () => {
  it("matches on every given field", () => {
    expect(matchesAppAction({ type: "folder.renamed" }, rejectedRename)).toBe(true);
    expect(matchesAppAction({ status: "rolled-back" }, rejectedRename)).toBe(true);
    expect(matchesAppAction({ type: "folder.renamed", status: "confirmed" }, rejectedRename)).toBe(
      false,
    );
    expect(matchesAppAction({ type: "note.edited" }, rejectedRename)).toBe(false);
  });
});

describe("sectionsDoneBy", () => {
  it("maps app actions to the guide sections they complete", () => {
    expect(sectionsDoneBy({ type: "note.opened", noteId: "n", status: "applied" })).toEqual([
      "introduction",
    ]);
    expect(
      sectionsDoneBy({ type: "folder.opened", folderId: "work", smart: false, status: "applied" }),
    ).toEqual(["collections"]);
    expect(
      sectionsDoneBy({ type: "folder.opened", folderId: "all", smart: true, status: "applied" }),
    ).toEqual(["live-queries"]);
    expect(sectionsDoneBy({ type: "note.edited", noteId: "n", status: "applied" })).toEqual([
      "optimistic-updates",
    ]);
    expect(sectionsDoneBy(rejectedRename)).toEqual(["rollbacks"]);
  });
});
