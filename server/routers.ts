import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router, protectedProcedure, mutatingProcedure } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createChapaCheckoutSession } from "./_core/chapa";
import { PLAN_LIMITS, isLimitReached, isSubscriptionActive } from "./_core/monetization";
import {
  createBuyerProfile,
  createBrandKit,
  createContact,
  createDeal,
  createDesign,
  createLead,
  createNotification,
  createProperty,
  createSocialMediaPost,
  createSupplierListing,
  deleteBuyerProfile,
  deleteBrandKit,
  deleteContact,
  deleteDeal,
  deleteLead,
  deleteProperty,
  deleteSocialMediaPost,
  getAllUsers,
  getAllWorkspaces,
  getBuyerProfileById,
  getBuyerProfilesByScope,
  getBrandKitById,
  getBrandKitsByScope,
  getContactById,
  getContactsByScope,
  getContactEventsByScope,
  createContactEvent,
  getDealById,
  getDealsByScope,
  getDesignById,
  getDesignsByScope,
  getEngagementMetricsByScope,
  getFeatureFlags,
  getLeadById,
  getLeadsByScope,
  getNotificationsByScope,
  getPropertiesByScope,
  getPropertyById,
  getWorkspaceById,
  incrementWorkspaceAiCaptionsCount,
  getSocialMediaPostById,
  getSocialMediaPostsByScope,
  getSupplierListingById,
  getSupplierListingsByScope,
  markNotificationRead,
  upsertFeatureFlag,
  updateBuyerProfile,
  updateBrandKit,
  updateContact,
  updateDeal,
  updateLead,
  updateProperty,
  updateSocialMediaPost,
  updateSupplierListing,
  updateUserProfile,
  updateWorkspace,
} from "./db";

const platformEnum = z.enum(["telegram", "facebook", "instagram", "tiktok"]);
const postStatusEnum = z.enum(["draft", "scheduled", "queued", "publishing", "published", "failed"]);

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  viewing: "Viewing",
  offer: "Offer",
  closed: "Closed",
};

const formatBirr = (amount: string | number) => {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
  }).format(Number(amount));
};

const contactInputSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email().optional(),
  phone: z.string().trim().min(1).optional(),
  whatsappNumber: z.string().trim().min(1).optional(),
  type: z.enum(["buyer", "seller", "both"]),
  status: z.enum(["active", "inactive", "converted", "lost"]).optional(),
  source: z.string().trim().min(1).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
  subcity: z.string().trim().min(1).optional(),
  woreda: z.string().trim().min(1).optional(),
  propertyInterest: z.string().trim().min(1).optional(),
});

const atLeastOne = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).partial().strict().refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const contactUpdateSchema = atLeastOne({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email().nullable(),
  phone: z.string().trim().min(1).nullable(),
  whatsappNumber: z.string().trim().min(1).nullable(),
  type: z.enum(["buyer", "seller", "both"]),
  status: z.enum(["active", "inactive", "converted", "lost"]),
  source: z.string().trim().min(1).nullable(),
  tags: z.array(z.string()),
  customFields: z.record(z.string(), z.unknown()),
  notes: z.string().nullable(),
  subcity: z.string().trim().min(1).nullable(),
  woreda: z.string().trim().min(1).nullable(),
  propertyInterest: z.string().trim().min(1).nullable(),
});

const dealInputSchema = z.object({
  contactId: z.number().int().positive(),
  propertyId: z.number().int().positive().optional(),
  leadId: z.number().int().positive().optional(),
  stage: z.enum(["lead", "contacted", "viewing", "offer", "closed"]).optional(),
  value: z.number().nonnegative().optional(),
  commission: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const dealUpdateSchema = atLeastOne({
  contactId: z.number().int().positive(),
  propertyId: z.number().int().positive().nullable(),
  leadId: z.number().int().positive().nullable(),
  stage: z.enum(["lead", "contacted", "viewing", "offer", "closed"]),
  value: z.number().nonnegative().nullable(),
  commission: z.number().nonnegative().nullable(),
  notes: z.string().nullable(),
  closedAt: z.date().nullable(),
});

const propertyInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  subcity: z.string().trim().min(1).optional(),
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  squareFeet: z.union([z.number(), z.string()]).optional(),
  photos: z.array(z.string()).optional(),
  status: z.enum(["available", "sold", "rented", "pending"]).optional(),
});

const propertyUpdateSchema = atLeastOne({
  title: z.string().trim().min(1),
  description: z.string().nullable(),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  subcity: z.string().trim().min(1).nullable(),
  latitude: z.union([z.number(), z.string()]).nullable(),
  longitude: z.union([z.number(), z.string()]).nullable(),
  price: z.union([z.number(), z.string()]).nullable(),
  bedrooms: z.number().int().nonnegative().nullable(),
  bathrooms: z.number().int().nonnegative().nullable(),
  squareFeet: z.union([z.number(), z.string()]).nullable(),
  photos: z.array(z.string()),
  status: z.enum(["available", "sold", "rented", "pending"]),
});

const leadInputSchema = z.object({
  contactId: z.number().int().positive().optional(),
  propertyId: z.number().int().positive().optional(),
  source: z.enum(["form", "whatsapp", "facebook", "instagram", "tiktok", "manual", "tracking_link"]),
  leadData: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
  score: z.number().int().min(0).max(100).optional(),
});

const leadUpdateSchema = atLeastOne({
  contactId: z.number().int().positive().nullable(),
  propertyId: z.number().int().positive().nullable(),
  convertedDealId: z.number().int().positive().nullable(),
  leadData: z.record(z.string(), z.unknown()),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
  score: z.number().int().min(0).max(100),
});

const convertLeadSchema = z.object({
  leadId: z.number().int().positive(),
  createDeal: z.boolean().default(false),
  propertyId: z.number().int().positive().optional(),
  stage: z.enum(["lead", "contacted", "viewing", "offer", "closed"]).default("lead"),
});

const leadCascadeSchema = z.object({
  propertyId: z.number().int().positive().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().nullable().optional(),
  notes: z.string().nullable().optional(),
  source: z.enum(["form", "whatsapp", "facebook", "instagram", "tiktok", "manual", "tracking_link"]),
});

const brandKitInputSchema = z.object({
  name: z.string().trim().min(1),
  logos: z.array(z.object({ src: z.string(), name: z.string() })).optional(),
  colors: z.array(z.object({ hex: z.string(), name: z.string() })).optional(),
  fonts: z.array(z.object({ family: z.string(), label: z.string() })).optional(),
});

const brandKitUpdateSchema = atLeastOne({
  name: z.string().trim().min(1),
  logos: z.array(z.object({ src: z.string(), name: z.string() })),
  colors: z.array(z.object({ hex: z.string(), name: z.string() })),
  fonts: z.array(z.object({ family: z.string(), label: z.string() })),
});

const designInputSchema = z.object({
  type: z.enum(["poster", "instagram", "flyer", "reel", "email", "other"]),
  name: z.string().trim().min(1),
  template: z.string().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  previewUrl: z.string().optional(),
});

const socialPlatformStatusSchema = z.record(
  z.string(),
  z.object({
    status: postStatusEnum,
    providerPostId: z.string().optional(),
    error: z.string().optional(),
    updatedAt: z.string().optional(),
  })
);

const socialMediaPostInputSchema = z.object({
  designId: z.number().int().positive().optional(),
  platforms: z.array(platformEnum).min(1).optional(),
  scheduledTime: z.date().optional(),
  content: z.string().min(1).optional(),
  status: postStatusEnum.optional(),
  platformStatuses: socialPlatformStatusSchema.optional(),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

const socialMediaPostUpdateSchema = atLeastOne({
  designId: z.number().int().positive().nullable(),
  platforms: z.array(platformEnum).min(1),
  scheduledTime: z.date().nullable(),
  content: z.string().min(1),
  status: postStatusEnum,
  platformStatuses: socialPlatformStatusSchema,
  providerMetadata: z.record(z.string(), z.unknown()),
  publishedAt: z.date().nullable(),
});

const onboardingSchema = z.object({
  companyName: z.string().trim().max(255).optional(),
  role: z.enum(["agent", "team_member", "admin", "user"]).optional(),
  targetMarket: z.string().trim().max(255).optional(),
  selectedPlatforms: z.array(platformEnum).max(4).optional(),
  skip: z.boolean().default(false),
});

const profileSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(32).optional(),
  companyName: z.string().trim().max(255).optional(),
  role: z.enum(["agent", "team_member", "admin", "user"]).optional(),
  notificationPreferences: z
    .array(
      z.object({
        key: z.string().trim().min(1),
        label: z.string().trim().min(1),
        enabled: z.boolean(),
      })
    )
    .optional(),
});

const notificationUpdateSchema = z.object({
  id: z.number().int().positive(),
  isRead: z.boolean(),
});

const supplierListingInputSchema = z.object({
  sourceName: z.string().trim().min(1),
  supplierContact: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  subcity: z.string().trim().min(1).optional(),
  price: z.number().nonnegative().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

const supplierListingUpdateSchema = atLeastOne({
  sourceName: z.string().trim().min(1),
  supplierContact: z.string().trim().min(1).nullable(),
  title: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  subcity: z.string().trim().min(1).nullable(),
  price: z.number().nonnegative().nullable(),
  bedrooms: z.number().int().nonnegative().nullable(),
  bathrooms: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
  status: z.enum(["new", "reviewed", "imported"]),
  importedPropertyId: z.number().int().positive().nullable(),
});

const supplierImportSchema = z.object({
  supplierListingId: z.number().int().positive(),
});

const buyerProfileInputSchema = z.object({
  contactId: z.number().int().positive().optional(),
  name: z.string().trim().min(1),
  city: z.string().trim().min(1).optional(),
  subcity: z.string().trim().min(1).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

const buyerProfileUpdateSchema = atLeastOne({
  contactId: z.number().int().positive().nullable(),
  name: z.string().trim().min(1),
  city: z.string().trim().min(1).nullable(),
  subcity: z.string().trim().min(1).nullable(),
  budgetMin: z.number().nonnegative().nullable(),
  budgetMax: z.number().nonnegative().nullable(),
  bedrooms: z.number().int().nonnegative().nullable(),
  bathrooms: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
});

const workspacePlanEnum = z.enum(["starter", "pro", "agency"]);
const subscriptionStatusEnum = z.enum(["trial", "active", "past_due", "canceled"]);

const subscriptionUpdateSchema = z.object({
  plan: workspacePlanEnum,
  subscriptionStatus: subscriptionStatusEnum.default("active"),
});

const featureFlagSchema = z.object({
  key: z.string().trim().min(1).max(100),
  description: z.string().trim().max(255).optional(),
  enabled: z.boolean(),
});

function getScope(user: { id: number; workspaceId: number | null }) {
  if (!user.workspaceId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Workspace has not been initialized for this user.",
    });
  }

  return {
    userId: user.id,
    workspaceId: user.workspaceId,
  };
}

function assertFound<T>(value: T | undefined | null, resource: string): T {
  if (!value) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${resource} not found`,
    });
  }
  return value;
}

function buildPlatformStatuses(
  platforms: string[] = [],
  status: z.infer<typeof postStatusEnum> = "scheduled"
) {
  const now = new Date().toISOString();
  return Object.fromEntries(
    platforms.map((platform) => [
      platform,
      {
        status,
        updatedAt: now,
      },
    ])
  );
}

function getNotificationPreferences(user: { notificationPreferences?: unknown }) {
  const defaults = {
    newLead: true,
    dealStage: true,
    supplierReview: true,
    matchAlert: true,
    publishFailure: true,
  };

  const stored = Array.isArray(user.notificationPreferences)
    ? user.notificationPreferences
    : [];

  for (const item of stored) {
    if (!item || typeof item !== "object") continue;
    const key = (item as { key?: unknown }).key;
    const enabled = (item as { enabled?: unknown }).enabled;
    if (typeof key === "string" && key in defaults && typeof enabled === "boolean") {
      defaults[key as keyof typeof defaults] = enabled;
    }
  }

  return defaults;
}

async function createScopedNotification(
  ctx: { user: { id: number; workspaceId: number | null; notificationPreferences?: unknown } },
  input: {
    type: "lead" | "deal" | "engagement" | "supplier" | "match" | "system";
    title: string;
    message: string;
    entityType?: string;
    entityId?: number;
    preferenceKey?: "newLead" | "dealStage" | "supplierReview" | "matchAlert" | "publishFailure";
  }
) {
  const workspaceId = ctx.user.workspaceId;
  if (!workspaceId) return;
  const preferences = getNotificationPreferences(ctx.user);
  if (input.preferenceKey && !preferences[input.preferenceKey]) return;
  const existing =
    (await getNotificationsByScope({
      userId: ctx.user.id,
      workspaceId,
    })) ?? [];
  const duplicate = existing.find(
    (item) =>
      !item.isRead &&
      item.title === input.title &&
      item.entityType === (input.entityType ?? null) &&
      item.entityId === (input.entityId ?? null)
  );
  if (duplicate) return;
  await createNotification({
    userId: ctx.user.id,
    workspaceId,
    type: input.type,
    title: input.title,
    message: input.message,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
  });
}

function scoreBuyerMatch(
  buyer: {
    city?: string | null;
    subcity?: string | null;
    budgetMin?: string | number | null;
    budgetMax?: string | number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
  },
  property: {
    city?: string | null;
    subcity?: string | null;
    price?: string | number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
  }
) {
  let score = 0;
  const reasons: string[] = [];
  const price = Number(property.price ?? 0);
  const minBudget = Number(buyer.budgetMin ?? 0);
  const maxBudget = Number(buyer.budgetMax ?? 0);

  if (buyer.city && property.city && buyer.city.toLowerCase() === property.city.toLowerCase()) {
    score += 25;
    reasons.push("city match");
  }

  if (
    buyer.subcity &&
    property.subcity &&
    buyer.subcity.toLowerCase() === property.subcity.toLowerCase()
  ) {
    score += 20;
    reasons.push("subcity match");
  }

  if ((minBudget || maxBudget) && price) {
    if ((!minBudget || price >= minBudget) && (!maxBudget || price <= maxBudget)) {
      score += 25;
      reasons.push("within budget");
    } else if (maxBudget && price <= maxBudget * 1.1) {
      score += 10;
      reasons.push("close to budget");
    }
  }

  if (buyer.bedrooms && property.bedrooms && property.bedrooms >= buyer.bedrooms) {
    score += 15;
    reasons.push("bedrooms fit");
  }

  if (buyer.bathrooms && property.bathrooms && property.bathrooms >= buyer.bathrooms) {
    score += 15;
    reasons.push("bathrooms fit");
  }

  return {
    score,
    reasons,
  };
}

async function getWorkspacePlan(scope: { workspaceId: number }) {
  const workspace = await getWorkspaceById(scope.workspaceId);
  return {
    workspace,
    plan: (workspace?.plan ?? "starter") as keyof typeof PLAN_LIMITS,
  };
}

async function assertPlanCapacity(
  scope: { workspaceId: number },
  resource: keyof (typeof PLAN_LIMITS)["starter"],
  getCurrentCount: () => Promise<number>
) {
  let { workspace, plan } = await getWorkspacePlan(scope);
  if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });

  // 0. Monthly usage reset logic
  if (workspace.usageCyclePeriodStart) {
    const cycleStart = new Date(workspace.usageCyclePeriodStart);
    const now = new Date();
    // Use 30 days as a standard month for reset
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (now.getTime() - cycleStart.getTime() > thirtyDays) {
      await updateWorkspace(scope.workspaceId, {
        usageCyclePeriodStart: now,
        aiCaptionsCount: 0,
        aiImagesCount: 0,
      });
      // Refresh workspace data after reset
      workspace = await getWorkspaceById(scope.workspaceId) as any;
    }
  }

  const limit = PLAN_LIMITS[plan][resource];
  const currentCount = await getCurrentCount();

  // 1. Check if trial or subscription is active
  if (!isSubscriptionActive(workspace as any)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `The ${workspace?.name ?? "current"} workspace does not have an active trial or subscription. Please upgrade to continue.`,
    });
  }

  // 2. Check resource limits
  if (isLimitReached(limit, currentCount)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `The ${workspace?.name ?? "current"} workspace has reached its ${plan} plan limit for ${resource}.`,
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    completeOnboarding: protectedProcedure
      .input(onboardingSchema)
      .mutation(async ({ ctx, input }) => {
        const companyName =
          input.companyName?.trim() || ctx.user.companyName || "My Workspace";

        await updateUserProfile(ctx.user.openId, {
          companyName,
          role: input.role ?? ctx.user.role,
          targetMarket: input.targetMarket ?? ctx.user.targetMarket ?? null,
          selectedPlatforms: input.selectedPlatforms ?? [],
          onboardingCompleted: true,
        });

        if (ctx.user.workspaceId) {
          await updateWorkspace(ctx.user.workspaceId, {
            name: companyName,
          });
        }

        return { success: true } as const;
      }),
    updateProfile: protectedProcedure
      .input(profileSchema)
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.openId, input);

        if (input.companyName && ctx.user.workspaceId) {
          await updateWorkspace(ctx.user.workspaceId, {
            name: input.companyName,
          });
        }

        return { success: true } as const;
      }),
  }),

  subscription: router({
    plans: publicProcedure.query(() => {
      return [
        {
          key: "starter",
          name: "Starter",
          priceMonthly: 499,
          limits: PLAN_LIMITS.starter,
        },
        {
          key: "pro",
          name: "Pro",
          priceMonthly: 999,
          limits: PLAN_LIMITS.pro,
        },
        {
          key: "agency",
          name: "Agency",
          priceMonthly: 2499,
          limits: PLAN_LIMITS.agency,
        },
      ] as const;
    }),
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }
      return assertFound(await getWorkspaceById(ctx.user.workspaceId), "Workspace");
    }),
    current: protectedProcedure.query(async ({ ctx }) => {
      const scope = getScope(ctx.user);
      const [contacts, properties, socialPosts, buyerProfiles, leads] = await Promise.all([
        getContactsByScope(scope),
        getPropertiesByScope(scope),
        getSocialMediaPostsByScope(scope),
        getBuyerProfilesByScope(scope),
        getLeadsByScope(scope),
      ]);

      const workspace = ctx.user.workspaceId ? await getWorkspaceById(ctx.user.workspaceId) : undefined;
      const plan = workspace?.plan ?? "starter";

      // Check if trial or subscription is expired
      const now = new Date();
      const isTrialActive = workspace?.subscriptionStatus === "trial" &&
        workspace.trialEndsAt && new Date(workspace.trialEndsAt) > now;
      const isSubscriptionActive = workspace?.subscriptionStatus === "active" &&
        workspace.currentPeriodEndsAt && new Date(workspace.currentPeriodEndsAt) > now;
      const daysRemaining = isTrialActive && workspace?.trialEndsAt
        ? Math.ceil((new Date(workspace.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : isSubscriptionActive && workspace?.currentPeriodEndsAt
          ? Math.ceil((new Date(workspace.currentPeriodEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

      return {
        workspace,
        plan,
        limits: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
        usage: {
          contacts: contacts.length,
          properties: properties.length,
          socialPosts: socialPosts.length,
          buyerProfiles: buyerProfiles.length,
          leads: leads.length,
          aiCaptions: workspace?.aiCaptionsCount ?? 0,
          aiImages: workspace?.aiImagesCount ?? 0,
        },
        isActive: isTrialActive || isSubscriptionActive,
        daysRemaining,
      };
    }),
  }),

  workspace: router({
    rotateApiKey: protectedProcedure.mutation(async ({ ctx }) => {
      const scope = getScope(ctx.user);
      const newKey = `eiq_live_${nanoid(32)}`;
      await updateWorkspace(scope.workspaceId, { apiKey: newKey });
      return { apiKey: newKey } as const;
    }),
    updateSocialConfig: protectedProcedure
      .input(z.record(z.string(), z.unknown()))
      .mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        await updateWorkspace(scope.workspaceId, { socialConfig: input });
        return { success: true } as const;
      }),
  }),

  billing: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        plan: workspacePlanEnum,
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.workspaceId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not initialized" });
        }

        const PLAN_PRICES: Record<string, number> = {
          starter: 499,
          pro: 999,
          agency: 2499,
        };

        const amount = PLAN_PRICES[input.plan] ?? 499;
        const txRef = `eiq-${ctx.user.workspaceId}-${nanoid(12)}`;
        const appBaseUrl = process.env.BASE_URL || "http://localhost:3000";

        const checkoutUrl = await createChapaCheckoutSession({
          amount,
          plan: input.plan,
          currency: "ETB",
          email: ctx.user.email ?? undefined,
          first_name: ctx.user.name?.split(" ")[0] ?? undefined,
          last_name: ctx.user.name?.split(" ").slice(1).join(" ") ?? undefined,
          tx_ref: txRef,
          callback_url: `${appBaseUrl}/api/webhooks/chapa`,
          return_url: `${appBaseUrl}/billing?session=complete`,
          customization: {
            title: "Estate IQ Subscription",
            description: `${input.plan.charAt(0).toUpperCase() + input.plan.slice(1)} Plan — ETB ${amount}/month`,
          },
        });

        return {
          checkoutUrl,
          txRef,
          plan: input.plan,
          amount,
        };
      }),
  }),

  admin: router({
    overview: adminProcedure.query(async () => {
      const [users, workspaces, flags] = await Promise.all([
        getAllUsers(),
        getAllWorkspaces(),
        getFeatureFlags(),
      ]);

      return {
        users,
        workspaces,
        flags,
        counts: {
          users: users.length,
          admins: users.filter((user) => user.role === "admin").length,
          workspaces: workspaces.length,
          activeSubscriptions: workspaces.filter((workspace) => workspace.subscriptionStatus === "active").length,
        },
      };
    }),
    featureFlags: router({
      list: adminProcedure.query(async () => getFeatureFlags()),
      upsert: adminProcedure.input(featureFlagSchema).mutation(async ({ input }) => {
        await upsertFeatureFlag({
          key: input.key,
          description: input.description ?? null,
          enabled: input.enabled,
        });
        return { success: true } as const;
      }),
    }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const rows = await getNotificationsByScope(getScope(ctx.user));
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }),
    update: protectedProcedure.input(notificationUpdateSchema).mutation(async ({ ctx, input }) => {
      const updated = await markNotificationRead(getScope(ctx.user), input.id, input.isRead);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      return { success: true } as const;
    }),
  }),

  supplierFeed: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const scope = getScope(ctx.user);
      const [listings, existingProperties] = await Promise.all([
        getSupplierListingsByScope(scope),
        getPropertiesByScope(scope),
      ]);

      return listings
        .map((listing) => {
          const duplicate = existingProperties.find(
            (property) =>
              property.address.trim().toLowerCase() === listing.address.trim().toLowerCase() &&
              Number(property.price ?? 0) === Number(listing.price ?? 0)
          );

          return {
            ...listing,
            duplicatePropertyId: duplicate?.id ?? null,
          };
        })
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }),
    create: mutatingProcedure.input(supplierListingInputSchema).mutation(async ({ ctx, input }) => {
      const scope = getScope(ctx.user);
      const fingerprint = `${input.address.trim().toLowerCase()}::${Number(input.price ?? 0)}::${input.sourceName.trim().toLowerCase()}`;
      const id = await createSupplierListing({
        userId: ctx.user.id,
        workspaceId: scope.workspaceId,
        sourceName: input.sourceName,
        supplierContact: input.supplierContact ?? null,
        title: input.title,
        address: input.address,
        city: input.city,
        subcity: input.subcity ?? null,
        price: input.price?.toString() ?? null,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        notes: input.notes ?? null,
        fingerprint,
      });

      await createScopedNotification(
        { user: ctx.user },
        {
          type: "supplier",
          title: "Supplier listing needs review",
          message: `${input.title} was added to the supplier inbox.`,
          entityType: "supplierListing",
          entityId: id,
          preferenceKey: "supplierReview",
        }
      );

      return { success: true, id } as const;
    }),
    update: mutatingProcedure
      .input(z.object({ id: z.number().int().positive(), data: supplierListingUpdateSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = { ...input.data, price: input.data.price?.toString() ?? undefined };
        const updated = await updateSupplierListing(getScope(ctx.user), input.id, data);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Supplier listing not found" });
        return { success: true } as const;
      }),
    importToProperties: mutatingProcedure.input(supplierImportSchema).mutation(async ({ ctx, input }) => {
      const scope = getScope(ctx.user);

      // Only Pro and Agency plans can import from supplier feed
      const { plan } = await getWorkspacePlan(scope);
      if (plan !== "agency" && plan !== "pro") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Supplier import is only available on the Pro or Agency plan. Please upgrade.",
        });
      }

      const listing = assertFound(
        await getSupplierListingById(scope, input.supplierListingId),
        "Supplier listing"
      );

      const propertyId = await createProperty({
        userId: ctx.user.id,
        workspaceId: scope.workspaceId,
        title: listing.title,
        description: listing.notes,
        address: listing.address,
        city: listing.city,
        subcity: listing.subcity,
        price: listing.price?.toString() ?? null,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        status: "available",
      });

      await updateSupplierListing(scope, listing.id, {
        status: "imported",
        importedPropertyId: propertyId,
      });

      return { success: true, propertyId } as const;
    }),
  }),

  matching: router({
    profiles: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getBuyerProfilesByScope(getScope(ctx.user));
      }),
      create: mutatingProcedure.input(buyerProfileInputSchema).mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        await assertPlanCapacity(scope, "buyerProfiles", async () => {
          const profiles = await getBuyerProfilesByScope(scope);
          return profiles.length;
        });
        const id = await createBuyerProfile({
          userId: ctx.user.id,
          workspaceId: scope.workspaceId,
          contactId: input.contactId ?? null,
          name: input.name,
          city: input.city ?? null,
          subcity: input.subcity ?? null,
          budgetMin: input.budgetMin?.toString() ?? null,
          budgetMax: input.budgetMax?.toString() ?? null,
          bedrooms: input.bedrooms ?? null,
          bathrooms: input.bathrooms ?? null,
          notes: input.notes ?? null,
        });
        return { success: true, id } as const;
      }),
      update: mutatingProcedure
        .input(z.object({ id: z.number().int().positive(), data: buyerProfileUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
          const data = { ...input.data, budgetMin: input.data.budgetMin?.toString() ?? undefined, budgetMax: input.data.budgetMax?.toString() ?? undefined  };
          const updated = await updateBuyerProfile(getScope(ctx.user), input.id, data);
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Buyer profile not found" });
          return { success: true } as const;
        }),
      delete: mutatingProcedure.input(z.number().int().positive()).mutation(async ({ ctx, input }) => {
        const deleted = await deleteBuyerProfile(getScope(ctx.user), input);
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Buyer profile not found" });
        return { success: true } as const;
      }),
    }),
    matches: protectedProcedure
      .input(z.object({ buyerProfileId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        const buyer = assertFound(await getBuyerProfileById(scope, input.buyerProfileId), "Buyer profile");
        const allProperties = await getPropertiesByScope(scope);

        const matches = allProperties
          .map((property) => {
            const result = scoreBuyerMatch(buyer, property);
            return {
              property,
              score: result.score,
              reasons: result.reasons,
            };
          })
          .filter((match) => match.score > 0)
          .sort((a, b) => b.score - a.score);

        const hottest = matches[0];
        if (hottest && hottest.score >= 60) {
          await createScopedNotification(
            { user: ctx.user },
            {
              type: "match",
              title: "Hot buyer match found",
              message: `${buyer.name} matches ${hottest.property.title} with a score of ${hottest.score}.`,
              entityType: "buyerProfile",
              entityId: buyer.id,
              preferenceKey: "matchAlert",
            }
          );
        }

        return matches;
      }),
  }),

  crm: router({
    contacts: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getContactsByScope(getScope(ctx.user));
      }),
      getById: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
        return assertFound(await getContactById(getScope(ctx.user), input), "Contact");
      }),
      create: mutatingProcedure.input(contactInputSchema).mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        await assertPlanCapacity(scope, "contacts", async () => {
          const contacts = await getContactsByScope(scope);
          return contacts.length;
        });
        const id = await createContact({ userId: ctx.user.id, workspaceId: scope.workspaceId, ...input });
        
        await createContactEvent({
          userId: ctx.user.id,
          workspaceId: scope.workspaceId,
          contactId: id,
          type: "system",
          label: "Contact created",
          description: input.source ? `Source: ${input.source}` : "Manual entry",
        });

        return { success: true, id };
      }),
      update: mutatingProcedure
        .input(z.object({ id: z.number().int().positive(), data: contactUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
          const scope = getScope(ctx.user);
          const existing = await getContactById(scope, input.id);
          const updated = await updateContact(scope, input.id, input.data);
          if (!updated || !existing) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
          
          if (input.data.status && existing?.status !== input.data.status) {
            await createContactEvent({
              userId: ctx.user.id,
              workspaceId: scope.workspaceId,
              contactId: input.id,
              type: "status_change",
              label: `Status changed to ${input.data.status}`,
              metadata: { old: existing.status, new: input.data.status },
            });
          }
          
          if (input.data.notes && existing?.notes !== input.data.notes) {
            await createContactEvent({
              userId: ctx.user.id,
              workspaceId: scope.workspaceId,
              contactId: input.id,
              type: "note",
              label: "Note added",
              description: input.data.notes,
            });
          }

          return { success: true } as const;
        }),
      delete: mutatingProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input }) => {
          const deleted = await deleteContact(getScope(ctx.user), input);
          if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
          return { success: true } as const;
        }),
      listEvents: protectedProcedure
        .input(z.number().int().positive())
        .query(async ({ ctx, input }) => {
          const scope = getScope(ctx.user);
          const contact = await getContactById(scope, input);
          if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
          return getContactEventsByScope(scope, input);
        }),
      addEvent: mutatingProcedure
        .input(z.object({
          contactId: z.number().int().positive(),
          type: z.enum(["note", "status_change", "deal_update", "lead_conversion", "system"]),
          label: z.string().min(1),
          description: z.string().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const scope = getScope(ctx.user);
          const contact = await getContactById(scope, input.contactId);
          if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
          
          const id = await createContactEvent({
            ...input,
            userId: ctx.user.id,
            workspaceId: scope.workspaceId,
          });
          return { success: true, id };
        }),
    }),

    deals: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getDealsByScope(getScope(ctx.user));
      }),
      getById: protectedProcedure.input(z.number().int().positive()).query(async ({ ctx, input }) => {
        return assertFound(await getDealById(getScope(ctx.user), input), "Deal");
      }),
      create: mutatingProcedure.input(dealInputSchema).mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        const id = await createDeal({ userId: ctx.user.id, workspaceId: scope.workspaceId, ...input, value: input.value?.toString(), commission: input.commission?.toString() });
        return { success: true, id };
      }),
      update: mutatingProcedure
        .input(z.object({ id: z.number().int().positive(), data: dealUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
          const scope = getScope(ctx.user);
          const existing = await getDealById(scope, input.id);
          const data = {
            ...input.data,
            value: input.data.value?.toString() ?? undefined,
            commission: input.data.commission?.toString() ?? undefined,
            ...(input.data.stage === "closed" && !input.data.closedAt ? { closedAt: new Date() } : {}),
            ...(input.data.stage && input.data.stage !== "closed" ? { closedAt: null } : {}),
          };
          const updated = await updateDeal(scope, input.id, data);
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
          if (data.stage && existing?.stage !== data.stage) {
            await createContactEvent({
              userId: ctx.user.id,
              workspaceId: scope.workspaceId,
              contactId: existing!.contactId,
              type: "deal_update",
              label: `Deal stage updated to ${STAGE_LABELS[data.stage] || data.stage}`,
              description: `Value: ${data.value ? formatBirr(data.value) : "—"}`,
              metadata: { dealId: input.id, old: existing?.stage, new: data.stage },
            });

            await createScopedNotification(
              { user: ctx.user },
              {
                type: "deal",
                title: "Deal stage updated",
                message: `Deal #${input.id} moved to ${data.stage}.`,
                entityType: "deal",
                entityId: input.id,
                preferenceKey: "dealStage",
              }
            );
          }
          return { success: true } as const;
        }),
      delete: mutatingProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input }) => {
          const deleted = await deleteDeal(getScope(ctx.user), input);
          if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
          return { success: true } as const;
        }),
    }),

    properties: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getPropertiesByScope(getScope(ctx.user));
      }),
      getById: protectedProcedure.input(z.number().int().positive()).query(async ({ ctx, input }) => {
        return assertFound(await getPropertyById(getScope(ctx.user), input), "Property");
      }),
      create: mutatingProcedure.input(propertyInputSchema).mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        await assertPlanCapacity(scope, "properties", async () => {
          const properties = await getPropertiesByScope(scope);
          return properties.length;
        });
        const id = await createProperty({ userId: ctx.user.id, workspaceId: scope.workspaceId, ...input, price: input.price?.toString(), latitude: input.latitude?.toString(), longitude: input.longitude?.toString(), squareFeet: input.squareFeet?.toString() });
        return { success: true, id };
      }),
      update: mutatingProcedure
        .input(z.object({ id: z.number().int().positive(), data: propertyUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
          const data = { ...input.data, price: input.data.price?.toString() ?? undefined, latitude: input.data.latitude?.toString() ?? undefined, longitude: input.data.longitude?.toString() ?? undefined, squareFeet: input.data.squareFeet?.toString() ?? undefined };
          const updated = await updateProperty(getScope(ctx.user), input.id, data);
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
          return { success: true } as const;
        }),
      delete: mutatingProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input }) => {
          const deleted = await deleteProperty(getScope(ctx.user), input);
          if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
          return { success: true } as const;
        }),
      publish: mutatingProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const scope = getScope(ctx.user);
          const property = await getPropertyById(scope, input.id);
          if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });

          const uniqueId = nanoid(10);
          const trackingLink = `https://app.estateiq.et/l/${ctx.user.id}/${uniqueId}`;

          await updateProperty(scope, input.id, {
            uniqueListingId: uniqueId,
            trackingLink,
            isPosted: true,
            postTimestamp: new Date(),
          });

          return { success: true, trackingLink };
        }),
    }),

    leads: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getLeadsByScope(getScope(ctx.user));
      }),
      getById: protectedProcedure.input(z.number().int().positive()).query(async ({ ctx, input }) => {
        return assertFound(await getLeadById(getScope(ctx.user), input), "Lead");
      }),
      create: mutatingProcedure.input(leadInputSchema).mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        await assertPlanCapacity(scope, "leads", async () => {
          const existingLeads = await getLeadsByScope(scope);
          return existingLeads.length;
        });
        const id = await createLead({ userId: ctx.user.id, workspaceId: scope.workspaceId, ...input });
        const leadData = (input.leadData ?? {}) as Record<string, unknown>;
        const leadName = [leadData.firstName, leadData.lastName]
          .filter((value): value is string => typeof value === "string" && value.length > 0)
          .join(" ");
        await createScopedNotification(
          { user: ctx.user },
          {
            type: "lead",
            title: "New lead captured",
            message: `${leadName || "A new lead"} was added from ${input.source}.`,
            entityType: "lead",
            entityId: id,
            preferenceKey: "newLead",
          }
        );
        return { success: true, id };
      }),
      update: mutatingProcedure
        .input(z.object({ id: z.number().int().positive(), data: leadUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
          const updated = await updateLead(getScope(ctx.user), input.id, input.data);
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
          return { success: true } as const;
        }),
      delete: mutatingProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input }) => {
          const deleted = await deleteLead(getScope(ctx.user), input);
          if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
          return { success: true } as const;
        }),
      convert: mutatingProcedure
        .input(convertLeadSchema)
        .mutation(async ({ ctx, input }) => {
          const scope = getScope(ctx.user);
          const lead = assertFound(await getLeadById(scope, input.leadId), "Lead");

          if (lead.contactId) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Lead has already been converted to a contact.",
            });
          }

          const leadData = (lead.leadData ?? {}) as Record<string, unknown>;
          const contactId = await createContact({
            userId: ctx.user.id,
            workspaceId: scope.workspaceId,
            firstName: String(leadData.firstName ?? "New"),
            lastName: String(leadData.lastName ?? "Lead"),
            email: typeof leadData.email === "string" ? leadData.email : null,
            phone: typeof leadData.phone === "string" ? leadData.phone : null,
            whatsappNumber: typeof leadData.phone === "string" ? leadData.phone : null,
            type: "buyer",
            status: "active",
            source: lead.source,
            notes: typeof leadData.notes === "string" ? leadData.notes : null,
          });

          let dealId: number | undefined;
          if (input.createDeal) {
            dealId = await createDeal({
              userId: ctx.user.id,
              workspaceId: scope.workspaceId,
              contactId,
              propertyId: input.propertyId ?? lead.propertyId ?? null,
              leadId: lead.id,
              stage: input.stage,
              notes: typeof leadData.notes === "string" ? leadData.notes : null,
            });
          }

          await updateLead(scope, lead.id, {
            contactId,
            propertyId: input.propertyId ?? lead.propertyId ?? null,
            convertedDealId: dealId ?? null,
            status: "converted",
          });

          await createContactEvent({
            userId: ctx.user.id,
            workspaceId: scope.workspaceId,
            contactId,
            type: "lead_conversion",
            label: "Lead converted from " + lead.source,
            description: input.createDeal ? "Initial deal created" : "Contact ingestion",
            metadata: { leadId: lead.id, dealId: dealId ?? null },
          });

          return {
            success: true,
            contactId,
            dealId: dealId ?? null,
          } as const;
        }),
      createWithCascade: publicProcedure
        .input(leadCascadeSchema)
        .mutation(async ({ input }) => {
          const db = await import("./db.js");
          
          let workspaceId: number | undefined;
          let userId: number | undefined;

          if (input.propertyId) {
            const property = await db.getPropertyById({ userId: 0, workspaceId: 0 }, input.propertyId);
            if (property) {
              workspaceId = property.workspaceId;
              userId = property.userId;
            }
          }

          if (!workspaceId || !userId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid property or source" });
          }

          const scope = { userId, workspaceId };
          const workspace = await db.getWorkspaceById(workspaceId);
          if (!workspace) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
          }

          // 1. Enforce active trial or subscription
          const now = new Date();
          const isTrialActive = workspace.subscriptionStatus === "trial" &&
            workspace.trialEndsAt && new Date(workspace.trialEndsAt) > now;
          const isSubscriptionActive = workspace.subscriptionStatus === "active" &&
            workspace.currentPeriodEndsAt && new Date(workspace.currentPeriodEndsAt) > now;

          if (!isTrialActive && !isSubscriptionActive) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "This agent's trial or subscription has expired. Lead capture is disabled.",
            });
          }

          // 2. Enforce lead limit
          const leadLimit = PLAN_LIMITS[workspace.plan as keyof typeof PLAN_LIMITS].leads;
          const currentLeads = await db.getLeadsByScope(scope);
          if (isLimitReached(leadLimit, currentLeads.length)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "This agent has reached their lead limit. Please contact them directly.",
            });
          }

          const leadId = await db.createLead({
            userId,
            workspaceId,
            propertyId: input.propertyId,
            source: input.source,
            leadData: {
              firstName: input.firstName,
              lastName: input.lastName,
              phone: input.phone,
              email: input.email,
              notes: input.notes,
            },
            status: "new",
          });

          const contactId = await db.createContact({
            userId,
            workspaceId,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email ?? null,
            phone: input.phone,
            whatsappNumber: input.phone,
            type: "buyer",
            status: "active",
            source: input.source,
            notes: input.notes ?? null,
          });

          const dealId = await db.createDeal({
            userId,
            workspaceId,
            contactId,
            propertyId: input.propertyId,
            leadId,
            stage: "lead",
            notes: input.notes ?? null,
          });

          await db.updateLead(scope, leadId, {
            contactId,
            convertedDealId: dealId,
            status: "converted",
          });

          return { success: true, leadId, contactId, dealId };
        }),
    }),
    public: router({
      getProperty: publicProcedure
        .input(z.object({ uniqueId: z.string() }))
        .query(async ({ input }) => {
          const db = await import("./db.js");
          const property = await db.getPropertyByUniqueId(input.uniqueId);
          if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
          return property;
        }),
    }),

    brandKits: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getBrandKitsByScope(getScope(ctx.user));
      }),
      getById: protectedProcedure.input(z.number().int().positive()).query(async ({ ctx, input }) => {
        return assertFound(await getBrandKitById(getScope(ctx.user), input), "Brand kit");
      }),
      create: mutatingProcedure.input(brandKitInputSchema).mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        const id = await createBrandKit({ userId: ctx.user.id, workspaceId: scope.workspaceId, ...input });
        return { success: true, id };
      }),
      update: mutatingProcedure
        .input(z.object({ id: z.number().int().positive(), data: brandKitUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
          const updated = await updateBrandKit(getScope(ctx.user), input.id, input.data);
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Brand kit not found" });
          return { success: true } as const;
        }),
      delete: mutatingProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input }) => {
          const deleted = await deleteBrandKit(getScope(ctx.user), input);
          if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Brand kit not found" });
          return { success: true } as const;
        }),
    }),

    designs: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getDesignsByScope(getScope(ctx.user));
      }),
      getById: protectedProcedure.input(z.number().int().positive()).query(async ({ ctx, input }) => {
        return assertFound(await getDesignById(getScope(ctx.user), input), "Design");
      }),
      create: mutatingProcedure.input(designInputSchema).mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        const id = await createDesign({ userId: ctx.user.id, workspaceId: scope.workspaceId, ...input });
        return { success: true, id };
      }),
    }),

    socialMediaPosts: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getSocialMediaPostsByScope(getScope(ctx.user));
      }),
      getById: protectedProcedure.input(z.number().int().positive()).query(async ({ ctx, input }) => {
        return assertFound(await getSocialMediaPostById(getScope(ctx.user), input), "Social post");
      }),
      create: mutatingProcedure
        .input(socialMediaPostInputSchema)
        .mutation(async ({ ctx, input }) => {
          const scope = getScope(ctx.user);
          await assertPlanCapacity(scope, "socialPosts", async () => {
            const posts = await getSocialMediaPostsByScope(scope);
            return posts.length;
          });
          const status = input.status ?? "queued";
          const platforms = input.platforms ?? [];
          const id = await createSocialMediaPost({
            userId: ctx.user.id,
            workspaceId: scope.workspaceId,
            ...input,
            status,
            platformStatuses: input.platformStatuses ?? buildPlatformStatuses(platforms, status),
          });
          return { success: true, id } as const;
        }),
      update: mutatingProcedure
        .input(z.object({ id: z.number().int().positive(), data: socialMediaPostUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
          const data = { ...input.data, platformStatuses:
              input.data.platformStatuses ??
              (input.data.platforms ? buildPlatformStatuses(input.data.platforms, input.data.status ?? "scheduled") : undefined),
          };
          const updated = await updateSocialMediaPost(getScope(ctx.user), input.id, data);
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Social post not found" });
          if (data.status === "failed") {
            await createScopedNotification(
              { user: ctx.user },
              {
                type: "engagement",
                title: "Post publishing failed",
                message: `A scheduled social post failed to publish.`,
                entityType: "socialPost",
                entityId: input.id,
                preferenceKey: "publishFailure",
              }
            );
          }
          return { success: true } as const;
        }),
      delete: mutatingProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input }) => {
          const deleted = await deleteSocialMediaPost(getScope(ctx.user), input);
          if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Social post not found" });
          return { success: true } as const;
        }),
      engagement: protectedProcedure.query(async ({ ctx }) => {
        return getEngagementMetricsByScope(getScope(ctx.user));
      }),
    }),
  }),

  ai: router({
    generateCaption: protectedProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const scope = getScope(ctx.user);
        const db = await import("./db.js");
        const llm = await import("./_core/llm.js");
        const property = assertFound(await db.getPropertyById(scope, input.propertyId), "Property");

        // 1. Enforce active status and AI limit
        await assertPlanCapacity(scope, "aiCaptions", async () => {
          const ws = await db.getWorkspaceById(scope.workspaceId);
          return ws?.aiCaptionsCount ?? 0;
        });

        // 2. Build prompt
        const prompt = `Generate a compelling real estate social media caption for the following property:
Title: ${property.title}
Address: ${property.address}, ${property.city}
Price: ETB ${property.price}
Bedrooms: ${property.bedrooms}
Bathrooms: ${property.bathrooms}
Description: ${property.description || "N/A"}

The caption should be engaging, professional, and include relevant hashtags for the Ethiopian market.`;

        // 3. Invoke LLM
        const result = await llm.invokeLLM({
          messages: [
            { role: "system", content: "You are a professional real estate marketing assistant in Ethiopia." },
            { role: "user", content: prompt }
          ],
        });

        const caption = result.choices[0].message.content;
        if (typeof caption !== "string") {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate caption" });
        }

        // 4. Increment usage counter atomically
        await db.incrementWorkspaceAiCaptionsCount(scope.workspaceId);

        return { caption };
      }),
  }),
});

export type AppRouter = typeof appRouter;
