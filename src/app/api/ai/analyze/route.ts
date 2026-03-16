import { NextResponse } from "next/server";
import exifr from "exifr";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isOpenAiConfigured, openAiApiKey } from "@/lib/supabase/env";

const analysisSchema = z.object({
  commonName: z.string().default(""),
  scientificName: z.string().default(""),
  category: z.string().default(""),
  note: z.string().default(""),
  tags: z.array(z.string()).default([]),
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
  confidence: z.number().nullable().default(null),
});

export async function POST(request: Request) {
  try {
    await requireOwner();

    if (!isOpenAiConfigured()) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "No image file received." }, { status: 400 });
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const dataUrl = `data:${image.type};base64,${bytes.toString("base64")}`;
    const exif = await exifr.parse(bytes, { gps: true }).catch(() => null);

    const client = new OpenAI({
      apiKey: openAiApiKey,
    });

    const response = await client.responses.parse({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this nature photo and return only JSON. Identify the likely subject, write a rich collectible-card description, and generate a strong field card for a long-term nature archive focused on foraging and discovery. Include useful tags, average lifespan when it is reasonably knowable, edible status, a safety-minded edible note, good uses, possible dish or tea ideas when relevant, fun facts, and simple care/location notes when relevant. If this is an animal, bird, fish, or insect, mark edible as not-edible unless you are highly certain the card should be for foraging. Never invent dangerous claims with high confidence. Use empty strings or empty arrays when unsure. JSON keys must be: commonName, scientificName, category, note, tags, lifespan, edible, edibleNote, uses, culinaryIdeas, goodFor, funFacts, care { water, light, season }, location { place, latitude, longitude }, confidence.",
            },
            {
              type: "input_image",
              image_url: dataUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(analysisSchema, "nature_log_analysis"),
      },
    });

    const analysis = response.output_parsed;

    if (!analysis) {
      return NextResponse.json(
        {
          error: "The AI response was not in the expected format.",
          details: response.output_text,
        },
        { status: 500 },
      );
    }

    if (typeof exif?.latitude === "number" && typeof exif?.longitude === "number") {
      analysis.location.latitude = exif.latitude;
      analysis.location.longitude = exif.longitude;
    }

    const admin = createSupabaseAdminClient();
    await admin.from("ai_runs").insert({
      model: "gpt-4.1-mini",
      source_filename: image.name,
      source_mime: image.type,
      confidence: analysis.confidence,
      result: analysis,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "AI analysis failed.",
      },
      { status: 500 },
    );
  }
}
