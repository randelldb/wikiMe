import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLang } from "../i18n";
import { REFRESH_HEIGHT, REFRESH_THRESHOLD, pullDistance } from "./pullRefresh";

/** Custom pull-to-refresh for the window-scrolled screens: when the page is
 * scrolled to the very top, dragging down reveals an indicator above the
 * content; releasing past REFRESH_THRESHOLD runs `onRefresh` and holds the
 * indicator (spinner) until the promise settles. The browser's own
 * pull-to-refresh is disabled via `overscroll-behavior-y: none` in CSS, and
 * a non-passive touchmove preventDefault kills the iOS rubber-band while a
 * pull is active. Follows the SwipeRow pattern: pointer events on window,
 * no pointer capture, click suppressed after a real pull. */
export default function PullToRefresh({
  onRefresh,
  disabled,
  children,
}: {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
  children: ReactNode;
}) {
  const { t } = useLang();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);

  // While a screen with custom pull-to-refresh is mounted, mark <html> so
  // CSS (html.ptr) disables the browser's native overscroll refresh — only
  // our custom one runs there. Screens without this component (themes,
  // saved, settings, article) keep the native pull-to-refresh.
  useEffect(() => {
    document.documentElement.classList.add("ptr");
    return () => document.documentElement.classList.remove("ptr");
  }, []);

  useEffect(() => {
    if (disabled || refreshing) return;
    let active = false;
    let startX = 0;
    let startY = 0;
    let didPull = false;

    const settle = (p: number) => {
      pullRef.current = p;
      setPull(p);
    };

    const down = (e: PointerEvent) => {
      // Mouse only tracks while the primary button is held; touch/pen always.
      if (e.pointerType === "mouse" && (e.buttons & 1) === 0) return;
      if (window.scrollY > 0) return;
      startX = e.clientX;
      startY = e.clientY;
      active = true;
      didPull = false;
    };

    const move = (e: PointerEvent) => {
      if (!active) return;
      if (e.pointerType === "mouse" && (e.buttons & 1) === 0) {
        active = false;
        return;
      }
      // Once the page starts scrolling, the gesture is a normal scroll.
      if (window.scrollY > 0) {
        active = false;
        settle(0);
        return;
      }
      const dy = e.clientY - startY;
      const dx = e.clientX - startX;
      if (dy <= 0) {
        // Pulling up: hand the gesture back to the page scroll.
        active = false;
        settle(0);
        return;
      }
      // Horizontal drags belong to the swipe rows, not to pull-to-refresh.
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        active = false;
        return;
      }
      const p = pullDistance(dy);
      if (p > 0) didPull = true;
      settle(p);
    };

    const up = () => {
      if (!active) return;
      active = false;
      if (pullRef.current >= REFRESH_THRESHOLD) {
        setRefreshing(true);
        settle(REFRESH_HEIGHT);
        Promise.resolve(onRefresh()).finally(() => {
          setRefreshing(false);
          settle(0);
        });
      } else {
        settle(0);
      }
    };

    const cancel = () => {
      active = false;
      settle(0);
    };

    // Kill native overscroll/rubber-band while a pull is active (iOS).
    const touchMove = (e: TouchEvent) => {
      if (active && pullRef.current > 0 && window.scrollY <= 0) e.preventDefault();
    };

    // Swallow the click that follows a completed pull so cards don't open.
    const clickCapture = (e: Event) => {
      if (didPull) {
        e.preventDefault();
        e.stopPropagation();
        didPull = false;
      }
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("click", clickCapture, true);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("click", clickCapture, true);
    };
  }, [disabled, refreshing, onRefresh]);

  const armed = pull >= REFRESH_THRESHOLD;

  return (
    <>
      <div
        className="ptr-indicator"
        style={{ height: pull }}
        role="status"
        aria-label={refreshing ? t("feed.refreshing") : t("feed.pullToRefresh")}
      >
        <div
          className="ptr-indicator-inner"
          style={{ opacity: Math.min(1, pull / REFRESH_THRESHOLD) }}
        >
          {refreshing ? (
            <div className="spinner spinner-sm" />
          ) : (
            <svg
              className="ptr-arrow"
              style={{ transform: armed ? "rotate(180deg)" : "rotate(0deg)" }}
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div
        className="ptr-content"
        style={{
          transform: `translateY(${pull}px)`,
          transition: refreshing || pull === 0 ? "transform 0.25s ease" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}
