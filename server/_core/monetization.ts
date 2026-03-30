// ── Grace period: 3 days after expiry before full lockout ──
export const GRACE_PERIOD_DAYS = 3;

export const PLAN_LIMITS = {
  starter: {
    contacts: 100,
    deals: 50,
    leads: 50,
    properties: 10,
    photosPerListing: 5,
    socialPosts: 20,
    buyerProfiles: 10,
    aiCaptions: 20,
    aiImages: 0,
    agentSeats: 1,
  },
  pro: {
    contacts: Infinity,
    deals: Infinity,
    leads: 300,
    properties: Infinity,
    photosPerListing: 20,
    socialPosts: Infinity,
    buyerProfiles: 100,
    aiCaptions: Infinity,
    aiImages: 30,
    agentSeats: 1,
  },
  agency: {
    contacts: Infinity,
    deals: Infinity,
    leads: Infinity,
    properties: Infinity,
    photosPerListing: Infinity,
    socialPosts: Infinity,
    buyerProfiles: Infinity,
    aiCaptions: Infinity,
    aiImages: 100,
    agentSeats: 5,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

// ── ETB Pricing (psychological 9-endings) ──
export const PLAN_PRICES = {
  starter: { monthly: 499, yearly: 3493 },
  pro:     { monthly: 999, yearly: 6993 },
  agency:  { monthly: 2499, yearly: 17493 },
} as const;

// Yearly savings in ETB (for display)
export const YEARLY_SAVINGS = {
  starter: 499 * 12 - 3493,  // 2,495 ETB
  pro:     999 * 12 - 6993,  // 4,995 ETB
  agency:  2499 * 12 - 17493, // 12,495 ETB
} as const;

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
  const graceMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

  const isTrialActive = workspace.subscriptionStatus === "trial" &&
    workspace.trialEndsAt && new Date(workspace.trialEndsAt).getTime() + graceMs > now.getTime();
  const isPaidActive = workspace.subscriptionStatus === "active" &&
    workspace.currentPeriodEndsAt && new Date(workspace.currentPeriodEndsAt).getTime() + graceMs > now.getTime();
  
  return !!(isTrialActive || isPaidActive);
}

/** Check if user is past official expiry but still within grace window */
export function isInGracePeriod(workspace: {
  subscriptionStatus: "trial" | "active" | "past_due" | "canceled";
  trialEndsAt?: Date | null;
  currentPeriodEndsAt?: Date | null;
}) {
  const now = new Date();
  const graceMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

  const expiryDate = workspace.subscriptionStatus === "trial"
    ? workspace.trialEndsAt
    : workspace.currentPeriodEndsAt;

  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  return now > expiry && now.getTime() <= expiry.getTime() + graceMs;
}
