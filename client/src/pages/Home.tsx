import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { BarChart3, Palette, MessageSquare, Zap, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Estate IQ</h1>
            <p className="text-xl text-muted-foreground mb-8">Your comprehensive real estate intelligence platform</p>
            <Link href="/dashboard">
              <Button className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">EQ</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Estate IQ</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="outline">Pricing</Button>
            </Link>
            <a href={getLoginUrl()}>
              <Button className="bg-accent hover:bg-accent/90 text-white">Sign In</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Unified Real Estate Intelligence Platform for Ethiopian Agents
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Manage leads, close deals faster, and grow your real estate business with our all-in-one CRM, design studio, and social media automation platform.
          </p>
          <div className="flex justify-center gap-3">
            <a href={getLoginUrl()}>
              <Button className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg">Get Started Free</Button>
            </a>
            <Link href="/pricing">
              <Button variant="outline" className="px-8 py-6 text-lg">View Pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-foreground text-center mb-12">Powerful Features for Modern Real Estate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-8 h-8 text-accent mb-2" />
              <CardTitle>CRM & Lead Management</CardTitle>
              <CardDescription>Manage buyers and sellers with customizable contact fields</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Track interactions, score leads, and automate follow-ups to convert more prospects into clients.</p>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Deal Pipeline Tracker</CardTitle>
              <CardDescription>Drag-and-drop pipeline with 5 deal stages</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Visualize your sales process from lead to closed deal with real-time pipeline analytics.</p>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Palette className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Design Studio</CardTitle>
              <CardDescription>Create stunning marketing materials</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Design property posters, Instagram posts, flyers, and reels with drag-and-drop ease.</p>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Social Media Automation</CardTitle>
              <CardDescription>Schedule content and prepare multi-platform publishing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Schedule posts, manage platform-ready content, and prepare for direct publishing integrations as they come online.</p>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Engagement Analytics</CardTitle>
              <CardDescription>Track post performance and campaign signals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Measure stored engagement metrics, compare platform activity, and build toward deeper ROI reporting.</p>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Lead Capture System</CardTitle>
              <CardDescription>Capture and convert leads from live and planned channels</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Capture leads through manual entry and website-ready flows today, with WhatsApp and social import paths expanding over time.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-card border border-border rounded-lg p-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Ready to Transform Your Real Estate Business?</h3>
          <p className="text-lg text-muted-foreground mb-8">Join Ethiopian real estate professionals using Estate IQ to grow their businesses.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg">Start Free Trial</Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
          <p>&copy; 2026 Estate IQ. All rights reserved. Built for the Ethiopian real estate market.</p>
        </div>
      </footer>
    </div>
  );
}
