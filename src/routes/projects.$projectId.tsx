import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { projectsCollection } from "@/collections/projects";
import { TodoBoards } from "@/components/TodoBoards";

export const Route = createFileRoute("/projects/$projectId")({
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

  // const tasks = useMemo(() => {
  //   const limit = 1500;
  //   const tasks = [...mockTasks];
  //
  //   for (let i = 0; i < limit; i++) {
  //     tasks.push({
  //       id: `task-${i + mockTasks.length + 1}`,
  //       title: `Task ${i + mockTasks.length + 1}`,
  //       // status: mockTasks[i % mockTasks.length].status,
  //       status: "todo",
  //     });
  //   }
  //
  //   // return tasks.slice(0, 7);
  //   return tasks;
  // }, []);

  return (
    <div className="px-4 py-2 flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
      <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance">
        {project?.name || "Project"}
      </h1>
      <TodoBoards projectId={projectId} />
    </div>
  );
}
