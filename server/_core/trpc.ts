import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

const requireActivePlan = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user?.workspaceId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Workspace required" });
  }

  // Import locally to avoid circular dependency
  const { getWorkspaceById } = await import("../db.js");
  const workspace = await getWorkspaceById(ctx.user.workspaceId);

  if (!workspace) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Workspace not found" });
  }

  const now = new Date();
  
  // Check if trial is active
  const isTrialActive = workspace.subscriptionStatus === "trial" && 
    workspace.trialEndsAt && 
    new Date(workspace.trialEndsAt) > now;

  // Check if standard subscription is active
  const isSubscriptionActive = workspace.subscriptionStatus === "active" && 
    workspace.currentPeriodEndsAt && 
    new Date(workspace.currentPeriodEndsAt) > now;

  // In Ethiopian strategy, no freemium. Expired = locked from mutating.
  if (!isTrialActive && !isSubscriptionActive) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Your trial or subscription has expired. Please upgrade to continue." 
    });
  }

  // ── Monthly usage counter reset (inline, no cron needed) ──
  // If 30+ days have passed since the usage cycle started, reset AI counters.
  let freshWorkspace = workspace;
  if (workspace.usageCyclePeriodStart) {
    const cycleStart = new Date(workspace.usageCyclePeriodStart);
    const cycleEnd = new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (now >= cycleEnd) {
      const { updateWorkspace } = await import("../db.js");
      await updateWorkspace(workspace.id, {
        aiCaptionsCount: 0,
        aiImagesCount: 0,
        usageCyclePeriodStart: now,
      });
      freshWorkspace = { ...workspace, aiCaptionsCount: 0, aiImagesCount: 0, usageCyclePeriodStart: now };
    }
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user as NonNullable<typeof ctx.user>,
      workspace: freshWorkspace,
    },
  });
});

export const mutatingProcedure = t.procedure.use(requireUser).use(requireActivePlan);

