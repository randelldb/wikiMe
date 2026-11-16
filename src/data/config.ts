/** Central place for Wikipedia-related settings. Change [language] to switch wiki. */
export const WikiConfig = {
  language: "nl",

  /** URL where the action=query API lives. */
  apiBase: (language: string): string => `https://${language}.wikipedia.org`,

  mobileArticleUrl(title: string): string {
    const encoded = title.replaceAll(" ", "_");
    return `https://${this.language}.m.wikipedia.org/wiki/${encoded}`;
  },
};
