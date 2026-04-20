import { useState, useRef, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Download, Sparkles, Upload, ArrowRight, Palette,
  Image as ImageIcon, Video, Building2, Wand2, Loader2,
  Smartphone, Eye, MessageCircle, Send, Copy, Activity,
  Facebook, Instagram, Globe, Check
} from "lucide-react";
import { compressImage } from "@/lib/image";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toPng } from "html-to-image";
import {
  LISTING_TEMPLATES,
} from "@/components/studio/ListingTemplates";
import { generateCaption } from "@/lib/studio/CanvasAdGenerator";

// ── Types ─────────────────────────────────────────────────────────────────────

type StudioMode = "create-ad" | "create-video" | "create-agency";

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

const FINISHING_LEVELS = ["Bare shell", "Semi-finished", "Fully finished", "Luxury finished"];
const PROPERTY_TYPES = ["Apartment", "Villa", "Commercial", "Office", "Land", "Compound"];
const TITLE_TYPES = ["Lease hold", "Free hold", "Government lease"];
const VIDEO_PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: Smartphone, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { id: "telegram", label: "Telegram", icon: Send, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
];

// ── Main Component ─────────────────────────────────────────────────────────────

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
  const [isRebranding, setIsRebranding] = useState(false);
  const [rebrandSourceUrl, setRebrandSourceUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<any>(null);
  const [tiktokPack, setTiktokPack] = useState<any>(null);
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [selectedVideoPlatforms, setSelectedVideoPlatforms] = useState<string[]>(["tiktok"]);
  const [videoScriptText, setVideoScriptText] = useState("");
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [isScriptLoading, setIsScriptLoading] = useState(false);

  const templateRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rebrandInputRef = useRef<HTMLInputElement>(null);

  // Brand Kit
  const { data: brandKits = [] } = trpc.crm.brandKits.list.useQuery();
  const activeBrandKit = brandKits[0] as any;

  // Full listing form state — all fields
  const [listing, setListing] = useState({
    title: "",
    price: "",
    subcity: "",
    subLocation: "",
    propertyType: "Apartment",
    bedrooms: "",
    bathrooms: "",
    area: "",
    description: "",
    nearbyLandmarks: "",
    utilities: "",
    finishingLevel: "",
    negotiable: false,
    propertyUse: "Residential",
    titleType: "",
    imageUrl: "",
    ctaText: "Book a Viewing",
    sellerPhone: "",
  });

  const setField = (k: string, v: any) => setListing(prev => ({ ...prev, [k]: v }));

  const brandData = activeBrandKit ? {
    id: activeBrandKit.id,
    name: activeBrandKit.name || "My Brand",
    companyName: activeBrandKit.name || "My Agency",
    primaryColor: (activeBrandKit.colors as any[])?.[0]?.hex || "#1e3a5f",
    secondaryColor: (activeBrandKit.colors as any[])?.[1]?.hex || "#f5f0eb",
    backgroundColor: (activeBrandKit.colors as any[])?.[2]?.hex || "#0a0a0f",
    textColor: "#ffffff",
    fontHeading: "Poppins, sans-serif",
    fontBody: "Poppins, sans-serif",
    phoneNumber: activeBrandKit.phoneNumber || "",
    whatsappNumber: activeBrandKit.whatsappNumber || "",
    telegramChannel: activeBrandKit.telegramChannel || "",
    facebookUrl: activeBrandKit.facebookUrl || "",
    instagramHandle: activeBrandKit.instagramHandle || "",
    tiktokHandle: activeBrandKit.tiktokHandle || "",
    logo: (activeBrandKit.logos as any[])?.[0]?.src || null,
    logoUrl: (activeBrandKit.logos as any[])?.[0]?.src || "",
    tagline: activeBrandKit.tagline || "",
    languagePreference: activeBrandKit.languagePreference || "both",
    targetAreas: [],
    agentPortrait: null,
  } : null;

  // Mutations
  const saveDesignMutation = trpc.crm.designs.create.useMutation({
    onSuccess: () => toast.success("Saved to Design Gallery ✓"),
    onError: () => { /* silent fail on gallery save */ },
  });

  const tiktokMutation = trpc.ai.generateTikTokPack.useMutation({
    onSuccess: (data) => { setTiktokPack(data); toast.success("TikTok Pack ready!"); },
    onError: () => toast.error("Failed to generate TikTok content"),
  });

  const socialMutation = trpc.crm.socialMediaPosts.create.useMutation({
    onSuccess: () => toast.success("Queued for dispatch!"),
    onError: (err) => toast.error(err.message || "Failed to queue post"),
  });

  const rebrandMutation = trpc.studio.aiStudio.rebrand.useMutation({
    onSuccess: (data: any) => {
      if (data.imageUrl) setGeneratedImageUrl(data.imageUrl);
      if (data.extractedData) setListing(prev => ({ ...prev, ...data.extractedData }));
      toast.success("AI Rebrand Complete!");
    },
    onError: (err) => toast.error(err.message || "Rebrand failed"),
    onSettled: () => setIsRebranding(false),
  });

  // Handlers
  const handleGenerateAd = async () => {
    if (!brandData) { toast.error("Create a Brand Kit first in Settings → Brand"); return; }
    if (!templateRef.current) { toast.error("Template not ready"); return; }
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(templateRef.current, { quality: 1.0, pixelRatio: 2 });
      setGeneratedImageUrl(dataUrl);
      saveDesignMutation.mutate({
        type: "poster",
        name: listing.title || "Untitled Design",
        template: selectedTemplateId,
        content: listing as any,
        previewUrl: dataUrl,
        propertyId: contextId ? parseInt(contextId) : undefined,
      });
      toast.success("Ad generated!");
    } catch {
      toast.error("Generation failed. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRebrand = () => {
    if (!rebrandSourceUrl) return;
    setIsRebranding(true);
    rebrandMutation.mutate({ competitorImageUrl: rebrandSourceUrl, brandKitId: brandData?.id });
  };

  const handleGenerateCaption = async () => {
    if (!brandData) return;
    setIsCaptionLoading(true);
    try {
      const result = generateCaption(listing as any, brandData as any);
      const trackingLink = `${window.location.origin}/l/${user?.id || 0}/${contextId || 123}?platform=manual&sourceLabel=Studio_Manual_${contextId || 123}`;
      const forcedCTA = `📞 Call or WhatsApp now: ${brandData.whatsappNumber || brandData.phoneNumber || ""} — Ref: ${contextId || "N/A"}`;
      
      const combinedWithTracking = `${result.combined}\n\n${forcedCTA}\n🔗 View Details: ${trackingLink}`;
      setCaption({ ...result, combined: combinedWithTracking });
      
      if (contextId) tiktokMutation.mutate({ propertyId: parseInt(contextId) });
      toast.success("Captions ready!");
    } catch { toast.error("Caption failed"); }
    finally { setIsCaptionLoading(false); }
  };

  const handleQueueTikTok = () => {
    if (!tiktokPack || !contextId || !user) return;
    const trackingLink = `${window.location.origin}/l/${user.id}/${contextId}?platform=tiktok&sourceLabel=Studio_TikTok_${contextId}`;
    const phone = brandData?.whatsappNumber || brandData?.phoneNumber || "";
    const forcedCTA = `📞 Call or WhatsApp now: ${phone} — Ref: ${contextId}`;
    const finalContent = `${tiktokPack.hook}\n\n${tiktokPack.description}\n\n${forcedCTA}\n🔗 View Details: ${trackingLink}\n\n${tiktokPack.hashtags.join(" ")}`;
    socialMutation.mutate({
      platforms: ["tiktok"] as any[],
      content: finalContent,
      mediaUrl: generatedImageUrl || listing.imageUrl || "",
      mediaType: "image", status: "scheduled",
      scheduledTime: new Date(),
    });
  };

  const handleGenerateVideoScript = async () => {
    if (!brandData) { toast.error("Create a Brand Kit first in Settings → Brand"); return; }
    setIsScriptLoading(true);
    try {
      // Build a rich script from the listing data
      const platform = selectedVideoPlatforms[0] || "tiktok";
      const platformFormats: Record<string, any> = {
        tiktok: { duration: "15-60s", style: "fast cuts, trending audio, hook in 3s", ratio: "9:16" },
        facebook: { duration: "60-120s", style: "story-driven, emotional appeal", ratio: "16:9 or 9:16" },
        instagram: { duration: "15-90s", style: "aesthetic, lifestyle-focused", ratio: "9:16 Reels or 1:1" },
        telegram: { duration: "Any", style: "informative, direct", ratio: "16:9" },
      };
      const fmt = platformFormats[platform];
      setGeneratedScript({
        platform,
        hook: `🏠 ${listing.bedrooms ? listing.bedrooms + " Bedroom" : ""} ${listing.propertyType} in ${listing.subcity ? listing.subcity.charAt(0).toUpperCase() + listing.subcity.slice(1) : "Addis Ababa"} — ETB ${listing.price || "Price on Request"}`,
        amharicHook: `🏠 ${listing.title || "ቤት ለሽያጭ"} — ዋጋ ${listing.price || "ጠይቅ"}`,
        scenes: [
          { time: "0-3s", action: "Hook shot — exterior wide angle", text: listing.title || "Premium Property" },
          { time: "3-8s", action: "Walk-through interior", text: `${listing.bedrooms || "—"} Beds • ${listing.bathrooms || "—"} Baths • ${listing.area || "—"}m²` },
          { time: "8-12s", action: "Feature highlight: " + (listing.finishingLevel || "finishing"), text: listing.description?.slice(0, 60) || "Luxury finishing throughout" },
          { time: "12-15s", action: "CTA with brand logo", text: `📞 ${brandData.phoneNumber || "Contact Us"} — ${listing.price ? "ETB " + listing.price : "Price Available"}` },
        ],
        caption: `${listing.title || "Premium Property"} | ${listing.subcity || "Addis Ababa"} | ETB ${listing.price || "POA"}\n\n${listing.description || "Contact for details"}\n\n📞 Call or WhatsApp now: ${brandData.whatsappNumber || brandData.phoneNumber || ""} — Ref: ${contextId || "N/A"}\n🔗 View Details: ${window.location.origin}/l/${user?.id || 0}/${contextId || 123}?platform=${platform}&sourceLabel=Studio_${platform}_${contextId || 123}\n📍 ${listing.subcity}`,
        format: fmt,
        hashtags: [`#AddisAbaba`, `#EthiopiaRealEstate`, `#${listing.subcity || "Bole"}Property`, `#${listing.propertyType || "Apartment"}`, `#EstateIQ`, `#${platform}`],
      });
      toast.success("Video script generated!");
    } catch {
      toast.error("Script generation failed");
    } finally {
      setIsScriptLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "listing" | "rebrand" = "listing") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = await compressImage(file);
    if (type === "rebrand") setRebrandSourceUrl(src);
    else setListing(prev => ({ ...prev, imageUrl: src }));
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  // ── Entry Screen ─────────────────────────────────────────────────────────────

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

  // ── Workspace ─────────────────────────────────────────────────────────────

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

          {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 scrollbar-none">

            {/* ══ CREATE-AD MODE ══ */}
            {mode === "create-ad" && (
              <>
                {/* Template picker */}
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

                {/* Full property form */}
                <div style={glassStyle} className="p-6 border-0">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-accent" /> {t("studio.form")}
                  </h3>
                  <div className="space-y-4">

                    {/* Photo upload */}
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Property Photo</Label>
                      <div className="relative h-36 rounded-2xl border-2 border-dashed border-border/50 hover:border-accent/40 bg-muted/5 transition-all overflow-hidden flex flex-col items-center justify-center group">
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
                        <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "listing")} />
                      </div>
                    </div>

                    {/* Title */}
                    <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Property Title *" value={listing.title} onChange={e => setField("title", e.target.value)} />

                    {/* Price + Property Type */}
                    <div className="grid grid-cols-2 gap-3">
                      <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Price (ETB) *" value={listing.price} onChange={e => setField("price", e.target.value)} />
                      <Select value={listing.propertyType} onValueChange={v => setField("propertyType", v)}>
                        <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-xs font-bold"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>{PROPERTY_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    {/* Subcity + SubLocation */}
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={listing.subcity} onValueChange={v => setField("subcity", v)}>
                        <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-xs font-bold uppercase tracking-widest"><SelectValue placeholder="Subcity *" /></SelectTrigger>
                        <SelectContent>{SUBCITIES.map(s => <SelectItem key={s} value={s} className="uppercase font-black text-[10px]">{t(`subcity.${s}`) || s}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Sub-location" value={listing.subLocation} onChange={e => setField("subLocation", e.target.value)} />
                    </div>

                    {/* Bedrooms + Bathrooms + Area */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[9px] font-black uppercase text-muted-foreground mb-1 block">Beds</Label>
                        <Input className="h-9 rounded-xl bg-background/50 border-border/50 text-sm font-medium text-center" placeholder="0" type="number" min="0" value={listing.bedrooms} onChange={e => setField("bedrooms", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[9px] font-black uppercase text-muted-foreground mb-1 block">Baths</Label>
                        <Input className="h-9 rounded-xl bg-background/50 border-border/50 text-sm font-medium text-center" placeholder="0" type="number" min="0" value={listing.bathrooms} onChange={e => setField("bathrooms", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[9px] font-black uppercase text-muted-foreground mb-1 block">Area m²</Label>
                        <Input className="h-9 rounded-xl bg-background/50 border-border/50 text-sm font-medium text-center" placeholder="0" type="number" min="0" value={listing.area} onChange={e => setField("area", e.target.value)} />
                      </div>
                    </div>

                    {/* Finishing Level */}
                    <Select value={listing.finishingLevel} onValueChange={v => setField("finishingLevel", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-xs font-bold"><SelectValue placeholder="Finishing Level" /></SelectTrigger>
                      <SelectContent>{FINISHING_LEVELS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>

                    {/* Title Type */}
                    <Select value={listing.titleType} onValueChange={v => setField("titleType", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-xs font-bold"><SelectValue placeholder="Title Deed Type" /></SelectTrigger>
                      <SelectContent>{TITLE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>

                    {/* Description */}
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Description</Label>
                      <Textarea className="rounded-xl bg-background/50 border-border/50 text-sm font-medium resize-none" rows={3} placeholder="Describe the property..." value={listing.description} onChange={e => setField("description", e.target.value)} />
                    </div>

                    {/* Nearby Landmarks */}
                    <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Nearby landmarks (e.g. CMC, Edna Mall)" value={listing.nearbyLandmarks} onChange={e => setField("nearbyLandmarks", e.target.value)} />

                    {/* Utilities */}
                    <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Utilities (24hr water, generator...)" value={listing.utilities} onChange={e => setField("utilities", e.target.value)} />

                    {/* Negotiable toggle */}
                    <button
                      onClick={() => setField("negotiable", !listing.negotiable)}
                      className={`w-full h-10 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${listing.negotiable ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500" : "bg-muted/10 border-border/50 text-muted-foreground"}`}
                    >
                      {listing.negotiable ? <Check className="w-3.5 h-3.5" /> : null}
                      Price is {listing.negotiable ? "Negotiable ✓" : "Fixed — click to mark negotiable"}
                    </button>

                    {/* CTA Text + Seller Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="CTA Text (e.g. Book a Viewing)" value={listing.ctaText} onChange={e => setField("ctaText", e.target.value)} />
                      <Input className="h-10 rounded-xl bg-background/50 border-accent/20 text-sm font-bold text-accent" placeholder="Seller Phone (Internal)" value={listing.sellerPhone} onChange={e => setField("sellerPhone", e.target.value)} />
                    </div>
                  </div>
                </div>

                <Button onClick={handleGenerateAd} disabled={isGenerating} className="w-full h-14 bg-accent text-white hover:bg-accent/90 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-accent/30 gap-3">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {t("studio.generate")}
                </Button>
              </>
            )}

            {/* ══ CREATE-VIDEO MODE ══ */}
            {mode === "create-video" && (
              <>
                {/* Platform selection */}
                <div style={glassStyle} className="p-6 border-0">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Video className="w-4 h-4 text-accent" /> Target Platforms
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {VIDEO_PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedVideoPlatforms(prev =>
                          prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                        )}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedVideoPlatforms.includes(p.id) ? "bg-accent text-white border-accent shadow-lg" : `${p.color} hover:border-opacity-60`}`}
                      >
                        <p.icon className="w-4 h-4 flex-shrink-0" />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property info for script */}
                <div style={glassStyle} className="p-6 border-0">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-accent" /> Property Details
                  </h3>
                  <div className="space-y-3">
                    <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Property Title" value={listing.title} onChange={e => setField("title", e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input className="h-10 rounded-xl bg-background/50 border-border/50 text-sm font-medium" placeholder="Price (ETB)" value={listing.price} onChange={e => setField("price", e.target.value)} />
                      <Select value={listing.subcity} onValueChange={v => setField("subcity", v)}>
                        <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-xs font-bold uppercase"><SelectValue placeholder="Subcity" /></SelectTrigger>
                        <SelectContent>{SUBCITIES.map(s => <SelectItem key={s} value={s}>{t(`subcity.${s}`) || s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input className="h-9 rounded-xl bg-background/50 border-border/50 text-sm text-center" placeholder="Beds" type="number" value={listing.bedrooms} onChange={e => setField("bedrooms", e.target.value)} />
                      <Input className="h-9 rounded-xl bg-background/50 border-border/50 text-sm text-center" placeholder="Baths" type="number" value={listing.bathrooms} onChange={e => setField("bathrooms", e.target.value)} />
                      <Input className="h-9 rounded-xl bg-background/50 border-border/50 text-sm text-center" placeholder="m²" type="number" value={listing.area} onChange={e => setField("area", e.target.value)} />
                    </div>
                    <Select value={listing.finishingLevel} onValueChange={v => setField("finishingLevel", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-xs font-bold"><SelectValue placeholder="Finishing Level" /></SelectTrigger>
                      <SelectContent>{FINISHING_LEVELS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Textarea className="rounded-xl bg-background/50 border-border/50 text-sm resize-none" rows={3} placeholder="Key selling points for the video..." value={listing.description} onChange={e => setField("description", e.target.value)} />
                  </div>
                </div>

                <Button onClick={handleGenerateVideoScript} disabled={isScriptLoading || selectedVideoPlatforms.length === 0} className="w-full h-14 bg-accent text-white hover:bg-accent/90 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-accent/30 gap-3">
                  {isScriptLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate Video Script & Caption
                </Button>
              </>
            )}

            {/* ══ CREATE-AGENCY / REBRAND MODE ══ */}
            {mode === "create-agency" && (
              <div style={glassStyle} className="p-8 border-0">
                <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-accent" /> Upload Competitor Ad
                </h3>
                <p className="text-xs text-muted-foreground mb-6 font-medium leading-relaxed">
                  Upload any property ad image. Our AI will strip the branding and replace it with your Brand Kit, extracting all property data automatically.
                </p>
                <div className="relative h-64 rounded-[32px] border-2 border-dashed border-accent/20 hover:border-accent/40 bg-accent/5 transition-all overflow-hidden flex flex-col items-center justify-center group mb-8">
                  {rebrandSourceUrl ? (
                    <>
                      <img src={rebrandSourceUrl} className="w-full h-full object-cover" />
                      <Button variant="secondary" size="sm" className="absolute h-10 rounded-xl font-black uppercase shadow-xl" onClick={() => rebrandInputRef.current?.click()}>Change Ad</Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => rebrandInputRef.current?.click()}>
                      <Upload className="w-10 h-10 text-accent/30 group-hover:text-accent group-hover:scale-110 transition-all" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Drop Competitor Ad Here</p>
                        <p className="text-[9px] text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                  <input type="file" ref={rebrandInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "rebrand")} />
                </div>

                {rebrandSourceUrl && (
                  <div style={glassStyle} className="p-4 border-0 mb-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Also apply template style</p>
                    <div className="grid grid-cols-2 gap-2">
                      {LISTING_TEMPLATES.map(tmp => (
                        <button key={tmp.id} onClick={() => setSelectedTemplateId(tmp.id)}
                          className={`px-3 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${selectedTemplateId === tmp.id ? "bg-accent text-white border-accent" : "bg-muted/10 border-border/50 text-muted-foreground"}`}>
                          {tmp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleRebrand} disabled={isRebranding || !rebrandSourceUrl} className="w-full h-16 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl gap-3 transition-all">
                  {isRebranding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  AI Rebrand & Extract
                </Button>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* ══ AD PREVIEW ══ */}
            {mode === "create-ad" && (
              <>
                <div style={glassStyle} className="p-10 border-0 flex items-center justify-center min-h-[600px] overflow-hidden relative">
                  {/* Live Rendered Preview */}
                  <div className="relative shadow-2xl rounded-none ring-1 ring-white/10 bg-background" style={{ width: 1080 * 0.4, height: 1350 * 0.4, overflow: "hidden" }}>
                    <div className="pointer-events-none" style={{ width: 1080, height: 1350, transform: "scale(0.4)", transformOrigin: "top left" }}>
                      {(() => {
                        const Tpl = LISTING_TEMPLATES.find(x => x.id === selectedTemplateId)?.component || LISTING_TEMPLATES[0].component;
                        return <Tpl data={{ ...listing, location: t(`subcity.${listing.subcity}`) || listing.subcity, image: listing.imageUrl } as any} brand={brandData as any} />;
                      })()}
                    </div>
                  </div>

                  {/* Overlaid Download Button if Generated */}
                  {generatedImageUrl && (
                    <div className="absolute top-12 right-12 flex gap-2">
                      <Button size="icon" className="w-10 h-10 rounded-xl bg-accent text-white hover:scale-105 shadow-xl transition-transform" onClick={() => { const a = document.createElement("a"); a.href = generatedImageUrl; a.download = "estate-iq-ad.png"; a.click(); }}>
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>
                  )}

                  {/* Hidden template for capture */}
                  <div className="fixed top-[-9999px] left-[-9999px]">
                    <div ref={templateRef} className="w-[1080px] h-[1350px]">
                      {(() => {
                        const Tpl = LISTING_TEMPLATES.find(x => x.id === selectedTemplateId)?.component || LISTING_TEMPLATES[0].component;
                        return <Tpl data={{ ...listing, location: t(`subcity.${listing.subcity}`) || listing.subcity, image: listing.imageUrl } as any} brand={brandData as any} />;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Marketing Intelligence hub */}
                <div style={glassStyle} className="p-8 border-0">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-accent" /> Marketing Intelligence
                    </h3>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2" onClick={handleGenerateCaption} disabled={isCaptionLoading || tiktokMutation.isPending}>
                      {isCaptionLoading || tiktokMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Generate Marketing Pack
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Standard captions */}
                    <div className="space-y-4">
                      {caption ? (
                        <>
                          <div className="p-5 rounded-2xl bg-background/40 border border-border/50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">English</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(caption.english)}><Copy className="w-3 h-3" /></Button>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{caption.english}</p>
                          </div>
                          <div className="p-5 rounded-2xl bg-background/40 border border-border/50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-accent">አማርኛ</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(caption.amharic)}><Copy className="w-3 h-3" /></Button>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{caption.amharic}</p>
                          </div>
                        </>
                      ) : (
                        <div className="h-40 flex items-center justify-center border border-dashed border-border/50 rounded-2xl opacity-50 italic text-sm text-muted-foreground">
                          Captions will appear here
                        </div>
                      )}
                    </div>

                    {/* TikTok Pack */}
                    <div className="space-y-4">
                      {tiktokPack ? (
                        <>
                          <div className="p-6 rounded-[28px] bg-foreground text-background shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                              <span className="bg-accent text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-4 inline-block">TikTok Scroll-Stopper</span>
                              <p className="text-lg font-black leading-tight mb-2">"{tiktokPack.hook}"</p>
                              <p className="text-xs font-bold opacity-60 italic mb-4">Amharic: "{tiktokPack.amharicHook}"</p>
                              <div className="pt-3 border-t border-background/10 mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Recommended Vibe</p>
                                <p className="text-xs font-bold">{tiktokPack.vibe} • {tiktokPack.musicSuggestion}</p>
                              </div>
                              <Button onClick={() => copyToClipboard(tiktokPack.hook)} variant="secondary" size="sm" className="w-full mb-2 bg-background/10 hover:bg-background/20 text-background rounded-xl font-black text-[10px] uppercase border-0">Copy TikTok Hook</Button>
                              <Button onClick={handleQueueTikTok} disabled={socialMutation.isPending} className="w-full bg-accent text-white hover:bg-accent/90 rounded-xl font-black text-[10px] uppercase border-0 shadow-lg shadow-accent/20 h-10 gap-2">
                                {socialMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                {t("studio.queueTikTok")}
                              </Button>
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Caption + Hashtags</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(tiktokPack.description)}><Copy className="w-3 h-3" /></Button>
                            </div>
                            <p className="text-sm leading-relaxed line-clamp-3 mb-3">{tiktokPack.description}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {tiktokPack.hashtags.map((tag: string) => (
                                <span key={tag} className="text-[9px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-md">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center border border-dashed border-accent/20 rounded-[28px] bg-accent/5 opacity-50 p-6 text-center">
                          <Smartphone className="w-8 h-8 text-accent/30 mb-2" />
                          <p className="text-xs font-bold text-muted-foreground">Click "Generate Marketing Pack" to create your TikTok content</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ══ VIDEO SCRIPT OUTPUT ══ */}
            {mode === "create-video" && (
              <>
                {generatedScript ? (
                  <div className="space-y-6">
                    {/* Header card */}
                    <div style={glassStyle} className="p-8 border-0">
                      <div className="flex items-center gap-3 mb-6">
                        {VIDEO_PLATFORMS.filter(p => p.id === generatedScript.platform).map(p => (
                          <div key={p.id} className={`w-10 h-10 rounded-xl flex items-center justify-center border ${p.color}`}>
                            <p.icon className="w-5 h-5" />
                          </div>
                        ))}
                        <div>
                          <p className="text-lg font-black uppercase tracking-tight">{generatedScript.platform} Video Script</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">{generatedScript.format.duration} • {generatedScript.format.ratio} • {generatedScript.format.style}</p>
                        </div>
                      </div>

                      {/* Hook */}
                      <div className="p-5 rounded-2xl bg-foreground text-background mb-4">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">Opening Hook (English)</p>
                        <p className="text-lg font-black leading-tight">{generatedScript.hook}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
                        <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-2">Opening Hook (አማርኛ)</p>
                        <p className="text-base font-black">{generatedScript.amharicHook}</p>
                      </div>

                      {/* Scene breakdown */}
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Scene Breakdown</h4>
                      <div className="space-y-3">
                        {generatedScript.scenes.map((scene: any, i: number) => (
                          <div key={i} className="flex gap-4 p-4 rounded-xl bg-background/40 border border-border/50">
                            <div className="shrink-0 w-16 text-center">
                              <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded-lg">{scene.time}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black text-foreground">{scene.action}</p>
                              <p className="text-[11px] text-muted-foreground mt-1 italic">"{scene.text}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Caption + Hashtags */}
                    <div style={glassStyle} className="p-6 border-0">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-accent" /> Post Caption
                        </h4>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase gap-2" onClick={() => copyToClipboard(`${generatedScript.caption}\n\n${generatedScript.hashtags.join(" ")}`)}>
                          <Copy className="w-3 h-3" /> Copy All
                        </Button>
                      </div>
                      <div className="p-4 rounded-xl bg-background/40 border border-border/50 mb-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{generatedScript.caption}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {generatedScript.hashtags.map((tag: string) => (
                          <span key={tag} className="text-[9px] font-black text-accent bg-accent/5 px-2 py-1 rounded-lg border border-accent/10">{tag}</span>
                        ))}
                      </div>

                      {/* Multi-platform dispatch */}
                      <div className="mt-6 pt-6 border-t border-border/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Queue to Platforms</p>
                        <div className="flex gap-3 flex-wrap">
                          {selectedVideoPlatforms.map(platformId => {
                            const p = VIDEO_PLATFORMS.find(x => x.id === platformId)!;
                            if (!p) return null;
                            return (
                              <Button
                                key={platformId}
                                disabled={socialMutation.isPending || !contextId}
                                className="rounded-xl font-black text-[10px] uppercase gap-2 bg-foreground text-background hover:bg-foreground/90"
                                onClick={() => {
                                  if (!contextId || !user) return;
                                  const trackingLink = `${window.location.origin}/l/${user.id}/${contextId}?platform=${platformId}`;
                                  socialMutation.mutate({
                                    platforms: [platformId as any],
                                    content: `${generatedScript.caption}\n\n🔗 ${trackingLink}\n\n${generatedScript.hashtags.join(" ")}`,
                                    mediaUrl: listing.imageUrl || "",
                                    mediaType: "image",
                                    status: "scheduled",
                                    scheduledTime: new Date(),
                                  });
                                }}
                              >
                                {socialMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <p.icon className="w-3 h-3" />}
                                Queue to {p.label}
                              </Button>
                            );
                          })}
                        </div>
                        {!contextId && <p className="text-[10px] text-muted-foreground mt-2 font-medium">Open the studio from a specific property to enable dispatch.</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={glassStyle} className="p-10 border-0 flex flex-col items-center justify-center min-h-[600px] text-center">
                    <div className="w-24 h-24 rounded-[40px] bg-purple-500/10 flex items-center justify-center mb-8 border border-purple-500/20">
                      <Video className="w-12 h-12 text-purple-500/40" />
                    </div>
                    <p className="text-2xl font-black text-foreground mb-3 tracking-tighter">Video Production Hub</p>
                    <p className="text-sm text-muted-foreground font-medium max-w-sm">
                      Select target platforms, fill in property details on the left, then click Generate to get a full video script, scene breakdown, and ready-to-post captions.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ══ REBRAND PREVIEW ══ */}
            {mode === "create-agency" && (
              <div style={glassStyle} className="p-10 border-0 flex flex-col items-center justify-center min-h-[600px]">
                {generatedImageUrl ? (
                  <div className="relative animate-in fade-in zoom-in duration-700 max-w-[500px] w-full">
                    <img src={generatedImageUrl} className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button size="icon" className="w-10 h-10 rounded-xl bg-accent text-white hover:scale-105 transition-transform" onClick={() => { const a = document.createElement("a"); a.href = generatedImageUrl; a.download = "rebranded-ad.png"; a.click(); }}>
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>
                    {/* Extracted data */}
                    {(listing.title || listing.price) && (
                      <div className="mt-6 p-5 rounded-2xl bg-background/80 border border-border/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">Extracted Property Data</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {listing.title && <div><span className="text-muted-foreground text-xs">Title:</span> <p className="font-bold">{listing.title}</p></div>}
                          {listing.price && <div><span className="text-muted-foreground text-xs">Price:</span> <p className="font-bold text-accent">ETB {listing.price}</p></div>}
                          {listing.subcity && <div><span className="text-muted-foreground text-xs">Subcity:</span> <p className="font-bold">{listing.subcity}</p></div>}
                          {listing.bedrooms && <div><span className="text-muted-foreground text-xs">Beds:</span> <p className="font-bold">{listing.bedrooms}</p></div>}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-[40px] bg-amber-500/10 flex items-center justify-center mb-8 border border-amber-500/20 mx-auto">
                      <Building2 className="w-12 h-12 text-amber-500/40" />
                    </div>
                    <p className="text-2xl font-black text-foreground mb-3 tracking-tighter">AI Rebrand Engine</p>
                    <p className="text-sm text-muted-foreground font-medium max-w-sm">
                      Upload any competitor property ad. Our AI will extract all property data and rebuild the ad with your brand identity.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
