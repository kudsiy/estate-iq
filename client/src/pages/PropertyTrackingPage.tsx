import { useState, useMemo } from "react";
import { useRoute } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Building2, MapPin, BedDouble, Bath, Square, 
  Send, Phone, CheckCircle2, ArrowRight, Loader2, MessageCircle, Share2, Info, ChevronLeft, ChevronRight, LayoutGrid, Globe, Activity
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

export default function PropertyTrackingPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const [, params] = useRoute("/l/:userId/:listingId");
  const listingId = params?.listingId;
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const { data: property, isLoading, error } = trpc.crm.public.getProperty.useQuery(
    { uniqueId: listingId ?? "" },
    { enabled: !!listingId }
  );

  const captureMutation = trpc.crm.leads.createWithCascade.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(t("status.updated"));
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send enquiry");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId || !property) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const platform = searchParams.get("platform");
    const creativeId = searchParams.get("creativeId");

    captureMutation.mutate({
      propertyId: property.id,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email || null,
      notes: form.notes || null,
      source: "tracking_link",
      leadData: { 
        ...(platform ? { platform } : {}), 
        ...(creativeId ? { creativeId } : {}) 
      }
    });
  };

  const handleWhatsApp = () => {
    if (!property) return;
    const message = encodeURIComponent(`Hello, I'm interested in the listing "${property.title}" (ID: ${property.uniqueListingId}). Could you provide more details?`);
    window.open(`https://wa.me/251911223344?text=${message}`, "_blank");
  };

  const [showHeartbeat, setShowHeartbeat] = useState(false);
  const [heartbeatIndex, setHeartbeatIndex] = useState(0);

  const heartbeatMessages = useMemo(() => [
    { text: "Someone from Bole just viewed this", am: "በቦሌ አካባቢ የሚገኝ ሰው ይህን አይቶታል።" },
    { text: "New WhatsApp inquiry received", am: "አዲስ የዋትስአፕ ጥያቄ ቀርቧል።" },
    { text: "3 active viewers on this listing", am: "3 ሰዎች ይህን ንብረት አሁን እያዩት ነው።" },
    { text: "Saved to 12 buyer portfolios", am: "በ12 የገዢዎች ዝርዝር ውስጥ ተቀምጧል።" },
  ], []);

  useMemo(() => {
    const timer = setTimeout(() => setShowHeartbeat(true), 3000);
    const interval = setInterval(() => {
      setHeartbeatIndex(prev => (prev + 1) % heartbeatMessages.length);
    }, 6000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [heartbeatMessages]);

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-6 text-center">
        <div className="max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Building2 className="w-16 h-16 text-accent/20 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">{t("track.expired")}</h1>
            <p className="text-muted-foreground mb-8">{t("track.expiredSub")}</p>
            <Button onClick={() => window.location.href = "/"} variant="outline" className="rounded-full px-8">
              {t("crm.back")}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const photos = (property.photos as string[]) || [];

  // Intelligence: Extract Vibes based on specs/desc
  const vibes = useMemo(() => {
    if (!property) return [];
    const v = [];
    if (Number(property.price) > 30000000) v.push({ label: "Ultra-Luxury", am: "ልዩ የቅንጦት" });
    if (property.bedrooms && property.bedrooms >= 4) v.push({ label: "Family Estate", am: "የቤተሰብ ርስቱ" });
    if (property.description?.toLowerCase().includes("modern")) v.push({ label: "Modernist", am: "ዘመናዊ" });
    if (property.subcity?.toLowerCase() === "bole") v.push({ label: "Elite District", am: "ምርጥ ሰፈር" });
    return v.slice(0, 3);
  }, [property]);

  return (
    <div ref={containerRef} className={`min-h-screen bg-[#050505] text-white overflow-x-hidden ${language === 'am' ? 'font-ethiopic' : 'font-sans'}`}>
      
      {/* Interest Heartbeat (Floating Urgency) */}
      <AnimatePresence>
        {showHeartbeat && (
          <motion.div 
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[100] p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-3xl shadow-2xl flex items-center gap-4 max-w-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center relative shrink-0">
               <Activity className="w-5 h-5 text-accent animate-pulse" />
               <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-ping" />
            </div>
            <div className="overflow-hidden">
               <AnimatePresence mode="wait">
                 <motion.p 
                   key={heartbeatIndex}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="text-[11px] font-black uppercase tracking-tight text-white leading-tight"
                 >
                   {language === 'am' ? heartbeatMessages[heartbeatIndex].am : heartbeatMessages[heartbeatIndex].text}
                 </motion.p>
               </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 backdrop-blur-3xl bg-white/5 py-2 px-5 rounded-full border border-white/10 shadow-2xl">
             <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/40">
                <Building2 className="w-3.5 h-3.5 text-white" />
             </div>
             <span className="font-black tracking-tighter text-sm uppercase italic">Estate IQ</span>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/5 backdrop-blur-md" onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}>
                <Globe className="w-4 h-4" />
             </Button>
             <Button 
                className="rounded-full bg-accent text-white hover:bg-accent/90 text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-accent/20 h-10"
                onClick={() => document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
             >
                {t("track.secure")}
             </Button>
          </div>
        </div>
      </nav>

      {/* Cinematic Parallax Hero */}
      <div className="relative h-screen w-full bg-black overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            style={{ scale: heroScale, opacity: heroOpacity }}
            className="absolute inset-0 z-0"
          >
            <motion.img 
              key={activePhoto}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              src={photos[activePhoto] || `/placeholder-property.jpg`} 
              className="w-full h-full object-cover opacity-60"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-radial-at-t from-accent/10 via-transparent to-transparent opacity-50 z-10" />
         <div className="absolute bottom-24 left-8 right-8 z-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
           <motion.div 
             initial={{ opacity: 0, x: -40 }} 
             animate={{ opacity: 1, x: 0 }} 
             transition={{ delay: 0.5, duration: 0.8 }}
             className="max-w-5xl"
           >
              <div className="flex flex-wrap items-center gap-4 mb-8">
                 <span className="px-4 py-1.5 rounded-full bg-accent text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/30">
                    {property.status === 'active' ? t("status.active") : property.status}
                 </span>
                 {vibes.map((v, i) => (
                    <span key={i} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-xl">
                       {language === 'am' ? v.am : v.label}
                    </span>
                 ))}
                 <span className="text-white/40 text-[10px] font-black uppercase tracking-widest pl-4 border-l border-white/10 italic">
                    REF: {property.uniqueListingId}
                 </span>
              </div>
              <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter mb-8 max-w-7xl leading-[0.8] uppercase italic mix-blend-difference">
                {property.title}
              </h1>
              <div className="flex items-center gap-4 text-white/70 text-lg md:text-2xl font-medium tracking-tight">
                 <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20">
                    <MapPin className="w-6 h-6 text-accent" />
                 </div>
                 <div className="space-y-1">
                    <p className="font-black text-white">{property.address}</p>
                    <p className="text-sm opacity-50 font-bold uppercase tracking-widest">{t(`subcity.${property.subcity.toLowerCase()}`)}</p>
                 </div>
              </div>
           </motion.div>

           <div className="flex gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-16 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full backdrop-blur-2xl transition-all"
                onClick={() => setActivePhoto(prev => (prev > 0 ? prev - 1 : photos.length - 1))}
              >
                 <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-16 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full backdrop-blur-2xl transition-all"
                onClick={() => setActivePhoto(prev => (prev < photos.length - 1 ? prev + 1 : 0))}
              >
                 <ChevronRight className="w-6 h-6" />
              </Button>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 pt-20 pb-32">
        
        {/* Deep Details */}
        <div className="lg:col-span-8 space-y-20">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-10 border-y border-white/5">
            <div>
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-3 italic">{t("prop.price")}</p>
              <p className="text-3xl font-black tracking-tighter text-accent italic">
                ETB {property.price ? Number(property.price).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-3 italic">{t("prop.bedrooms")}</p>
              <div className="flex items-center gap-3 text-2xl font-black italic">
                 <BedDouble className="w-6 h-6 text-accent opacity-50" /> {property.bedrooms || "—"}
              </div>
            </div>
            <div>
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-3 italic">{t("prop.bathrooms")}</p>
              <div className="flex items-center gap-3 text-2xl font-black italic">
                 <Bath className="w-6 h-6 text-accent opacity-50" /> {property.bathrooms || "—"}
              </div>
            </div>
            <div>
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-3 italic">{t("prop.area")}</p>
              <div className="flex items-center gap-3 text-2xl font-black italic">
                 <Square className="w-6 h-6 text-accent opacity-50" /> {property.squareFeet ? `${property.squareFeet}m²` : "—"}
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3 text-accent italic">
                <Activity className="w-5 h-5" /> {t("track.narrative")}
             </h3>
             <p className="text-white/60 leading-[1.8] text-xl font-medium tracking-tight italic border-l-4 border-accent/20 pl-8">
                {property.description || "The agency has curated these details for exclusive private review. Direct consultation recommended."}
             </p>
          </div>

          <div className="pt-10 border-t border-white/5">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-10">{t("track.context")}</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="p-6 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                   <MapPin className="w-6 h-6 text-accent mb-4 group-hover:scale-110 transition-transform" />
                   <p className="text-xs font-black uppercase tracking-widest text-white mb-1">{t(`subcity.${property.subcity.toLowerCase()}`)}</p>
                   <p className="text-[9px] text-white/30 font-bold uppercase tracking-tighter">Prime District</p>
                </div>
                <div className="p-6 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                   <Globe className="w-6 h-6 text-accent mb-4 group-hover:scale-110 transition-transform" />
                   <p className="text-xs font-black uppercase tracking-widest text-white mb-1">{property.city}</p>
                   <p className="text-[9px] text-white/30 font-bold uppercase tracking-tighter">Metropolitan Hub</p>
                </div>
             </div>
          </div>
        </div>

        {/* Lead Conversion Hub */}
        <div className="lg:col-span-4" id="enquiry-form">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="sticky top-32 p-12 border border-white/10 rounded-[40px] bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl shadow-2xl overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />
            
            {submitted ? (
              <div className="text-center py-20 relative z-10">
                <motion.div 
                  initial={{ rotate: -20, scale: 0.5, opacity: 0 }} 
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  className="w-28 h-28 bg-accent rounded-[32px] flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-accent/40"
                >
                   <CheckCircle2 className="w-14 h-14 text-white" />
                </motion.div>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-6 italic">{t("track.received")}</h3>
                <p className="text-white/50 mb-12 text-base font-medium leading-relaxed italic pr-4">
                   {t("track.success")}
                </p>
                <Button className="w-full h-16 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all" onClick={() => setSubmitted(false)}>
                   Parallel Inquiry
                </Button>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="mb-12">
                   <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Master Consultation</h2>
                   <p className="text-accent text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Reserved Access Authorization</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Architectural Identity</Label>
                    <div className="grid grid-cols-2 gap-4">
                       <Input placeholder="First" required className="bg-white/5 border-white/5 h-14 rounded-2xl text-sm italic font-bold focus:bg-white/10 transition-all px-6" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                       <Input placeholder="Last" required className="bg-white/5 border-white/5 h-14 rounded-2xl text-sm italic font-bold focus:bg-white/10 transition-all px-6" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Direct Connectivity</Label>
                    <Input placeholder="+251 91..." required className="bg-white/5 border-white/5 h-14 rounded-2xl text-sm italic font-bold focus:bg-white/10 transition-all px-6" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Consultation Directives</Label>
                    <Textarea 
                      placeholder="Briefly outline your specific requirements..."
                      className="bg-white/5 border-white/5 min-h-[140px] rounded-[32px] p-8 text-sm italic font-medium resize-none shadow-none focus:bg-white/10 transition-all"
                      value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    />
                  </div>

                  <Button 
                    className="w-full bg-accent hover:bg-accent/90 text-white h-20 rounded-[32px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-accent/40 border-b-8 border-black/20 mt-6 active:translate-y-1 active:border-b-0 transition-all"
                    disabled={captureMutation.isPending}
                  >
                    {captureMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Initiate Secure Request"}
                  </Button>

                  <div className="flex items-center gap-6 py-4 opacity-20">
                     <div className="h-px bg-white/50 flex-1" />
                     <span className="text-[9px] font-black uppercase tracking-widest tracking-[0.5em]">OR</span>
                     <div className="h-px bg-white/50 flex-1" />
                  </div>

                  <Button type="button" variant="ghost" className="w-full h-16 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-wider gap-4 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all text-white/40 group" onClick={handleWhatsApp}>
                    <MessageCircle className="w-6 h-6 text-[#25D366] transition-transform group-hover:scale-110" /> Connect via Global WhatsApp
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
