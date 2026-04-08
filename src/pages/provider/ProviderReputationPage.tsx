import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReviews } from "../../lib/api";
import { useApp } from "../../app/AppProvider";
import { ActionAssistant, EmptyState, SectionIntro, StatCard } from "../shared/Shared";

export function ProviderReputationPage() {
  const navigate = useNavigate();
  const { session, locale, providerProfile } = useApp();
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!session || !providerProfile) return;
      setReviews(await getReviews(session, locale, providerProfile.id));
    }
    void load();
  }, [session, locale, providerProfile]);

  const ratingDistribution = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    }));
    return counts;
  }, [reviews]);

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Reputation" : "Reputation"}
          title={locale === "en-CA" ? "Turn reviews into a trust and conversion asset" : "Transformer les avis en actif de confiance et de conversion"}
          body={locale === "en-CA" ? "The reputation profile should connect proof, profile quality and the habits that generate better public perception." : "Le profil reputation doit relier les preuves, la qualite du profil et les habitudes qui generent une meilleure perception publique."}
          aside={
            <div className="button-group">
              <button className="secondary-button" onClick={() => navigate(`/${locale}/pro/profil`)} type="button">
                {locale === "en-CA" ? "Edit profile" : "Modifier le profil"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                {locale === "en-CA" ? "Open leads" : "Voir les leads"}
              </button>
            </div>
          }
        />
        <div className="hero-panel">
          <StatCard label={locale === "en-CA" ? "Average rating" : "Note moyenne"} value={String(providerProfile?.rating_avg ?? 0)} tone="trust" />
          <StatCard label={locale === "en-CA" ? "Published reviews" : "Avis publies"} value={String(providerProfile?.rating_count ?? 0)} tone="info" />
          <StatCard label={locale === "en-CA" ? "Completed missions" : "Missions terminees"} value={String(providerProfile?.completed_missions_count ?? 0)} tone="support" />
          <StatCard label={locale === "en-CA" ? "Verification" : "Verification"} value={providerProfile?.verification_status ?? "-"} tone="action" />
        </div>
      </section>

      <ActionAssistant
        action={
          <div className="button-group">
            <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/messages`)} type="button">
              {locale === "en-CA" ? "Open messages" : "Ouvrir les messages"}
            </button>
            <button className="secondary-button" onClick={() => navigate(`/${locale}/recherche`)} type="button">
              {locale === "en-CA" ? "Check search presence" : "Verifier la presence en recherche"}
            </button>
          </div>
        }
        body={locale === "en-CA" ? "Trust grows when your public profile, response speed and latest reviews all tell the same story. Use this page as a reputation assistant, not just an archive." : "La confiance grandit quand le profil public, la vitesse de reponse et les derniers avis racontent la meme histoire. Utilisez cette page comme un assistant de reputation, pas seulement comme une archive."}
        icon="reputation"
        items={[
          locale === "en-CA" ? "Keep profile details current" : "Garder les details du profil a jour",
          locale === "en-CA" ? "Reply quickly to new leads" : "Repondre vite aux nouveaux leads",
          locale === "en-CA" ? "Aim for consistent recent reviews" : "Viser des avis recents reguliers",
        ]}
        title={locale === "en-CA" ? "Reputation assistant" : "Assistant reputation"}
        tone="trust"
      />

      <section className="dashboard-grid">
        <article className="panel panel-clean">
          <SectionIntro eyebrow={locale === "en-CA" ? "Breakdown" : "Repartition"} title={locale === "en-CA" ? "Rating distribution" : "Distribution des notes"} />
          <div className="stack">
            {ratingDistribution.map((item) => (
              <div className="tabular-row" key={item.rating}>
                <strong>{item.rating}/5</strong>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel-clean">
          <SectionIntro eyebrow={locale === "en-CA" ? "Signals" : "Signaux"} title={locale === "en-CA" ? "What strengthens trust" : "Ce qui renforce la confiance"} />
          <div className="chip-row">
            <span className="status-chip status-chip-success">{locale === "en-CA" ? "Verified profile" : "Profil verifie"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Response metrics visible" : "Metriques de reponse visibles"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Completed mission count" : "Volume de missions terminees"}</span>
          </div>
          <p className="section-copy">
            {locale === "en-CA" ? "Keep the proof simple and public-facing: ratings, speed, verification and completed work." : "Garder des preuves simples et utiles au public : notes, vitesse, verification et travaux termines."}
          </p>
        </article>
      </section>

      <section className="panel panel-clean">
        <SectionIntro eyebrow={locale === "en-CA" ? "Published reviews" : "Avis publies"} title={locale === "en-CA" ? "Client feedback" : "Retours clients"} />
        <div className="stack">
          {reviews.length === 0 ? <EmptyState title={locale === "en-CA" ? "No review published yet." : "Aucun avis publie."} /> : null}
          {reviews.map((review) => (
            <article className="list-card" key={review.id}>
              <div className="service-card-header">
                <div>
                  <strong>{review.rating}/5</strong>
                  <p>{review.comment || (locale === "en-CA" ? "No comment" : "Sans commentaire")}</p>
                </div>
                <span className="status-chip">{review.status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
