import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { Avatar, AvatarPicker, CLIENT_AVATAR_PRESETS } from "../../components/Avatar";
import { ActionAssistant, SectionIntro, StatCard } from "../shared/Shared";
import { t } from "../../content/i18n";

export function ClientProfilePage() {
  const navigate = useNavigate();
  const { locale, session, saveUserProfile, requests, missions } = useApp();
  const [firstName, setFirstName] = useState(session?.user.first_name ?? "");
  const [lastName, setLastName] = useState(session?.user.last_name ?? "");
  const [phone, setPhone] = useState(session?.user.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(session?.user.avatar_url ?? "");

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || session?.user.email || "?";

  return (
    <section className="stack stack-xl">
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Client profile" : "Profil client"}
          title={locale === "en-CA" ? "Keep profile information visible and easy to update" : "Garder les informations du profil visibles et faciles a mettre a jour"}
          body={locale === "en-CA" ? "The client area should connect identity, active requests and shortcuts to the places where information matters." : "L'espace client doit relier l'identite, les demandes actives et les raccourcis vers les zones ou ces informations comptent vraiment."}
          aside={
            <div className="button-group">
              <button className="secondary-button" onClick={() => navigate(`/${locale}/app/missions`)} type="button">
                {locale === "en-CA" ? "Missions" : "Missions"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/app/demandes`)} type="button">
                {locale === "en-CA" ? "My requests" : "Mes demandes"}
              </button>
            </div>
          }
        />
        <div className="hero-panel">
          <StatCard label={locale === "en-CA" ? "Email" : "Email"} value={session?.user.email ?? "-"} tone="trust" />
          <StatCard label={locale === "en-CA" ? "Requests" : "Demandes"} value={String(requests.length)} tone="action" />
          <StatCard label={locale === "en-CA" ? "Missions" : "Missions"} value={String(missions.length)} tone="support" />
          <StatCard label={locale === "en-CA" ? "Phone" : "Telephone"} value={phone || "-"} tone="info" />
        </div>
      </section>

      <section className="two-up">
        <ActionAssistant
          action={
            <div className="button-group">
              <button className="ghost-button" onClick={() => navigate(`/${locale}/app/messages`)} type="button">
                {locale === "en-CA" ? "Open messages" : "Ouvrir la messagerie"}
              </button>
              <button className="secondary-button" onClick={() => navigate(`/${locale}/recherche`)} type="button">
                {locale === "en-CA" ? "Search" : "Recherche"}
              </button>
            </div>
          }
          body={locale === "en-CA" ? "Complete client identity fields so providers can reach you quickly and mission coordination stays simple." : "Completer les champs d'identite client aide les prestataires a vous joindre plus vite et simplifie la coordination des missions."}
          icon="profile"
          items={[
            locale === "en-CA" ? "A clear first and last name" : "Un prenom et un nom clairs",
            locale === "en-CA" ? "A reachable phone number" : "Un numero joignable",
            locale === "en-CA" ? "Quick access to requests and missions" : "Un acces rapide aux demandes et aux missions",
          ]}
          title={locale === "en-CA" ? "Profile assistant" : "Assistant profil"}
          tone="support"
        />

        <section className="panel panel-clean">
          <form className="form-grid" onSubmit={async (event) => { event.preventDefault(); await saveUserProfile(firstName, lastName, phone, avatarUrl); }}>
            <SectionIntro title={t(locale, "userProfile")} />

            {/* Avatar actuel */}
            <div className="avatar-current">
              <Avatar name={displayName} url={avatarUrl} size={64} />
              <div className="avatar-current-info">
                <strong>{displayName}</strong>
                <span>{locale === "en-CA" ? "Click an avatar below to change it" : "Cliquez sur un avatar ci-dessous pour le changer"}</span>
              </div>
            </div>

            {/* Sélecteur d'avatars */}
            <AvatarPicker
              label={locale === "en-CA" ? "Choose an avatar" : "Choisir un avatar"}
              onChange={setAvatarUrl}
              presets={CLIENT_AVATAR_PRESETS}
              value={avatarUrl}
            />

            <label><span>{t(locale, "firstName")}</span><input onChange={(event) => setFirstName(event.target.value)} value={firstName} /></label>
            <label><span>{t(locale, "lastName")}</span><input onChange={(event) => setLastName(event.target.value)} value={lastName} /></label>
            <label className="field-wide"><span>{t(locale, "phone")}</span><input onChange={(event) => setPhone(event.target.value)} value={phone} /></label>
            <button className="primary-button field-wide" type="submit">{t(locale, "save")}</button>
          </form>
        </section>
      </section>
    </section>
  );
}
