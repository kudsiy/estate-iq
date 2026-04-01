import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditCard, Star, Zap, TrendingUp, AlertTriangle, Check, Info, ArrowUpRight, Layout, Activity, Sparkles, Image as ImageIcon, Video } from "lucide-react";
import { motion } from "framer-motion";

export default function BillingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const utils = trpc.useUtils();
  const { data: plans = [] } = trpc.subscription.plans.useQuery();
  const { data: usage, isLoading } = trpc.billing.getUsage.useQuery();
  
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data: any) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: any) => toast.error(error.message || "Failed to start checkout"),
  });

  const isTrial = usage?.status === "trial";
  const planName = usage?.plan ?? "starter";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription. All prices in ETB.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Status & Usage */}
        <div className="xl:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[2.5rem] bg-[#151518] border border-white/5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                        <Zap className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold tracking-tight capitalize">{planName} Plan</h2>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                           {isTrial ? 'Free Trial Period' : 'Subscription Active'}
                        </p>
                     </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                     <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xs font-bold text-green-500 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                           Operational
                        </p>
                     </div>
                     <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Auto-Renew</p>
                        <p className="text-xs font-bold text-white italic">Active (Telebirr)</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-6 min-w-[280px]">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Resource Consumption</h3>
                  <div className="space-y-5">
                    {[
                      { label: "AI Captions", icon: Sparkles, used: usage?.captions ?? 0, limit: usage?.limits.captions },
                      { label: "AI Images", icon: ImageIcon, used: usage?.images ?? 0, limit: usage?.limits.images },
                      { label: "Creative Reels", icon: Video, used: usage?.reels ?? 0, limit: usage?.limits.reels },
                    ].map((m) => {
                      const pct = Math.min((m.used / (m.limit || 1)) * 100, 100);
                      return (
                        <div key={m.label} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2 text-white/60">
                               <m.icon className="w-3 h-3" />
                               <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                            </div>
                            <span className="text-xs font-bold">{m.used} <span className="text-white/20 font-light">/ {m.limit}</span></span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${pct}%` }}
                               className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-accent'}`} 
                             />
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="bg-[#151518] border-white/5 rounded-[2rem] p-8 shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <TrendingUp className="w-24 h-24" />
                </div>
                <h3 className="text-lg font-bold mb-2">Revenue ROI</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6">Commission Impact</p>
                <p className="text-white/60 text-sm leading-relaxed mb-6 italic font-light">
                   One mid-range deal (ETB 60k+) covers <strong>5 years</strong> of Pro membership. Your platform is paid for within the first conversion.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-accent">
                   <Activity className="w-4 h-4" /> Calculate Growth potential
                </div>
             </Card>

             <Card className="bg-accent/10 border-accent/20 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/20 blur-[40px] rounded-full" />
                <h3 className="text-lg font-bold mb-2 text-accent">Pro Features Locked</h3>
                <p className="text-accent/60 text-[10px] font-black uppercase tracking-widest mb-6">Upgrade required</p>
                <ul className="space-y-3 mb-8">
                   {['Instagram Auto-Posting', 'Bulk AI Image Generation', 'Agency Multi-Seat Control'].map(f => (
                     <li key={f} className="flex items-center gap-2 text-[11px] font-bold text-white/50">
                        <Check className="w-3.5 h-3.5 text-accent" /> {f}
                     </li>
                   ))}
                </ul>
                <Button className="w-full bg-accent text-white hover:bg-accent/90 rounded-xl h-12 font-black uppercase tracking-widest text-[10px]">
                   Unlock Pro Now
                </Button>
             </Card>
          </div>
        </div>

        {/* Right Sidebar - Pricing Simple */}
        <div className="xl:col-span-4 space-y-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Available Tiers</h3>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Yearly</span>
                 <button onClick={() => setIsYearly(!isYearly)} className={`w-8 h-4 rounded-full relative transition-colors ${isYearly ? 'bg-accent' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isYearly ? 'right-0.5' : 'left-0.5'}`} />
                 </button>
              </div>
           </div>

           <div className="space-y-4">
              {plans.map(plan => (
                <motion.div 
                  key={plan.key}
                  whileHover={{ x: 4 }}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                    plan.key === planName 
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-white'
                  }`}
                >
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <h4 className="font-bold text-sm tracking-tight">{plan.name}</h4>
                         <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest">
                            {(plan as any).tagline}
                         </p>
                      </div>
                      {plan.key === planName && <Check className="w-4 h-4" />}
                   </div>
                   <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black">ETB {isYearly ? (plan as any).monthlyEquivalent?.toLocaleString() : plan.priceMonthly?.toLocaleString()}</span>
                      <span className="text-[10px] font-bold opacity-30 uppercase">/mo</span>
                   </div>
                   
                   {plan.key !== planName && (
                     <Button 
                       className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border-0 shadow-none rounded-xl text-[10px] font-black uppercase tracking-widest h-10"
                       onClick={() => checkoutMutation.mutate({ plan: plan.key as any })}
                       disabled={checkoutMutation.isPending}
                     >
                        Upgrade
                     </Button>
                   )}
                </motion.div>
              ))}
           </div>

           <div className="p-6 rounded-3xl bg-[#1a1a1e] border border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Secured Payments</h4>
              <div className="flex gap-3 opacity-30 grayscale hover:grayscale-0 transition-all cursor-pointer">
                 {/* Mock Payment provider visual */}
                 <div className="h-6 w-10 bg-white/20 rounded flex items-center justify-center text-[8px] font-black italic">CHAPA</div>
                 <div className="h-6 w-10 bg-white/20 rounded flex items-center justify-center text-[8px] font-black italic">CBE</div>
                 <div className="h-6 w-10 bg-white/20 rounded flex items-center justify-center text-[8px] font-black italic">BIRR</div>
              </div>
           </div>
        </div>
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
