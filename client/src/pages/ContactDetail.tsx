import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MessageCircle, Edit2, Trash2,
  TrendingUp, Calendar, DollarSign, Tag, User, Save, X, MapPin, Home, Activity
} from "lucide-react";

// ── Shared Styling ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { bg: string; text: string }> = {
  active:    { bg: "bg-green-50 dark:bg-green-900/20",  text: "text-green-700 dark:text-green-400"  },
  inactive:  { bg: "bg-gray-100 dark:bg-gray-800",       text: "text-gray-600 dark:text-gray-400"   },
  converted: { bg: "bg-blue-50 dark:bg-blue-900/20",   text: "text-blue-700 dark:text-blue-400"   },
  lost:      { bg: "bg-red-50 dark:bg-red-900/20",      text: "text-red-600 dark:text-red-400"    },
};

const STAGE_COLORS: Record<string, string> = {
  lead:      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", 
  contacted: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  viewing:   "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", 
  offer:     "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  closed:    "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBirr(val: any) {
  const n = Number(val);
  if (!n) return "—";
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `ETB ${Math.round(n / 1_000)}K`;
  return `ETB ${Math.round(n).toLocaleString()}`;
}

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)    return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)     return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)    return `${days}d ago`;
  return d.toLocaleDateString("en-ET", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContactDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const id = Number(params.id);

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editForm, setEditForm] = useState<any>(null);

  const { data: contact, refetch } = trpc.crm.contacts.getById.useQuery(id, {
    onSuccess: (data: any) => {
      if (data && !editForm) setEditForm({ ...data });
      if (data) setNoteText(data.notes ?? "");
    },
  } as any);

  const { data: allDeals = [] }   = trpc.crm.deals.list.useQuery();
  const { data: properties = [] } = trpc.crm.properties.list.useQuery();
  const { data: allLeads = [] }   = trpc.crm.leads.list.useQuery();
  const { data: contactEvents = [], refetch: refetchEvents } = trpc.crm.contacts.listEvents.useQuery(id);

  const contactDeals = allDeals.filter((d) => d.contactId === id);
  const contactLeads = allLeads.filter((lead) => lead.contactId === id);

  const updateMutation = trpc.crm.contacts.update.useMutation({
    onSuccess: () => { toast.success("Contact updated"); setEditing(false); refetch(); refetchEvents(); },
    onError:   () => toast.error("Update failed"),
  });
  const deleteMutation = trpc.crm.contacts.delete.useMutation({
    onSuccess: () => { toast.success("Contact deleted"); setLocation("/crm/contacts"); },
    onError:   () => toast.error("Delete failed"),
  });
  const saveNotes = trpc.crm.contacts.update.useMutation({
    onSuccess: () => { toast.success("Notes saved"); refetch(); refetchEvents(); },
    onError:   () => toast.error("Save failed"),
  });

  if (!contact) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Loading contact…
        </div>
      </DashboardLayout>
    );
  }

  const status = STATUS_META[contact.status ?? "active"];
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();

  const handleSave = () => {
    if (!editForm) return;
    updateMutation.mutate({ id, data: {
      firstName:     editForm.firstName,
      lastName:      editForm.lastName,
      email:         editForm.email || undefined,
      phone:         editForm.phone || undefined,
      whatsappNumber:editForm.whatsappNumber || undefined,
      type:          editForm.type,
      status:        editForm.status,
      source:        editForm.source || undefined,
      subcity:       editForm.subcity === "other" ? editForm.otherSubcity : editForm.subcity || undefined,
      woreda:        editForm.woreda || undefined,
      propertyInterest: editForm.propertyInterest || undefined,
    }});
  };

  const handleSaveNotes = () => {
    saveNotes.mutate({ id, data: { notes: noteText } });
  };

  const timeline = [
    ...contactEvents.map((event) => {
      let icon = Activity;
      let clr = "text-accent";
      if (event.type === "note") { icon = MessageCircle; clr = "text-muted-foreground"; }
      else if (event.type === "deal_update") { icon = TrendingUp; clr = "text-blue-500"; }
      else if (event.type === "status_change") { icon = Tag; clr = "text-orange-500"; }
      else if (event.type === "system") { icon = User; }

      return {
        date: event.createdAt,
        label: event.label,
        description: event.description,
        icon,
        color: clr,
      };
    }),
    ...contactLeads.map((lead) => {
      const property = properties.find((item) => item.id === lead.propertyId);
      return {
        date: lead.createdAt,
        label: `Lead converted from ${lead.source}${property ? ` for ${property.title}` : ""}`,
        icon: Tag,
        color: "text-purple-500",
      };
    }),
    ...contactDeals.flatMap((d) => [
      { date: d.createdAt, label: `Deal created — ${t(`stage.${d.stage ?? "lead"}`)}`, icon: TrendingUp, color: "text-blue-500" },
      ...(d.closedAt ? [{ date: d.closedAt, label: "Deal closed", icon: DollarSign, color: "text-green-600" }] : []),
    ]),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardLayout>
      {/* Back nav */}
      <button onClick={() => setLocation("/crm/contacts")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> {t("crm.back")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN: profile + notes ───────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Profile card */}
          <div style={glassStyle} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent text-xl font-semibold">
                  {initials}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {contact.firstName} {contact.lastName}
                  </h1>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${status.bg} ${status.text}`}>
                    {t(`status.${contact.status}`)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-sm mt-6">
              <div className="space-y-2.5">
                {contact.email && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0 text-accent/60" />
                    <a href={`mailto:${contact.email}`} className="hover:text-accent transition-colors truncate">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0 text-accent/60" />
                    <a href={`tel:${contact.phone}`} className="hover:text-accent transition-colors font-medium">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.whatsappNumber && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MessageCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                    <a href={`https://wa.me/${contact.whatsappNumber.replace(/\D/g, "")}`}
                      target="_blank" rel="noreferrer"
                      className="hover:text-accent transition-colors">
                      {contact.whatsappNumber}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/50 space-y-2.5">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Tag className="w-4 h-4 shrink-0" />
                  <span className="capitalize font-medium text-foreground">{contact.type}</span>
                  {contact.source && <span className="text-muted-foreground/60">· {contact.source}</span>}
                </div>
                {(contact.subcity || contact.woreda) && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="capitalize">{[t(`subcity.${contact.subcity}`)||contact.subcity, contact.woreda].filter(Boolean).join(", Woreda ")}</span>
                  </div>
                )}
                {contact.propertyInterest && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Home className="w-4 h-4 shrink-0" />
                    <span className="capitalize">{t("crm.propertyInterest")}: {contact.propertyInterest}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Added {timeAgo(contact.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div style={glassStyle} className="p-6">
            <div className="mb-4">
              <p className="text-sm font-bold text-foreground">{t("crm.notes")}</p>
            </div>
            <Textarea
              className="text-sm min-h-[120px] resize-none bg-background/30 border-border/50 focus:border-accent"
              placeholder={t("crm.notesPlaceholder")}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button 
               size="sm" 
               variant="outline" 
               className="mt-3 w-full h-8 text-[10px] uppercase font-black tracking-widest gap-1.5 rounded-xl border-accent/20 bg-accent/5 hover:bg-accent hover:text-white transition-all"
               onClick={handleSaveNotes} 
               disabled={saveNotes.isPending}
            >
              <Save className="w-3.5 h-3.5" />
              {saveNotes.isPending ? t("crm.saving") : t("crm.saveNotes")}
            </Button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: deals + timeline ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Leads Card */}
          <div style={glassStyle} className="p-6">
            <div className="mb-4">
              <p className="text-sm font-bold text-foreground">{t("crm.leads")} ({contactLeads.length})</p>
            </div>
            {contactLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 italic">This contact was not created from a tracked lead yet.</p>
            ) : (
              <div className="space-y-2">
                {contactLeads.map((lead) => {
                  const leadData = (lead.leadData as any) ?? {};
                  const property = properties.find((p) => p.id === lead.propertyId);
                  
                  // Score logic (matching what the backend does)
                  const matchReasons = leadData.matchReasons || [];

                  return (
                    <div key={lead.id} className="group rounded-3xl bg-muted/20 border border-border/30 p-6 hover:border-accent/40 transition-all">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">
                            {[leadData.firstName, leadData.lastName].filter(Boolean).join(" ") || `Lead #${lead.id}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {property ? `Interested in ${property.title}` : "General interest"}
                          </p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-full">
                           {lead.status}
                        </span>
                      </div>

                      {matchReasons.length > 0 && (
                        <div className="pt-4 border-t border-border/50">
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                             <Activity className="w-3 h-3 text-accent" /> {t("crm.rationale")}
                           </p>
                           <div className="flex flex-wrap gap-2">
                              {matchReasons.map((reason: string, rid: number) => (
                                <span key={rid} className="px-2.5 py-1 rounded-lg bg-background/50 border border-border/50 text-[9px] font-bold text-foreground/70">
                                   {reason}
                                </span>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deals Card */}
          <div style={glassStyle} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-bold text-foreground">
                {t("crm.deals")} ({contactDeals.length})
              </p>
              <Button variant="ghost" size="sm" className="text-[10px] h-7 uppercase font-black hover:bg-accent/10 text-accent gap-1.5"
                onClick={() => setLocation("/crm/deals")}>
                <TrendingUp className="w-3 h-3" />
                View pipeline
              </Button>
            </div>
            {contactDeals.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center">
                   <DollarSign className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">No deals currently in the pipeline</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contactDeals.map((deal) => {
                  const property = properties.find((p) => p.id === deal.propertyId);
                  const stageClr = STAGE_COLORS[deal.stage ?? "lead"];
                  return (
                    <div key={deal.id}
                      className="flex items-center gap-4 p-4 rounded-[20px] bg-muted/20 border border-border/40 hover:bg-muted/40 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                         <Home className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {property?.title ?? "No property linked"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {[property?.subcity, property?.city].filter(Boolean).join(", ") || "Location unknown"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${stageClr}`}>
                            {t(`stage.${deal.stage ?? "lead"}`)}
                         </span>
                         <p className="text-sm font-black text-foreground">
                           {formatBirr(deal.value)}
                         </p>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-4 border-t border-border/50 mt-4 px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t("crm.totalValue")}</span>
                    <span className="font-black text-accent text-lg">
                      {formatBirr(contactDeals.reduce((s, d) => s + Number(d.value ?? 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interaction Timeline */}
          <div style={glassStyle} className="p-8">
            <div className="mb-8">
              <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t("crm.activity")}</p>
            </div>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center italic">{t("crm.noActivity")}</p>
            ) : (
              <div className="relative pl-2">
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent/30 via-border to-transparent" />
                <div className="space-y-8">
                  {timeline.map((event, i) => {
                    const Ic = event.icon;
                    return (
                      <div key={i} className="flex items-start gap-4 relative">
                        <div className={`w-7 h-7 rounded-full border-2 border-background bg-card flex items-center justify-center shrink-0 z-10 shadow-sm`}>
                          <Ic className={`w-3.5 h-3.5 ${event.color}`} />
                        </div>
                        <div className="flex-1 pt-0.5 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight">{event.label}</p>
                          {(event as any).description && (
                            <div className="text-sm text-muted-foreground mt-2.5 bg-muted/40 p-4 rounded-[16px] border border-border/30 leading-relaxed">
                              {(event as any).description}
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground font-bold mt-2.5 uppercase tracking-wide opacity-60">{timeAgo(event.date)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals remain mostly same but localized labels */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t("crm.edit")}</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 inline-block">First name</Label>
                  <Input className="h-9 text-sm rounded-xl" value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 inline-block">Last name</Label>
                  <Input className="h-9 text-sm rounded-xl" value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditing(false)}>Cancel</Button>
                <Button className="flex-1 bg-accent hover:bg-accent/90 text-white rounded-xl"
                  onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("crm.delete")}</DialogTitle></DialogHeader>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This will permanently delete the contact and cannot be undone.
            </p>
            <div className="flex gap-2 pt-6">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1 rounded-xl shadow-lg shadow-red-500/20"
                onClick={() => deleteMutation.mutate(id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
