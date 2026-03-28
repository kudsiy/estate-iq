import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, FunnelChart, Funnel, LabelList,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp, Users, Heart, MessageCircle, Share2,
  Target, Eye, MousePointer, BarChart2, ArrowRight,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  facebook:  "#1877F2",
  instagram: "#E1306C",
  tiktok:    "#010101",
};

function last30Days(): { label: string; date: string }[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      label: d.toLocaleDateString("en-ET", { month: "short", day: "numeric" }),
      date:  d.toISOString().slice(0, 10),
    };
  });
}

function last7Days(): { label: string; date: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString("en-ET", { weekday: "short" }),
      date:  d.toISOString().slice(0, 10),
    };
  });
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color = "text-accent",
}: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyChart({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center text-center gap-2">
      <BarChart2 className="w-8 h-8 text-muted-foreground opacity-25" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && onAction && (
        <Button size="sm" variant="outline" onClick={onAction} className="mt-1 text-xs h-7 gap-1">
          {action} <ArrowRight className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();

  const { data: posts = [] }    = trpc.crm.socialMediaPosts.list.useQuery();
  const { data: contacts = [] } = trpc.crm.contacts.list.useQuery();
  const { data: leads = [] }    = trpc.crm.leads.list.useQuery();
  const { data: deals = [] }    = trpc.crm.deals.list.useQuery();

  // ── aggregate all engagementMetrics stored in post JSON fields ─────────────
  const allMetrics = useMemo(() => {
    return posts.flatMap((p) => {
      const m = (p.engagementMetrics as any) ?? {};
      const platforms = (p.platforms as string[]) ?? [];
      return platforms.map((platform) => ({
        postId: p.id,
        platform,
        likes:       m.likes       ?? 0,
        comments:    m.comments    ?? 0,
        shares:      m.shares      ?? 0,
        impressions: m.impressions ?? 0,
        clicks:      m.clicks      ?? 0,
        leads:       m.leads       ?? 0,
        date: p.publishedAt ?? p.scheduledTime ?? p.createdAt,
      }));
    });
  }, [posts]);

  // ── KPI totals ─────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalPosts    = posts.filter((p) => p.status === "published").length;
    const totalLikes    = allMetrics.reduce((s, m) => s + m.likes, 0);
    const totalComments = allMetrics.reduce((s, m) => s + m.comments, 0);
    const totalShares   = allMetrics.reduce((s, m) => s + m.shares, 0);
    const totalImpressions = allMetrics.reduce((s, m) => s + m.impressions, 0);
    const totalLeadsFromSocial = allMetrics.reduce((s, m) => s + m.leads, 0);
    const engagementRate = totalImpressions > 0
      ? ((totalLikes + totalComments + totalShares) / totalImpressions * 100).toFixed(1)
      : "—";
    return { totalPosts, totalLikes, totalComments, totalShares, totalImpressions, totalLeadsFromSocial, engagementRate };
  }, [posts, allMetrics]);

  // ── per-platform totals ────────────────────────────────────────────────────
  const platformData = useMemo(() => {
    return ["facebook", "instagram", "tiktok"].map((platform) => {
      const rows = allMetrics.filter((m) => m.platform === platform);
      return {
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        likes:       rows.reduce((s, m) => s + m.likes, 0),
        comments:    rows.reduce((s, m) => s + m.comments, 0),
        shares:      rows.reduce((s, m) => s + m.shares, 0),
        impressions: rows.reduce((s, m) => s + m.impressions, 0),
        leads:       rows.reduce((s, m) => s + m.leads, 0),
      };
    });
  }, [allMetrics]);

  // ── posts over last 30 days ────────────────────────────────────────────────
  const postTrend = useMemo(() => {
    const days = last30Days();
    return days
      .filter((_, i) => i % 3 === 0) // every 3 days for readability
      .map(({ label, date }) => ({
        label,
        posts:    posts.filter((p) => (p.scheduledTime ?? p.createdAt)?.toString().slice(0, 10) === date).length,
        leads:    leads.filter((l) => l.createdAt.toString().slice(0, 10) === date).length,
        contacts: contacts.filter((c) => c.createdAt.toString().slice(0, 10) === date).length,
      }));
  }, [posts, leads, contacts]);

  // ── lead funnel ────────────────────────────────────────────────────────────
  const funnelData = useMemo(() => {
    const totalLeads = leads.length;
    const contacted  = leads.filter((l) => l.status === "contacted" || l.status === "qualified" || l.status === "converted").length;
    const qualified  = leads.filter((l) => l.status === "qualified" || l.status === "converted").length;
    const converted  = leads.filter((l) => l.status === "converted").length;
    const closed     = deals.filter((d) => d.stage === "closed").length;

    return [
      { name: "Leads captured",  value: totalLeads, fill: "#5a8bc4" },
      { name: "Contacted",       value: contacted,  fill: "#4a7ab8" },
      { name: "Qualified",       value: qualified,  fill: "#3a6aac" },
      { name: "Converted",       value: converted,  fill: "#2a5aa0" },
      { name: "Deals closed",    value: closed,     fill: "#1a4a94" },
    ];
  }, [leads, deals]);

  // ── top posts by engagement ────────────────────────────────────────────────
  const topPosts = useMemo(() => {
    return posts
      .filter((p) => p.engagementMetrics)
      .map((p) => {
        const m = (p.engagementMetrics as any) ?? {};
        const total = (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0);
        return { ...p, totalEngagement: total };
      })
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 5);
  }, [posts]);

  const hasPosts = posts.length > 0;
  const hasLeads = leads.length > 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Performance across social media, leads and deals
        </p>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={TrendingUp}     label="Published posts"    value={kpis.totalPosts}            color="text-accent"       />
        <StatCard icon={Heart}          label="Total likes"        value={kpis.totalLikes}            color="text-pink-500"     />
        <StatCard icon={MessageCircle}  label="Comments"           value={kpis.totalComments}         color="text-blue-500"     />
        <StatCard icon={Share2}         label="Shares"             value={kpis.totalShares}           color="text-violet-500"   />
        <StatCard icon={Eye}            label="Impressions"        value={kpis.totalImpressions}      color="text-amber-500"    />
        <StatCard icon={Target}         label="Engagement rate"    value={`${kpis.engagementRate}%`}  color="text-green-500"    />
      </div>

      {/* ── Row 1: Activity trend + Platform breakdown ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Activity trend */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity trend</CardTitle>
            <CardDescription className="text-xs">Posts, leads and contacts — last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasPosts && !hasLeads ? (
              <EmptyChart
                message="Start scheduling posts and capturing leads to see your trend"
                action="Go to Social Media"
                onAction={() => setLocation("/social-media")}
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={postTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="posts"    name="Posts"    stroke="#5a8bc4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="leads"    name="Leads"    stroke="#d4af37" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="contacts" name="Contacts" stroke="#5ac47b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Platform breakdown */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platform performance</CardTitle>
            <CardDescription className="text-xs">Engagement by platform</CardDescription>
          </CardHeader>
          <CardContent>
            {allMetrics.length === 0 ? (
              <EmptyChart
                message="No engagement data yet — publish posts to see platform stats"
                action="Schedule a post"
                onAction={() => setLocation("/social-media")}
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="platform" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="likes"    name="Likes"    fill="#5a8bc4" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="comments" name="Comments" fill="#7b6fc4" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="shares"   name="Shares"   fill="#d4af37" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Lead funnel + Top posts ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Lead conversion funnel */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead conversion funnel</CardTitle>
            <CardDescription className="text-xs">From capture to closed deal</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasLeads ? (
              <EmptyChart
                message="Capture leads to see your conversion funnel"
                action="Go to Lead Capture"
                onAction={() => setLocation("/leads")}
              />
            ) : (
              <div className="space-y-2 pt-2">
                {funnelData.map((stage, i) => {
                  const pct = funnelData[0].value > 0
                    ? Math.round((stage.value / funnelData[0].value) * 100)
                    : 0;
                  return (
                    <div key={stage.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{stage.name}</span>
                        <span className="text-xs font-medium text-foreground">
                          {stage.value} <span className="text-muted-foreground font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-6 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-700 flex items-center pl-2"
                          style={{ width: `${Math.max(pct, 4)}%`, background: stage.fill }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Conversion rate:{" "}
                    <span className="font-medium text-foreground">
                      {funnelData[0].value > 0
                        ? `${Math.round((funnelData[4].value / funnelData[0].value) * 100)}%`
                        : "—"
                      }
                    </span>
                    {" "}lead to closed deal
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top posts */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Top posts by engagement</CardTitle>
                <CardDescription className="text-xs">Best performing content</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7"
                onClick={() => setLocation("/social-media")}>
                All posts
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topPosts.length === 0 ? (
              <EmptyChart
                message="No posts with engagement data yet"
                action="Schedule a post"
                onAction={() => setLocation("/social-media")}
              />
            ) : (
              <div className="space-y-3">
                {topPosts.map((post, i) => {
                  const m = (post.engagementMetrics as any) ?? {};
                  const platforms = (post.platforms as string[]) ?? [];
                  return (
                    <div key={post.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-1">{post.content ?? "No content"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{m.likes ?? 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{m.comments ?? 0}</span>
                          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{m.shares ?? 0}</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-accent shrink-0">
                        {post.totalEngagement}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── CRM summary ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total contacts",
            value: contacts.length,
            sub: `${contacts.filter((c) => c.status === "active").length} active`,
            icon: Users, color: "text-accent",
            action: () => setLocation("/crm/contacts"),
          },
          {
            label: "Total leads",
            value: leads.length,
            sub: `${leads.filter((l) => l.status === "new").length} new`,
            icon: Target, color: "text-blue-500",
            action: () => setLocation("/leads"),
          },
          {
            label: "Open deals",
            value: deals.filter((d) => d.stage !== "closed").length,
            sub: `${deals.filter((d) => d.stage === "closed").length} closed`,
            icon: TrendingUp, color: "text-green-500",
            action: () => setLocation("/crm/deals"),
          },
          {
            label: "Social leads",
            value: kpis.totalLeadsFromSocial,
            sub: "from post metrics",
            icon: MousePointer, color: "text-amber-500",
            action: () => setLocation("/social-media"),
          },
        ].map((k) => (
          <button
            key={k.label}
            onClick={k.action}
            className="bg-card border border-border rounded-xl px-4 py-3 text-left hover:border-accent/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
          </button>
        ))}
      </div>
    </DashboardLayout>
  );
}
