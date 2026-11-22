import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuotes } from "../../lib/api";
import { useApp } from "../../app/AppProvider";
import { AppIcon } from "../../app/AppIcon";
import { EmptyState, isMissionActive, isMissionCompleted, StatCard, StatusChip } from "../shared/Shared";
import type { Quote } from "../../types";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

function money(value: number | null | undefined, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format((value ?? 0) / 100);
}

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const { locale, session, requests, missions, notifications, platform } = useApp();
  const [recentQuotes, setRecentQuotes] = useState<Array<Quote & { requestTitle?: string }>>([]);

  const latestRequests = useMemo(() => requests.slice(0, 4), [requests]);
  const activeRequests = useMemo(() => requests.filter((request) => !["closed", "cancelled"].includes(request.status)), [requests]);
  const activeMissions = useMemo(() => missions.filter((mission) => isMissionActive(mission.status)), [missions]);
  const completedMissions = useMemo(() => missions.filter((mission) => isMissionCompleted(mission.status)), [missions]);
  const unreadNotifications = useMemo(() => notifications.filter((item) => !item.is_read), [notifications]);

  useEffect(() => {
    async function loadRecentQuotes() {
      if (!session || latestRequests.length === 0) {
        setRecentQuotes([]);
        return;
      }

      const quoteLists = await Promise.all(
        latestRequests.slice(0, 3).map(async (request) => {
          try {
            const quotes = await getQuotes(session, locale, request.id);
            return quotes.slice(0, 2).map((quote) => ({ ...quote, requestTitle: request.title }));
          } catch {
            return [];
          }
        }),
      );

      setRecentQuotes(quoteLists.flat().slice(0, 4));
    }

    void loadRecentQuotes();
  }, [latestRequests, locale, session]);

  const quoteCount = recentQuotes.length;

  const firstName = session?.user.first_name || "";
  const L = (fr: string, en: string) => (locale === "en-CA" ? en : fr);

  return (
    <section className="stack stack-xl">
      <header className="dash-header">
        <div>
          <h1>{L("Bonjour", "Hello")} {firstName} <span aria-hidden="true">👋</span></h1>
          <p>{L("Prêt(e) à lancer un nouveau projet ?", "Ready to start a new project?")}</p>
        </div>
        <button className="primary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
          + {L("Publier une demande", "Post a request")}
        </button>
      </header>

      <div className="kpi-row">
        <StatCard icon="requests" label={L("Demandes actives", "Active requests")} value={String(activeRequests.length)} tone="action" />
        <StatCard icon="messages" label={L("Offres reçues", "Quotes received")} value={String(quoteCount)} tone="trust" />
        <StatCard icon="mission" label={L("Missions en cours", "Missions in progress")} value={String(activeMissions.length)} tone="info" />
        <StatCard icon="check" label={L("Missions terminées", "Completed missions")} value={String(completedMissions.length)} tone="support" />
      </div>

      <div className="dash-columns">
        <section className="panel panel-clean">
          <div className="section-head">
            <h2>{L("Mes dernières demandes", "My latest requests")}</h2>
            <button className="text-link-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
              {L("Voir tout", "See all")} →
            </button>
          </div>
          {latestRequests.length === 0 ? (
            <EmptyState
              title={L("Aucune demande pour l'instant.", "No request yet.")}
              body={L("Décrivez votre besoin en quelques étapes et recevez des offres de prestataires locaux.", "Describe your need in a few steps and receive offers from local providers.")}
              action={<button className="primary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">{L("Publier une demande", "Post a request")}</button>}
            />
          ) : (
            <div className="row-list">
              {latestRequests.map((request) => (
                <article className="row-card" key={request.id}>
                  <span className="row-card-icon"><AppIcon name="requests" /></span>
                  <div className="row-card-main">
                    <strong>{request.title}</strong>
                    <span className="row-card-meta">
                      {request.zone_name ? <><AppIcon className="meta-icon" name="location" /> {request.zone_name}</> : null}
                      {request.published_at ? <> · {formatDate(request.published_at)}</> : null}
                    </span>
                  </div>
                  <div className="row-card-side">
                    {(request.offers_count ?? 0) > 0 ? (
                      <span className="count-chip">{request.offers_count} {request.offers_count === 1 ? L("offre", "offer") : L("offres", "offers")}</span>
                    ) : null}
                    <StatusChip locale={locale} status={request.status} />
                    <button className="ghost-button compact-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
                      {L("Voir", "View")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="stack">
          <section className="panel panel-clean">
            <div className="section-head"><h2>{L("Offres récentes", "Recent offers")}</h2></div>
            {recentQuotes.length === 0 ? (
              <p className="section-copy">{L("Dès que des prestataires répondront, leurs prix et délais apparaîtront ici.", "As soon as providers reply, their pricing and timing will appear here.")}</p>
            ) : (
              <div className="row-list">
                {recentQuotes.map((quote) => (
                  <article className="row-card row-card-compact" key={quote.id}>
                    <span className="row-card-avatar">{(quote.display_name || quote.business_name || "?").slice(0, 2).toUpperCase()}</span>
                    <div className="row-card-main">
                      <strong>{quote.display_name || quote.business_name || quote.provider_profile_id}</strong>
                      <span className="row-card-meta">{quote.requestTitle || "-"}</span>
                    </div>
                    <strong className="row-card-price">{money(quote.estimated_price_cents, platform?.currency ?? "CAD")}</strong>
                  </article>
                ))}
              </div>
            )}
            {recentQuotes.length > 0 ? (
              <button className="outline-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">{L("Comparer les offres", "Compare quotes")}</button>
            ) : null}
          </section>

          <section className="panel panel-clean">
            <div className="section-head"><h2>{L("Dernières mises à jour", "Recent updates")}</h2></div>
            {unreadNotifications.length === 0 ? (
              <p className="section-copy">{L("Tout est à jour. Les nouvelles offres et mises à jour de mission apparaîtront ici.", "Everything is up to date. New offers and mission updates will appear here.")}</p>
            ) : (
              <div className="row-list">
                {unreadNotifications.slice(0, 4).map((notification) => (
                  <article className="row-card row-card-compact" key={notification.id}>
                    <span className="row-card-icon"><AppIcon name="notifications" /></span>
                    <div className="row-card-main">
                      <strong>{notification.title}</strong>
                      <span className="row-card-meta">{formatDate(notification.created_at)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
