import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Users,
  TrendingUp,
  Home,
  Target,
  Palette,
  Share2,
  BarChart2,
  Sparkles,
  LogOut,
  Settings,
  PanelLeft,
  Building2,
  Bell,
  Inbox,
  Search,
  CreditCard,
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
  { icon: Users,           label: "Contacts",      path: "/crm/contacts" },
  { icon: TrendingUp,      label: "Deal Pipeline", path: "/crm/deals" },
  { icon: Home,            label: "Properties",    path: "/properties" },
  { icon: Target,          label: "Lead Capture",  path: "/leads" },
  { icon: Palette,         label: "Design Studio", path: "/design-studio" },
  { icon: Share2,          label: "Social Media",  path: "/social-media" },
  { icon: BarChart2,       label: "Analytics",     path: "/analytics" },
  { icon: Sparkles,        label: "Brand Kit",     path: "/brand-kit" },
  { icon: Bell,            label: "Notifications", path: "/notifications" },
  { icon: Inbox,           label: "Supplier Inbox", path: "/supplier-feed" },
  { icon: Search,          label: "Matching",      path: "/matching" },
  { icon: CreditCard,      label: "Billing",       path: "/billing" },
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
    return <DashboardLayoutSkeleton />
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

          {/* Sidebar header — Estate IQ brand */}
          <SidebarHeader className="h-14 border-b border-border">
            <div className="flex items-center gap-3 px-3 h-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-foreground tracking-tight truncate">
                    Estate IQ
                  </span>
                </div>
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

          {/* Footer — user menu */}
          <SidebarFooter className="p-2 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent/10 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-accent/10 text-accent">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{user?.email || "—"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          </div>
        )}

        {/* Expired Subscription Banner */}
        {current && !current.isActive && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {current.workspace?.subscriptionStatus === "trial" 
                    ? "Your trial has expired" 
                    : "Your subscription is inactive"}
                </p>
                <p className="text-xs text-destructive/80">
                  Enable your subscription to continue using all features.
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="destructive" 
              className="h-8 rounded-lg shadow-sm"
              onClick={() => setLocation("/billing")}
            >
              Update Billing
            </Button>
          </div>
        )}

        <main className="flex-1 p-6 bg-background min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
