import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ContactsPage from "./pages/ContactsPage";
import DealPipeline from "./pages/DealPipeline";
import ComingSoon from "./pages/ComingSoon";
import DesignStudio from "./pages/DesignStudio";
import LeadCapture from "./pages/LeadCapture";
import PropertiesPage from "./pages/PropertiesPage";
import BrandKitPage from "./pages/BrandKitPage";
import SocialMediaPage from "./pages/SocialMedia";
import AnalyticsPage from "./pages/AnalyticsPage";
import ContactDetail from "./pages/ContactDetail";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SupplierFeedPage from "./pages/SupplierFeedPage";
import MatchingPage from "./pages/MatchingPage";
import PricingPage from "./pages/PricingPage";
import BillingPage from "./pages/BillingPage";
import AdminPage from "./pages/AdminPage";
import PropertyTrackingPage from "./pages/PropertyTrackingPage";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import OnboardingPage from "./pages/OnboardingPage";
import { useEffect } from "react";
import { useLocation } from "wouter";

function RouteRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(to);
  }, [setLocation, to]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  );
}

function LoginRedirect() {
  useEffect(() => {
    const current = `${window.location.pathname}${window.location.search}`;
    window.location.href = getLoginUrl(current);
  }, []);

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

      <Route path="/pricing">
        <PricingPage />
      </Route>
      
      <Route path="/l/:userId/:listingId">
        <PropertyTrackingPage />
      </Route>

      {/* Core CRM */}
      <Route path="/dashboard">          {guard(<Dashboard />)}               </Route>
      <Route path="/crm/contacts/:id">   {guard(<ContactDetail />)}           </Route>
      <Route path="/crm/contacts">       {guard(<ContactsPage />)}            </Route>
      <Route path="/crm/deals">          {guard(<DealPipeline />)}            </Route>
      <Route path="/settings">           {guard(<SettingsPage />)}            </Route>
      <Route path="/notifications">      {guard(<NotificationsPage />)}       </Route>
      <Route path="/supplier-feed">      {guard(<SupplierFeedPage />)}        </Route>
      <Route path="/matching">           {guard(<MatchingPage />)}            </Route>
      <Route path="/billing">            {guard(<BillingPage />)}             </Route>
      <Route path="/admin">              {guard(<AdminPage />)}               </Route>

      {/* Placeholder pages — swapped out as each module is built */}
      <Route path="/properties">    {guard(<PropertiesPage />)}           </Route>
      <Route path="/leads">         {guard(<LeadCapture />)}               </Route>
      <Route path="/design-studio"> {guard(<DesignStudio />)}             </Route>
      <Route path="/social-media">  {guard(<SocialMediaPage />)}           </Route>
      <Route path="/analytics">     {guard(<AnalyticsPage />)}             </Route>
      <Route path="/brand-kit">     {guard(<BrandKitPage />)}              </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
