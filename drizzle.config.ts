import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// import { env } from 'cloudflare:workers';

config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    // NOTE: we'll never use this
    url: "dev.db",
  },
});
