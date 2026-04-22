import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Shield, Users, Building2, Zap, Activity, Cpu, Flag, Save, Trash2, ShieldAlert, CheckCircle2 } from "lucide-react";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

export default function AdminPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [flag, setFlag] = useState({ key: "", description: "", enabled: false });

  const { data: overview, isLoading, error } = trpc.admin.overview.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  
  const [upgrading, setUpgrading] = useState<number | null>(null);
  const [planSelect, setPlanSelect] = useState<Record<number, string>>({});

  const setPlanMutation = trpc.admin.setPlan.useMutation({
    onSuccess: async () => {
      await utils.admin.overview.invalidate();
      setUpgrading(null);
      toast.success("Plan updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const upsertMutation = trpc.admin.featureFlags.upsert.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.admin.overview.invalidate(), utils.admin.featureFlags.list.invalidate()]);
      setFlag({ key: "", description: "", enabled: false });
      toast.success(t("status.updated"));
    },
    onError: (mutationError) => toast.error(mutationError.message || "Failed to update feature flag"),
  });

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
           <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-8">
              <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
           </div>
           <h1 className="text-3xl font-black tracking-tighter uppercase italic">{t("info.unauthorizedTitle") || "Access Denied"}</h1>
           <p className="mt-4 text-sm text-muted-foreground font-medium uppercase tracking-widest max-w-sm">
             {t("info.unauthorizedDesc") || "System sovereignty requires administrative clearance. Verify your identity credentials."}
           </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("adm.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("adm.sub")}</p>
        </div>
        <div className="h-12 px-6 rounded-2xl bg-accent/10 border border-accent/20 flex items-center gap-3">
           <Shield className="w-5 h-5 text-accent" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Active Protocol Oversight</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground italic">
           <Activity className="w-4 h-4 animate-spin" /> Calibrating Command Stats...
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-4">
           <ShieldAlert className="w-6 h-6" />
           <p className="font-black text-xs uppercase tracking-widest tracking-tighter">{error.message}</p>
        </div>
      ) : (
        <div className="space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: t("adm.users"), val: overview?.counts.users, icon: Users, color: "accent" },
              { label: t("adm.admins"), val: overview?.counts.admins, icon: Shield, color: "blue-500" },
              { label: t("adm.workspaces"), val: overview?.counts.workspaces, icon: Building2, color: "purple-500" },
              { label: t("adm.subs"), val: overview?.counts.activeSubscriptions, icon: Zap, color: "amber-500" },
            ].map(s => (
              <div key={s.label} style={glassStyle} className="p-8 border-0 relative group overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-24 h-24 bg-foreground/5 blur-3xl rounded-full" />
                 <div className="flex items-center justify-between mb-2 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">{s.label}</p>
                    <s.icon className={`w-4 h-4 text-${s.color} opacity-40`} />
                 </div>
                 <p className="text-4xl font-black text-foreground tracking-tighter italic relative z-10">{s.val ?? 0}</p>
              </div>
            ))}
          </div>

          <div style={glassStyle} className="overflow-hidden border-0">
             <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">{t("adm.flags")}</h3>
                   <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">Calibrate system features in real-time</p>
                </div>
                <Cpu className="w-5 h-5 text-muted-foreground/30" />
             </div>
             
             <div className="p-10 space-y-10">
                <div className="flex flex-col lg:flex-row items-end gap-6 bg-background/20 p-8 rounded-[32px] border border-white/5">
                   <div className="flex-1 w-full space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-accent ml-1">Flag Identity</Label>
                      <Input value={flag.key} onChange={e => setFlag({...flag, key: e.target.value})} className="h-12 rounded-xl bg-background border-white/5 font-bold uppercase tracking-widest text-xs" placeholder="MODULE_NAME" />
                   </div>
                   <div className="flex-[2] w-full space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Technical Descriptor</Label>
                      <Input value={flag.description} onChange={e => setFlag({...flag, description: e.target.value})} className="h-12 rounded-xl bg-background border-white/5 text-xs font-medium" placeholder="Purpose of this calibration..." />
                   </div>
                   <div className="flex items-center gap-4 h-12 bg-background/40 px-6 rounded-xl border border-white/5 shrink-0">
                      <input type="checkbox" checked={flag.enabled} onChange={e => setFlag({...flag, enabled: e.target.checked})} className="w-4 h-4 rounded border-white/20 bg-background text-accent" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">{flag.enabled ? 'Enabled' : 'Disabled'}</span>
                   </div>
                   <Button onClick={() => upsertMutation.mutate(flag)} disabled={upsertMutation.isPending || !flag.key} className="h-12 px-8 rounded-xl bg-accent text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-accent/20">
                      {upsertMutation.isPending ? "Syncing..." : t("adm.saveFlag")}
                   </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overview?.flags.map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                      <div>
                        <p className="text-sm font-black uppercase tracking-tighter italic text-foreground">{item.key}</p>
                        <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">{item.description || "System protocol"}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${item.enabled ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-muted text-muted-foreground opacity-40"}`}>
                           {item.enabled ? "Active" : "Locked"}
                         </span>
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/10 hover:text-accent transition-all">
                            <Activity className="w-3.5 h-3.5" />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div style={glassStyle} className="overflow-hidden border-0">
             <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">{t("adm.plans")}</h3>
                <Building2 className="w-5 h-5 text-muted-foreground/30" />
             </div>
             <div className="p-10">
                <div className="grid grid-cols-1 gap-4">
                  {overview?.workspaces.map((ws) => (
                    <div key={ws.id} className="flex items-center justify-between p-6 rounded-3xl bg-background/20 border border-white/5 hover:bg-background/40 transition-all group">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-accent/5 flex items-center justify-center border border-accent/10 text-accent font-black text-xs italic">WS</div>
                         <div>
                           <p className="text-base font-black uppercase tracking-tighter italic text-foreground leading-none mb-1">{ws.name}</p>
                           <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black uppercase tracking-widest text-accent italic">Level: {ws.plan}</span>
                              <span className="w-1 h-1 bg-white/10 rounded-full" />
                              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">{ws.subscriptionStatus}</span>
                           </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-right hidden sm:block">
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">Architecture Node</p>
                            <p className="text-[10px] font-black italic tracking-tighter text-foreground">Sovereign Agent #{ws.ownerUserId}</p>
                         </div>
                          {upgrading === ws.id ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <select
                                value={planSelect[ws.id] ?? ws.plan}
                                onChange={(e) => setPlanSelect(p => ({ ...p, [ws.id]: e.target.value }))}
                                style={{ background: "#1a1d2e", border: "1px solid rgba(255,255,255,0.1)", 
                                         borderRadius: 8, color: "#fff", padding: "4px 8px", fontSize: 12 }}
                              >
                                <option value="starter">Starter</option>
                                <option value="pro">Pro</option>
                                <option value="agency">Agency</option>
                              </select>
                              <button
                                onClick={() => setPlanMutation.mutate({
                                  workspaceId: ws.id,
                                  plan: (planSelect[ws.id] ?? ws.plan) as any,
                                  status: "active",
                                })}
                                disabled={setPlanMutation.isPending}
                                style={{ background: "#7C3AED", border: "none", borderRadius: 8,
                                         color: "#fff", padding: "4px 12px", fontSize: 11,
                                         fontWeight: 700, cursor: "pointer" }}
                              >
                                {setPlanMutation.isPending ? "..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => setUpgrading(null)}
                                style={{ background: "none", border: "none", color: "#6b7280",
                                         fontSize: 11, cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <Button variant="outline" className="h-10 px-6 rounded-xl border-white/5 hover:bg-accent/10 hover:text-accent transition-all text-[9px] font-black uppercase tracking-widest group-hover:border-accent/20" onClick={() => setUpgrading(ws.id)}>Upgrade</Button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
