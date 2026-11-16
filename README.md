# WikiMe

A small Wikipedia reader, built as a mobile-first web app.
Browse themes, save favorites, get a personal feed, and roll the dice for random
articles — all straight from the live Wikipedia API. The app is multilingual
(Dutch/English): the language setting in the settings tab switches both the UI
and the Wikipedia source, and themes are shown per language.

> **100% vibecoded with Mistral.** This project was built entirely by prompting
> [Mistral Vibe](https://mistral.ai) — no hand-written code, just conversation.
> The goal was to find out whether developing this way is actually fun.

## Features

- **Themes** — create your own themes around any Wikipedia search term
  (with title autocomplete), stored locally in IndexedDB. Swipe a theme away
  to delete it. The add-theme dialog also offers ~20 **presets** (space,
  tech, …): tapping one or more auto-builds a broader `OR` search query
  from their related terms, so you no longer have to search too specifically.
- **Theme feed** — each theme streams full-text search results from Wikipedia
  with infinite scroll, article thumbnails and intro extracts.
- **Saved** — tap the heart on any article to save it; the saved list lives in
  IndexedDB and also supports swipe-to-delete.
- **For you** — once you have two or more saved articles, a personal feed is
  composed from `morelike:` searches seeded by your recent favorites, without
  repeating articles you have already seen.
- **Random** — the dice tab in the tab bar shows 3 random Wikipedia articles
  to pick from; roll again for a fresh set.
- **Article view** — hero image, lead paragraph and a link to the full article
  on Wikipedia, plus a save toggle.
- The tab bar is always visible, scroll positions are remembered per screen,
  and the app handles rate limiting (HTTP 429) with friendly retry states.

## Tech stack

- **React 19** + **TypeScript** (strict), bootstrapped with **Vite 8**
- **idb** for IndexedDB (themes, saved articles, shown-articles ring buffer)
- **Vitest** for unit tests, **oxlint** for linting
- Plain CSS with a custom dark "metro" palette — no UI framework
- Data comes from the public `nl.wikipedia.org` APIs (`action=query` with
  `origin=*` for CORS, and the `rest.php/v1/search` endpoint)

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm test         # run the unit tests
npm run lint     # oxlint
npm run preview  # preview the production build
```

The app is deployed under the `/wikime/` base path (see `vite.config.ts`).

## Project structure

```
src/
├── App.tsx               # view state, back-stack, tab bar (no router)
├── ui/                   # screens (Themes, Feed, Saved, ForYou, Random, Article)
│   └── FeedParts.tsx     # shared article card + feed status components
└── data/
    ├── api.ts            # Wikipedia API client + pure query builders
    ├── repository.ts     # article feeds: search, morelike, random
    ├── foryou.ts         # personal-feed batching logic
    ├── presets.ts        # theme presets + pure OR-query builders
    ├── db.ts             # IndexedDB layer (idb)
    └── config.ts         # wiki language / API base URLs
```

Navigation is plain App-level state with a small back-stack — the app is
deliberately small enough to not need a router.
