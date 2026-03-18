import { readdir } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

type ExplorerTile = {
  kind: "route" | "folder" | "file";
  label: string;
  href: string;
  relativePath: string;
  previewCount?: number;
};

const publicExpRoot = path.join(process.cwd(), "public", "exp");
const appExpRoot = path.join(process.cwd(), "src", "app", "exp");

async function safeReadDir(targetPath: string) {
  try {
    return await readdir(targetPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function collectHtmlFiles(currentPath: string, relativePath = ""): Promise<string[]> {
  const entries = await safeReadDir(currentPath);
  const found: string[] = [];

  for (const entry of entries) {
    const nextRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    const absolutePath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      found.push(...(await collectHtmlFiles(absolutePath, nextRelative)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      found.push(nextRelative);
    }
  }

  return found;
}

async function collectAppRoutes() {
  const entries = await safeReadDir(appExpRoot);
  const tiles: ExplorerTile[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory() || entry.name === "index.html") {
      continue;
    }

    const routeFiles = await safeReadDir(path.join(appExpRoot, entry.name));
    const hasPage = routeFiles.some((file) => file.isFile() && file.name === "page.tsx");

    if (!hasPage) {
      continue;
    }

    tiles.push({
      kind: "route",
      label: entry.name,
      href: `/exp/${entry.name}`,
      relativePath: entry.name,
    });
  }

  return tiles;
}

async function collectPublicTiles() {
  const entries = await safeReadDir(publicExpRoot);
  const tiles: ExplorerTile[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(publicExpRoot, entry.name);
    const relativePath = entry.name;

    if (entry.isDirectory()) {
      const htmlFiles = await collectHtmlFiles(absolutePath, relativePath);

      if (htmlFiles.length === 0) {
        continue;
      }

      const preferredFile =
        htmlFiles.find((file) => file.toLowerCase().endsWith("/index.html")) ?? htmlFiles[0];

      tiles.push({
        kind: "folder",
        label: entry.name,
        href: `/exp/${preferredFile}`,
        relativePath,
        previewCount: htmlFiles.length,
      });
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      tiles.push({
        kind: "file",
        label: entry.name.replace(/\.html$/i, ""),
        href: `/exp/${entry.name}`,
        relativePath,
      });
    }
  }

  return tiles;
}

async function buildExplorerTiles(): Promise<ExplorerTile[]> {
  const [appTiles, publicTiles] = await Promise.all([collectAppRoutes(), collectPublicTiles()]);
  const combined = [...appTiles, ...publicTiles];
  const seen = new Set<string>();

  return combined
    .filter((tile) => {
      if (seen.has(tile.href)) {
        return false;
      }

      seen.add(tile.href);
      return true;
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function ExpIndexPage() {
  const tiles = await buildExplorerTiles();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(82,81,116,0.14),transparent_24%),linear-gradient(180deg,#f9f7f3_0%,#e6f7fd_45%,#d9eef9_100%)] px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(181,226,250,0.62),rgba(15,163,177,0.16))] px-5 py-6 shadow-[0_24px_70px_rgba(31,59,83,0.12)] backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-bark/62">
                Experimental Shelf
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-bark sm:text-5xl">
                Things to look at
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70 sm:text-base">
                This page scans both <code className="rounded bg-white/60 px-1.5 py-0.5 text-[0.9em]">src/app/exp</code> and{" "}
                <code className="rounded bg-white/60 px-1.5 py-0.5 text-[0.9em]">public/exp</code> and lists anything you can open.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-white/80 bg-white/78 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-bark shadow-[0_12px_28px_rgba(31,59,83,0.08)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Home
            </Link>
          </div>
        </header>

        {tiles.length === 0 ? (
          <section className="mt-8 rounded-[30px] border border-dashed border-bark/18 bg-white/72 px-6 py-10 text-center shadow-[0_18px_54px_rgba(31,59,83,0.08)]">
            <p className="text-sm uppercase tracking-[0.22em] text-bark/48">Nothing found yet</p>
            <p className="mt-4 text-lg text-bark/74">
              Add routes under <code className="rounded bg-white px-1.5 py-0.5 text-[0.9em]">src/app/exp</code> or HTML files under{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-[0.9em]">public/exp</code>.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tiles.map((tile) => (
              <Link
                key={`${tile.kind}:${tile.relativePath}`}
                href={tile.href}
                className="group rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(181,226,250,0.28))] p-5 shadow-[0_18px_46px_rgba(31,59,83,0.1)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(15,163,177,0.18)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-bark/48">
                      {tile.kind === "route"
                        ? "App route"
                        : tile.kind === "folder"
                          ? "Folder"
                          : "HTML file"}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold capitalize text-bark">
                      {tile.label}
                    </h2>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0fa3b1,#525174)] text-paper transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <p className="mt-5 break-all rounded-2xl bg-white/70 px-3 py-2 text-sm text-bark/70">
                  {tile.href}
                </p>
                {typeof tile.previewCount === "number" ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-bark/50">
                    {tile.previewCount} HTML file{tile.previewCount === 1 ? "" : "s"} inside
                  </p>
                ) : null}
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
