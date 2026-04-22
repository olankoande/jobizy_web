import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { CategoryIcon } from "../../app/CategoryIcon";
import { getMatchingRequests } from "../../lib/api";
import type { MatchingRequest } from "../../types";
import { EmptyState, SectionIntro, StatCard } from "../shared/Shared";
import { Modal } from "../../components/Modal";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "short" }).format(new Date(value));
}

type QuoteForm = {
  message: string;
  estimated_price: string;
  proposed_date: string;
  delay_days: string;
};

function emptyForm(): QuoteForm {
  return { message: "", estimated_price: "", proposed_date: "", delay_days: "" };
}

export function ProviderRequestsPage() {
  const navigate = useNavigate();
  const { locale, session, providerProfile, subscriptions, submitProviderQuote } = useApp();
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("open");
  const [error, setError] = useState("");

  const [quotingId, setQuotingId] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState<QuoteForm>(emptyForm());
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const data = await getMatchingRequests(session, locale);
      setRequests(data ?? []);
    } catch (err: any) {
      setError(err?.message ?? (locale === "en-CA" ? "Failed to load opportunities." : "Impossible de charger les opportunites."));
    } finally {
      setLoading(false);
    }
  }, [session, locale]);

  useEffect(() => { load(); }, [load]);

  const visibleRequests = useMemo(
    () =>
      requests.filter((req) => {
        const urgencyOk = urgencyFilter === "all" || req.urgency === urgencyFilter;
        const responseOk =
          responseFilter === "all" ||
          (responseFilter === "open" ? !req.already_quoted : req.already_quoted);
        return urgencyOk && responseOk;
      }),
    [requests, urgencyFilter, responseFilter],
  );

  const openCount = useMemo(() => requests.filter((r) => !r.already_quoted).length, [requests]);
  const answeredCount = useMemo(() => requests.filter((r) => r.already_quoted).length, [requests]);
  const currentPlan = subscriptions[0]?.plan_name ?? subscriptions[0]?.plan_code ?? (locale === "en-CA" ? "Free" : "Gratuit");

  function formatBudget(req: MatchingRequest) {
    if (req.budget_min_cents == null && req.budget_max_cents == null) {
      return locale === "en-CA" ? "To discuss" : "A discuter";
    }
    const fmt = (v: number) => new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(v / 100);
    if (req.budget_min_cents != null && req.budget_max_cents != null) {
      return `${fmt(req.budget_min_cents)} – ${fmt(req.budget_max_cents)}`;
    }
    return fmt((req.budget_min_cents ?? req.budget_max_cents)!);
  }

  function openQuoteForm(reqId: string) {
    setQuotingId(reqId);
    setQuoteForm(emptyForm());
    setQuoteError("");
  }

  function closeQuoteForm() {
    setQuotingId(null);
    setQuoteForm(emptyForm());
    setQuoteError("");
  }


  async function handleSubmitQuote(requestId: string) {
    if (!quoteForm.message.trim()) {
      setQuoteError(locale === "en-CA" ? "A message is required." : "Un message est requis.");
      return;
    }
    setQuoteSubmitting(true);
    setQuoteError("");
    try {
      await submitProviderQuote(requestId, {
        message: quoteForm.message.trim(),
        estimated_price_cents: quoteForm.estimated_price ? Math.round(Number(quoteForm.estimated_price) * 100) : null,
        proposed_date: quoteForm.proposed_date || null,
        delay_days: quoteForm.delay_days ? Number(quoteForm.delay_days) : null,
      });
      closeQuoteForm();
      await load();
    } catch (err: any) {
      setQuoteError(err?.message ?? (locale === "en-CA" ? "Failed to send offer." : "Impossible d'envoyer l'offre."));
    } finally {
      setQuoteSubmitting(false);
    }
  }

  if (!providerProfile) {
    return (
      <EmptyState
        title={locale === "en-CA" ? "Provider profile not found." : "Profil prestataire introuvable."}
        body={locale === "en-CA" ? "Activate your provider profile to see opportunities." : "Activez votre profil prestataire pour voir les opportunites."}
      />
    );
  }

  const activeRequest = quotingId ? visibleRequests.find((r) => r.id === quotingId) ?? requests.find((r) => r.id === quotingId) : null;

  return (
    <section className="stack stack-xl">

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Matching opportunities" : "Opportunites correspondantes"}
          title={locale === "en-CA" ? "Opportunities matching your profile" : "Opportunites qui correspondent a votre profil"}
          body={
            locale === "en-CA"
              ? "These requests match the services you offer, your coverage zones and your availability."
              : "Ces demandes correspondent aux services que vous proposez, vos zones d'intervention et vos disponibilites."
          }
          aside={
            <div className="button-group">
              <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/services`)} type="button">
                {locale === "en-CA" ? "My services" : "Mes services"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/abonnement`)} type="button">
                {locale === "en-CA" ? "Upgrade plan" : "Voir les plans"}
              </button>
            </div>
          }
        />
        <div className="hero-panel">
          <StatCard label={locale === "en-CA" ? "Open opportunities" : "Opportunites ouvertes"} tone="action" value={String(openCount)} />
          <StatCard label={locale === "en-CA" ? "Already quoted" : "Deja repondues"} tone="info" value={String(answeredCount)} />
          <StatCard label={locale === "en-CA" ? "Total matching" : "Total correspondant"} tone="trust" value={String(requests.length)} />
          <StatCard label={locale === "en-CA" ? "Current plan" : "Plan actuel"} tone="support" value={currentPlan} />
        </div>
      </section>

      {error && <p className="notice notice-error">{error}</p>}

      {providerProfile.provider_status !== "active" && (
        <div className="assistant-card assistant-card-action">
          <div className="assistant-card-head">
            <div>
              <strong>
                {locale === "en-CA" ? "Your profile is not yet active" : "Votre profil n'est pas encore actif"}
              </strong>
              <p>
                {locale === "en-CA"
                  ? "Complete your profile activation to start receiving matching opportunities."
                  : "Completez l'activation de votre profil pour commencer a recevoir des opportunites."}
              </p>
            </div>
          </div>
          <button className="primary-button" onClick={() => navigate(`/${locale}/pro/activation`)} type="button">
            {locale === "en-CA" ? "Complete activation" : "Completer l'activation"}
          </button>
        </div>
      )}

      <section className="panel panel-clean">
        <div className="catalog-toolbar">
          <label className="search-field">
            <span>{locale === "en-CA" ? "Urgency" : "Urgence"}</span>
            <select onChange={(event) => setUrgencyFilter(event.target.value)} value={urgencyFilter}>
              <option value="all">{locale === "en-CA" ? "All" : "Toutes"}</option>
              <option value="low">{locale === "en-CA" ? "Flexible" : "Flexible"}</option>
              <option value="standard">{locale === "en-CA" ? "Standard" : "Standard"}</option>
              <option value="high">{locale === "en-CA" ? "Urgent" : "Urgent"}</option>
            </select>
          </label>
          <label className="search-field">
            <span>{locale === "en-CA" ? "Status" : "Statut"}</span>
            <select onChange={(event) => setResponseFilter(event.target.value)} value={responseFilter}>
              <option value="open">{locale === "en-CA" ? "Not yet answered" : "Sans reponse"}</option>
              <option value="answered">{locale === "en-CA" ? "Already quoted" : "Deja repondues"}</option>
              <option value="all">{locale === "en-CA" ? "All" : "Toutes"}</option>
            </select>
          </label>
          <button className="ghost-button" onClick={load} type="button">
            {locale === "en-CA" ? "Refresh" : "Actualiser"}
          </button>
        </div>

        {loading ? (
          <div className="skeleton-card">
            <div className="skeleton-line" style={{ width: "40%" }} />
            <div className="skeleton-line" style={{ width: "100%" }} />
            <div className="skeleton-line" style={{ width: "70%" }} />
          </div>
        ) : visibleRequests.length === 0 ? (
          <EmptyState
            title={
              requests.length === 0
                ? (locale === "en-CA" ? "No matching opportunities yet." : "Aucune opportunite correspondante pour le moment.")
                : (locale === "en-CA" ? "No results for these filters." : "Aucun resultat pour ces filtres.")
            }
            body={
              requests.length === 0
                ? (locale === "en-CA"
                    ? "Make sure you have active services, coverage zones and availability set."
                    : "Assurez-vous d'avoir des services actifs, des zones de couverture et des disponibilites configures.")
                : undefined
            }
          />
        ) : (
          <div className="provider-request-grid">
            {visibleRequests.map((req) => (
              <article key={req.id} className="provider-request-card">
                  <div className="service-card-header">
                    <div>
                      <strong>{req.title || (locale === "en-CA" ? "Local opportunity" : "Opportunite locale")}</strong>
                      <p>{req.description?.slice(0, 120) ?? "-"}</p>
                    </div>
                    <span className={req.already_quoted ? "status-chip" : "status-chip status-chip-success"}>
                      {req.already_quoted
                        ? (locale === "en-CA" ? "Quoted" : "Repondue")
                        : req.urgency}
                    </span>
                  </div>

                  <div className="request-card-details">
                    <span className="service-inline-chip">
                      <CategoryIcon icon={req.category_icon} size={13} />
                      {req.service_name}
                    </span>
                    <span>{req.zone_name}</span>
                    <span>{formatDate(req.desired_date)}</span>
                    <span>{formatBudget(req)}</span>
                  </div>

                  <div className="cta-row">
                    {req.already_quoted ? (
                      <button
                        className="secondary-button"
                        onClick={() => navigate(`/${locale}/pro/reponses`)}
                        type="button"
                      >
                        {locale === "en-CA" ? "View my offer" : "Voir mon offre"}
                      </button>
                    ) : (
                      <button
                        className={quotingId === req.id ? "ghost-button" : "primary-button"}
                        onClick={() => quotingId === req.id ? closeQuoteForm() : openQuoteForm(req.id)}
                        type="button"
                      >
                        {quotingId === req.id
                          ? (locale === "en-CA" ? "Cancel" : "Annuler")
                          : (locale === "en-CA" ? "Send an offer" : "Envoyer une offre")}
                      </button>
                    )}
                    <button
                      className="ghost-button"
                      onClick={() => navigate(`/${locale}/pro/messages?request_id=${req.id}`)}
                      type="button"
                    >
                      {locale === "en-CA" ? "Messages" : "Messages"}
                    </button>
                  </div>
              </article>
            ))}
          </div>
        )}

        {quotingId && activeRequest && (
          <Modal onClose={closeQuoteForm}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <p className="eyebrow" style={{ margin: "0 0 0.2rem" }}>
                  {locale === "en-CA" ? "Send an offer" : "Envoyer une offre"}
                </p>
                <h3 style={{ margin: 0 }}>{activeRequest.title}</h3>
                <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {activeRequest.service_name} · {activeRequest.zone_name} · {formatDate(activeRequest.desired_date)}
                </p>
              </div>
              <button className="ghost-button compact-button" onClick={closeQuoteForm} type="button" style={{ flexShrink: 0 }}>
                {locale === "en-CA" ? "Close" : "Fermer"}
              </button>
            </div>

            <form
              className="stack-form"
              onSubmit={(e) => { e.preventDefault(); void handleSubmitQuote(quotingId); }}
            >
              <div className="edit-form-grid">
                <label className="field field-wide">
                  <span>{locale === "en-CA" ? "Your message to the client *" : "Votre message au client *"}</span>
                  <textarea
                    minLength={5}
                    placeholder={
                      locale === "en-CA"
                        ? "Introduce yourself, describe your approach, mention your experience..."
                        : "Presentez-vous, decrivez votre approche, mentionnez votre experience..."
                    }
                    required
                    rows={4}
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, message: e.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>{locale === "en-CA" ? "Estimated price (CAD, optional)" : "Prix estime (CAD, optionnel)"}</span>
                  <input
                    inputMode="decimal"
                    min="0"
                    placeholder="150"
                    type="number"
                    value={quoteForm.estimated_price}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, estimated_price: e.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>{locale === "en-CA" ? "Proposed date (optional)" : "Date proposee (optionnel)"}</span>
                  <input
                    type="date"
                    value={quoteForm.proposed_date}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, proposed_date: e.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>{locale === "en-CA" ? "Estimated delay (days, optional)" : "Delai estime (jours, optionnel)"}</span>
                  <input
                    inputMode="numeric"
                    min="0"
                    placeholder="2"
                    type="number"
                    value={quoteForm.delay_days}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, delay_days: e.target.value }))}
                  />
                </label>
              </div>

              {quoteError && <p className="notice notice-error">{quoteError}</p>}

              <div className="button-group">
                <button className="ghost-button" onClick={closeQuoteForm} type="button">
                  {locale === "en-CA" ? "Cancel" : "Annuler"}
                </button>
                <button className="primary-button" disabled={quoteSubmitting} type="submit">
                  {quoteSubmitting
                    ? (locale === "en-CA" ? "Sending..." : "Envoi en cours...")
                    : (locale === "en-CA" ? "Send offer" : "Envoyer l'offre")}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </section>

      {requests.length === 0 && !loading && (
        <section className="panel panel-clean">
          <p className="eyebrow">{locale === "en-CA" ? "Tips to get more opportunities" : "Conseils pour obtenir plus d'opportunites"}</p>
          <ul className="feature-list">
            <li>
              {locale === "en-CA"
                ? "Add more services in your profile to broaden matching."
                : "Ajoutez plus de services dans votre profil pour elargir le matching."}
            </li>
            <li>
              {locale === "en-CA"
                ? "Add more coverage zones to appear in more local results."
                : "Ajoutez des zones de couverture supplementaires pour apparaitre dans plus de resultats locaux."}
            </li>
            <li>
              {locale === "en-CA"
                ? "Make sure you have active availability slots."
                : "Assurez-vous d'avoir des creneaux de disponibilite actifs."}
            </li>
          </ul>
          <div className="button-group">
            <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/services`)} type="button">
              {locale === "en-CA" ? "Manage services" : "Gerer les services"}
            </button>
            <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/disponibilites`)} type="button">
              {locale === "en-CA" ? "Manage availability" : "Gerer les disponibilites"}
            </button>
          </div>
        </section>
      )}

    </section>
  );
}
