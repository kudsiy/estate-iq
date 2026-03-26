import { eq, and, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  passwordResetTokens,
  twoFactorSettings,
  emailVerifications,
  InsertPasswordResetToken,
  InsertTwoFactorSettings,
  InsertEmailVerification,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Password Reset Token Functions
export async function createPasswordResetToken(token: InsertPasswordResetToken): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(passwordResetTokens).values(token);
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function markPasswordResetTokenAsUsed(token: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.token, token));
}

export async function deleteExpiredPasswordResetTokens(): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .delete(passwordResetTokens)
    .where(lt(passwordResetTokens.expiresAt, new Date()));
}

// Two-Factor Authentication Functions
export async function create2FASetting(settings: InsertTwoFactorSettings): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(twoFactorSettings).values(settings);
}

export async function get2FASetting(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(twoFactorSettings)
    .where(eq(twoFactorSettings.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function enable2FA(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(twoFactorSettings)
    .set({ isEnabled: true, verifiedAt: new Date() })
    .where(eq(twoFactorSettings.userId, userId));
}

export async function disable2FA(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(twoFactorSettings)
    .set({ isEnabled: false })
    .where(eq(twoFactorSettings.userId, userId));
}

export async function update2FABackupCodes(userId: number, backupCodes: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(twoFactorSettings)
    .set({ backupCodes })
    .where(eq(twoFactorSettings.userId, userId));
}

// Email Verification Functions
export async function createEmailVerification(verification: InsertEmailVerification): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(emailVerifications).values(verification);
}

export async function getEmailVerification(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function markEmailAsVerified(token: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(emailVerifications)
    .set({ isVerified: true, verifiedAt: new Date() })
    .where(eq(emailVerifications.token, token));
}

export async function deleteExpiredEmailVerifications(): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .delete(emailVerifications)
    .where(lt(emailVerifications.expiresAt, new Date()));
}
