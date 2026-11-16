import { useCallback, useEffect, useRef, useState } from "react";
import { theme, upsertSavedArticle, deleteSavedArticle } from "../data/db";
import { ArticleRepository } from "../data/repository";
import { RateLimitedError } from "../data/types";
import type { Article } from "../data/types";
import { ArticleCard, EMPTY_FEED, FeedStatus, type FeedUiState } from "./FeedParts";

const repository = new ArticleRepository();

/** Ported from FeedViewModel/FeedController: loads batches of random articles
 * for a theme and fetches more when the user scrolls near the end. */
export default function FeedScreen({
  themeId,
  themeName,
  savedTitles,
  refreshSaved,
  onBack,
  onOpenArticle,
}: {
  themeId: number;
  themeName: string;
  savedTitles: Set<string>;
  refreshSaved: () => void;
  onBack: () => void;
  onOpenArticle: (title: string) => void;
}) {
  const [state, setState] = useState<FeedUiState>(EMPTY_FEED);
  const queryRef = useRef<string | null>(null);
  const progressRef = useRef<{ searchOffset: number }>({ searchOffset: 0 });
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      let query = queryRef.current;
      if (query == null) {
        const loaded = (await theme(themeId)) ?? { name: "", searchQuery: "" };
        query = loaded.searchQuery.trim();
        queryRef.current = query;
      }
      if (query === "") throw new Error("Dit thema heeft geen zoekterm.");
      const { articles: batch, progress } = await repository.feedArticles(
        query,
        progressRef.current,
      );
      progressRef.current = progress;
      setState((s) => {
        const known = new Set(s.articles.map((a) => a.title));
        const fresh = batch.filter((a) => !known.has(a.title));
        return {
          articles: [...s.articles, ...fresh],
          isLoading: false,
          error: null,
          exhausted: fresh.length === 0,
        };
      });
    } catch (e) {
      console.error("WikiMe: loading feed batch failed:", e);
      const message =
        e instanceof RateLimitedError
          ? e.message
          : `Laden mislukt: ${e instanceof Error ? e.message : String(e)}`;
      setState((s) => ({ ...s, isLoading: false, error: message }));
    } finally {
      loadingRef.current = false;
    }
  }, [themeId]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, error: null, exhausted: false }));
    loadMore();
  }, [loadMore]);

  // Kick off the first load like the Android init { loadMore() }.
  useEffect(() => {
    loadMore();
  }, [loadMore]);

  // "Near the end of the page" — web equivalent of the Android PREFETCH_DISTANCE check.
  useEffect(() => {
    const onScroll = () => {
      const nearEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 600;
      if (nearEnd) {
        setState((s) => {
          if (s.error === null && !s.exhausted) loadMore();
          return s;
        });
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadMore]);

  const toggleSaved = async (article: Article) => {
    if (savedTitles.has(article.title)) {
      await deleteSavedArticle(article.title);
    } else {
      await upsertSavedArticle({
        title: article.title,
        summary: article.extract,
        thumbnailUrl: article.thumbnailUrl,
        savedAt: Date.now(),
      });
    }
    refreshSaved();
  };

  return (
    <div className="screen">
      <header className="appbar">
        <button className="icon-btn" onClick={onBack} title="Terug">
          ←
        </button>
        <h1>{themeName}</h1>
      </header>

      <main className="content">
        {state.articles.length === 0 ? (
          <FeedStatus state={state} onRetry={retry} emptyMessage="Geen artikelen gevonden. Controleer de zoekterm van dit thema." />
        ) : (
          <>
            {state.articles.map((article) => (
              <ArticleCard
                key={article.title}
                article={article}
                saved={savedTitles.has(article.title)}
                onClick={() => onOpenArticle(article.title)}
                onToggleSaved={() => toggleSaved(article)}
              />
            ))}
            {(state.isLoading || state.error !== null || state.exhausted) && (
              <FeedStatus state={state} onRetry={retry} emptyMessage="Geen artikelen gevonden. Controleer de zoekterm van dit thema." />
            )}
          </>
        )}
      </main>
    </div>
  );
}

