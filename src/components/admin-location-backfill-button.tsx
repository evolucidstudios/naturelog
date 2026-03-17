"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AdminLocationBackfillButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const response = await fetch("/api/admin/locations/backfill", {
              method: "POST",
            });
            const payload = (await response.json()) as {
              success?: boolean;
              updated?: number;
              total?: number;
              error?: string;
            };

            if (!response.ok || !payload.success) {
              setMessage(payload.error ?? "Location cleanup failed.");
              return;
            }

            setMessage(`Standardized ${payload.updated ?? 0} locations.`);
            router.refresh();
          });
        }}
        className="rounded-full border border-bark/10 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Cleaning locations..." : "Backfill locations"}
      </button>
      {message ? (
        <p className="text-xs leading-5 text-bark/64">{message}</p>
      ) : null}
    </div>
  );
}
