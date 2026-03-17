import Link from "next/link";
import { SecretLoginLink } from "@/components/secret-login-link";
import { getCollectionTags, titleCase } from "@/lib/nature-utils";
import { getSiteEntries } from "@/lib/live-data";

function hashTag(tag: string, index: number) {
  return Array.from(tag).reduce((sum, char) => sum + char.charCodeAt(0), index * 17);
}

function tagStyle(tag: string, index: number) {
  const hash = hashTag(tag, index);
  const sizeClasses = [
    "text-sm sm:text-base",
    "text-lg sm:text-xl",
    "text-2xl sm:text-3xl",
    "text-3xl sm:text-4xl",
  ];
  const rotation = ((hash % 11) - 5) * 1.2;
  const translateY = ((hash % 5) - 2) * 4;
  const palette = [
    "from-[#dff8fb] to-[#ffffff] text-[#0a6872]",
    "from-[#f3eeff] to-[#ffffff] text-[#5b4f84]",
    "from-[#e8fbff] to-[#f9f7f3] text-[#2f5d62]",
    "from-[#f8f4ff] to-[#ffffff] text-[#525174]",
  ];

  return {
    className: `${sizeClasses[hash % sizeClasses.length]} ${palette[hash % palette.length]}`,
    style: {
      transform: `translateY(${translateY}px) rotate(${rotation}deg)`,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function LiveTagsPage() {
  const entries = await getSiteEntries();
  const tags = getCollectionTags(entries);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.18),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(159,135,175,0.18),transparent_24%),linear-gradient(180deg,#f9f7f3_0%,#edf8fc_42%,#eef0fa_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[34px] border border-white/70 bg-white/74 px-5 py-5 shadow-[0_22px_64px_rgba(82,81,116,0.12)] backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-[11px] font-semibold uppercase tracking-[0.34em] text-bark/82">
                Nature Log
              </Link>
              <SecretLoginLink className="h-10 w-10" />
            </div>
            <Link
              href="/map"
              className="rounded-full border border-bark/12 bg-white/78 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-bark transition-transform duration-200 hover:-translate-y-0.5"
            >
              Explore map
            </Link>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-moss/80">Live tags</p>
            <h1 className="mt-4 text-5xl font-semibold text-bark sm:text-6xl">
              Follow whatever catches.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink/68 sm:text-base">
              No scores. No hierarchy. Just a room full of ways into the collection.
            </p>
          </div>
        </header>

        <section className="mt-8 rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.76),rgba(181,226,250,0.38)_48%,rgba(159,135,175,0.22)_100%)] p-5 shadow-[0_24px_70px_rgba(82,81,116,0.12)] backdrop-blur sm:p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {tags.map((tag, index) => {
              const style = tagStyle(tag, index);

              return (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className={`flex min-h-[6.75rem] items-center justify-center rounded-[28px] border border-white/80 bg-gradient-to-br px-4 py-6 text-center font-semibold shadow-[0_16px_40px_rgba(82,81,116,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,163,177,0.16)] ${style.className}`}
                  style={style.style}
                >
                  {titleCase(tag)}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
