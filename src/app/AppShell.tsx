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

function ActorCard({
  title,
  tone,
  icon,
  links,
}: {
  title: string;
  subtitle: string;
  tone: "client" | "provider";
  icon: AppIconName;
  links: ShellLink[];
}) {
  return (
    <section className={`actor-card actor-card-${tone}`}>
      <div className="actor-card-head">
        <span className="actor-card-icon">
          <AppIcon name={icon} />
        </span>
        <strong>{title}</strong>
      </div>
      <div className="actor-link-grid">
        {links.map((item) => (
          <NavLink key={item.href} className={({ isActive }) => isActive ? "actor-link actor-link-active" : "actor-link"} to={item.href}>
            <AppIcon className="button-icon" name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </section>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, session, notice, error, loading, clearNotice, logout, providerProfile, notifications, matches } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isProviderEnabled = Boolean(session?.user.is_provider_enabled);
  const isProviderRoute = location.pathname.startsWith(`/${locale}/pro`);
  const activeWorkspace = isProviderRoute ? "provider" : "client";
  const isPublic = !session;
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const pendingMatches = matches.filter((item) => !item.responded_at).length;
  const requestTarget = `/${locale}/app/demandes`;
  const requestCtaHref = session ? requestTarget : `/${locale}/inscription?next=${encodeURIComponent(requestTarget)}`;

  const clientLinks: ShellLink[] = [
    { label: t(locale, "dashboard"), href: `/${locale}/app`, icon: "home" },
    { label: t(locale, "requests"), href: `/${locale}/app/demandes`, icon: "requests" },
    { label: t(locale, "messages"), href: `/${locale}/app/messages`, icon: "messages" },
    { label: locale === "en-CA" ? "Missions" : "Missions", href: `/${locale}/app/missions`, icon: "mission" },
    { label: locale === "en-CA" ? "Reviews" : "Avis", href: `/${locale}/app/avis`, icon: "reputation" },
    { label: t(locale, "profile"), href: `/${locale}/app/profil`, icon: "profile" },
    { label: locale === "en-CA" ? "Settings" : "Parametres", href: `/${locale}/app/parametres`, icon: "notifications" },
  ];

  const providerLinks: ShellLink[] = [
    { label: t(locale, "dashboard"), href: `/${locale}/pro`, icon: "home" },
    { label: locale === "en-CA" ? "Opportunities" : "Opportunites", href: `/${locale}/pro/demandes`, icon: "spark" },
    { label: locale === "en-CA" ? "My quotes" : "Mes offres", href: `/${locale}/pro/reponses`, icon: "requests" },
    { label: locale === "en-CA" ? "My missions" : "Mes missions", href: `/${locale}/pro/missions`, icon: "mission" },
    { label: t(locale, "messages"), href: `/${locale}/pro/messages`, icon: "messages" },
    { label: locale === "en-CA" ? "Analytics" : "Statistiques", href: `/${locale}/pro/statistiques`, icon: "chart" },
    { label: locale === "en-CA" ? "Subscription" : "Abonnement", href: `/${locale}/pro/abonnement`, icon: "subscription" },
    { label: locale === "en-CA" ? "My services" : "Mes services", href: `/${locale}/pro/services`, icon: "requests" },
    { label: locale === "en-CA" ? "My zones" : "Mes zones", href: `/${locale}/pro/zones`, icon: "mission" },
    { label: locale === "en-CA" ? "Availability" : "Disponibilités", href: `/${locale}/pro/disponibilites`, icon: "mission" },
    { label: locale === "en-CA" ? "Reviews" : "Avis", href: `/${locale}/pro/reputation`, icon: "reputation" },
    { label: t(locale, "profile"), href: `/${locale}/pro/profil`, icon: "profile" },
    { label: locale === "en-CA" ? "Settings" : "Parametres", href: `/${locale}/pro/parametres`, icon: "notifications" },
  ];

  const publicLinks = [
    { label: t(locale, "home"), href: `/${locale}`, icon: "home" as const },
    { label: t(locale, "howItWorks"), href: `/${locale}/comment-ca-marche`, icon: "spark" as const },
    { label: locale === "en-CA" ? "Categories" : "Categories", href: `/${locale}/categories`, icon: "requests" as const },
    { label: locale === "en-CA" ? "Providers" : "Prestataires", href: `/${locale}/prestataires`, icon: "provider" as const },
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
          ].includes(item.href),
        )
      : clientLinks.filter((item) =>
          [
            `/${locale}/app`,
            `/${locale}/app/demandes`,
            `/${locale}/app/messages`,
            `/${locale}/app/missions`,
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
  const activeSpaceLabel = locale === "en-CA" ? "Active space:" : "Espace actif :";

  function switchLocale(nextLocale: Locale) {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "fr-CA" || parts[0] === "en-CA") parts[0] = nextLocale;
    else parts.unshift(nextLocale);
    navigate(`/${parts.join("/")}`);
    setMobileMenuOpen(false);
  }

  return (
    <div className={isPublic ? "site-shell site-shell-public" : "site-shell"}>
      <header className={isPublic ? "topbar topbar-public" : "topbar"}>
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
            <span>{isPublic ? t(locale, "tagline") : t(locale, "publicPromise")}</span>
          </div>
        </button>

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

        <nav className={mobileMenuOpen ? "topnav topnav-open" : "topnav"} role="navigation">
          {(isPublic ? publicLinks : publicLinks.slice(0, 3)).map((item) => (
            <button key={item.href} onClick={() => navigate(item.href)} type="button">
              <AppIcon className="button-icon" name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className={mobileMenuOpen ? "topbar-actions topbar-actions-open" : "topbar-actions"}>
          {isPublic ? (
            <div className="public-actions">
              <select aria-label={t(locale, "language")} onChange={(event) => switchLocale(event.target.value as Locale)} value={locale}>
                <option value="fr-CA">FR</option>
                <option value="en-CA">EN</option>
              </select>
              <button className="ghost-button" onClick={() => navigate(`/${locale}/connexion`)} type="button">{t(locale, "signIn")}</button>
              <button className="ghost-button" onClick={() => navigate(`/${locale}/inscription`)} type="button">{t(locale, "signUp")}</button>
              <button className="secondary-button" onClick={() => navigate(`/${locale}/devenir-prestataire`)} type="button">{t(locale, "becomeProvider")}</button>
              <button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">{t(locale, "publishRequest")}</button>
            </div>
          ) : (
            <div className="workspace-actions">
              {isProviderRoute ? (
                <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                  <AppIcon className="button-icon" name="spark" />
                  {locale === "en-CA" ? "My opportunities" : "Mes opportunites"}
                </button>
              ) : (
                <button className="primary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
                  <AppIcon className="button-icon" name="spark" />
                  {t(locale, "publishRequest")}
                </button>
              )}
              <button className="secondary-button" onClick={() => navigate(`/${locale}/recherche`)} type="button">
                <AppIcon className="button-icon" name="search" />
                {locale === "en-CA" ? "Search" : "Recherche"}
              </button>
              <select aria-label={t(locale, "language")} onChange={(event) => switchLocale(event.target.value as Locale)} value={locale}>
                <option value="fr-CA">FR</option>
                <option value="en-CA">EN</option>
              </select>
              <button className="ghost-button" onClick={() => navigate(currentProfileHref)} type="button">
                <AppIcon className="button-icon" name={activeWorkspace === "provider" ? "provider" : "profile"} />
                {currentProfileLabel}
              </button>
              {isProviderEnabled ? (
                <button className="ghost-button" onClick={() => navigate(switchWorkspaceHref)} type="button">
                  <AppIcon className="button-icon" name={activeWorkspace === "provider" ? "profile" : "provider"} />
                  {switchWorkspaceLabel}
                </button>
              ) : (
                <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/activation`)} type="button">
                  <AppIcon className="button-icon" name="provider" />
                  {t(locale, "becomeProvider")}
                </button>
              )}
              <button className="primary-button" onClick={logout} type="button">
                <AppIcon className="button-icon" name="logout" />
                {t(locale, "logout")}
              </button>
            </div>
          )}
        </div>
      </header>

      {session ? (
        <aside className="workspace-switcher workspace-switcher-rich">
          <div className="workspace-summary">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Avatar
                name={profileDisplayName}
                url={session.user.avatar_url}
                size={44}
              />
              <div>
                <p className="eyebrow">{locale === "en-CA" ? "Connected account" : "Compte connecte"}</p>
                <strong>{profileDisplayName}</strong>
                <p>{session.user.email}</p>
              </div>
            </div>
            <div className="workspace-summary-meta">
              <span className="status-chip">
                {activeSpaceLabel} {activeActor.title}
              </span>
              <span className="status-chip status-chip-success">
                {unreadCount > 0
                  ? locale === "en-CA"
                    ? `${unreadCount} unread updates`
                    : `${unreadCount} mises a jour non lues`
                  : locale === "en-CA"
                    ? "Everything up to date"
                    : "Tout est a jour"}
              </span>
              {isProviderEnabled ? (
                <span className="status-chip">
                  {locale === "en-CA"
                    ? `${pendingMatches} open leads`
                    : `${pendingMatches} leads ouverts`}
                </span>
              ) : null}
            </div>
          </div>

          <div className="workspace-grid">
            <div className="stack">
              {isProviderEnabled ? (
                <div className="button-group">
                  <button
                    className={activeWorkspace === "client" ? "nav-chip nav-chip-active" : "nav-chip"}
                    onClick={() => navigate(`/${locale}/app`)}
                    type="button"
                  >
                    <AppIcon className="button-icon" name="profile" />
                    {t(locale, "clientSpace")}
                  </button>
                  <button
                    className={activeWorkspace === "provider" ? "nav-chip nav-chip-active" : "nav-chip"}
                    onClick={() => navigate(`/${locale}/pro`)}
                    type="button"
                  >
                    <AppIcon className="button-icon" name="provider" />
                    {t(locale, "providerSpace")}
                  </button>
                </div>
              ) : null}

              <ActorCard
                icon={activeActor.icon}
                links={activeLinks}
                subtitle={activeActor.subtitle}
                title={activeActor.title}
                tone={activeActor.tone}
              />
            </div>
            {!isProviderEnabled ? (
              <section className="actor-card actor-card-provider">
                <div className="actor-card-head">
                  <span className="actor-card-icon">
                    <AppIcon name="provider" />
                  </span>
                  <div>
                    <strong>{t(locale, "activateProviderSpace")}</strong>
                    <p>{t(locale, "activateProviderBody")}</p>
                  </div>
                </div>
                <div className="button-group">
                  <button className="primary-button" onClick={() => navigate(`/${locale}/pro/activation`)} type="button">
                    <AppIcon className="button-icon" name="spark" />
                    {t(locale, "becomeProvider")}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </aside>
      ) : null}

      <main className="page-wrap">
        {notice ? <div className="notice notice-success" onClick={clearNotice} role="status">{notice}</div> : null}
        {error ? <div className="notice notice-error">{error}</div> : null}
        {loading ? (
          <div className="notice" aria-live="polite">
            <strong>{t(locale, "syncInProgress")}</strong>
            <SkeletonBlock lines={2} />
          </div>
        ) : null}
        <Outlet />
      </main>

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
