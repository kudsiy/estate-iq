import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditCard, Star, Zap, TrendingUp, AlertTriangle, Check, Info, ArrowUpRight, Layout, Activity, Sparkles, Image as ImageIcon, Video, ShieldCheck, HelpCircle, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "32px",
  boxShadow: theme === "dark" ? "0 25px 50px rgba(0,0,0,0.5)" : "0 15px 20px -5px rgba(0,0,0,0.1)",
});

export default function BillingPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isYearly, setIsYearly] = useState(true);
  const utils = trpc.useUtils();
  const { data: plans = [] } = trpc.subscription.plans.useQuery();
  const { data: usage } = trpc.billing.getUsage.useQuery();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const handleUpgradeClick = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);
  const isTrial = usage?.status === "trial";
  const planName = usage?.plan ?? "starter";

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("bill.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("bill.sub")}</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-2.5 rounded-2xl">
           <ShieldCheck className="w-5 h-5 text-emerald-500" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Manual Activation Model</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Resource Command Center */}
        <div className="xl:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={glassStyle}
            className="p-10 border-0 relative overflow-hidden"
          >
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/20 blur-[120px] rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-12">
               <div className="flex-1 space-y-8">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 bg-accent rounded-[24px] flex items-center justify-center shadow-2xl shadow-accent/40 animate-pulse">
                        <Zap className="w-8 h-8 text-white" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground leading-none mb-2">{planName} Tier</h2>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase tracking-widest bg-accent/20 text-accent px-2 py-0.5 rounded-lg border border-accent/10">
                              {isTrial ? 'Trial Deployment' : t("bill.active")}
                           </span>
                           <span className="text-white/20 text-[9px] font-black uppercase tracking-widest italic pl-2 border-l border-white/10">{t("bill.status")}</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-background/40 rounded-3xl border border-white/5 shadow-xl transition-all hover:bg-background/60">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 italic">Pipeline Status</p>
                        <p className="text-sm font-black text-green-500 flex items-center gap-2 uppercase tracking-tighter italic">
                           <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                           Nominal
                        </p>
                     </div>
                     <div className="p-5 bg-background/40 rounded-3xl border border-white/5 shadow-xl transition-all hover:bg-background/60">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 italic">{t("bill.renew")}</p>
                        <p className="text-sm font-black text-foreground italic uppercase tracking-tighter">Telebirr Sequence</p>
                     </div>
                  </div>
               </div>

               <div className="lg:w-80 p-8 rounded-[32px] bg-background/40 border border-white/5 shadow-2xl space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                     <Activity className="w-4 h-4" /> {t("bill.consumption")}
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: "AI Narratives", icon: Sparkles, used: usage?.captions ?? 0, limit: usage?.limits.captions },
                      { label: "Visual Staging", icon: ImageIcon, used: usage?.images ?? 0, limit: usage?.limits.images },
                      { label: "Cinema Reels", icon: Video, used: usage?.reels ?? 0, limit: usage?.limits.reels },
                    ].map((m) => {
                      const pct = Math.min((m.used / (m.limit || 1)) * 100, 100);
                      return (
                        <div key={m.label} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2 text-foreground/60 transition-colors hover:text-accent cursor-default">
                               <m.icon className="w-3.5 h-3.5" />
                               <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
                            </div>
                            <span className="text-[10px] font-black italic">{m.used} <span className="opacity-20">/ {m.limit}</span></span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${pct}%` }}
                               className={`h-full rounded-full ${pct > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,44,44,0.5)]' : 'bg-accent shadow-[0_0_10px_rgba(249,115,22,0.3)]'}`} 
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
             <div style={glassStyle} className="p-10 border-0 group hover:bg-background/40 transition-all cursor-default relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110">
                   <TrendingUp className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic mb-3">{t("bill.roi")}</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-6">Market Efficiency Leverage</p>
                <p className="text-white/60 text-sm leading-relaxed mb-8 italic font-medium pr-8 uppercase tracking-tight">
                   {t("bill.roiDesc")}
                </p>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-accent">
                   <Activity className="w-4 h-4" /> Calculate Growth Potential
                </div>
             </div>

             <div style={glassStyle} className="p-10 border-0 bg-accent/5 border-accent/10 relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 blur-[60px] rounded-full" />
                <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2 text-accent">Pro Sovereignty</h3>
                <p className="text-accent/60 text-[9px] font-black uppercase tracking-widest mb-8">Access Protocol Required</p>
                <ul className="space-y-4 mb-10">
                   {['Instagram Auto-Pilot Pipeline', 'Unlimited Cinematic 4K Exports', 'Agency Multi-Identity Management'].map(f => (
                     <li key={f} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                        <Check className="w-4 h-4 text-accent" /> {f}
                     </li>
                   ))}
                </ul>
                <Button 
                  onClick={() => handleUpgradeClick({ key: 'pro', name: 'Pro Sovereignty', price: 999 })}
                  className="w-full h-14 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-accent/30 border-b-4 border-black/20 hover:translate-y-px transition-all">
                   Deploy Pro Access Now
                </Button>
             </div>
          </div>
        </div>

        {/* Membership Tiers */}
        <div className="xl:col-span-4 space-y-8">
           <div className="flex items-center justify-between px-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{t("bill.tiers")}</h3>
              <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                 <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-xl transition-all cursor-pointer ${isYearly ? 'bg-accent text-white' : 'text-white/40'}`} onClick={() => setIsYearly(true)}>Yearly</span>
                 <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-xl transition-all cursor-pointer ${!isYearly ? 'bg-accent text-white' : 'text-white/40'}`} onClick={() => setIsYearly(false)}>Monthly</span>
              </div>
           </div>

           <div className="space-y-6">
              {plans.map(plan => (
                <motion.div 
                  key={plan.key}
                  whileHover={{ scale: 1.02 }}
                  style={glassStyle}
                  className={`p-8 border-2 transition-all cursor-pointer relative overflow-hidden ${
                    plan.key === planName 
                      ? 'border-accent shadow-2xl shadow-accent/20 bg-accent/5' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                   {plan.key === planName && (
                     <div className="absolute top-0 right-0 px-4 py-1.5 bg-accent text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl italic">Current Power</div>
                   )}
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <h4 className="font-black text-xl tracking-tighter uppercase italic">{plan.name}</h4>
                         <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em] mt-1">
                            {(plan as any).tagline || 'Standard Access'}
                         </p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.key === planName ? 'bg-accent text-white' : 'bg-white/5 text-muted-foreground'}`}>
                         {plan.key === 'starter' ? <Activity className="w-5 h-5" /> : plan.key === 'pro' ? <Zap className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                      </div>
                   </div>
                   <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-4xl font-black italic tracking-tighter">ETB {isYearly ? (plan as any).monthlyEquivalent?.toLocaleString() : plan.priceMonthly?.toLocaleString()}</span>
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">/ Month</span>
                   </div>
                   
                   {plan.key !== planName && (
                     <Button 
                       className="w-full h-12 bg-white/5 hover:bg-accent hover:text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-none transition-all"
                       onClick={() => handleUpgradeClick(plan)}
                     >
                        Upgrade Membership
                     </Button>
                   )}
                </motion.div>
              ))}
           </div>

           <div style={glassStyle} className="p-8 border-0 bg-background/40">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6 italic">Direct Payment Hub</h4>
              <div className="space-y-6">
                 <div>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-accent mb-2 block">Telebirr / CBE Birr / M-Pesa</Label>
                    <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">0991 95 55 55</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Beneficiary: ESTATE IQ TECH PLC</p>
                 </div>
                 <div>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-accent mb-2 block">Commercial Bank of Ethiopia (CBE)</Label>
                    <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">1000 1058 7320 8</p>
                 </div>
                 <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-foreground/60 leading-relaxed uppercase tracking-tight italic">
                       After payment, please send a screenshot of the transaction to our activation hub on WhatsApp:
                    </p>
                    <a 
                      href="https://wa.me/251991955555" 
                      target="_blank" 
                      rel="noreferrer"
                      className="mt-4 flex items-center justify-center gap-3 w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#25D366]/20 transition-all"
                    >
                       <MessageCircle className="w-4 h-4" /> Message Activation Hub
                    </a>
                 </div>
              </div>
           </div>

           <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
              <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm">
                 <div style={getGlassStyle(theme)} className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                       <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-accent/20 mx-auto mb-4">
                          <Zap className="w-8 h-8 text-white" />
                       </div>
                       <h3 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">Confirm Upgrade</h3>
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Plan: {selectedPlan?.name} · ETB {selectedPlan?.price?.toLocaleString()}
                       </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-accent mb-1">Step 1: Transfer Funds</p>
                          <p className="text-sm font-black text-foreground">0991 95 55 55 (Telebirr)</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-accent mb-1">Step 2: Notify Engine</p>
                          <p className="text-[10px] font-bold text-muted-foreground leading-tight uppercase">Send screenshot on WhatsApp for instant activation.</p>
                       </div>
                       <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
                          ለክፍያ ጥያቄዎች:{" "}
                          <a href="https://wa.me/251991955555" style={{ color: "#25D366", fontWeight: 600 }}>
                            WhatsApp ያግኙን
                          </a>
                        </p>
                    </div>

                    <Button 
                      onClick={() => {
                        window.open("https://wa.me/251991955555", "_blank");
                        setShowPaymentModal(false);
                      }}
                      className="w-full h-14 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-accent/40"
                    >
                       I've Paid — Activate Now
                    </Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
