import { env } from "cloudflare:workers";

/**
  Extracts the host from the incoming request.

  @note Vite hides the real `host` in development mode, but it's still
  visible in the `x-forwarded-host` header.
  */
export function getHostFromRequest(request: Request) {
  const host = request.headers.get(
    env.NODE_ENV === "development" ? "x-forwarded-host" : "host",
  );
  return host;
}
