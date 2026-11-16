import { describe, expect, it } from "vitest";
import { dictionaries } from "./i18n";

describe("i18n dictionaries", () => {
  it("en has exactly the same keys as nl", () => {
    expect(Object.keys(dictionaries.en).sort()).toEqual(Object.keys(dictionaries.nl).sort());
  });

  it("no translation is empty in either language", () => {
    for (const dict of [dictionaries.nl, dictionaries.en]) {
      for (const value of Object.values(dict)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
