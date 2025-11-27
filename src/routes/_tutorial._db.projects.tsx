import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_tutorial/_db/projects")({
  component: RouteComponent,
  loader: async ({ context }) => {
    // await context.queryClient.ensureQueryData(getProjectsQueryOptions);

    return {
      user: context.user,
    };
  },
  ssr: false,
});

function RouteComponent() {
  // const { data: projects } = useSuspenseQuery(getProjectsQueryOptions);

  return (
    <SidebarProvider className="w-auto" defaultOpen>
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-hidden max-h-screen h-screen">
        <Header />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
