import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { AppIcon, type AppIconName } from "../../app/AppIcon";
import { CategoryIcon } from "../../app/CategoryIcon";
import {
  getFaqItems,
  getProviderSpotlights,
  getPublicTestimonials,
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
  const [heroQuery, setHeroQuery] = useState("");
  const [heroCity, setHeroCity] = useState("");

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

  const heroStats: { value: string; label: string; icon: AppIconName }[] = [
    { value: String(services.length || featuredServices.length), label: locale === "en-CA" ? "services available" : "services disponibles", icon: "requests" },
    { value: String(categories.length), label: locale === "en-CA" ? "categories" : "catégories", icon: "spark" },
    { value: String(cityOptions.length), label: locale === "en-CA" ? "cities covered" : "villes couvertes", icon: "location" },
    { value: locale === "en-CA" ? "Direct" : "Direct", label: locale === "en-CA" ? "payment with your provider" : "paiement avec votre prestataire", icon: "wallet" },
  ];

  const requestTarget = `/${locale}/app/demandes`;
  const requestCtaHref = session ? requestTarget : `/${locale}/inscription?next=${encodeURIComponent(requestTarget)}`;
  const providerCtaHref = session ? `/${locale}/pro` : `/${locale}/devenir-prestataire`;

  return (
    <section className="stack stack-xl public-home">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-hero-badge">
            <AppIcon className="button-icon" name="check" />
            {locale === "en-CA" ? "Verified local providers" : "Prestataires locaux vérifiés"}
          </span>
          <h1>{locale === "en-CA" ? "Find the right provider for all your needs" : "Trouvez le bon prestataire pour tous vos besoins"}</h1>
          <p className="home-hero-sub">
            {locale === "en-CA"
              ? "Jobizy connects you with trusted professionals, close to home."
              : "Jobizy vous met en relation avec des professionnels de confiance, près de chez vous."}
          </p>

          <form
            className="home-search"
            onSubmit={(event) => {
              event.preventDefault();
              const params = new URLSearchParams();
              if (heroQuery.trim()) params.set("q", heroQuery.trim());
              if (heroCity) params.set("ville", heroCity);
              const qs = params.toString();
              navigate(`/${locale}/recherche${qs ? `?${qs}` : ""}`);
            }}
            role="search"
          >
            <label className="home-search-field">
              <AppIcon className="button-icon" name="search" />
              <input
                aria-label={locale === "en-CA" ? "Which service are you looking for?" : "Quel service recherchez-vous ?"}
                id="home-search-query"
                onChange={(event) => setHeroQuery(event.target.value)}
                placeholder={locale === "en-CA" ? "Which service are you looking for?" : "Quel service recherchez-vous ?"}
                value={heroQuery}
              />
            </label>
            <label className="home-search-field home-search-city">
              <AppIcon className="button-icon" name="location" />
              <select
                aria-label={locale === "en-CA" ? "Your city" : "Votre ville"}
                id="home-search-city"
                onChange={(event) => setHeroCity(event.target.value)}
                value={heroCity}
              >
                <option value="">{locale === "en-CA" ? "Your city" : "Votre ville"}</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>
            <button aria-label={locale === "en-CA" ? "Search" : "Rechercher"} className="home-search-submit" type="submit">
              <AppIcon className="button-icon" name="search" />
            </button>
          </form>

          <div className="home-hero-cta">
            <button className="primary-button" onClick={() => navigate(requestCtaHref)} type="button">
              {locale === "en-CA" ? "Post a request" : "Publier une demande"}
            </button>
            <button className="outline-button" onClick={() => navigate(providerCtaHref)} type="button">
              {locale === "en-CA" ? "Become a provider" : "Devenir prestataire"}
            </button>
          </div>
        </div>

        <div aria-hidden="true" className="home-hero-visual">
          <span className="hv-shape hv-shape-orange" />
          <span className="hv-shape hv-shape-blue" />
          <div className="hv-card hv-card-main">
            <span className="hv-check"><AppIcon name="check" /></span>
            <div>
              <strong>{locale === "en-CA" ? "Request posted" : "Demande publiée"}</strong>
              <small>{locale === "en-CA" ? "Offers are on their way" : "Les offres arrivent"}</small>
            </div>
          </div>
          <div className="hv-card hv-card-offer">
            <span className="hv-avatar">AP</span>
            <div>
              <strong>{locale === "en-CA" ? "New offer" : "Nouvelle offre"}</strong>
              <small>{locale === "en-CA" ? "Price, timing and reviews" : "Prix, délai et avis"}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="home-categories" aria-label={locale === "en-CA" ? "Popular categories" : "Catégories populaires"}>
        {featuredCategories.map((category) => (
          <button className="home-category" key={category.id} onClick={() => navigate(`/${locale}/categories`)} type="button">
            <CategoryIcon icon={category.icon} size={26} />
            <span>{category.name}</span>
          </button>
        ))}
        <button className="home-category home-category-more" onClick={() => navigate(`/${locale}/categories`)} type="button">
          <span className="home-category-dots">•••</span>
          <span>{locale === "en-CA" ? "And more" : "Et bien plus…"}</span>
        </button>
      </section>

      <section className="home-stats">
        {heroStats.map((item) => (
          <div className="home-stat" key={item.label}>
            <AppIcon className="home-stat-icon" name={item.icon} />
            <div>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          </div>
        ))}
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
          title={locale === "en-CA" ? "A simple path for clients, a clear opportunity for providers" : "Un parcours simple pour les clients, une vraie opportunité pour les prestataires"}
          body={locale === "en-CA"
            ? "Choose your side: post a request as a client, or grow your activity as a provider."
            : "Choisissez votre côté : publier une demande en tant que client, ou développer votre activité en tant que prestataire."}
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
            ? "Browse by category to find the right service quickly."
            : "Parcourez les catégories pour trouver rapidement le bon service."}
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
          title={locale === "en-CA" ? "Why people choose Jobizy" : "Pourquoi choisir Jobizy"}
          body={locale === "en-CA"
            ? "Speed, easy comparison and trust, from the first request."
            : "Rapidité, comparaison facile et confiance, dès la première demande."}
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
          title={locale === "en-CA" ? "Providers near you" : "Des prestataires près de chez vous"}
          body={locale === "en-CA"
            ? "Reviews, verification and response time are visible on every profile."
            : "Avis, vérification et délai de réponse sont visibles sur chaque profil."}
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
          title={locale === "en-CA" ? "Jobizy in numbers" : "Jobizy en chiffres"}
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
            ? "Pick the plan that matches your activity."
            : "Choisissez le plan qui correspond à votre activité."}
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
          title={locale === "en-CA" ? "Your safety and peace of mind" : "Votre sécurité et votre tranquillité d'esprit"}
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
          title={locale === "en-CA" ? "Frequently asked questions" : "Questions fréquentes"}
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
