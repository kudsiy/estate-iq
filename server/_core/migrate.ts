/**
 * Auto-migration runner — executes on server startup.
 * Ensures the database schema matches the Drizzle schema.
 */
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import * as schema from "../../drizzle/schema";
import { ENV } from "./env";

export async function runDbMigrations() {
  if (!ENV.databaseUrl) {
    console.warn("[DB] No DATABASE_URL — skipping migrations");
    return;
  }

  const db = drizzle(ENV.databaseUrl, { mode: "default", schema });

  console.log("[DB] Running migrations...");

  await migrate(db, {
    migrationsFolder: "drizzle/migrations",
    migrationsTable: "__drizzle_migrations",
  });

  console.log("[DB] Migrations complete");
}
