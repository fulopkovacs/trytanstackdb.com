import z from "zod";

type APIRequest = {
  path: string;
  method: string;
  body: any;
};

const projectUpdateDataSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

export const requestSchema = z.object({
  pathname: z.string().min(1),
  method: z.enum(["GET", "PATCH", "POST", "DELETE"]),
  requestBody: z.any().optional(),
});

type RequestData = z.infer<typeof requestSchema>;

function getProjects() {
  return [
    { id: "pr1", name: "Project Alpha" },
    { id: "pr2", name: "Project Beta" },
    { id: "pr3", name: "Project Gamma" },
  ];
}

export const API: Record<
  RequestData["method"],
  Record<RequestData["pathname"], (body: any) => any>
> = {
  GET: {
    "/api/projects": () => getProjects(),
  },
  PATCH: {
    "/api/projects": (projectId: string) => ({
      message: "Updated projects successfully",
      projectId,
    }),
  },
  POST: {},
  DELETE: {},
};
