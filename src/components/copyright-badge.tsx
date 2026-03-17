"use client";

export function CopyrightBadge() {
  return (
    <div className="flex justify-center px-4 py-8 sm:px-6">
      <a
        href="mailto:bbjr@brianbarnhartjr.com"
        className="rounded-full border border-bark/10 bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-bark/78 shadow-[0_10px_30px_rgba(30,64,87,0.08)] backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
      >
        &copy; {new Date().getFullYear()} BBJR
      </a>
    </div>
  );
}
