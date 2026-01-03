import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Client-side singleton to ensure the same instance is used across the app
let clientQueryClient: QueryClient | null = null;

function makeQueryClient() {
  return new QueryClient();
}

export function getContext() {
  // Server: always create a new QueryClient per request to avoid data leaks
  if (typeof window === "undefined") {
    return {
      queryClient: makeQueryClient(),
    };
  }

  // Client: use singleton to preserve cache across navigations
  if (!clientQueryClient) {
    clientQueryClient = makeQueryClient();
  }
  return {
    queryClient: clientQueryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
