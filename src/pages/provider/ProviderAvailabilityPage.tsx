import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { addAvailability, deleteAvailability, getAvailabilities, patchAvailability } from "../../lib/api";
import type { Availability } from "../../types";
import { EmptyState, SectionIntro } from "../shared/Shared";

const WEEKDAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const WEEKDAYS_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string) {
  return t.slice(0, 5);
}

function toApiTime(t: string) {
  return t.length === 5 ? `${t}:00` : t;
}

function MonthlyCalendar({ slots, locale }: { slots: Availability[]; locale: string }) {
  const [offset, setOffset] = useState(0); // months from today
  const activeWeekdays = new Set(slots.filter((s) => s.is_active).map((s) => s.weekday));

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + offset + 12) % 12;
  const yearAdj = year + Math.floor((now.getMonth() + offset) / 12);

  const firstDay = new Date(yearAdj, month, 1);
  const daysInMonth = new Date(yearAdj, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0=Sun

  const monthName = new Intl.DateTimeFormat(locale === "en-CA" ? "en-CA" : "fr-CA", { month: "long", year: "numeric" }).format(firstDay);
  const dayHeaders = locale === "en-CA"
    ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    : ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const today = now.getDate();
  const isCurrentMonth = yearAdj === year && month === now.getMonth();

  return (
    <div>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <button className="ghost-button" style={{ padding: "0.2rem 0.6rem", fontSize: "0.82rem" }} onClick={() => setOffset((o) => o - 1)} type="button">‹</button>
        <span style={{ fontWeight: 600, fontSize: "0.9rem", textTransform: "capitalize", flex: 1, textAlign: "center" }}>{monthName}</span>
        <button className="ghost-button" style={{ padding: "0.2rem 0.6rem", fontSize: "0.82rem" }} onClick={() => setOffset((o) => o + 1)} type="button">›</button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {dayHeaders.map((h) => (
          <div key={h} style={{ textAlign: "center", fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, paddingBottom: "4px" }}>{h}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const cellDate = new Date(yearAdj, month, day);
          const weekday = cellDate.getDay();
          const hasSlot = activeWeekdays.has(weekday);
          const isToday = isCurrentMonth && day === today;
          return (
            <div
              key={i}
              title={hasSlot ? (locale === "en-CA" ? "Available" : "Disponible") : (locale === "en-CA" ? "Unavailable" : "Non disponible")}
              style={{
                textAlign: "center",
                padding: "4px 2px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: isToday ? 700 : 400,
                background: hasSlot ? "rgba(16, 185, 129, 0.15)" : "transparent",
                color: hasSlot ? "#065f46" : "#9ca3af",
                border: isToday ? "1.5px solid var(--accent)" : "1.5px solid transparent",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", fontSize: "0.72rem", color: "#6b7280" }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(16,185,129,0.25)", borderRadius: 3, marginRight: 4 }} />{locale === "en-CA" ? "Available" : "Disponible"}</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "transparent", border: "1px solid #e5e7eb", borderRadius: 3, marginRight: 4 }} />{locale === "en-CA" ? "Unavailable" : "Non disponible"}</span>
      </div>
    </div>
  );
}

export function ProviderAvailabilityPage() {
  const navigate = useNavigate();
  const { locale, session, providerProfile } = useApp();
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingForDay, setAddingForDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await getAvailabilities(session, locale);
      setSlots(data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session, locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (!providerProfile) {
    return <EmptyState title={locale === "en-CA" ? "No provider profile loaded." : "Aucun profil prestataire chargé."} />;
  }

  if (!session) return null;

  const dayNames = locale === "en-CA" ? WEEKDAYS_EN : WEEKDAYS_FR;
  const dayShort = locale === "en-CA" ? WEEKDAYS_SHORT_EN : WEEKDAYS_SHORT_FR;
  const activeCount = slots.filter((s) => s.is_active).length;
  const totalCount = slots.length;

  function openAddForm(day: number) {
    setAddingForDay(day);
    setStartTime("08:00");
    setEndTime("17:00");
    setError("");
  }

  async function handleAdd() {
    if (addingForDay === null || !session) return;
    if (startTime >= endTime) {
      setError(locale === "en-CA" ? "End time must be after start time." : "L'heure de fin doit être après l'heure de début.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await addAvailability(session, locale, {
        weekday: addingForDay,
        start_time: toApiTime(startTime),
        end_time: toApiTime(endTime),
        is_active: true,
      });
      setSlots((prev) => [...prev, created]);
      setAddingForDay(null);
    } catch (err: any) {
      setError(err?.message ?? (locale === "en-CA" ? "Failed to save slot." : "Erreur lors de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(slot: Availability) {
    if (!session) return;
    setTogglingId(slot.id);
    try {
      const updated = await patchAvailability(session, locale, slot.id, { is_active: !slot.is_active });
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, ...updated } : s)));
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(slotId: string) {
    if (!session) return;
    setDeletingId(slotId);
    try {
      await deleteAvailability(session, locale, slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="stack stack-xl">

      {/* ── Header ── */}
      <section className="panel panel-clean">
        <SectionIntro
          eyebrow={locale === "en-CA" ? "Provider profile" : "Profil prestataire"}
          title={locale === "en-CA" ? "Your availability" : "Vos disponibilités"}
          body={
            locale === "en-CA"
              ? "Define your weekly availability windows. At least one active slot per week is required to respond to requests and appear in client searches."
              : "Définissez vos plages horaires disponibles pour chaque jour de la semaine. Au moins un créneau actif est requis pour répondre aux demandes et apparaître dans les recherches."
          }
          aside={
            <div className="button-group">
              <button className="ghost-button" onClick={() => navigate(`/${locale}/pro/profil`)} type="button">
                {locale === "en-CA" ? "Back to profile" : "Retour au profil"}
              </button>
              <button className="primary-button" onClick={() => navigate(`/${locale}/pro/demandes`)} type="button">
                {locale === "en-CA" ? "Open leads" : "Voir les leads"}
              </button>
            </div>
          }
        />

        {/* Status row */}
        <div className="chip-row">
          <span className={activeCount > 0 ? "status-chip status-chip-success" : "status-chip"}>
            {activeCount > 0
              ? locale === "en-CA"
                ? `${activeCount} active slot${activeCount > 1 ? "s" : ""}`
                : `${activeCount} créneau${activeCount > 1 ? "x" : ""} actif${activeCount > 1 ? "s" : ""}`
              : locale === "en-CA" ? "No active slots" : "Aucun créneau actif"}
          </span>
          {totalCount > 0 && (
            <span className="status-chip status-chip-muted">
              {totalCount} {locale === "en-CA" ? `slot${totalCount > 1 ? "s" : ""} total` : `créneau${totalCount > 1 ? "x" : ""} au total`}
            </span>
          )}
          {activeCount === 0 && (
            <span className="status-chip status-chip-brand">
              {locale === "en-CA" ? "Required to reply to requests" : "Requis pour répondre aux demandes"}
            </span>
          )}
        </div>
      </section>

      {/* ── Context assistant ── */}
      {activeCount === 0 && !loading && (
        <div className="assistant-card assistant-card-action">
          <div className="assistant-card-head">
            <span className="assistant-icon">⏰</span>
            <div>
              <strong>{locale === "en-CA" ? "Add at least one availability slot" : "Ajoutez au moins un créneau de disponibilité"}</strong>
              <p>{locale === "en-CA"
                ? "Without availability, your profile will not appear in client searches and you won't be able to respond to requests."
                : "Sans disponibilité, votre profil n'apparaît pas dans les recherches et vous ne pouvez pas répondre aux demandes."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && <p className="notice notice-error">{error}</p>}

      {/* ── Monthly calendar preview ── */}
      {!loading && slots.length > 0 && (
        <section className="panel panel-clean">
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
            {locale === "en-CA" ? "Monthly overview" : "Vue mensuelle"}
          </p>
          <MonthlyCalendar slots={slots} locale={locale} />
        </section>
      )}

      {/* ── Weekly grid ── */}
      {loading ? (
        <div className="panel panel-clean">
          <div className="skeleton-card">
            <div className="skeleton-line" style={{ width: "30%" }} />
            <div className="skeleton-line" style={{ width: "100%" }} />
            <div className="skeleton-line" style={{ width: "80%" }} />
          </div>
        </div>
      ) : (
        <div className="availability-grid">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const daySlots = slots.filter((s) => s.weekday === day);
            const isAdding = addingForDay === day;
            const hasActive = daySlots.some((s) => s.is_active);

            return (
              <div
                key={day}
                className={hasActive ? "availability-day availability-day-active" : "availability-day"}
              >
                {/* Day header */}
                <div className="availability-day-header">
                  <span className="availability-day-name">{dayShort[day]}</span>
                  <span className="sr-only">{dayNames[day]}</span>
                </div>

                {/* Slots list */}
                <div className="availability-slots">
                  {daySlots.length === 0 && !isAdding ? (
                    <span className="availability-empty">
                      {locale === "en-CA" ? "Closed" : "Fermé"}
                    </span>
                  ) : (
                    daySlots.map((slot) => {
                      const isInactive = !slot.is_active;
                      const isDeleting = deletingId === slot.id;
                      const isToggling = togglingId === slot.id;
                      return (
                        <div
                          key={slot.id}
                          className={isInactive ? "availability-slot availability-slot-inactive" : "availability-slot"}
                        >
                          <span className="availability-slot-time" title={`${dayNames[slot.weekday]}: ${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`}>
                            {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                          </span>
                          <button
                            aria-label={slot.is_active
                              ? (locale === "en-CA" ? "Disable slot" : "Désactiver")
                              : (locale === "en-CA" ? "Enable slot" : "Activer")}
                            className="availability-slot-toggle"
                            disabled={isToggling || isDeleting}
                            onClick={() => handleToggle(slot)}
                            type="button"
                          >
                            {isToggling ? "…" : slot.is_active ? "●" : "○"}
                          </button>
                          <button
                            aria-label={locale === "en-CA" ? "Delete slot" : "Supprimer"}
                            className="availability-slot-toggle availability-slot-delete"
                            disabled={isToggling || isDeleting}
                            onClick={() => handleDelete(slot.id)}
                            type="button"
                          >
                            {isDeleting ? "…" : "×"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add form or trigger */}
                {isAdding ? (
                  <div className="availability-add-form">
                    <input
                      aria-label={locale === "en-CA" ? "Start time" : "Heure de début"}
                      onChange={(e) => setStartTime(e.target.value)}
                      type="time"
                      value={startTime}
                    />
                    <input
                      aria-label={locale === "en-CA" ? "End time" : "Heure de fin"}
                      onChange={(e) => setEndTime(e.target.value)}
                      type="time"
                      value={endTime}
                    />
                    <div className="availability-add-actions">
                      <button
                        className="availability-save-btn"
                        disabled={saving}
                        onClick={handleAdd}
                        type="button"
                      >
                        {saving ? "…" : locale === "en-CA" ? "Save" : "Sauvegarder"}
                      </button>
                      <button
                        className="availability-cancel-btn"
                        onClick={() => setAddingForDay(null)}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="availability-add-trigger"
                    onClick={() => openAddForm(day)}
                    type="button"
                  >
                    + {locale === "en-CA" ? "Add slot" : "Ajouter"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick tips ── */}
      <section className="panel panel-clean">
        <p className="eyebrow">{locale === "en-CA" ? "Tips" : "Conseils"}</p>
        <ul className="feature-list">
          <li>{locale === "en-CA"
            ? "You can add multiple slots per day (e.g. morning and afternoon)."
            : "Vous pouvez ajouter plusieurs créneaux par jour (ex. matin et après-midi)."}
          </li>
          <li>{locale === "en-CA"
            ? "Disable a slot temporarily without deleting it using the ● / ○ toggle."
            : "Désactivez temporairement un créneau sans le supprimer avec le bouton ● / ○."}
          </li>
          <li>{locale === "en-CA"
            ? "At least one active slot per week is required to appear in searches."
            : "Au moins un créneau actif par semaine est requis pour apparaître dans les recherches."}
          </li>
        </ul>
      </section>

    </section>
  );
}
