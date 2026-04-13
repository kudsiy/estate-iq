import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CheckCircle2, Inbox, Palette, Plus, UploadCloud, Building2, MapPin, DollarSign, Activity, Search, ShieldAlert } from "lucide-react";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

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
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: listings = [] } = trpc.supplierFeed.list.useQuery();
  const createMutation = trpc.supplierFeed.create.useMutation({
    onSuccess: async () => {
      await utils.supplierFeed.list.invalidate();
      toast.success(t("status.updated"));
      setForm(EMPTY_FORM);
      setOpen(false);
    },
    onError: (error) => toast.error(error.message || "Failed to add supplier listing"),
  });
  
  const updateMutation = trpc.supplierFeed.update.useMutation({
    onSuccess: async () => {
      await utils.supplierFeed.list.invalidate();
      toast.success(t("status.updated"));
    },
    onError: (error) => toast.error(error.message || "Failed to update listing"),
  });

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const stats = useMemo(() => {
    const fresh = listings.filter((item) => item.status === "new").length;
    const dups = listings.filter((item) => item.duplicatePropertyId).length;
    return { fresh, dups, total: listings.length };
  }, [listings]);

  const handleSubmit = () => {
    if (!form.sourceName || !form.title || !form.address) {
      toast.error("Required fields missing");
      return;
    }
    createMutation.mutate({
      ...form,
      price: form.price ? Number(form.price) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("sup.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("sup.sub")}</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl shadow-accent/40">
              <Plus className="w-4 h-4" /> {t("sup.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-background/80 backdrop-blur-3xl">
            <div className={`p-10 ${theme === 'dark' ? 'bg-gradient-to-br from-[#1e293b] to-[#0f172a]' : 'bg-gradient-to-br from-white to-[#f1f5f9]'}`}>
               <DialogHeader className="mb-8">
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">{t("sup.add")}</DialogTitle>
               </DialogHeader>
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("sup.source")}</Label>
                       <Input className="h-12 rounded-xl bg-background/40 border-white/5" value={form.sourceName} onChange={e => setForm({...form, sourceName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("sup.contact")}</Label>
                       <Input className="h-12 rounded-xl bg-background/40 border-white/5" value={form.supplierContact} onChange={e => setForm({...form, supplierContact: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("sup.titleLabel")}</Label>
                    <Input className="h-12 rounded-xl bg-background/40 border-white/5" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("prop.address")}</Label>
                    <Input className="h-12 rounded-xl bg-background/40 border-white/5" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("prop.price")}</Label>
                       <Input type="number" className="h-12 rounded-xl bg-background/40 border-white/5" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bed</Label>
                       <Input type="number" className="h-12 rounded-xl bg-background/40 border-white/5" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bath</Label>
                       <Input type="number" className="h-12 rounded-xl bg-background/40 border-white/5" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})} />
                    </div>
                 </div>
                 <div className="flex justify-end gap-3 pt-6">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
                    <Button className="h-12 px-10 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-[10px]" onClick={handleSubmit} disabled={createMutation.isPending}>
                       {createMutation.isPending ? "Syncing..." : "Commit Entry"}
                    </Button>
                 </div>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Aggregate Feed", val: stats.total, icon: Inbox, color: "accent" },
          { label: "New Manifests", val: stats.fresh, icon: Activity, color: "blue-500" },
          { label: "Duplicate Risks", val: stats.dups, icon: ShieldAlert, color: "amber-500" },
        ].map(s => (
          <div key={s.label} style={glassStyle} className="p-8 border-0 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
                <p className="text-3xl font-black text-foreground tracking-tighter italic">{s.val}</p>
             </div>
             <div className={`w-12 h-12 rounded-2xl bg-${s.color}/10 flex items-center justify-center text-${s.color}`}>
                <s.icon className="w-6 h-6" />
             </div>
          </div>
        ))}
      </div>

      <div style={glassStyle} className="overflow-hidden border-0">
         <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("sup.review")}</h3>
            <div className="relative w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
               <Input className="h-9 pl-9 rounded-xl bg-background/20 text-[10px] font-bold uppercase tracking-widest placeholder:text-muted-foreground/30 border-0" placeholder="Filter Intel..." />
            </div>
         </div>
         
         <div className="p-8">
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Inbox className="h-12 w-12 text-muted-foreground mb-6" />
                <p className="text-sm font-black uppercase tracking-widest">No Intelligence Detected</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">{t("sup.sub")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="p-6 rounded-[24px] bg-background/30 border border-white/5 group hover:bg-background/50 transition-all hover:-translate-y-1 shadow-xl hover:shadow-2xl">
                    <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
                       <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                             <h4 className="text-lg font-black tracking-tighter uppercase italic">{listing.title}</h4>
                             <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${listing.status === 'new' ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'}`}>{listing.status}</span>
                             {listing.duplicatePropertyId && (
                               <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                 <ShieldAlert className="w-3 h-3" /> {t("sup.duplicate")}
                               </span>
                             )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground mb-4">
                             <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-accent" /> {listing.address}, {listing.subcity || "District Unknown"}</div>
                             <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-accent" /> {listing.sourceName}</div>
                             <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-accent" /> ETB {Number(listing.price || 0).toLocaleString()}</div>
                          </div>
                       </div>
                       
                       <div className="flex gap-2">
                          {listing.status === 'new' && (
                            <Button variant="outline" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-accent/10 hover:text-accent transition-all" onClick={() => updateMutation.mutate({ id: listing.id, data: { status: 'reviewed' } })}>
                               <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> {t("sup.markReviewed")}
                            </Button>
                          )}
                          <Button className="h-11 px-8 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20 group-hover:scale-105 transition-all" onClick={() => setLocation(`/studio/${listing.id}?mode=listing_creator`)}>
                             <Palette className="w-3.5 h-3.5 mr-2" /> {t("sup.market")}
                          </Button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
         </div>
      </div>
    </DashboardLayout>
  );
}
