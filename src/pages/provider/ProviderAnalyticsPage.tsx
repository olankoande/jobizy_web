import { useEffect, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { getProviderAnalytics } from "../../lib/api";
import type { ProviderAnalytics } from "../../types";

function fmtCents(cents: number, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  return new Intl.DateTimeFormat("fr-CA", { month: "short", year: "2-digit" }).format(new Date(Number(y), Number(m) - 1, 1));
}

function BarChart({ data, valueKey, labelKey, color }: { data: any[]; valueKey: string; labelKey: string; color: string }) {
  if (!data.length) return <p style={{ color: "#9ca3af", fontSize: "0.82rem" }}>Pas encore de données.</p>;
  const max = Math.max(...data.map((d) => Number(d[valueKey])), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "80px" }}>
      {data.map((d, i) => {
        const pct = Math.round((Number(d[valueKey]) / max) * 100);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>{d[valueKey]}</span>
            <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: `${Math.max(pct, 4)}%` }} />
            <span style={{ fontSize: "0.65rem", color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtMonth(d[labelKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ProviderAnalyticsPage() {
  const { session, locale } = useApp();
  const [data, setData] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    getProviderAnalytics(session, locale as any)
      .then(setData)
      .catch(() => setError("Impossible de charger les statistiques."))
      .finally(() => setLoading(false));
  }, [session, locale]);

  const fr = locale !== "en-CA";

  if (loading) return <div className="page-container"><p className="text-muted">{fr ? "Chargement…" : "Loading…"}</p></div>;
  if (error || !data) return <div className="page-container"><p className="notice notice-error">{error}</p></div>;

  const stats = [
    {
      label: fr ? "Leads reçus" : "Leads received",
      value: data.leads_total,
      icon: "📥",
      note: fr ? "demandes visibles" : "visible requests",
    },
    {
      label: fr ? "Offres envoyées" : "Quotes sent",
      value: data.quotes_total,
      icon: "📤",
      note: "",
    },
    {
      label: fr ? "Taux de réponse" : "Response rate",
      value: data.response_rate !== null ? `${data.response_rate}%` : "—",
      icon: "💬",
      note: fr ? "leads → offres" : "leads → quotes",
    },
    {
      label: fr ? "Taux de conversion" : "Conversion rate",
      value: data.conversion_rate !== null ? `${data.conversion_rate}%` : "—",
      icon: "🎯",
      note: fr ? "offres acceptées" : "quotes accepted",
    },
    {
      label: fr ? "Missions complétées" : "Completed missions",
      value: data.missions_completed,
      icon: "✅",
      note: "",
    },
    {
      label: fr ? "Revenus cumulés" : "Cumulative revenue",
      value: fmtCents(data.revenue_cents),
      icon: "💰",
      note: fr ? "missions complétées" : "completed missions",
    },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">{fr ? "Statistiques" : "Analytics"}</h1>
      <p className="page-subtitle" style={{ marginBottom: "1.5rem" }}>
        {fr ? "Vue d'ensemble de votre activité sur Jobizy." : "Overview of your activity on Jobizy."}
      </p>

      {/* KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        {stats.map((s) => (
          <div key={s.label} className="panel panel-clean" style={{ padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{s.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.25rem" }}>{s.label}</div>
            {s.note && <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{s.note}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="panel panel-clean" style={{ padding: "1rem" }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            {fr ? "Leads / mois (6 derniers mois)" : "Leads / month (last 6 months)"}
          </h3>
          <BarChart data={data.monthly_leads} valueKey="leads" labelKey="month" color="var(--accent)" />
        </div>
        <div className="panel panel-clean" style={{ padding: "1rem" }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            {fr ? "Revenus / mois (6 derniers mois)" : "Revenue / month (last 6 months)"}
          </h3>
          <BarChart
            data={data.monthly_revenue.map((d) => ({ ...d, revenue: Math.round(d.revenue_cents / 100) }))}
            valueKey="revenue"
            labelKey="month"
            color="#10b981"
          />
        </div>
      </div>
    </div>
  );
}
