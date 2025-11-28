import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EditableProjectDetails } from "@/components/EditableProjectDetails";
import { TodoBoards } from "@/components/TodoBoards";

export const Route = createFileRoute("/_tutorial/_db/projects/$projectId")({
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

  return (
    <SharedLayout>
      <EditableProjectDetails projectId={projectId} />
      <TodoBoards projectId={projectId} />
    </SharedLayout>
  );
}
