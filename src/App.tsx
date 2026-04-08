import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AppProvider } from "./app/AppProvider";
import { AppShell } from "./app/AppShell";
import { t } from "./content/i18n";
import { SkeletonBlock } from "./pages/shared/Shared";
import type { Locale, Session } from "./types";

const AuthPage = lazy(async () => ({ default: (await import("./pages/auth/AuthPage")).AuthPage }));
const ClientDashboardPage = lazy(async () => ({ default: (await import("./pages/client/ClientDashboardPage")).ClientDashboardPage }));
const ClientMissionsPage = lazy(async () => ({ default: (await import("./pages/client/ClientMissionsPage")).ClientMissionsPage }));
const ClientNotificationsPage = lazy(async () => ({ default: (await import("./pages/client/ClientNotificationsPage")).ClientNotificationsPage }));
const ClientProfilePage = lazy(async () => ({ default: (await import("./pages/client/ClientProfilePage")).ClientProfilePage }));
const ClientRequestsPage = lazy(async () => ({ default: (await import("./pages/client/ClientRequestsPage")).ClientRequestsPage }));
const ClientReviewsPage = lazy(async () => ({ default: (await import("./pages/client/ClientReviewsPage")).ClientReviewsPage }));
const ClientSettingsPage = lazy(async () => ({ default: (await import("./pages/client/ClientSettingsPage")).ClientSettingsPage }));
const BecomeProviderPage = lazy(async () => ({ default: (await import("./pages/public/BecomeProviderPage")).BecomeProviderPage }));
const CategoriesPage = lazy(async () => ({ default: (await import("./pages/public/CategoriesPage")).CategoriesPage }));
const HelpPage = lazy(async () => ({ default: (await import("./pages/public/HelpPage")).HelpPage }));
const HowItWorksPage = lazy(async () => ({ default: (await import("./pages/public/HowItWorksPage")).HowItWorksPage }));
const LegalPage = lazy(async () => ({ default: (await import("./pages/public/LegalPage")).LegalPage }));
const PricingPage = lazy(async () => ({ default: (await import("./pages/public/PricingPage")).PricingPage }));
const ProvidersPage = lazy(async () => ({ default: (await import("./pages/public/ProvidersPage")).ProvidersPage }));
const PublicHomePage = lazy(async () => ({ default: (await import("./pages/public/PublicHomePage")).PublicHomePage }));
const SearchPage = lazy(async () => ({ default: (await import("./pages/public/SearchPage")).SearchPage }));
const ServicesPage = lazy(async () => ({ default: (await import("./pages/public/ServicesPage")).ServicesPage }));
const MessagesPage = lazy(async () => ({ default: (await import("./pages/shared/MessagesPage")).MessagesPage }));
const ProviderActivationPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderActivationPage")).ProviderActivationPage }));
const ProviderDashboardPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderDashboardPage")).ProviderDashboardPage }));
const ProviderMissionsPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderMissionsPage")).ProviderMissionsPage }));
const ProviderProfilePage = lazy(async () => ({ default: (await import("./pages/provider/ProviderProfilePage")).ProviderProfilePage }));
const ProviderAnalyticsPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderAnalyticsPage")).ProviderAnalyticsPage }));
const ProviderQuotesPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderQuotesPage")).ProviderQuotesPage }));
const ProviderRequestsPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderRequestsPage")).ProviderRequestsPage }));
const ProviderReputationPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderReputationPage")).ProviderReputationPage }));
const ProviderSettingsPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderSettingsPage")).ProviderSettingsPage }));
const ProviderAvailabilityPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderAvailabilityPage")).ProviderAvailabilityPage }));
const ProviderServicesPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderServicesPage")).ProviderServicesPage }));
const ProviderZonesPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderZonesPage")).ProviderZonesPage }));
const ProviderSubscriptionPage = lazy(async () => ({ default: (await import("./pages/provider/ProviderSubscriptionPage")).ProviderSubscriptionPage }));

function RouteFallback() {
  const path = window.location.pathname;
  const locale = path.includes("/en-CA") ? "en-CA" : "fr-CA";
  return (
    <div className="app-loading-shell">
      <strong>{t(locale, "loadingInterface")}</strong>
      <SkeletonBlock lines={3} />
    </div>
  );
}

function normalizeLocale(value?: string): Locale {
  return value === "en-CA" ? "en-CA" : "fr-CA";
}

function LocaleBoundary() {
  const params = useParams();
  const locale = normalizeLocale(params.locale);
  return (
    <AppProvider locale={locale}>
      <AppShell />
    </AppProvider>
  );
}

function RequireAuth() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  const locale = normalizeLocale(parts[0]);
  const rawSession = window.localStorage.getItem("jobizy_web_session");
  let session: Session | null = null;

  if (rawSession) {
    try {
      session = JSON.parse(rawSession) as Session;
    } catch {
      session = null;
    }
  }

  if (!session) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={`/${locale}/connexion?next=${encodeURIComponent(next)}`} />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate replace to="/fr-CA" />} />
          <Route path="/:locale" element={<LocaleBoundary />}>
            <Route index element={<PublicHomePage />} />
            <Route path="comment-ca-marche" element={<HowItWorksPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="prestataires" element={<ProvidersPage />} />
            <Route path="tarifs" element={<PricingPage />} />
            <Route path="aide" element={<HelpPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="recherche" element={<SearchPage />} />
            <Route path="devenir-prestataire" element={<BecomeProviderPage />} />
            <Route path="connexion" element={<AuthPage mode="login" />} />
            <Route path="inscription" element={<AuthPage mode="register" />} />
            <Route path="conditions" element={<LegalPage mode="terms" />} />
            <Route path="confidentialite" element={<LegalPage mode="privacy" />} />

            <Route element={<RequireAuth />}>
              <Route path="app" element={<ClientDashboardPage />} />
              <Route path="app/demandes" element={<ClientRequestsPage />} />
              <Route path="app/messages" element={<MessagesPage />} />
              <Route path="app/missions" element={<ClientMissionsPage />} />
              <Route path="app/facturation" element={<Navigate replace to="../missions" />} />
              <Route path="app/avis" element={<ClientReviewsPage />} />
              <Route path="app/parametres" element={<ClientSettingsPage />} />
              <Route path="app/notifications" element={<ClientNotificationsPage />} />
              <Route path="app/profil" element={<ClientProfilePage />} />

              <Route path="pro" element={<ProviderDashboardPage />} />
              <Route path="pro/activation" element={<ProviderActivationPage />} />
              <Route path="pro/demandes" element={<ProviderRequestsPage />} />
              <Route path="pro/reponses" element={<ProviderQuotesPage />} />
              <Route path="pro/missions" element={<ProviderMissionsPage />} />
              <Route path="pro/messages" element={<MessagesPage />} />
              <Route path="pro/revenus" element={<Navigate replace to="../abonnement" />} />
              <Route path="pro/abonnement" element={<ProviderSubscriptionPage />} />
              <Route path="pro/profil" element={<ProviderProfilePage />} />
              <Route path="pro/services" element={<ProviderServicesPage />} />
              <Route path="pro/zones" element={<ProviderZonesPage />} />
              <Route path="pro/disponibilites" element={<ProviderAvailabilityPage />} />
              <Route path="pro/statistiques" element={<ProviderAnalyticsPage />} />
              <Route path="pro/reputation" element={<ProviderReputationPage />} />
              <Route path="pro/parametres" element={<ProviderSettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
