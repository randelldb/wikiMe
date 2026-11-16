import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { upsertSavedArticle, deleteSavedArticle } from "../data/db";
import { ArticleRepository } from "../data/repository";
import { RateLimitedError } from "../data/types";
import type { Article } from "../data/types";
import { ArticleCard, EMPTY_FEED, FeedStatus, type FeedUiState } from "./FeedParts";

const repository = new ArticleRepository();

/** Number of random Wikipedia articles shown per roll. */
const ROLL_SIZE = 3;

/** Dice tab screen: a list of random Wikipedia articles to pick from.
 * The appbar button and the button under the list roll a fresh set. */
export default function RandomScreen({
  savedTitles,
  refreshSaved,
  onOpenArticle,
}: {
  savedTitles: Set<string>;
  refreshSaved: () => void;
  onOpenArticle: (title: string) => void;
}) {
  const [state, setState] = useState<FeedUiState>(EMPTY_FEED);
  const loadingRef = useRef(false);

  const roll = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const articles = await repository.randomArticles(ROLL_SIZE);
      setState({
        articles,
        isLoading: false,
        error: null,
        exhausted: articles.length === 0,
      });
    } catch (e) {
      console.error("WikiMe: rolling random articles failed:", e);
      const message =
        e instanceof RateLimitedError
          ? e.message
          : `Laden mislukt: ${e instanceof Error ? e.message : String(e)}`;
      setState((s) => ({ ...s, isLoading: false, error: message }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Roll once when the screen opens.
  useEffect(() => {
    roll();
  }, [roll]);

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
          <Logo /> Willekeurig
        </h1>
        <button
          className="icon-btn"
          onClick={roll}
          title="Nieuwe worp"
          aria-label="Nieuwe worp"
        >
          ⚄
        </button>
      </header>

      <main className="content">
        {state.articles.length === 0 ? (
          <FeedStatus
            state={state}
            onRetry={roll}
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
                onRetry={roll}
                emptyMessage="Geen artikelen gevonden. Probeer het opnieuw."
              />
            )}
            <div className="roll-again">
              <button className="btn" onClick={roll} disabled={state.isLoading}>
                Nog eens rollen
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
