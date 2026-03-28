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
  const updateMutation = trpc.subscription.update.useMutation({
    onSuccess: async () => {
      await utils.subscription.current.invalidate();
      toast.success("Plan updated");
    },
    onError: (error) => toast.error(error.message || "Failed to update plan"),
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace plan, trial state, and current usage against plan limits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current plan</CardTitle>
            <CardDescription className="text-xs">Stored on your workspace and ready for future payment integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground capitalize">{current?.workspace?.plan ?? "starter"}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{current?.workspace?.subscriptionStatus ?? "trial"}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Contacts used: {current?.usage.contacts ?? 0}</p>
              <p>Properties used: {current?.usage.properties ?? 0}</p>
              <p>Social posts used: {current?.usage.socialPosts ?? 0}</p>
              <p>Buyer profiles used: {current?.usage.buyerProfiles ?? 0}</p>
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
                      Stored plan price: ETB {plan.priceMonthly}/month
                    </CardDescription>
                  </div>
                  {current?.plan === plan.key ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">Current</span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <p>Contacts: {Number.isFinite(plan.limits.contacts) ? plan.limits.contacts : "Unlimited"}</p>
                  <p>Properties: {Number.isFinite(plan.limits.properties) ? plan.limits.properties : "Unlimited"}</p>
                  <p>Social posts: {Number.isFinite(plan.limits.socialPosts) ? plan.limits.socialPosts : "Unlimited"}</p>
                  <p>Buyer profiles: {Number.isFinite(plan.limits.buyerProfiles) ? plan.limits.buyerProfiles : "Unlimited"}</p>
                </div>
                <Button
                  className="bg-accent text-white hover:bg-accent/90"
                  disabled={current?.plan === plan.key || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ plan: plan.key, subscriptionStatus: plan.key === "starter" ? "trial" : "active" })}
                >
                  {current?.plan === plan.key ? "Current plan" : `Switch to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
