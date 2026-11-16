import type { Article } from "./types";

/** Fisher-Yates shuffle, returning a shuffled copy. */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Keeps the first article per title, preserving order. */
export function distinctByTitle(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (seen.has(article.title)) return false;
    seen.add(article.title);
    return true;
  });
}
