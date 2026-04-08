import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { SectionIntro } from "../shared/Shared";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format(value / 100);
}

export function BecomeProviderPage() {
  const navigate = useNavigate();
  const { locale, plans, session } = useApp();
  const providerTarget = `/${locale}/pro/activation`;
  const providerCtaHref = session ? providerTarget : `/${locale}/inscription?next=${encodeURIComponent(providerTarget)}`;

  const benefitBlocks = locale === "en-CA"
    ? [
        { title: "Qualified local demand", body: "Receive requests filtered by service, city and availability instead of generic cold leads." },
        { title: "Faster quote workflow", body: "Clearer request context helps you reply fast with more confidence and less back-and-forth." },
        { title: "Public trust that converts", body: "Profiles, reviews and local coverage stay visible when clients compare providers." },
      ]
    : [
        { title: "Demande locale qualifiee", body: "Recevez des demandes filtrees par service, ville et disponibilite plutot que des leads froids." },
        { title: "Parcours de devis plus rapide", body: "Un meilleur contexte de demande aide a repondre vite avec moins d'allers-retours." },
        { title: "Confiance publique qui convertit", body: "Profils, avis et couverture locale restent visibles quand le client compare les prestataires." },
      ];

  const journey = locale === "en-CA"
    ? [
        "Create one account and activate the provider side when you're ready.",
        "Choose your services and your city coverage to get better-fit opportunities.",
        "Reply to requests, build reviews and upgrade when volume starts paying back.",
      ]
    : [
        "Creez un seul compte et activez l'espace prestataire quand vous etes pret.",
        "Choisissez vos services et vos villes couvertes pour recevoir de meilleures opportunites.",
        "Repondez aux demandes, accumulez les avis et upgradez quand le volume devient rentable.",
      ];

  return (
    <section className="stack stack-xl">
      <section className="hero hero-public">
        <div className="hero-copy hero-copy-public">
          <p className="eyebrow">{locale === "en-CA" ? "For providers" : "Pour les prestataires"}</p>
          <h1>{locale === "en-CA" ? "Grow from local visibility to repeat business." : "Passez de la visibilite locale a un vrai flux d'affaires."}</h1>
          <p className="hero-subtitle">
            {locale === "en-CA"
              ? "Jobizy helps service businesses get clearer local requests, reply faster and look more trustworthy before the first call."
              : "Jobizy aide les entreprises de services a recevoir des demandes locales plus claires, a repondre vite et a paraitre plus credibles avant meme le premier appel."}
          </p>
          <div className="cta-row">
            <button className="primary-button" onClick={() => navigate(providerCtaHref)} type="button">
              {locale === "en-CA" ? "Create my provider account" : "Creer mon compte prestataire"}
            </button>
            <button className="ghost-button" onClick={() => navigate(session ? `/${locale}/pro/abonnement` : providerCtaHref)} type="button">
              {locale === "en-CA" ? "See plans" : "Voir les plans"}
            </button>
          </div>
          <div className="trust-inline">
            <span className="status-chip status-chip-success">{locale === "en-CA" ? "City-based demand" : "Demandes par ville"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Public reviews" : "Avis publics"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Upgrade only when ROI is visible" : "Upgrade quand le ROI devient visible"}</span>
          </div>
        </div>

        <div className="hero-visual-stack">
          <article className="tabular-card tabular-card-soft provider-hero-panel">
            <p className="eyebrow">{locale === "en-CA" ? "Why it feels professional" : "Pourquoi ca semble professionnel"}</p>
            {benefitBlocks.map((item) => (
              <div className="tabular-row" key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            ))}
          </article>
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Provider journey" : "Parcours prestataire"}
          title={locale === "en-CA" ? "Show the path to activation, proof and growth" : "Montrer le chemin entre activation, preuves et croissance"}
          body={locale === "en-CA" ? "The provider landing page should make the commercial value feel obvious without overselling." : "La landing prestataire doit rendre la valeur commerciale evidente sans sur-vendre."}
        />
        <div className="steps-rail">
          {journey.map((item, index) => (
            <article className="step-card-pro" key={item}>
              <span>{`0${index + 1}`}</span>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Plans" : "Plans"}
          title={locale === "en-CA" ? "Make pricing easy to compare and easy to justify" : "Rendre la tarification facile a comparer et a justifier"}
          body={locale === "en-CA" ? "Keep the structure simple: start, grow, dominate local visibility." : "Garder une structure simple : commencer, accelerer, dominer la visibilite locale."}
        />
        <div className="plan-list">
          {plans.slice(0, 3).map((plan, index) => (
            <article className={index === 1 ? "plan-card highlight-ring plan-card-pro" : "plan-card plan-card-pro"} key={plan.id}>
              <div className="service-card-header">
                <strong>{plan.name}</strong>
                {index === 1 ? <span className="status-chip status-chip-brand">{locale === "en-CA" ? "Best balance" : "Meilleur equilibre"}</span> : null}
              </div>
              <div className="price-tag">
                <span>{money(plan.price_cents, plan.currency)}</span>
                <small>/{plan.billing_interval}</small>
              </div>
              <div className="feature-list-inline">
                <span>{locale === "en-CA" ? "Priority level" : "Priorite"} {plan.priority_level}</span>
                <span>{locale === "en-CA" ? "Response cap" : "Cap reponses"} {plan.response_limit ?? (locale === "en-CA" ? "Unlimited" : "Illimite")}</span>
                <span>{locale === "en-CA" ? "Profile visibility boost" : "Visibilite profil renforcee"}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
