/** Helpers for the HTML returned by `action=parse&prop=text`: normalizing
 * resource URLs and classifying links so article content can be shown inside
 * the app without leaving it. Pure functions, unit tested in wikihtml.test.ts. */

/** Makes protocol-relative upload.wikimedia.org URLs absolute https, so
 * images also load when the app itself is served over plain http. The
 * lookbehind keeps existing https:// URLs untouched. */
export function normalizeArticleHtml(html: string): string {
  return html.replace(/(?<!:)\/\/upload\.wikimedia\.org/g, "https://upload.wikimedia.org");
}

export type ArticleLink =
  | { kind: "article"; title: string }
  | { kind: "external"; url: string }
  | { kind: "none" };

/** Classifies a link from rendered article HTML: main-namespace `/wiki/`
 * links open as in-app articles, other wiki/absolute links open externally,
 * and fragments (`#...`) or schemes like `mailto:` are left to the browser. */
export function classifyArticleLink(href: string, wikiBase: string): ArticleLink {
  const trimmed = href.trim();
  if (trimmed === "" || trimmed.startsWith("#")) return { kind: "none" };
  if (trimmed.startsWith("/wiki/")) {
    const rest = trimmed.slice("/wiki/".length).split("#")[0];
    if (!rest.includes(":")) {
      let title = rest;
      try {
        title = decodeURIComponent(rest);
      } catch {
        title = rest;
      }
      return { kind: "article", title: title.replaceAll("_", " ") };
    }
  }
  if (trimmed.startsWith("/")) {
    return { kind: "external", url: new URL(trimmed, wikiBase).href };
  }
  if (trimmed.startsWith("//")) {
    return { kind: "external", url: `https:${trimmed}` };
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: "external", url: trimmed };
  }
  return { kind: "none" };
}
