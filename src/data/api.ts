import { RateLimitedError } from "./types";
import type { Page } from "./types";
import { WikiConfig } from "./config";

const BASE_QUERY = {
  action: "query",
  format: "json",
  formatversion: "2",
  prop: "extracts|pageimages",
  exintro: "1",
  explaintext: "1",
  exlimit: "20",
  piprop: "thumbnail",
  pithumbsize: "600",
};

/** Title suggestion from the REST search API, as used by the Wikipedia search bar. */
export interface TitleSuggestion {
  title: string;
  description?: string;
}

/**
 * Client for the Wikipedia `action=query` and `rest.php/v1/search` APIs,
 * ported from the Android/Retrofit and Flutter versions. Browser calls need
 * `origin=*` so MediaWiki answers with CORS headers.
 */
export class WikipediaApi {
  async pages(titles: string): Promise<Page[]> {
    const json = await this.get({ ...BASE_QUERY, titles });
    this.throwOnApiError(json);
    return (json.query?.pages ?? []).map(pageFromJson);
  }

  /** Autocomplete for the search term field in the add-theme screen,
   * backed by the same REST endpoint as the Wikipedia search bar. */
  async titleSuggestions(query: string, limit = 10): Promise<TitleSuggestion[]> {
    const base = WikiConfig.apiBase(WikiConfig.language);
    const url = `${base}/w/rest.php/v1/search/title?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    if (response.status === 429) throw new RateLimitedError();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from Wikipedia search API`);
    }
    const json = await response.json();
    return (json.pages ?? []).map((page: any) => ({
      title: page.title as string,
      description: page.description as string | undefined,
    }));
  }

  /** Titles matching a free-text query, like Speciaal:Zoeken with fulltext=1.
   * `offset` pages through the result list so repeated loads stay fresh. */
  async fulltextTitles(query: string, limit: number, offset = 0): Promise<string[]> {
    const json = await this.get(searchQuery(query, limit, offset));
    this.throwOnApiError(json);
    return (json.query?.search ?? []).map((result: any) => result.title as string);
  }

  /** Titles of random articles in the main namespace (`list=random`),
   * backing the dice tab. */
  async randomTitles(limit = 3): Promise<string[]> {
    const json = await this.get(randomQuery(limit));
    this.throwOnApiError(json);
    return (json.query?.random ?? []).map((entry: any) => entry.title as string);
  }

  /** Full rendered HTML of one article (`action=parse&prop=text`), backing
   * the in-app article reader behind the full-article feature flag. Edit
   * section links are stripped; redirects resolve to the target page. */
  async articleHtml(title: string): Promise<string> {
    const json = await this.get(parseQuery(title));
    this.throwOnApiError(json);
    const text = json.parse?.text;
    if (typeof text !== "string") {
      throw new Error("API response has no parse.text");
    }
    return text;
  }

  /** Titles of articles related to the seed articles via a combined morelike
   * search: `srsearch=morelike:{seedA}|{seedB}|{seedC}`. */
  async morelikeTitles(seeds: string[], limit = 24): Promise<string[]> {
    if (seeds.length === 0) return [];
    const json = await this.get(morelikeQuery(seeds, limit));
    this.throwOnApiError(json);
    return (json.query?.search ?? []).map((result: any) => result.title as string);
  }

  private async get(query: Record<string, string>): Promise<any> {
    const params = new URLSearchParams({ ...query, origin: "*" });
    const response = await fetch(`${WikiConfig.apiBase(WikiConfig.language)}/w/api.php?${params}`);
    if (response.status === 429) throw new RateLimitedError();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from Wikipedia API`);
    }
    return response.json();
  }

  private throwOnApiError(json: any): void {
    if (json.error) {
      throw new Error(`API Error: ${json.error.code} - ${json.error.info}`);
    }
  }
}

function pageFromJson(json: any): Page {
  return {
    pageid: json.pageid ?? 0,
    title: json.title,
    index: json.index ?? 0,
    missing: json.missing === true,
    extract: json.extract,
    thumbnail: json.thumbnail ? { source: json.thumbnail.source } : undefined,
  };
}

/** Pure `list=search` query builder, URL-encoded by URLSearchParams in `get`.
 * Exported so the URL construction can be unit tested. */
export function searchQuery(srsearch: string, limit: number, offset = 0): Record<string, string> {
  return {
    action: "query",
    format: "json",
    formatversion: "2",
    list: "search",
    srnamespace: "0",
    srlimit: String(limit),
    sroffset: String(offset),
    srsearch,
  };
}

/** Combined morelike query: `srsearch=morelike:{seedA}|{seedB}|{seedC}`. */
export function morelikeQuery(seeds: string[], limit: number): Record<string, string> {
  return searchQuery(`morelike:${seeds.join("|")}`, limit);
}

/** Pure `action=parse` query builder for the full article HTML, URL-encoded
 * by URLSearchParams in `get`. Exported so the URL construction can be unit
 * tested. */
export function parseQuery(title: string): Record<string, string> {
  return {
    action: "parse",
    format: "json",
    formatversion: "2",
    page: title,
    prop: "text",
    redirects: "1",
    disableeditsection: "1",
  };
}

/** Pure `list=random` query builder, URL-encoded by URLSearchParams in `get`.
 * Exported so the URL construction can be unit tested. */
export function randomQuery(limit: number): Record<string, string> {
  return {
    action: "query",
    format: "json",
    formatversion: "2",
    list: "random",
    rnnamespace: "0",
    rnlimit: String(limit),
  };
}
