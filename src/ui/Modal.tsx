import { useEffect } from "react";
import type { ReactNode } from "react";

/** Minimal dialog: click on the backdrop or press Escape to close.
 * Renders nothing while closed, so children unmount and reset cleanly.
 * With `fullscreen` it covers the whole screen (no backdrop) so the
 * content starts at the very top — handy when the on-screen keyboard
 * pops up on mobile. */
export default function Modal({
  title,
  onClose,
  fullscreen = false,
  children,
}: {
  title: string;
  onClose: () => void;
  fullscreen?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={fullscreen ? "modal-overlay fullscreen" : "modal-overlay"}
      onMouseDown={(e) => {
        if (!fullscreen && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={fullscreen ? "modal fullscreen" : "modal"}
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Sluiten" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
