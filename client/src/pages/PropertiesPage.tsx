import { useState, useRef, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Search, MapPin, Bed, Bath, Maximize2, DollarSign,
  Edit2, Trash2, Image as ImageIcon, LayoutGrid, Map as MapIcon,
  Home, TrendingUp, CheckCircle, Clock, X, Users, Activity
} from "lucide-react";

// ── Shared Styling ────────────────────────────────────────────────────────────

type PropertyStatus = "available" | "sold" | "rented" | "pending";

const STATUS_META: Record<PropertyStatus, { color: string; bg: string }> = {
  available: { color: "text-green-700 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20"  },
  sold:      { color: "text-gray-600 dark:text-gray-400",   bg: "bg-gray-100 dark:bg-gray-800"       },
  rented:    { color: "text-blue-700 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-900/20"    },
  pending:   { color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20"  },
};

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

const ADDIS_SUBCITIES = [
  "bole", "yeka", "arada", "kirkos", "lideta", "gullele", "akaky", 
  "addis_ketema", "kolfe", "nifas_silk", "lemi_kura"
];

const EMPTY_FORM = {
  title: "", description: "", address: "", city: "Addis Ababa",
  subcity: "", price: "", bedrooms: "", bathrooms: "", squareFeet: "",
  status: "available" as PropertyStatus, photos: [] as string[],
  latitude: "", longitude: "",
};

function formatETB(val: number | string | null | undefined) {
  const n = Number(val);
  if (!n || isNaN(n)) return "—";
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `ETB ${Math.round(n / 1_000)}K`;
  return `ETB ${n.toLocaleString()}`;
}

// ── Photo Upload ──────────────────────────────────────────────────────────────

function PhotoStrip({ photos, onChange, theme }: { photos: string[]; onChange: (p: string[]) => void; theme: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const glassStyle = getGlassStyle(theme);

  const addPhotos = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => onChange([...photos, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Photos</Label>
      <div className="flex flex-wrap gap-3">
        {photos.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-border/50 group">
            <img src={src} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            <button
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          style={glassStyle}
          className="w-20 h-20 flex flex-col items-center justify-center gap-1.5 transition-all hover:border-accent group"
        >
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Add</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => e.target.files && addPhotos(e.target.files)} />
      </div>
    </div>
  );
}

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({ property, onEdit, onDelete, leadCount, t, glassStyle }: { property: any; onEdit: () => void; onDelete: () => void; leadCount: number; t: any; glassStyle: any }) {
  const photos = (property.photos as string[]) || [];
  const status = STATUS_META[property.status as PropertyStatus] || STATUS_META.available;

  return (
    <div style={glassStyle} className="overflow-hidden group flex flex-col h-full border-0">
      <div className="relative h-48 overflow-hidden bg-muted/20">
        {photos[0] ? (
          <img src={photos[0]} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30">
            <Home className="w-10 h-10 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">No Content</span>
          </div>
        )}
        
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-xl ${status.bg} ${status.color}`}>
            {t(`status.${property.status}`)}
          </span>
        </div>

        <div className="absolute top-4 right-4 flex gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <button onClick={onEdit} className="w-8 h-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-xl">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {photos.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md text-[9px] font-black text-white px-2 py-0.5 rounded-md uppercase tracking-widest">
            +{photos.length - 1} {t("prop.photos")}
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-base text-foreground line-clamp-1 leading-none mb-2">{property.title}</h3>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0 text-accent/60" />
            <span className="text-[11px] font-medium truncate">
              {[t(`subcity.${property.subcity}`)||property.subcity, property.city].filter(Boolean).join(", ")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
           <div className="flex flex-col gap-1">
             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{t("prop.bedrooms")}</span>
             <div className="flex items-center gap-1.5 font-bold text-sm">
               <Bed className="w-3.5 h-3.5 text-accent" /> {property.bedrooms || 0}
             </div>
           </div>
           <div className="flex flex-col gap-1 border-x border-border/30 px-3">
             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{t("prop.bathrooms")}</span>
             <div className="flex items-center gap-1.5 font-bold text-sm">
               <Bath className="w-3.5 h-3.5 text-accent" /> {property.bathrooms || 0}
             </div>
           </div>
           <div className="flex flex-col gap-1 pl-1">
             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{t("prop.area")}</span>
             <div className="flex items-center gap-1.5 font-bold text-sm">
               <Maximize2 className="w-3.5 h-3.5 text-accent" /> {property.squareFeet || 0}m²
             </div>
           </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
           <div className="text-lg font-black text-accent tracking-tight">
             {formatETB(property.price)}
           </div>
           <div className="flex items-center -space-x-2">
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-background flex items-center justify-center text-[10px] font-black text-accent">
                {leadCount}
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pl-3">
                {t("dash.activeLeads")}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const [view, setView] = useState<"grid" | "map">("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubcity, setFilterSubcity] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const { t } = useLanguage();
  const { theme } = useTheme();
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const { data: properties = [], refetch } = trpc.crm.properties.list.useQuery();
  const { data: leads = [] } = trpc.crm.leads.list.useQuery();

  const createMutation = trpc.crm.properties.create.useMutation({
    onSuccess: () => { toast.success("Property added!"); setModalOpen(false); refetch(); },
    onError: () => toast.error("Failed to add property"),
  });
  const updateMutation = trpc.crm.properties.update.useMutation({
    onSuccess: () => { toast.success("Property updated"); setEditTarget(null); refetch(); },
    onError: () => toast.error("Update failed"),
  });
  const deleteMutation = trpc.crm.properties.delete.useMutation({
    onSuccess: () => { toast.success("Property removed"); refetch(); },
    onError: () => toast.error("Delete failed"),
  });

  const stats = useMemo(() => ({
    total:     properties.length,
    available: properties.filter((p) => p.status === "available").length,
    sold:      properties.filter((p) => p.status === "sold").length,
    pending:   properties.filter((p) => p.status === "pending").length,
  }), [properties]);

  const filtered = useMemo(() => properties.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || (p.subcity ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSubcity = filterSubcity === "all" || p.subcity === filterSubcity;
    return matchSearch && matchStatus && matchSubcity;
  }), [properties, search, filterStatus, filterSubcity]);

  const handleSave = (form: typeof EMPTY_FORM) => {
    const payload = {
      ...form,
      price: form.price || undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      squareFeet: form.squareFeet || undefined,
      subcity: form.subcity || undefined,
      description: form.description || undefined,
      photos: form.photos.length ? form.photos : undefined,
    };
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: payload as any });
    else createMutation.mutate(payload as any);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter">{t("nav.properties")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("dash.pipeSub")}</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-white h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-accent/20" 
                onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> {t("prop.add")}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { key: "prop.total", val: stats.total, icon: Home, clr: "text-accent" },
          { key: "prop.available", val: stats.available, icon: CheckCircle, clr: "text-green-500" },
          { key: "prop.pending", val: stats.pending, icon: Clock, clr: "text-amber-500" },
          { key: "prop.sold", val: stats.sold, icon: TrendingUp, clr: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.key} style={glassStyle} className="p-5 border-0">
             <div className="flex items-center gap-2 mb-3">
               <s.icon className={`w-3.5 h-3.5 ${s.clr}`} />
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t(s.key)}</span>
             </div>
             <p className="text-3xl font-black text-foreground tracking-tight">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8 items-start">
        <div style={glassStyle} className="relative flex-1 p-1 border-0 rounded-2xl w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
           <Input className="pl-11 h-11 border-0 bg-transparent text-sm font-medium focus-visible:ring-0" 
                  placeholder={t("prop.search")}
                  value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger style={glassStyle} className="h-11 border-0 w-full lg:w-40 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              {Object.keys(STATUS_META).map(k => (
                <SelectItem key={k} value={k} className="text-xs uppercase font-black">{t(`status.${k}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSubcity} onValueChange={setFilterSubcity}>
            <SelectTrigger style={glassStyle} className="h-11 border-0 w-full lg:w-48 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              <SelectValue placeholder="Subcity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Areas</SelectItem>
              {ADDIS_SUBCITIES.map(s => (
                <SelectItem key={s} value={s} className="text-xs uppercase font-black">{t(`subcity.${s}`)||s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div style={glassStyle} className="p-1 border-0 rounded-2xl flex shrink-0">
             {(["grid", "map"] as const).map(v => (
               <button key={v} onClick={() => setView(v)}
                className={`w-11 h-9 rounded-xl flex items-center justify-center transition-all ${view === v ? "bg-accent text-white shadow-lg" : "text-muted-foreground hover:bg-muted/30"}`}>
                 {v === "grid" ? <LayoutGrid className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
               </button>
             ))}
          </div>
        </div>
      </div>

      {view === "grid" ? (
        filtered.length === 0 ? (
          <div style={glassStyle} className="py-24 flex flex-col items-center text-center border-0">
            <div className="w-20 h-20 rounded-3xl bg-muted/40 flex items-center justify-center mb-6">
               <Home className="w-9 h-9 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">No properties found</h3>
            <p className="text-sm text-muted-foreground max-w-xs font-medium mb-8">No property listings match your current filters or search criteria.</p>
            <Button variant="outline" className="rounded-xl px-6 h-10 text-[10px] font-black uppercase tracking-widest"
                    onClick={() => { setSearch(""); setFilterStatus("all"); setFilterSubcity("all"); }}>
               Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} t={t} glassStyle={glassStyle}
                leadCount={leads.filter((l) => l.propertyId === p.id).length}
                onEdit={() => setEditTarget({ ...p, initialForm: { ...p, price: p.price ? String(p.price) : "", bedrooms: String(p.bedrooms||""), bathrooms: String(p.bathrooms||""), squareFeet: String(p.squareFeet||""), photos: (p.photos as any) || [] } })}
                onDelete={() => { if (confirm("Delete property?")) deleteMutation.mutate(p.id); }} />
            ))}
          </div>
        )
      ) : (
        <div style={glassStyle} className="h-[600px] border-0 flex items-center justify-center">
           <div className="text-center">
             <MapIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
             <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t("prop.map")} Loading...</p>
           </div>
        </div>
      )}

      {/* Simplified Modal calls for space */}
      <PropertyModal open={modalOpen || !!editTarget} theme={theme}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        initial={editTarget ? editTarget.initialForm : null}
        onSave={handleSave} isSaving={createMutation.isPending || updateMutation.isPending} t={t} />
    </DashboardLayout>
  );
}

function PropertyModal({ open, onClose, initial, onSave, isSaving, theme, t }: any) {
  const [form, setForm] = useState<any>(initial ?? EMPTY_FORM);
  useState(() => { if (initial) setForm(initial); });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-3xl overflow-hidden p-0 border-0 bg-transparent shadow-none">
        <div style={getGlassStyle(theme)} className="p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black tracking-tighter uppercase">{initial ? "Edit" : "Add"} {t("nav.properties")}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="space-y-4">
               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Title</Label>
                  <Input className="h-10 rounded-xl bg-background/50" value={form.title} onChange={e => set("title", e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Subcity</Label>
                    <Select value={form.subcity} onValueChange={v => set("subcity", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ADDIS_SUBCITIES.map(s => <SelectItem key={s} value={s}>{t(`subcity.${s}`)||s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Status</Label>
                    <Select value={form.status} onValueChange={v => set("status", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(STATUS_META).map(k => <SelectItem key={k} value={k}>{t(`status.${k}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
               </div>
               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Price (ETB)</Label>
                  <Input type="number" className="h-10 rounded-xl bg-background/50 font-bold" value={form.price} onChange={e => set("price", e.target.value)} />
               </div>
            </div>
            
            <div className="space-y-4">
               <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Beds</Label>
                    <Input type="number" className="h-10 rounded-xl bg-background/50" value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Baths</Label>
                    <Input type="number" className="h-10 rounded-xl bg-background/50" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Area</Label>
                    <Input type="number" className="h-10 rounded-xl bg-background/50" value={form.squareFeet} onChange={e => set("squareFeet", e.target.value)} />
                  </div>
               </div>
               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Address</Label>
                  <Input className="h-10 rounded-xl bg-background/50" value={form.address} onChange={e => set("address", e.target.value)} />
               </div>
               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 inline-block">Description</Label>
                  <Textarea className="rounded-xl bg-background/50 resize-none" rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
               </div>
            </div>
          </div>

          <PhotoStrip photos={form.photos} theme={theme} onChange={p => set("photos", p)} />

          <div className="flex gap-4 mt-8">
            <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent/20" 
                    onClick={() => onSave(form)} disabled={isSaving}>
              {isSaving ? "Saving..." : (initial ? "Update" : "Save Listing")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
