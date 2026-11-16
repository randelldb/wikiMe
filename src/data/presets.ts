/** Curated theme presets for the add-theme dialog: instead of typing one
 * very specific search term, the user taps one or more presets and a broader
 * `OR` search query is built from their related terms. Presets are per wiki
 * language, like themes: a preset's terms only make sense on the wiki of
 * its own language. */
export interface ThemePreset {
  /** Stable id, identical across languages so tests can compare the lists. */
  id: string;
  /** Display name, also used to suggest the theme name. */
  name: string;
  /** Short description, shown as tooltip and used for the theme description. */
  description: string;
  /** Related Wikipedia full-text search terms; combined with `OR`. */
  terms: string[];
}

const nlPresets: ThemePreset[] = [
  { id: "space", name: "Ruimtevaart", description: "Raketten, planeten en het heelal", terms: ["ruimtevaart", "astronomie", "raket", "planeet", "NASA", "satelliet"] },
  { id: "tech", name: "Technologie", description: "Computers, robots en het internet", terms: ["technologie", "computer", "internet", "robot", "kunstmatige intelligentie", "programmeren"] },
  { id: "science", name: "Wetenschap", description: "Natuurkunde, biologie en meer", terms: ["natuurkunde", "scheikunde", "biologie", "wiskunde", "geologie"] },
  { id: "history", name: "Geschiedenis", description: "Oude beschavingen en oorlogen", terms: ["geschiedenis", "Romeinse Rijk", "middeleeuwen", "oorlog", "farao", "keizer"] },
  { id: "art", name: "Kunst", description: "Schilderkunst, musea en architectuur", terms: ["schilderkunst", "beeldhouwkunst", "museum", "architectuur", "Picasso"] },
  { id: "music", name: "Muziek", description: "Componisten, bands en instrumenten", terms: ["muziek", "componist", "rockmuziek", "symfonie", "gitaar", "jazz"] },
  { id: "film", name: "Film", description: "Regisseurs, Hollywood en animatie", terms: ["film", "regisseur", "Hollywood", "animatiefilm", "Oscar"] },
  { id: "sports", name: "Sport", description: "Voetbal, Olympische Spelen en meer", terms: ["voetbal", "Olympische Spelen", "tennis", "wielrennen", "schaatsen", "Formule 1"] },
  { id: "nature", name: "Natuur", description: "Vulkanen, oceanen en het klimaat", terms: ["natuur", "vulkaan", "regenwoud", "oceaan", "berg", "klimaatverandering"] },
  { id: "animals", name: "Dieren", description: "Van honden tot dinosaurussen", terms: ["hond", "kat", "vogel", "haai", "dinosaurus", "vlinder"] },
  { id: "food", name: "Eten & drinken", description: "Keukens, recepten en drankjes", terms: ["keuken", "recept", "chocolade", "koffie", "wijn", "brood"] },
  { id: "travel", name: "Reizen", description: "Steden, stranden en vakantie", terms: ["reis", "vakantie", "stad", "strand", "backpacken", "safari"] },
  { id: "medicine", name: "Geneeskunde", description: "Ziekten, vaccins en het lichaam", terms: ["geneeskunde", "ziekenhuis", "virus", "vaccin", "anatomie"] },
  { id: "economy", name: "Economie", description: "Geld, handel en de beurs", terms: ["economie", "geld", "bank", "handel", "belasting", "beurs"] },
  { id: "politics", name: "Politiek", description: "Verkiezingen, regeringen en de VN", terms: ["politiek", "verkiezingen", "president", "regering", "parlement", "Verenigde Naties"] },
  { id: "games", name: "Games", description: "Computer- en bordspellen", terms: ["computerspel", "bordspel", "schaken", "poker", "esports"] },
  { id: "fashion", name: "Mode", description: "Kleding, couture en sneakers", terms: ["mode", "kleding", "haute couture", "sneakers", "modeontwerper"] },
  { id: "cars", name: "Auto's", description: "Auto's, motoren en elektrisch rijden", terms: ["auto", "motor", "elektrische auto", "oldtimer", "vrachtwagen", "Tesla"] },
  { id: "literature", name: "Literatuur", description: "Romans, poëzie en schrijvers", terms: ["roman", "poezie", "schrijver", "Nobelprijs voor de Literatuur", "detective"] },
  { id: "psychology", name: "Psychologie", description: "Het brein, slaap en emoties", terms: ["psychologie", "brein", "slaap", "emotie", "intelligentie"] },
];

const enPresets: ThemePreset[] = [
  { id: "space", name: "Space", description: "Rockets, planets and the universe", terms: ["space exploration", "astronomy", "rocket", "planet", "NASA", "satellite"] },
  { id: "tech", name: "Technology", description: "Computers, robots and the internet", terms: ["technology", "computer", "internet", "robot", "artificial intelligence", "programming"] },
  { id: "science", name: "Science", description: "Physics, biology and more", terms: ["physics", "chemistry", "biology", "mathematics", "geology"] },
  { id: "history", name: "History", description: "Ancient civilizations and wars", terms: ["history", "Roman Empire", "Middle Ages", "war", "pharaoh", "monarchy"] },
  { id: "art", name: "Art", description: "Painting, museums and architecture", terms: ["painting", "sculpture", "museum", "architecture", "Picasso"] },
  { id: "music", name: "Music", description: "Composers, bands and instruments", terms: ["music", "composer", "rock music", "symphony", "guitar", "jazz"] },
  { id: "film", name: "Film", description: "Directors, Hollywood and animation", terms: ["film", "film director", "Hollywood", "animated film", "Academy Awards"] },
  { id: "sports", name: "Sports", description: "Football, Olympics and more", terms: ["football", "Olympic Games", "tennis", "cycling", "skating", "Formula One"] },
  { id: "nature", name: "Nature", description: "Volcanoes, oceans and the climate", terms: ["nature", "volcano", "rainforest", "ocean", "mountain", "climate change"] },
  { id: "animals", name: "Animals", description: "From dogs to dinosaurs", terms: ["dog", "cat", "bird", "shark", "dinosaur", "butterfly"] },
  { id: "food", name: "Food & drink", description: "Cuisines, recipes and beverages", terms: ["cuisine", "recipe", "chocolate", "coffee", "wine", "bread"] },
  { id: "travel", name: "Travel", description: "Cities, beaches and vacations", terms: ["travel", "vacation", "city", "beach", "backpacking", "safari"] },
  { id: "medicine", name: "Medicine", description: "Diseases, vaccines and the body", terms: ["medicine", "hospital", "virus", "vaccine", "anatomy"] },
  { id: "economy", name: "Economy", description: "Money, trade and the stock market", terms: ["economics", "money", "bank", "trade", "tax", "stock market"] },
  { id: "politics", name: "Politics", description: "Elections, governments and the UN", terms: ["politics", "election", "president", "government", "parliament", "United Nations"] },
  { id: "games", name: "Games", description: "Video games and board games", terms: ["video game", "board game", "chess", "poker", "esports"] },
  { id: "fashion", name: "Fashion", description: "Clothing, couture and sneakers", terms: ["fashion", "clothing", "haute couture", "sneakers", "fashion designer"] },
  { id: "cars", name: "Cars", description: "Cars, motorcycles and electric driving", terms: ["car", "motorcycle", "electric car", "vintage car", "truck", "Tesla"] },
  { id: "literature", name: "Literature", description: "Novels, poetry and writers", terms: ["novel", "poetry", "writer", "Nobel Prize in Literature", "detective"] },
  { id: "psychology", name: "Psychology", description: "The brain, sleep and emotions", terms: ["psychology", "brain", "sleep", "emotion", "intelligence"] },
];

/** Presets for a wiki language; unknown languages fall back to Dutch. */
export function themePresets(language: string): ThemePreset[] {
  return language === "en" ? enPresets : nlPresets;
}

/** Builds one broader full-text query from several terms: terms are joined
 * with `OR` so results matching any of them show up. Multi-word terms are
 * wrapped in parentheses so their words stay grouped. Exported as a pure
 * function so the query construction can be unit tested. */
export function presetSearchQuery(terms: string[]): string {
  return terms
    .map((term) => term.trim())
    .filter((term) => term !== "")
    .map((term) => (/\s/.test(term) ? `(${term})` : term))
    .join(" OR ");
}

/** Flattens the terms of the selected presets into one search query,
 * dropping duplicate terms while preserving order. */
export function buildPresetQuery(presets: ThemePreset[]): string {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const preset of presets) {
    for (const term of preset.terms) {
      const key = term.trim().toLowerCase();
      if (key !== "" && !seen.has(key)) {
        seen.add(key);
        terms.push(term.trim());
      }
    }
  }
  return presetSearchQuery(terms);
}

/** Suggests a theme name for the selected presets: the preset names joined
 * with "+", capped at three names plus a "(+n)" remainder. */
export function suggestedThemeName(presets: ThemePreset[]): string {
  const names = presets.map((preset) => preset.name);
  if (names.length <= 3) return names.join(" + ");
  return `${names.slice(0, 3).join(" + ")} (+${names.length - 3})`;
}
