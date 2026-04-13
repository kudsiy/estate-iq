import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, Dot, Activity, Inbox, ShieldAlert, Zap, Sparkles, MessageCircle, Info, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.05)",
  borderRadius: "24px",
  boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
});

const TYPE_CONFIG: Record<string, { icon: any, color: string }> = {
  lead: { icon: User, color: "blue-500" },
  deal: { icon: Zap, color: "amber-500" },
  supplier: { icon: Inbox, color: "purple-500" },
  match: { icon: Sparkles, color: "green-500" },
  engagement: { icon: MessageCircle, color: "pink-500" },
  system: { icon: Info, color: "slate-500" },
};

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const utils = trpc.useUtils();
  const { data: notifications = [] } = trpc.notifications.list.useQuery();
  
  const updateMutation = trpc.notifications.update.useMutation({
    onSuccess: async () => {
      await utils.notifications.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Failed to update notification"),
  });

  const glassStyle = useMemo(() => getGlassStyle(theme), [theme]);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">{t("notif.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t("notif.sub")}</p>
        </div>
        <Button
          onClick={() => notifications.filter((item) => !item.isRead).forEach((item) => updateMutation.mutate({ id: item.id, isRead: true }))}
          className="h-12 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-foreground font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl border border-white/5"
          disabled={unreadCount === 0 || updateMutation.isPending}
        >
          <CheckCheck className="w-4 h-4 text-accent" />
          {t("notif.markAll")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: t("notif.unread"), val: unreadCount, icon: ShieldAlert, color: "accent" },
          { label: t("notif.total"), val: notifications.length, icon: Activity, color: "blue-500" },
          { label: t("notif.latest"), val: notifications[0]?.title || "Nominal", icon: Zap, color: "amber-500" },
        ].map(s => (
          <div key={s.label} style={glassStyle} className="p-8 border-0">
             <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">{s.label}</p>
                <s.icon className={`w-5 h-5 text-${s.color} opacity-40`} />
             </div>
             <p className={`text-2xl font-black text-foreground tracking-tighter italic ${typeof s.val === 'string' ? 'truncate text-lg' : ''}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div style={glassStyle} className="overflow-hidden border-0">
         <div className="px-8 py-6 border-b border-white/5 bg-white/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">{t("dash.inbox")}</h3>
         </div>
         
         <div className="p-8">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                <Bell className="h-16 w-16 mb-8 animate-pulse" />
                <p className="text-sm font-black uppercase tracking-widest italic">{t("dash.noLeads")}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Activity timeline will surface here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((item) => {
                  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`group flex items-start justify-between gap-6 p-6 rounded-[28px] border transition-all ${item.isRead ? "border-white/5 bg-background/20" : "border-accent/20 bg-accent/5 shadow-2xl shadow-accent/5"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.isRead ? 'bg-white/5 text-muted-foreground' : 'bg-accent/10 text-accent'}`}>
                             <config.icon className="w-4 h-4" />
                          </div>
                          <h4 className="text-lg font-black tracking-tighter uppercase italic">{item.title}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.isRead ? 'bg-muted text-muted-foreground' : 'bg-accent text-white shadow-lg shadow-accent/20'}`}>
                             {t(`notif.type.${item.type}`)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/60 font-medium leading-relaxed italic pr-4 pl-11">{item.message}</p>
                        <div className="mt-4 pl-11 flex items-center gap-2 opacity-30">
                           <Activity className="w-3 h-3" />
                           <p className="text-[9px] font-black uppercase tracking-widest">
                             {new Date(item.createdAt).toLocaleString("en-ET", {
                               day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                             })}
                           </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        onClick={() => updateMutation.mutate({ id: item.id, isRead: !item.isRead })}
                        className="h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-accent/10 hover:text-accent transition-all shrink-0 mt-1"
                      >
                        {item.isRead ? t("notif.unreadBtn") : t("notif.read")}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
         </div>
      </div>
    </DashboardLayout>
  );
}
