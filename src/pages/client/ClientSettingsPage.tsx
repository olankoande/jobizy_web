import { useState } from "react";
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

export function ClientSettingsPage() {
  const navigate = useNavigate();
  const { locale, session, notifications, preferences, referral, markAllNotificationsRead, savePreferences } = useApp();
  const [copied, setCopied] = useState(false);

  const referralLink = referral?.referral_code
    ? `${window.location.origin}/${locale}/auth/register?ref=${referral.referral_code}`
    : null;

  function copyReferralLink() {
    if (!referralLink) return;
    void navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Settings" : "Parametres"}
          title={locale === "en-CA" ? "Keep notifications, security and privacy easy to manage" : "Garder notifications, securite et confidentialite faciles a gerer"}
          body={locale === "en-CA" ? "Settings should stay lightweight: clear toggles, account reminders and direct links to the places where action matters." : "Les parametres doivent rester legers : toggles clairs, rappels de compte et liens directs vers les zones utiles."}
          aside={
            <div className="button-group">
              <button className="ghost-button" onClick={() => void markAllNotificationsRead()} type="button">
                {locale === "en-CA" ? "Mark all read" : "Tout marquer comme lu"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/app/profil`)} type="button">
                {locale === "en-CA" ? "Open profile" : "Ouvrir le profil"}
              </button>
            </div>
          }
        />
        <div className="hero-panel">
          <StatCard label={locale === "en-CA" ? "Unread notifications" : "Notifications non lues"} tone="info" value={String(notifications.filter((item) => !item.is_read).length)} />
          <StatCard label={locale === "en-CA" ? "Email verified" : "Email verifie"} tone="trust" value={session?.user.email_verified_at ? (locale === "en-CA" ? "Yes" : "Oui") : (locale === "en-CA" ? "No" : "Non")} />
          <StatCard label={locale === "en-CA" ? "Phone number" : "Telephone"} tone="support" value={session?.user.phone || "-"} />
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel panel-clean">
          <SectionIntro
            eyebrow={locale === "en-CA" ? "Notifications" : "Notifications"}
            title={locale === "en-CA" ? "Delivery preferences" : "Preferences de diffusion"}
          />
          {preferences ? (
            <div className="toggle-grid">
              <label className="toggle-card"><span>{locale === "en-CA" ? "Email messages" : "Emails messages"}</span><input checked={bool(preferences.email_messages_enabled)} onChange={(event) => void savePreferences({ email_messages_enabled: event.target.checked })} type="checkbox" /></label>
              <label className="toggle-card"><span>{locale === "en-CA" ? "Quote emails" : "Emails offres"}</span><input checked={bool(preferences.email_quotes_enabled)} onChange={(event) => void savePreferences({ email_quotes_enabled: event.target.checked })} type="checkbox" /></label>
              <label className="toggle-card"><span>{locale === "en-CA" ? "Billing emails" : "Emails facturation"}</span><input checked={bool(preferences.email_billing_enabled)} onChange={(event) => void savePreferences({ email_billing_enabled: event.target.checked })} type="checkbox" /></label>
              <label className="toggle-card"><span>{locale === "en-CA" ? "Push notifications" : "Notifications push"}</span><input checked={bool(preferences.push_enabled)} onChange={(event) => void savePreferences({ push_enabled: event.target.checked })} type="checkbox" /></label>
            </div>
          ) : (
            <EmptyState title={locale === "en-CA" ? "Preferences unavailable." : "Preferences indisponibles."} />
          )}
        </article>

        <article className="panel panel-clean">
          <SectionIntro
            eyebrow={locale === "en-CA" ? "Security" : "Securite"}
            title={locale === "en-CA" ? "Account protection" : "Protection du compte"}
          />
          <div className="stack">
            <article className="list-card">
              <strong>{locale === "en-CA" ? "Password" : "Mot de passe"}</strong>
              <p>{locale === "en-CA" ? "Password change flow can be added here next. For now, keep account info updated and use a strong password." : "Le changement de mot de passe peut etre branche ici ensuite. Pour l'instant, gardez vos infos a jour et utilisez un mot de passe fort."}</p>
            </article>
            <article className="list-card">
              <strong>{locale === "en-CA" ? "Privacy" : "Confidentialite"}</strong>
              <p>{locale === "en-CA" ? "Your activity history and notifications remain tied to your account for request follow-up." : "Votre historique d'activite et vos notifications restent lies au compte pour le suivi des demandes."}</p>
            </article>
          </div>
        </article>
      </section>

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Recent notifications" : "Notifications recentes"}
          title={locale === "en-CA" ? "Last updates tied to your requests" : "Dernieres mises a jour liees a vos demandes"}
        />
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

      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Referral program" : "Programme de parrainage"}
          title={locale === "en-CA" ? "Invite a friend to Jobizy" : "Invitez un ami sur Jobizy"}
          body={locale === "en-CA" ? "Your referral is validated once your friend publishes their first request." : "Votre filleul est valide des qu'il publie sa premiere demande."}
        />
        <div className="hero-panel">
          <StatCard label={locale === "en-CA" ? "Invited" : "Invites"} tone="info" value={String(referral?.total ?? 0)} />
          <StatCard label={locale === "en-CA" ? "Active" : "Valides"} tone="trust" value={String(referral?.completed ?? 0)} />
          <StatCard label={locale === "en-CA" ? "Pending" : "En attente"} tone="support" value={String(referral?.pending ?? 0)} />
        </div>
        {referralLink ? (
          <div className="stack">
            <article className="list-card">
              <div>
                <strong>{locale === "en-CA" ? "Your referral link" : "Votre lien de parrainage"}</strong>
                <p style={{ wordBreak: "break-all", fontSize: "0.8rem", color: "var(--color-muted, #6b7280)" }}>{referralLink}</p>
              </div>
              <button className="primary-button" onClick={copyReferralLink} type="button">
                {copied ? (locale === "en-CA" ? "Copied!" : "Copie !") : (locale === "en-CA" ? "Copy link" : "Copier le lien")}
              </button>
            </article>
          </div>
        ) : null}
        {referral && referral.referrals.length > 0 ? (
          <div className="stack">
            {referral.referrals.map((entry) => (
              <article className="list-card" key={entry.referred_id}>
                <div>
                  <strong>{entry.referred_name}</strong>
                  <p>{formatDate(entry.created_at)}</p>
                </div>
                <span className={entry.status === "completed" ? "status-chip status-chip-success" : "status-chip"}>
                  {entry.status === "completed"
                    ? (locale === "en-CA" ? "Active" : "Valide")
                    : (locale === "en-CA" ? "Pending" : "En attente")}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={locale === "en-CA" ? "No referrals yet." : "Aucun filleul pour l'instant."} />
        )}
      </section>
    </section>
  );
}
