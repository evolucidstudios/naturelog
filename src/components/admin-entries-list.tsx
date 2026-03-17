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
      <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(181,226,250,0.34),rgba(159,135,175,0.18))] px-4 py-3 shadow-[0_12px_36px_rgba(82,81,116,0.08)] backdrop-blur">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bark/50">
          Sort
        </span>
        <button
          type="button"
          onClick={() => setSortBy("date")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-transform duration-200 hover:-translate-y-0.5 ${
            sortBy === "date"
              ? "bg-[linear-gradient(135deg,#0fa3b1,#525174)] text-paper"
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
              ? "bg-[linear-gradient(135deg,#0fa3b1,#525174)] text-paper"
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {sortedEntries.map((entry) => (
          <div
            key={entry.id}
            className="overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(249,247,243,0.76))] shadow-[0_18px_46px_rgba(82,81,116,0.1)] backdrop-blur"
          >
            <div className="aspect-square overflow-hidden bg-[linear-gradient(135deg,#b5e2fa,#9f87af)]">
              {entry.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.images[0]}
                  alt={entry.commonName}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="space-y-3 p-4">
              <p className="line-clamp-2 min-h-[3rem] text-base font-semibold text-bark">
                {entry.commonName}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/entries/${entry.id}`}
                  className="rounded-full border border-bark/10 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Edit
                </Link>
                <Link
                  href={getSuggestedDeckHref(entry)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-bark/10 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
