import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { createReview } from "../../lib/api";
import type { Mission } from "../../types";
import { EmptyState, SectionIntro, StatCard } from "../shared/Shared";
import { Modal } from "../../components/Modal";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px", cursor: "pointer" }} onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          style={{ fontSize: "1.5rem", color: (hovered || value) >= star ? "#f59e0b" : "#d1d5db", transition: "color 0.1s" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ProviderReviewForm({
  mission,
  locale,
  onDone,
  onCancel,
}: {
  mission: Mission;
  locale: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { session } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fr = locale !== "en-CA";

  async function handleSubmit() {
    if (!session) return;
    setSubmitting(true);
    setError("");
    try {
      await createReview(session, locale as any, {
        mission_id: mission.id,
        target_user_id: mission.client_user_id,
        rating,
        comment: comment.trim() || null,
      });
      onDone();
    } catch (err: any) {
      setError(err?.message ?? (fr ? "Erreur lors de l'envoi." : "Failed to submit review."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #f3f4f6" }}>
      <p style={{ fontSize: "0.82rem", fontWeight: 600 }}>
        {fr ? "Notez ce client" : "Rate this client"}
      </p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        placeholder={fr ? "Commentaire (optionnel)…" : "Comment (optional)…"}
        rows={2}
        style={{ width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "0.5rem 0.75rem", fontSize: "0.85rem", resize: "vertical", fontFamily: "inherit" }}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="notice notice-error" style={{ margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="primary-button" disabled={submitting} onClick={handleSubmit} type="button">
          {submitting ? "…" : fr ? "Envoyer" : "Submit"}
        </button>
        <button className="ghost-button" onClick={onCancel} type="button">
          {fr ? "Annuler" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

export function ProviderMissionsPage() {
  const navigate = useNavigate();
  const { locale, session, missions, updateMissionStatus } = useApp();
  const [openReviewFor, setOpenReviewFor] = useState<string | null>(null);
  const [reviewedMissionIds, setReviewedMissionIds] = useState<string[]>([]);
  const fr = locale !== "en-CA";

  const inProgress = useMemo(
    () => missions.filter((m) => ["confirmee", "planifiee", "en_cours"].includes(m.status)),
    [missions],
  );
  const completed = useMemo(() => missions.filter((m) => m.status === "terminee" || m.status === "completed"), [missions]);
  const cancelled = useMemo(() => missions.filter((m) => m.status === "annulee" || m.status === "cancelled"), [missions]);

  const STATUS_LABEL: Record<string, { fr: string; en: string; chip: string }> = {
    confirmee: { fr: "Confirmée", en: "Confirmed", chip: "status-chip-brand" },
    planifiee: { fr: "Planifiée", en: "Scheduled", chip: "status-chip-published" },
    en_cours: { fr: "En cours", en: "In progress", chip: "status-chip-discussion" },
    terminee: { fr: "Terminée", en: "Completed", chip: "status-chip-success" },
    completed: { fr: "Terminée", en: "Completed", chip: "status-chip-success" },
    annulee: { fr: "Annulée", en: "Cancelled", chip: "status-chip-cancelled" },
    cancelled: { fr: "Annulée", en: "Cancelled", chip: "status-chip-cancelled" },
  };

  function statusLabel(status: string) {
    const s = STATUS_LABEL[status];
    if (!s) return status;
    return fr ? s.fr : s.en;
  }
  function statusChip(status: string) {
    return STATUS_LABEL[status]?.chip ?? "";
  }

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={fr ? "Mes missions" : "My missions"}
          title={fr ? "Travaux en cours et terminés" : "Ongoing and completed work"}
          body={fr
            ? "Gérez vos missions et notez vos clients après chaque mission terminée — la symétrie des avis renforce la confiance de toute la plateforme."
            : "Manage your missions and rate your clients after each completed mission — mutual reviews strengthen platform trust."}
          aside={
            <div className="button-group">
              <button className="secondary-button" onClick={() => navigate(`/${locale}/pro/messages`)} type="button">
                {fr ? "Messages" : "Messages"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                {fr ? "Voir les demandes" : "See requests"}
              </button>
            </div>
          }
        />
        <div className="hero-panel">
          <StatCard label={fr ? "En cours" : "In progress"} tone="action" value={String(inProgress.length)} />
          <StatCard label={fr ? "Terminées" : "Completed"} tone="trust" value={String(completed.length)} />
          <StatCard label={fr ? "Annulées" : "Cancelled"} tone="info" value={String(cancelled.length)} />
          <StatCard label={fr ? "Total" : "Total"} tone="support" value={String(missions.length)} />
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro eyebrow={fr ? "Liste" : "List"} title={fr ? "Toutes mes missions" : "All my missions"} />
        <div className="stack">
          {missions.length === 0 ? (
            <EmptyState
              title={fr ? "Aucune mission pour l'instant." : "No missions yet."}
              body={fr ? "Vos missions apparaîtront ici dès qu'un client accepte votre offre." : "Missions appear here when a client accepts your quote."}
              action={
                <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                  {fr ? "Voir les demandes" : "See requests"}
                </button>
              }
            />
          ) : (
            missions.map((mission) => {
              const isCompleted = mission.status === "terminee" || mission.status === "completed";
              const canReview = isCompleted && !reviewedMissionIds.includes(mission.id);
              return (
                <article className="list-card" key={mission.id}>
                  <div className="service-card-header">
                    <div>
                      <strong>{fr ? "Mission" : "Mission"} #{mission.id.slice(0, 8)}</strong>
                      <p style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                        {fr ? "Créée le" : "Created"} {formatDate(mission.created_at)}
                        {mission.completed_at && ` · ${fr ? "Terminée le" : "Completed"} ${formatDate(mission.completed_at)}`}
                      </p>
                    </div>
                    <span className={`status-chip ${statusChip(mission.status)}`}>
                      {statusLabel(mission.status)}
                    </span>
                  </div>

                  <div className="cta-row">
                    {mission.status === "confirmee" && (
                      <button className="primary-button" onClick={() => void updateMissionStatus(mission.id, "plan")} type="button">
                        {fr ? "Planifier" : "Schedule"}
                      </button>
                    )}
                    {["confirmee", "planifiee"].includes(mission.status) && (
                      <button className="primary-button" onClick={() => void updateMissionStatus(mission.id, "start")} type="button">
                        {fr ? "Démarrer" : "Start"}
                      </button>
                    )}
                    {mission.status === "en_cours" && (
                      <button className="primary-button" onClick={() => void updateMissionStatus(mission.id, "complete")} type="button">
                        {fr ? "Marquer terminée" : "Mark complete"}
                      </button>
                    )}
                    <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/messages`)} type="button">
                      {fr ? "Contacter le client" : "Contact client"}
                    </button>
                    {canReview && (
                      <button className="btn btn-outline btn-sm" onClick={() => setOpenReviewFor(mission.id)} type="button">
                        {fr ? "Noter le client" : "Rate client"}
                      </button>
                    )}
                    {isCompleted && reviewedMissionIds.includes(mission.id) && (
                      <span style={{ fontSize: "0.78rem", color: "#10b981" }}>✓ {fr ? "Client noté" : "Client rated"}</span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {openReviewFor && session && (() => {
          const mission = missions.find((m) => m.id === openReviewFor);
          if (!mission) return null;
          return (
            <Modal onClose={() => setOpenReviewFor(null)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ margin: 0 }}>{fr ? "Noter le client" : "Rate the client"}</h4>
                <button className="ghost-button compact-button" onClick={() => setOpenReviewFor(null)} type="button">
                  {fr ? "Fermer" : "Close"}
                </button>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.75rem" }}>
                {fr ? "Mission" : "Mission"} #{mission.id.slice(0, 8)}
                {mission.completed_at && ` · ${fr ? "Terminée le" : "Completed"} ${formatDate(mission.completed_at)}`}
              </p>
              <ProviderReviewForm
                locale={locale}
                mission={mission}
                onCancel={() => setOpenReviewFor(null)}
                onDone={() => {
                  setReviewedMissionIds((prev) => [...prev, mission.id]);
                  setOpenReviewFor(null);
                }}
              />
            </Modal>
          );
        })()}
      </section>
    </section>
  );
}
