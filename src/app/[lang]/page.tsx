import type { Locale } from "@/lib/i18n";
import { getDict, locales } from "@/lib/i18n";
import { Hero } from "@/components/home/Hero";
import { WorksGrid } from "@/components/home/WorksGrid";
import { AboutPreview } from "@/components/home/AboutPreview";
import { ContactSection } from "@/components/home/ContactSection";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;
  const t = getDict(validLang);

  return (
    <>
      <Hero t={t} />
      <WorksGrid locale={validLang} t={t} />
      <AboutPreview locale={validLang} t={t} />
      <ContactSection t={t} />
    </>
  );
}
