import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle, CheckCircle, Users, Flame } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be authenticated to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = "/api/oauth/login"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Welcome back, {user?.name || "Agent"}! 👋</h1>
          <p className="text-lg text-muted-foreground">Here's your real estate performance today</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">3</div>
              <p className="text-xs text-muted-foreground mt-1">+2 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Posts Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">5</div>
              <p className="text-xs text-muted-foreground mt-1">All listings posted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unread Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">2</div>
              <p className="text-xs text-muted-foreground mt-1">Respond now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">12%</div>
              <p className="text-xs text-muted-foreground mt-1">Above average</p>
            </CardContent>
          </Card>
        </div>

        {/* Urgency Alerts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Urgency Alerts</h2>
          
          <Card className="border-l-4 border-l-red-600 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-600" />
                <CardTitle className="text-lg">🔥 New Leads Waiting!</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You have 2 new leads that need your attention. Respond within the next hour for best results.</p>
              <Button className="bg-red-600 hover:bg-red-700">Follow Up Now</Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-600 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg">⚠️ Haven't Posted Today</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You have 3 listings ready to post. Posting now will increase visibility and lead generation.</p>
              <Button className="bg-amber-600 hover:bg-amber-700">Post Now</Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Recent Leads</h2>
          
          <div className="space-y-3">
            {[
              { name: "John Doe", property: "123 Main St", status: "new", time: "5 mins ago" },
              { name: "Jane Smith", property: "456 Oak Ave", status: "contacted", time: "2 hours ago" },
              { name: "Mike Johnson", property: "789 Pine Rd", status: "new", time: "1 hour ago" }
            ].map((lead, idx) => (
              <Card key={idx} className={lead.status === "new" ? "border-l-4 border-l-accent bg-accent/5" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{lead.name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.property}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lead.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.status === "new" ? (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">NEW</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">CONTACTED</span>
                      )}
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="h-20 text-lg font-semibold bg-accent hover:bg-accent/90">
              ➕ Add New Listing
            </Button>
            <Button variant="outline" className="h-20 text-lg font-semibold">
              📊 View Analytics
            </Button>
            <Button variant="outline" className="h-20 text-lg font-semibold">
              🎨 Brand Studio
            </Button>
            <Button variant="outline" className="h-20 text-lg font-semibold">
              💬 Message Leads
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
