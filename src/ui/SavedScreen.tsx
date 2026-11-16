import { useCallback, useEffect, useState } from "react";
import Logo from "./Logo";
import SwipeToDelete from "./SwipeToDelete";
import { deleteSavedArticle, savedArticles, savedArticlesInLanguage } from "../data/db";
import { savedArticleLanguage } from "../data/types";
import type { SavedArticle } from "../data/types";
import { useLang } from "../i18n";

export default function SavedScreen({
  savedTitles,
  refreshSaved,
  onOpenArticle,
}: {
  savedTitles: Set<string>;
  refreshSaved: () => void;
  onOpenArticle: (title: string) => void;
}) {
  const { t, lang } = useLang();
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  // True when saved articles exist that were saved in another language.
  const [hiddenOtherLang, setHiddenOtherLang] = useState(false);

  // Only saved articles of the active language are listed.
  const load = useCallback(() => {
    Promise.all([savedArticlesInLanguage(lang), savedArticles()]).then(([mine, all]) => {
      setArticles(mine);
      setHiddenOtherLang(all.some((a) => savedArticleLanguage(a) !== lang));
    });
  }, [lang]);
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
        <h1>
          <Logo /> WikiMe
        </h1>
      </header>

      <main className="content">
        {articles.length === 0 ? (
          <div className="empty">
            <p>{t("saved.empty")}</p>
            {hiddenOtherLang && <p className="hint">{t("saved.hiddenOtherLanguage")}</p>}
          </div>
        ) : (
          <ul className="list">
            {articles.map((article) => (
              <li key={article.title} className="list-item">
                <SwipeToDelete
                  confirmTitle={t("saved.confirmDelete", { name: article.title })}
                  onConfirm={() => remove(article.title)}
                >
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
                </SwipeToDelete>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
