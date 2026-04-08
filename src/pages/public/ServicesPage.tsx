import { useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { CategoryIcon } from "../../app/CategoryIcon";
import { t } from "../../content/i18n";
import { SectionIntro } from "../shared/Shared";

export function ServicesPage() {
  const { locale, categories, services, zones } = useApp();
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const safeServices = useMemo(() => services.filter((service): service is (typeof services)[number] => Boolean(service)), [services]);

  const cityZones = useMemo(() => zones.filter((zone) => zone.type === "city"), [zones]);
  const normalizedQuery = query.trim().toLowerCase();

  const visibleCategories = useMemo(
    () =>
      categories.filter((category) => {
        if (!normalizedQuery) return true;
        if (category.name.toLowerCase().includes(normalizedQuery)) return true;
        return safeServices.some((service) => service.category_id === category.id && service.name.toLowerCase().includes(normalizedQuery));
      }),
    [categories, normalizedQuery, safeServices],
  );

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean panel-hero-surface">
        <SectionIntro
          eyebrow={t(locale, "catalog")}
          title={locale === "en-CA" ? "Explore services in a clean, decision-friendly catalog" : "Explorez les services dans un catalogue clair et utile a la decision"}
          body={locale === "en-CA" ? "Use direct service language and category cues so visitors can browse confidently before posting a request." : "Utilisez un langage service direct et des reperes de categorie pour parcourir l'offre avant de publier une demande."}
        />
        <div className="catalog-toolbar">
          <label className="search-field">
            <span>{locale === "en-CA" ? "Search a service" : "Rechercher un service"}</span>
            <input onChange={(event) => setQuery(event.target.value)} placeholder={locale === "en-CA" ? "Plumbing, painting, tutoring..." : "Plomberie, peinture, tutorat..."} value={query} />
          </label>
          <label className="search-field">
            <span>{locale === "en-CA" ? "Suggested city" : "Ville suggeree"}</span>
            <select onChange={(event) => setZoneFilter(event.target.value)} value={zoneFilter}>
              <option value="">{locale === "en-CA" ? "All covered cities" : "Toutes les villes couvertes"}</option>
              {cityZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="service-grid service-grid-visual">
        {safeServices.slice(0, 6).map((service) => (
          <article className="service-tile service-tile-plain" key={service.id}>
            <div className="service-tile-copy">
              <strong>{service.marketing_title || service.name}</strong>
              <p>{service.description || t(locale, "adaptedServices")}</p>
              <span>{service.price_label || (zoneFilter ? cityZones.find((zone) => zone.id === zoneFilter)?.name ?? "" : locale === "en-CA" ? "Local coverage available" : "Couverture locale disponible")}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="stack stack-xl">
        {visibleCategories.map((category) => {
          const relatedServices = safeServices.filter((service) => service.category_id === category.id);

          return (
            <section className="catalog-section catalog-section-pro" key={category.id}>
              <div className="catalog-header-card catalog-header-card-plain">
                <div className="catalog-header-copy">
                  <span className="category-icon-box">
                    <CategoryIcon icon={category.icon} size={24} />
                  </span>
                  <p className="eyebrow">{locale === "en-CA" ? "Category" : "Categorie"}</p>
                  <strong>{category.marketing_title || category.name}</strong>
                  <p>{category.description || t(locale, "localQualifiedServices")}</p>
                  <div className="chip-row">
                    <span className="status-chip">{relatedServices.length} {locale === "en-CA" ? "services" : "services"}</span>
                    <span className="status-chip status-chip-success">{zoneFilter ? cityZones.find((zone) => zone.id === zoneFilter)?.name ?? "" : locale === "en-CA" ? "Local availability" : "Disponibilite locale"}</span>
                  </div>
                </div>
              </div>

              <div className="subcategory-visual-grid">
                {relatedServices
                  .filter((service) => !normalizedQuery || service.name.toLowerCase().includes(normalizedQuery))
                  .slice(0, 6)
                  .map((service) => {
                    return (
                      <article className="subcategory-card subcategory-card-plain" key={service.id}>
                        <div className="subcategory-card-copy">
                          <div className="service-card-header-icon">
                            <span className="category-icon-box category-icon-box-sm">
                              <CategoryIcon icon={category.icon} size={17} />
                            </span>
                            <div className="service-card-header" style={{ flex: 1, minWidth: 0 }}>
                              <strong>{service.marketing_title || service.name}</strong>
                              <span className="status-chip status-chip-muted">{locale === "en-CA" ? "Ready to quote" : "Pret a recevoir des offres"}</span>
                            </div>
                          </div>
                          <p>{service.description || t(locale, "adaptedServices")}</p>
                          <div className="chip-row">
                            <span className="status-chip">{service.price_label || t(locale, "adaptedServices")}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
