import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Palette } from "lucide-react";

export default function BrandStudio() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be authenticated to access Brand Studio</CardDescription>
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
          <h1 className="text-4xl font-bold text-foreground">🎨 Brand Studio</h1>
          <p className="text-lg text-muted-foreground">Create stunning property listings with AI-powered content generation</p>
        </div>

        {/* AI Content Generator */}
        <Card className="border-2 border-accent bg-accent/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" />
              <CardTitle className="text-xl">AI Content Generator</CardTitle>
            </div>
            <CardDescription>Generate professional property descriptions and marketing copy instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Property Address</label>
                <input 
                  type="text" 
                  placeholder="Enter property address" 
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Key Features</label>
                <textarea 
                  placeholder="Enter key features (beds, baths, amenities, etc.)" 
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                  rows={3}
                />
              </div>
              <Button className="w-full bg-accent hover:bg-accent/90 h-12 text-lg font-semibold">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Content
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Brand Templates */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Brand Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Professional", color: "from-blue-600 to-blue-400", desc: "Formal and elegant" },
              { name: "Modern", color: "from-purple-600 to-pink-400", desc: "Contemporary and trendy" },
              { name: "Luxury", color: "from-yellow-600 to-orange-400", desc: "Premium and exclusive" }
            ].map((template, idx) => (
              <Card key={idx} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-full h-24 rounded-lg bg-gradient-to-r ${template.color} mb-4`}></div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Use Template</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Designs */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Recent Designs</h2>
          <div className="space-y-3">
            {[
              { title: "123 Main Street - Professional", created: "2 hours ago", status: "Ready" },
              { title: "456 Oak Avenue - Luxury", created: "1 day ago", status: "Ready" },
              { title: "789 Pine Road - Modern", created: "3 days ago", status: "Ready" }
            ].map((design, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{design.title}</h3>
                      <p className="text-sm text-muted-foreground">{design.created}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">{design.status}</span>
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Edit</Button>
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
