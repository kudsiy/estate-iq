import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  User, Bell, Link2, Shield, Building2, Facebook,
  Instagram, MessageCircle, Mail, ExternalLink, Phone,
  Share2, Code2, Key, RefreshCw, Copy, Check, Palette, LogOut,
  Target, Zap, Activity, Globe, ShieldAlert, Cpu, Plus, Send,
  Rss, Wand2, Users, BarChart2, Settings, CreditCard, PanelLeft,
  AlertTriangle, Sun, Moon, Sparkles, ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CSSProperties, useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

// ── Shared Styling ────────────────────────────────────────────────────────────

const getGlassStyle = (theme: string): React.CSSProperties => ({
  background: theme === "dark" ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(32px)",
  borderRight: "1px solid",
  borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
});

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 220;
const MAX_WIDTH = 340;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-10 p-12 max-w-md w-full relative">
          <div className="absolute inset-0 bg-accent/5 blur-[100px] rounded-full" />
          <div className="flex flex-col items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-[2rem] bg-accent flex items-center justify-center shadow-2xl shadow-accent/40 animate-pulse">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-2">
               <h1 className="text-4xl font-black tracking-tighter uppercase italic text-foreground">Estate IQ</h1>
               <p className="text-sm text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-60">Identity Verification Required</p>
            </div>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full h-14 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/30 relative z-10"
          >
            Authorize Access
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode, setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { data: current } = trpc.subscription.current.useQuery();
  const { data: notifData } = trpc.notifications.list.useQuery() as any;
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const menuItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"),    path: "/dashboard" },
    { icon: Rss,             label: t("nav.supplyFeed"),  path: "/supplier-feed" },
    { icon: Wand2,           label: t("nav.studio"),       path: "/studio" },
    { icon: Building2,       label: t("nav.properties"),   path: "/properties" },
    { icon: Users,           label: t("nav.crm"),          path: "/crm" },
    { icon: BarChart2,       label: t("nav.analytics"),    path: "/analytics" },
    ...(user?.role === "admin" ? [{ icon: Shield, label: t("nav.admin"), path: "/admin" }] : []),
  ];

  const unreadCount = (notifData as any)?.unreadCount ?? 0;
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "EQ";
  const glassSidebarStyle = useMemo(() => getGlassStyle(theme), [theme]);

  // Handle resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative flex min-h-screen" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-none shadow-none" style={glassSidebarStyle} disableTransition={isResizing}>
          
          <SidebarHeader className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-white/2">
             {!isCollapsed ? (
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                      <Building2 className="w-5 h-5 text-white" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-lg font-black tracking-tighter uppercase italic leading-none">Estate IQ</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-accent mt-1">Intelligence Hub</span>
                   </div>
                </div>
             ) : (
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20 mx-auto">
                   <Building2 className="w-5 h-5 text-white" />
                </div>
             )}
          </SidebarHeader>

          <SidebarContent className="px-3 py-6 uppercase tracking-widest gap-1">
             <SidebarMenu className="gap-2">
                {menuItems.map((item) => {
                  const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={`h-11 rounded-1.5xl px-3 transition-all duration-300 ${isActive ? 'bg-accent/10 border border-accent/20 text-accent' : 'hover:bg-white/5 text-muted-foreground'}`}
                      >
                        <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                        {!isCollapsed && <span className="text-[10px] font-black tracking-[0.1em]">{item.label}</span>}
                        {isActive && !isCollapsed && <div className="ml-auto w-1 h-1 bg-accent rounded-full shadow-[0_0_8px_rgba(249,115,22,1)]" />}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
             </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-white/5 bg-white/1 flex flex-col gap-2">
             <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 mb-2 group cursor-pointer hover:bg-white/10 transition-all">
                <Avatar className="h-9 w-9 rounded-xl border-2 border-white/5">
                   <AvatarFallback className="bg-accent/10 text-accent font-black text-xs">{initials}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                   <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-tighter text-foreground truncate">{user?.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground truncate uppercase opacity-40">{user?.role}</p>
                   </div>
                )}
             </div>

             <div className="space-y-1">
                <button onClick={() => setLanguage(language === "en" ? "am" : "en")} className="w-full flex items-center gap-3 h-10 px-3 rounded-1.5xl hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground">
                   <Globe className="w-4 h-4 shrink-0" />
                   {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-widest">{t("side.language")} — {language === 'en' ? 'AMH' : 'ENG'}</span>}
                </button>
                <button onClick={toggleTheme} className="w-full flex items-center gap-3 h-10 px-3 rounded-1.5xl hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground">
                   {theme === 'light' ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 shrink-0" />}
                   {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-widest">{t("side.theme")}</span>}
                </button>
                <button onClick={() => setLocation("/settings")} className={`w-full flex items-center gap-3 h-10 px-3 rounded-1.5xl transition-all ${location === '/settings' ? 'text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                   <Settings className="w-4 h-4 shrink-0" />
                   {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.settings")}</span>}
                </button>
                <button onClick={logout} className="w-full flex items-center gap-3 h-10 px-3 rounded-1.5xl hover:bg-red-500/10 transition-all text-muted-foreground hover:text-red-500">
                   <LogOut className="w-4 h-4 shrink-0" />
                   {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-widest">{t("side.logout")}</span>}
                </button>
             </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className={`flex flex-col flex-1 bg-transparent transition-all duration-300`}>
          {/* Main Top Header */}
          <header className={`h-16 flex items-center justify-between px-8 border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-40`}>
             <div className="flex items-center gap-4">
                {!isMobile && (
                  <button onClick={toggleSidebar} className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                    <PanelLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {isMobile && <SidebarTrigger className="h-9 w-9 rounded-xl bg-accent text-white" />}
             </div>

             <div className="flex items-center gap-4">
                 <button onClick={() => setLocation("/notifications")} className="h-10 px-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-all relative group">
                   <Bell className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                   {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-[9px] font-black text-white flex items-center justify-center shadow-lg shadow-accent/20">{unreadCount}</span>}
                </button>
             </div>
          </header>

          {/* Premium Banners Container */}

          <main className={`flex-1 p-10 bg-transparent min-h-screen ${language === 'am' ? 'font-ethiopic' : 'font-sans'}`}>
             {children}
          </main>
        </SidebarInset>
      </div>

      {/* Resize Handle Overlay */}
      {!isCollapsed && isResizing && <div className="fixed inset-0 z-50 pointer-events-none bg-accent/5" />}
    </>
  );
}
