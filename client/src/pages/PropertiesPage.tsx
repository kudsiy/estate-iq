import { useState, useRef, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Search, MapPin, Bed, Bath, Maximize2, DollarSign,
  Edit2, Trash2, Image as ImageIcon, LayoutGrid, Map as MapIcon,
  Home, TrendingUp, CheckCircle, Clock, X, Users,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PropertyStatus = "available" | "sold" | "rented" | "pending";

const STATUS_META: Record<PropertyStatus, { label: string; color: string; bg: string }> = {
  available: { label: "Available", color: "text-green-700",  bg: "bg-green-50"  },
  sold:      { label: "Sold",      color: "text-gray-600",   bg: "bg-gray-100"  },
  rented:    { label: "Rented",    color: "text-blue-700",   bg: "bg-blue-50"   },
  pending:   { label: "Pending",   color: "text-amber-700",  bg: "bg-amber-50"  },
};

const ADDIS_SUBCITIES = [
  "Addis Ketema","Akaky Kaliti","Arada","Bole","Gullele",
  "Kirkos","Kolfe Keranio","Lemi Kura","Lideta","Nifas Silk-Lafto",
  "Yeka","Cherkos","Gulele",
];

const EMPTY_FORM = {
  title: "", description: "", address: "", city: "Addis Ababa",
  subcity: "", price: "", bedrooms: "", bathrooms: "", squareFeet: "",
  status: "available" as PropertyStatus, photos: [] as string[],
  latitude: "", longitude: "",
};

function formatETB(val: number | string | null | undefined): string {
  const n = Number(val);
  if (!n || isNaN(n)) return "—";
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `ETB ${Math.round(n / 1_000)}K`;
  return `ETB ${n.toLocaleString()}`;
}

// ─── PHOTO UPLOAD STRIP ───────────────────────────────────────────────────────

function PhotoStrip({
  photos, onChange,
}: { photos: string[]; onChange: (p: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addPhotos = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        onChange([...photos, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <Label className="text-xs">Photos</Label>
      <div className="flex flex-wrap gap-2 mt-1">
        {photos.map((src, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-16 h-16 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors text-muted-foreground hover:text-accent"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[10px]">Add</span>
        </button>
        <input
          ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => e.target.files && addPhotos(e.target.files)}
        />
      </div>
    </div>
  );
}

// ─── PROPERTY CARD ────────────────────────────────────────────────────────────

function PropertyCard({
  property, onEdit, onDelete, leadCount, dealCount,
}: { property: any; onEdit: () => void; onDelete: () => void; leadCount: number; dealCount: number }) {
  const photos = (property.photos as string[]) || [];
  const status = STATUS_META[property.status as PropertyStatus] ?? STATUS_META.available;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Photo */}
      <div className="relative h-44 bg-muted flex items-center justify-center overflow-hidden">
        {photos[0] ? (
          <img src={photos[0]} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Home className="w-8 h-8 opacity-30" />
            <span className="text-xs">No photo</span>
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
          {status.label}
        </span>
        {photos.length > 1 && (
          <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-full">
            +{photos.length - 1} photos
          </span>
        )}
        {/* Actions on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground truncate">{property.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          {[property.subcity, property.city].filter(Boolean).join(", ")}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{property.bedrooms}</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms}</span>
          )}
          {property.squareFeet && (
            <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{Number(property.squareFeet)} m²</span>
          )}
        </div>

        {/* Price */}
        <div className="mt-2 font-semibold text-sm text-accent">
          {formatETB(property.price)}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {leadCount} linked lead{leadCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {dealCount} deal{dealCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MAP PIN COMPONENT (fallback when no Google Maps key) ──────────────────────

function SimpleMapView({ properties }: { properties: any[] }) {
  // Addis Ababa center as SVG placeholder map
  const withCoords = properties.filter((p) => p.latitude && p.longitude);

  return (
    <div className="relative w-full h-[460px] bg-muted rounded-xl border border-border overflow-hidden flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Map view</p>
        <p className="text-xs mt-1 max-w-xs">
          {withCoords.length > 0
            ? `${withCoords.length} propert${withCoords.length === 1 ? "y has" : "ies have"} coordinates — add a Google Maps API key to enable the full map`
            : "Add latitude/longitude when creating properties to pin them on the map"}
        </p>
        {withCoords.length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5 max-w-xs mx-auto text-left">
            {withCoords.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs bg-card border border-border rounded-lg px-3 py-2">
                <MapPin className="w-3 h-3 text-accent shrink-0" />
                <span className="truncate font-medium text-foreground">{p.title}</span>
                <span className="text-muted-foreground shrink-0">{formatETB(p.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADD / EDIT MODAL ─────────────────────────────────────────────────────────

function PropertyModal({
  open, onClose, initial, onSave, isSaving,
}: {
  open: boolean; onClose: () => void;
  initial: typeof EMPTY_FORM | null;
  onSave: (data: typeof EMPTY_FORM) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<typeof EMPTY_FORM>(initial ?? EMPTY_FORM);

  // Sync when initial changes (edit mode)
  useState(() => { if (initial) setForm(initial); });

  const set = (k: keyof typeof EMPTY_FORM, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Property" : "Add Property"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Basic info */}
          <div>
            <Label className="text-xs">Property title *</Label>
            <Input className="mt-1 h-8 text-sm" value={form.title}
              onChange={(e) => set("title", e.target.value)} placeholder="e.g. Luxury Villa in Bole" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">City</Label>
              <Input className="mt-1 h-8 text-sm" value={form.city}
                onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Sub-city</Label>
              <Select value={form.subcity} onValueChange={(v) => set("subcity", v)}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {ADDIS_SUBCITIES.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Street address *</Label>
            <Input className="mt-1 h-8 text-sm" value={form.address}
              onChange={(e) => set("address", e.target.value)} placeholder="e.g. Bole Road, near Edna Mall" />
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="mt-1 text-sm" rows={3} value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the property, its features, and surroundings…" />
          </div>

          {/* Specs */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Price (ETB)</Label>
              <Input className="mt-1 h-8 text-sm" type="number" value={form.price}
                onChange={(e) => set("price", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Bedrooms</Label>
              <Input className="mt-1 h-8 text-sm" type="number" value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Bathrooms</Label>
              <Input className="mt-1 h-8 text-sm" type="number" value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Area (m²)</Label>
              <Input className="mt-1 h-8 text-sm" type="number" value={form.squareFeet}
                onChange={(e) => set("squareFeet", e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as PropertyStatus)}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <SelectItem key={v} value={v} className="text-sm">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Map coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Latitude (optional)</Label>
              <Input className="mt-1 h-8 text-sm" type="number" step="any"
                value={form.latitude} onChange={(e) => set("latitude", e.target.value)}
                placeholder="e.g. 9.0054" />
            </div>
            <div>
              <Label className="text-xs">Longitude (optional)</Label>
              <Input className="mt-1 h-8 text-sm" type="number" step="any"
                value={form.longitude} onChange={(e) => set("longitude", e.target.value)}
                placeholder="e.g. 38.7636" />
            </div>
          </div>

          {/* Photos */}
          <PhotoStrip photos={form.photos} onChange={(p) => set("photos", p)} />

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-accent hover:bg-accent/90 text-white"
              onClick={() => onSave(form)}
              disabled={isSaving || !form.title || !form.address}
            >
              {isSaving ? "Saving…" : initial ? "Update Property" : "Add Property"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const [view, setView] = useState<"grid" | "map">("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubcity, setFilterSubcity] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const { data: properties = [], refetch } = trpc.crm.properties.list.useQuery();
  const { data: leads = [] } = trpc.crm.leads.list.useQuery();
  const { data: deals = [] } = trpc.crm.deals.list.useQuery();

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

  // Stats
  const stats = useMemo(() => ({
    total:     properties.length,
    available: properties.filter((p) => p.status === "available").length,
    sold:      properties.filter((p) => p.status === "sold").length,
    pending:   properties.filter((p) => p.status === "pending").length,
    linkedLeads: leads.filter((lead) => lead.propertyId != null).length,
  }), [properties, leads, deals]);

  // Filtered
  const filtered = useMemo(() => properties.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || (p.subcity ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSubcity = filterSubcity === "all" || p.subcity === filterSubcity;
    return matchSearch && matchStatus && matchSubcity;
  }), [properties, search, filterStatus, filterSubcity]);

  const handleSave = useCallback((form: typeof EMPTY_FORM) => {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      address: form.address,
      city: form.city,
      subcity: form.subcity || undefined,
      price: form.price || undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      squareFeet: form.squareFeet || undefined,
      photos: form.photos.length ? form.photos : undefined,
      status: form.status,
      latitude: form.latitude || undefined,
      longitude: form.longitude || undefined,
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [editTarget, createMutation, updateMutation]);

  const openEdit = (p: any) => {
    setEditTarget({
      ...p,
      initialForm: {
        title: p.title ?? "",
        description: p.description ?? "",
        address: p.address ?? "",
        city: p.city ?? "Addis Ababa",
        subcity: p.subcity ?? "",
        price: p.price ? String(p.price) : "",
        bedrooms: p.bedrooms != null ? String(p.bedrooms) : "",
        bathrooms: p.bathrooms != null ? String(p.bathrooms) : "",
        squareFeet: p.squareFeet ? String(p.squareFeet) : "",
        status: p.status ?? "available",
        photos: (p.photos as string[]) ?? [],
        latitude: p.latitude ? String(p.latitude) : "",
        longitude: p.longitude ? String(p.longitude) : "",
      },
    });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your property listings</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-white" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Property
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total",     value: stats.total,     icon: Home,        color: "text-accent"      },
          { label: "Available", value: stats.available, icon: CheckCircle, color: "text-green-500"   },
          { label: "Pending",   value: stats.pending,   icon: Clock,       color: "text-amber-500"   },
          { label: "Sold",      value: stats.sold,      icon: TrendingUp,  color: "text-muted-foreground" },
          { label: "Linked leads", value: stats.linkedLeads, icon: Users, color: "text-blue-500" },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input className="pl-9 h-8 text-sm" placeholder="Search by title, address, sub-city…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-sm w-34"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">All statuses</SelectItem>
            {Object.entries(STATUS_META).map(([v, m]) => (
              <SelectItem key={v} value={v} className="text-sm">{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSubcity} onValueChange={setFilterSubcity}>
          <SelectTrigger className="h-8 text-sm w-40"><SelectValue placeholder="All sub-cities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">All sub-cities</SelectItem>
            {ADDIS_SUBCITIES.map((s) => (
              <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</span>

        {/* View toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden ml-auto">
          {(["grid", "map"] as const).map((v) => {
            const Icon = v === "grid" ? LayoutGrid : MapIcon;
            return (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 flex items-center gap-1.5 text-xs transition-colors ${view === v ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />
                {v === "grid" ? "Grid" : "Map"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {view === "grid" ? (
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Home className="w-7 h-7 text-muted-foreground opacity-40" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No properties yet</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              Add your first property listing and it will appear here
            </p>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={() => setModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add First Property
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <PropertyCard
                key={p.id} property={p}
                leadCount={leads.filter((lead) => lead.propertyId === p.id).length}
                dealCount={deals.filter((deal) => deal.propertyId === p.id).length}
                onEdit={() => openEdit(p)}
                onDelete={() => { if (confirm(`Delete "${p.title}"?`)) deleteMutation.mutate(p.id); }}
              />
            ))}
          </div>
        )
      ) : (
        <SimpleMapView properties={filtered} />
      )}

      {/* Add modal */}
      <PropertyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={null}
        onSave={handleSave}
        isSaving={createMutation.isPending}
      />

      {/* Edit modal */}
      {editTarget && (
        <PropertyModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={editTarget.initialForm}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}
