import Link from "next/link";
import { notFound } from "next/navigation";
import { TagChipLink } from "@/components/tag-chip-link";
import { decks, getDeckEntries, getDeckHrefForEntry } from "@/lib/sample-data";

type DeckPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DeckPage({ params }: DeckPageProps) {
  const { slug } = await params;
  const deck = decks.find((item) => item.slug === slug);

  if (!deck) {
    notFound();
  }

  const deckEntries = getDeckEntries(deck.slug);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3eddc_0%,#efe3cf_100%)] px-6 py-8 text-ink lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-white/70 bg-white/65 p-6 shadow-[0_20px_70px_rgba(88,73,37,0.08)] backdrop-blur md:p-8">
          <Link href="/" className="text-sm uppercase tracking-[0.22em] text-moss">
            Home
          </Link>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-5xl font-semibold text-bark">{deck.title}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink/72">
                {deck.description}
              </p>
            </div>
            <div className="rounded-[24px] border border-bark/10 bg-sand/50 px-5 py-4 text-sm text-ink/70">
              Open a card, then use the next and previous controls to move
              through the deck like a swipe flow.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {deckEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={`group relative overflow-hidden rounded-[30px] border border-bark/10 p-5 shadow-[0_20px_60px_rgba(88,73,37,0.08)] transition-transform duration-300 hover:-translate-y-1 ${
                index % 3 === 0
                  ? "bg-[linear-gradient(145deg,#6b8f71,#314f52)] text-paper"
                  : index % 3 === 1
                    ? "bg-[linear-gradient(145deg,#efe2c8,#f5efe5)] text-ink"
                    : "bg-[linear-gradient(145deg,#44544b,#79906b)] text-paper"
              }`}
            >
              <div className="flex min-h-[310px] flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] opacity-70">
                    Card {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold">
                    {entry.commonName}
                  </h2>
                  <p className="mt-2 text-sm italic opacity-75">
                    {entry.scientificName}
                  </p>
                  <p className="mt-5 text-sm leading-6 opacity-78">
                    {entry.note}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.slice(0, 5).map((tag) => (
                      <TagChipLink key={tag} tag={tag} variant="light" />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm opacity-70">
                    <span>{entry.location.place}</span>
                    <span>{entry.images.length} images</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs uppercase tracking-[0.22em] opacity-60">
                      Tap into deck flow
                    </div>
                    <Link
                      href={getDeckHrefForEntry(entry)}
                      className="rounded-full border border-current/12 px-3 py-1 text-xs tracking-[0.14em]"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
