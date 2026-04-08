import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { AppIcon } from "../../app/AppIcon";
import { ActionAssistant, EmptyState, SectionIntro } from "../shared/Shared";

export function SearchPage() {
  const navigate = useNavigate();
  const { locale, categories, services, zones, requests, matches, session } = useApp();
  const [query, setQuery] = useState("");
  const safeServices = useMemo(() => services.filter((service): service is (typeof services)[number] => Boolean(service)), [services]);

  const normalizedQuery = query.trim().toLowerCase();

  const categoryResults = useMemo(
    () => categories.filter((item) => item.name.toLowerCase().includes(normalizedQuery) || (item.marketing_title || "").toLowerCase().includes(normalizedQuery)).slice(0, 6),
    [categories, normalizedQuery],
  );

  const serviceResults = useMemo(
    () => safeServices.filter((item) => item.name.toLowerCase().includes(normalizedQuery) || (item.description || "").toLowerCase().includes(normalizedQuery)).slice(0, 8),
    [safeServices, normalizedQuery],
  );

  const zoneResults = useMemo(
    () => zones.filter((item) => item.name.toLowerCase().includes(normalizedQuery)).slice(0, 8),
    [zones, normalizedQuery],
  );

  const requestResults = useMemo(
    () => requests.filter((item) => item.title.toLowerCase().includes(normalizedQuery) || item.description.toLowerCase().includes(normalizedQuery)).slice(0, 5),
    [requests, normalizedQuery],
  );

  const matchResults = useMemo(
    () => matches.filter((item) => (item.request_title || item.title || "").toLowerCase().includes(normalizedQuery) || (item.description || "").toLowerCase().includes(normalizedQuery)).slice(0, 5),
    [matches, normalizedQuery],
  );

  const hasQuery = normalizedQuery.length > 0;

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Search" : "Recherche"}
          title={locale === "en-CA" ? "Find a service, a city, or a live item faster" : "Retrouver plus vite un service, une ville ou un element en cours"}
          body={locale === "en-CA" ? "Use one search entry for public discovery and connected follow-up." : "Utilisez une seule entree de recherche pour la decouverte publique et le suivi connecte."}
        />
        <div className="search-toolbar">
          <label className="search-inline-field">
            <AppIcon name="search" />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === "en-CA" ? "Search services, cities, requests..." : "Rechercher services, villes, demandes..."}
              value={query}
            />
          </label>
          <button className="secondary-button" onClick={() => setQuery("")} type="button">
            {locale === "en-CA" ? "Clear" : "Effacer"}
          </button>
          <button className="primary-button" onClick={() => navigate(`/${locale}/services`)} type="button">
            {locale === "en-CA" ? "Browse catalog" : "Parcourir le catalogue"}
          </button>
        </div>
      </section>

      {!hasQuery ? (
        <ActionAssistant
          action={
            <button className="ghost-button" onClick={() => navigate(session ? `/${locale}/app/demandes` : `/${locale}/services`)} type="button">
              {session ? (locale === "en-CA" ? "Go to my requests" : "Voir mes demandes") : (locale === "en-CA" ? "See all services" : "Voir tous les services")}
            </button>
          }
          body={locale === "en-CA" ? "Type a service, city, provider specialty, or one of your request titles to jump to the right area." : "Tapez un service, une ville, une specialite ou un titre de demande pour aller directement au bon endroit."}
          icon="spark"
          items={[
            locale === "en-CA" ? "Search by service or category" : "Recherche par service ou categorie",
            locale === "en-CA" ? "Search by city coverage" : "Recherche par ville couverte",
            locale === "en-CA" ? "Search your requests and provider leads" : "Recherche dans vos demandes et leads",
          ]}
          title={locale === "en-CA" ? "A unified search assistant" : "Un assistant de recherche unifie"}
          tone="info"
        />
      ) : null}

      {hasQuery && categoryResults.length + serviceResults.length + zoneResults.length + requestResults.length + matchResults.length === 0 ? (
        <EmptyState
          body={locale === "en-CA" ? "Try a broader service name or a city name." : "Essayez un nom de service plus large ou un nom de ville."}
          title={locale === "en-CA" ? "No result found." : "Aucun resultat trouve."}
        />
      ) : null}

      <section className="search-results-grid">
        <article className="panel panel-clean">
          <SectionIntro eyebrow={locale === "en-CA" ? "Services" : "Services"} title={locale === "en-CA" ? "Catalog matches" : "Correspondances catalogue"} />
          <div className="search-card-list">
            {serviceResults.map((service) => (
              <article className="search-result-card search-result-card-compact" key={service.id}>
                <div>
                  <strong>{service.name}</strong>
                  <p>{service.marketing_title || service.description || (locale === "en-CA" ? "Service listing" : "Service disponible")}</p>
                  <button className="text-link-button" onClick={() => navigate(`/${locale}/services`)} type="button">
                    {locale === "en-CA" ? "Open catalog" : "Ouvrir le catalogue"}
                  </button>
                </div>
              </article>
            ))}
            {categoryResults.map((category) => (
              <article className="search-result-card search-result-card-compact" key={category.id}>
                <div>
                  <strong>{category.name}</strong>
                  <p>{category.marketing_subtitle || category.description || (locale === "en-CA" ? "Category" : "Categorie")}</p>
                  <button className="text-link-button" onClick={() => navigate(`/${locale}/services`)} type="button">
                    {locale === "en-CA" ? "See category" : "Voir la categorie"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel panel-clean">
          <SectionIntro eyebrow={locale === "en-CA" ? "Coverage" : "Couverture"} title={locale === "en-CA" ? "Cities and areas" : "Villes et zones"} />
          <div className="search-card-list">
            {zoneResults.map((zone) => (
              <article className="search-result-card search-result-card-compact" key={zone.id}>
                <div>
                  <strong>{zone.name}</strong>
                  <p>{zone.marketing_blurb || (locale === "en-CA" ? "Local coverage available" : "Couverture locale disponible")}</p>
                </div>
                <span className="status-chip">{zone.type}</span>
              </article>
            ))}
          </div>
        </article>
      </section>

      {session ? (
        <section className="search-results-grid">
          <article className="panel panel-clean">
            <SectionIntro eyebrow={locale === "en-CA" ? "Client items" : "Cote client"} title={locale === "en-CA" ? "Matching requests" : "Demandes correspondantes"} />
            <div className="search-card-list">
              {requestResults.map((request) => (
                <article className="search-result-card search-result-card-compact" key={request.id}>
                  <div>
                    <strong>{request.title}</strong>
                    <p>{request.description}</p>
                  </div>
                  <button className="secondary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
                    {locale === "en-CA" ? "Open" : "Ouvrir"}
                  </button>
                </article>
              ))}
            </div>
          </article>

          <article className="panel panel-clean">
            <SectionIntro eyebrow={locale === "en-CA" ? "Provider items" : "Cote prestataire"} title={locale === "en-CA" ? "Matching leads" : "Leads correspondants"} />
            <div className="search-card-list">
              {matchResults.map((match) => (
                <article className="search-result-card search-result-card-compact" key={match.id}>
                  <div>
                    <strong>{match.request_title || match.title || (locale === "en-CA" ? "Matched request" : "Demande matchee")}</strong>
                    <p>{match.description || (locale === "en-CA" ? "Potential local opportunity" : "Opportunite locale potentielle")}</p>
                  </div>
                  <button className="secondary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                    {locale === "en-CA" ? "Open" : "Ouvrir"}
                  </button>
                </article>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </section>
  );
}
