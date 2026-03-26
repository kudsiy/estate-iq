import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userProfiles, activityLogs, InsertActivityLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, updates: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return undefined;
  }

  try {
    const updateSet: Record<string, unknown> = {};
    
    if (updates.name !== undefined) {
      updateSet.name = updates.name || null;
    }
    if (updates.email !== undefined) {
      updateSet.email = updates.email || null;
    }
    
    if (Object.keys(updateSet).length === 0) {
      return undefined;
    }

    const result = await db.update(users)
      .set(updateSet)
      .where(eq(users.id, userId));

    return result;
  } catch (error) {
    console.error("[Database] Failed to update user profile:", error);
    throw error;
  }
}

export async function logActivity(userId: number, action: string, description?: string, ipAddress?: string, userAgent?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log activity: database not available");
    return;
  }

  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      description: description || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  } catch (error) {
    console.error("[Database] Failed to log activity:", error);
  }
}

export async function getActivityLogs(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get activity logs: database not available");
    return [];
  }

  try {
    const logs = await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .limit(limit);
    
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("[Database] Failed to get activity logs:", error);
    return [];
  }
}

export async function updateUserProfilePicture(userId: number, pictureUrl: string, pictureKey: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update profile picture: database not available");
    return;
  }

  try {
    await db.insert(userProfiles).values({
      userId,
      profilePictureUrl: pictureUrl,
      profilePictureKey: pictureKey,
    }).onDuplicateKeyUpdate({
      set: {
        profilePictureUrl: pictureUrl,
        profilePictureKey: pictureKey,
      },
    });
  } catch (error) {
    console.error("[Database] Failed to update profile picture:", error);
    throw error;
  }
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user profile: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user profile:", error);
    return undefined;
  }
}

export async function changePassword(userId: number, newPasswordHash: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot change password: database not available");
    return false;
  }

  try {
    await db.update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));

    return true;
  } catch (error) {
    console.error("[Database] Failed to change password:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.
