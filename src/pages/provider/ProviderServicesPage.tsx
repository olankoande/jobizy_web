import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { CategoryIcon } from "../../app/CategoryIcon";
import { addProviderService, getProviderServices, removeProviderService } from "../../lib/api";
import { EmptyState, SectionIntro } from "../shared/Shared";

type ProviderService = {
  id: string;
  provider_profile_id: string;
  service_id: string;
  service_name: string;
  status: string;
  created_at: string;
};

export function ProviderServicesPage() {
  const navigate = useNavigate();
  const { locale, session, services, categories, providerProfile } = useApp();
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await getProviderServices(session, locale);
      setProviderServices(data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session, locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (!providerProfile) {
    return <EmptyState title={locale === "en-CA" ? "No provider profile loaded." : "Aucun profil prestataire chargé."} />;
  }

  if (!session) return null;

  const linkedServiceIds = new Set(providerServices.map((ps) => ps.service_id));

  const servicesInCategory = selectedCategoryId
    ? services.filter((s) => s.category_id === selectedCategoryId && !linkedServiceIds.has(s.id))
    : [];

  async function handleAdd(serviceId: string) {
    if (!session) return;
    setAddingId(serviceId);
    setError("");
    try {
      await addProviderService(session, locale, serviceId);
      await load();
    } catch (err: any) {
      setError(err?.message ?? (locale === "en-CA" ? "Failed to add service." : "Erreur lors de l'ajout du service."));
    } finally {
      setAddingId(null);
    }
  }

  async function handleRemove(providerServiceId: string) {
    if (!session) return;
    setRemovingId(providerServiceId);
    setError("");
    try {
      await removeProviderService(session, locale, providerServiceId);
      setProviderServices((prev) => prev.filter((ps) => ps.id !== providerServiceId));
    } catch (err: any) {
      setError(err?.message ?? (locale === "en-CA" ? "Failed to remove service." : "Erreur lors de la suppression du service."));
    } finally {
      setRemovingId(null);
    }
  }

  // Categories that have at least one service available to add
  const categoriesWithAvailable = categories.filter((cat) =>
    services.some((s) => s.category_id === cat.id && !linkedServiceIds.has(s.id)),
  );

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <section className="stack stack-xl">

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Provider profile" : "Profil prestataire"}
          title={locale === "en-CA" ? "Your services" : "Vos services"}
          body={
            locale === "en-CA"
              ? "Manage the services you offer. Adding or removing a service updates your matching immediately."
              : "Gérez les services sur lesquels vous intervenez. Ajouter ou retirer un service met à jour votre matching immédiatement."
          }
          aside={
            <div className="button-group">
              <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/profil`)} type="button">
                {locale === "en-CA" ? "Back to profile" : "Retour au profil"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                {locale === "en-CA" ? "Open leads" : "Voir les leads"}
              </button>
            </div>
          }
        />

        <div className="chip-row">
          <span className={providerServices.length > 0 ? "status-chip status-chip-success" : "status-chip"}>
            {providerServices.length > 0
              ? locale === "en-CA"
                ? `${providerServices.length} service${providerServices.length > 1 ? "s" : ""} active`
                : `${providerServices.length} service${providerServices.length > 1 ? "s" : ""} actif${providerServices.length > 1 ? "s" : ""}`
              : locale === "en-CA" ? "No services linked" : "Aucun service lié"}
          </span>
          {providerServices.length === 0 && (
            <span className="status-chip status-chip-brand">
              {locale === "en-CA" ? "Required to receive requests" : "Requis pour recevoir des demandes"}
            </span>
          )}
        </div>
      </section>

      {error && <p className="notice notice-error">{error}</p>}

      {providerServices.length === 0 && !loading && (
        <div className="assistant-card assistant-card-action">
          <div className="assistant-card-head">
            <div>
              <strong>{locale === "en-CA" ? "Add at least one service" : "Ajoutez au moins un service"}</strong>
              <p>
                {locale === "en-CA"
                  ? "Without a service, you will not receive any matching requests from clients."
                  : "Sans service, vous ne recevrez aucune demande correspondante des clients."}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="panel panel-clean">
          <div className="skeleton-card">
            <div className="skeleton-line" style={{ width: "30%" }} />
            <div className="skeleton-line" style={{ width: "100%" }} />
            <div className="skeleton-line" style={{ width: "60%" }} />
          </div>
        </div>
      ) : (
        <>
          {/* Active services */}
          {providerServices.length > 0 && (
            <section className="panel panel-clean">
              <p className="eyebrow">{locale === "en-CA" ? "Active services" : "Services actifs"}</p>
              <div className="wizard-choice-grid">
                {providerServices.map((ps) => {
                  const isRemoving = removingId === ps.id;
                  return (
                    <div className="provider-service-card" key={ps.id}>
                      <strong>{ps.service_name}</strong>
                      <button
                        className="ghost-button"
                        disabled={isRemoving}
                        onClick={() => handleRemove(ps.id)}
                        type="button"
                      >
                        {isRemoving
                          ? "…"
                          : locale === "en-CA" ? "Remove" : "Retirer"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Add services — step 1: choose category */}
          {categoriesWithAvailable.length > 0 && (
            <section className="panel panel-clean">
              <div className="wizard-heading">
                <strong>{locale === "en-CA" ? "Add a service" : "Ajouter un service"}</strong>
                <p>
                  {locale === "en-CA"
                    ? "Select a category to see the available services."
                    : "Sélectionnez une catégorie pour voir les services disponibles."}
                </p>
              </div>

              <div className="wizard-choice-grid">
                {categoriesWithAvailable.map((cat) => (
                  <button
                    className={selectedCategoryId === cat.id ? "wizard-choice-card wizard-choice-card-active" : "wizard-choice-card"}
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                    type="button"
                  >
                    <CategoryIcon icon={cat.icon} size={28} />
                    <strong>{cat.name}</strong>
                    <span>{cat.marketing_title || cat.description || (locale === "en-CA" ? "Select to expand" : "Cliquer pour voir")}</span>
                  </button>
                ))}
              </div>

              {/* Step 2: services in selected category */}
              {selectedCategoryId && servicesInCategory.length > 0 && (
                <div className="stack" style={{ marginTop: "1rem" }}>
                  <p className="eyebrow">
                    {locale === "en-CA"
                      ? `Services in "${selectedCategory?.name}"`
                      : `Services dans "${selectedCategory?.name}"`}
                  </p>
                  <div className="wizard-choice-grid">
                    {servicesInCategory.map((service) => {
                      const isAdding = addingId === service.id;
                      return (
                        <button
                          className="wizard-choice-card"
                          disabled={isAdding}
                          key={service.id}
                          onClick={() => handleAdd(service.id)}
                          type="button"
                        >
                          <strong>{service.name}</strong>
                          <span>
                            {isAdding
                              ? "…"
                              : service.marketing_title || service.description || (locale === "en-CA" ? "Add" : "Ajouter")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedCategoryId && servicesInCategory.length === 0 && (
                <p className="notice" style={{ marginTop: "1rem" }}>
                  {locale === "en-CA"
                    ? "All services in this category are already linked."
                    : "Tous les services de cette catégorie sont déjà liés."}
                </p>
              )}
            </section>
          )}
        </>
      )}

      <section className="panel panel-clean">
        <p className="eyebrow">{locale === "en-CA" ? "Tips" : "Conseils"}</p>
        <ul className="feature-list">
          <li>
            {locale === "en-CA"
              ? "You can link as many services as you actually offer."
              : "Vous pouvez lier autant de services que vous proposez réellement."}
          </li>
          <li>
            {locale === "en-CA"
              ? "Removing a service stops new request matching for that service immediately."
              : "Retirer un service arrête immédiatement le matching de nouvelles demandes pour ce service."}
          </li>
          <li>
            {locale === "en-CA"
              ? "At least one active service is required to receive requests."
              : "Au moins un service actif est requis pour recevoir des demandes."}
          </li>
        </ul>
      </section>

    </section>
  );
}
