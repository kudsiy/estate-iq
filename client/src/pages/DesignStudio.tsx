import { useState, useRef, useCallback, useEffect } from "react";
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
  Copy, ChevronUp, ChevronDown, Lock, Unlock, Plus, LayoutTemplate,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ElemType = "text" | "rect" | "ellipse" | "image";

interface CanvasElement {
  id: string;
  type: ElemType;
  x: number; y: number; width: number; height: number;
  text?: string; fontSize?: number; fontFamily?: string;
  fontWeight?: "normal" | "bold"; italic?: boolean;
  color?: string; textAlign?: "left" | "center" | "right";
  fill?: string; stroke?: string; strokeWidth?: number; borderRadius?: number;
  opacity?: number; locked?: boolean; src?: string;
}

interface Template {
  id: string; name: string; category: string; emoji: string;
  width: number; height: number; bgColor: string;
  elements: Omit<CanvasElement, "id">[];
}

interface DragState {
  active: boolean; elId: string;
  startCx: number; startCy: number; elX: number; elY: number;
}

interface ResizeState {
  active: boolean; elId: string; handle: string;
  startCx: number; startCy: number;
  elX: number; elY: number; elW: number; elH: number;
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: "property-poster", name: "Property Poster", category: "Print", emoji: "🏠",
    width: 600, height: 848, bgColor: "#1e3a5f",
    elements: [
      { type: "rect", x: 0, y: 0, width: 600, height: 540, fill: "#2a4a6f", borderRadius: 0 },
      { type: "text", x: 150, y: 215, width: 300, height: 60, text: "📷 Add property photo", fontSize: 16, color: "#6a8aaf", textAlign: "center" },
      { type: "rect", x: 0, y: 540, width: 600, height: 308, fill: "#1e3a5f", opacity: 0.98 },
      { type: "rect", x: 30, y: 556, width: 110, height: 30, fill: "#d4af37", borderRadius: 15 },
      { type: "text", x: 30, y: 559, width: 110, height: 24, text: "FOR SALE", fontSize: 12, fontWeight: "bold", color: "#1e3a5f", textAlign: "center" },
      { type: "text", x: 30, y: 602, width: 540, height: 75, text: "Luxury Villa\nBole, Addis Ababa", fontSize: 32, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      { type: "text", x: 30, y: 688, width: 480, height: 28, text: "4 Bed  ·  3 Bath  ·  280 sqm  ·  Garden", fontSize: 15, color: "#b0c4de", textAlign: "left" },
      { type: "text", x: 30, y: 726, width: 300, height: 38, text: "ETB 12,500,000", fontSize: 26, fontWeight: "bold", color: "#d4af37", textAlign: "left" },
      { type: "rect", x: 30, y: 778, width: 540, height: 1, fill: "#ffffff", opacity: 0.15 },
      { type: "text", x: 30, y: 794, width: 450, height: 24, text: "Estate IQ  ·  +251 91 234 5678  ·  info@estateiq.et", fontSize: 12, color: "#7a9ab8", textAlign: "left" },
    ],
  },
  {
    id: "instagram-post", name: "Instagram Post", category: "Social", emoji: "📸",
    width: 600, height: 600, bgColor: "#f5f0eb",
    elements: [
      { type: "rect", x: 0, y: 0, width: 600, height: 415, fill: "#d4c9bc" },
      { type: "text", x: 150, y: 168, width: 300, height: 55, text: "📷 Add photo here", fontSize: 18, color: "#9a8a7a", textAlign: "center" },
      { type: "rect", x: 0, y: 415, width: 600, height: 185, fill: "#1e3a5f" },
      { type: "rect", x: 0, y: 415, width: 600, height: 5, fill: "#d4af37" },
      { type: "text", x: 30, y: 435, width: 440, height: 48, text: "Modern Apartment in Kazanchis", fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      { type: "text", x: 30, y: 490, width: 380, height: 24, text: "2 Bed  ·  1 Bath  ·  ETB 5,200,000", fontSize: 14, color: "#a0b8d0", textAlign: "left" },
      { type: "rect", x: 445, y: 537, width: 130, height: 40, fill: "#d4af37", borderRadius: 8 },
      { type: "text", x: 445, y: 546, width: 130, height: 22, text: "View Listing →", fontSize: 13, fontWeight: "bold", color: "#1e3a5f", textAlign: "center" },
    ],
  },
  {
    id: "reel-thumbnail", name: "Reel / Story", category: "Social", emoji: "🎬",
    width: 338, height: 600, bgColor: "#0f1f35",
    elements: [
      { type: "rect", x: 0, y: 0, width: 338, height: 600, fill: "#1e3a5f" },
      { type: "rect", x: 18, y: 18, width: 302, height: 320, fill: "#2a4a6f", borderRadius: 16 },
      { type: "text", x: 68, y: 148, width: 202, height: 48, text: "📷 Property\nPhoto", fontSize: 17, color: "#6a8aaf", textAlign: "center" },
      { type: "rect", x: 18, y: 354, width: 60, height: 4, fill: "#d4af37" },
      { type: "text", x: 18, y: 370, width: 302, height: 75, text: "Dream Home\nNow Available!", fontSize: 28, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      { type: "text", x: 18, y: 456, width: 302, height: 28, text: "Bole, Addis Ababa", fontSize: 16, color: "#a0b8d0", textAlign: "left" },
      { type: "text", x: 18, y: 494, width: 200, height: 32, text: "ETB 8,700,000", fontSize: 22, fontWeight: "bold", color: "#d4af37", textAlign: "left" },
      { type: "rect", x: 18, y: 552, width: 302, height: 30, fill: "#d4af37", borderRadius: 6 },
      { type: "text", x: 18, y: 559, width: 302, height: 22, text: "Estate IQ  ·  +251 91 234 5678", fontSize: 12, fontWeight: "bold", color: "#1e3a5f", textAlign: "center" },
    ],
  },
  {
    id: "listing-flyer", name: "Listing Flyer", category: "Print", emoji: "📋",
    width: 600, height: 780, bgColor: "#ffffff",
    elements: [
      { type: "rect", x: 0, y: 0, width: 600, height: 80, fill: "#1e3a5f" },
      { type: "text", x: 30, y: 18, width: 340, height: 36, text: "PROPERTY LISTING", fontSize: 24, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      { type: "text", x: 30, y: 52, width: 300, height: 20, text: "Estate IQ Real Estate", fontSize: 13, color: "#a0b8d0", textAlign: "left" },
      { type: "rect", x: 0, y: 80, width: 600, height: 5, fill: "#d4af37" },
      { type: "rect", x: 30, y: 104, width: 540, height: 300, fill: "#e8e4df", borderRadius: 8 },
      { type: "text", x: 165, y: 218, width: 270, height: 48, text: "📷 Add property photo", fontSize: 17, color: "#9a8a7a", textAlign: "center" },
      { type: "text", x: 30, y: 424, width: 540, height: 38, text: "Yeka Sub-City, Woreda 7, Addis Ababa", fontSize: 20, fontWeight: "bold", color: "#1e3a5f", textAlign: "left" },
      { type: "rect", x: 30, y: 468, width: 540, height: 1, fill: "#e0e0e0" },
      { type: "text", x: 30, y: 484, width: 120, height: 18, text: "BEDROOMS", fontSize: 10, fontWeight: "bold", color: "#888888", textAlign: "left" },
      { type: "text", x: 180, y: 484, width: 120, height: 18, text: "BATHROOMS", fontSize: 10, fontWeight: "bold", color: "#888888", textAlign: "left" },
      { type: "text", x: 330, y: 484, width: 120, height: 18, text: "AREA", fontSize: 10, fontWeight: "bold", color: "#888888", textAlign: "left" },
      { type: "text", x: 30, y: 504, width: 120, height: 28, text: "4", fontSize: 22, fontWeight: "bold", color: "#1e3a5f", textAlign: "left" },
      { type: "text", x: 180, y: 504, width: 120, height: 28, text: "3", fontSize: 22, fontWeight: "bold", color: "#1e3a5f", textAlign: "left" },
      { type: "text", x: 330, y: 504, width: 120, height: 28, text: "280 m²", fontSize: 22, fontWeight: "bold", color: "#1e3a5f", textAlign: "left" },
      { type: "rect", x: 30, y: 544, width: 540, height: 1, fill: "#e0e0e0" },
      { type: "text", x: 30, y: 560, width: 540, height: 80, text: "Spacious family home with modern finishes. Open-plan kitchen, large garden, and 24/7 security. Close to schools and shopping centres.", fontSize: 14, color: "#555555", textAlign: "left" },
      { type: "rect", x: 30, y: 654, width: 540, height: 70, fill: "#f5f0eb", borderRadius: 8 },
      { type: "text", x: 46, y: 666, width: 200, height: 18, text: "ASKING PRICE", fontSize: 11, fontWeight: "bold", color: "#888888", textAlign: "left" },
      { type: "text", x: 46, y: 688, width: 280, height: 30, text: "ETB 14,000,000", fontSize: 26, fontWeight: "bold", color: "#1e3a5f", textAlign: "left" },
      { type: "text", x: 30, y: 740, width: 540, height: 24, text: "+251 91 234 5678  ·  info@estateiq.et  ·  www.estateiq.et", fontSize: 12, color: "#888888", textAlign: "center" },
    ],
  },
  {
    id: "facebook-post", name: "Facebook Post", category: "Social", emoji: "📘",
    width: 600, height: 315, bgColor: "#1e3a5f",
    elements: [
      { type: "rect", x: 0, y: 0, width: 315, height: 315, fill: "#2a4a6f" },
      { type: "text", x: 60, y: 126, width: 195, height: 55, text: "📷 Property\nPhoto", fontSize: 17, color: "#6a8aaf", textAlign: "center" },
      { type: "rect", x: 315, y: 0, width: 285, height: 315, fill: "#1e3a5f" },
      { type: "rect", x: 332, y: 28, width: 50, height: 4, fill: "#d4af37" },
      { type: "text", x: 332, y: 46, width: 248, height: 65, text: "Prime Location\nApartment", fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      { type: "text", x: 332, y: 120, width: 248, height: 24, text: "Bole, Addis Ababa", fontSize: 14, color: "#a0b8d0", textAlign: "left" },
      { type: "text", x: 332, y: 154, width: 248, height: 28, text: "ETB 6,800,000", fontSize: 20, fontWeight: "bold", color: "#d4af37", textAlign: "left" },
      { type: "text", x: 332, y: 192, width: 248, height: 22, text: "3 Bed  ·  2 Bath  ·  150 sqm", fontSize: 13, color: "#a0b8d0", textAlign: "left" },
      { type: "rect", x: 332, y: 250, width: 248, height: 38, fill: "#d4af37", borderRadius: 6 },
      { type: "text", x: 332, y: 260, width: 248, height: 22, text: "Contact Us Today", fontSize: 14, fontWeight: "bold", color: "#1e3a5f", textAlign: "center" },
    ],
  },
  {
    id: "blank", name: "Blank Canvas", category: "Custom", emoji: "⬜",
    width: 600, height: 600, bgColor: "#ffffff", elements: [],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID().split("-")[0];

function makeElements(template: Template): CanvasElement[] {
  return template.elements.map((el) => ({ ...el, id: uid() } as CanvasElement));
}

const FONTS = ["Poppins, sans-serif", "Georgia, serif", "Courier New, monospace", "Impact, sans-serif", "Arial, sans-serif"];
const FONT_LABELS: Record<string, string> = {
  "Poppins, sans-serif": "Poppins", "Georgia, serif": "Georgia",
  "Courier New, monospace": "Courier New", "Impact, sans-serif": "Impact", "Arial, sans-serif": "Arial",
};

const TEMPLATE_TYPE_MAP: Record<string, "poster" | "instagram" | "flyer" | "reel" | "email" | "other"> = {
  "property-poster": "poster",
  "instagram-post": "instagram",
  "listing-flyer": "flyer",
  "reel-thumbnail": "reel",
  "facebook-post": "other",
  blank: "other",
};

// ─── EXPORT TO PNG ────────────────────────────────────────────────────────────

async function exportAsPng(
  elements: CanvasElement[], bgColor: string,
  width: number, height: number, name: string,
) {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  for (const el of elements) {
    ctx.globalAlpha = el.opacity ?? 1;
    if (el.type === "rect") {
      ctx.fillStyle = el.fill ?? "#cccccc";
      const r = el.borderRadius ?? 0;
      if (r > 0) {
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, r);
        ctx.fill();
      } else {
        ctx.fillRect(el.x, el.y, el.width, el.height);
      }
    } else if (el.type === "ellipse") {
      ctx.fillStyle = el.fill ?? "#cccccc";
      ctx.beginPath();
      ctx.ellipse(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (el.type === "text" && el.text) {
      ctx.fillStyle = el.color ?? "#000000";
      const weight = el.fontWeight === "bold" ? "bold" : "normal";
      const style = el.italic ? "italic" : "normal";
      ctx.font = `${style} ${weight} ${el.fontSize ?? 16}px ${el.fontFamily ?? "Poppins, sans-serif"}`;
      ctx.textAlign = (el.textAlign ?? "left") as CanvasTextAlign;
      ctx.textBaseline = "top";
      const anchorX = el.textAlign === "center" ? el.x + el.width / 2
        : el.textAlign === "right" ? el.x + el.width : el.x;
      const lh = (el.fontSize ?? 16) * 1.4;
      const lines = el.text.split("\n");
      let y = el.y;
      for (const line of lines) {
        const words = line.split(" ");
        let cur = "";
        for (const word of words) {
          const test = cur ? cur + " " + word : word;
          if (ctx.measureText(test).width > el.width && cur) {
            ctx.fillText(cur, anchorX, y);
            cur = word; y += lh;
          } else { cur = test; }
        }
        ctx.fillText(cur, anchorX, y);
        y += lh;
      }
    } else if (el.type === "image" && el.src) {
      await new Promise<void>((res) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, el.x, el.y, el.width, el.height); res(); };
        img.onerror = () => res();
        img.src = el.src!;
      });
    }
    ctx.globalAlpha = 1;
  }

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url; a.download = `${name.replace(/\s+/g, "-")}.png`;
  a.click();
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function DesignStudio() {
  const [phase, setPhase] = useState<"pick" | "edit">("pick");
  const [template, setTemplate] = useState<Template>(TEMPLATES[0]);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [bgColor, setBgColor] = useState("#1e3a5f");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("Untitled Design");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [drag, setDrag] = useState<DragState | null>(null);
  const [resize, setResize] = useState<ResizeState | null>(null);
  const [scale, setScale] = useState(0.85);
  const [leftTab, setLeftTab] = useState<"templates" | "add">("templates");

  const canvasRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const createMutation = trpc.crm.designs.create.useMutation({
    onSuccess: () => toast.success("Design saved!"),
    onError: () => toast.error("Save failed"),
  });

  // ── helpers ──────────────────────────────────────────────────────────────
  const selected = elements.find((e) => e.id === selectedId) ?? null;
  const update = useCallback((id: string, patch: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((el) => el.id === id ? { ...el, ...patch } : el));
  }, []);
  const updateSelected = (patch: Partial<CanvasElement>) => { if (selectedId) update(selectedId, patch); };

  // ── pick template ─────────────────────────────────────────────────────────
  const pickTemplate = (t: Template) => {
    setTemplate(t);
    setBgColor(t.bgColor);
    setElements(makeElements(t));
    setDesignName(t.name);
    setSelectedId(null);
    setPhase("edit");
  };

  // ── add elements ──────────────────────────────────────────────────────────
  const addText = () => {
    const el: CanvasElement = {
      id: uid(), type: "text", x: 40, y: 40, width: 300, height: 50,
      text: "Click to edit text", fontSize: 24, fontFamily: "Poppins, sans-serif",
      fontWeight: "normal", color: "#1e3a5f", textAlign: "left",
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };
  const addRect = () => {
    const el: CanvasElement = {
      id: uid(), type: "rect", x: 60, y: 60, width: 200, height: 120,
      fill: "#d4af37", borderRadius: 8,
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };
  const addEllipse = () => {
    const el: CanvasElement = {
      id: uid(), type: "ellipse", x: 100, y: 100, width: 150, height: 150, fill: "#1e3a5f",
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };
  const addImage = (src: string) => {
    const el: CanvasElement = {
      id: uid(), type: "image", x: 30, y: 30, width: 300, height: 200, src,
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };

  // ── z-order ───────────────────────────────────────────────────────────────
  const moveUp = () => {
    if (!selectedId) return;
    setElements((p) => {
      const i = p.findIndex((e) => e.id === selectedId);
      if (i >= p.length - 1) return p;
      const n = [...p];
      [n[i], n[i + 1]] = [n[i + 1], n[i]];
      return n;
    });
  };
  const moveDown = () => {
    if (!selectedId) return;
    setElements((p) => {
      const i = p.findIndex((e) => e.id === selectedId);
      if (i <= 0) return p;
      const n = [...p];
      [n[i], n[i - 1]] = [n[i - 1], n[i]];
      return n;
    });
  };
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements((p) => p.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);
  const duplicate = () => {
    if (!selected) return;
    const el: CanvasElement = { ...selected, id: uid(), x: selected.x + 20, y: selected.y + 20 };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) deleteSelected();
      if (e.key === "Escape") { setSelectedId(null); setEditingId(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, deleteSelected]);

  // ── drag: element move ────────────────────────────────────────────────────
  const onElemPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (editingId === el.id) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedId(el.id);
    setDrag({ active: true, elId: el.id, startCx: e.clientX, startCy: e.clientY, elX: el.x, elY: el.y });
  };
  const onElemPointerMove = (e: React.PointerEvent, el: CanvasElement) => {
    if (!drag || drag.elId !== el.id) return;
    const dx = (e.clientX - drag.startCx) / scale;
    const dy = (e.clientY - drag.startCy) / scale;
    update(el.id, { x: Math.max(0, drag.elX + dx), y: Math.max(0, drag.elY + dy) });
  };
  const onElemPointerUp = () => setDrag(null);

  // ── drag: resize ──────────────────────────────────────────────────────────
  const onHandlePointerDown = (e: React.PointerEvent, el: CanvasElement, handle: string) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setResize({ active: true, elId: el.id, handle, startCx: e.clientX, startCy: e.clientY, elX: el.x, elY: el.y, elW: el.width, elH: el.height });
  };
  const onHandlePointerMove = (e: React.PointerEvent, el: CanvasElement) => {
    if (!resize || resize.elId !== el.id) return;
    const dx = (e.clientX - resize.startCx) / scale;
    const dy = (e.clientY - resize.startCy) / scale;
    const MIN = 20;
    let { elX: x, elY: y, elW: w, elH: h } = resize;
    if (resize.handle.includes("e")) w = Math.max(MIN, resize.elW + dx);
    if (resize.handle.includes("s")) h = Math.max(MIN, resize.elH + dy);
    if (resize.handle.includes("w")) { x = resize.elX + dx; w = Math.max(MIN, resize.elW - dx); }
    if (resize.handle.includes("n")) { y = resize.elY + dy; h = Math.max(MIN, resize.elH - dy); }
    update(el.id, { x, y, width: w, height: h });
  };
  const onHandlePointerUp = () => setResize(null);

  // ── text editing ──────────────────────────────────────────────────────────
  const startEditing = (el: CanvasElement) => {
    if (el.type !== "text") return;
    setEditingId(el.id);
    setEditingText(el.text ?? "");
  };
  const commitEdit = () => {
    if (editingId) update(editingId, { text: editingText });
    setEditingId(null);
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const save = () => {
    createMutation.mutate({
      type: TEMPLATE_TYPE_MAP[template.id] ?? "other",
      name: designName,
      template: template.id,
      content: { elements, bgColor, templateId: template.id },
    });
  };

  // ─── PHASE: TEMPLATE PICKER ───────────────────────────────────────────────
  if (phase === "pick") {
    const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));
    return (
      <DashboardLayout>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Design Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a template to start designing</p>
        </div>
        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">{cat}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {TEMPLATES.filter((t) => t.category === cat).map((t) => {
                const aspectRatio = t.height / t.width;
                return (
                  <button
                    key={t.id}
                    onClick={() => pickTemplate(t)}
                    className="group flex flex-col items-center gap-2 text-left focus:outline-none"
                  >
                    <div
                      className="w-full rounded-xl border-2 border-border group-hover:border-accent group-focus:border-accent transition-all overflow-hidden"
                      style={{ aspectRatio: `${t.width} / ${t.height}`, maxHeight: 200, background: t.bgColor }}
                    >
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {t.emoji}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.width} × {t.height}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </DashboardLayout>
    );
  }

  // ─── PHASE: EDITOR ────────────────────────────────────────────────────────
  const HANDLES = ["nw","n","ne","e","se","s","sw","w"];
  const handleStyle = (h: string): React.CSSProperties => {
    const top = h.includes("n") ? -5 : h.includes("s") ? "100%" : "50%";
    const left = h.includes("w") ? -5 : h.includes("e") ? "100%" : "50%";
    const cursors: Record<string,string> = {
      nw:"nw-resize",n:"n-resize",ne:"ne-resize",e:"e-resize",
      se:"se-resize",s:"s-resize",sw:"sw-resize",w:"w-resize",
    };
    return {
      position:"absolute", width:10, height:10, background:"#fff",
      border:"2px solid #1e3a5f", borderRadius:2, cursor:cursors[h],
      top: typeof top === "number" ? top : top,
      left: typeof left === "number" ? left : left,
      transform:"translate(-50%,-50%)", zIndex:10,
      marginLeft: h.includes("w") ? 0 : h.includes("e") ? 0 : undefined,
      marginTop: h.includes("n") ? 0 : h.includes("s") ? 0 : undefined,
    };
  };

  return (
    <DashboardLayout>
      {/* ── Top toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("pick")} className="text-muted-foreground">
            ← Templates
          </Button>
          <Input
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="h-8 w-48 text-sm font-medium border-0 bg-muted px-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 text-xs text-muted-foreground">
            <span>Zoom</span>
            <button onClick={() => setScale((s) => Math.max(0.25, s - 0.1))} className="px-1 hover:text-foreground">−</button>
            <span className="w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(2, s + 0.1))} className="px-1 hover:text-foreground">+</button>
          </div>
          <Button variant="outline" size="sm" onClick={save} disabled={createMutation.isPending}>
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save
          </Button>
          <Button size="sm" onClick={() => exportAsPng(elements, bgColor, template.width, template.height, designName)}
            className="bg-accent hover:bg-accent/90 text-white">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export PNG
          </Button>
        </div>
      </div>

      {/* ── 3-panel editor ──────────────────────────────────────────────── */}
      <div className="flex gap-4 h-[calc(100vh-190px)]">

        {/* LEFT PANEL */}
        <div className="w-56 shrink-0 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as any)}>
            <TabsList className="w-full rounded-none border-b border-border h-10">
              <TabsTrigger value="templates" className="flex-1 text-xs h-9 rounded-none">
                <LayoutTemplate className="w-3.5 h-3.5 mr-1" /> Templates
              </TabsTrigger>
              <TabsTrigger value="add" className="flex-1 text-xs h-9 rounded-none">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="flex-1 overflow-y-auto p-2 m-0">
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => pickTemplate(t)}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-muted transition-colors text-center">
                    <div className="w-full rounded-md flex items-center justify-center text-2xl"
                      style={{ aspectRatio: `${t.width}/${t.height}`, maxHeight:64, background: t.bgColor }}>
                      {t.emoji}
                    </div>
                    <span className="text-xs text-muted-foreground leading-tight">{t.name}</span>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="add" className="p-3 m-0 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Elements</p>
              {[
                { icon: Type, label: "Text", fn: addText },
                { icon: Square, label: "Rectangle", fn: addRect },
                { icon: Circle, label: "Circle", fn: addEllipse },
              ].map(({ icon: Icon, label, fn }) => (
                <button key={label} onClick={fn}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-left">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </button>
              ))}
              <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm cursor-pointer">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => addImage(r.result as string);
                  r.readAsDataURL(f);
                }} />
              </label>

              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Background</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border" />
                  <span className="text-xs text-muted-foreground">{bgColor}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* CANVAS WORKSPACE */}
        <div ref={workspaceRef}
          className="flex-1 bg-muted/40 rounded-xl border border-border overflow-auto flex items-start justify-center p-8"
          onClick={() => { setSelectedId(null); setEditingId(null); }}>
          <div
            ref={canvasRef}
            style={{
              width: template.width, height: template.height,
              background: bgColor, position: "relative",
              transform: `scale(${scale})`, transformOrigin: "top center",
              flexShrink: 0, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
          >
            {elements.map((el) => {
              const isSelected = el.id === selectedId;
              const isEditing = el.id === editingId;

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => onElemPointerDown(e, el)}
                  onPointerMove={(e) => onElemPointerMove(e, el)}
                  onPointerUp={onElemPointerUp}
                  onDoubleClick={() => startEditing(el)}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                  style={{
                    position: "absolute", left: el.x, top: el.y,
                    width: el.width, height: el.height,
                    opacity: el.opacity ?? 1,
                    cursor: el.locked ? "default" : "move",
                    outline: isSelected ? "2px dashed #1e3a5f" : "none",
                    outlineOffset: 1,
                    userSelect: "none",
                    zIndex: isSelected ? 999 : "auto",
                    // shape fills applied directly
                    ...(el.type === "rect" ? {
                      backgroundColor: el.fill ?? "transparent",
                      borderRadius: el.borderRadius ?? 0,
                      border: el.stroke ? `${el.strokeWidth ?? 1}px solid ${el.stroke}` : "none",
                    } : {}),
                    ...(el.type === "ellipse" ? {
                      backgroundColor: el.fill ?? "transparent",
                      borderRadius: "50%",
                      border: el.stroke ? `${el.strokeWidth ?? 1}px solid ${el.stroke}` : "none",
                    } : {}),
                    ...(el.type === "image" ? { overflow: "hidden" } : {}),
                  }}
                >
                  {/* TEXT */}
                  {el.type === "text" && !isEditing && (
                    <div style={{
                      width: "100%", height: "100%", overflow: "hidden",
                      fontSize: el.fontSize ?? 16,
                      fontFamily: el.fontFamily ?? "Poppins, sans-serif",
                      fontWeight: el.fontWeight ?? "normal",
                      fontStyle: el.italic ? "italic" : "normal",
                      color: el.color ?? "#000000",
                      textAlign: el.textAlign ?? "left",
                      whiteSpace: "pre-wrap", wordBreak: "break-word",
                      lineHeight: 1.4, pointerEvents: "none",
                    }}>
                      {el.text}
                    </div>
                  )}

                  {/* TEXT EDITING OVERLAY */}
                  {el.type === "text" && isEditing && (
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={commitEdit}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%",
                        resize: "none", border: "2px solid #d4af37", outline: "none",
                        background: "rgba(255,255,255,0.95)", padding: 4,
                        fontSize: el.fontSize ?? 16, fontFamily: el.fontFamily ?? "Poppins, sans-serif",
                        fontWeight: el.fontWeight ?? "normal", fontStyle: el.italic ? "italic" : "normal",
                        color: el.color ?? "#000", textAlign: el.textAlign ?? "left",
                        lineHeight: 1.4, zIndex: 1000, boxSizing: "border-box",
                      }}
                    />
                  )}

                  {/* IMAGE */}
                  {el.type === "image" && el.src && (
                    <img src={el.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                  )}

                  {/* RESIZE HANDLES */}
                  {isSelected && !isEditing && HANDLES.map((h) => (
                    <div key={h} style={handleStyle(h)}
                      onPointerDown={(e) => onHandlePointerDown(e, el, h)}
                      onPointerMove={(e) => onHandlePointerMove(e, el)}
                      onPointerUp={onHandlePointerUp}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL — PROPERTIES */}
        <div className="w-60 shrink-0 bg-card border border-border rounded-xl overflow-y-auto">
          {selected ? (
            <div className="p-4 space-y-4">
              {/* Element actions */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Element</p>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { icon: ChevronUp, fn: moveUp, title: "Bring forward" },
                    { icon: ChevronDown, fn: moveDown, title: "Send backward" },
                    { icon: Copy, fn: duplicate, title: "Duplicate" },
                    { icon: Trash2, fn: deleteSelected, title: "Delete" },
                  ].map(({ icon: Icon, fn, title }) => (
                    <button key={title} onClick={fn} title={title}
                      className="flex items-center justify-center h-8 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Position & size */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Position & Size</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "X", key: "x" }, { label: "Y", key: "y" },
                    { label: "W", key: "width" }, { label: "H", key: "height" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Input type="number" className="h-7 text-xs mt-0.5"
                        value={Math.round((selected as any)[key])}
                        onChange={(e) => updateSelected({ [key]: Number(e.target.value) } as any)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Opacity */}
              <div>
                <Label className="text-xs text-muted-foreground">Opacity {Math.round((selected.opacity ?? 1) * 100)}%</Label>
                <Slider className="mt-2" min={0} max={1} step={0.01}
                  value={[selected.opacity ?? 1]}
                  onValueChange={([v]) => updateSelected({ opacity: v })} />
              </div>

              {/* Text properties */}
              {selected.type === "text" && (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Typography</p>
                    <Select value={selected.fontFamily ?? "Poppins, sans-serif"}
                      onValueChange={(v) => updateSelected({ fontFamily: v })}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONTS.map((f) => (
                          <SelectItem key={f} value={f} className="text-xs">{FONT_LABELS[f]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 mt-2">
                      <Input type="number" className="h-7 text-xs w-20"
                        value={selected.fontSize ?? 16}
                        onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} />
                      <button onClick={() => updateSelected({ fontWeight: selected.fontWeight === "bold" ? "normal" : "bold" })}
                        className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${selected.fontWeight === "bold" ? "bg-accent text-white" : "bg-muted"}`}>
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => updateSelected({ italic: !selected.italic })}
                        className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${selected.italic ? "bg-accent text-white" : "bg-muted"}`}>
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {(["left","center","right"] as const).map((a) => {
                        const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                        return (
                          <button key={a} onClick={() => updateSelected({ textAlign: a })}
                            className={`h-7 flex-1 rounded flex items-center justify-center transition-colors ${selected.textAlign === a ? "bg-accent text-white" : "bg-muted"}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Text Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={selected.color ?? "#000000"}
                        onChange={(e) => updateSelected({ color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-border" />
                      <Input value={selected.color ?? "#000000"}
                        onChange={(e) => updateSelected({ color: e.target.value })}
                        className="h-7 text-xs flex-1" />
                    </div>
                  </div>
                </>
              )}

              {/* Shape properties */}
              {(selected.type === "rect" || selected.type === "ellipse") && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Fill</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={selected.fill ?? "#cccccc"}
                      onChange={(e) => updateSelected({ fill: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-border" />
                    <Input value={selected.fill ?? "#cccccc"}
                      onChange={(e) => updateSelected({ fill: e.target.value })}
                      className="h-7 text-xs flex-1" />
                  </div>
                  {selected.type === "rect" && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">Corner radius {selected.borderRadius ?? 0}px</Label>
                      <Slider className="mt-2" min={0} max={100} step={1}
                        value={[selected.borderRadius ?? 0]}
                        onValueChange={([v]) => updateSelected({ borderRadius: v })} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Type className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Nothing selected</p>
              <p className="text-xs text-muted-foreground">Click an element on the canvas to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
