import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { AppIcon } from "../../app/AppIcon";
import { CategoryIcon } from "../../app/CategoryIcon";
import { ApiResponseError, confirmPublicationPayment, getQuotes, rejectQuote, updateRequest } from "../../lib/api";
import type { Quote } from "../../types";
import { SectionIntro } from "../shared/Shared";
import { Modal } from "../../components/Modal";

const REQUEST_DRAFT_STORAGE_KEY = "jobizy_request_wizard_draft";

type RequestStep = "service" | "location" | "details" | "schedule" | "budget" | "photos" | "review";

type RequestDraft = {
  categoryId: string;
  serviceId: string;
  zoneId: string;
  address: string;
  title: string;
  description: string;
  desiredDate: string;
  urgency: "low" | "standard" | "high";
  startTime: string;
  endTime: string;
  budgetMin: string;
  budgetMax: string;
  workMode: "onsite" | "remote" | "hybrid";
  photoNames: string[];
  photoNote: string;
};

const steps: Array<{ id: RequestStep; fr: string; en: string }> = [
  { id: "service", fr: "Service", en: "Service" },
  { id: "location", fr: "Localisation", en: "Location" },
  { id: "details", fr: "Besoin", en: "Details" },
  { id: "schedule", fr: "Date et urgence", en: "Schedule" },
  { id: "budget", fr: "Budget", en: "Budget" },
  { id: "photos", fr: "Photos", en: "Photos" },
  { id: "review", fr: "Recapitulatif", en: "Review" },
];

function money(value: number | null | undefined, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format((value ?? 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function createDefaultDraft(): RequestDraft {
  return {
    categoryId: "",
    serviceId: "",
    zoneId: "",
    address: "",
    title: "",
    description: "",
    desiredDate: todayIso(),
    urgency: "standard",
    startTime: "09:00",
    endTime: "12:00",
    budgetMin: "",
    budgetMax: "",
    workMode: "onsite",
    photoNames: [],
    photoNote: "",
  };
}

function toCents(value: string) {
  const normalized = Number(value);
  if (!value.trim() || Number.isNaN(normalized) || normalized < 0) return null;
  return Math.round(normalized * 100);
}

function normalizeDraft(raw: string | null): RequestDraft {
  if (!raw) return createDefaultDraft();

  try {
    const parsed = JSON.parse(raw) as Partial<RequestDraft>;
    const defaults = createDefaultDraft();
    return {
      ...defaults,
      ...parsed,
      urgency: parsed.urgency === "low" || parsed.urgency === "high" ? parsed.urgency : "standard",
      workMode:
        parsed.workMode === "remote" || parsed.workMode === "hybrid" ? parsed.workMode : "onsite",
      photoNames: Array.isArray(parsed.photoNames) ? parsed.photoNames.filter(Boolean) : [],
    } as RequestDraft;
  } catch {
    return createDefaultDraft();
  }
}

function buildGeneratedTitle(
  draft: RequestDraft,
  serviceName: string | undefined,
  zoneName: string | undefined,
  locale: string,
) {
  if (draft.title.trim()) return draft.title.trim();
  const serviceLabel = serviceName || (locale === "en-CA" ? "Service request" : "Demande de service");
  const zoneLabel = zoneName ? ` - ${zoneName}` : "";
  return `${serviceLabel}${zoneLabel}`;
}

function buildRequestDescription(draft: RequestDraft) {
  const parts = [draft.description.trim()];

  if (draft.address.trim()) parts.push(`Adresse ou repere: ${draft.address.trim()}`);
  if (draft.photoNames.length > 0) parts.push(`Photos preparees: ${draft.photoNames.join(", ")}`);
  if (draft.photoNote.trim()) parts.push(`Contexte visuel: ${draft.photoNote.trim()}`);

  return parts.filter(Boolean).join("\n\n");
}

const STATUS_LABELS: Record<string, { fr: string; en: string; tone: string }> = {
  draft: { fr: "Brouillon", en: "Draft", tone: "status-chip-draft" },
  published: { fr: "Publiée", en: "Published", tone: "status-chip-published" },
  in_discussion: { fr: "En discussion", en: "In discussion", tone: "status-chip-discussion" },
  awarded: { fr: "Attribuée", en: "Awarded", tone: "status-chip-awarded" },
  expired: { fr: "Expirée", en: "Expired", tone: "status-chip-expired" },
  closed: { fr: "Fermée", en: "Closed", tone: "status-chip-closed" },
  cancelled: { fr: "Annulée", en: "Cancelled", tone: "status-chip-cancelled" },
};

export function ClientRequestsPage() {
  const navigate = useNavigate();
  const {
    locale,
    session,
    platform,
    categories,
    services,
    zones,
    requests,
    createClientRequest,
    chooseClientQuote,
    cancelClientRequest,
    deleteClientRequest,
    publishDraftRequest,
    refresh,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"list" | "new">("list");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Detail panel state ──
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [awardingId, setAwardingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const editingRequestStatus = editingDraftId ? (requests.find((r) => r.id === editingDraftId)?.status ?? "draft") : null;
  useEffect(() => {
    if (!selectedReqId || !session) { setQuotes([]); return; }
    setQuotesLoading(true);
    getQuotes(session, locale, selectedReqId)
      .then(setQuotes)
      .catch(() => setQuotes([]))
      .finally(() => setQuotesLoading(false));
  }, [selectedReqId, session, locale]);

  const [awardError, setAwardError] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  // Close modal when request becomes awarded
  useEffect(() => {
    if (!selectedReqId) return;
    const req = requests.find((r) => r.id === selectedReqId);
    if (req?.status === "awarded") setSelectedReqId(null);
  }, [requests, selectedReqId]);

  async function handleAwardQuote(requestId: string, quoteId: string) {
    if (!window.confirm(locale === "en-CA" ? "Choose this provider? This will create a mission and decline all other offers." : "Choisir ce prestataire ? Cela créera une mission et refusera les autres offres.")) return;
    setAwardingId(quoteId);
    setAwardError("");
    try {
      await chooseClientQuote(requestId, quoteId);
      setSelectedReqId(null);
    } catch (err: any) {
      setAwardError(err?.message ?? (locale === "en-CA" ? "Failed to accept offer." : "Impossible d'accepter l'offre."));
    } finally {
      setAwardingId(null);
    }
  }

  async function handleRejectQuote(quoteId: string) {
    if (!session) return;
    setRejectingId(quoteId);
    try {
      await rejectQuote(session, locale, quoteId);
      setQuotes((current) => current.map((q) => q.id === quoteId ? { ...q, status: "rejected" } : q));
    } finally {
      setRejectingId(null);
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!window.confirm(locale === "en-CA" ? "Cancel this request? This action cannot be undone." : "Annuler cette demande ? Cette action est irréversible.")) return;
    setCancellingId(requestId);
    try {
      await cancelClientRequest(requestId);
      setSelectedReqId(null);
    } finally {
      setCancellingId(null);
    }
  }
  function handleEditDraft(req: (typeof requests)[number]) {
    const service = services.find((s) => s.id === req.service_id);
    const reqAny = req as any;
    const stripSeconds = (t?: string | null) => (t ? t.slice(0, 5) : "09:00");
    const toDisplay = (cents?: number | null) => (cents != null ? (cents / 100).toString() : "");
    setDraft({
      categoryId: service?.category_id ?? "",
      serviceId: req.service_id,
      zoneId: req.zone_id,
      address: "",
      title: req.title ?? "",
      description: req.description ?? "",
      desiredDate: req.desired_date ? String(req.desired_date).slice(0, 10) : todayIso(),
      urgency: reqAny.urgency === "low" || reqAny.urgency === "high" ? reqAny.urgency : "standard",
      startTime: stripSeconds(req.time_window_start),
      endTime: stripSeconds(req.time_window_end),
      budgetMin: toDisplay(req.budget_min_cents),
      budgetMax: toDisplay(req.budget_max_cents),
      workMode: reqAny.work_mode === "remote" || reqAny.work_mode === "hybrid" ? reqAny.work_mode : "onsite",
      photoNames: [],
      photoNote: "",
    });
    setEditingDraftId(req.id);
    setCurrentStep("service");
    setView("new");
  }

  function handleRepublish(req: (typeof requests)[number]) {
    const service = services.find((s) => s.id === req.service_id);
    const reqAny = req as any;
    const stripSeconds = (t?: string | null) => (t ? t.slice(0, 5) : "09:00");
    const toDisplay = (cents?: number | null) => (cents != null ? (cents / 100).toString() : "");
    setDraft({
      categoryId: service?.category_id ?? "",
      serviceId: req.service_id,
      zoneId: req.zone_id,
      address: "",
      title: req.title ?? "",
      description: req.description ?? "",
      desiredDate: todayIso(),
      urgency: reqAny.urgency === "low" || reqAny.urgency === "high" ? reqAny.urgency : "standard",
      startTime: stripSeconds(req.time_window_start),
      endTime: stripSeconds(req.time_window_end),
      budgetMin: toDisplay(req.budget_min_cents),
      budgetMax: toDisplay(req.budget_max_cents),
      workMode: reqAny.work_mode === "remote" || reqAny.work_mode === "hybrid" ? reqAny.work_mode : "onsite",
      photoNames: [],
      photoNote: "",
    });
    setEditingDraftId(null);
    setCurrentStep("service");
    setView("new");
  }

  async function handleDeleteDraft(requestId: string) {
    if (!window.confirm(locale === "en-CA" ? "Delete this draft? This action cannot be undone." : "Supprimer ce brouillon ? Cette action est irréversible.")) return;
    setDeletingId(requestId);
    try {
      await deleteClientRequest(requestId);
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePublishDraft(requestId: string) {
    setPublishingDraftId(requestId);
    try {
      await publishDraftRequest(requestId);
    } finally {
      setPublishingDraftId(null);
    }
  }

  const [paymentNotice] = useState<"success" | "cancelled" | null>(() => {
    const param = searchParams.get("publication_payment");
    return param === "success" ? "success" : param === "cancelled" ? "cancelled" : null;
  });

  useEffect(() => {
    if (!paymentNotice) return;
    const returnedRequestId = searchParams.get("request_id");
    searchParams.delete("publication_payment");
    searchParams.delete("request_id");
    setSearchParams(searchParams, { replace: true });
    if (paymentNotice === "success" && returnedRequestId && session) {
      // Vérifie directement auprès de Stripe si le paiement est confirmé (sans
      // dépendre du webhook). Si Stripe dit "payé", le backend publie immédiatement.
      // En cas d'échec temporaire, on retente 4 fois avec 2 s d'intervalle.
      let attempts = 0;
      const MAX = 4;
      const DELAY_MS = 2000;
      async function tryConfirm() {
        try {
          await confirmPublicationPayment(session!, locale, returnedRequestId!);
          await refresh();
        } catch (err) {
          const isTransient =
            err instanceof ApiResponseError &&
            (err.httpStatus === 402 || err.httpStatus >= 500);
          if (isTransient && attempts < MAX) {
            attempts += 1;
            setTimeout(() => void tryConfirm(), DELAY_MS);
          } else {
            await refresh();
          }
        }
      }
      void tryConfirm();
    }
  }, []);
  const [currentStep, setCurrentStep] = useState<RequestStep>("service");
  const [draft, setDraft] = useState<RequestDraft>(() =>
    normalizeDraft(window.localStorage.getItem(`${REQUEST_DRAFT_STORAGE_KEY}_${locale}`)),
  );

  const filteredServices = useMemo(
    () => services.filter((item) => !draft.categoryId || item.category_id === draft.categoryId),
    [draft.categoryId, services],
  );
  const cityZones = useMemo(() => zones.filter((item) => item.type === "city"), [zones]);
  const selectedService = useMemo(() => services.find((item) => item.id === draft.serviceId), [draft.serviceId, services]);
  const selectedZone = useMemo(() => zones.find((item) => item.id === draft.zoneId), [draft.zoneId, zones]);
  const generatedTitle = useMemo(
    () => buildGeneratedTitle(draft, selectedService?.name, selectedZone?.name, locale),
    [draft, locale, selectedService?.name, selectedZone?.name],
  );
  const requestDescription = useMemo(() => buildRequestDescription(draft), [draft]);
  const budgetMinCents = useMemo(() => toCents(draft.budgetMin), [draft.budgetMin]);
  const budgetMaxCents = useMemo(() => toCents(draft.budgetMax), [draft.budgetMax]);
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  useEffect(() => {
    setDraft(normalizeDraft(window.localStorage.getItem(`${REQUEST_DRAFT_STORAGE_KEY}_${locale}`)));
    setCurrentStep("service");
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem(`${REQUEST_DRAFT_STORAGE_KEY}_${locale}`, JSON.stringify(draft));
  }, [draft, locale]);

  useEffect(() => {
    if (!draft.categoryId && categories[0]?.id) setDraft((current) => ({ ...current, categoryId: categories[0].id }));
  }, [categories, draft.categoryId]);

  useEffect(() => {
    if (!draft.zoneId && cityZones[0]?.id) setDraft((current) => ({ ...current, zoneId: cityZones[0].id }));
  }, [cityZones, draft.zoneId]);

  useEffect(() => {
    if (filteredServices[0] && !filteredServices.some((item) => item.id === draft.serviceId)) {
      setDraft((current) => ({ ...current, serviceId: filteredServices[0].id }));
    }
  }, [draft.serviceId, filteredServices]);

  function updateDraft(patch: Partial<RequestDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function appendSuggestion(text: string) {
    setDraft((current) => ({
      ...current,
      description: current.description.trim() ? `${current.description.trim()}\n${text}` : text,
    }));
  }

  function isStepComplete(step: RequestStep) {
    switch (step) {
      case "service":
        return Boolean(draft.serviceId);
      case "location":
        return Boolean(draft.zoneId);
      case "details":
        return draft.description.trim().length >= 10;
      case "schedule":
        return Boolean(draft.desiredDate && draft.startTime && draft.endTime);
      case "budget":
        return budgetMinCents == null || budgetMaxCents == null || budgetMaxCents >= budgetMinCents;
      case "photos":
        return true;
      case "review":
        return (
          Boolean(draft.serviceId) &&
          Boolean(draft.zoneId) &&
          draft.description.trim().length >= 10 &&
          Boolean(draft.desiredDate) &&
          Boolean(draft.startTime) &&
          Boolean(draft.endTime) &&
          (budgetMinCents == null || budgetMaxCents == null || budgetMaxCents >= budgetMinCents)
        );
      default:
        return false;
    }
  }

  function moveStep(direction: "next" | "prev") {
    const nextIndex = direction === "next" ? currentStepIndex + 1 : currentStepIndex - 1;
    const boundedIndex = Math.max(0, Math.min(steps.length - 1, nextIndex));
    setCurrentStep(steps[boundedIndex].id);
  }

  async function handlePublish() {
    if (!isStepComplete("review")) return;

    const requestBody = {
      service_id: draft.serviceId,
      zone_id: draft.zoneId,
      title: generatedTitle,
      description: requestDescription,
      desired_date: draft.desiredDate,
      time_window_start: `${draft.startTime}:00`,
      time_window_end: `${draft.endTime}:00`,
      urgency: draft.urgency,
      budget_min_cents: budgetMinCents,
      budget_max_cents: budgetMaxCents,
      work_mode: draft.workMode,
    };

    setIsSubmitting(true);
    try {
      if (editingDraftId && session) {
        await updateRequest(session, locale, editingDraftId, requestBody);
        setEditingDraftId(null);
        await refresh();
      } else {
        await createClientRequest(requestBody);
      }
      window.localStorage.removeItem(`${REQUEST_DRAFT_STORAGE_KEY}_${locale}`);
      setDraft(createDefaultDraft());
      setCurrentStep("service");
      setView("list");
    } finally {
      setIsSubmitting(false);
    }
  }

  const completedCount = steps.filter((step) => isStepComplete(step.id)).length;

  const chipStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#374151", background: "#f3f4f6", borderRadius: "999px", padding: "0.2rem 0.6rem", lineHeight: 1.4 };
  const serviceChipClass = "service-inline-chip";

  return (
    <section className="stack stack-xl">

      {/* ── Header + toggle ── */}
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "My requests" : "Mes demandes"}
          title={locale === "en-CA" ? "Your service requests" : "Vos demandes de service"}
          body={locale === "en-CA" ? "Track all your published requests and create new ones." : "Suivez toutes vos demandes publiées et créez-en de nouvelles."}
          aside={
            <button
              className="primary-button"
              onClick={() => { if (view === "new") { setEditingDraftId(null); } setView(view === "new" ? "list" : "new"); }}
              type="button"
            >
              {view === "new"
                ? (locale === "en-CA" ? "Back to my requests" : "Retour à mes demandes")
                : (locale === "en-CA" ? "+ New request" : "+ Nouvelle demande")}
            </button>
          }
        />
      </section>

      {/* ── Stripe payment return notice ── */}
      {paymentNotice === "success" && (
        <section className="panel panel-clean">
          <p className="notice notice-success">
            {locale === "en-CA"
              ? "Payment confirmed. Your request will be published shortly."
              : "Paiement confirmé. Votre demande sera publiée sous peu."}
          </p>
        </section>
      )}
      {paymentNotice === "cancelled" && (
        <section className="panel panel-clean">
          <p className="notice notice-error">
            {locale === "en-CA"
              ? "Payment cancelled. Your request is saved as a draft."
              : "Paiement annulé. Votre demande a été sauvegardée en brouillon."}
          </p>
        </section>
      )}

      {/* ── Request list with inline offer expansion ── */}
      {view === "list" && (
        <section className="panel panel-clean">
          {requests.length === 0 ? (
            <div className="empty-state empty-state-soft">
              <strong>{locale === "en-CA" ? "No request yet" : "Aucune demande pour l'instant"}</strong>
              <p>{locale === "en-CA" ? "Create your first request to receive quotes from local providers." : "Créez votre première demande pour recevoir des offres de prestataires locaux."}</p>
              <button className="primary-button" onClick={() => setView("new")} type="button">
                {locale === "en-CA" ? "Create a request" : "Créer une demande"}
              </button>
            </div>
          ) : (
            <div className="stack">
              {requests.map((req) => {
                const statusInfo = STATUS_LABELS[req.status] ?? { fr: req.status, en: req.status, tone: "" };
                const reqAny = req as any;
                const reqService = services.find((s) => s.id === req.service_id);
                const reqCategory = categories.find((c) => c.id === reqService?.category_id);
                const reqCategoryIcon = reqCategory?.icon ?? null;
                const isSelected = selectedReqId === req.id;
                const offersCount = reqAny.offers_count ?? 0;
                const activeQuotes = isSelected ? quotes.filter((q) => q.status !== "rejected" && q.status !== "withdrawn") : [];
                const isAwarded = req.status === "awarded";

                const newOffers = reqAny.new_offers_count ?? 0;
                const unreadMessages = reqAny.unread_messages_client_count ?? 0;
                const budgetMin = req.budget_min_cents;
                const budgetMax = req.budget_max_cents;
                const fmt = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
                const budgetLabel = budgetMin != null && budgetMax != null
                  ? `${fmt.format(budgetMin / 100)} – ${fmt.format(budgetMax / 100)}`
                  : budgetMax != null ? `≤ ${fmt.format(budgetMax / 100)}`
                  : budgetMin != null ? `≥ ${fmt.format(budgetMin / 100)}`
                  : null;
                const urgencyLabel: Record<string, string> = { low: locale === "en-CA" ? "Low" : "Faible", standard: "Standard", high: locale === "en-CA" ? "High" : "Haute", urgent: "Urgent" };
                const workModeLabel: Record<string, string> = { onsite: locale === "en-CA" ? "On-site" : "Sur place", remote: locale === "en-CA" ? "Remote" : "À distance", hybrid: locale === "en-CA" ? "Hybrid" : "Hybride" };

                return (
                  <div key={req.id}>
                    {/* ── Card ── */}
                    <article
                      className={`provider-request-card${isSelected ? " provider-request-card-active" : ""}`}
                    >
                      {/* Title + status */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.35rem" }}>
                        <strong style={{ fontSize: "0.975rem", lineHeight: 1.3 }}>{req.title || (locale === "en-CA" ? "Request" : "Demande")}</strong>
                        <span className={`status-chip ${statusInfo.tone}`} style={{ flexShrink: 0 }}>
                          {locale === "en-CA" ? statusInfo.en : statusInfo.fr}
                        </span>
                      </div>

                      {/* Description */}
                      {req.description && (
                        <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: "0 0 0.75rem", lineHeight: 1.4 }}>
                          {req.description.slice(0, 120)}{req.description.length > 120 ? "…" : ""}
                        </p>
                      )}

                      {/* Info chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                        {(reqAny.service_name || req.service_id) && (
                          <span className={serviceChipClass}>
                            <CategoryIcon icon={reqCategoryIcon} size={13} />{reqAny.service_name ?? req.service_id}
                          </span>
                        )}
                        {(reqAny.zone_name || req.zone_id) && (
                          <span style={chipStyle}>
                            <AppIcon name="location" size={14} />{reqAny.zone_name ?? req.zone_id}
                          </span>
                        )}
                        {req.desired_date && (
                          <span style={chipStyle}>
                            <AppIcon name="calendar" size={14} />{formatDate(req.desired_date)}
                          </span>
                        )}
                        {req.urgency && req.urgency !== "standard" && (
                          <span style={{ ...chipStyle, background: req.urgency === "urgent" ? "#fef2f2" : req.urgency === "high" ? "#fff7ed" : "#f0fdf4", color: req.urgency === "urgent" ? "#dc2626" : req.urgency === "high" ? "#ea580c" : "#16a34a" }}>
                            <AppIcon name="bolt" size={14} />{urgencyLabel[req.urgency] ?? req.urgency}
                          </span>
                        )}
                        {req.work_mode && req.work_mode !== "onsite" && (
                          <span style={chipStyle}>
                            <AppIcon name="provider" size={14} />{workModeLabel[req.work_mode] ?? req.work_mode}
                          </span>
                        )}
                        {budgetLabel && (
                          <span style={chipStyle}>
                            <AppIcon name="wallet" size={14} />{budgetLabel}
                          </span>
                        )}
                      </div>

                      {/* ── Action zone ── */}
                      <div style={{ borderTop: "1px solid #f3f4f6", marginTop: "0.5rem", paddingTop: "0.75rem" }}>

                        {/* BROUILLON */}
                        {req.status === "draft" && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                              {locale === "en-CA" ? "Draft — publish when ready" : "Brouillon — publiez quand vous êtes prêt"}
                            </span>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              <button className="ghost-button compact-button" onClick={() => handleEditDraft(req)} type="button">
                                {locale === "en-CA" ? "Edit" : "Modifier"}
                              </button>
                              <button
                                className="ghost-button compact-button"
                                disabled={deletingId === req.id}
                                onClick={() => void handleDeleteDraft(req.id)}
                                type="button"
                                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                              >
                                {deletingId === req.id ? "..." : (locale === "en-CA" ? "Delete" : "Supprimer")}
                              </button>
                              <button
                                className="primary-button compact-button"
                                disabled={publishingDraftId === req.id}
                                onClick={() => void handlePublishDraft(req.id)}
                                type="button"
                              >
                                {publishingDraftId === req.id ? "..." : (locale === "en-CA" ? "Publish →" : "Publier →")}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* PUBLIÉE — aucune offre */}
                        {req.status === "published" && offersCount === 0 && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "#6b7280" }}>
                              <AppIcon name="clock" size={13} />
                              {locale === "en-CA" ? "Awaiting responses from providers" : "En attente de réponses des prestataires"}
                            </span>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              <button className="ghost-button compact-button" onClick={() => handleEditDraft(req)} type="button">
                                {locale === "en-CA" ? "Edit" : "Modifier"}
                              </button>
                              <button
                                className="ghost-button compact-button"
                                disabled={cancellingId === req.id}
                                onClick={() => void handleCancelRequest(req.id)}
                                type="button"
                                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                              >
                                {cancellingId === req.id ? "..." : (locale === "en-CA" ? "Cancel" : "Annuler")}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* PUBLIÉE — offres reçues */}
                        {req.status === "published" && offersCount > 0 && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: newOffers > 0 ? "#16a34a" : "#2563eb", color: "#fff", borderRadius: "999px", fontWeight: 700, fontSize: "0.72rem", minWidth: "1.35rem", height: "1.35rem", padding: "0 0.3rem" }}>
                                {offersCount}
                              </span>
                              <span style={{ fontSize: "0.8rem", color: newOffers > 0 ? "#15803d" : "#1d4ed8", fontWeight: 600 }}>
                                {newOffers > 0
                                  ? (locale === "en-CA" ? `${newOffers} new offer${newOffers > 1 ? "s" : ""}` : `${newOffers} nouvelle${newOffers > 1 ? "s" : ""} offre${newOffers > 1 ? "s" : ""}`)
                                  : (locale === "en-CA" ? `${offersCount} offer${offersCount !== 1 ? "s" : ""} received` : `${offersCount} offre${offersCount !== 1 ? "s" : ""} reçue${offersCount !== 1 ? "s" : ""}`)}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              <button className="ghost-button compact-button" onClick={() => handleEditDraft(req)} type="button">
                                {locale === "en-CA" ? "Edit" : "Modifier"}
                              </button>
                              <button
                                className="ghost-button compact-button"
                                disabled={cancellingId === req.id}
                                onClick={() => void handleCancelRequest(req.id)}
                                type="button"
                                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                              >
                                {cancellingId === req.id ? "..." : (locale === "en-CA" ? "Cancel" : "Annuler")}
                              </button>
                              <button
                                className={isSelected ? "ghost-button compact-button" : "primary-button compact-button"}
                                onClick={() => { setSelectedReqId(isSelected ? null : req.id); setCompareMode(false); }}
                                type="button"
                              >
                                {isSelected
                                  ? (locale === "en-CA" ? "Hide offers" : "Masquer les offres")
                                  : (locale === "en-CA" ? `View offers (${offersCount}) →` : `Voir les offres (${offersCount}) →`)}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* EN DISCUSSION */}
                        {req.status === "in_discussion" && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              <button
                                className="ghost-button compact-button"
                                onClick={() => navigate(`/${locale}/app/messages?request_id=${req.id}`)}
                                type="button"
                              >
                                {unreadMessages > 0
                                  ? (locale === "en-CA" ? `Messages (${unreadMessages})` : `Messages (${unreadMessages})`)
                                  : (locale === "en-CA" ? "Messages" : "Messages")}
                                {unreadMessages > 0 && (
                                  <span style={{ background: "#ca8a04", color: "#fff", borderRadius: "999px", fontSize: "0.62rem", fontWeight: 700, padding: "0.05rem 0.35rem", marginLeft: "0.25rem" }}>
                                    {locale === "en-CA" ? "unread" : "non lu"}
                                  </span>
                                )}
                              </button>
                              <button
                                className="ghost-button compact-button"
                                disabled={cancellingId === req.id}
                                onClick={() => void handleCancelRequest(req.id)}
                                type="button"
                                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                              >
                                {cancellingId === req.id ? "..." : (locale === "en-CA" ? "Cancel" : "Annuler")}
                              </button>
                            </div>
                            <button
                              className={isSelected ? "ghost-button compact-button" : "primary-button compact-button"}
                              onClick={() => { setSelectedReqId(isSelected ? null : req.id); setCompareMode(false); }}
                              type="button"
                            >
                              {isSelected
                                ? (locale === "en-CA" ? "Hide offers" : "Masquer les offres")
                                : offersCount > 0
                                  ? (locale === "en-CA" ? `View offers (${offersCount}) →` : `Voir les offres (${offersCount}) →`)
                                  : (locale === "en-CA" ? "View offers →" : "Voir les offres →")}
                            </button>
                          </div>
                        )}

                        {/* ATTRIBUÉE */}
                        {req.status === "awarded" && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "#16a34a", fontWeight: 600 }}>
                              <AppIcon name="check" size={13} />
                              {locale === "en-CA" ? "Provider selected" : "Prestataire sélectionné"}
                            </span>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              <button
                                className="ghost-button compact-button"
                                onClick={() => navigate(`/${locale}/app/messages?request_id=${req.id}`)}
                                type="button"
                              >
                                {locale === "en-CA" ? "Contact provider" : "Contacter le prestataire"}
                              </button>
                              <button
                                className="primary-button compact-button"
                                onClick={() => navigate(`/${locale}/app/missions`)}
                                type="button"
                              >
                                {locale === "en-CA" ? "View mission →" : "Voir la mission →"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* EXPIRÉE / ANNULÉE / FERMÉE */}
                        {["cancelled", "closed", "expired"].includes(req.status) && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                              {locale === "en-CA"
                                ? (req.status === "cancelled" ? "Request cancelled" : req.status === "expired" ? "Request expired" : "Request closed")
                                : (req.status === "cancelled" ? "Demande annulée" : req.status === "expired" ? "Demande expirée" : "Demande fermée")}
                            </span>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={(e) => { e.stopPropagation(); handleRepublish(req); }}
                            >
                              {locale === "en-CA" ? "Repost" : "Republier"}
                            </button>
                          </div>
                        )}

                      </div>
                    </article>

                  </div>
                );
              })}
            </div>
          )}

          {/* ── Modal offres ── */}
          {selectedReqId && (() => {
            const selectedReq = requests.find((r) => r.id === selectedReqId);
            const activeQuotes = quotes.filter((q) => q.status !== "rejected" && q.status !== "withdrawn");
            const isAwarded = selectedReq?.status === "awarded";
            return (
              <Modal onClose={() => { setSelectedReqId(null); setCompareMode(false); }}>
                {awardError && (
                  <p className="notice notice-error" style={{ marginBottom: "1rem" }}>{awardError}</p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.1rem" }}>
                      {locale === "en-CA" ? "Offers received" : "Offres reçues"}
                      {activeQuotes.length > 0 && <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: "0.4rem" }}>({activeQuotes.length})</span>}
                    </h4>
                    {selectedReq && <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>{selectedReq.title}</p>}
                    {!isAwarded && activeQuotes.length > 0 && (
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#6b7280" }}>
                        {locale === "en-CA" ? "Choose a provider to create a mission." : "Choisissez un prestataire pour créer une mission."}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {activeQuotes.length > 1 && (
                      <button
                        className="ghost-button compact-button"
                        onClick={() => setCompareMode((v) => !v)}
                        type="button"
                        style={compareMode ? { background: "rgba(47,140,171,0.10)", borderColor: "var(--accent)", color: "var(--accent-strong)" } : {}}
                      >
                        {compareMode
                          ? (locale === "en-CA" ? "List view" : "Vue liste")
                          : (locale === "en-CA" ? "Compare" : "Comparer")}
                      </button>
                    )}
                    <button className="ghost-button compact-button" onClick={() => { setSelectedReqId(null); setCompareMode(false); }} type="button">
                      {locale === "en-CA" ? "Close" : "Fermer"}
                    </button>
                  </div>
                </div>

                {quotesLoading ? (
                  <div className="skeleton-card">
                    <div className="skeleton-line" style={{ width: "60%" }} />
                    <div className="skeleton-line" style={{ width: "100%" }} />
                  </div>
                ) : activeQuotes.length === 0 ? (
                  <div className="empty-state empty-state-soft">
                    <p>{locale === "en-CA" ? "No offers received yet." : "Aucune offre reçue pour le moment."}</p>
                  </div>
                ) : compareMode ? (
                  <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${activeQuotes.length}, minmax(220px, 1fr))`, gap: "0.75rem", minWidth: `${activeQuotes.length * 240}px` }}>
                      {activeQuotes.map((quote) => {
                        const fmt = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
                        return (
                          <div
                            key={quote.id}
                            style={{
                              border: `2px solid ${quote.status === "accepted" ? "#bbf7d0" : "var(--border)"}`,
                              borderRadius: "0.875rem",
                              padding: "1rem",
                              background: quote.status === "accepted" ? "#f0fdf4" : "var(--surface)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.6rem",
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: "0.95rem", display: "block" }}>
                                {quote.business_name || quote.display_name || (locale === "en-CA" ? "Provider" : "Prestataire")}
                              </strong>
                              {quote.status === "accepted" && (
                                <span className="status-chip status-chip-awarded" style={{ fontSize: "0.7rem", marginTop: "0.2rem" }}>
                                  {locale === "en-CA" ? "✓ Selected" : "✓ Sélectionné"}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem" }}>
                              {quote.rating_avg != null && Number(quote.rating_avg) > 0 ? (
                                <span style={{ color: "#b45309", fontWeight: 700 }}>★ {Number(quote.rating_avg).toFixed(1)}</span>
                              ) : (
                                <span style={{ color: "#9ca3af" }}>★ —</span>
                              )}
                              {quote.rating_count ? <span style={{ color: "#6b7280" }}>({quote.rating_count} avis)</span> : null}
                            </div>
                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.15rem" }}>
                                {locale === "en-CA" ? "Quoted price" : "Prix proposé"}
                              </span>
                              <strong style={{ fontSize: "1.15rem", color: "var(--surface-ink)" }}>
                                {quote.estimated_price_cents != null ? fmt.format(quote.estimated_price_cents / 100) : "—"}
                              </strong>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.15rem" }}>
                                {locale === "en-CA" ? "Proposed date" : "Date proposée"}
                              </span>
                              <span style={{ fontSize: "0.85rem" }}>{quote.proposed_date ? formatDate(quote.proposed_date) : "—"}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.15rem" }}>
                                {locale === "en-CA" ? "Message" : "Message"}
                              </span>
                              <p style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.45, margin: 0 }}>
                                {quote.message.length > 120 ? `${quote.message.slice(0, 120)}…` : quote.message}
                              </p>
                            </div>
                            {quote.status !== "accepted" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", borderTop: "1px solid var(--border)", paddingTop: "0.6rem", marginTop: "auto" }}>
                                <button
                                  className="ghost-button compact-button"
                                  onClick={() => navigate(quote.conversation_id ? `/${locale}/app/messages?conversation_id=${quote.conversation_id}` : `/${locale}/app/messages?request_id=${selectedReqId}`)}
                                  type="button"
                                  style={{ width: "100%", justifyContent: "center" }}
                                >
                                  {locale === "en-CA" ? "Message" : "Discuter"}
                                </button>
                                {!isAwarded && (
                                  <button
                                    className="primary-button compact-button"
                                    disabled={awardingId === quote.id}
                                    onClick={() => void handleAwardQuote(selectedReqId, quote.id)}
                                    type="button"
                                    style={{ width: "100%", justifyContent: "center" }}
                                  >
                                    {awardingId === quote.id ? "..." : (locale === "en-CA" ? "Choose →" : "Choisir →")}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="stack">
                    {activeQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        style={{
                          border: `1px solid ${quote.status === "accepted" ? "#bbf7d0" : "#e5e7eb"}`,
                          borderRadius: "0.75rem",
                          padding: "1rem 1.1rem",
                          background: quote.status === "accepted" ? "#f0fdf4" : "#ffffff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "0.95rem" }}>{quote.business_name || quote.display_name || (locale === "en-CA" ? "Provider" : "Prestataire")}</strong>
                            {quote.rating_avg != null && Number(quote.rating_avg) > 0 && (
                              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                ★ {Number(quote.rating_avg).toFixed(1)}{quote.rating_count ? ` (${quote.rating_count})` : ""}
                              </span>
                            )}
                            {quote.status === "accepted" && (
                              <span className="status-chip status-chip-success" style={{ fontSize: "0.72rem" }}>
                                {locale === "en-CA" ? "✓ Selected" : "✓ Sélectionné"}
                              </span>
                            )}
                          </div>
                          {quote.estimated_price_cents != null && (
                            <strong style={{ fontSize: "1rem", color: "#111827", flexShrink: 0 }}>
                              {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(quote.estimated_price_cents / 100)}
                            </strong>
                          )}
                        </div>
                        <p style={{ color: "#374151", fontSize: "0.875rem", margin: "0 0 0.5rem", lineHeight: 1.5 }}>{quote.message}</p>
                        {quote.proposed_date && (
                          <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0 0 0.75rem" }}>
                            <AppIcon name="calendar" size={12} />
                            {" "}{locale === "en-CA" ? "Proposed date: " : "Date proposée : "}{formatDate(quote.proposed_date)}
                          </p>
                        )}
                        {quote.status !== "accepted" && (
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap", borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                            <button
                              className="ghost-button compact-button"
                              disabled={rejectingId === quote.id}
                              onClick={() => void handleRejectQuote(quote.id)}
                              type="button"
                              style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                            >
                              {rejectingId === quote.id ? "..." : (locale === "en-CA" ? "Decline" : "Refuser")}
                            </button>
                            <button
                              className="ghost-button compact-button"
                              onClick={() => navigate(quote.conversation_id ? `/${locale}/app/messages?conversation_id=${quote.conversation_id}` : `/${locale}/app/messages?request_id=${selectedReqId}`)}
                              type="button"
                            >
                              {locale === "en-CA" ? "Message" : "Discuter"}
                            </button>
                            {!isAwarded && (
                              <button
                                className="primary-button compact-button"
                                disabled={awardingId === quote.id}
                                onClick={() => void handleAwardQuote(selectedReqId, quote.id)}
                                type="button"
                              >
                                {awardingId === quote.id ? "..." : (locale === "en-CA" ? "Choose this provider →" : "Choisir ce prestataire →")}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Modal>
            );
          })()}
        </section>
      )}

      {/* ── New request wizard ── */}
      {view === "new" && (
      <section className="panel panel-clean request-builder request-builder-wizard">
        <div className="stack-tight">
          <div className="wizard-heading">
            <strong>{locale === "en-CA" ? "Request creation steps" : "Etapes de creation de la demande"}</strong>
            <p>{locale === "en-CA" ? "Follow each step to prepare a clear request before publishing." : "Suivez chaque etape pour preparer une demande claire avant de la publier."}</p>
          </div>
          <div className="wizard-progress-shell">
            <div className="wizard-progress-header">
              <strong>{locale === "en-CA" ? `Step ${currentStepIndex + 1} of ${steps.length}` : `Etape ${currentStepIndex + 1} sur ${steps.length}`}</strong>
              <span>{locale === "en-CA" ? `${completedCount} completed` : `${completedCount} etapes completees`}</span>
            </div>
            <div aria-hidden="true" className="wizard-progress-track">
              <span className="wizard-progress-fill" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} />
            </div>
            <div className="wizard-step-pills">
              {steps.map((step, index) => (
                <button
                  className={step.id === currentStep ? "wizard-step-pill wizard-step-pill-active" : "wizard-step-pill"}
                  disabled={index > currentStepIndex + 1}
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
        </div>

        <section className="wizard-main-panel">
            {currentStep === "service" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "What service do you need?" : "De quel service avez-vous besoin ?"}</strong>
                  <p>{locale === "en-CA" ? "Start with a concrete service so Jobizy can prepare the best local matching." : "Commencez par un service concret pour preparer le meilleur matching local."}</p>
                </div>

                <div className="wizard-choice-grid">
                  {categories.slice(0, 8).map((category) => (
                    <button
                      className={draft.categoryId === category.id ? "wizard-choice-card wizard-choice-card-active" : "wizard-choice-card"}
                      key={category.id}
                      onClick={() => updateDraft({ categoryId: category.id })}
                      type="button"
                    >
                      <CategoryIcon icon={category.icon} size={28} />
                      <strong>{category.name}</strong>
                      <span>{category.marketing_subtitle || category.description || (locale === "en-CA" ? "Popular category" : "Categorie populaire")}</span>
                    </button>
                  ))}
                </div>

                <div className="form-grid form-grid-pro">
                  <label>
                    <span>{locale === "en-CA" ? "Category" : "Categorie"}</span>
                    <select onChange={(event) => updateDraft({ categoryId: event.target.value })} value={draft.categoryId}>
                      {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="field-wide">
                    <span>{locale === "en-CA" ? "Service" : "Service"}</span>
                    <select onChange={(event) => updateDraft({ serviceId: event.target.value })} value={draft.serviceId}>
                      {filteredServices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === "location" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "Where should the service happen?" : "Ou le service doit-il avoir lieu ?"}</strong>
                  <p>{locale === "en-CA" ? "City is used for provider matching. The address stays optional to reduce friction." : "La ville sert au matching. L'adresse reste optionnelle pour reduire la friction."}</p>
                </div>

                <div className="wizard-choice-grid wizard-choice-grid-compact">
                  {cityZones.slice(0, 8).map((zone) => (
                    <button
                      className={draft.zoneId === zone.id ? "wizard-choice-card wizard-choice-card-active" : "wizard-choice-card"}
                      key={zone.id}
                      onClick={() => updateDraft({ zoneId: zone.id })}
                      type="button"
                    >
                      <strong>{zone.name}</strong>
                      <span>{zone.marketing_blurb || (locale === "en-CA" ? "Active local coverage" : "Couverture locale active")}</span>
                    </button>
                  ))}
                </div>

                <div className="form-grid form-grid-pro">
                  <label>
                    <span>{locale === "en-CA" ? "City" : "Ville"}</span>
                    <select onChange={(event) => updateDraft({ zoneId: event.target.value })} value={draft.zoneId}>
                      {cityZones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="field-wide">
                    <span>{locale === "en-CA" ? "Address or landmark (optional)" : "Adresse ou repere (optionnel)"}</span>
                    <input onChange={(event) => updateDraft({ address: event.target.value })} placeholder={locale === "en-CA" ? "Apartment, access code, landmark..." : "Appartement, code d'acces, point de repere..."} value={draft.address} />
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === "details" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "Explain the need in simple words" : "Expliquez le besoin avec des mots simples"}</strong>
                  <p>{locale === "en-CA" ? "Keep it natural. We structure the request around your service, city and schedule." : "Restez naturel. Jobizy structure ensuite la demande autour du service, de la ville et du moment."}</p>
                </div>

                <div className="wizard-suggestion-row">
                  {[
                    locale === "en-CA" ? "Access is easier after 5 PM." : "L'acces est plus simple apres 17 h.",
                    locale === "en-CA" ? "I would like a clean and careful finish." : "Je veux un resultat propre et soigne.",
                    locale === "en-CA" ? "Please confirm the material needed." : "Merci de confirmer le materiel necessaire.",
                  ].map((suggestion) => (
                    <button className="ghost-button" key={suggestion} onClick={() => appendSuggestion(suggestion)} type="button">
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className="form-grid form-grid-pro">
                  <label className="field-wide">
                    <span>{locale === "en-CA" ? "Short title (optional)" : "Titre court (optionnel)"}</span>
                    <input onChange={(event) => updateDraft({ title: event.target.value })} placeholder={generatedTitle} value={draft.title} />
                  </label>
                  <label className="field-wide">
                    <span>{locale === "en-CA" ? "Describe your need" : "Decrivez votre besoin"}</span>
                    <textarea
                      minLength={10}
                      onChange={(event) => updateDraft({ description: event.target.value })}
                      placeholder={locale === "en-CA" ? "Example: 3 1/2 move, second floor, fragile furniture, elevator unavailable..." : "Ex. demenagement 3 1/2, deuxieme etage, meubles fragiles, ascenseur indisponible..."}
                      required
                      value={draft.description}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === "schedule" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "When do you need this service?" : "Quand avez-vous besoin de ce service ?"}</strong>
                  <p>{locale === "en-CA" ? "The clearer the timing, the faster providers can answer with a realistic quote." : "Plus le timing est clair, plus les prestataires peuvent repondre avec une offre realiste."}</p>
                </div>

                <div className="wizard-suggestion-row">
                  <button className="ghost-button" onClick={() => updateDraft({ desiredDate: todayIso(), urgency: "high" })} type="button">
                    {locale === "en-CA" ? "Today" : "Aujourd'hui"}
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      const offset = nextWeek.getTimezoneOffset();
                      const local = new Date(nextWeek.getTime() - offset * 60000);
                      updateDraft({ desiredDate: local.toISOString().slice(0, 10), urgency: "standard" });
                    }}
                    type="button"
                  >
                    {locale === "en-CA" ? "This week" : "Cette semaine"}
                  </button>
                </div>

                <div className="form-grid form-grid-pro">
                  <label>
                    <span>{locale === "en-CA" ? "Preferred date" : "Date souhaitee"}</span>
                    <input onChange={(event) => updateDraft({ desiredDate: event.target.value })} type="date" value={draft.desiredDate} />
                  </label>
                  <label>
                    <span>{locale === "en-CA" ? "Urgency" : "Urgence"}</span>
                    <select onChange={(event) => updateDraft({ urgency: event.target.value as RequestDraft["urgency"] })} value={draft.urgency}>
                      <option value="low">{locale === "en-CA" ? "Flexible" : "Flexible"}</option>
                      <option value="standard">{locale === "en-CA" ? "This week" : "Cette semaine"}</option>
                      <option value="high">{locale === "en-CA" ? "Urgent" : "Urgent"}</option>
                    </select>
                  </label>
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

            {currentStep === "budget" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "Budget helps filter serious replies" : "Le budget aide a filtrer les reponses serieuses"}</strong>
                  <p>{locale === "en-CA" ? "Keep it optional, but adding a range often improves response quality." : "Laissez cette etape optionnelle, mais une fourchette aide souvent a recevoir de meilleures offres."}</p>
                </div>

                <div className="form-grid form-grid-pro">
                  <label>
                    <span>{locale === "en-CA" ? "Budget from (CAD)" : "Budget a partir de (CAD)"}</span>
                    <input inputMode="decimal" min="0" onChange={(event) => updateDraft({ budgetMin: event.target.value })} placeholder="100" type="number" value={draft.budgetMin} />
                  </label>
                  <label>
                    <span>{locale === "en-CA" ? "Budget up to (CAD)" : "Budget jusqu'a (CAD)"}</span>
                    <input inputMode="decimal" min="0" onChange={(event) => updateDraft({ budgetMax: event.target.value })} placeholder="250" type="number" value={draft.budgetMax} />
                  </label>
                  <label className="field-wide">
                    <span>{locale === "en-CA" ? "Intervention mode" : "Mode d'intervention"}</span>
                    <select onChange={(event) => updateDraft({ workMode: event.target.value as RequestDraft["workMode"] })} value={draft.workMode}>
                      <option value="onsite">{locale === "en-CA" ? "Onsite" : "Sur place"}</option>
                      <option value="remote">{locale === "en-CA" ? "Remote" : "A distance"}</option>
                      <option value="hybrid">{locale === "en-CA" ? "Hybrid" : "Hybride"}</option>
                    </select>
                  </label>
                </div>

                {budgetMinCents != null && budgetMaxCents != null && budgetMaxCents < budgetMinCents ? (
                  <div className="notice notice-error">
                    {locale === "en-CA" ? "The maximum budget should be higher than the minimum budget." : "Le budget maximum doit etre superieur au budget minimum."}
                  </div>
                ) : null}
              </div>
            ) : null}

            {currentStep === "photos" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{locale === "en-CA" ? "Add visual context if it helps" : "Ajoutez du contexte visuel si utile"}</strong>
                  <p>{locale === "en-CA" ? "Photo upload is prepared here so you can describe what providers should look at." : "L'etape photo vous permet deja de preciser ce que les prestataires doivent regarder."}</p>
                </div>

                <div className="form-grid form-grid-pro">
                  <label className="field-wide">
                    <span>{locale === "en-CA" ? "Photos (optional)" : "Photos (optionnel)"}</span>
                    <input
                      multiple
                      onChange={(event) => updateDraft({ photoNames: Array.from(event.target.files ?? []).map((file) => file.name) })}
                      type="file"
                    />
                  </label>
                  <label className="field-wide">
                    <span>{locale === "en-CA" ? "What should providers notice?" : "Que doivent remarquer les prestataires ?"}</span>
                    <textarea onChange={(event) => updateDraft({ photoNote: event.target.value })} placeholder={locale === "en-CA" ? "Example: the leak is under the sink, the damaged wall is behind the washer..." : "Ex. la fuite est sous l'evier, le mur abime est derriere la laveuse..."} value={draft.photoNote} />
                  </label>
                </div>

                {draft.photoNames.length > 0 ? (
                  <div className="chip-row">
                    {draft.photoNames.map((name) => <span className="status-chip" key={name}>{name}</span>)}
                  </div>
                ) : (
                  <div className="empty-state empty-state-soft">
                    <strong>{locale === "en-CA" ? "No photo selected yet" : "Aucune photo selectionnee pour l'instant"}</strong>
                    <p>{locale === "en-CA" ? "You can keep going without photos if the request is already clear enough." : "Vous pouvez continuer sans photo si la demande est deja assez claire."}</p>
                  </div>
                )}
              </div>
            ) : null}

            {currentStep === "review" ? (
              <div className="stack">
                <div className="wizard-heading">
                  <strong>{editingDraftId ? (locale === "en-CA" ? "Review your changes" : "Verifier les modifications") : (locale === "en-CA" ? "Review before publishing" : "Verifier avant de publier")}</strong>
                  <p>{editingRequestStatus === "published"
                    ? (locale === "en-CA" ? "Save changes to update your published request. It will remain visible to providers." : "Enregistrez les modifications pour mettre a jour votre demande publiee. Elle restera visible par les prestataires.")
                    : editingDraftId
                      ? (locale === "en-CA" ? "Save changes to update this draft. You can publish it afterwards from your requests list." : "Enregistrez les modifications pour mettre a jour ce brouillon. Vous pourrez le publier ensuite depuis la liste.")
                      : (locale === "en-CA" ? "This final step reassures the client, avoids missing details and turns hesitation into action." : "Cette derniere etape rassure le client, evite les oublis et transforme l'hesitation en action.")
                  }</p>
                </div>

                <div className="review-grid">
                  <article className="tabular-card tabular-card-soft">
                    <strong>{generatedTitle}</strong>
                    <p>{requestDescription}</p>
                  </article>
                  <article className="tabular-card tabular-card-soft">
                    <div className="tabular-row"><strong>{locale === "en-CA" ? "Service" : "Service"}</strong><span>{selectedService?.name || "-"}</span></div>
                    <div className="tabular-row"><strong>{locale === "en-CA" ? "City" : "Ville"}</strong><span>{selectedZone?.name || "-"}</span></div>
                    <div className="tabular-row"><strong>{locale === "en-CA" ? "Date" : "Date"}</strong><span>{formatDate(draft.desiredDate)}</span></div>
                    <div className="tabular-row"><strong>{locale === "en-CA" ? "Timing" : "Horaire"}</strong><span>{draft.startTime} - {draft.endTime}</span></div>
                    <div className="tabular-row">
                      <strong>{locale === "en-CA" ? "Budget" : "Budget"}</strong>
                      <span>{budgetMinCents != null || budgetMaxCents != null ? `${money(budgetMinCents, platform?.currency ?? "CAD")} - ${money(budgetMaxCents, platform?.currency ?? "CAD")}` : (locale === "en-CA" ? "To discuss" : "A discuter")}</span>
                    </div>
                    <div className="tabular-row">
                      <strong>{locale === "en-CA" ? "Jobizy fee" : "Frais Jobizy"}</strong>
                      <span>{locale === "en-CA" ? "Free" : "Gratuits"}</span>
                    </div>
                  </article>
                </div>
              </div>
            ) : null}

            <div className="wizard-footer">
              <button className="ghost-button" disabled={currentStepIndex === 0} onClick={() => moveStep("prev")} type="button">
                {locale === "en-CA" ? "Back" : "Retour"}
              </button>

              <div className="wizard-footer-actions">
                <button
                  className="ghost-button"
                  onClick={() => {
                    if (editingDraftId) {
                      setEditingDraftId(null);
                      setView("list");
                    } else {
                      window.localStorage.removeItem(`${REQUEST_DRAFT_STORAGE_KEY}_${locale}`);
                      setDraft(createDefaultDraft());
                      setCurrentStep("service");
                    }
                  }}
                  type="button"
                >
                  {editingDraftId
                    ? (locale === "en-CA" ? "Cancel" : "Annuler")
                    : (locale === "en-CA" ? "Reset draft" : "Reinitialiser le brouillon")}
                </button>

                {currentStep !== "review" ? (
                  <button className="primary-button" disabled={!isStepComplete(currentStep)} onClick={() => moveStep("next")} type="button">
                    {locale === "en-CA" ? "Continue" : "Continuer"}
                  </button>
                ) : (
                  <button className="primary-button" disabled={!isStepComplete("review") || isSubmitting} onClick={() => void handlePublish()} type="button">
                    {isSubmitting
                      ? (locale === "en-CA" ? "Saving..." : "Enregistrement...")
                      : editingDraftId
                        ? (locale === "en-CA" ? "Save changes" : "Enregistrer les modifications")
                        : (locale === "en-CA" ? "Publish my request" : "Publier ma demande")}
                  </button>
                )}
              </div>
            </div>
        </section>
      </section>
      )}

    </section>
  );
}
