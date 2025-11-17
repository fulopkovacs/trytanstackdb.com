import { createServerFn } from "@tanstack/react-start";
import { requireTempId } from "@/server/middlewares/getTempDbIdFromRequest";

export const getTempDbIdOnServer = createServerFn()
  .middleware([requireTempId])
  .handler(async ({ context: { tempId } }) => {
    return tempId;
  });
