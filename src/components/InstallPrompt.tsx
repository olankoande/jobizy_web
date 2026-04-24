import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS(): boolean {
  // iPhone/iPod classique
  if (/iphone|ipod/i.test(navigator.userAgent)) return true;
  // iPad classique
  if (/ipad/i.test(navigator.userAgent)) return true;
  // iPad Pro en mode "desktop" (UA = Macintosh + touchscreen)
  if (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true;
  return false;
}

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

function isMobileOrTablet(): boolean {
  return isIOS() || isAndroid() || /mobile|tablet/i.test(navigator.userAgent);
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as { standalone?: boolean }).standalone
  );
}

// Vrai SVG du bouton Partager iOS (identique à Safari)
function ShareIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle" }}
      aria-hidden
    >
      <polyline points="16 12 12 8 8 12" />
      <line x1="12" y1="8" x2="12" y2="21" />
      <path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle" }}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function InstallPrompt({ locale }: { locale: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const fr = locale !== "en-CA";

  // Android / Chrome : écoute beforeinstallprompt
  useEffect(() => {
    if (!isMobileOrTablet() || isInstalled()) return;
    if (isIOS()) return; // géré séparément

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // iOS (Safari, Chrome iOS, Firefox iOS) : hint manuel
  useEffect(() => {
    if (!isIOS() || isInstalled()) return;
    setShowIosModal(true);
  }, []);

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setShowAndroidBanner(false);
    setDeferredPrompt(null);
  }

  // ── Styles communs ────────────────────────────────────────────────────────
  const bannerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
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

  // ── Banner Android ────────────────────────────────────────────────────────
  if (showAndroidBanner && deferredPrompt) {
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
          onClick={handleAndroidInstall}
          type="button"
          style={{ background: "#fff", color: "#17352f", border: "none", borderRadius: "10px", padding: "0.4rem 0.85rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", flexShrink: 0 }}
        >
          {fr ? "Installer" : "Install"}
        </button>
        <button
          aria-label={fr ? "Fermer" : "Close"}
          onClick={() => setShowAndroidBanner(false)}
          type="button"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", flexShrink: 0, padding: "0 2px" }}
        >
          ×
        </button>
      </div>
    );
  }

  // ── Modale iOS ────────────────────────────────────────────────────────────
  if (showIosModal) {
    const isIPad = /ipad/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

    return (
      <>
        {/* Overlay sombre */}
        <div
          onClick={() => setShowIosModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9998 }}
          aria-hidden
        />

        {/* Bulle de dialogue */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fr ? "Installer Jobizy" : "Install Jobizy"}
          style={{
            position: "fixed",
            bottom: isIPad ? "auto" : "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            top: isIPad ? "calc(env(safe-area-inset-top, 0px) + 16px)" : "auto",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 2rem)",
            maxWidth: "400px",
            background: "#fff",
            borderRadius: "20px",
            padding: "1.4rem 1.25rem 1.25rem",
            zIndex: 9999,
            boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Bouton fermer */}
          <button
            aria-label={fr ? "Fermer" : "Close"}
            onClick={() => setShowIosModal(false)}
            type="button"
            style={{ position: "absolute", top: "0.75rem", right: "0.9rem", background: "none", border: "none", fontSize: "1.4rem", color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>

          {/* En-tête */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.1rem" }}>
            <img src="/logo.png" alt="Jobizy" width={44} height={44} style={{ borderRadius: "10px", flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", fontSize: "1rem", color: "#17352f" }}>
                {fr ? "Installer Jobizy" : "Install Jobizy"}
              </strong>
              <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                {fr ? "Ajouter à l'écran d'accueil" : "Add to Home Screen"}
              </span>
            </div>
          </div>

          {/* Étapes */}
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.88rem", color: "#374151" }}>
              <span style={{ background: "#17352f", color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: "0.8rem" }}>1</span>
              <span>
                {fr ? (
                  <>Appuyez sur <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#f3f4f6", borderRadius: "6px", padding: "2px 6px", color: "#17352f", fontWeight: 600 }}><ShareIcon />{" "}Partager</span></>
                ) : (
                  <>Tap <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#f3f4f6", borderRadius: "6px", padding: "2px 6px", color: "#17352f", fontWeight: 600 }}><ShareIcon />{" "}Share</span></>
                )}
              </span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.88rem", color: "#374151" }}>
              <span style={{ background: "#17352f", color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: "0.8rem" }}>2</span>
              <span>
                {fr ? (
                  <>Faites défiler et appuyez sur <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#f3f4f6", borderRadius: "6px", padding: "2px 6px", color: "#17352f", fontWeight: 600 }}><PlusSquareIcon />{" "}Sur l'écran d'accueil</span></>
                ) : (
                  <>Scroll down and tap <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#f3f4f6", borderRadius: "6px", padding: "2px 6px", color: "#17352f", fontWeight: 600 }}><PlusSquareIcon />{" "}Add to Home Screen</span></>
                )}
              </span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.88rem", color: "#374151" }}>
              <span style={{ background: "#17352f", color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: "0.8rem" }}>3</span>
              <span>{fr ? "Appuyez sur " : "Tap "}<strong>{fr ? "Ajouter" : "Add"}</strong></span>
            </li>
          </ol>

          {/* Flèche pointant vers le bouton Partager */}
          <div style={{
            marginTop: "1rem",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}>
            {isIPad ? "↑" : "↓"}
            <span>{fr ? `Le bouton Partager est en ${isIPad ? "haut" : "bas"} de Safari` : `The Share button is at the ${isIPad ? "top" : "bottom"} of Safari`}</span>
            {isIPad ? "↑" : "↓"}
          </div>
        </div>
      </>
    );
  }

  return null;
}
