import { z } from "zod";

import { accountSchema, noteSchema } from "@/db/schema";
import type { Account, Folder, Note } from "@/db/schema";
import type { SeedData } from "@/fixtures";

/**
 * The "backend": an in-memory database behind a small REST API. It knows
 * nothing about TanStack DB; `fakeFetch` puts it behind a `fetch`-like
 * function. Like a real server it validates every write, and some writes are
 * rejected (duplicate folder names, titles that are too long) so the app can
 * show what happens to an optimistic change the server says no to.
 *
 *   GET    /api/folders          PATCH  /api/folders/:id
 *   GET    /api/notes            POST   /api/notes
 *   GET    /api/notes/:id        PATCH  /api/notes/:id    DELETE /api/notes/:id
 *   GET    /api/account          PATCH  /api/account
 */

export const NOTE_TITLE_MAX_LENGTH = 100;
export const FOLDER_NAME_MAX_LENGTH = 40;

export interface ServerRequest {
  method: string;
  /** Path only, e.g. `/api/notes/note-01`. */
  path: string;
  /** Parsed JSON body, if any. */
  body: unknown;
}

export interface ServerResponse {
  status: number;
  /** Serialized as JSON; `undefined` means no body (204). */
  body?: unknown;
}

/** Error responses look like `{ error: { code, message } }`. */
export interface ApiErrorBody {
  error: { code: string; message: string };
}

export interface FakeServer {
  handle: (request: ServerRequest) => ServerResponse;
}

const folderPatchSchema = z.object({ name: z.string() }).partial();

const notePatchSchema = noteSchema
  .pick({ folderId: true, title: true, body: true, pinned: true, deletedAt: true })
  .partial();

const accountPatchSchema = accountSchema
  .pick({
    name: true,
    email: true,
    defaultFolderId: true,
    sortNotesBy: true,
    newNotesStartWith: true,
    groupNotesByDate: true,
  })
  .partial();

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const ok = (body: unknown, status = 200): ServerResponse => ({ status, body });
const noContent = (): ServerResponse => ({ status: 204 });

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const [issue] = result.error.issues;
    const field = issue?.path.join(".");
    throw new HttpError(
      422,
      "validation_failed",
      field ? `${field}: ${issue?.message}` : "Invalid request body.",
    );
  }
  return result.data;
}

export function createFakeServer(seed: SeedData): FakeServer {
  // Structured clones, so nothing the app holds can change "server" data.
  const folders = new Map(seed.folders.map((folder) => [folder.id, structuredClone(folder)]));
  const notes = new Map(seed.notes.map((note) => [note.id, structuredClone(note)]));
  let account = structuredClone(seed.account);

  function findFolder(id: string): Folder {
    const folder = folders.get(id);
    if (!folder) throw new HttpError(404, "not_found", "That folder doesn't exist.");
    return folder;
  }

  function findNote(id: string): Note {
    const note = notes.get(id);
    if (!note) throw new HttpError(404, "not_found", "That note doesn't exist.");
    return note;
  }

  function assertFolderExists(id: string) {
    if (!folders.has(id))
      throw new HttpError(422, "validation_failed", "That folder doesn't exist.");
  }

  function validateTitle(title: string) {
    if (title.length > NOTE_TITLE_MAX_LENGTH) {
      throw new HttpError(
        422,
        "title_too_long",
        `Note titles can be at most ${NOTE_TITLE_MAX_LENGTH} characters.`,
      );
    }
  }

  function renameFolder(folder: Folder, rawName: string) {
    const name = rawName.trim();
    if (folder.role !== null) {
      throw new HttpError(403, "forbidden", `“${folder.name}” can't be renamed.`);
    }
    if (name === "") throw new HttpError(422, "validation_failed", "Folder names can't be empty.");
    if (name.length > FOLDER_NAME_MAX_LENGTH) {
      throw new HttpError(
        422,
        "validation_failed",
        `Folder names can be at most ${FOLDER_NAME_MAX_LENGTH} characters.`,
      );
    }
    const taken = [...folders.values()].some(
      (other) => other.id !== folder.id && other.name.toLowerCase() === name.toLowerCase(),
    );
    if (taken) {
      throw new HttpError(409, "duplicate_name", `There's already a folder named “${name}”.`);
    }
    folder.name = name;
  }

  const routes: Route[] = [
    route("GET", "/api/folders", () =>
      ok([...folders.values()].sort((a, b) => a.position - b.position)),
    ),
    route("GET", "/api/folders/:id", ({ id }) => ok(findFolder(id))),
    route("PATCH", "/api/folders/:id", ({ id }, body) => {
      const folder = findFolder(id);
      const changes = parse(folderPatchSchema, body);
      if (changes.name !== undefined) renameFolder(folder, changes.name);
      return ok(folder);
    }),

    route("GET", "/api/notes", () => ok([...notes.values()])),
    route("GET", "/api/notes/:id", ({ id }) => ok(findNote(id))),
    route("POST", "/api/notes", (_params, body) => {
      const note = parse(noteSchema, body);
      if (notes.has(note.id)) {
        throw new HttpError(409, "duplicate_id", "A note with this id already exists.");
      }
      assertFolderExists(note.folderId);
      validateTitle(note.title);
      notes.set(note.id, note);
      return ok(note, 201);
    }),
    route("PATCH", "/api/notes/:id", ({ id }, body) => {
      const note = findNote(id);
      const changes = parse(notePatchSchema, body);
      if (changes.folderId !== undefined) assertFolderExists(changes.folderId);
      if (changes.title !== undefined) validateTitle(changes.title);
      const edited = changes.title !== undefined || changes.body !== undefined;
      Object.assign(note, changes, edited ? { updatedAt: new Date().toISOString() } : {});
      return ok(note);
    }),
    route("DELETE", "/api/notes/:id", ({ id }) => {
      findNote(id);
      notes.delete(id);
      return noContent();
    }),

    route("GET", "/api/account", () => ok(account)),
    route("PATCH", "/api/account", (_params, body) => {
      const changes = parse(accountPatchSchema, body);
      if (changes.defaultFolderId !== undefined) assertFolderExists(changes.defaultFolderId);
      account = { ...account, ...changes } satisfies Account;
      return ok(account);
    }),
  ];

  return {
    handle({ method, path, body }) {
      try {
        const matches = routes
          .map((candidate) => ({ candidate, params: matchPath(candidate.pattern, path) }))
          .filter((match) => match.params !== null);
        if (matches.length === 0) throw new HttpError(404, "not_found", `No route for ${path}.`);
        const match = matches.find(({ candidate }) => candidate.method === method);
        if (!match)
          throw new HttpError(405, "method_not_allowed", `${method} ${path} isn't allowed.`);
        const response = match.candidate.handler(match.params!, body);
        // Responses are snapshots too.
        return { ...response, body: structuredClone(response.body) };
      } catch (error) {
        if (error instanceof HttpError) {
          return { status: error.status, body: errorBody(error.code, error.message) };
        }
        return { status: 500, body: errorBody("internal_error", "Something went wrong.") };
      }
    },
  };
}

export function errorBody(code: string, message: string): ApiErrorBody {
  return { error: { code, message } };
}

type Params = Record<string, string>;

interface Route {
  method: string;
  pattern: string;
  handler: (params: Params, body: unknown) => ServerResponse;
}

function route(method: string, pattern: string, handler: Route["handler"]): Route {
  return { method, pattern, handler };
}

/** `/api/notes/:id` matches `/api/notes/note-01` → `{ id: "note-01" }`. */
export function matchPath(pattern: string, path: string): Params | null {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return null;
  const params: Params = {};
  for (const [index, part] of patternParts.entries()) {
    const value = pathParts[index]!;
    if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(value);
    else if (part !== value) return null;
  }
  return params;
}
