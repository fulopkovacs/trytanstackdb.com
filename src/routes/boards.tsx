import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getBoardsQueryOptions } from "@/server/functions/getBoards";

const mockUser = {
  id: "1",
  name: "John Doe",
};

export const Route = createFileRoute("/boards")({
  component: RouteComponent,
  beforeLoad: async () => {
    return {
      user: mockUser,
    };
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getBoardsQueryOptions);

    return {
      user: context.user,
    };
  },
});

function RouteComponent() {
  const { user } = Route.useLoaderData();

  const {
    data: { boards },
  } = useSuspenseQuery(getBoardsQueryOptions);

  return (
    <SidebarProvider>
      <AppSidebar boards={boards} user={user} />
      <main className="flex flex-1 flex-col">
        <Header />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
