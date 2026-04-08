export type AppIconName =
  | "home"
  | "requests"
  | "messages"
  | "notifications"
  | "profile"
  | "subscription"
  | "provider"
  | "menu"
  | "logout"
  | "location"
  | "search"
  | "billing"
  | "reputation"
  | "spark"
  | "mission"
  | "check"
  | "calendar"
  | "clock"
  | "wrench"
  | "wallet"
  | "bolt"
  | "chart";

export function AppIcon({
  name,
  className = "",
  size,
}: {
  name: AppIconName;
  className?: string;
  size?: number;
}) {
  const commonProps = {
    className: `app-icon ${className}`.trim(),
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    ...(size != null ? { width: size, height: size } : {}),
  };

  switch (name) {
    case "home":
      return <svg {...commonProps}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /></svg>;
    case "requests":
      return <svg {...commonProps}><path d="M8 6h11" /><path d="M8 12h11" /><path d="M8 18h11" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></svg>;
    case "messages":
      return <svg {...commonProps}><path d="M4 6.5h16v10H8l-4 3v-13Z" /></svg>;
    case "notifications":
      return <svg {...commonProps}><path d="M12 4a4 4 0 0 0-4 4v2.5c0 1.2-.45 2.36-1.25 3.25L5.5 15h13l-1.25-1.25A4.6 4.6 0 0 1 16 10.5V8a4 4 0 0 0-4-4Z" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>;
    case "profile":
      return <svg {...commonProps}><path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case "subscription":
      return <svg {...commonProps}><path d="M12 3 4 7v5c0 5 3.4 7.8 8 9 4.6-1.2 8-4 8-9V7l-8-4Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "provider":
      return <svg {...commonProps}><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M5 7h5" /><path d="M5 12h8" /><path d="M5 17h11" /></svg>;
    case "location":
      return <svg {...commonProps}><path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "menu":
      return <svg {...commonProps}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>;
    case "logout":
      return <svg {...commonProps}><path d="M10 17 15 12 10 7" /><path d="M15 12H4" /><path d="M20 20V4" /></svg>;
    case "search":
      return <svg {...commonProps}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>;
    case "billing":
      return <svg {...commonProps}><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="M4 10h16" /><path d="M8 15h3" /></svg>;
    case "reputation":
      return <svg {...commonProps}><path d="m12 3 2.7 5.47 6.03.88-4.36 4.24 1.03 5.98L12 16.9l-5.4 2.67 1.03-5.98L3.27 9.35l6.03-.88L12 3Z" /></svg>;
    case "spark":
      return <svg {...commonProps}><path d="M12 3v5" /><path d="M12 16v5" /><path d="m5.64 5.64 3.53 3.53" /><path d="m14.83 14.83 3.53 3.53" /><path d="M3 12h5" /><path d="M16 12h5" /><path d="m5.64 18.36 3.53-3.53" /><path d="m14.83 9.17 3.53-3.53" /></svg>;
    case "mission":
      return <svg {...commonProps}><path d="M7 4h10l-1 5h3l-2 11H7L5 9h3l-1-5Z" /></svg>;
    case "check":
      return <svg {...commonProps}><path d="m5 12 4 4 10-10" /></svg>;
    case "calendar":
      return <svg {...commonProps}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
    case "clock":
      return <svg {...commonProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>;
    case "wrench":
      return <svg {...commonProps}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>;
    case "wallet":
      return <svg {...commonProps}><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20M16 14h.01" /></svg>;
    case "bolt":
      return <svg {...commonProps}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
    case "chart":
      return <svg {...commonProps}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
  }
}
