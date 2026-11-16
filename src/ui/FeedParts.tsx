import type { Article } from "../data/types";

export interface FeedUiState {
  articles: Article[];
  isLoading: boolean;
  /** Human friendly error message, null when the last load succeeded. */
  error: string | null;
  /** True when the last batch had no new articles; auto-loading stops. */
  exhausted: boolean;
}

export const EMPTY_FEED: FeedUiState = {
  articles: [],
  isLoading: false,
  error: null,
  exhausted: false,
};

/** Shared status/footer of the feed screens: loading, error with retry and
 * the (near-)end states. */
export function FeedStatus({
  state,
  onRetry,
  emptyMessage,
}: {
  state: FeedUiState;
  onRetry: () => void;
  emptyMessage: string;
}) {
  if (state.isLoading) {
    return <p className="status">Laden…</p>;
  }
  if (state.error !== null) {
    return (
      <div className="status">
        <p>{state.error}</p>
        <button className="btn" onClick={onRetry}>Opnieuw</button>
      </div>
    );
  }
  return (
    <div className="status">
      <p>
        {state.articles.length === 0
          ? emptyMessage
          : "Geen nieuwe artikelen gevonden."}
      </p>
      {state.exhausted && <button className="btn" onClick={onRetry}>Opnieuw</button>}
    </div>
  );
}

export function ArticleCard({
  article,
  saved,
  onClick,
  onToggleSaved,
}: {
  article: Article;
  saved: boolean;
  onClick: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <article className="card" onClick={onClick}>
      {article.thumbnailUrl && (
        <img className="card-image" src={article.thumbnailUrl} alt="" loading="lazy" />
      )}
      <div className="card-body">
        <div className="card-title-row">
          <h2>{article.title}</h2>
          <button
            className={saved ? "icon-btn heart saved" : "icon-btn heart"}
            aria-label={saved ? "Verwijder uit opgeslagen" : "Opslaan"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSaved();
            }}
          >
            {saved ? "♥" : "♡"}
          </button>
        </div>
        <p className="card-extract">
          {article.extract === "" ? "Geen samenvatting beschikbaar." : article.extract}
        </p>
      </div>
    </article>
  );
}
