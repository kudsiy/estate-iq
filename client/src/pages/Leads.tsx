import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function Leads() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be authenticated to access leads</CardDescription>
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
          <h1 className="text-4xl font-bold text-foreground">Lead Management</h1>
          <p className="text-lg text-muted-foreground">Track and manage your real estate leads</p>
        </div>

        {/* Lead Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                New Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">3</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">5</div>
              <p className="text-xs text-muted-foreground mt-1">Being followed up</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Qualified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">8</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to close</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">32%</div>
              <p className="text-xs text-muted-foreground mt-1">Above average</p>
            </CardContent>
          </Card>
        </div>

        {/* New Leads */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">🔴 New Leads (3)</h2>
          <div className="space-y-3">
            {[
              { name: "John Doe", email: "john@example.com", phone: "(555) 123-4567", property: "123 Main St", time: "5 mins ago" },
              { name: "Jane Smith", email: "jane@example.com", phone: "(555) 234-5678", property: "456 Oak Ave", time: "1 hour ago" },
              { name: "Mike Johnson", email: "mike@example.com", phone: "(555) 345-6789", property: "789 Pine Rd", time: "2 hours ago" }
            ].map((lead, idx) => (
              <Card key={idx} className="border-l-4 border-l-red-600 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{lead.name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.property}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lead.time}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">NEW</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      <Mail className="w-4 h-4" />
                      {lead.email}
                    </a>
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      <Phone className="w-4 h-4" />
                      {lead.phone}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-red-600 hover:bg-red-700">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" className="flex-1">Move to In Progress</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* In Progress Leads */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">⏳ In Progress (5)</h2>
          <div className="space-y-3">
            {[
              { name: "Sarah Williams", property: "321 Elm St", status: "Awaiting response", followUp: "Tomorrow" },
              { name: "Tom Brown", property: "654 Maple Dr", status: "Scheduled viewing", followUp: "Saturday" }
            ].map((lead, idx) => (
              <Card key={idx} className="border-l-4 border-l-yellow-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{lead.name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.property}</p>
                      <p className="text-xs text-muted-foreground mt-1">Follow up: {lead.followUp}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">{lead.status}</span>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Qualified Leads */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">✅ Qualified (8)</h2>
          <div className="space-y-3">
            {[
              { name: "Lisa Anderson", property: "987 Cedar Ln", status: "Ready to close", deal: "$425,000" },
              { name: "David Martinez", property: "246 Birch St", status: "Offer pending", deal: "$550,000" }
            ].map((lead, idx) => (
              <Card key={idx} className="border-l-4 border-l-green-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{lead.name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.property}</p>
                      <p className="text-sm font-semibold text-green-600 mt-1">{lead.deal}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">{lead.status}</span>
                      <Button className="bg-green-600 hover:bg-green-700" size="sm">Close Deal</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
