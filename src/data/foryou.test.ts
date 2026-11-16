import { describe, expect, it } from "vitest";
import { composeBatch, pickSeeds, SEED_POOL } from "./foryou";
import { shuffle } from "./collections";
import type { Article } from "./types";

function article(title: string): Article {
  return { title, extract: "samenvatting" };
}

/** Newest first, like `savedArticles()`. */
function titles(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Artikel ${i}`);
}

describe("pickSeeds", () => {
  it("picks 3 distinct seeds from the 15 newest saved articles", () => {
    const saved = titles(30);
    const seeds = pickSeeds(saved);
    const newest15 = new Set(saved.slice(0, SEED_POOL));

    expect(seeds).toHaveLength(3);
    expect(new Set(seeds).size).toBe(3); // no duplicates
    for (const seed of seeds) {
      expect(newest15.has(seed)).toBe(true); // never from the older half
    }
  });

  it("uses all available articles when fewer than 15 are saved", () => {
    const saved = titles(5);
    const seeds = pickSeeds(saved);
    const available = new Set(saved);

    expect(seeds).toHaveLength(3);
    for (const seed of seeds) {
      expect(available.has(seed)).toBe(true);
    }

    const fewer = pickSeeds(titles(2));
    expect(fewer.toSorted()).toEqual(["Artikel 0", "Artikel 1"]);
  });

  it("varies the seeds between batches (shuffle)", () => {
    const saved = titles(20);
    const orders = new Set(
      Array.from({ length: 30 }, () => pickSeeds(saved).join("|")),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe("composeBatch", () => {
  it("drops saved and already shown articles", () => {
    const candidates = [
      article("Al opgeslagen"),
      article("Al getoond"),
      article("Vers"),
    ];
    const batch = composeBatch(
      candidates,
      new Set(["Al opgeslagen"]),
      new Set(["Al getoond"]),
    );
    expect(batch.map((a) => a.title)).toEqual(["Vers"]);
  });

  it("deduplicates candidates by title", () => {
    const batch = composeBatch(
      [article("Dubbel"), article("Dubbel"), article("Eén keer")],
      new Set(),
      new Set(),
    );
    expect(batch).toHaveLength(2);
    expect(batch.map((a) => a.title).toSorted()).toEqual(["Dubbel", "Eén keer"]);
  });

  it("returns a shuffled permutation of the fresh candidates", () => {
    const candidates = Array.from({ length: 12 }, (_, i) => article(`Artikel ${i}`));
    const batch = composeBatch(candidates, new Set(), new Set());
    expect(batch).toHaveLength(12);
    expect(batch.map((a) => a.title).toSorted()).toEqual(
      candidates.map((a) => a.title).toSorted(),
    );
  });

  it("returns empty when everything is filtered out", () => {
    const batch = composeBatch(
      [article("A"), article("B")],
      new Set(["A"]),
      new Set(["B"]),
    );
    expect(batch).toEqual([]);
  });
});

describe("shuffle", () => {
  it("keeps every element exactly once", () => {
    const input = titles(30);
    const shuffled = shuffle(input);
    expect(shuffled).toHaveLength(input.length);
    expect(shuffled.toSorted()).toEqual(input.toSorted());
    expect(input).toEqual(titles(30)); // input not mutated
  });
});
