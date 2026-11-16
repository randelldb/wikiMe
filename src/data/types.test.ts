import { describe, expect, it } from "vitest";
import { savedArticleLanguage, themeLanguage } from "./types";

describe("themeLanguage", () => {
  it("defaults legacy themes without a language to Dutch", () => {
    expect(themeLanguage({ name: "Kastelen", searchQuery: "kasteel" })).toBe("nl");
  });

  it("returns the language stored on the theme", () => {
    expect(themeLanguage({ name: "Space", searchQuery: "space", language: "en" })).toBe("en");
  });
});

describe("savedArticleLanguage", () => {
  it("defaults legacy saved articles without a language to Dutch", () => {
    expect(savedArticleLanguage({ title: "Kasteel", summary: "", savedAt: 0 })).toBe("nl");
  });

  it("returns the language stored on the article", () => {
    expect(
      savedArticleLanguage({ title: "Castle", summary: "", savedAt: 0, language: "en" }),
    ).toBe("en");
  });
});
