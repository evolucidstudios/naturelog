"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from "react-map-gl/mapbox";
import {
  entryMatchesRegion,
  getCollectionTags,
  getDeckHrefForEntryFromEntries,
  getTagCounts,
  titleCase,
  type MapRegion,
} from "@/lib/nature-utils";
import { type NatureEntry } from "@/lib/sample-data";
import { LAST_DECK_STORAGE_KEY, LAST_MAP_STORAGE_KEY } from "@/lib/navigation";

type MapExplorerProps = {
  entries: NatureEntry[];
  mapboxToken?: string;
  initialFocusId?: string;
  regions: MapRegion[];
};

type MapSearchOption = {
  label: string;
  value: string;
  type: "tag" | "category" | "region";
};

function pickRandomTags(tags: string[], count: number) {
  const shuffled = [...tags];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
}

function tagsMatch(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((tag, index) => tag === right[index]);
}

function getShuffledSelection(tags: string[], previous: string[] = [], count = 14) {
  const nextCount = Math.min(tags.length, count);

  if (nextCount <= 1) {
    return pickRandomTags(tags, nextCount);
  }

  let next = pickRandomTags(tags, nextCount);
  let attempts = 0;

  while (attempts < 6 && tagsMatch(previous, next)) {
    next = pickRandomTags(tags, nextCount);
    attempts += 1;
  }

  return next;
}

function pickRandomItem<T>(items: T[]) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function boundsForEntries(entries: NatureEntry[]) {
  if (entries.length === 0) {
    return null;
  }

  let minLat = entries[0].location.latitude;
  let maxLat = entries[0].location.latitude;
  let minLng = entries[0].location.longitude;
  let maxLng = entries[0].location.longitude;

  for (const entry of entries) {
    minLat = Math.min(minLat, entry.location.latitude);
    maxLat = Math.max(maxLat, entry.location.latitude);
    minLng = Math.min(minLng, entry.location.longitude);
    maxLng = Math.max(maxLng, entry.location.longitude);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ] as [[number, number], [number, number]];
}

export function MapExplorer({
  entries,
  mapboxToken,
  initialFocusId,
  regions,
}: MapExplorerProps) {
  const initialFocusedEntry =
    entries.find((entry) => entry.id === initialFocusId) ?? entries[0] ?? null;
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    initialFocusedEntry?.id ?? null,
  );
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [randomTagNonce, setRandomTagNonce] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<MapRef | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const tagCounts = useMemo(() => getTagCounts(entries), [entries]);

  const tagPool = useMemo(
    () => getCollectionTags(entries),
    [entries],
  );
  const featuredTags = useMemo(() => tagPool.slice(0, 6), [tagPool]);
  const [randomMapTags, setRandomMapTags] = useState<string[]>(() =>
    tagPool.slice(0, Math.min(tagPool.length, 14)),
  );
  const activeFilterLabel = useMemo(() => {
    if (activeFilter === "all") {
      return "all finds";
    }

    if (activeFilter.startsWith("region:")) {
      const regionSlug = activeFilter.replace("region:", "");
      return regions.find((region) => region.slug === regionSlug)?.name ?? regionSlug;
    }

    if (activeFilter.startsWith("tag:")) {
      return activeFilter.replace("tag:", "");
    }

    return "all finds";
  }, [activeFilter, regions]);

  const visibleEntries = useMemo(() => {
    if (activeFilter === "all") {
      return entries;
    }

    if (activeFilter.startsWith("region:")) {
      const regionSlug = activeFilter.replace("region:", "");
      const region = regions.find((item) => item.slug === regionSlug);

      if (!region) {
        return entries;
      }

      return entries.filter((entry) => entryMatchesRegion(entry, region));
    }

    if (activeFilter.startsWith("tag:")) {
      const tag = activeFilter.replace("tag:", "");
      return entries.filter((entry) => entry.tags.includes(tag));
    }

    return entries;
  }, [activeFilter, entries, regions]);

  const selectedEntry = useMemo(() => {
    if (selectedEntryId === null) {
      return null;
    }

    return (
      visibleEntries.find((entry) => entry.id === selectedEntryId) ??
      visibleEntries[0] ??
      entries[0] ??
      null
    );
  }, [entries, selectedEntryId, visibleEntries]);
  const searchOptions = useMemo(() => {
    const categoryRouteMap = new globalThis.Map<string, string>();

    for (const entry of entries) {
      if (!entry.category || categoryRouteMap.has(entry.category)) {
        continue;
      }

      const categoryTags = Array.from(
        new Set(
          entries
            .filter((item) => item.category === entry.category)
            .flatMap((item) => item.tags),
        ),
      );
      const plural = `${entry.category}s`;
      const routeTag =
        categoryTags.find((tag) => tag === plural) ??
        categoryTags.find((tag) => tag === entry.category) ??
        categoryTags.find((tag) => tag.includes(entry.category ?? "")) ??
        categoryTags[0];

      if (routeTag) {
        categoryRouteMap.set(entry.category, routeTag);
      }
    }

    const regionOptions: MapSearchOption[] = regions.map((region) => ({
      label: region.name,
      value: region.slug,
      type: "region",
    }));
    const categoryOptions: MapSearchOption[] = Array.from(categoryRouteMap.entries()).map(
      ([category, routeTag]) => ({
        label: titleCase(category),
        value: routeTag,
        type: "category",
      }),
    );
    const tagOptions: MapSearchOption[] = tagPool.map((tag) => ({
      label: titleCase(tag),
      value: tag,
      type: "tag",
    }));

    return [...regionOptions, ...categoryOptions, ...tagOptions];
  }, [entries, regions, tagPool]);
  const filteredSearchOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      const regionsList = searchOptions.filter((option) => option.type === "region").slice(0, 3);
      const categories = searchOptions
        .filter((option) => option.type === "category")
        .slice(0, 4);
      const tags = searchOptions.filter((option) => option.type === "tag").slice(0, 8);
      return [...regionsList, ...categories, ...tags];
    }

    return searchOptions
      .filter((option) => option.label.toLowerCase().includes(normalizedQuery))
      .slice(0, 10);
  }, [searchOptions, searchQuery]);

  const fitEntries = (items: NatureEntry[], fallbackZoom = 11.8) => {
    if (!mapRef.current || items.length === 0) {
      return;
    }

    if (items.length === 1) {
      mapRef.current.flyTo({
        center: [items[0].location.longitude, items[0].location.latitude],
        zoom: fallbackZoom,
        duration: 1200,
        essential: true,
      });
      setSelectedEntryId(items[0].id);
      return;
    }

    const bounds = boundsForEntries(items);

    if (!bounds) {
      return;
    }

    mapRef.current.fitBounds(bounds, {
      padding: 80,
      duration: 1200,
      essential: true,
    });
  };

  const focusRegion = (regionSlug: string) => {
    const region = regions.find((item) => item.slug === regionSlug);
    const matching = region ? entries.filter((entry) => entryMatchesRegion(entry, region)) : [];
    setActiveFilter(`region:${regionSlug}`);
    setSelectedEntryId(matching[0]?.id ?? null);
    fitEntries(matching, 12.2);
  };

  const focusTag = (tag: string) => {
    const matching = entries.filter((entry) => entry.tags.includes(tag));
    setActiveFilter(`tag:${tag}`);
    setSelectedEntryId(matching[0]?.id ?? null);
    fitEntries(matching, 12.2);
  };

  const showAll = () => {
    setActiveFilter("all");
    setSelectedEntryId(null);
    fitEntries(entries, 10.8);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (selectedEntry) {
      window.localStorage.setItem(
        LAST_MAP_STORAGE_KEY,
        `/map?focus=${encodeURIComponent(selectedEntry.id)}`,
      );
      window.localStorage.setItem(
        LAST_DECK_STORAGE_KEY,
        getDeckHrefForEntryFromEntries(selectedEntry, entries),
      );
      return;
    }

    window.localStorage.setItem(LAST_MAP_STORAGE_KEY, "/map");
  }, [entries, selectedEntry]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchPanelRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen]);

  const focusRandomMapSlice = () => {
    const options = [
      ...regions.map((region) => ({ type: "region" as const, value: region.slug })),
      ...tagPool.map((tag) => ({ type: "tag" as const, value: tag })),
    ];
    const currentValue =
      activeFilter === "all" ? "all" : activeFilter.replace("region:", "").replace("tag:", "");
    const filteredOptions =
      options.length > 1
        ? options.filter((option) => option.value !== currentValue)
        : options;
    const next = pickRandomItem(filteredOptions);

    if (!next) {
      return;
    }

    if (next.type === "region") {
      focusRegion(next.value);
      return;
    }

    focusTag(next.value);
  };

  const jumpToSearchOption = (option: MapSearchOption) => {
    setSearchOpen(false);
    setSearchQuery("");

    if (option.type === "region") {
      focusRegion(option.value);
      return;
    }

    focusTag(option.value);
  };

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-[34px] border border-bark/10 bg-[linear-gradient(140deg,#d7e6c6,#b8cfb7_46%,#adc9c8_100%)] p-8 text-center">
        <div className="max-w-md rounded-[28px] border border-white/70 bg-white/72 p-6 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Mapbox token needed
          </p>
          <p className="mt-3 text-base leading-7 text-ink/72">
            Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to `.env.local`, restart the
            dev server, and this page will render the real interactive map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/72 px-4 py-3 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:px-5">
        <button
          type="button"
          onClick={focusRandomMapSlice}
          aria-label="Randomize map focus"
          className="group inline-flex h-[4.9rem] w-[4.9rem] shrink-0 items-center justify-center rounded-full border border-bark/12 bg-white/78 text-bark shadow-[0_12px_30px_rgba(57,51,38,0.1)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-95 sm:h-[4.4rem] sm:w-[4.4rem]"
        >
          <svg
            viewBox="0 0 48 48"
            className="h-7 w-7 transition-transform duration-500 group-hover:rotate-180 sm:h-6 sm:w-6"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M40 11v10H30" />
            <path d="M8 37V27h10" />
            <path d="M38.6 21a16 16 0 0 0-27-6L8 19" />
            <path d="M9.4 27a16 16 0 0 0 27 6L40 29" />
          </svg>
        </button>
        <div className="min-w-0 flex-1 rounded-full border border-bark/10 bg-paper px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-bark">
          {activeFilterLabel}
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen((current) => !current)}
          aria-label="Search map tags and categories"
          className="group inline-flex h-[4.9rem] w-[4.9rem] shrink-0 items-center justify-center rounded-full border border-bark/12 bg-white/78 text-bark shadow-[0_12px_30px_rgba(57,51,38,0.1)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-95 sm:h-[4.4rem] sm:w-[4.4rem]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 sm:h-6 sm:w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        </button>
      </div>
      {searchOpen ? (
        <div
          ref={searchPanelRef}
          className="rounded-[28px] border border-white/72 bg-white/86 p-4 shadow-[0_18px_50px_rgba(57,51,38,0.1)] backdrop-blur"
        >
          <div className="flex items-center gap-3 rounded-[20px] border border-bark/10 bg-paper/82 px-4 py-3">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-bark/52"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tags, categories, or regions"
              className="w-full bg-transparent text-base text-bark outline-none placeholder:text-bark/42 sm:text-sm"
            />
          </div>
          <div className="mt-3 grid gap-2">
            {filteredSearchOptions.map((option) => (
              <button
                key={`${option.type}-${option.value}-${option.label}`}
                type="button"
                onClick={() => jumpToSearchOption(option)}
                className="flex items-center justify-between rounded-[18px] border border-bark/8 bg-paper/78 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
              >
                <span className="text-sm font-medium text-bark">{option.label}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-bark/46">
                  {option.type}
                </span>
              </button>
            ))}
            {filteredSearchOptions.length === 0 ? (
              <div className="rounded-[18px] border border-bark/8 bg-paper/68 px-4 py-3 text-sm text-bark/60">
                No matching tags, categories, or regions yet.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-[34px] border border-bark/10 bg-[linear-gradient(145deg,#e0ecd6,#bfd4c3)] shadow-[0_18px_60px_rgba(88,73,37,0.08)]">
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: initialFocusedEntry?.location.longitude ?? -118.306,
            latitude: initialFocusedEntry?.location.latitude ?? 34.115,
            zoom: initialFocusedEntry ? 13.4 : 11.8,
          }}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          style={{ width: "100%", minHeight: "560px" }}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {visibleEntries.map((entry) => (
            <Marker
              key={entry.id}
              longitude={entry.location.longitude}
              latitude={entry.location.latitude}
              anchor="bottom"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                setSelectedEntryId(entry.id);
              }}
            >
              <button
                type="button"
                aria-label={`Open ${entry.commonName}`}
                className={`group relative flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-[0_10px_20px_rgba(57,51,38,0.18)] transition-transform duration-200 hover:scale-110 ${
                  selectedEntryId === entry.id ? "bg-bark scale-110" : "bg-moss"
                }`}
              >
                <span
                  className={`absolute inset-[-10px] rounded-full border ${
                    selectedEntryId === entry.id
                      ? "border-bark/30 animate-[ping_1.8s_ease-out_infinite]"
                      : "border-moss/20"
                  }`}
                />
                <span className="absolute h-2.5 w-2.5 rounded-full bg-paper" />
                <span className="sr-only">{entry.commonName}</span>
              </button>
            </Marker>
          ))}

          {selectedEntry ? (
            <Popup
              longitude={selectedEntry.location.longitude}
              latitude={selectedEntry.location.latitude}
              anchor="top"
              closeButton={false}
              offset={18}
              onClose={() => setSelectedEntryId(null)}
              className="naturelog-popup"
            >
              <div className="min-w-[186px] space-y-2 p-0.5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-moss">
                    {selectedEntry.location.place}
                  </p>
                  <p className="mt-1 text-lg font-semibold leading-tight text-bark">
                    {selectedEntry.commonName}
                  </p>
                </div>
                <div className="relative h-24 overflow-hidden rounded-[16px] border border-bark/10 bg-sand/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedEntry.images[0]}
                    alt={selectedEntry.commonName}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.12))]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fitEntries([selectedEntry], 13.6)}
                    className="rounded-[14px] border border-bark/10 bg-sand/40 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    CENTER
                  </button>
                  <Link
                    href={getDeckHrefForEntryFromEntries(selectedEntry, entries)}
                    className="rounded-[14px] border border-bark/10 bg-bark px-3 py-1.5 text-center text-xs font-semibold tracking-[0.16em] text-paper transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    OPEN
                  </Link>
                </div>
              </div>
            </Popup>
          ) : null}
        </Map>
      </div>

      <div>
        <div className="rounded-[28px] border border-white/70 bg-white/74 p-4 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-moss">
                Map focus
              </p>
              <p className="mt-1 text-lg font-semibold text-bark">
                Zoom by region or tag
              </p>
            </div>
            <button
              type="button"
              onClick={showAll}
              className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-transform duration-200 hover:-translate-y-0.5 ${
                activeFilter === "all"
                  ? "border border-bark bg-bark text-paper shadow-[0_10px_24px_rgba(57,51,38,0.18)]"
                  : "border border-bark/10 bg-paper text-bark"
              }`}
            >
              {activeFilter === "all" ? "Showing all" : "Show all"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {regions.map((region) => (
              <button
                key={region.slug}
                type="button"
                onClick={() => focusRegion(region.slug)}
                className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-transform duration-200 hover:-translate-y-0.5 ${
                  activeFilter === `region:${region.slug}`
                    ? "bg-bark text-paper"
                    : "border border-bark/10 bg-paper text-bark"
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {featuredTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => focusTag(tag)}
                className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-transform duration-200 hover:-translate-y-0.5 ${
                  activeFilter === `tag:${tag}`
                    ? "bg-moss text-paper"
                    : "border border-bark/10 bg-paper/90 text-bark"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-bark/8 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-moss">
                  Random map tags
                </p>
                <p className="mt-1 text-sm text-ink/66">
                  Jump to a different slice of the collection
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRandomMapTags((current) => getShuffledSelection(tagPool, current, 14));
                  setRandomTagNonce((current) => current + 1);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bark/10 bg-paper text-bark transition-transform duration-200 hover:-translate-y-0.5"
                aria-label="Randomize map tags"
              >
                <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M38 17V9h-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11 24a13 13 0 0 1 22-9l5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 31v8h8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M37 24a13 13 0 0 1-22 9l-5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3">
              {randomMapTags.map((tag, index) => (
                <button
                  key={`${tag}-${randomTagNonce}`}
                  type="button"
                  onClick={() => focusTag(tag)}
                  className={`font-semibold uppercase text-[#2f5d62] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#22494d] ${
                    (tagCounts[tag] ?? 0) >= 3
                      ? "text-xl tracking-[0.08em]"
                      : (tagCounts[tag] ?? 0) === 2
                        ? "text-sm tracking-[0.14em]"
                        : "text-xs tracking-[0.18em]"
                  }`}
                  style={{
                    transform: `translateY(${index % 4 === 0 ? "-2px" : index % 4 === 1 ? "5px" : index % 4 === 2 ? "0px" : "8px"}) rotate(${index % 5 === 0 ? "-3deg" : index % 5 === 1 ? "2deg" : index % 5 === 2 ? "-1deg" : index % 5 === 3 ? "1deg" : "0deg"})`,
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
