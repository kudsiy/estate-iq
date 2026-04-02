import { useAuth } from "@/_core/hooks/useAuth";
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
  Rss,
  Wand2,
  Building2,
  Users,
  BarChart2,
  Bell,
  Settings,
  CreditCard,
  LogOut,
  PanelLeft,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const baseMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard" },
  { icon: Rss,             label: "Supply Feed",  path: "/supplier-feed" },
  { icon: Wand2,           label: "Studio",       path: "/studio" },
  { icon: Building2,       label: "My Properties",path: "/properties" },
  { icon: Users,           label: "CRM",          path: "/crm" },
  { icon: BarChart2,       label: "Analytics",    path: "/analytics" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;

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

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to Estate IQ
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Ethiopia's first integrated real estate growth platform.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full"
          >
            Sign in
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

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: current } = trpc.subscription.current.useQuery();
  const { data: notifData } = trpc.notifications.list.useQuery({ limit: 1 });
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const menuItems = user?.role === "admin"
    ? [...baseMenuItems, { icon: Shield, label: "Admin", path: "/admin" }]
    : baseMenuItems;

  const activeMenuItem = menuItems.find(
    (item) =>
      location === item.path ||
      (item.path !== "/dashboard" && location.startsWith(item.path))
  );

  const unreadCount = (notifData as any)?.unreadCount ?? 0;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "EQ";

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

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
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border" disableTransition={isResizing}>

          {/* Sidebar header — Estate IQ brand + notification bell */}
          <SidebarHeader className="h-14 border-b border-border">
            <div className="flex items-center gap-2 px-3 h-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>

              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-foreground tracking-tight truncate flex-1">
                    Estate IQ
                  </span>
                  {/* Notification Bell */}
                  <button
                    onClick={() => setLocation("/notifications")}
                    className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors shrink-0"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Collapsed bell */}
              {isCollapsed && (
                <button
                  onClick={() => setLocation("/notifications")}
                  className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors shrink-0"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border border-background" />
                  )}
                </button>
              )}
            </div>
          </SidebarHeader>

          {/* Nav items */}
          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 gap-0.5">
              {menuItems.map((item) => {
                const isActive =
                  location === item.path ||
                  (item.path !== "/dashboard" && location.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-9 font-normal transition-all"
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-accent" : "text-muted-foreground"
                        }`}
                      />
                      <span className={isActive ? "text-accent font-medium" : ""}>
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* Footer — agent name + always-visible Billing & Settings */}
          <SidebarFooter className="p-2 border-t border-border space-y-1">
            {/* Agent identity */}
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8 border shrink-0">
                <AvatarFallback className="text-xs font-medium bg-accent/10 text-accent">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-none">{user?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || "—"}</p>
                </div>
              )}
            </div>

            {/* Billing */}
            <button
              onClick={() => setLocation("/billing")}
              className={`flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 hover:bg-accent/10 transition-colors text-left ${
                location === "/billing" ? "bg-accent/10 text-accent" : "text-muted-foreground"
              }`}
              title="Billing"
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="text-sm font-normal">Billing</span>}
            </button>

            {/* Settings */}
            <button
              onClick={() => setLocation("/settings")}
              className={`flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 hover:bg-accent/10 transition-colors text-left ${
                location === "/settings" ? "bg-accent/10 text-accent" : "text-muted-foreground"
              }`}
              title="Settings"
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="text-sm font-normal">Settings</span>}
            </button>

            {/* Sign out */}
            <button
              onClick={logout}
              className="flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-left"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="text-sm font-normal">Sign out</span>}
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent/20 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Mobile top bar */}
        {isMobile && (
          <div className="flex border-b h-14 items-center gap-3 bg-card px-4 sticky top-0 z-40">
            <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-foreground">
                {activeMenuItem?.label ?? "Estate IQ"}
              </span>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setLocation("/notifications")}
                className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Trial / Subscription Lifecycle Banners ── */}
        {current && (() => {
          const days = current.daysRemaining ?? 0;
          const isActive = current.isActive;
          const isGrace = current.isGracePeriod;
          const isTrial = current.workspace?.subscriptionStatus === "trial";

          if (!isActive && !isGrace) {
            return (
              <>
                <div className="bg-destructive/5 border-b-2 border-destructive/30 px-6 py-5">
                  <div className="max-w-2xl mx-auto flex flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-destructive">
                        {isTrial ? "Your 14-day trial has ended" : "Your subscription has expired"}
                      </p>
                      <p className="text-sm text-destructive/70 mt-1">
                        Your {current.usage?.leads ?? 0} leads and {current.usage?.properties ?? 0} listings are locked.
                        Upgrade now to keep everything and continue growing your pipeline.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-9 px-6 rounded-lg shadow-sm font-semibold"
                      onClick={() => setLocation("/billing")}
                    >
                      Unlock Now — From ETB 499/mo
                    </Button>
                  </div>
                </div>
              </>
            );
          }

          if (isGrace) {
            return (
              <div className="bg-amber-50 dark:bg-amber-950/30 border-b-2 border-amber-400/50 px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      ⏳ Grace period — Your {isTrial ? "trial" : "subscription"} expired
                    </p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/70">
                      You have {current.gracePeriodDays} days to upgrade before your account is fully locked.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-semibold"
                  onClick={() => setLocation("/billing")}
                >
                  Upgrade Now
                </Button>
              </div>
            );
          }

          if (isTrial && days <= 7 && days > 0) {
            const isUrgent = days <= 3;
            return (
              <div className={`border-b-2 px-6 py-2.5 flex items-center justify-between gap-4 ${
                isUrgent
                  ? "bg-red-50 dark:bg-red-950/30 border-red-400/50"
                  : "bg-amber-50 dark:bg-amber-950/20 border-amber-300/50"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    isUrgent ? "bg-red-100 dark:bg-red-900/50" : "bg-amber-100 dark:bg-amber-900/50"
                  }`}>
                    <AlertTriangle className={`h-3.5 w-3.5 ${isUrgent ? "text-red-600" : "text-amber-600"}`} />
                  </div>
                  <p className={`text-sm font-semibold ${isUrgent ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>
                    {isUrgent
                      ? `🔥 ${days} day${days === 1 ? "" : "s"} left — Your ${current.usage?.leads ?? 0} leads will be locked!`
                      : `${days} days left in your trial`}
                  </p>
                </div>
                <Button
                  size="sm"
                  className={`h-7 px-4 rounded-lg shadow-sm text-xs font-bold ${
                    isUrgent
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  }`}
                  onClick={() => setLocation("/billing")}
                >
                  {isUrgent ? "Upgrade Now" : "See Plans"}
                </Button>
              </div>
            );
          }

          if (isTrial && days > 7) {
            return (
              <div className="bg-accent/5 border-b border-accent/15 px-6 py-2 flex items-center justify-between gap-4">
                <p className="text-xs text-accent font-medium">
                  ✨ Full access trial — {days} days remaining
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-3 text-xs text-accent hover:text-accent"
                  onClick={() => setLocation("/billing")}
                >
                  See Plans
                </Button>
              </div>
            );
          }

          return null;
        })()}

        <main className="flex-1 p-6 bg-background min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
