import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Zap } from "lucide-react";

export default function ListingsPage() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be authenticated to access listings</CardDescription>
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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Your Listings</h1>
            <p className="text-lg text-muted-foreground">Manage and post your property listings</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 h-12 px-6 text-lg font-semibold">
            <Plus className="w-5 h-5 mr-2" />
            Add Listing
          </Button>
        </div>

        {/* Red Alert Section - Unposted Listings */}
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <CardTitle className="text-xl text-red-700">🔴 UNPOSTED LISTINGS</CardTitle>
            </div>
            <CardDescription>These listings are ready but not yet posted to social media</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { address: "123 Main Street, Downtown", beds: 3, baths: 2, price: "$450,000" },
              { address: "456 Oak Avenue, Suburbs", beds: 4, baths: 3, price: "$625,000" }
            ].map((listing, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-red-200 dark:border-red-800">
                <div>
                  <h3 className="font-semibold text-foreground">{listing.address}</h3>
                  <p className="text-sm text-muted-foreground">{listing.beds} bed • {listing.baths} bath • {listing.price}</p>
                </div>
                <Button className="bg-accent hover:bg-accent/90 font-bold text-lg px-8 h-12">
                  <Zap className="w-5 h-5 mr-2" />
                  Generate & Post
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Posted Listings */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">✅ Posted Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { address: "789 Pine Road, Hillside", beds: 3, baths: 2, price: "$395,000", posted: "2 days ago", views: 234, leads: 5 },
              { address: "321 Elm Street, Downtown", beds: 2, baths: 1, price: "$275,000", posted: "5 days ago", views: 456, leads: 12 },
              { address: "654 Maple Drive, Suburbs", beds: 5, baths: 3, price: "$750,000", posted: "1 week ago", views: 789, leads: 18 }
            ].map((listing, idx) => (
              <Card key={idx} className="border-l-4 border-l-green-600">
                <CardHeader>
                  <CardTitle className="text-lg">{listing.address}</CardTitle>
                  <CardDescription>{listing.beds} bed • {listing.baths} bath • {listing.price}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{listing.views}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{listing.leads}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">{listing.posted}</p>
                      <p className="text-xs text-muted-foreground">Posted</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">Edit</Button>
                    <Button variant="outline" className="flex-1">View</Button>
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
