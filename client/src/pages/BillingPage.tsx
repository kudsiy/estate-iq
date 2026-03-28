import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  const utils = trpc.useUtils();
  const { data: plans = [] } = trpc.subscription.plans.useQuery();
  const { data: current } = trpc.subscription.current.useQuery();
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // For the mock, we can just redirect. In production, this would be a real link.
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => toast.error(error.message || "Failed to start checkout"),
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upgrade your workspace to unlock more listings, leads, and AI features.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current plan</CardTitle>
            <CardDescription className="text-xs">
              {current?.isActive 
                ? `Your ${current.plan} plan is active.` 
                : "Your trial or subscription has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground capitalize">{current?.workspace?.plan ?? "starter"}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {current?.workspace?.subscriptionStatus ?? "trial"} 
                  {current?.daysRemaining !== undefined && ` • ${current.daysRemaining} days left`}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Listings: {current?.usage.properties ?? 0} / {current?.limits.properties === Infinity ? "∞" : current?.limits.properties}</p>
              <p>Leads: {current?.usage.leads ?? 0} / {current?.limits.leads === Infinity ? "∞" : current?.limits.leads}</p>
              <p>AI Captions: {current?.usage.aiCaptions ?? 0} / {current?.limits.aiCaptions === Infinity ? "∞" : current?.limits.aiCaptions}</p>
              <p>Social posts: {current?.usage.socialPosts ?? 0} / {current?.limits.socialPosts === Infinity ? "∞" : current?.limits.socialPosts}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:col-span-2">
          {plans.map((plan) => (
            <Card key={plan.key} className={`border ${current?.plan === plan.key ? "border-accent" : "border-border"}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">
                      ETB {plan.priceMonthly}/month
                    </CardDescription>
                  </div>
                  {current?.plan === plan.key ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">Active</span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                  <p>Listings: {Number.isFinite(plan.limits.properties) ? plan.limits.properties : "Unlimited"}</p>
                  <p>Leads: {Number.isFinite(plan.limits.leads) ? plan.limits.leads : "Unlimited"}</p>
                  <p>AI Captions: {Number.isFinite(plan.limits.aiCaptions) ? plan.limits.aiCaptions : "Unlimited"}</p>
                  <p>Contacts: {Number.isFinite(plan.limits.contacts) ? plan.limits.contacts : "Unlimited"}</p>
                </div>
                <Button
                  className="bg-accent text-white hover:bg-accent/90 shrink-0"
                  disabled={current?.plan === plan.key || checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate({ plan: plan.key as any })}
                >
                  {checkoutMutation.isPending ? "Processing..." : current?.plan === plan.key ? "Current plan" : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
