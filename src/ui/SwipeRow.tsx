import { useEffect, useRef, useState } from "react";
import type { ReactNode, PointerEvent as ReactPointerEvent, SyntheticEvent } from "react";
import Modal from "./Modal";
import { useLang } from "../i18n";

const REVEAL_WIDTH = 96;
const CONFIRM_THRESHOLD = 48;

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm13-15h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

/** Swipe row for list items: drag left to reveal the delete action (release
 * past the threshold opens a confirmation dialog); when `onEdit` is given,
 * drag right to reveal the edit action and run it on release. Vertical
 * drags fall through so the list keeps scrolling normally. Pointer capture
 * is avoided on purpose — it would retarget the click and quietly break the
 * row's main button. */
export default function SwipeRow({
  onConfirm,
  confirmTitle,
  onEdit,
  children,
}: {
  onConfirm: () => void | Promise<void>;
  confirmTitle: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  const { t } = useLang();
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const horizontal = useRef(false);
  const offsetRef = useRef(0);
  const didSwipe = useRef(false);

  useEffect(() => {
    if (dragging == null) return;

    const move = (e: PointerEvent) => {
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      // Decide the drag direction once, then act on it exclusively.
      if (!horizontal.current) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          // Vertical drag: let the page scroll; abandon the swipe.
          setDragging(null);
          return;
        }
        horizontal.current = true;
      }
      const maxRight = onEdit ? REVEAL_WIDTH : 0;
      const clamped = Math.max(-REVEAL_WIDTH, Math.min(maxRight, dx));
      offsetRef.current = clamped;
      setOffset(clamped);
    };

    const up = () => {
      if (offsetRef.current <= -CONFIRM_THRESHOLD) {
        didSwipe.current = true;
        setAsk(true);
      } else if (onEdit && offsetRef.current >= CONFIRM_THRESHOLD) {
        didSwipe.current = true;
        onEdit();
      }
      offsetRef.current = 0;
      setOffset(0);
      setDragging(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging, onEdit]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    horizontal.current = false;
    didSwipe.current = false;
    offsetRef.current = 0;
    setDragging(e.pointerId);
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
      <div className="swipe" onPointerDown={onPointerDown}>
        <div className="swipe-bg" aria-hidden="true">
          <TrashIcon />
        </div>
        {onEdit && (
          <div className="swipe-bg swipe-bg-edit" aria-hidden="true">
            <PencilIcon />
          </div>
        )}
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
            <p className="hint">{t("swipe.confirmHint")}</p>
            <div className="dialog-actions">
              <button className="btn btn-outline" onClick={() => setAsk(false)}>
                {t("actions.cancel")}
              </button>
              <button className="btn" disabled={busy} onClick={confirm}>
                {t("actions.delete")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
