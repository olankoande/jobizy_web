import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import type { Plan } from "../../types";

const fallbackPlans = (locale: "fr-CA" | "en-CA"): Plan[] => [
  {
    id: "plan-free",
    code: "free",
    name: "Free",
    price_cents: 0,
    currency: "CAD",
    billing_interval: locale === "en-CA" ? "month" : "mois",
    response_limit: 5,
    priority_level: 1,
    status: "active",
  },
  {
    id: "plan-pro",
    code: "pro",
    name: "Pro",
    price_cents: 4900,
    currency: "CAD",
    billing_interval: locale === "en-CA" ? "month" : "mois",
    response_limit: 25,
    priority_level: 2,
    status: "active",
  },
  {
    id: "plan-elite",
    code: "elite",
    name: "Elite",
    price_cents: 9900,
    currency: "CAD",
    billing_interval: locale === "en-CA" ? "month" : "mois",
    response_limit: null,
    priority_level: 3,
    status: "active",
  },
];

export function PricingPage() {
  const navigate = useNavigate();
  const { locale, plans, session } = useApp();

  const visiblePlans = useMemo(() => (plans.length > 0 ? plans : fallbackPlans(locale)), [locale, plans]);
  const requestTarget = `/${locale}/app/demandes`;
  const requestCtaHref = session ? requestTarget : `/${locale}/inscription?next=${encodeURIComponent(requestTarget)}`;
  const providerCtaHref = session ? `/${locale}/pro/abonnement` : `/${locale}/devenir-prestataire`;

  const clientPricingPoints = locale === "en-CA"
    ? [
        "Clients publish requests for free and receive indicative quotes from providers.",
        "The service payment is arranged directly between client and provider outside Jobizy.",
        "Messaging, quote comparison and mission follow-up stay centralized in the app.",
      ]
    : [
        "Les clients publient gratuitement et recoivent des offres indicatives de prestataires.",
        "Le reglement de la prestation se fait directement entre client et prestataire hors Jobizy.",
        "La messagerie, la comparaison des offres et le suivi de mission restent centralises dans l'application.",
      ];

  return (
    <section className="stack stack-xl">
      <header className="page-header">
        <p className="eyebrow">{locale === "en-CA" ? "Pricing" : "Tarifs"}</p>
        <h1>{locale === "en-CA" ? "Choose your provider plan" : "Choisissez votre plan prestataire"}</h1>
        <p>{locale === "en-CA"
          ? "Posting a request is free for clients. Providers pick the level that fits their activity."
          : "Publier une demande est gratuit pour les clients. Les prestataires choisissent le niveau adapté à leur activité."}</p>
      </header>

      <section className="plan-list">
        {visiblePlans.map((plan, index) => (
          <article className={index === 1 ? "plan-card plan-card-pro highlight-ring" : "plan-card plan-card-pro"} key={plan.id}>
            <div className="service-card-header">
              <strong>{plan.name}</strong>
              {index === 1 ? <span className="status-chip status-chip-brand">{locale === "en-CA" ? "Recommended" : "Recommandé"}</span> : null}
            </div>
            <p>{locale === "en-CA"
              ? `Priority level ${plan.priority_level} for providers who want to grow steadily.`
              : `Niveau de priorité ${plan.priority_level} pour les prestataires qui veulent accélérer progressivement.`}</p>
            <div className="price-tag">
              <span>{new Intl.NumberFormat(locale, { style: "currency", currency: plan.currency }).format(plan.price_cents / 100)}</span>
              <small>/{plan.billing_interval}</small>
            </div>
            <div className="feature-list-inline">
              <span>{locale === "en-CA" ? "Replies" : "Réponses"}: {plan.response_limit ?? (locale === "en-CA" ? "Unlimited" : "Illimitées")}</span>
              <span>{locale === "en-CA" ? "Priority" : "Priorité"}: {plan.priority_level}</span>
              <span>{locale === "en-CA" ? "Visibility boost" : "Visibilité renforcée"}</span>
            </div>
            <button className="primary-button" onClick={() => navigate(providerCtaHref)} type="button">
              {session
                ? (locale === "en-CA" ? "Manage subscription" : "Gérer mon abonnement")
                : plan.price_cents === 0
                  ? (locale === "en-CA" ? "Get started" : "Commencer")
                  : (locale === "en-CA" ? `Choose ${plan.name}` : `Choisir ${plan.name}`)}
            </button>
          </article>
        ))}
      </section>

      <section className="pricing-client">
        <div>
          <p className="eyebrow">{locale === "en-CA" ? "For clients" : "Pour les clients"}</p>
          <strong>{locale === "en-CA" ? "Free to compare, discuss and choose" : "Gratuit pour comparer, discuter et choisir"}</strong>
          <ul className="feature-list">
            {clientPricingPoints.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">{locale === "en-CA" ? "Post a request" : "Publier une demande"}</button>
      </section>
    </section>
  );
}
