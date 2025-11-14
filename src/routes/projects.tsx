import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { requireTempId } from "@/server/middlewares/getTempDbIdFromRequest";

const mockUser = {
  id: "1",
  name: "John Doe",
};

const getTempDbId = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    return tempId;
  });

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
  beforeLoad: async () => {
    // TODO: get tempdb
    const tempDbId = await getTempDbId();

    return {
      user: mockUser,
      tempDbId,
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
