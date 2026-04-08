import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { getProviderSpotlights, getPublicTrustStats, mapPublicProviderSpotlights } from "../../content/marketplaceContent";
import { Avatar } from "../../components/Avatar";
import { SectionIntro } from "../shared/Shared";

export function ProvidersPage() {
  const navigate = useNavigate();
  const { locale, publicProviders, services, session } = useApp();

  const providerSpotlights = useMemo(
    () => (mapPublicProviderSpotlights(locale, publicProviders).length > 0 ? mapPublicProviderSpotlights(locale, publicProviders) : getProviderSpotlights(locale)),
    [locale, publicProviders],
  );
  const trustStats = useMemo(() => getPublicTrustStats(locale, services, [], null), [locale, services]);

  const providerCtaHref = session ? `/${locale}/pro` : `/${locale}/devenir-prestataire`;
  const requestTarget = `/${locale}/app/demandes`;
  const requestCtaHref = session ? requestTarget : `/${locale}/inscription?next=${encodeURIComponent(requestTarget)}`;

  const trustPillars = locale === "en-CA"
    ? [
        { title: "Visible proof", body: "Ratings, reviews, completed missions and local coverage stay easy to scan." },
        { title: "Faster replies", body: "Clients can compare providers without jumping between disconnected conversations." },
        { title: "Qualified demand", body: "Providers join to receive local requests that fit their services and territory." },
      ]
    : [
        { title: "Preuves visibles", body: "Notes, avis, missions terminees et couverture locale restent faciles a lire." },
        { title: "Reponses plus rapides", body: "Les clients comparent les prestataires sans naviguer entre plusieurs conversations eparses." },
        { title: "Demande qualifiee", body: "Les prestataires s'inscrivent pour recevoir des demandes locales qui collent a leurs services et a leur territoire." },
      ];

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean panel-hero-surface">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Providers" : "Prestataires"}
          title={locale === "en-CA"
            ? "Meet local providers ready to reply to real requests"
            : "Decouvrez des prestataires locaux prets a repondre a de vraies demandes"}
          body={locale === "en-CA"
            ? "This directory highlights activity, reliability and response quality instead of decorative content."
            : "Ce repertoire met en avant l'activite, la fiabilite et la qualite de reponse plutot qu'un contenu decoratif."}
          aside={<button className="primary-button" onClick={() => navigate(providerCtaHref)} type="button">{locale === "en-CA" ? "Become a provider" : "Devenir prestataire"}</button>}
        />
        <div className="stats-inline">
          {trustStats.map((item) => (
            <article className="mini-stat" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="provider-spotlight-grid">
        {providerSpotlights.map((provider) => (
          <article className="provider-public-card provider-public-card-plain" key={provider.name}>
            <div className="provider-public-body">
              <div className="service-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <Avatar name={provider.name} size={44} />
                  <div>
                    <strong>{provider.name}</strong>
                    <p>{provider.specialty}</p>
                  </div>
                </div>
                <span className="status-chip status-chip-success">{provider.rating}/5</span>
              </div>
              <div className="card-meta">
                <span>{provider.city}</span>
                <span>{provider.jobs} {locale === "en-CA" ? "missions" : "missions"}</span>
                <span className="status-chip">{locale === "en-CA" ? "Verified" : "Verifie"}</span>
              </div>
              <p>{provider.response}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Trust signals" : "Signaux de confiance"}
          title={locale === "en-CA" ? "What clients need to see before sending a request" : "Ce que les clients doivent voir avant d'envoyer une demande"}
        />
        <div className="trust-grid">
          {trustPillars.map((item) => (
            <article className="tabular-card tabular-card-soft" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean two-up">
        <article className="tabular-card tabular-card-soft">
          <p className="eyebrow">{locale === "en-CA" ? "For clients" : "Pour les clients"}</p>
          <strong>{locale === "en-CA" ? "See who looks reliable before posting" : "Voir qui semble fiable avant de publier"}</strong>
          <ul className="feature-list">
            <li>{locale === "en-CA" ? "Provider specialties are visible at a glance." : "Les specialites prestataires sont visibles en un coup d'oeil."}</li>
            <li>{locale === "en-CA" ? "Coverage areas reduce the fear of generic results." : "Les zones couvertes reduisent la peur de resultats trop generiques."}</li>
            <li>{locale === "en-CA" ? "Review and response cues make comparison easier." : "Les avis et indices de reponse rendent la comparaison plus simple."}</li>
          </ul>
        </article>
        <article className="tabular-card tabular-card-soft">
          <p className="eyebrow">{locale === "en-CA" ? "For providers" : "Pour les prestataires"}</p>
          <strong>{locale === "en-CA" ? "Understand the visibility opportunity before signing up" : "Comprendre la visibilite gagnee avant l'inscription"}</strong>
          <ul className="feature-list">
            <li>{locale === "en-CA" ? "A polished public profile improves first-click conversion." : "Un profil public soigne ameliore la conversion des premiers clics."}</li>
            <li>{locale === "en-CA" ? "Fast replies and reviews reinforce long-term reputation." : "Des reponses rapides et des avis renforcent la reputation dans le temps."}</li>
            <li>{locale === "en-CA" ? "Pricing plans later amplify the same visibility loop." : "Les plans tarifaires amplifient ensuite cette meme boucle de visibilite."}</li>
          </ul>
        </article>
      </section>

      <section className="panel panel-clean final-cta-panel">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Take action" : "Passer a l'action"}
          title={locale === "en-CA" ? "Need a provider now, or want your business shown here?" : "Besoin d'un prestataire maintenant, ou envie que votre entreprise apparaisse ici ?"}
        />
        <div className="cta-row">
          <button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">{locale === "en-CA" ? "Post a request" : "Publier une demande"}</button>
          <button className="secondary-button" onClick={() => navigate(providerCtaHref)} type="button">{locale === "en-CA" ? "Create provider profile" : "Creer mon profil prestataire"}</button>
        </div>
      </section>
    </section>
  );
}
