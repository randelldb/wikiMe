import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { upsertSavedArticle, deleteSavedArticle } from "../data/db";
import { ForYouFeed } from "../data/foryou";
import { RateLimitedError } from "../data/types";
import type { Article } from "../data/types";
import { ArticleCard, EMPTY_FEED, FeedStatus, type FeedUiState } from "./FeedParts";

const forYouFeed = new ForYouFeed();

/** The personal feed: batches of morelike articles seeded by the saved
 * favorites. Welcome state below two saved articles; same infinite scroll,
 * error states and article cards as the theme feed. */
export default function ForYouScreen({
  savedCount,
  savedTitles,
  refreshSaved,
  onGoToThemes,
  onOpenArticle,
}: {
  savedCount: number;
  savedTitles: Set<string>;
  refreshSaved: () => void;
  onGoToThemes: () => void;
  onOpenArticle: (title: string) => void;
}) {
  const [state, setState] = useState<FeedUiState>(EMPTY_FEED);
  const loadingRef = useRef(false);
  const welcome = savedCount < 2;

  const loadMore = useCallback(async () => {
    if (welcome) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const batch = await forYouFeed.nextBatch();
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
      console.error("WikiMe: loading Voor jou batch failed:", e);
      const message =
        e instanceof RateLimitedError
          ? e.message
          : `Laden mislukt: ${e instanceof Error ? e.message : String(e)}`;
      setState((s) => ({ ...s, isLoading: false, error: message }));
    } finally {
      loadingRef.current = false;
    }
  }, [welcome]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, error: null, exhausted: false }));
    loadMore();
  }, [loadMore]);

  // Kick off the first load once the feed has two or more favorites.
  useEffect(() => {
    if (!welcome) loadMore();
  }, [loadMore, welcome]);

  // Same "near the end of the page" prefetch as the theme feed.
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
        <h1>
          <Logo /> WikiMe
        </h1>
      </header>

      <main className="content">
        {welcome ? (
          <div className="status">
            <p>Sla artikelen op als favoriet en deze feed vormt zich vanzelf.</p>
            <p className="hint">
              Open een thema, bekijk artikelen en tik op het hartje. Vanaf twee
              opgeslagen artikelen stelt WikiMe hier een persoonlijke feed samen.
            </p>
            <button className="btn" onClick={onGoToThemes}>Naar thema's</button>
          </div>
        ) : state.articles.length === 0 ? (
          <FeedStatus
            state={state}
            onRetry={retry}
            emptyMessage="Geen artikelen gevonden. Probeer het opnieuw."
          />
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
              <FeedStatus
                state={state}
                onRetry={retry}
                emptyMessage="Geen artikelen gevonden. Probeer het opnieuw."
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
