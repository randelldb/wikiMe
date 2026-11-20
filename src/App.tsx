import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ThemesScreen from "./ui/ThemesScreen";
import FeedScreen from "./ui/FeedScreen";
import SavedScreen from "./ui/SavedScreen";
import ArticleView from "./ui/ArticleView";
import ForYouScreen from "./ui/ForYouScreen";
import RandomScreen from "./ui/RandomScreen";
import SettingsScreen from "./ui/SettingsScreen";
import { ThemesIcon, SavedIcon, ForYouIcon, DiceIcon, GearIcon } from "./ui/TabIcons";
import { useLang } from "./i18n";
import { savedTitlesInLanguage } from "./data/db";
import { WikiConfig } from "./data/config";
import type { Theme } from "./data/types";

/** Navigation mirrors the Android/Flutter app: three top-level tabs plus
 * pushed feed and article views. Kept in App-level state on purpose —
 * the app is small enough to not need a router. A small back-stack makes
 * "back" return to the screen you actually came from, and scroll positions
 * are remembered per view so lists restore exactly where you left them. */
type View =
  | { screen: "themes" }
  | { screen: "saved" }
  | { screen: "foryou" }
  | { screen: "random" }
  | { screen: "settings" }
  | { screen: "feed"; themeId: number; themeName: string }
  | { screen: "article"; title: string };

const TABS = [
  { screen: "themes", labelKey: "tabs.themes", Icon: ThemesIcon },
  { screen: "saved", labelKey: "tabs.saved", Icon: SavedIcon },
  { screen: "foryou", labelKey: "tabs.foryou", Icon: ForYouIcon },
] as const;

/** The square dice and settings buttons sit left and right of the text
 * tabs and act as tabs of their own. */
type TabId = "random" | "settings" | (typeof TABS)[number]["screen"];

function viewKey(v: View): string {
  if (v.screen === "feed") return `feed:${v.themeId}`;
  if (v.screen === "article") return `article:${v.title}`;
  return v.screen;
}

export default function App() {
  const { t, lang } = useLang();
  const [view, setView] = useState<View>({ screen: "themes" });
  // The tab bar is always visible; activeTab keeps the tab you navigated
  // from highlighted while a feed or article view is pushed on top. The dice
  // button is a tab of its own ("random").
  const [activeTab, setActiveTab] = useState<TabId>("themes");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  // Feature flag from the settings: render full Wikipedia articles in-app.
  const [fullArticle, setFullArticleState] = useState(WikiConfig.fullArticle);

  const setFullArticle = (enabled: boolean) => {
    WikiConfig.setFullArticle(enabled);
    setFullArticleState(enabled);
  };
  const backStack = useRef<View[]>([]);
  const scrollPos = useRef<Record<string, number>>({});

  // Saved items are per wiki language (like themes), so the heart states
  // follow the active language.
  const refreshSaved = useCallback(() => {
    savedTitlesInLanguage(lang).then((titles) => setSaved(titles));
  }, [lang]);

  useEffect(refreshSaved, [refreshSaved]);

  const rememberScroll = () => {
    scrollPos.current[viewKey(view)] = window.scrollY;
  };

  // Push the current view on the back-stack before navigating deeper.
  const goTo = (next: View) => {
    rememberScroll();
    backStack.current.push(view);
    setView(next);
  };

  // Pop back to the screen we came from (fallback: themes).
  const goBack = () => {
    const prev = backStack.current.pop();
    if (!prev) return;
    rememberScroll();
    setView(prev);
  };

  const openFeed = (theme: Theme) => {
    if (theme.id == null) return;
    goTo({ screen: "feed", themeId: theme.id, themeName: theme.name });
  };

  // Restore the remembered scroll position when the view changes. The app
  // stays hidden until async content (IndexedDB / API) has made the page
  // tall enough, then we scroll once straight to the target — no flash at
  // the top. Falls back after 1.5s if the content never gets that tall.
  useLayoutEffect(() => {
    const y = scrollPos.current[viewKey(view)] ?? 0;
    if (y === 0) {
      setRestoring(false);
      return;
    }
    setRestoring(true);
    let raf = 0;
    const start = performance.now();
    const tryApply = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max >= y || performance.now() - start > 1500) {
        window.scrollTo(0, y);
        setRestoring(false);
        return;
      }
      raf = requestAnimationFrame(tryApply);
    };
    raf = requestAnimationFrame(tryApply);
    return () => cancelAnimationFrame(raf);
  }, [view]);

  const switchTab = (screen: (typeof TABS)[number]["screen"]) => {
    rememberScroll();
    backStack.current = [];
    setActiveTab(screen);
    setView({ screen });
  };

  // The dice tab: three random articles, treated like a top-level tab.
  const goRandom = () => {
    rememberScroll();
    backStack.current = [];
    setActiveTab("random");
    setView({ screen: "random" });
  };

  // The settings tab (far right), treated like a top-level tab.
  const goSettings = () => {
    rememberScroll();
    backStack.current = [];
    setActiveTab("settings");
    setView({ screen: "settings" });
  };

  return (
    <div className="app" style={{ visibility: restoring ? "hidden" : undefined }}>
      {restoring && (
        <div className="restoring-overlay" role="status" aria-label={t("app.loading")}>
          <div className="spinner" />
        </div>
      )}
      {view.screen === "themes" && (
        <ThemesScreen
          onOpenTheme={openFeed}
        />
      )}
      {view.screen === "saved" && (
        <SavedScreen
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onOpenArticle={(title) => goTo({ screen: "article", title })}
        />
      )}
      {view.screen === "foryou" && (
        <ForYouScreen
          savedCount={saved.size}
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onGoToThemes={() => switchTab("themes")}
          onOpenArticle={(title) => goTo({ screen: "article", title })}
        />
      )}
      {view.screen === "random" && (
        <RandomScreen
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onOpenArticle={(title) => goTo({ screen: "article", title })}
        />
      )}
      {view.screen === "settings" && (
        <SettingsScreen fullArticle={fullArticle} onToggleFullArticle={setFullArticle} />
      )}
      {view.screen === "feed" && (
        <FeedScreen
          themeId={view.themeId}
          themeName={view.themeName}
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onBack={goBack}
          onOpenArticle={(title) => goTo({ screen: "article", title })}
        />
      )}
      {view.screen === "article" && (
        <ArticleView
          title={view.title}
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onClose={goBack}
          onOpenArticle={(title) => goTo({ screen: "article", title })}
          fullArticle={fullArticle}
        />
      )}

      <nav className="tabbar" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "random"}
          className={activeTab === "random" ? "tab dice active" : "tab dice"}
          onClick={goRandom}
          aria-label={t("tabs.random")}
          title={t("tabs.random")}
        >
          <DiceIcon />
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.screen}
            role="tab"
            aria-selected={activeTab === tab.screen}
            className={activeTab === tab.screen ? "tab active" : "tab"}
            onClick={() => switchTab(tab.screen)}
          >
            <tab.Icon />
            <span className="tab-label">{t(tab.labelKey)}</span>
          </button>
        ))}
        <button
          role="tab"
          aria-selected={activeTab === "settings"}
          className={activeTab === "settings" ? "tab gear active" : "tab gear"}
          onClick={goSettings}
          aria-label={t("tabs.settings")}
          title={t("tabs.settings")}
        >
          <GearIcon />
        </button>
      </nav>
    </div>
  );
}
