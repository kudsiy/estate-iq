import { useState, useRef, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
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
  Plus, Trash2, Edit2, Sparkles, Upload, X, Type, Palette,
  Image as ImageIcon, Check, Phone, Globe, MapPin, Languages,
  User, CheckCircle2, Bookmark, ExternalLink, MessageCircle
} from "lucide-react";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

const DEFAULT_COLORS: BrandColor[] = [
  { hex: "#1e3a5f", name: "Imperial Blue" },
  { hex: "#d4af37", name: "Abyssinian Gold" },
  { hex: "#ffffff", name: "Pristine White" },
];

const FONT_OPTIONS: BrandFont[] = [
  { family: "Inter, sans-serif", label: "Inter (Modern)" },
  { family: "Playfair Display, serif", label: "Playfair (Luxury)" },
  { family: "Noto Sans Ethiopic, sans-serif", label: "ኖቶ ሳንስ (Amharic)" },
  { family: "Noto Serif Ethiopic, serif", label: "ኖቶ ሰሪፍ (Amharic)" },
];

const ADDIS_SUBCITIES = [
  "bole", "yeka", "arada", "kirkos", "lideta", "gullele", "akaky", 
  "addis_ketema", "kolfe", "nifas_silk", "lemi_kura"
];

const EMPTY_KIT: KitData = {
  name: "", logos: [], colors: DEFAULT_COLORS, fonts: [],
  phoneNumber: "", whatsappNumber: "", facebookUrl: "",
  instagramHandle: "", tiktokHandle: "", telegramChannel: "",
  agentPortrait: "", tagline: "", targetAreas: [],
  languagePreference: "both",
};

interface BrandColor { hex: string; name: string; }
interface BrandFont { family: string; label: string; }
interface BrandLogo { src: string; name: string; }
interface KitData {
  name: string; logos: BrandLogo[]; colors: BrandColor[];
  fonts: BrandFont[]; phoneNumber: string; whatsappNumber: string;
  facebookUrl: string; instagramHandle: string; tiktokHandle: string;
  telegramChannel: string; agentPortrait: string; tagline: string;
  targetAreas: string[]; languagePreference: "amharic" | "english" | "both";
}

// ── Components ────────────────────────────────────────────────────────────────

function KitCard({ kit, onEdit, onDelete, t, glassStyle }: any) {
  const colors: BrandColor[] = (kit.colors as BrandColor[]) ?? [];
  const fonts: BrandFont[] = (kit.fonts as BrandFont[]) ?? [];
  
  return (
    <div style={glassStyle} className="p-6 border-0 group transition-all hover:scale-[1.02] cursor-pointer">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
            {kit.logos?.[0] ? <img src={kit.logos[0].src} className="w-8 h-8 object-contain" /> : <Sparkles className="w-6 h-6 text-accent" />}
          </div>
          <div>
            <h3 className="font-black text-lg text-foreground tracking-tighter uppercase">{kit.name}</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Verified Identity Kit</p>
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={onEdit} className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-accent hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">{t("brand.palette")}</span>
           <div className="flex gap-2">
              {colors.map((c, i) => (
                <div key={i} className="w-10 h-10 rounded-xl border border-white/10 shadow-lg" style={{ background: c.hex }} title={c.name} />
              ))}
           </div>
        </div>

        <div>
           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">{t("brand.fonts")}</span>
           <div className="flex flex-wrap gap-2">
              {fonts.map((f, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-[10px] font-bold" style={{ fontFamily: f.family }}>{f.label}</span>
              ))}
           </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
           <div className="flex -space-x-2">
              {[kit.facebookUrl, kit.instagramHandle, kit.telegramChannel].filter(Boolean).map((s, i) => (
                 <div key={i} className="w-7 h-7 rounded-full bg-accent/20 border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                 </div>
              ))}
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest text-accent">Branding Ready</span>
        </div>
      </div>
    </div>
  );
}

export default function BrandKitPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);

  const { data: kits = [], refetch } = trpc.crm.brandKits.list.useQuery();
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const createMutation = trpc.crm.brandKits.create.useMutation({
    onSuccess: () => { toast.success("Brand kit created!"); setModalOpen(false); refetch(); },
    onError: () => toast.error("Failed to create brand kit"),
  });

  const updateMutation = trpc.crm.brandKits.update.useMutation({
    onSuccess: () => { toast.success("Brand kit updated!"); setEditTarget(null); refetch(); },
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = trpc.crm.brandKits.delete.useMutation({
    onSuccess: () => { toast.success("Brand kit deleted"); refetch(); },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSave = (data: KitData) => {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: data as any });
    else createMutation.mutate(data as any);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("brand.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("brand.sub")}</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="h-12 px-8 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-accent/20">
          <Plus className="w-4 h-4" /> {t("brand.add")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kits.map(kit => (
          <KitCard key={kit.id} kit={kit} t={t} glassStyle={glassStyle}
            onEdit={() => setEditTarget(kit)}
            onDelete={() => { if(confirm("Delete brand kit?")) deleteMutation.mutate(kit.id); }} />
        ))}
        {kits.length === 0 && (
          <div style={glassStyle} className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-border/40">
             <div className="w-16 h-16 rounded-[24px] bg-muted/40 flex items-center justify-center mb-6">
                <Bookmark className="w-8 h-8 text-muted-foreground/30" />
             </div>
             <p className="font-bold text-foreground">No Brand Identity Found</p>
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 max-w-[200px]">Create your first brand identity kit to start your luxury presence.</p>
          </div>
        )}
      </div>

      <KitModal open={modalOpen || !!editTarget} theme={theme} t={t}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        initial={editTarget} onSave={handleSave} isSaving={createMutation.isPending || updateMutation.isPending} />
    </DashboardLayout>
  );
}

function KitModal({ open, onClose, initial, onSave, isSaving, theme, t }: any) {
  const [kit, setKit] = useState<KitData>(initial ?? EMPTY_KIT);
  const [tab, setTab] = useState<"brand" | "contact" | "social" | "local">("brand");
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const setField = (k: keyof KitData, v: any) => setKit(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[32px] overflow-hidden p-0 border-0 bg-transparent shadow-none">
        <div style={glassStyle} className="p-10 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-black tracking-tighter uppercase">{initial ? "Modify Identity" : "New Brand Identity"}</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-8 bg-muted/20 p-1.5 rounded-2xl">
             {(["brand", "contact", "social", "local"] as const).map(x => (
               <button key={x} onClick={() => setTab(x)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === x ? "bg-accent text-white shadow-lg" : "text-muted-foreground hover:bg-muted/30"}`}>
                 {t(`brand.${x}`)}
               </button>
             ))}
          </div>

          <div className="space-y-6">
            {tab === "brand" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">{t("brand.kitName")}</Label>
                        <Input className="h-10 rounded-xl bg-background/50" value={kit.name} onChange={e => setField("name", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">{t("brand.tagline")}</Label>
                        <Input className="h-10 rounded-xl bg-background/50" value={kit.tagline} onChange={e => setField("tagline", e.target.value)} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">{t("brand.portrait")}</Label>
                      <div className="h-32 rounded-2xl border-2 border-dashed border-border/40 bg-muted/10 flex flex-col items-center justify-center group cursor-pointer hover:border-accent/40 overflow-hidden relative">
                         {kit.agentPortrait ? (
                           <>
                             <img src={kit.agentPortrait} className="w-full h-full object-cover" />
                             <button onClick={(e) => { e.stopPropagation(); setField("agentPortrait", ""); }} className="absolute h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center top-2 right-2"><X className="w-4 h-4"/></button>
                           </>
                         ) : (
                           <>
                             <User className="w-6 h-6 text-muted-foreground/30 mb-2 group-hover:scale-110 transition-all" />
                             <span className="text-[10px] font-black text-muted-foreground uppercase">Upload Portrait</span>
                           </>
                         )}
                      </div>
                   </div>
                </div>

                <div>
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">{t("brand.palette")}</Label>
                   <div className="flex flex-wrap gap-4">
                      {kit.colors.map((c, i) => (
                        <div key={i} className="group relative">
                           <div className="w-12 h-12 rounded-xl border border-white/10 shadow-lg" style={{ background: c.hex }} />
                           <button onClick={() => setField("colors", kit.colors.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X className="w-2.5 h-2.5" /></button>
                        </div>
                      ))}
                      <div className="w-12 h-12 rounded-xl border-2 border-dashed border-border/40 flex items-center justify-center hover:border-accent transition-all cursor-pointer">
                         <Plus className="w-5 h-5 text-muted-foreground/30" />
                      </div>
                   </div>
                </div>

                <div>
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">{t("brand.fonts")}</Label>
                   <div className="grid grid-cols-2 gap-3">
                      {FONT_OPTIONS.map(f => {
                         const has = kit.fonts.some(x => x.family === f.family);
                         return (
                           <button key={f.family} onClick={() => setField("fonts", has ? kit.fonts.filter(x => x.family !== f.family) : [...kit.fonts, f])}
                             className={`p-4 rounded-xl border text-left transition-all ${has ? "bg-accent/10 border-accent/40 text-accent shadow-sm" : "bg-background/20 border-border/40 text-muted-foreground hover:border-accent/30"}`}>
                             <p className="text-sm font-bold truncate" style={{ fontFamily: f.family }}>{f.label}</p>
                           </button>
                         )
                      })}
                   </div>
                </div>
              </>
            )}

            {tab === "contact" && (
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">{t("prop.address")}</Label>
                        <Input className="h-10 rounded-xl bg-background/50" placeholder="Addis Ababa, Ethiopia" />
                     </div>
                     <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">{t("brand.contact")}</Label>
                        <Input className="h-10 rounded-xl bg-background/50" value={kit.phoneNumber} onChange={e => setField("phoneNumber", e.target.value)} />
                     </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Email Identity</Label>
                    <Input className="h-10 rounded-xl bg-background/50" placeholder="branding@example.com" />
                  </div>
               </div>
            )}

            {tab === "social" && (
               <div className="space-y-4">
                  {[
                    { key: "facebookUrl", label: "Facebook Page", icon: Globe },
                    { key: "instagramHandle", label: "Instagram Handle", icon: ImageIcon },
                    { key: "tiktokHandle", label: "TikTok Handle", icon: Video },
                    { key: "telegramChannel", label: "Telegram Channel", icon: MessageCircle },
                  ].map(x => (
                    <div key={x.key}>
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">{x.label}</Label>
                       <div className="relative">
                          <x.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                          <Input className="h-10 rounded-xl bg-background/50 pl-10" value={(kit as any)[x.key]} onChange={e => setField(x.key as any, e.target.value)} />
                       </div>
                    </div>
                  ))}
               </div>
            )}

            {tab === "local" && (
               <div className="space-y-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">{t("brand.language")}</Label>
                    <div className="flex gap-2">
                       {["english", "amharic", "both"].map(l => (
                         <button key={l} onClick={() => setField("languagePreference", l)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${kit.languagePreference === l ? "bg-accent text-white border-accent shadow-lg" : "bg-background/20 border-border/40 text-muted-foreground"}`}>{l}</button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">{t("brand.areas")}</Label>
                    <div className="flex flex-wrap gap-2">
                       {ADDIS_SUBCITIES.map(area => {
                         const has = kit.targetAreas.includes(area);
                         return (
                           <button key={area} onClick={() => setField("targetAreas", has ? kit.targetAreas.filter(a => a !== area) : [...kit.targetAreas, area])}
                             className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${has ? "bg-accent text-white border-accent shadow-md" : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-accent/10 hover:text-accent"}`}>{t(`subcity.${area}`)||area}</button>
                         )
                       })}
                    </div>
                  </div>
               </div>
            )}
          </div>

          <div className="flex gap-4 mt-12">
            <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent/40" 
                    onClick={() => onSave(kit)} disabled={isSaving}>
              {isSaving ? "Publishing..." : (initial ? "Update Identity" : "Launch Brand Kit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Video(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
  )
}
