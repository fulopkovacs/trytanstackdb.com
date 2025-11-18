/**
  NOTE: I don't know why, but without this file, the website I deploy on CF
  throws a client-side error complaining about missing info about a server
  function.
  */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getTempDbIdOnServer } from "@/server/functions/getTempDbIdOnServer";
import { getTutorialDataFromCookie } from "@/server/functions/getTutorialDataFromCookie";
import { requireTempId } from "@/server/middlewares/getTempDbIdFromRequest";

const getServerTime = createServerFn()
  .middleware([requireTempId])
  .handler(({ context: { tempId } }) => ({
    serverTime: Date.now(),
    tempId,
  }));

export const Route = createFileRoute("/_tempDbRequired/project-root")({
  beforeLoad: async () => {},
  component: RouteComponent,
});

function RouteComponent() {
  useEffect(() => {
    getTempDbIdOnServer().then(console.log);
    getServerTime().then(console.log);
    getTutorialDataFromCookie().then(console.log);
  });

  return <div>hi</div>;
}
