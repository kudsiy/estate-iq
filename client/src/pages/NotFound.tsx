import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ShieldAlert, Cpu, ChevronLeft, Map } from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";
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

export default function NotFound() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const handleGoHome = () => {
    setLocation("/dashboard");
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-slate-50'} relative overflow-hidden`}>
       {/* Cinematic Background Accents */}
       <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[150px] rounded-full opacity-50" />
       </div>

       <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         style={glassStyle}
         className="w-full max-w-xl p-16 text-center relative z-10 border-0 overflow-hidden"
       >
          <div className="absolute top-0 left-0 p-12 opacity-5 pointer-events-none">
             <Map className="w-48 h-48" />
          </div>

          <div className="relative z-10 space-y-10">
             <div className="flex justify-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center relative">
                   <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
                   <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full" />
                </div>
             </div>

             <div className="space-y-4">
                <h1 className="text-6xl font-black tracking-tighter italic uppercase text-foreground leading-none">{t("not.error")}</h1>
                <h2 className="text-xl font-black uppercase tracking-widest text-red-500/80 italic">{t("not.title")}</h2>
                <p className="text-sm font-medium text-muted-foreground/60 leading-relaxed max-w-xs mx-auto uppercase tracking-tight italic">
                   {t("not.sub")}
                </p>
             </div>

             <div className="flex flex-col items-center gap-6 pt-4">
                <div className="flex items-center gap-3 px-6 h-10 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                   <Cpu className="w-4 h-4 text-accent" />
                   Sovereign Navigation Disrupted
                </div>

                <Button 
                   onClick={handleGoHome}
                   className="h-14 px-12 rounded-2xl bg-accent text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-accent/40 group relative overflow-hidden transition-all"
                >
                   <span className="relative z-10 flex items-center gap-2">
                     <Home className="w-4 h-4 mr-1 transition-transform group-hover:scale-110" />
                     {t("not.back")}
                   </span>
                   <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Button>
             </div>
          </div>
       </motion.div>

       <div className="absolute bottom-12 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic pointer-events-none">
          Estate IQ Sovereign Deployment System
       </div>
    </div>
  );
}
