import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { EmptyState, SectionIntro } from "../shared/Shared";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format(value / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

export function ProviderSubscriptionPage() {
  const { locale, plans, subscriptions, subscribeToPlan, cancelCurrentSubscription } = useApp();
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Subscription" : "Abonnement"}
          title={locale === "en-CA" ? "Compare plans through business outcomes, not just labels" : "Comparer les plans par resultat business, pas seulement par etiquette"}
          body={locale === "en-CA" ? "The pricing page should make the upgrade path feel simple, concrete and trustworthy." : "La page pricing doit rendre le chemin d'upgrade simple, concret et rassurant."}
        />
        <div className="plan-list">
          {plans.map((plan, index) => (
            <article className={index === 1 ? "plan-card highlight-ring plan-card-pro" : "plan-card plan-card-pro"} key={plan.id}>
              <div className="service-card-header">
                <strong>{plan.name}</strong>
                {index === 1 ? <span className="status-chip status-chip-brand">{locale === "en-CA" ? "Recommended" : "Recommande"}</span> : null}
              </div>
              <div className="price-tag">
                <span>{money(plan.price_cents, plan.currency)}</span>
                <small>/{plan.billing_interval}</small>
              </div>
              <div className="feature-list-inline">
                <span>{locale === "en-CA" ? "Priority" : "Priorite"} {plan.priority_level}</span>
                <span>{locale === "en-CA" ? "Replies" : "Reponses"} {plan.response_limit ?? (locale === "en-CA" ? "Unlimited" : "Illimitees")}</span>
                <span>{locale === "en-CA" ? "Boosted visibility" : "Visibilite renforcee"}</span>
              </div>
              <button
                className="primary-button"
                disabled={pendingPlanId === plan.id}
                onClick={async () => {
                  setPendingPlanId(plan.id);
                  try {
                    await subscribeToPlan(plan.id);
                  } finally {
                    setPendingPlanId(null);
                  }
                }}
                type="button"
              >
                {pendingPlanId === plan.id ? (locale === "en-CA" ? "Redirecting..." : "Redirection...") : (locale === "en-CA" ? "Choose this plan" : "Choisir ce plan")}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Current subscription" : "Abonnement actuel"}
          title={locale === "en-CA" ? "Keep current status and renewal dates crystal clear" : "Rendre le statut actuel et les echeances tres lisibles"}
          body={locale === "en-CA" ? "This section should reduce doubt after purchase and make plan management feel controlled." : "Cette section doit reduire le doute apres achat et rendre la gestion du plan plus sereine."}
        />
        <div className="stack">
          {subscriptions.length === 0 ? (
            <EmptyState
              title={locale === "en-CA" ? "No subscription yet." : "Aucun abonnement pour l'instant."}
              body={locale === "en-CA" ? "Start with a plan when you're ready to increase local visibility." : "Activez un plan quand vous etes pret a augmenter votre visibilite locale."}
            />
          ) : null}

          {subscriptions.map((subscription) => (
            <article className="list-card" key={subscription.id}>
              <div className="service-card-header">
                <div>
                  <strong>{subscription.plan_name ?? subscription.plan_code ?? subscription.plan_id}</strong>
                  <p>{locale === "en-CA" ? "Status" : "Statut"} {subscription.status}</p>
                </div>
                <span className="status-chip status-chip-success">{subscription.status}</span>
              </div>
              <div className="request-card-details">
                <span>{locale === "en-CA" ? "Starts on" : "Demarre le"} {formatDate(subscription.starts_at)}</span>
                <span>{locale === "en-CA" ? "Ends on" : "Fin"} {formatDate(subscription.ends_at)}</span>
                <span>{subscription.cancel_at_period_end ? (locale === "en-CA" ? "Cancellation planned" : "Annulation planifiee") : (locale === "en-CA" ? "Renewal active" : "Renouvellement actif")}</span>
              </div>
              <div className="cta-row">
                <button
                  className="ghost-button"
                  disabled={pendingCancelId === subscription.id}
                  onClick={async () => {
                    setPendingCancelId(subscription.id);
                    try {
                      await cancelCurrentSubscription(subscription.id);
                    } finally {
                      setPendingCancelId(null);
                    }
                  }}
                  type="button"
                >
                  {pendingCancelId === subscription.id ? (locale === "en-CA" ? "Processing..." : "Traitement...") : (locale === "en-CA" ? "Cancel subscription" : "Annuler l'abonnement")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
