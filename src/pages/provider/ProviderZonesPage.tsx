import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { addProviderZone, getProviderZones, removeProviderZone } from "../../lib/api";
import { EmptyState, SectionIntro } from "../shared/Shared";

type ProviderZone = {
  id: string;
  provider_profile_id: string;
  zone_id: string;
  zone_name: string;
  coverage_type: string;
  created_at: string;
};

export function ProviderZonesPage() {
  const navigate = useNavigate();
  const { locale, session, zones, providerProfile } = useApp();
  const [providerZones, setProviderZones] = useState<ProviderZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await getProviderZones(session, locale);
      setProviderZones(data ?? []);
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

  const linkedZoneIds = new Set(providerZones.map((pz) => pz.zone_id));

  const cityZones = zones.filter((z) => z.type === "city");
  const filteredZones = search
    ? cityZones.filter((z) => z.name.toLowerCase().includes(search.toLowerCase()))
    : cityZones;
  const availableZones = filteredZones.filter((z) => !linkedZoneIds.has(z.id));

  async function handleAdd(zoneId: string) {
    if (!session) return;
    setAddingId(zoneId);
    setError("");
    try {
      await addProviderZone(session, locale, zoneId);
      await load();
    } catch (err: any) {
      setError(err?.message ?? (locale === "en-CA" ? "Failed to add zone." : "Erreur lors de l'ajout de la zone."));
    } finally {
      setAddingId(null);
    }
  }

  async function handleRemove(providerZoneId: string) {
    if (!session) return;
    setRemovingId(providerZoneId);
    setError("");
    try {
      await removeProviderZone(session, locale, providerZoneId);
      setProviderZones((prev) => prev.filter((pz) => pz.id !== providerZoneId));
    } catch (err: any) {
      setError(err?.message ?? (locale === "en-CA" ? "Failed to remove zone." : "Erreur lors de la suppression de la zone."));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="stack stack-xl">

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Provider profile" : "Profil prestataire"}
          title={locale === "en-CA" ? "Your coverage zones" : "Vos zones d'intervention"}
          body={
            locale === "en-CA"
              ? "Define the cities where you can take on work. Only requests in your zones will match your profile."
              : "Définissez les villes où vous pouvez intervenir. Seules les demandes dans vos zones correspondront à votre profil."
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
          <span className={providerZones.length > 0 ? "status-chip status-chip-success" : "status-chip"}>
            {providerZones.length > 0
              ? locale === "en-CA"
                ? `${providerZones.length} zone${providerZones.length > 1 ? "s" : ""} active`
                : `${providerZones.length} zone${providerZones.length > 1 ? "s" : ""} active${providerZones.length > 1 ? "s" : ""}`
              : locale === "en-CA" ? "No zones linked" : "Aucune zone liée"}
          </span>
          {providerZones.length === 0 && (
            <span className="status-chip status-chip-brand">
              {locale === "en-CA" ? "Required to receive requests" : "Requis pour recevoir des demandes"}
            </span>
          )}
        </div>
      </section>

      {error && <p className="notice notice-error">{error}</p>}

      {providerZones.length === 0 && !loading && (
        <div className="assistant-card assistant-card-action">
          <div className="assistant-card-head">
            <div>
              <strong>{locale === "en-CA" ? "Add at least one zone" : "Ajoutez au moins une zone"}</strong>
              <p>
                {locale === "en-CA"
                  ? "Without a coverage zone, you will not receive any matching requests from clients."
                  : "Sans zone d'intervention, vous ne recevrez aucune demande correspondante des clients."}
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
          {providerZones.length > 0 && (
            <section className="panel panel-clean">
              <p className="eyebrow">{locale === "en-CA" ? "Active zones" : "Zones actives"}</p>
              <div className="wizard-choice-grid">
                {providerZones.map((pz) => {
                  const isRemoving = removingId === pz.id;
                  return (
                    <div className="wizard-choice-card wizard-choice-card-active" key={pz.id}>
                      <strong>{pz.zone_name}</strong>
                      <span className="status-chip">{pz.coverage_type}</span>
                      <button
                        className="ghost-button"
                        disabled={isRemoving}
                        onClick={() => handleRemove(pz.id)}
                        type="button"
                      >
                        {isRemoving ? "…" : locale === "en-CA" ? "Remove" : "Retirer"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="panel panel-clean">
            <div className="wizard-heading">
              <strong>{locale === "en-CA" ? "Add a zone" : "Ajouter une zone"}</strong>
              <p>
                {locale === "en-CA"
                  ? "Search and select the cities where you want to receive client requests."
                  : "Recherchez et sélectionnez les villes où vous souhaitez recevoir des demandes clients."}
              </p>
            </div>

            <label className="search-field">
              <span>{locale === "en-CA" ? "Search city" : "Rechercher une ville"}</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder={locale === "en-CA" ? "Montreal, Quebec..." : "Montreal, Quebec..."}
                value={search}
              />
            </label>

            {availableZones.length === 0 && (
              <p className="notice" style={{ marginTop: "1rem" }}>
                {search
                  ? locale === "en-CA"
                    ? "No zone found for this search."
                    : "Aucune zone trouvée pour cette recherche."
                  : locale === "en-CA"
                    ? "All available zones are already linked."
                    : "Toutes les zones disponibles sont déjà liées."}
              </p>
            )}

            {availableZones.length > 0 && (
              <div className="wizard-choice-grid" style={{ marginTop: "1rem" }}>
                {availableZones.slice(0, 20).map((zone) => {
                  const isAdding = addingId === zone.id;
                  return (
                    <button
                      className="wizard-choice-card"
                      disabled={isAdding}
                      key={zone.id}
                      onClick={() => handleAdd(zone.id)}
                      type="button"
                    >
                      <strong>{zone.name}</strong>
                      <span>
                        {isAdding
                          ? "…"
                          : zone.marketing_blurb || (locale === "en-CA" ? "Add this zone" : "Ajouter cette zone")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <section className="panel panel-clean">
        <p className="eyebrow">{locale === "en-CA" ? "Tips" : "Conseils"}</p>
        <ul className="feature-list">
          <li>
            {locale === "en-CA"
              ? "Add the cities where you can physically travel to work."
              : "Ajoutez les villes où vous pouvez vous déplacer pour intervenir."}
          </li>
          <li>
            {locale === "en-CA"
              ? "More zones means more matching requests — but only add zones you can actually serve."
              : "Plus de zones signifie plus de demandes — mais n'ajoutez que les zones que vous pouvez réellement couvrir."}
          </li>
          <li>
            {locale === "en-CA"
              ? "At least one active zone is required to receive requests."
              : "Au moins une zone active est requise pour recevoir des demandes."}
          </li>
        </ul>
      </section>

    </section>
  );
}
