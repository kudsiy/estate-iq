import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Users, Heart, MessageCircle, Share2,
  Target, Eye, BarChart2, ArrowRight, Activity, Wallet, PieChart
} from "lucide-react";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

function formatETB(val: number | string | null | undefined) {
  const n = Number(val);
  if (!n || isNaN(n)) return "—";
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `ETB ${Math.round(n / 1_000)}K`;
  return `ETB ${n.toLocaleString()}`;
}

// ── Components ────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, theme }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={getGlassStyle(theme)} className="p-3 border-0 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-bold text-foreground">
              {entry.name}: {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function StatCard({ icon: Icon, label, value, sub, color, glassStyle }: any) {
  return (
    <div style={glassStyle} className="p-5 border-0 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-xl bg-opacity-10 flex items-center justify-center ${color.replace('text-', 'bg-')} bg-opacity-20`}>
           <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter opacity-70">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const { data: posts = [] }    = trpc.crm.socialMediaPosts.list.useQuery();
  const { data: contacts = [] } = trpc.crm.contacts.list.useQuery();
  const { data: leads = [] }    = trpc.crm.leads.list.useQuery();
  const { data: deals = [] }    = trpc.crm.deals.list.useQuery();

  // ── Metrics Aggregation ─────────────────────────────────────────────────────
  const allMetrics = useMemo(() => {
    return posts.flatMap((p) => {
      const m = (p.engagementMetrics as any) ?? {};
      const platforms = (p.platforms as string[]) ?? [];
      return platforms.map((platform) => ({
        platform,
        likes: m.likes ?? 0,
        comments: m.comments ?? 0,
        shares: m.shares ?? 0,
        impressions: m.impressions ?? 0,
        leads: m.leads ?? 0,
        date: p.publishedAt ?? p.scheduledTime ?? p.createdAt,
      }));
    });
  }, [posts]);

  const kpis = useMemo(() => {
    const totalImpressions = allMetrics.reduce((s, m) => s + m.impressions, 0);
    const totalEngagements = allMetrics.reduce((s, m) => s + m.likes + m.comments + m.shares, 0);
    const er = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(1) : "—";
    const closedVal = deals.filter(d => d.stage === "closed").reduce((s, d) => s + (Number(d.value) || 0), 0);
    return {
      posts: posts.filter(p => p.status === "published").length,
      likes: allMetrics.reduce((s, m) => s + m.likes, 0),
      imp: totalImpressions,
      er,
      closedVal,
      activeDeals: deals.filter(d => d.stage !== "closed").length
    };
  }, [posts, allMetrics, deals]);

  const funnelData = useMemo(() => {
    const totalLeads = leads.length;
    const qualified = leads.filter(l => ["qualified", "converted"].includes(l.status as any)).length;
    const closed = deals.filter(d => d.stage === "closed").length;
    return [
      { name: t("stage.lead"), value: totalLeads, fill: "#3b82f6" },
      { name: t("status.converted"), value: qualified, fill: "#8b5cf6" },
      { name: t("status.lost"), value: closed, fill: "#10b981" },
    ];
  }, [leads, deals, t]);

  const platformData = useMemo(() => {
    return ["facebook", "instagram", "tiktok"].map(p => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      likes: allMetrics.filter(m => m.platform === p).reduce((s, m) => s + m.likes, 0),
      imp: allMetrics.filter(m => m.platform === p).reduce((s, m) => s + m.impressions, 0),
    }));
  }, [allMetrics]);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("analz.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("analz.sub")}</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 bg-transparent">
               <Download className="w-3.5 h-3.5" /> Export Report
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon={Activity} label={t("analz.trend")} value={kpis.posts} sub="Published" color="text-accent" glassStyle={glassStyle} />
        <StatCard icon={Heart} label="Total Likes" value={kpis.likes.toLocaleString()} sub="Life-time" color="text-pink-500" glassStyle={glassStyle} />
        <StatCard icon={Eye} label={t("analz.imp")} value={kpis.imp.toLocaleString()} sub="Organic Reach" color="text-amber-500" glassStyle={glassStyle} />
        <StatCard icon={Target} label={t("analz.er")} value={`${kpis.er}%`} sub="Avg Content ES" color="text-green-500" glassStyle={glassStyle} />
        <StatCard icon={Wallet} label={t("analz.revenue")} value={formatETB(kpis.closedVal)} sub="Verified Sales" color="text-blue-500" glassStyle={glassStyle} />
        <StatCard icon={TrendingUp} label="Active Pipeline" value={kpis.activeDeals} sub="In Progress" color="text-violet-500" glassStyle={glassStyle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div style={glassStyle} className="lg:col-span-8 p-8 border-0">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-accent" /> {t("analz.trend")}
              </h3>
           </div>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={allMetrics.slice(-20)}>
                   <defs>
                     <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                   <XAxis dataKey="date" hide />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} stroke={theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                   <Tooltip content={<CustomTooltip theme={theme} />} />
                   <Area type="monotone" dataKey="impressions" name={t("analz.imp")} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorImp)" />
                   <Area type="monotone" dataKey="likes" name="Likes" stroke="#ec4899" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div style={glassStyle} className="lg:col-span-4 p-8 border-0 flex flex-col">
           <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
             <PieChart className="w-4 h-4 text-accent" /> {t("analz.platforms")}
           </h3>
           <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-6">
                 {platformData.map(p => {
                    const maxImp = Math.max(...platformData.map(d => d.imp));
                    const pct = maxImp > 0 ? (p.imp / maxImp) * 100 : 0;
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{p.name}</span>
                           <span className="text-xs font-black text-foreground">{p.imp.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground ml-1">reach</span></span>
                        </div>
                        <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                           <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                 })}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div style={glassStyle} className="p-8 border-0">
            <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" /> {t("analz.conversion")}
            </h3>
            <div className="space-y-4">
               {funnelData.map((stage, i) => {
                  const maxVal = funnelData[0].value || 1;
                  const pct = Math.round((stage.value / maxVal) * 100);
                  return (
                    <div key={stage.name} className="relative">
                       <div className="flex justify-between items-center mb-2 px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stage.name}</span>
                          <span className="text-xs font-black text-foreground">{stage.value} <span className="text-[9px] text-muted-foreground font-normal ml-1">({pct}%)</span></span>
                       </div>
                       <div className="h-10 w-full bg-muted/20 rounded-2xl overflow-hidden flex items-center px-4">
                          <div className="h-6 rounded-lg transition-all duration-1000 flex items-center justify-end pr-3" style={{ width: `${Math.max(pct, 5)}%`, background: stage.fill }}>
                             {pct > 15 && <span className="text-[9px] font-black text-white">{pct}%</span>}
                          </div>
                       </div>
                    </div>
                  )
               })}
            </div>
         </div>

         <div style={glassStyle} className="p-8 border-0">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                 <Heart className="w-4 h-4 text-accent" /> {t("analz.topPosts")}
               </h3>
               <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-accent p-0 h-auto" onClick={() => setLocation("/social-media")}>All Media</Button>
            </div>
            <div className="space-y-4">
               {posts.filter(p => p.engagementMetrics).slice(0, 4).map((post: any) => (
                 <div key={post.id} className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-muted/30 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 overflow-hidden flex-shrink-0">
                       {post.mediaUrls?.[0] ? <img src={post.mediaUrls[0]} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-3 text-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold text-foreground line-clamp-1">{post.content || "Branded Media Content"}</p>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[9px] font-black text-muted-foreground"><Heart className="w-2.5 h-2.5" /> {post.engagementMetrics?.likes || 0}</span>
                          <span className="flex items-center gap-1 text-[9px] font-black text-muted-foreground"><MessageCircle className="w-2.5 h-2.5" /> {post.engagementMetrics?.comments || 0}</span>
                       </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                 </div>
               ))}
               {posts.length === 0 && (
                 <div className="py-10 text-center text-muted-foreground/50 text-xs font-bold italic">No media data available</div>
               )}
            </div>
         </div>
      </div>
    </DashboardLayout>
  );
}

function Download(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  )
}

function ImageIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
  )
}
