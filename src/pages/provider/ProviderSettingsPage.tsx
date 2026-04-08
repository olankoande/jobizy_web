import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { EmptyState, SectionIntro, StatCard } from "../shared/Shared";

function bool(value: boolean | number | null | undefined) {
  return value === true || value === 1;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

export function ProviderSettingsPage() {
  const navigate = useNavigate();
  const { locale, session, notifications, preferences, subscriptions, markAllNotificationsRead, savePreferences } = useApp();

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Settings" : "Parametres"}
          title={locale === "en-CA" ? "Keep provider notifications, account security and plan reminders easy to manage" : "Garder les notifications prestataire, la securite du compte et les rappels de plan faciles a gerer"}
          body={locale === "en-CA" ? "The provider settings page should stay practical: what needs your attention, what should notify you and how to keep the account ready for incoming demand." : "La page parametres prestataire doit rester pratique : ce qui demande votre attention, ce qui doit vous notifier et comment garder le compte pret pour la demande entrante."}
          aside={
            <div className="button-group">
              <button className="ghost-button" onClick={() => void markAllNotificationsRead()} type="button">
                {locale === "en-CA" ? "Mark all read" : "Tout marquer comme lu"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/abonnement`)} type="button">
                {locale === "en-CA" ? "Manage plan" : "Gerer le plan"}
              </button>
            </div>
          }
        />
        <div className="hero-panel">
          <StatCard label={locale === "en-CA" ? "Unread notifications" : "Notifications non lues"} tone="info" value={String(notifications.filter((item) => !item.is_read).length)} />
          <StatCard label={locale === "en-CA" ? "Current plan" : "Plan actuel"} tone="action" value={subscriptions[0]?.plan_name ?? subscriptions[0]?.plan_code ?? (locale === "en-CA" ? "Free" : "Gratuit")} />
          <StatCard label={locale === "en-CA" ? "Email verified" : "Email verifie"} tone="trust" value={session?.user.email_verified_at ? (locale === "en-CA" ? "Yes" : "Oui") : (locale === "en-CA" ? "No" : "Non")} />
          <StatCard label={locale === "en-CA" ? "Phone number" : "Telephone"} tone="support" value={session?.user.phone || "-"} />
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel panel-clean">
          <SectionIntro eyebrow={locale === "en-CA" ? "Notifications" : "Notifications"} title={locale === "en-CA" ? "Delivery preferences" : "Preferences de diffusion"} />
          {preferences ? (
            <div className="toggle-grid">
              <label className="toggle-card"><span>{locale === "en-CA" ? "Message emails" : "Emails messages"}</span><input checked={bool(preferences.email_messages_enabled)} onChange={(event) => void savePreferences({ email_messages_enabled: event.target.checked })} type="checkbox" /></label>
              <label className="toggle-card"><span>{locale === "en-CA" ? "Quote emails" : "Emails devis"}</span><input checked={bool(preferences.email_quotes_enabled)} onChange={(event) => void savePreferences({ email_quotes_enabled: event.target.checked })} type="checkbox" /></label>
              <label className="toggle-card"><span>{locale === "en-CA" ? "Billing emails" : "Emails facturation"}</span><input checked={bool(preferences.email_billing_enabled)} onChange={(event) => void savePreferences({ email_billing_enabled: event.target.checked })} type="checkbox" /></label>
              <label className="toggle-card"><span>{locale === "en-CA" ? "Push notifications" : "Notifications push"}</span><input checked={bool(preferences.push_enabled)} onChange={(event) => void savePreferences({ push_enabled: event.target.checked })} type="checkbox" /></label>
            </div>
          ) : (
            <EmptyState title={locale === "en-CA" ? "Preferences unavailable." : "Preferences indisponibles."} />
          )}
        </article>

        <article className="panel panel-clean">
          <SectionIntro eyebrow={locale === "en-CA" ? "Security and account" : "Securite et compte"} title={locale === "en-CA" ? "Stay ready for demand" : "Rester pret pour la demande"} />
          <div className="stack">
            <article className="list-card">
              <strong>{locale === "en-CA" ? "Security" : "Securite"}</strong>
              <p>{locale === "en-CA" ? "A password update flow can be connected here next. For now, keep verified contact details and a strong password." : "Un vrai changement de mot de passe peut etre branche ici ensuite. Pour l'instant, gardez des coordonnees verifiees et un mot de passe fort."}</p>
            </article>
            <article className="list-card">
              <strong>{locale === "en-CA" ? "Plan reminders" : "Rappels de plan"}</strong>
              <p>{locale === "en-CA" ? "Use plan reminders to avoid missing opportunities when your reply volume grows." : "Utilisez les rappels de plan pour ne pas manquer d'opportunites quand votre volume de reponses augmente."}</p>
            </article>
            <article className="list-card">
              <strong>{locale === "en-CA" ? "Notification strategy" : "Strategie notification"}</strong>
              <p>{locale === "en-CA" ? "Keep hot-request alerts on so the dashboard keeps its immediate-opportunity promise." : "Gardez les alertes de demandes chaudes actives pour que le dashboard tienne sa promesse d'opportunite immediate."}</p>
            </article>
          </div>
        </article>
      </section>

      <section className="panel panel-clean">
        <SectionIntro eyebrow={locale === "en-CA" ? "Recent notifications" : "Notifications recentes"} title={locale === "en-CA" ? "Latest provider-side updates" : "Dernieres mises a jour cote prestataire"} />
        <div className="stack">
          {notifications.length === 0 ? (
            <EmptyState title={locale === "en-CA" ? "No notifications." : "Aucune notification."} />
          ) : (
            notifications.slice(0, 6).map((item) => (
              <article className="list-card" key={item.id}>
                <div className="service-card-header">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body || item.type}</p>
                  </div>
                  <span className={bool(item.is_read) ? "status-chip" : "status-chip status-chip-brand"}>
                    {bool(item.is_read) ? (locale === "en-CA" ? "Read" : "Lu") : (locale === "en-CA" ? "Unread" : "Non lu")}
                  </span>
                </div>
                <div className="request-card-details">
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
