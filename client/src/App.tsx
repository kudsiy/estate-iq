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
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import BillingPage from "./pages/BillingPage";
import PricingPage from "./pages/PricingPage";
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
      <Route path="/pricing"><PricingPage /></Route>
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
      <Route path="/properties">         {guard(<PropertiesPage />)}           </Route>
      <Route path="/crm">                {guard(<CRMPage />)}                  </Route>
      <Route path="/crm/contacts/:id">   {guard(<ContactDetail />)}            </Route>
      <Route path="/analytics">          {guard(<AnalyticsPage />)}            </Route>

      {/* Utility routes (not in sidebar) */}
      <Route path="/settings">           {guard(<SettingsPage />)}             </Route>
      <Route path="/billing">            {guard(<BillingPage />)}              </Route>
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

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
