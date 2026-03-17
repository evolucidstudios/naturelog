import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { normalizeLocationPlace } from "@/lib/nature-utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST() {
  await requireOwner();

  const admin = createSupabaseAdminClient();
  const { data: entries, error } = await admin
    .from("entries")
    .select("id, location_place")
    .order("created_at", { ascending: false });

  if (error || !entries) {
    return NextResponse.json(
      { error: error?.message ?? "Could not load entries for location backfill." },
      { status: 500 },
    );
  }

  let updated = 0;

  for (const entry of entries) {
    const currentPlace = entry.location_place ?? "";
    const normalizedPlace = normalizeLocationPlace(currentPlace);

    if (!normalizedPlace || normalizedPlace === currentPlace) {
      continue;
    }

    const { error: updateError } = await admin
      .from("entries")
      .update({ location_place: normalizedPlace })
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
