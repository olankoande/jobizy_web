import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuotes } from "../../lib/api";
import { useApp } from "../../app/AppProvider";
import { EmptyState, SectionIntro, StatCard, ToneCard } from "../shared/Shared";
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
  const { locale, session, requests, missions, notifications, categories, zones, platform } = useApp();
  const [recentQuotes, setRecentQuotes] = useState<Array<Quote & { requestTitle?: string }>>([]);

  const latestRequests = useMemo(() => requests.slice(0, 4), [requests]);
  const activeRequests = useMemo(() => requests.filter((request) => !["closed", "cancelled"].includes(request.status)), [requests]);
  const activeMissions = useMemo(() => missions.filter((mission) => !["completed", "cancelled"].includes(mission.status)), [missions]);
  const completedMissions = useMemo(() => missions.filter((mission) => mission.status === "completed"), [missions]);
  const unreadNotifications = useMemo(() => notifications.filter((item) => !item.is_read), [notifications]);
  const suggestions = useMemo(() => {
    const activeCities = zones.filter((zone) => zone.type === "city").slice(0, 3);
    const popularCategories = categories.slice(0, 3);
    return { activeCities, popularCategories };
  }, [categories, zones]);

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

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Client dashboard" : "Tableau de bord client"}
          title={locale === "en-CA" ? "Everything should revolve around your requests" : "Tout doit tourner autour de vos demandes"}
          body={locale === "en-CA" ? "Post quickly, track status clearly, compare quotes and organize the service with confidence." : "Publiez vite, suivez les statuts clairement, comparez les offres et organisez la prestation en confiance."}
          aside={
            <button className="primary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
              {locale === "en-CA" ? "Post a request" : "Publier une demande"}
            </button>
          }
        />
        <div className="hero-panel">
          <StatCard
            icon="requests"
            label={locale === "en-CA" ? "Active requests" : "Demandes actives"}
            value={String(activeRequests.length)}
            detail={locale === "en-CA" ? "Waiting, published or awarded" : "En attente, publiees ou attribuees"}
            tone="action"
          />
          <StatCard
            icon="spark"
            label={locale === "en-CA" ? "Quotes received" : "Offres recues"}
            value={String(quoteCount)}
            detail={locale === "en-CA" ? "Recent comparable offers" : "Offres recentes comparables"}
            tone="trust"
            deltaPositive={quoteCount > 0}
            delta={quoteCount > 0 ? (locale === "en-CA" ? "New offers waiting" : "Nouvelles offres en attente") : undefined}
          />
          <StatCard
            icon="mission"
            label={locale === "en-CA" ? "Missions in progress" : "Missions en cours"}
            value={String(activeMissions.length)}
            detail={locale === "en-CA" ? "Execution underway" : "Execution en cours"}
            tone="info"
          />
          <StatCard
            icon="check"
            label={locale === "en-CA" ? "Completed missions" : "Missions terminees"}
            value={String(completedMissions.length)}
            detail={locale === "en-CA" ? "Ready for reviews" : "Pretes pour les avis"}
            tone="support"
            deltaPositive={completedMissions.length > 0}
            delta={completedMissions.length > 0 ? (locale === "en-CA" ? "Leave a review" : "Laisser un avis") : undefined}
          />
        </div>
      </section>

      <section className="dashboard-grid">
        <ToneCard className="tabular-card" tone="action">
          <p className="eyebrow">{locale === "en-CA" ? "Quick action" : "Action rapide"}</p>
          <strong>{locale === "en-CA" ? "Publish a new request without losing momentum" : "Publiez une nouvelle demande sans perdre l'elan"}</strong>
          <p className="section-copy">{locale === "en-CA" ? "The request wizard is the main conversion path. Keep it one click away from the dashboard." : "Le wizard de demande est le chemin de conversion principal. Il doit rester a un clic du dashboard."}</p>
          <div className="cta-row">
            <button className="primary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
              {locale === "en-CA" ? "Post a request" : "Publier une demande"}
            </button>
            <button className="ghost-button" onClick={() => navigate(`/${locale}/app/messages`)} type="button">
              {locale === "en-CA" ? "Open messages" : "Ouvrir les messages"}
            </button>
          </div>
        </ToneCard>

        <ToneCard className="tabular-card" tone="support">
          <p className="eyebrow">{locale === "en-CA" ? "Latest requests" : "Dernieres demandes"}</p>
          {latestRequests.length === 0 ? (
            <EmptyState
              title={locale === "en-CA" ? "No request yet." : "Aucune demande pour l'instant."}
              body={locale === "en-CA" ? "Your latest requests will appear here with status and offer count." : "Vos dernieres demandes apparaitront ici avec statut et nombre d'offres."}
            />
          ) : (
            latestRequests.map((request) => (
              <div className="tabular-row" key={request.id}>
                <div>
                  <strong>{request.title}</strong>
                  <span>{request.status}</span>
                </div>
                <button className="ghost-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
                  {locale === "en-CA" ? "View" : "Voir"}
                </button>
              </div>
            ))
          )}
        </ToneCard>

        <ToneCard className="tabular-card" tone="trust">
          <p className="eyebrow">{locale === "en-CA" ? "Recent offers" : "Offres recentes"}</p>
          {recentQuotes.length === 0 ? (
            <EmptyState
              title={locale === "en-CA" ? "No quote yet." : "Aucune offre pour l'instant."}
              body={locale === "en-CA" ? "As soon as providers reply, their pricing and timing will appear here." : "Des que les prestataires repondront, leurs prix et delais apparaitront ici."}
            />
          ) : (
            recentQuotes.map((quote) => (
              <div className="tabular-row" key={quote.id}>
                <div>
                  <strong>{quote.display_name || quote.business_name || quote.provider_profile_id}</strong>
                  <span>{quote.requestTitle || "-"}</span>
                </div>
                <span>{money(quote.estimated_price_cents, platform?.currency ?? "CAD")} · {quote.proposed_time_window || (locale === "en-CA" ? "To confirm" : "A confirmer")}</span>
              </div>
            ))
          )}
          {recentQuotes.length > 0 ? (
            <div className="cta-row">
              <button className="primary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
                {locale === "en-CA" ? "Compare quotes" : "Comparer les offres"}
              </button>
            </div>
          ) : null}
        </ToneCard>
      </section>

      <section className="dashboard-grid">
        <ToneCard className="tabular-card" tone="info">
          <p className="eyebrow">{locale === "en-CA" ? "Suggestions" : "Suggestions"}</p>
          <strong>{locale === "en-CA" ? "Providers available in your area" : "Des prestataires disponibles dans votre zone"}</strong>
          <div className="chip-row">
            {suggestions.activeCities.map((city) => (
              <span className="status-chip" key={city.id}>{city.name}</span>
            ))}
          </div>
          <p className="section-copy">{locale === "en-CA" ? "Use the search page to discover active local coverage before publishing another request." : "Utilisez la recherche pour decouvrir la couverture locale active avant de publier une nouvelle demande."}</p>
          <div className="cta-row">
            <button className="ghost-button" onClick={() => navigate(`/${locale}/recherche`)} type="button">
              {locale === "en-CA" ? "Explore providers" : "Explorer les prestataires"}
            </button>
          </div>
        </ToneCard>

        <ToneCard className="tabular-card" tone="support">
          <p className="eyebrow">{locale === "en-CA" ? "Popular categories" : "Categories populaires"}</p>
          <div className="chip-row">
            {suggestions.popularCategories.map((category) => (
              <span className="status-chip" key={category.id}>{category.name}</span>
            ))}
          </div>
          <p className="section-copy">{locale === "en-CA" ? "Popular categories help the client project the next request faster." : "Les categories populaires aident le client a projeter la prochaine demande plus vite."}</p>
        </ToneCard>

        <ToneCard className="tabular-card" tone="trust">
          <p className="eyebrow">{locale === "en-CA" ? "Recent updates" : "Dernieres mises a jour"}</p>
          {unreadNotifications.length === 0 ? (
            <EmptyState
              title={locale === "en-CA" ? "Everything is up to date." : "Tout est a jour."}
              body={locale === "en-CA" ? "New offer and mission updates will appear here." : "Les nouvelles offres et mises a jour de mission apparaitront ici."}
            />
          ) : (
            unreadNotifications.slice(0, 4).map((notification) => (
              <div className="tabular-row" key={notification.id}>
                <div>
                  <strong>{notification.title}</strong>
                  <span>{notification.body || notification.type}</span>
                </div>
                <span>{formatDate(notification.created_at)}</span>
              </div>
            ))
          )}
        </ToneCard>
      </section>
    </section>
  );
}
