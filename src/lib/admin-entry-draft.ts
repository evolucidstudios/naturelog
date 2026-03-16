export type AdminEntryDraft = {
  id?: string;
  commonName: string;
  scientificName: string;
  category: string;
  note: string;
  tags: string[];
  deckSlugs: string[];
  lifespan: string;
  edible: "edible" | "not-edible" | "unknown";
  edibleNote: string;
  uses: string[];
  culinaryIdeas: string[];
  goodFor: string[];
  funFacts: string[];
  care: {
    water: string;
    light: string;
    season: string;
  };
  location: {
    place: string;
    latitude: number | null;
    longitude: number | null;
  };
  existingImages: Array<{
    path: string;
    url: string;
  }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createEmptyAdminDraft(): AdminEntryDraft {
  return {
    commonName: "",
    scientificName: "",
    category: "",
    note: "",
    tags: [],
    deckSlugs: [],
    lifespan: "",
    edible: "unknown",
    edibleNote: "",
    uses: [],
    culinaryIdeas: [],
    goodFor: [],
    funFacts: [],
    care: {
      water: "",
      light: "",
      season: "",
    },
    location: {
      place: "",
      latitude: null,
      longitude: null,
    },
    existingImages: [],
  };
}

export function buildEntryPayloadFromDraft(draft: AdminEntryDraft, imagePaths: string[]) {
  return {
    id: draft.id,
    slug: slugify(draft.commonName),
    commonName: draft.commonName.trim(),
    scientificName: draft.scientificName.trim(),
    category: draft.category.trim(),
    note: draft.note.trim(),
    tags: draft.tags.map((tag) => slugify(tag)).filter(Boolean),
    deckSlugs: draft.deckSlugs.map((slug) => slugify(slug)).filter(Boolean),
    lifespan: draft.lifespan.trim(),
    edible: draft.edible,
    edibleNote: draft.edibleNote.trim(),
    uses: draft.uses.map((item) => item.trim()).filter(Boolean),
    culinaryIdeas: draft.culinaryIdeas.map((item) => item.trim()).filter(Boolean),
    goodFor: draft.goodFor.map((item) => item.trim()).filter(Boolean),
    funFacts: draft.funFacts.map((item) => item.trim()).filter(Boolean),
    care: {
      water: draft.care.water.trim(),
      light: draft.care.light.trim(),
      season: draft.care.season.trim(),
    },
    location: {
      place: draft.location.place.trim(),
      latitude: draft.location.latitude,
      longitude: draft.location.longitude,
    },
    imagePaths,
  };
}
