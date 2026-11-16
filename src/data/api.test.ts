import { describe, expect, it } from "vitest";
import { morelikeQuery, parseQuery, randomQuery, searchQuery } from "./api";

/** Mirrors how `WikipediaApi.get` encodes queries into the request URL. */
function asUrl(query: Record<string, string>): string {
  return new URLSearchParams({ ...query, origin: "*" }).toString();
}

describe("morelikeQuery (URL-opbouw)", () => {
  it("builds a combined srsearch with all seeds pipe-separated", () => {
    const params = new URLSearchParams(morelikeQuery(["Ruimtevaart", "Kasteel de Haar", "Uitvinder"], 24));

    expect(params.get("action")).toBe("query");
    expect(params.get("list")).toBe("search");
    expect(params.get("srnamespace")).toBe("0");
    expect(params.get("srlimit")).toBe("24");
    expect(params.get("srsearch")).toBe("morelike:Ruimtevaart|Kasteel de Haar|Uitvinder");
  });

  it("URL-encodes titles and the pipe separator", () => {
    const url = asUrl(morelikeQuery(["Lijst van uitvinders", "Uitvinder"], 24));
    expect(url).toContain("srsearch=morelike%3ALijst+van+uitvinders%7CUitvinder");
    expect(url).toContain("srlimit=24");
    expect(url).toContain("origin=*");
  });

  it("handles a single seed", () => {
    const params = new URLSearchParams(morelikeQuery(["Uitvinder"], 8));
    expect(params.get("srsearch")).toBe("morelike:Uitvinder");
    expect(params.get("srlimit")).toBe("8");
  });
});

describe("searchQuery (fulltext, themafeed)", () => {
  it("builds the fulltext search with paging offset", () => {
    const url = asUrl(searchQuery("uitvinders", 20, 40));
    expect(url).toContain("srsearch=uitvinders");
    expect(url).toContain("srlimit=20");
    expect(url).toContain("sroffset=40");
  });
});

describe("parseQuery (action=parse, volledig artikel in de app)", () => {
  it("builds the full-article HTML query with redirects and no edit links", () => {
    const params = new URLSearchParams(parseQuery("Ruimtevaart"));

    expect(params.get("action")).toBe("parse");
    expect(params.get("page")).toBe("Ruimtevaart");
    expect(params.get("prop")).toBe("text");
    expect(params.get("redirects")).toBe("1");
    expect(params.get("disableeditsection")).toBe("1");
  });

  it("URL-encodes the title like the other queries", () => {
    const url = asUrl(parseQuery("Olympische Spelen"));
    expect(url).toContain("page=Olympische+Spelen");
    expect(url).toContain("origin=*");
  });
});

describe("randomQuery (list=random, dobbelsteen-tab)", () => {
  it("builds a list=random query in the main namespace", () => {
    const params = new URLSearchParams(randomQuery(3));

    expect(params.get("action")).toBe("query");
    expect(params.get("list")).toBe("random");
    expect(params.get("rnnamespace")).toBe("0");
    expect(params.get("rnlimit")).toBe("3");
  });

  it("is URL-encoded like the other queries", () => {
    const url = asUrl(randomQuery(3));
    expect(url).toContain("list=random");
    expect(url).toContain("rnlimit=3");
    expect(url).toContain("origin=*");
  });
});
