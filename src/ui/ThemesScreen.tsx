import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import Modal from "./Modal";
import SwipeToDelete from "./SwipeToDelete";
import { allThemes, deleteTheme, insertTheme } from "../data/db";
import type { Theme } from "../data/types";
import { ArticleRepository } from "../data/repository";
import { RateLimitedError } from "../data/types";

const repository = new ArticleRepository();

export default function ThemesScreen({ onOpenTheme }: { onOpenTheme: (theme: Theme) => void }) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => allThemes().then(setThemes);
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="screen">
      <header className="appbar">
        <h1>
          <Logo /> WikiMe
        </h1>
      </header>

      <main className="content">
        {themes.length === 0 ? (
          <p className="empty">Nog geen thema's. Voeg er een toe met +.</p>
        ) : (
          <ul className="list">
            {themes.map((theme) => (
              <li key={theme.id} className="list-item">
                <SwipeToDelete
                  confirmTitle={`Verwijder thema "${theme.name}"?`}
                  onConfirm={async () => {
                    if (theme.id != null) await deleteTheme(theme.id);
                    load();
                  }}
                >
                  <button className="list-main" onClick={() => onOpenTheme(theme)}>
                    <span className="list-text">
                      <span className="list-title">{theme.name}</span>
                      <span className="list-sub">{theme.searchQuery}</span>
                    </span>
                  </button>
                </SwipeToDelete>
              </li>
            ))}
          </ul>
        )}
      </main>

      <button
        className="icon-btn fab"
        aria-label="Thema toevoegen"
        onClick={() => setShowAdd(true)}
      >
        +
      </button>

      {showAdd && (
        <AddThemeDialog
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/** Dialog with a name field and a search term (input with live title
 * suggestions) — a theme feeds on the full-text search results for that
 * term, like Speciaal:Zoeken. */
function AddThemeDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
            ? e.message
            : "Zoeken mislukt. Probeer het opnieuw.",
        );
      } finally {
        setIsSuggesting(false);
      }
    }, 350);
    return () => window.clearTimeout(debounce.current);
  }, [searchQuery]);

  const pick = (title: string) => {
    pickedRef.current = true;
    setSuggestionsOpen(false);
    setSearchQuery(title);
  };

  const add = async () => {
    if (!valid) return;
    await insertTheme(name.trim(), searchQuery.trim());
    onSaved();
  };

  return (
    <Modal title="Nieuw thema" onClose={onClose}>
      <div className="dialog-body">
        <label className="field">
          <span>Naam</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="field">
          <label className="field-label" htmlFor="theme-search-query">
            Zoekterm
          </label>
          <div className="suggest-wrap">
            <input
              id="theme-search-query"
              placeholder="bijv. uitvinders"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        <p className="hint">
          Volgt pagina's die de zoekterm bevatten, net als zoeken op Wikipedia.
        </p>
        {suggestError !== null && <p className="error">{suggestError}</p>}
        <div className="dialog-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Annuleren
          </button>
          <button className="btn" disabled={!valid} onClick={add}>
            Toevoegen
          </button>
        </div>
      </div>
    </Modal>
  );
}
