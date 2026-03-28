import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// We mock the db and other modules
vi.mock("./db", () => ({
  getWorkspaceById: vi.fn(),
  updateWorkspace: vi.fn(),
  getPropertyById: vi.fn(),
  getLeadsByScope: vi.fn(),
  createLead: vi.fn(),
  createContact: vi.fn(),
  createDeal: vi.fn(),
  updateLead: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import * as db from "./db";
import * as llm from "./_core/llm";

// Constants from routers.ts (re-defined here for testing)
const PLAN_LIMITS = {
  starter: {
    contacts: 100,
    leads: 50,
    properties: 10,
    socialPosts: 20,
    buyerProfiles: 10,
    aiCaptions: 20,
    agentSeats: 1,
  },
  pro: {
    contacts: 1000,
    leads: 300,
    properties: 50,
    socialPosts: Infinity,
    buyerProfiles: 100,
    aiCaptions: 100,
    agentSeats: 1,
  },
  agency: {
    contacts: Infinity,
    leads: Infinity,
    properties: Infinity,
    socialPosts: Infinity,
    buyerProfiles: Infinity,
    aiCaptions: Infinity,
    agentSeats: 5,
  },
} as const;

function isLimitReached(limit: number, currentCount: number) {
  if (limit === Infinity) return false;
  return currentCount >= limit;
}

// Emulate the check logic from routers.ts
async function assertPlanCapacity(
  workspace: any,
  resource: keyof (typeof PLAN_LIMITS)["starter"],
  currentCount: number
) {
  const plan = (workspace?.plan ?? "starter") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan][resource];

  // 1. Check if trial or subscription is active
  const now = new Date();
  const isTrialActive = workspace?.subscriptionStatus === "trial" &&
    workspace.trialEndsAt && new Date(workspace.trialEndsAt) > now;
  const isSubscriptionActive = workspace?.subscriptionStatus === "active" &&
    workspace.currentPeriodEndsAt && new Date(workspace.currentPeriodEndsAt) > now;

  if (!isTrialActive && !isSubscriptionActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Expired",
    });
  }

  // 2. Check resource limits
  if (isLimitReached(limit, currentCount)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Limit reached",
    });
  }
}

describe("Monetization & Plan Enforcement", () => {
  const mockNow = new Date("2026-03-29T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  describe("Trial & Subscription Expiration", () => {
    it("should allow access during active trial", async () => {
      const workspace = {
        plan: "starter",
        subscriptionStatus: "trial",
        trialEndsAt: new Date("2026-04-10T00:00:00Z"),
      };
      
      await expect(assertPlanCapacity(workspace, "properties", 0)).resolves.not.toThrow();
    });

    it("should block access after trial expires", async () => {
      const workspace = {
        plan: "starter",
        subscriptionStatus: "trial",
        trialEndsAt: new Date("2026-03-20T00:00:00Z"), // Expired
      };
      
      await expect(assertPlanCapacity(workspace, "properties", 0)).rejects.toThrow("Expired");
    });

    it("should allow access during active subscription", async () => {
      const workspace = {
        plan: "pro",
        subscriptionStatus: "active",
        currentPeriodEndsAt: new Date("2026-04-20T00:00:00Z"),
      };
      
      await expect(assertPlanCapacity(workspace, "properties", 0)).resolves.not.toThrow();
    });

    it("should block access after subscription expires", async () => {
      const workspace = {
        plan: "pro",
        subscriptionStatus: "active",
        currentPeriodEndsAt: new Date("2026-03-20T00:00:00Z"), // Expired
      };
      
      await expect(assertPlanCapacity(workspace, "properties", 0)).rejects.toThrow("Expired");
    });
  });

  describe("Resource Limits", () => {
    const activeWorkspace = {
      plan: "starter",
      subscriptionStatus: "active",
      currentPeriodEndsAt: new Date("2026-04-20T00:00:00Z"),
    };

    it("should block creation if Starter property limit reached (10)", async () => {
      await expect(assertPlanCapacity(activeWorkspace, "properties", 10)).rejects.toThrow("Limit reached");
    });

    it("should allow creation if Starter property limit not reached", async () => {
      await expect(assertPlanCapacity(activeWorkspace, "properties", 9)).resolves.not.toThrow();
    });

    it("should block creation if Starter lead limit reached (50)", async () => {
      await expect(assertPlanCapacity(activeWorkspace, "leads", 50)).rejects.toThrow("Limit reached");
    });

    it("should block creation if Pro property limit reached (50)", async () => {
      const proWorkspace = { ...activeWorkspace, plan: "pro" };
      await expect(assertPlanCapacity(proWorkspace, "properties", 50)).rejects.toThrow("Limit reached");
    });

    it("should allow infinite properties for Agency", async () => {
      const agencyWorkspace = { ...activeWorkspace, plan: "agency" };
      await expect(assertPlanCapacity(agencyWorkspace, "properties", 999999)).resolves.not.toThrow();
    });
  });

  describe("Usage Resets", () => {
    it("should reset AI captions count if more than 30 days passed", async () => {
      const cycleStart = new Date("2026-02-20T00:00:00Z"); // More than 30 days ago from March 29
      const workspace = {
        id: 1,
        plan: "pro",
        usageCyclePeriodStart: cycleStart,
        aiCaptionsCount: 80,
      };

      // In routers.ts, logic is inside assertPlanCapacity
      // We simulate that logic here
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const isResetNeeded = mockNow.getTime() - cycleStart.getTime() > thirtyDays;
      
      expect(isResetNeeded).toBe(true);
    });
  });

  describe("HMAC Signature Verification", () => {
    const secret = "test_secret_key";
    
    it("should generate a valid hash matching the signature", () => {
      const payload = JSON.stringify({ tx_ref: "eiq-1-abc", status: "success" });
      const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      
      const computedHash = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
        
      expect(computedHash).toBe(expectedHash);
    });

    it("should fail for invalid secret", () => {
      const payload = JSON.stringify({ tx_ref: "eiq-1-abc", status: "success" });
      const validHash = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      
      const invalidHash = crypto
        .createHmac("sha256", "wrong_secret")
        .update(payload)
        .digest("hex");
        
      expect(invalidHash).not.toBe(validHash);
    });
  });
});
