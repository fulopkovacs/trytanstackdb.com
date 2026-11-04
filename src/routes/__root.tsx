import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AppNotifications } from "../components/shell/app-notifications";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { themeInitScript } from "../lib/theme";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Try TanStack DB — an interactive guide" },
      {
        name: "description",
        content: "Learn TanStack DB by using a notes app next to the guide that explains it.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

/**
 * Shared by every page. Rollback toasts and guide progress live here, not in
 * the Notes app: a change can settle after the reader has moved on to a
 * deep dive, and they should still hear about it.
 */
function RootLayout() {
  return (
    <>
      <Outlet />
      <AppNotifications />
    </>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets the light/dark class before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{ position: "bottom-right", hideUntilHover: true }}
          plugins={[
            { name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
