import { describe, expect, it } from "vitest";
import { classifyArticleLink, normalizeArticleHtml } from "./wikihtml";

describe("normalizeArticleHtml", () => {
  it("makes protocol-relative upload URLs absolute https", () => {
    expect(normalizeArticleHtml('<img src="//upload.wikimedia.org/x.jpg">')).toBe(
      '<img src="https://upload.wikimedia.org/x.jpg">',
    );
  });

  it("leaves absolute https URLs untouched", () => {
    const html = '<img src="https://upload.wikimedia.org/x.jpg">';
    expect(normalizeArticleHtml(html)).toBe(html);
  });
});

describe("classifyArticleLink", () => {
  const base = "https://nl.wikipedia.org";

  it("maps main-namespace /wiki/ links to in-app articles, decoded and de-underscored", () => {
    expect(classifyArticleLink("/wiki/Olympische_Spelen", base)).toEqual({
      kind: "article",
      title: "Olympische Spelen",
    });
    expect(classifyArticleLink("/wiki/Ruimtevaart#Geschiedenis", base)).toEqual({
      kind: "article",
      title: "Ruimtevaart",
    });
  });

  it("treats namespace links (Categorie:, Speciaal:) as external wiki URLs", () => {
    expect(classifyArticleLink("/wiki/Categorie:Ruimtevaart", base)).toEqual({
      kind: "external",
      url: "https://nl.wikipedia.org/wiki/Categorie:Ruimtevaart",
    });
  });

  it("resolves other root-relative links against the wiki base", () => {
    expect(classifyArticleLink("/w/index.php?title=Hoofdpagina", base)).toEqual({
      kind: "external",
      url: "https://nl.wikipedia.org/w/index.php?title=Hoofdpagina",
    });
  });

  it("passes absolute and protocol-relative URLs through as external", () => {
    expect(classifyArticleLink("https://example.com/x", base)).toEqual({
      kind: "external",
      url: "https://example.com/x",
    });
    expect(classifyArticleLink("//example.com/y", base)).toEqual({
      kind: "external",
      url: "https://example.com/y",
    });
  });

  it("leaves fragments, empty hrefs and other schemes to the browser", () => {
    expect(classifyArticleLink("#cite_note-1", base)).toEqual({ kind: "none" });
    expect(classifyArticleLink("mailto:a@b.c", base)).toEqual({ kind: "none" });
    expect(classifyArticleLink("", base)).toEqual({ kind: "none" });
  });
});
