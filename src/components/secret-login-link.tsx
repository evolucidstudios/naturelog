"use client";

import Link from "next/link";

type SecretLoginLinkProps = {
  className?: string;
  href?: string;
  label?: string;
};

export function SecretLoginLink({
  className,
  href = "/login",
  label = "Owner login",
}: SecretLoginLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={[
        "group inline-flex h-[3.1rem] w-[3.1rem] items-center justify-center rounded-full border border-transparent bg-transparent text-transparent shadow-none transition-all duration-200 hover:border-bark/10 hover:bg-white/34 focus-visible:border-bark/18 focus-visible:bg-white/50 active:scale-95 active:bg-white/58",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="sr-only">{label}</span>
      <span className="h-2 w-2 rounded-full bg-bark/0 transition-colors duration-200 group-hover:bg-bark/12 group-focus-visible:bg-bark/18 group-active:bg-bark/22" />
    </Link>
  );
}
