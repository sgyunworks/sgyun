import { notFound } from "next/navigation";
import { ArchiveIndex } from "@/components/archive/ArchiveIndex";
import { isArchiveCategory } from "@/lib/archive";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";

export default async function WorksPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!(locales as readonly string[]).includes(lang)) notFound();

  const categoryValue = Array.isArray(query.category)
    ? query.category[0]
    : query.category;
  const activeCategory =
    categoryValue && isArchiveCategory(categoryValue)
      ? categoryValue
      : undefined;

  return <ArchiveIndex locale={lang as Locale} activeCategory={activeCategory} />;
}

export function generateMetadata() {
  return {
    title: "Archive Index",
    description: "SGYUN physical, digital, experimental, and recognition archive.",
  };
}
