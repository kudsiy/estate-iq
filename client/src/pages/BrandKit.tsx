import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Sparkles, Upload, X, Check } from "lucide-react";
import { compressImage } from "@/lib/image";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BrandColor { hex: string; name: string }
interface BrandLogo  { src: string; name: string }
interface BrandFont  { family: string; label: string }
interface KitData {
  name: string;
  colors: BrandColor[];
  logos: BrandLogo[];
  fonts: BrandFont[];
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PRESET_FONTS: BrandFont[] = [
  { family: "Poppins, sans-serif",          label: "Poppins"       },
  { family: "Playfair Display, serif",      label: "Playfair Display" },
  { family: "Montserrat, sans-serif",       label: "Montserrat"    },
  { family: "Lato, sans-serif",             label: "Lato"          },
  { family: "Merriweather, serif",          label: "Merriweather"  },
  { family: "Noto Sans Ethiopic, sans-serif", label: "Noto Sans Ethiopic" },
  { family: "Roboto, sans-serif",           label: "Roboto"        },
  { family: "Georgia, serif",              label: "Georgia"        },
  { family: "Arial, sans-serif",           label: "Arial"          },
];

const STARTER_COLORS: BrandColor[] = [
  { hex: "#1e3a5f", name: "Deep Blue"   },
  { hex: "#d4af37", name: "Gold"        },
  { hex: "#ffffff", name: "White"       },
  { hex: "#2c3e50", name: "Charcoal"   },
];

const BLANK_KIT: KitData = {
  name: "My Brand Kit",
  colors: [...STARTER_COLORS],
  logos: [],
  fonts: [PRESET_FONTS[0]],
};

// ─── COLOR SWATCH ─────────────────────────────────────────────────────────────

function ColorSwatch({
  color, selected, onRemove, onClick,
}: { color: BrandColor; selected?: boolean; onRemove?: () => void; onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <div
        onClick={onClick}
        className={`w-12 h-12 rounded-xl border-2 cursor-pointer transition-transform hover:scale-105 relative ${selected ? "border-accent" : "border-border"}`}
        style={{ background: color.hex }}
      >
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <span className="text-xs text-muted-foreground text-center leading-tight max-w-[52px] truncate">
        {color.name}
      </span>
    </div>
  );
}

// ─── KIT EDITOR MODAL ────────────────────────────────────────────────────────

function KitEditor({
  open, initial, onClose, onSaved,
}: { open: boolean; initial: any | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [activeColorIdx, setActiveColorIdx] = useState<number | null>(null);

  const parseKit = (raw: any): KitData => ({
    name: raw?.name ?? "New Brand Kit",
    colors: Array.isArray(raw?.colors) ? raw.colors : [...STARTER_COLORS],
    logos: Array.isArray(raw?.logos) ? raw.logos : [],
    fonts: Array.isArray(raw?.fonts) ? raw.fonts : [PRESET_FONTS[0]],
  });

  const [kit, setKit] = useState<KitData>(() =>
    initial ? parseKit({ name: initial.name, colors: initial.colors, logos: initial.logos, fonts: initial.fonts })
    : { ...BLANK_KIT, colors: [...STARTER_COLORS], logos: [], fonts: [PRESET_FONTS[0]] }
  );

  const createMutation = trpc.crm.brandKits.create.useMutation({
    onSuccess: () => { toast.success("Brand kit created!"); onSaved(); onClose(); },
    onError: () => toast.error("Failed to save"),
  });
  const updateMutation = trpc.crm.brandKits.update.useMutation({
    onSuccess: () => { toast.success("Brand kit updated!"); onSaved(); onClose(); },
    onError: () => toast.error("Failed to update"),
  });

  const save = () => {
    if (!kit.name.trim()) { toast.error("Kit name is required"); return; }
    const data = { name: kit.name, colors: kit.colors, logos: kit.logos, fonts: kit.fonts };
    if (isEdit) updateMutation.mutate({ id: initial.id, data });
    else createMutation.mutate(data);
  };

  // Colors
  const addColor = () =>
    setKit((k) => ({ ...k, colors: [...k.colors, { hex: "#888888", name: "New color" }] }));
  const removeColor = (i: number) =>
    setKit((k) => ({ ...k, colors: k.colors.filter((_, j) => j !== i) }));
  const updateColor = (i: number, patch: Partial<BrandColor>) =>
    setKit((k) => ({ ...k, colors: k.colors.map((c, j) => j === i ? { ...c, ...patch } : c) }));

  // Logos
  const handleLogoUpload = async (files: FileList | null) => {
    if (!files) return;
    
    // Validate files before processing
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type)) {
        toast.error(`Only JPG, PNG or WebP accepted (${file.name} rejected)`);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Logo must be under 2MB (${file.name} rejected)`);
        return;
      }
    }

    const promises = Array.from(files).map(f => compressImage(f).then(src => ({ src, name: f.name.replace(/\.[^.]+$/, "") })));
    const newLogos = await Promise.all(promises);
    setKit((k) => ({ ...k, logos: [...k.logos, ...newLogos] }));
  };
  const removeLogo = (i: number) =>
    setKit((k) => ({ ...k, logos: k.logos.filter((_, j) => j !== i) }));

  // Fonts
  const toggleFont = (font: BrandFont) => {
    setKit((k) => {
      const has = k.fonts.some((f) => f.family === font.family);
      return { ...k, fonts: has ? k.fonts.filter((f) => f.family !== font.family) : [...k.fonts, font] };
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit brand kit" : "Create brand kit"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-1">
          {/* Name */}
          <div>
            <Label className="text-xs">Kit name</Label>
            <Input className="mt-1 h-8 text-sm" value={kit.name}
              onChange={(e) => setKit((k) => ({ ...k, name: e.target.value }))} />
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Colour palette</Label>
              <button onClick={addColor} className="text-xs text-accent hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add colour
              </button>
            </div>
            <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-xl border border-border">
              {kit.colors.map((c, i) => (
                <ColorSwatch
                  key={i} color={c} selected={activeColorIdx === i}
                  onRemove={() => removeColor(i)}
                  onClick={() => setActiveColorIdx(activeColorIdx === i ? null : i)}
                />
              ))}
              {kit.colors.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No colours — add one above</p>
              )}
            </div>
            {activeColorIdx !== null && kit.colors[activeColorIdx] && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-card rounded-xl border border-accent/30">
                <input
                  type="color"
                  value={kit.colors[activeColorIdx].hex}
                  onChange={(e) => updateColor(activeColorIdx, { hex: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                />
                <div className="flex-1">
                  <Label className="text-xs">Colour name</Label>
                  <Input className="mt-1 h-7 text-xs" value={kit.colors[activeColorIdx].name}
                    onChange={(e) => updateColor(activeColorIdx, { name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Hex</Label>
                  <Input className="mt-1 h-7 text-xs w-24" value={kit.colors[activeColorIdx].hex}
                    onChange={(e) => updateColor(activeColorIdx, { hex: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          {/* Logos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Logos</Label>
              <button onClick={() => logoInputRef.current?.click()}
                className="text-xs text-accent hover:underline flex items-center gap-1">
                <Upload className="w-3 h-3" /> Upload logo
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleLogoUpload(e.target.files)} />
            </div>
            {kit.logos.length === 0 ? (
              <button onClick={() => logoInputRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-accent/60 hover:text-accent transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-xs">Upload PNG, SVG or JPG</span>
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                {kit.logos.map((l, i) => (
                  <div key={i} className="relative group">
                    <div className="w-20 h-20 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center p-2">
                      <img src={l.src} alt={l.name} loading="lazy" className="max-w-full max-h-full object-contain" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-1 max-w-[80px] truncate">{l.name}</p>
                    <button onClick={() => removeLogo(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button onClick={() => logoInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-accent/60 hover:text-accent transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Fonts */}
          <div>
            <Label className="text-xs mb-2 block">Typography — select fonts for your brand</Label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_FONTS.map((font) => {
                const active = kit.fonts.some((f) => f.family === font.family);
                return (
                  <button
                    key={font.family}
                    onClick={() => toggleFont(font)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors text-left ${active ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
                  >
                    <span style={{ fontFamily: font.family }} className="text-sm text-foreground">
                      {font.label}
                    </span>
                    <span style={{ fontFamily: font.family }} className="text-xs text-muted-foreground hidden sm:block">
                      The quick brown fox
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-accent hover:bg-accent/90 text-white" onClick={save} disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create kit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── KIT CARD ─────────────────────────────────────────────────────────────────

function KitCard({ kit, onEdit, onDelete }: { kit: any; onEdit: () => void; onDelete: () => void }) {
  const colors: BrandColor[] = Array.isArray(kit.colors) ? kit.colors : [];
  const logos: BrandLogo[]   = Array.isArray(kit.logos)  ? kit.logos  : [];
  const fonts: BrandFont[]   = Array.isArray(kit.fonts)  ? kit.fonts  : [];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Color strip */}
      <div className="h-3 flex">
        {colors.slice(0, 8).map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c.hex }} />
        ))}
        {colors.length === 0 && <div className="flex-1 bg-muted" />}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{kit.name}</h3>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Colour swatches */}
        {colors.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1.5">Colours</p>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-1" title={c.name}>
                  <div className="w-5 h-5 rounded border border-border" style={{ background: c.hex }} />
                  <span className="text-xs text-muted-foreground">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logos */}
        {logos.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1.5">Logos</p>
            <div className="flex gap-2">
              {logos.slice(0, 4).map((l, i) => (
                <div key={i} className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center p-1 overflow-hidden">
                  <img src={l.src} alt={l.name} loading="lazy" className="max-w-full max-h-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fonts */}
        {fonts.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Typography</p>
            <div className="flex flex-wrap gap-1.5">
              {fonts.map((f, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full" style={{ fontFamily: f.family }}>
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function BrandKitPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: kits = [], refetch } = trpc.crm.brandKits.list.useQuery();
  const deleteMutation = trpc.crm.brandKits.delete.useMutation({
    onSuccess: () => { toast.success("Brand kit deleted"); refetch(); },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Brand Kit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store your logo, colours and fonts — apply to designs in one click
          </p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-white"
          onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New kit
        </Button>
      </div>

      {kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Sparkles className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">No brand kits yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
            Create a brand kit with your company's colours, logo and fonts.
            Apply it to any design in the Design Studio with one click.
          </p>
          {/* Starter preview */}
          <div className="bg-card border border-border rounded-2xl p-5 max-w-xs w-full text-left mb-6">
            <p className="text-xs font-medium text-muted-foreground mb-3">Estate IQ default colours</p>
            <div className="flex gap-2 mb-3">
              {STARTER_COLORS.map((c) => (
                <div key={c.hex} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg border border-border" style={{ background: c.hex }} />
                  <span className="text-xs text-muted-foreground">{c.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Use this as your starting point</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-white"
            onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Create first kit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {kits.map((kit) => (
            <KitCard
              key={kit.id}
              kit={{ ...kit, colors: kit.colors, logos: kit.logos, fonts: kit.fonts }}
              onEdit={() => { setEditing(kit); setModalOpen(true); }}
              onDelete={() => { if (confirm(`Delete "${kit.name}"?`)) deleteMutation.mutate(kit.id); }}
            />
          ))}
          {/* Add card */}
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground hover:border-accent/60 hover:text-accent transition-colors">
            <Plus className="w-6 h-6" />
            <span className="text-sm">New brand kit</span>
          </button>
        </div>
      )}

      <KitEditor
        open={modalOpen}
        initial={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={refetch}
      />
    </DashboardLayout>
  );
}
