import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Check, X, Star, TrendingUp, Zap } from "lucide-react";

const FEATURES = [
  { label: "Active listings", starter: "10", pro: "Unlimited", agency: "Unlimited" },
  { label: "Tracking links + lead capture", starter: true, pro: true, agency: true },
  { label: "CRM pipeline", starter: "50 deals", pro: "Unlimited", agency: "Unlimited" },
  { label: "AI caption generation", starter: "20/mo", pro: "Unlimited", agency: "Unlimited" },
  { label: "AI image & ad generation", starter: false, pro: "30/mo", agency: "100/mo" },
  { label: "AI rebrand supplier images", starter: false, pro: true, agency: true },
  { label: "Telegram posting", starter: "Manual", pro: "Auto", agency: "Auto" },
  { label: "Scheduled posting", starter: false, pro: true, agency: true },
  { label: "Post history & tracking", starter: false, pro: true, agency: true },
  { label: "Analytics dashboard", starter: false, pro: true, agency: true },
  { label: "Lead scoring", starter: false, pro: true, agency: true },
  { label: "Instagram & Facebook posting", starter: false, pro: false, agency: true },
  { label: "Agent seats", starter: "1", pro: "1", agency: "Up to 5" },
  { label: "Shared listing pool", starter: false, pro: false, agency: true },
  { label: "Supplier feed access", starter: false, pro: false, agency: true },
  { label: "Matching engine", starter: false, pro: false, agency: true },
  { label: "WhatsApp support", starter: false, pro: true, agency: true },
  { label: "Dedicated onboarding call", starter: false, pro: false, agency: true },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-green-600 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm text-foreground font-medium">{value}</span>;
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true); // Push yearly first per strategy
  const { data: plans = [] } = trpc.subscription.plans.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Built for Ethiopian real estate agents. All prices in ETB. 
            Start with a 14-day full access period — no payment required.
          </p>
        </div>

        {/* ROI box */}
        <div className="max-w-xl mx-auto mb-8 rounded-xl bg-accent/5 border border-accent/20 p-4 text-center">
          <p className="text-sm text-foreground">
            <TrendingUp className="w-4 h-4 inline mr-1 text-accent" />
            <strong>One mid-range deal = ETB 60,000–180,000 commission.</strong>{" "}
            Estate IQ Pro costs <strong>less than 2%</strong> of a single deal.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-16 px-4">
          {plans.map((plan) => {
            const isFeatured = (plan as any).featured || plan.key === 'pro';
            const price = isYearly ? (plan as any).priceYearly : plan.priceMonthly;
            const savings = (plan as any).yearlySavings;
            const monthlyEquiv = (plan as any).monthlyEquivalent;

            return (
              <motion.div 
                key={plan.key}
                whileHover={{ y: -10 }}
                className={`relative flex flex-col p-8 rounded-[2rem] transition-all duration-500 ${
                  isFeatured 
                    ? "bg-foreground text-background shadow-2xl scale-105 z-10" 
                    : "bg-white/5 border border-white/10 hover:border-accent/30 text-white"
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-accent/40">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                   <h3 className="text-2xl font-bold tracking-tight mb-2">{plan.name}</h3>
                   <p className={`text-xs font-medium uppercase tracking-widest ${isFeatured ? 'text-background/60' : 'text-white/40'}`}>
                      {(plan as any).tagline || 'Essential tools for growth'}
                   </p>
                </div>

                <div className="mb-8">
                   <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black tracking-tighter">
                         ETB {isYearly ? monthlyEquiv?.toLocaleString() : price?.toLocaleString()}
                      </span>
                      <span className={`text-xs font-bold ${isFeatured ? 'text-background/40' : 'text-white/30'}`}>/month</span>
                   </div>
                   {isYearly && (
                     <p className={`text-[10px] font-bold mt-2 ${isFeatured ? 'text-accent' : 'text-accent'}`}>
                        Billed annually (ETB {price?.toLocaleString()})
                     </p>
                   )}
                </div>

                <div className="flex-1 space-y-4 mb-10">
                   {FEATURES.map((f, i) => {
                      const val = f[plan.key as keyof typeof f];
                      return (
                        <div key={i} className="flex items-start gap-3">
                           <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                             val === true ? 'bg-accent/20' : 'bg-white/5'
                           }`}>
                              {val === true ? (
                                <Check className={`w-3 h-3 ${isFeatured ? 'text-background' : 'text-accent'}`} />
                              ) : val === false ? (
                                <X className="w-3 h-3 text-white/10" />
                              ) : (
                                <div className="w-1 h-1 bg-accent rounded-full" />
                              )}
                           </div>
                           <span className={`text-[11px] font-medium leading-tight ${isFeatured ? 'text-background/80' : 'text-white/60'}`}>
                              {typeof val === 'string' ? `${val} ${f.label}` : f.label}
                           </span>
                        </div>
                      );
                   })}
                </div>

                <Button 
                   className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all active:scale-95 border-b-4 ${
                     isFeatured 
                       ? "bg-accent hover:bg-accent/90 text-white border-black/20" 
                       : "bg-white/10 hover:bg-white/20 text-white border-white/5"
                   }`}
                   onClick={() => window.location.href = getLoginUrl("/billing")}
                >
                   {plan.key === 'agency' ? 'Contact Sales' : `Start ${plan.name} Trial`}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Detailed feature comparison */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Compare all features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="py-3 px-4 text-sm font-semibold text-foreground w-[40%]">Feature</th>
                  <th className="py-3 px-4 text-sm font-semibold text-center w-[20%]">
                    Starter
                    <span className="block text-xs font-normal text-muted-foreground">ETB 499/mo</span>
                  </th>
                  <th className="py-3 px-4 text-sm font-semibold text-center w-[20%] text-accent">
                    Pro ⭐
                    <span className="block text-xs font-normal text-muted-foreground">ETB 999/mo</span>
                  </th>
                  <th className="py-3 px-4 text-sm font-semibold text-center w-[20%]">
                    Agency
                    <span className="block text-xs font-normal text-muted-foreground">ETB 2,499/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 text-sm text-foreground">{feature.label}</td>
                    <td className="py-2.5 px-4 text-center"><FeatureCell value={feature.starter} /></td>
                    <td className="py-2.5 px-4 text-center bg-accent/[0.02]"><FeatureCell value={feature.pro} /></td>
                    <td className="py-2.5 px-4 text-center"><FeatureCell value={feature.agency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-12 rounded-2xl bg-foreground/[0.02] border border-border">
          <h3 className="text-xl font-bold text-foreground mb-2">Ready to grow your pipeline?</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Start your 14-day full access period. No payment required. 
            See real leads come in before you commit.
          </p>
          <a href={getLoginUrl("/billing")}>
            <Button size="lg" className="bg-accent text-white hover:bg-accent/90 font-semibold px-8">
              Start Free Trial
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
