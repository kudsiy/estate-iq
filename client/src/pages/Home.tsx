import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Globe, Zap, Target, Activity, Sparkles, ChevronRight, LayoutDashboard, Rss, BarChart2, Shield, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Countdown helper ───────────────────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const calc = () => {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins: Math.floor((diff / (1000 * 60)) % 60),
      secs: Math.floor((diff / 1000) % 60),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const deadline = new Date("2026-05-01T00:00:00");
  const cd = useCountdown(deadline);

  const FEATURES = [
    { icon: LayoutDashboard, title: t("nav.dashboard"), desc: "Unified intelligence command deck for your entire real estate operation." },
    { icon: Target,          title: "Lead Intelligence", desc: t("soon.leads") },
    { icon: Palette,         title: t("nav.studio"),    desc: t("soon.design") },
    { icon: Rss,             title: t("nav.supplyFeed"), desc: "Real-time market tracking and duplicate asset detection." },
    { icon: BarChart2,       title: t("nav.analytics"),  desc: t("soon.analytics") },
    { icon: Shield,          title: "Smart CRM",          desc: "Manage your leads and contacts in one place with automatic follow-up reminders." },
  ];

  if (isAuthenticated) {
     window.location.href = "/dashboard";
     return null;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0f1c]' : 'bg-slate-50 text-slate-900'} font-sans antialiased selection:bg-accent selection:text-white transition-colors duration-500`}>
      
      {/* ── Global Header ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full px-6 md:px-12 py-6 flex justify-between items-center z-[100] backdrop-blur-xl bg-background/50 border-b border-white/5">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
               <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic leading-none">Estate IQ</span>
         </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* WhatsApp Support Button */}
            <a
              href="https://wa.me/251991955555"
              target="_blank"
              rel="noopener noreferrer"
              className="flex"
              style={{ 
                display: "flex", alignItems: "center", 
                gap: 6, background: "#25D366", 
                color: "#fff", padding: "6px 12px",
                borderRadius: 20, fontSize: 11,
                fontWeight: 700, textDecoration: "none"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>ጥያቄ</span>
            </a>

            <button 
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              className="px-3 md:px-5 h-10 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 md:gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
               <Globe className="w-4 h-4 text-accent" />
               {language === 'en' ? 'AMH' : 'ENG'}
            </button>
            <Link href="/login">
               <Button variant="ghost" className="h-10 px-6 rounded-full font-black uppercase text-[10px] tracking-widest">{t("side.logout") ? 'LOGIN' : 'LOGIN'}</Button>
            </Link>
            <Link href="/register">
               <Button className="h-10 px-8 rounded-full bg-accent text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-accent/20">GET STARTED</Button>
            </Link>
         </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-24 overflow-hidden">
         {/* Background Architecture */}
         <div className="absolute inset-0 z-0">
            <div className={`absolute inset-0 bg-gradient-to-br from-[#0a0f1c] via-[#0a0f1c]/80 to-accent/10 z-10`} />
            <img 
              src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=95" 
              className="w-full h-full object-cover object-center grayscale opacity-30"
              alt="Architectural Backdrop"
            />
         </div>

         <div className="container relative z-20 flex flex-col items-center text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
               <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t("home.tag")}</span>
               </div>
               
               <h1 className="text-6xl md:text-[8rem] font-black tracking-tighter leading-[0.85] uppercase italic text-white">
                  {t("home.heroTitle").split('.').map((p, i) => (
                    <span key={i} className="block">{p}</span>
                  ))}
               </h1>
               <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 4 }}>
                 ለኢትዮጵያ ሪል እስቴት ወኪሎች የተሰራ መሳሪያ
               </p>

               <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 font-medium leading-relaxed italic uppercase tracking-tight">
                  {t("home.heroSub")}
               </p>

               <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                  <Link href="/register">
                     <Button className="h-20 px-14 rounded-2xl bg-accent text-white font-black uppercase text-sm tracking-widest shadow-[0_20px_60px_-10px_rgba(37,99,235,0.6)] hover:scale-105 transition-all">
                        {t("home.start")} <ChevronRight className="ml-2 w-5 h-5" />
                     </Button>
                  </Link>
                  <Link href="/pricing">
                     <Button variant="outline" className="h-20 px-12 rounded-2xl border-white/20 bg-white/5 font-black uppercase text-xs tracking-widest text-white hover:bg-white/10">
                        {t("home.pricing")}
                     </Button>
                  </Link>
               </div>
            </motion.div>

            {/* Floating Luxury Stats */}
            <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
               {[
                 { label: "Leads Today", val: "124", icon: Target },
                 { label: "Synced Assets", val: "4.8K", icon: Building2 },
                 { label: "Active Nodes", val: "502", icon: Globe },
                 { label: "Closed Value", val: "62M+", icon: Zap }
               ].map(s => (
                 <div key={s.label} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl min-w-[160px] text-left group hover:bg-white/10 transition-all">
                    <s.icon className="w-5 h-5 text-accent mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <p className="text-3xl font-black text-white italic leading-none mb-1">{s.val}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{s.label}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ── Features Matrix ─────────────────────────────────────────── */}
      <section className="py-32 px-6">
         <div className="container mx-auto">
            <div className="mb-24 text-center">
               <h2 className="text-5xl font-black tracking-tighter uppercase italic mb-4">{t("home.featTitle")}</h2>
               <p className="text-muted-foreground/50 font-black uppercase tracking-widest text-xs">{t("home.featSub")}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {FEATURES.map((f, i) => (
                 <motion.div 
                   key={f.title}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="p-10 rounded-[40px] bg-white/5 dark:bg-slate-900/40 border border-white/5 dark:border-white/10 group hover:bg-accent/5 hover:border-accent/20 transition-all"
                 >
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-8 shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                       <f.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic mb-3">{f.title}</h3>
                    <p className="text-sm font-medium text-muted-foreground/60 leading-relaxed uppercase tracking-tight italic">
                       {f.desc}
                    </p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── Beta Countdown ───────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-accent/5 blur-[120px] rounded-full translate-y-1/2 pointer-events-none" />
         <div className="container mx-auto">
            <div className="p-16 rounded-[60px] bg-white/5 border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-16">
               <div className="max-w-xl text-center lg:text-left">
                  <h3 className="text-4xl font-black tracking-tighter uppercase italic mb-6 leading-none">{t("home.beta")}</h3>
                  <p className="text-lg text-muted-foreground font-medium uppercase tracking-tight italic leading-relaxed">
                     Special launch price for the first 500 agents. Sign up now before it ends.
                  </p>
               </div>
               
               <div className="flex gap-6">
                  {[
                    { l: "Days", v: cd.days },
                    { l: "Hrs", v: cd.hours },
                    { l: "Min", v: cd.mins },
                    { l: "Sec", v: cd.secs }
                  ].map(x => (
                    <div key={x.l} className="text-center space-y-3">
                       <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/20 flex items-center justify-center text-2xl font-black text-white italic">
                          {pad(x.v)}
                       </div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{x.l}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* ── Final Call to Action ──────────────────────────────────────── */}
      <section className="py-48 px-6 text-center">
         <div className="container mx-auto flex flex-col items-center">
            <div className="w-24 h-24 bg-accent/10 rounded-[2.5rem] flex items-center justify-center border border-accent/20 mb-12">
               <Shield className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic mb-8">{t("home.ctaTitle")}</h2>
            <p className="max-w-2xl mb-16 text-muted-foreground font-medium uppercase tracking-widest leading-relaxed italic">{t("home.ctaSub")}</p>
            
            <Link href="/register">
               <Button className="h-24 px-16 rounded-[32px] bg-accent text-white font-black uppercase text-lg tracking-widest shadow-2xl shadow-accent/40 hover:scale-105 transition-all">
                  INITIALIZE IDENTITY
               </Button>
            </Link>
         </div>
      </section>

      <div style={{ textAlign: "center", padding: "40px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
         <p style={{ color: "#6b7280", fontSize: 13 }}>
           Made in Addis Ababa · Used by agents across Bole, CMC, Ayat and beyond
         </p>
         <a href="https://wa.me/251991955555" style={{ color: "#A78BFA", fontSize: 13, fontWeight: 600 }}>
           Contact us on WhatsApp
         </a>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/5 text-center">
         <div className="container mx-auto px-6 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 grayscale opacity-30">
               <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-background" />
               </div>
               <span className="text-lg font-black tracking-tighter uppercase italic">Estate IQ</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic">
               © 2026 Sovereign Deployment · Addis Ababa, Ethiopia · Intelligence Suite 1.0
            </p>
         </div>
      </footer>
    </div>
  );
}
