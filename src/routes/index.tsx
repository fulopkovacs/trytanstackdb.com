import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { tempDbsTable } from "@/db/schema";
import { seed } from "@/db/seed";
import {
  getSubdomainSafeIds,
  getTempDbIdFromTheSubdomain,
} from "@/utils/server";
import { getHostFromRequest } from "@/utils/server/getHostFromRequest";
import { expiryTimestampMs } from "@/constants";

const isSubdomainFn = createServerFn().handler(() => {
  const request = getRequest();
  const host = getHostFromRequest(request);
  const subdomain = getTempDbIdFromTheSubdomain(host);
  return {
    isSubdomain: !!subdomain,
    apex: subdomain ? host?.replace(`${subdomain}.`, "") : host,
  };
});

const redirectToNewDemoAppFn = createServerFn().handler(async () => {
  const request = getRequest();
  const host = getHostFromRequest(request);
  const subdomain = getTempDbIdFromTheSubdomain(host);
  if (subdomain) {
    // TODO: redirect to the apex domain
    throw new Error(`Cannot create temp DB from a subdomain`);
  }
  const tempDbId = getSubdomainSafeIds();
  // TODO: change this later

  try {
    await db.insert(tempDbsTable).values({
      id: tempDbId,
      expiryTimestampMs,
    });
    // seed initial data for the new temp DB
    await seed(tempDbId);
  } catch (e) {
    console.error("Error creating temp DB:", e);
    // TODO: show error message on the client
    throw e;
  }

  throw redirect({
    href: `http://${tempDbId}.${host}/projects`,
  });
});

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { isSubdomain, apex } = await isSubdomainFn();
    if (isSubdomain) {
      throw redirect({
        href: `http://${apex}/`,
      });
    }
  },
  component: App,
});

function App() {
  const redirectToNewDemoApp = useServerFn(redirectToNewDemoAppFn);

  const redirectToNewDemoAppM = useMutation({
    mutationFn: redirectToNewDemoApp,
    onError: () => {
      // TODO: show error message on the UI
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button
        onClick={() => {
          redirectToNewDemoAppM.mutate({});
        }}
      >
        Start the demo app
      </Button>
    </div>
  );
}
