"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NatureEntry } from "@/lib/sample-data";

function getSuggestedDeckHref(entry: NatureEntry) {
  const tag = entry.tags[0] ?? entry.category ?? "nature-log";
  return `/tag/${encodeURIComponent(tag)}?focus=${encodeURIComponent(entry.id)}`;
}

type AdminEntriesListProps = {
  entries: NatureEntry[];
};

export function AdminEntriesList({ entries }: AdminEntriesListProps) {
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const sortedEntries = useMemo(() => {
    return [...entries].sort((left, right) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = left.commonName.localeCompare(right.commonName, undefined, {
          sensitivity: "base",
        });
      } else {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        comparison = leftTime - rightTime;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [entries, sortBy, sortDirection]);

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-white/70 bg-white/70 px-4 py-3 shadow-[0_12px_36px_rgba(88,73,37,0.06)] backdrop-blur">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bark/50">
          Sort
        </span>
        <button
          type="button"
          onClick={() => setSortBy("date")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-transform duration-200 hover:-translate-y-0.5 ${
            sortBy === "date"
              ? "bg-bark text-paper"
              : "border border-bark/10 bg-paper text-bark"
          }`}
        >
          Date uploaded
        </button>
        <button
          type="button"
          onClick={() => setSortBy("name")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-transform duration-200 hover:-translate-y-0.5 ${
            sortBy === "name"
              ? "bg-bark text-paper"
              : "border border-bark/10 bg-paper text-bark"
          }`}
        >
          Name
        </button>
        <button
          type="button"
          onClick={() =>
            setSortDirection((current) => (current === "desc" ? "asc" : "desc"))
          }
          className="rounded-full border border-bark/10 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5"
        >
          {sortDirection === "desc" ? "Down to up" : "Up to down"}
        </button>
      </div>

      {sortedEntries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-[26px] border border-white/70 bg-white/70 p-5 shadow-[0_16px_50px_rgba(88,73,37,0.08)] backdrop-blur"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-bark">{entry.commonName}</p>
              <p className="mt-1 text-sm italic text-ink/56">{entry.scientificName}</p>
              <p className="mt-3 text-sm leading-6 text-ink/68">{entry.location.place}</p>
              <p className="mt-2 text-sm text-ink/56">{entry.tags.slice(0, 6).join(", ")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/entries/${entry.id}`}
                className="rounded-full border border-bark/10 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark"
              >
                Edit
              </Link>
              <Link
                href={getSuggestedDeckHref(entry)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-bark/10 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
