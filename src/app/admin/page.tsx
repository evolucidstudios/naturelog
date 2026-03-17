import Link from "next/link";
import { AdminEntriesList } from "@/components/admin-entries-list";
import { AdminSessionControls } from "@/components/admin-session-controls";
import { requireOwner } from "@/lib/auth";
import { getAdminEntries } from "@/lib/live-data";

export default async function AdminPage() {
  await requireOwner();
  const entries = await getAdminEntries();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(159,135,175,0.18),transparent_26%),linear-gradient(180deg,#f9f7f3_0%,#edf8fc_42%,#eef0fa_100%)] px-4 py-5 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,163,177,0.92),rgba(82,81,116,0.92)_72%,rgba(159,135,175,0.96))] px-5 py-6 text-paper shadow-[0_18px_60px_rgba(82,81,116,0.16)] sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-[11px] uppercase tracking-[0.32em] text-paper/70">Admin</p>
                <Link
                  href="/"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-white/10 text-paper/90 transition-transform duration-200 hover:-translate-y-0.5"
                  aria-label="Go home"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10.5 12 3l9 7.5" />
                    <path d="M5 9.5V21h14V9.5" />
                    <path d="M9.5 21v-6h5v6" />
                  </svg>
                </Link>
              </div>
              <h1 className="mt-3 text-4xl font-semibold text-paper">Field Cabinet</h1>
              <p className="mt-3 text-base leading-7 text-paper/88">The magic is in noticing...</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/entries/new"
                className="rounded-full bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark shadow-[0_12px_28px_rgba(82,81,116,0.12)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                New entry
              </Link>
              <AdminSessionControls />
            </div>
          </div>
        </header>
        <AdminEntriesList entries={entries} />
      </div>
    </main>
  );
}
