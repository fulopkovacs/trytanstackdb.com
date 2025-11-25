/**
  NOTE: I don't know why, but without this file, the website I deploy on CF
  throws a client-side error complaining about missing info about a server
  function.
  */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getTutorialDataFromCookie } from "@/server/functions/getTutorialDataFromCookie";

const getServerTime = createServerFn().handler(() => ({
  serverTime: Date.now(),
}));

export const Route = createFileRoute("/_tutorial/_db/project-root")({
  beforeLoad: async () => {},
  component: RouteComponent,
});

function RouteComponent() {
  useEffect(() => {
    getServerTime().then(console.log);
    getTutorialDataFromCookie().then(console.log);
  });

  return <div>hi</div>;
}
