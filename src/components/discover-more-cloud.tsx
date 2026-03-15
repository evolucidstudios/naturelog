"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DiscoverMoreCloudProps = {
  tags: string[];
  tagCounts: Record<string, number>;
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

function getShuffledSelection(tags: string[], previous: string[] = []) {
  const count = Math.min(tags.length, 10);

  if (count <= 1) {
    return pickRandomTags(tags, count);
  }

  let next = pickRandomTags(tags, count);
  let attempts = 0;

  while (attempts < 6 && tagsMatch(previous, next)) {
    next = pickRandomTags(tags, count);
    attempts += 1;
  }

  return next;
}

export function DiscoverMoreCloud({ tags, tagCounts }: DiscoverMoreCloudProps) {
  const [randomTagNonce, setRandomTagNonce] = useState(0);
  const [discoveryTags, setDiscoveryTags] = useState<string[]>(() =>
    getShuffledSelection(tags),
  );

  const discoveryTagWeights = useMemo(
    () =>
      Object.fromEntries(
        discoveryTags.map((tag) => [tag, tagCounts[tag] ?? 1]),
      ) as Record<string, number>,
    [discoveryTags, tagCounts],
  );

  return (
    <div className="rounded-[30px] border border-white/70 bg-gradient-to-br from-white/80 to-white/40 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6 lg:col-span-2">
      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-black/5 pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss/70">
          Discover More
        </p>
        <button
          type="button"
          onClick={() => {
            setDiscoveryTags((current) => getShuffledSelection(tags, current));
            setRandomTagNonce((current) => current + 1);
          }}
          className="group relative z-10 flex items-center gap-2 rounded-full bg-bark px-4 py-2 text-paper shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Shuffle</span>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-500 group-active:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-6 pb-6 sm:gap-x-6">
        {discoveryTags.map((tag, index) => {
          const weight = discoveryTagWeights[tag] ?? 1;

          return (
            <Link
              key={`${tag}-${randomTagNonce}`}
              href={`/tag/${tag}`}
              className={`group relative flex items-center justify-center rounded-2xl border border-white bg-white/90 px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(47,93,98,0.15)] ${
                weight >= 3
                  ? "text-2xl font-black tracking-wide text-[#1c4549] sm:text-3xl"
                  : weight === 2
                    ? "text-lg font-bold tracking-wider text-[#2f5d62] sm:text-xl"
                    : "text-sm font-bold uppercase tracking-[0.15em] text-[#427b82]"
              }`}
              title={`${weight} cards`}
              style={{
                transform: `rotate(${index % 2 === 0 ? index * 2 - 4 : index * -2 + 3}deg) translateY(${index % 3 === 0 ? -4 : 4}px)`,
                animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
              }}
            >
              <div className="absolute top-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-black/10" />
              {tag}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
