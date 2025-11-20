import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { readMigrationFiles } from "drizzle-orm/migrator";

const migrations = readMigrationFiles({
  migrationsFolder: join(import.meta.dirname, "../../drizzle/migrations"),
  // migrationsFolder: "../../drizzle/migrations",
});

// Write the migrations to a JSON file
writeFileSync(
  join(import.meta.dirname, "./migrations.json"),
  JSON.stringify(migrations),
);

console.log("Migrations compiled!");
