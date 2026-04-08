import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import type { Plan } from "../../types";
import { SectionIntro } from "../shared/Shared";

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
      <section className="panel panel-clean panel-hero-surface">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Pricing" : "Tarifs"}
          title={locale === "en-CA"
            ? "Pricing should make the model obvious for both sides of the marketplace"
            : "La tarification doit rendre le modele evident pour les deux cotes de la marketplace"}
          body={locale === "en-CA"
            ? "Clients need transparency. Providers need a clear upgrade path tied to visibility and response capacity."
            : "Les clients ont besoin de transparence. Les prestataires ont besoin d'une progression claire liee a la visibilite et a la capacite de reponse."}
        />
        <div className="hero-panel">
          <article className="metric-card metric-card-info">
            <span>{locale === "en-CA" ? "Client access" : "Acces client"}</span>
            <strong>{locale === "en-CA" ? "Free" : "Gratuit"}</strong>
            <small>{locale === "en-CA" ? "request posting and quote comparison" : "publication de demande et comparaison des offres"}</small>
          </article>
          <article className="metric-card metric-card-action">
            <span>{locale === "en-CA" ? "Provider plans" : "Plans prestataire"}</span>
            <strong>{visiblePlans.length}</strong>
            <small>{locale === "en-CA" ? "simple growth levels" : "niveaux de croissance simples"}</small>
          </article>
        </div>
      </section>

      <section className="panel panel-clean two-up">
        <article className="tabular-card tabular-card-soft">
          <p className="eyebrow">{locale === "en-CA" ? "Client pricing" : "Tarification client"}</p>
          <strong>{locale === "en-CA" ? "Clients use Jobizy to compare, discuss and choose" : "Les clients utilisent Jobizy pour comparer, discuter et choisir"}</strong>
          <ul className="feature-list">
            {clientPricingPoints.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="cta-row">
            <button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">{locale === "en-CA" ? "Post a request" : "Publier une demande"}</button>
          </div>
        </article>
        <article className="tabular-card tabular-card-soft">
          <p className="eyebrow">{locale === "en-CA" ? "Provider pricing" : "Tarification prestataire"}</p>
          <strong>{locale === "en-CA" ? "Plans should sell business value, not just features" : "Les plans doivent vendre une valeur business, pas seulement des options"}</strong>
          <ul className="feature-list">
            <li>{locale === "en-CA" ? "Higher plans improve reply capacity and marketplace visibility." : "Les plans superieurs augmentent la capacite de reponse et la visibilite."}</li>
            <li>{locale === "en-CA" ? "Priority levels help serious providers capture more qualified demand." : "Les niveaux de priorite aident les pros serieux a capter une demande plus qualifiee."}</li>
            <li>{locale === "en-CA" ? "The upgrade path becomes natural once ROI is visible." : "La montee en gamme devient naturelle des que le ROI est visible."}</li>
          </ul>
          <div className="cta-row">
            <button className="secondary-button" onClick={() => navigate(providerCtaHref)} type="button">{locale === "en-CA" ? "See provider plans" : "Voir les plans prestataire"}</button>
          </div>
        </article>
      </section>

      <section className="plan-list">
        {visiblePlans.map((plan, index) => (
          <article className={index === 1 ? "plan-card plan-card-pro highlight-ring" : "plan-card plan-card-pro"} key={plan.id}>
            <div className="service-card-header">
              <strong>{plan.name}</strong>
              {index === 1 ? <span className="status-chip status-chip-brand">{locale === "en-CA" ? "Recommended" : "Recommande"}</span> : null}
            </div>
            <p>{locale === "en-CA"
              ? `Priority level ${plan.priority_level} for providers who want to grow steadily.`
              : `Niveau de priorite ${plan.priority_level} pour les prestataires qui veulent accelerer progressivement.`}</p>
            <div className="price-tag">
              <span>{new Intl.NumberFormat(locale, { style: "currency", currency: plan.currency }).format(plan.price_cents / 100)}</span>
              <small>/{plan.billing_interval}</small>
            </div>
            <div className="feature-list-inline">
              <span>{locale === "en-CA" ? "Replies" : "Reponses"}: {plan.response_limit ?? (locale === "en-CA" ? "Unlimited" : "Illimitees")}</span>
              <span>{locale === "en-CA" ? "Priority" : "Priorite"}: {plan.priority_level}</span>
              <span>{locale === "en-CA" ? "Visibility boost" : "Visibilite renforcee"}</span>
            </div>
            <button className="primary-button" onClick={() => navigate(providerCtaHref)} type="button">
              {session ? (locale === "en-CA" ? "Manage subscription" : "Gerer mon abonnement") : (locale === "en-CA" ? "Become a provider" : "Devenir prestataire")}
            </button>
          </article>
        ))}
      </section>
    </section>
  );
}
