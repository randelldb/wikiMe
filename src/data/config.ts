/** Central place for Wikipedia-related settings. The language is dynamic:
 * it starts from the persisted preference (default "nl") and can be changed
 * at runtime from the settings screen via [setLanguage]. The same goes for
 * the full-article feature flag (default on) via [setFullArticle]. */
const STORAGE_KEY = "wikime-language";
const FULL_ARTICLE_KEY = "wikime-full-article";

let currentLanguage: string =
  typeof localStorage !== "undefined"
    ? (localStorage.getItem(STORAGE_KEY) ?? "nl")
    : "nl";

let fullArticleEnabled: boolean =
  typeof localStorage !== "undefined"
    ? (localStorage.getItem(FULL_ARTICLE_KEY) ?? "1") === "1"
    : true;

export const WikiConfig = {
  get language(): string {
    return currentLanguage;
  },

  /** Switches the wiki language (e.g. "nl", "en") and persists the choice. */
  setLanguage(language: string): void {
    currentLanguage = language;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, language);
    }
  },

  /** Feature flag: render full Wikipedia articles inside the app (true) or
   * only show a link out to Wikipedia (false). Persisted per browser. */
  get fullArticle(): boolean {
    return fullArticleEnabled;
  },

  setFullArticle(enabled: boolean): void {
    fullArticleEnabled = enabled;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(FULL_ARTICLE_KEY, enabled ? "1" : "0");
    }
  },

  /** URL where the action=query API lives. */
  apiBase: (language: string): string => `https://${language}.wikipedia.org`,

  mobileArticleUrl(title: string): string {
    const encoded = title.replaceAll(" ", "_");
    return `https://${this.language}.m.wikipedia.org/wiki/${encoded}`;
  },
};
