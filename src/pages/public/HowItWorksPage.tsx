import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { getFaqItems } from "../../content/marketplaceContent";
import { SectionIntro } from "../shared/Shared";

export function HowItWorksPage() {
  const navigate = useNavigate();
  const { locale } = useApp();
  const faqItems = getFaqItems(locale);
  const requestTarget = `/${locale}/app/demandes`;
  const requestCtaHref = `/${locale}/inscription?next=${encodeURIComponent(requestTarget)}`;

  const steps = locale === "en-CA"
    ? [
        { step: "01", title: "Choose the service and city", body: "Start with a guided entry point that feels local and concrete, not technical." },
        { step: "02", title: "Compare trusted providers", body: "View price, timing, reviews and profile quality before making a choice." },
        { step: "03", title: "Confirm and follow through", body: "Keep messaging and mission follow-up in the app, then organize payment directly with the provider." },
      ]
    : [
        { step: "01", title: "Choisir le service et la ville", body: "Commencez par une entree guidee qui semble locale et concrete, pas technique." },
        { step: "02", title: "Comparer des prestataires fiables", body: "Consultez prix, delai, avis et qualite du profil avant de choisir." },
        { step: "03", title: "Confirmer puis suivre la mission", body: "Gardez la messagerie et le suivi dans l'application, puis reglez directement avec le prestataire." },
      ];

  const providerBlocks = locale === "en-CA"
    ? [
        "Get qualified local opportunities matched to your services and area.",
        "Reply faster with clearer request context and visible client intent.",
        "Build trust through profile quality, reviews and response speed.",
      ]
    : [
        "Recevez des opportunites locales qualifiees selon vos services et votre zone.",
        "Repondez plus vite avec un meilleur contexte de demande et une intention client plus claire.",
        "Renforcez la confiance grace au profil, aux avis et a la rapidite de reponse.",
      ];

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean panel-hero-surface">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Journey" : "Parcours"}
          title={locale === "en-CA" ? "Explain the product with fewer steps and stronger reassurance" : "Expliquer le produit avec moins d'etapes et plus de reassurance"}
          body={locale === "en-CA" ? "Visitors should understand the local flow in seconds: define the need, compare confidently, move forward." : "Le visiteur doit comprendre le flux local en quelques secondes : definir le besoin, comparer en confiance, avancer."}
          aside={<button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">{locale === "en-CA" ? "Post a request" : "Publier une demande"}</button>}
        />
        <div className="steps-rail">
          {steps.map((step) => (
            <article className="step-card-pro" key={step.step}>
              <span>{step.step}</span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean two-up">
        <article className="tabular-card tabular-card-soft">
          <p className="eyebrow">{locale === "en-CA" ? "For clients" : "Pour les clients"}</p>
          <strong>{locale === "en-CA" ? "Make the experience feel guided, local and low-risk" : "Donner une sensation guidee, locale et peu risquee"}</strong>
          <ul className="feature-list">
            <li>{locale === "en-CA" ? "Shorter forms with clearer service wording" : "Des formulaires plus courts avec un vocabulaire service plus clair"}</li>
            <li>{locale === "en-CA" ? "Visible trust proof during quote comparison" : "Des preuves de confiance visibles pendant la comparaison des offres"}</li>
            <li>{locale === "en-CA" ? "Messaging and mission follow-up in one place before off-platform payment" : "Messagerie et suivi de mission au meme endroit avant le paiement hors plateforme"}</li>
          </ul>
        </article>
        <article className="tabular-card tabular-card-soft">
          <p className="eyebrow">{locale === "en-CA" ? "For providers" : "Pour les prestataires"}</p>
          <strong>{locale === "en-CA" ? "Show the business value of joining the network" : "Montrer la valeur business du reseau"}</strong>
          <ul className="feature-list">
            {providerBlocks.map((block) => <li key={block}>{block}</li>)}
          </ul>
        </article>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow="FAQ"
          title={locale === "en-CA" ? "The questions a professional marketplace should answer upfront" : "Les questions auxquelles une marketplace serieuse doit repondre tout de suite"}
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
    </section>
  );
}
