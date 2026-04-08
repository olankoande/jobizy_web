import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { getCostGuides, getFaqItems } from "../../content/marketplaceContent";
import { ActionAssistant, SectionIntro } from "../shared/Shared";

export function HelpPage() {
  const navigate = useNavigate();
  const { locale, session } = useApp();
  const faqItems = useMemo(() => getFaqItems(locale), [locale]);
  const guides = useMemo(() => getCostGuides(locale), [locale]);

  const requestTarget = `/${locale}/app/demandes`;
  const requestCtaHref = session ? requestTarget : `/${locale}/inscription?next=${encodeURIComponent(requestTarget)}`;

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean panel-hero-surface">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Help" : "Aide"}
          title={locale === "en-CA"
            ? "Answer the questions that usually block action on a marketplace"
            : "Repondre aux questions qui bloquent le plus souvent l'action sur une marketplace"}
          body={locale === "en-CA"
            ? "This page is here to remove friction quickly: how it works, what to expect, and where to start."
            : "Cette page sert a enlever vite les frictions : comment ca marche, a quoi s'attendre et par ou commencer."}
        />
        <div className="two-up">
          <ActionAssistant
            tone="trust"
            icon="messages"
            title={locale === "en-CA" ? "Need help choosing the right path?" : "Besoin d'aide pour choisir le bon parcours ?"}
            body={locale === "en-CA"
              ? "If your goal is to hire fast, start with a guided request. If your goal is to get leads, activate the provider space."
              : "Si votre objectif est d'embaucher vite, commencez par une demande guidee. Si votre objectif est de recevoir des leads, activez l'espace prestataire."}
            items={locale === "en-CA"
              ? ["Publish a request in minutes", "Compare quotes side by side", "Follow the mission in one place"]
              : ["Publier une demande en quelques minutes", "Comparer les offres cote a cote", "Suivre la mission au meme endroit"]}
            action={<button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">{locale === "en-CA" ? "Start a request" : "Commencer une demande"}</button>}
          />
          <ActionAssistant
            tone="info"
            icon="search"
            title={locale === "en-CA" ? "Prefer to explore first?" : "Vous preferez explorer d'abord ?"}
            body={locale === "en-CA"
              ? "Browse categories, providers and service examples before you decide."
              : "Parcourez les categories, les prestataires et les exemples de services avant de decider."}
            items={locale === "en-CA"
              ? ["Browse service families", "Understand local provider coverage", "See pricing logic clearly"]
              : ["Parcourir les familles de services", "Comprendre la couverture locale des prestataires", "Voir la logique tarifaire clairement"]}
            action={<button className="secondary-button" onClick={() => navigate(`/${locale}/categories`)} type="button">{locale === "en-CA" ? "Explore categories" : "Explorer les categories"}</button>}
          />
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow="FAQ"
          title={locale === "en-CA" ? "Short answers to the most common marketplace questions" : "Des reponses courtes aux questions les plus frequentes"}
        />
        <div className="faq-grid">
          {faqItems.map((item) => (
            <article className="faq-card" key={item.q}>
              <strong>{item.q}</strong>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Guides" : "Guides"}
          title={locale === "en-CA" ? "Helpful content that reduces uncertainty before posting" : "Du contenu utile pour reduire l'incertitude avant de publier"}
        />
        <div className="guide-grid">
          {guides.map((guide) => (
            <article className="guide-card" key={guide.title}>
              <span>{locale === "en-CA" ? "Resource" : "Ressource"}</span>
              <strong>{guide.title}</strong>
              <p>{guide.body}</p>
              <button className="text-link-button" onClick={() => navigate(`/${locale}/services`)} type="button">{guide.cta}</button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
