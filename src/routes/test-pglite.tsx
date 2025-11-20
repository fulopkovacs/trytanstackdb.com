import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { migrate } from "@/db/migrate";
import { seed } from "@/db/seed";
import { useSetupApiRoutes } from "@/hooks/useSetupApiRoutes";

const setupPglite = createIsomorphicFn().client(async () => {
  await migrate();
  await seed();
  // BUG: On Chrome, the user might reload the page to see the interface
  // it's because of pglite or something
});

export const Route = createFileRoute("/test-pglite")({
  component: RouteComponent,
  loader: async () => {
    await setupPglite();
  },
  ssr: false,
});

function RouteComponent() {
  useSetupApiRoutes();

  return (
    <div className="flex flex-col gap-4">
      <h1>testing pglite</h1>
      <Button
        onClick={() =>
          fetch("/hello").then(async (res) => {
            // fetch("/api/messages").then(async (res) => {
            const payload = await res.json();
            console.log(payload);
          })
        }
      >
        /hello
      </Button>
      <Button
        onClick={() =>
          fetch("/api/projects", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }).then(async (res) => {
            // fetch("/api/messages").then(async (res) => {
            // const payload = await res.text();
            const payload = await res.json();
            console.log(payload);
          })
        }
      >
        Get projects
      </Button>
      <Button
        onClick={() =>
          fetch("/api/projects", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: "lC1HsnuzWCMvfUiay8Y9N",
              name: `Project-${Date.now()}`,
            }),
          }).then(async (res) => {
            // fetch("/api/messages").then(async (res) => {
            // const payload = await res.text();
            const payload = await res.json();
            console.log({ payload });
          })
        }
      >
        Update project name
      </Button>
    </div>
  );
}
