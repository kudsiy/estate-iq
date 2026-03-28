import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Sparkles, Target, Trash2 } from "lucide-react";

const EMPTY_FORM = {
  contactId: "none",
  name: "",
  city: "Addis Ababa",
  subcity: "",
  budgetMin: "",
  budgetMax: "",
  bedrooms: "",
  bathrooms: "",
  notes: "",
};

export default function MatchingPage() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: profiles = [] } = trpc.matching.profiles.list.useQuery();
  const { data: contacts = [] } = trpc.crm.contacts.list.useQuery();
  const { data: matches = [] } = trpc.matching.matches.useQuery(
    { buyerProfileId: selectedProfileId ?? 0 },
    { enabled: selectedProfileId != null }
  );

  const createMutation = trpc.matching.profiles.create.useMutation({
    onSuccess: async ({ id }) => {
      await utils.matching.profiles.list.invalidate();
      setSelectedProfileId(id);
      setForm(EMPTY_FORM);
      setOpen(false);
      toast.success("Buyer profile created");
    },
    onError: (error) => toast.error(error.message || "Failed to create buyer profile"),
  });
  const deleteMutation = trpc.matching.profiles.delete.useMutation({
    onSuccess: async () => {
      await utils.matching.profiles.list.invalidate();
      setSelectedProfileId(null);
      toast.success("Buyer profile deleted");
    },
    onError: (error) => toast.error(error.message || "Failed to delete buyer profile"),
  });

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Buyer profile name is required");
      return;
    }

    createMutation.mutate({
      contactId: form.contactId !== "none" ? Number(form.contactId) : undefined,
      name: form.name,
      city: form.city || undefined,
      subcity: form.subcity || undefined,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Matching Engine</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save buyer requirements and score your listings against them using transparent rules.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-white hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add buyer profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>New buyer profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Linked contact</Label>
                  <Select value={form.contactId} onValueChange={(value) => setForm((current) => ({ ...current, contactId: value }))}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Optional CRM contact" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked contact</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={String(contact.id)}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Buyer label *</Label>
                  <Input className="mt-1 h-8 text-sm" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input className="mt-1 h-8 text-sm" value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Subcity</Label>
                  <Input className="mt-1 h-8 text-sm" value={form.subcity} onChange={(e) => setForm((current) => ({ ...current, subcity: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Budget min</Label>
                  <Input className="mt-1 h-8 text-sm" type="number" value={form.budgetMin} onChange={(e) => setForm((current) => ({ ...current, budgetMin: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Budget max</Label>
                  <Input className="mt-1 h-8 text-sm" type="number" value={form.budgetMax} onChange={(e) => setForm((current) => ({ ...current, budgetMax: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Bedrooms</Label>
                  <Input className="mt-1 h-8 text-sm" type="number" value={form.bedrooms} onChange={(e) => setForm((current) => ({ ...current, bedrooms: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Bathrooms</Label>
                  <Input className="mt-1 h-8 text-sm" type="number" value={form.bathrooms} onChange={(e) => setForm((current) => ({ ...current, bathrooms: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea className="mt-1 text-sm" rows={3} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="bg-accent text-white hover:bg-accent/90" onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Buyer profiles</CardTitle>
            <CardDescription className="text-xs">Select a buyer profile to see its top property matches.</CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="mb-4 h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm font-medium text-foreground">No buyer profiles yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Create the first requirement set to start matching.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedProfileId === profile.id ? "border-accent bg-accent/5" : "border-border hover:bg-muted/30"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{profile.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[profile.subcity, profile.city].filter(Boolean).join(", ") || "Any location"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Budget: {profile.budgetMin ? `ETB ${Number(profile.budgetMin).toLocaleString()}` : "Any"} - {profile.budgetMax ? `ETB ${Number(profile.budgetMax).toLocaleString()}` : "Any"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteMutation.mutate(profile.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Match results</CardTitle>
            <CardDescription className="text-xs">
              {selectedProfile ? `Properties scored against ${selectedProfile.name}.` : "Select a buyer profile to calculate matches."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedProfile ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="mb-4 h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm font-medium text-foreground">Pick a buyer profile</p>
                <p className="mt-1 text-xs text-muted-foreground">Top property matches will appear here with score explanations.</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Target className="mb-4 h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm font-medium text-foreground">No matches yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add more listings or broaden the buyer criteria to find matches.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.property.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{match.property.title}</p>
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                            {match.score} / 100
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[match.property.subcity, match.property.city].filter(Boolean).join(", ")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {match.property.price ? `ETB ${Number(match.property.price).toLocaleString()}` : "Price pending"} • {match.property.bedrooms ?? "?"} bed • {match.property.bathrooms ?? "?"} bath
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {match.reasons.map((reason: string) => (
                          <span key={reason} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
