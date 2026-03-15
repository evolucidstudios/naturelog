import { notFound, redirect } from "next/navigation";
import { entries, getDeckHrefForEntry } from "@/lib/sample-data";

type CardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params;
  const entry = entries.find((item) => item.id === id);

  if (!entry) {
    notFound();
  }

  redirect(getDeckHrefForEntry(entry));
}
