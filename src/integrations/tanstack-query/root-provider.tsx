import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Singleton queryClient to ensure the same instance is used everywhere
let queryClientSingleton: QueryClient | null = null;

export function getContext() {
  if (!queryClientSingleton) {
    queryClientSingleton = new QueryClient();
  }
  return {
    queryClient: queryClientSingleton,
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
