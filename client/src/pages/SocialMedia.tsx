import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
  ChevronRight, Send, FileText, XCircle, Zap,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type PostStatus = "draft" | "scheduled" | "published" | "failed";

const PLATFORMS = [
  { id: "facebook",  label: "Facebook",  Icon: Facebook,   color: "#1877F2", bg: "bg-blue-50",   text: "text-blue-700"  },
  { id: "instagram", label: "Instagram", Icon: Instagram,  color: "#E1306C", bg: "bg-pink-50",   text: "text-pink-700"  },
  { id: "tiktok",    label: "TikTok",    Icon: Share2,     color: "#010101", bg: "bg-gray-100",  text: "text-gray-800"  },
] as const;

const STATUS_META: Record<PostStatus, { label: string; Icon: any; bg: string; text: string }> = {
  draft:     { label: "Draft",     Icon: FileText,  bg: "bg-gray-100",   text: "text-gray-600"   },
  scheduled: { label: "Scheduled", Icon: Clock,     bg: "bg-blue-50",    text: "text-blue-700"   },
  published: { label: "Published", Icon: CheckSquare,bg:"bg-green-50",   text: "text-green-700"  },
  failed:    { label: "Failed",    Icon: XCircle,   bg: "bg-red-50",     text: "text-red-600"    },
};

const BLANK = {
  content: "", platforms: [] as string[], date: "", time: "09:00", status: "scheduled" as PostStatus,
};

// ─── PLATFORM PILL ───────────────────────────────────────────────────────────

function PlatformPills({ platforms }: { platforms: string[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {platforms.map((pid) => {
        const p = PLATFORMS.find((x) => x.id === pid);
        if (!p) return null;
        const Icon = p.Icon;
        return (
          <span key={pid} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>
            <Icon className="w-3 h-3" />{p.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── POST COMPOSER MODAL ─────────────────────────────────────────────────────

function ComposerModal({
  open, initial, onClose, onSaved,
}: { open: boolean; initial: any | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;

  const initForm = () => {
    if (!initial) return { ...BLANK };
    const dt = initial.scheduledTime ? new Date(initial.scheduledTime) : null;
    return {
      content:   initial.content ?? "",
      platforms: (initial.platforms as string[]) ?? [],
      date: dt ? dt.toISOString().slice(0, 10) : "",
      time: dt ? dt.toTimeString().slice(0, 5) : "09:00",
      status: (initial.status ?? "scheduled") as PostStatus,
    };
  };

  const [form, setForm] = useState(initForm);

  const togglePlatform = (pid: string) =>
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(pid)
        ? f.platforms.filter((x) => x !== pid)
        : [...f.platforms, pid],
    }));

  const createMutation = trpc.crm.socialMediaPosts.create.useMutation({
    onSuccess: () => { toast.success("Post saved!"); onSaved(); onClose(); },
    onError: () => toast.error("Failed to save"),
  });
  const updateMutation = trpc.crm.socialMediaPosts.update.useMutation({
    onSuccess: () => { toast.success("Post updated!"); onSaved(); onClose(); },
    onError: () => toast.error("Failed to update"),
  });

  const handleSubmit = () => {
    if (!form.content.trim()) { toast.error("Post content is required"); return; }
    if (form.platforms.length === 0) { toast.error("Select at least one platform"); return; }

    const scheduledTime = form.date
      ? new Date(`${form.date}T${form.time}:00`)
      : undefined;

    const data: any = {
      content: form.content,
      platforms: form.platforms,
      status: form.status,
      scheduledTime,
    };

    if (isEdit) updateMutation.mutate({ id: initial.id, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit post" : "Compose post"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">

          {/* Content */}
          <div>
            <Label className="text-xs">Post content *</Label>
            <Textarea
              className="mt-1 text-sm min-h-[120px]"
              placeholder="Write your property post here… Include price, location, key features and a call to action."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {form.content.length} characters
            </p>
          </div>

          {/* Platforms */}
          <div>
            <Label className="text-xs mb-2 block">Publish to *</Label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => {
                const active = form.platforms.includes(p.id);
                const Icon = p.Icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all flex-1 justify-center ${
                      active
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/40"
                    }`}
                  >
                    {active
                      ? <CheckSquare className="w-3.5 h-3.5" />
                      : <Square className="w-3.5 h-3.5" />}
                    <Icon className="w-3.5 h-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                className="mt-1 h-8 text-sm"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input
                className="mt-1 h-8 text-sm"
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PostStatus })}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <SelectItem key={v} value={v} className="text-sm">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-accent hover:bg-accent/90 text-white"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Schedule post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── WEEK CALENDAR ────────────────────────────────────────────────────────────

function WeekCalendar({
  posts, onEdit, onCreate,
}: { posts: any[]; onEdit: (p: any) => void; onCreate: (date: string) => void }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    const day = now.getDay();
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const postsForDay = (date: Date) => {
    const ds = date.toISOString().slice(0, 10);
    return posts.filter((p) => {
      if (!p.scheduledTime) return false;
      return new Date(p.scheduledTime).toISOString().slice(0, 10) === ds;
    });
  };

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset((w) => w - 1)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {weekDays[0].toLocaleDateString("en-ET", { month: "long", day: "numeric" })}
          {" — "}
          {weekDays[6].toLocaleDateString("en-ET", { month: "long", day: "numeric", year: "numeric" })}
        </span>
        <button onClick={() => setWeekOffset((w) => w + 1)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const ds = day.toISOString().slice(0, 10);
          const isToday = ds === todayStr;
          const dayPosts = postsForDay(day);

          return (
            <div key={i} className={`min-h-[160px] rounded-xl border p-2 ${isToday ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
              {/* Header */}
              <div className={`flex flex-col items-center mb-2 ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                <span className="text-xs font-medium">{DAY_LABELS[i]}</span>
                <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-accent text-white" : ""}`}>
                  {day.getDate()}
                </span>
              </div>

              {/* Posts */}
              <div className="space-y-1.5">
                {dayPosts.map((p) => {
                  const platforms = (p.platforms as string[]) ?? [];
                  const time = new Date(p.scheduledTime).toTimeString().slice(0, 5);
                  return (
                    <button
                      key={p.id}
                      onClick={() => onEdit(p)}
                      className="w-full text-left p-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors group"
                    >
                      <p className="text-xs font-medium text-accent leading-tight line-clamp-2">
                        {p.content ?? "Untitled"}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{time}</span>
                        <div className="flex gap-0.5">
                          {platforms.slice(0, 2).map((pid) => {
                            const pl = PLATFORMS.find((x) => x.id === pid);
                            if (!pl) return null;
                            const Icon = pl.Icon;
                            return <Icon key={pid} className="w-2.5 h-2.5 text-muted-foreground" />;
                          })}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Add button */}
                <button
                  onClick={() => onCreate(ds)}
                  className="w-full p-1 rounded-lg border border-dashed border-border hover:border-accent/50 flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── QUEUE LIST ───────────────────────────────────────────────────────────────

function QueueList({
  posts, statusFilter, onEdit, onDelete,
}: {
  posts: any[]; statusFilter: PostStatus | "all";
  onEdit: (p: any) => void; onDelete: (id: number) => void;
}) {
  const filtered = statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter);

  if (filtered.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Send className="w-8 h-8 text-muted-foreground opacity-30 mb-3" />
        <p className="text-sm text-muted-foreground">No posts in this queue</p>
      </div>
    );

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {filtered.map((post, i) => {
        const platforms = (post.platforms as string[]) ?? [];
        const st = STATUS_META[(post.status ?? "draft") as PostStatus];
        const StIcon = st.Icon;
        const dt = post.scheduledTime ? new Date(post.scheduledTime) : null;

        return (
          <div
            key={post.id}
            className={`flex items-start gap-4 px-4 py-3 hover:bg-muted/30 transition-colors ${i < filtered.length - 1 ? "border-b border-border" : ""}`}
          >
            {/* Status icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${st.bg}`}>
              <StIcon className={`w-4 h-4 ${st.text}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground line-clamp-2 mb-1.5">
                {post.content ?? "No content"}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <PlatformPills platforms={platforms} />
                {dt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {dt.toLocaleDateString("en-ET", { day: "2-digit", month: "short" })}
                    {" at "}
                    {dt.toTimeString().slice(0, 5)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(post)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { if (confirm("Delete this post?")) onDelete(post.id); }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function SocialMediaPage() {
  const [tab, setTab] = useState<"calendar" | "queue">("calendar");
  const [queueFilter, setQueueFilter] = useState<PostStatus | "all">("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [prefillDate, setPrefillDate] = useState<string>("");

  const { data: posts = [], refetch } = trpc.crm.socialMediaPosts.list.useQuery();

  const deleteMutation = trpc.crm.socialMediaPosts.delete.useMutation({
    onSuccess: () => { toast.success("Post deleted"); refetch(); },
    onError: () => toast.error("Delete failed"),
  });

  const stats = useMemo(() => ({
    total:     posts.length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    draft:     posts.filter((p) => p.status === "draft").length,
  }), [posts]);

  const openComposer = (post?: any, date?: string) => {
    setEditing(post ?? null);
    setPrefillDate(date ?? "");
    setComposerOpen(true);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Social Media</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and manage posts across Facebook, Instagram and TikTok
          </p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-white" onClick={() => openComposer()}>
          <Plus className="w-4 h-4 mr-2" /> Compose post
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total posts",  value: stats.total,     Icon: Send,         color: "text-accent"      },
          { label: "Scheduled",    value: stats.scheduled, Icon: Clock,        color: "text-blue-600"    },
          { label: "Published",    value: stats.published, Icon: CheckSquare,  color: "text-green-600"   },
          { label: "Drafts",       value: stats.draft,     Icon: FileText,     color: "text-amber-600"   },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <k.Icon className={`w-3.5 h-3.5 ${k.color}`} />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-5 h-9">
          <TabsTrigger value="calendar" className="text-xs">
            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="queue" className="text-xs">
            <Send className="w-3.5 h-3.5 mr-1.5" /> Queue
            {stats.total > 0 && (
              <span className="ml-1.5 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {stats.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center text-center">
              <Calendar className="w-10 h-10 text-muted-foreground opacity-30 mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">No posts scheduled yet</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Compose your first post and pick a date and time to schedule it.
              </p>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white"
                onClick={() => openComposer()}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Compose first post
              </Button>
            </div>
          ) : (
            <WeekCalendar
              posts={posts}
              onEdit={(p) => openComposer(p)}
              onCreate={(date) => openComposer(undefined, date)}
            />
          )}
        </TabsContent>

        <TabsContent value="queue" className="mt-0">
          {/* Status filter tabs */}
          <div className="flex gap-1 mb-4 flex-wrap">
            {([["all", "All"], ["scheduled", "Scheduled"], ["draft", "Drafts"],
               ["published", "Published"], ["failed", "Failed"]] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setQueueFilter(v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  queueFilter === v
                    ? "bg-accent text-white border-accent"
                    : "border-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                {label}
                {v !== "all" && (
                  <span className="ml-1.5 opacity-70">
                    {posts.filter((p) => p.status === v).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <QueueList
            posts={posts}
            statusFilter={queueFilter}
            onEdit={(p) => openComposer(p)}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      {/* Platform info banner */}
      <div className="mt-6 rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-start gap-3">
        <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Platform integrations coming in v2 —</span>{" "}
          Facebook, Instagram and TikTok direct publishing requires connecting API keys in Settings.
          Posts scheduled here are stored and ready to publish once integrations are configured.
        </p>
      </div>

      <ComposerModal
        open={composerOpen}
        initial={editing}
        onClose={() => { setComposerOpen(false); setEditing(null); setPrefillDate(""); }}
        onSaved={refetch}
      />
    </DashboardLayout>
  );
}
