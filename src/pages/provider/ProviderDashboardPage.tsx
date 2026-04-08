import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { ProviderOnboarding } from "../../components/ProviderOnboarding";
import { getAvailabilities, getProviderServices, getProviderZones } from "../../lib/api";
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
  const currentSubscription = subscriptions[0] ?? null;
  const currentPlan = currentSubscription?.plan_name ?? currentSubscription?.plan_code ?? (locale === "en-CA" ? "Free" : "Gratuit");
  const responseLimit = currentSubscription?.response_limit ?? null;
  const remainingResponses = responseLimit == null ? null : Math.max(responseLimit - answeredCount, 0);

  const requestsToday = useMemo(() => {
    const today = new Date();
    return matches.filter((item) => {
      if (!item.desired_date) return false;
      const desired = new Date(item.desired_date);
      return (
        desired.getFullYear() === today.getFullYear() &&
        desired.getMonth() === today.getMonth() &&
        desired.getDate() === today.getDate()
      );
    }).length;
  }, [matches]);

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

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Provider dashboard" : "Dashboard prestataire"}
          title={locale === "en-CA" ? "Show live demand first, then help the provider turn replies into missions" : "Montrer la demande en premier, puis aider le prestataire a transformer ses reponses en missions"}
          body={locale === "en-CA" ? "This dashboard is built around opportunities: hot requests to answer, current activity, plan leverage and the fastest route to revenue." : "Ce dashboard est construit autour des opportunites : demandes chaudes a traiter, activite en cours, levier du plan et chemin le plus rapide vers le revenu."}
          aside={
            <div className="button-group">
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                {locale === "en-CA" ? "Reply to requests" : "Repondre aux demandes"}
              </button>
              <button className="secondary-button" onClick={() => navigate(`/${locale}/pro/abonnement`)} type="button">
                {currentPlan === "Free" || currentPlan === "Gratuit"
                  ? (locale === "en-CA" ? "Upgrade to Pro" : "Passer en Pro")
                  : (locale === "en-CA" ? "View my plan" : "Voir mon plan")}
              </button>
            </div>
          }
        />
        <div className="hero-panel">
          <StatCard icon="bolt" detail={locale === "en-CA" ? "Immediately actionable" : "Actionnables immediatement"} label={locale === "en-CA" ? "Hot requests" : "Demandes chaudes"} tone="action" value={String(hotRequests.length)} deltaPositive={hotRequests.length > 0} delta={hotRequests.length > 0 ? (locale === "en-CA" ? "Act now" : "Agir maintenant") : undefined} />
          <StatCard icon="spark" detail={locale === "en-CA" ? "Visible in your area" : "Visibles dans votre zone"} label={locale === "en-CA" ? "Requests today" : "Demandes du jour"} tone="info" value={String(requestsToday)} />
          <StatCard icon="mission" detail={locale === "en-CA" ? "Execution in progress" : "Execution en cours"} label={locale === "en-CA" ? "Current missions" : "Missions en cours"} tone="support" value={String(activeMissions)} />
          <StatCard icon="subscription" detail={locale === "en-CA" ? "Your current lever" : "Votre levier actuel"} label={locale === "en-CA" ? "Current plan" : "Plan actuel"} tone="trust" value={currentPlan} />
        </div>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Hot requests" : "Demandes chaudes"}
          title={locale === "en-CA" ? "Requests to answer first" : "Demandes a traiter en priorite"}
          body={locale === "en-CA" ? "The provider should never arrive on an empty dashboard. Lead cards stay visible and answer-ready." : "Le prestataire ne doit jamais arriver sur un dashboard vide. Les cartes de leads restent visibles et pretes a etre traitees."}
        />
        {hotRequests.length === 0 ? (
          <EmptyState
            title={locale === "en-CA" ? "No fresh request right now." : "Pas de nouvelle demande immediate."}
            body={locale === "en-CA" ? "Complete your profile and keep notifications active to surface the next available lead quickly." : "Completez votre profil et gardez les notifications actives pour faire remonter le prochain lead rapidement."}
            action={
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/profil`)} type="button">
                {locale === "en-CA" ? "Complete provider profile" : "Completer le profil prestataire"}
              </button>
            }
          />
        ) : (
          <div className="provider-request-grid">
            {hotRequests.map((match) => (
              <article className="provider-request-card" key={match.id}>
                <div className="service-card-header">
                  <div>
                    <strong>{match.request_title || match.title || `Demande ${match.request_id}`}</strong>
                    <p>{match.description || (locale === "en-CA" ? "Nearby request matched to your profile." : "Demande proche matchee avec votre profil.")}</p>
                  </div>
                  <span className="status-chip status-chip-success">{match.urgency || (locale === "en-CA" ? "standard" : "standard")}</span>
                </div>
                <div className="request-card-details">
                  <span>{locale === "en-CA" ? "Desired date" : "Date souhaitee"} {formatDate(match.desired_date)}</span>
                  <span>{locale === "en-CA" ? "Fit score" : "Score de pertinence"} {match.match_score ?? 90}</span>
                  <span>{locale === "en-CA" ? "Fast reply recommended" : "Reponse rapide recommandee"}</span>
                </div>
                <div className="cta-row">
                  <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                    {locale === "en-CA" ? "Reply" : "Repondre"}
                  </button>
                  <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/messages`)} type="button">
                    {locale === "en-CA" ? "Open messages" : "Ouvrir les messages"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-grid">
        <ToneCard className="tabular-card" tone="info">
          <p className="eyebrow">{locale === "en-CA" ? "Performance snapshot" : "Vue performance"}</p>
          <div className="tabular-row"><strong>{locale === "en-CA" ? "Responses sent" : "Reponses envoyees"}</strong><span>{answeredCount}</span></div>
          <div className="tabular-row"><strong>{locale === "en-CA" ? "Completed missions" : "Missions terminees"}</strong><span>{completedMissions}</span></div>
          <div className="tabular-row"><strong>{locale === "en-CA" ? "Average rating" : "Note moyenne"}</strong><span>{providerProfile?.rating_avg ?? 0}/5</span></div>
          <div className="tabular-row"><strong>{locale === "en-CA" ? "Verification" : "Verification"}</strong><span>{providerProfile?.verification_status ?? (locale === "en-CA" ? "Pending" : "En attente")}</span></div>
        </ToneCard>

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
          body={locale === "en-CA" ? "Better conversion starts with a stronger profile, faster replies and visible trust signals." : "Une meilleure conversion commence par un profil plus fort, des reponses plus rapides et des signaux de confiance visibles."}
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
