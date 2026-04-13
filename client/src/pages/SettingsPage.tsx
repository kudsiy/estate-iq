import { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";
import {
  User, Bell, Link2, Shield, Building2, Facebook,
  Instagram, MessageCircle, Mail, ExternalLink, Phone,
  Share2, Code2, Key, RefreshCw, Copy, Check, Palette, LogOut,
  Target, Zap, Activity, Globe, ShieldAlert, Cpu
} from "lucide-react";
import BrandKitPage from "./BrandKitPage";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

type IntegrationStatus = "live" | "needs_setup" | "demo";

function IntegrationTile({ icon: Icon, name, status, desc, theme }: any) {
  const isLive = status === "live";
  return (
    <div className={`p-5 rounded-[20px] border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'}`}>
       <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLive ? 'bg-accent text-white' : 'bg-muted/40 text-muted-foreground'}`}>
             <Icon className="w-5 h-5" />
          </div>
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isLive ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
             {status.replace('_', ' ')}
          </span>
       </div>
       <p className="text-sm font-bold text-foreground mb-1">{name}</p>
       <p className="text-[10px] text-muted-foreground font-medium leading-tight">{desc}</p>
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const { data: workspace } = trpc.subscription.get.useQuery();
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    companyName: user?.companyName ?? "",
    phone: user?.phone ?? "",
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => { toast.success(t("status.updated")); utils.auth.me.invalidate(); },
  });

  return (
    <DashboardLayout>
      <PremiumUpgradeModal open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("set.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("set.sub")}</p>
        </div>
        {!workspace?.plan || workspace.plan === 'starter' ? (
          <Button onClick={() => setIsUpgradeModalOpen(true)} className="h-14 px-8 rounded-2xl bg-gradient-to-r from-accent to-[#fb923c] text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl shadow-accent/40 border-0">
            <Zap className="w-4 h-4 fill-current" /> {t("set.upgrade")}
          </Button>
        ) : (
          <div className="px-6 py-3 rounded-2xl bg-accent/10 border border-accent/20 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white"><Shield className="w-4 h-4" /></div>
             <div>
                <p className="text-[10px] font-black uppercase text-accent tracking-widest">Active Plan</p>
                <p className="text-sm font-bold text-foreground uppercase tracking-tighter">Estate IQ Professional</p>
             </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col lg:flex-row gap-8">
           <aside className="lg:w-64 shrink-0">
              <TabsList className="bg-transparent flex flex-col h-auto w-full p-0 gap-1">
                 {[
                   { id: "profile", label: t("set.profile"), icon: User },
                   { id: "integrations", label: t("set.itg"), icon: Link2 },
                   { id: "notifications", label: t("set.notif"), icon: Bell },
                   { id: "developer", label: t("set.dev"), icon: Code2 },
                   { id: "brand", label: t("set.brand"), icon: Palette },
                   { id: "account", label: t("set.acc"), icon: Shield },
                 ].map(x => (
                   <TabsTrigger key={x.id} value={x.id} className="w-full justify-start h-11 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white transition-all gap-3 bg-muted/10 border-0">
                      <x.icon className="w-3.5 h-3.5" /> {x.label}
                   </TabsTrigger>
                 ))}
              </TabsList>

              <div className="mt-8 p-6 rounded-[24px] bg-accent/5 border border-accent/10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[1.7]">
                    <Activity className="w-24 h-24" />
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-2">Usage Monitor</p>
                 <div className="space-y-4 relative z-10">
                    <div>
                       <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>Listing Capacity</span>
                          <span>85%</span>
                       </div>
                       <div className="h-1 rounded-full bg-accent/10 overflow-hidden">
                          <div className="h-full bg-accent w-[85%]" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>AI Energy</span>
                          <span>12/50</span>
                       </div>
                       <div className="h-1 rounded-full bg-accent/10 overflow-hidden">
                          <div className="h-full bg-accent w-[24%]" />
                       </div>
                    </div>
                 </div>
              </div>
           </aside>

           <main className="flex-1 min-w-0">
              <TabsContent value="profile" className="m-0 focus-visible:outline-none">
                 <div style={glassStyle} className="p-8 border-0">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                       <User className="w-4 h-4 text-accent" /> {t("set.profile")}
                    </h3>
                    
                    <div className="flex items-center gap-6 mb-10 p-6 rounded-3xl bg-background/30 border border-white/5">
                       <div className="relative">
                          <div className="w-20 h-20 rounded-[32px] bg-accent flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-accent/20">
                             {user?.name?.[0]?.toUpperCase()}
                          </div>
                          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center border-4 border-background/20"><Plus className="w-4 h-4" /></button>
                       </div>
                       <div>
                          <p className="text-xl font-black text-foreground tracking-tighter uppercase">{user?.name}</p>
                          <p className="text-xs text-muted-foreground font-medium mb-1">{user?.email}</p>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-accent/20 text-accent px-2 py-0.5 rounded-lg">{user?.role}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                       <div className="space-y-6">
                          <div>
                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Display Name</Label>
                             <Input className="h-11 rounded-1.5xl bg-background/20" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                          </div>
                          <div>
                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Company Portal Name</Label>
                             <Input className="h-11 rounded-1.5xl bg-background/20" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} />
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div>
                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Official Email</Label>
                             <Input className="h-11 rounded-1.5xl bg-background/20" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
                          </div>
                          <div>
                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Contact Number</Label>
                             <Input className="h-11 rounded-1.5xl bg-background/20" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex justify-end p-6 -mx-8 -mb-8 mt-10 border-t border-white/5 bg-background/20 rounded-b-[24px]">
                       <Button onClick={() => updateProfileMutation.mutate(profile)} className="h-11 px-10 rounded-xl bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20">
                          Save Identity Updates
                       </Button>
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="integrations" className="m-0 focus-visible:outline-none">
                 <div className="space-y-6">
                    <div style={glassStyle} className="p-8 border-0">
                       <h3 className="text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-accent" /> Social Ecosystem
                       </h3>
                       <p className="text-xs text-muted-foreground font-medium mb-8">Connect your branded production channels for one-click distribution.</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <IntegrationTile icon={Send} name="Telegram Bot" status="live" desc="Automated channel broadcasting and production queue sync." theme={theme} />
                          <IntegrationTile icon={Facebook} name="Facebook Page" status="needs_setup" desc="Ingest leads directly from Facebook Lead Forms." theme={theme} />
                          <IntegrationTile icon={Instagram} name="Instagram IGTV" status="needs_setup" desc="Sync property reels to your professional discovery feed." theme={theme} />
                          <IntegrationTile icon={MessageCircle} name="WhatsApp Suite" status="demo" desc="Direct customer engagement and AI-powered lead qualification." theme={theme} />
                       </div>
                    </div>
                    <div style={glassStyle} className="p-8 border-0">
                       <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-accent" /> External Hook Points
                       </h3>
                       <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Cpu className="w-5 h-5" /></div>
                             <div>
                                <p className="text-sm font-bold text-foreground">Zapier Orchestration</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Planned Integration</p>
                             </div>
                          </div>
                          <Button variant="outline" className="text-[10px] font-black uppercase h-8 px-4 rounded-lg">Early Access</Button>
                       </div>
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="developer" className="m-0 focus-visible:outline-none">
                 <div style={glassStyle} className="p-8 border-0">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                       <Key className="w-4 h-4 text-accent" /> {t("set.api")}
                    </h3>
                    <div className="p-8 rounded-3xl bg-background/40 border border-white/5 mb-8">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Secret API Signature</Label>
                       <div className="flex gap-3">
                          <div className="flex-1 h-12 bg-black/20 rounded-xl flex items-center px-4 font-mono text-xs text-accent italic tracking-tighter border border-white/5 opacity-80">
                             {workspace?.apiKey || "************************************"}
                          </div>
                          <Button className="h-12 w-12 rounded-xl bg-accent text-white p-0 shadow-lg shadow-accent/20"><Copy className="w-4 h-4" /></Button>
                          <Button variant="outline" className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest">Rotate</Button>
                       </div>
                       <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-4 flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-amber-500" /> Never share this key on public clients or repositories.</p>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quickstart Guide</h4>
                       <pre className="p-6 rounded-3xl bg-black/20 font-mono text-xs leading-relaxed text-muted-foreground border border-white/5 overflow-x-auto">
                          <code>{`// Capture Identity
POST https://app.estateiq.et/api/leads/external
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Luxury Prospect",
  "phone": "+251...",
  "source": "api.integration"
}`}</code>
                       </pre>
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="brand" className="m-0 focus-visible:outline-none">
                 <BrandKitPage embedded />
              </TabsContent>

              <TabsContent value="account" className="m-0 focus-visible:outline-none">
                 <div className="space-y-6">
                    <div style={glassStyle} className="p-8 border-0">
                       <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-accent" /> Workspace Sovereignty
                       </h3>
                       <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/20 border border-border/40">
                          <div>
                             <p className="text-sm font-bold text-foreground">Sign out of identity</p>
                             <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">End existing session safely</p>
                          </div>
                          <Button onClick={logout} variant="outline" className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-red-500/20">
                             <LogOut className="w-3.5 h-3.5 mr-2" /> Log Out
                          </Button>
                       </div>
                    </div>
                    <div style={glassStyle} className="p-8 border-0 border-red-500/10 bg-red-500/5">
                       <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2 text-red-500">
                          <ShieldAlert className="w-4 h-4" /> Danger Precinct
                       </h3>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                             <div>
                                <p className="text-sm font-bold text-foreground">Data Extraction</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Request full CSV/JSON identity dump</p>
                             </div>
                             <Button disabled variant="outline" className="text-[10px] font-black uppercase h-9 px-6 rounded-xl">Pending release</Button>
                          </div>
                          <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                             <div>
                                <p className="text-sm font-bold text-foreground">Irreversible Erasure</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Delete workspace and all associated assets</p>
                             </div>
                             <Button disabled variant="outline" className="text-[10px] font-black uppercase h-9 px-6 rounded-xl border-red-500/20 text-red-500">Destroy Data</Button>
                          </div>
                       </div>
                    </div>
                 </div>
              </TabsContent>
           </main>
        </div>
      </Tabs>
    </DashboardLayout>
  );
}
