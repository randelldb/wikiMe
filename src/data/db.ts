import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { SavedArticle, ShownArticle, Theme } from "./types";

/** Keeps at most this many shown-article rows; the oldest are deleted. */
export const SHOWN_BUFFER_SIZE = 500;

interface WikiMeDb extends DBSchema {
  themes: {
    key: number;
    value: Theme;
    indexes: { "by-name": string };
  };
  saved_articles: {
    key: string;
    value: SavedArticle;
    indexes: { "by-savedAt": number };
  };
  shown_articles: {
    key: string;
    value: ShownArticle;
    indexes: { "by-timestampAtShown": number };
  };
}

let dbPromise: Promise<IDBPDatabase<WikiMeDb>> | null = null;

/** IndexedDB replacement for Room/sqflite: same stores, same seed data. */
export function db(): Promise<IDBPDatabase<WikiMeDb>> {
  if (!dbPromise) {
    dbPromise = openDB<WikiMeDb>("wikime", 6, {
      upgrade: async (database, oldVersion, _newVersion, tx) => {
        // Create stores idempotently: existing databases may already be at
        // version 5 without the shown_articles store (an earlier migration
        // aborted before creating it).
        if (!database.objectStoreNames.contains("themes")) {
          database.createObjectStore("themes", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!database.objectStoreNames.contains("saved_articles")) {
          const store = database.createObjectStore("saved_articles", {
            keyPath: "title",
          });
          store.createIndex("by-savedAt", "savedAt");
        }
        if (!database.objectStoreNames.contains("shown_articles")) {
          const store = database.createObjectStore("shown_articles", {
            keyPath: "articleId",
          });
          store.createIndex("by-timestampAtShown", "timestampAtShown");
        }
        // Migration v4: themes are search-term based only. Every theme from
        // the category/interest era (v1-v3) without a search term is removed.
        if (oldVersion < 4 && oldVersion > 0) {
          const store = tx.objectStore("themes");
          const rows = await store.getAll();
          for (const row of rows) {
            if (!(row as Theme).searchQuery) {
              await store.delete((row as Theme).id as number);
            }
          }
        }
      },
    }).then(seedIfEmpty);
  }
  return dbPromise;
}

/** Inserts the same example themes as the Android/Flutter versions on first run. */
async function seedIfEmpty(database: IDBPDatabase<WikiMeDb>): Promise<IDBPDatabase<WikiMeDb>> {
  const count = await database.count("themes");
  if (count > 0) return database;
  const seeds: Theme[] = [
    { name: "Ruimtevaart", searchQuery: "ruimtevaart" },
    { name: "Kastelen", searchQuery: "kasteel" },
  ];
  for (const theme of seeds) {
    await database.add("themes", theme);
  }
  return database;
}

// --- Themes ---

/** All themes ordered by name, case-insensitive. */
export async function allThemes(): Promise<Theme[]> {
  const themes = await (await db()).getAll("themes");
  return themes.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function theme(id: number): Promise<Theme | undefined> {
  return (await db()).get("themes", id);
}

export async function insertTheme(name: string, searchQuery: string): Promise<void> {
  await (await db()).add("themes", { name, searchQuery });
}

export async function deleteTheme(id: number): Promise<void> {
  await (await db()).delete("themes", id);
}

// --- Saved articles ---

/** All saved articles, newest first. */
export async function savedArticles(): Promise<SavedArticle[]> {
  const rows = await (await db()).getAll("saved_articles");
  return rows.sort((a, b) => b.savedAt - a.savedAt);
}

/** Titles of all saved articles. */
export async function savedTitles(): Promise<Set<string>> {
  const rows = await (await db()).getAll("saved_articles");
  return new Set(rows.map((r) => r.title));
}

export async function upsertSavedArticle(article: SavedArticle): Promise<void> {
  await (await db()).put("saved_articles", article);
}

export async function deleteSavedArticle(title: string): Promise<void> {
  await (await db()).delete("saved_articles", title);
}

// --- Shown articles (Voor jou ring buffer) ---

/** Titles of articles recently shown in the "Voor jou" feed. */
export async function shownArticleTitles(): Promise<Set<string>> {
  const rows = await (await db()).getAll("shown_articles");
  return new Set(rows.map((row) => row.articleId));
}

/** Records articles as shown, trims the ring buffer to SHOWN_BUFFER_SIZE. */
export async function markShownArticles(titles: string[]): Promise<void> {
  if (titles.length === 0) return;
  const database = await db();
  const tx = database.transaction("shown_articles", "readwrite");
  const now = Date.now();
  for (const title of titles) {
    await tx.store.put({ articleId: title, timestampAtShown: now });
  }
  await tx.done;

  const count = await database.count("shown_articles");
  if (count > SHOWN_BUFFER_SIZE) {
    const trim = database.transaction("shown_articles", "readwrite");
    let cursor = await trim.store.index("by-timestampAtShown").openCursor();
    let excess = count - SHOWN_BUFFER_SIZE;
    while (cursor != null && excess > 0) {
      cursor.delete();
      excess--;
      cursor = await cursor.continue();
    }
    await trim.done;
  }
}
