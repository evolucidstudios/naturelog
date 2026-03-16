import type { AdminEntryDraft } from "@/lib/admin-entry-draft";
import {
  decks,
  entries as sampleEntries,
  getEntryIndex,
  type NatureEntry,
} from "@/lib/sample-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/supabase/env";

type EntryRow = {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string | null;
  note: string | null;
  category: string | null;
  deck_slugs: string[] | null;
  lifespan: string | null;
  edible: "edible" | "not-edible" | "unknown" | null;
  edible_note: string | null;
  uses: string[] | null;
  culinary_ideas: string[] | null;
  good_for: string[] | null;
  fun_facts: string[] | null;
  care_water: string | null;
  care_light: string | null;
  care_season: string | null;
  location_place: string | null;
  latitude: number | null;
  longitude: number | null;
  visibility: "public" | "private";
  created_at: string;
  entry_images?: Array<{
    path: string;
    sort_order: number;
  }> | null;
  entry_tags?: Array<{
    tags: {
      slug: string;
    } | null;
  }> | null;
};

function imageUrlFromPath(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/nature-images/${path}`;
}

function rowToNatureEntry(row: EntryRow): NatureEntry {
  const tags = (row.entry_tags ?? [])
    .map((item) => item.tags?.slug)
    .filter((tag): tag is string => Boolean(tag));
  const images = (row.entry_images ?? [])
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((image) => imageUrlFromPath(image.path));

  return {
    id: row.id,
    createdAt: row.created_at,
    commonName: row.common_name,
    scientificName: row.scientific_name ?? "",
    note: row.note ?? "",
    category: row.category ?? undefined,
    tags,
    deckSlugs: row.deck_slugs ?? [],
    images,
    lifespan: row.lifespan ?? undefined,
    location: {
      place: row.location_place ?? "",
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
    },
    edible: row.edible ?? "unknown",
    edibleNote: row.edible_note ?? undefined,
    uses: row.uses ?? [],
    culinaryIdeas: row.culinary_ideas ?? [],
    goodFor: row.good_for ?? [],
    funFacts: row.fun_facts ?? [],
    care: {
      water: row.care_water ?? "",
      light: row.care_light ?? "",
      season: row.care_season ?? "",
    },
  };
}

async function fetchEntries(includePrivate = false) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("entries")
    .select(
      `
        id,
        slug,
        common_name,
        scientific_name,
        note,
        category,
        deck_slugs,
        lifespan,
        edible,
        edible_note,
        uses,
        culinary_ideas,
        good_for,
        fun_facts,
        care_water,
        care_light,
        care_season,
        location_place,
        latitude,
        longitude,
        visibility,
        created_at,
        entry_images (
          path,
          sort_order
        ),
        entry_tags (
          tags (
            slug
          )
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (!includePrivate) {
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as unknown as EntryRow[];
}

export async function getSiteEntries() {
  const rows = await fetchEntries(false);
  return rows.length > 0 ? rows.map(rowToNatureEntry) : sampleEntries;
}

export async function getSiteEntryById(id: string) {
  const entries = await getSiteEntries();
  return entries.find((entry) => entry.id === id) ?? null;
}

export async function getSiteEntriesByTag(tag: string) {
  const entries = await getSiteEntries();
  return entries.filter((entry) => entry.tags.includes(tag));
}

export async function getAdminEntries() {
  const rows = await fetchEntries(true);

  if (rows.length === 0) {
    return sampleEntries;
  }

  return rows.map(rowToNatureEntry);
}

export async function getAdminEntryDraft(id: string): Promise<AdminEntryDraft | null> {
  if (!isSupabaseConfigured()) {
    const sample = sampleEntries.find((entry) => entry.id === id);

    if (!sample) {
      return null;
    }

    return {
      id: sample.id,
      commonName: sample.commonName,
      scientificName: sample.scientificName,
      category: sample.category ?? "",
      note: sample.note,
      tags: sample.tags,
      deckSlugs: sample.deckSlugs,
      lifespan: sample.lifespan ?? "",
      edible: sample.edible ?? "unknown",
      edibleNote: sample.edibleNote ?? "",
      uses: sample.uses ?? [],
      culinaryIdeas: sample.culinaryIdeas ?? [],
      goodFor: sample.goodFor ?? [],
      funFacts: sample.funFacts ?? [],
      care: {
        water: sample.care?.water ?? "",
        light: sample.care?.light ?? "",
        season: sample.care?.season ?? "",
      },
      location: {
        place: sample.location.place,
        latitude: sample.location.latitude,
        longitude: sample.location.longitude,
      },
      existingImages: sample.images.map((url, index) => ({
        path: `sample-${index}`,
        url,
      })),
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("entries")
    .select(
      `
        id,
        slug,
        common_name,
        scientific_name,
        note,
        category,
        deck_slugs,
        lifespan,
        edible,
        edible_note,
        uses,
        culinary_ideas,
        good_for,
        fun_facts,
        care_water,
        care_light,
        care_season,
        location_place,
        latitude,
        longitude,
        visibility,
        created_at,
        entry_images (
          path,
          sort_order
        ),
        entry_tags (
          tags (
            slug
          )
        )
      `,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as EntryRow;

  return {
    id: row.id,
    commonName: row.common_name,
    scientificName: row.scientific_name ?? "",
    category: row.category ?? "",
    note: row.note ?? "",
    tags: (row.entry_tags ?? [])
      .map((item) => item.tags?.slug)
      .filter((tag): tag is string => Boolean(tag)),
    deckSlugs: row.deck_slugs ?? [],
    lifespan: row.lifespan ?? "",
    edible: row.edible ?? "unknown",
    edibleNote: row.edible_note ?? "",
    uses: row.uses ?? [],
    culinaryIdeas: row.culinary_ideas ?? [],
    goodFor: row.good_for ?? [],
    funFacts: row.fun_facts ?? [],
    care: {
      water: row.care_water ?? "",
      light: row.care_light ?? "",
      season: row.care_season ?? "",
    },
    location: {
      place: row.location_place ?? "",
      latitude: row.latitude,
      longitude: row.longitude,
    },
    existingImages: (row.entry_images ?? [])
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((image) => ({
        path: image.path,
        url: imageUrlFromPath(image.path),
      })),
  };
}

export function getSuggestedDeckHref(entry: NatureEntry) {
  const tag = entry.tags[0] ?? entry.category ?? "nature-log";
  return `/tag/${encodeURIComponent(tag)}?focus=${encodeURIComponent(entry.id)}`;
}

export function getSuggestedEntryIndex(entryId: string, deckSlug?: string) {
  return getEntryIndex(entryId, deckSlug);
}

export { decks };
