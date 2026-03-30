import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CheckCircle2, Inbox, Palette, Plus, UploadCloud } from "lucide-react";

const EMPTY_FORM = {
  sourceName: "",
  supplierContact: "",
  title: "",
  address: "",
  city: "Addis Ababa",
  subcity: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  notes: "",
};

export default function SupplierFeedPage() {
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: listings = [] } = trpc.supplierFeed.list.useQuery();
  const createMutation = trpc.supplierFeed.create.useMutation({
    onSuccess: async () => {
      await utils.supplierFeed.list.invalidate();
      toast.success("Supplier listing added to inbox");
      setForm(EMPTY_FORM);
      setOpen(false);
    },
    onError: (error) => toast.error(error.message || "Failed to add supplier listing"),
  });
  const updateMutation = trpc.supplierFeed.update.useMutation({
    onSuccess: async () => {
      await utils.supplierFeed.list.invalidate();
      toast.success("Supplier listing updated");
    },
    onError: (error) => toast.error(error.message || "Failed to update listing"),
  });
  const importMutation = trpc.supplierFeed.importToProperties.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.supplierFeed.list.invalidate(), utils.crm.properties.list.invalidate()]);
      toast.success("Supplier listing imported to properties");
    },
    onError: (error) => toast.error(error.message || "Import failed"),
  });

  const newCount = listings.filter((item) => item.status === "new").length;
  const duplicateCount = listings.filter((item) => item.duplicatePropertyId).length;

  const handleSubmit = () => {
    if (!form.sourceName || !form.title || !form.address || !form.city) {
      toast.error("Source, title, address, and city are required");
      return;
    }

    createMutation.mutate({
      sourceName: form.sourceName,
      supplierContact: form.supplierContact || undefined,
      title: form.title,
      address: form.address,
      city: form.city,
      subcity: form.subcity || undefined,
      price: form.price ? Number(form.price) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Supplier Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review manual supplier submissions, flag duplicates, and import good listings into your owned inventory.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-white hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add supplier listing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add supplier listing</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Source name *</Label>
                  <Input className="mt-1 h-8 text-sm" value={form.sourceName} onChange={(e) => setForm((current) => ({ ...current, sourceName: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Supplier contact</Label>
                  <Input className="mt-1 h-8 text-sm" value={form.supplierContact} onChange={(e) => setForm((current) => ({ ...current, supplierContact: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Listing title *</Label>
                <Input className="mt-1 h-8 text-sm" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Address *</Label>
                <Input className="mt-1 h-8 text-sm" value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">City *</Label>
                  <Input className="mt-1 h-8 text-sm" value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Subcity</Label>
                  <Input className="mt-1 h-8 text-sm" value={form.subcity} onChange={(e) => setForm((current) => ({ ...current, subcity: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Price</Label>
                  <Input className="mt-1 h-8 text-sm" type="number" value={form.price} onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))} />
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
                  {createMutation.isPending ? "Saving..." : "Save supplier listing"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <Card className="border border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Inbox</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-foreground">{listings.length}</p></CardContent>
        </Card>
        <Card className="border border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Needs review</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-foreground">{newCount}</p></CardContent>
        </Card>
        <Card className="border border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Possible duplicates</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-foreground">{duplicateCount}</p></CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Review queue</CardTitle>
          <CardDescription className="text-xs">Duplicate detection currently compares address and price against your owned properties.</CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No supplier listings yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add manual supplier entries here before Telegram scraping and ingestion jobs are introduced.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{listing.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize text-muted-foreground">{listing.status}</span>
                        {listing.duplicatePropertyId ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">Possible duplicate</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{listing.sourceName}{listing.supplierContact ? ` • ${listing.supplierContact}` : ""}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{listing.address}, {[listing.subcity, listing.city].filter(Boolean).join(", ")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {listing.price ? `ETB ${Number(listing.price).toLocaleString()}` : "Price pending"} • {listing.bedrooms ?? "?"} bed • {listing.bathrooms ?? "?"} bath
                      </p>
                      {listing.notes ? <p className="mt-2 text-xs text-muted-foreground">{listing.notes}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {listing.status === "new" ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => updateMutation.mutate({ id: listing.id, data: { status: "reviewed" } })}>
                          <CheckCircle2 className="h-3 w-3" />
                          Mark reviewed
                        </Button>
                      ) : null}
                      {listing.status !== "imported" ? (
                        <Button size="sm" className="h-7 gap-1 bg-accent text-xs text-white hover:bg-accent/90" onClick={() => setLocation(`/design-studio/${listing.id}`)}>
                          <Palette className="h-3 w-3" />
                          Beautify in Studio
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled>
                          <CheckCircle2 className="h-3 w-3" />
                          Imported
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
