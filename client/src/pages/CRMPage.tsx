import { useState, useMemo, useEffect, useRef } from "react";
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
  Building2, Calendar, ArrowRight, User, Zap, AlertTriangle, Flame,
} from "lucide-react";


// ── Leads Inbox Tab (Enforcement Engine) ───────────────────────────────────
function LeadsInbox({ t }: { t: (k: string) => string }) {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  // Queries
  const { data: leads = [], refetch } = trpc.crm.leads.list.useQuery();
  const { data: insights = [] } = trpc.crm.analytics.getPropertyInsights.useQuery();
  const { data: events = [] } = trpc.crm.contacts.events.useQuery();
  const { data: workspace } = trpc.subscription.get.useQuery();

  // Mutations
  const updateStatus = trpc.crm.leads.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Good — this increases your chance of closing", {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
      });
    }
  });

  // State
  const [triagingId, setTriagingId] = useState<number | null>(null);
  const [bypassedLeads, setBypassedLeads] = useState<Set<number>>(new Set());
  const [hasNewLeadArrived, setHasNewLeadArrived] = useState(false);
  // Humanized pressure state (Patch 20)
  const [showPressureReminder, setShowPressureReminder] = useState(false);
  const lastPressureShownAt = useRef<number>(0);
  const lastActivityAt = useRef<number>(Date.now());
  const pressureTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Track user activity for humanzied pressure
  useEffect(() => {
    const trackActivity = () => { lastActivityAt.current = Date.now(); };
    window.addEventListener("mousemove", trackActivity);
    window.addEventListener("keydown", trackActivity);
    window.addEventListener("touchstart", trackActivity);
    return () => {
      window.removeEventListener("mousemove", trackActivity);
      window.removeEventListener("keydown", trackActivity);
      window.removeEventListener("touchstart", trackActivity);
    };
  }, []);

  // Humanized pressure reminder (Patch 20): fires only if:
  // - there are new leads
  // - user has been inactive >2 minutes
  // - last reminder was >60 seconds ago
  useEffect(() => {
    const newCount = (leads as any[]).filter(l => l.status === "new").length;
    if (newCount === 0) { setShowPressureReminder(false); return; }

    pressureTimerRef.current = setInterval(() => {
      const now = Date.now();
      const inactiveMs = now - lastActivityAt.current;
      const cooldownMs = now - lastPressureShownAt.current;
      if (inactiveMs > 2 * 60 * 1000 && cooldownMs > 60 * 1000) {
        setShowPressureReminder(true);
        setHasNewLeadArrived(true);
        lastPressureShownAt.current = now;
      }
    }, 15000); // Check every 15s

    return () => clearInterval(pressureTimerRef.current);
  }, [leads.length]);

  // 1. Adaptive Threshold — Median (Patch 17 & 22)
  const adaptiveThresholdHours = useMemo(() => {
    const statusChanges = events.filter((e: any) => e.type === "status_change" && e.leadId);
    // Patch 22: Minimum 10 samples before adapting
    if (statusChanges.length < 10) return 24;

    // Use last 20 samples for median calculation
    const recent = [...statusChanges].slice(-20);
    const responseTimes = recent
      .map((e: any) => {
        const lead = (leads as any[]).find(l => l.id === e.leadId);
        if (!lead || !e.createdAt) return null;
        return (new Date(e.createdAt).getTime() - new Date(lead.createdAt).getTime()) / 3600000;
      })
      .filter((v): v is number => v !== null && v > 0)
      .sort((a, b) => a - b);

    if (responseTimes.length < 5) return 24;

    // Median calculation
    const mid = Math.floor(responseTimes.length / 2);
    const medianHours = responseTimes.length % 2 === 0
      ? (responseTimes[mid - 1] + responseTimes[mid]) / 2
      : responseTimes[mid];

    // Patch 14: Safety cap — max(8h, median * 1.5), never below 8h
    return Math.max(8, medianHours * 1.5);
  }, [events, leads]);

  // 2. Stackable High Intent Scoring (Patch 6)
  const calcIntentScore = (text: string): number => {
    if (!text) return 0;
    const clean = text.toLowerCase();
    let score = 0;
    if (/\d{10,}/.test(text.replace(/\s/g, ""))) score += 10; // phone number
    const keywords = ["price", "how much", "etb", "location", "where", "ዋጋ", "ቦታ", "የት", "yet", "sent", "ewnet"];
    if (keywords.some(k => clean.includes(k))) score += 5;
    if (text.length > 25) score += 2;
    return score;
  };
  const isHighIntent = (text: string) => calcIntentScore(text) >= 8;

  // 3. Grouping — Stable keys, 300-item cap (Patches 16 & 24)
  const groups = useMemo(() => {
    const now = Date.now();
    const thresholdMs = adaptiveThresholdHours * 60 * 60 * 1000;
    const activeThresholdMs = 15 * 60 * 1000;

    const result = { atRisk: [] as any[], activeNow: [] as any[], highIntent: [] as any[], other: [] as any[] };

    // Cap total items at 300 (Patch 24)
    const cappedLeads = (leads as any[]).slice(0, 300);

    cappedLeads.forEach(l => {
      const createdAt = new Date(l.createdAt).getTime();
      const lastInt = new Date(l.lastInteractionAt || l.createdAt).getTime();
      const ageMs = now - createdAt;
      const recencyMs = now - lastInt;
      const rawMsg = l.rawMessage || (l.leadData as any)?.text || "";
      const highIntentMatch = l.source === "manual" || (l.leadData as any)?.platform === "dm" || isHighIntent(rawMsg);

      if (l.status === "new" && ageMs > thresholdMs) result.atRisk.push(l);
      else if (recencyMs < activeThresholdMs) result.activeNow.push(l);
      else if (highIntentMatch) result.highIntent.push(l);
      else result.other.push(l);
    });

    // Stable sort (Patch 16): sort by score then createdAt — never reshuffle on re-render
    const stableSort = (arr: any[]) => [...arr].sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      atRisk: stableSort(result.atRisk),
      activeNow: stableSort(result.activeNow),
      highIntent: stableSort(result.highIntent),
      other: stableSort(result.other),
    };
  }, [leads, adaptiveThresholdHours]);

  // 4. Tab title pressure
  useEffect(() => {
    const newCount = (leads as any[]).filter(l => l.status === "new").length;
    const handleVisibility = () => {
      document.title = document.visibilityState === "visible" ? "Estate IQ" : newCount > 0 ? `⚠️ ${newCount} leads waiting` : "Estate IQ";
    };
    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [leads]);

  // 5. System Health Check (PATCH 7: real multi-signal check)
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const recentLeads = (leads as any[]).filter(
    l => l.lastInteractionAt && new Date(l.lastInteractionAt).getTime() > twoHoursAgo
  );
  const eventsLast2h = recentLeads.length;
  const uniquePropertiesLast2h = new Set(recentLeads.map((l: any) => l.propertyId)).size;
  const totalLeads = (leads as any[]).length;
  const isHealthy = eventsLast2h > 0 && uniquePropertiesLast2h > 2 && totalLeads > 20;

  // 6. New lead detection
  useEffect(() => {
    if ((leads as any[]).filter(l => l.status === "new").length > 0) setHasNewLeadArrived(true);
  }, [leads.length]);

  const sourceColor: Record<string, string> = {
    instagram: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
    facebook:  "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    telegram:  "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400",
    tracking_link: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    manual:    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    whatsapp: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    call: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  };

  // LeadCard with soft navigation lock (Patch 3)
  const LeadCard = ({ lead, autoOpen = false }: { lead: any; autoOpen?: boolean }) => {
    const isNew = lead.status === "new";
    const isBypassed = bypassedLeads.has(lead.id);
    const propTitle = insights.find((i: any) => i.id === lead.propertyId)?.title || "Unknown Property";
    const msg = lead.rawMessage || (lead.leadData as any)?.text || "";
    const isSuspicious = (lead.leadData as any)?.isSuspicious;
    const confidence = (lead.leadData as any)?.contactConfidence;

    const handleAction = (status: "contacted" | "ignored", note?: string) => {
      updateStatus.mutate({ id: lead.id, status, leadData: { ...((lead.leadData as object) || {}), triageNote: note } });
      setTriagingId(null);
    };

    const handleCardClick = () => {
      if (isNew && !isBypassed) {
        // Patch 3: First click → open triage
        setTriagingId(triagingId === lead.id ? null : lead.id);
      } else if (isNew && isBypassed) {
        // Second click → navigate with banner already set
        setLocation(`/crm/contacts/${lead.contactId || `lead:${lead.id}`}`);
      } else {
        setLocation(`/crm/contacts/${lead.contactId || `lead:${lead.id}`}`);
      }
    };

    const handleBypass = (e: React.MouseEvent) => {
      e.stopPropagation();
      setBypassedLeads(prev => new Set(prev).add(lead.id));
      setTriagingId(null);
    };

    const isTriageOpen = triagingId === lead.id || autoOpen;

    return (
      <div
        id={`lead-${lead.id}`}
        className={`flex flex-col gap-0 rounded-2xl border transition-all overflow-hidden ${
          isNew ? "border-accent/40 bg-accent/[0.02] shadow-sm" : "border-border hover:border-accent/20"
        } ${autoOpen ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
      >
        {/* Bypassed warning banner (Patch 3) */}
        {isBypassed && isNew && (
          <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Not responded — follow up now</p>
          </div>
        )}

        <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={handleCardClick}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isNew ? "bg-accent/10" : "bg-muted"}`}>
            {isNew ? <Zap className="w-5 h-5 text-accent animate-pulse" /> : <User className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-black text-foreground tracking-tight">{lead.name || "Lead Signal"}</p>
              {isNew && <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-accent text-white animate-pulse">⚠️ Not contacted</span>}
              {lead.source && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${sourceColor[lead.source] || "bg-gray-100"}`}>
                  {lead.source.replace("_", " ")}
                </span>
              )}
              {isSuspicious && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-red-100 text-red-600">⚠ Gaming detected</span>
              )}
              {confidence && confidence !== "strong" && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                  confidence === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"
                }`}>{confidence} contact</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              Property: <span className="text-foreground/70">{propTitle}</span>
            </p>
            {msg && <p className="text-[12px] text-foreground/80 mt-2 font-medium line-clamp-1 italic">"{msg}"</p>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[9px] font-black text-muted-foreground uppercase opacity-60">
              {new Date(lead.createdAt).toLocaleDateString("en-ET")}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-accent/[0.03] border border-accent/5">
              <span className="text-[10px] font-black text-accent">{lead.score}</span>
            </div>
          </div>
        </div>

        {isTriageOpen && isNew && (
          <div className="bg-accent/5 border-t border-accent/10 p-4 space-y-4">
            <div className="p-3 rounded-xl bg-background/50 border border-accent/10">
              <p className="text-[11px] font-black uppercase tracking-widest text-accent mb-2">Signal Data</p>
              <p className="text-sm font-medium leading-relaxed italic">"{msg || t("crm.noMessage")}"</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleAction("contacted")}
                className="flex-1 bg-accent text-white h-12 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/90"
              >
                ✅ Mark Contacted
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const ignoredLeads = (leads as any[]).filter(l => l.status === "ignored");
                  if (leads.length > 10 && (ignoredLeads.length / leads.length) > 0.3) {
                    toast.warning("You are ignoring too many leads — you may be losing deals");
                  }
                  handleAction("ignored");
                }}
                className="flex-1 border-accent/20 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-accent hover:bg-accent/5"
              >
                🚫 Ignore
              </Button>
            </div>
            {/* Patch 3: Soft bypass option */}
            <button
              onClick={handleBypass}
              className="w-full text-[10px] text-muted-foreground/50 hover:text-muted-foreground text-center py-1 transition-colors"
            >
              View anyway (not recommended)
            </button>
          </div>
        )}
      </div>
    );
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-muted/40 flex items-center justify-center">
          <Inbox className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-lg font-black text-foreground tracking-tight">{t("crm.noLeads")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm font-medium leading-relaxed font-outfit">
            No leads yet. Ensure your property listings are active and tracking links are shared.
          </p>
        </div>
      </div>
    );
  }

  // Sticky-header virtualized list (Patches 7, 13, 16)
  type ListItem =
    | { type: "header"; label: string; icon: any; colorClass: string }
    | { type: "lead"; lead: any; autoOpen: boolean; dimmed: boolean };

  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    const sections = [
      { key: "atRisk",     label: "🔥 At Risk",    icon: Flame, colorClass: "text-orange-500" },
      { key: "activeNow",  label: "⚡ Active Now",  icon: Flame, colorClass: "text-accent" },
      { key: "highIntent", label: "🎯 High Intent", icon: Zap,   colorClass: "text-accent" },
      { key: "other",      label: "📥 Other",       icon: Inbox, colorClass: "text-muted-foreground/60" },
    ] as const;

    // PATCH 5: Track absolute lead index across groups — dim everything after top 3
    let leadIndex = 0;
    sections.forEach(({ key, label, icon, colorClass }) => {
      const groupLeads = groups[key];
      if (groupLeads.length === 0) return;
      items.push({ type: "header", label, icon, colorClass });
      groupLeads.forEach((lead, i) => {
        items.push({
          type: "lead",
          lead,
          autoOpen: hasNewLeadArrived && key === "atRisk" && i === 0,
          dimmed: leadIndex >= 3,
        });
        leadIndex++;
      });
    });

    return items;
  }, [groups, hasNewLeadArrived]);

  return (
    <div className="space-y-12">
      {/* ── System Health Warning ── */}
      {!isHealthy && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-600 tracking-tight">⚠️ No tracking signals detected</p>
            <p className="text-[11px] text-amber-600/70 font-medium">Your engine hasn't received a signal in 2 hours. Check your active links.</p>
          </div>
        </div>
      )}

      {/* ── PASTE MODE ── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-accent/0 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative p-6 rounded-[32px] bg-white dark:bg-zinc-900 border border-border shadow-2xl overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-2xl shadow-accent/40">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground tracking-tighter">Behavioral Capture</h4>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.1em]">Paste comments or DM text for high-intent tagging</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Paste lead message here..."
                className="rounded-2xl h-16 bg-muted/30 border-transparent focus:bg-background transition-all pl-6 text-sm font-medium"
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (text && text.length > 10 && isHighIntent(text)) {
                    window.dispatchEvent(new CustomEvent("open-quick-capture", { detail: { text } }));
                  }
                }}
              />
            </div>
            <Button className="h-16 w-16 rounded-2xl bg-accent text-white shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all" onClick={() => window.dispatchEvent(new CustomEvent("open-quick-capture"))}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Virtualized Lead List with Sticky Headers ── */}
      <div className="space-y-3">
        {listItems.map((item, idx) =>
          item.type === "header" ? (
            <div key={`header-${item.label}-${idx}`} className="sticky top-0 z-10 flex items-center gap-2 px-1 py-2 bg-background/95 backdrop-blur-sm">
              <item.icon className={`w-4 h-4 ${item.colorClass}`} />
              <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${item.colorClass}`}>{item.label}</h3>
            </div>
          ) : (
            // PATCH 5: dimmed = opacity-60 for leads beyond top 3
            <div key={`lead-${item.lead.id}`} className={item.dimmed ? "opacity-60" : undefined}>
              <LeadCard lead={item.lead} autoOpen={item.autoOpen} />
            </div>
          )
        )}
      </div>

      {/* ── Humanized Pressure Reminder (Patch 20) ── */}
      {showPressureReminder && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50">
          <Button
            onClick={() => {
              const el = document.querySelector('[id^="lead-"]');
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
              setShowPressureReminder(false);
              setHasNewLeadArrived(false);
            }}
            className="rounded-full bg-accent text-white h-12 px-8 font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-accent/40 animate-bounce"
          >
            ⚠️ Unhandled leads waiting
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Conversations Tab ────────────────────────────────────────────────────────
function Conversations() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
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
  const { data: leads = [], refetch: refetchLeads } = trpc.crm.leads.list.useQuery();
  const { t } = useLanguage();
  const { theme } = useTheme();

  // State for Quick Capture
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState<{ platform: "tiktok" | "facebook" | "instagram" | "telegram", propertyId: string, text: string }>({
    platform: "tiktok",
    propertyId: "",
    text: ""
  });

  const createLeadMutation = trpc.crm.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead captured instantly");
      setIsQuickAddOpen(false);
      setQuickAddForm({ platform: "tiktok", propertyId: "", text: "" });
      refetchLeads();
    },
    onError: (e) => toast.error(e.message || "Capture failed"),
  });

  useEffect(() => {
    const handleOpen = (e: any) => {
      if (e.detail?.text) {
        setQuickAddForm(prev => ({ ...prev, text: e.detail.text }));
      }
      setIsQuickAddOpen(true);
    };
    window.addEventListener('open-quick-capture', handleOpen);
    return () => window.removeEventListener('open-quick-capture', handleOpen);
  }, []);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate({
      source: "manual",
      status: "new",
      propertyId: quickAddForm.propertyId ? parseInt(quickAddForm.propertyId) : undefined,
      leadData: {
        platform: quickAddForm.platform,
        text: quickAddForm.text,
        action: "manual_capture",
        sourceId: "CRM_QuickAdd"
      }
    });
  };

  const getGlassStyle = (theme: string) => ({
    backgroundColor: theme === "dark" ? "rgba(24, 24, 27, 0.8)" : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
  });

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

          <div className="ml-auto">
            <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-white hover:bg-accent/90 h-10 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent/20">
                  <Zap className="w-3.5 h-3.5 mr-2" /> Quick Capture
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black tracking-tighter italic">Frictionless Capture</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleQuickAdd} className="space-y-4 pt-4">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source Platform</Label>
                    <Select value={quickAddForm.platform} onValueChange={v => setQuickAddForm(f => ({ ...f, platform: v as any }))}>
                      <SelectTrigger className="h-12 mt-2 rounded-xl text-sm font-medium"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference Property ID (Optional)</Label>
                    <Input className="h-12 mt-2 rounded-xl" placeholder="e.g. 1" value={quickAddForm.propertyId} onChange={e => setQuickAddForm(f => ({ ...f, propertyId: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paste Chat/Comment Text</Label>
                    <Textarea className="mt-2 rounded-xl min-h-[120px] text-sm" placeholder="Paste the message from the user here..." value={quickAddForm.text} onChange={e => setQuickAddForm(f => ({ ...f, text: e.target.value }))} required />
                  </div>
                  <Button type="submit" disabled={createLeadMutation.isPending} className="w-full bg-accent text-white hover:bg-accent/90 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-accent/20 mt-4">
                    {createLeadMutation.isPending ? "Capturing..." : "Capture Lead"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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

        <TabsContent value="leads"><LeadsInbox t={t} /></TabsContent>
        <TabsContent value="conversations"><Conversations /></TabsContent>
        <TabsContent value="deals"><ClosedDeals /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
