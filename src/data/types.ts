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
  /** Optional free-text description shown under the name in the list. */
  description?: string;
  /** Wiki language ("nl", "en", …) the theme was created in. A theme only
   * makes sense on the wiki of its own language, so themes are shown per
   * active language. Rows from before this field existed count as Dutch. */
  language?: string;
}

/** Effective language of a theme row; legacy rows without a language are Dutch. */
export function themeLanguage(theme: Theme): string {
  return theme.language ?? "nl";
}

/** A saved article row. */
export interface SavedArticle {
  title: string;
  summary: string;
  thumbnailUrl?: string;
  savedAt: number;
  /** Wiki language ("nl", "en", …) the article was saved in. Saved items are
   * shown per active language, like themes. Rows from before this field
   * existed count as Dutch. */
  language?: string;
}

/** Effective language of a saved article; legacy rows without a language are Dutch. */
export function savedArticleLanguage(article: SavedArticle): string {
  return article.language ?? "nl";
}

/** An article that was shown in the "Voor jou" feed; kept for a bounded
 * time (ring buffer) so recently shown articles are not repeated. */
export interface ShownArticle {
  /** Article title, doubles as the key. */
  articleId: string;
  timestampAtShown: number;
}

/** Thrown when Wikimedia answers with HTTP 429. Callers should not retry
 * automatically. The default message is a fallback; the UI shows a
 * translated string via the i18n dictionaries. */
export class RateLimitedError extends Error {
  constructor(message = "Rate limited by Wikipedia (HTTP 429).") {
    super(message);
    this.name = "RateLimitedError";
  }
}
