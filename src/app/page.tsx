import Link from "next/link";
import { TagChipLink } from "@/components/tag-chip-link";
import {
  buildMapRegionsFromEntries,
  getCollectionTags,
  getDeckHrefForEntryFromEntries,
  getTagCounts,
} from "@/lib/nature-utils";
import { getSiteEntries } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await getSiteEntries();
  const featuredEntry = entries[0];
  const tagCounts = getTagCounts(entries);
  const popularTags = getCollectionTags(entries).slice(0, 8);
  const places = buildMapRegionsFromEntries(entries).slice(0, 3);
  const quickStats = [
    { label: "Cards logged", value: String(entries.length) },
    { label: "Live tags", value: String(Object.keys(tagCounts).length) },
    {
      label: "Places mapped",
      value: String(new Set(entries.map((entry) => entry.location.place)).size),
    },
  ];

  if (!featuredEntry) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(217,238,227,0.88),transparent_30%),linear-gradient(180deg,#f7f3ea_0%,#f1e8d8_38%,#eee2cf_100%)] px-4 py-10 text-ink sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/70 bg-white/70 p-6 text-center shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.28em] text-moss">Nature Log</p>
          <h1 className="mt-3 text-3xl font-semibold text-bark">Ready for your first find</h1>
          <p className="mt-3 text-sm leading-7 text-ink/72">
            Sign in as the owner to upload your first card and start building the collection.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link className="chip" href="/login">
              Owner login
            </Link>
            <Link className="chip" href="/map">
              Explore map
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const featuredImage = featuredEntry.images[0];
  const featuredImageStyle = featuredImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(8, 10, 9, 0.08), rgba(8, 10, 9, 0.42)), url("${featuredImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(217,238,227,0.88),transparent_30%),linear-gradient(180deg,#f7f3ea_0%,#f1e8d8_38%,#eee2cf_100%)] text-ink">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="rounded-[28px] border border-white/70 bg-white/64 px-5 py-6 shadow-[0_18px_65px_rgba(88,73,37,0.08)] backdrop-blur sm:px-6 sm:py-7">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] uppercase tracking-[0.34em] text-moss sm:text-xs">
              Nature Log
            </p>
            <h1 className="mt-4 text-4xl leading-[0.95] font-semibold text-bark sm:text-5xl md:text-6xl">
              Make the card the treasure.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink/72 sm:text-base">
              Upload a find, let AI help build the card, and keep every discovery feeling like
              a collectible specimen in one growing archive.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Link className="chip" href={getDeckHrefForEntryFromEntries(featuredEntry, entries)}>
              Open nature deck
            </Link>
            <Link className="chip" href="/map">
              Explore map
            </Link>
            <Link className="chip" href="/login">
              Owner login
            </Link>
          </div>
        </header>

        <section className="relative mt-5 sm:mt-7">
          <div className="absolute inset-x-0 top-12 mx-auto h-48 w-[90%] rounded-full bg-[radial-gradient(circle,rgba(95,127,87,0.22),transparent_70%)] blur-3xl sm:top-16 sm:h-56" />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-full border border-white/70 bg-white/70 px-3 py-2 text-center shadow-[0_10px_30px_rgba(88,73,37,0.06)] backdrop-blur sm:px-4"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-ink/50">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-bark">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="group w-full max-w-[25rem] rounded-[34px] border border-white/80 bg-[linear-gradient(160deg,#6f9473_0%,#486768_54%,#2f3c3c_100%)] p-4 text-paper shadow-[0_28px_80px_rgba(52,60,48,0.24)] transition-transform duration-300 hover:-translate-y-1 sm:p-5">
              <div
                className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 sm:p-6"
                style={featuredImageStyle}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.28))]" />
                <div className="absolute right-4 top-4 h-16 w-16 rounded-full border border-white/12 bg-[radial-gradient(circle,rgba(255,255,255,0.24),rgba(255,255,255,0.02))] blur-[1px] sm:h-20 sm:w-20" />
                <div className="relative flex min-h-[30rem] flex-col justify-between sm:min-h-[34rem]">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.32em] text-paper/68">
                          Featured specimen
                        </p>
                        <h2 className="card-title-glow mt-4 max-w-xs text-4xl leading-none font-semibold sm:text-5xl">
                          {featuredEntry.commonName}
                        </h2>
                        <p className="card-subtitle-glow mt-3 text-sm italic text-paper/84 sm:text-base">
                          {featuredEntry.scientificName}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-paper/76">
                        Live card
                      </span>
                    </div>

                    <div className="mt-8 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-paper/62">
                        Field note
                      </p>
                      <p className="mt-3 text-sm leading-7 text-paper/82 sm:text-[15px]">
                        {featuredEntry.note}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {featuredEntry.tags.slice(0, 6).map((tag) => (
                        <TagChipLink key={tag} tag={tag} variant="soft" />
                      ))}
                    </div>

                    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-bark/26 p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-paper/56">
                          Location
                        </p>
                        <p className="mt-2 text-base font-semibold">{featuredEntry.location.place}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-paper/56">
                          Images
                        </p>
                        <p className="mt-2 text-base font-semibold">
                          {featuredEntry.images.length} views saved
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link className="chip" href={getDeckHrefForEntryFromEntries(featuredEntry, entries)}>
                Open this tag stack
              </Link>
              <Link className="chip" href={`/card/${featuredEntry.id}`}>
                Open deep link
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
          <div className="rounded-[28px] border border-white/70 bg-white/62 p-5 shadow-[0_16px_55px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-moss">Popular tags</p>
                <h3 className="mt-2 text-3xl font-semibold text-bark">
                  Open a stack by theme
                </h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-ink/70">
                Every tag opens the collectible deck view, so the library can keep expanding
                without losing the card-first feel.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {popularTags.map((tag) => (
                <TagChipLink key={tag} tag={tag} />
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[28px] border border-bark/10 bg-bark p-5 text-paper shadow-[0_18px_60px_rgba(57,51,38,0.2)] sm:p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-sand">Places</p>
              <div className="mt-4 grid gap-3">
                {places.map((region) => (
                  <Link
                    key={region.slug}
                    href="/map"
                    className="rounded-[22px] border border-white/10 bg-white/7 px-4 py-3 transition-colors hover:bg-white/12"
                  >
                    <p className="font-semibold">{region.name}</p>
                    <p className="text-sm leading-6 text-paper/70">{region.summary}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/62 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-moss">Tag depth</p>
              <h3 className="mt-2 text-3xl font-semibold text-bark">
                Deep categorization, ready for live uploads
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
                The real workflow now has a place for owner login, file uploads, AI-generated
                card text, and map metadata, so this collection can become your actual field
                system instead of just a concept.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {popularTags.slice(0, 6).map((tag) => (
                  <TagChipLink key={tag} tag={tag} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
