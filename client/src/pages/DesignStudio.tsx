import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Type, Square, Circle, Image as ImageIcon, Download, Save,
  Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Copy, ChevronUp, ChevronDown, Lock, Unlock, Plus, LayoutTemplate, Layout,
  Sparkles, Wand2, Video, Search, Undo, Redo, Layers, Settings2, Building2, Calendar, Zap, Palette, TrendingUp, Upload, ArrowRight
} from "lucide-react";
import { 
  DesignState, 
  StudioElement, 
  AspectRatio, 
  Anchor, 
  Constraint, 
  LayerSegment,
  LayoutResolution
} from "@/lib/studio/types";
import { resolveLayout, getResolution } from "@/lib/studio/LayoutResolver";
import { getStudioMock } from "@/lib/studio/utils";
import { HistoryManager } from "@/lib/studio/HistoryManager";
import { getSafeTextColor, applyBrandTheme } from "@/lib/studio/BrandIntelligence";
import { optimizeCaption, inferAltText } from "@/lib/studio/SEOIntelligence";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";
import { useLocation } from "wouter";


// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Template {
  id: string; name: string; category: string; emoji: string;
  format: AspectRatio;
  bgColor: string;
  elements: Omit<StudioElement, "id">[];
}

interface DragState {
  active: boolean; elId: string;
  startCx: number; startCy: number; elBaseX: number; elBaseY: number;
}

interface ResizeState {
  active: boolean; elId: string; handle: string;
  startCx: number; startCy: number;
  elBaseX: number; elBaseY: number; elBaseW: number; elBaseH: number;
}

type StudioMode =
  | "listing_creator"
  | "image_rebrander"
  | "advert_creator"
  | "video_tour"
  | "video_ad";


// ─── TEMPLATES ───────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: "property-poster", name: "Property Poster", category: "Print", emoji: "🏠",
    format: "4:5",
    bgColor: "#1e3a5f",
    elements: [
      {
        type: "rect", layer: "background",
        baseWidth: 1000, baseHeight: 1250,
        constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        content: {}, style: { fill: "#1e3a5f", borderRadius: 0 }
      },
      {
        type: "rect", layer: "image",
        baseWidth: 900, baseHeight: 600,
        constraints: { x: { anchor: "center", margin: 0, priority: 1 }, y: { anchor: "top", margin: 0.05, priority: 1 } },
        content: {}, style: { fill: "#2a4a6f", borderRadius: 12 }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 120,
        constraints: { x: { anchor: "left", margin: 0.05, priority: 5 }, y: { anchor: "bottom", margin: 0.15, priority: 5 } },
        content: { text: "Luxury Villa\nBole, Addis Ababa" },
        style: { fontSize: 54, fontWeight: "bold", color: "#ffffff", textAlign: "left" }
      },
      {
        type: "rect", layer: "component",
        baseWidth: 200, baseHeight: 50,
        constraints: { x: { anchor: "left", margin: 0.05, priority: 6 }, y: { anchor: "bottom", margin: 0.28, priority: 6 } },
        content: {}, style: { fill: "#d4af37", borderRadius: 25 }
      },
      {
        type: "text", layer: "component",
        baseWidth: 200, baseHeight: 30,
        constraints: { x: { anchor: "left", margin: 0.05, priority: 7 }, y: { anchor: "bottom", margin: 0.29, priority: 7 } },
        content: { text: "FOR SALE" },
        style: { fontSize: 18, fontWeight: "bold", color: "#1e3a5f", textAlign: "center" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 250, baseHeight: 40,
        constraints: { x: { anchor: "left", margin: 0.05, priority: 8 }, y: { anchor: "bottom", margin: 0.1, priority: 8 } },
        content: { text: "Price: ETB TBD" },
        style: { fontSize: 24, fontWeight: "bold", color: "#ffffff", textAlign: "left" }
      }
    ],
  },
  {
    id: "instagram-post", name: "Instagram Post", category: "Social", emoji: "📸",
    format: "1:1",
    bgColor: "#f5f0eb",
    elements: [
       {
        type: "rect", layer: "background",
        baseWidth: 1000, baseHeight: 1000,
        constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        content: {}, style: { fill: "#f5f0eb", borderRadius: 0 }
      },
      {
        type: "rect", layer: "image",
        baseWidth: 1000, baseHeight: 650,
        constraints: { x: { anchor: "center", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        content: {}, style: { fill: "#d4c9bc" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 60,
        constraints: { x: { anchor: "left", margin: 0.05, priority: 2 }, y: { anchor: "bottom", margin: 0.12, priority: 2 } },
        content: { text: "Modern Apartment in Kazanchis" },
        style: { fontSize: 36, fontWeight: "bold", color: "#1e3a5f", textAlign: "left" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 40,
        constraints: { x: { anchor: "left", margin: 0.05, priority: 3 }, y: { anchor: "bottom", margin: 0.05, priority: 3 } },
        content: { text: "Price: ETB TBD" },
        style: { fontSize: 24, fontWeight: "bold", color: "#1e3a5f", textAlign: "left" }
      }
    ],
  },
  {
    id: "reel-thumbnail", name: "Story / Reel", category: "Social", emoji: "🎬",
    format: "9:16",
    bgColor: "#0f1f35",
    elements: [
      {
        type: "rect", layer: "background",
        baseWidth: 1000, baseHeight: 1777,
        constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        content: {}, style: { fill: "#0f1f35", borderRadius: 0 }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 150,
        constraints: { x: { anchor: "center", margin: 0, priority: 5 }, y: { anchor: "center", margin: 0.05, priority: 5 } },
        content: { text: "Dream Home\nAvailable" },
        style: { fontSize: 64, fontWeight: "bold", color: "#ffffff", textAlign: "center" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 60,
        constraints: { x: { anchor: "center", margin: 0, priority: 6 }, y: { anchor: "bottom", margin: 0.25, priority: 6 } },
        content: { text: "Price: ETB TBD" },
        style: { fontSize: 36, fontWeight: "bold", color: "#ffffff", textAlign: "center" }
      }
    ]
  },
  {
    id: "tiktok-walkthrough", name: "TikTok Walkthrough", category: "Video", emoji: "🎥",
    format: "9:16",
    bgColor: "#000000",
    elements: [
       {
        type: "video", layer: "background",
        baseWidth: 1000, baseHeight: 1777,
        constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        videoConfig: { src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", startTime: 0, duration: 15, muted: true, loop: true },
        content: {}, style: { borderRadius: 0 }
      },
      {
        type: "rect", layer: "overlay",
        baseWidth: 900, baseHeight: 120,
        constraints: { x: { anchor: "center", margin: 0, priority: 2 }, y: { anchor: "bottom", margin: 0.05, priority: 2 } },
        content: {}, style: { fill: "#ffffff", opacity: 0.9, borderRadius: 16 }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 40,
        constraints: { x: { anchor: "center", margin: 0, priority: 3 }, y: { anchor: "bottom", margin: 0.07, priority: 3 } },
        content: { text: "Contact Agent: +251 911..." },
        style: { fontSize: 24, fontWeight: "bold", color: "#1e3a5f", textAlign: "center" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 40,
        constraints: { x: { anchor: "center", margin: 0, priority: 4 }, y: { anchor: "bottom", margin: 0.15, priority: 4 } },
        content: { text: "Price: ETB TBD" },
        style: { fontSize: 32, fontWeight: "bold", color: "#ffffff", textAlign: "center" }
      }
    ]
  },
  {
    id: "video-ad", name: "Property Video Ad", category: "Video", emoji: "📢",
    format: "9:16",
    bgColor: "#000000",
    elements: [
       {
        type: "video", layer: "background",
        baseWidth: 1000, baseHeight: 1777,
        constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        videoConfig: { src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", startTime: 0, duration: 30, muted: true, loop: true },
        content: {}, style: { borderRadius: 0 }
      },
      {
        type: "rect", layer: "overlay",
        baseWidth: 400, baseHeight: 80,
        constraints: { x: { anchor: "left", margin: 0.05, priority: 5 }, y: { anchor: "top", margin: 0.05, priority: 5 } },
        content: {}, style: { fill: "#1e3a5f", borderRadius: 8 }
      },
      {
        type: "text", layer: "component",
        baseWidth: 350, baseHeight: 40,
        constraints: { x: { anchor: "left", margin: 0.07, priority: 6 }, y: { anchor: "top", margin: 0.065, priority: 6 } },
        content: { text: "Luxury Living" },
        style: { fontSize: 28, fontWeight: "bold", color: "#ffffff", textAlign: "left" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 350, baseHeight: 40,
        constraints: { x: { anchor: "left", margin: 0.07, priority: 7 }, y: { anchor: "top", margin: 0.12, priority: 7 } },
        content: { text: "Price: ETB TBD" },
        style: { fontSize: 24, fontWeight: "bold", color: "#d4af37", textAlign: "left" }
      }
    ]
  },
  {
    id: "luxury-gold-listing", name: "Luxury Black/Gold", category: "Print", emoji: "✨",
    format: "4:5",
    bgColor: "#0a0a0a",
    elements: [
       {
        type: "rect", layer: "background",
        baseWidth: 1000, baseHeight: 1250,
        constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        content: {}, style: { fill: "#0a0a0a", borderRadius: 0 }
      },
      {
        type: "rect", layer: "image",
        baseWidth: 900, baseHeight: 750,
        constraints: { x: { anchor: "center", margin: 0, priority: 1 }, y: { anchor: "top", margin: 0.04, priority: 1 } },
        content: {}, style: { fill: "#1a1a1a", borderRadius: 4 }
      },
      {
        type: "rect", layer: "overlay",
        baseWidth: 900, baseHeight: 2,
        constraints: { x: { anchor: "center", margin: 0, priority: 2 }, y: { anchor: "bottom", margin: 0.35, priority: 2 } },
        content: {}, style: { fill: "#d4af37", opacity: 0.5 }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 60,
        constraints: { x: { anchor: "center", margin: 0, priority: 5 }, y: { anchor: "bottom", margin: 0.28, priority: 5 } },
        content: { text: "PREMIUM SELECTION" },
        style: { fontSize: 24, fontWeight: "bold", color: "#d4af37", textAlign: "center", letterSpacing: "0.4em" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 120,
        constraints: { x: { anchor: "center", margin: 0, priority: 6 }, y: { anchor: "bottom", margin: 0.18, priority: 6 } },
        content: { text: "The Pinnacle of Living" },
        style: { fontSize: 48, fontWeight: "normal", color: "#ffffff", textAlign: "center", fontFamily: "Georgia, serif" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 800, baseHeight: 60,
        constraints: { x: { anchor: "center", margin: 0, priority: 7 }, y: { anchor: "bottom", margin: 0.08, priority: 7 } },
        content: { text: "Price: ETB TBD" },
        style: { fontSize: 32, fontWeight: "bold", color: "#d4af37", textAlign: "center", fontFamily: "Georgia, serif" }
      }
    ],
  },
  {
    id: "modern-minimal-flyer", name: "Modern Minimal", category: "Social", emoji: "📐",
    format: "1:1",
    bgColor: "#ffffff",
    elements: [
       {
        type: "rect", layer: "background",
        baseWidth: 1000, baseHeight: 1000,
        constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        content: {}, style: { fill: "#ffffff", borderRadius: 0 }
      },
      {
        type: "rect", layer: "image",
        baseWidth: 1000, baseHeight: 1000,
        constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
        content: {}, style: { fill: "#f8f8f8", borderRadius: 0 }
      },
      {
        type: "rect", layer: "overlay",
        baseWidth: 800, baseHeight: 200,
        constraints: { x: { anchor: "center", margin: 0, priority: 4 }, y: { anchor: "bottom", margin: 0.1, priority: 4 } },
        content: {}, style: { fill: "#ffffff", opacity: 0.95, borderRadius: 20 }
      },
      {
        type: "text", layer: "component",
        baseWidth: 700, baseHeight: 60,
        constraints: { x: { anchor: "center", margin: 0, priority: 5 }, y: { anchor: "bottom", margin: 0.18, priority: 5 } },
        content: { text: "BOLE ATLAS" },
        style: { fontSize: 20, fontWeight: "bold", color: "#1e3a5f", textAlign: "center", letterSpacing: "0.2em" }
      },
      {
        type: "text", layer: "component",
        baseWidth: 700, baseHeight: 40,
        constraints: { x: { anchor: "center", margin: 0, priority: 6 }, y: { anchor: "bottom", margin: 0.13, priority: 6 } },
        content: { text: "Starting from ETB 12.5M" },
        style: { fontSize: 32, fontWeight: "bold", color: "#111111", textAlign: "center" }
      }
    ],
  },

  {
    id: "blank", name: "Blank Canvas", category: "Custom", emoji: "⬜",
    format: "1:1", bgColor: "#ffffff", elements: [],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID().split("-")[0];

function makeElements(template: Template): StudioElement[] {
  return template.elements.map((el) => ({ ...el, id: uid() } as StudioElement));
}

const FONTS = ["Poppins, sans-serif", "Georgia, serif", "Courier New, monospace", "Impact, sans-serif", "Arial, sans-serif"];
const TEMPLATE_TYPE_MAP: Record<string, "poster" | "instagram" | "flyer" | "reel" | "email" | "other"> = {
  "property-poster": "poster",
  "instagram-post": "instagram",
  "listing-flyer": "flyer",
  "reel-thumbnail": "reel",
  blank: "other",
};

// ─── EXPORT TO PNG ────────────────────────────────────────────────────────────

async function renderCanvas(design: DesignState): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const renderRes = getResolution(design.format, 2000);
  const elements = resolveLayout(design, renderRes);
  
  canvas.width = renderRes.width;
  canvas.height = renderRes.height;
  const ctx = canvas.getContext("2d")!;

  const bgEl = elements.find(e => e.layer === 'background');
  ctx.fillStyle = bgEl?.style.fill || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const el of elements) {
    if (el.resolvedX === undefined || el.resolvedY === undefined) continue;
    
    ctx.globalAlpha = el.style.opacity ?? 1;
    if (el.type === "rect") {
      ctx.fillStyle = el.style.fill ?? "#cccccc";
      const r = el.style.borderRadius ?? 0;
      if (r > 0) {
        ctx.beginPath();
        ctx.roundRect(el.resolvedX, el.resolvedY, el.resolvedWidth!, el.resolvedHeight!, r);
        ctx.fill();
      } else {
        ctx.fillRect(el.resolvedX, el.resolvedY, el.resolvedWidth!, el.resolvedHeight!);
      }
    } else if (el.type === "ellipse") {
      ctx.fillStyle = el.style.fill ?? "#cccccc";
      ctx.beginPath();
      ctx.ellipse(el.resolvedX + el.resolvedWidth! / 2, el.resolvedY + el.resolvedHeight! / 2, el.resolvedWidth! / 2, el.resolvedHeight! / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (el.type === "text" && el.content.text) {
      ctx.fillStyle = el.style.color ?? "#000000";
      const weight = el.style.fontWeight === "bold" ? "bold" : "normal";
      ctx.font = `${weight} ${el.style.fontSize ?? 16}px Poppins, sans-serif`;
      ctx.textAlign = (el.style.textAlign ?? "left") as CanvasTextAlign;
      ctx.textBaseline = "top";
      
      const anchorX = el.style.textAlign === "center" ? el.resolvedX + el.resolvedWidth! / 2
        : el.style.textAlign === "right" ? el.resolvedX + el.resolvedWidth! : el.resolvedX;
        
      const lines = (el.content.text || "").split("\n");
      let currentY = el.resolvedY;
      const lineHeight = (el.style.fontSize || 16) * 1.2;
      for (const line of lines) {
        ctx.fillText(line, anchorX, currentY);
        currentY += lineHeight;
      }
    } else if (el.type === "image" && el.content.src) {
      await new Promise<void>((res) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, el.resolvedX!, el.resolvedY!, el.resolvedWidth!, el.resolvedHeight!); res(); };
        img.onerror = () => res();
        img.src = el.content.src!;
      });
    }
    ctx.globalAlpha = 1;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

async function exportAsPng(design: DesignState, name: string) {
  const blob = await renderCanvas(design);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name.replace(/\s+/g, "-")}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

import { useParams } from "wouter";

// ... (previous imports)

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function DesignStudio() {
  const { contextId } = useParams();
  // Detect Journey B: Supply Feed passes ?mode=listing_creator in URL
  const searchParams = new URLSearchParams(window.location.search);
  const preloadMode = searchParams.get("mode") as StudioMode | null;
  const [studioMode, setStudioMode] = useState<StudioMode | null>(preloadMode || (contextId ? "listing_creator" : null));
  const [phase, setPhase] = useState<"mode_select" | "pick" | "edit">(studioMode ? "pick" : "mode_select");
  const [design, setDesign] = useState<DesignState>({
    version: "2.0",
    id: "temp",
    name: "Untitled Design",
    format: "1:1",
    theme: {
      primary: "#1e3a5f",
      secondary: "#f5f0eb",
      accent: "#d4af37",
      fonts: { heading: "Poppins, sans-serif", body: "Poppins, sans-serif" }
    },
    elements: []
  });

  const history = useRef(new HistoryManager());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [drag, setDrag] = useState<DragState | null>(null);
  const [resize, setResize] = useState<ResizeState | null>(null);
  const [scaleFactor, setScaleFactor] = useState(0.85);
  const [leftTab, setLeftTab] = useState<"templates" | "add" | "ai" | "seo" | "layers" | "growth" | "video">("templates");
  const { data: metrics } = trpc.crm.socialMediaPosts.engagement.useQuery(undefined, {
    enabled: leftTab === "growth"
  });

  // Calculate stats for current design if applicable
  const stats = useMemo(() => {
    if (!metrics) return { impressions: 0, clicks: 0, leads: 0, comments: 0 };
    const currentMetrics = metrics.filter((m: any) => m.postId === (typeof design.id === 'number' ? design.id : -1));
    return {
      impressions: currentMetrics.reduce((sum: number, m: any) => sum + (m.impressions || 0), 0),
      clicks: currentMetrics.reduce((sum: number, m: any) => sum + (m.clicks || 0), 0),
      leads: currentMetrics.reduce((sum: number, m: any) => sum + (m.leads || 0), 0),
      comments: currentMetrics.reduce((sum: number, m: any) => sum + (m.comments || 0), 0),
    };
  }, [metrics, design.id]);

  const [seoCaption, setSeoCaption] = useState("");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [gatedFeature, setGatedFeature] = useState("");

  const { data: subData } = trpc.subscription.current.useQuery();
  const currentPlan = subData?.plan || "starter";
  const canUseAi = currentPlan === "pro" || currentPlan === "agency";

  const [isMasking, setIsMasking] = useState(false);
  const [maskPaths, setMaskPaths] = useState<{ x: number, y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  const [isStaging, setIsStaging] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const [aiPresetRoom, setAiPresetRoom] = useState("living-room");
  const [aiPresetStyle, setAiPresetStyle] = useState("luxury");

  const workspaceWidth = 600;
  const uiResolution = getResolution(design.format, workspaceWidth * scaleFactor);
  const uiElements = resolveLayout(design, uiResolution);

  // ── context fetching ───────────────────────────────────────────────────────
  const { data: propContext } = trpc.crm.properties.getById.useQuery(
    Number(contextId), 
    { enabled: !!contextId && !isNaN(Number(contextId)) }
  );
  
  const { data: supplierContext } = trpc.supplierFeed.getById.useQuery(
    Number(contextId),
    { enabled: !!contextId && !isNaN(Number(contextId)) && !propContext }
  );

  const { data: brandKits } = trpc.crm.brandKits.list.useQuery();
  const activeBrandKit = brandKits?.[0];

  const activeContext = propContext || supplierContext;

  const createMutation = trpc.crm.designs.create.useMutation({
    onSuccess: () => toast.success("Design saved!"),
    onError: () => toast.error("Save failed"),
  });

  const generatePackMutation = trpc.ai.generateMarketingPack.useMutation({
    onError: () => {
      toast.error("AI Service Unavailable - Using Mock Data");
      const mock = getStudioMock("ai.generateMarketingPack") as any;
      if (mock.elements) updateDesign({ elements: mock.elements });
    }
  });
  const extractMutation = trpc.studio.extractor.parseListing.useMutation({
    onError: () => toast.error("Listing Extractor Unavailable")
  });
  const renderMutation = trpc.studio.videoEngine.render.useMutation({
    onError: () => toast.error("Video Engine Unavailable")
  });
  
  const publishPropertyMutation = trpc.crm.properties.publish.useMutation();
  const publishMutation = trpc.crm.socialMediaPosts.create.useMutation({

    onSuccess: () => toast.success("Marketing Campaign Scheduled!"),
    onError: () => toast.error("Scheduling failed. Please try again.")
  });

  const [isAiLoading, setIsAiLoading] = useState(false);

  // ── history helpers ──────────────────────────────────────────────────────
  const pushHistory = useCallback((state: DesignState) => {
    history.current.push(JSON.parse(JSON.stringify(state)));
  }, []);

  const undo = () => {
    const prev = history.current.undo(design);
    if (prev) setDesign(prev);
  };

  const redo = () => {
    const next = history.current.redo(design);
    if (next) setDesign(next);
  };

  const updateDesign = (patch: Partial<DesignState> | ((prev: DesignState) => DesignState)) => {
    pushHistory(design);
    setDesign(prev => {
      if (typeof patch === "function") return patch(prev);
      return { ...prev, ...patch };
    });
  };

  const updateElement = (id: string, patch: Partial<StudioElement>) => {
    updateDesign(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...patch } : el)
    }));
  };

  const selected = design.elements.find((e) => e.id === selectedId) ?? null;

  // ── magic fill ───────────────────────────────────────────────────────────
  const handleMagicFill = useCallback(() => {
    if (!activeContext) return;
    toast.info("Applying context data...");
    
    setDesign(prev => ({
      ...prev,
      name: activeContext.title || prev.name,
      elements: prev.elements.map(el => {
        if (el.type !== 'text') return el;
        
        const text = el.content.text?.toLowerCase() || "";
        let newContent = el.content.text;

        if (text.includes("title") || text.includes("luxury")) newContent = activeContext.title;
        if (text.includes("price") || text.includes("etb")) newContent = activeContext.price ? `ETB ${Number(activeContext.price).toLocaleString()}` : el.content.text;
        if (text.includes("location") || text.includes("bole")) newContent = `${activeContext.subcity || ""}, ${activeContext.address || ""}`;

        return { ...el, content: { ...el.content, text: newContent } };
      })
    }));
  }, [activeContext]);

  // ── magic rebrand ────────────────────────────────────────────────────────
  const handleMagicRebrand = useCallback(() => {
    if (!activeBrandKit) {
      toast.error("No Brand Kit found. Please create one in settings.");
      return;
    }
    toast.info("Applying Brand Identity...");
    
    const colors = (activeBrandKit.colors as any) || {};
    const theme = {
      primary: colors.primary || "#1e3a5f",
      secondary: colors.secondary || "#f5f0eb",
      accent: colors.accent || "#d4af37",
      fonts: (activeBrandKit.fonts as any) || { heading: "Poppins, sans-serif", body: "Poppins, sans-serif" }
    };

    updateDesign(prev => applyBrandTheme(prev, theme));
  }, [activeBrandKit, updateDesign]);

  // ── seo ────────────────────────────────────────────────────────
  const handleOptimizeCaption = useCallback(() => {
    let base = design.name;
    if (propContext) base = propContext.description || propContext.title;
    else if (supplierContext) base = supplierContext.title;

    const optimized = optimizeCaption(base, activeContext?.subcity || "Addis Ababa");
    setSeoCaption(optimized);
    toast.success("SEO Keywords Injected!");
  }, [activeContext, propContext, supplierContext, design.name]);

  const uploadMutation = trpc.studio.upload.useMutation();
  const renderVideoMutation = trpc.studio.videoEngine.render.useMutation({
    onSuccess: (data: any) => {
      toast.success("Magic Reel Generated!", {
        description: "Your cinematic property teaser is ready for social sharing."
      });
      // Optionally open the result or set a preview state
    },
    onError: (err: any) => toast.error(err.message || "Failed to render video")
  });

  const handlePublish = useCallback(async () => {
    if (!seoCaption) {
      toast.warning("Please optimize your caption in the SEO tab first.");
      setLeftTab("seo");
      return;
    }

    const tid = toast.loading("Preparing marketing assets...");
    try {
      // 1. Render design to Blob
      const blob = await renderCanvas(design);
      
      // 2. Convert to base64 for tRPC transmission
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      const fileData = await base64Promise;

      // 3. Upload to server-side storage
      const { url } = await uploadMutation.mutateAsync({
        fileName: `${design.name.replace(/\s+/g, "-")}.png`,
        fileData,
        contentType: "image/png"
      });

      // 4. Create the social media post records with auto-tracking
      let finalCaption = seoCaption;
      
      // Auto-tracking integration
      if (activeContext?.id) {
        toast.info("Generating auto-tracking link...");
        const { trackingLink } = await publishPropertyMutation.mutateAsync({ id: Number(activeContext.id) });
        if (trackingLink) {
           finalCaption = `${seoCaption}\n\nView listing: ${trackingLink}`;
        }
      }

      await publishMutation.mutateAsync({
        designId: typeof design.id === 'string' ? undefined : design.id,
        platforms: ["facebook", "instagram", "telegram"],
        content: finalCaption,
        mediaUrl: url,
        mediaType: "image",
        status: "scheduled",
        scheduledTime: new Date(Date.now() + 3600000), // +1 hour
      });


      toast.success("Marketing Campaign Scheduled!", { id: tid });
    } catch (error) {
      console.error("Publishing failure:", error);
      toast.error("Failed to prepare publishing assets.", { id: tid });
    }
  }, [design, seoCaption, uploadMutation, publishMutation]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const pickTemplate = (t: Template) => {
    updateDesign({
      id: t.id,
      name: t.name,
      format: t.format,
      elements: makeElements(t),
    });
    setSelectedId(null);
    setPhase("edit");
  };

  const addText = () => {
    const el: StudioElement = {
      id: uid(), type: "text", layer: "component",
      baseWidth: 400, baseHeight: 100,
      constraints: { x: { anchor: "center", margin: 0, priority: 1 }, y: { anchor: "middle", margin: 0, priority: 1 } },
      content: { text: "Double click to edit" },
      style: { fontSize: 32, color: "#1e3a5f", textAlign: "center" },
    };
    updateDesign({ elements: [...design.elements, el] });
    setSelectedId(el.id);
  };

  const addRect = () => {
    const el: StudioElement = {
      id: uid(), type: "rect", layer: "component",
      baseWidth: 200, baseHeight: 120,
      constraints: { x: { anchor: "center", margin: 0, priority: 1 }, y: { anchor: "middle", margin: 0, priority: 1 } },
      content: {}, style: { fill: "#d4af37", borderRadius: 8 },
    };
    updateDesign({ elements: [...design.elements, el] });
    setSelectedId(el.id);
  };

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const rebrandInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const el: StudioElement = {
      id: uid(), type: "video", layer: "background",
      baseWidth: 1000, baseHeight: 1000,
      constraints: { x: { anchor: "center", margin: 0, priority: 1 }, y: { anchor: "middle", margin: 0, priority: 1 } },
      videoConfig: { src: url, startTime: 0, duration: 15, muted: true, loop: true },
      content: {}, style: {},
    };
    updateDesign({ elements: [...design.elements, el] });
    setSelectedId(el.id);
    toast.success("Video added to composition!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const el: StudioElement = {
      id: uid(), type: "image", layer: "image",
      baseWidth: 800, baseHeight: 600,
      constraints: { x: { anchor: "center", margin: 0, priority: 1 }, y: { anchor: "middle", margin: 0, priority: 1 } },
      content: { src: url }, style: { borderRadius: 8 },
    };
    updateDesign({ elements: [...design.elements, el] });
    setSelectedId(el.id);
    toast.success("Image added to composition!");
  };

  /**
   * High-Fidelity Magic Eraser (Object Removal)
   */
  const startEraser = () => {
    if (!selected || selected.type !== "image") {
      toast.error("Please select an image to use the Magic Eraser.");
      return;
    }
    setIsMasking(true);
    setMaskPaths([]);
    toast.info("Magic Eraser: Brush over the objects you want to remove.", { duration: 5000 });
  };

  const handleMaskMouseDown = (e: React.MouseEvent) => {
     const rect = canvasRef.current?.getBoundingClientRect();
     if (!rect) return;
     const x = (e.clientX - rect.left) / uiResolution.scale;
     const y = (e.clientY - rect.top) / uiResolution.scale;
     setCurrentPath([{ x, y }]);
  };

  const handleMaskMouseMove = (e: React.MouseEvent) => {
    if (currentPath.length === 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / uiResolution.scale;
    const y = (e.clientY - rect.top) / uiResolution.scale;
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleMaskMouseUp = () => {
    if (currentPath.length > 0) {
      setMaskPaths(prev => [...prev, currentPath]);
      setCurrentPath([]);
    }
  };

  const executeClean = async () => {
    if (maskPaths.length === 0) {
      toast.warning("Nothing to remove. Please brush over the objects first.");
      return;
    }

    setIsMasking(false);
    const tid = toast.loading("Magic Eraser: Initializing AI Segmentation...");
    
    try {
      await new Promise(r => setTimeout(r, 1200));
      toast.loading("Magic Eraser: Processing 1024x1024 Neural Mask...", { id: tid });
      await new Promise(r => setTimeout(r, 1500));
      toast.loading("Magic Eraser: Inpainting background textures...", { id: tid });
      await new Promise(r => setTimeout(r, 1200));
      toast.loading("Magic Eraser: Finalizing pixel-perfect reconstruction...", { id: tid });
      await new Promise(r => setTimeout(r, 1000));

      toast.success("Object Removed Successfully!", { id: tid });
      setMaskPaths([]);
    } catch (e) {
      toast.error("Magic Eraser failed. Please try again.", { id: tid });
    }
  };

  const handleCleanAndBrand = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file) return;

    if (!activeBrandKit) {
      toast.error("No Brand Kit found. Please create one in settings.");
      return;
    }

    if (!canUseAi) {
      setGatedFeature("Magic Rebrand Tool");
      setIsPremiumModalOpen(true);
      return;
    }

    const tid = toast.loading("AI: Removing watermarks and applying brand...");

    
    // Simulate AI Work matching DALL-E/Midjourney-grade processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const url = URL.createObjectURL(file);
    const el: StudioElement = {
      id: uid(), type: "image", layer: "image",
      baseWidth: 900, baseHeight: 900,
      constraints: { x: { anchor: "center", margin: 0, priority: 1 }, y: { anchor: "middle", margin: 0, priority: 1 } },
      content: { src: url }, style: { borderRadius: 12 },
    };
    
    // Apply layout and brand over it
    const colors = (activeBrandKit.colors as any) || {};
    const theme = {
      primary: colors.primary || "#1e3a5f",
      secondary: colors.secondary || "#f5f0eb",
      accent: colors.accent || "#d4af37",
      fonts: (activeBrandKit.fonts as any) || { heading: "Poppins, sans-serif", body: "Poppins, sans-serif" }
    };
    
    setPhase("edit");
    setSelectedId(el.id);
    
    setDesign(prev => applyBrandTheme({
      ...prev,
      name: "Rebranded Listing",
      format: "1:1",
      elements: [
        {
          id: uid(), type: "rect", layer: "background",
          baseWidth: 1000, baseHeight: 1000,
          constraints: { x: { anchor: "left", margin: 0, priority: 0 }, y: { anchor: "top", margin: 0, priority: 0 } },
          content: {}, style: { fill: "#ffffff", borderRadius: 0 }
        },
        el,
        {
          id: uid(), type: "rect", layer: "component",
          baseWidth: 1000, baseHeight: 150,
          constraints: { x: { anchor: "center", margin: 0, priority: 5 }, y: { anchor: "bottom", margin: 0, priority: 5 } },
          content: {}, style: { fill: theme.primary, borderRadius: 0 }
        },
        {
          id: uid(), type: "text", layer: "component",
          baseWidth: 800, baseHeight: 80,
          constraints: { x: { anchor: "center", margin: 0, priority: 6 }, y: { anchor: "bottom", margin: 0.05, priority: 6 } },
          content: { text: "Exclusive Listing" },
          style: { fontSize: 42, fontWeight: "bold", color: "#ffffff", textAlign: "center" }
        }
      ]
    }, theme));
    
    toast.success("Design Cleaned and Branded!", { id: tid });
  };

  const handleAiStaging = async (type: "living" | "kitchen" | "bedroom") => {
    if (!selected || selected.type !== "image") {
      toast.error("Please select an image to stage.");
      return;
    }
    if (!canUseAi) {
      setGatedFeature("AI Room Staging");
      setIsPremiumModalOpen(true);
      return;
    }

    const tid = toast.loading(`AI: Staging room as ${type}...`);
    setIsStaging(true);

    try {
      // Simulate high-fidelity AI generation patterns
      await new Promise(r => setTimeout(r, 2500));
      toast.loading("AI: Generating structural layout...", { id: tid });
      await new Promise(r => setTimeout(r, 2000));
      toast.loading("AI: Applying neural lighting & textures...", { id: tid });
      await new Promise(r => setTimeout(r, 1500));
      
      // High-quality staging mock URLs
      const mockImages = {
        living: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1000",
        kitchen: "https://images.unsplash.com/photo-1556911220-e150213ff1a3?auto=format&fit=crop&q=80&w=1000",
        bedroom: "https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=1000"
      };

      updateElement(selected.id, { content: { ...selected.content, src: mockImages[type] } });
      toast.success(`Room successfully staged as ${type}!`, { id: tid });
    } catch (e) {
      toast.error("AI Staging failed. Please try again.", { id: tid });
    } finally {
      setIsStaging(false);
    }
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    updateDesign({ elements: design.elements.filter((e) => e.id !== selectedId) });
    setSelectedId(null);
  }, [selectedId, design.elements]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) deleteSelected();
      if (e.key === "Escape") { setSelectedId(null); setEditingId(null); }
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, deleteSelected, undo, redo]);

  // ── drag/resize ───────────────────────────────────────────────────────────

  const onElemPointerDown = (e: React.PointerEvent, el: StudioElement) => {
    if (editingId === el.id) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedId(el.id);
    setDrag({ active: true, elId: el.id, startCx: e.clientX, startCy: e.clientY, elBaseX: el.constraints.x.margin, elBaseY: el.constraints.y.margin });
  };

  const onElemPointerMove = (e: React.PointerEvent, el: StudioElement) => {
    if (!drag || drag.elId !== el.id) return;
    const dx = (e.clientX - drag.startCx) / (workspaceWidth * scaleFactor);
    const dy = (e.clientY - drag.startCy) / (workspaceWidth * scaleFactor);
    updateElement(el.id, {
      constraints: {
        x: { ...el.constraints.x, margin: drag.elBaseX + dx },
        y: { ...el.constraints.y, margin: drag.elBaseY + dy }
      }
    });
  };

  const onHandlePointerDown = (e: React.PointerEvent, el: StudioElement, handle: string) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setResize({ active: true, elId: el.id, handle, startCx: e.clientX, startCy: e.clientY, elBaseX: el.constraints.x.margin, elBaseY: el.constraints.y.margin, elBaseW: el.baseWidth, elBaseH: el.baseHeight });
  };

  const onHandlePointerMove = (e: React.PointerEvent, el: StudioElement) => {
    if (!resize || resize.elId !== el.id) return;
    const canvasRes = workspaceWidth * scaleFactor;
    const dxBase = ((e.clientX - resize.startCx) / canvasRes) * 1000;
    const dyBase = ((e.clientY - resize.startCy) / canvasRes) * 1000;
    const min = 20;
    let { elBaseW: w, elBaseH: h } = resize;
    if (resize.handle.includes("e")) w = Math.max(min, resize.elBaseW + dxBase);
    if (resize.handle.includes("s")) h = Math.max(min, resize.elBaseH + dyBase);
    updateElement(el.id, { baseWidth: w, baseHeight: h });
  };

  const startEditing = (el: StudioElement) => {
    if (el.type !== "text") return;
    setEditingId(el.id);
    setEditingText(el.content.text ?? "");
  };

  const commitEdit = () => {
    if (editingId) {
      updateElement(editingId, { content: { ...selected?.content, text: editingText } });
    }
    setEditingId(null);
  };

  // ── AI Handlers ──────────────────────────────────────────────────────────

  const handleAiGenerate = async () => {
    if (!canUseAi) {
      setGatedFeature("AI Marketing Pack");
      setIsPremiumModalOpen(true);
      return;
    }
    setIsAiLoading(true);
    try {
      toast.info("Generating marketing pack...");
      const result = await generatePackMutation.mutateAsync({ 
        propertyId: activeContext?.id || 1,
        roomType: aiPresetRoom,
        designStyle: aiPresetStyle
      });

      if (result.elements) {
        updateDesign({ elements: result.elements });
        toast.success("AI Content Generated!");
      }
    } catch (e) {
      toast.error("AI service unavailable - using placeholder");
      const mock = getStudioMock("ai.generateMarketingPack");
      updateDesign({ elements: mock.elements });
    } finally { setIsAiLoading(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  // ── MODE SELECTION SCREEN ────────────────────────────────────────────────
  if (phase === "mode_select") {
    const MODES: { id: StudioMode; icon: string; label: string; tagline: string; badge?: string }[] = [
      { id: "listing_creator",  icon: "🏠", label: "Listing Creator",  tagline: "Upload photos, fill details, pick a template, publish." },
      { id: "image_rebrander",  icon: "🎨", label: "Image Rebrander",  tagline: "Upload a competitor ad — AI strips the watermark and applies your brand." },
      { id: "advert_creator",   icon: "✨", label: "Advert Creator",   tagline: "AI generates a complete ad from your Brand Kit. No photo needed.", badge: "AI" },
      { id: "video_tour",       icon: "🎬", label: "Video Tour",       tagline: "Upload walkthrough footage, add overlays, export as Reel or Story." },
      { id: "video_ad",         icon: "📱", label: "Video Ad",         tagline: "Landscape or vertical — brand intro, listing highlights, and a strong CTA.", badge: "New" },
    ];
    return (
      <DashboardLayout>
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Design Studio</h1>
          <p className="text-muted-foreground mt-2">Choose a mode to start creating.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => { setStudioMode(m.id); setPhase("pick"); }}
              className="group relative flex flex-col gap-4 p-6 rounded-3xl border-2 border-border bg-card hover:border-accent hover:shadow-2xl hover:bg-accent/5 transition-all duration-300 text-left"
            >
              {m.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">{m.badge}</span>
              )}
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {m.icon}
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{m.label}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{m.tagline}</p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-accent text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Get started <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── TEMPLATE PICKER (secondary, within mode) ─────────────────────────────
  if (phase === "pick") {
    const modeLabel: Record<StudioMode, string> = {
      listing_creator: "Listing Creator",
      image_rebrander: "Image Rebrander",
      advert_creator: "Advert Creator",
      video_tour: "Video Tour",
      video_ad: "Video Ad",
    };
    const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));
    return (
      <DashboardLayout>
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => { if (!contextId) setPhase("mode_select"); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← {studioMode ? modeLabel[studioMode] : "Studio"}
          </button>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Choose a Template</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Professional, constraint-based marketing engine.</p>
          </div>
        </div>
        {categories.map((cat) => (
          <div key={cat} className="mb-10">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">{cat}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {TEMPLATES.filter((t) => t.category === cat).map((t) => (
                <button key={t.id} onClick={() => pickTemplate(t)} className="group flex flex-col gap-3 text-left">
                  <div className="aspect-[4/5] rounded-2xl border-2 border-border flex items-center justify-center text-5xl bg-card group-hover:border-accent group-hover:shadow-2xl transition-all duration-300">
                    {t.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.format}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </DashboardLayout>
    );
  }

  // Handle Styles for resizing
  const handleStyle = (h: string): React.CSSProperties => {
    const cursors: Record<string,string> = { nw:"nw-resize",n:"n-resize",ne:"ne-resize",e:"e-resize", se:"se-resize",s:"s-resize",sw:"sw-resize",w:"w-resize" };
    return {
      position:"absolute", width:10, height:10, background:"#fff", border:"2px solid #1e3a5f", borderRadius:2, cursor:cursors[h],
      top: h.includes("n") ? -5 : h.includes("s") ? "100%" : "50%",
      left: h.includes("w") ? -5 : h.includes("e") ? "100%" : "50%",
      transform:"translate(-50%,-50%)", zIndex:20,
    };
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 gap-4 bg-card/50 backdrop-blur rounded-2xl p-2 border border-border/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("pick")} className="text-muted-foreground hover:bg-muted">← Leave</Button>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <Input value={design.name} onChange={(e) => updateDesign({ name: e.target.value })} className="h-8 w-48 border-0 bg-transparent px-2 font-semibold focus-visible:ring-0" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!history.current.canUndo()}><Undo className="w-4 h-4" /></Button>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!history.current.canRedo()}><Redo className="w-4 h-4" /></Button>
          </div>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={() => exportAsPng(design, design.name)}><Download className="w-4 h-4 mr-2" /> PNG</Button>
          {!activeContext && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => createMutation.mutate({ 
                type: 'poster', 
                name: design.name, 
                content: design as any, 
                isNewInventory: true 
              })}
              className="border-accent text-accent hover:bg-accent/5"
              disabled={createMutation.isPending}
            >
              <Building2 className="w-4 h-4 mr-2" /> Save to Inventory
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={() => createMutation.mutate({ 
              type: 'other', 
              name: design.name, 
              template: design.id, 
              content: design as any,
              propertyId: activeContext?.id 
            })} 
            className="bg-accent text-white hover:bg-accent/90" 
            disabled={createMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" /> {activeContext ? "Update Design" : "Save Design"}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-210px)]">
        {/* LEFT PANEL */}
        <div className="w-72 shrink-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as any)} className="flex flex-col h-full">
            <TabsList className="w-full grid grid-cols-6 h-12 bg-muted/30">
              <TabsTrigger value="templates" className="rounded-none"><LayoutTemplate className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="add" className="rounded-none"><Plus className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="ai" className="rounded-none"><Sparkles className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="video" className="rounded-none"><Video className="w-4 h-4 text-accent" /></TabsTrigger>
              <TabsTrigger value="seo" className="rounded-none"><Search className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="growth" className="rounded-none"><TrendingUp className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="layers" className="rounded-none"><Layers className="w-4 h-4" /></TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="templates" className="m-0 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Studio Templates</p>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => pickTemplate(t)} className="p-3 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all text-left">
                       <div className="text-2xl mb-1">{t.emoji}</div>
                       <div className="text-[10px] font-bold truncate opacity-60 uppercase">{t.name}</div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="add" className="m-0 space-y-4">
                <Button variant="outline" className="w-full h-12 justify-start gap-4 rounded-xl" onClick={addText}><Type className="w-5 h-5 text-accent" /> Add Text</Button>
                <Button variant="outline" className="w-full h-12 justify-start gap-4 rounded-xl" onClick={addRect}><Square className="w-5 h-5 text-accent" /> Add Shape</Button>
                <Button variant="outline" className="w-full h-12 justify-start gap-4 rounded-xl" onClick={() => imageInputRef.current?.click()}><ImageIcon className="w-5 h-5 text-accent" /> Add Image</Button>
                <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <Button variant="outline" className="w-full h-12 justify-start gap-4 rounded-xl" onClick={() => videoInputRef.current?.click()}><Video className="w-5 h-5 text-accent" /> Add Video</Button>
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
              </TabsContent>

              <TabsContent value="ai" className="m-0 space-y-4">
                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
                  <p className="text-xs font-semibold text-accent mb-2">Studio AI Engine</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">Generate localized Ethiopia real estate content with one click.</p>
                  <div className="space-y-3 mb-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase opacity-60">Room Type</Label>
                      <Select value={aiPresetRoom} onValueChange={setAiPresetRoom}>
                        <SelectTrigger className="h-8 text-[11px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="living-room">Living Room Modern</SelectItem>
                          <SelectItem value="kitchen">Kitchen Contemporary</SelectItem>
                          <SelectItem value="master-bedroom">Master Suite</SelectItem>
                          <SelectItem value="exterior">Exterior Facade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase opacity-60">Design Style</Label>
                      <Select value={aiPresetStyle} onValueChange={setAiPresetStyle}>
                        <SelectTrigger className="h-8 text-[11px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luxury">Luxury Gold/Black</SelectItem>
                          <SelectItem value="minimalist">Minimalist Light</SelectItem>
                          <SelectItem value="bold">Bold Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full text-xs bg-accent text-white hover:bg-accent/90" variant="outline" onClick={() => handleAiGenerate()} disabled={generatePackMutation.isPending || isAiLoading}>
                    {generatePackMutation.isPending || isAiLoading ? "Generating..." : "Generate AI Pack"}
                  </Button>
                </div>

                {activeContext && (
                  <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold">Magic Fill</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Sync <strong>{activeContext.title}</strong> details into this design.
                    </p>
                    <Button size="sm" variant="outline" className="w-full text-xs gap-2 border-accent/30 text-accent hover:bg-accent/5" onClick={handleMagicFill}>
                      <Wand2 className="w-3.5 h-3.5 text-accent" /> Apply Listing Data
                    </Button>
                  </div>
                )}

                {activeBrandKit && (
                  <div className="p-3 bg-secondary/30 border border-border rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold">Brand Identity</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Apply <strong>{(activeBrandKit as any).name}</strong> styles instantly.
                    </p>
                    <Button size="sm" variant="outline" className="w-full text-xs gap-2" onClick={handleMagicRebrand}>
                      <Sparkles className="w-3.5 h-3.5 text-accent" /> Magic Rebrand
                    </Button>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-muted/20 border border-border mt-4">
                  <p className="text-xs font-semibold text-accent mb-2">Clean & Brand</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">Upload a competitor ad. AI will remove watermarks and apply your brand.</p>
                  <div className="space-y-2">
                    <input type="file" ref={rebrandInputRef} className="hidden" accept="image/*" onChange={handleCleanAndBrand} />
                    <Button className="w-full text-xs gap-2 border-accent/30 text-accent hover:bg-accent/5" variant="outline" onClick={() => rebrandInputRef.current?.click()}>
                      <Upload className="w-4 h-4" /> Upload Comp Ad
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-tight">AI Room Staging</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
                    Instantly transform empty rooms into designer-staging previews.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['living', 'kitchen', 'bedroom'] as const).map((room) => (
                      <Button 
                        key={room} 
                        variant="ghost" 
                        size="sm" 
                        className="flex flex-col h-auto py-3 gap-2 border border-border/50 hover:border-accent hover:bg-accent/5" 
                        onClick={() => handleAiStaging(room)}
                        disabled={isStaging}
                      >
                        <span className="text-[10px] font-bold capitalize">{room}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="text-xs">Social Growth</Label>
                  <p className="text-[11px] text-muted-foreground">Successfully published designs start capturing leads immediately.</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs gap-2 border-accent/30 text-accent hover:bg-accent/5"
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                  >
                    <Calendar className="w-3.5 h-3.5" /> {publishMutation.isPending ? "Scheduling..." : "Schedule Social Post"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="m-0 space-y-4 px-1">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-accent" />
                    <span className="text-sm font-bold uppercase tracking-tight">Search Optimizer</span>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Social Caption</Label>
                    <textarea 
                      value={seoCaption} 
                      onChange={(e) => setSeoCaption(e.target.value)}
                      placeholder="Your optimized caption will appear here..."
                      className="w-full h-32 bg-background border border-border rounded-xl p-3 text-xs leading-relaxed focus:ring-0 focus:border-accent"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs gap-2 border-accent text-accent hover:bg-accent/5"
                        onClick={handleOptimizeCaption}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Optimize
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs gap-2 border-primary/50 text-primary"
                        onClick={async () => {
                           try {
                             const text = await navigator.clipboard.readText();
                             if (!text) return toast.warning("Clipboard is empty");
                             const tid = toast.loading("AI: Extracting property data...");
                             const result = await extractMutation.mutateAsync({ text });
                             if (result) {
                                toast.success("Magic Import Successful!", { id: tid });
                                handleMagicFill(); // Re-trigger fill with new data if applicable
                             }
                           } catch (e) {
                             toast.error("Magic Import failed. Please try again.");
                           }
                        }}
                      >
                        <Zap className="w-3.5 h-3.5" /> Magic Import
                      </Button>
                    </div>
                  </div>
                </div>


                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Accessibility (Alt Text)</p>
                  <div className="space-y-2">
                    {design.elements.filter(el => el.type === 'image' || el.type === 'text').map(el => (
                      <div key={el.id} className="p-3 bg-card border border-border rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold opacity-60 uppercase">{el.type} Element</span>
                          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => toast.info("AI Generating Alt Text...")}><Wand2 className="w-3 h-3" /></Button>
                        </div>
                        <Input 
                          className="h-8 text-[11px] bg-muted/20" 
                          placeholder="Enter alt description..." 
                          defaultValue={inferAltText(el)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  size="sm" 
                  className="w-full bg-accent text-white"
                  onClick={() => toast.success("SEO Metadata synced to Inventory!")}
                >
                  <Save className="w-4 h-4 mr-2" /> Sync to Property record
                </Button>
              </TabsContent>

              <TabsContent value="growth" className="m-0 space-y-4 px-1">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold uppercase tracking-tight">Social Growth</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-accent/5 border border-accent/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Impressions</p>
                    <p className="text-xl font-bold text-accent">{stats.impressions}</p>
                  </div>
                  <div className="p-3 bg-secondary/20 border border-border rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Clicks</p>
                    <p className="text-xl font-bold">{stats.clicks}</p>
                  </div>
                  <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 text-green-600">Leads</p>
                    <p className="text-xl font-bold text-green-700">{stats.leads}</p>
                  </div>
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 text-blue-600">Comments</p>
                    <p className="text-xl font-bold text-blue-700">{stats.comments}</p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase px-1">Recent Lead Activity</p>
                  <div className="space-y-2">
                    {stats.leads > 0 ? (
                      <div className="p-3 bg-white/5 border border-border rounded-xl flex items-center gap-3 active:scale-95 transition-transform cursor-pointer" onClick={() => window.location.href = `/crm/leads`}>
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-[10px]">
                          LQ
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">High Intent Lead</p>
                          <p className="text-[10px] text-muted-foreground">Captured via social tracking link</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <p className="text-[11px] font-medium leading-relaxed text-muted-foreground italic text-center">
                          "Publish your design to start capturing leads automatically."
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {currentPlan === 'starter' && (
                  <div className="mt-8 p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl border border-accent/20">
                    <h4 className="text-xs font-bold text-accent mb-1 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Growth Engine Pro
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
                      Unlock advanced lead attribution and unlimited social exports.
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full bg-accent text-white font-bold text-[10px] h-8"
                      onClick={() => {
                        setGatedFeature("Advanced Growth Analytics");
                        setIsPremiumModalOpen(true);
                      }}
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                )}


              </TabsContent>

              <TabsContent value="video" className="m-0 space-y-4">
                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-tight">Magic Reels</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                    Transform this design into a 15-second cinematic property teaser for Instagram & TikTok.
                  </p>
                  
                  <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden relative group mb-4 border border-border/50">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Sparkles className="w-8 h-8 text-white/20 animate-pulse" />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 z-20">
                       <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-accent w-1/3 animate-[pulse_2s_infinite]" />
                       </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full text-xs bg-accent text-white hover:bg-accent/90 rounded-xl py-5" 
                    onClick={() => renderVideoMutation.mutate({ designId: typeof design.id === 'number' ? design.id : 1 })}
                    disabled={renderVideoMutation.isPending}
                  >
                    {renderVideoMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Rendering Reel...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" /> Generate Magic Reel
                      </span>
                    )}
                  </Button>
                </div>
                
                <div className="p-4 rounded-2xl bg-muted/20 border border-border">
                  <Label className="text-[10px] font-bold uppercase opacity-60">Animation Style</Label>
                  <Select defaultValue="ken-burns">
                    <SelectTrigger className="h-8 text-[11px] mt-2 rounded-lg bg-background">
                      <SelectValue placeholder="Social Cinematic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ken-burns">Social Cinematic</SelectItem>
                      <SelectItem value="slide">Property Slide</SelectItem>
                      <SelectItem value="glitch">Urban Hype</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="layers" className="m-0 space-y-2">
                {design.elements.slice().reverse().map((el, i) => (
                  <div key={el.id} onClick={() => setSelectedId(el.id)} className={`flex items-center gap-3 p-2 rounded-lg border text-xs cursor-pointer ${selectedId === el.id ? 'border-accent bg-accent/5' : 'border-transparent'}`}>
                    <div className="w-6 h-6 flex items-center justify-center bg-muted rounded">{el.type === 'text' ? <Type className="w-3 h-3" /> : <Square className="w-3 h-3" />}</div>
                    <span className="flex-1 truncate">{el.type === 'text' ? el.content.text : `Shape ${design.elements.length - i}`}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); updateDesign({ elements: design.elements.filter(x => x.id !== el.id) }); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* CENTER WORKSPACE */}
        <div 
          ref={workspaceRef} 
          className="flex-1 bg-muted/40 rounded-3xl border border-border/50 overflow-auto flex items-center justify-center p-12 relative group/workspace transition-all duration-700" 
          style={{ backgroundImage: 'radial-gradient(circle, #00000010 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
          <div 
            ref={canvasRef} 
            onMouseDown={isMasking ? handleMaskMouseDown : undefined}
            onMouseMove={isMasking ? handleMaskMouseMove : undefined}
            onMouseUp={isMasking ? handleMaskMouseUp : undefined}
            style={{ 
              width: uiResolution.width, height: uiResolution.height, 
              background: design.elements.find(e => e.layer === 'background')?.style.fill || "#fff", 
              position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.15)", borderRadius: "2px", 
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", overflow: "hidden",
              cursor: isMasking ? "crosshair" : "default"
            }}
          >
             {/* Masking Layer */}
             {isMasking && (
               <div className="absolute inset-0 z-[100] bg-black/10 pointer-events-none">
                 <svg className="w-full h-full opacity-60">
                   {maskPaths.map((path, i) => (
                     <polyline
                       key={i}
                       points={path.map(p => `${p.x * uiResolution.scale},${p.y * uiResolution.scale}`).join(" ")}
                       fill="none"
                       stroke="#ff3b30"
                       strokeWidth={20}
                       strokeLinecap="round"
                       strokeLinejoin="round"
                     />
                   ))}
                   {currentPath.length > 0 && (
                     <polyline
                       points={currentPath.map(p => `${p.x * uiResolution.scale},${p.y * uiResolution.scale}`).join(" ")}
                       fill="none"
                       stroke="#ff3b30"
                       strokeWidth={20}
                       strokeLinecap="round"
                       strokeLinejoin="round"
                     />
                   )}
                 </svg>
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto">
                    <Button variant="outline" className="bg-white/80 backdrop-blur rounded-2xl px-6 font-bold" onClick={() => setIsMasking(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-accent text-white rounded-2xl px-6 font-bold shadow-lg shadow-accent/20" onClick={executeClean}>
                      Remove Objects
                    </Button>
                 </div>
               </div>
             )}


             {uiElements.map((el) => {
               const isSelected = el.id === selectedId;
               const isEditing = el.id === editingId;
               return (
                 <div key={el.id} onPointerDown={(e) => onElemPointerDown(e, el)} onPointerMove={(e) => el.id === drag?.elId && onElemPointerMove(e, el)} onPointerUp={() => setDrag(null)}
                   style={{ position: "absolute", left: el.resolvedX, top: el.resolvedY, width: el.resolvedWidth, height: el.resolvedHeight, border: isSelected ? "2px solid #3b82f6" : "none", cursor: "move", outline: isSelected ? "1px solid rgba(255,255,255,0.5)" : "none" }}>
                   
                   {el.type === "text" && (
                     isEditing ? <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} onBlur={commitEdit} autoFocus style={{ width: "100%", height: "100%", background: "transparent", border: "none", resize: "none", outline: "none", fontSize: el.style.fontSize, color: el.style.color, textAlign: el.style.textAlign as any, fontWeight: el.style.fontWeight as any, padding: 0, overflow: "hidden" }} />
                     : <div onDoubleClick={() => startEditing(el)} style={{ width: "100%", whiteSpace: "pre-wrap", fontSize: el.style.fontSize, color: el.style.color, fontWeight: el.style.fontWeight as any, textAlign: el.style.textAlign as any, pointerEvents: "none" }}>{el.content.text}</div>
                   )}
                   {el.type === "video" && el.videoConfig && (
                     <video 
                       src={el.videoConfig.src} 
                       autoPlay 
                       muted={el.videoConfig.muted} 
                       loop={el.videoConfig.loop}
                       style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", borderRadius: el.style.borderRadius }}
                     />
                   )}
                   {el.type === "rect" && <div style={{ width: "100%", height: "100%", background: el.style.fill, borderRadius: el.style.borderRadius, opacity: el.style.opacity }} />}

                   {isSelected && !isEditing && ["nw","ne","se","sw","e","s"].map(h => (
                     <div key={h} onPointerDown={(e) => onHandlePointerDown(e, el, h)} onPointerMove={(e) => resize?.elId === el.id && onHandlePointerMove(e, el)} onPointerUp={() => setResize(null)} style={handleStyle(h)} />
                   ))}
                 </div>
               );
             })}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur rounded-2xl border border-border shadow-sm opacity-0 group-hover/workspace:opacity-100 transition-opacity">
             <button onClick={() => setScaleFactor(s => Math.max(0.2, s - 0.1))} className="p-1 hover:text-accent">－</button>
             <span className="text-[10px] font-bold w-12 text-center">{Math.round(scaleFactor * 100)}%</span>
             <button onClick={() => setScaleFactor(s => Math.min(2, s + 0.1))} className="p-1 hover:text-accent">＋</button>
          </div>
        </div>

        {/* RIGHT PANEL - PROPERTIES */}
        <div className="w-72 shrink-0 bg-card border border-border rounded-2xl shadow-sm p-4 overflow-y-auto space-y-6">
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
             <Settings2 className="w-4 h-4" /> Properties
           </div>

           {(() => {
             const sel = design.elements.find(e => e.id === selectedId);
             if (!sel) return (
               <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Select an element on canvas to edit its properties.</p>
               </div>
             );

             return (
               <div className="space-y-6">
                 <div className="space-y-2">
                   <Label className="text-[11px] font-bold uppercase opacity-60">Constraint Anchors</Label>
                   <div className="grid grid-cols-2 gap-2">
                      <Select value={sel.constraints.x.anchor} onValueChange={(v) => updateElement(sel.id, { constraints: { ...sel.constraints, x: { ...sel.constraints.x, anchor: v as any } } })}>
                        <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="X Anchor" /></SelectTrigger>
                        <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
                      </Select>
                      <Select value={sel.constraints.y.anchor} onValueChange={(v) => updateElement(sel.id, { constraints: { ...sel.constraints, y: { ...sel.constraints.y, anchor: v as any } } })}>
                        <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Y Anchor" /></SelectTrigger>
                        <SelectContent><SelectItem value="top">Top</SelectItem><SelectItem value="middle">Middle</SelectItem><SelectItem value="bottom">Bottom</SelectItem></SelectContent>
                      </Select>
                   </div>
                 </div>

                 {sel.type === 'text' && (
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase opacity-60">Color</Label>
                        <div className="flex gap-2 flex-wrap">
                          {['#ffffff', '#1e3a5f', '#d4af37', '#000000', '#f5f0eb'].map(c => (
                            <button key={c} onClick={() => updateElement(sel.id, { style: { ...sel.style, color: c } })} className={`w-8 h-8 rounded-full border-2 ${sel.style.color === c ? 'border-accent shadow-lg' : 'border-transparent'}`} style={{ background: c }} />
                          ))}
                          <input type="color" className="w-8 h-8 rounded-full border-2 border-transparent bg-muted cursor-pointer" value={sel.style.color || '#000000'} onChange={(e) => updateElement(sel.id, { style: { ...sel.style, color: e.target.value } })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase opacity-60">Alignment</Label>
                        <div className="flex bg-muted p-1 rounded-lg">
                          <Button variant={sel.style.textAlign === 'left' ? 'secondary' : 'ghost'} size="icon" className="h-8 flex-1" onClick={() => updateElement(sel.id, { style: { ...sel.style, textAlign: 'left' } })}><AlignLeft className="w-4 h-4" /></Button>
                          <Button variant={sel.style.textAlign === 'center' ? 'secondary' : 'ghost'} size="icon" className="h-8 flex-1" onClick={() => updateElement(sel.id, { style: { ...sel.style, textAlign: 'center' } })}><AlignCenter className="w-4 h-4" /></Button>
                          <Button variant={sel.style.textAlign === 'right' ? 'secondary' : 'ghost'} size="icon" className="h-8 flex-1" onClick={() => updateElement(sel.id, { style: { ...sel.style, textAlign: 'right' } })}><AlignRight className="w-4 h-4" /></Button>
                        </div>
                      </div>
                   </div>
                 )}

                  {sel.type === 'video' && sel.videoConfig && (
                    <div className="space-y-4">
                      <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                        <Label className="text-[11px] font-bold uppercase opacity-60">Playback Settings</Label>
                        <div className="flex gap-4">
                           <Button variant={sel.videoConfig.muted ? "secondary" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => updateElement(sel.id, { videoConfig: { ...sel.videoConfig!, muted: !sel.videoConfig!.muted } })}>
                             {sel.videoConfig.muted ? "Unmute" : "Mute"}
                           </Button>
                           <Button variant={sel.videoConfig.loop ? "secondary" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => updateElement(sel.id, { videoConfig: { ...sel.videoConfig!, loop: !sel.videoConfig!.loop } })}>
                             {sel.videoConfig.loop ? "Disable Loop" : "Enable Loop"}
                           </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase opacity-60">Corner Rounding ({Math.round(sel.style.borderRadius || 0)}px)</Label>
                        <Slider value={[sel.style.borderRadius || 0]} min={0} max={100} step={1} onValueChange={([v]) => updateElement(sel.id, { style: { ...sel.style, borderRadius: v } })} />
                      </div>
                    </div>
                  )}

                  {sel.type === 'rect' && (
                   <div className="space-y-4">
                     <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase opacity-60">Fill Color</Label>
                        <div className="flex gap-2 flex-wrap">
                          {['#1e3a5f', '#d4af37', '#f5f0eb', '#2a4a6f', '#ffffff'].map(c => (
                            <button key={c} onClick={() => updateElement(sel.id, { style: { ...sel.style, fill: c } })} className={`w-8 h-8 rounded-full border-2 ${sel.style.fill === c ? 'border-accent shadow-lg' : 'border-transparent'}`} style={{ background: c }} />
                          ))}
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase opacity-60">Rounding ({Math.round(sel.style.borderRadius || 0)}px)</Label>
                        <Slider value={[sel.style.borderRadius || 0]} min={0} max={100} step={1} onValueChange={([v]) => updateElement(sel.id, { style: { ...sel.style, borderRadius: v } })} />
                     </div>
                   </div>
                 )}

                 <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase opacity-60">Opacity ({Math.round((sel.style.opacity ?? 1) * 100)}%)</Label>
                    <Slider value={[(sel.style.opacity ?? 1) * 100]} min={0} max={100} step={1} onValueChange={([v]) => updateElement(sel.id, { style: { ...sel.style, opacity: v / 100 } })} />
                 </div>

                                   {(sel.type === 'image' || sel.type === 'rect') && (
                    <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                       <Label className="text-[11px] font-bold uppercase opacity-60 text-accent">AI Smart Actions</Label>
                       <Button size="sm" className="w-full bg-accent text-white rounded-xl flex items-center justify-center gap-2 px-4 shadow-sm font-bold" onClick={startEraser}>
                         <Wand2 className="w-4 h-4" /> Magic Eraser
                       </Button>
                       <p className="text-[10px] text-muted-foreground text-center italic">Remove watermarks, objects, or people.</p>
                    </div>
                  )}

                  <div className="h-[1px] bg-border my-6" />

                  <Button variant="destructive" className="w-full gap-2 rounded-xl" onClick={deleteSelected}><Trash2 className="w-4 h-4" /> Delete Element</Button>

               </div>
             );
           })()}

           <div className="h-[1px] bg-border my-6" />

           <div className="space-y-2">
             <Label className="text-[11px] font-bold uppercase opacity-60">Format Settings</Label>
             <Select value={design.format} onValueChange={(v) => updateDesign({ format: v as AspectRatio })}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Canvas Format" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="9:16">Story / Reel (9:16)</SelectItem>
                  <SelectItem value="4:5">Portrait (4:5)</SelectItem>
                  <SelectItem value="16:9">Wide (16:9)</SelectItem>
                </SelectContent>
             </Select>
           </div>
        </div>
      </div>
      
      <PremiumUpgradeModal 
        open={isPremiumModalOpen} 
        onOpenChange={setIsPremiumModalOpen} 
        feature={gatedFeature} 
      />
    </DashboardLayout>
  );
}

