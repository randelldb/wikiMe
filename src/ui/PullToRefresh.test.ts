import { describe, expect, it } from "vitest";
import { MAX_PULL, PULL_RESISTANCE, REFRESH_THRESHOLD, pullDistance } from "./pullRefresh";

describe("pullDistance", () => {
  it("is zero when the finger is not moving down", () => {
    expect(pullDistance(0)).toBe(0);
    expect(pullDistance(-120)).toBe(0);
  });

  it("applies rubber-band resistance below the cap", () => {
    expect(pullDistance(100)).toBeCloseTo(100 * PULL_RESISTANCE);
    expect(pullDistance(50)).toBeCloseTo(50 * PULL_RESISTANCE);
  });

  it("caps the pull at MAX_PULL", () => {
    expect(pullDistance(10_000)).toBe(MAX_PULL);
  });

  it("the refresh threshold is reachable before the cap kicks in", () => {
    expect(REFRESH_THRESHOLD).toBeLessThan(MAX_PULL);
    // The raw finger travel needed to arm the refresh stays under MAX_PULL,
    // so the arrow can always reach the armed state while dragging.
    const rawToArm = REFRESH_THRESHOLD / PULL_RESISTANCE;
    expect(pullDistance(rawToArm)).toBeGreaterThanOrEqual(REFRESH_THRESHOLD);
    expect(pullDistance(rawToArm)).toBeLessThanOrEqual(MAX_PULL);
  });
});
