import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const PLATFORM_OPTIONS = [
  { id: "telegram", label: "Telegram" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
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
      toast.success("Workspace is ready.");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete onboarding");
    },
  });

  const togglePlatform = (platform: string) => {
    setForm((current) => ({
      ...current,
      selectedPlatforms: current.selectedPlatforms.includes(platform)
        ? current.selectedPlatforms.filter((item) => item !== platform)
        : [...current.selectedPlatforms, platform],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Set Up Estate IQ</h1>
            <p className="text-sm text-muted-foreground">
              A quick setup so your dashboard, workspace, and CRM reflect how you work.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>First-Run Setup</CardTitle>
              <CardDescription>
                You can update these choices later in Settings. Agency name is the only required field.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="companyName">Agency / Workspace Name</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                  placeholder="e.g. Bole Real Estate"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="role">Your Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(role: typeof form.role) => setForm((current) => ({ ...current, role }))}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="team_member">Team Member</SelectItem>
                      <SelectItem value="admin">Owner / Admin</SelectItem>
                      <SelectItem value="user">General User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetMarket">Target Market</Label>
                  <Select
                    value={form.targetMarket}
                    onValueChange={(targetMarket) => setForm((current) => ({ ...current, targetMarket }))}
                  >
                    <SelectTrigger id="targetMarket">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_MARKETS.map((market) => (
                        <SelectItem key={market} value={market}>
                          {market}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Platforms You Plan To Use</Label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <label
                      key={platform.id}
                      className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm hover:border-accent/40"
                    >
                      <Checkbox
                        checked={form.selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => togglePlatform(platform.id)}
                      />
                      <span>{platform.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  className="bg-accent hover:bg-accent/90 text-white"
                  disabled={completeMutation.isPending || !form.companyName.trim()}
                  onClick={() =>
                    completeMutation.mutate({
                      companyName: form.companyName.trim(),
                      role: form.role,
                      targetMarket: form.targetMarket,
                      selectedPlatforms: form.selectedPlatforms as ("telegram" | "facebook" | "instagram" | "tiktok")[],
                    })
                  }
                >
                  {completeMutation.isPending ? "Saving..." : "Complete Setup"}
                </Button>
                <Button
                  variant="outline"
                  disabled={completeMutation.isPending}
                  onClick={() =>
                    completeMutation.mutate({
                      companyName: form.companyName.trim() || user?.companyName || "My Workspace",
                      role: form.role,
                      targetMarket: form.targetMarket,
                      selectedPlatforms: form.selectedPlatforms as ("telegram" | "facebook" | "instagram" | "tiktok")[],
                      skip: true,
                    })
                  }
                >
                  Skip For Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card/90">
            <CardHeader>
              <CardTitle>What This Enables</CardTitle>
              <CardDescription>
                These settings drive your default workspace, CRM context, and platform setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Creates your personal workspace automatically.",
                "Sets your agency name for branding and future team setup.",
                "Prepares your lead, listing, and social workflow defaults.",
                "Lets us send you to the dashboard instead of setup on future logins.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
