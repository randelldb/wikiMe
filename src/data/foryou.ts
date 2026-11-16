import { savedArticles, markShownArticles, shownArticleTitles } from "./db";
import { ArticleRepository } from "./repository";
import { shuffle, distinctByTitle } from "./collections";
import type { Article } from "./types";

/** Number of saved articles used as morelike seeds per batch. */
const SEED_COUNT = 3;
/** Newest saved articles the seeds are drawn from. */
export const SEED_POOL = 15;
/** Combined call limit; the per-seed fallback uses SEED_COUNT × fallback. */
const COMBINED_LIMIT = 24;
const FALLBACK_LIMIT = 8;
/** One reseed retry when a filtered batch comes up empty. */
const MAX_ATTEMPTS = 2;

/** Seeds for one batch: `count` random titles from the `pool` newest saved
 * articles (newest first). Fewer available: all of them. */
export function pickSeeds(
  savedTitles: string[],
  count = SEED_COUNT,
  pool = SEED_POOL,
): string[] {
  return shuffle(savedTitles.slice(0, pool)).slice(0, count);
}

/** Composes the visible batch from morelike candidates: drop already saved
 * and already shown articles, dedupe by title and shuffle the rest. */
export function composeBatch(
  candidates: Article[],
  savedTitles: Set<string>,
  shownTitles: Set<string>,
): Article[] {
  const excluded = new Set([...savedTitles, ...shownTitles]);
  const fresh = distinctByTitle(candidates).filter((article) => !excluded.has(article.title));
  return shuffle(fresh);
}

/** Personal feed based on the saved favorite articles: per batch, random
 * recent favorites serve as morelike seeds. Keeps the "shown" ring buffer
 * up to date so batches never repeat articles. */
export class ForYouFeed {
  private readonly repository: ArticleRepository;

  constructor(repository: ArticleRepository = new ArticleRepository()) {
    this.repository = repository;
  }

  async nextBatch(): Promise<Article[]> {
    const saved = await savedArticles(); // newest first (existing stream)
    const savedTitles = saved.map((article) => article.title);
    if (savedTitles.length < 2) return []; // welcome state territory, no calls

    const shownTitles = await shownArticleTitles();
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const seeds = pickSeeds(savedTitles);
      if (seeds.length === 0) return [];
      const candidates = await this.repository.morelikeArticles(seeds, COMBINED_LIMIT, FALLBACK_LIMIT);
      const batch = composeBatch(candidates, new Set(savedTitles), shownTitles);
      if (batch.length > 0) {
        await markShownArticles(batch.map((article) => article.title));
        return batch;
      }
    }
    return [];
  }
}
