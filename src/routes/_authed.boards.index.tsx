import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/boards/")({
  loader: ({ context }) => {
    return {
      user: context.user,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();

  return (
    <div>
      Hello <span className="font-underline">{user.name}</span> on
      "/_authed/boards/"!
      <Outlet />
    </div>
  );
}
