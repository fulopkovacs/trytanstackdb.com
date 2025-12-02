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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
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
        description: `An interactive guide for getting started with TanStack DB.`,
        image: `https://trytanstackdb.com/og-image.png`,
        keywords: "tanstack,tanstack db,reactjs,tutorial",
      }),
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: ErrorComponent,
});

function ErrorComponent({ error }: { error: unknown }) {
  const isServiceWorkerError =
    error instanceof Error &&
    error.message.includes("navigator.serviceWorker.addEventListener");

  return (
    <div className="flex justify-center items-center w-full h-full min-h-screen p-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-destructive-foreground text-center">
            An error occurred
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
          ) : null}
          <p className="font-bold">Error message:</p>
          <pre className="wrap-break-word whitespace-pre-wrap text max-h-40 text-muted-foreground">
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
        <script
          defer
          src="https://assets.onedollarstats.com/stonks.js"
        ></script>
        <Scripts />
      </body>
    </html>
  );
}
