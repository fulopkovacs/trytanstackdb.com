import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { projectsCollection } from "@/collections/projects";
import { EditableProjectDetails } from "@/components/EditableProjectDetails";
import { TodoBoards } from "@/components/TodoBoards";

export const Route = createFileRoute("/_tutorial/_db/projects/$projectId")({
  component: RouteComponent,
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
      {project && (
        <>
          <EditableProjectDetails project={project} />
          <TodoBoards projectId={projectId} />
        </>
      )}
    </div>
  );
}
