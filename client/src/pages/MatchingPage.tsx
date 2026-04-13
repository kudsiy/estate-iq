import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Sparkles, Target, Trash2, Users, MapPin, DollarSign, BedDouble, Bath, Search, Activity, ChevronRight } from "lucide-react";

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
  const { t } = useLanguage();
  const { theme } = useTheme();
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
      toast.success(t("status.updated"));
    },
    onError: (error) => toast.error(error.message || "Failed to create buyer profile"),
  });
  
  const deleteMutation = trpc.matching.profiles.delete.useMutation({
    onSuccess: async () => {
      await utils.matching.profiles.list.invalidate();
      setSelectedProfileId(null);
      toast.success(t("status.updated"));
    },
    onError: (error) => toast.error(error.message || "Failed to delete buyer profile"),
  });

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Profile name required");
      return;
    }
    createMutation.mutate({
      ...form,
      contactId: form.contactId !== "none" ? Number(form.contactId) : undefined,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("match.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("match.sub")}</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl shadow-accent/40">
              <Plus className="w-4 h-4" /> {t("match.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-background/80 backdrop-blur-3xl">
            <div className={`p-10 ${theme === 'dark' ? 'bg-gradient-to-br from-[#1e293b] to-[#0f172a]' : 'bg-gradient-to-br from-white to-[#f1f5f9]'}`}>
               <DialogHeader className="mb-8">
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">{t("match.add")}</DialogTitle>
               </DialogHeader>
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity Link</Label>
                       <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}>
                         <SelectTrigger className="h-12 rounded-xl bg-background/40 border-white/5 border-0 shadow-none focus:ring-accent"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">No linked contact</SelectItem>
                           {contacts.map((c) => (
                             <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Portfolio Label</Label>
                       <Input className="h-12 rounded-xl bg-background/40 border-white/5" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("prop.address")}</Label>
                       <Input className="h-12 rounded-xl bg-background/40 border-white/5" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target District</Label>
                       <Input className="h-12 rounded-xl bg-background/40 border-white/5" value={form.subcity} onChange={e => setForm({...form, subcity: e.target.value})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Budget Range</Label>
                       <div className="flex gap-2">
                          <Input type="number" placeholder="Min" className="h-12 rounded-xl bg-background/40 border-white/5" value={form.budgetMin} onChange={e => setForm({...form, budgetMin: e.target.value})} />
                          <Input type="number" placeholder="Max" className="h-12 rounded-xl bg-background/40 border-white/5" value={form.budgetMax} onChange={e => setForm({...form, budgetMax: e.target.value})} />
                       </div>
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
                       {createMutation.isPending ? "Syncing..." : "Initialize Portfolio"}
                    </Button>
                 </div>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)] min-h-[600px]">
        
        {/* Buyer list */}
        <div style={glassStyle} className="lg:col-span-4 flex flex-col border-0 overflow-hidden">
           <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t("match.profiles")}</h3>
              <Users className="w-4 h-4 text-muted-foreground opacity-30" />
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {profiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                   <Target className="w-10 h-10 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No Intelligence Profiles</p>
                </div>
              ) : (
                profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    className={`w-full group p-5 rounded-[22px] text-left transition-all ${selectedProfileId === p.id ? 'bg-accent text-white shadow-2xl shadow-accent/20' : 'bg-white/5 hover:bg-white/10 text-foreground'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                       <p className="text-sm font-black uppercase tracking-tighter italic">{p.name}</p>
                       <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${selectedProfileId === p.id ? 'hover:bg-red-500/20 text-white' : 'hover:bg-red-500/10 text-muted-foreground'}`} onClick={e => { e.stopPropagation(); deleteMutation.mutate(p.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                       </Button>
                    </div>
                    <div className={`space-y-1.5 opacity-60`}>
                       <div className="flex items-center gap-2 text-[10px] font-bold"><MapPin className="w-3 h-3" /> {p.subcity || "District Open"}, {p.city}</div>
                       <div className="flex items-center gap-2 text-[10px] font-bold"><DollarSign className="w-3 h-3" /> ETB {Number(p.budgetMin || 0).toLocaleString()} - {Number(p.budgetMax || 0).toLocaleString()}</div>
                    </div>
                  </button>
                ))
              )}
           </div>
        </div>

        {/* Match results */}
        <div style={glassStyle} className="lg:col-span-8 flex flex-col border-0 overflow-hidden">
           <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t("match.results")}</h3>
              {selectedProfile && (
                <div className="px-3 py-1 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2">
                   <Sparkles className="w-3 h-3 text-accent" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-accent">{selectedProfile.name} Hub</span>
                </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {!selectedProfile ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                   <Sparkles className="w-16 h-16 mb-6 animate-pulse" />
                   <h4 className="text-xl font-black uppercase tracking-widest italic mb-2">Initialize Matching</h4>
                   <p className="text-xs font-bold uppercase tracking-widest">Select a requirement portfolio to calculate synergies</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                   <Activity className="w-12 h-12 mb-6" />
                   <p className="text-sm font-black uppercase tracking-widest">Zero Synergies Detected</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest mt-2">{t("match.sub")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                   {matches.map((m) => (
                     <div key={m.property.id} className="p-8 rounded-[32px] bg-background/40 border border-white/5 group hover:bg-background/60 transition-all shadow-xl">
                        <div className="flex flex-col md:flex-row gap-8">
                           <div className="w-full md:w-48 aspect-square rounded-[24px] bg-accent/5 overflow-hidden flex items-center justify-center border border-white/5">
                              <div className="text-center group-hover:scale-110 transition-transform duration-500">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">{t("match.score")}</p>
                                 <p className="text-5xl font-black tracking-tighter text-foreground italic">{m.score}%</p>
                              </div>
                           </div>
                           
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-4">
                                 <h4 className="text-2xl font-black tracking-tighter uppercase italic">{m.property.title}</h4>
                                 <Button variant="ghost" className="h-8 group/btn text-[10px] font-black uppercase tracking-widest gap-2">
                                    Asset Profile <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                 </Button>
                              </div>
                              
                              <div className="flex flex-wrap gap-6 text-xs font-bold text-muted-foreground mb-8">
                                 <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> {m.property.address}, {m.property.subcity}</div>
                                 <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-accent" /> ETB {Number(m.property.price || 0).toLocaleString()}</div>
                                 <div className="flex items-center gap-2"><BedDouble className="w-4 h-4 text-accent" /> {m.property.bedrooms}</div>
                                 <div className="flex items-center gap-2"><Bath className="w-4 h-4 text-accent" /> {m.property.bathrooms}</div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                 {m.reasons.map((r: string) => (
                                   <span key={r} className="px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[8px] font-black uppercase tracking-widest">
                                      {r}
                                   </span>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
