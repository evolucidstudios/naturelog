import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  await requireOwner();
  const { id } = await context.params;
  const admin = createSupabaseAdminClient();

  const { data: images } = await admin
    .from("entry_images")
    .select("path")
    .eq("entry_id", id);

  if (images && images.length > 0) {
    await admin.storage.from("nature-images").remove(images.map((image) => image.path));
  }

  const { error } = await admin.from("entries").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
