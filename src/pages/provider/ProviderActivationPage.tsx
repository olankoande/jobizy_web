import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { activateProvider, addAvailability, addProviderService, addProviderZone, activateProviderProfileStatus, patchProviderProfile, ApiResponseError } from "../../lib/api";
import { useApp } from "../../app/AppProvider";
import { EmptyState, SectionIntro, StatCard } from "../shared/Shared";

type ProviderStep = "benefits" | "services" | "zones" | "profile" | "availability" | "review";

type ProviderDraft = {
  serviceIds: string[];
  zoneIds: string[];
  displayName: string;
  businessName: string;
  description: string;
  experience: string;
  photoNames: string[];
  weekdayIds: number[];
  startTime: string;
  endTime: string;
  allWeek: boolean;
};

const PROVIDER_DRAFT_KEY = "jobizy_provider_activation_draft";
const providerSteps: Array<{ id: ProviderStep; fr: string; en: string }> = [
  { id: "benefits", fr: "Promesse", en: "Promise" },
  { id: "services", fr: "Services", en: "Services" },
  { id: "zones", fr: "Zone", en: "Coverage" },
  { id: "profile", fr: "Profil", en: "Profile" },
  { id: "availability", fr: "Disponibilite", en: "Availability" },
  { id: "review", fr: "Validation", en: "Review" },
];

function createDefaultDraft(): ProviderDraft {
  return {
    serviceIds: [],
    zoneIds: [],
    displayName: "",
    businessName: "",
    description: "",
    experience: "",
    photoNames: [],
    weekdayIds: [1, 2, 3, 4, 5],
    startTime: "08:00",
    endTime: "17:00",
    allWeek: false,
  };
}

function normalizeProviderDraft(raw: string | null): ProviderDraft {
  if (!raw) return createDefaultDraft();

  try {
    const parsed = JSON.parse(raw) as Partial<ProviderDraft>;
    return {
      ...createDefaultDraft(),
      ...parsed,
      serviceIds: Array.isArray(parsed.serviceIds) ? parsed.serviceIds.filter(Boolean) : [],
      zoneIds: Array.isArray(parsed.zoneIds) ? parsed.zoneIds.filter(Boolean) : [],
      photoNames: Array.isArray(parsed.photoNames) ? parsed.photoNames.filter(Boolean) : [],
      weekdayIds: Array.isArray(parsed.weekdayIds)
        ? parsed.weekdayIds.filter((value): value is number => typeof value === "number")
        : [1, 2, 3, 4, 5],
      allWeek: parsed.allWeek === true,
    };
  } catch {
    return createDefaultDraft();
  }
}

function weekdayLabel(day: number, locale: string) {
  const fr = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return locale === "en-CA" ? en[day] : fr[day];
}

function buildProviderDescription(draft: ProviderDraft, locale: string) {
  const parts = [draft.description.trim()];
  if (draft.experience.trim()) {
    parts.push(locale === "en-CA" ? `Experience: ${draft.experience.trim()}` : `Experience: ${draft.experience.trim()}`);
  }
  if (draft.photoNames.length > 0) {
    parts.push(locale === "en-CA" ? `Photo assets prepared: ${draft.photoNames.join(", ")}` : `Photos preparees: ${draft.photoNames.join(", ")}`);
  }
  return parts.filter(Boolean).join("\n\n");
}

export function ProviderActivationPage() {
  const navigate = useNavigate();
  const {
    locale,
    session,
    services,
    zones,
    plans,
    matches,
    providerProfile,
    subscribeToPlan,
    refresh,
  } = useApp();
  const [currentStep, setCurrentStep] = useState<ProviderStep>("benefits");
  const [draft, setDraft] = useState<ProviderDraft>(() =>
    normalizeProviderDraft(window.localStorage.getItem(`${PROVIDER_DRAFT_KEY}_${locale}`)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [activationRefreshWarning, setActivationRefreshWarning] = useState("");
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);

  const cityZones = useMemo(() => zones.filter((zone) => zone.type === "city"), [zones]);
  const selectedServices = useMemo(() => services.filter((service) => draft.serviceIds.includes(service.id)), [draft.serviceIds, services]);
  const selectedZones = useMemo(() => cityZones.filter((zone) => draft.zoneIds.includes(zone.id)), [cityZones, draft.zoneIds]);
  const descriptionPayload = useMemo(() => buildProviderDescription(draft, locale), [draft, locale]);
  const currentStepIndex = providerSteps.findIndex((step) => step.id === currentStep);
  const visibleMatches = matches.slice(0, 5);

  useEffect(() => {
    setDraft(normalizeProviderDraft(window.localStorage.getItem(`${PROVIDER_DRAFT_KEY}_${locale}`)));
    setCurrentStep("benefits");
    setActivated(false);
    setActivationRefreshWarning("");
    setMaxReachedIndex(0);
  }, [locale]);

  useEffect(() => {
    setMaxReachedIndex((prev) => Math.max(prev, currentStepIndex));
  }, [currentStepIndex]);

  useEffect(() => {
    if (providerProfile) {
      setDraft((current) => ({
        ...current,
        displayName: current.displayName || providerProfile.display_name || "",
        businessName: current.businessName || providerProfile.business_name || "",
        description: current.description || providerProfile.description || "",
      }));
    }
  }, [providerProfile]);

  useEffect(() => {
    window.localStorage.setItem(`${PROVIDER_DRAFT_KEY}_${locale}`, JSON.stringify(draft));
  }, [draft, locale]);

  function updateDraft(patch: Partial<ProviderDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleInList(key: "serviceIds" | "zoneIds", value: string) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  function toggleWeekday(day: number) {
    setDraft((current) => ({
      ...current,
      weekdayIds: current.weekdayIds.includes(day)
        ? current.weekdayIds.filter((item) => item !== day)
        : [...current.weekdayIds, day].sort((a, b) => a - b),
    }));
  }

  function isStepComplete(step: ProviderStep) {
    switch (step) {
      case "benefits":
        return true;
      case "services":
        return draft.serviceIds.length > 0;
      case "zones":
        return draft.zoneIds.length > 0;
      case "profile":
        return Boolean(draft.displayName.trim() && draft.businessName.trim() && draft.description.trim().length > 0);
      case "availability":
        return draft.allWeek || (draft.weekdayIds.length > 0 && draft.startTime < draft.endTime);
      case "review":
        return (
          draft.serviceIds.length > 0 &&
          draft.zoneIds.length > 0 &&
          Boolean(draft.displayName.trim() && draft.businessName.trim() && draft.description.trim().length > 0) &&
          (draft.allWeek || (draft.weekdayIds.length > 0 && draft.startTime < draft.endTime))
        );
      default:
        return false;
    }
  }

  function moveStep(direction: "next" | "prev") {
    const nextIndex = direction === "next" ? currentStepIndex + 1 : currentStepIndex - 1;
    const boundedIndex = Math.max(0, Math.min(providerSteps.length - 1, nextIndex));
    setCurrentStep(providerSteps[boundedIndex].id);
  }

  async function handleActivation() {
    if (!session || !isStepComplete("review")) return;

    setIsSubmitting(true);
    setActivationError("");
    setActivationRefreshWarning("");
    try {
      // Step 1: Activate provider role (idempotent – creates profile if missing)
      await activateProvider(session, locale);

      // Step 2: Save profile details directly (no internal refresh)
      await patchProviderProfile(session, locale, {
        display_name: draft.displayName.trim(),
        business_name: draft.businessName.trim(),
        description: descriptionPayload,
      });

      // Step 3: Add services (ignore duplicates on re-runs)
      for (const serviceId of draft.serviceIds) {
        try {
          await addProviderService(session, locale, serviceId);
        } catch (err) {
          if (!(err instanceof ApiResponseError && err.httpStatus === 409)) throw err;
        }
      }

      // Step 4: Add zones (ignore duplicates on re-runs)
      for (const zoneId of draft.zoneIds) {
        try {
          await addProviderZone(session, locale, zoneId);
        } catch (err) {
          if (!(err instanceof ApiResponseError && err.httpStatus === 409)) throw err;
        }
      }

      // Step 5: Add availability slots
      const weekdays = draft.allWeek ? [0, 1, 2, 3, 4, 5, 6] : draft.weekdayIds;
      for (const weekday of weekdays) {
        try {
          await addAvailability(session, locale, {
            weekday,
            start_time: `${draft.startTime}:00`,
            end_time: `${draft.endTime}:00`,
            is_active: true,
          });
        } catch (err) {
          if (!(err instanceof ApiResponseError && err.httpStatus === 409)) throw err;
        }
      }

      // Step 6: Final status activation
      await activateProviderProfileStatus(session, locale);

      setActivated(true);
      setCurrentStep("review");
      window.localStorage.removeItem(`${PROVIDER_DRAFT_KEY}_${locale}`);

      // Refreshing afterwards should not hide a successful activation.
      try {
        await refresh();
      } catch {
        setActivationRefreshWarning(
          locale === "en-CA"
            ? "Your provider profile is active, but some dashboard data could not be refreshed right away."
            : "Votre profil prestataire est actif, mais certaines donnees n'ont pas pu etre rafraichies tout de suite.",
        );
      }
    } catch (err: any) {
      setActivationError(err?.message ?? (locale === "en-CA" ? "Activation failed. Please check your profile." : "Activation échouée. Veuillez vérifier votre profil."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const benefitBlocks = locale === "en-CA"
    ? [
        "Receive qualified requests close to your area",
        "Reply directly to clients with clear context",
        "Grow revenue at your own pace",
      ]
    : [
        "Recevez des demandes qualifiees pres de chez vous",
        "Repondez directement aux clients avec un contexte clair",
        "Developpez vos revenus a votre rythme",
      ];

  const socialProof = locale === "en-CA"
    ? [
        { label: "Active providers", value: `+${Math.max(1000, services.length * 20)}` },
        { label: "New leads today", value: `${Math.max(5, matches.length || 5)}` },
        { label: "Visible local ROI", value: "4.8/5" },
      ]
    : [
        { label: "Prestataires actifs", value: `+${Math.max(1000, services.length * 20)}` },
        { label: "Nouveaux leads aujourd'hui", value: `${Math.max(5, matches.length || 5)}` },
        { label: "ROI local visible", value: "4.8/5" },
      ];

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Provider activation" : "Activation prestataire"}
          title={locale === "en-CA" ? "Gain clients with Jobizy" : "Gagnez des clients avec Jobizy"}
          body={locale === "en-CA" ? "Receive requests from nearby clients, activate your profile quickly and move naturally toward the right plan as volume grows." : "Recevez des demandes de clients proches, activez votre profil rapidement et avancez naturellement vers le bon plan a mesure que le volume augmente."}
          aside={
            <button className="primary-button" onClick={() => setCurrentStep("services")} type="button">
              {locale === "en-CA" ? "Activate my provider profile" : "Activer mon profil prestataire"}
            </button>
          }
        />

        <div className="hero-panel">
          {socialProof.map((item, index) => (
            <StatCard
              detail={index === 0 ? (locale === "en-CA" ? "Marketplace traction" : "Traction marketplace") : index === 1 ? (locale === "en-CA" ? "Immediate opportunities" : "Opportunites immediates") : (locale === "en-CA" ? "Trust signal" : "Signal de confiance")}
              key={item.label}
              label={item.label}
              tone={index === 1 ? "action" : index === 2 ? "trust" : "info"}
              value={item.value}
            />
          ))}
        </div>

        <div className="two-up">
          <article className="tabular-card tabular-card-soft">
            <p className="eyebrow">{locale === "en-CA" ? "What you gain" : "Ce que vous gagnez"}</p>
            <div className="assistant-list">
              {benefitBlocks.map((item) => (
                <div className="assistant-item" key={item}>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="tabular-card tabular-card-soft">
            <p className="eyebrow">{locale === "en-CA" ? "Why this feels safe" : "Pourquoi c'est rassurant"}</p>
            <div className="assistant-list">
              <div className="assistant-item"><span>{locale === "en-CA" ? "One account, quick activation, no technical setup" : "Un seul compte, activation rapide, pas de mise en place technique"}</span></div>
              <div className="assistant-item"><span>{locale === "en-CA" ? "Start free, upgrade only when the opportunity is visible" : "Commencez gratuitement, upgradez seulement quand l'opportunite est visible"}</span></div>
              <div className="assistant-item"><span>{locale === "en-CA" ? "See demand immediately after activation" : "Voyez la demande juste apres l'activation"}</span></div>
            </div>
          </article>
        </div>
      </section>

      <section className="panel panel-clean request-builder-wizard">
        <div className="wizard-progress-shell">
          <div className="wizard-progress-header">
            <strong>{locale === "en-CA" ? `Step ${currentStepIndex + 1} of ${providerSteps.length}` : `Etape ${currentStepIndex + 1} sur ${providerSteps.length}`}</strong>
            <span>{locale === "en-CA" ? `${providerSteps.filter((step) => isStepComplete(step.id)).length} completed` : `${providerSteps.filter((step) => isStepComplete(step.id)).length} etapes completees`}</span>
          </div>
          <div aria-hidden="true" className="wizard-progress-track">
            <span className="wizard-progress-fill" style={{ width: `${((currentStepIndex + 1) / providerSteps.length) * 100}%` }} />
          </div>
          <div className="wizard-step-pills">
            {providerSteps.map((step, index) => (
              <button
                className={step.id === currentStep ? "wizard-step-pill wizard-step-pill-active" : "wizard-step-pill"}
                disabled={index > maxReachedIndex + 1}
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                type="button"
              >
                <span>{index + 1}</span>
                {locale === "en-CA" ? step.en : step.fr}
              </button>
            ))}
          </div>
        </div>

        <div className="request-wizard-layout">
          <section className="wizard-main-panel">
            {currentStep === "benefits" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "This is a business opportunity, not just a technical setup" : "C'est une opportunite business, pas juste une action technique"}</strong>
                  <p>{locale === "en-CA" ? "Jobizy is here to help you capture local demand, build trust and move toward recurring revenue." : "Jobizy est la pour vous aider a capter la demande locale, creer de la confiance et aller vers un revenu recurrent."}</p>
                </div>
                <div className="steps-rail">
                  <article className="step-card-pro"><span>01</span><strong>{locale === "en-CA" ? "Activate your provider side" : "Activez votre espace prestataire"}</strong><p>{locale === "en-CA" ? "A few focused steps replace the old flat setup form." : "Quelques etapes ciblees remplacent l'ancien formulaire plat."}</p></article>
                  <article className="step-card-pro"><span>02</span><strong>{locale === "en-CA" ? "Show what you do and where" : "Montrez ce que vous faites et ou"}</strong><p>{locale === "en-CA" ? "Services, city and availability shape the matching quality." : "Services, ville et disponibilite structurent la qualite du matching."}</p></article>
                  <article className="step-card-pro"><span>03</span><strong>{locale === "en-CA" ? "See leads and choose your plan" : "Voyez les leads et choisissez votre plan"}</strong><p>{locale === "en-CA" ? "Immediate visibility makes the upgrade path easier to justify." : "Une visibilite immediate rend l'upgrade plus facile a justifier."}</p></article>
                </div>
              </div>
            ) : null}

            {currentStep === "services" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "Which services do you offer?" : "Quels services proposez-vous ?"}</strong>
                  <p>{locale === "en-CA" ? "Select the offers you want Jobizy to match first. Start narrow, then expand later." : "Selectionnez les offres que Jobizy doit matcher en premier. Commencez simple, puis elargissez plus tard."}</p>
                </div>
                <div className="wizard-choice-grid">
                  {services.slice(0, 12).map((service) => (
                    <button
                      className={draft.serviceIds.includes(service.id) ? "wizard-choice-card wizard-choice-card-active" : "wizard-choice-card"}
                      key={service.id}
                      onClick={() => toggleInList("serviceIds", service.id)}
                      type="button"
                    >
                      <strong>{service.name}</strong>
                      <span>{service.marketing_title || service.description || (locale === "en-CA" ? "Qualified demand" : "Demande qualifiee")}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStep === "zones" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "Where do you want to receive requests?" : "Ou voulez-vous recevoir des demandes ?"}</strong>
                  <p>{locale === "en-CA" ? "Choose the cities where you can intervene. This is what makes the demand feel relevant from day one." : "Choisissez les villes ou vous pouvez intervenir. C'est ce qui rend la demande pertinente des le premier jour."}</p>
                </div>
                <div className="wizard-choice-grid wizard-choice-grid-compact">
                  {cityZones.slice(0, 12).map((zone) => (
                    <button
                      className={draft.zoneIds.includes(zone.id) ? "wizard-choice-card wizard-choice-card-active" : "wizard-choice-card"}
                      key={zone.id}
                      onClick={() => toggleInList("zoneIds", zone.id)}
                      type="button"
                    >
                      <strong>{zone.name}</strong>
                      <span>{zone.marketing_blurb || (locale === "en-CA" ? "Active local demand" : "Demande locale active")}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStep === "profile" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "Build a profile clients can trust" : "Construisez un profil auquel les clients font confiance"}</strong>
                  <p>{locale === "en-CA" ? "Keep it short and commercial: what you do, your experience and why clients can feel safe choosing you." : "Restez court et commercial : ce que vous faites, votre experience et pourquoi le client peut vous choisir en confiance."}</p>
                </div>
                <div className="form-grid form-grid-pro">
                  <label>
                    <span>{locale === "en-CA" ? "Public name" : "Nom public"}</span>
                    <input onChange={(event) => updateDraft({ displayName: event.target.value })} value={draft.displayName} />
                  </label>
                  <label>
                    <span>{locale === "en-CA" ? "Business name" : "Nom d'entreprise"}</span>
                    <input onChange={(event) => updateDraft({ businessName: event.target.value })} value={draft.businessName} />
                  </label>
                  <label>
                    <span>{locale === "en-CA" ? "Experience" : "Experience"}</span>
                    <input onChange={(event) => updateDraft({ experience: event.target.value })} placeholder={locale === "en-CA" ? "5 years in residential repairs" : "5 ans en reparation residentielle"} value={draft.experience} />
                  </label>
                  <label>
                    <span>{locale === "en-CA" ? "Photo assets (optional)" : "Photos preparees (optionnel)"}</span>
                    <input multiple onChange={(event) => updateDraft({ photoNames: Array.from(event.target.files ?? []).map((file) => file.name) })} type="file" />
                  </label>
                  <label className="field-wide">
                    <span>
                      {locale === "en-CA" ? "Short description" : "Description courte"}
                      {" "}
                      <small style={{ fontWeight: "normal", opacity: 0.6 }}>
                        ({draft.description.trim().length}/20 {locale === "en-CA" ? "chars min" : "caractères min"})
                      </small>
                    </span>
                    <textarea onChange={(event) => updateDraft({ description: event.target.value })} placeholder={locale === "en-CA" ? "Example: fast plumbing repairs, careful finish, clear communication..." : "Ex. plomberie rapide, finition soignee, communication claire..."} value={draft.description} />
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === "availability" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "When are you usually available?" : "Quand etes-vous generalement disponible ?"}</strong>
                  <p>{locale === "en-CA" ? "You can keep it simple. The goal is to help Jobizy surface relevant requests fast." : "Vous pouvez rester simple. Le but est d'aider Jobizy a faire remonter vite les bonnes demandes."}</p>
                </div>
                <div className="wizard-suggestion-row">
                  <button className={draft.allWeek ? "nav-chip nav-chip-active" : "nav-chip"} onClick={() => updateDraft({ allWeek: !draft.allWeek })} type="button">
                    {locale === "en-CA" ? "Available all week" : "Disponible toute la semaine"}
                  </button>
                </div>
                <div className="wizard-choice-grid wizard-choice-grid-compact">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                    <button
                      className={draft.allWeek || draft.weekdayIds.includes(day) ? "wizard-choice-card wizard-choice-card-active" : "wizard-choice-card"}
                      disabled={draft.allWeek}
                      key={day}
                      onClick={() => toggleWeekday(day)}
                      type="button"
                    >
                      <strong>{weekdayLabel(day, locale)}</strong>
                      <span>{locale === "en-CA" ? "Receiving opportunities" : "Reception des opportunites"}</span>
                    </button>
                  ))}
                </div>
                <div className="form-grid form-grid-pro">
                  <label>
                    <span>{locale === "en-CA" ? "Start time" : "Heure de debut"}</span>
                    <input onChange={(event) => updateDraft({ startTime: event.target.value })} type="time" value={draft.startTime} />
                  </label>
                  <label>
                    <span>{locale === "en-CA" ? "End time" : "Heure de fin"}</span>
                    <input onChange={(event) => updateDraft({ endTime: event.target.value })} type="time" value={draft.endTime} />
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === "review" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "Validate your provider activation" : "Validez votre activation prestataire"}</strong>
                  <p>{locale === "en-CA" ? "This recap turns the setup into a business-ready profile instead of a technical checklist." : "Ce recapitulatif transforme la configuration en profil business plutot qu'en simple checklist technique."}</p>
                </div>
                <div className="review-grid">
                  <article className="tabular-card tabular-card-soft">
                    <strong>{draft.displayName || (locale === "en-CA" ? "Your public identity" : "Votre identite publique")}</strong>
                    <p>{descriptionPayload || (locale === "en-CA" ? "Add a sharper description before activation." : "Ajoutez une description plus nette avant l'activation.")}</p>
                  </article>
                  <article className="tabular-card tabular-card-soft">
                    <div className="tabular-row"><strong>{locale === "en-CA" ? "Services" : "Services"}</strong><span>{selectedServices.map((item) => item.name).join(", ") || "-"}</span></div>
                    <div className="tabular-row"><strong>{locale === "en-CA" ? "Cities" : "Villes"}</strong><span>{selectedZones.map((item) => item.name).join(", ") || "-"}</span></div>
                    <div className="tabular-row"><strong>{locale === "en-CA" ? "Availability" : "Disponibilite"}</strong><span>{draft.allWeek ? (locale === "en-CA" ? "All week" : "Toute la semaine") : draft.weekdayIds.map((day) => weekdayLabel(day, locale)).join(", ")}</span></div>
                    <div className="tabular-row"><strong>{locale === "en-CA" ? "Hours" : "Horaires"}</strong><span>{draft.startTime} - {draft.endTime}</span></div>
                  </article>
                </div>
              </div>
            ) : null}

            {activationError && <p className="notice notice-error">{activationError}</p>}
            <div className="wizard-footer">
              <button className="ghost-button" disabled={currentStepIndex === 0} onClick={() => moveStep("prev")} type="button">
                {locale === "en-CA" ? "Back" : "Retour"}
              </button>
              <div className="wizard-footer-actions">
                <button
                  className="ghost-button"
                  onClick={() => {
                    window.localStorage.removeItem(`${PROVIDER_DRAFT_KEY}_${locale}`);
                    setDraft(createDefaultDraft());
                    setCurrentStep("benefits");
                    setActivated(false);
                    setActivationError("");
                    setMaxReachedIndex(0);
                  }}
                  type="button"
                >
                  {locale === "en-CA" ? "Reset draft" : "Reinitialiser le brouillon"}
                </button>
                {currentStep !== "review" ? (
                  <button className="primary-button" disabled={!isStepComplete(currentStep)} onClick={() => moveStep("next")} type="button">
                    {locale === "en-CA" ? "Continue" : "Continuer"}
                  </button>
                ) : (
                  <button className="primary-button" disabled={!isStepComplete("review") || isSubmitting} onClick={() => void handleActivation()} type="button">
                    {isSubmitting ? (locale === "en-CA" ? "Activating..." : "Activation...") : (locale === "en-CA" ? "Activate my provider profile" : "Activer mon profil prestataire")}
                  </button>
                )}
              </div>
            </div>
          </section>

          <aside className="wizard-summary-panel">
            <p className="eyebrow">{locale === "en-CA" ? "Business recap" : "Recapitulatif business"}</p>
            <strong>{draft.displayName || (locale === "en-CA" ? "Future provider profile" : "Futur profil prestataire")}</strong>
            <p>{descriptionPayload || (locale === "en-CA" ? "Your positioning summary appears here as you build it." : "Votre resume de positionnement apparait ici au fur et a mesure.")}</p>
            <div className="summary-list">
              <div className="tabular-row"><strong>{locale === "en-CA" ? "Services" : "Services"}</strong><span>{selectedServices.length}</span></div>
              <div className="tabular-row"><strong>{locale === "en-CA" ? "Cities" : "Villes"}</strong><span>{selectedZones.length}</span></div>
              <div className="tabular-row"><strong>{locale === "en-CA" ? "Prepared photos" : "Photos preparees"}</strong><span>{draft.photoNames.length}</span></div>
              <div className="tabular-row"><strong>{locale === "en-CA" ? "Suggested plan" : "Plan suggere"}</strong><span>{plans[1]?.name || plans[0]?.name || "Pro"}</span></div>
            </div>
            <div className="chip-row">
              <span className="status-chip status-chip-success">{locale === "en-CA" ? "Simple activation" : "Activation simple"}</span>
              <span className="status-chip">{locale === "en-CA" ? "Immediate demand" : "Demande immediate"}</span>
              <span className="status-chip">{locale === "en-CA" ? "Upgrade-ready" : "Pret pour l'upgrade"}</span>
            </div>
          </aside>
        </div>
      </section>

      {activated ? (
        <section className="panel panel-clean request-success-panel">
          <div className="request-success-copy">
            <p className="eyebrow">{locale === "en-CA" ? "Provider activated" : "Prestataire active"}</p>
            <h3>{locale === "en-CA" ? "Your provider profile is now active." : "Votre profil prestataire est maintenant actif."}</h3>
            <p>{locale === "en-CA" ? "You can now answer requests, refine your public profile and move to a plan with stronger visibility." : "Vous pouvez maintenant repondre aux demandes, affiner votre profil public et passer sur un plan avec plus de visibilite."}</p>
            {activationRefreshWarning ? <p className="notice notice-info">{activationRefreshWarning}</p> : null}
          </div>

          <div className="request-success-metrics">
            <article className="guide-card">
              <strong>{locale === "en-CA" ? "Requests near you" : "Demandes pres de vous"}</strong>
              <p>{locale === "en-CA" ? `${Math.max(5, matches.length)} visible opportunities` : `${Math.max(5, matches.length)} opportunites visibles`}</p>
            </article>
            <article className="guide-card">
              <strong>{locale === "en-CA" ? "Recommended plan" : "Plan recommande"}</strong>
              <p>{plans[1]?.name || plans[0]?.name || "Pro"}</p>
            </article>
            <article className="guide-card">
              <strong>{locale === "en-CA" ? "Next move" : "Prochaine etape"}</strong>
              <p>{locale === "en-CA" ? "Open your leads or go straight to subscription to increase visibility." : "Ouvrez vos leads ou passez directement a l'abonnement pour augmenter votre visibilite."}</p>
            </article>
          </div>

          <div className="cta-row">
            <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
              {locale === "en-CA" ? "See available requests" : "Voir les demandes disponibles"}
            </button>
            <button className="secondary-button" onClick={() => navigate(`/${locale}/pro/abonnement`)} type="button">
              {locale === "en-CA" ? "See plans" : "Voir les abonnements"}
            </button>
            <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/profil`)} type="button">
              {locale === "en-CA" ? "Open my provider profile" : "Ouvrir mon profil prestataire"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Plans" : "Abonnements"}
          title={locale === "en-CA" ? "Move naturally from activation to monetization" : "Passer naturellement de l'activation a la monetisation"}
          body={locale === "en-CA" ? "Keep pricing simple. The goal is to make Pro feel like the clear growth move without hiding the free entry point." : "Gardez la tarification simple. Le but est de faire sentir que Pro est l'etape de croissance claire sans cacher l'entree gratuite."}
        />
        <div className="plan-list">
          {plans.slice(0, 3).map((plan, index) => (
            <article className={index === 1 ? "plan-card highlight-ring plan-card-pro" : "plan-card plan-card-pro"} key={plan.id}>
              <div className="service-card-header">
                <strong>{plan.name}</strong>
                {index === 1 ? <span className="status-chip status-chip-brand">{locale === "en-CA" ? "Recommended" : "Recommande"}</span> : null}
              </div>
              <div className="price-tag">
                <span>{new Intl.NumberFormat("fr-CA", { style: "currency", currency: plan.currency }).format(plan.price_cents / 100)}</span>
                <small>/{plan.billing_interval}</small>
              </div>
              <div className="feature-list-inline">
                <span>{locale === "en-CA" ? "Replies" : "Reponses"} {plan.response_limit ?? (locale === "en-CA" ? "Unlimited" : "Illimitees")}</span>
                <span>{locale === "en-CA" ? "Priority" : "Priorite"} {plan.priority_level}</span>
                <span>{locale === "en-CA" ? "Visibility boost" : "Boost de visibilite"}</span>
              </div>
              <button
                className={index === 1 ? "primary-button" : "ghost-button"}
                onClick={() => {
                  if (!plan.id) return;
                  void subscribeToPlan(plan.id);
                }}
                type="button"
              >
                {index === 0
                  ? locale === "en-CA"
                    ? "Start free"
                    : "Commencer gratuitement"
                  : locale === "en-CA"
                    ? "Switch to Pro"
                    : "Passer en Pro"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Immediate demand" : "Demandes immediates"}
          title={locale === "en-CA" ? "Show live opportunities right after activation" : "Montrer des opportunites juste apres l'activation"}
          body={locale === "en-CA" ? "This is the gratification layer that helps the provider stay engaged and understand the value of the platform." : "C'est la couche de gratification qui aide le prestataire a rester engage et a comprendre la valeur de la plateforme."}
        />
        {visibleMatches.length === 0 ? (
          <EmptyState
            title={locale === "en-CA" ? "Requests will appear here as matching starts." : "Les demandes apparaitront ici des que le matching commencera."}
            body={locale === "en-CA" ? "Complete the activation and add a plan to increase your local visibility." : "Terminez l'activation et ajoutez un plan pour renforcer votre visibilite locale."}
          />
        ) : (
          <div className="provider-request-grid">
            {visibleMatches.map((match) => (
              <article className="tabular-card tabular-card-soft" key={match.id}>
                <strong>{match.request_title || match.title || (locale === "en-CA" ? "Local request" : "Demande locale")}</strong>
                <p>{match.description || (locale === "en-CA" ? "A nearby client request is available for reply." : "Une demande client proche est disponible pour reponse.")}</p>
                <div className="request-card-details">
                  <span>{match.urgency || (locale === "en-CA" ? "standard" : "standard")}</span>
                  <span>{match.desired_date || "-"}</span>
                  <span>{locale === "en-CA" ? "Match" : "Match"} {match.match_score ?? 90}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
