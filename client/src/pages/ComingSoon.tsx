import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useMemo } from "react";
import {
  Home, Target, Palette, Share2, BarChart2, Sparkles, Clock, 
  Zap, Cpu, ChevronLeft, Activity, Box
} from "lucide-react";
import { motion } from "framer-motion";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(32px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "40px",
  boxShadow: theme === "dark" ? "0 40px 80px rgba(0,0,0,0.5)" : "0 20px 30px -10px rgba(0,0,0,0.1)",
});

export default function ComingSoon({ path }: { path: string }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();

  const PAGE_META: Record<string, { icon: React.ElementType; label: string; description: string; color: string }> = {
    "/properties": {
      icon: Home,
      label: t("nav.properties"),
      description: t("soon.prop"),
      color: "text-blue-500",
    },
    "/leads": {
      icon: Target,
      label: "Capture Hub",
      description: t("soon.leads"),
      color: "text-orange-500",
    },
    "/design-studio": {
      icon: Palette,
      label: t("nav.studio"),
      description: t("soon.design"),
      color: "text-purple-500",
    },
    "/social-media": {
      icon: Share2,
      label: "Social Matrix",
      description: t("soon.social"),
      color: "text-pink-500",
    },
    "/analytics": {
      icon: BarChart2,
      label: t("nav.analytics"),
      description: t("soon.analytics"),
      color: "text-green-500",
    },
    "/brand-kit": {
      icon: Sparkles,
      label: "Identity Kit",
      description: t("soon.brand"),
      color: "text-amber-500",
    },
  };

  const meta = useMemo(() => PAGE_META[path] ?? {
    icon: Box,
    label: t("soon.title"),
    description: t("soon.sub"),
    color: "text-muted-foreground",
  }, [path, t]);

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);
  const Icon = meta.icon;

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative p-6">
        
        {/* Aesthetic Background Accents */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] ${meta.color.replace('text-', 'bg-')}/5 blur-[120px] rounded-full animate-pulse`} />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={glassStyle}
          className="max-w-2xl w-full p-16 text-center relative z-10 border-0 overflow-hidden"
        >
          {/* Module Identity */}
          <div className="relative mb-12 flex justify-center">
             <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center relative group">
                <Icon className={`w-10 h-10 ${meta.color} group-hover:scale-110 transition-transform duration-500`} />
                <div className={`absolute inset-0 ${meta.color.replace('text-', 'bg-')}/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full`} />
             </div>
             
             <div className="absolute -top-4 -right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white shadow-lg shadow-accent/20">
                <Zap className="w-3 h-3 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest leading-none">In Alpha</span>
             </div>
          </div>

          {/* Text Manifest */}
          <div className="space-y-6 mb-12">
             <h1 className="text-4xl font-black tracking-tighter uppercase italic text-foreground leading-none">{meta.label}</h1>
             <p className="text-sm font-medium text-muted-foreground/60 leading-relaxed italic max-w-sm mx-auto uppercase tracking-tight">
               {meta.description}
             </p>
          </div>

          <div className="flex flex-col items-center gap-6">
             <div className="flex items-center gap-3 px-5 h-10 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                <Cpu className="w-4 h-4 text-accent animate-spin" />
                {t("soon.status")}
             </div>

             <Button 
               variant="ghost" 
               onClick={() => setLocation("/dashboard")}
               className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5 group transition-all"
             >
               <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
               {t("soon.back")}
             </Button>
          </div>

          {/* Decorative Corner Grid */}
          <div className="absolute bottom-0 left-0 p-8 opacity-5 pointer-events-none">
             <BarChart2 className="w-24 h-24" />
          </div>
        </motion.div>

        {/* System Message */}
        <div className="mt-12 flex items-center gap-3 opacity-30">
           <Activity className="w-4 h-4" />
           <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Architecture Synchronizing • Addis Ababa Cluster</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
