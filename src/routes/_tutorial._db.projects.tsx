import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ApiRequestsPanel } from "@/components/ApiRequestsPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_tutorial/_db/projects")({
  component: RouteComponent,
  ssr: false,
});

function MainLayout() {
  return (
    <main className="flex flex-1 flex-col overflow-hidden max-h-screen h-screen">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex h-full relative min-w-0">
          <AppSidebar />
          <Outlet />
        </div>
        <ApiRequestsPanel />
      </div>
    </main>
  );
}

function RouteComponent() {
  // const { data: projects } = useSuspenseQuery(getProjectsQueryOptions);

  return (
    <SidebarProvider className="w-auto overflow-hidden" defaultOpen>
      <MainLayout />
    </SidebarProvider>
  );
}
