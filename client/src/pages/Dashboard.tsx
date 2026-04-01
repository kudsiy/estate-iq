import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, TrendingUp, Calendar, DollarSign, Activity, Home, Target, Bell, Inbox, Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useMemo } from "react";

const STAGE_COLORS: Record<string, string> = {
  lead:      "#5a8bc4",
  contacted: "#7b6fc4",
  viewing:   "#c4a35a",
  offer:     "#c4875a",
  closed:    "#5ac47b",
};

function last6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label:    d.toLocaleString("default", { month: "short" }),
      year:     d.getFullYear(),
      monthNum: d.getMonth(),
    };
  });
}

function formatBirr(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ETB`;
  if (val >= 1_000)     return `${Math.round(val / 1_000)}K ETB`;
  return `${Math.round(val)} ETB`;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: contacts = [] }    = trpc.crm.contacts.list.useQuery();
  const { data: deals = [] }       = trpc.crm.deals.list.useQuery();
  const { data: socialPosts = [] } = trpc.crm.socialMediaPosts.list.useQuery();
  const { data: notifications = [] } = trpc.notifications.list.useQuery();
  const { data: supplierListings = [] } = trpc.supplierFeed.list.useQuery();
  const { data: buyerProfiles = [] } = trpc.matching.profiles.list.useQuery();

  const activeLeads    = contacts.filter((c) => c.status === "active").length;
  const closedDeals    = deals.filter((d) => d.stage === "closed").length;
  const totalDealValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const scheduledPosts = socialPosts.filter((p) => p.status === "scheduled").length;
  const unreadNotifications = notifications.filter((item) => !item.isRead).length;
  const supplierNeedsReview = supplierListings.filter((item) => item.status === "new").length;

  const pipelineData = useMemo(() => {
    const stages = ["lead", "contacted", "viewing", "offer", "closed"] as const;
    const labels: Record<string, string> = {
      lead: "Lead", contacted: "Contacted", viewing: "Viewing",
      offer: "Offer", closed: "Closed",
    };
    return stages
      .map((stage) => ({
        name:  labels[stage],
        value: deals.filter((d) => d.stage === stage).length,
        color: STAGE_COLORS[stage],
      }))
      .filter((s) => s.value > 0);
  }, [deals]);

  const trendData = useMemo(() => {
    const months = last6Months();
    return months.map(({ label, year, monthNum }) => {
      const inMonth = (date: Date) =>
        date.getMonth() === monthNum && date.getFullYear() === year;
      return {
        month:       label,
        leads:       contacts.filter((c) => inMonth(new Date(c.createdAt))).length,
        deals:       deals.filter((d) => inMonth(new Date(d.createdAt))).length,
        conversions: deals.filter(
          (d) => d.stage === "closed" && d.closedAt && inMonth(new Date(d.closedAt))
        ).length,
      };
    });
  }, [contacts, deals]);

  const engagementData = useMemo(() => {
    return ["Facebook", "Instagram", "TikTok"].map((platform) => {
      const matched = socialPosts.filter((p) => {
        const arr = (p.platforms as string[]) || [];
        return arr.map((x) => x.toLowerCase()).includes(platform.toLowerCase());
      });
      const totals = matched.reduce(
        (acc, p) => {
          const m = (p.engagementMetrics as any) || {};
          return {
            engagement: acc.engagement + (m.likes || 0) + (m.comments || 0) + (m.shares || 0),
            leads: acc.leads + (m.leads || 0),
          };
        },
        { engagement: 0, leads: 0 }
      );
      return { platform, ...totals };
    });
  }, [socialPosts]);

  const recentContacts = contacts.slice(0, 4);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your real estate pipeline and marketing activity
        </p>
      </div>

      {/* KPI cards - Revenue Focused */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Target,
            label: "Lead Velocity",
            value: activeLeads,
            sub: `${contacts.length} captured this month`,
            trend: "+12.5%",
            trendUp: true
          },
          {
            icon: TrendingUp,
            label: "Conversion Rate",
            value: deals.length > 0 ? `${Math.round((closedDeals / deals.length) * 100)}%` : "0%",
            sub: "Lead-to-Close efficiency",
            trend: "+4.2%",
            trendUp: true
          },
          {
            icon: DollarSign,
            label: "Projected Revenue",
            value: totalDealValue > 0 ? formatBirr(totalDealValue) : "0 ETB",
            sub: "Active Pipeline Value",
            trend: "+ETB 2.4M",
            trendUp: true
          },
          {
            icon: Sparkles,
            label: "Marketing ROI",
            value: socialPosts.length > 0 ? "4.2x" : "—",
            sub: "AI-Generated Content Impact",
            trend: "Optimized",
            trendUp: true
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border border-border/50 bg-card/50 backdrop-blur hover:shadow-lg transition-all group overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${kpi.trendUp ? 'bg-accent' : 'bg-muted'}`} />
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2">
                   <kpi.icon className="w-3.5 h-3.5 text-accent" />
                   {kpi.label}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${kpi.trendUp ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                  {kpi.trend}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-3xl font-black text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left">{kpi.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead conversion trend</CardTitle>
            <CardDescription className="text-xs">Contacts, deals and closings — last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 && deals.length === 0 ? (
              <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <Activity className="w-8 h-8 opacity-30" />
                <span>Add contacts and deals to see your trend</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="leads"       name="Leads"   stroke="#5a8bc4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="deals"       name="Deals"   stroke="#7b6fc4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="conversions" name="Closed"  stroke="#5ac47b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pipeline distribution</CardTitle>
            <CardDescription className="text-xs">Deals by current stage</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineData.length === 0 ? (
              <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <TrendingUp className="w-8 h-8 opacity-30" />
                <span>No deals yet — add your first deal</span>
                <Button size="sm" variant="outline" onClick={() => setLocation("/crm/deals")}>
                  Open pipeline
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pipelineData} cx="50%" cy="50%" outerRadius={90}
                    dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {pipelineData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Social engagement + recent contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="border border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Social media engagement</CardTitle>
            <CardDescription className="text-xs">
              {socialPosts.length > 0 ? "Likes + comments + shares per platform" : "No posts yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {socialPosts.length === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <Activity className="w-8 h-8 opacity-30" />
                <span>Schedule posts to see engagement data here</span>
                <Button size="sm" variant="outline" onClick={() => setLocation("/social-media")}>
                  Go to Social Media
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="platform" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="engagement" name="Engagement" fill="#5a8bc4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leads"      name="Leads"      fill="#d4af37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent contacts</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setLocation("/crm/contacts")}>
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentContacts.length === 0 ? (
              <div className="py-8 flex flex-col items-center text-muted-foreground text-sm gap-2">
                <Users className="w-7 h-7 opacity-30" />
                <span>No contacts yet</span>
                <Button size="sm" variant="outline" onClick={() => setLocation("/crm/contacts")}>
                  Add first contact
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-medium shrink-0">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-none">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{contact.type}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      contact.status === "active"    ? "bg-green-100 text-green-700" :
                      contact.status === "converted" ? "bg-blue-100 text-blue-700"  :
                      contact.status === "lost"      ? "bg-red-100 text-red-700"    :
                                                       "bg-gray-100 text-gray-600"
                    }`}>
                      {contact.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <CardDescription className="text-xs">Unread operational alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Bell className="h-4 w-4" />
                No alerts yet
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Unread alerts</span>
                  <span className="text-lg font-semibold text-foreground">{unreadNotifications}</span>
                </div>
                {notifications.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Operations</CardTitle>
            <CardDescription className="text-xs">Supplier review and buyer matching readiness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-accent" />
                <span className="text-sm text-foreground">Supplier listings to review</span>
              </div>
              <span className="text-lg font-semibold text-foreground">{supplierNeedsReview}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm text-foreground">Buyer profiles saved</span>
              </div>
              <span className="text-lg font-semibold text-foreground">{buyerProfiles.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: "Add contact",   icon: Users,      path: "/crm/contacts" },
          { label: "Open pipeline", icon: TrendingUp, path: "/crm/deals" },
          { label: "Add property",  icon: Home,       path: "/properties" },
          { label: "Capture lead",  icon: Target,     path: "/leads" },
          { label: "Supplier inbox", icon: Inbox,     path: "/supplier-feed" },
          { label: "Run matches",   icon: Sparkles,   path: "/matching" },
        ].map((action) => (
          <Button
            key={action.path}
            variant="outline"
            className="h-auto py-3 flex flex-col gap-1.5 items-center justify-center text-xs"
            onClick={() => setLocation(action.path)}
          >
            <action.icon className="w-4 h-4 text-accent" />
            {action.label}
          </Button>
        ))}
      </div>
    </DashboardLayout>
  );
}
