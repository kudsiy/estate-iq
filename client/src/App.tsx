import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ContactDetail from "./pages/ContactDetail";
import CRMPage from "./pages/CRMPage";
import PropertiesPage from "./pages/PropertiesPage";
import SupplierFeedPage from "./pages/SupplierFeedPage";
import DesignStudio from "./pages/DesignStudio";
import DesignGallery from "./pages/DesignGallery";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import PropertyTrackingPage from "./pages/PropertyTrackingPage";
import NotificationsPage from "./pages/NotificationsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import { useEffect } from "react";
import { useLocation } from "wouter";

function RouteRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(to); }, [setLocation, to]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  );
}

function LoginRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const current = `${window.location.pathname}${window.location.search}`;
    setLocation(getLoginUrl(current));
  }, [setLocation]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
    </div>
  );
}

function Router() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-border border-t-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading Estate IQ...</p>
        </div>
      </div>
    );
  }

  const needsOnboarding = Boolean(isAuthenticated && user && !user.onboardingCompleted);

  const guard = (component: React.ReactNode) => {
    if (!isAuthenticated) return <LoginRedirect />;
    if (needsOnboarding) return <RouteRedirect to="/onboarding" />;
    return component;
  };

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login"><LoginPage /></Route>
      <Route path="/register"><RegisterPage /></Route>
      <Route path="/l/:userId/:listingId"><PropertyTrackingPage /></Route>

      <Route path="/">
        {isAuthenticated ? (
          needsOnboarding ? <RouteRedirect to="/onboarding" /> : <RouteRedirect to="/dashboard" />
        ) : (
          <Home />
        )}
      </Route>

      <Route path="/onboarding">
        {!isAuthenticated ? (
          <LoginRedirect />
        ) : needsOnboarding ? (
          <OnboardingPage />
        ) : (
          <RouteRedirect to="/dashboard" />
        )}
      </Route>

      {/* Core 6 nav areas */}
      <Route path="/dashboard">          {guard(<Dashboard />)}                </Route>
      <Route path="/supplier-feed">      {guard(<SupplierFeedPage />)}         </Route>
      <Route path="/studio/:contextId?"> {guard(<DesignStudio />)}             </Route>
      <Route path="/studio/gallery">     {guard(<DesignGallery />)}            </Route>
      <Route path="/properties">         {guard(<PropertiesPage />)}           </Route>
      <Route path="/crm">                {guard(<CRMPage />)}                  </Route>
      <Route path="/crm/contacts/:id">   {guard(<ContactDetail />)}            </Route>
      <Route path="/analytics">          {guard(<AnalyticsPage />)}            </Route>

      {/* Utility routes (not in sidebar) */}
      <Route path="/settings">           {guard(<SettingsPage />)}             </Route>
      <Route path="/notifications">      {guard(<NotificationsPage />)}        </Route>
      <Route path="/admin">              {guard(<AdminPage />)}                </Route>

      {/* Legacy redirects — keep old URLs alive */}
      <Route path="/design-studio/:contextId?">
        <RouteRedirect to="/studio" />
      </Route>
      <Route path="/crm/deals">
        <RouteRedirect to="/crm" />
      </Route>
      <Route path="/brand-kit">
        <RouteRedirect to="/settings" />
      </Route>
      <Route path="/social-media">
        <RouteRedirect to="/studio" />
      </Route>
      <Route path="/leads">
        <RouteRedirect to="/crm" />
      </Route>
      <Route path="/matching">
        <RouteRedirect to="/crm" />
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { LanguageProvider } from "./contexts/LanguageContext";

const QUEUE_KEY = "pending_tracking_events";
const LOCK_KEY = "tracking_flush_lock";
const LOCK_TTL = 10000; // 10s — auto-expires even if tab crashes

function safeReadQueue(): any[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(QUEUE_KEY);
    return [];
  }
}

function fallbackToFetch(queue: any[]) {
  // Called when localStorage write fails verification — fire immediately
  queue.slice(0, 5).forEach((item: any) => {
    const body = JSON.stringify({
      "0": { json: { token: item.token, propertyId: item.propertyId, source: item.source } }
    });
    fetch("/api/trpc/tracking.trackInteraction?batch=1", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  });
}

function safeWriteQueue(queue: any[]) {
  // Enforce 50-item cap (FIFO drop)
  const capped = queue.length > 50 ? queue.slice(-50) : queue;
  const serialized = JSON.stringify(capped);
  try {
    localStorage.setItem(QUEUE_KEY, serialized);
    // PATCH 4: Verify the write actually landed
    const verify = localStorage.getItem(QUEUE_KEY);
    if (!verify || verify !== serialized) {
      fallbackToFetch(capped);
    }
  } catch {
    // Storage quota exceeded — last resort: clear everything, then fire directly
    try { localStorage.clear(); } catch { /* unrecoverable */ }
    fallbackToFetch(capped);
  }
}

function acquireLock(): boolean {
  // Patch 11: TTL-based lock to prevent cross-tab deadlocks
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    const existing = raw ? JSON.parse(raw) : null;
    const now = Date.now();
    if (existing && now - existing.timestamp < LOCK_TTL) return false; // Active lock held by another tab
    localStorage.setItem(LOCK_KEY, JSON.stringify({ timestamp: now }));
    return true;
  } catch {
    return false;
  }
}

function releaseLock() {
  try { localStorage.removeItem(LOCK_KEY); } catch { /* ignore */ }
}

async function flushTrackingQueue() {
  if (!acquireLock()) return;

  try {
    const queue = safeReadQueue();
    if (queue.length === 0) { releaseLock(); return; }

    const now = Date.now();
    // Filter: 24h TTL + max 3 retries
    const validItems = queue.filter(
      (item: any) => now - item.timestamp < 86400000 && (item.retryCount || 0) < 3
    );

    const batches: any[][] = [];
    for (let i = 0; i < validItems.length; i += 5) {
      batches.push(validItems.slice(i, i + 5));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      batch.forEach((item: any) => {
        const body = JSON.stringify({
          "0": { json: { token: item.token, propertyId: item.propertyId, source: item.source } }
        });
        fetch("/api/trpc/tracking.trackInteraction?batch=1", {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
          keepalive: true, // Survives navigation
        }).catch(() => {});
      });
      if (i < batches.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Clear successfully attempted events
    safeWriteQueue([]);
  } finally {
    releaseLock();
  }
}

function syncFlushBeforeUnload() {
  // Patch 18: Best-effort sync flush on page close (sendBeacon only)
  const queue = safeReadQueue();
  if (queue.length === 0) return;

  queue.slice(0, 10).forEach((item: any) => {
    const body = JSON.stringify({
      "0": { json: { token: item.token, propertyId: item.propertyId, source: item.source } }
    });
    navigator.sendBeacon(
      "/api/trpc/tracking.trackInteraction?batch=1",
      new Blob([body], { type: "application/json" })
    );
  });
}

function TrackingFlusher() {
  useEffect(() => {
    // Initial flush on mount (session-deduped via lock TTL)
    flushTrackingQueue();

    // Patch 23: visibilitychange — fires when user switches apps or locks phone  
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        syncFlushBeforeUnload(); // Use sendBeacon on hide (works on mobile)
      } else if (document.visibilityState === "visible") {
        flushTrackingQueue(); // Re-flush on return (catches failed attempts)
      }
    };

    // Patch 18: beforeunload — extra layer for desktop browsers
    const handleUnload = () => syncFlushBeforeUnload();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <TrackingFlusher />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
