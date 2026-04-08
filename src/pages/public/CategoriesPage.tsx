import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { CategoryIcon } from "../../app/CategoryIcon";
import { getCitySpotlights, mapPublicCitySpotlights } from "../../content/marketplaceContent";
import { SectionIntro } from "../shared/Shared";

export function CategoriesPage() {
  const navigate = useNavigate();
  const { locale, categories, services, publicCities, zones, session } = useApp();

  const featuredCities = useMemo(
    () => (publicCities.length > 0 ? mapPublicCitySpotlights(locale, publicCities) : getCitySpotlights(locale, zones)),
    [locale, publicCities, zones],
  );

  const requestTarget = `/${locale}/app/demandes`;
  const requestCtaHref = session ? requestTarget : `/${locale}/inscription?next=${encodeURIComponent(requestTarget)}`;

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean panel-hero-surface">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Categories" : "Categories"}
          title={locale === "en-CA"
            ? "Browse the service families people actually use"
            : "Parcourez les familles de services que les gens utilisent vraiment"}
          body={locale === "en-CA"
            ? "The goal is to help visitors orient themselves quickly: what type of need, which service family and where the mission will happen."
            : "L'objectif est d'aider le visiteur a s'orienter vite : quel type de besoin, quelle famille de services et dans quel contexte local."}
          aside={<button className="primary-button" onClick={() => navigate(`/${locale}/services`)} type="button">{locale === "en-CA" ? "See all services" : "Voir tous les services"}</button>}
        />
        <div className="hero-panel">
          <article className="metric-card metric-card-action">
            <span>{locale === "en-CA" ? "Categories" : "Categories"}</span>
            <strong>{categories.length}</strong>
            <small>{locale === "en-CA" ? "high-level service families" : "familles de services visibles"}</small>
          </article>
          <article className="metric-card metric-card-trust">
            <span>{locale === "en-CA" ? "Services" : "Services"}</span>
            <strong>{services.length}</strong>
            <small>{locale === "en-CA" ? "concrete entry points for clients" : "points d'entree concrets pour les clients"}</small>
          </article>
        </div>
      </section>

      <section className="category-feature-grid">
        {categories.map((category) => {
          const relatedServices = services.filter((service) => service.category_id === category.id);

          return (
            <article className="category-feature-card category-feature-card-plain" key={category.id}>
              <div className="category-feature-copy">
                <span className="category-icon-box">
                  <CategoryIcon icon={category.icon} size={22} />
                </span>
                <div className="service-card-header">
                  <strong>{category.marketing_title || category.name}</strong>
                  <span className="status-chip status-chip-success">{relatedServices.length} {locale === "en-CA" ? "services" : "services"}</span>
                </div>
                <p>{category.marketing_subtitle || category.description || (locale === "en-CA" ? "Local services organized around real customer needs." : "Des services locaux organises autour de vrais besoins clients.")}</p>
                <div className="chip-row">
                  {relatedServices.slice(0, 4).map((item) => (
                    <span className="status-chip" key={item.id}>{item.marketing_title || item.name}</span>
                  ))}
                </div>
                <button className="text-link-button" onClick={() => navigate(`/${locale}/services`)} type="button">
                  {locale === "en-CA" ? "Explore this category" : "Explorer cette categorie"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Popular entry points" : "Entrees populaires"}
          title={locale === "en-CA"
            ? "Show services that make the request feel easier to start"
            : "Mettre en avant des services qui rendent la demande plus simple a lancer"}
        />
        <div className="subcategory-visual-grid">
          {services.slice(0, 9).map((service) => {
            const relatedCategory = categories.find((category) => category.id === service.category_id);

            return (
              <article className="subcategory-card subcategory-card-plain" key={service.id}>
                <div className="subcategory-card-copy">
                  <div className="service-card-header-icon">
                    <span className="category-icon-box category-icon-box-sm">
                      <CategoryIcon icon={relatedCategory?.icon} size={17} />
                    </span>
                    <strong>{service.marketing_title || service.name}</strong>
                  </div>
                  <p>{service.description || (locale === "en-CA" ? "A practical entry point designed to make provider comparison easier." : "Une entree pratique pensee pour simplifier la comparaison des prestataires.")}</p>
                  <div className="chip-row">
                    <span className="status-chip status-chip-muted">{relatedCategory?.name || (locale === "en-CA" ? "Service category" : "Categorie de service")}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Coverage" : "Couverture"}
          title={locale === "en-CA" ? "Local categories work better when city coverage is visible" : "Les categories locales convertissent mieux quand la couverture ville est visible"}
        />
        <div className="spotlight-text-grid">
          {featuredCities.map((city) => (
            <article className="city-spotlight" key={city.zoneId ?? city.city}>
              <div>
                <strong>{city.city}</strong>
                <span>{city.neighborhood}</span>
                <p className="section-copy">{city.promise}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean final-cta-panel">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Next step" : "Suite"}
          title={locale === "en-CA" ? "Found the right category? Turn it into a qualified request." : "Vous avez trouve la bonne categorie ? Transformez-la en demande qualifiee."}
        />
        <div className="cta-row">
          <button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">{locale === "en-CA" ? "Post a request" : "Publier une demande"}</button>
          <button className="secondary-button" onClick={() => navigate(`/${locale}/services`)} type="button">{locale === "en-CA" ? "Browse all services" : "Parcourir tous les services"}</button>
        </div>
      </section>
    </section>
  );
}
