import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  // TODO: get it from the env vars
  // baseURL: "http://localhost:3000",
});
