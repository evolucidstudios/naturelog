import Link from "next/link";
import { notFound } from "next/navigation";
import { RolodexStack } from "@/components/rolodex-stack";
import { shuffleArray } from "@/lib/nature-utils";
import { getSiteEntries, getSiteEntriesByTag } from "@/lib/live-data";

type TagPageProps = {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ focus?: string }>;
};

export const dynamic = "force-dynamic";

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag } = await params;
  const { focus } = await searchParams;
  const decodedTag = decodeURIComponent(tag);
  const [matches, collectionEntries] = await Promise.all([
    getSiteEntriesByTag(decodedTag),
    getSiteEntries(),
  ]);

  if (matches.length === 0) {
    notFound();
  }

  const shuffledMatches = shuffleArray(matches);
  const focusEntry = focus
    ? shuffledMatches.find((entry) => entry.id === focus)
    : undefined;
  const orderedMatches = focusEntry
    ? [focusEntry, ...shuffledMatches.filter((entry) => entry.id !== focusEntry.id)]
    : shuffledMatches;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(217,238,227,0.88),transparent_30%),linear-gradient(180deg,#f7f3ea_0%,#f1e8d8_38%,#eee2cf_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col">
        <RolodexStack
          entries={orderedMatches}
          title="Tag deck"
          subtitle="Centered card stack"
          accentTag={decodedTag}
          focusEntryId={focusEntry?.id}
          collectionEntries={collectionEntries}
        />

        <header className="mt-6 rounded-[28px] border border-white/70 bg-white/64 px-5 py-6 shadow-[0_18px_65px_rgba(88,73,37,0.08)] backdrop-blur sm:px-6 sm:py-7">
          <Link href="/" className="text-sm uppercase tracking-[0.24em] text-moss">
            Nature Log
          </Link>
          <div className="mx-auto mt-4 max-w-3xl text-center">
            <p className="text-[11px] uppercase tracking-[0.34em] text-moss sm:text-xs">
              Nature Deck
            </p>
            <h1 className="mt-4 text-4xl leading-[0.95] font-semibold text-bark sm:text-5xl md:text-6xl">
              Tag deck: #{decodedTag}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink/72 sm:text-base">
              {matches.length} matching cards are loaded into this stack.
            </p>
          </div>
        </header>
      </div>
    </main>
  );
}
