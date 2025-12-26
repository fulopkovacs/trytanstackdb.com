import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { NetworkRequestsPanel } from "@/components/NetworkRequestsPanel";
import {
  NetworkRequestsProvider,
  useNetworkPanel,
} from "@/components/NetworkRequestsProvider";
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
  const { isOpen } = useNetworkPanel();

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={isOpen ? 75 : 100} minSize={50}>
        <main className="flex flex-1 flex-col overflow-hidden max-h-screen h-screen">
          <Header />
          <Outlet />
        </main>
      </ResizablePanel>
      {isOpen && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
            <NetworkRequestsPanel />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}

function RouteComponent() {
  // const { data: projects } = useSuspenseQuery(getProjectsQueryOptions);

  return (
    <SidebarProvider className="w-auto" defaultOpen>
      <AppSidebar />
      <NetworkRequestsProvider>
        <MainLayout />
      </NetworkRequestsProvider>
    </SidebarProvider>
  );
}
