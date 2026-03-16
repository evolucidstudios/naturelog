import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const entryPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  commonName: z.string().min(1),
  scientificName: z.string().default(""),
  category: z.string().default(""),
  note: z.string().default(""),
  tags: z.array(z.string()).default([]),
  deckSlugs: z.array(z.string()).default([]),
  lifespan: z.string().default(""),
  edible: z.enum(["edible", "not-edible", "unknown"]).default("unknown"),
  edibleNote: z.string().default(""),
  uses: z.array(z.string()).default([]),
  culinaryIdeas: z.array(z.string()).default([]),
  goodFor: z.array(z.string()).default([]),
  funFacts: z.array(z.string()).default([]),
  care: z.object({
    water: z.string().default(""),
    light: z.string().default(""),
    season: z.string().default(""),
  }),
  location: z.object({
    place: z.string().default(""),
    latitude: z.number().nullable().default(null),
    longitude: z.number().nullable().default(null),
  }),
  imagePaths: z.array(z.string()).default([]),
});

function titleCase(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function POST(request: Request) {
  const user = await requireOwner();
  const payload = entryPayloadSchema.parse(await request.json());
  const admin = createSupabaseAdminClient();
  const existingImages =
    payload.id
      ? await admin.from("entry_images").select("path").eq("entry_id", payload.id)
      : { data: [], error: null };

  const entryRow = {
    id: payload.id,
    slug: payload.slug,
    common_name: payload.commonName,
    scientific_name: payload.scientificName,
    note: payload.note,
    category: payload.category || null,
    deck_slugs: payload.deckSlugs,
    lifespan: payload.lifespan || null,
    edible: payload.edible,
    edible_note: payload.edibleNote,
    uses: payload.uses,
    culinary_ideas: payload.culinaryIdeas,
    good_for: payload.goodFor,
    fun_facts: payload.funFacts,
    care_water: payload.care.water,
    care_light: payload.care.light,
    care_season: payload.care.season,
    location_place: payload.location.place,
    latitude: payload.location.latitude,
    longitude: payload.location.longitude,
    visibility: "public",
    created_by: user.id,
  };

  const { data: savedEntry, error: entryError } = await admin
    .from("entries")
    .upsert(entryRow, { onConflict: "id" })
    .select("id")
    .single();

  if (entryError || !savedEntry) {
    return NextResponse.json({ error: entryError?.message ?? "Unable to save entry." }, { status: 500 });
  }

  const entryId = savedEntry.id;
  const uniqueTags = Array.from(new Set(payload.tags));

  if (uniqueTags.length > 0) {
    await admin.from("tags").upsert(
      uniqueTags.map((slug) => ({
        slug,
        display_name: titleCase(slug),
      })),
      { onConflict: "slug" },
    );
  }

  const { data: tagRows } = uniqueTags.length
    ? await admin.from("tags").select("id, slug").in("slug", uniqueTags)
    : { data: [] };

  await admin.from("entry_tags").delete().eq("entry_id", entryId);

  if (tagRows && tagRows.length > 0) {
    await admin.from("entry_tags").insert(
      tagRows.map((tag) => ({
        entry_id: entryId,
        tag_id: tag.id,
      })),
    );
  }

  await admin.from("entry_images").delete().eq("entry_id", entryId);

  if (payload.imagePaths.length > 0) {
    await admin.from("entry_images").insert(
      payload.imagePaths.map((path, index) => ({
        entry_id: entryId,
        path,
        sort_order: index,
      })),
    );
  }

  const removedPaths =
    existingImages.data
      ?.map((image) => image.path)
      .filter((path) => !payload.imagePaths.includes(path)) ?? [];

  if (removedPaths.length > 0) {
    await admin.storage.from("nature-images").remove(removedPaths);
  }

  return NextResponse.json({ id: entryId });
}
