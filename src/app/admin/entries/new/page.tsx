import { AdminEntryEditor } from "@/components/admin-entry-editor";
import { requireOwner } from "@/lib/auth";

export default async function NewAdminEntryPage() {
  await requireOwner();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(217,238,227,0.88),transparent_30%),linear-gradient(180deg,#f7f3ea_0%,#f1e8d8_38%,#eee2cf_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AdminEntryEditor mode="create" />
      </div>
    </main>
  );
}
