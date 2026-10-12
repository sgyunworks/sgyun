import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { PortfolioHome } from "@/components/portfolio/Portfolio";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;

  return <PortfolioHome locale={validLang} />;
}
