import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { WikiConfig } from "./data/config";

export type AppLanguage = "nl" | "en";

/** Dutch is the source of truth for the key set; English must match it
 * exactly (checked by i18n.test.ts). Values may contain `{placeholders}`. */
const nl = {
  "tabs.themes": "Thema's",
  "tabs.saved": "Opgeslagen",
  "tabs.foryou": "Voor jou",
  "tabs.random": "Willekeurige artikelen",
  "tabs.settings": "Instellingen",

  "app.loading": "Laden",

  "themes.empty": "Nog geen thema's. Voeg er een toe met +.",
  "themes.hiddenOtherLanguage": "Thema's gemaakt in een andere taal zijn verborgen.",
  "themes.add": "Thema toevoegen",
  "themes.confirmDelete": 'Verwijder thema "{name}"?',
  "themes.dialog.title": "Nieuw thema",
  "themes.dialog.presets": "Presets",
  "themes.dialog.presetsHint":
    "Tik op \u00e9\u00e9n of meer presets: er wordt automatisch een bredere zoekterm van gemaakt.",
  "themes.dialog.name": "Naam",
  "themes.dialog.description": "Beschrijving",
  "themes.dialog.descriptionPlaceholder": "Waar gaat dit thema over? (optioneel)",
  "themes.dialog.searchQuery": "Zoekterm",
  "themes.dialog.searchPlaceholder": "bijv. uitvinders",
  "themes.dialog.hint":
    "Volgt pagina's die de zoekterm bevatten, net als zoeken op Wikipedia.",
  "themes.dialog.add": "Toevoegen",

  "feed.back": "Terug",
  "feed.loading": "Laden…",
  "feed.retry": "Opnieuw",
  "feed.noNewArticles": "Geen nieuwe artikelen gevonden.",
  "feed.noSummary": "Geen samenvatting beschikbaar.",
  "feed.save": "Opslaan",
  "feed.unsave": "Verwijder uit opgeslagen",
  "feed.emptyTheme":
    "Geen artikelen gevonden. Controleer de zoekterm van dit thema.",
  "feed.emptyGeneric": "Geen artikelen gevonden. Probeer het opnieuw.",

  "foryou.welcomeTitle":
    "Sla artikelen op als favoriet en deze feed vormt zich vanzelf.",
  "foryou.welcomeHint":
    "Open een thema, bekijk artikelen en tik op het hartje. Vanaf twee opgeslagen artikelen stelt WikiMe hier een persoonlijke feed samen.",
  "foryou.goThemes": "Naar thema's",

  "saved.empty": "Nog niets opgeslagen.",
  "saved.hiddenOtherLanguage": "Opgeslagen artikelen uit een andere taal zijn verborgen.",
  "saved.confirmDelete": 'Verwijder "{name}"?',

  "random.title": "Willekeurig",
  "random.reroll": "Nieuwe worp",
  "random.rollAgain": "Nog eens rollen",

  "article.close": "Sluiten",
  "article.readMore": "Lees verder op Wikipedia →",
  "article.readMoreInApp": "Lees meer",
  "article.summaryFailed":
    "Samenvatting ophalen mislukt; alleen de titel is opgeslagen.",

  "swipe.reveal": "Verwijder",
  "swipe.confirmHint":
    "Weet je zeker dat je dit wilt verwijderen? Dit kan niet ongedaan worden.",

  "actions.cancel": "Annuleren",
  "actions.delete": "Verwijder",

  "modal.close": "Sluiten",

  "errors.loadFailed": "Laden mislukt",
  "errors.searchFailed": "Zoeken mislukt. Probeer het opnieuw.",
  "errors.rateLimited":
    "Te veel verzoeken naar Wikipedia. Wacht even en probeer het opnieuw.",
  "errors.noSearchQuery": "Dit thema heeft geen zoekterm.",

  "settings.title": "Instellingen",
  "settings.language": "Taal",
  "settings.languageHint":
    "Bepaalt de taal van de app én van de Wikipedia-bronnen.",
  "settings.fullArticle": "Volledig artikel in de app",
  "settings.fullArticleHint":
    "Aan: de hele Wikipedia-pagina wordt in de app-stijl in de app gerenderd. Uit: alleen een link naar de Wikipedia-pagina.",
  "settings.on": "Aan",
  "settings.off": "Uit",
  "settings.itemsUnavailable":
    "Thema's en opgeslagen artikelen uit een andere taal worden verborgen.",
} as const;

/** Keys come from the Dutch dictionary; values are plain strings so the
 * English dictionary can translate them. */
export type Dict = { [K in keyof typeof nl]: string };
export type TranslationKey = keyof Dict;

const en: Dict = {
  "tabs.themes": "Themes",
  "tabs.saved": "Saved",
  "tabs.foryou": "For you",
  "tabs.random": "Random articles",
  "tabs.settings": "Settings",

  "app.loading": "Loading",

  "themes.empty": "No themes yet. Add one with +.",
  "themes.hiddenOtherLanguage": "Themes created in another language are hidden.",
  "themes.add": "Add theme",
  "themes.confirmDelete": 'Delete theme "{name}"?',
  "themes.dialog.title": "New theme",
  "themes.dialog.presets": "Presets",
  "themes.dialog.presetsHint":
    "Tap one or more presets: a broader search term is built automatically.",
  "themes.dialog.name": "Name",
  "themes.dialog.description": "Description",
  "themes.dialog.descriptionPlaceholder": "What is this theme about? (optional)",
  "themes.dialog.searchQuery": "Search term",
  "themes.dialog.searchPlaceholder": "e.g. inventors",
  "themes.dialog.hint":
    "Follows pages containing the search term, just like searching on Wikipedia.",
  "themes.dialog.add": "Add",

  "feed.back": "Back",
  "feed.loading": "Loading…",
  "feed.retry": "Retry",
  "feed.noNewArticles": "No new articles found.",
  "feed.noSummary": "No summary available.",
  "feed.save": "Save",
  "feed.unsave": "Remove from saved",
  "feed.emptyTheme": "No articles found. Check this theme's search term.",
  "feed.emptyGeneric": "No articles found. Please try again.",

  "foryou.welcomeTitle": "Save articles as favorites and this feed will form itself.",
  "foryou.welcomeHint":
    "Open a theme, browse articles and tap the heart. With two or more saved articles, WikiMe composes a personal feed here.",
  "foryou.goThemes": "Go to themes",

  "saved.empty": "Nothing saved yet.",
  "saved.hiddenOtherLanguage": "Saved articles from another language are hidden.",
  "saved.confirmDelete": 'Delete "{name}"?',

  "random.title": "Random",
  "random.reroll": "New roll",
  "random.rollAgain": "Roll again",

  "article.close": "Close",
  "article.readMore": "Read more on Wikipedia →",
  "article.readMoreInApp": "Read more",
  "article.summaryFailed": "Fetching the summary failed; only the title was saved.",

  "swipe.reveal": "Delete",
  "swipe.confirmHint": "Are you sure you want to delete this? This cannot be undone.",

  "actions.cancel": "Cancel",
  "actions.delete": "Delete",

  "modal.close": "Close",

  "errors.loadFailed": "Loading failed",
  "errors.searchFailed": "Search failed. Please try again.",
  "errors.rateLimited": "Too many requests to Wikipedia. Wait a moment and try again.",
  "errors.noSearchQuery": "This theme has no search term.",

  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.languageHint": "Sets the language of the app and the Wikipedia sources.",
  "settings.fullArticle": "Full article in the app",
  "settings.fullArticleHint":
    "On: the whole Wikipedia page is rendered inside the app in app style. Off: only a link to the Wikipedia page.",
  "settings.on": "On",
  "settings.off": "Off",
  "settings.itemsUnavailable": "Themes and saved articles from another language are hidden.",
};

export const dictionaries: Record<AppLanguage, Dict> = { nl, en };

export type TranslateParams = Record<string, string>;
export type Translate = (key: TranslationKey, params?: TranslateParams) => string;

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replaceAll(/\{(\w+)\}/g, (match, name: string) => params[name] ?? match);
}

/** Non-reactive translation for code outside the component tree (data
 * layer, thrown errors): reads the current wiki language from WikiConfig. */
export function translate(key: TranslationKey, params?: TranslateParams): string {
  const lang = WikiConfig.language === "en" ? "en" : "nl";
  return interpolate(dictionaries[lang][key], params);
}

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "nl",
  setLang: () => {},
  t: (key, params) => interpolate(nl[key], params),
});

/** Holds the UI language, keeps WikiConfig (and thus the Wikipedia API
 * base URL) in sync and persists the choice in localStorage. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(
    WikiConfig.language === "en" ? "en" : "nl",
  );

  const setLang = (next: AppLanguage) => {
    WikiConfig.setLanguage(next);
    setLangState(next);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Stable per language so screens can safely use `t` in useCallback deps.
  const t: Translate = useCallback(
    (key, params) => interpolate(dictionaries[lang][key], params),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}
