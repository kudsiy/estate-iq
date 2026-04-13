import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend,
} from "recharts";
import { Target, TrendingUp, DollarSign, Sparkles, Activity, Users, Home, Inbox, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useMemo } from "react";
import { UsageProgress } from "@/components/UsageProgress";

// ── helpers ──────────────────────────────────────────────────────────────────
const STAGE_COLORS: Record<string, string> = {
  lead:      "#3b82f6",
  contacted: "#6366f1",
  viewing:   "#f59e0b",
  offer:     "#f97316",
  closed:    "#22c55e",
};

function last6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), monthNum: d.getMonth() };
  });
}

function formatBirr(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ETB`;
  if (val >= 1_000)     return `${Math.round(val / 1_000)}K ETB`;
  return `${Math.round(val)} ETB`;
}

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 25px 50px -12px rgba(0,0,0,0.5)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

const getKpiStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(30, 41, 59, 0.8)" : "#ffffff",
  borderRadius: "24px",
  padding: "1.6rem 1.75rem",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.45)" : "0 20px 40px rgba(0,0,0,0.1)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
  color: theme === "dark" ? "#f1f5f9" : "#1e293b",
});

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);
  const kpiStyle = useMemo(() => getKpiStyle(theme), [theme]);

  const { data: contacts = [] }        = trpc.crm.contacts.list.useQuery();
  const { data: deals = [] }           = trpc.crm.deals.list.useQuery();
  const { data: socialPosts = [] }     = trpc.crm.socialMediaPosts.list.useQuery();
  const { data: notifications = [] }   = trpc.notifications.list.useQuery();
  const { data: supplierListings = [] }= trpc.supplierFeed.list.useQuery();
  const { data: buyerProfiles = [] }   = trpc.matching.profiles.list.useQuery();
  const { data: subscription }         = trpc.subscription.current.useQuery();

  const activeLeads        = contacts.filter((c) => c.status === "active").length;
  const closedDeals        = deals.filter((d) => d.stage === "closed").length;
  const totalDealValue     = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const unreadNotifications= notifications.filter((n) => !n.isRead).length;
  const supplierNeedsReview= supplierListings.filter((i) => i.status === "new").length;

  const pipelineData = useMemo(() => {
    const stages = ["lead","contacted","viewing","offer","closed"] as const;
    const labels: Record<string,string> = { 
      lead: t("dash.leadVelocity"), 
      contacted: t("nav.dashboard"), // Placeholder or use common naming
      viewing: "Viewing", // Should add more keys if needed
      offer: "Offer", 
      closed: "Closed" 
    };
    // Let's stick to the labels defined in LanguageContext if possible
    return stages.map((s) => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: deals.filter((d) => d.stage === s).length, color: STAGE_COLORS[s] })).filter((s) => s.value > 0);
  }, [deals, t]);

  const trendData = useMemo(() => {
    const months = last6Months();
    return months.map(({ label, year, monthNum }) => {
      const inMonth = (date: Date) => date.getMonth() === monthNum && date.getFullYear() === year;
      return {
        month:       label,
        leads:       contacts.filter((c) => inMonth(new Date(c.createdAt))).length,
        deals:       deals.filter((d) => inMonth(new Date(d.createdAt))).length,
        conversions: deals.filter((d) => d.stage === "closed" && d.closedAt && inMonth(new Date(d.closedAt))).length,
      };
    });
  }, [contacts, deals]);

  const engagementData = useMemo(() => {
    return ["Facebook","Instagram","TikTok"].map((platform) => {
      const matched = socialPosts.filter((p) => ((p.platforms as string[]) || []).map((x) => x.toLowerCase()).includes(platform.toLowerCase()));
      const totals = matched.reduce((acc, p) => {
        const m = (p.engagementMetrics as any) || {};
        return { engagement: acc.engagement + (m.likes||0) + (m.comments||0) + (m.shares||0), leads: acc.leads + (m.leads||0) };
      }, { engagement: 0, leads: 0 });
      return { platform, ...totals };
    });
  }, [socialPosts]);

  const recentContacts = contacts.slice(0, 5);

  const kpis = [
    { icon: Target,    label: t("dash.leadVelocity"), value: activeLeads,           sub: `${contacts.length} ${t("dash.captured")}`, trend: "+12.5%", trendUp: true },
    { icon: TrendingUp,label: t("dash.convRate"),     value: deals.length > 0 ? `${Math.round((closedDeals/deals.length)*100)}%` : "0%", sub: t("dash.efficiency"), trend: "+4.2%", trendUp: true },
    { icon: DollarSign,label: t("dash.pipeValue"),    value: totalDealValue > 0 ? formatBirr(totalDealValue) : `0 ETB`, sub: t("dash.activeAssets"), trend: "+ETB 2.4M", trendUp: true },
    { icon: Sparkles,  label: t("dash.marketing"),    value: socialPosts.length > 0 ? "4.2x" : "—",                     sub: t("dash.aiImpact"), trend: "Optimised", trendUp: true },
  ];

  const quickActions = [
    { label: t("dash.recentContacts"), icon: Users,     path: "/crm/contacts" },
    { label: t("dash.pipeTitle"),      icon: TrendingUp,path: "/crm/deals" },
    { label: t("nav.properties"),      icon: Home,      path: "/properties" },
    { label: t("nav.supplyFeed"),      icon: Inbox,     path: "/supplier-feed" },
    { label: t("nav.studio"),          icon: Sparkles,  path: "/studio" },
    { label: t("nav.analytics"),       icon: Activity,  path: "/analytics" },
  ];

  return (
    <DashboardLayout>
      {/* ── Page heading ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground mb-2">
            {t("dash.command")}
          </h1>
          <p className="text-muted-foreground text-base font-medium">
            {t("dash.commandSubtitle")}
          </p>
        </div>
        
        {subscription?.workspace && (
          <div style={glassStyle} className="px-6 py-4 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("billing.plan")}</p>
              <p className="text-sm font-black text-foreground capitalize">{subscription.plan}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
              <p className={`text-sm font-black capitalize ${subscription.isActive ? "text-emerald-500" : "text-amber-500"}`}>
                {subscription.workspace.subscriptionStatus}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Resource Hub (Sovereign Capacity) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div style={glassStyle} className="p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xl font-black text-foreground mb-1">Sovereign Capacity</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Monthly Resource Consumption</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/billing")} className="rounded-xl font-black text-[10px] uppercase tracking-widest border-accent/20 hover:bg-accent/5">
              Upgrade Limits
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <UsageProgress 
              label={t("nav.properties")} 
              current={subscription?.usage.properties ?? 0} 
              total={subscription?.limits.properties ?? 0} 
              unit="listings"
            />
            <UsageProgress 
              label="AI Intelligence" 
              current={subscription?.usage.aiCaptions ?? 0} 
              total={subscription?.limits.aiCaptions ?? 0} 
              unit="generations"
            />
            <UsageProgress 
              label={t("nav.crm")} 
              current={subscription?.usage.contacts ?? 0} 
              total={subscription?.limits.contacts ?? 0} 
              unit="leads"
            />
            <UsageProgress 
              label="Social Automation" 
              current={subscription?.usage.socialPosts ?? 0} 
              total={subscription?.limits.socialPosts ?? 0} 
              unit="broadcasts"
            />
          </div>
        </div>

        {/* TikTok Marketing Pulse */}
        <div style={{...glassStyle, background: theme === "dark" ? "linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9))" : "rgba(255,255,255,0.7)"}} className="p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-20 h-20 text-accent rotate-12" />
          </div>
          <div className="relative z-10">
            <p className="text-base font-black text-foreground mb-1">TikTok Marketing Pulse</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-6">Primary Channel Intelligence</p>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
                <p className="text-xs font-black text-accent uppercase tracking-widest mb-1">AI Recommendation</p>
                <p className="text-sm font-medium text-foreground italic">"Property in Bole needs a 'POV' style reel to capitalize on trending Afro-Jazz audio."</p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Engagement Index</span>
                <span className="text-emerald-500">+24% this week</span>
              </div>
              <Button onClick={() => setLocation("/studio")} className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-black text-xs uppercase tracking-widest py-6">
                Generate TikTok Hook
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} style={kpiStyle} className="group hover:-translate-y-1 transition-transform duration-200">
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
            </div>
            <div className="text-[2.4rem] font-black leading-none tracking-tighter text-foreground my-2">
              {kpi.value}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-400 font-black uppercase">{kpi.sub}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${kpi.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Trend Line */}
        <div style={glassStyle} className="lg:col-span-7 p-8">
          <p className="text-xl font-black text-foreground mb-1">
            {t("dash.trendTitle")}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-8">
            {t("dash.trendSub")}
          </p>
          {contacts.length === 0 && deals.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Activity className="w-10 h-10" />
              <span className="text-sm font-bold">Add contacts and deals to see your trend</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 11, fontWeight: 800, fill: "#94a3b8" }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11, fontWeight: 800, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="leads"       name="Leads"   stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="deals"       name="Deals"   stroke="#6366f1" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="conversions" name="Closed"  stroke="#22c55e" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pipeline Donut */}
        <div style={glassStyle} className="lg:col-span-5 p-8">
          <p className="text-xl font-black text-foreground mb-1">
            {t("dash.pipeTitle")}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-8">
            {t("dash.pipeSub")}
          </p>
          {pipelineData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-white/30 gap-3">
              <TrendingUp className="w-10 h-10" />
              <span className="text-sm font-bold">No deals yet — add your first deal</span>
              <button onClick={() => setLocation("/crm/deals")} className="text-blue-400 text-xs font-black underline">Open pipeline →</button>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <div className="relative" style={{ width: 180, height: 180, flexShrink: 0 }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pipelineData} cx="50%" cy="50%" outerRadius={80} innerRadius={60} dataKey="value" startAngle={90} endAngle={-270}>
                      {pipelineData.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={4} stroke="rgba(15,23,42,1)" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-foreground">{deals.length}</span>
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    {t("nav.crm")}
                  </span>
                </div>
              </div>
              <div className="space-y-4 flex-1">
                {pipelineData.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.name}</p>
                      <p className="text-lg font-black text-foreground">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Social engagement + Recent contacts ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Social bar chart */}
        <div style={glassStyle} className="lg:col-span-2 p-8">
          <p className="text-base font-black text-foreground mb-1">{t("dash.socialTitle")}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-6">
            {t("dash.socialSub")}
          </p>
          {socialPosts.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-white/30 gap-3">
              <Activity className="w-10 h-10" />
              <span className="text-sm font-bold">Schedule posts to see engagement data</span>
              <button onClick={() => setLocation("/studio")} className="text-blue-400 text-xs font-black underline">Go to Studio →</button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="platform" stroke="#475569" tick={{ fontSize: 11, fontWeight: 800, fill: "#94a3b8" }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11, fontWeight: 800, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }} />
                <Bar dataKey="engagement" name="Engagement" fill="#3b82f6" radius={[6,6,0,0]} />
                <Bar dataKey="leads"      name="Leads"      fill="#f59e0b" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent contacts */}
        <div style={glassStyle} className="p-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-base font-black text-foreground">{t("dash.recentContacts")}</p>
            <button onClick={() => setLocation("/crm")} className="text-accent text-[10px] font-black uppercase tracking-widest hover:text-accent/80 transition-colors">
              {t("dash.viewAll")} →
            </button>
          </div>
          {recentContacts.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-white/30 gap-3">
              <Users className="w-10 h-10" />
              <span className="text-sm font-bold">No contacts yet</span>
              <button onClick={() => setLocation("/crm")} className="text-blue-400 text-xs font-black underline">Add first contact →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-black flex-shrink-0">
                      {contact.firstName[0]}{contact.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-none">{contact.firstName} {contact.lastName}</p>
                      <p className="text-[10px] text-muted-foreground capitalize mt-0.5 font-bold">{contact.type}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wide ${
                    contact.status === "active"    ? "bg-emerald-50 text-emerald-600" :
                    contact.status === "converted" ? "bg-blue-50 text-blue-600"      :
                    contact.status === "lost"      ? "bg-red-50 text-red-600"        :
                                                     "bg-muted text-muted-foreground"
                  }`}>
                    {contact.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Ops strip ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Notifications */}
        <div style={glassStyle} className="p-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-base font-black text-foreground">{t("dash.notifications")}</p>
            {unreadNotifications > 0 && (
              <span className="bg-accent text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                {unreadNotifications} {t("dash.unread")}
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="flex items-center gap-3 text-white/30 text-sm font-bold">
              <Bell className="w-5 h-5" />
              No alerts yet
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3 rounded-2xl bg-muted/40 border border-border">
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operations */}
        <div style={glassStyle} className="p-8">
          <p className="text-base font-black text-foreground mb-6">{t("dash.ops")}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <Inbox className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-foreground">{t("dash.supplierReview")}</span>
              </div>
              <span className={`text-xl font-black ${supplierNeedsReview > 0 ? "text-amber-500" : "text-muted-foreground"}`}>{supplierNeedsReview}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-foreground">{t("dash.buyerProfiles")}</span>
              </div>
              <span className="text-xl font-black text-foreground/70">{buyerProfiles.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {quickActions.map((a) => (
          <button
            key={a.path}
            onClick={() => setLocation(a.path)}
            className="py-4 flex flex-col gap-2 items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all rounded-2xl border border-border hover:border-accent hover:bg-accent/5 bg-muted/20"
          >
            <a.icon className="w-5 h-5 text-accent" />
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────── */}
      <div
        className="p-10 lg:p-14 rounded-[40px] flex flex-col lg:flex-row items-center justify-between gap-10"
        style={{
          background: "linear-gradient(145deg, rgba(37,99,235,0.18), rgba(30,58,138,0.35))",
          border: "1px solid rgba(59,130,246,0.25)",
        }}
      >
        <div className="max-w-xl text-center lg:text-left">
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
            {t("dash.ctaTitle")}
          </h2>
          <p className="text-white/60 text-base font-medium">
            {t("dash.ctaSub")}
          </p>
        </div>
        <button
          onClick={() => setLocation("/studio")}
          className="bg-white text-accent hover:bg-white/90 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-white/10 flex-shrink-0"
        >
          {t("dash.ctaButton")} →
        </button>
      </div>

      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
      `}</style>
    </DashboardLayout>
  );
}
