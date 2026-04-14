import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Download, Sparkles, Upload, ArrowRight, Palette,
  Image as ImageIcon, Video, Building2, Wand2, Check, X, Loader2,
  ExternalLink, Smartphone, Eye, Plus, MessageCircle, Send, Copy, Activity
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toPng } from "html-to-image";
import {
  LISTING_TEMPLATES,
  ListingFormData,
  BrandData as StudioBrandData,
} from "@/components/studio/ListingTemplates";
import {
  generateCaption,
} from "@/lib/studio/CanvasAdGenerator";

// ── Shared Styling ────────────────────────────────────────────────────────────

type StudioMode = "create-ad" | "create-video" | "create-agency";
type AdStyle = "classic" | "modern" | "minimal" | "luxury" | "commercial" | "instagram";

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

const SUBCITIES = [
  "bole", "yeka", "arada", "kirkos", "lideta", "gullele", "akaky", 
  "addis_ketema", "kolfe", "nifas_silk", "lemi_kura"
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function DesignStudio() {
  const { contextId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [, navigate] = useLocation();

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const [mode, setMode] = useState<StudioMode | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("modern");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Brand Kit
  const { data: brandKits = [] } = trpc.crm.brandKits.list.useQuery();
  const activeBrandKit = brandKits[0] as any;

  // Listing form state
  const [listing, setListing] = useState({
    title: "", price: "", subcity: "", subLocation: "",
    propertyType: "Apartment", bedrooms: "", bathrooms: "",
    area: "", description: "", nearbyLandmarks: "",
    utilities: "", finishingLevel: "", negotiable: false,
    propertyUse: "Residential", titleType: "", imageUrl: "",
  });

  const [caption, setCaption] = useState<any>(null);
  const [tiktokPack, setTiktokPack] = useState<any>(null);
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [isTikTokLoading, setIsTikTokLoading] = useState(false);
  const [isRebranding, setIsRebranding] = useState(false);
  const [rebrandSourceUrl, setRebrandSourceUrl] = useState<string | null>(null);

  const setField = (k: string, v: any) => setListing(prev => ({ ...prev, [k]: v }));

  const brandData = activeBrandKit ? {
    id: activeBrandKit.id,
    name: activeBrandKit.name || "My Brand",
    primaryColor: (activeBrandKit.colors as any[])?.[0]?.hex || "#1e3a5f",
    secondaryColor: (activeBrandKit.colors as any[])?.[1]?.hex || "#f5f0eb",
    backgroundColor: (activeBrandKit.colors as any[])?.[2]?.hex || "#0a0a0f",
    phoneNumber: activeBrandKit.phoneNumber || "",
    whatsappNumber: activeBrandKit.whatsappNumber || "",
    telegramChannel: activeBrandKit.telegramChannel || "",
    logoUrl: (activeBrandKit.logos as any[])?.[0]?.src || "",
    tagline: activeBrandKit.tagline || "",
    languagePreference: activeBrandKit.languagePreference || "both",
  } : null;

  const saveDesignMutation = trpc.crm.designs.create.useMutation({
    onSuccess: () => toast.success("Saved to Gallery"),
    onError: (err) => toast.error(err.message || "Failed to save to gallery")
  });

  const handleGenerateAd = async () => {
    if (!brandData) { toast.error("Create a Brand Kit first in Settings"); return; }
    if (!templateRef.current) { toast.error("Template not ready"); return; }
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(templateRef.current, { quality: 1.0, pixelRatio: 2 });
      setGeneratedImageUrl(dataUrl);
      
      // Auto-save to gallery
      saveDesignMutation.mutate({
        type: "poster",
        name: listing.title || "Untitled Design",
        template: selectedTemplateId,
        content: listing as any,
        previewUrl: dataUrl,
        propertyId: contextId ? parseInt(contextId) : undefined
      });

      toast.success("Ad generated!");
    } catch (e) {
      toast.error("Generation failed. Try again.");
    } finally { setIsGenerating(false); }
  };

  const rebrandMutation = trpc.studio.aiStudio.rebrand.useMutation({
    onSuccess: (data: any) => {
      setGeneratedImageUrl(data.imageUrl);
      setListing(prev => ({ ...prev, ...data.extractedData }));
      toast.success("AI Rebrand Complete!");
    },
    onError: (err) => toast.error(err.message || "Rebrand failed"),
    onSettled: () => setIsRebranding(false)
  });

  const handleRebrand = async () => {
    if (!rebrandSourceUrl) return;
    setIsRebranding(true);
    rebrandMutation.mutate({
      competitorImageUrl: rebrandSourceUrl,
      brandKitId: brandData?.id
    });
  };

  const tiktokMutation = trpc.ai.generateTikTokPack.useMutation({
    onSuccess: (data) => {
      setTiktokPack(data);
      toast.success("TikTok Pack ready!");
    },
    onError: () => toast.error("Failed to generate TikTok content"),
  });

  const socialMutation = trpc.marketing.social.create.useMutation({
    onSuccess: () => {
      toast.success("Successfully queued for TikTok dispatch!");
    },
    onError: (err) => toast.error(err.message || "Failed to queue post"),
  });

  const handleGenerateCaption = async () => {
    if (!brandData) return;
    setIsCaptionLoading(true);
    try {
      const result = generateCaption(listing as any, brandData as any);
      setCaption(result);
      
      // Also trigger the high-fidelity TikTok specific pack
      if (contextId) {
        tiktokMutation.mutate({ propertyId: parseInt(contextId) });
      }
      
      toast.success("Captions ready!");
    } catch { toast.error("Caption failed"); }
    finally { setIsCaptionLoading(false); }
  };

  const handleQueueTikTok = () => {
    if (!tiktokPack || !contextId || !user) return;
    
    const trackingLink = `${window.location.origin}/l/${user.id}/${contextId}?platform=tiktok`;
    const finalContent = `${tiktokPack.hook}\n\n${tiktokPack.description}\n\n🔗 View Details: ${trackingLink}\n\n${tiktokPack.hashtags.join(" ")}`;

    socialMutation.mutate({
      platform: "tiktok",
      platforms: ["tiktok"],
      content: finalContent,
      mediaUrl: generatedImageUrl || listing.imageUrl || "",
      mediaType: "image",
      status: "scheduled",
      scheduledFor: new Date().toISOString(),
      propertyId: parseInt(contextId)
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setListing(prev => ({ ...prev, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  // ── RENDER: Entry ───────────────────────────────────────────────────────

  if (!mode) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">{t("studio.title")}</h1>
            <p className="text-base text-muted-foreground mt-2 font-medium">{t("studio.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: "create-ad" as StudioMode, icon: ImageIcon, title: t("studio.createAd"), desc: t("studio.createAdSub"), clr: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
              { id: "create-video" as StudioMode, icon: Video, title: t("studio.video"), desc: t("studio.videoSub"), clr: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
              { id: "create-agency" as StudioMode, icon: Building2, title: t("studio.rebrand"), desc: t("studio.rebrandSub"), clr: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={glassStyle} className="flex flex-col items-start gap-6 p-8 border hover:border-accent transition-all text-left group">
                <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center border ${m.clr} group-hover:bg-accent group-hover:text-white transition-all duration-500`}>
                  <m.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xl font-black tracking-tight text-foreground">{m.title}</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-medium">{m.desc}</p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                  Get started <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── RENDER: Studio Workspace ────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto py-6">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setMode(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors bg-muted/40 px-4 py-2 rounded-xl border border-border/50">
             <ArrowRight className="w-3 h-3 rotate-180" /> Back to Studio
           </button>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mode:</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-lg border border-accent/20">
                {t(`studio.${mode === "create-ad" ? "createAd" : mode === "create-video" ? "video" : "rebrand"}`)}
              </span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 scrollbar-none">
            
            {mode === "create-agency" ? (
              <div style={glassStyle} className="p-8 border-0">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-accent" /> Competitor Ad
                </h3>
                <p className="text-xs text-muted-foreground mb-6 font-medium leading-relaxed">
                  Upload an existing property ad (competitor image) and our AI will strip the old branding and replace it with yours.
                </p>
                <div className="relative h-64 rounded-[32px] border-2 border-dashed border-accent/20 hover:border-accent/40 bg-accent/5 transition-all overflow-hidden flex flex-col items-center justify-center group mb-8">
                   {rebrandSourceUrl ? (
                     <>
                       <img src={rebrandSourceUrl} className="w-full h-full object-cover" />
                       <Button variant="secondary" size="sm" className="absolute h-10 rounded-xl font-black uppercase shadow-xl" onClick={() => inputRef.current?.click()}>Change Ad</Button>
                     </>
                   ) : (
                     <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => inputRef.current?.click()}>
                       <Upload className="w-10 h-10 text-accent/30 group-hover:text-accent group-hover:scale-110 transition-all" />
                       <div className="text-center">
                          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Upload Competitor Ad</p>
                          <p className="text-[9px] text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                       </div>
                     </div>
                   )}
                </div>
                <Button 
                  onClick={handleRebrand} 
                  disabled={isRebranding || !rebrandSourceUrl} 
                  className="w-full h-16 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl gap-3 transition-all"
                >
                  {isRebranding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  AI REBRAND & EXTRACT
                </Button>
              </div>
            ) : (
              <>
                <div style={glassStyle} className="p-6 border-0">
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Palette className="w-4 h-4 text-accent" /> {t("studio.style")}
                   </h3>
                   <div className="grid grid-cols-2 gap-2">
                      {LISTING_TEMPLATES.map(tmp => (
                        <button key={tmp.id} onClick={() => setSelectedTemplateId(tmp.id)}
                          className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedTemplateId === tmp.id ? "bg-accent text-white border-accent shadow-lg" : "bg-muted/10 border-border/50 text-muted-foreground hover:border-accent/30"}`}>
                          {tmp.name}
                        </button>
                      ))}
                   </div>
                </div>

                <div style={glassStyle} className="p-6 border-0">
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Wand2 className="w-4 h-4 text-accent" /> {t("studio.form")}
                   </h3>
                   <div className="space-y-4">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Upload Property Photo</Label>
                        <div className="relative h-40 rounded-2xl border-2 border-dashed border-border/50 hover:border-accent/40 bg-muted/5 transition-all overflow-hidden flex flex-col items-center justify-center group">
                           {listing.imageUrl ? (
                             <>
                               <img src={listing.imageUrl} className="w-full h-full object-cover opacity-60" />
                               <Button variant="secondary" size="sm" className="absolute h-8 rounded-lg text-[9px] font-black uppercase" onClick={() => inputRef.current?.click()}>Change</Button>
                             </>
                           ) : (
                             <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => inputRef.current?.click()}>
                               <ImageIcon className="w-8 h-8 text-muted-foreground/30 group-hover:text-accent group-hover:scale-110 transition-all" />
                               <span className="text-[10px] font-black text-muted-foreground uppercase">Pick a photo</span>
                             </div>
                           )}
                           <input type="file" ref={inputRef} className="hidden" onChange={handleImageUpload} />
                        </div>
                      </div>

                      <div className="space-y-3">
                         <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Property Title" value={listing.title} onChange={e => setField("title", e.target.value)} />
                         <div className="grid grid-cols-2 gap-3">
                            <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Price (ETB)" value={listing.price} onChange={e => setField("price", e.target.value)} />
                            <Select value={listing.subcity} onValueChange={v => setField("subcity", v)}>
                               <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-xs font-bold uppercase tracking-widest"><SelectValue placeholder="Subcity" /></SelectTrigger>
                               <SelectContent>
                                  {SUBCITIES.map(s => <SelectItem key={s} value={s} className="uppercase font-black text-[10px]">{t(`subcity.${s}`)||s}</SelectItem>)}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>
                   </div>
                </div>

                <Button onClick={handleGenerateAd} disabled={isGenerating} className="w-full h-14 bg-accent text-white hover:bg-accent/90 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-accent/30 gap-3">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {t("studio.generate")}
                </Button>
              </>
            )}
          </div>

          {/* RIGHT: Preview (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            <div style={glassStyle} className="p-10 border-0 flex items-center justify-center min-h-[700px]">
               {generatedImageUrl ? (
                 <div className="relative animate-in fade-in zoom-in duration-700 max-w-[500px] w-full">
                    <img src={generatedImageUrl} className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10" />
                    <div className="absolute top-4 right-4 flex gap-2">
                       <Button size="icon" className="w-10 h-10 rounded-xl bg-accent text-white hover:scale-105 transition-transform" onClick={() => { const a = document.createElement("a"); a.href = generatedImageUrl; a.download="ad.png"; a.click(); }}>
                          <Download className="w-5 h-5" />
                       </Button>
                    </div>
                 </div>
               ) : (
                 <div className="w-[500px] aspect-[4/5] bg-background/40 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/50 group">
                    <div className="w-20 h-20 rounded-3xl bg-accent/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                       <Eye className="w-10 h-10 text-accent/30" />
                    </div>
                    <p className="text-xl font-black text-foreground mb-2">Live Canvas</p>
                    <p className="text-sm text-muted-foreground font-medium max-w-[280px]">Fill the property details and hit "Generate AI Material" to see your premium ad.</p>
                 </div>
               )}

               {/* Hidden Template Ref for Capture */}
               <div className="fixed top-[-9999px] left-[-9999px]">
                  <div ref={templateRef} className="w-[1080px] h-[1350px]">
                    {(() => {
                      const Tpl = LISTING_TEMPLATES.find(x => x.id === selectedTemplateId)?.component || LISTING_TEMPLATES[0].component;
                      return <Tpl data={{ ...listing, location: t(`subcity.${listing.subcity}`)||listing.subcity } as any} brand={brandData as any} />;
                    })()}
                  </div>
               </div>
            </div>

             {/* AI Caption & TikTok Hub */}
            <div style={glassStyle} className="p-8 border-0 mt-2">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-accent" /> Marketing Intelligence
                  </h3>
                  <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2" onClick={handleGenerateCaption} disabled={isCaptionLoading || tiktokMutation.isPending}>
                     {isCaptionLoading || tiktokMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                     Generate Marketing Pack
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Standard Captions */}
                  <div className="space-y-6">
                    {caption ? (
                      <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                         <div className="p-5 rounded-2xl bg-background/40 border border-border/50">
                            <div className="flex justify-between items-center mb-4">
                               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Standard English</span>
                               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(caption.english)}><Copy className="w-3 h-3" /></Button>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{caption.english}</p>
                         </div>
                         <div className="p-5 rounded-2xl bg-background/40 border border-border/50">
                            <div className="flex justify-between items-center mb-4">
                               <span className="text-[10px] font-black uppercase tracking-widest text-accent">Standard Amharic</span>
                               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(caption.amharic)}><Copy className="w-3 h-3" /></Button>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{caption.amharic}</p>
                         </div>
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center border border-dashed border-border/50 rounded-2xl opacity-50 italic text-sm">
                        Standard captions placeholder
                      </div>
                    )}
                  </div>

                  {/* TikTok Special Pack */}
                  <div className="space-y-6">
                    {tiktokPack ? (
                      <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                         <div className="p-6 rounded-[32px] bg-foreground text-background shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Activity className="w-12 h-12" />
                            </div>
                            <div className="relative z-10">
                              <span className="bg-accent text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-4 inline-block">TikTok Scroll-Stopper</span>
                              <p className="text-lg font-black leading-tight mb-2">"{tiktokPack.hook}"</p>
                              <p className="text-xs font-bold opacity-60 italic mb-4">Pure Amharic: "{tiktokPack.amharicHook}"</p>
                              
                              <div className="pt-4 border-t border-background/10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Recommended Vibe</p>
                                <p className="text-xs font-bold">{tiktokPack.vibe} • {tiktokPack.musicSuggestion}</p>
                              </div>

                              <Button onClick={() => copyToClipboard(tiktokPack.hook)} variant="secondary" size="sm" className="w-full mt-6 bg-background/10 hover:bg-background/20 text-background rounded-xl font-black text-[10px] uppercase border-0">
                                Copy TikTok Hook
                              </Button>
                              
                              <Button 
                                onClick={handleQueueTikTok} 
                                disabled={socialMutation.isPending}
                                className="w-full mt-2 bg-accent text-white hover:bg-accent/90 rounded-xl font-black text-[10px] uppercase border-0 shadow-lg shadow-accent/20 h-10 gap-2"
                              >
                                {socialMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3"/>}
                                {t("studio.queueTikTok")}
                              </Button>
                            </div>
                         </div>

                         <div className="p-5 rounded-2xl bg-muted/40 border border-border/50">
                            <div className="flex justify-between items-center mb-4">
                               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">TikTok Optimized Base</span>
                               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(tiktokPack.description)}><Copy className="w-3 h-3" /></Button>
                            </div>
                            <p className="text-sm leading-relaxed line-clamp-3">{tiktokPack.description}</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                               {tiktokPack.hashtags.map((tag: string) => (
                                 <span key={tag} className="text-[9px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-md">{tag}</span>
                               ))}
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center border border-dashed border-accent/20 rounded-[32px] bg-accent/5 opacity-50 p-6 text-center">
                        <Smartphone className="w-8 h-8 text-accent/30 mb-2" />
                        <p className="text-xs font-bold">TikTok Pack details will appear here</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
