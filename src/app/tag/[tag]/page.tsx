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
  const isAllView = decodedTag.toLowerCase() === "all";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.16),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(159,135,175,0.16),transparent_24%),linear-gradient(180deg,#f9f7f3_0%,#edf8fc_42%,#eef0fa_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col">
        <RolodexStack
          entries={orderedMatches}
          title="Tag deck"
          subtitle="Centered card stack"
          accentTag={decodedTag}
          focusEntryId={focusEntry?.id}
          collectionEntries={collectionEntries}
        />

        <header className="mt-6 rounded-[30px] border border-white/70 bg-white/72 px-5 py-6 shadow-[0_20px_60px_rgba(82,81,116,0.1)] backdrop-blur sm:px-6 sm:py-7">
          <Link href="/" className="text-sm uppercase tracking-[0.24em] text-moss">
            Nature Log
          </Link>
          <div className="mx-auto mt-4 max-w-3xl text-center">
            <Link href="/tag/all" className="text-[11px] uppercase tracking-[0.34em] text-moss sm:text-xs">
              Nature Deck
            </Link>
            <h1 className="mt-4 text-4xl leading-[0.95] font-semibold text-bark sm:text-5xl md:text-6xl">
              {isAllView ? "All logged finds" : `#${decodedTag}`}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink/72 sm:text-base">
              {isAllView
                ? `${matches.length} cards are waiting in the full deck. Swipe until something pulls you in.`
                : `${matches.length} matching cards are loaded into this thread. Follow it until it turns into the next good find.`}
            </p>
          </div>
        </header>
      </div>
    </main>
  );
}
