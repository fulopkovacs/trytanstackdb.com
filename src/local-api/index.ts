import todoItemsBatchRoutes from "./api.batch.todo-items";
import boardRoutes from "./api.boards";
import projectRoutes from "./api.projects";
import todoRoutes from "./api.todo-items";
import { type APIType, deconstructResponseFromHandler } from "./helpers";

export const API = {
  "/api/projects": projectRoutes,
  "/api/boards": boardRoutes,
  "/api/todo-items": todoRoutes,
  "/api/batch/todo-items": todoItemsBatchRoutes,
} satisfies APIType;

// type APIRoutePath = keyof typeof API;

// type APIRouteHandler = (typeof API)[APIRoutePath] extends infer T
//   ? T extends object
//     ? keyof T
//     : never
//   : never;

/**
  Helper function for calling the local API directly,
  bypassing fetch.

  Similar to server functions for apps with remote dbs
  (the db for this app is local).
*/
export async function getDataFromApi<G>(
  handler: () => Promise<Response>,
): Promise<G> {
  const res = await handler();

  const { body } = await deconstructResponseFromHandler(res);

  return body as G;
}
