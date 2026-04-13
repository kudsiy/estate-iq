import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Inbox, MessageSquare, CheckCircle2, Plus, Phone, Mail,
  Building2, Calendar, ArrowRight, User, Zap,
} from "lucide-react";

// ── Leads Inbox Tab ─────────────────────────────────────────────────────────
function LeadsInbox() {
  const [, setLocation] = useLocation();
  const { data: leads = [] } = trpc.crm.leads.list.useQuery();

const sourceColor: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  facebook:  "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  telegram:  "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400",
  tracking_link: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  manual:    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-muted/40 flex items-center justify-center">
          <Inbox className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-lg font-black text-foreground tracking-tight">{t("crm.noLeads")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm font-medium leading-relaxed">
            {t("crm.noLeadsSub")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead: any) => (
        <div
          key={lead.id}
          className="flex items-start gap-4 p-4 rounded-2xl border border-border hover:border-accent/40 hover:bg-accent/5 cursor-pointer transition-all group"
          onClick={() => setLocation(`/crm/contacts/${lead.contactId || ""}`)}
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-foreground">{lead.name || "Anonymous Lead"}</p>
              {lead.source && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${sourceColor[lead.source] || "bg-gray-100 text-gray-700"}`}>
                  {lead.source.replace("_", " ")}
                </span>
              )}
            </div>
            {lead.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> {lead.phone}
              </p>
            )}
            {lead.notes && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{lead.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-ET") : ""}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Conversations Tab ────────────────────────────────────────────────────────
function Conversations() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    whatsappNumber: "", type: "buyer" as const, notes: "",
  });

  const { data: contacts = [], refetch } = trpc.crm.contacts.list.useQuery();
  const createMutation = trpc.crm.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contact added");
      setIsOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", whatsappNumber: "", type: "buyer", notes: "" });
      refetch();
    },
    onError: (e) => toast.error(e.message || "Failed to create contact"),
  });

  const filtered = (contacts as any[]).filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-white hover:bg-accent/90 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shrink-0">
              <Plus className="w-3.5 h-3.5 mr-2" /> {t("crm.addContact")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}
              className="space-y-3 pt-2"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">First Name *</Label>
                  <Input className="mt-1 h-8 text-sm" value={formData.firstName}
                    onChange={(e) => setFormData(f => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div>
                  <Label className="text-xs">Last Name *</Label>
                  <Input className="mt-1 h-8 text-sm" value={formData.lastName}
                    onChange={(e) => setFormData(f => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input className="mt-1 h-8 text-sm" type="email" value={formData.email}
                  onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input className="mt-1 h-8 text-sm" value={formData.phone}
                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea className="mt-1 text-sm" rows={2} value={formData.notes}
                  onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-accent text-white hover:bg-accent/90"
                  disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Create Contact"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "No contacts match your search." : "All your buyer & seller conversations appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(filtered as any[]).map((contact) => (
            <div
              key={contact.id}
              onClick={() => setLocation(`/crm/contacts/${contact.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/40 hover:bg-accent/5 cursor-pointer transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-sm font-semibold text-accent">
                {contact.firstName?.[0]}{contact.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{contact.firstName} {contact.lastName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {contact.phone && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                  {contact.email && <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{contact.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                  contact.type === "buyer" ? "bg-green-100 text-green-700" :
                  contact.type === "seller" ? "bg-blue-100 text-blue-700" :
                  "bg-purple-100 text-purple-700"
                }`}>{contact.type}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Closed Deals Tab ─────────────────────────────────────────────────────────
function ClosedDeals() {
  const { data: deals = [] } = trpc.crm.deals.list.useQuery();
  const closed = (deals as any[]).filter((d) => d.stage === "closed_won" || d.stage === "closed_lost");

  if (closed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-muted/40 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-lg font-black text-foreground tracking-tight">No closed deals yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm font-medium leading-relaxed">
            Deals you mark as won or lost will appear here for tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {closed.map((deal: any) => (
        <div key={deal.id} className="flex items-start gap-4 p-4 rounded-2xl border border-border hover:bg-muted/30 transition-all">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            deal.stage === "closed_won" ? "bg-green-100" : "bg-red-100"
          }`}>
            {deal.stage === "closed_won"
              ? <CheckCircle2 className="w-5 h-5 text-green-600" />
              : <CheckCircle2 className="w-5 h-5 text-red-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{deal.title || "Untitled Deal"}</p>
            {deal.value && (
              <p className="text-xs text-accent font-semibold mt-0.5">
                ETB {Number(deal.value).toLocaleString()}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {deal.propertyTitle && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {deal.propertyTitle}
                </span>
              )}
              {deal.closedAt && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(deal.closedAt).toLocaleDateString("en-ET")}
                </span>
              )}
            </div>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
            deal.stage === "closed_won" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}>
            {deal.stage === "closed_won" ? "Won" : "Lost"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main CRM Page ────────────────────────────────────────────────────────────
export default function CRMPage() {
  const { data: leads = [] } = trpc.crm.leads.list.useQuery();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);
  const newLeadsCount = (leads as any[]).filter((l: any) => l.status === "new").length;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tighter">
          {t("nav.crm")}
          {newLeadsCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-black bg-accent text-white px-3 py-1 rounded-full uppercase tracking-widest">
              <Zap className="w-3 h-3" /> {newLeadsCount} {t("dash.activeLeads")}
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          {t("dash.commandSubtitle")}
        </p>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <div style={glassStyle} className="p-1 max-w-xl mb-8 flex">
          <TabsList className="flex-1 h-12 bg-transparent border-0 gap-1 p-0">
            <TabsTrigger value="leads" className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white">
              <Inbox className="w-3.5 h-3.5 mr-2" /> {t("crm.inbox")}
              {newLeadsCount > 0 && (
                <span className="ml-2 bg-white text-accent text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {newLeadsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white">
              <MessageSquare className="w-3.5 h-3.5 mr-2" /> {t("crm.conversations")}
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> {t("crm.closed")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="leads"><LeadsInbox /></TabsContent>
        <TabsContent value="conversations"><Conversations /></TabsContent>
        <TabsContent value="deals"><ClosedDeals /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
