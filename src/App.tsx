import { useCallback, useEffect, useRef, useState } from "react";
import ThemesScreen from "./ui/ThemesScreen";
import FeedScreen from "./ui/FeedScreen";
import SavedScreen from "./ui/SavedScreen";
import ArticleView from "./ui/ArticleView";
import ForYouScreen from "./ui/ForYouScreen";
import { savedTitles } from "./data/db";
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
  | { screen: "feed"; themeId: number; themeName: string }
  | { screen: "article"; title: string };

const TABS = [
  { screen: "themes", label: "Thema's" },
  { screen: "saved", label: "Opgeslagen" },
  { screen: "foryou", label: "Voor jou" },
] as const;

function viewKey(v: View): string {
  if (v.screen === "feed") return `feed:${v.themeId}`;
  if (v.screen === "article") return `article:${v.title}`;
  return v.screen;
}

export default function App() {
  const [view, setView] = useState<View>({ screen: "themes" });
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const backStack = useRef<View[]>([]);
  const scrollPos = useRef<Record<string, number>>({});

  const refreshSaved = useCallback(() => {
    savedTitles().then((titles) => setSaved(titles));
  }, []);

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

  // Restore the remembered scroll position whenever the view changes.
  useEffect(() => {
    const y = scrollPos.current[viewKey(view)] ?? 0;
    const frame = requestAnimationFrame(() => window.scrollTo(0, y));
    return () => cancelAnimationFrame(frame);
  }, [view]);

  const switchTab = (screen: "themes" | "saved" | "foryou") => {
    rememberScroll();
    backStack.current = [];
    setView({ screen });
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
              onClick={() => switchTab(tab.screen)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
