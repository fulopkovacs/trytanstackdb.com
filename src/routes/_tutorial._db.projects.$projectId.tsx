import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EditableProjectDetails } from "@/components/EditableProjectDetails";
import { TodoBoards } from "@/components/TodoBoards";

export const Route = createFileRoute("/_tutorial/_db/projects/$projectId")({
  // loader: async ({ params: { projectId } }) => {
  //   const projectCollectionArray = await projectsCollection.toArrayWhenReady();
  //   if (!projectCollectionArray.find((p) => p.id === projectId)) {
  //     throw notFound();
  //   }
  // },
  // notFoundComponent: NotFoundComponent,
  component: RouteComponent,
});

function SharedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-2 flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
      {children}
    </div>
  );
}

function RouteComponent() {
  const { projectId } = Route.useParams();

  // const {
  //   data: [project],
  // } = useLiveQuery(
  //   (q) =>
  //     q
  //       .from({ project: projectsCollection })
  //       .where(({ project }) => eq(project.id, projectId)),
  //   [projectId],
  // );

  return (
    <SharedLayout>
      <EditableProjectDetails projectId={projectId} />
      <TodoBoards projectId={projectId} />
    </SharedLayout>
  );
}

// function NotFoundComponent() {
//   const {
//     data: [firstProject],
//   } = useLiveQuery((q) =>
//     q
//       .from({ project: projectsCollection })
//       .orderBy(({ project }) => project.createdAt)
//       .limit(1),
//   );
//
//   return (
//     <SharedLayout>
//       <div>
//         <p>Project not found.</p>
//         {firstProject && (
//           <Link
//             className="underline hover:opacity-80 transition-opacity text-orange-500"
//             to={"/projects/$projectId"}
//             params={{
//               projectId: firstProject.id,
//             }}
//           >
//             You can visit the "{firstProject.name}" project instead.
//           </Link>
//         )}
//       </div>
//     </SharedLayout>
//   );
// }
