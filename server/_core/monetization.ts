export const PLAN_LIMITS = {
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

export type Plan = keyof typeof PLAN_LIMITS;

export function isLimitReached(limit: number, currentCount: number) {
  if (limit === Infinity) return false;
  return currentCount >= limit;
}

export function isSubscriptionActive(workspace: { 
  subscriptionStatus: "trial" | "active" | "past_due" | "canceled"; 
  trialEndsAt?: Date | null; 
  currentPeriodEndsAt?: Date | null; 
}) {
  const now = new Date();
  const isTrialActive = workspace.subscriptionStatus === "trial" &&
    workspace.trialEndsAt && new Date(workspace.trialEndsAt) > now;
  const isPaidActive = workspace.subscriptionStatus === "active" &&
    workspace.currentPeriodEndsAt && new Date(workspace.currentPeriodEndsAt) > now;
  
  return !!(isTrialActive || isPaidActive);
}
