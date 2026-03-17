import Link from "next/link";
import { SecretLoginLink } from "@/components/secret-login-link";
import { TagChipLink } from "@/components/tag-chip-link";
import {
  getCollectionTags,
  getDeckHrefForEntryFromEntries,
  getTagCounts,
} from "@/lib/nature-utils";
import { getSiteEntries } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await getSiteEntries();
  const newestEntry = entries[0];
  const newestDeckHref = newestEntry
    ? getDeckHrefForEntryFromEntries(newestEntry, entries)
    : "/tag/all";
  const popularTags = getCollectionTags(entries).slice(0, 10);
  const recentEntries = entries.slice(0, 12);
  const tagCounts = getTagCounts(entries);
  const quickStats = [
    {
      label: "Cards logged",
      value: String(entries.length),
      href: "/tag/all",
    },
    {
      label: "Live tags",
      value: String(Object.keys(tagCounts).length),
      href: "/tags",
    },
  ];

  if (!newestEntry) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,76,129,0.18),transparent_26%),linear-gradient(180deg,#f9f7f3_0%,#e6f7fd_42%,#d9eef9_100%)] px-4 py-6 text-ink sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="rounded-[34px] border border-white/70 bg-white/72 px-5 py-5 shadow-[0_22px_64px_rgba(82,81,116,0.12)] backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Link href="/" className="text-[11px] font-semibold uppercase tracking-[0.34em] text-bark/82">
                  Nature Log
                </Link>
                <SecretLoginLink className="h-10 w-10" />
              </div>
              <Link
                href="/map"
                className="rounded-full bg-[linear-gradient(135deg,#0fa3b1,#525174)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-paper shadow-[0_14px_30px_rgba(15,163,177,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Explore map
              </Link>
            </div>
            <div className="mt-12 text-center">
              <p className="text-[11px] uppercase tracking-[0.3em] text-moss/80">Field journal</p>
              <h1 className="mt-4 text-5xl font-semibold text-bark sm:text-6xl">
                Ready for the first wild thing worth keeping.
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink/72 sm:text-base">
                The archive wakes up the moment your first card lands here.
              </p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,76,129,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(181,226,250,0.28),transparent_24%),linear-gradient(180deg,#f9f7f3_0%,#e6f7fd_42%,#d9eef9_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(249,247,243,0.86),rgba(181,226,250,0.72)_38%,rgba(15,163,177,0.18)_76%,rgba(15,76,129,0.2)_100%)] px-5 py-5 shadow-[0_24px_70px_rgba(31,59,83,0.12)] backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-[11px] font-semibold uppercase tracking-[0.34em] text-bark/82">
                Nature Log
              </Link>
              <SecretLoginLink className="h-10 w-10" />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {quickStats.map((stat) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="inline-flex h-[2.95rem] min-w-[5.9rem] flex-col items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(181,226,250,0.5))] px-4 text-center shadow-[0_14px_34px_rgba(31,59,83,0.08)] backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:bg-white"
                >
                  <p className="text-[10px] uppercase tracking-[0.24em] text-bark/50">
                    {stat.label === "Cards logged" ? "Cards" : "Tags"}
                  </p>
                  <p className="mt-0.5 text-base leading-none font-semibold text-bark">{stat.value}</p>
                </Link>
              ))}
              <Link
                href="/map"
                className="inline-flex h-[2.95rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,#0fa3b1,#525174)] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-paper shadow-[0_14px_30px_rgba(15,163,177,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Explore map
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-moss/80">Field archive</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold text-bark sm:text-6xl">
                It is nice to know what a wild thing is called.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-ink/74">
                A name changes the way you see it. The shape stays the same, but suddenly it feels
                familiar, memorable, and worth keeping.
              </p>
            </div>

            <Link
              href={newestDeckHref}
              className="group mx-auto block w-full max-w-[22rem] overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(181,226,250,0.24))] shadow-[0_22px_60px_rgba(31,59,83,0.12)] backdrop-blur transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="aspect-square overflow-hidden bg-[linear-gradient(135deg,#0fa3b1,#0f4c81)]">
                {newestEntry.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={newestEntry.images[0]}
                    alt={newestEntry.commonName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <div className="space-y-2 p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-moss/80">
                  Newest field note
                </p>
                <h2 className="text-2xl font-semibold text-bark">{newestEntry.commonName}</h2>
                <p className="text-sm italic text-bark/58">{newestEntry.scientificName}</p>
              </div>
            </Link>
          </div>
        </header>

        <section className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-moss/78">Recent finds</p>
              <h2 className="mt-2 text-3xl font-semibold text-bark sm:text-4xl">
                Recent finds
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentEntries.map((entry) => (
              <Link
                key={entry.id}
                href={getDeckHrefForEntryFromEntries(entry, entries)}
                className="group relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(181,226,250,0.16))] shadow-[0_18px_46px_rgba(31,59,83,0.1)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(15,163,177,0.18)]"
              >
                <div className="relative aspect-square overflow-hidden bg-[linear-gradient(135deg,#0fa3b1,#0f4c81)]">
                  {entry.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.images[0]}
                      alt={entry.commonName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(8,20,33,0.68)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="card-title-glow line-clamp-2 text-lg font-semibold text-paper">
                      {entry.commonName}
                    </h3>
                  </div>
                </div>
                <div className="p-4 pt-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-bark/46">
                    {entry.location.place}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(181,226,250,0.44),rgba(15,163,177,0.08))] p-5 shadow-[0_20px_60px_rgba(31,59,83,0.1)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-moss/78">Popular tags</p>
              <h2 className="mt-2 text-3xl font-semibold text-bark">Follow a thread.</h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-ink/64">
              Start with a mood, a species family, a season, or a place. The collection opens
              differently depending on what you chase first.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {popularTags.map((tag) => (
              <TagChipLink key={tag} tag={tag} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
