import { useCallback, useEffect, useState } from "react";
import { ActionIcon } from "@mantine/core";
import { deleteSavedArticle, savedArticles } from "../data/db";
import type { SavedArticle } from "../data/types";

export default function SavedScreen({
  savedTitles,
  refreshSaved,
  onOpenArticle,
}: {
  savedTitles: Set<string>;
  refreshSaved: () => void;
  onOpenArticle: (title: string) => void;
}) {
  const [articles, setArticles] = useState<SavedArticle[]>([]);

  const load = useCallback(() => savedArticles().then(setArticles), []);
  useEffect(() => {
    load();
  }, [load, savedTitles]);

  const remove = async (title: string) => {
    await deleteSavedArticle(title);
    refreshSaved();
    load();
  };

  return (
    <div className="screen">
      <header className="appbar">
        <h1>Opgeslagen</h1>
      </header>

      <main className="content">
        {articles.length === 0 ? (
          <p className="empty">Nog niets opgeslagen.</p>
        ) : (
          <ul className="list">
            {articles.map((article) => (
              <li key={article.title} className="list-item">
                <button className="list-main" onClick={() => onOpenArticle(article.title)}>
                  {article.thumbnailUrl && (
                    <img className="thumb" src={article.thumbnailUrl} alt="" loading="lazy" />
                  )}
                  <span className="list-text">
                    <span className="list-title">{article.title}</span>
                    {article.summary.trim() !== "" && (
                      <span className="list-sub">{article.summary}</span>
                    )}
                  </span>
                </button>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={`Verwijder ${article.title}`}
                  onClick={() => remove(article.title)}
                >
                  🗑
                </ActionIcon>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
