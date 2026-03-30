import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditCard, Star, Zap, TrendingUp, AlertTriangle, Check } from "lucide-react";

export default function BillingPage() {
  const [isYearly, setIsYearly] = useState(true); // Push yearly per strategy
  const utils = trpc.useUtils();
  const { data: plans = [] } = trpc.subscription.plans.useQuery();
  const { data: current } = trpc.subscription.current.useQuery();
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => toast.error(error.message || "Failed to start checkout"),
  });

  const isTrial = current?.workspace?.subscriptionStatus === "trial";
  const isExpired = current && !current.isActive;
  const isGrace = current?.isGracePeriod;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription. All prices in ETB.
        </p>
      </div>

      {/* Current plan status */}
      <Card className="border border-border mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-foreground capitalize">
                    {current?.workspace?.plan ?? "starter"} Plan
                  </p>
                  {isTrial && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      TRIAL
                    </span>
                  )}
                  {isGrace && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      GRACE PERIOD
                    </span>
                  )}
                  {!isTrial && current?.isActive && !isGrace && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {current?.daysRemaining !== undefined && current.daysRemaining > 0
                    ? `${current.daysRemaining} days remaining`
                    : isExpired
                      ? "Expired — upgrade to continue"
                      : "Active subscription"}
                </p>
              </div>
            </div>
            
            {/* Usage meters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: "Listings", used: current?.usage.properties ?? 0, limit: current?.limits.properties },
                { label: "Leads", used: current?.usage.leads ?? 0, limit: current?.limits.leads },
                { label: "AI Captions", used: current?.usage.aiCaptions ?? 0, limit: current?.limits.aiCaptions },
                { label: "Contacts", used: current?.usage.contacts ?? 0, limit: current?.limits.contacts },
              ].map((meter) => (
                <div key={meter.label} className="px-3 py-2 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">{meter.label}</p>
                  <p className="text-base font-bold text-foreground">
                    {meter.used} <span className="text-muted-foreground font-normal text-xs">
                      / {meter.limit === Infinity ? "∞" : meter.limit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grace period / expired alert */}
      {(isExpired || isGrace) && (
        <div className={`rounded-xl p-4 mb-6 border-2 flex items-start gap-3 ${
          isGrace 
            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" 
            : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
        }`}>
          <AlertTriangle className={`h-5 w-5 mt-0.5 ${isGrace ? "text-amber-600" : "text-red-600"}`} />
          <div>
            <p className={`text-sm font-semibold ${isGrace ? "text-amber-800 dark:text-amber-300" : "text-red-800 dark:text-red-300"}`}>
              {isGrace 
                ? `Grace period active — Upgrade within ${current?.gracePeriodDays} days to keep your data.`
                : `Your ${current?.usage.leads ?? 0} leads and ${current?.usage.properties ?? 0} listings are locked.`}
            </p>
            <p className={`text-xs mt-1 ${isGrace ? "text-amber-700/80" : "text-red-700/80"}`}>
              {isGrace
                ? "Your account is read-only during the grace period. Upgrade to unlock full access."
                : "Upgrade now to instantly unlock everything. Your data is saved."}
            </p>
          </div>
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={`relative h-7 w-14 rounded-full transition-colors ${
            isYearly ? "bg-accent" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isYearly ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
          Yearly
        </span>
        {isYearly && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Save up to 42%
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = current?.plan === plan.key;
          const isFeatured = (plan as any).featured;
          const price = isYearly ? (plan as any).priceYearly : plan.priceMonthly;
          const savings = (plan as any).yearlySavings;
          const monthlyEquiv = (plan as any).monthlyEquivalent;

          return (
            <Card 
              key={plan.key} 
              className={`relative border-2 transition-all ${
                isCurrent ? "border-accent bg-accent/[0.02]" : isFeatured ? "border-accent/50" : "border-border"
              }`}
            >
              {isFeatured && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3" /> BEST VALUE
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3" /> CURRENT
                  </span>
                </div>
              )}

              <CardHeader className="pb-1 pt-5">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <CardDescription className="text-xs">{(plan as any).tagline}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">ETB</span>
                    <span className="text-3xl font-black text-foreground">
                      {isYearly ? monthlyEquiv?.toLocaleString() : price?.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                  {isYearly && (
                    <p className="text-xs font-semibold text-green-600 mt-1">
                      Save ETB {savings?.toLocaleString()}/year
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p>Listings: {Number.isFinite(plan.limits.properties) ? plan.limits.properties : "∞"}</p>
                  <p>Deals: {Number.isFinite(plan.limits.deals) ? plan.limits.deals : "∞"}</p>
                  <p>AI Captions: {Number.isFinite(plan.limits.aiCaptions) ? plan.limits.aiCaptions : "∞"}</p>
                  <p>AI Images: {Number.isFinite(plan.limits.aiImages) ? plan.limits.aiImages + "/mo" : "∞"}</p>
                </div>

                <Button
                  className={`w-full font-semibold ${
                    isFeatured && !isCurrent
                      ? "bg-accent text-white hover:bg-accent/90"
                      : ""
                  }`}
                  variant={isCurrent ? "outline" : isFeatured ? "default" : "outline"}
                  disabled={isCurrent || checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate({ plan: plan.key as any })}
                >
                  {checkoutMutation.isPending 
                    ? "Processing..." 
                    : isCurrent 
                      ? "Current Plan" 
                      : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment help */}
      <div className="mt-8 rounded-xl border border-border p-5 bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground mb-2">Payment Help</h3>
        <p className="text-xs text-muted-foreground">
          We accept <strong>Telebirr</strong>, <strong>CBE Birr</strong>, <strong>Amole</strong>, and <strong>Visa/Mastercard</strong> via Chapa. 
          If you have trouble paying, send a screenshot of your payment to our WhatsApp support and we'll activate your account manually.
        </p>
      </div>
    </DashboardLayout>
  );
}
