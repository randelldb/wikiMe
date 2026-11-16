import { WikipediaApi } from "./api";
import type { Article } from "./types";
import type { TitleSuggestion } from "./api";
import { distinctByTitle } from "./collections";
import { RateLimitedError } from "./types";

/** Feed progress that survives across loads: the search pages through the
 * (deterministic) full-text result list via sroffset. */
export interface FeedProgress {
  searchOffset: number;
}

/** Feeds a theme with the full-text search results for its search term,
 * like Speciaal:Zoeken with fulltext=1. */
export class ArticleRepository {
  private api = new WikipediaApi();

  /** Searches a batch of titles and prefetches their intro/thumbnail via the
   * same `pages()` call used elsewhere in the app. */
  async feedArticles(
    searchQuery: string,
    progress: FeedProgress = { searchOffset: 0 },
    batchSize = 20,
  ): Promise<{ articles: Article[]; progress: FeedProgress }> {
    const titles = await this.api.fulltextTitles(searchQuery, batchSize, progress.searchOffset);
    if (titles.length === 0) return { articles: [], progress };
    const pages = await this.api.pages(titles.join("|"));
    const articles = distinctByTitle(
      pages.filter((page) => !page.missing).map(articleFromPage),
    );
    return { articles, progress: { searchOffset: progress.searchOffset + titles.length } };
  }

  /** Looks up a single article's intro and thumbnail, e.g. for saving a page
   * opened via a link. */
  async article(title: string): Promise<Article | null> {
    const pages = await this.api.pages(title);
    for (const page of pages) {
      if (!page.missing) return articleFromPage(page);
    }
    return null;
  }

  /** Title suggestions for the search term autocomplete. */
  async titleSuggestions(query: string, limit = 10): Promise<TitleSuggestion[]> {
    return this.api.titleSuggestions(query, limit);
  }

  /** morelike candidates for the "Voor jou" feed: one combined call for all
   * seeds, falling back to separate per-seed calls (same fallback style as
   * the deepcat strategy) when the combined call errors or returns nothing. */
  async morelikeArticles(seeds: string[], limit = 24, fallbackLimit = 8): Promise<Article[]> {
    let titles: string[] = [];
    try {
      titles = await this.api.morelikeTitles(seeds, limit);
    } catch (e) {
      if (e instanceof RateLimitedError) throw e;
      console.warn(
        `WikiMe: combined morelike failed for [${seeds.join(", ")}], falling back to per-seed calls:`,
        e,
      );
      titles = [];
    }
    if (titles.length === 0) {
      for (const seed of seeds) {
        try {
          titles.push(...(await this.api.morelikeTitles([seed], fallbackLimit)));
        } catch (e) {
          if (e instanceof RateLimitedError) throw e;
          console.warn(`WikiMe: morelike failed for seed "${seed}":`, e);
        }
      }
    }
    if (titles.length === 0) return [];
    const pages = await this.api.pages(titles.join("|"));
    return distinctByTitle(pages.filter((page) => !page.missing).map(articleFromPage));
  }
}

function articleFromPage(page: { title: string; extract?: string; thumbnail?: { source: string } }): Article {
  return {
    title: page.title,
    extract: (page.extract ?? "").trim(),
    thumbnailUrl: page.thumbnail?.source,
  };
}
