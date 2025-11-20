import boardRoutes from "./api.boards";
import projectRoutes from "./api.projects";
import type { APIType } from "./helpers";

export const API = {
  "/api/projects": projectRoutes,
  "/api/boards": boardRoutes,
} satisfies APIType;
