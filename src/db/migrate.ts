// import type { MigrationConfig } from "drizzle-orm/migrator";
import { DB, getDb } from ".";
import migrations from "./migrations.json";

// export async function migrate() {
//   // dialect and session will appear to not exist...but they do
//   console.log("Running migrations...");
//   await db.dialect.migrate(migrations, db.session, {
//     migrationsTable: "drizzle_migrations",
//   } satisfies Omit<MigrationConfig, "migrationsFolder">);
// }

async function ensureMigrationsTable(db: DB) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS drizzle_migrations (
      hash TEXT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function getMigratedHashes(db: DB): Promise<string[]> {
  const result = await db.execute(`
    SELECT hash FROM drizzle_migrations ORDER BY created_at ASC
  `);
  return result.rows.map((row) => row.hash as string);
}

async function recordMigration(hash: string, db: DB) {
  await db.execute(
    `
    INSERT INTO drizzle_migrations (hash, created_at)
    VALUES ('${hash}', NOW())
    ON CONFLICT DO NOTHING
  `,
  );
}

export async function migrate() {
  console.log("🚀 Starting pglite migration...");

  const { db } = await getDb();

  // Ensure migrations table exists
  await ensureMigrationsTable(db);

  // Get already executed migrations
  const executedHashes = await getMigratedHashes(db);

  // Filter and execute pending migrations
  const pendingMigrations = migrations.filter(
    (migration) => !executedHashes.includes(migration.hash),
  );

  if (pendingMigrations.length === 0) {
    console.log("✨ No pending migrations found.");
    return;
  }

  console.log(`📦 Found ${pendingMigrations.length} pending migrations`);

  // Execute migrations in sequence
  for (const migration of pendingMigrations) {
    console.log(`⚡ Executing migration: ${migration.hash}`);
    try {
      // Execute each SQL statement in sequence
      for (const sql of migration.sql) {
        await db.execute(sql);
      }

      // Record successful migration
      await recordMigration(migration.hash, db);
      console.log(`✅ Successfully completed migration: ${migration.hash}`);
    } catch (error) {
      console.error(`❌ Failed to execute migration ${migration.hash}:`, error);
      throw error;
    }
  }

  console.log("🎉 All migrations completed successfully");
}
