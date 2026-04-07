/**
 * Auto-migration runner — uses raw mysql2 connection for DDL.
 */
import mysql from "mysql2/promise";
import { ENV } from "./env";

const MIGRATIONS: string[] = [
  "ALTER TABLE brandKits ADD COLUMN phoneNumber varchar(32) DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN whatsappNumber varchar(32) DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN facebookUrl varchar(500) DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN instagramHandle varchar(100) DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN tiktokHandle varchar(100) DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN telegramChannel varchar(100) DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN agentPortrait varchar(500) DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN tagline varchar(255) DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN targetAreas json DEFAULT NULL",
  "ALTER TABLE brandKits ADD COLUMN languagePreference ENUM('amharic','english','both') DEFAULT 'both'",
  "ALTER TABLE designs ADD COLUMN propertyId int DEFAULT NULL",
  "ALTER TABLE properties ADD COLUMN woreda varchar(100) DEFAULT NULL",
  "ALTER TABLE socialMediaPosts ADD COLUMN mediaUrl text DEFAULT NULL",
  "ALTER TABLE socialMediaPosts ADD COLUMN mediaType ENUM('image','video') DEFAULT NULL",
  "ALTER TABLE users ADD COLUMN passwordHash varchar(255) DEFAULT NULL",
];

export async function runDbMigrations() {
  console.log("[DB] Migration runner starting...");
  console.log("[DB] DATABASE_URL present:", !!ENV.databaseUrl);

  if (!ENV.databaseUrl) {
    console.warn("[DB] No DATABASE_URL — skipping migrations");
    return;
  }

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(ENV.databaseUrl);
    console.log("[DB] Connected to MySQL");

    for (const sql of MIGRATIONS) {
      try {
        await conn.execute(sql);
        console.log(`[DB] ✓ ${sql.slice(0, 70)}...`);
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (
          msg.includes("Duplicate column") ||
          msg.includes("ER_DUP_FIELDNAME")
        ) {
          console.log(`[DB] ⊘ Already exists: ${sql.slice(0, 50)}...`);
        } else {
          console.warn(`[DB] ⚠ ${msg}`);
        }
      }
    }

    console.log("[DB] Migrations complete");
  } catch (err: any) {
    console.error("[DB] Migration connection failed:", err?.message || err);
  } finally {
    if (conn) await conn.end();
  }
}
