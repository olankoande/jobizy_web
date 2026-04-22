import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--surface-strong, #fff)",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "1.25rem",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          padding: "1.5rem",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
