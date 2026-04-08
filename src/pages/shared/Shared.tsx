import type { ReactNode } from "react";
import { AppIcon, type AppIconName } from "../../app/AppIcon";

export function StatCard({
  label,
  value,
  detail,
  tone = "default",
  icon,
  delta,
  deltaPositive,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "action" | "trust" | "info" | "support";
  icon?: AppIconName;
  delta?: string;
  deltaPositive?: boolean;
}) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      {icon ? (
        <span className="metric-card-icon">
          <AppIcon name={icon} />
        </span>
      ) : null}
      <span className="metric-card-label">{label}</span>
      <strong>{value}</strong>
      {delta ? (
        <span className={`metric-card-trend${deltaPositive === true ? " metric-card-trend-up" : deltaPositive === false ? " metric-card-trend-down" : ""}`}>
          {delta}
        </span>
      ) : null}
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
      {action ? <div className="cta-row">{action}</div> : null}
    </div>
  );
}

export function PendingModules({ title, modules }: { title: string; modules: string[] }) {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Roadmap</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="chip-row">
        {modules.map((item) => (
          <span className="status-chip status-chip-muted" key={item}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  body,
  aside,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {body ? <p className="section-copy">{body}</p> : null}
      </div>
      {aside}
    </div>
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <span
          key={index}
          className="skeleton-line"
          style={{ width: `${index === lines - 1 ? 58 : 100}%` }}
        />
      ))}
    </div>
  );
}

export function ToneCard({
  tone,
  children,
  className = "",
}: {
  tone: "action" | "trust" | "info" | "support";
  children: ReactNode;
  className?: string;
}) {
  return <article className={`tone-card tone-card-${tone} ${className}`.trim()}>{children}</article>;
}

export function ActionAssistant({
  tone = "info",
  icon = "spark",
  title,
  body,
  items = [],
  action,
}: {
  tone?: "action" | "trust" | "info" | "support";
  icon?: AppIconName;
  title: string;
  body: string;
  items?: string[];
  action?: ReactNode;
}) {
  return (
    <article className={`assistant-card assistant-card-${tone}`}>
      <div className="assistant-card-head">
        <span className="assistant-icon">
          <AppIcon name={icon} />
        </span>
        <div>
          <strong>{title}</strong>
          <p>{body}</p>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="assistant-list">
          {items.map((item) => (
            <div className="assistant-item" key={item}>
              <AppIcon name="check" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}
      {action ? <div className="cta-row">{action}</div> : null}
    </article>
  );
}
