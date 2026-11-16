import { useCallback, useEffect, useState } from "react";
import ThemesScreen from "./ui/ThemesScreen";
import FeedScreen from "./ui/FeedScreen";
import SavedScreen from "./ui/SavedScreen";
import ArticleView from "./ui/ArticleView";
import ForYouScreen from "./ui/ForYouScreen";
import { savedTitles } from "./data/db";
import type { Theme } from "./data/types";

/** Navigation mirrors the Android/Flutter app: three top-level tabs plus
 * pushed feed and article views. Kept in App-level state on purpose —
 * the app is small enough to not need a router. */
type View =
  | { screen: "themes" }
  | { screen: "saved" }
  | { screen: "foryou" }
  | { screen: "feed"; themeId: number; themeName: string }
  | { screen: "article"; title: string };

const TABS = [
  { screen: "themes", label: "Thema's" },
  { screen: "saved", label: "Opgeslagen" },
  { screen: "foryou", label: "Voor jou" },
] as const;

export default function App() {
  const [view, setView] = useState<View>({ screen: "themes" });
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const refreshSaved = useCallback(() => {
    savedTitles().then((titles) => setSaved(titles));
  }, []);

  useEffect(refreshSaved, [refreshSaved]);

  const openFeed = (theme: Theme) => {
    if (theme.id == null) return;
    setView({ screen: "feed", themeId: theme.id, themeName: theme.name });
  };

  return (
    <div className="app">
      {view.screen === "themes" && (
        <ThemesScreen
          onOpenTheme={openFeed}
        />
      )}
      {view.screen === "saved" && (
        <SavedScreen
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onOpenArticle={(title) => setView({ screen: "article", title })}
        />
      )}
      {view.screen === "foryou" && (
        <ForYouScreen
          savedCount={saved.size}
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onGoToThemes={() => setView({ screen: "themes" })}
          onOpenArticle={(title) => setView({ screen: "article", title })}
        />
      )}
      {view.screen === "feed" && (
        <FeedScreen
          themeId={view.themeId}
          themeName={view.themeName}
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onBack={() => setView({ screen: "themes" })}
          onOpenArticle={(title) => setView({ screen: "article", title })}
        />
      )}
      {view.screen === "article" && (
        <ArticleView
          title={view.title}
          savedTitles={saved}
          refreshSaved={refreshSaved}
          onClose={() => setView({ screen: "themes" })}
        />
      )}

      {(view.screen === "themes" ||
        view.screen === "saved" ||
        view.screen === "foryou") && (
        <nav className="tabbar" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.screen}
              role="tab"
              aria-selected={view.screen === tab.screen}
              className={view.screen === tab.screen ? "tab active" : "tab"}
              onClick={() => setView({ screen: tab.screen })}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
