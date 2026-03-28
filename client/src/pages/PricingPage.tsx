import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function PricingPage() {
  const { data: plans = [] } = trpc.subscription.plans.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground">Pricing</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Workspace plans for growing real estate teams, from solo agents to scaled agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.key} className="border border-border">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  14-day full access included
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold text-foreground">
                  ETB {plan.priceMonthly}
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Contacts: {Number.isFinite(plan.limits.contacts) ? plan.limits.contacts : "Unlimited"}</p>
                  <p>Properties: {Number.isFinite(plan.limits.properties) ? plan.limits.properties : "Unlimited"}</p>
                  <p>Social posts: {Number.isFinite(plan.limits.socialPosts) ? plan.limits.socialPosts : "Unlimited"}</p>
                  <p>Buyer profiles: {Number.isFinite(plan.limits.buyerProfiles) ? plan.limits.buyerProfiles : "Unlimited"}</p>
                </div>
                <a href={getLoginUrl("/billing")}>
                  <Button className="w-full bg-accent text-white hover:bg-accent/90">Choose {plan.name}</Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
