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

/** Settings screen. For now the only option is the language switch: it
 * changes the UI language and the Wikipedia source (WikiConfig) at once.
 * Themes are tied to the language they were created in, so switching warns
 * when existing themes are not available in the new language. */
export default function SettingsScreen() {
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
      </main>

      {notice && (
        <div className="snackbar" role="status" onClick={() => setNotice(false)}>
          {t("settings.itemsUnavailable")}
        </div>
      )}
    </div>
  );
}
