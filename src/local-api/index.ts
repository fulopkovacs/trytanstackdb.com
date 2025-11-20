import { type APIType } from "./helpers";
import projectRoutes from "./api.projects";


export const API = {
  "/api/projects": projectRoutes
} satisfies APIType;
