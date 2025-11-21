import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { DatabaseZap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { API, requestSchema } from "@/local-api";
import { createTempDbAndRedirectToIt } from "@/server/functions/createTempDbAndRedirectToIt";
import { getSubdomainAndApexFromHost } from "@/server/functions/getSubdomainAndApexFromHost";
import { getApexDomainRedirectHref } from "@/utils/server/getApexDomainRedirectHref";
import { useServiceWorkerHttpProxy } from "@/hooks/useServiceWorkerHttpProxy";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { subdomain, apex, protocol } = await getSubdomainAndApexFromHost();
    if (subdomain) {
      throw redirect({
        href: getApexDomainRedirectHref(apex, protocol),
      });
    }
  },
  component: App,
});

function App() {
  const redirectToNewDemoApp = useServerFn(createTempDbAndRedirectToIt);

  const [loading, setLoading] = useState(false);

  const redirectToNewDemoAppM = useMutation({
    mutationFn: redirectToNewDemoApp,
    onError: () => {
      // TODO: show error message on the UI
    },
  });

  useServiceWorkerHttpProxy();

  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-10">
      <div className="bg-linear-to-r bg-clip-text from-orange-500 to-orange-700 text-transparent flex flex-col items-center gap-2">
        <DatabaseZap className="text-orange-500 h-10 w-10" />
        <h1 className="text-2xl">TanStack DB</h1>
      </div>

      <div className="text-center text-foreground flex flex-col items-center gap-4 text-lg">
        <p>If this you when I say TanStack DB:</p>
        <img
          src="https://i.imgur.com/XvbOlwG.jpeg"
          alt="confused dog"
          className="h-40"
        />
        <p>...then you must try this interactive guide!</p>
      </div>

      <pre className="text-muted-foreground max-w-md whitespace-pre-wrap">
        {`The guide features:
  - a real app that uses Tanstack DB
  - backed by a CloudFlare D1 database
  - and an interactive tutorial (6-7 mins)

You'll have 30 minutes to play with this app (after that the db dies).`}
      </pre>

      <div className="flex gap-4">
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
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ projectId: "pr_1" }),
            }).then(async (res) => {
              // fetch("/api/messages").then(async (res) => {
              // const payload = await res.text();
              const payload = await res.json();
              console.log(payload);
            })
          }
        >
          Update projects
        </Button>
      </div>

      <Button
        onClick={() => {
          setLoading(true);
          redirectToNewDemoAppM.mutate({});
        }}
      >
        {loading ? "Creating your demo app..." : "Start demo app"}
      </Button>
      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">
          loading...
        </p>
      )}
      <div className="text-center text-foreground">
        <p>trytanstackdb.com</p>
        <p className="text-sm text-muted-foreground">
          The most unofficial quick guide
        </p>
      </div>
      <div className="flex items-center gap-2">
        by{" "}
        <a
          className="flex items-center gap-2"
          target="_blank"
          rel="noreferrer"
          href="https://fulop.dev"
        >
          <img
            alt="fuko"
            src="https://avatars.githubusercontent.com/u/43729152?s=96&v=4"
            className="inline h-10 w-10 rounded-full"
          />
          fuko
        </a>
      </div>
    </div>
  );
}
