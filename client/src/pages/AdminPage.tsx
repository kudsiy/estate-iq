import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [flag, setFlag] = useState({ key: "", description: "", enabled: false });

  const { data: overview, isLoading, error } = trpc.admin.overview.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const upsertMutation = trpc.admin.featureFlags.upsert.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.admin.overview.invalidate(), utils.admin.featureFlags.list.invalidate()]);
      setFlag({ key: "", description: "", enabled: false });
      toast.success("Feature flag updated");
    },
    onError: (mutationError) => toast.error(mutationError.message || "Failed to update feature flag"),
  });

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">Admin access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">This page is only available to the workspace owner/admin account.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal visibility for users, workspaces, subscription state, and feature flags.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading admin overview...</div>
      ) : error ? (
        <div className="text-sm text-destructive">{error.message}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Users</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-foreground">{overview?.counts.users ?? 0}</p></CardContent></Card>
            <Card className="border border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Admins</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-foreground">{overview?.counts.admins ?? 0}</p></CardContent></Card>
            <Card className="border border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Workspaces</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-foreground">{overview?.counts.workspaces ?? 0}</p></CardContent></Card>
            <Card className="border border-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active subscriptions</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-foreground">{overview?.counts.activeSubscriptions ?? 0}</p></CardContent></Card>
          </div>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Feature flags</CardTitle>
              <CardDescription className="text-xs">Flags are persisted centrally so unfinished modules can be hidden deliberately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr_auto_auto]">
                <div>
                  <Label className="text-xs">Key</Label>
                  <Input className="mt-1 h-8 text-sm" value={flag.key} onChange={(e) => setFlag((current) => ({ ...current, key: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input className="mt-1 h-8 text-sm" value={flag.description} onChange={(e) => setFlag((current) => ({ ...current, description: e.target.value }))} />
                </div>
                <label className="flex items-end gap-2 pb-1 text-sm text-foreground">
                  <input type="checkbox" checked={flag.enabled} onChange={(e) => setFlag((current) => ({ ...current, enabled: e.target.checked }))} />
                  Enabled
                </label>
                <Button className="self-end bg-accent text-white hover:bg-accent/90" onClick={() => upsertMutation.mutate(flag)} disabled={upsertMutation.isPending || !flag.key}>
                  {upsertMutation.isPending ? "Saving..." : "Save flag"}
                </Button>
              </div>

              <div className="space-y-2">
                {overview?.flags.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.key}</p>
                      <p className="text-xs text-muted-foreground">{item.description || "No description"}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {item.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Workspace plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overview?.workspaces.map((workspace) => (
                <div key={workspace.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{workspace.name}</p>
                    <p className="text-xs text-muted-foreground">Plan: {workspace.plan} • Status: {workspace.subscriptionStatus}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Owner #{workspace.ownerUserId}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
