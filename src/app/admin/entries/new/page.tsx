import { AdminEntryEditor } from "@/components/admin-entry-editor";
import { requireOwner } from "@/lib/auth";
import { getAdminEntries } from "@/lib/live-data";

export default async function NewAdminEntryPage() {
  await requireOwner();
  const entries = await getAdminEntries();
  const knownEntries = entries.map((entry) => ({
    id: entry.id,
    commonName: entry.commonName,
    scientificName: entry.scientificName,
    category: entry.category ?? "",
    tags: entry.tags,
  }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(159,135,175,0.18),transparent_26%),linear-gradient(180deg,#f9f7f3_0%,#edf8fc_42%,#eef0fa_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AdminEntryEditor mode="create" knownEntries={knownEntries} />
      </div>
    </main>
  );
}
