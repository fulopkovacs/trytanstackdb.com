// routes/hello.ts

import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/api/create-test-user")({
  server: {
    handlers: {
      POST: async () => {
        if (env.NODE_ENV !== "development") {
          return new Response("Forbidden", { status: 401 });
        }

        try {
          await authClient.signUp.email({
            name: "Test User",
            email: "test@test.com",
            password: "test-test-test",
          });
        } catch (error) {
          return new Response(`Error creating test user: ${error}`, {
            status: 500,
          });
        }

        return new Response("Test user created", { status: 201 });
      },
    },
  },
});
