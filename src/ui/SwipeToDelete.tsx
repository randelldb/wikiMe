import { useRef, useState } from "react";
import type { ReactNode, PointerEvent as ReactPointerEvent, SyntheticEvent } from "react";
import Modal from "./Modal";

const REVEAL_WIDTH = 96;
const CONFIRM_THRESHOLD = 48;

/** Swipe-to-delete wrapper: drag the list row to the left to reveal the
 * delete action; releasing past the threshold opens a confirmation dialog.
 * Vertical drags fall through so the list keeps scrolling normally. */
export default function SwipeToDelete({
  onConfirm,
  confirmTitle,
  children,
}: {
  onConfirm: () => void | Promise<void>;
  confirmTitle: string;
  children: ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);
  const didSwipe = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    dragging.current = true;
    didSwipe.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    if (dx > -4 && Math.abs(dx) < 4) return;
    // Only claim horizontal drags; let vertical drags scroll the page.
    const clamped = Math.max(-REVEAL_WIDTH, Math.min(0, dx));
    setOffset(clamped);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (offset <= -CONFIRM_THRESHOLD) {
      didSwipe.current = true;
      setAsk(true);
    }
    setOffset(0);
  };

  // Suppress the click that follows a completed swipe (pointerup -> click).
  const onClickCapture = (e: SyntheticEvent) => {
    if (didSwipe.current) {
      e.preventDefault();
      e.stopPropagation();
      didSwipe.current = false;
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setAsk(false);
    }
  };

  return (
    <>
      <div
        className="swipe"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="swipe-bg" aria-hidden="true">
          Verwijder
        </div>
        <div
          className="swipe-content"
          style={{ transform: `translateX(${offset}px)` }}
          onClickCapture={onClickCapture}
        >
          {children}
        </div>
      </div>

      {ask && (
        <Modal title={confirmTitle} onClose={() => setAsk(false)}>
          <div className="dialog-body">
            <p className="hint">
              Weet je zeker dat je dit wilt verwijderen? Dit kan niet ongedaan
              worden.
            </p>
            <div className="dialog-actions">
              <button className="btn btn-outline" onClick={() => setAsk(false)}>
                Annuleren
              </button>
              <button className="btn" disabled={busy} onClick={confirm}>
                Verwijderen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
