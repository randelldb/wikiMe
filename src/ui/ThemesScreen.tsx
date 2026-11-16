import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Autocomplete,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
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
        <h1>Thema's</h1>
      </header>

      <main className="content">
        {themes.length === 0 ? (
          <p className="empty">Nog geen thema's. Voeg er een toe met +.</p>
        ) : (
          <ul className="list">
            {themes.map((theme) => (
              <li key={theme.id} className="list-item">
                <button className="list-main" onClick={() => onOpenTheme(theme)}>
                  <span className="list-text">
                    <span className="list-title">{theme.name}</span>
                    <span className="list-sub">{theme.searchQuery}</span>
                  </span>
                </button>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={`Verwijder ${theme.name}`}
                  onClick={async () => {
                    if (theme.id != null) await deleteTheme(theme.id);
                    load();
                  }}
                >
                  🗑
                </ActionIcon>
              </li>
            ))}
          </ul>
        )}
      </main>

      <ActionIcon
        className="fab"
        variant="filled"
        size="xl"
        radius="xl"
        aria-label="Thema toevoegen"
        onClick={() => setShowAdd(true)}
      >
        +
      </ActionIcon>

      <AddThemeDialog
        opened={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => {
          setShowAdd(false);
          load();
        }}
      />
    </div>
  );
}

/** Mantine modal with a name field and a search term (Autocomplete with live
 * title suggestions) — a theme feeds on the full-text search results for that
 * term, like Speciaal:Zoeken. */
function AddThemeDialog({
  opened,
  onClose,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ title: string; description?: string }[]>(
    [],
  );
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const debounce = useRef<number | undefined>(undefined);
  // Suppresses the suggestion fetch for text that came from picking an option.
  const pickedRef = useRef(false);

  const valid = name.trim() !== "" && searchQuery.trim() !== "";

  // Reset the form whenever the modal closes.
  useEffect(() => {
    if (opened) return;
    setName("");
    setSearchQuery("");
    setSuggestions([]);
    setIsSuggesting(false);
    setSuggestError(null);
  }, [opened]);

  useEffect(() => {
    window.clearTimeout(debounce.current);
    if (pickedRef.current) {
      pickedRef.current = false;
      setSuggestions([]);
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

  const onSearchQueryChange = (value: string) => {
    setSearchQuery(value);
  };

  const add = async () => {
    if (!valid) return;
    await insertTheme(name.trim(), searchQuery.trim());
    onSaved();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nieuw thema"
      centered
      zIndex={200}
    >
      <Stack gap="sm">
        <TextInput
          label="Naam"
          data-autofocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Autocomplete
          label="Zoekterm"
          placeholder="bijv. uitvinders"
          value={searchQuery}
          onChange={onSearchQueryChange}
          data={suggestions.map((s) => ({ value: s.title, label: s.title }))}
          renderOption={({ option }) => {
            const suggestion = suggestions.find((s) => s.title === option.value);
            return (
              <div className="autocomplete-option">
                <span className="option-title">{option.value}</span>
                {suggestion?.description && (
                  <span className="option-desc">{suggestion.description}</span>
                )}
              </div>
            );
          }}
          rightSection={isSuggesting ? "…" : null}
          onOptionSubmit={() => {
            // Suppress the suggestion fetch for the option just picked.
            pickedRef.current = true;
          }}
          maxDropdownHeight={280}
        />
        <Text size="sm" c="dimmed">
          Volgt pagina's die de zoekterm bevatten, net als zoeken op Wikipedia.
        </Text>
        {suggestError !== null && (
          <Text size="sm" c="red">
            {suggestError}
          </Text>
        )}
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>
            Annuleren
          </Button>
          <Button disabled={!valid} onClick={add}>
            Toevoegen
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
