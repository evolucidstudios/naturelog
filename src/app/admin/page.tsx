import Link from "next/link";
import { AdminEntriesList } from "@/components/admin-entries-list";
import { AdminPronunciationBackfillButton } from "@/components/admin-pronunciation-backfill-button";
import { AdminSessionControls } from "@/components/admin-session-controls";
import { requireOwner } from "@/lib/auth";
import { getAdminEntries } from "@/lib/live-data";

export default async function AdminPage() {
  const user = await requireOwner();
  const entries = await getAdminEntries();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(217,238,227,0.88),transparent_30%),linear-gradient(180deg,#f7f3ea_0%,#f1e8d8_38%,#eee2cf_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[30px] border border-white/70 bg-white/74 px-5 py-6 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-moss">Admin</p>
              <h1 className="mt-3 text-4xl font-semibold text-bark">Nature Log control room</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/72">
                Signed in as {user.email}. This is where you upload finds, run AI analysis,
                edit the card text, and delete anything that needs cleaning up.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/entries/new"
                className="rounded-full bg-bark px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-paper"
              >
                New entry
              </Link>
              <AdminPronunciationBackfillButton />
              <AdminSessionControls />
            </div>
          </div>
        </header>
        <AdminEntriesList entries={entries} />
      </div>
    </main>
  );
}
