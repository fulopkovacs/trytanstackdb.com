import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { migrate } from "@/db/migrate";
import { seed } from "@/db/seed";
import { useSetupApiRoutes } from "@/hooks/useSetupApiRoutes";

const setupPglite = createIsomorphicFn().client(async () => {
  await migrate();
  // try {
  // } catch (e) {
  //   console.error(e);
  // }
  // Check if seed has to be executed
  await seed();
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
    </div>
  );
}
