import { createFileRoute } from "@tanstack/react-router";
import { getTempDbIdFromRequest } from "@/server/middlewares/getTempDbIdFromRequest";
import { json } from "@tanstack/react-start";

export const Route = createFileRoute("/api/get-temp-id")({
  server: {
    middleware: [getTempDbIdFromRequest],
    handlers: {
      GET: async ({ context: { tempId } }) => {
        return json({
          tempId,
        });
      },
    },
  },
});
