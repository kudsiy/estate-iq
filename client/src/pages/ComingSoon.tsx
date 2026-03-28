import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Home, Target, Palette, Share2, BarChart2, Sparkles, Clock,
} from "lucide-react";

const PAGE_META: Record<string, { icon: React.ElementType; label: string; description: string; color: string }> = {
  "/properties": {
    icon: Home,
    label: "Property Management",
    description: "List properties, upload photos, manage pricing and availability — all in one place.",
    color: "text-blue-500",
  },
  "/leads": {
    icon: Target,
    label: "Lead Capture",
    description: "Build embeddable forms, capture WhatsApp and Facebook leads, and auto-sync to your CRM.",
    color: "text-orange-500",
  },
  "/design-studio": {
    icon: Palette,
    label: "Design Studio",
    description: "Drag-and-drop canvas editor for property posters, Instagram posts, listing flyers and reel thumbnails.",
    color: "text-purple-500",
  },
  "/social-media": {
    icon: Share2,
    label: "Social Media Scheduler",
    description: "Post once, publish to Facebook, Instagram and TikTok. Schedule with a visual calendar and queue.",
    color: "text-pink-500",
  },
  "/analytics": {
    icon: BarChart2,
    label: "Engagement Analytics",
    description: "Track likes, comments, reach and lead conversions across all platforms in real time.",
    color: "text-green-500",
  },
  "/brand-kit": {
    icon: Sparkles,
    label: "Brand Kit Manager",
    description: "Store your logo, colour palette and fonts. Apply your brand to designs in one click.",
    color: "text-amber-500",
  },
};

export default function ComingSoon({ path }: { path: string }) {
  const [, setLocation] = useLocation();
  const meta = PAGE_META[path] ?? {
    icon: Clock,
    label: "Coming Soon",
    description: "This module is being built next.",
    color: "text-muted-foreground",
  };
  const Icon = meta.icon;

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className={`w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6`}>
          <Icon className={`w-8 h-8 ${meta.color}`} />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">{meta.label}</h1>
        <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
          {meta.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-4 py-2 rounded-full mb-8">
          <Clock className="w-3.5 h-3.5" />
          Being built — coming in the next session
        </div>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </DashboardLayout>
  );
}
