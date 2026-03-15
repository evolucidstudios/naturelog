import { notFound, redirect } from "next/navigation";
import { getDeckHrefForEntryFromEntries } from "@/lib/nature-utils";
import { getSiteEntries, getSiteEntryById } from "@/lib/live-data";

type CardPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params;
  const [entry, collectionEntries] = await Promise.all([
    getSiteEntryById(id),
    getSiteEntries(),
  ]);

  if (!entry) {
    notFound();
  }

  redirect(getDeckHrefForEntryFromEntries(entry, collectionEntries));
}
