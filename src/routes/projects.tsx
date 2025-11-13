import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getBoardsQueryOptions } from "@/server/functions/getBoards";
import { getProjectsQueryOptions } from "@/server/functions/getProjects";

const mockUser = {
  id: "1",
  name: "John Doe",
};

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
  beforeLoad: async () => {
    return {
      user: mockUser,
    };
  },
  loader: async ({ context }) => {
    // await context.queryClient.ensureQueryData(getProjectsQueryOptions);

    return {
      user: context.user,
    };
  },
  ssr: "data-only",
});

function RouteComponent() {
  const { user } = Route.useLoaderData();

  // const { data: projects } = useSuspenseQuery(getProjectsQueryOptions);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="flex flex-1 flex-col overflow-hidden max-h-screen h-screen">
        <Header />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
