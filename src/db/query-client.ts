import { QueryClient } from "@tanstack/react-query";

/**
 * One QueryClient for the app. The query collections fetch through it, and
 * the router gets it as context. TanStack DB only runs in the browser (the
 * app's routes are `ssr: false`), so a module-level client is fine.
 */
export const queryClient = new QueryClient();
