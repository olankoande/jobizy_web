import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { AppIcon } from "../../app/AppIcon";
import { getProviderQuotes, withdrawQuote } from "../../lib/api";
import type { ProviderQuote } from "../../types";
import { EmptyState, SectionIntro, StatCard } from "../shared/Shared";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

function formatMoney(cents?: number | null) {
  if (cents == null) return null;
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(cents / 100);
}

const QUOTE_STATUS: Record<string, { fr: string; en: string; tone: string }> = {
  sent:      { fr: "En attente",  en: "Pending",   tone: "status-chip-published" },
  accepted:  { fr: "Acceptée",    en: "Accepted",  tone: "status-chip-awarded" },
  rejected:  { fr: "Non retenue", en: "Declined",  tone: "status-chip-closed" },
  withdrawn: { fr: "Retirée",     en: "Withdrawn", tone: "status-chip-cancelled" },
};

const REQUEST_STATUS: Record<string, { fr: string; en: string; tone: string }> = {
  published:    { fr: "Publiée",       en: "Published",    tone: "status-chip-published" },
  in_discussion:{ fr: "En discussion", en: "In discussion",tone: "status-chip-discussion" },
  awarded:      { fr: "Attribuée",     en: "Awarded",      tone: "status-chip-awarded" },
  closed:       { fr: "Fermée",        en: "Closed",       tone: "status-chip-closed" },
  expired:      { fr: "Expirée",       en: "Expired",      tone: "status-chip-expired" },
  cancelled:    { fr: "Annulée",       en: "Cancelled",    tone: "status-chip-cancelled" },
};

export function ProviderQuotesPage() {
  const navigate = useNavigate();
  const { locale, session, subscriptions } = useApp();
  const [quotes, setQuotes] = useState<ProviderQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const data = await getProviderQuotes(session, locale);
      setQuotes(data ?? []);
    } catch (err: any) {
      setError(err?.message ?? (locale === "en-CA" ? "Failed to load quotes." : "Impossible de charger les offres."));
    } finally {
      setLoading(false);
    }
  }, [session, locale]);

  useEffect(() => { void load(); }, [load]);

  async function handleWithdraw(quoteId: string) {
    if (!session) return;
    if (!window.confirm(locale === "en-CA" ? "Withdraw this quote? This cannot be undone." : "Retirer cette offre ? Cette action est irréversible.")) return;
    setWithdrawingId(quoteId);
    try {
      const updated = await withdrawQuote(session, locale, quoteId);
      setQuotes((prev) => prev.map((q) => q.id === quoteId ? { ...q, status: updated.status ?? "withdrawn" } : q));
    } catch (err: any) {
      alert(err?.message ?? (locale === "en-CA" ? "Failed to withdraw." : "Retrait impossible."));
    } finally {
      setWithdrawingId(null);
    }
  }

  const total = quotes.length;
  const accepted = quotes.filter((q) => q.status === "accepted").length;
  const pending = quotes.filter((q) => q.status === "sent").length;
  const declined = quotes.filter((q) => q.status === "rejected" || q.status === "withdrawn").length;

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "My quotes" : "Mes offres"}
          title={locale === "en-CA" ? "All quotes you sent to clients" : "Toutes les offres envoyées aux clients"}
          aside={
            <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
              {locale === "en-CA" ? "Browse requests" : "Parcourir les demandes"}
            </button>
          }
        />
        <div className="hero-panel">
          <StatCard label={locale === "en-CA" ? "Quotes sent" : "Offres envoyées"} tone="action" value={String(total)} />
          <StatCard label={locale === "en-CA" ? "Accepted" : "Acceptées"} tone="trust" value={String(accepted)} />
          <StatCard label={locale === "en-CA" ? "Pending" : "En attente"} tone="info" value={String(pending)} />
          <StatCard label={locale === "en-CA" ? "Plan" : "Plan"} tone="support" value={subscriptions[0]?.plan_name ?? subscriptions[0]?.plan_code ?? (locale === "en-CA" ? "Free" : "Gratuit")} />
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Quote history" : "Historique des offres"}
          title={locale === "en-CA" ? "Sent quotes" : "Offres envoyées"}
        />

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{locale === "en-CA" ? "Loading…" : "Chargement…"}</p>
        ) : error ? (
          <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>
        ) : quotes.length === 0 ? (
          <EmptyState
            title={locale === "en-CA" ? "No quote sent yet." : "Aucune offre envoyée pour l'instant."}
            body={locale === "en-CA" ? "Browse matching requests and send your first quote." : "Parcourez les demandes correspondantes et envoyez votre première offre."}
          />
        ) : (
          <div className="stack">
            {quotes.map((quote) => {
              const quoteStatus = QUOTE_STATUS[quote.status] ?? { fr: quote.status, en: quote.status, tone: "" };
              const reqStatus = REQUEST_STATUS[quote.request_status] ?? { fr: quote.request_status, en: quote.request_status, tone: "" };
              const price = formatMoney(quote.estimated_price_cents);
              const canWithdraw = quote.status === "sent";

              return (
                <article className="provider-request-card" key={quote.id}>
                  {/* Title + status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <strong style={{ fontSize: "0.975rem", lineHeight: 1.3 }}>
                      {quote.request_title || quote.request_id}
                    </strong>
                    <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                      <span className={`status-chip ${quoteStatus.tone}`}>
                        {locale === "en-CA" ? quoteStatus.en : quoteStatus.fr}
                      </span>
                    </div>
                  </div>

                  {/* Request status + price */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem" }}>
                    <span className={`status-chip ${reqStatus.tone}`} style={{ fontSize: "0.72rem" }}>
                      {locale === "en-CA" ? "Request:" : "Demande :"} {locale === "en-CA" ? reqStatus.en : reqStatus.fr}
                    </span>
                    {price && (
                      <span className="service-inline-chip">
                        <AppIcon name="wallet" size={13} />{price}
                      </span>
                    )}
                    {quote.proposed_date && (
                      <span className="status-chip">
                        <span style={{ marginRight: "0.2rem", display: "inline-flex" }}><AppIcon name="calendar" size={13} /></span>
                        {formatDate(quote.proposed_date)}
                      </span>
                    )}
                  </div>

                  {/* Message preview */}
                  {quote.message && (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "0 0 0.6rem", lineHeight: 1.4 }}>
                      {quote.message.length > 140 ? `${quote.message.slice(0, 140)}…` : quote.message}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="request-card-details" style={{ marginBottom: "0.75rem" }}>
                    <span>
                      <span style={{ marginRight: "0.2rem", display: "inline-flex" }}><AppIcon name="calendar" size={13} /></span>
                      {locale === "en-CA" ? "Sent" : "Envoyée"} {formatDate(quote.submitted_at ?? quote.updated_at)}
                    </span>
                    {declined > 0 && quote.status === "withdrawn" && (
                      <span style={{ color: "var(--text-muted)" }}>
                        {locale === "en-CA" ? "Withdrawn" : "Retirée"} {formatDate(quote.withdrawn_at)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.65rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {quote.conversation_id && (
                      <button
                        className="ghost-button compact-button"
                        onClick={() => navigate(`/${locale}/pro/messages?request_id=${quote.request_id}`)}
                        type="button"
                      >
                        <AppIcon name="messages" size={14} />
                        {locale === "en-CA" ? "Open conversation" : "Ouvrir la conversation"}
                      </button>
                    )}
                    {canWithdraw && (
                      <button
                        className="ghost-button compact-button"
                        disabled={withdrawingId === quote.id}
                        onClick={() => void handleWithdraw(quote.id)}
                        style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                        type="button"
                      >
                        {withdrawingId === quote.id
                          ? "…"
                          : (locale === "en-CA" ? "Withdraw" : "Retirer l'offre")}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
