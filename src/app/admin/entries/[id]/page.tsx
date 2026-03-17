import { notFound } from "next/navigation";
import { AdminEntryEditor } from "@/components/admin-entry-editor";
import { requireOwner } from "@/lib/auth";
import { getAdminEntryDraft } from "@/lib/live-data";

type AdminEditEntryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditEntryPage({ params }: AdminEditEntryPageProps) {
  await requireOwner();
  const { id } = await params;
  const entry = await getAdminEntryDraft(id);

  if (!entry) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(159,135,175,0.18),transparent_26%),linear-gradient(180deg,#f9f7f3_0%,#edf8fc_42%,#eef0fa_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AdminEntryEditor mode="edit" initialEntry={entry} />
      </div>
    </main>
  );
}
