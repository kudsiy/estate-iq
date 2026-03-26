import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingUp, Bell, CheckCircle, Users, Flame, Target, Gauge } from "lucide-react";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
              <span className="text-white font-bold text-lg">EQ</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Estate IQ</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-accent">v1.3 - Sticky SaaS</div>
            <Button 
              onClick={() => window.location.href = "/api/oauth/login"}
              className="bg-accent hover:bg-accent/90 text-white font-semibold"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <p className="text-sm font-semibold text-accent">🚀 Major Release</p>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              The Real Estate Agent's <span className="text-accent">Daily Operating System</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Estate IQ v1.3 transforms how agents work. No more distractions. No more confusion. Just one clear loop: <strong>List → Post → Lead → CRM → Repeat</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              onClick={() => window.location.href = "/dashboard"}
              className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg font-bold rounded-lg"
            >
              View Live Demo
            </Button>
            <Button variant="outline" className="px-8 py-6 text-lg font-semibold rounded-lg">
              Download Guide
            </Button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="text-4xl font-bold text-accent mb-2">5x</div>
              <p className="text-sm text-muted-foreground">Faster lead response time</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="text-4xl font-bold text-accent mb-2">3x</div>
              <p className="text-sm text-muted-foreground">More daily posts</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="text-4xl font-bold text-accent mb-2">40%</div>
              <p className="text-sm text-muted-foreground">Higher retention</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Loop */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-4xl font-bold text-foreground">The Core Loop</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A single, repeatable workflow that agents follow every day to generate leads and close deals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Step 1: Listing */}
          <div className="relative">
            <Card className="border-2 border-accent bg-accent/5 h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <CardTitle className="text-lg">Add Listing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Agent creates a new property listing with all details.</p>
              </CardContent>
            </Card>
            <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 bg-accent rounded-full border-4 border-background transform -translate-y-1/2"></div>
          </div>

          {/* Step 2: Generate & Post */}
          <div className="relative">
            <Card className="border-2 border-accent bg-accent/5 h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <CardTitle className="text-lg">Generate & Post</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">AI generates content. One click posts everywhere.</p>
              </CardContent>
            </Card>
            <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 bg-accent rounded-full border-4 border-background transform -translate-y-1/2"></div>
          </div>

          {/* Step 3: Capture Lead */}
          <div className="relative">
            <Card className="border-2 border-accent bg-accent/5 h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <CardTitle className="text-lg">Capture Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Prospects click tracking link and express interest.</p>
              </CardContent>
            </Card>
            <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 bg-accent rounded-full border-4 border-background transform -translate-y-1/2"></div>
          </div>

          {/* Step 4: Manage in CRM */}
          <div className="relative">
            <Card className="border-2 border-accent bg-accent/5 h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-lg mb-4">
                  4
                </div>
                <CardTitle className="text-lg">Manage in CRM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Lead enters pipeline. Agent follows up and closes.</p>
              </CardContent>
            </Card>
            <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 bg-accent rounded-full border-4 border-background transform -translate-y-1/2"></div>
          </div>

          {/* Step 5: Feedback */}
          <div>
            <Card className="border-2 border-accent bg-accent/5 h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-lg mb-4">
                  5
                </div>
                <CardTitle className="text-lg">Dashboard Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Real-time metrics show ROI. Agent repeats.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-4xl font-bold text-foreground">What Makes v1.3 Sticky?</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four revolutionary features that keep agents coming back every single day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature 1: Dominant Generate & Post */}
          <Card className="border-2 border-border hover:border-accent transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Dominant "Generate & Post"</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The biggest, boldest button on the Listings page. Unposted listings appear in a RED ALERT section. No decision paralysis—just one clear action.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Red alert for unposted listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>One-click AI content generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Automatic tracking link creation</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 2: Urgency System */}
          <Card className="border-2 border-border hover:border-accent transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Urgency System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Five behavioral triggers that pull agents back into the app and create a sense of urgency and reward.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>🔥 New leads waiting (Critical)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>⚠️ Haven't posted today (Warning)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>⭐ Best performer hot (Success)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 3: Real-Time Money Signals */}
          <Card className="border-2 border-border hover:border-accent transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Real-Time Money Signals</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Dashboard updates every 5 seconds. Agents see new leads appear in real-time with emotional rewards.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Leads Today (most important metric)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Posts Today (activity signal)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Real-time lead feed with timestamps</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 4: Lead Capture with Trust */}
          <Card className="border-2 border-border hover:border-accent transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Lead Capture with Trust</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Beautiful tracking pages with professional property showcase and trust signals that reduce friction.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Split-layout: Property + Interest form</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Success confirmation with phone number</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Trust signals: Fast response, Secure, Verified</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Design Psychology */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-4xl font-bold text-foreground">Design Psychology Behind Stickiness</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every design decision is intentional. Here's what makes agents come back every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-border">
            <CardHeader>
              <div className="text-3xl mb-3">🎯</div>
              <CardTitle className="text-lg">Clear Core Loop</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No confusion. No options. Just one path: List → Post → Lead → CRM → Repeat.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <div className="text-3xl mb-3">⚡</div>
              <CardTitle className="text-lg">Urgency Triggers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Behavioral nudges that create FOMO and emotional rewards, pulling agents back daily.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <div className="text-3xl mb-3">💰</div>
              <CardTitle className="text-lg">Money Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Real-time metrics show immediate ROI. Agents see the money flowing in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <div className="text-3xl mb-3">✨</div>
              <CardTitle className="text-lg">Emotional Reward</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Success messages, green highlights, and celebration triggers make agents feel good.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* The Retention Loop */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-4xl font-bold text-foreground">The Retention Loop</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            How Estate IQ creates daily habits that keep agents engaged and generating revenue.
          </p>
        </div>

        <Card className="border-2 border-accent bg-accent/5">
          <CardContent className="pt-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Agent opens app</h4>
                  <p className="text-sm text-muted-foreground">Dashboard shows urgency triggers: "You have 2 listings ready to post"</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Agent clicks "Post Now"</h4>
                  <p className="text-sm text-muted-foreground">Goes to Listings page. Sees RED ALERT for unposted listings.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Agent clicks "Generate & Post"</h4>
                  <p className="text-sm text-muted-foreground">BIGGEST button on page. Listing is posted. Tracking link created.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Agent shares tracking link</h4>
                  <p className="text-sm text-muted-foreground">Prospect clicks link. Sees beautiful property page. Fills out interest form.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Lead is created in real-time</h4>
                  <p className="text-sm text-muted-foreground">Dashboard updates every 5 seconds. Agent sees: "🔥 New Lead: John Doe"</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  6
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Agent comes back to app</h4>
                  <p className="text-sm text-muted-foreground">Urgency trigger fires: "New Lead Waiting!" Agent clicks "Follow Up"</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  7
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Agent manages lead in CRM</h4>
                  <p className="text-sm text-muted-foreground">Moves through pipeline. Closes deal. Dashboard shows success: "Great Work Today!"</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold flex-shrink-0">
                  8
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Agent comes back tomorrow</h4>
                  <p className="text-sm text-muted-foreground">Habit formed. Repeats the loop. Generates more leads. Closes more deals.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Metrics & Results */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-4xl font-bold text-foreground">Expected Results</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            What agents can expect after switching to Estate IQ v1.3.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-2 border-border">
            <CardHeader>
              <div className="text-5xl font-bold text-accent mb-4">5x</div>
              <CardTitle>Faster Lead Response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Real-time notifications mean agents respond to leads within minutes, not hours. Higher conversion rates.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardHeader>
              <div className="text-5xl font-bold text-accent mb-4">3x</div>
              <CardTitle>More Daily Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Dominant "Generate & Post" action eliminates friction. Agents post more listings per day.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardHeader>
              <div className="text-5xl font-bold text-accent mb-4">40%</div>
              <CardTitle>Higher Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Urgency system and daily rewards keep agents coming back. Reduced churn. Higher lifetime value.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 space-y-8">
        <div className="bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-12 text-white text-center space-y-6">
          <h3 className="text-4xl font-bold">Ready to Transform Your Real Estate Business?</h3>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Estate IQ v1.3 is designed to make agents unstoppable. One clear loop. Daily habits. Real-time rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button className="bg-white text-accent hover:bg-white/90 px-8 py-6 text-lg font-bold rounded-lg">
              Start Free Trial
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-bold rounded-lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/50 backdrop-blur-md">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Estate IQ</h4>
              <p className="text-sm text-muted-foreground">The daily operating system for real estate agents.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">About</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Estate IQ. All rights reserved. | v1.3 - Sticky SaaS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
