import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { isOpenAiConfigured, openAiApiKey } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const pronunciationSchema = z.object({
  pronunciation: z.string().default(""),
});

export async function POST() {
  await requireOwner();

  if (!isOpenAiConfigured()) {
    return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();
  const { data: entries, error } = await admin
    .from("entries")
    .select("id, common_name, scientific_name, pronunciation")
    .order("created_at", { ascending: false });

  if (error || !entries) {
    return NextResponse.json(
      { error: error?.message ?? "Could not load entries for pronunciation backfill." },
      { status: 500 },
    );
  }

  const client = new OpenAI({
    apiKey: openAiApiKey,
  });

  let updated = 0;

  for (const entry of entries) {
    if (!entry.common_name?.trim()) {
      continue;
    }

    const response = await client.responses.parse({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Return only JSON. Create a short plain-English pronunciation guide for this nature card's common name. Prefer simple syllable-style pronunciation a normal person can read aloud. Common name: ${entry.common_name}. Scientific name: ${entry.scientific_name ?? ""}. JSON key must be: pronunciation.`,
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(pronunciationSchema, "nature_log_pronunciation"),
      },
    });

    const pronunciation = response.output_parsed?.pronunciation?.trim() ?? "";

    if (!pronunciation) {
      continue;
    }

    const { error: updateError } = await admin
      .from("entries")
      .update({ pronunciation })
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
