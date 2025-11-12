import { env } from "cloudflare:workers";
// import { config } from "dotenv";
import { drizzle } from "drizzle-orm/d1";

// config();

export const db = drizzle(env.D1_DB);
