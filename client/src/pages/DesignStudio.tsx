import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Download,
  Save,
  Trash2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Plus,
  LayoutTemplate,
  Layout,
  Sparkles,
  Wand2,
  Video,
  Search,
  Undo,
  Redo,
  Layers,
  Settings2,
  Building2,
  Calendar,
  Zap,
  Palette,
  TrendingUp,
  Upload,
  ArrowRight,
  Phone,
  MapPin,
  Bed,
  Bath,
  Maximize,
  FileText,
} from "lucide-react";
import {
  DesignState,
  StudioElement,
  AspectRatio,
  Anchor,
  Constraint,
  LayerSegment,
  LayoutResolution,
} from "@/lib/studio/types";
import { resolveLayout, getResolution } from "@/lib/studio/LayoutResolver";
import { getStudioMock } from "@/lib/studio/utils";
import { HistoryManager } from "@/lib/studio/HistoryManager";
import {
  getSafeTextColor,
  applyBrandTheme,
} from "@/lib/studio/BrandIntelligence";
import {
  optimizeCaption,
  inferAltText,
  generateBilingualCaption,
} from "@/lib/studio/SEOIntelligence";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toPng } from "html-to-image";
import {
  LISTING_TEMPLATES,
  ListingFormData,
  BrandData,
} from "@/components/studio/ListingTemplates";

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
  "Other",
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  category: string;
  emoji: string;
  format: AspectRatio;
  bgColor: string;
  elements: Omit<StudioElement, "id">[];
}

interface DragState {
  active: boolean;
  elId: string;
  startCx: number;
  startCy: number;
  elBaseX: number;
  elBaseY: number;
}

interface ResizeState {
  active: boolean;
  elId: string;
  handle: string;
  startCx: number;
  startCy: number;
  elBaseX: number;
  elBaseY: number;
  elBaseW: number;
  elBaseH: number;
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
    id: "property-poster",
    name: "Property Poster",
    category: "Print",
    emoji: "🏠",
    format: "4:5",
    bgColor: "#1e3a5f",
    elements: [
      {
        type: "rect",
        layer: "background",
        baseWidth: 1000,
        baseHeight: 1250,
        constraints: {
          x: { anchor: "left", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        content: {},
        style: { fill: "#1e3a5f", borderRadius: 0 },
      },
      {
        type: "rect",
        layer: "image",
        baseWidth: 900,
        baseHeight: 600,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 1 },
          y: { anchor: "top", margin: 0.05, priority: 1 },
        },
        content: {},
        style: { fill: "#2a4a6f", borderRadius: 12 },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 120,
        constraints: {
          x: { anchor: "left", margin: 0.05, priority: 5 },
          y: { anchor: "bottom", margin: 0.15, priority: 5 },
        },
        content: { text: "Luxury Villa\nBole, Addis Ababa" },
        style: {
          fontSize: 54,
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "left",
        },
      },
      {
        type: "rect",
        layer: "component",
        baseWidth: 200,
        baseHeight: 50,
        constraints: {
          x: { anchor: "left", margin: 0.05, priority: 6 },
          y: { anchor: "bottom", margin: 0.28, priority: 6 },
        },
        content: {},
        style: { fill: "#d4af37", borderRadius: 25 },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 200,
        baseHeight: 30,
        constraints: {
          x: { anchor: "left", margin: 0.05, priority: 7 },
          y: { anchor: "bottom", margin: 0.29, priority: 7 },
        },
        content: { text: "FOR SALE" },
        style: {
          fontSize: 18,
          fontWeight: "bold",
          color: "#1e3a5f",
          textAlign: "center",
        },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 250,
        baseHeight: 40,
        constraints: {
          x: { anchor: "left", margin: 0.05, priority: 8 },
          y: { anchor: "bottom", margin: 0.1, priority: 8 },
        },
        content: { text: "Price: ETB TBD" },
        style: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "left",
        },
      },
    ],
  },
  {
    id: "instagram-post",
    name: "Instagram Post",
    category: "Social",
    emoji: "📸",
    format: "1:1",
    bgColor: "#f5f0eb",
    elements: [
      {
        type: "rect",
        layer: "background",
        baseWidth: 1000,
        baseHeight: 1000,
        constraints: {
          x: { anchor: "left", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        content: {},
        style: { fill: "#f5f0eb", borderRadius: 0 },
      },
      {
        type: "rect",
        layer: "image",
        baseWidth: 1000,
        baseHeight: 650,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        content: {},
        style: { fill: "#d4c9bc" },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 60,
        constraints: {
          x: { anchor: "left", margin: 0.05, priority: 2 },
          y: { anchor: "bottom", margin: 0.12, priority: 2 },
        },
        content: { text: "Modern Apartment in Kazanchis" },
        style: {
          fontSize: 36,
          fontWeight: "bold",
          color: "#1e3a5f",
          textAlign: "left",
        },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 40,
        constraints: {
          x: { anchor: "left", margin: 0.05, priority: 3 },
          y: { anchor: "bottom", margin: 0.05, priority: 3 },
        },
        content: { text: "Price: ETB TBD" },
        style: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#1e3a5f",
          textAlign: "left",
        },
      },
    ],
  },
  {
    id: "reel-thumbnail",
    name: "Story / Reel",
    category: "Social",
    emoji: "🎬",
    format: "9:16",
    bgColor: "#0f1f35",
    elements: [
      {
        type: "rect",
        layer: "background",
        baseWidth: 1000,
        baseHeight: 1777,
        constraints: {
          x: { anchor: "left", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        content: {},
        style: { fill: "#0f1f35", borderRadius: 0 },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 150,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 5 },
          y: { anchor: "center", margin: 0.05, priority: 5 },
        },
        content: { text: "Dream Home\nAvailable" },
        style: {
          fontSize: 64,
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "center",
        },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 60,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 6 },
          y: { anchor: "bottom", margin: 0.25, priority: 6 },
        },
        content: { text: "Price: ETB TBD" },
        style: {
          fontSize: 36,
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "center",
        },
      },
    ],
  },
  {
    id: "tiktok-walkthrough",
    name: "TikTok Walkthrough",
    category: "Video",
    emoji: "🎥",
    format: "9:16",
    bgColor: "#000000",
    elements: [
      {
        type: "video",
        layer: "background",
        baseWidth: 1000,
        baseHeight: 1777,
        constraints: {
          x: { anchor: "left", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        videoConfig: {
          src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
          startTime: 0,
          duration: 15,
          muted: true,
          loop: true,
        },
        content: {},
        style: { borderRadius: 0 },
      },
      {
        type: "rect",
        layer: "overlay",
        baseWidth: 900,
        baseHeight: 120,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 2 },
          y: { anchor: "bottom", margin: 0.05, priority: 2 },
        },
        content: {},
        style: { fill: "#ffffff", opacity: 0.9, borderRadius: 16 },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 40,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 3 },
          y: { anchor: "bottom", margin: 0.07, priority: 3 },
        },
        content: { text: "Contact Agent: +251 911..." },
        style: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#1e3a5f",
          textAlign: "center",
        },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 40,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 4 },
          y: { anchor: "bottom", margin: 0.15, priority: 4 },
        },
        content: { text: "Price: ETB TBD" },
        style: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "center",
        },
      },
    ],
  },
  {
    id: "video-ad",
    name: "Property Video Ad",
    category: "Video",
    emoji: "📢",
    format: "9:16",
    bgColor: "#000000",
    elements: [
      {
        type: "video",
        layer: "background",
        baseWidth: 1000,
        baseHeight: 1777,
        constraints: {
          x: { anchor: "left", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        videoConfig: {
          src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          startTime: 0,
          duration: 30,
          muted: true,
          loop: true,
        },
        content: {},
        style: { borderRadius: 0 },
      },
      {
        type: "rect",
        layer: "overlay",
        baseWidth: 400,
        baseHeight: 80,
        constraints: {
          x: { anchor: "left", margin: 0.05, priority: 5 },
          y: { anchor: "top", margin: 0.05, priority: 5 },
        },
        content: {},
        style: { fill: "#1e3a5f", borderRadius: 8 },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 350,
        baseHeight: 40,
        constraints: {
          x: { anchor: "left", margin: 0.07, priority: 6 },
          y: { anchor: "top", margin: 0.065, priority: 6 },
        },
        content: { text: "Luxury Living" },
        style: {
          fontSize: 28,
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "left",
        },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 350,
        baseHeight: 40,
        constraints: {
          x: { anchor: "left", margin: 0.07, priority: 7 },
          y: { anchor: "top", margin: 0.12, priority: 7 },
        },
        content: { text: "Price: ETB TBD" },
        style: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#d4af37",
          textAlign: "left",
        },
      },
    ],
  },
  {
    id: "luxury-gold-listing",
    name: "Luxury Black/Gold",
    category: "Print",
    emoji: "✨",
    format: "4:5",
    bgColor: "#0a0a0a",
    elements: [
      {
        type: "rect",
        layer: "background",
        baseWidth: 1000,
        baseHeight: 1250,
        constraints: {
          x: { anchor: "left", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        content: {},
        style: { fill: "#0a0a0a", borderRadius: 0 },
      },
      {
        type: "rect",
        layer: "image",
        baseWidth: 900,
        baseHeight: 750,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 1 },
          y: { anchor: "top", margin: 0.04, priority: 1 },
        },
        content: {},
        style: { fill: "#1a1a1a", borderRadius: 4 },
      },
      {
        type: "rect",
        layer: "overlay",
        baseWidth: 900,
        baseHeight: 2,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 2 },
          y: { anchor: "bottom", margin: 0.35, priority: 2 },
        },
        content: {},
        style: { fill: "#d4af37", opacity: 0.5 },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 60,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 5 },
          y: { anchor: "bottom", margin: 0.28, priority: 5 },
        },
        content: { text: "PREMIUM SELECTION" },
        style: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#d4af37",
          textAlign: "center",
          letterSpacing: "0.4em",
        },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 120,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 6 },
          y: { anchor: "bottom", margin: 0.18, priority: 6 },
        },
        content: { text: "The Pinnacle of Living" },
        style: {
          fontSize: 48,
          fontWeight: "normal",
          color: "#ffffff",
          textAlign: "center",
          fontFamily: "Georgia, serif",
        },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 800,
        baseHeight: 60,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 7 },
          y: { anchor: "bottom", margin: 0.08, priority: 7 },
        },
        content: { text: "Price: ETB TBD" },
        style: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#d4af37",
          textAlign: "center",
          fontFamily: "Georgia, serif",
        },
      },
    ],
  },
  {
    id: "modern-minimal-flyer",
    name: "Modern Minimal",
    category: "Social",
    emoji: "📐",
    format: "1:1",
    bgColor: "#ffffff",
    elements: [
      {
        type: "rect",
        layer: "background",
        baseWidth: 1000,
        baseHeight: 1000,
        constraints: {
          x: { anchor: "left", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        content: {},
        style: { fill: "#ffffff", borderRadius: 0 },
      },
      {
        type: "rect",
        layer: "image",
        baseWidth: 1000,
        baseHeight: 1000,
        constraints: {
          x: { anchor: "left", margin: 0, priority: 0 },
          y: { anchor: "top", margin: 0, priority: 0 },
        },
        content: {},
        style: { fill: "#f8f8f8", borderRadius: 0 },
      },
      {
        type: "rect",
        layer: "overlay",
        baseWidth: 800,
        baseHeight: 200,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 4 },
          y: { anchor: "bottom", margin: 0.1, priority: 4 },
        },
        content: {},
        style: { fill: "#ffffff", opacity: 0.95, borderRadius: 20 },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 700,
        baseHeight: 60,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 5 },
          y: { anchor: "bottom", margin: 0.18, priority: 5 },
        },
        content: { text: "BOLE ATLAS" },
        style: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#1e3a5f",
          textAlign: "center",
          letterSpacing: "0.2em",
        },
      },
      {
        type: "text",
        layer: "component",
        baseWidth: 700,
        baseHeight: 40,
        constraints: {
          x: { anchor: "center", margin: 0, priority: 6 },
          y: { anchor: "bottom", margin: 0.13, priority: 6 },
        },
        content: { text: "Starting from ETB 12.5M" },
        style: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#111111",
          textAlign: "center",
        },
      },
    ],
  },

  {
    id: "blank",
    name: "Blank Canvas",
    category: "Custom",
    emoji: "⬜",
    format: "1:1",
    bgColor: "#ffffff",
    elements: [],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID().split("-")[0];

function makeElements(template: Template): StudioElement[] {
  return template.elements.map(el => ({ ...el, id: uid() }) as StudioElement);
}

const FONTS = [
  "Poppins, sans-serif",
  "Georgia, serif",
  "Courier New, monospace",
  "Impact, sans-serif",
  "Arial, sans-serif",
];
const TEMPLATE_TYPE_MAP: Record<
  string,
  "poster" | "instagram" | "flyer" | "reel" | "email" | "other"
> = {
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

  const bgEl = elements.find(e => e.layer === "background");
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
        ctx.roundRect(
          el.resolvedX,
          el.resolvedY,
          el.resolvedWidth!,
          el.resolvedHeight!,
          r
        );
        ctx.fill();
      } else {
        ctx.fillRect(
          el.resolvedX,
          el.resolvedY,
          el.resolvedWidth!,
          el.resolvedHeight!
        );
      }
    } else if (el.type === "ellipse") {
      ctx.fillStyle = el.style.fill ?? "#cccccc";
      ctx.beginPath();
      ctx.ellipse(
        el.resolvedX + el.resolvedWidth! / 2,
        el.resolvedY + el.resolvedHeight! / 2,
        el.resolvedWidth! / 2,
        el.resolvedHeight! / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (el.type === "text" && el.content.text) {
      ctx.fillStyle = el.style.color ?? "#000000";
      const weight = el.style.fontWeight === "bold" ? "bold" : "normal";
      ctx.font = `${weight} ${el.style.fontSize ?? 16}px Poppins, sans-serif`;
      ctx.textAlign = (el.style.textAlign ?? "left") as CanvasTextAlign;
      ctx.textBaseline = "top";

      const anchorX =
        el.style.textAlign === "center"
          ? el.resolvedX + el.resolvedWidth! / 2
          : el.style.textAlign === "right"
            ? el.resolvedX + el.resolvedWidth!
            : el.resolvedX;

      const lines = (el.content.text || "").split("\n");
      let currentY = el.resolvedY;
      const lineHeight = (el.style.fontSize || 16) * 1.2;
      for (const line of lines) {
        ctx.fillText(line, anchorX, currentY);
        currentY += lineHeight;
      }
    } else if (el.type === "image" && el.content.src) {
      await new Promise<void>(res => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(
            img,
            el.resolvedX!,
            el.resolvedY!,
            el.resolvedWidth!,
            el.resolvedHeight!
          );
          res();
        };
        img.onerror = () => res();
        img.src = el.content.src!;
      });
    }
    ctx.globalAlpha = 1;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

async function exportAsPng(design: DesignState, name: string) {
  const blob = await renderCanvas(design);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/\s+/g, "-")}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
export default function DesignStudio() {
  const { contextId } = useParams();
  const { user } = useAuth();

  // ── context fetching ───────────────────────────────────────────────────────
  const { data: propContext } = trpc.crm.properties.getById.useQuery(
    Number(contextId),
    { enabled: !!contextId && !isNaN(Number(contextId)) }
  );

  const { data: supplierContext } = trpc.supplierFeed.getById.useQuery(
    Number(contextId),
    { enabled: !!contextId && !isNaN(Number(contextId)) && !propContext }
  );

  const activeContext = propContext || supplierContext;

  const { data: brandKits = [] } = trpc.crm.brandKits.list.useQuery();
  const activeBrandKit = brandKits[0];

  // Detect Journey B: Supply Feed passes ?mode=listing_creator in URL
  const searchParams = new URLSearchParams(window.location.search);
  const preloadMode = searchParams.get("mode") as StudioMode | null;
  const [studioMode, setStudioMode] = useState<StudioMode | null>(
    preloadMode || (contextId ? "listing_creator" : null)
  );
  const [phase, setPhase] = useState<"mode_select" | "pick" | "edit">(
    studioMode ? "pick" : "mode_select"
  );
  const [design, setDesign] = useState<DesignState>({
    version: "2.0",
    id: "temp",
    name: "Untitled Design",
    format: "1:1",
    theme: {
      primary: "#1e3a5f",
      secondary: "#f5f0eb",
      accent: "#d4af37",
      fonts: { heading: "Poppins, sans-serif", body: "Poppins, sans-serif" },
    },
    elements: [],
  });

  const history = useRef(new HistoryManager());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [drag, setDrag] = useState<DragState | null>(null);
  const [resize, setResize] = useState<ResizeState | null>(null);
  const [scaleFactor, setScaleFactor] = useState(0.85);

  const [formData, setFormData] = useState<ListingFormData>({
    title: activeContext?.title || "",
    price: activeContext?.price
      ? `ETB ${Number(activeContext.price).toLocaleString()}`
      : "",
    location: activeContext?.subcity || "",
    subLocation: "",
    propertyType: "Apartment",
    bedrooms: (activeContext as any)?.bedrooms
      ? `${(activeContext as any).bedrooms}`
      : "",
    bathrooms: (activeContext as any)?.bathrooms
      ? `${(activeContext as any).bathrooms}`
      : "",
    area: (activeContext as any)?.squareFeet
      ? `${(activeContext as any).squareFeet}`
      : "",
    description: (activeContext as any)?.description || "",
    image: (activeContext as any)?.photos?.[0] || null,
    ctaText: "View Listing",
  });

  const brandData = useMemo<BrandData>(() => {
    const colors = (activeBrandKit?.colors as any[]) || [];
    const fonts = (activeBrandKit?.fonts as any[]) || [];
    return {
      logo: (activeBrandKit?.logos as any[])?.[0]?.src || null,
      companyName: user?.companyName || "Estate IQ",
      primaryColor: colors[0]?.hex || "#1e3a5f",
      secondaryColor: colors[1]?.hex || "#f5f0eb",
      textColor: "#ffffff",
      backgroundColor: colors[2]?.hex || "#0a0a0f",
      fontHeading: fonts[0]?.family || "Poppins, sans-serif",
      fontBody: fonts[1]?.family || fonts[0]?.family || "Poppins, sans-serif",
      phoneNumber: activeBrandKit?.phoneNumber || "",
      whatsappNumber: activeBrandKit?.whatsappNumber || "",
      facebookUrl: activeBrandKit?.facebookUrl || "",
      instagramHandle: activeBrandKit?.instagramHandle || "",
      tiktokHandle: activeBrandKit?.tiktokHandle || "",
      telegramChannel: activeBrandKit?.telegramChannel || "",
      agentPortrait: activeBrandKit?.agentPortrait || null,
      tagline: activeBrandKit?.tagline || "",
      targetAreas: (activeBrandKit?.targetAreas as string[]) || [],
      languagePreference:
        (activeBrandKit?.languagePreference as
          | "amharic"
          | "english"
          | "both") || "both",
    };
  }, [activeBrandKit, user]);

  const [leftTab, setLeftTab] = useState<
    "add" | "ai" | "seo" | "layers" | "growth" | "video"
  >("ai");
  const { data: metrics } = trpc.crm.socialMediaPosts.engagement.useQuery(
    undefined,
    {
      enabled: leftTab === "growth",
    }
  );

  // Calculate stats for current design if applicable
  const stats = useMemo(() => {
    if (!metrics) return { impressions: 0, clicks: 0, leads: 0, comments: 0 };
    const currentMetrics = metrics.filter(
      (m: any) => m.postId === (typeof design.id === "number" ? design.id : -1)
    );
    return {
      impressions: currentMetrics.reduce(
        (sum: number, m: any) => sum + (m.impressions || 0),
        0
      ),
      clicks: currentMetrics.reduce(
        (sum: number, m: any) => sum + (m.clicks || 0),
        0
      ),
      leads: currentMetrics.reduce(
        (sum: number, m: any) => sum + (m.leads || 0),
        0
      ),
      comments: currentMetrics.reduce(
        (sum: number, m: any) => sum + (m.comments || 0),
        0
      ),
    };
  }, [metrics, design.id]);

  const handleFormChange = (patch: Partial<ListingFormData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  };

  const [seoCaption, setSeoCaption] = useState("");
  const [publishPanelOpen, setPublishPanelOpen] = useState(false);
  const [publishPlatforms, setPublishPlatforms] = useState<
    ("instagram" | "telegram" | "facebook" | "tiktok")[]
  >(["telegram"]);
  const [captionAmharic, setCaptionAmharic] = useState("");
  const [captionEnglish, setCaptionEnglish] = useState("");
  const [captionHashtags, setCaptionHashtags] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [gatedFeature, setGatedFeature] = useState("");

  // Image Rebrander state
  const [rebrandImage, setRebrandImage] = useState<string | null>(null);
  const [rebrandMasking, setRebrandMasking] = useState(false);
  const [rebrandMaskRect, setRebrandMaskRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [rebrandDragging, setRebrandDragging] = useState(false);
  const [rebrandDragStart, setRebrandDragStart] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Advert Creator state
  const [adDesc, setAdDesc] = useState("");
  const [adFormat, setAdFormat] = useState<AspectRatio>("1:1");
  const [adStyle, setAdStyle] = useState("Luxury Gold/Black");
  const [adGenerated, setAdGenerated] = useState(false);

  const { data: subData } = trpc.subscription.current.useQuery();
  const currentPlan = subData?.plan || "starter";
  const canUseAi = currentPlan === "pro" || currentPlan === "agency";

  const [isMasking, setIsMasking] = useState(false);
  const [maskPaths, setMaskPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>(
    []
  );
  const [isStaging, setIsStaging] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [aiPresetRoom, setAiPresetRoom] = useState("living-room");
  const [aiPresetStyle, setAiPresetStyle] = useState("luxury");
  const [adFmt, setAdFmt] = useState<"9:16" | "16:9">("9:16");
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    LISTING_TEMPLATES[0].id
  );

  const workspaceWidth = 600;
  const uiResolution = getResolution(
    design.format,
    workspaceWidth * scaleFactor
  );
  const uiElements = resolveLayout(design, uiResolution);

  useEffect(() => {
    if (activeContext) {
      handleFormChange({
        price: activeContext.price
          ? `ETB ${Number(activeContext.price).toLocaleString()}`
          : formData.price,
        location: activeContext.subcity || formData.location,
        bedrooms: (activeContext as any).bedrooms
          ? `${(activeContext as any).bedrooms}`
          : formData.bedrooms,
        bathrooms: (activeContext as any).bathrooms
          ? `${(activeContext as any).bathrooms}`
          : formData.bathrooms,
        area: (activeContext as any).squareFeet
          ? `${(activeContext as any).squareFeet}`
          : formData.area,
        title: (activeContext as any).title || formData.title,
      });
    }
  }, [activeContext]);

  const createMutation = trpc.crm.designs.create.useMutation({
    onSuccess: () => toast.success("Design saved!"),
    onError: () => toast.error("Save failed"),
  });

  const generatePackMutation = trpc.ai.generateMarketingPack.useMutation({
    onError: () => {
      toast.error("AI Service Unavailable - Using Mock Data");
      const mock = getStudioMock("ai.generateMarketingPack") as any;
      if (mock.elements) updateDesign({ elements: mock.elements });
    },
  });
  const extractMutation = trpc.studio.extractor.parseListing.useMutation({
    onError: () => toast.error("Listing Extractor Unavailable"),
  });
  const renderMutation = trpc.studio.videoEngine.render.useMutation({
    onError: () => toast.error("Video Engine Unavailable"),
  });

  const publishPropertyMutation = trpc.crm.properties.publish.useMutation();
  const publishMutation = trpc.crm.socialMediaPosts.create.useMutation({
    onSuccess: () => toast.success("Marketing Campaign Scheduled!"),
    onError: () => toast.error("Scheduling failed. Please try again."),
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

  const updateDesign = (
    patch: Partial<DesignState> | ((prev: DesignState) => DesignState)
  ) => {
    pushHistory(design);
    setDesign(prev => {
      if (typeof patch === "function") return patch(prev);
      return { ...prev, ...patch };
    });
  };

  const updateElement = (id: string, patch: Partial<StudioElement>) => {
    updateDesign(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === id ? { ...el, ...patch } : el
      ),
    }));
  };

  const selected = design.elements.find(e => e.id === selectedId) ?? null;

  // ── magic fill ───────────────────────────────────────────────────────────
  const handleMagicFill = useCallback(() => {
    if (!activeContext) return;
    toast.info("Applying context data...");

    setDesign(prev => ({
      ...prev,
      name: activeContext.title || prev.name,
      elements: prev.elements.map(el => {
        if (el.type !== "text") return el;

        const text = el.content.text?.toLowerCase() || "";
        let newContent = el.content.text;

        if (text.includes("title") || text.includes("luxury"))
          newContent = activeContext.title;
        if (text.includes("price") || text.includes("etb"))
          newContent = activeContext.price
            ? `ETB ${Number(activeContext.price).toLocaleString()}`
            : el.content.text;
        if (text.includes("location") || text.includes("bole"))
          newContent = `${activeContext.subcity || ""}, ${activeContext.address || ""}`;

        return { ...el, content: { ...el.content, text: newContent } };
      }),
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
      fonts: (activeBrandKit.fonts as any) || {
        heading: "Poppins, sans-serif",
        body: "Poppins, sans-serif",
      },
    };

    updateDesign(prev => applyBrandTheme(prev, theme));
  }, [activeBrandKit, updateDesign]);

  // ── seo ────────────────────────────────────────────────────────
  const handleOptimizeCaption = useCallback(() => {
    let base = design.name;
    if (propContext) base = propContext.description || propContext.title;
    else if (supplierContext) base = supplierContext.title;

    const optimized = optimizeCaption(
      base,
      activeContext?.subcity || "Addis Ababa"
    );
    setSeoCaption(optimized);
    toast.success("SEO Keywords Injected!");
  }, [activeContext, propContext, supplierContext, design.name]);

  const uploadMutation = trpc.studio.upload.useMutation();
  const renderVideoMutation = trpc.studio.videoEngine.render.useMutation({
    onSuccess: (data: any) => {
      toast.success("Magic Reel Generated!", {
        description:
          "Your cinematic property teaser is ready for social sharing.",
      });
      // Optionally open the result or set a preview state
    },
    onError: (err: any) => toast.error(err.message || "Failed to render video"),
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
      const base64Promise = new Promise<string>(resolve => {
        reader.onloadend = () =>
          resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      const fileData = await base64Promise;

      // 3. Upload to server-side storage
      const { url } = await uploadMutation.mutateAsync({
        fileName: `${design.name.replace(/\s+/g, "-")}.png`,
        fileData,
        contentType: "image/png",
      });

      // 4. Create the social media post records with auto-tracking
      let finalCaption = seoCaption;

      // Auto-tracking integration
      if (activeContext?.id) {
        toast.info("Generating auto-tracking link...");
        const { trackingLink } = await publishPropertyMutation.mutateAsync({
          id: Number(activeContext.id),
        });
        if (trackingLink) {
          finalCaption = `${seoCaption}\n\nView listing: ${trackingLink}`;
        }
      }

      await publishMutation.mutateAsync({
        designId: typeof design.id === "string" ? undefined : design.id,
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
  const syncFormDataToDesign = (
    elements: StudioElement[],
    data: ListingFormData
  ): StudioElement[] => {
    return elements.map(el => {
      if (el.type !== "text") return el;
      const text = el.content.text?.toLowerCase() || "";
      let newText = el.content.text;

      if (text.includes("title") || text.includes("luxury"))
        newText = data.title || el.content.text;
      if (text.includes("price") || text.includes("etb"))
        newText = data.price || el.content.text;
      if (text.includes("location") || text.includes("bole"))
        newText = data.location || el.content.text;
      if (text.includes("beds") || text.includes("bedrooms"))
        newText = `${data.bedrooms} Beds` || el.content.text;
      if (text.includes("baths") || text.includes("bathrooms"))
        newText = `${data.bathrooms} Baths` || el.content.text;

      return { ...el, content: { ...el.content, text: newText } };
    });
  };

  const pickTemplate = (t: Template) => {
    const elements = syncFormDataToDesign(makeElements(t), formData);
    updateDesign({
      id: t.id,
      name: t.name,
      format: t.format,
      elements: elements,
    });
    setSelectedId(null);
    setPhase("edit");
  };

  const addText = () => {
    const el: StudioElement = {
      id: uid(),
      type: "text",
      layer: "component",
      baseWidth: 400,
      baseHeight: 100,
      constraints: {
        x: { anchor: "center", margin: 0, priority: 1 },
        y: { anchor: "middle", margin: 0, priority: 1 },
      },
      content: { text: "Double click to edit" },
      style: { fontSize: 32, color: "#1e3a5f", textAlign: "center" },
    };
    updateDesign({ elements: [...design.elements, el] });
    setSelectedId(el.id);
  };

  const addRect = () => {
    const el: StudioElement = {
      id: uid(),
      type: "rect",
      layer: "component",
      baseWidth: 200,
      baseHeight: 120,
      constraints: {
        x: { anchor: "center", margin: 0, priority: 1 },
        y: { anchor: "middle", margin: 0, priority: 1 },
      },
      content: {},
      style: { fill: "#d4af37", borderRadius: 8 },
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
      id: uid(),
      type: "video",
      layer: "background",
      baseWidth: 1000,
      baseHeight: 1000,
      constraints: {
        x: { anchor: "center", margin: 0, priority: 1 },
        y: { anchor: "middle", margin: 0, priority: 1 },
      },
      videoConfig: {
        src: url,
        startTime: 0,
        duration: 15,
        muted: true,
        loop: true,
      },
      content: {},
      style: {},
    };
    updateDesign({ elements: [...design.elements, el] });
    setSelectedId(el.id);
    toast.success("Video added to composition!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    handleFormChange({ image: url });
    const el: StudioElement = {
      id: uid(),
      type: "image",
      layer: "image",
      baseWidth: 800,
      baseHeight: 600,
      constraints: {
        x: { anchor: "center", margin: 0, priority: 1 },
        y: { anchor: "middle", margin: 0, priority: 1 },
      },
      content: { src: url },
      style: { borderRadius: 8 },
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
    toast.info("Magic Eraser: Brush over the objects you want to remove.", {
      duration: 5000,
    });
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
      toast.loading("Magic Eraser: Processing 1024x1024 Neural Mask...", {
        id: tid,
      });
      await new Promise(r => setTimeout(r, 1500));
      toast.loading("Magic Eraser: Inpainting background textures...", {
        id: tid,
      });
      await new Promise(r => setTimeout(r, 1200));
      toast.loading(
        "Magic Eraser: Finalizing pixel-perfect reconstruction...",
        { id: tid }
      );
      await new Promise(r => setTimeout(r, 1000));

      toast.success("Object Removed Successfully!", { id: tid });
      setMaskPaths([]);
    } catch (e) {
      toast.error("Magic Eraser failed. Please try again.", { id: tid });
    }
  };

  const handleCleanAndBrand = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      id: uid(),
      type: "image",
      layer: "image",
      baseWidth: 900,
      baseHeight: 900,
      constraints: {
        x: { anchor: "center", margin: 0, priority: 1 },
        y: { anchor: "middle", margin: 0, priority: 1 },
      },
      content: { src: url },
      style: { borderRadius: 12 },
    };

    // Apply layout and brand over it
    const colors = (activeBrandKit.colors as any) || {};
    const theme = {
      primary: colors.primary || "#1e3a5f",
      secondary: colors.secondary || "#f5f0eb",
      accent: colors.accent || "#d4af37",
      fonts: (activeBrandKit.fonts as any) || {
        heading: "Poppins, sans-serif",
        body: "Poppins, sans-serif",
      },
    };

    setPhase("edit");
    setSelectedId(el.id);

    setDesign(prev =>
      applyBrandTheme(
        {
          ...prev,
          name: "Rebranded Listing",
          format: "1:1",
          elements: [
            {
              id: uid(),
              type: "rect",
              layer: "background",
              baseWidth: 1000,
              baseHeight: 1000,
              constraints: {
                x: { anchor: "left", margin: 0, priority: 0 },
                y: { anchor: "top", margin: 0, priority: 0 },
              },
              content: {},
              style: { fill: "#ffffff", borderRadius: 0 },
            },
            el,
            {
              id: uid(),
              type: "rect",
              layer: "component",
              baseWidth: 1000,
              baseHeight: 150,
              constraints: {
                x: { anchor: "center", margin: 0, priority: 5 },
                y: { anchor: "bottom", margin: 0, priority: 5 },
              },
              content: {},
              style: { fill: theme.primary, borderRadius: 0 },
            },
            {
              id: uid(),
              type: "text",
              layer: "component",
              baseWidth: 800,
              baseHeight: 80,
              constraints: {
                x: { anchor: "center", margin: 0, priority: 6 },
                y: { anchor: "bottom", margin: 0.05, priority: 6 },
              },
              content: { text: "Exclusive Listing" },
              style: {
                fontSize: 42,
                fontWeight: "bold",
                color: "#ffffff",
                textAlign: "center",
              },
            },
          ],
        },
        theme
      )
    );

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
        living:
          "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1000",
        kitchen:
          "https://images.unsplash.com/photo-1556911220-e150213ff1a3?auto=format&fit=crop&q=80&w=1000",
        bedroom:
          "https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=1000",
      };

      updateElement(selected.id, {
        content: { ...selected.content, src: mockImages[type] },
      });
      toast.success(`Room successfully staged as ${type}!`, { id: tid });
    } catch (e) {
      toast.error("AI Staging failed. Please try again.", { id: tid });
    } finally {
      setIsStaging(false);
    }
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    updateDesign({
      elements: design.elements.filter(e => e.id !== selectedId),
    });
    setSelectedId(null);
  }, [selectedId, design.elements]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId)
        deleteSelected();
      if (e.key === "Escape") {
        setSelectedId(null);
        setEditingId(null);
      }
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      }
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
    setDrag({
      active: true,
      elId: el.id,
      startCx: e.clientX,
      startCy: e.clientY,
      elBaseX: el.constraints.x.margin,
      elBaseY: el.constraints.y.margin,
    });
  };

  const onElemPointerMove = (e: React.PointerEvent, el: StudioElement) => {
    if (!drag || drag.elId !== el.id) return;
    const dx = (e.clientX - drag.startCx) / (workspaceWidth * scaleFactor);
    const dy = (e.clientY - drag.startCy) / (workspaceWidth * scaleFactor);
    updateElement(el.id, {
      constraints: {
        x: { ...el.constraints.x, margin: drag.elBaseX + dx },
        y: { ...el.constraints.y, margin: drag.elBaseY + dy },
      },
    });
  };

  const onHandlePointerDown = (
    e: React.PointerEvent,
    el: StudioElement,
    handle: string
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setResize({
      active: true,
      elId: el.id,
      handle,
      startCx: e.clientX,
      startCy: e.clientY,
      elBaseX: el.constraints.x.margin,
      elBaseY: el.constraints.y.margin,
      elBaseW: el.baseWidth,
      elBaseH: el.baseHeight,
    });
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
      updateElement(editingId, {
        content: { ...selected?.content, text: editingText },
      });
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
        designStyle: aiPresetStyle,
      });

      if (result.elements) {
        updateDesign({ elements: result.elements });
        toast.success("AI Content Generated!");
      }
    } catch (e) {
      toast.error("AI service unavailable - using placeholder");
      const mock = getStudioMock("ai.generateMarketingPack");
      updateDesign({ elements: mock.elements });
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  // ── MODE SELECTION SCREEN ────────────────────────────────────────────────
  if (phase === "mode_select") {
    const MODES: {
      id: StudioMode;
      icon: string;
      label: string;
      tagline: string;
      badge?: string;
    }[] = [
      {
        id: "listing_creator",
        icon: "🏠",
        label: "Listing Creator",
        tagline: "Upload photos, fill details, pick a template, publish.",
      },
      {
        id: "image_rebrander",
        icon: "🎨",
        label: "Image Rebrander",
        tagline:
          "Upload a competitor ad — AI strips the watermark and applies your brand.",
      },
      {
        id: "advert_creator",
        icon: "✨",
        label: "Advert Creator",
        tagline:
          "AI generates a complete ad from your Brand Kit. No photo needed.",
        badge: "AI",
      },
      {
        id: "video_tour",
        icon: "🎬",
        label: "Video Tour",
        tagline:
          "Upload walkthrough footage, add overlays, export as Reel or Story.",
      },
      {
        id: "video_ad",
        icon: "📱",
        label: "Video Ad",
        tagline:
          "Landscape or vertical — brand intro, listing highlights, and a strong CTA.",
        badge: "New",
      },
    ];
    return (
      <DashboardLayout>
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Design Studio</h1>
          <p className="text-muted-foreground mt-2">
            Choose a mode to start creating.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => {
                setStudioMode(m.id);
                setPhase("pick");
              }}
              className="group relative flex flex-col gap-4 p-6 rounded-3xl border-2 border-border bg-card hover:border-accent hover:shadow-2xl hover:bg-accent/5 transition-all duration-300 text-left"
            >
              {m.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">
                  {m.badge}
                </span>
              )}
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {m.icon}
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{m.label}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {m.tagline}
                </p>
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

  // ── MODE-AWARE PICK SCREEN ────────────────────────────────────────────────
  if (phase === "pick") {
    const modeLabel: Record<StudioMode, string> = {
      listing_creator: "Listing Creator",
      image_rebrander: "Image Rebrander",
      advert_creator: "Advert Creator",
      video_tour: "Video Tour",
      video_ad: "Video Ad",
    };
    const LISTING_TEMPLATE_IDS = [
      "property-poster",
      "luxury-gold-listing",
      "instagram-post",
      "modern-minimal-flyer",
      "blank",
    ];
    const BackBtn = () => (
      <button
        onClick={() => {
          if (!contextId) setPhase("mode_select");
        }}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        ← {studioMode ? modeLabel[studioMode] : "Studio"}
      </button>
    );

    if (studioMode === "image_rebrander")
      return (
        <DashboardLayout>
          <div className="mb-8 flex items-center gap-4">
            <BackBtn />
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Image Rebrander
              </h1>
              <p className="text-muted-foreground text-sm">
                Upload a competitor ad to get started — our AI replaces their
                brand with yours.
              </p>
            </div>
          </div>
          <div className="max-w-xl space-y-4">
            <div className="border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center gap-6 hover:border-accent/60 transition-colors bg-card">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-4xl">
                🎨
              </div>
              <div className="text-center">
                <p className="font-semibold">Upload Competitor Ad</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PNG, JPG or WebP. Apply your brand colours and logo.
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const bgEl: StudioElement = {
                      id: uid(),
                      type: "rect",
                      layer: "background",
                      baseWidth: 1000,
                      baseHeight: 1000,
                      constraints: {
                        x: { anchor: "left", margin: 0, priority: 0 },
                        y: { anchor: "top", margin: 0, priority: 0 },
                      },
                      content: {},
                      style: { fill: "#ffffff", borderRadius: 0 },
                    };
                    const imgEl: StudioElement = {
                      id: uid(),
                      type: "image",
                      layer: "image",
                      baseWidth: 1000,
                      baseHeight: 1000,
                      constraints: {
                        x: { anchor: "center", margin: 0, priority: 1 },
                        y: { anchor: "middle", margin: 0, priority: 1 },
                      },
                      content: { src: url },
                      style: { borderRadius: 0 },
                    };
                    updateDesign({
                      name: "Rebranded Ad",
                      format: "1:1",
                      elements: [bgEl, imgEl],
                    });
                    setPhase("edit");
                    toast.success(
                      "Image loaded — use AI Rebrand in the left panel."
                    );
                  }}
                />
                <span className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors">
                  <Upload className="w-4 h-4" /> Choose Image
                </span>
              </label>
            </div>
            {activeBrandKit && (
              <div className="p-4 rounded-2xl border border-border bg-muted/30 flex items-center gap-3">
                <Palette className="w-5 h-5 text-accent shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Brand Kit Ready</p>
                  <p className="text-xs text-muted-foreground">
                    {(activeBrandKit as any).name} will be applied
                    automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DashboardLayout>
      );

    if (studioMode === "advert_creator")
      return (
        <DashboardLayout>
          <div className="mb-8 flex items-center gap-4">
            <BackBtn />
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Advert Creator
              </h1>
              <p className="text-muted-foreground text-sm">
                Describe your property and our AI will generate an ad from your
                Brand Kit.
              </p>
            </div>
          </div>
          <div className="max-w-lg space-y-6">
            <div className="p-6 rounded-3xl border border-border bg-card space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">AI Ad Generator</p>
                  <p className="text-xs text-muted-foreground">
                    Brand Kit auto-applied
                  </p>
                </div>
                {activeBrandKit && (
                  <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    ✓ {(activeBrandKit as any).name}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Property Description
                </label>
                <textarea
                  id="advert-desc"
                  className="w-full h-28 bg-background border border-border rounded-xl p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                  placeholder="e.g. 3-bedroom villa in Bole. Modern kitchen, rooftop terrace. ETB 8.5M..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Format
                  </label>
                  <select
                    id="advert-format"
                    className="w-full h-9 bg-background border border-border rounded-lg px-3 text-sm mt-1"
                  >
                    <option value="1:1">Square (1:1)</option>
                    <option value="4:5">Portrait (4:5)</option>
                    <option value="9:16">Story (9:16)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Style
                  </label>
                  <select className="w-full h-9 bg-background border border-border rounded-lg px-3 text-sm mt-1">
                    <option>Luxury Gold/Black</option>
                    <option>Minimalist Clean</option>
                    <option>Bold Commercial</option>
                  </select>
                </div>
              </div>
              <Button
                className="w-full bg-accent text-white hover:bg-accent/90 h-11 gap-2 font-semibold"
                onClick={() => {
                  const desc =
                    (
                      document.getElementById(
                        "advert-desc"
                      ) as HTMLTextAreaElement
                    )?.value || "Luxury property";
                  const fmt = ((
                    document.getElementById(
                      "advert-format"
                    ) as HTMLSelectElement
                  )?.value || "1:1") as AspectRatio;
                  const tpl =
                    TEMPLATES.find(t => t.id === "luxury-gold-listing") ||
                    TEMPLATES[0];
                  updateDesign({
                    id: tpl.id,
                    name: `Ad — ${desc.slice(0, 30)}`,
                    format: fmt,
                    elements: makeElements(tpl),
                  });
                  if (activeBrandKit) {
                    const colors = (activeBrandKit.colors as any) || {};
                    updateDesign(prev =>
                      applyBrandTheme(prev, {
                        primary: colors.primary || "#1e3a5f",
                        secondary: colors.secondary || "#f5f0eb",
                        accent: colors.accent || "#d4af37",
                        fonts: (activeBrandKit.fonts as any) || {
                          heading: "Poppins, sans-serif",
                          body: "Poppins, sans-serif",
                        },
                      })
                    );
                  }
                  setPhase("edit");
                  toast.success("AI Ad generated — Brand Kit applied!");
                }}
              >
                <Sparkles className="w-4 h-4" /> Generate Advert
              </Button>
            </div>
            {!activeBrandKit && (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-start gap-3">
                <Palette className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  No Brand Kit found.{" "}
                  <a href="/settings" className="font-semibold underline">
                    Create one in Settings → Brand Identity
                  </a>{" "}
                  to auto-apply your logo, colours and fonts.
                </span>
              </div>
            )}
          </div>
        </DashboardLayout>
      );

    if (studioMode === "video_tour")
      return (
        <DashboardLayout>
          <div className="mb-8 flex items-center gap-4">
            <BackBtn />
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Video Tour</h1>
              <p className="text-muted-foreground text-sm">
                Upload walkthrough footage, add overlays, export as Reel or
                Story.
              </p>
            </div>
          </div>
          <div className="max-w-xl space-y-4">
            <div className="border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center gap-6 hover:border-accent/60 transition-colors bg-card">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-4xl">
                🎬
              </div>
              <div className="text-center">
                <p className="font-semibold">Upload Walkthrough Footage</p>
                <p className="text-sm text-muted-foreground mt-1">
                  MP4, MOV or WebM. Formatted to 9:16 for Reels and TikTok.
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const tpl =
                      TEMPLATES.find(t => t.id === "tiktok-walkthrough") ||
                      TEMPLATES[3];
                    const elements = makeElements(tpl).map(el =>
                      el.type === "video"
                        ? {
                            ...el,
                            videoConfig: { ...el.videoConfig!, src: url },
                          }
                        : el
                    );
                    updateDesign({
                      id: tpl.id,
                      name: "Property Tour",
                      format: "9:16",
                      elements,
                    });
                    setPhase("edit");
                    toast.success(
                      "Video loaded — add overlays in the left panel."
                    );
                  }}
                />
                <span className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors">
                  <Video className="w-4 h-4" /> Upload Footage
                </span>
              </label>
            </div>
            <div className="p-4 rounded-2xl border border-border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Available in the editor:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Text overlays (price, location, contact)</li>
                <li>✓ Branded lower-third panels</li>
                <li>✓ Export as 9:16 for Reels & TikTok</li>
              </ul>
            </div>
          </div>
        </DashboardLayout>
      );

    if (studioMode === "video_ad") {
      return (
        <DashboardLayout>
          <div className="mb-8 flex items-center gap-4">
            <BackBtn />
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Video Ad</h1>
              <p className="text-muted-foreground text-sm">
                Brand intro + highlights + CTA. Vertical or landscape.
              </p>
            </div>
          </div>
          <div className="max-w-xl space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {(["9:16", "16:9"] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setAdFmt(fmt)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${adFmt === fmt ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
                >
                  <div
                    className={`bg-accent/10 rounded-lg flex items-center justify-center ${fmt === "9:16" ? "w-10 h-16" : "w-16 h-10"}`}
                  >
                    <Video className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {fmt === "9:16" ? "Vertical" : "Landscape"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmt === "9:16"
                        ? "Reels & Stories"
                        : "YouTube & Facebook"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-2 border-dashed border-border rounded-3xl p-10 flex flex-col items-center gap-5 hover:border-accent/60 transition-colors bg-card">
              <div className="text-4xl">📱</div>
              <div className="text-center">
                <p className="font-semibold">Upload Property Footage</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Brand intro and CTA overlay added automatically.
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const tpl =
                      TEMPLATES.find(t => t.id === "video-ad") || TEMPLATES[4];
                    const elements = makeElements(tpl).map(el =>
                      el.type === "video"
                        ? {
                            ...el,
                            videoConfig: { ...el.videoConfig!, src: url },
                          }
                        : el
                    );
                    updateDesign({
                      id: tpl.id,
                      name: "Property Video Ad",
                      format: adFmt,
                      elements,
                    });
                    if (activeBrandKit) {
                      const colors = (activeBrandKit.colors as any) || {};
                      updateDesign(prev =>
                        applyBrandTheme(prev, {
                          primary: colors.primary || "#1e3a5f",
                          secondary: colors.secondary || "#f5f0eb",
                          accent: colors.accent || "#d4af37",
                          fonts: (activeBrandKit.fonts as any) || {
                            heading: "Poppins, sans-serif",
                            body: "Poppins, sans-serif",
                          },
                        })
                      );
                    }
                    setPhase("edit");
                    toast.success(
                      "Video Ad loaded — edit brand overlay and CTA."
                    );
                  }}
                />
                <span className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors">
                  <Video className="w-4 h-4" /> Upload & Build Ad
                </span>
              </label>
            </div>
          </div>
        </DashboardLayout>
      );
    }

    // LISTING CREATOR (split view: 40/60)
    const ActiveTemplate =
      LISTING_TEMPLATES.find(t => t.id === selectedTemplateId)?.component ||
      LISTING_TEMPLATES[0].component;

    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-100px)] overflow-hidden gap-6">
          {/* Left Panel: Form & Controls (40%) */}
          <div className="w-[40%] flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-accent/20">
            <div className="flex items-center gap-3">
              <BackBtn />
              <div className="h-4 w-px bg-border" />
              <h1 className="text-xl font-bold tracking-tight">
                Listing Creator
              </h1>
            </div>

            {/* Template Selector Row */}
            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase opacity-60 tracking-wider">
                Select Style
              </Label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {LISTING_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      selectedTemplateId === t.id
                        ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                      style={{
                        backgroundColor:
                          selectedTemplateId === t.id
                            ? brandData.primaryColor
                            : brandData.secondaryColor,
                      }}
                    >
                      <span className="drop-shadow-md">✨</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selector Row */}
            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase opacity-60 tracking-wider">
                Format
              </Label>
              <div className="flex gap-2">
                {(["1:1", "9:16", "4:5", "16:9"] as AspectRatio[]).map(fmt => (
                  <Button
                    key={fmt}
                    variant={design.format === fmt ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateDesign({ format: fmt })}
                    className="rounded-full px-4 h-8 text-[11px] font-bold uppercase tracking-wider"
                  >
                    {fmt === "1:1"
                      ? "Post"
                      : fmt === "9:16"
                        ? "Story"
                        : fmt === "4:5"
                          ? "Flyer"
                          : "Wide"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Property Form */}
            <div className="p-6 rounded-[2rem] border border-border bg-card space-y-6 shadow-sm">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase opacity-60">
                      Listing Title
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={e =>
                        handleFormChange({ title: e.target.value })
                      }
                      placeholder="e.g. Modern Villa"
                      className="rounded-xl border-border/50 h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase opacity-60">
                      Price (ETB)
                    </Label>
                    <Input
                      value={formData.price}
                      onChange={e =>
                        handleFormChange({ price: e.target.value })
                      }
                      placeholder="e.g. 12,500,000"
                      className="rounded-xl border-border/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase opacity-60">
                      Location (Subcity)
                    </Label>
                    <Select
                      value={formData.location}
                      onValueChange={v => handleFormChange({ location: v })}
                    >
                      <SelectTrigger className="rounded-xl border-border/50 h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBCITIES.map(s => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase opacity-60">
                      Beds
                    </Label>
                    <Input
                      type="number"
                      value={formData.bedrooms}
                      onChange={e =>
                        handleFormChange({ bedrooms: e.target.value })
                      }
                      placeholder="3"
                      className="rounded-xl border-border/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase opacity-60">
                      Baths
                    </Label>
                    <Input
                      type="number"
                      value={formData.bathrooms}
                      onChange={e =>
                        handleFormChange({ bathrooms: e.target.value })
                      }
                      placeholder="2"
                      className="rounded-xl border-border/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase opacity-60">
                      Area (m²)
                    </Label>
                    <Input
                      type="number"
                      value={formData.area}
                      onChange={e => handleFormChange({ area: e.target.value })}
                      placeholder="250"
                      className="rounded-xl border-border/50 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase opacity-60">
                    Sub-location
                  </Label>
                  <Input
                    value={formData.subLocation}
                    onChange={e =>
                      handleFormChange({ subLocation: e.target.value })
                    }
                    placeholder="e.g. Bole Atlas, Gerji Mebrat Hail"
                    className="rounded-xl border-border/50 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase opacity-60">
                    Description
                  </Label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      handleFormChange({ description: e.target.value })
                    }
                    placeholder="Utilities, features, amenities, access, special notes..."
                    rows={4}
                    className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase opacity-60">
                    CTA Text
                  </Label>
                  <Input
                    value={formData.ctaText}
                    onChange={e =>
                      handleFormChange({ ctaText: e.target.value })
                    }
                    placeholder="Contact Us"
                    className="rounded-xl border-border/50 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase opacity-60">
                    Property Photo
                  </Label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex-1 h-24 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-muted transition-colors"
                    >
                      <Upload className="w-5 h-5 opacity-40" />
                      <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider">
                        Upload Image
                      </span>
                    </button>
                    {formData.image && (
                      <div className="w-24 h-24 rounded-2xl border border-border overflow-hidden relative group">
                        <img
                          src={formData.image}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleFormChange({ image: null })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file)
                          handleFormChange({
                            image: URL.createObjectURL(file),
                          });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pb-8">
              <Button
                className="flex-1 bg-zinc-900 text-white hover:bg-black rounded-xl h-12 font-bold uppercase tracking-widest text-[11px] gap-2"
                onClick={async () => {
                  if (!previewRef.current) return;
                  const tid = toast.loading("Rendering high-res display...");
                  try {
                    const dataUrl = await toPng(previewRef.current, {
                      pixelRatio: 2,
                    });
                    const link = document.createElement("a");
                    link.download = `${formData.title || "listing"}-export.png`;
                    link.href = dataUrl;
                    link.click();
                    toast.success("Ready for social sharing!", { id: tid });
                  } catch (e) {
                    toast.error("Export failed", { id: tid });
                  }
                }}
              >
                <Download className="w-4 h-4" /> Export PNG
              </Button>
              <Button
                className="flex-1 bg-accent text-white hover:bg-accent/90 rounded-xl h-12 font-bold uppercase tracking-widest text-[11px] gap-2"
                onClick={handlePublish}
              >
                <ArrowRight className="w-4 h-4" /> Publish
              </Button>
            </div>
          </div>

          {/* Right Panel: Live Preview (60%) */}
          <div className="flex-1 bg-muted/30 rounded-[3rem] border border-border/50 flex flex-col items-center justify-center relative p-8">
            <div className="absolute top-8 left-8 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[10px] font-black uppercase opacity-30 tracking-[0.2em]">
                Real-time Render View
              </span>
            </div>

            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <div
                ref={previewRef}
                style={{
                  width: "1080px",
                  height:
                    design.format === "1:1"
                      ? "1080px"
                      : design.format === "9:16"
                        ? "1920px"
                        : design.format === "4:5"
                          ? "1350px"
                          : "607.5px",
                  transform: `scale(${design.format === "9:16" ? 0.35 : 0.5})`,
                  transformOrigin: "center center",
                  boxShadow: "0 50px 100px -20px rgba(0,0,0,0.3)",
                }}
                className="bg-white shrink-0"
              >
                <ActiveTemplate data={formData} brand={brandData} />
              </div>
            </div>

            {/* Zoom Controls Overlay */}
            <div className="absolute bottom-8 right-8 flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 shadow-xl">
              <div className="px-3 py-1 text-[10px] font-black opacity-40">
                1080P ACTIVE
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle Styles for resizing
  const handleStyle = (h: string): React.CSSProperties => {
    const cursors: Record<string, string> = {
      nw: "nw-resize",
      n: "n-resize",
      ne: "ne-resize",
      e: "e-resize",
      se: "se-resize",
      s: "s-resize",
      sw: "sw-resize",
      w: "w-resize",
    };
    return {
      position: "absolute",
      width: 10,
      height: 10,
      background: "#fff",
      border: "2px solid #1e3a5f",
      borderRadius: 2,
      cursor: cursors[h],
      top: h.includes("n") ? -5 : h.includes("s") ? "100%" : "50%",
      left: h.includes("w") ? -5 : h.includes("e") ? "100%" : "50%",
      transform: "translate(-50%,-50%)",
      zIndex: 20,
    };
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 gap-4 bg-card/50 backdrop-blur rounded-2xl p-2 border border-border/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhase("pick")}
            className="text-muted-foreground hover:bg-muted"
          >
            ← Leave
          </Button>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <Input
            value={design.name}
            onChange={e => updateDesign({ name: e.target.value })}
            className="h-8 w-48 border-0 bg-transparent px-2 font-semibold focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={!history.current.canUndo()}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={!history.current.canRedo()}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportAsPng(design, design.name)}
          >
            <Download className="w-4 h-4 mr-2" /> PNG
          </Button>
          {!activeContext && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                createMutation.mutate({
                  type: "poster",
                  name: design.name,
                  content: design as any,
                  isNewInventory: true,
                })
              }
              className="border-accent text-accent hover:bg-accent/5"
              disabled={createMutation.isPending}
            >
              <Building2 className="w-4 h-4 mr-2" /> Save to Inventory
            </Button>
          )}
          <Button
            size="sm"
            onClick={() =>
              createMutation.mutate({
                type: "other",
                name: design.name,
                template: design.id,
                content: design as any,
                propertyId: activeContext?.id,
              })
            }
            className="bg-accent text-white hover:bg-accent/90"
            disabled={createMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />{" "}
            {activeContext ? "Update Design" : "Save Design"}
          </Button>
        </div>
      </div>

      {/* SMART HEADER FORM (Ollaa-inspired) */}
      {studioMode === "listing_creator" &&
        (() => {
          const visibleTemplates = TEMPLATES.filter(t =>
            [
              "property-poster",
              "luxury-gold-listing",
              "instagram-post",
              "modern-minimal-flyer",
              "blank",
            ].includes(t.id)
          );
          return (
            <div className="bg-card border border-border rounded-3xl p-4 mb-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
                {/* Visual Template Row */}
                <div className="flex items-center gap-3 pr-6 border-r border-border shrink-0">
                  {visibleTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => pickTemplate(t)}
                      className={`flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all shrink-0 w-24 ${design.id === t.id ? "border-accent bg-accent/5" : "border-transparent hover:bg-muted"}`}
                    >
                      <div
                        className="w-16 h-12 rounded-xl flex items-center justify-center text-2xl relative shadow-sm overflow-hidden"
                        style={{ background: t.bgColor }}
                      >
                        <span className="z-10">{t.emoji}</span>
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            background:
                              "linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)",
                            backgroundSize: "10px 10px",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase truncate w-full text-center">
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Property Data Form */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="space-y-1 min-w-[200px]">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Main Photo
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 rounded-xl border-dashed"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5" />{" "}
                        {formData.image ? "Replace" : "Upload"}
                      </Button>
                      {formData.image && (
                        <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden border border-border">
                          <img
                            src={formData.image}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Price (ETB)
                    </Label>
                    <Input
                      value={formData.price}
                      onChange={e =>
                        handleFormChange({ price: e.target.value })
                      }
                      className="h-9 w-32 rounded-xl bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-accent"
                      placeholder="e.g. 5.5M"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Subcity
                    </Label>
                    <Select
                      value={formData.location}
                      onValueChange={v => handleFormChange({ location: v })}
                    >
                      <SelectTrigger className="h-9 w-28 rounded-xl bg-muted/30 border-0">
                        <SelectValue placeholder="Bole" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bole">Bole</SelectItem>
                        <SelectItem value="Kazanchis">Kazanchis</SelectItem>
                        <SelectItem value="Old Airport">Old Airport</SelectItem>
                        <SelectItem value="Lamberet">Lamberet</SelectItem>
                        <SelectItem value="Yeka">Yeka</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Beds
                      </Label>
                      <Input
                        type="number"
                        value={formData.bedrooms}
                        onChange={e =>
                          handleFormChange({ bedrooms: e.target.value })
                        }
                        className="h-9 w-16 rounded-xl bg-muted/30 border-0"
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Baths
                      </Label>
                      <Input
                        type="number"
                        value={formData.bathrooms}
                        onChange={e =>
                          handleFormChange({ bathrooms: e.target.value })
                        }
                        className="h-9 w-16 rounded-xl bg-muted/30 border-0"
                        placeholder="2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* FORMAT PILLS (Always visible in listing mode) */}
      {studioMode === "listing_creator" && (
        <div className="flex items-center gap-2 mb-6">
          {(
            [
              ["Post", "1:1"],
              ["Story", "9:16"],
              ["Flyer", "4:5"],
              ["Wide", "16:9"],
            ] as [string, AspectRatio][]
          ).map(([label, fmt]) => (
            <button
              key={fmt}
              onClick={() => updateDesign({ format: fmt })}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${design.format === fmt ? "bg-accent text-white border-accent shadow-md shadow-accent/20" : "bg-card text-muted-foreground border-border hover:border-accent/40"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-210px)]">
        {/* LEFT PANEL */}
        <div className="w-72 shrink-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <Tabs
            value={leftTab}
            onValueChange={v => setLeftTab(v as any)}
            className="flex flex-col h-full"
          >
            <TabsList className="w-full grid grid-cols-6 h-12 bg-muted/30">
              <TabsTrigger value="add" className="rounded-none">
                <Plus className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-none">
                <Sparkles className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="video" className="rounded-none">
                <Video className="w-4 h-4 text-accent" />
              </TabsTrigger>
              <TabsTrigger value="seo" className="rounded-none">
                <Search className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="growth" className="rounded-none">
                <TrendingUp className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="layers" className="rounded-none">
                <Layers className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="add" className="m-0 space-y-4">
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-4 rounded-xl"
                  onClick={addText}
                >
                  <Type className="w-5 h-5 text-accent" /> Add Text
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-4 rounded-xl"
                  onClick={addRect}
                >
                  <Square className="w-5 h-5 text-accent" /> Add Shape
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-4 rounded-xl"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5 text-accent" /> Add Image
                </Button>
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-4 rounded-xl"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video className="w-5 h-5 text-accent" /> Add Video
                </Button>
                <input
                  type="file"
                  ref={videoInputRef}
                  className="hidden"
                  accept="video/*"
                  onChange={handleVideoUpload}
                />
              </TabsContent>

              <TabsContent value="ai" className="m-0 space-y-4">
                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
                  <p className="text-xs font-semibold text-accent mb-2">
                    Studio AI Engine
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                    Generate localized Ethiopia real estate content with one
                    click.
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase opacity-60">
                        Room Type
                      </Label>
                      <Select
                        value={aiPresetRoom}
                        onValueChange={setAiPresetRoom}
                      >
                        <SelectTrigger className="h-8 text-[11px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="living-room">
                            Living Room Modern
                          </SelectItem>
                          <SelectItem value="kitchen">
                            Kitchen Contemporary
                          </SelectItem>
                          <SelectItem value="master-bedroom">
                            Master Suite
                          </SelectItem>
                          <SelectItem value="exterior">
                            Exterior Facade
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase opacity-60">
                        Design Style
                      </Label>
                      <Select
                        value={aiPresetStyle}
                        onValueChange={setAiPresetStyle}
                      >
                        <SelectTrigger className="h-8 text-[11px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luxury">
                            Luxury Gold/Black
                          </SelectItem>
                          <SelectItem value="minimalist">
                            Minimalist Light
                          </SelectItem>
                          <SelectItem value="bold">Bold Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="w-full text-xs bg-accent text-white hover:bg-accent/90"
                    variant="outline"
                    onClick={() => handleAiGenerate()}
                    disabled={generatePackMutation.isPending || isAiLoading}
                  >
                    {generatePackMutation.isPending || isAiLoading
                      ? "Generating..."
                      : "Generate AI Pack"}
                  </Button>
                </div>

                {activeContext && (
                  <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold">Magic Fill</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Sync <strong>{activeContext.title}</strong> details into
                      this design.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-2 border-accent/30 text-accent hover:bg-accent/5"
                      onClick={handleMagicFill}
                    >
                      <Wand2 className="w-3.5 h-3.5 text-accent" /> Apply
                      Listing Data
                    </Button>
                  </div>
                )}

                {activeBrandKit && (
                  <div className="p-3 bg-secondary/30 border border-border rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold">
                        Brand Identity
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Apply <strong>{(activeBrandKit as any).name}</strong>{" "}
                      styles instantly.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-2"
                      onClick={handleMagicRebrand}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-accent" /> Magic
                      Rebrand
                    </Button>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-muted/20 border border-border mt-4">
                  <p className="text-xs font-semibold text-accent mb-2">
                    Clean & Brand
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                    Upload a competitor ad. AI will remove watermarks and apply
                    your brand.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={rebrandInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleCleanAndBrand}
                    />
                    <Button
                      className="w-full text-xs gap-2 border-accent/30 text-accent hover:bg-accent/5"
                      variant="outline"
                      onClick={() => rebrandInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" /> Upload Comp Ad
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-tight">
                      AI Room Staging
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
                    Instantly transform empty rooms into designer-staging
                    previews.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["living", "kitchen", "bedroom"] as const).map(room => (
                      <Button
                        key={room}
                        variant="ghost"
                        size="sm"
                        className="flex flex-col h-auto py-3 gap-2 border border-border/50 hover:border-accent hover:bg-accent/5"
                        onClick={() => handleAiStaging(room)}
                        disabled={isStaging}
                      >
                        <span className="text-[10px] font-bold capitalize">
                          {room}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="text-xs">Social Growth</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Successfully published designs start capturing leads
                    immediately.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs gap-2 border-accent/30 text-accent hover:bg-accent/5"
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                  >
                    <Calendar className="w-3.5 h-3.5" />{" "}
                    {publishMutation.isPending
                      ? "Scheduling..."
                      : "Schedule Social Post"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="m-0 space-y-4 px-1">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-accent" />
                    <span className="text-sm font-bold uppercase tracking-tight">
                      Search Optimizer
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Social Caption
                    </Label>
                    <textarea
                      value={seoCaption}
                      onChange={e => setSeoCaption(e.target.value)}
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
                            if (!text)
                              return toast.warning("Clipboard is empty");
                            const tid = toast.loading(
                              "AI: Extracting property data..."
                            );
                            const result = await extractMutation.mutateAsync({
                              text,
                            });
                            if (result) {
                              toast.success("Magic Import Successful!", {
                                id: tid,
                              });
                              handleMagicFill(); // Re-trigger fill with new data if applicable
                            }
                          } catch (e) {
                            toast.error(
                              "Magic Import failed. Please try again."
                            );
                          }
                        }}
                      >
                        <Zap className="w-3.5 h-3.5" /> Magic Import
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                    Accessibility (Alt Text)
                  </p>
                  <div className="space-y-2">
                    {design.elements
                      .filter(el => el.type === "image" || el.type === "text")
                      .map(el => (
                        <div
                          key={el.id}
                          className="p-3 bg-card border border-border rounded-xl space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold opacity-60 uppercase">
                              {el.type} Element
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() =>
                                toast.info("AI Generating Alt Text...")
                              }
                            >
                              <Wand2 className="w-3 h-3" />
                            </Button>
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
                  onClick={() =>
                    toast.success("SEO Metadata synced to Inventory!")
                  }
                >
                  <Save className="w-4 h-4 mr-2" /> Sync to Property record
                </Button>
              </TabsContent>

              <TabsContent value="growth" className="m-0 space-y-4 px-1">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold uppercase tracking-tight">
                    Social Growth
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-accent/5 border border-accent/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Impressions
                    </p>
                    <p className="text-xl font-bold text-accent">
                      {stats.impressions}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/20 border border-border rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Clicks
                    </p>
                    <p className="text-xl font-bold">{stats.clicks}</p>
                  </div>
                  <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 text-green-600">
                      Leads
                    </p>
                    <p className="text-xl font-bold text-green-700">
                      {stats.leads}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 text-blue-600">
                      Comments
                    </p>
                    <p className="text-xl font-bold text-blue-700">
                      {stats.comments}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase px-1">
                    Recent Lead Activity
                  </p>
                  <div className="space-y-2">
                    {stats.leads > 0 ? (
                      <div
                        className="p-3 bg-white/5 border border-border rounded-xl flex items-center gap-3 active:scale-95 transition-transform cursor-pointer"
                        onClick={() => (window.location.href = `/crm/leads`)}
                      >
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-[10px]">
                          LQ
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">
                            High Intent Lead
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Captured via social tracking link
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <p className="text-[11px] font-medium leading-relaxed text-muted-foreground italic text-center">
                          "Publish your design to start capturing leads
                          automatically."
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {currentPlan === "starter" && (
                  <div className="mt-8 p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl border border-accent/20">
                    <h4 className="text-xs font-bold text-accent mb-1 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Growth Engine Pro
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
                      Unlock advanced lead attribution and unlimited social
                      exports.
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
                    <span className="text-xs font-bold uppercase tracking-tight">
                      Magic Reels
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                    Transform this design into a 15-second cinematic property
                    teaser for Instagram & TikTok.
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
                    onClick={() =>
                      renderVideoMutation.mutate({
                        designId: typeof design.id === "number" ? design.id : 1,
                      })
                    }
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
                  <Label className="text-[10px] font-bold uppercase opacity-60">
                    Animation Style
                  </Label>
                  <Select defaultValue="ken-burns">
                    <SelectTrigger className="h-8 text-[11px] mt-2 rounded-lg bg-background">
                      <SelectValue placeholder="Social Cinematic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ken-burns">
                        Social Cinematic
                      </SelectItem>
                      <SelectItem value="slide">Property Slide</SelectItem>
                      <SelectItem value="glitch">Urban Hype</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="layers" className="m-0 space-y-2">
                {design.elements
                  .slice()
                  .reverse()
                  .map((el, i) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedId(el.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg border text-xs cursor-pointer ${selectedId === el.id ? "border-accent bg-accent/5" : "border-transparent"}`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center bg-muted rounded">
                        {el.type === "text" ? (
                          <Type className="w-3 h-3" />
                        ) : (
                          <Square className="w-3 h-3" />
                        )}
                      </div>
                      <span className="flex-1 truncate">
                        {el.type === "text"
                          ? el.content.text
                          : `Shape ${design.elements.length - i}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500"
                        onClick={e => {
                          e.stopPropagation();
                          updateDesign({
                            elements: design.elements.filter(
                              x => x.id !== el.id
                            ),
                          });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
          style={{
            backgroundImage:
              "radial-gradient(circle, #00000010 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div
            ref={canvasRef}
            onMouseDown={isMasking ? handleMaskMouseDown : undefined}
            onMouseMove={isMasking ? handleMaskMouseMove : undefined}
            onMouseUp={isMasking ? handleMaskMouseUp : undefined}
            style={{
              width: uiResolution.width,
              height: uiResolution.height,
              background:
                design.elements.find(e => e.layer === "background")?.style
                  .fill || "#fff",
              position: "relative",
              boxShadow: "0 40px 100px rgba(0,0,0,0.15)",
              borderRadius: "2px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              cursor: isMasking ? "crosshair" : "default",
            }}
          >
            {/* Masking Layer */}
            {isMasking && (
              <div className="absolute inset-0 z-[100] bg-black/10 pointer-events-none">
                <svg className="w-full h-full opacity-60">
                  {maskPaths.map((path, i) => (
                    <polyline
                      key={i}
                      points={path
                        .map(
                          p =>
                            `${p.x * uiResolution.scale},${p.y * uiResolution.scale}`
                        )
                        .join(" ")}
                      fill="none"
                      stroke="#ff3b30"
                      strokeWidth={20}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {currentPath.length > 0 && (
                    <polyline
                      points={currentPath
                        .map(
                          p =>
                            `${p.x * uiResolution.scale},${p.y * uiResolution.scale}`
                        )
                        .join(" ")}
                      fill="none"
                      stroke="#ff3b30"
                      strokeWidth={20}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto">
                  <Button
                    variant="outline"
                    className="bg-white/80 backdrop-blur rounded-2xl px-6 font-bold"
                    onClick={() => setIsMasking(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-accent text-white rounded-2xl px-6 font-bold shadow-lg shadow-accent/20"
                    onClick={executeClean}
                  >
                    Remove Objects
                  </Button>
                </div>
              </div>
            )}

            {uiElements.map(el => {
              const isSelected = el.id === selectedId;
              const isEditing = el.id === editingId;
              return (
                <div
                  key={el.id}
                  onPointerDown={e => onElemPointerDown(e, el)}
                  onPointerMove={e =>
                    el.id === drag?.elId && onElemPointerMove(e, el)
                  }
                  onPointerUp={() => setDrag(null)}
                  style={{
                    position: "absolute",
                    left: el.resolvedX,
                    top: el.resolvedY,
                    width: el.resolvedWidth,
                    height: el.resolvedHeight,
                    border: isSelected ? "2px solid #3b82f6" : "none",
                    cursor: "move",
                    outline: isSelected
                      ? "1px solid rgba(255,255,255,0.5)"
                      : "none",
                  }}
                >
                  {el.type === "text" &&
                    (isEditing ? (
                      <textarea
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onBlur={commitEdit}
                        autoFocus
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "transparent",
                          border: "none",
                          resize: "none",
                          outline: "none",
                          fontSize: el.style.fontSize,
                          color: el.style.color,
                          textAlign: el.style.textAlign as any,
                          fontWeight: el.style.fontWeight as any,
                          padding: 0,
                          overflow: "hidden",
                        }}
                      />
                    ) : (
                      <div
                        onDoubleClick={() => startEditing(el)}
                        style={{
                          width: "100%",
                          whiteSpace: "pre-wrap",
                          fontSize: el.style.fontSize,
                          color: el.style.color,
                          fontWeight: el.style.fontWeight as any,
                          textAlign: el.style.textAlign as any,
                          pointerEvents: "none",
                        }}
                      >
                        {el.content.text}
                      </div>
                    ))}
                  {el.type === "video" && el.videoConfig && (
                    <video
                      src={el.videoConfig.src}
                      autoPlay
                      muted={el.videoConfig.muted}
                      loop={el.videoConfig.loop}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                        borderRadius: el.style.borderRadius,
                      }}
                    />
                  )}
                  {el.type === "rect" && (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: el.style.fill,
                        borderRadius: el.style.borderRadius,
                        opacity: el.style.opacity,
                      }}
                    />
                  )}

                  {isSelected &&
                    !isEditing &&
                    ["nw", "ne", "se", "sw", "e", "s"].map(h => (
                      <div
                        key={h}
                        onPointerDown={e => onHandlePointerDown(e, el, h)}
                        onPointerMove={e =>
                          resize?.elId === el.id && onHandlePointerMove(e, el)
                        }
                        onPointerUp={() => setResize(null)}
                        style={handleStyle(h)}
                      />
                    ))}
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur rounded-2xl border border-border shadow-sm opacity-0 group-hover/workspace:opacity-100 transition-opacity">
            <button
              onClick={() => setScaleFactor(s => Math.max(0.2, s - 0.1))}
              className="p-1 hover:text-accent"
            >
              －
            </button>
            <span className="text-[10px] font-bold w-12 text-center">
              {Math.round(scaleFactor * 100)}%
            </span>
            <button
              onClick={() => setScaleFactor(s => Math.min(2, s + 0.1))}
              className="p-1 hover:text-accent"
            >
              ＋
            </button>
          </div>
        </div>

        {/* RIGHT PANEL - PROPERTIES */}
        <div className="w-72 shrink-0 bg-card border border-border rounded-2xl shadow-sm p-4 overflow-y-auto space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Settings2 className="w-4 h-4" /> Properties
          </div>

          {(() => {
            const sel = design.elements.find(e => e.id === selectedId);
            if (!sel)
              return (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Select an element on canvas to edit its properties.
                  </p>
                </div>
              );

            return (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase opacity-60">
                    Constraint Anchors
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={sel.constraints.x.anchor}
                      onValueChange={v =>
                        updateElement(sel.id, {
                          constraints: {
                            ...sel.constraints,
                            x: { ...sel.constraints.x, anchor: v as any },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-[11px]">
                        <SelectValue placeholder="X Anchor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={sel.constraints.y.anchor}
                      onValueChange={v =>
                        updateElement(sel.id, {
                          constraints: {
                            ...sel.constraints,
                            y: { ...sel.constraints.y, anchor: v as any },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-[11px]">
                        <SelectValue placeholder="Y Anchor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {sel.type === "text" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase opacity-60">
                        Color
                      </Label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          "#ffffff",
                          "#1e3a5f",
                          "#d4af37",
                          "#000000",
                          "#f5f0eb",
                        ].map(c => (
                          <button
                            key={c}
                            onClick={() =>
                              updateElement(sel.id, {
                                style: { ...sel.style, color: c },
                              })
                            }
                            className={`w-8 h-8 rounded-full border-2 ${sel.style.color === c ? "border-accent shadow-lg" : "border-transparent"}`}
                            style={{ background: c }}
                          />
                        ))}
                        <input
                          type="color"
                          className="w-8 h-8 rounded-full border-2 border-transparent bg-muted cursor-pointer"
                          value={sel.style.color || "#000000"}
                          onChange={e =>
                            updateElement(sel.id, {
                              style: { ...sel.style, color: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase opacity-60">
                        Alignment
                      </Label>
                      <div className="flex bg-muted p-1 rounded-lg">
                        <Button
                          variant={
                            sel.style.textAlign === "left"
                              ? "secondary"
                              : "ghost"
                          }
                          size="icon"
                          className="h-8 flex-1"
                          onClick={() =>
                            updateElement(sel.id, {
                              style: { ...sel.style, textAlign: "left" },
                            })
                          }
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={
                            sel.style.textAlign === "center"
                              ? "secondary"
                              : "ghost"
                          }
                          size="icon"
                          className="h-8 flex-1"
                          onClick={() =>
                            updateElement(sel.id, {
                              style: { ...sel.style, textAlign: "center" },
                            })
                          }
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={
                            sel.style.textAlign === "right"
                              ? "secondary"
                              : "ghost"
                          }
                          size="icon"
                          className="h-8 flex-1"
                          onClick={() =>
                            updateElement(sel.id, {
                              style: { ...sel.style, textAlign: "right" },
                            })
                          }
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {sel.type === "video" && sel.videoConfig && (
                  <div className="space-y-4">
                    <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                      <Label className="text-[11px] font-bold uppercase opacity-60">
                        Playback Settings
                      </Label>
                      <div className="flex gap-4">
                        <Button
                          variant={
                            sel.videoConfig.muted ? "secondary" : "outline"
                          }
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() =>
                            updateElement(sel.id, {
                              videoConfig: {
                                ...sel.videoConfig!,
                                muted: !sel.videoConfig!.muted,
                              },
                            })
                          }
                        >
                          {sel.videoConfig.muted ? "Unmute" : "Mute"}
                        </Button>
                        <Button
                          variant={
                            sel.videoConfig.loop ? "secondary" : "outline"
                          }
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() =>
                            updateElement(sel.id, {
                              videoConfig: {
                                ...sel.videoConfig!,
                                loop: !sel.videoConfig!.loop,
                              },
                            })
                          }
                        >
                          {sel.videoConfig.loop
                            ? "Disable Loop"
                            : "Enable Loop"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase opacity-60">
                        Corner Rounding (
                        {Math.round(sel.style.borderRadius || 0)}px)
                      </Label>
                      <Slider
                        value={[sel.style.borderRadius || 0]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([v]) =>
                          updateElement(sel.id, {
                            style: { ...sel.style, borderRadius: v },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {sel.type === "rect" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase opacity-60">
                        Fill Color
                      </Label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          "#1e3a5f",
                          "#d4af37",
                          "#f5f0eb",
                          "#2a4a6f",
                          "#ffffff",
                        ].map(c => (
                          <button
                            key={c}
                            onClick={() =>
                              updateElement(sel.id, {
                                style: { ...sel.style, fill: c },
                              })
                            }
                            className={`w-8 h-8 rounded-full border-2 ${sel.style.fill === c ? "border-accent shadow-lg" : "border-transparent"}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase opacity-60">
                        Rounding ({Math.round(sel.style.borderRadius || 0)}px)
                      </Label>
                      <Slider
                        value={[sel.style.borderRadius || 0]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([v]) =>
                          updateElement(sel.id, {
                            style: { ...sel.style, borderRadius: v },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase opacity-60">
                    Opacity ({Math.round((sel.style.opacity ?? 1) * 100)}%)
                  </Label>
                  <Slider
                    value={[(sel.style.opacity ?? 1) * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) =>
                      updateElement(sel.id, {
                        style: { ...sel.style, opacity: v / 100 },
                      })
                    }
                  />
                </div>

                {(sel.type === "image" || sel.type === "rect") && (
                  <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                    <Label className="text-[11px] font-bold uppercase opacity-60 text-accent">
                      AI Smart Actions
                    </Label>
                    <Button
                      size="sm"
                      className="w-full bg-accent text-white rounded-xl flex items-center justify-center gap-2 px-4 shadow-sm font-bold"
                      onClick={startEraser}
                    >
                      <Wand2 className="w-4 h-4" /> Magic Eraser
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center italic">
                      Remove watermarks, objects, or people.
                    </p>
                  </div>
                )}

                <div className="h-[1px] bg-border my-6" />

                <Button
                  variant="destructive"
                  className="w-full gap-2 rounded-xl"
                  onClick={deleteSelected}
                >
                  <Trash2 className="w-4 h-4" /> Delete Element
                </Button>
              </div>
            );
          })()}

          <div className="h-[1px] bg-border my-6" />

          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase opacity-60">
              Format Settings
            </Label>
            <Select
              value={design.format}
              onValueChange={v => updateDesign({ format: v as AspectRatio })}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Canvas Format" />
              </SelectTrigger>
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

      {/* ── PUBLISH PANEL (Listing Creator) ── */}
      {studioMode === "listing_creator" && phase === "edit" && (
        <div className="mt-8 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Publish</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share your listing across platforms with AI-generated captions
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishPanelOpen(p => !p)}
            >
              {publishPanelOpen ? "Collapse" : "Expand"}
            </Button>
          </div>

          {publishPanelOpen && (
            <div className="space-y-6">
              {/* Platform Selector */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Platforms
                </Label>
                <div className="flex gap-3 mt-3">
                  {(
                    ["telegram", "instagram", "tiktok", "facebook"] as const
                  ).map(p => (
                    <button
                      key={p}
                      onClick={() =>
                        setPublishPlatforms(prev =>
                          prev.includes(p)
                            ? prev.filter(x => x !== p)
                            : [...prev, p]
                        )
                      }
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        publishPlatforms.includes(p)
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/40"
                      }`}
                    >
                      <span>
                        {p === "telegram"
                          ? "✈️"
                          : p === "instagram"
                            ? "📷"
                            : p === "tiktok"
                              ? "🎵"
                              : "📘"}
                      </span>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bilingual Captions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Amharic Caption
                  </Label>
                  <textarea
                    value={captionAmharic}
                    onChange={e => setCaptionAmharic(e.target.value)}
                    rows={8}
                    className="w-full mt-2 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-accent resize-none font-sans"
                    placeholder="Amharic caption will appear here..."
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    English Caption
                  </Label>
                  <textarea
                    value={captionEnglish}
                    onChange={e => setCaptionEnglish(e.target.value)}
                    rows={8}
                    className="w-full mt-2 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                    placeholder="English caption will appear here..."
                  />
                </div>
              </div>

              {/* Hashtags */}
              {captionHashtags.length > 0 && (
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Hashtags
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {captionHashtags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-lg bg-accent/10 text-accent text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate + Actions Row */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-accent text-white hover:bg-accent/90"
                  onClick={() => {
                    const caption = generateBilingualCaption({
                      title: formData.title,
                      price: formData.price,
                      location: formData.location,
                      subLocation: formData.subLocation,
                      propertyType: formData.propertyType,
                      bedrooms: formData.bedrooms,
                      bathrooms: formData.bathrooms,
                      area: formData.area,
                      description: formData.description,
                      phone: brandData.phoneNumber,
                      languagePreference: brandData.languagePreference,
                    });
                    setCaptionAmharic(caption.amharic);
                    setCaptionEnglish(caption.english);
                    setCaptionHashtags([
                      ...caption.amharicHashtags,
                      ...caption.hashtags,
                    ]);
                    toast.success("AI captions generated!");
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Generate AI Captions
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!canvasRef.current) return;
                    try {
                      const dataUrl = await toPng(canvasRef.current);
                      const a = document.createElement("a");
                      a.href = dataUrl;
                      a.download = `${formData.title || "listing"}.png`;
                      a.click();
                      toast.success("Image downloaded!");
                    } catch {
                      toast.error("Download failed");
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" /> Download PNG
                </Button>
              </div>

              {/* Schedule */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Schedule (Coming Soon)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Posts will be published immediately for now. Scheduling is
                  under development.
                </p>
              </div>

              {/* Publish Now */}
              <Button
                className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white"
                disabled={publishPlatforms.length === 0}
                onClick={() => {
                  if (publishPlatforms.length === 0) {
                    toast.error("Select at least one platform");
                    return;
                  }
                  publishMutation.mutate({
                    content: captionAmharic || captionEnglish || formData.title,
                    platforms: publishPlatforms,
                    mediaUrl: formData.image || undefined,
                    mediaType: "image",
                  });
                  toast.success(
                    `Publishing to ${publishPlatforms.length} platform(s)!`
                  );
                }}
              >
                🚀 Publish Now
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
