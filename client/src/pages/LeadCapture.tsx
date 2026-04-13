import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Trash2, Search, Filter, Eye, Edit2, TrendingUp,
  MessageCircle, Facebook, Instagram, Globe, Phone,
  Users, CheckCircle2, XCircle, Clock, Zap, Copy,
  GripVertical, Hash, Mail, AlignLeft, ChevronDown, Rocket, 
  Target, Activity, Share2, ExternalLink
} from "lucide-react";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

type LeadSource = "form" | "whatsapp" | "facebook" | "instagram" | "tiktok" | "manual";
type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
type FieldType = "text" | "email" | "phone" | "textarea" | "select" | "number";

interface FormField {
  id: string; type: FieldType; label: string; placeholder?: string;
  required: boolean; options?: string[];
}
interface FormConfig {
  id: string; name: string; fields: FormField[];
  submitLabel: string; thankYouMessage: string;
}

const DEFAULT_FORM: FormConfig = {
  id: "default", name: "Property Enquiry Form", submitLabel: "Send Enquiry",
  thankYouMessage: "Thank you! We will contact you within 24 hours.",
  fields: [
    { id: "f1", type: "text",  label: "Full Name",    placeholder: "e.g. Abebe Girma",          required: true  },
    { id: "f2", type: "phone", label: "Phone Number", placeholder: "+251 91 234 5678",           required: true  },
    { id: "f3", type: "select",label: "I am a",       required: true, options: ["Buyer","Renter","Investor","Agent"] },
  ],
};

const uid = () => Math.random().toString(36).slice(2, 9);

// ── Components ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, glassStyle }: any) {
  return (
    <div style={glassStyle} className="p-5 border-0 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-')} bg-opacity-20`}>
           <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
    </div>
  );
}

function LeadFormPreview({ form, theme, t }: { form: FormConfig, theme: string, t: any }) {
  const glass = getGlassStyle(theme);
  return (
    <div style={glass} className="p-10 border-0 shadow-2xl max-w-md w-full mx-auto overflow-hidden relative group">
       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
          <Rocket className="w-32 h-32 -rotate-12 translate-x-8 -translate-y-8" />
       </div>
       <h3 className="text-xl font-black text-foreground tracking-tighter uppercase mb-2">{form.name}</h3>
       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8 opacity-60">Professional Enquiry Portal</p>
       
       <div className="space-y-6 relative z-10">
          {form.fields.map(f => (
            <div key={f.id}>
               <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                 {f.label} {f.required && <span className="text-red-500 ml-1">*</span>}
               </label>
               {f.type === "textarea" ? (
                 <textarea disabled className="w-full bg-background/40 border border-white/10 rounded-xl px-4 py-3 text-sm italic opacity-50 outline-none" placeholder={f.placeholder} rows={3} />
               ) : f.type === "select" ? (
                 <div className="w-full bg-background/40 border border-white/10 rounded-xl px-4 py-3 text-sm italic opacity-50 flex justify-between items-center cursor-default">
                    {f.options?.[0] || "Select option..."}
                    <ChevronDown className="w-4 h-4" />
                 </div>
               ) : (
                 <input disabled className="w-full bg-background/40 border border-white/10 rounded-xl px-4 py-3 text-sm italic opacity-50 outline-none" placeholder={f.placeholder} />
               )}
            </div>
          ))}
          <Button disabled className="w-full h-12 bg-accent text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-accent/20">
             {form.submitLabel}
          </Button>
          <p className="text-[9px] text-center font-bold text-muted-foreground uppercase tracking-tighter">{form.thankYouMessage}</p>
       </div>
    </div>
  )
}

export default function LeadCapture() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [tab, setTab] = useState<"leads" | "builder" | "embed">("leads");
  const [form, setForm] = useState<FormConfig>(DEFAULT_FORM);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);

  const { data: leads = [], refetch } = trpc.crm.leads.list.useQuery();
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const updateMutation = trpc.crm.leads.update.useMutation({
    onSuccess: () => { toast.success(t("status.updated")); refetch(); },
  });

  const stats = useMemo(() => {
    const total = leads.length;
    const conv = total > 0 ? Math.round((leads.filter(l => l.status === "converted").length / total) * 100) : 0;
    return { total, conv, new: leads.filter(l => l.status === "new").length, qualified: leads.filter(l => l.status === "qualified").length };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const data = (l.leadData as any) ?? {};
      const searchStr = `${data.firstName} ${data.lastName} ${data.phone} ${data.email}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    });
  }, [leads, search]);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("lead.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("lead.sub")}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-12 px-8 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-accent/20">
          <Plus className="w-4 h-4" /> {t("lead.add")}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Users} label={t("lead.total")} value={stats.total} color="text-accent" glassStyle={glassStyle} />
        <StatCard icon={Zap} label="Response Rate" value="98%" color="text-blue-500" glassStyle={glassStyle} />
        <StatCard icon={CheckCircle2} label="Qualified" value={stats.qualified} color="text-green-500" glassStyle={glassStyle} />
        <StatCard icon={TrendingUp} label={t("lead.conv")} value={`${stats.conv}%`} color="text-amber-500" glassStyle={glassStyle} />
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="bg-muted/20 p-1.5 rounded-2xl h-12 mb-8 border border-border/10">
          <TabsTrigger value="leads" className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white transition-all h-full">
            <Users className="w-3.5 h-3.5 mr-2" /> {t("analz.conversion")}
          </TabsTrigger>
          <TabsTrigger value="builder" className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white transition-all h-full">
            <Edit2 className="w-3.5 h-3.5 mr-2" /> {t("lead.builder")}
          </TabsTrigger>
          <TabsTrigger value="embed" className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white transition-all h-full">
            <Share2 className="w-3.5 h-3.5 mr-2" /> {t("lead.embed")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
           <div style={glassStyle} className="border-0 overflow-hidden">
              <div className="p-6 border-b border-border/40 flex items-center gap-4">
                 <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    <Input className="pl-10 h-10 bg-background/20 rounded-xl" placeholder="Search identities..." value={search} onChange={e => setSearch(e.target.value)} />
                 </div>
                 <Button variant="outline" className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                    <Filter className="w-3.5 h-3.5" /> Filter
                 </Button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-muted/30 border-b border-border/40">
                       <tr>
                          {["Lead", "Contact", "Source", "Score", "Status"].map(h => (
                             <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                          ))}
                          <th className="px-6 py-4"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                       {filteredLeads.map(l => {
                          const data = (l.leadData as any) ?? {};
                          const name = `${data.firstName} ${data.lastName}`;
                          return (
                            <tr key={l.id} className="hover:bg-muted/20 transition-all group">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent">{name[0]}</div>
                                     <span className="text-sm font-bold text-foreground">{name}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <p className="text-xs text-muted-foreground font-medium">{data.phone || data.email}</p>
                               </td>
                               <td className="px-6 py-4">
                                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                                     <Globe className="w-3 h-3" /> {l.source}
                                  </span>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="w-12 h-2 rounded-full bg-muted/40 overflow-hidden">
                                     <div className="h-full bg-accent" style={{ width: `${l.score}%` }} />
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${l.status === 'new' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                     {l.status}
                                  </span>
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                     <button className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-accent hover:text-white transition-all"><Eye className="w-3.5 h-3.5"/></button>
                                     <button className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                                  </div>
                               </td>
                            </tr>
                          )
                       })}
                       {filteredLeads.length === 0 && (
                          <tr><td colSpan={6} className="px-6 py-20 text-center text-xs font-bold italic text-muted-foreground/30 uppercase tracking-widest">No matching leads found</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="builder">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div style={glassStyle} className="lg:col-span-7 p-8 border-0">
                 <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" /> {t("lead.builder")}
                 </h3>
                 <div className="space-y-6">
                    <div>
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">{t("lead.formName")}</Label>
                       <Input className="h-10 rounded-xl bg-background/20" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">{t("lead.fields")}</Label>
                       <div className="space-y-3">
                          {form.fields.map((f, i) => (
                            <div key={f.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 group">
                               <GripVertical className="w-4 h-4 text-muted-foreground/30" />
                               <div className="flex-1 flex items-center gap-3">
                                  <span className="text-[10px] font-black uppercase bg-accent/20 text-accent px-2 py-1 rounded-lg">{f.type}</span>
                                  <Input className="h-8 rounded-lg bg-transparent border-0 font-bold p-0 shadow-none" value={f.label} onChange={e => {
                                     const next = [...form.fields];
                                     next[i] = {...f, label: e.target.value};
                                     setForm({...form, fields: next});
                                  }} />
                               </div>
                               <button className="w-8 h-8 rounded-xl hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                  <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                          ))}
                          <Button variant="outline" className="w-full h-12 rounded-2xl border-dashed border-2 border-border/40 text-[10px] font-black uppercase tracking-widest hover:border-accent/40 bg-transparent" onClick={() => {
                             const n: FormField = { id: uid(), type: 'text', label: 'New Field', required: false };
                             setForm({...form, fields: [...form.fields, n]});
                          }}>
                             <Plus className="w-3.5 h-3.5 mr-2" /> Add Field Element
                          </Button>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="lg:col-span-5">
                 <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("lead.preview")}</span>
                    <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-accent p-0 h-auto">View Live Page</Button>
                 </div>
                 <LeadFormPreview form={form} theme={theme} t={t} />
              </div>
           </div>
        </TabsContent>

        <TabsContent value="embed">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div style={glassStyle} className="p-8 border-0">
                 <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent" /> Website Integration
                 </h3>
                 <p className="text-xs text-muted-foreground font-medium mb-8 leading-relaxed">Embed this enquiry portal on your professional website to automate identity capture directly into the Estate IQ database.</p>
                 <div className="bg-background/40 p-5 rounded-2xl font-mono text-xs text-muted-foreground border border-white/5 break-all">
                    {`<iframe src="https://app.estateiq.et/forms/${form.id}" width="100%" height="700px" frameborder="0"></iframe>`}
                 </div>
                 <Button className="mt-6 w-full h-11 rounded-xl bg-accent/20 text-accent font-black text-[10px] uppercase tracking-widest hover:bg-accent/30 transition-all gap-2 shadow-none border-0">
                    <Copy className="w-3.5 h-3.5" /> Copy Integration Code
                 </Button>
              </div>

              <div className="space-y-4">
                 {[
                   { icon: MessageCircle, title: "WhatsApp Direct", color: "text-green-500", bg: "bg-green-500/10", tag: "Most Active" },
                   { icon: Target, title: "External Landing Page", color: "text-blue-500", bg: "bg-blue-500/10", tag: "Primary" },
                   { icon: Activity, title: "Social Referral Link", color: "text-purple-500", bg: "bg-purple-500/10", tag: "Viral" },
                 ].map(x => (
                   <div key={x.title} style={glassStyle} className="p-6 border-0 flex items-center justify-between group cursor-pointer hover:bg-muted/10 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl ${x.bg} flex items-center justify-center`}>
                            <x.icon className={`w-5 h-5 ${x.color}`} />
                         </div>
                         <div>
                            <p className="font-bold text-foreground text-sm">{x.title}</p>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{x.tag}</span>
                         </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all" />
                   </div>
                 ))}
              </div>
           </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md rounded-[32px] p-0 border-0 bg-transparent shadow-none">
             <div style={glassStyle} className="p-10">
                <DialogHeader className="mb-6">
                   <DialogTitle className="text-xl font-black uppercase tracking-tighter">{t("lead.add")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                   <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Identity Name</Label>
                      <Input className="h-10 rounded-xl bg-background/20" placeholder="e.g. Samuel Kebede" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Phone Number</Label>
                        <Input className="h-10 rounded-xl bg-background/20" placeholder="+251..." />
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Initial Score</Label>
                        <Input className="h-10 rounded-xl bg-background/20" type="number" defaultValue="50" />
                      </div>
                   </div>
                   <div className="flex gap-4 mt-8">
                      <Button variant="outline" className="flex-1 h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest" onClick={() => setAddOpen(false)}>Dismiss</Button>
                      <Button className="flex-1 h-11 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Capture Now</Button>
                   </div>
                </div>
             </div>
          </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
