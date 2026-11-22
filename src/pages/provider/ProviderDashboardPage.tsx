import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { ProviderOnboarding } from "../../components/ProviderOnboarding";
import { getAvailabilities, getProviderServices, getProviderZones } from "../../lib/api";
import { AppIcon } from "../../app/AppIcon";
import { ActionAssistant, EmptyState, SectionIntro, StatCard, ToneCard } from "../shared/Shared";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

export function ProviderDashboardPage() {
  const navigate = useNavigate();
  const { locale, session, matches, missions, subscriptions, providerProfile } = useApp();
  const [hasServices, setHasServices] = useState(false);
  const [hasZones, setHasZones] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      getProviderServices(session, locale as any).catch(() => []),
      getProviderZones(session, locale as any).catch(() => []),
      getAvailabilities(session, locale as any).catch(() => []),
    ]).then(([svcs, zones, avails]) => {
      setHasServices(svcs.filter((s: any) => s.status === "active").length > 0);
      setHasZones(zones.length > 0);
      setHasAvailability(avails.some((a: any) => a.is_active));
    });
  }, [session, locale]);

  const hotRequests = useMemo(() => matches.filter((item) => !item.responded_at).slice(0, 4), [matches]);
  const answeredCount = useMemo(() => matches.filter((item) => Boolean(item.responded_at)).length, [matches]);
  const activeMissions = useMemo(
    () => missions.filter((mission) => mission.status === "in_progress" || mission.status === "scheduled").length,
    [missions],
  );
  const completedMissions = useMemo(
    () => missions.filter((mission) => mission.status === "completed").length,
    [missions],
  );
  const L = (fr: string, en: string) => (locale === "en-CA" ? en : fr);
  const currentSubscription = subscriptions[0] ?? null;
  const currentPlan = currentSubscription?.plan_name ?? currentSubscription?.plan_code ?? (locale === "en-CA" ? "Free" : "Gratuit");
  const responseLimit = currentSubscription?.response_limit ?? null;
  const remainingResponses = responseLimit == null ? null : Math.max(responseLimit - answeredCount, 0);

  const recentActivity = useMemo(
    () => [
      ...hotRequests.slice(0, 2).map((match) => ({
        id: `hot-${match.id}`,
        title: locale === "en-CA" ? "New available request" : "Nouvelle demande disponible",
        body: match.request_title || match.title || (locale === "en-CA" ? "Local opportunity ready for reply." : "Opportunite locale prete pour reponse."),
        meta: `${match.urgency || (locale === "en-CA" ? "standard" : "standard")} • ${formatDate(match.desired_date)}`,
      })),
      ...missions.slice(0, 2).map((mission) => ({
        id: `mission-${mission.id}`,
        title: locale === "en-CA" ? "Mission update" : "Mise a jour mission",
        body: `${locale === "en-CA" ? "Mission" : "Mission"} ${mission.status}`,
        meta: formatDate(mission.created_at),
      })),
    ].slice(0, 4),
    [hotRequests, locale, missions],
  );

  const profileCompletionItems = [
    providerProfile?.display_name
      ? locale === "en-CA"
        ? "Public name is visible"
        : "Le nom public est visible"
      : locale === "en-CA"
        ? "Add a public display name"
        : "Ajouter un nom public",
    providerProfile?.description
      ? locale === "en-CA"
        ? "Description is ready"
        : "La description est prete"
      : locale === "en-CA"
        ? "Add a stronger provider description"
        : "Ajouter une description prestataire plus forte",
    providerProfile?.verification_status === "verified"
      ? locale === "en-CA"
        ? "Verification strengthens trust"
        : "La verification renforce la confiance"
      : locale === "en-CA"
        ? "Finish verification to increase credibility"
        : "Finaliser la verification pour gagner en credibilite",
  ];

  return (
    <section className="stack stack-xl">
      <ProviderOnboarding
        locale={locale}
        providerProfile={providerProfile}
        hasServices={hasServices}
        hasZones={hasZones}
        hasAvailability={hasAvailability}
        hasSentOffer={answeredCount > 0}
      />

      <header className="dash-header">
        <div>
          <h1>{L("Bonjour", "Hello")} {session?.user.first_name} <span aria-hidden="true">👋</span></h1>
          <p>{L("Voici un aperçu de votre activité.", "Here is an overview of your activity.")}</p>
        </div>
        <button className="plan-badge" onClick={() => navigate(`/${locale}/pro/abonnement`)} type="button">
          <AppIcon className="button-icon" name="subscription" />
          <span>
            <strong>{L("Plan", "Plan")} {currentPlan}</strong>
            {currentSubscription?.ends_at ? <small>{L("Jusqu'au", "Until")} {formatDate(currentSubscription.ends_at)}</small> : <small>{L("Gérer mon plan", "Manage my plan")}</small>}
          </span>
        </button>
      </header>

      <div className="kpi-row">
        <StatCard icon="requests" label={L("Demandes disponibles", "Available requests")} value={String(hotRequests.length)} tone="action" />
        <StatCard icon="messages" label={L("Réponses envoyées", "Replies sent")} value={String(answeredCount)} tone="info" />
        <StatCard icon="mission" label={L("Missions en cours", "Missions in progress")} value={String(activeMissions)} tone="support" />
        <StatCard icon="check" label={L("Missions terminées", "Completed missions")} value={String(completedMissions)} tone="trust" />
      </div>

      <section className="panel panel-clean">
        <div className="section-head">
          <h2>{L("Nouvelles demandes près de vous", "New requests near you")}</h2>
          <button className="text-link-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
            {L("Voir tout", "See all")} →
          </button>
        </div>
        {hotRequests.length === 0 ? (
          <EmptyState
            title={L("Pas de nouvelle demande pour l'instant.", "No new request right now.")}
            body={L("Complétez votre profil et gardez les notifications actives pour recevoir les prochaines demandes.", "Complete your profile and keep notifications on to receive the next requests.")}
            action={
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/profil`)} type="button">
                {L("Compléter mon profil", "Complete my profile")}
              </button>
            }
          />
        ) : (
          <div className="row-list">
            {hotRequests.map((match) => (
              <article className="row-card" key={match.id}>
                <span className="row-card-icon"><AppIcon name="requests" /></span>
                <div className="row-card-main">
                  <strong>{match.request_title || match.title || `Demande ${match.request_id}`}</strong>
                  <span className="row-card-meta">
                    <AppIcon className="meta-icon" name="calendar" /> {formatDate(match.desired_date)}
                    {match.description ? <> · {match.description.slice(0, 70)}{match.description.length > 70 ? "…" : ""}</> : null}
                  </span>
                </div>
                <div className="row-card-side">
                  {match.urgency && match.urgency !== "normal" ? <span className="count-chip count-chip-brand">{match.urgency}</span> : null}
                  <button className="primary-button compact-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                    {L("Répondre", "Reply")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-grid">
        <ActionAssistant
          action={
            <div className="button-group">
              <button className="secondary-button" onClick={() => navigate(`/${locale}/pro/profil`)} type="button">
                {locale === "en-CA" ? "Improve profile" : "Ameliorer le profil"}
              </button>
              <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/reputation`)} type="button">
                {locale === "en-CA" ? "Open reviews" : "Voir les avis"}
              </button>
            </div>
          }
          body={locale === "en-CA" ? "A complete profile, fast replies and good reviews help you win more missions." : "Un profil complet, des réponses rapides et de bons avis vous aident à décrocher plus de missions."}
          icon="provider"
          items={profileCompletionItems}
          title={locale === "en-CA" ? "Provider checklist" : "Checklist prestataire"}
          tone="support"
        />

        <ToneCard className="tabular-card" tone="action">
          <p className="eyebrow">{locale === "en-CA" ? "Upgrade lever" : "Levier d'upgrade"}</p>
          <div className="tabular-row"><strong>{locale === "en-CA" ? "Current plan" : "Plan actuel"}</strong><span>{currentPlan}</span></div>
          <div className="tabular-row"><strong>{locale === "en-CA" ? "Replies remaining" : "Reponses restantes"}</strong><span>{remainingResponses == null ? (locale === "en-CA" ? "Unlimited" : "Illimitees") : remainingResponses}</span></div>
          <div className="chip-row">
            <span className="status-chip status-chip-brand">{locale === "en-CA" ? "Priority requests" : "Demandes prioritaires"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Visibility boost" : "Boost de visibilite"}</span>
            <span className="status-chip">{locale === "en-CA" ? "Faster growth" : "Croissance plus rapide"}</span>
          </div>
          <div className="cta-row">
            <button className="primary-button" onClick={() => navigate(`/${locale}/pro/abonnement`)} type="button">
              {locale === "en-CA" ? "See plans" : "Voir les abonnements"}
            </button>
          </div>
        </ToneCard>
      </section>

      <section className="panel panel-clean">
        <SectionIntro eyebrow={locale === "en-CA" ? "Recent activity" : "Activite recente"} title={locale === "en-CA" ? "What moved recently" : "Ce qui a bouge recemment"} />
        <div className="stack">
          {recentActivity.length === 0 ? (
            <EmptyState title={locale === "en-CA" ? "No recent activity yet." : "Pas encore d'activite recente."} />
          ) : (
            recentActivity.map((item) => (
              <article className="list-card" key={item.id}>
                <div className="service-card-header">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                  <span className="status-chip">{item.meta}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
