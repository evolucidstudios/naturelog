"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { LAST_DECK_STORAGE_KEY, LAST_MAP_STORAGE_KEY } from "@/lib/navigation";
import { entries, getPrimaryTagForEntry } from "@/lib/sample-data";

export function FloatingMapButton() {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";
  const defaultDeckHref = `/tag/${getPrimaryTagForEntry(entries[0])}`;
  const defaultMapHref = "/map";
  const deckHref = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof window === "undefined") {
        return defaultDeckHref;
      }

      return window.localStorage.getItem(LAST_DECK_STORAGE_KEY) ?? defaultDeckHref;
    },
    () => defaultDeckHref,
  );
  const mapHref = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof window === "undefined") {
        return defaultMapHref;
      }

      return window.localStorage.getItem(LAST_MAP_STORAGE_KEY) ?? defaultMapHref;
    },
    () => defaultMapHref,
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="pointer-events-auto">
        <Link
          href={isMapPage ? deckHref : mapHref}
          className="inline-flex items-center gap-3 rounded-full border border-white/40 bg-[rgba(34,49,41,0.82)] px-5 py-3 text-sm font-semibold tracking-[0.18em] text-paper uppercase shadow-[0_18px_50px_rgba(32,40,33,0.24)] backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-bark">
            {isMapPage ? "N" : "M"}
          </span>
          {isMapPage ? "Nature Deck" : "Map"}
        </Link>
      </div>
    </div>
  );
}
