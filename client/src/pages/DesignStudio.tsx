import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Download,
  Sparkles,
  Upload,
  ArrowRight,
  Copy,
  Palette,
  Image as ImageIcon,
  Video,
  Building2,
  Wand2,
  Check,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { generateAdImage } from "@/lib/studio/CanvasAdGenerator";

type StudioMode = "create-ad" | "create-video" | "create-agency";
type AdStyle =
  | "classic"
  | "modern"
  | "minimal"
  | "luxury"
  | "commercial"
  | "instagram";

const SUBCITIES = [
  "Bole",
  "Kirkos",
  "Yeka",
  "Arada",
  "Lideta",
  "Gulele",
  "Kolfe Keranio",
  "Nifas Silk-Lafto",
  "Akaky Kaliti",
  "Lemi Kura",
  "CMC",
  "Kazanchis",
  "Piassa",
  "Sarbet",
  "Summit",
  "Ayat",
  "Gerji",
  "Megenagna",
];

export default function DesignStudio() {
  const { contextId } = useParams();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<StudioMode | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Brand Kit
  const { data: brandKits = [] } = trpc.crm.brandKits.list.useQuery();
  const activeBrandKit = brandKits[0] as any;

  // Listing form state
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
  });

  const [adStyle, setAdStyle] = useState<AdStyle>("modern");
  const [caption, setCaption] = useState<{
    amharic: string;
    english: string;
    combined: string;
    hashtags: string[];
    amharicHashtags: string[];
    tiktok: string;
  } | null>(null);
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [rebrandImage, setRebrandImage] = useState<string | null>(null);
  const [isRebranding, setIsRebranding] = useState(false);

  const setField = (k: string, v: any) =>
    setListing(prev => ({ ...prev, [k]: v }));

  const brandData = activeBrandKit
    ? {
        id: activeBrandKit.id,
        name: activeBrandKit.name || "My Brand",
        primaryColor: (activeBrandKit.colors as any[])?.[0]?.hex || "#1e3a5f",
        secondaryColor: (activeBrandKit.colors as any[])?.[1]?.hex || "#f5f0eb",
        backgroundColor:
          (activeBrandKit.colors as any[])?.[2]?.hex || "#0a0a0f",
        phoneNumber: activeBrandKit.phoneNumber || "",
        whatsappNumber: activeBrandKit.whatsappNumber || "",
        telegramChannel: activeBrandKit.telegramChannel || "",
        instagramHandle: activeBrandKit.instagramHandle || "",
        tiktokHandle: activeBrandKit.tiktokHandle || "",
        facebookUrl: activeBrandKit.facebookUrl || "",
        logoUrl: (activeBrandKit.logos as any[])?.[0]?.src || "",
        tagline: activeBrandKit.tagline || "",
        targetAreas: (activeBrandKit.targetAreas as string[]) || [],
        languagePreference: activeBrandKit.languagePreference || "both",
      }
    : null;

  // AI mutations
  const generateAdMutation = trpc.studio.aiStudio.generateAd.useMutation();
  const rebrandMutation = trpc.studio.aiStudio.rebrand.useMutation();
  const generateCaptionMutation =
    trpc.studio.aiStudio.generateCaption.useMutation();

  const handleGenerateAd = async () => {
    if (!brandData) {
      toast.error("Create a Brand Kit first in Settings → Brand Identity");
      return;
    }
    setIsGenerating(true);
    try {
      const dataUrl = await generateAdImage(
        {
          title: listing.title,
          price: listing.price,
          subcity: listing.subcity,
          subLocation: listing.subLocation,
          propertyType: listing.propertyType,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          area: listing.area,
          description: listing.description,
          imageUrl: listing.imageUrl || undefined,
        },
        {
          primaryColor: brandData.primaryColor,
          secondaryColor: brandData.secondaryColor,
          backgroundColor: brandData.backgroundColor,
          textColor: "#ffffff",
          logoUrl: brandData.logoUrl || undefined,
          phoneNumber: brandData.phoneNumber || undefined,
          companyName: brandData.name,
          tagline: brandData.tagline || undefined,
        },
        adStyle
      );
      setGeneratedImageUrl(dataUrl);
      toast.success("Ad generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!brandData) {
      toast.error("Create a Brand Kit first");
      return;
    }
    setIsCaptionLoading(true);
    try {
      const result = await generateCaptionMutation.mutateAsync({
        ...listing,
        brandKitId: brandData.id,
      });
      setCaption(result);
      toast.success("Captions generated!");
    } catch (e: any) {
      toast.error(e.message || "Caption generation failed");
    } finally {
      setIsCaptionLoading(false);
    }
  };

  const handleRebrand = async () => {
    if (!rebrandImage) {
      toast.error("Upload a competitor ad first");
      return;
    }
    if (!brandData) {
      toast.error("Create a Brand Kit first");
      return;
    }
    setIsRebranding(true);
    try {
      const dataUrl = await generateAdImage(
        {
          title: "Rebranded Property",
          price: "",
          subcity: "",
          subLocation: "",
          propertyType: "",
          bedrooms: "",
          bathrooms: "",
          area: "",
          description: "",
          imageUrl: rebrandImage,
        },
        {
          primaryColor: brandData.primaryColor,
          secondaryColor: brandData.secondaryColor,
          backgroundColor: brandData.backgroundColor,
          textColor: "#ffffff",
          logoUrl: brandData.logoUrl || undefined,
          phoneNumber: brandData.phoneNumber || undefined,
          companyName: brandData.name,
          tagline: brandData.tagline || undefined,
        },
        "modern"
      );
      setGeneratedImageUrl(dataUrl);
      toast.success("Rebranded!");
    } catch (e: any) {
      toast.error(e.message || "Rebranding failed");
    } finally {
      setIsRebranding(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setListing(prev => ({ ...prev, imageUrl: result }));
      setRebrandImage(result);
      toast.success("Image loaded");
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadImage = async () => {
    if (!generatedImageUrl) return;
    try {
      // If it's a data URL (canvas-generated), download directly
      if (generatedImageUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = generatedImageUrl;
        a.download = `${listing.title || "property-ad"}.png`;
        a.click();
      } else {
        const response = await fetch(generatedImageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${listing.title || "property-ad"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success("Image downloaded!");
    } catch {
      toast.error("Download failed");
    }
  };

  // ── MODE SELECT ────────────────────────────────────────────────────────
  if (!mode) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-8">
          <h1 className="text-3xl font-bold mb-2">Design Studio</h1>
          <p className="text-muted-foreground mb-10">
            Choose what you want to create
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "create-ad" as StudioMode,
                icon: <ImageIcon className="w-8 h-8" />,
                title: "Create Property Ad",
                desc: "Generate a professional property ad image with your brand. Upload a photo or fill property details.",
                color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
              },
              {
                id: "create-video" as StudioMode,
                icon: <Video className="w-8 h-8" />,
                title: "Create Property Video",
                desc: "Upload images or video footage. We'll create a branded vertical video with price, location, and contact overlays.",
                color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
              },
              {
                id: "create-agency" as StudioMode,
                icon: <Building2 className="w-8 h-8" />,
                title: "Create Agency Ad",
                desc: "Generate agency branding materials — rebrand a competitor ad or create a general agency promotional image.",
                color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
              },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-col items-start gap-4 p-6 rounded-2xl border-2 border-border bg-card hover:border-accent/50 hover:shadow-lg transition-all text-left`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center border ${m.color}`}
                >
                  {m.icon}
                </div>
                <div>
                  <p className="text-lg font-bold">{m.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-accent text-sm font-semibold">
                  Get started <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── CREATE PROPERTY AD ─────────────────────────────────────────────────
  if (mode === "create-ad") {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto py-6">
          <button
            onClick={() => {
              setMode(null);
              setGeneratedImageUrl(null);
              setCaption(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
          >
            ← Back to Studio
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT: Form */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Create Property Ad</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in property details — AI generates the ad with your brand
                </p>
              </div>

              {/* Brand Kit Status */}
              {brandData ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium text-green-600">
                    Brand Kit: {brandData.name}
                  </span>
                  <div className="flex gap-1 ml-auto">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: brandData.primaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: brandData.secondaryColor }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <X className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm text-amber-600">
                    No Brand Kit —{" "}
                    <button
                      onClick={() => navigate("/settings")}
                      className="underline font-semibold"
                    >
                      create one
                    </button>
                  </span>
                </div>
              )}

              {/* Photo Upload */}
              <div className="p-4 rounded-xl border border-border bg-card">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Property Photo
                </Label>
                <div className="flex items-center gap-3 mt-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20">
                      <Upload className="w-4 h-4" /> Upload Photo
                    </span>
                  </label>
                  {listing.imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                      <img
                        src={listing.imageUrl}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Property Title
                  </Label>
                  <Input
                    value={listing.title}
                    onChange={e => setField("title", e.target.value)}
                    placeholder="e.g. Modern 3BR Apartment"
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Price (ETB)
                    </Label>
                    <Input
                      value={listing.price}
                      onChange={e => setField("price", e.target.value)}
                      placeholder="e.g. 4,500,000"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Property Type
                    </Label>
                    <select
                      value={listing.propertyType}
                      onChange={e => setField("propertyType", e.target.value)}
                      className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm"
                    >
                      <option>Apartment</option>
                      <option>Villa</option>
                      <option>Commercial</option>
                      <option>Land</option>
                      <option>Condo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Subcity
                    </Label>
                    <select
                      value={listing.subcity}
                      onChange={e => setField("subcity", e.target.value)}
                      className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm"
                    >
                      <option value="">Select subcity</option>
                      {SUBCITIES.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Sub-location
                    </Label>
                    <Input
                      value={listing.subLocation}
                      onChange={e => setField("subLocation", e.target.value)}
                      placeholder="e.g. Bole Atlas"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Bedrooms
                    </Label>
                    <Input
                      value={listing.bedrooms}
                      onChange={e => setField("bedrooms", e.target.value)}
                      placeholder="3"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Bathrooms
                    </Label>
                    <Input
                      value={listing.bathrooms}
                      onChange={e => setField("bathrooms", e.target.value)}
                      placeholder="2"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Area (m²)
                    </Label>
                    <Input
                      value={listing.area}
                      onChange={e => setField("area", e.target.value)}
                      placeholder="180"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Description
                  </Label>
                  <textarea
                    value={listing.description}
                    onChange={e => setField("description", e.target.value)}
                    placeholder="Utilities, features, amenities, access, special notes..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Nearby Landmarks
                    </Label>
                    <Input
                      value={listing.nearbyLandmarks}
                      onChange={e =>
                        setField("nearbyLandmarks", e.target.value)
                      }
                      placeholder="e.g. Near Edna Mall"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Utilities
                    </Label>
                    <Input
                      value={listing.utilities}
                      onChange={e => setField("utilities", e.target.value)}
                      placeholder="e.g. Water, Electric, Internet"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Finishing Level
                    </Label>
                    <select
                      value={listing.finishingLevel}
                      onChange={e => setField("finishingLevel", e.target.value)}
                      className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm"
                    >
                      <option value="">Select</option>
                      <option>Shell</option>
                      <option>Semi-finished</option>
                      <option>Fully finished</option>
                      <option>Luxury finish</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Property Use
                    </Label>
                    <select
                      value={listing.propertyUse}
                      onChange={e => setField("propertyUse", e.target.value)}
                      className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm"
                    >
                      <option>Residential</option>
                      <option>Commercial</option>
                      <option>Mixed Use</option>
                      <option>Office</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={listing.negotiable}
                      onChange={e => setField("negotiable", e.target.checked)}
                      className="w-4 h-4 rounded border-border text-accent"
                    />
                    <span className="text-sm">Price is negotiable</span>
                  </label>
                </div>
              </div>

              {/* Ad Style */}
              <div className="p-4 rounded-xl border border-border bg-card">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Ad Style
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(
                    [
                      "modern",
                      "classic",
                      "minimal",
                      "luxury",
                      "commercial",
                      "instagram",
                    ] as AdStyle[]
                  ).map(s => (
                    <button
                      key={s}
                      onClick={() => setAdStyle(s)}
                      className={`py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${adStyle === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/40"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                className="w-full h-12 text-base font-bold bg-accent text-white hover:bg-accent/90"
                onClick={handleGenerateAd}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating
                    Ad...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" /> Generate Property Ad
                  </>
                )}
              </Button>
            </div>

            {/* RIGHT: Preview + Captions + Publish */}
            <div className="space-y-6">
              {generatedImageUrl ? (
                <>
                  {/* Generated Image */}
                  <div className="rounded-2xl overflow-hidden border border-border bg-card">
                    <img
                      src={generatedImageUrl}
                      alt="Generated ad"
                      className="w-full"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-accent text-white"
                      onClick={downloadImage}
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerateAd}
                      disabled={isGenerating}
                    >
                      <Wand2 className="w-4 h-4 mr-2" /> Regenerate
                    </Button>
                  </div>

                  {/* Caption Generator */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold">AI Captions</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateCaption}
                        disabled={isCaptionLoading}
                      >
                        {isCaptionLoading ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        Generate
                      </Button>
                    </div>

                    {caption && (
                      <>
                        {/* Amharic */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Amharic
                            </Label>
                            <button
                              onClick={() => copyToClipboard(caption.amharic)}
                              className="text-xs text-accent flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap leading-relaxed">
                            {caption.amharic}
                          </div>
                        </div>

                        {/* English */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              English
                            </Label>
                            <button
                              onClick={() => copyToClipboard(caption.english)}
                              className="text-xs text-accent flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap leading-relaxed">
                            {caption.english}
                          </div>
                        </div>

                        {/* TikTok */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              TikTok Style
                            </Label>
                            <button
                              onClick={() => copyToClipboard(caption.tiktok)}
                              className="text-xs text-accent flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap leading-relaxed">
                            {caption.tiktok}
                          </div>
                        </div>

                        {/* Hashtags */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Hashtags
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            {caption.amharicHashtags.map(t => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent"
                              >
                                {t}
                              </span>
                            ))}
                            {caption.hashtags.map(t => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                [
                                  ...caption.amharicHashtags,
                                  ...caption.hashtags,
                                ].join(" ")
                              )
                            }
                            className="text-xs text-accent flex items-center gap-1 mt-1"
                          >
                            <Copy className="w-3 h-3" /> Copy all hashtags
                          </button>
                        </div>

                        {/* Combined Caption */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Combined (Amharic + English)
                            </Label>
                            <button
                              onClick={() => copyToClipboard(caption.combined)}
                              className="text-xs text-accent flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                            {caption.combined}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Publish Flow */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <h3 className="text-sm font-bold">Publish</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={downloadImage}
                      >
                        <Download className="w-4 h-4 mr-2" /> Download Image
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (caption) copyToClipboard(caption.combined);
                          else toast.info("Generate captions first");
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" /> Copy Caption
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <p className="text-xs text-muted-foreground">
                        Schedule post — Coming soon
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 rounded-2xl border-2 border-dashed border-border bg-card">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Fill in property details and click Generate
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Your brand kit will be applied automatically
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── CREATE AGENCY AD (Rebrand) ─────────────────────────────────────────
  if (mode === "create-agency") {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-6">
          <button
            onClick={() => {
              setMode(null);
              setGeneratedImageUrl(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
          >
            ← Back to Studio
          </button>

          <h2 className="text-2xl font-bold mb-2">Create Agency Ad</h2>
          <p className="text-muted-foreground mb-8">
            Upload a competitor ad — AI analyzes it and regenerates with your
            brand
          </p>

          {brandData ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-6">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm font-medium text-green-600">
                Brand Kit active: {brandData.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <X className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm text-amber-600">
                No Brand Kit —{" "}
                <button
                  onClick={() => navigate("/settings")}
                  className="underline font-semibold"
                >
                  create one
                </button>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-4 hover:border-accent/60 transition-colors bg-card">
                <Upload className="w-10 h-10 text-muted-foreground/40" />
                <p className="font-semibold">Upload Competitor Ad</p>
                <p className="text-sm text-muted-foreground text-center">
                  PNG, JPG or WebP. AI will analyze and regenerate with your
                  brand.
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <span className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-accent/90">
                    <Upload className="w-4 h-4" /> Choose Image
                  </span>
                </label>
              </div>

              {rebrandImage && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <img src={rebrandImage} className="w-full" />
                </div>
              )}

              {rebrandImage && (
                <Button
                  className="w-full h-12 text-base font-bold bg-accent text-white"
                  onClick={handleRebrand}
                  disabled={isRebranding}
                >
                  {isRebranding ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                      Analyzing & Regenerating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" /> Rebrand with My Brand
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Result */}
            <div className="space-y-4">
              {generatedImageUrl ? (
                <>
                  <div className="rounded-2xl overflow-hidden border border-border bg-card">
                    <img
                      src={generatedImageUrl}
                      alt="Rebranded ad"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={downloadImage}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRebrand}
                      disabled={isRebranding}
                    >
                      <Wand2 className="w-4 h-4 mr-2" /> Regenerate
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 rounded-2xl border-2 border-dashed border-border bg-card">
                  <Palette className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Upload a competitor ad to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── CREATE PROPERTY VIDEO ──────────────────────────────────────────────
  if (mode === "create-video") {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-6">
          <button
            onClick={() => {
              setMode(null);
              setGeneratedImageUrl(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
          >
            ← Back to Studio
          </button>

          <h2 className="text-2xl font-bold mb-2">Create Property Video</h2>
          <p className="text-muted-foreground mb-8">
            Upload images or video — we create a branded vertical video with
            overlays
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {/* Step Guide */}
              <div className="flex items-center gap-3 mb-4">
                {["Upload Media", "Add Details", "Generate", "Download"].map(
                  (s, i) => (
                    <div key={i} className="flex items-center gap-1.5 flex-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${generatedImageUrl ? "bg-green-500 text-white" : "bg-accent text-white"}`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {s}
                      </span>
                      {i < 3 && <div className="flex-1 h-px bg-border" />}
                    </div>
                  )
                )}
              </div>

              <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-4 bg-card">
                <Video className="w-10 h-10 text-muted-foreground/40" />
                <p className="font-semibold">Upload Images or Video</p>
                <p className="text-sm text-muted-foreground text-center">
                  Vertical (9:16) preferred for TikTok/Reels
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <span className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-accent/90">
                    <Upload className="w-4 h-4" /> Upload Media
                  </span>
                </label>
              </div>

              {listing.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-border">
                  {listing.imageUrl.includes("video") ||
                  listing.imageUrl.includes("mp4") ? (
                    <video src={listing.imageUrl} controls className="w-full" />
                  ) : (
                    <img src={listing.imageUrl} className="w-full" />
                  )}
                </div>
              )}

              {/* Quick property details for video overlays */}
              {listing.imageUrl && (
                <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Video Overlay Details
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={listing.price}
                      onChange={e => setField("price", e.target.value)}
                      placeholder="Price"
                      className="h-9"
                    />
                    <Input
                      value={listing.subLocation || listing.subcity}
                      onChange={e => setField("subLocation", e.target.value)}
                      placeholder="Location"
                      className="h-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Phone and brand from your Brand Kit will be auto-added
                  </p>
                </div>
              )}

              {listing.imageUrl && (
                <Button
                  className="w-full h-12 text-base font-bold bg-accent text-white"
                  onClick={handleGenerateAd}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" /> Generate Video
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {generatedImageUrl ? (
                <>
                  <div className="rounded-2xl overflow-hidden border border-border bg-card">
                    <img
                      src={generatedImageUrl}
                      alt="Video frame"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={downloadImage}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerateAd}
                      disabled={isGenerating}
                    >
                      <Wand2 className="w-4 h-4 mr-2" /> Regenerate
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 rounded-2xl border-2 border-dashed border-border bg-card">
                  <Video className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Upload media to create your branded video
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
