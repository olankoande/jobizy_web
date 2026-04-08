import type {
  Category,
  Locale,
  ProviderProfile,
  PublicCityHighlight,
  PublicProviderHighlight,
  Review,
  Service,
  Zone,
} from "../types";

function svgDataUri(title: string, subtitle: string, colors: [string, string], accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480" role="img" aria-label="${title}">
    <defs>
      <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="${colors[0]}"/>
        <stop offset="100%" stop-color="${colors[1]}"/>
      </linearGradient>
    </defs>
    <rect width="720" height="480" rx="36" fill="url(#bg)"/>
    <circle cx="566" cy="94" r="86" fill="${accent}" opacity="0.16"/>
    <circle cx="146" cy="404" r="112" fill="#ffffff" opacity="0.12"/>
    <rect x="58" y="78" width="224" height="22" rx="11" fill="#ffffff" opacity="0.48"/>
    <rect x="58" y="122" width="324" height="88" rx="22" fill="#ffffff" opacity="0.22"/>
    <rect x="58" y="246" width="246" height="16" rx="8" fill="#ffffff" opacity="0.48"/>
    <rect x="58" y="278" width="188" height="16" rx="8" fill="#ffffff" opacity="0.3"/>
    <rect x="58" y="334" width="138" height="56" rx="18" fill="#ffffff" opacity="0.92"/>
    <text x="74" y="176" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700">${title}</text>
    <text x="74" y="370" fill="#17324d" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const visualMap = {
  "maison-entretien": svgDataUri("Home care", "Reliable teams", ["#0f3d56", "#2e8ca6"], "#ffce73"),
  "metiers-specialises": svgDataUri("Trades", "Licensed local pros", ["#133357", "#3a6799"], "#ffa35c"),
  "tech-numerique": svgDataUri("Tech support", "Remote and onsite", ["#173b4f", "#4ba0b8"], "#93d6ff"),
  "cours-formation": svgDataUri("Tutoring", "Coaching that fits", ["#28453f", "#5d8f81"], "#ffd27a"),
  "nettoyage-residentiel": svgDataUri("Cleaning", "Move-in ready", ["#365f73", "#88c1d5"], "#fff4b3"),
  plomberie: svgDataUri("Plumbing", "Fast repairs", ["#173c74", "#5b8ac4"], "#a1e6ff"),
  "electricite-residentielle": svgDataUri("Electrical", "Install and upgrade", ["#433659", "#8b6cc6"], "#ffd36e"),
  "support-informatique": svgDataUri("IT help", "Devices restored", ["#274b63", "#69b0d2"], "#e7fbff"),
  "tutorat-scolaire": svgDataUri("School help", "Clear weekly progress", ["#3b4b36", "#7b9b67"], "#fff0b0"),
  "peinture-interieure": svgDataUri("Painting", "Clean finishes", ["#69452b", "#c28d5a"], "#ffe2b8"),
  "nettoyage-fin-de-bail": svgDataUri("Move-out clean", "Kitchen, bath and floors", ["#31556a", "#7cb7d0"], "#e8fbff"),
  "reparation-fuite-eau": svgDataUri("Leak repair", "Same-day availability", ["#1d3d74", "#6d9cde"], "#bde4ff"),
  "installation-borne-ve": svgDataUri("EV charger", "Home installation", ["#2c3f57", "#4e7ea8"], "#90ffd4"),
  "tutorat-mathematiques-secondaire": svgDataUri("Math tutoring", "Weekly sessions", ["#415133", "#85ad58"], "#fff0a0"),
  "depannage-ordinateur-portable": svgDataUri("Laptop repair", "Faster devices", ["#20465d", "#56a0bb"], "#b8effd"),
  "peinture-appartement-3-1-2": svgDataUri("Apartment paint", "One-day refresh", ["#785436", "#d09163"], "#fff1d7"),
} as const;

export function getVisualForSlug(slug?: string | null) {
  if (!slug) return visualMap["maison-entretien"];
  return visualMap[slug as keyof typeof visualMap] ?? visualMap["maison-entretien"];
}

export function getCategoryImage(category?: Category | null) {
  if (!category) return getVisualForSlug();
  return category.image_url || getVisualForSlug(category.slug);
}

export function getServiceImage(service?: Service | null) {
  if (!service) return getVisualForSlug();
  return service.image_url || getVisualForSlug(service.slug);
}

export function getCitySpotlights(locale: Locale, zones: Zone[]) {
  const seededCities = zones
    .filter((zone): zone is Zone => Boolean(zone))
    .filter((zone) => zone.type === "city")
    .slice(0, 3)
    .map((zone) => ({
      key: zone.name.toLowerCase(),
      city: zone.name,
      promise:
        zone.marketing_blurb ||
        (locale === "en-CA" ? "Local provider coverage with trusted response times." : "Couverture locale avec des temps de reponse fiables."),
      neighborhood: locale === "en-CA" ? "Local provider network" : "Reseau prestataire local",
      zoneId: zone.id,
      image: zone.image_url || svgDataUri(zone.name, "Local coverage", ["#17324d", "#43739e"], "#ffd06e"),
    }));

  if (seededCities.length > 0) return seededCities;

  const zoneByName = new Map(zones.map((zone) => [zone.name.toLowerCase(), zone]));
  const base = [
    {
      key: "montreal",
      city: locale === "en-CA" ? "Montreal" : "Montreal",
      promise: locale === "en-CA" ? "Fast-moving local demand for urgent trades and home care." : "Demande locale rapide pour les urgences, l'entretien et les travaux.",
      neighborhood: locale === "en-CA" ? "Plateau, Rosemont, Verdun" : "Plateau, Rosemont, Verdun",
    },
    {
      key: "laval",
      city: locale === "en-CA" ? "Laval" : "Laval",
      promise: locale === "en-CA" ? "Trusted providers for family homes, condos and recurring services." : "Prestataires de confiance pour maisons familiales, condos et services recurrents.",
      neighborhood: locale === "en-CA" ? "Chomedey, Sainte-Dorothee" : "Chomedey, Sainte-Dorothee",
    },
    {
      key: "quebec city",
      city: locale === "en-CA" ? "Quebec City" : "Quebec",
      promise: locale === "en-CA" ? "Planned projects, painting and tutoring with clear scheduling." : "Projets planifies, peinture et tutorat avec des delais clairs.",
      neighborhood: locale === "en-CA" ? "Sainte-Foy, Montcalm" : "Sainte-Foy, Montcalm",
    },
  ];

  return base.map((item) => {
    const zone = zoneByName.get(item.key);
    return {
      ...item,
      zoneId: zone?.id ?? null,
      image: svgDataUri(item.city, item.neighborhood, ["#17324d", "#43739e"], "#ffd06e"),
    };
  });
}

export function getPublicTrustStats(locale: Locale, services: Service[], zones: Zone[], providerProfile: ProviderProfile | null) {
  return [
    {
      value: `${Math.max(24, services.length * 6)}+`,
      label: locale === "en-CA" ? "active providers" : "prestataires actifs",
    },
    {
      value: `${Math.max(8, zones.filter((zone) => zone.type === "city").length)}`,
      label: locale === "en-CA" ? "cities covered" : "villes couvertes",
    },
    {
      value: providerProfile ? `${Math.max(4.8, providerProfile.rating_avg || 0).toFixed(1)}/5` : "4.9/5",
      label: locale === "en-CA" ? "average satisfaction" : "satisfaction moyenne",
    },
  ];
}

export function getFaqItems(locale: Locale) {
  if (locale === "en-CA") {
    return [
      { q: "How do I find a provider near me?", a: "Start with the service and city. Jobizy highlights providers active in your area and surfaces local availability first." },
      { q: "Can I compare quotes before choosing?", a: "Yes. Quotes are shown side by side with pricing, timing, ratings, and a short message from each provider." },
      { q: "What makes a provider trustworthy?", a: "Public profiles, verification status, review volume, response speed, and local coverage all stay visible during the journey." },
    ];
  }

  return [
    { q: "Comment trouver un prestataire pres de chez moi ?", a: "Commencez par le service et la ville. Jobizy met en avant les pros actifs dans votre zone avec une disponibilite locale visible." },
    { q: "Puis-je comparer plusieurs offres avant de choisir ?", a: "Oui. Les offres sont affichees cote a cote avec prix, delai, note et message du prestataire." },
    { q: "Qu'est-ce qui rend un prestataire credible ?", a: "Le profil public, le statut de verification, les avis, la rapidite de reponse et la couverture locale restent visibles pendant tout le parcours." },
  ];
}

export function getCostGuides(locale: Locale) {
  if (locale === "en-CA") {
    return [
      { title: "Leak repair cost guide", body: "Typical ranges, timing, and what changes the quote.", cta: "View guide" },
      { title: "Move-out cleaning checklist", body: "The rooms, finish level and add-ons tenants ask for most.", cta: "Read checklist" },
      { title: "Interior painting prep", body: "How to scope a one-day refresh and compare providers fairly.", cta: "Explore tips" },
    ];
  }

  return [
    { title: "Guide de prix fuite d'eau", body: "Fourchettes habituelles, delais et facteurs qui font varier le devis.", cta: "Voir le guide" },
    { title: "Checklist nettoyage fin de bail", body: "Les pieces, niveaux de finition et options les plus demandes.", cta: "Lire la checklist" },
    { title: "Preparation peinture interieure", body: "Comment cadrer un rafraichissement rapide et comparer les devis.", cta: "Voir les conseils" },
  ];
}

export function getPublicTestimonials(locale: Locale) {
  if (locale === "en-CA") {
    return [
      { quote: "We found a serious plumber in less than an hour and the quote comparison was easy to trust.", author: "Sophie, Montreal", role: "Client" },
      { quote: "The leads feel local and qualified. I can reply quickly without wasting time on low-fit requests.", author: "Alex, Laval", role: "Provider" },
      { quote: "The public pages feel clear enough that clients arrive with better briefs and fewer surprises.", author: "Nadia, Quebec City", role: "Property manager" },
    ];
  }

  return [
    { quote: "On a trouve un plombier serieux en moins d'une heure et la comparaison des offres etait vraiment claire.", author: "Sophie, Montreal", role: "Cliente" },
    { quote: "Les leads sont locaux et qualifies. Je peux repondre vite sans perdre du temps sur des demandes peu pertinentes.", author: "Alex, Laval", role: "Prestataire" },
    { quote: "Les pages publiques sont assez claires pour que les clients arrivent avec un meilleur brief et moins d'incertitudes.", author: "Nadia, Quebec", role: "Gestionnaire immobiliere" },
  ];
}

export function getProviderSpotlights(locale: Locale, reviews: Review[] = []) {
  if (reviews.length > 50) {
    return [];
  }
  const spotlightBase = [
    {
      name: "Alex Plomberie Express",
      specialtyFr: "Plomberie d'urgence",
      specialtyEn: "Emergency plumbing",
      cityFr: "Montreal et Laval",
      cityEn: "Montreal and Laval",
      responseFr: "Reponse moyenne en 18 min",
      responseEn: "Average reply in 18 min",
      rating: reviews[0]?.rating ? "5.0" : "4.9",
      jobs: "120+",
      image: svgDataUri("Alex", "Plumbing team", ["#173c74", "#5d8ed8"], "#ffe6a3"),
    },
    {
      name: "Carla Clean Studio",
      specialtyFr: "Nettoyage residentiel",
      specialtyEn: "Residential cleaning",
      cityFr: "Laval et Montreal",
      cityEn: "Laval and Montreal",
      responseFr: "Devis sous 30 min",
      responseEn: "Quotes in under 30 min",
      rating: "4.8",
      jobs: "90+",
      image: svgDataUri("Carla", "Cleaning crew", ["#285b6d", "#83bfd2"], "#fdf5b3"),
    },
    {
      name: "Samuel Peinture Pro",
      specialtyFr: "Peinture interieure",
      specialtyEn: "Interior painting",
      cityFr: "Quebec et Rive-Sud",
      cityEn: "Quebec City and South Shore",
      responseFr: "Photos de chantier partagees",
      responseEn: "Project photos shared",
      rating: "4.9",
      jobs: "70+",
      image: svgDataUri("Samuel", "Painting finish", ["#734e31", "#c99467"], "#fff1c8"),
    },
  ];

  return spotlightBase.map((item) => ({
    name: item.name,
    specialty: locale === "en-CA" ? item.specialtyEn : item.specialtyFr,
    city: locale === "en-CA" ? item.cityEn : item.cityFr,
    response: locale === "en-CA" ? item.responseEn : item.responseFr,
    rating: item.rating,
    jobs: item.jobs,
    image: item.image,
  }));
}

export function mapPublicProviderSpotlights(locale: Locale, providers: PublicProviderHighlight[]) {
  if (providers.length === 0) return [];
  return providers
    .filter((provider): provider is PublicProviderHighlight => Boolean(provider))
    .slice(0, 3)
    .map((provider) => ({
    name: provider.display_name || provider.business_name || "Provider",
    specialty: provider.services[0] || (locale === "en-CA" ? "Local services" : "Services locaux"),
    city: provider.zones.join(", ") || (locale === "en-CA" ? "Covered city" : "Ville couverte"),
    response:
      provider.response_time_avg_minutes != null
        ? locale === "en-CA"
          ? `Average reply in ${provider.response_time_avg_minutes} min`
          : `Reponse moyenne en ${provider.response_time_avg_minutes} min`
        : locale === "en-CA"
          ? "Fast local response"
          : "Reponse locale rapide",
    rating: `${Number(provider.rating_avg || 0).toFixed(1)}`,
    jobs: `${provider.completed_missions_count}+`,
    image: provider.cover_url || provider.logo_url || svgDataUri(provider.display_name || "Provider", provider.services[0] || "Service", ["#17324d", "#43739e"], "#ffd06e"),
  }));
}

export function mapPublicCitySpotlights(locale: Locale, cities: PublicCityHighlight[]) {
  if (cities.length === 0) return [];
  return cities
    .filter((city): city is PublicCityHighlight => Boolean(city))
    .slice(0, 3)
    .map((city) => ({
    city: city.name,
    promise:
      city.marketing_blurb ||
      (locale === "en-CA"
        ? `${city.provider_count} local providers available in this area.`
        : `${city.provider_count} prestataires locaux disponibles dans cette zone.`),
    neighborhood: city.top_services.join(", ") || (locale === "en-CA" ? "Local services" : "Services locaux"),
    zoneId: city.id,
    image: city.image_url || svgDataUri(city.name, "Local services", ["#17324d", "#43739e"], "#ffd06e"),
  }));
}
