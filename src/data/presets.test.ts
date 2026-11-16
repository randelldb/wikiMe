import { describe, expect, it } from "vitest";
import {
  buildPresetQuery,
  presetSearchQuery,
  suggestedThemeName,
  themePresets,
} from "./presets";

describe("presetSearchQuery", () => {
  it("joins terms with OR so the search is broader than a single term", () => {
    expect(presetSearchQuery(["ruimtevaart", "astronomie", "raket"])).toBe(
      "ruimtevaart OR astronomie OR raket",
    );
  });

  it("wraps multi-word terms in parentheses so their words stay grouped", () => {
    expect(presetSearchQuery(["Olympische Spelen", "tennis"])).toBe(
      "(Olympische Spelen) OR tennis",
    );
  });

  it("drops blank terms", () => {
    expect(presetSearchQuery(["ruimtevaart", "  ", ""])).toBe("ruimtevaart");
  });

  it("returns an empty query for no terms", () => {
    expect(presetSearchQuery([])).toBe("");
  });
});

describe("buildPresetQuery", () => {
  it("flattens the terms of multiple presets into one OR query", () => {
    const presets = themePresets("nl").filter((p) => p.id === "space" || p.id === "animals");
    const query = buildPresetQuery(presets);
    expect(query).toContain("ruimtevaart");
    expect(query).toContain("dinosaurus");
    expect(query).toContain(" OR ");
  });

  it("dedupes terms that occur in several presets, preserving order", () => {
    const presets = [
      { id: "a", name: "A", description: "", terms: ["ruimtevaart", "raket"] },
      { id: "b", name: "B", description: "", terms: ["Raket", "planeet"] },
    ];
    expect(buildPresetQuery(presets)).toBe("ruimtevaart OR raket OR planeet");
  });
});

describe("suggestedThemeName", () => {
  it("uses the preset name for a single preset", () => {
    const [space] = themePresets("en").filter((p) => p.id === "space");
    expect(suggestedThemeName([space])).toBe("Space");
  });

  it("joins up to three names and summarizes the rest", () => {
    const presets = themePresets("nl").slice(0, 5);
    const name = suggestedThemeName(presets);
    expect(name).toBe(`${presets[0].name} + ${presets[1].name} + ${presets[2].name} (+2)`);
  });

  it("returns an empty name for no presets", () => {
    expect(suggestedThemeName([])).toBe("");
  });
});

describe("themePresets", () => {
  it("offers twenty presets per language, each with a name and terms", () => {
    for (const lang of ["nl", "en"]) {
      const presets = themePresets(lang);
      expect(presets.length).toBe(20);
      for (const preset of presets) {
        expect(preset.name.trim().length).toBeGreaterThan(0);
        expect(preset.description.trim().length).toBeGreaterThan(0);
        expect(preset.terms.length).toBeGreaterThanOrEqual(3);
        for (const term of preset.terms) {
          expect(term.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("has unique ids per language and the same id set in both languages", () => {
    const nl = themePresets("nl");
    const en = themePresets("en");
    expect(new Set(nl.map((p) => p.id)).size).toBe(nl.length);
    expect(en.map((p) => p.id).sort()).toEqual(nl.map((p) => p.id).sort());
  });

  it("falls back to Dutch for unknown languages", () => {
    expect(themePresets("de")[0].name).toBe(themePresets("nl")[0].name);
  });
});
