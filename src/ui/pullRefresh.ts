/** Rubber-band resistance: the visible pull is this fraction of the finger
 * travel, so the gesture feels elastic. */
export const PULL_RESISTANCE = 0.45;
/** Hard cap on the visible pull distance in px. */
export const MAX_PULL = 110;
/** Pull distance at/above which releasing triggers a refresh. */
export const REFRESH_THRESHOLD = 64;
/** Height the indicator is held at while the refresh runs. */
export const REFRESH_HEIGHT = 56;

/** Visible pull distance for a raw downward finger travel (px). Zero when
 * the finger is not moving down. Pure so it can be unit-tested. */
export function pullDistance(rawDy: number): number {
  if (rawDy <= 0) return 0;
  return Math.min(MAX_PULL, rawDy * PULL_RESISTANCE);
}
