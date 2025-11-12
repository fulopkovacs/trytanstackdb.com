import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authed/logout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  useEffect(() => {
    authClient.signOut(
      {},
      {
        onSuccess: () => {
          navigate({ to: "/login" });
        },
      },
    );
  }, [navigate]);

  return <div>Logging you out...</div>;
}
