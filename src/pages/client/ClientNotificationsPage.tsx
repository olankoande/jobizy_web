import { useApp } from "../../app/AppProvider";
import { t } from "../../content/i18n";
import { EmptyState } from "../shared/Shared";

function bool(value: boolean | number | null | undefined) {
  return value === true || value === 1;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

export function ClientNotificationsPage() {
  const { locale, notifications, preferences, markAllNotificationsRead, savePreferences } = useApp();
  return (
    <section className="stack">
      <section className="panel">
        <div className="section-head"><h2>{t(locale, "notifications")}</h2><button className="ghost-button" onClick={() => void markAllNotificationsRead()} type="button">{t(locale, "markAllRead")}</button></div>
        <div className="stack">
          {notifications.length === 0 ? <EmptyState title={locale === "en-CA" ? "No notifications." : "Aucune notification."} /> : null}
          {notifications.map((item) => <article className="list-card" key={item.id}><div><strong>{item.title}</strong><p>{item.body || item.type}</p></div><div className="card-meta"><span className={bool(item.is_read) ? "status-chip" : "status-chip status-chip-brand"}>{bool(item.is_read) ? t(locale, "read") : t(locale, "unread")}</span><span>{formatDate(item.created_at)}</span></div></article>)}
        </div>
      </section>
      <section className="panel">
        <h2>{t(locale, "preferences")}</h2>
        {preferences ? (
          <div className="toggle-grid">
            <label className="toggle-card"><span>{t(locale, "emailMessages")}</span><input checked={bool(preferences.email_messages_enabled)} onChange={(event) => void savePreferences({ email_messages_enabled: event.target.checked })} type="checkbox" /></label>
            <label className="toggle-card"><span>{t(locale, "emailQuotes")}</span><input checked={bool(preferences.email_quotes_enabled)} onChange={(event) => void savePreferences({ email_quotes_enabled: event.target.checked })} type="checkbox" /></label>
            <label className="toggle-card"><span>{t(locale, "emailBilling")}</span><input checked={bool(preferences.email_billing_enabled)} onChange={(event) => void savePreferences({ email_billing_enabled: event.target.checked })} type="checkbox" /></label>
            <label className="toggle-card"><span>{t(locale, "pushPwa")}</span><input checked={bool(preferences.push_enabled)} onChange={(event) => void savePreferences({ push_enabled: event.target.checked })} type="checkbox" /></label>
          </div>
        ) : <EmptyState title={t(locale, "unavailablePreferences")} />}
      </section>
    </section>
  );
}
