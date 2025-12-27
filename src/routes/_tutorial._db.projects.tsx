import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { ApiRequestsPanel } from "@/components/ApiRequestsPanel";
import {
  ApiRequestsProvider,
  useApiPanel,
} from "@/components/ApiRequestsProvider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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

function MainLayout() {
  const { isOpen } = useApiPanel();

  return (
    <main className="flex flex-1 flex-col overflow-hidden max-h-screen h-screen">
      <Header />
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={isOpen ? 75 : 100} minSize={50}>
          <div className="h-full flex relative">
            <AppSidebar />
            <Outlet />
          </div>
        </ResizablePanel>
        {isOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
              <ApiRequestsPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </main>
  );
}

function RouteComponent() {
  // const { data: projects } = useSuspenseQuery(getProjectsQueryOptions);

  return (
    <SidebarProvider className="w-auto" defaultOpen>
      <ApiRequestsProvider>
        <MainLayout />
      </ApiRequestsProvider>
    </SidebarProvider>
  );
}
