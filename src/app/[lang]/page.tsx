import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { DialArchive } from "@/components/archive/DialArchive";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;

  return <DialArchive locale={validLang} />;
}
