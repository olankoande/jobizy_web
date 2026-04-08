import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "jobizy_cookie_consent";

export function CookieConsent({ locale }: { locale: string }) {
  const navigate = useNavigate();
  const fr = locale !== "en-CA";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "essential_only");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={fr ? "Consentement aux cookies" : "Cookie consent"}
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(600px, calc(100vw - 2rem))",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        padding: "1.1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        zIndex: 9999,
      }}
    >
      <div>
        <strong style={{ fontSize: "0.95rem", display: "block", marginBottom: "0.3rem" }}>
          {fr ? "Nous utilisons des cookies" : "We use cookies"}
        </strong>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          {fr
            ? "Jobizy utilise des cookies essentiels pour faire fonctionner la plateforme (session, langue). Aucun cookie publicitaire."
            : "Jobizy uses essential cookies to operate the platform (session, language). No advertising cookies."}
          {" "}
          <button
            className="text-link-button"
            onClick={() => navigate(`/${locale}/confidentialite`)}
            style={{ fontSize: "0.82rem" }}
            type="button"
          >
            {fr ? "En savoir plus" : "Learn more"}
          </button>
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button className="ghost-button compact-button" onClick={decline} type="button">
          {fr ? "Essentiels seulement" : "Essential only"}
        </button>
        <button className="primary-button compact-button" onClick={accept} type="button">
          {fr ? "Accepter" : "Accept"}
        </button>
      </div>
    </div>
  );
}
