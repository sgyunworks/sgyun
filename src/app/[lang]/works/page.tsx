import { notFound } from "next/navigation";
import { PortfolioHome } from "@/components/portfolio/Portfolio";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";

export default async function WorksPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();

  return <PortfolioHome locale={lang as Locale} indexOnly />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (locales as readonly string[]).includes(lang) ? lang : "ko";
  return {
    title: "Selected Works",
    description: "SGYUN physical, digital, experimental, and recognition archive.",
    alternates: {
      canonical: `/${locale}/works`,
      languages: { ko: "/ko/works", en: "/en/works" },
    },
  };
}
