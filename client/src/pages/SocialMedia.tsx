import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Trash2, Edit2, Calendar, Clock, Share2,
  Facebook, Instagram, CheckSquare, Square, ChevronLeft,
  ChevronRight, Send, FileText, XCircle, Zap, RefreshCw,
  Video, Globe, MessageCircle
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

type PostStatus = "draft" | "scheduled" | "queued" | "publishing" | "published" | "failed";

const PLATFORMS = [
  { id: "telegram",  label: "Telegram",  Icon: Send,       color: "#229ED9", bg: "bg-blue-500/10",   text: "text-blue-500"  },
  { id: "facebook",  label: "Facebook",  Icon: Facebook,   color: "#1877F2", bg: "bg-blue-600/10",   text: "text-blue-600"  },
  { id: "instagram", label: "Instagram", Icon: Instagram,  color: "#E1306C", bg: "bg-pink-500/10",   text: "text-pink-500"  },
  { id: "tiktok",    label: "TikTok",    Icon: Video,      color: "#010101", bg: "bg-gray-500/10",   text: "text-gray-500"  },
] as const;

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

export default function SocialMediaPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [tab, setTab] = useState<"calendar" | "queue">("calendar");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: posts = [], refetch } = trpc.crm.socialMediaPosts.list.useQuery();
  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);

  const stats = useMemo(() => ({
    total: posts.length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    published: posts.filter(p => p.status === "published").length,
    draft: posts.filter(p => p.status === "draft").length,
  }), [posts]);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("social.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("social.sub")}</p>
        </div>
        <Button onClick={() => setComposerOpen(true)} className="h-12 px-8 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-accent/20">
          <Plus className="w-4 h-4" /> {t("social.compose")}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Send} label="Live Channels" value="4" color="text-accent" glassStyle={glassStyle} />
        <StatCard icon={Clock} label={t("social.scheduled")} value={stats.scheduled} color="text-blue-500" glassStyle={glassStyle} />
        <StatCard icon={CheckSquare} label={t("social.published")} value={stats.published} color="text-green-500" glassStyle={glassStyle} />
        <StatCard icon={FileText} label={t("social.draft")} value={stats.draft} color="text-amber-500" glassStyle={glassStyle} />
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="bg-muted/20 p-1.5 rounded-2xl h-12 mb-8 border border-border/10">
          <TabsTrigger value="calendar" className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white transition-all h-full">
            <Calendar className="w-3.5 h-3.5 mr-2" /> {t("social.calendar")}
          </TabsTrigger>
          <TabsTrigger value="queue" className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white transition-all h-full">
            <Zap className="w-3.5 h-3.5 mr-2" /> {t("social.queue")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
           <WeekCalendar posts={posts} t={t} theme={theme} glassStyle={glassStyle} onEdit={(p:any) => {setEditing(p); setComposerOpen(true);}} />
        </TabsContent>

        <TabsContent value="queue">
           <div style={glassStyle} className="border-0 overflow-hidden">
              <div className="p-8 border-b border-border/40">
                 <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" /> {t("social.queue")}
                 </h3>
              </div>
              <div className="divide-y divide-border/20">
                 {posts.map(p => {
                    const platforms = (p.platforms as string[]) ?? [];
                    return (
                      <div key={p.id} className="p-6 flex items-start justify-between group hover:bg-muted/10 transition-all">
                         <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                               <FileText className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-foreground line-clamp-1 max-w-md">{p.content || "Branded Media Content"}</p>
                               <div className="flex items-center gap-3 mt-2">
                                  {platforms.map(pid => {
                                     const pMeta = PLATFORMS.find(x => x.id === pid);
                                     const PIcon = pMeta?.Icon || Globe;
                                     return <PIcon key={pid} className={`w-3.5 h-3.5 ${pMeta?.text || 'text-muted-foreground'}`} />
                                  })}
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground ml-2">
                                     {p.scheduledTime ? new Date(p.scheduledTime).toLocaleDateString() : "Draft"}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => {setEditing(p); setComposerOpen(true);}} className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-accent hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                            <button className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                         </div>
                      </div>
                    )
                 })}
                 {posts.length === 0 && (
                   <div className="p-20 text-center text-xs font-bold italic text-muted-foreground/30 uppercase tracking-widest tracking-widest">The queue is currently empty</div>
                 )}
              </div>
           </div>
        </TabsContent>
      </Tabs>

      <ComposerModal open={composerOpen || !!editing} theme={theme} glassStyle={glassStyle} t={t} 
        onClose={() => {setComposerOpen(false); setEditing(null);}} initial={editing} />
    </DashboardLayout>
  );
}

function WeekCalendar({ posts, t, theme, glassStyle, onEdit }: any) {
  const [offset, setOffset] = useState(0);
  const week = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + (offset * 7));
    return Array.from({length: 7}, (_, i) => {
       const x = new Date(d);
       x.setDate(d.getDate() + i);
       return x;
    });
  }, [offset]);

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => setOffset(o => o - 1)} className="rounded-xl h-9 w-9 p-0"><ChevronLeft className="w-4 h-4"/></Button>
             <Button variant="outline" size="sm" onClick={() => setOffset(o => o + 1)} className="rounded-xl h-9 w-9 p-0"><ChevronRight className="w-4 h-4"/></Button>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
             {week[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {week[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
       </div>
       <div className="grid grid-cols-7 gap-4">
          {week.map((d, i) => {
             const ds = d.toISOString().slice(0, 10);
             const active = ds === new Date().toISOString().slice(0, 10);
             const dayPosts = posts.filter((p:any) => p.scheduledTime && new Date(p.scheduledTime).toISOString().slice(0,10) === ds);
             return (
               <div key={i} style={glassStyle} className={`p-4 min-h-[300px] border-0 relative flex flex-col ${active ? 'ring-2 ring-accent ring-inset' : ''}`}>
                  <div className="text-center mb-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{DAY_LABELS[i]}</p>
                     <p className={`text-sm font-black ${active ? 'text-accent' : 'text-foreground'}`}>{d.getDate()}</p>
                  </div>
                  <div className="flex-1 space-y-2">
                     {dayPosts.map((p:any) => (
                       <button key={p.id} onClick={() => onEdit(p)} className="w-full p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-left group hover:bg-accent/20 transition-all">
                          <p className="text-[10px] font-bold text-accent line-clamp-2 leading-tight uppercase tracking-tighter">{p.content || "Branded Content"}</p>
                          <div className="flex items-center gap-1.5 mt-2 opacity-60">
                             <Clock className="w-2.5 h-2.5" />
                             <span className="text-[8px] font-black">{new Date(p.scheduledTime).toTimeString().slice(0,5)}</span>
                          </div>
                       </button>
                     ))}
                  </div>
               </div>
             )
          })}
       </div>
    </div>
  )
}

function ComposerModal({ open, onClose, initial, theme, glassStyle, t }: any) {
  const [content, setContent] = useState(initial?.content || "");
  const [platforms, setPlatforms] = useState<string[]>(initial?.platforms || []);

  const toggleP = (id: string) => setPlatforms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="sm:max-w-xl rounded-[32px] p-0 border-0 bg-transparent shadow-none">
          <div style={glassStyle} className="p-10">
             <DialogHeader className="mb-8">
                <DialogTitle className="text-2xl font-black tracking-tighter uppercase">{t("social.compose")}</DialogTitle>
             </DialogHeader>

             <div className="space-y-6">
                <div>
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">{t("social.postContent")}</Label>
                   <Textarea className="min-h-[150px] rounded-2xl bg-background/30 border-white/5 p-5 text-sm font-medium" 
                             placeholder="Compose your high-luxury property announcement..." value={content} onChange={e => setContent(e.target.value)} />
                </div>

                <div>
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">{t("social.platforms")}</Label>
                   <div className="grid grid-cols-4 gap-3">
                      {PLATFORMS.map(p => {
                         const has = platforms.includes(p.id);
                         const PIcon = p.Icon;
                         return (
                           <button key={p.id} onClick={() => toggleP(p.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${has ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-background/20 border-border/40 text-muted-foreground'}`}>
                              <PIcon className="w-5 h-5 mb-2" />
                              <span className="text-[8px] font-black uppercase tracking-widest">{p.label}</span>
                           </button>
                         )
                      })}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">{t("social.scheduleTime")}</Label>
                      <Input type="datetime-local" className="h-11 rounded-2xl bg-background/20 border-white/5" />
                   </div>
                </div>
             </div>

             <div className="flex gap-4 mt-12">
                <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg" onClick={onClose}>Dismiss</Button>
                <Button className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent/40">
                   {initial ? "Re-Schedule" : "Launch Production"}
                </Button>
             </div>
          </div>
       </DialogContent>
    </Dialog>
  )
}

function Activity(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  )
}
