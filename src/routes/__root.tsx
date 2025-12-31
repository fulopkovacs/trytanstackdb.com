import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  ClientOnly,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import appCss from "../styles.css?url";
import "prismjs/themes/prism-tomorrow.css"; // or any other Prism theme
import { ScriptOnce } from "@tanstack/react-router";
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { client, idbName } from "@/db";
import { seo } from "@/utils/seo";

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
      ...seo({
        title: "trytanstackdb | The interactive guide",
        description: `Learn how to build ⚡BLAZING FAST⚡ front-ends with TanStack DB in 6-7 minutes`,
        image: `https://trytanstackdb.com/og-image.png`,
        keywords: "tanstack,tanstack db,reactjs,tutorial",
      }),
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: ErrorComponent,
});

function RemoveDB() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const removeDB = useCallback(async () => {
    if (typeof window !== "undefined" && "indexedDB" in window) {
      try {
        console.log({ idbName });
        await client.close();
        const request = window.indexedDB.deleteDatabase(idbName);
        request.onsuccess = () => {
          window.location.reload();
        };
        request.onerror = () => {
          const errorMessage = "Failed to delete database";
          console.error(errorMessage);
          setErrorMessage(errorMessage);
        };
        request.onblocked = () => {
          const errorMessage =
            "Database deletion blocked - close other tabs using this site";
          setErrorMessage(errorMessage);
          console.warn(errorMessage);
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error deleting database:", errorMessage);
        setErrorMessage(errorMessage);
      }
    }
  }, []);

  return (
    <ClientOnly>
      <Button
        className="w-fit mx-auto"
        variant="destructive"
        onClick={removeDB}
      >
        <RotateCwIcon /> Reset the db
      </Button>
      <p className="text-destructive font-bold text-center">{errorMessage}</p>
    </ClientOnly>
  );
}

function ErrorComponent({ error }: { error: unknown }) {
  const isServiceWorkerError =
    error instanceof Error &&
    error.message.includes("navigator.serviceWorker.addEventListener");

  const isDbQueryError =
    error instanceof Error && error.message.startsWith("Failed query: ");

  return (
    <div className="fixed inset-0 w-screen h-screen flex justify-center items-center p-6 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <h2 className="text-2xl font-bold text-destructive text-center justify-center flex items-center gap-2">
            <TriangleAlertIcon /> An error occurred
          </h2>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {isServiceWorkerError ? (
            <>
              <p className="block sm:hidden">
                Embedded browsers (like those in some social media apps) might
                not support Service Workers properly.
              </p>
              <p className="hidden sm:block">
                It seems like your browser is having issues with Service
                Workers. Please try using a different browser or updating your
                current one.
              </p>
            </>
          ) : isDbQueryError ? (
            <>
              <p>
                There was an issue executing a database query. Please ensure
                that the backend server is running and accessible.
              </p>
              <RemoveDB />
            </>
          ) : null}
          <p className="font-bold">Error message:</p>
          <pre className="wrap-break-word whitespace-pre-wrap text max-h-40 text-muted-foreground overflow-y-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

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
    <html lang="en" suppressHydrationWarning className="overflow-hidden!">
      <head>
        <HeadContent />
      </head>
      <body>
        <ServiceWorkerLoader />
        <ThemeProvider>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
              defaultOpen: true,
            },
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
              defaultOpen: false,
            },
          ]}
        />
        <script
          defer
          src="https://assets.onedollarstats.com/stonks.js"
        ></script>
        <Scripts />
      </body>
    </html>
  );
}
