import { createDispute, createReview } from "../../lib/api";
import { useApp } from "../../app/AppProvider";
import { t } from "../../content/i18n";
import { EmptyState } from "../shared/Shared";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

export function ClientMissionsPage() {
  const { locale, session, missions, providerProfile, updateMissionStatus, refresh } = useApp();
  return (
    <section className="panel">
      <h2>{t(locale, "missionsClient")}</h2>
      <div className="stack">
        {missions.length === 0 ? <EmptyState title={t(locale, "noMission")} /> : null}
        {missions.map((mission) => (
          <article className="list-card" key={mission.id}>
            <div><strong>{mission.id}</strong><p>{t(locale, "linkedMission")} {mission.request_id}</p></div>
            <div className="card-meta"><span className="status-chip">{mission.status}</span><span>{formatDate(mission.created_at)}</span></div>
            <div className="cta-row">
              {mission.status === "en_cours" ? <button className="primary-button" onClick={() => void updateMissionStatus(mission.id, "complete")} type="button">{t(locale, "complete")}</button> : null}
              {!["terminee", "annulee", "en_litige"].includes(mission.status) ? <button className="ghost-button" onClick={() => void updateMissionStatus(mission.id, "cancel")} type="button">{t(locale, "cancel")}</button> : null}
              {mission.status === "terminee" && session && providerProfile ? <button className="ghost-button" onClick={async () => { await createReview(session, locale, { mission_id: mission.id, target_provider_profile_id: mission.provider_profile_id, rating: 5, comment: t(locale, "reviewCommentDefault") }); await refresh(); }} type="button">{t(locale, "leaveReview")}</button> : null}
              {session ? <button className="ghost-button" onClick={async () => { await createDispute(session, locale, { mission_id: mission.id, category: "client_issue", description: t(locale, "disputeDescriptionDefault") }); await refresh(); }} type="button">{t(locale, "openDispute")}</button> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
