import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { t } from "../content/i18n";
import type { Locale } from "../types";
import { Avatar } from "../components/Avatar";
import { CookieConsent } from "../components/CookieConsent";
import { InstallPrompt } from "../components/InstallPrompt";
import { SkeletonBlock } from "../pages/shared/Shared";
import { useApp } from "./AppProvider";
import { AppIcon, type AppIconName } from "./AppIcon";

type ShellLink = {
  label: string;
  href: string;
  icon: AppIconName;
};

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, session, notice, error, loading, clearNotice, logout, providerProfile, notifications } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isProviderEnabled = Boolean(session?.user.is_provider_enabled);
  const isProviderRoute = location.pathname.startsWith(`/${locale}/pro`);
  const activeWorkspace = isProviderRoute ? "provider" : "client";
  const isPublic = !session;
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const clientLinks: ShellLink[] = [
    { label: locale === "en-CA" ? "Dashboard" : "Tableau de bord", href: `/${locale}/app`, icon: "home" },
    { label: locale === "en-CA" ? "My requests" : "Mes demandes", href: `/${locale}/app/demandes`, icon: "requests" },
    { label: t(locale, "messages"), href: `/${locale}/app/messages`, icon: "messages" },
    { label: "Missions", href: `/${locale}/app/missions`, icon: "mission" },
    { label: locale === "en-CA" ? "Reviews" : "Avis", href: `/${locale}/app/avis`, icon: "reputation" },
    { label: t(locale, "profile"), href: `/${locale}/app/profil`, icon: "profile" },
    { label: locale === "en-CA" ? "Settings" : "Paramètres", href: `/${locale}/app/parametres`, icon: "notifications" },
  ];

  const providerLinks: ShellLink[] = [
    { label: locale === "en-CA" ? "Dashboard" : "Tableau de bord", href: `/${locale}/pro`, icon: "home" },
    { label: locale === "en-CA" ? "Available requests" : "Demandes disponibles", href: `/${locale}/pro/demandes`, icon: "spark" },
    { label: locale === "en-CA" ? "My replies" : "Mes réponses", href: `/${locale}/pro/reponses`, icon: "requests" },
    { label: locale === "en-CA" ? "My missions" : "Mes missions", href: `/${locale}/pro/missions`, icon: "mission" },
    { label: t(locale, "messages"), href: `/${locale}/pro/messages`, icon: "messages" },
    { label: locale === "en-CA" ? "Analytics" : "Statistiques", href: `/${locale}/pro/statistiques`, icon: "chart" },
    { label: locale === "en-CA" ? "Subscription" : "Abonnement", href: `/${locale}/pro/abonnement`, icon: "subscription" },
    { label: locale === "en-CA" ? "My services" : "Mes services", href: `/${locale}/pro/services`, icon: "requests" },
    { label: locale === "en-CA" ? "My zones" : "Mes zones", href: `/${locale}/pro/zones`, icon: "mission" },
    { label: locale === "en-CA" ? "Availability" : "Disponibilités", href: `/${locale}/pro/disponibilites`, icon: "mission" },
    { label: locale === "en-CA" ? "Reviews" : "Avis", href: `/${locale}/pro/reputation`, icon: "reputation" },
    { label: t(locale, "profile"), href: `/${locale}/pro/profil`, icon: "profile" },
    { label: locale === "en-CA" ? "Settings" : "Paramètres", href: `/${locale}/pro/parametres`, icon: "notifications" },
  ];

  const publicLinks = [
    { label: locale === "en-CA" ? "Find a service" : "Trouver un service", href: `/${locale}/categories`, icon: "search" as const },
    { label: t(locale, "becomeProvider"), href: `/${locale}/devenir-prestataire`, icon: "provider" as const },
    { label: locale === "en-CA" ? "Pricing" : "Tarifs", href: `/${locale}/tarifs`, icon: "subscription" as const },
    { label: locale === "en-CA" ? "Help" : "Aide", href: `/${locale}/aide`, icon: "messages" as const },
  ];

  const mobileLinks = session
    ? isProviderRoute
      ? providerLinks.filter((item) =>
          [
            `/${locale}/pro`,
            `/${locale}/pro/demandes`,
            `/${locale}/pro/reponses`,
            `/${locale}/pro/messages`,
            `/${locale}/pro/profil`,
          ].includes(item.href),
        )
      : clientLinks.filter((item) =>
          [
            `/${locale}/app`,
            `/${locale}/app/demandes`,
            `/${locale}/app/messages`,
            `/${locale}/app/missions`,
            `/${locale}/app/profil`,
          ].includes(item.href),
        )
    : [];

  const profileDisplayName = useMemo(() => {
    if (!session) return "";
    const fullName = `${session.user.first_name || ""} ${session.user.last_name || ""}`.trim();
    return fullName || session.user.email;
  }, [session]);

  const activeLinks = activeWorkspace === "provider" ? providerLinks : clientLinks;
  const activeActor = activeWorkspace === "provider"
    ? {
        icon: "provider" as const,
        title: t(locale, "providerSpace"),
        subtitle: locale === "en-CA"
          ? "Lead capture, offers, reputation and subscription leverage."
          : "Leads, offres, reputation et levier abonnement.",
        tone: "provider" as const,
      }
    : {
        icon: "profile" as const,
        title: t(locale, "clientSpace"),
        subtitle: locale === "en-CA"
          ? "Requests, offers, missions and client follow-up."
          : "Demandes, offres, missions et suivi client.",
        tone: "client" as const,
      };
  const switchWorkspaceHref = activeWorkspace === "provider" ? `/${locale}/app` : `/${locale}/pro`;
  const switchWorkspaceLabel = activeWorkspace === "provider"
    ? (locale === "en-CA" ? "Switch to client space" : "Passer a l'espace client")
    : (locale === "en-CA" ? "Switch to provider space" : "Passer a l'espace prestataire");
  const currentProfileHref = activeWorkspace === "provider" ? `/${locale}/pro/profil` : `/${locale}/app/profil`;
  const currentProfileLabel = activeWorkspace === "provider"
    ? (providerProfile?.display_name || t(locale, "providerSpace"))
    : profileDisplayName;

  function switchLocale(nextLocale: Locale) {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "fr-CA" || parts[0] === "en-CA") parts[0] = nextLocale;
    else parts.unshift(nextLocale);
    navigate(`/${parts.join("/")}`);
    setMobileMenuOpen(false);
  }

  const brandButton = (
    <button
      className="brand-button"
      onClick={() => {
        setMobileMenuOpen(false);
        navigate(`/${locale}`);
      }}
      type="button"
    >
      <img alt="Jobizy" src="/logo.png" />
      <div>
        <strong>{t(locale, "brand")}</strong>
      </div>
    </button>
  );

  const langSelect = (
    <select aria-label={t(locale, "language")} onChange={(event) => switchLocale(event.target.value as Locale)} value={locale}>
      <option value="fr-CA">FR</option>
      <option value="en-CA">EN</option>
    </select>
  );

  const notices = (
    <>
      {notice ? <div className="notice notice-success" onClick={clearNotice} role="status">{notice}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}
      {loading ? (
        <div className="notice" aria-live="polite">
          <strong>{t(locale, "syncInProgress")}</strong>
          <SkeletonBlock lines={2} />
        </div>
      ) : null}
    </>
  );

  if (isPublic) {
    return (
      <div className="site-shell site-shell-public">
        <header className="topbar topbar-public">
          {brandButton}
          <button
            aria-expanded={mobileMenuOpen}
            aria-label="Afficher la navigation"
            className="secondary-button mobile-nav-toggle"
            onClick={() => setMobileMenuOpen((current) => !current)}
            type="button"
          >
            <AppIcon className="button-icon" name="menu" />
            {t(locale, "menu")}
          </button>
          <div className={mobileMenuOpen ? "mobile-menu mobile-menu-open" : "mobile-menu"}>
            <nav className="topnav" role="navigation">
              {publicLinks.map((item) => (
                <button key={item.href} onClick={() => { navigate(item.href); setMobileMenuOpen(false); }} type="button">
                  <AppIcon className="button-icon" name={item.icon} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="topbar-actions">
              <div className="public-actions">
                {langSelect}
                <button className="ghost-button" onClick={() => navigate(`/${locale}/connexion`)} type="button">{t(locale, "signIn")}</button>
                <button className="primary-button" onClick={() => navigate(`/${locale}/inscription`)} type="button">{t(locale, "signUp")}</button>
              </div>
            </div>
          </div>
        </header>

        <main className="page-wrap">
          {notices}
          <Outlet />
        </main>

        <CookieConsent locale={locale} />
        <InstallPrompt locale={locale} />
      </div>
    );
  }

  return (
    <div className={`app-layout app-layout-${activeWorkspace}${mobileMenuOpen ? " app-layout-menu-open" : ""}`}>
      <aside className="sidebar" aria-label={locale === "en-CA" ? "Main navigation" : "Navigation principale"}>
        <div className="sidebar-brand">{brandButton}</div>

        <div className="sidebar-role">
          <span className={`role-badge role-badge-${activeWorkspace}`}>
            <AppIcon className="button-icon" name={activeActor.icon} />
            {activeWorkspace === "provider" ? (locale === "en-CA" ? "Provider" : "Prestataire") : "Client"}
          </span>
          {isProviderEnabled ? (
            <button className="sidebar-switch" onClick={() => { navigate(switchWorkspaceHref); setMobileMenuOpen(false); }} type="button">
              {switchWorkspaceLabel}
            </button>
          ) : (
            <button className="sidebar-switch" onClick={() => navigate(`/${locale}/pro/activation`)} type="button">
              {t(locale, "becomeProvider")}
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {activeLinks.map((item) => {
            const isMessages = item.href.endsWith("/messages");
            const badge = isMessages && unreadCount > 0 ? unreadCount : 0;
            return (
              <NavLink
                key={item.href}
                className={({ isActive }) => (isActive ? "sidebar-link sidebar-link-active" : "sidebar-link")}
                end={item.href === `/${locale}/app` || item.href === `/${locale}/pro`}
                onClick={() => setMobileMenuOpen(false)}
                to={item.href}
              >
                <AppIcon className="button-icon" name={item.icon} />
                <span>{item.label}</span>
                {badge > 0 ? <span className="sidebar-badge">{badge > 9 ? "9+" : badge}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <button className="sidebar-user-main" onClick={() => navigate(currentProfileHref)} type="button">
            <Avatar name={profileDisplayName} url={session.user.avatar_url} size={36} />
            <span>
              <strong>{currentProfileLabel}</strong>
              <small>{session.user.email}</small>
            </span>
          </button>
          <button className="sidebar-logout" onClick={logout} type="button">
            <AppIcon className="button-icon" name="logout" />
            {t(locale, "logout")}
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            aria-expanded={mobileMenuOpen}
            aria-label="Afficher la navigation"
            className="app-topbar-menu"
            onClick={() => setMobileMenuOpen((current) => !current)}
            type="button"
          >
            <AppIcon className="button-icon" name="menu" />
          </button>
          <div className="app-topbar-brand">{brandButton}</div>
          <div className="app-topbar-actions">
            <button className="icon-button" onClick={() => navigate(`/${locale}/recherche`)} aria-label={locale === "en-CA" ? "Search" : "Recherche"} type="button">
              <AppIcon className="button-icon" name="search" />
            </button>
            <button
              className="icon-button icon-button-badge"
              onClick={() => navigate(activeWorkspace === "provider" ? `/${locale}/pro/messages` : `/${locale}/app/notifications`)}
              aria-label="Notifications"
              type="button"
            >
              <AppIcon className="button-icon" name="notifications" />
              {unreadCount > 0 ? <span className="icon-badge">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
            </button>
            {langSelect}
            {isProviderRoute ? (
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                <AppIcon className="button-icon" name="spark" />
                {locale === "en-CA" ? "Available requests" : "Opportunités"}
              </button>
            ) : (
              <button className="primary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
                <AppIcon className="button-icon" name="spark" />
                {t(locale, "publishRequest")}
              </button>
            )}
          </div>
        </header>

        <main className="page-wrap">
          {notices}
          <Outlet />
        </main>
      </div>

      {mobileMenuOpen ? <button aria-label="Fermer" className="sidebar-scrim" onClick={() => setMobileMenuOpen(false)} type="button" /> : null}

      <CookieConsent locale={locale} />
      <InstallPrompt locale={locale} />

      {session ? (
        <nav aria-label="Navigation mobile" className="mobile-bottom-nav">
          {mobileLinks.map((item) => {
            const isMessages = item.href.endsWith("/messages");
            const badge = isMessages && unreadCount > 0 ? unreadCount : 0;
            return (
              <NavLink
                key={item.href}
                className={({ isActive }) => (isActive ? "mobile-bottom-link mobile-bottom-link-active" : "mobile-bottom-link")}
                to={item.href}
              >
                <span className="mobile-link-wrap">
                  <AppIcon name={item.icon} />
                  {badge > 0 ? <span className="mobile-link-badge">{badge > 9 ? "9+" : badge}</span> : null}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
