import DashboardLayout from "@/components/DashboardLayout";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DealCard } from "@/components/DealCard";
import { trpc } from "@/lib/trpc";
import { Plus, Search, X, DollarSign, FileText, Save, Trash2, ExternalLink, TrendingUp, Activity, MessageCircle, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Droppable } from "@/components/Droppable";

const STAGES = ["lead", "contacted", "viewing", "offer", "closed"] as const;

const STAGE_LABELS = {
  lead: "Lead",
  contacted: "Contacted",
  viewing: "Property Viewing",
  offer: "Offer",
  closed: "Closed Deal",
};

const STAGE_COLORS = {
  lead: "bg-blue-50 border-blue-200",
  contacted: "bg-purple-50 border-purple-200",
  viewing: "bg-amber-50 border-amber-200",
  offer: "bg-orange-50 border-orange-200",
  closed: "bg-green-50 border-green-200",
};

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-ET", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DealPipeline() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(
    searchParams.get("id") ? Number(searchParams.get("id")) : null
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [propertyFilter, setPropertyFilter] = useState(searchParams.get("property") || "all");
  const [minValue, setMinValue] = useState(searchParams.get("min") || "");
  const [maxValue, setMaxValue] = useState(searchParams.get("max") || "");
  const [stageFilter, setStageFilter] = useState<string[]>(
    searchParams.get("stage") ? searchParams.get("stage")!.split(",") : []
  );

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (propertyFilter !== "all") params.set("property", propertyFilter);
    if (minValue) params.set("min", minValue);
    if (maxValue) params.set("max", maxValue);
    if (stageFilter.length > 0) params.set("stage", stageFilter.join(","));
    if (selectedDealId) params.set("id", selectedDealId.toString());

    const queryString = params.toString();
    const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
  }, [searchTerm, propertyFilter, minValue, maxValue, stageFilter, selectedDealId]);
  const [formData, setFormData] = useState({
    leadId: "",
    contactId: "",
    propertyId: "",
    value: "",
    commission: "",
    notes: "",
  });



  const { data: deals, refetch } = trpc.crm.deals.list.useQuery();
  const { data: contacts } = trpc.crm.contacts.list.useQuery();
  const { data: properties } = trpc.crm.properties.list.useQuery();
  const { data: leads = [] } = trpc.crm.leads.list.useQuery();

  const createMutation = trpc.crm.deals.create.useMutation({
    onSuccess: () => {
      toast.success("Deal created successfully");
      setIsOpen(false);
      setFormData({ leadId: "", contactId: "", propertyId: "", value: "", commission: "", notes: "" });
      refetch();
    },
    onError: (error) => { toast.error(error.message || "Failed to create deal"); },
  });

  const updateMutation = trpc.crm.deals.update.useMutation({
    onSuccess: () => { 
      toast.success("Deal updated successfully"); 
      refetch(); 
      if (selectedDealId) refetchEvents();
    },
    onError: (error) => { toast.error(error.message || "Failed to update deal"); },
  });

  const deleteMutation = trpc.crm.deals.delete.useMutation({
    onSuccess: () => { toast.success("Deal deleted"); setSelectedDealId(null); refetch(); },
    onError: () => toast.error("Delete failed"),
  });

  const { data: dealEvents = [], refetch: refetchEvents } = trpc.crm.deals.listEvents.useQuery(selectedDealId!, {
    enabled: !!selectedDealId,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter deals based on search and filter criteria
  const filteredDeals = useMemo(() => {
    if (!deals) return [];

    return deals.filter((deal) => {
      const contactName = contacts?.find((c) => c.id === deal.contactId);
      const propertyName = properties?.find((p) => p.id === deal.propertyId);

      // Search filter (agent/contact name or property title)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (contactName && `${contactName.firstName} ${contactName.lastName}`.toLowerCase().includes(searchLower)) ||
        (propertyName && propertyName.title.toLowerCase().includes(searchLower));

      // Property filter
      const matchesProperty = propertyFilter === "all" || deal.propertyId === Number(propertyFilter);

      // Value range filter
      const dealValue = Number(deal.value) || 0;
      const matchesMinValue = !minValue || dealValue >= Number(minValue);
      const matchesMaxValue = !maxValue || dealValue <= Number(maxValue);

      // Stage filter
      const matchesStage = stageFilter.length === 0 || stageFilter.includes(deal.stage || "");

      return matchesSearch && matchesProperty && matchesMinValue && matchesMaxValue && matchesStage;
    });
  }, [deals, contacts, properties, searchTerm, propertyFilter, minValue, maxValue, stageFilter]);

  // Group filtered deals by stage
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, typeof filteredDeals> = {};
    STAGES.forEach((stage) => {
      grouped[stage] = filteredDeals.filter((deal) => deal.stage === stage) || [];
    });
    return grouped;
  }, [filteredDeals]);

  // Calculate stage statistics from filtered deals
  const stageStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {};
    STAGES.forEach((stage) => {
      const stageDeals = dealsByStage[stage] || [];
      stats[stage] = {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0),
      };
    });
    return stats;
  }, [dealsByStage]);

  const totalPipelineValue = Object.values(stageStats).reduce((sum, stat) => sum + stat.value, 0);
  const totalFilteredDeals = filteredDeals.length;

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (propertyFilter !== "all") count++;
    if (minValue) count++;
    if (maxValue) count++;
    if (stageFilter.length > 0) count++;
    return count;
  }, [searchTerm, propertyFilter, minValue, maxValue, stageFilter]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setPropertyFilter("all");
    setMinValue("");
    setMaxValue("");
    setStageFilter([]);
  }, []);

  // Toggle stage filter
  const toggleStageFilter = useCallback((stage: string) => {
    setStageFilter((prev) => (prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const dealId = active.id as number;
    const newStage = over.id as string;

    const deal = deals?.find((d) => d.id === dealId);
    if (deal && deal.stage !== newStage) {
      updateMutation.mutate({
        id: dealId,
        data: { stage: newStage as any },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactId) {
      toast.error("Please select a contact");
      return;
    }

    createMutation.mutate({
      leadId: formData.leadId ? Number(formData.leadId) : undefined,
      contactId: Number(formData.contactId),
      propertyId: formData.propertyId ? Number(formData.propertyId) : undefined,
      value: formData.value ? Number(formData.value) : undefined,
      commission: formData.commission ? Number(formData.commission) : undefined,
      notes: formData.notes,
      stage: "lead",
    });
  };

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Deal Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag deals between stages to track progress</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Button>
          </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                  <DialogDescription>Add a new deal to your pipeline</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="lead">Lead (Optional)</Label>
                    <Select
                      value={formData.leadId}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData((current) => ({ ...current, leadId: "" }));
                          return;
                        }
                        const selectedLead = leads.find((lead) => String(lead.id) === value);
                        setFormData((current) => ({
                          ...current,
                          leadId: value,
                          contactId: selectedLead?.contactId ? String(selectedLead.contactId) : current.contactId,
                          propertyId: selectedLead?.propertyId ? String(selectedLead.propertyId) : current.propertyId,
                        }));
                      }}
                    >
                      <SelectTrigger id="lead">
                        <SelectValue placeholder="Select a converted lead" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No lead</SelectItem>
                        {leads
                          .filter((lead) => lead.contactId)
                          .map((lead) => {
                            const leadData = (lead.leadData as any) ?? {};
                            const leadName = [leadData.firstName, leadData.lastName].filter(Boolean).join(" ") || `Lead #${lead.id}`;
                            return (
                              <SelectItem key={lead.id} value={String(lead.id)}>
                                {leadName}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="contact">Contact</Label>
                    <Select value={formData.contactId} onValueChange={(value) => setFormData({ ...formData, contactId: value })}>
                      <SelectTrigger id="contact">
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts?.map((contact) => (
                          <SelectItem key={contact.id} value={String(contact.id)}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="property">Property (Optional)</Label>
                    <Select value={formData.propertyId} onValueChange={(value) => setFormData({ ...formData, propertyId: value })}>
                      <SelectTrigger id="property">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties?.map((property) => (
                          <SelectItem key={property.id} value={String(property.id)}>
                            {property.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="value">Deal Value (ETB)</Label>
                      <Input
                        id="value"
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="commission">Commission (ETB)</Label>
                      <Input
                        id="commission"
                        type="number"
                        value={formData.commission}
                        onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any notes about this deal..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-accent hover:bg-accent/90 text-white" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Deal"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Pipeline Value</p>
          <p className="text-2xl font-semibold text-foreground">ETB {(totalPipelineValue / 1_000_000).toFixed(1)}M</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Deals</p>
          <p className="text-2xl font-semibold text-foreground">{deals?.length || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Filtered</p>
          <p className="text-2xl font-semibold text-foreground">{totalFilteredDeals}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Closed This Month</p>
          <p className="text-2xl font-semibold text-foreground">{stageStats["closed"].count}</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
            {/* Search Input */}
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <Label htmlFor="search" className="text-sm">
                  Search by Agent or Property
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-destructive hover:text-destructive">
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters ({activeFiltersCount})
                </Button>
              )}
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="property" className="text-sm">
                  Property
                </Label>
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger id="property" className="mt-1">
                    <SelectValue placeholder="All properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All properties</SelectItem>
                    {properties?.map((prop) => (
                      <SelectItem key={prop.id} value={String(prop.id)}>
                        {prop.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="minValue" className="text-sm">
                  Min Value (ETB)
                </Label>
                <Input
                  id="minValue"
                  type="number"
                  placeholder="0"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="maxValue" className="text-sm">
                  Max Value (ETB)
                </Label>
                <Input
                  id="maxValue"
                  type="number"
                  placeholder="No limit"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Stages</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {STAGES.map((stage) => (
                    <Button
                      key={stage}
                      variant={stageFilter.includes(stage) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStageFilter(stage)}
                      className={stageFilter.includes(stage) ? "bg-accent hover:bg-accent/90 text-white" : ""}
                    >
                      {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

      {/* Kanban board */}
      <div>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {STAGES.map((stage) => (
              <div key={stage}>
                <Card className={`border-2 ${STAGE_COLORS[stage]}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{STAGE_LABELS[stage]}</CardTitle>
                        <CardDescription className="mt-1">{stageStats[stage].count} deals</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="text-sm font-semibold text-foreground">
                          ETB {(stageStats[stage].value / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Droppable id={stage}>
                      <SortableContext items={dealsByStage[stage]?.map((d) => d.id) || []} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 min-h-[400px]">
                          {dealsByStage[stage]?.map((deal) => (
                            <DealCard
                              key={deal.id}
                              id={deal.id}
                              contactName={
                                contacts?.find((c) => c.id === deal.contactId)
                                  ? `${contacts.find((c) => c.id === deal.contactId)?.firstName} ${contacts.find((c) => c.id === deal.contactId)?.lastName}`
                                  : "Unknown"
                              }
                              propertyTitle={properties?.find((p) => p.id === deal.propertyId)?.title}
                              value={Number(deal.value)}
                              stage={stage}
                              onViewDetails={() => setSelectedDealId(deal.id)}
                            />
                          ))}
                          {dealsByStage[stage]?.length === 0 && (
                            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                              No deals yet
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </DndContext>
      </div>

      {/* ── Deal detail modal ──────────────────────────────────────────── */}
      {selectedDealId && (() => {
        const deal = deals?.find((d) => d.id === selectedDealId);
        if (!deal) return null;
        const contact = contacts?.find((c) => c.id === deal.contactId);
        const property = properties?.find((p) => p.id === deal.propertyId);
        const lead = leads.find((item) => item.id === deal.leadId);
        const formatBirr = (v: any) => {
          const n = Number(v); if (!n) return "—";
          return n >= 1_000_000 ? `ETB ${(n/1_000_000).toFixed(1)}M` : `ETB ${Math.round(n).toLocaleString()}`;
        };
        const stageLabel: Record<string,string> = {
          lead:"Lead", contacted:"Contacted", viewing:"Property Viewing", offer:"Offer", closed:"Closed Deal"
        };
        return (
          <Dialog open={!!selectedDealId} onOpenChange={() => setSelectedDealId(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Deal — {contact ? `${contact.firstName} ${contact.lastName}` : "Unknown contact"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">

                {/* Stage + value */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Stage</p>
                    <Select
                      value={deal.stage ?? "lead"}
                      onValueChange={(v) => updateMutation.mutate({ id: deal.id, data: { stage: v as any } })}
                    >
                      <SelectTrigger className="h-8 text-sm border-0 bg-transparent p-0 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(stageLabel).map(([v, l]) => (
                          <SelectItem key={v} value={v} className="text-sm">{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Deal value</p>
                    <p className="text-base font-semibold text-accent">{formatBirr(deal.value)}</p>
                  </div>
                </div>

                {/* Commission */}
                {deal.commission && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Commission:</span>
                    <span className="font-medium text-foreground">{formatBirr(deal.commission)}</span>
                  </div>
                )}

                {/* Linked contact */}
                {contact && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-semibold">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{contact.firstName} {contact.lastName}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone ?? contact.email ?? "—"}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => { setSelectedDealId(null); setLocation(`/crm/contacts/${contact.id}`); }}>
                      <ExternalLink className="w-3 h-3" /> View
                    </Button>
                  </div>
                )}

                {/* Linked property */}
                {property && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{property.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[property.subcity, property.city].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-accent">
                      {formatBirr(property.price)}
                    </p>
                  </div>
                )}

                {lead && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Linked lead</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {lead.status ?? "new"} lead from {lead.source}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">#{lead.id}</p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    className="mt-1 text-sm min-h-[80px]"
                    defaultValue={deal.notes ?? ""}
                    placeholder="Add notes about this deal…"
                    onBlur={(e) => {
                      if (e.target.value !== (deal.notes ?? ""))
                        updateMutation.mutate({ id: deal.id, data: { notes: e.target.value } });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Notes save automatically when you click away</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                  <div>
                    <span className="block font-medium text-foreground mb-0.5">Created</span>
                    {new Date(deal.createdAt).toLocaleDateString("en-ET", { day:"2-digit", month:"short", year:"numeric" })}
                  </div>
                  {deal.closedAt && (
                    <div>
                      <span className="block font-medium text-foreground mb-0.5">Closed</span>
                      {new Date(deal.closedAt).toLocaleDateString("en-ET", { day:"2-digit", month:"short", year:"numeric" })}
                    </div>
                  )}
                </div>

                {/* Suggested Next Action */}
                {deal.stage !== "closed" && (
                  <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mt-1 mb-2">
                    <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      Suggested Next Step
                    </h4>
                    {deal.stage === "lead" && (
                      <Button className="w-full justify-start gap-2 h-9 text-sm font-medium" variant="outline"
                        onClick={() => updateMutation.mutate({ id: deal.id, data: { stage: "contacted" } })}>
                        <MessageCircle className="w-4 h-4 text-blue-500" /> Mark as Contacted
                      </Button>
                    )}
                    {deal.stage === "contacted" && (
                      <Button className="w-full justify-start gap-2 h-9 text-sm font-medium" variant="outline"
                        onClick={() => updateMutation.mutate({ id: deal.id, data: { stage: "viewing" } })}>
                        <Calendar className="w-4 h-4 text-purple-500" /> Schedule Property Viewing
                      </Button>
                    )}
                    {deal.stage === "viewing" && (
                      <Button className="w-full justify-start gap-2 h-9 text-sm font-medium" variant="outline"
                        onClick={() => updateMutation.mutate({ id: deal.id, data: { stage: "offer" } })}>
                        <DollarSign className="w-4 h-4 text-orange-500" /> Log Offer Received
                      </Button>
                    )}
                    {deal.stage === "offer" && (
                      <Button className="w-full justify-start gap-2 h-9 text-sm font-medium bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        variant="outline"
                        onClick={() => updateMutation.mutate({ id: deal.id, data: { stage: "closed" } })}>
                        <CheckCircle className="w-4 h-4 text-green-600" /> Finalize Handover & Close
                      </Button>
                    )}
                  </div>
                )}

                {/* Deal Activity Timeline */}
                <div className="pt-4 border-t border-border mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Deal Activity
                  </h4>
                  {dealEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded for this deal</p>
                  ) : (
                    <div className="relative pb-4">
                      <div className="absolute left-3.5 top-2 bottom-0 w-px bg-border" />
                      <div className="space-y-4">
                        {dealEvents.map((event, i) => {
                          let Icon = Activity;
                          let color = "text-accent";
                          if (event.type === "note") { Icon = MessageCircle; color = "text-muted-foreground"; }
                          else if (event.type === "deal_update") { Icon = TrendingUp; color = "text-blue-500"; }
                          else if (event.type === "system") { Icon = Plus; }

                          return (
                            <div key={i} className="flex items-start gap-3 pl-0">
                              <div className="w-7 h-7 rounded-full border-2 border-background bg-card flex items-center justify-center shrink-0 z-10">
                                <Icon className={`w-3.5 h-3.5 ${color}`} />
                              </div>
                              <div className="flex-1 pt-0.5 min-w-0">
                                <p className="text-sm text-foreground">{event.label}</p>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md border border-border/30">
                                    {event.description}
                                  </p>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(event.createdAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedDealId(null)}>
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => { if (confirm("Delete this deal?")) deleteMutation.mutate(deal.id); }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleteMutation.isPending ? "Deleting…" : "Delete deal"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </DashboardLayout>
  );
}
