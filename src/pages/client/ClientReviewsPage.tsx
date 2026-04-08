import { useEffect, useMemo, useState } from "react";
import { createReview, getMyClientReputation } from "../../lib/api";
import { useApp } from "../../app/AppProvider";
import type { Review } from "../../types";
import { EmptyState, SectionIntro } from "../shared/Shared";

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
          style={{ fontSize: "1.6rem", color: (hovered || value) >= star ? "#f59e0b" : "#d1d5db", transition: "color 0.1s" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ color: value >= star ? "#f59e0b" : "#d1d5db", fontSize: "1rem" }}>★</span>
      ))}
    </span>
  );
}

function ReviewForm({
  missionId,
  providerProfileId,
  locale,
  onDone,
}: {
  missionId: string;
  providerProfileId: string;
  locale: string;
  onDone: () => void;
}) {
  const { session } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!session) return;
    setSubmitting(true);
    setError("");
    try {
      await createReview(session, locale as any, {
        mission_id: missionId,
        target_provider_profile_id: providerProfileId,
        rating,
        comment: comment.trim() || null,
      });
      onDone();
    } catch (err: any) {
      setError(err?.message ?? (locale === "en-CA" ? "Failed to submit review." : "Erreur lors de l'envoi."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "0.75rem" }}>
      <div>
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.4rem" }}>
          {locale === "en-CA" ? "Your rating" : "Votre note"}
        </p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <textarea
        placeholder={locale === "en-CA" ? "Leave a comment (optional)…" : "Laisser un commentaire (optionnel)…"}
        rows={3}
        style={{ width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "0.6rem 0.8rem", fontSize: "0.88rem", resize: "vertical", fontFamily: "inherit" }}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="notice notice-error" style={{ margin: 0 }}>{error}</p>}
      <button className="primary-button" disabled={submitting} onClick={handleSubmit} type="button" style={{ alignSelf: "flex-start" }}>
        {submitting ? "…" : locale === "en-CA" ? "Submit review" : "Envoyer l'avis"}
      </button>
    </div>
  );
}

export function ClientReviewsPage() {
  const { locale, session, missions, refresh } = useApp();
  const [submittedMissionIds, setSubmittedMissionIds] = useState<string[]>([]);
  const [openFormFor, setOpenFormFor] = useState<string | null>(null);
  const [myReputation, setMyReputation] = useState<Review[]>([]);
  const fr = locale !== "en-CA";

  useEffect(() => {
    if (!session) return;
    getMyClientReputation(session, locale as any)
      .then(setMyReputation)
      .catch(() => undefined);
  }, [session, locale]);

  const completedMissions = useMemo(
    () => missions.filter((m) => m.status === "completed" || m.status === "terminee"),
    [missions],
  );
  const pendingReview = useMemo(
    () => completedMissions.filter((m) => !submittedMissionIds.includes(m.id)),
    [completedMissions, submittedMissionIds],
  );

  const avgReputation =
    myReputation.length > 0
      ? myReputation.reduce((s, r) => s + r.rating, 0) / myReputation.length
      : null;

  return (
    <section className="stack stack-xl">
      {/* Header */}
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={fr ? "Avis" : "Reviews"}
          title={fr ? "Notez vos prestataires" : "Rate your providers"}
          body={fr
            ? "Après chaque mission, notez votre prestataire pour aider la communauté. Les prestataires peuvent aussi vous noter — votre réputation client est visible ici."
            : "After each mission, rate your provider to help the community. Providers can also rate you — your client reputation is shown here."}
        />
        <div className="hero-panel">
          <div className="stat-card stat-card-trust">
            <span className="stat-value">{completedMissions.length}</span>
            <span className="stat-label">{fr ? "Missions terminées" : "Completed missions"}</span>
          </div>
          <div className="stat-card stat-card-action">
            <span className="stat-value">{pendingReview.length}</span>
            <span className="stat-label">{fr ? "À noter" : "To rate"}</span>
          </div>
          <div className="stat-card stat-card-info">
            <span className="stat-value">{avgReputation !== null ? avgReputation.toFixed(1) : "—"}</span>
            <span className="stat-label">{fr ? "Ma note client" : "My client rating"}</span>
          </div>
        </div>
      </section>

      {/* Pending reviews */}
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={fr ? "À noter" : "Pending reviews"}
          title={fr ? "Missions en attente d'avis" : "Missions waiting for feedback"}
        />
        <div className="stack">
          {pendingReview.length === 0 ? (
            <EmptyState
              title={fr ? "Tout est noté !" : "All caught up!"}
              body={fr ? "Aucune mission en attente d'avis." : "No missions waiting for a review."}
            />
          ) : (
            pendingReview.map((mission) => (
              <article className="list-card" key={mission.id}>
                <div className="service-card-header">
                  <div>
                    <strong>{fr ? "Mission terminée" : "Completed mission"}</strong>
                    <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {fr ? "Terminée le" : "Completed"} {formatDate(mission.completed_at)}
                    </p>
                  </div>
                  <span className="status-chip status-chip-success">{fr ? "Terminée" : "Completed"}</span>
                </div>
                {openFormFor === mission.id ? (
                  <ReviewForm
                    locale={locale}
                    missionId={mission.id}
                    providerProfileId={mission.provider_profile_id}
                    onDone={async () => {
                      setSubmittedMissionIds((prev) => [...prev, mission.id]);
                      setOpenFormFor(null);
                      await refresh();
                    }}
                  />
                ) : (
                  <div className="cta-row">
                    <button
                      className="primary-button"
                      onClick={() => setOpenFormFor(mission.id)}
                      type="button"
                    >
                      {fr ? "Laisser un avis" : "Leave a review"}
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      {/* My client reputation */}
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={fr ? "Ma réputation client" : "My client reputation"}
          title={fr ? "Avis reçus des prestataires" : "Reviews received from providers"}
          body={fr
            ? "Les prestataires notent aussi les clients. Une bonne réputation vous aide à recevoir plus d'offres."
            : "Providers also rate clients. A good reputation helps you receive more offers."}
        />
        <div className="stack">
          {myReputation.length === 0 ? (
            <EmptyState
              title={fr ? "Pas encore d'avis reçu." : "No reviews received yet."}
              body={fr ? "Les prestataires pourront vous noter après une mission terminée." : "Providers can rate you after a completed mission."}
            />
          ) : (
            myReputation.map((review) => {
              const authorName = review.author_display_name || review.author_business_name
                || [review.author_first_name, review.author_last_name].filter(Boolean).join(" ")
                || (fr ? "Prestataire" : "Provider");
              return (
                <article className="list-card" key={review.id}>
                  <div className="service-card-header">
                    <div>
                      <strong>{authorName}</strong>
                      <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>{formatDate(review.created_at)}</p>
                    </div>
                    <StarDisplay value={review.rating} />
                  </div>
                  {review.comment && (
                    <p style={{ fontSize: "0.88rem", color: "#374151", marginTop: "0.5rem" }}>"{review.comment}"</p>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}
