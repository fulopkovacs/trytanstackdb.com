import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import appCss from "../styles.css?url";
import "prismjs/themes/prism-tomorrow.css"; // or any other Prism theme
import { ScriptOnce } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function ServiceWorkerLoader() {
  const serviceWorkerScript = (() => {
    const registerServiceWorker = async () => {
      const serviceWorkerLoadedVarName = "__SERVICE_WORKER_LOADED__";
      // @ts-expect-error
      if (!window[serviceWorkerLoadedVarName]) {
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.register(
              "/sw.js",
              {
                scope: "/",
                type: "module",
              },
            );
            if (registration.installing) {
              console.log("Service worker installing");
            } else if (registration.waiting) {
              console.log("Service worker installed");
            } else if (registration.active) {
              console.log("Service worker active");
            }
          } catch (error) {
            console.error(`Registration failed with ${error}`);
          }
        }
        // @ts-expect-error
        window[serviceWorkerLoadedVarName] = true;
      }
    };

    registerServiceWorker();
    return `(${registerServiceWorker.toString()})();`;
  })();

  return <ScriptOnce children={serviceWorkerScript} />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ServiceWorkerLoader />
        <ThemeProvider>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
