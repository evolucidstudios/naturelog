import { MapExplorer } from "@/components/map-explorer";
import { buildMapRegionsFromEntries } from "@/lib/nature-utils";
import { getSiteEntries } from "@/lib/live-data";

type MapPageProps = {
  searchParams: Promise<{ focus?: string }>;
};

export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: MapPageProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const { focus } = await searchParams;
  const entries = await getSiteEntries();
  const mapRegions = buildMapRegionsFromEntries(entries);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(159,135,175,0.18),transparent_24%),linear-gradient(180deg,#f9f7f3_0%,#edf8fc_42%,#eef0fa_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section>
          <MapExplorer
            entries={entries}
            initialFocusId={focus}
            mapboxToken={mapboxToken}
            regions={mapRegions}
          />
        </section>
      </div>
    </main>
  );
}
