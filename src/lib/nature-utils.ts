import type { NatureEntry } from "@/lib/sample-data";

export type MapRegion = {
  slug: string;
  name: string;
  summary: string;
  deckSlug?: string;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getTagCounts(entries: NatureEntry[]) {
  return entries.reduce<Record<string, number>>((counts, entry) => {
    for (const tag of entry.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }

    return counts;
  }, {});
}

export function getCollectionTags(entries: NatureEntry[]) {
  const counts = getTagCounts(entries);

  return Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort((left, right) => {
    const popularityDelta = (counts[right] ?? 0) - (counts[left] ?? 0);

    if (popularityDelta !== 0) {
      return popularityDelta;
    }

    return left.localeCompare(right);
  });
}

export function getTagUsageCountFromEntries(entries: NatureEntry[], tag: string) {
  return entries.filter((entry) => entry.tags.includes(tag)).length;
}

export function getDiscoveryTagsForEntry(
  entries: NatureEntry[],
  activeEntry: NatureEntry,
  excludeTag?: string,
) {
  const counts = getTagCounts(entries);
  const allTags = Array.from(new Set(entries.flatMap((entry) => entry.tags)));
  const sortTags = (tags: string[]) =>
    tags.sort((left, right) => {
      const popularityDelta = (counts[right] ?? 0) - (counts[left] ?? 0);

      if (popularityDelta !== 0) {
        return popularityDelta;
      }

      return left.localeCompare(right);
    });
  const outsideTags = allTags.filter((tag) => !activeEntry.tags.includes(tag) && tag !== excludeTag);

  if (outsideTags.length > 0) {
    return sortTags(outsideTags);
  }

  return sortTags(allTags.filter((tag) => tag !== excludeTag));
}

export function getPrimaryTagForEntryFromEntries(entry: NatureEntry, entries: NatureEntry[]) {
  const counts = getTagCounts(entries);

  return (
    [...entry.tags].sort((left, right) => {
      const popularityDelta = (counts[right] ?? 0) - (counts[left] ?? 0);

      if (popularityDelta !== 0) {
        return popularityDelta;
      }

      return entry.tags.indexOf(left) - entry.tags.indexOf(right);
    })[0] ?? entry.tags[0] ?? "nature-log"
  );
}

export function getDeckHrefForEntryFromEntries(entry: NatureEntry, entries: NatureEntry[]) {
  return `/tag/${encodeURIComponent(
    getPrimaryTagForEntryFromEntries(entry, entries),
  )}?focus=${encodeURIComponent(entry.id)}`;
}

export function buildMapRegionsFromEntries(entries: NatureEntry[]): MapRegion[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const place = entry.location.place.trim();

    if (!place) {
      continue;
    }

    counts.set(place, (counts.get(place) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([place, count]) => ({
      slug: slugify(place),
      name: place,
      summary: `${count} logged ${count === 1 ? "find" : "finds"}`,
    }));
}

export function entryMatchesRegion(entry: NatureEntry, region: MapRegion) {
  return (
    slugify(entry.location.place) === region.slug ||
    (region.deckSlug ? entry.deckSlugs.includes(region.deckSlug) : false)
  );
}

export function shuffleArray<T>(source: T[]) {
  const copy = [...source];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
