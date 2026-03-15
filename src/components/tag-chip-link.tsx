import Link from "next/link";

type TagChipLinkProps = {
  tag: string;
  variant?: "light" | "dark" | "soft";
};

const variantClassMap = {
  light: "chip",
  dark: "chip chip-dark",
  soft: "chip chip-soft",
};

export function TagChipLink({
  tag,
  variant = "light",
}: TagChipLinkProps) {
  return (
    <Link href={`/tag/${tag}`} className={variantClassMap[variant]}>
      {tag}
    </Link>
  );
}
