import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User,
  Bell,
  Link2,
  Shield,
  Building2,
  Facebook,
  Instagram,
  MessageCircle,
  Mail,
  ExternalLink,
  Phone,
  Share2,
} from "lucide-react";

type IntegrationStatus = "live" | "needs_setup" | "demo";

type NotificationPreference = {
  key: string;
  label: string;
  sub: string;
  enabled: boolean;
};

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const meta: Record<IntegrationStatus, { label: string; classes: string }> = {
    live: { label: "Live", classes: "bg-green-50 text-green-700" },
    demo: { label: "Demo", classes: "bg-amber-50 text-amber-700" },
    needs_setup: { label: "Needs setup", classes: "bg-blue-50 text-blue-700" },
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta[status].classes}`}>
      {meta[status].label}
    </span>
  );
}

function IntegrationCard({
  icon: Icon,
  iconBg,
  iconColor,
  name,
  description,
  status,
  docsUrl,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  docsUrl?: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border p-4 hover:bg-muted/20 transition-colors">
      <div className={`h-10 w-10 shrink-0 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <StatusBadge status={status} />
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {docsUrl ? (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 shrink-0"
          onClick={() => window.open(docsUrl, "_blank")}
        >
          <ExternalLink className="h-3 w-3" />
          Docs
        </Button>
      ) : null}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const defaultNotificationPreferences: NotificationPreference[] = [
    { key: "newLead", label: "New lead captured", sub: "When a lead arrives through a working capture channel.", enabled: true },
    { key: "dealStage", label: "Deal stage changed", sub: "When a deal moves between pipeline stages.", enabled: true },
    { key: "supplierReview", label: "Supplier listing review", sub: "When a new supplier listing lands in the review inbox.", enabled: true },
    { key: "matchAlert", label: "Hot buyer match", sub: "When a buyer profile finds a high-confidence listing match.", enabled: true },
    { key: "publishFailure", label: "Publishing failure", sub: "When a scheduled social post fails to publish.", enabled: true },
  ];
  const storedNotificationPreferences = Array.isArray(user?.notificationPreferences)
    ? (user.notificationPreferences as Array<{ key?: string; enabled?: boolean }>)
    : [];
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    companyName: user?.companyName ?? "",
    phone: user?.phone ?? "",
    role: (user?.role ?? "agent") as "agent" | "team_member" | "admin" | "user",
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>(
    storedNotificationPreferences.length > 0
      ? defaultNotificationPreferences.map((pref) => {
          const stored = storedNotificationPreferences.find((item) => item?.key === pref.key);
          return stored ? { ...pref, enabled: Boolean(stored.enabled) } : pref;
        })
      : defaultNotificationPreferences
  );

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Profile updated.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const appModules = useMemo(
    () => [
      ["CRM", "live", "Contacts, deals, listings, and manual leads are active."],
      ["Onboarding", "live", "First-run workspace setup is now required for new users."],
      ["Brand Kit", "live", "Brand kits persist, but auto-apply is still pending."],
      ["Supplier Inbox", "live", "Manual supplier intake, duplicate review, and property import are active."],
      ["Matching Engine", "live", "Buyer requirement profiles and scored listing matches are active."],
      ["Social Publishing", "needs_setup", "Scheduler is ready; direct platform publishing is not yet connected."],
      ["Notifications", "live", "Preference storage and in-app alerts are now active for core workflow events."],
    ],
    []
  );

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profile);
  };

  const handleSaveNotifications = () => {
    updateProfileMutation.mutate({
      notificationPreferences,
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details and see which integrations are live versus still awaiting setup.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6 h-9">
          <TabsTrigger value="profile" className="text-xs">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="text-xs">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="border border-border lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Personal information</CardTitle>
                <CardDescription className="text-xs">
                  These fields persist to your account and workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-2xl font-semibold text-accent">
                    {(user?.name ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">{user?.role ?? "agent"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Full name</Label>
                    <Input className="mt-1 h-8 text-sm" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input className="mt-1 h-8 text-sm" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Company / agency name</Label>
                    <Input className="mt-1 h-8 text-sm" value={profile.companyName} onChange={(event) => setProfile((current) => ({ ...current, companyName: event.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input className="mt-1 h-8 text-sm" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
                  </div>
                </div>

                <Button className="h-8 bg-accent text-sm text-white hover:bg-accent/90" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save profile"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Product status</CardTitle>
                <CardDescription className="text-xs">Transparent feature states based on the current build.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Estate IQ</p>
                    <p className="text-xs text-muted-foreground">Current workspace-enabled build</p>
                  </div>
                </div>

                {appModules.map(([module, status, desc]) => (
                  <div key={module} className="rounded-lg border border-border px-3 py-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">{module}</span>
                      <StatusBadge status={status as IntegrationStatus} />
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-0">
          <div className="space-y-4">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Social media</CardTitle>
                <CardDescription className="text-xs">
                  These are documented setup targets. Direct publishing is not yet connected inside this build.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <IntegrationCard
                  icon={Facebook}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-700"
                  name="Facebook Pages"
                  description="Required for future direct publishing and Lead Ads import. Estate IQ does not publish to Facebook yet."
                  status="needs_setup"
                  docsUrl="https://developers.facebook.com/docs/pages/getting-started"
                />
                <IntegrationCard
                  icon={Instagram}
                  iconBg="bg-pink-50"
                  iconColor="text-pink-700"
                  name="Instagram Business"
                  description="Planned for feed and reel publishing. This screen documents requirements only."
                  status="needs_setup"
                  docsUrl="https://developers.facebook.com/docs/instagram-api"
                />
                <IntegrationCard
                  icon={Share2}
                  iconBg="bg-gray-100"
                  iconColor="text-gray-800"
                  name="TikTok for Business"
                  description="Future integration target for video publishing. No direct Estate IQ connection yet."
                  status="needs_setup"
                  docsUrl="https://developers.tiktok.com/doc/login-kit-web"
                />
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Messaging & communication</CardTitle>
                <CardDescription className="text-xs">
                  These channels are planned. They are not connected to automated workflows yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <IntegrationCard
                  icon={MessageCircle}
                  iconBg="bg-green-50"
                  iconColor="text-green-700"
                  name="WhatsApp Business API"
                  description="Planned for lead capture and follow-up automation. Estate IQ currently offers no live WhatsApp sync."
                  status="demo"
                  docsUrl="https://developers.facebook.com/docs/whatsapp"
                />
                <IntegrationCard
                  icon={Mail}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                  name="SendGrid Email"
                  description="Reserved for future email notifications and follow-up automation."
                  status="demo"
                  docsUrl="https://docs.sendgrid.com"
                />
                <IntegrationCard
                  icon={Phone}
                  iconBg="bg-red-50"
                  iconColor="text-red-600"
                  name="Twilio SMS"
                  description="Reserved for future SMS alerts and workflow automation."
                  status="demo"
                  docsUrl="https://www.twilio.com/docs/sms"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Card className="max-w-2xl border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Notification preferences</CardTitle>
              <CardDescription className="text-xs">
                Preferences now persist to your account and control in-app alert creation for supported events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificationPreferences.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotificationPreferences((current) =>
                          current.map((pref) =>
                            pref.key === item.key ? { ...pref, enabled: !pref.enabled } : pref
                          )
                        )
                      }
                      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${item.enabled ? "bg-accent" : "bg-border"}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${item.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Supported today: new leads, deal stage changes, supplier reviews, hot matches, and publishing failures.
                </p>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSaveNotifications} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-0">
          <div className="max-w-lg space-y-4">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-foreground">Signed in as</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">Active</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-destructive">Danger zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Clear all data</p>
                    <p className="text-xs text-muted-foreground">This is intentionally disabled until scoped deletes and export flows are finished.</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 border-destructive text-xs text-destructive hover:bg-destructive/5" onClick={() => toast.info("Disabled until full destructive action safeguards are added.")}>
                    Disabled
                  </Button>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Export all data</p>
                    <p className="text-xs text-muted-foreground">Still planned for a later release after export packaging and audit safeguards are added.</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.info("Export is not implemented yet.")}>
                    Coming soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
