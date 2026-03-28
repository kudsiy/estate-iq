import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "agent", "team_member"]).default("user").notNull(),
  companyName: varchar("companyName", { length: 255 }),
  workspaceId: int("workspaceId"),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  targetMarket: varchar("targetMarket", { length: 255 }),
  selectedPlatforms: json("selectedPlatforms"),
  notificationPreferences: json("notificationPreferences"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: mysqlEnum("plan", ["starter", "pro", "agency"]).default("starter").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["trial", "active", "past_due", "canceled"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodEndsAt: timestamp("currentPeriodEndsAt"),
  usageCyclePeriodStart: timestamp("usageCyclePeriodStart"),
  aiCaptionsCount: int("aiCaptionsCount").default(0).notNull(),
  aiImagesCount: int("aiImagesCount").default(0).notNull(),
  billingInterval: mysqlEnum("billingInterval", ["monthly", "yearly"]).default("monthly").notNull(),
  apiKey: varchar("apiKey", { length: 64 }).unique(),
  socialConfig: json("socialConfig"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

// Contacts table for buyers and sellers
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  whatsappNumber: varchar("whatsappNumber", { length: 20 }),
  type: mysqlEnum("type", ["buyer", "seller", "both"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "converted", "lost"]).default("active"),
  source: varchar("source", { length: 100 }),
  tags: json("tags"),
  customFields: json("customFields"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// Properties table
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  subcity: varchar("subcity", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  price: decimal("price", { precision: 15, scale: 2 }),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  squareFeet: decimal("squareFeet", { precision: 12, scale: 2 }),
  photos: json("photos"),
  status: mysqlEnum("status", ["available", "sold", "rented", "pending"]).default("available"),
  uniqueListingId: varchar("uniqueListingId", { length: 255 }).unique(),
  trackingLink: varchar("trackingLink", { length: 500 }),
  isPosted: boolean("isPosted").default(false).notNull(),
  postTimestamp: timestamp("postTimestamp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// Deals table for tracking the sales pipeline
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  contactId: int("contactId").notNull(),
  propertyId: int("propertyId"),
  leadId: int("leadId"),
  stage: mysqlEnum("stage", ["lead", "contacted", "viewing", "offer", "closed"]).default("lead"),
  value: decimal("value", { precision: 15, scale: 2 }),
  commission: decimal("commission", { precision: 15, scale: 2 }),
  notes: text("notes"),
  documents: json("documents"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// Leads table for tracking lead sources
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  contactId: int("contactId"),
  propertyId: int("propertyId"),
  convertedDealId: int("convertedDealId"),
  source: mysqlEnum("source", ["form", "whatsapp", "facebook", "instagram", "tiktok", "manual", "tracking_link"]).notNull(),
  leadData: json("leadData"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new"),
  score: int("score").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// Brand Kits table
export const brandKits = mysqlTable("brandKits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logos: json("logos"),
  colors: json("colors"),
  fonts: json("fonts"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandKit = typeof brandKits.$inferSelect;
export type InsertBrandKit = typeof brandKits.$inferInsert;

// Designs table for storing design studio creations
export const designs = mysqlTable("designs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  type: mysqlEnum("type", ["poster", "instagram", "flyer", "reel", "email", "other"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  template: varchar("template", { length: 255 }),
  content: json("content"),
  previewUrl: varchar("previewUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Design = typeof designs.$inferSelect;
export type InsertDesign = typeof designs.$inferInsert;

// Social Media Posts table
export const socialMediaPosts = mysqlTable("socialMediaPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  designId: int("designId"),
  platforms: json("platforms"),
  scheduledTime: timestamp("scheduledTime"),
  content: text("content"),
  status: mysqlEnum("status", ["draft", "scheduled", "queued", "publishing", "published", "failed"]).default("draft"),
  platformStatuses: json("platformStatuses"),
  providerMetadata: json("providerMetadata"),
  engagementMetrics: json("engagementMetrics"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});

export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = typeof socialMediaPosts.$inferInsert;

// Engagement Metrics table
export const engagementMetrics = mysqlTable("engagementMetrics", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  leads: int("leads").default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type EngagementMetric = typeof engagementMetrics.$inferSelect;
export type InsertEngagementMetric = typeof engagementMetrics.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  type: mysqlEnum("type", ["lead", "deal", "engagement", "supplier", "match", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const supplierListings = mysqlTable("supplierListings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  sourceName: varchar("sourceName", { length: 255 }).notNull(),
  supplierContact: varchar("supplierContact", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  subcity: varchar("subcity", { length: 100 }),
  price: decimal("price", { precision: 15, scale: 2 }),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  notes: text("notes"),
  fingerprint: varchar("fingerprint", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["new", "reviewed", "imported"]).default("new").notNull(),
  importedPropertyId: int("importedPropertyId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierListing = typeof supplierListings.$inferSelect;
export type InsertSupplierListing = typeof supplierListings.$inferInsert;

export const buyerProfiles = mysqlTable("buyerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  contactId: int("contactId"),
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }),
  subcity: varchar("subcity", { length: 100 }),
  budgetMin: decimal("budgetMin", { precision: 15, scale: 2 }),
  budgetMax: decimal("budgetMax", { precision: 15, scale: 2 }),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BuyerProfile = typeof buyerProfiles.$inferSelect;
export type InsertBuyerProfile = typeof buyerProfiles.$inferInsert;

export const featureFlags = mysqlTable("featureFlags", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  enabled: boolean("enabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;
