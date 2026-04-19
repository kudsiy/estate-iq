import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CheckCircle2, Zap, Target, Send, Shield, Sparkles, Facebook, Instagram, MessageCircle, Video, Palette, Activity } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(40px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "40px",
  boxShadow: theme === "dark" ? "0 40px 80px rgba(0,0,0,0.5)" : "0 20px 30px -10px rgba(0,0,0,0.1)",
});

const PLATFORM_OPTIONS = [
  { id: "telegram", label: "Telegram", icon: Send, color: "blue-500" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "blue-600" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "pink-500" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "slate-800" },
] as const;

const TARGET_MARKETS = [
  "Addis Ababa",
  "Bole & Central Addis",
  "Residential Buyers",
  "Commercial Buyers",
  "Rental Market",
  "Luxury Market",
];

export default function OnboardingPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    companyName: user?.companyName ?? "",
    role: (user?.role ?? "agent") as "agent" | "team_member" | "admin" | "user",
    targetMarket: user?.targetMarket ?? "Addis Ababa",
    selectedPlatforms: ((user?.selectedPlatforms as string[]) ?? []).filter(Boolean),
  });

  const completeMutation = trpc.auth.completeOnboarding.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success(t("status.updated"));
      setLocation("/dashboard");
    },
    onError: (error) => toast.error(error.message || "Onboarding failed"),
  });

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const togglePlatform = (platform: string) => {
    setForm((current) => ({
      ...current,
      selectedPlatforms: current.selectedPlatforms.includes(platform)
        ? current.selectedPlatforms.filter((item) => item !== platform)
        : [...current.selectedPlatforms, platform],
    }));
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-slate-50'} flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden`}>
       {/* Background Aesthetics */}
       <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[150px] rounded-full" />
       </div>

       <div className="w-full max-w-6xl relative z-10">
          <header className="mb-16 flex flex-col items-center text-center">
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-accent rounded-[2rem] flex items-center justify-center shadow-2xl shadow-accent/40 mb-8 overflow-hidden relative">
                <Building2 className="w-10 h-10 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
             </motion.div>
             <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl font-black tracking-tighter uppercase italic text-foreground mb-4">{t("on.title")}</motion.h1>
             <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs max-w-md">{t("on.sub")}</motion.p>
          </header>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
             
             {/* Main Setup Card */}
             <motion.div style={glassStyle} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="lg:col-span-8 p-12 border-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Zap className="w-48 h-48" /></div>
                
                <div className="relative z-10 space-y-10">
                   <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-2">{t("on.cardTitle")}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("on.cardSub")}</p>
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-accent ml-1">{t("on.agency")}</Label>
                         <Input 
                           value={form.companyName}
                           onChange={(e) => setForm({...form, companyName: e.target.value})}
                           className="h-14 rounded-2xl bg-background/40 border-white/5 text-lg font-bold placeholder:opacity-20 transition-all focus:ring-2 focus:ring-accent" 
                           placeholder="e.g. BOLE ARCHITECTURAL REAL ESTATE" 
                         />
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("on.role")}</Label>
                            <Select value={form.role} onValueChange={(r: any) => setForm({...form, role: r})}>
                               <SelectTrigger className="h-14 rounded-2xl bg-background/40 border-white/5 border-0 focus:ring-2 focus:ring-accent"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="agent">Strategic Agent</SelectItem>
                                  <SelectItem value="team_member">Collaborative Associate</SelectItem>
                                  <SelectItem value="admin">System Architect / Owner</SelectItem>
                                  <SelectItem value="user">Platform Beneficiary</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("on.market")}</Label>
                            <Select value={form.targetMarket} onValueChange={(m) => setForm({...form, targetMarket: m})}>
                               <SelectTrigger className="h-14 rounded-2xl bg-background/40 border-white/5 border-0 focus:ring-2 focus:ring-accent"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                  {TARGET_MARKETS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="space-y-5">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("on.platforms")}</Label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {PLATFORM_OPTIONS.map(p => (
                              <button
                                key={p.id}
                                onClick={() => togglePlatform(p.id)}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all ${form.selectedPlatforms.includes(p.id) ? 'bg-accent border-accent text-white shadow-2xl shadow-accent/40 scale-105' : 'bg-background/20 border-white/5 text-muted-foreground hover:bg-background/40'}`}
                              >
                                 <p.icon className="w-6 h-6" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button 
                        disabled={completeMutation.isPending || !form.companyName.trim()}
                        onClick={() => completeMutation.mutate({...form, companyName: form.companyName.trim(), selectedPlatforms: form.selectedPlatforms as any})}
                        className="h-16 px-12 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40 group overflow-hidden relative"
                      >
                         <span className="relative z-10 flex items-center gap-2">{completeMutation.isPending ? "Calibrating..." : t("on.complete")} <Zap className="w-4 h-4 group-hover:animate-bounce" /></span>
                         <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        disabled={completeMutation.isPending}
                        onClick={() => completeMutation.mutate({...form, companyName: form.companyName.trim() || "Elite Workspace", skip: true} as any)}
                        className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground"
                      >
                         {t("on.skip")}
                      </Button>
                   </div>
                </div>
             </motion.div>

             {/* Deployment Impact Column */}
             <div className="lg:col-span-4 space-y-8">
                <motion.div style={glassStyle} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="p-10 border-0 bg-accent/5">
                   <h3 className="text-xl font-black uppercase tracking-tighter italic text-accent mb-8 flex items-center gap-3 border-b border-accent/10 pb-4">
                      <Sparkles className="w-6 h-6" /> {t("on.enableTitle")}
                   </h3>
                   <div className="space-y-8">
                      {[
                        { text: t("on.enable1"), icon: Shield },
                        { text: t("on.enable2"), icon: Palette },
                        { text: t("on.enable3"), icon: Activity },
                        { text: "Enables multi-account AI narration protocols.", icon: MessageCircle },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4 group">
                           <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-all">
                              <item.icon className="w-5 h-5 text-accent group-hover:text-white" />
                           </div>
                           <p className="text-xs font-bold leading-relaxed text-muted-foreground uppercase tracking-tight italic pt-1">{item.text}</p>
                        </div>
                      ))}
                   </div>
                </motion.div>

                <div className="px-10 py-8 flex items-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
                   <Shield className="w-5 h-5" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sovereign Data Protection Protocol Active</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
