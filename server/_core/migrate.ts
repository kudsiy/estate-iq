/**
 * Auto-migration runner — executes raw SQL on server startup.
 * No external migration files needed — all SQL is inline.
 */
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./env";

const MIGRATIONS: string[] = [
  `ALTER TABLE \`brandKits\` ADD COLUMN \`phoneNumber\` varchar(32)`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`whatsappNumber\` varchar(32)`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`facebookUrl\` varchar(500)`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`instagramHandle\` varchar(100)`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`tiktokHandle\` varchar(100)`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`telegramChannel\` varchar(100)`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`agentPortrait\` varchar(500)`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`tagline\` varchar(255)`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`targetAreas\` json`,
  `ALTER TABLE \`brandKits\` ADD COLUMN \`languagePreference\` ENUM('amharic','english','both') DEFAULT 'both'`,
  `ALTER TABLE \`designs\` ADD COLUMN \`propertyId\` int`,
  `ALTER TABLE \`properties\` ADD COLUMN \`woreda\` varchar(100)`,
  `ALTER TABLE \`socialMediaPosts\` ADD COLUMN \`mediaUrl\` text`,
  `ALTER TABLE \`socialMediaPosts\` ADD COLUMN \`mediaType\` ENUM('image','video')`,
  `ALTER TABLE \`users\` ADD COLUMN \`passwordHash\` varchar(255)`,
];

export async function runDbMigrations() {
  console.log("[DB] Migration runner starting...");
  console.log("[DB] DATABASE_URL present:", !!ENV.databaseUrl);

  if (!ENV.databaseUrl) {
    console.warn("[DB] No DATABASE_URL — skipping migrations");
    return;
  }

  const db = drizzle(ENV.databaseUrl, { mode: "default" });

  console.log("[DB] Running migrations...");

  for (const sql of MIGRATIONS) {
    try {
      await db.execute(sql);
      console.log(`[DB] ✓ ${sql.slice(0, 80)}...`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("Duplicate column")) {
        console.log(`[DB] ⊘ Already exists: ${sql.slice(0, 60)}...`);
      } else {
        console.warn(`[DB] ⚠ ${msg}`);
      }
    }
  }

  console.log("[DB] Migrations complete");
}
