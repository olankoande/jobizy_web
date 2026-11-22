import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { AppIcon } from "../../app/AppIcon";
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
      <section className="provider-hero">
        <div className="provider-hero-copy">
          <h1>
            {locale === "en-CA" ? <>Grow your business and find <em>more clients</em></> : <>Développez votre activité et trouvez <em>plus de clients</em></>}
          </h1>
          <p className="home-hero-sub">
            {locale === "en-CA"
              ? "Receive qualified requests, offer your services and grow your income, simply."
              : "Recevez des demandes qualifiées, proposez vos services et augmentez vos revenus, en toute simplicité."}
          </p>
          <ul className="check-list">
            {benefitBlocks.map((item) => (
              <li key={item.title}>
                <AppIcon className="check-list-icon" name="check" />
                <span><strong>{item.title}</strong> <small>{item.body}</small></span>
              </li>
            ))}
          </ul>
          <div className="home-hero-cta">
            <button className="primary-button" onClick={() => navigate(providerCtaHref)} type="button">
              {locale === "en-CA" ? "Activate my provider profile" : "Activer mon profil prestataire"}
            </button>
            <button className="outline-button" onClick={() => navigate(session ? `/${locale}/pro/abonnement` : `/${locale}/tarifs`)} type="button">
              {locale === "en-CA" ? "See plans" : "Voir les plans"}
            </button>
          </div>
        </div>
        <div aria-hidden="true" className="home-hero-visual provider-hero-visual">
          <span className="hv-shape hv-shape-blue" />
          <span className="hv-shape hv-shape-orange" />
          <div className="hv-card hv-card-main">
            <span className="hv-avatar">+1</span>
            <div>
              <strong>{locale === "en-CA" ? "New request" : "Nouvelle demande"}</strong>
              <small>{locale === "en-CA" ? "Near you" : "Près de chez vous"}</small>
            </div>
          </div>
          <div className="hv-card hv-card-offer">
            <span className="hv-check"><AppIcon name="check" /></span>
            <div>
              <strong>{locale === "en-CA" ? "Mission won" : "Mission remportée"}</strong>
              <small>{locale === "en-CA" ? "Your reply was accepted" : "Votre réponse est acceptée"}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Provider journey" : "Parcours prestataire"}
          title={locale === "en-CA" ? "From activation to your first missions" : "De l'activation à vos premières missions"}
          body={locale === "en-CA" ? "Set up your profile, receive qualified requests and grow at your pace." : "Configurez votre profil, recevez des demandes qualifiées et développez-vous à votre rythme."}
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
          title={locale === "en-CA" ? "Simple plans that grow with you" : "Des plans simples qui évoluent avec vous"}
          body={locale === "en-CA" ? "Start for free, then upgrade when the volume justifies it." : "Commencez gratuitement, puis évoluez quand le volume le justifie."}
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
