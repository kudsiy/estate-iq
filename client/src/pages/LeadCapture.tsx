import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Trash2, Search, Filter, Eye, Edit2, TrendingUp,
  MessageCircle, Facebook, Instagram, Globe, Phone,
  Users, CheckCircle2, XCircle, Clock, Zap, Copy,
  GripVertical, ToggleLeft, Hash, Mail, AlignLeft, ChevronDown,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type LeadSource = "form" | "whatsapp" | "facebook" | "instagram" | "tiktok" | "manual";
type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
type FieldType = "text" | "email" | "phone" | "textarea" | "select" | "number";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select fields
}

interface FormConfig {
  id: string;
  name: string;
  fields: FormField[];
  submitLabel: string;
  thankYouMessage: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SOURCE_META: Record<LeadSource, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  form:      { label: "Web Form",   icon: Globe,          color: "text-blue-600",   bg: "bg-blue-50"   },
  whatsapp:  { label: "WhatsApp",   icon: MessageCircle,  color: "text-green-600",  bg: "bg-green-50"  },
  facebook:  { label: "Facebook",   icon: Facebook,       color: "text-blue-700",   bg: "bg-blue-50"   },
  instagram: { label: "Instagram",  icon: Instagram,      color: "text-pink-600",   bg: "bg-pink-50"   },
  tiktok:    { label: "TikTok",     icon: Phone,          color: "text-gray-800",   bg: "bg-gray-100"  },
  manual:    { label: "Manual",     icon: Users,          color: "text-violet-600", bg: "bg-violet-50" },
};

const STATUS_META: Record<LeadStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  new:       { label: "New",       icon: Zap,          color: "text-blue-600",   bg: "bg-blue-50"   },
  contacted: { label: "Contacted", icon: Phone,        color: "text-amber-600",  bg: "bg-amber-50"  },
  qualified: { label: "Qualified", icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50"  },
  converted: { label: "Converted", icon: TrendingUp,   color: "text-emerald-700",bg: "bg-emerald-50"},
  lost:      { label: "Lost",      icon: XCircle,      color: "text-red-500",    bg: "bg-red-50"    },
};

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ElementType }[] = [
  { type: "text",     label: "Short text",   icon: Hash       },
  { type: "email",    label: "Email",        icon: Mail       },
  { type: "phone",    label: "Phone",        icon: Phone      },
  { type: "textarea", label: "Long text",    icon: AlignLeft  },
  { type: "number",   label: "Number",       icon: Hash       },
  { type: "select",   label: "Dropdown",     icon: ChevronDown},
];

const DEFAULT_FORM: FormConfig = {
  id: "default",
  name: "Property Enquiry Form",
  submitLabel: "Send Enquiry",
  thankYouMessage: "Thank you! We will contact you within 24 hours.",
  fields: [
    { id: "f1", type: "text",  label: "Full Name",    placeholder: "e.g. Abebe Girma",          required: true  },
    { id: "f2", type: "phone", label: "Phone Number", placeholder: "+251 91 234 5678",           required: true  },
    { id: "f3", type: "email", label: "Email",        placeholder: "abebe@email.com",            required: false },
    { id: "f4", type: "select",label: "I am a",       required: true, options: ["Buyer","Renter","Investor","Agent"] },
    { id: "f5", type: "select",label: "Budget (ETB)", required: false,
      options: ["Under 2M","2M – 5M","5M – 10M","10M – 20M","Over 20M"] },
    { id: "f6", type: "textarea", label: "Message",   placeholder: "Tell us what you are looking for…", required: false },
  ],
};

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── SCORE BADGE ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-100 text-green-700"
    : score >= 40 ? "bg-amber-100 text-amber-700"
    : "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {score}
    </span>
  );
}

// ─── FIELD EDITOR ROW ────────────────────────────────────────────────────────

function FieldRow({
  field, index, total,
  onChange, onDelete, onMove,
}: {
  field: FormField; index: number; total: number;
  onChange: (id: string, patch: Partial<FormField>) => void;
  onDelete: (id: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  const [showOptions, setShowOptions] = useState(false);
  const FieldIcon = FIELD_TYPES.find((f) => f.type === field.type)?.icon ?? Hash;

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-accent/40 transition-colors">
      <div className="flex flex-col gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onMove(index, index - 1)} disabled={index === 0}
          className="p-0.5 rounded hover:bg-muted disabled:opacity-30">
          <ChevronDown className="w-3 h-3 rotate-180" />
        </button>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        <button onClick={() => onMove(index, index + 1)} disabled={index === total - 1}
          className="p-0.5 rounded hover:bg-muted disabled:opacity-30">
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs text-muted-foreground w-32 shrink-0">
            <FieldIcon className="w-3 h-3" />
            <select
              value={field.type}
              onChange={(e) => onChange(field.id, { type: e.target.value as FieldType })}
              className="bg-transparent text-xs outline-none w-full cursor-pointer"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.type} value={ft.type}>{ft.label}</option>
              ))}
            </select>
          </div>
          <Input
            value={field.label}
            onChange={(e) => onChange(field.id, { label: e.target.value })}
            placeholder="Field label"
            className="h-7 text-sm flex-1"
          />
          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={field.required}
              onChange={(e) => onChange(field.id, { required: e.target.checked })}
              className="rounded" />
            Required
          </label>
        </div>

        {field.type !== "select" && (
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onChange(field.id, { placeholder: e.target.value })}
            placeholder="Placeholder text…"
            className="h-7 text-xs text-muted-foreground"
          />
        )}

        {field.type === "select" && (
          <div>
            <button
              onClick={() => setShowOptions((v) => !v)}
              className="text-xs text-accent hover:underline"
            >
              {showOptions ? "Hide" : "Edit"} options ({field.options?.length ?? 0})
            </button>
            {showOptions && (
              <div className="mt-2 space-y-1">
                {(field.options ?? []).map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const opts = [...(field.options ?? [])];
                        opts[i] = e.target.value;
                        onChange(field.id, { options: opts });
                      }}
                      className="h-6 text-xs"
                    />
                    <button onClick={() => {
                      const opts = (field.options ?? []).filter((_, j) => j !== i);
                      onChange(field.id, { options: opts });
                    }} className="text-destructive hover:opacity-80">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => onChange(field.id, { options: [...(field.options ?? []), "New option"] })}
                  className="text-xs text-accent hover:underline flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" /> Add option
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={() => onDelete(field.id)}
        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors mt-0.5">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── FORM PREVIEW ─────────────────────────────────────────────────────────────

function FormPreview({ form }: { form: FormConfig }) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 max-w-md w-full shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{form.name}</h3>
      <div className="space-y-4">
        {form.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                placeholder={field.placeholder}
                rows={3}
                disabled
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 resize-none"
              />
            ) : field.type === "select" ? (
              <select disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400">
                <option>Select…</option>
                {field.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={field.type}
                placeholder={field.placeholder}
                disabled
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400"
              />
            )}
          </div>
        ))}
        <button
          disabled
          className="w-full py-2.5 text-sm font-semibold rounded-lg text-white"
          style={{ background: "#1e3a5f" }}
        >
          {form.submitLabel}
        </button>
        <p className="text-xs text-gray-400 text-center">{form.thankYouMessage}</p>
      </div>
    </div>
  );
}

// ─── EMBED CODE ──────────────────────────────────────────────────────────────

function EmbedCode({ form }: { form: FormConfig }) {
  const code = `<!-- Estate IQ Lead Form: ${form.name} -->
<iframe
  src="https://app.estateiq.et/form/${form.id}"
  width="100%"
  height="650"
  frameborder="0"
  style="border-radius:12px;"
></iframe>`;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">Embed on your website</p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied!"); }}>
          <Copy className="w-3 h-3" /> Copy code
        </Button>
      </div>
      <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto text-muted-foreground whitespace-pre-wrap">
        {code}
      </pre>
      <p className="text-xs text-muted-foreground mt-2">
        Paste this HTML snippet anywhere on your website. New enquiries still need a live form endpoint before they will flow into your CRM automatically.
      </p>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function LeadCapture() {
  const [tab, setTab] = useState<"leads" | "builder" | "embed">("leads");
  const [form, setForm] = useState<FormConfig>(DEFAULT_FORM);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editLead, setEditLead] = useState<any | null>(null);

  const [newLead, setNewLead] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    source: "manual" as LeadSource, notes: "", score: 50, propertyId: "unassigned",
  });

  // ── tRPC ────────────────────────────────────────────────────────────────
  const { data: leads = [], refetch } = trpc.crm.leads.list.useQuery();
  const { data: contacts = [] } = trpc.crm.contacts.list.useQuery();
  const { data: properties = [] } = trpc.crm.properties.list.useQuery();
  const { data: deals = [] } = trpc.crm.deals.list.useQuery();

  const createMutation = trpc.crm.leads.create.useMutation({
    onSuccess: () => { toast.success("Lead captured!"); setAddOpen(false); refetch();
      setNewLead({ firstName:"",lastName:"",phone:"",email:"",source:"manual",notes:"",score:50,propertyId:"unassigned" }); },
    onError: () => toast.error("Failed to save lead"),
  });
  const updateMutation = trpc.crm.leads.update.useMutation({
    onSuccess: () => { toast.success("Lead updated"); setEditLead(null); refetch(); },
    onError: () => toast.error("Update failed"),
  });
  const deleteMutation = trpc.crm.leads.delete.useMutation({
    onSuccess: () => { toast.success("Lead removed"); refetch(); },
    onError: () => toast.error("Delete failed"),
  });
  const convertMutation = trpc.crm.leads.convert.useMutation({
    onSuccess: ({ dealId }) => {
      toast.success(dealId ? "Lead converted into a contact and deal" : "Lead converted into a contact");
      setEditLead(null);
      refetch();
    },
    onError: (error) => toast.error(error.message || "Conversion failed"),
  });

  // ── derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = (s: LeadStatus) => leads.filter((l) => l.status === s).length;
    const conversionRate = total > 0
      ? Math.round((byStatus("converted") / total) * 100) : 0;
    return { total, new: byStatus("new"), qualified: byStatus("qualified"),
      converted: byStatus("converted"), conversionRate };
  }, [leads]);

  // ── filtered leads ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const data = (l.leadData as any) ?? {};
      const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase())
        || data.phone?.includes(search) || data.email?.toLowerCase().includes(search.toLowerCase());
      const matchSource = filterSource === "all" || l.source === filterSource;
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      return matchSearch && matchSource && matchStatus;
    });
  }, [leads, search, filterSource, filterStatus]);

  // ── form builder helpers ─────────────────────────────────────────────────
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: uid(), type, label: FIELD_TYPES.find((f) => f.type === type)?.label ?? "Field",
      required: false, placeholder: "",
      ...(type === "select" ? { options: ["Option 1", "Option 2"] } : {}),
    };
    setForm((f) => ({ ...f, fields: [...f.fields, newField] }));
  };
  const updateField = (id: string, patch: Partial<FormField>) =>
    setForm((f) => ({ ...f, fields: f.fields.map((fl) => fl.id === id ? { ...fl, ...patch } : fl) }));
  const deleteField = (id: string) =>
    setForm((f) => ({ ...f, fields: f.fields.filter((fl) => fl.id !== id) }));
  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= form.fields.length) return;
    const next = [...form.fields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setForm((f) => ({ ...f, fields: next }));
  };

  // ── submit new lead ───────────────────────────────────────────────────────
  const handleAddLead = () => {
    if (!newLead.firstName || !newLead.phone) {
      toast.error("Name and phone are required");
      return;
    }
    createMutation.mutate({
      source: newLead.source,
      score: newLead.score,
      status: "new",
      propertyId: newLead.propertyId !== "unassigned" ? Number(newLead.propertyId) : undefined,
      leadData: {
        firstName: newLead.firstName, lastName: newLead.lastName,
        phone: newLead.phone, email: newLead.email, notes: newLead.notes,
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lead Capture</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture leads, link them to listings, and convert qualified enquiries into CRM records
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Capture New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">First Name *</Label>
                  <Input className="mt-1 h-8 text-sm" value={newLead.firstName}
                    onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Last Name</Label>
                  <Input className="mt-1 h-8 text-sm" value={newLead.lastName}
                    onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Phone *</Label>
                <Input className="mt-1 h-8 text-sm" placeholder="+251 91 234 5678" value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input className="mt-1 h-8 text-sm" type="email" value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Source</Label>
                <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v as LeadSource })}>
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_META).map(([val, meta]) => (
                      <SelectItem key={val} value={val} className="text-sm">{meta.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Interested Property</Label>
                <Select value={newLead.propertyId} onValueChange={(value) => setNewLead({ ...newLead, propertyId: value })}>
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue placeholder="Optional property link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" className="text-sm">No property yet</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={String(property.id)} className="text-sm">
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Lead Score (0–100)</Label>
                <Input className="mt-1 h-8 text-sm" type="number" min={0} max={100} value={newLead.score}
                  onChange={(e) => setNewLead({ ...newLead, score: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea className="mt-1 text-sm" rows={2} value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-accent hover:bg-accent/90 text-white"
                  onClick={handleAddLead} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving…" : "Capture Lead"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total leads",    value: stats.total,          icon: Users,        color: "text-accent" },
          { label: "New",            value: stats.new,            icon: Zap,          color: "text-blue-500" },
          { label: "Qualified",      value: stats.qualified,      icon: CheckCircle2, color: "text-green-500" },
          { label: "Conversion",     value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-emerald-600" },
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

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-4 h-9">
          <TabsTrigger value="leads" className="text-xs">
            <Users className="w-3.5 h-3.5 mr-1.5" /> All Leads
            {stats.total > 0 && (
              <span className="ml-1.5 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {stats.total}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="builder" className="text-xs">
            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Form Builder
          </TabsTrigger>
          <TabsTrigger value="embed" className="text-xs">
            <Globe className="w-3.5 h-3.5 mr-1.5" /> Embed & Channels
          </TabsTrigger>
        </TabsList>

        {/* ── LEADS TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="leads" className="mt-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input className="pl-9 h-8 text-sm" placeholder="Search by name, phone, email…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="h-8 text-sm w-36">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All sources</SelectItem>
                {Object.entries(SOURCE_META).map(([v, m]) => (
                  <SelectItem key={v} value={v} className="text-sm">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-sm w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All statuses</SelectItem>
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <SelectItem key={v} value={v} className="text-sm">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground self-center">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No leads yet</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Add leads manually, embed your form on a website, or share your WhatsApp link.
              </p>
              <Button size="sm" onClick={() => setAddOpen(true)} className="bg-accent hover:bg-accent/90 text-white">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add First Lead
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_80px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Lead</span>
                <span>Source</span>
                <span>Status</span>
                <span>Score</span>
                <span>Date</span>
                <span></span>
              </div>

              {filtered.map((lead, i) => {
                const data = (lead.leadData as any) ?? {};
                const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || "—";
                const src = SOURCE_META[lead.source as LeadSource];
                const sts = STATUS_META[(lead.status ?? "new") as LeadStatus];
                const SrcIcon = src?.icon ?? Globe;
                const StsIcon = sts?.icon ?? Clock;
                const date = new Date(lead.createdAt).toLocaleDateString("en-ET", { day:"2-digit", month:"short" });

                return (
                  <div key={lead.id}
                    className={`grid grid-cols-[2fr_1fr_1fr_1fr_80px_80px] gap-3 px-4 py-3 items-center text-sm hover:bg-muted/30 transition-colors ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>

                    {/* Name + contact */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-semibold shrink-0">
                        {name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">{data.phone ?? data.email ?? "—"}</p>
                      </div>
                    </div>

                    {/* Source */}
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full w-fit ${src?.bg} ${src?.color}`}>
                      <SrcIcon className="w-3 h-3" />
                      {src?.label ?? lead.source}
                    </div>

                    {/* Status */}
                    <Select value={lead.status ?? "new"}
                      onValueChange={(v) => updateMutation.mutate({ id: lead.id, data: { status: v as any } })}>
                      <SelectTrigger className={`h-7 text-xs border-0 px-2 rounded-full w-28 ${sts?.bg} ${sts?.color} font-medium`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_META).map(([v, m]) => (
                          <SelectItem key={v} value={v} className="text-xs">{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Score */}
                    <ScoreBadge score={lead.score ?? 0} />

                    {/* Date */}
                    <span className="text-xs text-muted-foreground">{date}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditLead(lead)}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this lead?")) deleteMutation.mutate(lead.id); }}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── FORM BUILDER TAB ─────────────────────────────────────────────── */}
        <TabsContent value="builder" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Builder left */}
            <div className="space-y-4">
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Form settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Form name</Label>
                    <Input className="mt-1 h-8 text-sm" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Submit button label</Label>
                    <Input className="mt-1 h-8 text-sm" value={form.submitLabel}
                      onChange={(e) => setForm({ ...form, submitLabel: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Thank-you message</Label>
                    <Textarea className="mt-1 text-sm" rows={2} value={form.thankYouMessage}
                      onChange={(e) => setForm({ ...form, thankYouMessage: e.target.value })} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Fields ({form.fields.length})</CardTitle>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {FIELD_TYPES.slice(0, 4).map((ft) => (
                        <button key={ft.type} onClick={() => addField(ft.type)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-muted hover:bg-accent/10 hover:text-accent rounded transition-colors">
                          <Plus className="w-3 h-3" /> {ft.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {form.fields.map((field, i) => (
                    <FieldRow
                      key={field.id} field={field} index={i} total={form.fields.length}
                      onChange={updateField} onDelete={deleteField} onMove={moveField}
                    />
                  ))}
                  {form.fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No fields yet — add some above
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Live preview right */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Preview</p>
              <FormPreview form={form} />
            </div>
          </div>
        </TabsContent>

        {/* ── EMBED & CHANNELS TAB ─────────────────────────────────────────── */}
        <TabsContent value="embed" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Embed code */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Website embed</CardTitle>
                <CardDescription className="text-xs">
                  Place this code on any property listing page or your main website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmbedCode form={form} />
              </CardContent>
            </Card>

            {/* Channel cards */}
            <div className="space-y-3">
              {[
                {
                  icon: MessageCircle, iconColor: "text-green-600", bg: "bg-green-50",
                  title: "WhatsApp Click-to-Chat",
                  desc: "Share a link that opens a pre-filled WhatsApp message to your number.",
                  action: "Copy link",
                  snippet: "https://wa.me/251912345678?text=Hi+Estate+IQ%2C+I+am+interested+in+a+property",
                },
                {
                  icon: Facebook, iconColor: "text-blue-700", bg: "bg-blue-50",
                  title: "Facebook Lead Ads",
                  desc: "Planned integration. Use manual lead entry or website forms for now while Facebook import is still being built.",
                  action: "Coming soon",
                  snippet: null,
                },
                {
                  icon: Instagram, iconColor: "text-pink-600", bg: "bg-pink-50",
                  title: "Instagram Link in Bio",
                  desc: "Add your form URL to your Instagram bio to capture leads from your profile.",
                  action: "Copy form URL",
                  snippet: `https://app.estateiq.et/form/${form.id}`,
                },
              ].map((ch) => (
                <Card key={ch.title} className="border border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${ch.bg} flex items-center justify-center shrink-0`}>
                        <ch.icon className={`w-4.5 h-4.5 ${ch.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{ch.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ch.desc}</p>
                        {ch.snippet && (
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{ch.snippet}</code>
                            <Button size="sm" variant="outline" className="h-6 text-xs shrink-0"
                              onClick={() => { navigator.clipboard.writeText(ch.snippet!); toast.success("Copied!"); }}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Lead detail modal ─────────────────────────────────────────────── */}
      {editLead && (
        <Dialog open={!!editLead} onOpenChange={() => setEditLead(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
            </DialogHeader>
            {(() => {
              const data = (editLead.leadData as any) ?? {};
              const src  = SOURCE_META[editLead.source as LeadSource];
              const SrcIcon = src?.icon ?? Globe;
              const linkedContact = contacts.find((contact) => contact.id === editLead.contactId);
              const linkedProperty = properties.find((property) => property.id === editLead.propertyId);
              const linkedDeal = deals.find((deal) => deal.id === editLead.convertedDealId);
              return (
                <div className="space-y-4 pt-1">
                  {/* Identity */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent text-lg font-semibold">
                      {([data.firstName, data.lastName].filter(Boolean).join(" ")[0] ?? "?").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {[data.firstName, data.lastName].filter(Boolean).join(" ") || "—"}
                      </p>
                      <div className={`flex items-center gap-1 text-xs mt-0.5 ${src?.color}`}>
                        <SrcIcon className="w-3 h-3" /> {src?.label ?? editLead.source}
                      </div>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {data.phone  && <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{data.phone}</p></div>}
                    {data.email  && <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium truncate">{data.email}</p></div>}
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">CRM links</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          Contact: {linkedContact ? `${linkedContact.firstName} ${linkedContact.lastName}` : "Not converted"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Property: {linkedProperty ? linkedProperty.title : "Unassigned"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Deal: {linkedDeal ? `#${linkedDeal.id}` : "None"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={editLead.status ?? "new"}
                      onValueChange={(v) => setEditLead({ ...editLead, status: v })}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_META).map(([v, m]) => (
                          <SelectItem key={v} value={v} className="text-sm">{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Interested Property</Label>
                    <Select
                      value={editLead.propertyId ? String(editLead.propertyId) : "unassigned"}
                      onValueChange={(value) => setEditLead({ ...editLead, propertyId: value === "unassigned" ? null : Number(value) })}
                    >
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" className="text-sm">No property yet</SelectItem>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={String(property.id)} className="text-sm">
                            {property.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Score */}
                  <div>
                    <Label className="text-xs">Lead score (0–100)</Label>
                    <Input type="number" min={0} max={100} className="mt-1 h-8 text-sm"
                      value={editLead.score ?? 0}
                      onChange={(e) => setEditLead({ ...editLead, score: Number(e.target.value) || 0 })} />
                  </div>

                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      className="mt-1 text-sm"
                      rows={3}
                      value={data.notes ?? ""}
                      onChange={(e) => setEditLead({
                        ...editLead,
                        leadData: {
                          ...data,
                          notes: e.target.value,
                        },
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      disabled={!!editLead.contactId || convertMutation.isPending}
                      onClick={() => convertMutation.mutate({
                        leadId: editLead.id,
                        propertyId: editLead.propertyId ?? undefined,
                      })}
                    >
                      {editLead.contactId ? "Already converted" : "Convert to Contact"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!!editLead.contactId || !!editLead.convertedDealId || convertMutation.isPending}
                      onClick={() => convertMutation.mutate({
                        leadId: editLead.id,
                        createDeal: true,
                        propertyId: editLead.propertyId ?? undefined,
                        stage: "lead",
                      })}
                    >
                      {editLead.convertedDealId ? "Deal created" : editLead.contactId ? "Use pipeline" : "Convert to Deal"}
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1" onClick={() => setEditLead(null)}>Cancel</Button>
                    <Button className="flex-1 bg-accent hover:bg-accent/90 text-white"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({
                        id: editLead.id,
                        data: {
                          status: editLead.status,
                          score: editLead.score,
                          propertyId: editLead.propertyId ?? null,
                          leadData: {
                            ...data,
                            notes: data.notes ?? "",
                          },
                        },
                      })}>
                      {updateMutation.isPending ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
