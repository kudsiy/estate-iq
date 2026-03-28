import { useState } from "react";
import { useLocation, useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MessageCircle, Edit2, Trash2,
  TrendingUp, Calendar, DollarSign, Tag, User, Save, X,
} from "lucide-react";

const STATUS_META: Record<string, { bg: string; text: string }> = {
  active:    { bg: "bg-green-50",  text: "text-green-700"  },
  inactive:  { bg: "bg-gray-100",  text: "text-gray-600"   },
  converted: { bg: "bg-blue-50",   text: "text-blue-700"   },
  lost:      { bg: "bg-red-50",    text: "text-red-600"    },
};

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead", contacted: "Contacted", viewing: "Property Viewing",
  offer: "Offer", closed: "Closed Deal",
};

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-blue-50 text-blue-700", contacted: "bg-purple-50 text-purple-700",
  viewing: "bg-amber-50 text-amber-700", offer: "bg-orange-50 text-orange-700",
  closed: "bg-green-50 text-green-700",
};

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

export default function ContactDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = Number(params.id);

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

  const contactDeals = allDeals.filter((d) => d.contactId === id);
  const contactLeads = allLeads.filter((lead) => lead.contactId === id);

  const updateMutation = trpc.crm.contacts.update.useMutation({
    onSuccess: () => { toast.success("Contact updated"); setEditing(false); refetch(); },
    onError:   () => toast.error("Update failed"),
  });
  const deleteMutation = trpc.crm.contacts.delete.useMutation({
    onSuccess: () => { toast.success("Contact deleted"); setLocation("/crm/contacts"); },
    onError:   () => toast.error("Delete failed"),
  });
  const saveNotes = trpc.crm.contacts.update.useMutation({
    onSuccess: () => { toast.success("Notes saved"); refetch(); },
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
    }});
  };

  const handleSaveNotes = () => {
    saveNotes.mutate({ id, data: { notes: noteText } });
  };

  // Build timeline from deal events + contact creation
  const timeline = [
    { date: contact.createdAt, label: "Contact created", icon: User, color: "text-accent" },
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
      { date: d.createdAt, label: `Deal created — ${STAGE_LABELS[d.stage ?? "lead"]}`, icon: TrendingUp, color: "text-blue-500" },
      ...(d.closedAt ? [{ date: d.closedAt, label: "Deal closed", icon: DollarSign, color: "text-green-600" }] : []),
    ]),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardLayout>
      {/* Back nav */}
      <button onClick={() => setLocation("/crm/contacts")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to contacts
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN: profile + notes ───────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Profile card */}
          <Card className="border border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent text-xl font-semibold">
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">
                      {contact.firstName} {contact.lastName}
                    </h1>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${status.bg} ${status.text}`}>
                      {contact.status}
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

              {/* Contact details */}
              <div className="space-y-2.5 text-sm">
                {contact.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="hover:text-accent transition-colors truncate">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <a href={`tel:${contact.phone}`} className="hover:text-accent transition-colors">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.whatsappNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <a href={`https://wa.me/${contact.whatsappNumber.replace(/\D/g, "")}`}
                      target="_blank" rel="noreferrer"
                      className="hover:text-accent transition-colors">
                      {contact.whatsappNumber}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="capitalize">{contact.type}</span>
                  {contact.source && <span className="text-muted-foreground/60">· {contact.source}</span>}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Added {timeAgo(contact.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <Textarea
                className="text-sm min-h-[100px] resize-none"
                placeholder="Add notes about this contact…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1.5"
                onClick={handleSaveNotes} disabled={saveNotes.isPending}>
                <Save className="w-3 h-3" />
                {saveNotes.isPending ? "Saving…" : "Save notes"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: deals + timeline ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          <Card className="border border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium">Lead links ({contactLeads.length})</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {contactLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">This contact was not created from a tracked lead yet.</p>
              ) : (
                <div className="space-y-2">
                  {contactLeads.map((lead) => {
                    const leadData = (lead.leadData as any) ?? {};
                    const property = properties.find((p) => p.id === lead.propertyId);
                    return (
                      <div key={lead.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {[leadData.firstName, leadData.lastName].filter(Boolean).join(" ") || `Lead #${lead.id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {property ? `Interested in ${property.title}` : "No property linked"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">{lead.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deals */}
          <Card className="border border-border">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Deals ({contactDeals.length})
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7"
                  onClick={() => setLocation("/crm/deals")}>
                  View pipeline
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {contactDeals.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center gap-2">
                  <TrendingUp className="w-7 h-7 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No deals yet</p>
                  <Button size="sm" variant="outline" className="text-xs h-7"
                    onClick={() => setLocation("/crm/deals")}>
                    Open pipeline
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {contactDeals.map((deal) => {
                    const property = properties.find((p) => p.id === deal.propertyId);
                    const stageClass = STAGE_COLORS[deal.stage ?? "lead"] ?? "bg-gray-50 text-gray-700";
                    return (
                      <div key={deal.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {property?.title ?? "No property linked"}
                          </p>
                          {property && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[property.subcity, property.city].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${stageClass}`}>
                          {STAGE_LABELS[deal.stage ?? "lead"]}
                        </span>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-accent">
                            {formatBirr(deal.value)}
                          </p>
                          {deal.commission && (
                            <p className="text-xs text-muted-foreground">
                              {formatBirr(deal.commission)} comm.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-1 border-t border-border mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total deal value</span>
                      <span className="font-semibold text-foreground">
                        {formatBirr(contactDeals.reduce((s, d) => s + Number(d.value ?? 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interaction timeline */}
          <Card className="border border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-4">
                    {timeline.map((event, i) => {
                      const Icon = event.icon;
                      return (
                        <div key={i} className="flex items-start gap-3 pl-0">
                          <div className={`w-7 h-7 rounded-full border-2 border-background bg-card flex items-center justify-center shrink-0 z-10`}>
                            <Icon className={`w-3.5 h-3.5 ${event.color}`} />
                          </div>
                          <div className="flex-1 pt-0.5 min-w-0">
                            <p className="text-sm text-foreground">{event.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(event.date)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Edit modal ─────────────────────────────────────────────────── */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit contact</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">First name</Label>
                  <Input className="mt-1 h-8 text-sm" value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Last name</Label>
                  <Input className="mt-1 h-8 text-sm" value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input className="mt-1 h-8 text-sm" type="email" value={editForm.email ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input className="mt-1 h-8 text-sm" value={editForm.phone ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">WhatsApp</Label>
                  <Input className="mt-1 h-8 text-sm" value={editForm.whatsappNumber ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Source</Label>
                <Input className="mt-1 h-8 text-sm" placeholder="e.g. Referral, Website…"
                  value={editForm.source ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
                <Button className="flex-1 bg-accent hover:bg-accent/90 text-white"
                  onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ─────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Delete contact?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground pt-1">
            This will permanently delete {contact.firstName} {contact.lastName} and cannot be undone.
            Their linked deals will remain.
          </p>
          <div className="flex gap-2 pt-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1"
              onClick={() => deleteMutation.mutate(id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
