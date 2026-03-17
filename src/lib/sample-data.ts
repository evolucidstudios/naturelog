export type NatureEntry = {
  id: string;
  createdAt?: string;
  commonName: string;
  pronunciation?: string;
  scientificName: string;
  note: string;
  category?: string;
  tags: string[];
  deckSlugs: string[];
  images: string[];
  lifespan?: string;
  location: {
    place: string;
    latitude: number;
    longitude: number;
  };
  edible?: "edible" | "not-edible" | "unknown";
  edibleNote?: string;
  uses?: string[];
  culinaryIdeas?: string[];
  goodFor?: string[];
  funFacts?: string[];
  care?: {
    water: string;
    light: string;
    season: string;
  };
};

export type NatureDeck = {
  slug: string;
  title: string;
  description: string;
  entryIds: string[];
};

export const entries: NatureEntry[] = [
  {
    id: "western-redbud-001",
    commonName: "Western Redbud",
    scientificName: "Cercis occidentalis",
    category: "tree",
    note:
      "Found at the edge of a warm canyon trail after light rain, with magenta bloom clusters and small heart-shaped leaves just beginning to open.",
    tags: [
      "trees",
      "flowers",
      "flowering-tree",
      "fabaceae",
      "western-redbud",
      "native-california",
      "spring-bloom",
      "pollinator-friendly",
      "chaparral",
      "pink-blossom",
    ],
    deckSlugs: ["spring-bloomers", "canyon-ridge"],
    images: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Cercis%20occidentalis%20(32825151424).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Cercis%20occidentalis%2C%20California.jpg",
    ],
    location: {
      place: "Canyon Ridge Trail",
      latitude: 34.1187,
      longitude: -118.3004,
    },
    edible: "unknown",
    edibleNote: "Not typically treated as a foraging primary. Verify species and part before considering use.",
    uses: [
      "ornamental native landscape tree",
      "spring pollinator support",
      "habitat value in dry gardens",
    ],
    goodFor: ["early color", "native gardens", "pollinator planting"],
    funFacts: [
      "Its bright magenta flowers often show before the leaves fully open.",
      "The heart-shaped leaves are one of the easiest ways to recognize it later in the season.",
      "Redbuds are in the pea family, which surprises a lot of people the first time they learn it.",
    ],
    care: {
      water: "Low once established",
      light: "Full sun to part shade",
      season: "Best bloom in spring",
    },
  },
  {
    id: "anna-hummingbird-002",
    commonName: "Anna's Hummingbird",
    scientificName: "Calypte anna",
    category: "bird",
    note:
      "Observed hovering near sage flowers, flashing iridescent rose on the throat patch and defending the patch with short aerial arcs.",
    tags: [
      "animals",
      "birds",
      "bird",
      "trochilidae",
      "annas-hummingbird",
      "pollinator",
      "urban-wildlife",
      "hovering",
      "resident-species",
      "sage-associated",
    ],
    deckSlugs: ["pollinator-visitors", "garden-regulars"],
    images: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Anna%27s%20hummingbird%20(41119).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Anna%27s%20hummingbird.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Anna%27s%20hummingbird%20(41124).jpg",
    ],
    location: {
      place: "Back Garden Terrace",
      latitude: 34.0818,
      longitude: -118.3493,
    },
    edible: "not-edible",
    edibleNote: "Wild bird. Not a plant food source entry.",
    uses: [
      "pollination support",
      "ecosystem indicator species",
      "garden biodiversity attraction",
    ],
    goodFor: ["nectar gardens", "bird watching", "year-round activity"],
    funFacts: [
      "Anna's Hummingbirds can flash brilliant rose color that looks almost neon in the right light.",
      "Unlike many hummingbirds, they can stay in parts of California all year.",
      "Their courtship dives can make a sharp sound as air moves over the tail feathers.",
    ],
    care: {
      water: "Depends on nectar plants nearby",
      light: "Active in bright open light",
      season: "Visible through much of the year",
    },
  },
  {
    id: "coast-live-oak-003",
    commonName: "Coast Live Oak",
    scientificName: "Quercus agrifolia",
    category: "tree",
    note:
      "Massive branching canopy with leathery, spiny leaves and a cool understory full of leaf litter, acorn caps, and filtered afternoon light.",
    tags: [
      "trees",
      "tree",
      "fagaceae",
      "coast-live-oak",
      "evergreen",
      "keystone-species",
      "oak-woodland",
      "native-california",
      "canopy-tree",
    ],
    deckSlugs: ["canyon-ridge", "tree-canopy"],
    images: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Coast%20Live%20Oak%20(26944869376).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/130109%20Coast%20Live%20Oak%20-%20Quercus%20agrifolia%20(9744074730).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Quercusagrifolia.jpg",
    ],
    location: {
      place: "Fern Hollow Preserve",
      latitude: 34.1261,
      longitude: -118.2877,
    },
    edible: "unknown",
    edibleNote: "Acorns can be food after correct processing, but species, tannin level, and preparation matter.",
    uses: [
      "shade canopy",
      "wildlife support and acorn production",
      "structural habitat for woodland ecosystems",
    ],
    goodFor: ["cool understory", "bird habitat", "erosion holding roots"],
    funFacts: [
      "A single mature oak can support a huge web of insects, birds, and mammals around it.",
      "The leaves stay on the tree year-round, which is why the canopy feels so steady and sheltering.",
      "Acorns were an important traditional food in California after careful processing.",
    ],
    care: {
      water: "Moderate when young, low later",
      light: "Full sun",
      season: "Strong year-round structure",
    },
  },
  {
    id: "california-poppy-004",
    commonName: "California Poppy",
    scientificName: "Eschscholzia californica",
    category: "flower",
    note:
      "Dense drift of bright orange cups facing the morning sun on a dry slope, opening wide after the cloud layer burned off.",
    tags: [
      "flowers",
      "wildflower",
      "papaveraceae",
      "california-poppy",
      "native-california",
      "orange-bloom",
      "sun-loving",
      "spring-bloom",
      "roadside-patch",
    ],
    deckSlugs: ["spring-bloomers", "canyon-ridge"],
    images: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/California%20poppy%20(33440096662).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/California%20poppy%20(29458818276).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/California%20Poppy%20(3425058115).jpg",
    ],
    location: {
      place: "Vista Switchback",
      latitude: 34.1122,
      longitude: -118.2954,
    },
    edible: "edible",
    edibleNote: "Often noted as edible in small amounts, but always confirm identity and safe preparation before consuming.",
    uses: [
      "ornamental seasonal color",
      "pollinator support",
      "native restoration planting",
    ],
    culinaryIdeas: ["petal garnish", "light floral tea after proper ID"],
    goodFor: ["spring displays", "dry slopes", "wildflower mixes"],
    funFacts: [
      "The flowers usually close at night or during cold, cloudy weather.",
      "California poppy is the state flower, so a hillside full of it can feel iconic instantly.",
      "Its orange color can shift from soft apricot to glowing flame depending on the light.",
    ],
    care: {
      water: "Low",
      light: "Full sun",
      season: "Peak show in spring",
    },
  },
  {
    id: "monarch-butterfly-005",
    commonName: "Monarch Butterfly",
    scientificName: "Danaus plexippus",
    category: "insect",
    note:
      "Glided slowly between milkweed stems before settling with wings half-open, showing strong black veining and a clean spotted border.",
    tags: [
      "animals",
      "insects",
      "insect",
      "nymphalidae",
      "monarch-butterfly",
      "pollinator",
      "milkweed-associated",
      "orange-black",
      "migration-species",
      "garden-visitor",
    ],
    deckSlugs: ["pollinator-visitors", "garden-regulars"],
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/3/3a/Monarch_Butterfly_Danaus_plexippus_Male_2664px.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Monarch_In_May.jpg",
    ],
    location: {
      place: "Back Garden Terrace",
      latitude: 34.0816,
      longitude: -118.3495,
    },
    edible: "not-edible",
    edibleNote: "Butterfly entry, not a foraging food source.",
    uses: [
      "pollination network support",
      "ecology education",
      "milkweed habitat indicator",
    ],
    goodFor: ["garden wildlife value", "migration interest", "school nature study"],
    funFacts: [
      "Monarchs are famous for migration, but different populations travel in very different ways.",
      "Their caterpillars feed on milkweed, which helps make them taste bad to predators.",
      "That black-and-orange pattern is basically a warning sign in butterfly form.",
    ],
    care: {
      water: "Needs host plants more than direct care",
      light: "Open warm areas",
      season: "Best during migration and breeding windows",
    },
  },
  {
    id: "western-sycamore-006",
    commonName: "Western Sycamore",
    scientificName: "Platanus racemosa",
    category: "tree",
    note:
      "Tall pale trunk with mottled bark peeling in patches above a wash, with broad leaves filtering wind and a loose scatter of seed balls below.",
    tags: [
      "trees",
      "tree",
      "platanaceae",
      "western-sycamore",
      "riparian",
      "peeling-bark",
      "native-california",
      "canopy-tree",
      "stream-corridor",
    ],
    deckSlugs: ["tree-canopy", "canyon-ridge"],
    images: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Platanus%20racemosa-11.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bare%20Platanus%20racemosa.jpg",
    ],
    location: {
      place: "Creek Bend Crossing",
      latitude: 34.1213,
      longitude: -118.2911,
    },
    edible: "unknown",
    edibleNote: "Not commonly used as a direct food source in this context.",
    uses: [
      "riparian shade",
      "stream-edge habitat",
      "large-scale landscape structure",
    ],
    goodFor: ["creek corridors", "summer shade", "wildlife cover"],
    funFacts: [
      "Its bark peels away in patches, leaving a camouflage-like trunk pattern.",
      "Sycamores often mark places where underground moisture stays more available.",
      "In winter, the pale trunks can glow against a dark canyon almost like landmarks.",
    ],
    care: {
      water: "Higher than upland natives",
      light: "Full sun",
      season: "Strong bark and branching in winter",
    },
  },
  {
    id: "mule-deer-007",
    commonName: "Mule Deer",
    scientificName: "Odocoileus hemionus",
    category: "mammal",
    note:
      "A quiet pair moved through the brush line at dusk, pausing with ears forward before slipping into deeper oak shade.",
    tags: [
      "animals",
      "mammal",
      "cervidae",
      "mule-deer",
      "crepuscular",
      "oak-woodland",
      "trail-edge",
      "herbivore",
      "wildlife-crossing",
    ],
    deckSlugs: ["canyon-ridge", "wild-neighbors"],
    images: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mule%20deer%20(54120655517).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mule%20Deer%20(42653892131).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mule%20Deer.JPG",
    ],
    location: {
      place: "Fern Hollow Preserve",
      latitude: 34.1267,
      longitude: -118.2868,
    },
    edible: "not-edible",
    edibleNote: "Wild animal entry, not a plant foraging item.",
    uses: [
      "wildlife observation value",
      "ecosystem health signal",
      "seed dispersal and browsing role",
    ],
    goodFor: ["dusk observation", "oak woodland ecology", "trail encounters"],
    funFacts: [
      "The oversized ears are part of why they look so alert and expressive.",
      "Their bounding gait can look almost spring-loaded when they move through rough terrain.",
      "Fresh browsing lines on shrubs can be one of the first clues deer are nearby.",
    ],
    care: {
      water: "Wild animal, not cultivated",
      light: "Most active near cover edges",
      season: "Often easier to spot at dawn and dusk",
    },
  },
  {
    id: "black-sage-008",
    commonName: "Black Sage",
    scientificName: "Salvia mellifera",
    category: "shrub",
    note:
      "Aromatic foliage and pale blue flower whorls along a warm hillside, buzzing with native bees in the late afternoon.",
    tags: [
      "flowers",
      "shrubs",
      "shrub",
      "lamiaceae",
      "black-sage",
      "chaparral",
      "native-california",
      "pollinator-friendly",
      "aromatic",
      "dry-slope",
    ],
    deckSlugs: ["pollinator-visitors", "canyon-ridge"],
    images: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Salvia%20mellifera%20(444075966).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Salvia%20mellifera%20(27784635041).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Salvia%20mellifera.jpg",
    ],
    location: {
      place: "Canyon Ridge Trail",
      latitude: 34.1181,
      longitude: -118.3012,
    },
    edible: "unknown",
    edibleNote: "Some salvias have culinary value, but wild ID and species-specific safety should be confirmed first.",
    uses: [
      "pollinator forage",
      "drought-tolerant planting",
      "native habitat restoration",
    ],
    culinaryIdeas: ["aromatic tea only after species-safe confirmation"],
    goodFor: ["dry gardens", "bee support", "aromatic landscapes"],
    funFacts: [
      "On a warm day the leaves can smell powerful and resinous when brushed past on a trail.",
      "Black sage honey is famous for being especially rich and complex.",
      "This shrub can dominate entire chaparral slopes and set the whole hillside's scent profile.",
    ],
    care: {
      water: "Very low",
      light: "Full sun",
      season: "Strong through dry seasons",
    },
  },
];

export const decks: NatureDeck[] = [
  {
    slug: "spring-bloomers",
    title: "Spring Bloomers",
    description:
      "Cards for blossoms, leaf-out moments, and the first bright signs of seasonal change.",
    entryIds: ["western-redbud-001", "california-poppy-004"],
  },
  {
    slug: "canyon-ridge",
    title: "Canyon Ridge",
    description:
      "Finds from dry ridges, scrub edges, and trail corridors with layered elevation and dramatic light.",
    entryIds: [
      "western-redbud-001",
      "coast-live-oak-003",
      "california-poppy-004",
      "western-sycamore-006",
      "mule-deer-007",
      "black-sage-008",
    ],
  },
  {
    slug: "pollinator-visitors",
    title: "Pollinator Visitors",
    description:
      "Birds, insects, and other species connected to flowering plants and nectar sources.",
    entryIds: [
      "anna-hummingbird-002",
      "monarch-butterfly-005",
      "black-sage-008",
    ],
  },
  {
    slug: "tree-canopy",
    title: "Tree Canopy",
    description:
      "Large structure, bark texture, leaves, and shade-making giants that shape the feel of a place.",
    entryIds: ["coast-live-oak-003", "western-sycamore-006"],
  },
  {
    slug: "garden-regulars",
    title: "Garden Regulars",
    description:
      "Backyard and near-home visitors that make repeated appearances through the season.",
    entryIds: ["anna-hummingbird-002", "monarch-butterfly-005"],
  },
  {
    slug: "wild-neighbors",
    title: "Wild Neighbors",
    description:
      "Larger animals and memorable nearby encounters that change the mood of a walk.",
    entryIds: ["mule-deer-007"],
  },
];

export const entriesByDeck = Object.fromEntries(
  decks.map((deck) => [
    deck.slug,
    deck.entryIds
      .map((entryId) => entries.find((entry) => entry.id === entryId))
      .filter(Boolean),
  ]),
) as Record<string, NatureEntry[]>;

export const featuredTags = [
  "species",
  "genus",
  "family",
  "habitat",
  "native-range",
  "bloom-time",
  "behavior",
  "weather",
  "season",
  "soil",
  "canopy-layer",
  "conservation",
];

export const mapRegions = [
  {
    slug: "canyon-ridge",
    name: "Canyon Ridge",
    summary: "Dry slope flora and oak canopy finds",
    deckSlug: "canyon-ridge",
    left: 44,
    top: 33,
  },
  {
    slug: "garden-terrace",
    name: "Garden Terrace",
    summary: "Urban pollinators and backyard sightings",
    deckSlug: "garden-regulars",
    left: 63,
    top: 58,
  },
  {
    slug: "fern-hollow",
    name: "Fern Hollow",
    summary: "Cool shade observations and tree structure",
    deckSlug: "tree-canopy",
    left: 28,
    top: 64,
  },
];

export function getDeckEntries(slug: string) {
  return entriesByDeck[slug] ?? [];
}

export function getEntryIndex(entryId: string, deckSlug?: string) {
  const source = deckSlug ? getDeckEntries(deckSlug) : entries;
  return source.findIndex((entry) => entry.id === entryId);
}

export function getEntriesByTag(tag: string) {
  return entries.filter((entry) => entry.tags.includes(tag));
}

export function getDiscoveryTags(activeEntry: NatureEntry) {
  return Array.from(new Set(entries.flatMap((entry) => entry.tags)))
    .filter((tag) => !activeEntry.tags.includes(tag))
    .sort((left, right) => {
      const popularityDelta = (tagPopularity[right] ?? 0) - (tagPopularity[left] ?? 0);

      if (popularityDelta !== 0) {
        return popularityDelta;
      }

      return left.localeCompare(right);
    });
}

export function getTagUsageCount(tag: string) {
  return entries.filter((entry) => entry.tags.includes(tag)).length;
}

const tagPopularity = entries.reduce<Record<string, number>>((counts, entry) => {
  for (const tag of entry.tags) {
    counts[tag] = (counts[tag] ?? 0) + 1;
  }

  return counts;
}, {});

export function getPrimaryTagForEntry(entry: NatureEntry) {
  return (
    [...entry.tags].sort((left, right) => {
      const popularityDelta = (tagPopularity[right] ?? 0) - (tagPopularity[left] ?? 0);

      if (popularityDelta !== 0) {
        return popularityDelta;
      }

      return entry.tags.indexOf(left) - entry.tags.indexOf(right);
    })[0] ?? "native-california"
  );
}

export function getDeckHrefForEntry(entry: NatureEntry) {
  return `/tag/${encodeURIComponent(getPrimaryTagForEntry(entry))}?focus=${encodeURIComponent(
    entry.id,
  )}`;
}
