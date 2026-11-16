import { useEffect, useState } from "react";
import { ArticleRepository } from "../data/repository";
import { WikiConfig } from "../data/config";
import { deleteSavedArticle, upsertSavedArticle } from "../data/db";
import { useLang } from "../i18n";

const repository = new ArticleRepository();

/** Article reading view. Wikipedia blocks embedding its site in an iframe,
 * so the web version shows the intro/thumbnail here and links out to
 * m.wikipedia.org — the web equivalent of the in-app WebView from the
 * Android/Flutter versions. */
export default function ArticleView({
  title,
  savedTitles,
  refreshSaved,
  onClose,
}: {
  title: string;
  savedTitles: Set<string>;
  refreshSaved: () => void;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const [extract, setExtract] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    repository
      .article(title)
      .then((article) => {
        if (cancelled || !article) return;
        setExtract(article.extract);
        setThumbnailUrl(article.thumbnailUrl);
      })
      .catch((e) => {
        console.error(`WikiMe: fetching article "${title}" failed:`, e);
        if (!cancelled) setExtract("");
      });
    return () => {
      cancelled = true;
    };
  }, [title]);

  const saved = savedTitles.has(title);

  const toggleSaved = async () => {
    if (saved) {
      await deleteSavedArticle(title);
    } else {
      // Pages reached through links may have no summary yet; fetch intro +
      // thumbnail, and if that fails still save the title.
      let savedSummary = "";
      let savedThumb: string | undefined;
      try {
        const article = await repository.article(title);
        savedSummary = article?.extract ?? "";
        savedThumb = article?.thumbnailUrl;
      } catch (e) {
        console.error(
          `WikiMe: fetching article "${title}" before saving failed, saving title only:`,
          e,
        );
        setMessage(t("article.summaryFailed"));
      }
      await upsertSavedArticle({
        title,
        summary: savedSummary,
        thumbnailUrl: savedThumb,
        savedAt: Date.now(),
        language: lang,
      });
    }
    refreshSaved();
  };

  return (
    <div className="screen article">
      <header className="appbar">
        <button className="icon-btn" aria-label={t("article.close")} onClick={onClose}>
          ←
        </button>
        <h1>{title}</h1>
      </header>

      <button
        className={saved ? "saved-bar saved" : "saved-bar"}
        onClick={toggleSaved}
        aria-label={saved ? t("feed.unsave") : t("feed.save")}
        aria-pressed={saved}
      >
        {saved ? "♥" : "♡"}
      </button>

      <main className="content">
        {thumbnailUrl && <img className="hero" src={thumbnailUrl} alt="" />}
        <div className="article-body">
          {extract === null ? (
            <p className="status">{t("feed.loading")}</p>
          ) : extract === "" ? (
            <p className="empty">{t("feed.noSummary")}</p>
          ) : (
            <p className="lead">{extract}</p>
          )}
          <a
            className="btn"
            href={WikiConfig.mobileArticleUrl(title)}
            target="_blank"
            rel="noreferrer"
          >
            {t("article.readMore")}
          </a>
        </div>

        {message && (
          <div className="snackbar" onClick={() => setMessage(null)}>
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
