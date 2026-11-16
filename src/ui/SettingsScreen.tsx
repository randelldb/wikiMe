import { useState } from "react";
import Logo from "./Logo";
import { useLang } from "../i18n";
import type { AppLanguage } from "../i18n";
import { allThemes, savedArticles } from "../data/db";
import { savedArticleLanguage, themeLanguage } from "../data/types";

/** Language options show their native name in every UI language. */
const LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
];

/** Settings screen. Options: the language switch (changes the UI language
 * and the Wikipedia source at once; themes are tied to the language they
 * were created in, so switching warns when items are hidden) and the
 * full-article feature flag (render whole Wikipedia pages in-app or only
 * link out to Wikipedia). */
export default function SettingsScreen({
  fullArticle,
  onToggleFullArticle,
}: {
  fullArticle: boolean;
  onToggleFullArticle: (enabled: boolean) => void;
}) {
  const { lang, setLang, t } = useLang();
  const [notice, setNotice] = useState(false);

  const choose = async (next: AppLanguage) => {
    if (next === lang) return;
    setLang(next);
    setNotice(false);
    // Themes and saved articles are per language; warn when items exist in
    // the other language because they will be hidden after the switch.
    const [themes, saved] = await Promise.all([allThemes(), savedArticles()]);
    const foreign =
      themes.some((theme) => themeLanguage(theme) !== next) ||
      saved.some((a) => savedArticleLanguage(a) !== next);
    if (foreign) setNotice(true);
  };

  return (
    <div className="screen">
      <header className="appbar">
        <h1>
          <Logo /> {t("settings.title")}
        </h1>
      </header>

      <main className="content">
        <p className="field-label settings-label">{t("settings.language")}</p>
        <ul className="list">
          {LANGUAGES.map((language) => (
            <li key={language.code} className="list-item">
              <button
                className="list-main"
                aria-pressed={lang === language.code}
                onClick={() => choose(language.code)}
              >
                <span className="list-text">
                  <span className="list-title">{language.label}</span>
                </span>
                {lang === language.code && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="hint settings-hint">{t("settings.languageHint")}</p>

        <p className="field-label settings-label">{t("settings.fullArticle")}</p>
        <ul className="list">
          <li className="list-item">
            <button
              className="list-main"
              role="switch"
              aria-checked={fullArticle}
              onClick={() => onToggleFullArticle(!fullArticle)}
            >
              <span className="list-text">
                <span className="list-title">
                  {fullArticle ? t("settings.on") : t("settings.off")}
                </span>
              </span>
              {fullArticle && <span aria-hidden="true">✓</span>}
            </button>
          </li>
        </ul>
        <p className="hint settings-hint">{t("settings.fullArticleHint")}</p>
      </main>

      {notice && (
        <div className="snackbar" role="status" onClick={() => setNotice(false)}>
          {t("settings.itemsUnavailable")}
        </div>
      )}
    </div>
  );
}
