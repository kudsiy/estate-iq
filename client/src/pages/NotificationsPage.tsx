import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, Dot } from "lucide-react";
import { toast } from "sonner";

const TYPE_STYLES: Record<string, string> = {
  lead: "bg-blue-50 text-blue-700",
  deal: "bg-amber-50 text-amber-700",
  supplier: "bg-purple-50 text-purple-700",
  match: "bg-green-50 text-green-700",
  engagement: "bg-pink-50 text-pink-700",
  system: "bg-gray-100 text-gray-700",
};

export default function NotificationsPage() {
  const utils = trpc.useUtils();
  const { data: notifications = [] } = trpc.notifications.list.useQuery();
  const updateMutation = trpc.notifications.update.useMutation({
    onSuccess: async () => {
      await utils.notifications.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Failed to update notification"),
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational alerts for leads, deals, supplier reviews, and hot matches.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={unreadCount === 0 || updateMutation.isPending}
          onClick={() => notifications.filter((item) => !item.isRead).forEach((item) => updateMutation.mutate({ id: item.id, isRead: true }))}
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{notifications.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground">{notifications[0]?.title ?? "No alerts yet"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {notifications[0] ? new Date(notifications[0].createdAt).toLocaleString("en-ET") : "Your activity feed will show up here."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Inbox</CardTitle>
          <CardDescription className="text-xs">
            New activity is created automatically from working platform events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Lead capture, stage changes, supplier reviews, and hot matches will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors ${item.isRead ? "border-border bg-card" : "border-accent/20 bg-accent/5"}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!item.isRead && <Dot className="h-5 w-5 text-accent" />}
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${TYPE_STYLES[item.type] ?? TYPE_STYLES.system}`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("en-ET", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 text-xs"
                    onClick={() => updateMutation.mutate({ id: item.id, isRead: !item.isRead })}
                  >
                    {item.isRead ? "Mark unread" : "Mark read"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
