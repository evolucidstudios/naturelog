"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminSessionControls() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await supabase.auth.signOut();
          router.push("/");
          router.refresh();
        });
      }}
      className="rounded-full border border-bark/10 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
