import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { projectsCollection } from "@/collections/projects";
import { TodoBoards } from "@/components/TodoBoards";

export const Route = createFileRoute("/_tempDbRequired/projects/$projectId")({
  component: RouteComponent,
  loader: async ({ context }) => {
    return {
      tempDbId: context.tempDbId,
    };
  },
});

function RouteComponent() {
  const { projectId } = Route.useParams();

  const {
    data: [project],
  } = useLiveQuery(
    (q) =>
      q
        .from({ project: projectsCollection })
        .where(({ project }) => eq(project.id, projectId)),
    [projectId],
  );

  return (
    <div className="px-4 py-2 flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
      <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance">
        {project?.name || "Project"}
      </h1>
      <p>{project?.description || ""}</p>
      <TodoBoards projectId={projectId} />
    </div>
  );
}
