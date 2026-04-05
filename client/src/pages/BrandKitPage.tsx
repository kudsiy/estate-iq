import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Upload,
  X,
  Type,
  Palette,
  Image as ImageIcon,
  Check,
  Phone,
  Globe,
  MapPin,
  Languages,
  User,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BrandColor {
  hex: string;
  name: string;
}
interface BrandFont {
  family: string;
  label: string;
}
interface BrandLogo {
  src: string;
  name: string;
}

interface KitData {
  name: string;
  logos: BrandLogo[];
  colors: BrandColor[];
  fonts: BrandFont[];
  phoneNumber: string;
  whatsappNumber: string;
  facebookUrl: string;
  instagramHandle: string;
  tiktokHandle: string;
  telegramChannel: string;
  agentPortrait: string;
  tagline: string;
  targetAreas: string[];
  languagePreference: "amharic" | "english" | "both";
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FONT_OPTIONS: BrandFont[] = [
  { family: "Poppins, sans-serif", label: "Poppins" },
  { family: "Montserrat, sans-serif", label: "Montserrat" },
  { family: "Raleway, sans-serif", label: "Raleway" },
  { family: "Lato, sans-serif", label: "Lato" },
  { family: "Open Sans, sans-serif", label: "Open Sans" },
  { family: "Playfair Display, serif", label: "Playfair Display" },
  { family: "Merriweather, serif", label: "Merriweather" },
  { family: "Georgia, serif", label: "Georgia" },
  { family: "Inter, sans-serif", label: "Inter" },
  { family: "Roboto, sans-serif", label: "Roboto" },
  { family: "Noto Sans Ethiopic, sans-serif", label: "Noto Sans Ethiopic" },
  { family: "Noto Serif Ethiopic, serif", label: "Noto Serif Ethiopic" },
  { family: "Courier New, monospace", label: "Courier New" },
];

const DEFAULT_COLORS: BrandColor[] = [
  { hex: "#1e3a5f", name: "Deep Blue" },
  { hex: "#d4af37", name: "Gold" },
  { hex: "#ffffff", name: "White" },
];

const ETHIOPIAN_SUBCITIES = [
  "Bole",
  "Kirkos",
  "Yeka",
  "Arada",
  "Gulele",
  "Lideta",
  "Kolfe Keranio",
  "Nifas Silk-Lafto",
  "Akaki Kality",
  "Addis Ketema",
  "Lemi Kura",
];

const EMPTY_KIT: KitData = {
  name: "",
  logos: [],
  colors: DEFAULT_COLORS,
  fonts: [],
  phoneNumber: "",
  whatsappNumber: "",
  facebookUrl: "",
  instagramHandle: "",
  tiktokHandle: "",
  telegramChannel: "",
  agentPortrait: "",
  tagline: "",
  targetAreas: [],
  languagePreference: "both",
};

// ─── COLOR SWATCH ─────────────────────────────────────────────────────────────

function ColorSwatch({
  color,
  onRemove,
  onRename,
}: {
  color: BrandColor;
  onRemove: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(color.name);

  return (
    <div className="flex flex-col items-center gap-1 group relative">
      <div
        className="w-12 h-12 rounded-xl border border-black/10 relative flex items-end justify-center pb-1"
        style={{ background: color.hex }}
      >
        <button
          onClick={onRemove}
          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/40 rounded-full items-center justify-center hidden group-hover:flex"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>
      </div>
      {editing ? (
        <input
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => {
            onRename(label);
            setEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              onRename(label);
              setEditing(false);
            }
          }}
          className="text-[10px] w-12 text-center border border-border rounded px-1 outline-none"
        />
      ) : (
        <span
          className="text-[10px] text-muted-foreground text-center w-12 truncate cursor-pointer hover:text-foreground"
          onClick={() => setEditing(true)}
        >
          {color.name || color.hex}
        </span>
      )}
    </div>
  );
}

// ─── KIT EDITOR MODAL ─────────────────────────────────────────────────────────

function KitModal({
  open,
  onClose,
  initial,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  initial: KitData | null;
  onSave: (data: KitData) => void;
  isSaving: boolean;
}) {
  const [kit, setKit] = useState<KitData>(initial ?? EMPTY_KIT);
  const [newColorHex, setNewColorHex] = useState("#1e3a5f");
  const [tab, setTab] = useState<
    "brand" | "contact" | "social" | "localization"
  >("brand");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  const setField = (k: keyof KitData, v: any) =>
    setKit(f => ({ ...f, [k]: v }));

  const addColor = () => {
    if (kit.colors.some(c => c.hex === newColorHex)) return;
    setField("colors", [...kit.colors, { hex: newColorHex, name: "" }]);
  };

  const removeColor = (i: number) =>
    setField(
      "colors",
      kit.colors.filter((_, j) => j !== i)
    );

  const renameColor = (i: number, name: string) =>
    setField(
      "colors",
      kit.colors.map((c, j) => (j === i ? { ...c, name } : c))
    );

  const toggleFont = (font: BrandFont) => {
    const has = kit.fonts.some(f => f.family === font.family);
    setField(
      "fonts",
      has
        ? kit.fonts.filter(f => f.family !== font.family)
        : [...kit.fonts, font]
    );
  };

  const addLogo = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setField("logos", [
          ...kit.logos,
          { src: reader.result as string, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const addPortrait = (files: FileList) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setField("agentPortrait", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleTargetArea = (area: string) => {
    const has = kit.targetAreas.includes(area);
    setField(
      "targetAreas",
      has ? kit.targetAreas.filter(a => a !== area) : [...kit.targetAreas, area]
    );
  };

  const addCustomTargetArea = (area: string) => {
    const trimmed = area.trim();
    if (trimmed && !kit.targetAreas.includes(trimmed)) {
      setField("targetAreas", [...kit.targetAreas, trimmed]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial?.name ? `Edit: ${initial.name}` : "New Brand Kit"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mt-2 bg-muted/50 rounded-lg p-1">
          {(
            [
              { key: "brand", label: "Brand", icon: Palette },
              { key: "contact", label: "Contact", icon: Phone },
              { key: "social", label: "Social", icon: Globe },
              { key: "localization", label: "Local", icon: MapPin },
            ] as const
          ).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === t.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-5 pt-2">
          {/* ── BRAND TAB ── */}
          {tab === "brand" && (
            <>
              <div>
                <Label className="text-xs">Brand kit name *</Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="e.g. Estate IQ – Primary"
                  value={kit.name}
                  onChange={e => setField("name", e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Tagline</Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="e.g. Your trusted partner in Ethiopian real estate"
                  value={kit.tagline}
                  onChange={e => setField("tagline", e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Logos</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {kit.logos.map((logo, i) => (
                    <div
                      key={i}
                      className="relative group w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={logo.src}
                        alt={logo.name}
                        className="max-w-full max-h-full object-contain p-1"
                      />
                      <button
                        onClick={() =>
                          setField(
                            "logos",
                            kit.logos.filter((_, j) => j !== i)
                          )
                        }
                        className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors text-muted-foreground hover:text-accent"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[10px]">Upload</span>
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && addLogo(e.target.files)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Agent Portrait</Label>
                <div className="flex items-center gap-3 mt-2">
                  {kit.agentPortrait ? (
                    <div className="relative group w-16 h-16 rounded-xl border border-border bg-muted overflow-hidden">
                      <img
                        src={kit.agentPortrait}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setField("agentPortrait", "")}
                        className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : null}
                  <button
                    onClick={() => portraitInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />{" "}
                    {kit.agentPortrait ? "Change" : "Upload Portrait"}
                  </button>
                  <input
                    ref={portraitInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e =>
                      e.target.files && addPortrait(e.target.files)
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Colour palette</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {kit.colors.map((color, i) => (
                    <ColorSwatch
                      key={i}
                      color={color}
                      onRemove={() => removeColor(i)}
                      onRename={n => renameColor(i, n)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={e => setNewColorHex(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={newColorHex}
                    onChange={e => setNewColorHex(e.target.value)}
                    className="h-8 text-sm w-28 font-mono"
                    maxLength={7}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addColor}
                    className="h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add colour
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">
                  Typography — select fonts for your brand
                </Label>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {FONT_OPTIONS.map(font => {
                    const selected = kit.fonts.some(
                      f => f.family === font.family
                    );
                    return (
                      <button
                        key={font.family}
                        onClick={() => toggleFont(font)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                          selected
                            ? "border-accent bg-accent/5 text-foreground"
                            : "border-border hover:border-accent/50 text-muted-foreground"
                        }`}
                        style={{ fontFamily: font.family }}
                      >
                        <span>{font.label}</span>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── CONTACT TAB ── */}
          {tab === "contact" && (
            <>
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These details are auto-applied to all your designs, captions,
                  and CTA buttons. Set them once and forget.
                </p>
              </div>
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="+251 9XX XXX XXX"
                  value={kit.phoneNumber}
                  onChange={e => setField("phoneNumber", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">WhatsApp Number</Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="+251 9XX XXX XXX (with country code)"
                  value={kit.whatsappNumber}
                  onChange={e => setField("whatsappNumber", e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── SOCIAL TAB ── */}
          {tab === "social" && (
            <>
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Social accounts appear on templates and are used for AI
                  caption generation with platform-specific hashtags.
                </p>
              </div>
              <div>
                <Label className="text-xs">Facebook Page URL</Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="https://facebook.com/yourpage"
                  value={kit.facebookUrl}
                  onChange={e => setField("facebookUrl", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Instagram Handle</Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="@yourhandle"
                  value={kit.instagramHandle}
                  onChange={e =>
                    setField(
                      "instagramHandle",
                      e.target.value.replace(/^@/, "")
                    )
                  }
                />
              </div>
              <div>
                <Label className="text-xs">TikTok Handle</Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="@yourhandle"
                  value={kit.tiktokHandle}
                  onChange={e =>
                    setField("tiktokHandle", e.target.value.replace(/^@/, ""))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Telegram Channel</Label>
                <Input
                  className="mt-1 h-8 text-sm"
                  placeholder="@yourchannel"
                  value={kit.telegramChannel}
                  onChange={e =>
                    setField(
                      "telegramChannel",
                      e.target.value.replace(/^@/, "")
                    )
                  }
                />
              </div>
            </>
          )}

          {/* ── LOCALIZATION TAB ── */}
          {tab === "localization" && (
            <>
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Target areas and language preference guide AI caption
                  generation for Ethiopian audiences.
                </p>
              </div>
              <div>
                <Label className="text-xs">Caption Language</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(
                    [
                      { key: "amharic", label: "Amharic" },
                      { key: "english", label: "English" },
                      { key: "both", label: "Both" },
                    ] as const
                  ).map(lang => (
                    <button
                      key={lang.key}
                      onClick={() => setField("languagePreference", lang.key)}
                      className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                        kit.languagePreference === lang.key
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/50"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">
                  Target Areas (subcities you operate in)
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ETHIOPIAN_SUBCITIES.map(area => {
                    const selected = kit.targetAreas.includes(area);
                    return (
                      <button
                        key={area}
                        onClick={() => toggleTargetArea(area)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selected
                            ? "bg-accent text-white"
                            : "bg-muted text-muted-foreground hover:bg-accent/10 hover:text-accent"
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-3">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Add custom area (e.g. Bole Atlas)"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        addCustomTargetArea(
                          (e.target as HTMLInputElement).value
                        );
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
                {kit.targetAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {kit.targetAreas.map(area => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent font-medium"
                      >
                        {area}
                        <button
                          onClick={() => toggleTargetArea(area)}
                          className="hover:text-destructive"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-accent hover:bg-accent/90 text-white"
              onClick={() => onSave(kit)}
              disabled={isSaving || !kit.name.trim()}
            >
              {isSaving ? "Saving…" : initial ? "Update Kit" : "Create Kit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── KIT CARD ─────────────────────────────────────────────────────────────────

function KitCard({
  kit,
  onEdit,
  onDelete,
}: {
  kit: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors: BrandColor[] = (kit.colors as BrandColor[]) ?? [];
  const fonts: BrandFont[] = (kit.fonts as BrandFont[]) ?? [];
  const logos: BrandLogo[] = (kit.logos as BrandLogo[]) ?? [];
  const targetAreas: string[] = (kit.targetAreas as string[]) ?? [];

  const socialCount = [
    kit.facebookUrl,
    kit.instagramHandle,
    kit.tiktokHandle,
    kit.telegramChannel,
  ].filter(Boolean).length;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{kit.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {colors.length} colours · {fonts.length} fonts · {logos.length}{" "}
              logos
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      </div>

      {colors.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Colours
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {colors.map((c, i) => (
              <div
                key={i}
                title={c.name || c.hex}
                className="w-8 h-8 rounded-lg border border-black/10 shrink-0"
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {fonts.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Typography
          </p>
          <div className="flex flex-wrap gap-1">
            {fonts.map((f, i) => (
              <span
                key={i}
                className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                style={{ fontFamily: f.family }}
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {logos.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Logos
          </p>
          <div className="flex gap-2">
            {logos.slice(0, 4).map((logo, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg border border-border bg-muted/50 flex items-center justify-center overflow-hidden p-1"
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ))}
            {logos.length > 4 && (
              <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{logos.length - 4}
              </div>
            )}
          </div>
        </div>
      )}

      {(kit.phoneNumber || kit.whatsappNumber) && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Contact
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {kit.phoneNumber && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {kit.phoneNumber}
              </span>
            )}
            {kit.whatsappNumber && (
              <span className="flex items-center gap-1">
                💬 {kit.whatsappNumber}
              </span>
            )}
          </div>
        </div>
      )}

      {socialCount > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Social
          </p>
          <div className="flex flex-wrap gap-1.5">
            {kit.instagramHandle && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                📷 {kit.instagramHandle}
              </span>
            )}
            {kit.tiktokHandle && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                🎵 {kit.tiktokHandle}
              </span>
            )}
            {kit.telegramChannel && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                ✈️ {kit.telegramChannel}
              </span>
            )}
            {kit.facebookUrl && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                📘 Facebook
              </span>
            )}
          </div>
        </div>
      )}

      {targetAreas.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Target Areas
          </p>
          <div className="flex flex-wrap gap-1">
            {targetAreas.slice(0, 5).map((a: string, i: number) => (
              <span
                key={i}
                className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full"
              >
                {a}
              </span>
            ))}
            {targetAreas.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{targetAreas.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {kit.languagePreference && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Language
          </p>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Languages className="w-3 h-3" />
            {kit.languagePreference === "both"
              ? "Amharic + English"
              : kit.languagePreference === "amharic"
                ? "Amharic"
                : "English"}
          </span>
        </div>
      )}

      {kit.tagline && (
        <p className="text-xs text-muted-foreground italic">"{kit.tagline}"</p>
      )}

      {colors.length === 0 &&
        fonts.length === 0 &&
        logos.length === 0 &&
        !kit.phoneNumber &&
        !kit.tagline && (
          <p className="text-xs text-muted-foreground italic">
            No content yet — click edit to set up your brand
          </p>
        )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function BrandKitPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const { data: kits = [], refetch } = trpc.crm.brandKits.list.useQuery();

  const createMutation = trpc.crm.brandKits.create.useMutation({
    onSuccess: () => {
      toast.success("Brand kit created!");
      setModalOpen(false);
      refetch();
    },
    onError: () => toast.error("Failed to create brand kit"),
  });
  const updateMutation = trpc.crm.brandKits.update.useMutation({
    onSuccess: () => {
      toast.success("Brand kit updated");
      setEditTarget(null);
      refetch();
    },
    onError: () => toast.error("Update failed"),
  });
  const deleteMutation = trpc.crm.brandKits.delete.useMutation({
    onSuccess: () => {
      toast.success("Brand kit deleted");
      refetch();
    },
    onError: () => toast.error("Delete failed"),
  });

  const handleSave = (data: KitData) => {
    const payload = {
      name: data.name,
      logos: data.logos,
      colors: data.colors,
      fonts: data.fonts,
      phoneNumber: data.phoneNumber || undefined,
      whatsappNumber: data.whatsappNumber || undefined,
      facebookUrl: data.facebookUrl || undefined,
      instagramHandle: data.instagramHandle || undefined,
      tiktokHandle: data.tiktokHandle || undefined,
      telegramChannel: data.telegramChannel || undefined,
      agentPortrait: data.agentPortrait || undefined,
      tagline: data.tagline || undefined,
      targetAreas: data.targetAreas,
      languagePreference: data.languagePreference,
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload as any });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const openEdit = (kit: any) => {
    setEditTarget({
      ...kit,
      initialData: {
        name: kit.name ?? "",
        logos: (kit.logos as BrandLogo[]) ?? [],
        colors: (kit.colors as BrandColor[]) ?? DEFAULT_COLORS,
        fonts: (kit.fonts as BrandFont[]) ?? [],
        phoneNumber: kit.phoneNumber ?? "",
        whatsappNumber: kit.whatsappNumber ?? "",
        facebookUrl: kit.facebookUrl ?? "",
        instagramHandle: kit.instagramHandle ?? "",
        tiktokHandle: kit.tiktokHandle ?? "",
        telegramChannel: kit.telegramChannel ?? "",
        agentPortrait: kit.agentPortrait ?? "",
        tagline: kit.tagline ?? "",
        targetAreas: (kit.targetAreas as string[]) ?? [],
        languagePreference:
          (kit.languagePreference as "amharic" | "english" | "both") ?? "both",
      },
    });
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          {!embedded && (
            <h1 className="text-2xl font-semibold text-foreground">
              Brand Kit
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Store your brand identity — logos, colours, fonts, contact info,
            social accounts, and localization settings
          </p>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90 text-white"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Brand Kit
        </Button>
      </div>

      {kits.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: ImageIcon,
              title: "Logo & Portrait",
              desc: "Upload your company logo and agent portrait. Auto-applied to all designs.",
            },
            {
              icon: Palette,
              title: "Colour & Typography",
              desc: "Define your brand colours and fonts. Every template uses these exclusively.",
            },
            {
              icon: Phone,
              title: "Contact & Social",
              desc: "Phone, WhatsApp, Instagram, TikTok, Telegram — one setup, everywhere.",
            },
          ].map(f => (
            <div
              key={f.title}
              className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-muted-foreground opacity-40" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            No brand kits yet
          </p>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs">
            Create your first brand kit to keep all your designs consistent and
            on-brand
          </p>
          <Button
            size="sm"
            className="bg-accent hover:bg-accent/90 text-white"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Brand Kit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kits.map(kit => (
            <KitCard
              key={kit.id}
              kit={kit}
              onEdit={() => openEdit(kit)}
              onDelete={() => {
                if (confirm(`Delete "${kit.name}"?`))
                  deleteMutation.mutate(kit.id);
              }}
            />
          ))}
        </div>
      )}

      <KitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={null}
        onSave={handleSave}
        isSaving={createMutation.isPending}
      />

      {editTarget && (
        <KitModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={editTarget.initialData}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      )}
    </>
  );

  if (embedded) return content;

  return <DashboardLayout>{content}</DashboardLayout>;
}
