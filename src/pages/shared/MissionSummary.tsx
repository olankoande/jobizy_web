import { AppIcon } from "../../app/AppIcon";
import type { Mission } from "../../types";
import { StatusChip } from "./Shared";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(new Date(value));
}

function money(cents?: number | null) {
  if (cents == null) return null;
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function missionTitle(m: Mission, fr: boolean) {
  return m.request_title || m.service_name || (fr ? "Mission" : "Mission");
}

export function clientName(m: Mission) {
  return [m.client_first_name, m.client_last_name].filter(Boolean).join(" ").trim();
}

function providerName(m: Mission) {
  return (m.business_name || m.display_name || "").trim();
}

function priceLabel(m: Mission, fr: boolean) {
  const agreed = money(m.indicative_price_cents) ?? money(m.quote_price_cents);
  if (agreed) return { label: fr ? "Prix convenu" : "Agreed price", value: agreed };
  if (m.budget_min_cents != null && m.budget_max_cents != null) {
    return { label: fr ? "Budget" : "Budget", value: `${money(m.budget_min_cents)} – ${money(m.budget_max_cents)}` };
  }
  return null;
}

function whenLabel(m: Mission) {
  const day = m.desired_date ? formatDate(m.desired_date) : null;
  const from = m.time_window_start?.slice(0, 5);
  const to = m.time_window_end?.slice(0, 5);
  const window = from && to ? `${from} – ${to}` : m.quote_time_window || null;
  return [day, window].filter(Boolean).join(" · ") || null;
}

/** En-tête + description + détails d'une mission, à la place d'un numéro de série. */
export function MissionSummary({ mission, locale, counterpart }: { mission: Mission; locale: string; counterpart: "client" | "provider" }) {
  const fr = locale !== "en-CA";
  const person = counterpart === "client" ? clientName(mission) : providerName(mission);
  const price = priceLabel(mission, fr);
  const when = whenLabel(mission);
  const urgency = ({ high: "Urgent", low: "Flexible" } as Record<string, string>)[mission.urgency ?? ""];
  const mode = ({ on_site: fr ? "Sur place" : "On site", remote: fr ? "À distance" : "Remote" } as Record<string, string>)[mission.work_mode ?? ""];

  return (
    <>
      <header className="mission-card-head">
        <span className="row-card-icon"><AppIcon name="mission" /></span>
        <div className="mission-card-title">
          <strong>{missionTitle(mission, fr)}</strong>
          <span>{[mission.service_name, mission.zone_name].filter(Boolean).join(" · ") || (fr ? "Détails de la demande" : "Request details")}</span>
        </div>
        <StatusChip locale={locale} status={mission.status} />
      </header>

      {mission.request_description ? (
        <p className="mission-card-desc">
          {mission.request_description.slice(0, 180)}{mission.request_description.length > 180 ? "…" : ""}
        </p>
      ) : null}

      <dl className="detail-grid">
        {person ? <div><dt>{counterpart === "client" ? "Client" : fr ? "Prestataire" : "Provider"}</dt><dd>{person}</dd></div> : null}
        {mission.zone_name ? <div><dt>{fr ? "Lieu" : "Location"}</dt><dd>{mission.zone_name}</dd></div> : null}
        {when ? <div><dt>{fr ? "Date prévue" : "Planned for"}</dt><dd>{when}</dd></div> : null}
        {price ? <div><dt>{price.label}</dt><dd>{price.value}</dd></div> : null}
        {urgency ? <div><dt>{fr ? "Urgence" : "Urgency"}</dt><dd>{urgency}</dd></div> : null}
        {mode ? <div><dt>Mode</dt><dd>{mode}</dd></div> : null}
        <div><dt>{fr ? "Créée le" : "Created"}</dt><dd>{formatDate(mission.created_at)}</dd></div>
        {mission.started_at ? <div><dt>{fr ? "Démarrée le" : "Started"}</dt><dd>{formatDate(mission.started_at)}</dd></div> : null}
        {mission.completed_at ? <div><dt>{fr ? "Terminée le" : "Completed"}</dt><dd>{formatDate(mission.completed_at)}</dd></div> : null}
      </dl>
    </>
  );
}
