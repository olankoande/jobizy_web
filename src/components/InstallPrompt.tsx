import { useEffect, useState } from "react";

const DISMISSED_KEY = "jobizy_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt({ locale }: { locale: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const fr = locale !== "en-CA";

  useEffect(() => {
    // Don't show if already dismissed or already installed
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone) return; // iOS Safari installed

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // iOS Safari: no beforeinstallprompt — show a manual hint if on iOS and not standalone
  const [showIosHint, setShowIosHint] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone = (navigator as any).standalone;
    if (isIos && !isInStandalone) {
      setShowIosHint(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    setShowIosHint(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
    setVisible(false);
    setDeferredPrompt(null);
  }

  const bannerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)", // above mobile nav
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 2rem)",
    maxWidth: "480px",
    background: "#17352f",
    color: "#fff",
    borderRadius: "16px",
    padding: "0.9rem 1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
    zIndex: 9999,
    fontSize: "0.85rem",
  };

  if (visible && deferredPrompt) {
    return (
      <div style={bannerStyle} role="banner">
        <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>📲</span>
        <div style={{ flex: 1 }}>
          <strong style={{ display: "block", marginBottom: "1px" }}>
            {fr ? "Installer Jobizy" : "Install Jobizy"}
          </strong>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.78rem" }}>
            {fr ? "Accès rapide depuis l'écran d'accueil" : "Quick access from your home screen"}
          </span>
        </div>
        <button
          onClick={handleInstall}
          type="button"
          style={{ background: "#fff", color: "#17352f", border: "none", borderRadius: "10px", padding: "0.4rem 0.85rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", flexShrink: 0 }}
        >
          {fr ? "Installer" : "Install"}
        </button>
        <button
          aria-label={fr ? "Fermer" : "Close"}
          onClick={dismiss}
          type="button"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", flexShrink: 0, padding: "0 2px" }}
        >
          ×
        </button>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div style={bannerStyle} role="banner">
        <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>📲</span>
        <div style={{ flex: 1 }}>
          <strong style={{ display: "block", marginBottom: "1px" }}>
            {fr ? "Installer Jobizy" : "Install Jobizy"}
          </strong>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.78rem" }}>
            {fr
              ? "Appuyez sur  puis \"Sur l'écran d'accueil\""
              : "Tap  then \"Add to Home Screen\""}
          </span>
        </div>
        <button
          aria-label={fr ? "Fermer" : "Close"}
          onClick={dismiss}
          type="button"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", flexShrink: 0, padding: "0 2px" }}
        >
          ×
        </button>
      </div>
    );
  }

  return null;
}
