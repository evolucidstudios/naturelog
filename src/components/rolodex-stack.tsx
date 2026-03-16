"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LAST_DECK_STORAGE_KEY } from "@/lib/navigation";
import { LAST_MAP_STORAGE_KEY } from "@/lib/navigation";
import {
  getCollectionTags,
  getDiscoveryTagsForEntry,
  getTagCounts,
  titleCase,
} from "@/lib/nature-utils";
import { TagChipLink } from "@/components/tag-chip-link";
import mapWorld from "@/lib/mapworld.png";
import { type NatureEntry } from "@/lib/sample-data";

type RolodexStackProps = {
  entries: NatureEntry[];
  title: string;
  subtitle: string;
  accentTag?: string;
  focusEntryId?: string;
  collectionEntries?: NatureEntry[];
};

type MotionPhase = "idle" | "leaving" | "entering";
type SearchOption = {
  label: string;
  routeTag: string;
  type: "tag" | "category";
};

function wrapIndex(index: number, length: number) {
  if (length === 0) {
    return 0;
  }

  return (index + length) % length;
}

function imageSkin(index: number) {
  const skins = [
    "from-[#6f9473] via-[#4d6f69] to-[#2f3c3c]",
    "from-[#d59f4d] via-[#a35d3d] to-[#553127]",
    "from-[#748f5d] via-[#4e6a4a] to-[#2d4335]",
    "from-[#4f7f8f] via-[#355463] to-[#223640]",
  ];

  return skins[index % skins.length];
}

const DiscoverMoreCloudNoSSR = dynamic(
  () =>
    import("@/components/discover-more-cloud").then(
      (module) => module.DiscoverMoreCloud,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[30px] border border-white/70 bg-gradient-to-br from-white/80 to-white/40 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6 lg:col-span-2">
        <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70">
            Discover More
          </p>
        </div>
        <div className="mt-8 h-24 rounded-[22px] bg-white/40" />
      </div>
    ),
  },
);

export function RolodexStack({
  entries,
  accentTag,
  focusEntryId,
  collectionEntries,
}: RolodexStackProps) {
  const router = useRouter();
  const allCollectionEntries =
    collectionEntries && collectionEntries.length > 0 ? collectionEntries : entries;
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [phase, setPhase] = useState<MotionPhase>("idle");
  const [dragOffset, setDragOffset] = useState(0);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [galleryEntryId, setGalleryEntryId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pointerDragging = useRef(false);
  const pinchZooming = useRef(false);
  const queuedDirection = useRef<1 | -1 | null>(null);
  const galleryTouchStartX = useRef<number | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  function triggerShift(nextDirection: 1 | -1) {
    if (entries.length <= 1) {
      return;
    }

    if (phase !== "idle") {
      queuedDirection.current = nextDirection;
      return;
    }

    setDirection(nextDirection);
    setPhase("leaving");
  }

  const visibleEntries = useMemo(() => {
    return Array.from({ length: Math.min(entries.length, 5) }, (_, offset) => {
      const index = wrapIndex(activeIndex + offset, entries.length);
      return { entry: entries[index], offset };
    });
  }, [activeIndex, entries]);

  const activeEntry = visibleEntries[0]?.entry;
  const galleryEntry = galleryEntryId
    ? entries.find((entry) => entry.id === galleryEntryId) ?? null
    : null;
  const galleryImageIndex = galleryEntry
    ? imageIndexes[galleryEntry.id] ?? 0
    : 0;

  useEffect(() => {
    if (phase === "idle" || entries.length <= 1) {
      return undefined;
    }

    if (phase === "leaving") {
      const leaveTimer = window.setTimeout(() => {
        setActiveIndex((current) => wrapIndex(current + direction, entries.length));
        setPhase("entering");
      }, 220);

      return () => window.clearTimeout(leaveTimer);
    }

    const enterTimer = window.setTimeout(() => {
      setPhase("idle");

      if (queuedDirection.current) {
        const nextDirection = queuedDirection.current;
        queuedDirection.current = null;
        window.setTimeout(() => {
          setDirection(nextDirection);
          setPhase("leaving");
        }, 20);
      }
    }, 320);

    return () => window.clearTimeout(enterTimer);
  }, [direction, entries.length, phase]);

  useEffect(() => {
    if (typeof window === "undefined" || !activeEntry) {
      return;
    }

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("focus", activeEntry.id);
    window.localStorage.setItem(LAST_DECK_STORAGE_KEY, `${currentUrl.pathname}${currentUrl.search}`);
    window.localStorage.setItem(LAST_MAP_STORAGE_KEY, `/map?focus=${encodeURIComponent(activeEntry.id)}`);
  }, [activeEntry, accentTag, focusEntryId]);

  useEffect(() => {
    if (typeof window === "undefined" || !galleryEntry) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [galleryEntry]);

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

  useEffect(() => {
    if (typeof window === "undefined" || !galleryEntry) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGalleryEntryId(null);
      }

      if (event.key === "ArrowLeft") {
        setImageIndexes((current) => ({
          ...current,
          [galleryEntry.id]: wrapIndex(
            (current[galleryEntry.id] ?? 0) - 1,
            galleryEntry.images.length,
          ),
        }));
      }

      if (event.key === "ArrowRight") {
        setImageIndexes((current) => ({
          ...current,
          [galleryEntry.id]: wrapIndex(
            (current[galleryEntry.id] ?? 0) + 1,
            galleryEntry.images.length,
          ),
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryEntry]);

  const collectionTagCounts = useMemo(
    () => getTagCounts(allCollectionEntries),
    [allCollectionEntries],
  );
  const activeTagWeights = useMemo(
    () =>
      Object.fromEntries(
        activeEntry
          ? activeEntry.tags.map((tag) => [tag, collectionTagCounts[tag] ?? 1])
          : [],
      ) as Record<string, number>,
    [activeEntry, collectionTagCounts],
  );
  const allCollectionTags = useMemo(
    () => getCollectionTags(allCollectionEntries),
    [allCollectionEntries],
  );
  const searchOptions = useMemo(() => {
    const categoryRouteMap = new Map<string, string>();

    for (const entry of allCollectionEntries) {
      if (!entry.category || categoryRouteMap.has(entry.category)) {
        continue;
      }

      const categoryTags = Array.from(
        new Set(
          allCollectionEntries
            .filter((item) => item.category === entry.category)
            .flatMap((item) => item.tags),
        ),
      );
      const plural = `${entry.category}s`;
      const routeTag =
        categoryTags.find((tag) => tag === plural) ??
        categoryTags.find((tag) => tag === entry.category) ??
        categoryTags.find((tag) => tag.includes(entry.category ?? "")) ??
        categoryTags.find((tag) => ["animals", "flowers", "trees", "birds", "insects", "shrubs"].includes(tag)) ??
        categoryTags[0];

      if (routeTag) {
        categoryRouteMap.set(entry.category, routeTag);
      }
    }

    const tagOptions: SearchOption[] = allCollectionTags.map((tag) => ({
      label: titleCase(tag),
      routeTag: tag,
      type: "tag",
    }));
    const categoryOptions: SearchOption[] = Array.from(categoryRouteMap.entries()).map(
      ([category, routeTag]) => ({
        label: titleCase(category),
        routeTag,
        type: "category",
      }),
    );

    return [...categoryOptions, ...tagOptions];
  }, [allCollectionEntries, allCollectionTags]);
  const filteredSearchOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      const categories = searchOptions.filter((option) => option.type === "category").slice(0, 4);
      const tags = searchOptions.filter((option) => option.type === "tag").slice(0, 8);
      return [...categories, ...tags];
    }

    return searchOptions
      .filter((option) => option.label.toLowerCase().includes(normalizedQuery))
      .slice(0, 10);
  }, [searchOptions, searchQuery]);
  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (phase !== "idle") {
      return;
    }

    pointerDragging.current = true;
    touchStartX.current = event.clientX;
    touchStartY.current = event.clientY;
    setDragOffset(0);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (
      !pointerDragging.current ||
      touchStartX.current === null ||
      touchStartY.current === null ||
      phase !== "idle"
    ) {
      return;
    }

    const deltaX = event.clientX - touchStartX.current;
    const deltaY = event.clientY - touchStartY.current;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    const delta = deltaX;
    setDragOffset(Math.max(Math.min(delta, 120), -120));
  };

  const finishDrag = (clientX: number) => {
    if (touchStartX.current === null) {
      return;
    }

    const delta = clientX - touchStartX.current;
    touchStartX.current = null;
    touchStartY.current = null;
    pointerDragging.current = false;
    setDragOffset(0);

    if (Math.abs(delta) < 60) {
      return;
    }

    triggerShift(delta < 0 ? 1 : -1);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (event.touches.length > 1) {
      pinchZooming.current = true;
      touchStartX.current = null;
      touchStartY.current = null;
      pointerDragging.current = false;
      setDragOffset(0);
      return;
    }

    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (pinchZooming.current) {
      if (event.touches.length <= 1) {
        window.setTimeout(() => {
          pinchZooming.current = false;
        }, 180);
      }
      return;
    }

    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
    const delta = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    pointerDragging.current = false;
    setDragOffset(0);

    if (Math.abs(deltaY) > Math.abs(delta) || Math.abs(delta) < 40) {
      return;
    }

    triggerShift(delta < 0 ? 1 : -1);
  };

  const getCardTransform = (offset: number) => {
    const baseRotation = offset === 0 ? 0 : offset % 2 === 0 ? 4 : -4;
    const baseTranslateY = offset * 16;
    const baseScale = 1 - offset * 0.045;
    const baseOpacity = Math.max(1 - offset * 0.16, 0);
    const liveTilt = offset === 0 ? dragOffset / 18 : 0;
    const liveShift = offset === 0 ? dragOffset : 0;

    if (offset === 0 && phase === "leaving") {
      return {
        transform: `translateX(${direction === 1 ? -104 : 104}px) translateY(-10px) rotate(${direction === 1 ? -12 : 12}deg) scale(0.97)`,
        opacity: 0,
      };
    }

    if (offset === 0 && phase === "entering") {
      return {
        transform: "translateX(0px) translateY(0px) rotate(0deg) scale(1)",
        opacity: 1,
      };
    }

    if (offset === 1 && phase === "entering") {
      return {
        transform: `translateX(${direction === 1 ? 22 : -22}px) translateY(${baseTranslateY + 8}px) rotate(${baseRotation + (direction === 1 ? 3 : -3)}deg) scale(${baseScale - 0.02})`,
        opacity: baseOpacity,
      };
    }

    return {
      transform: `translateX(${liveShift}px) translateY(${baseTranslateY}px) rotate(${baseRotation + liveTilt}deg) scale(${baseScale})`,
      opacity: baseOpacity,
    };
  };

  if (entries.length === 0 || !activeEntry) {
    return null;
  }

  const activeImageIndex = imageIndexes[activeEntry.id] ?? 0;
  const cycleImage = () => {
    if (phase !== "idle" || pointerDragging.current || pinchZooming.current) {
      return;
    }

    setImageIndexes((current) => ({
      ...current,
      [activeEntry.id]: wrapIndex((current[activeEntry.id] ?? 0) + 1, activeEntry.images.length),
    }));
  };

  const cycleGalleryImage = (nextDirection: 1 | -1) => {
    if (!galleryEntry) {
      return;
    }

    setImageIndexes((current) => ({
      ...current,
      [galleryEntry.id]: wrapIndex(
        (current[galleryEntry.id] ?? 0) + nextDirection,
        galleryEntry.images.length,
      ),
    }));
  };

  const openGalleryAt = (index: number) => {
    if (!activeEntry) {
      return;
    }

    setImageIndexes((current) => ({
      ...current,
      [activeEntry.id]: wrapIndex(index, activeEntry.images.length),
    }));
    setGalleryEntryId(activeEntry.id);
  };

  const jumpToRandomTag = () => {
    if (!accentTag) {
      return;
    }

    const candidateTags = allCollectionTags.filter((tag) => tag !== accentTag);

    if (candidateTags.length === 0) {
      return;
    }

    const nextTag =
      candidateTags[Math.floor(Math.random() * candidateTags.length)] ?? accentTag;

    router.push(`/tag/${encodeURIComponent(nextTag)}`);
  };

  const jumpToSearchOption = (option: SearchOption) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/tag/${encodeURIComponent(option.routeTag)}`);
  };

  return (
    <section className="space-y-8">
      <div className="relative z-0 mx-auto flex max-w-3xl flex-col items-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {accentTag ? (
            <>
              <button
                type="button"
                onClick={jumpToRandomTag}
                aria-label={`Jump to a random tag deck from ${accentTag}`}
                className="group inline-flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full border border-bark/12 bg-white/78 text-bark shadow-[0_12px_30px_rgba(57,51,38,0.1)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-95 sm:h-[3.4rem] sm:w-[3.4rem]"
              >
                <svg
                  viewBox="0 0 48 48"
                  className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180 sm:h-5 sm:w-5"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M40 11v10H30" />
                  <path d="M8 37V27h10" />
                  <path
                    d="M38.6 21a16 16 0 0 0-27-6L8 19"
                  />
                  <path d="M9.4 27a16 16 0 0 0 27 6L40 29" />
                </svg>
              </button>
              <TagChipLink
                tag={accentTag}
                className="min-h-[3.75rem] px-5 text-sm sm:min-h-[3.4rem] sm:px-4"
              />
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                aria-label="Search tags and categories"
                className="group inline-flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full border border-bark/12 bg-white/78 text-bark shadow-[0_12px_30px_rgba(57,51,38,0.1)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-95 sm:h-[3.4rem] sm:w-[3.4rem]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 sm:h-5 sm:w-5"
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
            </>
          ) : null}
        </div>
        {searchOpen ? (
          <div
            ref={searchPanelRef}
            className="mb-4 w-full max-w-[29rem] rounded-[28px] border border-white/72 bg-white/86 p-4 shadow-[0_18px_50px_rgba(57,51,38,0.1)] backdrop-blur"
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
                placeholder="Search tags or categories"
                className="w-full bg-transparent text-base text-bark outline-none placeholder:text-bark/42 sm:text-sm"
              />
            </div>
            <div className="mt-3 grid gap-2">
              {filteredSearchOptions.map((option) => (
                <button
                  key={`${option.type}-${option.routeTag}-${option.label}`}
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
                  No matching tags or categories yet.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="relative mx-auto flex min-h-[34rem] w-full max-w-[26rem] items-center justify-center perspective-[1800px] sm:min-h-[38rem]">
          <div className="pointer-events-none absolute inset-x-8 bottom-5 h-20 rounded-full bg-[radial-gradient(circle,rgba(40,48,39,0.22),transparent_72%)] blur-2xl" />

          {visibleEntries
            .slice()
            .reverse()
            .map(({ entry, offset }) => {
              const motion = getCardTransform(offset);
              const imageIndex = imageIndexes[entry.id] ?? 0;
              const imageName = entry.images[imageIndex] ?? entry.images[0];

              return (
                <article
                  key={`${entry.id}-${offset}`}
                  className={`absolute inset-x-0 mx-auto w-full max-w-[25rem] overflow-hidden rounded-[34px] border border-white/75 bg-neutral-900 p-4 text-paper shadow-[0_28px_80px_rgba(52,60,48,0.24)] ${
                    offset === 0 ? "z-30" : offset === 1 ? "z-20 pointer-events-none" : "z-10 pointer-events-none"
                  }`}
                  style={{
                    transform: motion.transform,
                    opacity: motion.opacity,
                    transition:
                      phase === "idle"
                        ? "transform 580ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease"
                        : "transform 320ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 220ms ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={offset === 0 ? cycleImage : undefined}
                    onPointerDown={offset === 0 ? handlePointerDown : undefined}
                    onPointerMove={offset === 0 ? handlePointerMove : undefined}
                    onPointerUp={offset === 0 ? (event) => finishDrag(event.clientX) : undefined}
                    onPointerLeave={offset === 0 ? (event) => finishDrag(event.clientX) : undefined}
                    onTouchStart={offset === 0 ? handleTouchStart : undefined}
                    onTouchEnd={offset === 0 ? handleTouchEnd : undefined}
                    className={`relative block w-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${imageSkin(imageIndex)} p-5 text-left sm:p-6`}
                    style={{
                      touchAction: "pan-y pinch-zoom",
                    }}
                    aria-label={`${entry.commonName} card`}
                  >
                    {imageName?.startsWith("http") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageName}
                        alt={entry.commonName}
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.2))]" />
                    <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.58))]" />
                    <div className="relative flex min-h-[30rem] flex-col justify-between sm:min-h-[34rem]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="max-w-[12rem]">
                          <p className="card-title-glow mt-3 text-4xl leading-none font-semibold sm:text-5xl">
                            {entry.commonName}
                          </p>
                          <p className="card-subtitle-glow mt-3 text-sm italic text-paper/84 sm:text-base">
                            {entry.scientificName}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="rounded-full border border-white/12 bg-[rgba(18,22,19,0.3)] px-3 py-1.5 text-right backdrop-blur-sm">
                          <p className="text-xs font-semibold tracking-[0.16em] text-paper/88">
                            {String(imageIndex + 1).padStart(2, "0")} /{" "}
                            {String(entry.images.length).padStart(2, "0")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
        </div>
      </div>

      {galleryEntry && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[2147483647] flex flex-col items-center justify-center">
              <div
                className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity duration-300"
                onClick={() => setGalleryEntryId(null)}
                aria-hidden="true"
              />

              <div className="relative z-20 flex h-full w-full flex-col">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">
                      Image gallery
                    </p>
                    <p className="mt-1 truncate text-xl font-semibold text-white">
                      {galleryEntry.commonName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGalleryEntryId(null)}
                    className="group flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold tracking-[0.18em] text-white transition-all duration-200 hover:bg-white hover:text-black"
                  >
                    <span>CLOSE</span>
                    <span className="text-lg leading-none">x</span>
                  </button>
                </div>

                <div
                  className="relative flex flex-1 items-center justify-center p-4 sm:p-10"
                  onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      setGalleryEntryId(null);
                    }
                  }}
                  onTouchStart={(event) => {
                    galleryTouchStartX.current = event.touches[0]?.clientX ?? null;
                  }}
                  onTouchEnd={(event) => {
                    if (galleryTouchStartX.current === null) {
                      return;
                    }

                    const endX = event.changedTouches[0]?.clientX ?? galleryTouchStartX.current;
                    const delta = endX - galleryTouchStartX.current;
                    galleryTouchStartX.current = null;

                    if (Math.abs(delta) < 40) {
                      return;
                    }

                    cycleGalleryImage(delta < 0 ? 1 : -1);
                  }}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      cycleGalleryImage(-1);
                    }}
                    className="absolute left-4 z-30 h-14 w-14 rounded-full border border-white/10 bg-white/5 text-3xl text-white transition-all hover:bg-white/20"
                    aria-label={`Previous ${galleryEntry.commonName} image`}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      cycleGalleryImage(1);
                    }}
                    className="absolute right-4 z-30 h-14 w-14 rounded-full border border-white/10 bg-white/5 text-3xl text-white transition-all hover:bg-white/20"
                    aria-label={`Next ${galleryEntry.commonName} image`}
                  >
                    ›
                  </button>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={galleryEntry.images[galleryImageIndex] ?? galleryEntry.images[0]}
                    alt={galleryEntry.commonName}
                    className="pointer-events-none max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
                  />
                </div>

                <div className="mt-auto border-t border-white/10 bg-black/60 p-6 backdrop-blur-md">
                  <div className="mx-auto flex max-w-5xl justify-center gap-3 overflow-x-auto">
                    {galleryEntry.images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setImageIndexes((current) => ({
                            ...current,
                            [galleryEntry.id]: index,
                          }));
                        }}
                        className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                          galleryImageIndex === index
                            ? "scale-110 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                            : "border-transparent opacity-50 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <section
        id="card-details"
        className="relative z-40 grid gap-5 pointer-events-auto lg:grid-cols-2"
      >
        {/* ABOUT SECTION */}
        <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70">
            About this find
          </p>
          <h3 className="mt-2 text-3xl font-semibold text-bark">
            {activeEntry.commonName}
          </h3>
          <p className="mt-1 text-base italic text-ink/50">
            {activeEntry.scientificName}
          </p>
          <div className="mt-5 rounded-[20px] bg-white/40 p-4 shadow-sm">
            <p className="text-sm leading-7 text-ink/80">
              {activeEntry.note}
            </p>
          </div>
        </div>

        {/* LOCATION BOX WITH MAP VIBE */}
        <Link
          href={`/map?focus=${activeEntry.id}`}
          className="group relative block overflow-hidden rounded-[30px] border border-[#5aa0a4]/30 bg-[#245258] p-5 text-paper shadow-[0_18px_60px_rgba(34,92,96,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(34,92,96,0.35)] sm:p-6"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-55 transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url(${mapWorld.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(36,82,88,0.45),rgba(26,61,66,0.88))]" />

          <div className="relative flex h-full flex-col justify-between items-start gap-6">
            <div className="w-full flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a1d2d5]">Location</p>
                <p className="mt-2 text-3xl font-semibold text-white drop-shadow-md">{activeEntry.location.place}</p>
              </div>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-white/90 tracking-wide">View on Map</span>
            </div>
          </div>
        </Link>

        <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70">
            Average lifespan
          </p>
          <div className="mt-5 rounded-[20px] border border-bark/5 bg-white/50 px-5 py-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <p className="text-base font-semibold text-bark">
              {activeEntry.lifespan || "Add lifespan during AI analysis or edit it manually."}
            </p>
          </div>
        </div>

        {/* EDIBLE STATUS */}
        <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70">
            Edible status
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm ${
                activeEntry.edible === "edible"
                  ? "bg-[#d9f1d5] text-[#215c1e] border border-[#a4d89d]"
                  : activeEntry.edible === "not-edible"
                    ? "bg-[#f4d8d5] text-[#7a2821] border border-[#e2a8a2]"
                    : "bg-[#ece4cf] text-[#695c2a] border border-[#d4c8a9]"
              }`}
            >
              {activeEntry.edible === "edible" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              ) : activeEntry.edible === "not-edible" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              )}
              {activeEntry.edible === "edible"
                ? "Edible"
                : activeEntry.edible === "not-edible"
                  ? "Not edible"
                  : "Unknown"}
            </span>
          </div>
          <div className="mt-5 rounded-[20px] border border-bark/5 bg-white/50 px-5 py-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <p className="text-sm leading-6 text-ink/80 italic">
              &quot;
              {activeEntry.edibleNote ?? "Needs confirmation before treating as a food source."}
              &quot;
            </p>
          </div>
          {activeEntry.edible === "edible" || activeEntry.culinaryIdeas?.length ? (
            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] border border-[#d8c08a]/40 bg-[linear-gradient(145deg,#f5ead0,#f9f4e6)] px-5 py-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7b6440] flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                  Good uses
                </p>
                <div className="mt-3 grid gap-2">
                  {(activeEntry.uses ?? ["Needs AI research"]).slice(0, 3).map((item) => (
                    <p key={item} className="text-sm leading-6 text-ink/80 flex items-start gap-2">
                      <span className="text-[#c1a063] mt-1">•</span> {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* TAG WEB (FIXED!) */}
        <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70">Categorization Tags</p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {activeEntry.tags.map((tag) => {
              const weight = activeTagWeights[tag] ?? 1;
              return (
                <Link
                  key={tag}
                  href={`/tag/${tag}`}
                  className={`inline-flex items-center justify-center rounded-xl border border-white/80 bg-white/40 font-medium uppercase text-bark shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-md ${
                    weight >= 3
                      ? "px-4 py-2.5 text-xs tracking-[0.15em] sm:text-sm"
                      : weight === 2
                        ? "px-3 py-2 text-[11px] tracking-[0.12em]"
                        : "px-2.5 py-1.5 text-[10px] tracking-[0.1em]"
                  }`}
                >
                  <span className="opacity-40 mr-1.5">#</span>
                  {tag}
                </Link>
              )
            })}
          </div>
        </div>

        {/* CONDITIONS */}
        <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70 mb-4">
            Field Conditions
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-[#5aa0a4]/20 bg-gradient-to-b from-[#eef6f6] to-[#ffffff] px-4 py-6 text-center shadow-sm transition-transform hover:-translate-y-1">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#d6eaea] text-[#4a8d95]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.5c-3.3 0-6-2.7-6-6 0-3 6-10.5 6-10.5s6 7.5 6 10.5c0 3.3-2.7 6-6 6z"/></svg>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a8d95]">Water</p>
              <p className="mt-1 text-sm font-semibold text-bark">{activeEntry.care?.water ?? "Varies"}</p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-[24px] border border-[#f2c76a]/30 bg-gradient-to-b from-[#fff7de] to-[#ffffff] px-4 py-6 text-center shadow-sm transition-transform hover:-translate-y-1">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fcebc4] text-[#d69e2e]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d69e2e]">Light</p>
              <p className="mt-1 text-sm font-semibold text-bark">{activeEntry.care?.light ?? "Field dependent"}</p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-[24px] border border-[#a8b06f]/30 bg-gradient-to-b from-[#f1f4df] to-[#ffffff] px-4 py-6 text-center shadow-sm transition-transform hover:-translate-y-1">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e4e9c8] text-[#7a8246]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a8246]">Season</p>
              <p className="mt-1 text-sm font-semibold text-bark">{activeEntry.care?.season ?? "Year round"}</p>
            </div>
          </div>
        </div>

        {/* IMAGE GALLERY SUMMARY */}
        <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70">
              Field Photos
            </p>
            <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/60">
              {activeEntry.images.length} views
            </span>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {activeEntry.images.slice(0, 4).map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => openGalleryAt(index)}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-[24px] border-4 ${
                    activeImageIndex === index
                      ? "border-[#4a8d95] shadow-[0_0_20px_rgba(74,141,149,0.3)]"
                      : "border-white/40 hover:border-white/80"
                  } bg-paper shadow-md transition-all duration-300 hover:-translate-y-2`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`${activeEntry.commonName} view ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
            Tap any image to open full gallery
          </p>
        </div>

        {/* GOOD FOR */}
        <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70 mb-4">
            Good for
          </p>
          <div className="grid gap-3">
            {(activeEntry.goodFor ?? ["Reference", "Browsing"]).map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/40 px-4 py-3 shadow-sm">
                 <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d9f1d5] text-[#215c1e]">
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                 </div>
                <p className="text-sm font-medium text-ink/80">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FUN FACTS */}
        <div className="rounded-[30px] border border-white/70 bg-white/66 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70 mb-4">
            Fun facts
          </p>
          <div className="grid gap-3">
            {(activeEntry.funFacts ?? ["Add a fun fact during AI card generation."]).map((fact, index) => (
              <div
                key={`${activeEntry.id}-fact-${index}`}
                className="rounded-[22px] bg-[linear-gradient(145deg,rgba(255,255,255,0.6),rgba(244,238,224,0.85))] px-4 py-3 shadow-sm"
              >
                <p className="text-sm leading-6 text-ink/80">{fact}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RANDOM TAGS / DISCOVERY */}
        <DiscoverMoreCloudNoSSR
          key={activeEntry.id}
          tags={getDiscoveryTagsForEntry(allCollectionEntries, activeEntry, accentTag)}
          tagCounts={collectionTagCounts}
        />
      </section>
    </section>
  );
}
