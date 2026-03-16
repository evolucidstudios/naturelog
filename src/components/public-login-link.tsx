"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PublicLoginLink() {
  const pathname = usePathname();
  const hidden =
    pathname?.startsWith("/admin") || pathname === "/login" || pathname?.startsWith("/api");

  if (hidden) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-40 flex justify-center px-4">
      <div className="pointer-events-auto">
        <Link
          href="/login"
          className="text-[10px] uppercase tracking-[0.28em] text-bark/22 transition-colors duration-200 hover:text-bark/44"
        >
          owner login
        </Link>
      </div>
    </div>
  );
}
