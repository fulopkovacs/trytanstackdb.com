import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { userPreferencesCollection } from "@/collections/UserPreferences";
import { ApiRequestsPanel } from "@/components/ApiRequestsPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";
import { USER_PLACEHOLDER } from "@/USER_PLACEHOLDER_CONSTANT";

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
  const { data: userPreferences } = useLiveQuery((q) =>
    q
      .from({
        userPreferences: userPreferencesCollection,
      })
      .where(({ userPreferences }) =>
        eq(userPreferences.id, USER_PLACEHOLDER.id),
      )
      .findOne(),
  );

  return (
    <main className="flex flex-1 flex-col overflow-hidden max-h-screen h-screen">
      <Header />
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel
          defaultSize={userPreferences?.networkPanel === "open" ? 75 : 100}
          minSize={50}
        >
          <div className="h-full flex relative">
            <AppSidebar />
            <Outlet />
          </div>
        </ResizablePanel>
        {userPreferences?.networkPanel === "open" && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={25}
              minSize={15}
              maxSize={50}
              className="max-w-sm"
            >
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
      <MainLayout />
    </SidebarProvider>
  );
}
