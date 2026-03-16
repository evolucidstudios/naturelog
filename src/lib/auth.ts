import { redirect } from "next/navigation";
import { ownerEmail } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function isOwnerEmail(email?: string | null) {
  return Boolean(email && ownerEmail && email.toLowerCase() === ownerEmail.toLowerCase());
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

export async function requireOwner() {
  const user = await getCurrentUser();

  if (!isOwnerEmail(user?.email)) {
    redirect("/login");
  }

  return user!;
}
