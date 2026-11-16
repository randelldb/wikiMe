/** Central place for Wikipedia-related settings. The language is dynamic:
 * it starts from the persisted preference (default "nl") and can be changed
 * at runtime from the settings screen via [setLanguage]. */
const STORAGE_KEY = "wikime-language";

let currentLanguage: string =
  typeof localStorage !== "undefined"
    ? (localStorage.getItem(STORAGE_KEY) ?? "nl")
    : "nl";

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

  /** URL where the action=query API lives. */
  apiBase: (language: string): string => `https://${language}.wikipedia.org`,

  mobileArticleUrl(title: string): string {
    const encoded = title.replaceAll(" ", "_");
    return `https://${this.language}.m.wikipedia.org/wiki/${encoded}`;
  },
};
