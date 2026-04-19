import { and, eq, inArray, sql, gte, lte, ne, desc, count, avg } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertBuyerProfile,
  InsertBrandKit,
  InsertContact,
  InsertContactEvent,
  InsertDeal,
  InsertDesign,
  InsertFeatureFlag,
  InsertLead,
  InsertNotification,
  InsertProperty,
  InsertSocialMediaPost,
  InsertSupplierListing,
  InsertUser,
  InsertWorkspace,
  buyerProfiles,
  brandKits,
  contacts,
  contactEvents,
  deals,
  designs,
  engagementMetrics,
  featureFlags,
  leads,
  notifications,
  properties,
  socialMediaPosts,
  supplierListings,
  users,
  workspaces,
  type User,
  type Workspace,
  type ContactEvent,
} from "../drizzle/schema";
import { ENV } from "./_core/env";


let _db: ReturnType<typeof drizzle> | null = null;

type Scope = {
  userId: number;
  workspaceId: number;
};

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

async function insertAndGetId<T extends { id: number }>(
  operation: Promise<T[] | { insertId?: number }>
): Promise<number> {
  const result = await operation;
  if (Array.isArray(result)) {
    const inserted = result[0];
    if (inserted?.id) return Number(inserted.id);
  }

  const insertId = (result as { insertId?: number }).insertId;
  if (typeof insertId === "number" && insertId > 0) return insertId;

  throw new Error("Failed to determine inserted id");
}

function createDefaultWorkspaceName(user: Pick<User, "name" | "companyName">) {
  const companyName = user.companyName?.trim();
  if (companyName) return companyName;
  const name = user.name?.trim();
  if (name) return `${name}'s Workspace`;
  return "My Workspace";
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

    const directFields = [
      "name",
      "email",
      "phone",
      "loginMethod",
      "companyName",
      "workspaceId",
      "targetMarket",
      "selectedPlatforms",
      "notificationPreferences",
      "onboardingCompleted",
    ] as const;

    for (const field of directFields) {
      const value = user[field];
      if (value === undefined) continue;
      const normalized = value ?? null;
      values[field] = normalized as never;
      updateSet[field] = normalized;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0];
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  return result[0] ?? null;
}

export async function setUserPasswordHash(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash } as any).where(eq(users.id, userId));
}

export async function getWorkspaceByOwnerUserId(ownerUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, ownerUserId))
    .limit(1);
  return result[0];
}

export async function getWorkspaceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return result[0];
}

export async function getWorkspaceByApiKey(apiKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workspaces).where(eq(workspaces.apiKey, apiKey)).limit(1);
  return result[0];
}

export async function getWorkspaceByTrackingToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workspaces).where(eq(workspaces.trackingToken, token)).limit(1);
  return result[0];
}

export async function getLeadByFingerprintId(workspaceId: number, fingerprintId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(leads)
    .where(and(eq(leads.workspaceId, workspaceId), eq(leads.fingerprintId, fingerprintId)))
    .limit(1);
  return result[0];
}

export async function getLeadsByWorkspaceId(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.workspaceId, workspaceId));
}

export async function createWorkspace(workspace: InsertWorkspace) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(workspaces).values(workspace).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateWorkspace(id: number, updates: Partial<InsertWorkspace>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workspaces).set(updates).where(eq(workspaces.id, id));
}

export async function incrementWorkspaceAiCaptionsCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(workspaces)
    .set({
      aiCaptionsCount: sql`${workspaces.aiCaptionsCount} + 1`,
    })
    .where(eq(workspaces.id, id));
}

export async function incrementWorkspaceAiImagesCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(workspaces)
    .set({
      aiImagesCount: sql`${workspaces.aiImagesCount} + 1`,
    })
    .where(eq(workspaces.id, id));
}


export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function getAllWorkspaces() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workspaces);
}

export async function getFeatureFlags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featureFlags);
}

export async function upsertFeatureFlag(flag: InsertFeatureFlag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(featureFlags).values(flag).onDuplicateKeyUpdate({
    set: {
      description: flag.description ?? null,
      enabled: flag.enabled ?? false,
    },
  });
}

export async function ensureWorkspaceForUser(user: User): Promise<Workspace | null> {
  const db = await getDb();
  if (!db) return null;

  if (user.workspaceId) {
    const existingById = await getWorkspaceById(user.workspaceId);
    if (existingById) return existingById;
  }

  const existing = await getWorkspaceByOwnerUserId(user.id);
  if (existing) {
    if (user.workspaceId !== existing.id) {
      await upsertUser({ openId: user.openId, workspaceId: existing.id });
    }
    return existing;
  }

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const workspaceId = await createWorkspace({
    ownerUserId: user.id,
    name: createDefaultWorkspaceName(user),
    trialEndsAt,
    usageCyclePeriodStart: now,
  });

  await upsertUser({
    openId: user.openId,
    workspaceId,
    companyName: user.companyName ?? createDefaultWorkspaceName(user),
  });

  return (await getWorkspaceById(workspaceId)) ?? null;
}

export async function updateUserProfile(
  openId: string,
  updates: Partial<Pick<InsertUser, "name" | "email" | "phone" | "companyName" | "role" | "targetMarket" | "selectedPlatforms" | "notificationPreferences" | "onboardingCompleted">>
) {
  await upsertUser({
    openId,
    ...updates,
  });
}

export async function getScopedUser(openId: string) {
  const user = await getUserByOpenId(openId);
  if (!user) return undefined;
  const workspace = await ensureWorkspaceForUser(user);
  if (!workspace) return user;
  return {
    ...(await getUserByOpenId(openId)),
    workspace,
  };
}

// Contact queries
export async function getContactsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contacts)
    .where(and(eq(contacts.userId, scope.userId), eq(contacts.workspaceId, scope.workspaceId)));
}

export async function getContactById(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.workspaceId, scope.workspaceId)))
    .limit(1);
  return result[0];
}

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(contacts).values(contact).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateContact(scope: Scope, id: number, updates: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getContactById(scope, id);
  if (!existing) return false;
  await db
    .update(contacts)
    .set(updates)
    .where(and(eq(contacts.id, id), eq(contacts.workspaceId, scope.workspaceId)));
  return true;
}

export async function deleteContact(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getContactById(scope, id);
  if (!existing) return false;
  await db
    .delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.workspaceId, scope.workspaceId)));
  return true;
}

// Contact Event queries
export async function getContactEventsByScope(scope: Scope, contactId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contactEvents)
    .where(
      and(
        eq(contactEvents.workspaceId, scope.workspaceId),
        eq(contactEvents.contactId, contactId)
      )
    )
    .orderBy(sql`${contactEvents.createdAt} DESC`);
}

export async function getDealEventsByScope(scope: Scope, dealId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contactEvents)
    .where(
      and(
        eq(contactEvents.workspaceId, scope.workspaceId),
        eq(contactEvents.dealId, dealId)
      )
    )
    .orderBy(sql`${contactEvents.createdAt} DESC`);
}

export async function createContactEvent(event: InsertContactEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(contactEvents).values(event).$returningId() as Promise<{ id: number }[]>
  );
}

// Deal queries
export async function getDealsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(deals)
    .where(and(eq(deals.userId, scope.userId), eq(deals.workspaceId, scope.workspaceId)));
}

export async function getDealById(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(deals)
    .where(and(eq(deals.id, id), eq(deals.workspaceId, scope.workspaceId)))
    .limit(1);
  return result[0];
}

export async function createDeal(deal: InsertDeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(deals).values(deal).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateDeal(scope: Scope, id: number, updates: Partial<InsertDeal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getDealById(scope, id);
  if (!existing) return false;
  await db
    .update(deals)
    .set(updates)
    .where(and(eq(deals.id, id), eq(deals.workspaceId, scope.workspaceId)));
  return true;
}

export async function deleteDeal(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getDealById(scope, id);
  if (!existing) return false;
  await db
    .delete(deals)
    .where(and(eq(deals.id, id), eq(deals.workspaceId, scope.workspaceId)));
  return true;
}

// Property queries
export async function getPropertiesByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(properties)
    .where(and(eq(properties.userId, scope.userId), eq(properties.workspaceId, scope.workspaceId)));
}

export async function getPropertyById(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.workspaceId, scope.workspaceId)))
    .limit(1);
  return result[0];
}

export async function createProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(properties).values(property).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateProperty(scope: Scope, id: number, updates: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getPropertyById(scope, id);
  if (!existing) return false;
  await db
    .update(properties)
    .set(updates)
    .where(and(eq(properties.id, id), eq(properties.workspaceId, scope.workspaceId)));
  return true;
}

export async function deleteProperty(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getPropertyById(scope, id);
  if (!existing) return false;
  await db
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.workspaceId, scope.workspaceId)));
  return true;
}

export async function getPropertyByUniqueId(uniqueId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(properties)
    .where(eq(properties.uniqueListingId, uniqueId))
    .limit(1);
  return result[0];
}

// Lead queries
export async function getLeadsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(leads)
    .where(and(eq(leads.userId, scope.userId), eq(leads.workspaceId, scope.workspaceId)));
}

export async function getLeadById(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.workspaceId, scope.workspaceId)))
    .limit(1);
  return result[0];
}

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(leads).values(lead).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateLead(scope: Scope, id: number, updates: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getLeadById(scope, id);
  if (!existing) return false;
  await db
    .update(leads)
    .set(updates)
    .where(and(eq(leads.id, id), eq(leads.workspaceId, scope.workspaceId)));
  return true;
}

export async function deleteLead(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getLeadById(scope, id);
  if (!existing) return false;
  await db
    .delete(leads)
    .where(and(eq(leads.id, id), eq(leads.workspaceId, scope.workspaceId)));
  return true;
}

// Brand Kit queries
export async function getBrandKitsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(brandKits)
    .where(and(eq(brandKits.userId, scope.userId), eq(brandKits.workspaceId, scope.workspaceId)));
}

export async function getBrandKitById(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(brandKits)
    .where(and(eq(brandKits.id, id), eq(brandKits.workspaceId, scope.workspaceId)))
    .limit(1);
  return result[0];
}

export async function createBrandKit(brandKit: InsertBrandKit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(brandKits).values(brandKit).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateBrandKit(scope: Scope, id: number, updates: Partial<InsertBrandKit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getBrandKitById(scope, id);
  if (!existing) return false;
  await db
    .update(brandKits)
    .set(updates)
    .where(and(eq(brandKits.id, id), eq(brandKits.workspaceId, scope.workspaceId)));
  return true;
}

export async function deleteBrandKit(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getBrandKitById(scope, id);
  if (!existing) return false;
  await db
    .delete(brandKits)
    .where(and(eq(brandKits.id, id), eq(brandKits.workspaceId, scope.workspaceId)));
  return true;
}

// Design queries
export async function getDesignsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(designs)
    .where(and(eq(designs.userId, scope.userId), eq(designs.workspaceId, scope.workspaceId)));
}

export async function getDesignById(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(designs)
    .where(and(eq(designs.id, id), eq(designs.workspaceId, scope.workspaceId)))
    .limit(1);
  return result[0];
}

export async function createDesign(design: InsertDesign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(designs).values(design).$returningId() as Promise<{ id: number }[]>
  );
}

// Social Media Post queries
export async function getSocialMediaPostsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(socialMediaPosts)
    .where(and(eq(socialMediaPosts.userId, scope.userId), eq(socialMediaPosts.workspaceId, scope.workspaceId)));
}

export async function getSocialMediaPostById(id: number, scope?: Scope) {
  const db = await getDb();
  if (!db) return undefined;
  
  const query = db.select().from(socialMediaPosts);
  const conditions = [eq(socialMediaPosts.id, id)];
  
  if (scope) {
    conditions.push(eq(socialMediaPosts.workspaceId, scope.workspaceId));
  }

  const result = await query.where(and(...conditions)).limit(1);
  return result[0];
}

export async function claimNextQueuedPost() {
  const db = await getDb();
  if (!db) return undefined;
  
  // 1. Find the first queued post
  const firstQueued = await db
    .select()
    .from(socialMediaPosts)
    .where(eq(socialMediaPosts.status, "queued"))
    .limit(1);
    
  if (firstQueued.length === 0) return undefined;
  
  const post = firstQueued[0];
  
  // 2. Atomically attempt to claim it
  const result = await db
    .update(socialMediaPosts)
    .set({ status: "publishing" })
    .where(and(eq(socialMediaPosts.id, post.id), eq(socialMediaPosts.status, "queued")));
    
  // If no rows were affected, someone else claimed it first
  // @ts-ignore - drizzle-orm's result type can be complex depending on driver
  if (result.rowsAffected === 0 && result[0]?.affectedRows === 0) {
    return claimNextQueuedPost(); // Recursive retry
  }
  
  return post;
}

export async function updateSocialMediaPostStatus(
  id: number, 
  status: any, 
  publishedAt: Date | null = null,
  platformStatuses: any = null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status, publishedAt };
  if (platformStatuses) {
    updates.platformStatuses = platformStatuses;
  }

  await db
    .update(socialMediaPosts)
    .set(updates)
    .where(eq(socialMediaPosts.id, id));
}

export async function createSocialMediaPost(post: InsertSocialMediaPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(socialMediaPosts).values(post).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateSocialMediaPost(scope: Scope, id: number, updates: Partial<InsertSocialMediaPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSocialMediaPostById(id, scope);
  if (!existing) return false;
  await db
    .update(socialMediaPosts)
    .set(updates)
    .where(and(eq(socialMediaPosts.id, id), eq(socialMediaPosts.workspaceId, scope.workspaceId)));
  return true;
}

export async function deleteSocialMediaPost(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSocialMediaPostById(id, scope);
  if (!existing) return false;
  await db
    .delete(socialMediaPosts)
    .where(and(eq(socialMediaPosts.id, id), eq(socialMediaPosts.workspaceId, scope.workspaceId)));
  return true;
}

export async function getEngagementMetricsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  const posts = await db
    .select()
    .from(socialMediaPosts)
    .where(and(eq(socialMediaPosts.userId, scope.userId), eq(socialMediaPosts.workspaceId, scope.workspaceId)));
  const postIds = posts.map((p) => p.id);
  if (postIds.length === 0) return [];
  return db.select().from(engagementMetrics).where(inArray(engagementMetrics.postId, postIds));
}

// Notification queries
export async function getNotificationsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, scope.userId), eq(notifications.workspaceId, scope.workspaceId)));
}

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(notifications).values(notification).$returningId() as Promise<{ id: number }[]>
  );
}

export async function markNotificationRead(scope: Scope, id: number, isRead: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.workspaceId, scope.workspaceId)))
    .limit(1);
  if (!existing[0]) return false;
  await db
    .update(notifications)
    .set({ isRead })
    .where(and(eq(notifications.id, id), eq(notifications.workspaceId, scope.workspaceId)));
  return true;
}

// Supplier listing queries
export async function getSupplierListingsByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(supplierListings)
    .where(and(eq(supplierListings.userId, scope.userId), eq(supplierListings.workspaceId, scope.workspaceId)));
}

export async function getSupplierListingById(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(supplierListings)
    .where(and(eq(supplierListings.id, id), eq(supplierListings.workspaceId, scope.workspaceId)))
    .limit(1);
  return result[0];
}

export async function createSupplierListing(listing: InsertSupplierListing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(supplierListings).values(listing).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateSupplierListing(scope: Scope, id: number, updates: Partial<InsertSupplierListing>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSupplierListingById(scope, id);
  if (!existing) return false;
  await db
    .update(supplierListings)
    .set(updates)
    .where(and(eq(supplierListings.id, id), eq(supplierListings.workspaceId, scope.workspaceId)));
  return true;
}

export async function incrementEngagementMetric(postId: number, platform: string, field: "likes" | "comments" | "shares" | "impressions" | "clicks" | "leads") {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(engagementMetrics)
    .where(and(eq(engagementMetrics.postId, postId), eq(engagementMetrics.platform, platform)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(engagementMetrics)
      .set({ [field]: (existing[0] as any)[field] + 1 })
      .where(eq(engagementMetrics.id, existing[0].id));
  } else {
    await db
      .insert(engagementMetrics)
      .values({ postId, platform, [field]: 1 });
  }
}

// Buyer profile queries
export async function getBuyerProfilesByScope(scope: Scope) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(buyerProfiles)
    .where(and(eq(buyerProfiles.userId, scope.userId), eq(buyerProfiles.workspaceId, scope.workspaceId)));
}

export async function getBuyerProfileById(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(buyerProfiles)
    .where(and(eq(buyerProfiles.id, id), eq(buyerProfiles.workspaceId, scope.workspaceId)))
    .limit(1);
  return result[0];
}

export async function createBuyerProfile(profile: InsertBuyerProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(
    db.insert(buyerProfiles).values(profile).$returningId() as Promise<{ id: number }[]>
  );
}

export async function updateBuyerProfile(scope: Scope, id: number, updates: Partial<InsertBuyerProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getBuyerProfileById(scope, id);
  if (!existing) return false;
  await db
    .update(buyerProfiles)
    .set(updates)
    .where(and(eq(buyerProfiles.id, id), eq(buyerProfiles.workspaceId, scope.workspaceId)));
  return true;
}

export async function deleteBuyerProfile(scope: Scope, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getBuyerProfileById(scope, id);
  if (!existing) return false;
  await db
    .delete(buyerProfiles)
    .where(and(eq(buyerProfiles.id, id), eq(buyerProfiles.workspaceId, scope.workspaceId)));
  return true;
}

export async function getBehavioralStats(scope: Scope) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const riskThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Rolling 7-day totals
  const totalLeads7d = await db
    .select({ count: count() })
    .from(leads)
    .where(and(
      eq(leads.workspaceId, scope.workspaceId),
      gte(leads.createdAt, last7Days)
    ));

  const handledLeads7d = await db
    .select({ count: count() })
    .from(leads)
    .where(and(
      eq(leads.workspaceId, scope.workspaceId),
      gte(leads.createdAt, last7Days),
      inArray(leads.status, ["contacted", "qualified", "converted"])
    ));

  const ignoredLeads7d = await db
    .select({ count: count() })
    .from(leads)
    .where(and(
      eq(leads.workspaceId, scope.workspaceId),
      gte(leads.createdAt, last7Days),
      eq(leads.status, "ignored")
    ));

  // 2. Late Responses (Contacted > 24h OR still New > 24h)
  // This is a bit complex with current schema as we don't store firstContactedAt easily.
  // We'll approximate: still 'new' > 24h is definitely late.
  const missedLeads = await db
    .select({ count: count() })
    .from(leads)
    .where(and(
      eq(leads.workspaceId, scope.workspaceId),
      eq(leads.status, "new"),
      lte(leads.createdAt, riskThreshold)
    ));

  // For historically late, we'd need event tracking. 
  // We'll count current "missed" as late for now + any marked contacted > 24h in events
  const lateEvents = await db
    .select({ count: count() })
    .from(contactEvents)
    .where(and(
      eq(contactEvents.workspaceId, scope.workspaceId),
      eq(contactEvents.type, "status_change"),
      gte(contactEvents.createdAt, last7Days)
      // Comparison with lead.createdAt would happen in a join if we had leadId in events
    ));

  // 3. At Risk by Property
  const atRiskByProperty = await db
    .select({
      propertyId: leads.propertyId,
      propertyName: properties.title,
      count: count()
    })
    .from(leads)
    .innerJoin(properties, eq(leads.propertyId, properties.id))
    .where(and(
      eq(leads.workspaceId, scope.workspaceId),
      eq(leads.status, "new"),
      lte(leads.createdAt, riskThreshold)
    ))
    .groupBy(leads.propertyId, properties.title);

  return {
    totalLeads7d: totalLeads7d[0].count,
    handledLeads7d: handledLeads7d[0].count,
    ignoredLeads7d: ignoredLeads7d[0].count,
    missedLeads: missedLeads[0].count,
    atRiskByProperty,
    contactRate: totalLeads7d[0].count > 0 ? (handledLeads7d[0].count / totalLeads7d[0].count) : 0,
  };
}

export async function getPropertyInsights(scope: Scope) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

  // 1. Get interactions in last hour per property
  const interactionDensity = await db
    .select({
      propertyId: leads.propertyId,
      count: count()
    })
    .from(leads)
    .where(and(
      eq(leads.workspaceId, scope.workspaceId),
      gte(leads.createdAt, lastHour)
    ))
    .groupBy(leads.propertyId);

  // 2. Get total handles and conversions per property (all time/rolling)
  const stats = await db
    .select({
      propertyId: properties.id,
      title: properties.title,
      totalLeads: count(leads.id),
      contactedCount: sql<number>`count(case when ${leads.status} in ('contacted', 'qualified', 'converted') then 1 end)`,
      dealsCount: sql<number>`count(case when ${leads.status} = 'converted' then 1 end)`,
    })
    .from(properties)
    .leftJoin(leads, eq(properties.id, leads.propertyId))
    .where(eq(properties.workspaceId, scope.workspaceId))
    .groupBy(properties.id, properties.title);

  // Calculate averages for HOT logic
  const validInteractions = interactionDensity.filter(i => i.propertyId !== null);
  const totalInteractionsLastHour = validInteractions.reduce((sum, i) => sum + i.count, 0);
  const activePropertyCount = stats.length || 1;
  const avgInteractions = totalInteractionsLastHour / activePropertyCount;

  return stats.map(s => {
    const density = interactionDensity.find(i => i.propertyId === s.propertyId)?.count || 0;
    const isHot = density >= 2 && density >= 2 * avgInteractions;
    
    // Determine behavioral messages
    let insight = "This property is performing normally.";
    const contactRate = s.totalLeads > 0 ? (s.contactedCount / s.totalLeads) : 0;
    const dealRate = s.totalLeads > 0 ? (s.dealsCount / s.totalLeads) : 0;

    if (s.dealsCount > 5 || (s.totalLeads > 10 && dealRate > 0.2)) {
      insight = "This property is converting well — focus here";
    } else if (s.totalLeads > 5 && contactRate < 0.4) {
      insight = "You are getting interest but not responding fast enough";
    } else if (s.contactedCount > 5 && dealRate < 0.05) {
      insight = "People are asking but not converting — price or quality may be off";
    }

    return {
      ...s,
      isHot,
      insight,
      interactionDensity: density
    };
  });
}

/**
 * Hardened Lead Tracking (Patches 1, 9, 15, 21, FIX 1)
 * Implements: 
 * - DB Transactions with Row Locking (.forUpdate())
 * - Dual-Identity Upsert (Strict + 2-min Fallback)
 * - Atomic Shield (ON DUPLICATE KEY UPDATE)
 * - Score Inflation Control (Cap at 50)
 * - Timeline Preservation (Min createdAt, Max lastInteractionAt)
 */
export async function trackLeadInteraction(params: {
  workspaceId: number;
  propertyId: number;
  fingerprintId: string;
  userAgent: string;
  source: string;
  scoreIncrement: number;
  leadData: any;
  ownerUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.transaction(async (tx) => {
    // Step A: Strict match (Fingerprint + Property) — keeps row lock
    let existing = await tx
      .select()
      .from(leads)
      .where(and(
        eq(leads.workspaceId, params.workspaceId),
        eq(leads.fingerprintId, params.fingerprintId),
        eq(leads.propertyId, params.propertyId)
      ))
      .limit(1)
      .for("update");

    // Step B: Fallback match — NO row lock (PATCH 1)
    // Adds source match to prevent shared-WiFi collisions (PATCH 3)
    if (existing.length === 0) {
      const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
      existing = await tx
        .select()
        .from(leads)
        .where(and(
          eq(leads.workspaceId, params.workspaceId),
          eq(leads.propertyId, params.propertyId),
          eq(leads.source, params.source as any),
          sql`${leads.leadData}->>'$.ua' = ${params.userAgent}`,
          gte(leads.createdAt, twoMinsAgo)
        ))
        .orderBy(desc(leads.createdAt))
        .limit(1);
    }

    const now = new Date();

    if (existing.length > 0) {
      const lead = existing[0];

      // PATCH 2: Anti-spam score control — throttle rapid repeat clicks
      const lastInteractedAt = lead.lastInteractionAt
        ? new Date(lead.lastInteractionAt).getTime()
        : 0;
      const msSinceLast = Date.now() - lastInteractedAt;

      let increment = params.scoreIncrement;
      if (msSinceLast < 30000) {
        increment = 0; // <30s: ignore spam clicks
      } else if (msSinceLast < 120000) {
        increment = 1; // <2min: reduced weight
      }

      const currentScore = lead.score || 0;
      const newScore = Math.min(currentScore + increment, 50);

      // Preserve earliest createdAt, take latest interaction
      const preservedCreatedAt = lead.createdAt && lead.createdAt < now ? lead.createdAt : now;
      const latestInteractionAt = lead.lastInteractionAt && lead.lastInteractionAt > now ? lead.lastInteractionAt : now;

      await tx
        .update(leads)
        .set({
          score: newScore,
          lastInteractionAt: latestInteractionAt,
          createdAt: preservedCreatedAt,
          leadData: {
            ...((lead.leadData as object) || {}),
            ...params.leadData,
            lastInteractionIp: "masked",
            lastInteractionAt: now.toISOString()
          }
        })
        .where(eq(leads.id, lead.id));

      // Update Workspace Health Signal
      await tx.update(workspaces).set({ lastTrackingEventAt: now }).where(eq(workspaces.id, params.workspaceId));

      return { id: lead.id, type: "updated" };
    } else {
      // Absolute Atomic Insert (Final Safety Layer)
      await tx.insert(leads).values({
        userId: params.ownerUserId,
        workspaceId: params.workspaceId,
        propertyId: params.propertyId,
        source: params.source as any,
        status: "new",
        score: params.scoreIncrement,
        fingerprintId: params.fingerprintId,
        lastInteractionAt: now,
        createdAt: now,
        leadData: {
          ...params.leadData,
          ua: params.userAgent
        }
      }).onDuplicateKeyUpdate({
        set: {
          score: sql`LEAST(score + ${params.scoreIncrement}, 50)`,
          lastInteractionAt: now,
        }
      });

      // Update Workspace Health Signal
      await tx.update(workspaces).set({ lastTrackingEventAt: now }).where(eq(workspaces.id, params.workspaceId));

      return { type: "inserted" };
    }
  });
}
