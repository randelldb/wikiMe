export interface ApiError {
  code: string;
  info: string;
}

export interface Thumbnail {
  source: string;
}

/** Page from `action=query&formatversion=2` responses. */
export interface Page {
  pageid: number;
  title: string;
  index: number;
  missing: boolean;
  extract?: string;
  thumbnail?: Thumbnail;
}

/** Domain article as shown in the feed and saved lists. */
export interface Article {
  title: string;
  extract: string;
  thumbnailUrl?: string;
}

/** A theme (id, name and the full-text search term feeding it), stored in IndexedDB. */
export interface Theme {
  id?: number;
  name: string;
  /** Full-text search term, like Speciaal:Zoeken with fulltext=1, e.g. "uitvinders". */
  searchQuery: string;
}

/** A saved article row. */
export interface SavedArticle {
  title: string;
  summary: string;
  thumbnailUrl?: string;
  savedAt: number;
}

/** An article that was shown in the "Voor jou" feed; kept for a bounded
 * time (ring buffer) so recently shown articles are not repeated. */
export interface ShownArticle {
  /** Article title, doubles as the key. */
  articleId: string;
  timestampAtShown: number;
}

/** Thrown when Wikimedia answers with HTTP 429. Callers should not retry automatically. */
export class RateLimitedError extends Error {
  constructor() {
    super("Te veel verzoeken naar Wikipedia. Wacht even en probeer het opnieuw.");
    this.name = "RateLimitedError";
  }
}
