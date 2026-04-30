import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, getDict } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const validLang = (locales as readonly string[]).includes(lang)
    ? (lang as Locale)
    : "ko";
  return {
    title: `${siteConfig.name} — ${
      validLang === "ko" ? "Engineering Art" : "Engineering Art"
    }`,
    description: siteConfig.description[validLang],
    alternates: {
      languages: {
        ko: `/ko`,
        en: `/en`,
      },
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;

  const t = getDict(validLang);

  return (
    <div lang={validLang}>
      <Nav locale={validLang} t={t} />
      <main className={validLang === "ko" ? "body-text" : ""}>{children}</main>
      <Footer t={t} />
    </div>
  );
}
