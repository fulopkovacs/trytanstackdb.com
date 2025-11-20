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

const methodShema = z.enum(["GET", "PATCH", "POST", "DELETE"]);
type Method = z.infer<typeof methodShema>;

export const requestSchema = z.object({
  pathname: z.string().min(1),
  method: methodShema,
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

type Pathname = string;

export type API = Record<Pathname, Partial<Record<Method, (payload: any) => any>>>;

export const API = {
  "/api/projects": {
    GET: () => getProjects(),
    PATCH: (projectId: string) => ({
      message: "Updated projects successfully",
      projectId,
    }),
  },
} satisfies API;
