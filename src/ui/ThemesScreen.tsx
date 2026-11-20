import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Logo from "./Logo";
import Modal from "./Modal";
import SwipeRow from "./SwipeRow";
import { allThemes, themesInLanguage, deleteTheme, insertTheme, updateTheme } from "../data/db";
import { themeLanguage } from "../data/types";
import type { Theme } from "../data/types";
import { ArticleRepository } from "../data/repository";
import { RateLimitedError } from "../data/types";
import { buildPresetQuery, suggestedThemeName, themePresets } from "../data/presets";
import { useLang } from "../i18n";

const repository = new ArticleRepository();

export default function ThemesScreen({ onOpenTheme }: { onOpenTheme: (theme: Theme) => void }) {
  const { t, lang } = useLang();
  const [themes, setThemes] = useState<Theme[]>([]);
  // True when themes exist that were created in another language (hidden now).
  const [hiddenOtherLang, setHiddenOtherLang] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  // Theme being edited via the swipe-right action, null when no edit dialog.
  const [editing, setEditing] = useState<Theme | null>(null);

  // A theme's search term only works on the wiki of its own language, so
  // only themes of the active language are listed.
  const load = useCallback(() => {
    Promise.all([themesInLanguage(lang), allThemes()]).then(([mine, all]) => {
      setThemes(mine);
      setHiddenOtherLang(all.some((theme) => themeLanguage(theme) !== lang));
    });
  }, [lang]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="screen">
      <header className="appbar">
        <h1>
          <Logo /> WikiMe
        </h1>
      </header>

      <main className="content">
        {themes.length === 0 ? (
          <div className="empty">
            <p>{t("themes.empty")}</p>
            {hiddenOtherLang && <p className="hint">{t("themes.hiddenOtherLanguage")}</p>}
          </div>
        ) : (
          <ul className="list">
            {themes.map((theme) => (
              <li key={theme.id} className="list-item">
                <SwipeRow
                  confirmTitle={t("themes.confirmDelete", { name: theme.name })}
                  onConfirm={async () => {
                    if (theme.id != null) await deleteTheme(theme.id);
                    load();
                  }}
                  onEdit={() => setEditing(theme)}
                >
                  <button className="list-main" onClick={() => onOpenTheme(theme)}>
                    <span className="list-text">
                      <span className="list-title">{theme.name}</span>
                      <span className="list-sub">
                        {theme.description?.trim() ? theme.description : theme.searchQuery}
                      </span>
                    </span>
                  </button>
                </SwipeRow>
              </li>
            ))}
          </ul>
        )}
      </main>

      <button
        className="icon-btn fab"
        aria-label={t("themes.add")}
        onClick={() => setShowAdd(true)}
      >
        +
      </button>

      {showAdd && (
        <ThemeDialog
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {editing && (
        <ThemeDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/** Dialog with a name field and a search term (input with live title
 * suggestions) — a theme feeds on the full-text search results for that
 * term, like Speciaal:Zoeken. With `initial` it edits an existing theme
 * instead of adding a new one. */
function ThemeDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Theme;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, lang } = useLang();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [searchQuery, setSearchQuery] = useState(initial?.searchQuery ?? "");
  // Preset ids tapped in the chip grid; together they build the search query.
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const presets = useMemo(() => themePresets(lang), [lang]);
  const [suggestions, setSuggestions] = useState<{ title: string; description?: string }[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const debounce = useRef<number | undefined>(undefined);
  // Suppresses the suggestion fetch for text that came from picking an option.
  const pickedRef = useRef(false);

  const valid = name.trim() !== "" && searchQuery.trim() !== "";

  useEffect(() => {
    window.clearTimeout(debounce.current);
    if (pickedRef.current) {
      pickedRef.current = false;
      setSuggestions([]);
      setSuggestionsOpen(false);
      setIsSuggesting(false);
      setSuggestError(null);
      return;
    }
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      setSuggestError(null);
      return;
    }
    setIsSuggesting(true);
    setSuggestError(null);
    debounce.current = window.setTimeout(async () => {
      try {
        const results = await repository.titleSuggestions(query, 10);
        setSuggestions(results);
      } catch (e) {
        console.error("WikiMe: title suggestion search failed:", e);
        setSuggestions([]);
        setSuggestError(
          e instanceof RateLimitedError
            ? t("errors.rateLimited")
            : t("errors.searchFailed"),
        );
      } finally {
        setIsSuggesting(false);
      }
    }, 350);
    return () => window.clearTimeout(debounce.current);
  }, [searchQuery, t]);

  const pick = (title: string) => {
    pickedRef.current = true;
    setSuggestionsOpen(false);
    setSelectedPresetIds([]);
    setSearchQuery(title);
  };

  // Tapping a preset (de)selects it and rebuilds the search query from the
  // combined terms of all selected presets; an empty name/description is
  // suggested from the presets. Hand-typing a query clears the selection.
  const togglePreset = (id: string) => {
    const next = selectedPresetIds.includes(id)
      ? selectedPresetIds.filter((presetId) => presetId !== id)
      : [...selectedPresetIds, id];
    const chosen = presets.filter((preset) => next.includes(preset.id));
    setSelectedPresetIds(next);
    setSearchQuery(buildPresetQuery(chosen));
    if (name.trim() === "") setName(suggestedThemeName(chosen));
    if (description.trim() === "") {
      setDescription(chosen.map((preset) => preset.name).join(", "));
    }
  };

  const save = async () => {
    if (!valid) return;
    if (initial) {
      // Keep the id and the language the theme was created in.
      await updateTheme({
        ...initial,
        name: name.trim(),
        searchQuery: searchQuery.trim(),
        description: description.trim(),
      });
    } else {
      // The theme is tied to the wiki language active at creation time.
      await insertTheme(name.trim(), searchQuery.trim(), description.trim(), lang);
    }
    onSaved();
  };

  return (
    <Modal
      title={initial ? t("themes.dialog.editTitle") : t("themes.dialog.title")}
      onClose={onClose}
      fullscreen
    >
      <div className="dialog-body">
        <div className="field">
          <span className="field-label">{t("themes.dialog.presets")}</span>
          <div className="chip-grid" role="group" aria-label={t("themes.dialog.presets")}>
            {presets.map((preset) => {
              const selected = selectedPresetIds.includes(preset.id);
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={selected ? "chip selected" : "chip"}
                  aria-pressed={selected}
                  title={preset.description}
                  onClick={() => togglePreset(preset.id)}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
          <p className="hint">{t("themes.dialog.presetsHint")}</p>
        </div>
        <label className="field">
          <span>{t("themes.dialog.name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>{t("themes.dialog.description")}</span>
          <input
            placeholder={t("themes.dialog.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="field">
          <label className="field-label" htmlFor="theme-search-query">
            {t("themes.dialog.searchQuery")}
          </label>
          <div className="suggest-wrap">
            <input
              id="theme-search-query"
              placeholder={t("themes.dialog.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSelectedPresetIds([]);
                setSearchQuery(e.target.value);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setSuggestionsOpen(false)}
            />
            {isSuggesting && <span className="suggest-status">…</span>}
            {suggestionsOpen && suggestions.length > 0 && (
              <ul className="suggest-list" role="listbox">
                {suggestions.map((s) => (
                  <li key={s.title} role="option" aria-selected="false">
                    <button
                      type="button"
                      className="autocomplete-option"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(s.title);
                      }}
                    >
                      <span className="option-title">{s.title}</span>
                      {s.description && (
                        <span className="option-desc">{s.description}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className="hint">{t("themes.dialog.hint")}</p>
        {suggestError !== null && <p className="error">{suggestError}</p>}
        <div className="dialog-actions">
          <button className="btn btn-outline" onClick={onClose}>
            {t("actions.cancel")}
          </button>
          <button className="btn" disabled={!valid} onClick={save}>
            {initial ? t("themes.dialog.save") : t("themes.dialog.add")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
