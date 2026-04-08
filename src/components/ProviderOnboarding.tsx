import { useNavigate } from "react-router-dom";
import { AppIcon } from "../app/AppIcon";
import type { ProviderProfile } from "../types";

type Step = {
  key: string;
  labelFr: string;
  labelEn: string;
  hintFr: string;
  hintEn: string;
  href: string;
  done: boolean;
};

type Props = {
  locale: string;
  providerProfile: ProviderProfile | null;
  hasServices: boolean;
  hasZones: boolean;
  hasAvailability: boolean;
  hasSentOffer: boolean;
};

export function ProviderOnboarding({ locale, providerProfile, hasServices, hasZones, hasAvailability, hasSentOffer }: Props) {
  const navigate = useNavigate();
  const fr = locale !== "en-CA";

  const steps: Step[] = [
    {
      key: "profile",
      labelFr: "Compléter votre profil",
      labelEn: "Complete your profile",
      hintFr: "Ajoutez un nom, une description et une photo.",
      hintEn: "Add a name, description and photo.",
      href: `/${locale}/pro/profil`,
      done: Boolean(providerProfile?.display_name && providerProfile?.description),
    },
    {
      key: "services",
      labelFr: "Choisir vos services",
      labelEn: "Choose your services",
      hintFr: "Sélectionnez les services que vous proposez.",
      hintEn: "Select the services you offer.",
      href: `/${locale}/pro/services`,
      done: hasServices,
    },
    {
      key: "zones",
      labelFr: "Définir vos zones",
      labelEn: "Define your coverage zones",
      hintFr: "Indiquez les villes où vous intervenez.",
      hintEn: "Set the cities where you operate.",
      href: `/${locale}/pro/zones`,
      done: hasZones,
    },
    {
      key: "availability",
      labelFr: "Configurer vos disponibilités",
      labelEn: "Set your availability",
      hintFr: "Définissez vos créneaux horaires de travail.",
      hintEn: "Define your working time slots.",
      href: `/${locale}/pro/disponibilites`,
      done: hasAvailability,
    },
    {
      key: "offer",
      labelFr: "Envoyer votre première offre",
      labelEn: "Send your first quote",
      hintFr: "Répondez à une demande client pour décrocher votre premier contrat.",
      hintEn: "Reply to a client request to land your first contract.",
      href: `/${locale}/pro/demandes`,
      done: hasSentOffer,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;

  if (allDone) return null;

  const nextStep = steps.find((s) => !s.done);

  return (
    <section
      style={{
        border: "1px solid rgba(47,140,171,0.22)",
        borderRadius: "var(--radius-lg)",
        background: "linear-gradient(135deg, rgba(47,140,171,0.05) 0%, rgba(242,106,33,0.04) 100%)",
        padding: "1.25rem 1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.2rem" }}>
            {fr ? "Démarrage" : "Getting started"}
          </p>
          <strong style={{ fontSize: "1rem" }}>
            {fr
              ? `${doneCount} étape${doneCount !== 1 ? "s" : ""} sur ${steps.length} complétée${doneCount !== 1 ? "s" : ""}`
              : `${doneCount} of ${steps.length} step${doneCount !== 1 ? "s" : ""} completed`}
          </strong>
        </div>
        {nextStep && (
          <button
            className="primary-button compact-button"
            onClick={() => navigate(nextStep.href)}
            type="button"
          >
            {fr ? `Continuer : ${nextStep.labelFr}` : `Continue: ${nextStep.labelEn}`}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "var(--border)", borderRadius: 999, marginBottom: "1.1rem", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, var(--accent) 0%, var(--brand) 100%)",
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {steps.map((step) => (
          <button
            key={step.key}
            onClick={() => !step.done && navigate(step.href)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid transparent",
              background: step.done ? "rgba(26,127,90,0.06)" : "var(--surface)",
              cursor: step.done ? "default" : "pointer",
              textAlign: "left",
              width: "100%",
              transition: "border-color 0.15s",
            }}
            type="button"
            onMouseEnter={(e) => { if (!step.done) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
          >
            {/* Icône statut */}
            <span style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: step.done ? "#16a34a" : "var(--border)",
              color: step.done ? "#fff" : "var(--text-muted)",
              fontSize: "0.7rem", fontWeight: 700,
            }}>
              {step.done ? <AppIcon name="check" size={12} /> : null}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: "0.875rem", display: "block", color: step.done ? "var(--text-muted)" : "var(--surface-ink)", textDecoration: step.done ? "line-through" : "none" }}>
                {fr ? step.labelFr : step.labelEn}
              </strong>
              {!step.done && (
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {fr ? step.hintFr : step.hintEn}
                </span>
              )}
            </div>
            {!step.done && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", flexShrink: 0 }}>›</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
