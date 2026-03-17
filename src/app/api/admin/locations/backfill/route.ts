import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { formatLocationLabel, normalizeLocationPlace } from "@/lib/nature-utils";
import { isOpenAiConfigured, openAiApiKey } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const locationSchema = z.object({
  place: z.string().default(""),
});

function fallbackLocationLabel(value: string) {
  return formatLocationLabel(normalizeLocationPlace(value));
}

export async function POST() {
  await requireOwner();

  const admin = createSupabaseAdminClient();
  const { data: entries, error } = await admin
    .from("entries")
    .select("id, location_place, latitude, longitude")
    .order("created_at", { ascending: false });

  if (error || !entries) {
    return NextResponse.json(
      { error: error?.message ?? "Could not load entries for location backfill." },
      { status: 500 },
    );
  }

  const client = isOpenAiConfigured()
    ? new OpenAI({
        apiKey: openAiApiKey,
      })
    : null;

  let updated = 0;

  for (const entry of entries) {
    const currentPlace = entry.location_place ?? "";
    let nextPlace = fallbackLocationLabel(currentPlace);

    if (client) {
      const coordinateHint =
        typeof entry.latitude === "number" && typeof entry.longitude === "number"
          ? `Coordinates: latitude ${entry.latitude}, longitude ${entry.longitude}.`
          : "Coordinates unavailable.";

      const response = await client.responses.parse({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Return only JSON. Standardize this saved nature-log location into a clean city-style label. For United States locations, format place exactly as "City, ST" using a two-letter state code. For other countries, format place exactly as "City, Country". Avoid trails, preserves, lagoons, neighborhoods, or sub-areas unless that is also the city name. Existing saved place: ${currentPlace || "unknown"}. ${coordinateHint} JSON key must be: place.`,
              },
            ],
          },
        ],
        text: {
          format: zodTextFormat(locationSchema, "nature_log_location"),
        },
      });

      const aiPlace = response.output_parsed?.place?.trim() ?? "";

      if (aiPlace) {
        nextPlace = fallbackLocationLabel(aiPlace);
      }
    }

    if (!nextPlace || nextPlace === currentPlace) {
      continue;
    }

    const { error: updateError } = await admin
      .from("entries")
      .update({ location_place: nextPlace })
      .eq("id", entry.id);

    if (!updateError) {
      updated += 1;
    }
  }

  return NextResponse.json({
    success: true,
    updated,
    total: entries.length,
  });
}
