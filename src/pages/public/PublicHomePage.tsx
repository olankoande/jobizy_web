import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { CategoryIcon } from "../../app/CategoryIcon";
import {
  getFaqItems,
  getProviderSpotlights,
  getPublicTestimonials,
  getPublicTrustStats,
  mapPublicProviderSpotlights,
} from "../../content/marketplaceContent";
import { SectionIntro } from "../shared/Shared";

type Audience = "client" | "provider";

export function PublicHomePage() {
  const navigate = useNavigate();
  const { locale, session, services, categories, publicProviders, plans } = useApp();
  const [audience, setAudience] = useState<Audience>("client");
  const [assistantCategoryId, setAssistantCategoryId] = useState("");
  const [assistantServiceId, setAssistantServiceId] = useState("");
  const [assistantZone, setAssistantZone] = useState("");
  const [assistantNeed, setAssistantNeed] = useState("");

  const trustStats = useMemo(() => getPublicTrustStats(locale, services, [], null), [locale, services]);
  const providerSpotlights = useMemo(
    () => mapPublicProviderSpotlights(locale, publicProviders).length > 0 ? mapPublicProviderSpotlights(locale, publicProviders) : getProviderSpotlights(locale),
    [locale, publicProviders],
  );
  const testimonials = useMemo(() => getPublicTestimonials(locale), [locale]);
  const faqItems = useMemo(() => getFaqItems(locale), [locale]);
  const featuredServices = useMemo(() => services.filter((service): service is (typeof services)[number] => Boolean(service)).slice(0, 8), [services]);
  const featuredCategories = useMemo(() => categories.slice(0, 6), [categories]);
  const featuredPlans = useMemo(() => plans.slice(0, 3), [plans]);
  const cityServices = useMemo(() => services.filter((service): service is (typeof services)[number] => Boolean(service)), [services]);
  const cityOptions = useMemo(() => ["Montreal", "Laval", "Quebec", "Gatineau", "Longueuil"], []);
  const assistantServices = useMemo(
    () => cityServices.filter((service) => !assistantCategoryId || service.category_id === assistantCategoryId).slice(0, 12),
    [assistantCategoryId, cityServices],
  );

  useEffect(() => {
    if (!assistantCategoryId && categories[0]?.id) setAssistantCategoryId(categories[0].id);
  }, [assistantCategoryId, categories]);

  useEffect(() => {
    if (!assistantServiceId && assistantServices[0]?.id) setAssistantServiceId(assistantServices[0].id);
  }, [assistantServiceId, assistantServices]);

  const heroCopy = audience === "client"
    ? {
        eyebrow: locale === "en-CA" ? "Client-first marketplace" : "Marketplace orientee client",
        title: locale === "en-CA"
          ? "Find the right local provider without turning the process into a project."
          : "Trouvez le bon prestataire local sans transformer votre besoin en parcours complexe.",
        body: locale === "en-CA"
          ? "Post a request, receive replies from qualified providers, discuss the job and organize the service directly."
          : "Publiez une demande, recevez des reponses de prestataires qualifies, discutez puis organisez la prestation directement.",
        primary: locale === "en-CA" ? "Post a request" : "Publier une demande",
        secondary: locale === "en-CA" ? "Become a provider" : "Devenir prestataire",
      }
    : {
        eyebrow: locale === "en-CA" ? "Provider growth" : "Croissance prestataire",
        title: locale === "en-CA"
          ? "Receive qualified local opportunities and build a stronger provider presence."
          : "Recevez des opportunites locales qualifiees et renforcez votre presence prestataire.",
        body: locale === "en-CA"
          ? "Activate your provider space, receive targeted requests, reply faster and grow with a clear subscription model."
          : "Activez votre espace prestataire, recevez des demandes ciblees, repondez plus vite et developpez-vous avec un abonnement clair.",
        primary: locale === "en-CA" ? "Become a provider" : "Devenir prestataire",
        secondary: locale === "en-CA" ? "Post a request" : "Publier une demande",
      };

  const clientSteps = locale === "en-CA"
    ? [
        { step: "01", title: "Describe your need", body: "A guided request form turns your need into a brief providers can answer quickly." },
        { step: "02", title: "Receive provider quotes", body: "Get clear responses with pricing, timing, trust signals and local context." },
        { step: "03", title: "Compare and choose", body: "Pick the best fit with messaging, reviews and a more confident decision flow." },
      ]
    : [
        { step: "01", title: "Decrivez votre besoin", body: "Un formulaire guide transforme votre besoin en brief clair pour les prestataires." },
        { step: "02", title: "Recevez des offres", body: "Obtenez des reponses avec prix, delai, signaux de confiance et contexte local." },
        { step: "03", title: "Comparez et choisissez", body: "Selectionnez le meilleur profil avec messagerie, avis et une decision plus simple." },
      ];

  const providerSteps = locale === "en-CA"
    ? [
        { step: "01", title: "Activate your provider space", body: "A single account unlocks your provider profile, services, area coverage and positioning." },
        { step: "02", title: "Receive targeted requests", body: "Jobizy highlights relevant local requests instead of generic low-fit leads." },
        { step: "03", title: "Reply and grow", body: "Send quotes quickly, build proof with reviews and upgrade when volume starts paying back." },
      ]
    : [
        { step: "01", title: "Activez votre espace prestataire", body: "Un seul compte suffit pour ouvrir votre profil, vos services et vos zones." },
        { step: "02", title: "Recevez des demandes ciblees", body: "Jobizy fait remonter les bonnes demandes locales plutot que des leads generiques." },
        { step: "03", title: "Repondez et developpez", body: "Envoyez vos offres rapidement, accumulez des preuves et upgradez au bon moment." },
      ];

  const differentiators = locale === "en-CA"
    ? [
        { title: "Speed", body: "Post a request in minutes and move from need to first quote much faster." },
        { title: "Easy comparison", body: "Compare pricing, timing, ratings and profile quality without jumping between messages." },
        { title: "Trust", body: "Verified providers, visible reviews and a clearer booking journey reduce hesitation." },
        { title: "Business opportunity", body: "Providers get new qualified demand and a clearer reason to join early." },
      ]
    : [
        { title: "Rapide", body: "Publiez une demande en quelques minutes et passez plus vite du besoin a la premiere offre." },
        { title: "Comparaison facile", body: "Comparez prix, delais, notes et qualite du profil sans multiplier les echanges." },
        { title: "Confiance", body: "Prestataires verifies, avis visibles et parcours plus clair reduisent l'hesitation." },
        { title: "Opportunite business", body: "Les prestataires accedent a une demande qualifiee et voient vite l'interet de s'inscrire." },
      ];

  const securityPoints = locale === "en-CA"
    ? [
        "Verified provider profiles",
        "Protected account data",
        "Visible review system",
        "Off-platform payment freedom",
        "Reliable support",
      ]
    : [
        "Profils prestataires verifies",
        "Donnees de compte protegees",
        "Systeme d'avis visible",
        "Paiement hors plateforme libre",
        "Support fiable",
      ];

  const numbers = locale === "en-CA"
    ? [
        { value: `${Math.max(36, featuredServices.length * 9)}+`, label: "requests posted" },
        { value: `${Math.max(18, providerSpotlights.length * 8)}+`, label: "active providers" },
        { value: "92%", label: "response rate" },
        { value: "4.9/5", label: "average satisfaction" },
      ]
    : [
        { value: `${Math.max(36, featuredServices.length * 9)}+`, label: "demandes publiees" },
        { value: `${Math.max(18, providerSpotlights.length * 8)}+`, label: "prestataires actifs" },
        { value: "92%", label: "taux de reponse" },
        { value: "4.9/5", label: "satisfaction moyenne" },
      ];

  const requestTarget = `/${locale}/app/demandes`;
  const requestCtaHref = session ? requestTarget : `/${locale}/inscription?next=${encodeURIComponent(requestTarget)}`;
  const providerCtaHref = session ? `/${locale}/pro` : `/${locale}/devenir-prestataire`;

  return (
    <section className="stack stack-xl public-home">
      <section className={locale === "en-CA" ? "hero hero-public public-home-hero" : "hero hero-public public-home-hero public-home-hero-single"}>
        <div className="hero-copy hero-copy-public">
          <p className="eyebrow">{heroCopy.eyebrow}</p>
          <h1>{heroCopy.title}</h1>
          <p className="hero-subtitle">{heroCopy.body}</p>

          <div className="audience-switch" role="tablist" aria-label={locale === "en-CA" ? "Audience" : "Audience"}>
            <button
              className={audience === "client" ? "segmented-button nav-chip-active" : "segmented-button"}
              onClick={() => setAudience("client")}
              type="button"
            >
              {locale === "en-CA" ? "Client" : "Client"}
            </button>
            <button
              className={audience === "provider" ? "segmented-button nav-chip-active" : "segmented-button"}
              onClick={() => setAudience("provider")}
              type="button"
            >
              {locale === "en-CA" ? "Provider" : "Prestataire"}
            </button>
          </div>

          <div className="cta-row">
            <button className="primary-button" onClick={() => navigate(audience === "client" ? requestCtaHref : providerCtaHref)} type="button">
              {heroCopy.primary}
            </button>
            <button className="secondary-button" onClick={() => navigate(audience === "client" ? providerCtaHref : requestCtaHref)} type="button">
              {heroCopy.secondary}
            </button>
          </div>

          <div className="trust-inline">
            <span className="status-chip status-chip-success">{locale === "en-CA" ? "Verified providers" : "Prestataires verifies"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Fast replies" : "Reponses rapides"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Payment outside Jobizy" : "Paiement hors Jobizy"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Client reviews" : "Avis clients"}</span>
          </div>

          <div className="stats-inline">
            {trustStats.map((item) => (
              <article className="mini-stat" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        {locale === "en-CA" ? (
          <div className="hero-visual-stack">
            <article className="hero-showcase hero-conversion-showcase hero-showcase-plain">
              <div className="hero-showcase-copy">
                <p className="eyebrow">What happens next</p>
                <div className="hero-summary-grid">
                  <article className="mockup-card">
                    <strong>1. Post a clear request</strong>
                    <p>{featuredServices[0]?.name || "Local service"}</p>
                    <span className="status-chip">Guided form</span>
                  </article>
                  <article className="mockup-card">
                    <strong>2. Receive and compare replies</strong>
                    <p>Price, timing, trust signals and messaging stay in one place.</p>
                  </article>
                  <article className="mockup-card">
                    <strong>3. Organize the service directly</strong>
                    <p>Payment happens outside Jobizy. The platform stays focused on matching and follow-up.</p>
                  </article>
                </div>
              </div>
            </article>
          </div>
        ) : null}
      </section>

      <section className="trust-band">
        <span>{locale === "en-CA" ? "Verified providers" : "Prestataires verifies"}</span>
        <span>{locale === "en-CA" ? "Fast responses" : "Reponses rapides"}</span>
        <span>{locale === "en-CA" ? "Direct service arrangement" : "Organisation directe de la prestation"}</span>
        <span>{locale === "en-CA" ? "Visible client reviews" : "Avis clients visibles"}</span>
      </section>

      <section className="panel panel-clean request-home-assistant">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Request assistant" : "Assistant de demande"}
          title={locale === "en-CA" ? "Start a request from the homepage" : "Commencez une demande depuis la page d'accueil"}
          body={locale === "en-CA"
            ? "Capture the essential details first, then continue in the full guided wizard."
            : "Saisissez l'essentiel ici, puis poursuivez dans le wizard complet de creation de demande."}
        />
        <div className="request-home-assistant-grid">
          <div className="form-grid form-grid-pro">
            <label>
              <span>{locale === "en-CA" ? "Category" : "Categorie"}</span>
              <select onChange={(event) => setAssistantCategoryId(event.target.value)} value={assistantCategoryId}>
                {categories.slice(0, 12).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{locale === "en-CA" ? "Service" : "Service"}</span>
              <select onChange={(event) => setAssistantServiceId(event.target.value)} value={assistantServiceId}>
                {assistantServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{locale === "en-CA" ? "City" : "Ville"}</span>
              <select onChange={(event) => setAssistantZone(event.target.value)} value={assistantZone}>
                <option value="">{locale === "en-CA" ? "Choose a city" : "Choisir une ville"}</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-wide">
              <span>{locale === "en-CA" ? "What do you need?" : "Quel est votre besoin ?"}</span>
              <textarea
                onChange={(event) => setAssistantNeed(event.target.value)}
                placeholder={locale === "en-CA" ? "Example: I need a fast repair this week for a leaking sink." : "Exemple : j'ai besoin d'une reparation rapide cette semaine pour une fuite sous l'evier."}
                value={assistantNeed}
              />
            </label>
          </div>
          <aside className="assistant-card assistant-card-action">
            <div className="assistant-card-head">
              <div>
                <strong>{locale === "en-CA" ? "Live summary" : "Resume en direct"}</strong>
                <p>
                  {locale === "en-CA"
                    ? "The full wizard will help you refine schedule, budget and details before publishing."
                    : "Le wizard complet vous aidera ensuite a preciser le delai, le budget et les details avant publication."}
                </p>
              </div>
            </div>
            <div className="assistant-list">
              <div className="assistant-item"><span>{categories.find((item) => item.id === assistantCategoryId)?.name || "-"}</span></div>
              <div className="assistant-item"><span>{assistantServices.find((item) => item.id === assistantServiceId)?.name || "-"}</span></div>
              <div className="assistant-item"><span>{assistantZone || (locale === "en-CA" ? "City to confirm" : "Ville a confirmer")}</span></div>
            </div>
            <div className="cta-row">
              <button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">
                {locale === "en-CA" ? "Continue with the assistant" : "Continuer avec l'assistant"}
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="panel panel-clean" id="comment-ca-marche">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "How it works" : "Comment ca marche"}
          title={locale === "en-CA" ? "A simple path for clients and a clearer opportunity for providers" : "Un parcours simple pour les clients et une opportunite claire pour les prestataires"}
          body={locale === "en-CA"
            ? "Jobizy has to explain the product quickly, without mixing every audience in the same paragraph."
            : "Jobizy doit expliquer le produit vite, sans melanger les deux cibles dans le meme paragraphe."}
        />

        <div className="button-group">
          <button
            className={audience === "client" ? "nav-chip nav-chip-active" : "nav-chip"}
            onClick={() => setAudience("client")}
            type="button"
          >
            {locale === "en-CA" ? "For clients" : "Pour les clients"}
          </button>
          <button
            className={audience === "provider" ? "nav-chip nav-chip-active" : "nav-chip"}
            onClick={() => setAudience("provider")}
            type="button"
          >
            {locale === "en-CA" ? "For providers" : "Pour les prestataires"}
          </button>
        </div>

        <div className="steps-rail">
          {(audience === "client" ? clientSteps : providerSteps).map((item) => (
            <article className="step-card-pro" key={item.step}>
              <span>{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean" id="categories">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Categories" : "Categories"}
          title={locale === "en-CA" ? "Explore the services available on Jobizy" : "Explorez les services disponibles sur Jobizy"}
          body={locale === "en-CA"
            ? "Concrete categories help visitors project themselves quickly and increase conversion."
            : "Des categories concretes aident le visiteur a se projeter vite et renforcent la conversion."}
          aside={<button className="ghost-button" onClick={() => navigate(`/${locale}/categories`)} type="button">{locale === "en-CA" ? "See all categories" : "Voir toutes les categories"}</button>}
        />
        <div className="category-feature-grid">
          {featuredCategories.map((category) => (
            <article className="category-feature-card category-feature-card-plain" key={category.id}>
              <div className="category-feature-copy">
                <span className="category-icon-box">
                  <CategoryIcon icon={category.icon} size={22} />
                </span>
                <strong>{category.marketing_title || category.name}</strong>
                <p>{category.marketing_subtitle || category.description || (locale === "en-CA" ? "Popular local category." : "Categorie locale populaire.")}</p>
                <button className="text-link-button" onClick={() => navigate(`/${locale}/categories`)} type="button">
                  {locale === "en-CA" ? "Explore this category" : "Explorer cette categorie"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Why Jobizy" : "Pourquoi Jobizy"}
          title={locale === "en-CA" ? "Built to reduce hesitation and increase action" : "Construit pour reduire l'hesitation et augmenter l'action"}
          body={locale === "en-CA"
            ? "This section should feel commercial, not descriptive."
            : "Cette section doit etre commerciale, pas simplement descriptive."}
        />
        <div className="trust-grid">
          {differentiators.map((item) => (
            <article className="tabular-card tabular-card-soft" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean" id="prestataires">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Featured providers" : "Prestataires en vedette"}
          title={locale === "en-CA" ? "Show the marketplace is alive and trustworthy" : "Montrer que la marketplace est vivante et credible"}
          body={locale === "en-CA"
            ? "Visible provider proof improves trust before the first click."
            : "Des profils visibles renforcent la confiance avant meme le premier clic."}
          aside={<button className="ghost-button" onClick={() => navigate(`/${locale}/prestataires`)} type="button">{locale === "en-CA" ? "See providers" : "Voir les prestataires"}</button>}
        />
        <div className="provider-spotlight-grid">
          {providerSpotlights.map((provider) => (
            <article className="provider-public-card provider-public-card-plain" key={provider.name}>
              <div className="provider-public-body">
                <div className="service-card-header">
                  <div>
                    <strong>{provider.name}</strong>
                    <p>{provider.specialty}</p>
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
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Proof and traction" : "Preuves et traction"}
          title={locale === "en-CA" ? "Reassure both sides with a few solid indicators" : "Rassurer les deux cotes avec quelques indicateurs solides"}
        />
        <div className="hero-panel">
          {numbers.map((item) => (
            <article className="metric-card metric-card-support" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
        <div className="testimonial-grid testimonial-grid-public">
          {testimonials.map((item) => (
            <article className="tabular-card tabular-card-soft" key={item.author}>
              <p className="eyebrow">{item.role}</p>
              <blockquote>{item.quote}</blockquote>
              <div className="testimonial-author">{item.author}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean" id="tarifs">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Provider pricing" : "Abonnements prestataire"}
          title={locale === "en-CA" ? "Grow your activity with Jobizy" : "Developpez votre activite avec Jobizy"}
          body={locale === "en-CA"
            ? "Introduce monetization after the core value is already clear."
            : "Introduire la monetisation apres avoir rendu la valeur tres claire."}
          aside={<button className="ghost-button" onClick={() => navigate(`/${locale}/tarifs`)} type="button">{locale === "en-CA" ? "See plans" : "Voir les abonnements"}</button>}
        />
        <div className="plan-list">
          {featuredPlans.map((plan, index) => (
            <article className={index === 1 ? "plan-card plan-card-pro highlight-ring" : "plan-card plan-card-pro"} key={plan.id}>
              <div className="service-card-header">
                <strong>{plan.name}</strong>
                {index === 1 ? <span className="status-chip status-chip-brand">{locale === "en-CA" ? "Best balance" : "Meilleur equilibre"}</span> : null}
              </div>
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
                {locale === "en-CA" ? "Activate provider space" : "Activer mon espace prestataire"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Security and trust" : "Securite et confiance"}
          title={locale === "en-CA" ? "A marketplace needs clear operational reassurance" : "Une marketplace a besoin de reassurance operationnelle claire"}
        />
        <div className="trust-grid">
          {securityPoints.map((item) => (
            <article className="tabular-card tabular-card-soft" key={item}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean" id="faq">
        <SectionIntro
          eyebrow="FAQ"
          title={locale === "en-CA" ? "Short answers to the questions that block action" : "Des reponses courtes aux questions qui bloquent l'action"}
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

      <section className="panel panel-clean final-cta-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">{locale === "en-CA" ? "Ready to act?" : "Pret a agir ?"}</p>
            <h2>{locale === "en-CA" ? "Need a provider quickly or ready to offer your services?" : "Besoin d'un prestataire rapidement ou pret a proposer vos services ?"}</h2>
            <p className="section-copy">
              {locale === "en-CA"
                ? "Choose the path that matches your goal and move into the right funnel."
                : "Choisissez le parcours qui correspond a votre objectif et entrez dans le bon tunnel."}
            </p>
          </div>
        </div>
        <div className="cta-row">
          <button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">
            {locale === "en-CA" ? "Post a request now" : "Publier une demande maintenant"}
          </button>
          <button className="secondary-button" onClick={() => navigate(providerCtaHref)} type="button">
            {locale === "en-CA" ? "Activate provider space" : "Activer l'espace prestataire"}
          </button>
        </div>
      </section>
    </section>
  );
}
