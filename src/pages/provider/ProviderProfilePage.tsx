import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { addProviderZone, createPortfolioItem, deletePortfolioItem, getPortfolio, getProviderZones, removeProviderZone } from "../../lib/api";
import { Avatar, AvatarPicker, PROVIDER_AVATAR_PRESETS } from "../../components/Avatar";
import type { PortfolioItem } from "../../types";
import { ActionAssistant, EmptyState, SectionIntro, StatCard } from "../shared/Shared";

type ProviderZone = {
  id: string;
  zone_id: string;
  zone_name: string;
  coverage_type: string;
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ProviderProfilePage() {
  const navigate = useNavigate();
  const { locale, session, zones, providerProfile, saveProviderProfile, matches } = useApp();
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Zones state ───────────────────────────────────────────────────────────────
  const [providerZones, setProviderZones] = useState<ProviderZone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [zoneSearch, setZoneSearch] = useState("");
  const [addingZoneId, setAddingZoneId] = useState<string | null>(null);
  const [removingZoneId, setRemovingZoneId] = useState<string | null>(null);
  const [zoneError, setZoneError] = useState("");

  // ── Portfolio state ───────────────────────────────────────────────────────────
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDesc, setPortfolioDesc] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioAdding, setPortfolioAdding] = useState(false);
  const [portfolioFormOpen, setPortfolioFormOpen] = useState(false);
  const [portfolioDeletingId, setPortfolioDeletingId] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState("");

  const loadZones = useCallback(async () => {
    if (!session) return;
    try {
      const data = await getProviderZones(session, locale);
      setProviderZones(data ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingZones(false);
    }
  }, [session, locale]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  useEffect(() => {
    if (!session) return;
    getPortfolio(session, locale as any).then(setPortfolio).catch(() => {});
  }, [session, locale]);

  useEffect(() => {
    if (!providerProfile) return;
    setDisplayName(providerProfile.display_name || "");
    setBusinessName(providerProfile.business_name || "");
    setDescription(providerProfile.description || "");
    setLogoUrl(providerProfile.logo_url || "");
    setCoverUrl(providerProfile.cover_url || "");
  }, [providerProfile]);

  async function handleAddZone(zoneId: string) {
    if (!session) return;
    setAddingZoneId(zoneId);
    setZoneError("");
    try {
      await addProviderZone(session, locale, zoneId);
      await loadZones();
    } catch (err: any) {
      setZoneError(err?.message ?? (locale === "en-CA" ? "Failed to add zone." : "Erreur lors de l'ajout."));
    } finally {
      setAddingZoneId(null);
    }
  }

  async function handleRemoveZone(providerZoneId: string) {
    if (!session) return;
    setRemovingZoneId(providerZoneId);
    setZoneError("");
    try {
      await removeProviderZone(session, locale, providerZoneId);
      setProviderZones((prev) => prev.filter((pz) => pz.id !== providerZoneId));
    } catch (err: any) {
      setZoneError(err?.message ?? (locale === "en-CA" ? "Failed to remove zone." : "Erreur lors de la suppression."));
    } finally {
      setRemovingZoneId(null);
    }
  }

  async function handleAddPortfolioItem() {
    if (!session || !portfolioTitle.trim()) return;
    setPortfolioAdding(true);
    setPortfolioError("");
    try {
      const item = await createPortfolioItem(session, locale as any, {
        title: portfolioTitle.trim(),
        description: portfolioDesc.trim() || null,
        image_url: portfolioUrl.trim() || null,
        sort_order: portfolio.length,
      });
      setPortfolio((prev) => [...prev, item]);
      setPortfolioTitle("");
      setPortfolioDesc("");
      setPortfolioUrl("");
      setPortfolioFormOpen(false);
    } catch (err: any) {
      setPortfolioError(err?.message ?? (locale === "en-CA" ? "Failed to add item." : "Erreur lors de l'ajout."));
    } finally {
      setPortfolioAdding(false);
    }
  }

  async function handleDeletePortfolioItem(id: string) {
    if (!session) return;
    if (!window.confirm(locale === "en-CA" ? "Delete this item?" : "Supprimer cette réalisation ?")) return;
    setPortfolioDeletingId(id);
    try {
      await deletePortfolioItem(session, locale as any, id);
      setPortfolio((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setPortfolioError(err?.message ?? (locale === "en-CA" ? "Failed to delete." : "Erreur lors de la suppression."));
    } finally {
      setPortfolioDeletingId(null);
    }
  }

  if (!providerProfile) {
    return <EmptyState title={locale === "en-CA" ? "No provider profile loaded." : "Aucun profil prestataire chargé."} />;
  }

  return (
    <section className="stack stack-xl">

      {/* ── Header stats ── */}
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Public profile" : "Profil public"}
          title={locale === "en-CA" ? "Your provider profile" : "Votre profil prestataire"}
          body={
            locale === "en-CA"
              ? "Manage your identity, availability and visibility. A complete profile improves trust before the first quote."
              : "Gérez votre identité, vos disponibilités et votre visibilité. Un profil complet renforce la confiance avant la première offre."
          }
          aside={
            <div className="button-group">
              <button className="secondary-button" onClick={() => navigate(`/${locale}/pro/reputation`)} type="button">
                {locale === "en-CA" ? "Reputation" : "Réputation"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                {locale === "en-CA" ? "Open leads" : "Voir les leads"}
              </button>
            </div>
          }
        />
        <div className="hero-panel">
          <StatCard label={locale === "en-CA" ? "Profile status" : "Statut profil"} value={providerProfile.provider_status} tone="trust" />
          <StatCard label={locale === "en-CA" ? "Verification" : "Vérification"} value={providerProfile.verification_status} tone="info" />
          <StatCard label={locale === "en-CA" ? "Average rating" : "Note moyenne"} value={String(providerProfile.rating_avg)} tone="support" />
          <StatCard label={locale === "en-CA" ? "Open leads" : "Leads ouverts"} value={String(matches.length)} tone="action" />
        </div>
      </section>

      {/* ── Profile assistant + public preview ── */}
      <section className="two-up">
        <ActionAssistant
          action={
            <div className="button-group">
              <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/activation`)} type="button">
                {locale === "en-CA" ? "Activation steps" : "Étapes d'activation"}
              </button>
              <button className="secondary-button" onClick={() => navigate(`/${locale}/recherche`)} type="button">
                {locale === "en-CA" ? "See public search" : "Voir la recherche publique"}
              </button>
            </div>
          }
          body={
            locale === "en-CA"
              ? "A stronger provider profile improves trust before the first quote. Keep identity, description and proof signals aligned with the services you want to win."
              : "Un profil prestataire plus fort améliore la confiance avant la première offre. Gardez identité, description et signaux de preuve alignés avec les services que vous voulez gagner."
          }
          icon="provider"
          items={[
            displayName
              ? (locale === "en-CA" ? "Display name ready" : "Nom affiché prêt")
              : (locale === "en-CA" ? "Add a display name" : "Ajouter un nom affiché"),
            description
              ? (locale === "en-CA" ? "Public description ready" : "Description publique prête")
              : (locale === "en-CA" ? "Add a public description" : "Ajouter une description publique"),
            logoUrl
              ? (locale === "en-CA" ? "Logo link configured" : "Lien logo configuré")
              : (locale === "en-CA" ? "Add a logo link" : "Ajouter un lien logo"),
          ]}
          title={locale === "en-CA" ? "Profile assistant" : "Assistant profil"}
          tone="action"
        />

        <article className="provider-public-card provider-public-card-plain">
          <div className="provider-public-body">
            <p className="eyebrow">{locale === "en-CA" ? "Public preview" : "Aperçu public"}</p>
            <div className="service-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <Avatar name={displayName || businessName || "?"} url={logoUrl} size={48} />
                <div>
                  <strong>{displayName || businessName || "-"}</strong>
                  <p>{businessName || "-"}</p>
                </div>
              </div>
              <span className="status-chip status-chip-success">{providerProfile.rating_avg}/5</span>
            </div>
            <p>
              {description || (locale === "en-CA"
                ? "Add a short public-facing description that sounds clear and credible."
                : "Ajoutez une description courte, claire et crédible pour le public.")}
            </p>
            <div className="chip-row">
              <span className="status-chip">{providerProfile.verification_status}</span>
              <span className="status-chip">{providerProfile.completed_missions_count} {locale === "en-CA" ? "missions" : "missions"}</span>
              {logoUrl ? <span className="status-chip status-chip-muted">{locale === "en-CA" ? "Logo linked" : "Logo lié"}</span> : null}
            </div>
          </div>
        </article>
      </section>

      {/* ── Edit form ── */}
      <section className="panel panel-clean">
        <form
          className="form-grid form-grid-pro"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSaving(true);
            try {
              await saveProviderProfile({
                display_name: displayName,
                business_name: businessName,
                description,
                logo_url: logoUrl,
                cover_url: coverUrl,
              });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <label className="field-wide">
            <span>{locale === "en-CA" ? "Display name" : "Nom affiché"}</span>
            <input onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
          </label>
          <label className="field-wide">
            <span>{locale === "en-CA" ? "Business name" : "Entreprise"}</span>
            <input onChange={(event) => setBusinessName(event.target.value)} value={businessName} />
          </label>
          <label className="field-wide">
            <span>{locale === "en-CA" ? "Public description" : "Description publique"}</span>
            <textarea onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>
          {/* Avatar actuel */}
          <div className="avatar-current">
            <Avatar name={displayName || businessName || "?"} url={logoUrl} size={64} />
            <div className="avatar-current-info">
              <strong>{displayName || businessName || (locale === "en-CA" ? "Your profile" : "Votre profil")}</strong>
              <span>{locale === "en-CA" ? "Click an avatar below to change it" : "Cliquez sur un avatar ci-dessous pour le changer"}</span>
            </div>
          </div>

          {/* Sélecteur d'avatars prestataire */}
          <AvatarPicker
            label={locale === "en-CA" ? "Choose a profile photo" : "Choisir une photo de profil"}
            onChange={setLogoUrl}
            presets={PROVIDER_AVATAR_PRESETS}
            value={logoUrl}
          />

          <label className="field-wide">
            <span>{locale === "en-CA" ? "Cover URL" : "URL de couverture"}</span>
            <input onChange={(event) => setCoverUrl(event.target.value)} value={coverUrl} />
          </label>
          <button className="primary-button field-wide" disabled={isSaving} type="submit">
            {isSaving
              ? (locale === "en-CA" ? "Saving..." : "Enregistrement...")
              : (locale === "en-CA" ? "Save profile" : "Sauvegarder le profil")}
          </button>
        </form>
      </section>

      {/* ── Zones d'intervention ── */}
      <section className="panel panel-clean">
        <div className="wizard-heading">
          <strong>{locale === "en-CA" ? "Coverage zones" : "Zones d'intervention"}</strong>
          <p>
            {locale === "en-CA"
              ? "Choose the cities where you can take on work. Only requests in your active zones will match your profile."
              : "Choisissez les villes où vous pouvez intervenir. Seules les demandes dans vos zones actives correspondront à votre profil."}
          </p>
        </div>

        {zoneError && <p className="notice notice-error">{zoneError}</p>}

        {loadingZones ? (
          <div className="skeleton-card">
            <div className="skeleton-line" style={{ width: "40%" }} />
            <div className="skeleton-line" style={{ width: "100%" }} />
          </div>
        ) : (
          <>
            {providerZones.length > 0 ? (
              <div className="wizard-choice-grid">
                {providerZones.map((pz) => (
                  <div className="wizard-choice-card wizard-choice-card-active" key={pz.id}>
                    <strong>{pz.zone_name}</strong>
                    <button
                      className="ghost-button"
                      disabled={removingZoneId === pz.id}
                      onClick={() => handleRemoveZone(pz.id)}
                      type="button"
                    >
                      {removingZoneId === pz.id ? "…" : locale === "en-CA" ? "Remove" : "Retirer"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="notice">
                {locale === "en-CA"
                  ? "No coverage zone yet. Add at least one city to start receiving requests."
                  : "Aucune zone d'intervention. Ajoutez au moins une ville pour recevoir des demandes."}
              </p>
            )}

            <div style={{ marginTop: "1.5rem" }}>
              <label className="search-field">
                <span>{locale === "en-CA" ? "Add a city" : "Ajouter une ville"}</span>
                <input
                  onChange={(e) => setZoneSearch(e.target.value)}
                  placeholder={locale === "en-CA" ? "Montreal, Quebec..." : "Montreal, Quebec..."}
                  value={zoneSearch}
                />
              </label>
              {(() => {
                const linkedIds = new Set(providerZones.map((pz) => pz.zone_id));
                const cityZones = zones.filter((z) => z.type === "city");
                const candidates = (zoneSearch
                  ? cityZones.filter((z) => z.name.toLowerCase().includes(zoneSearch.toLowerCase()))
                  : cityZones
                ).filter((z) => !linkedIds.has(z.id)).slice(0, 12);
                if (candidates.length === 0) return (
                  <p className="notice" style={{ marginTop: "0.75rem" }}>
                    {zoneSearch
                      ? (locale === "en-CA" ? "No city found." : "Aucune ville trouvée.")
                      : (locale === "en-CA" ? "All available cities are already linked." : "Toutes les villes disponibles sont déjà liées.")}
                  </p>
                );
                return (
                  <div className="wizard-choice-grid" style={{ marginTop: "0.75rem" }}>
                    {candidates.map((zone) => (
                      <button
                        className="wizard-choice-card"
                        disabled={addingZoneId === zone.id}
                        key={zone.id}
                        onClick={() => handleAddZone(zone.id)}
                        type="button"
                      >
                        <strong>{zone.name}</strong>
                        <span>
                          {addingZoneId === zone.id
                            ? "…"
                            : zone.marketing_blurb || (locale === "en-CA" ? "Click to add" : "Cliquer pour ajouter")}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </section>

      {/* ── Portfolio ── */}
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Portfolio" : "Réalisations"}
          title={locale === "en-CA" ? "Showcase your past work" : "Mettez en valeur vos réalisations"}
          body={locale === "en-CA"
            ? "Add photos or descriptions of completed projects. Clients use these to choose their provider."
            : "Ajoutez des photos ou descriptions de projets réalisés. Les clients s'en servent pour choisir leur prestataire."}
          aside={
            <button className="primary-button compact-button" onClick={() => setPortfolioFormOpen((v) => !v)} type="button">
              {portfolioFormOpen
                ? (locale === "en-CA" ? "Cancel" : "Annuler")
                : (locale === "en-CA" ? "+ Add" : "+ Ajouter")}
            </button>
          }
        />

        {portfolioFormOpen && (
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label className="field-label">
              <span>{locale === "en-CA" ? "Title *" : "Titre *"}</span>
              <input
                className="text-input"
                onChange={(e) => setPortfolioTitle(e.target.value)}
                placeholder={locale === "en-CA" ? "e.g. Bathroom renovation — Montreal" : "ex. Rénovation salle de bain — Montréal"}
                value={portfolioTitle}
              />
            </label>
            <label className="field-label">
              <span>{locale === "en-CA" ? "Description" : "Description"}</span>
              <textarea
                className="text-input"
                onChange={(e) => setPortfolioDesc(e.target.value)}
                placeholder={locale === "en-CA" ? "Brief description of the project…" : "Brève description du projet…"}
                rows={2}
                style={{ resize: "vertical" }}
                value={portfolioDesc}
              />
            </label>
            <label className="field-label">
              <span>{locale === "en-CA" ? "Image URL (optional)" : "URL de l'image (optionnel)"}</span>
              <input
                className="text-input"
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
                type="url"
                value={portfolioUrl}
              />
            </label>
            {portfolioError && <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: 0 }}>{portfolioError}</p>}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="ghost-button compact-button" onClick={() => setPortfolioFormOpen(false)} type="button">
                {locale === "en-CA" ? "Cancel" : "Annuler"}
              </button>
              <button
                className="primary-button compact-button"
                disabled={portfolioAdding || !portfolioTitle.trim()}
                onClick={() => void handleAddPortfolioItem()}
                type="button"
              >
                {portfolioAdding ? "…" : (locale === "en-CA" ? "Save" : "Enregistrer")}
              </button>
            </div>
          </div>
        )}

        {portfolio.length === 0 ? (
          <div className="empty-state empty-state-soft">
            <strong>{locale === "en-CA" ? "No portfolio item yet." : "Aucune réalisation ajoutée."}</strong>
            <p>{locale === "en-CA" ? "Add your first project to build client trust." : "Ajoutez votre premier projet pour renforcer la confiance des clients."}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.875rem" }}>
            {portfolio.map((item) => (
              <article
                key={item.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  background: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {item.image_url && (
                  <div style={{ height: 160, overflow: "hidden", background: "var(--surface-alt)" }}>
                    <img
                      alt={item.title}
                      src={item.image_url}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
                <div style={{ padding: "0.875rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{item.title}</strong>
                  {item.description && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>{item.description}</p>
                  )}
                  <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
                    <button
                      className="ghost-button compact-button"
                      disabled={portfolioDeletingId === item.id}
                      onClick={() => void handleDeletePortfolioItem(item.id)}
                      style={{ color: "#dc2626", borderColor: "#fca5a5", fontSize: "0.78rem" }}
                      type="button"
                    >
                      {portfolioDeletingId === item.id ? "…" : (locale === "en-CA" ? "Delete" : "Supprimer")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Availability shortcut ── */}
      <div className="assistant-card assistant-card-info">
        <div className="assistant-card-head">
          <span className="assistant-icon">⏰</span>
          <div>
            <strong>{locale === "en-CA" ? "Manage your availability" : "Gérer vos disponibilités"}</strong>
            <p>{locale === "en-CA"
              ? "Define your weekly schedule so clients know when you're available. Required to respond to requests."
              : "Définissez vos horaires hebdomadaires pour que les clients sachent quand vous êtes disponible. Requis pour répondre aux demandes."}
            </p>
          </div>
        </div>
        <div className="button-group">
          <button className="primary-button" onClick={() => navigate(`/${locale}/pro/disponibilites`)} type="button">
            {locale === "en-CA" ? "Set availability" : "Définir mes disponibilités"}
          </button>
        </div>
      </div>
    </section>
  );
}
