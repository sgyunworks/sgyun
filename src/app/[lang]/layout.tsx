import { PortfolioShell } from "@/components/portfolio/PortfolioShell";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, getDict } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { VaultTransition } from "@/components/VaultTransition";
import { DocumentLanguage } from "@/components/DocumentLanguage";
import { RouteVaultDial } from "@/components/RouteVaultDial";
import { siteConfig } from "@/lib/site-config";
import { brandName, personJsonLd, toLocale, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toLocale(lang);
  // Page-level files set canonical/hreflang/OG; the layout only sets the per-locale title template and fallbacks.
  return {
    title: {
      default: validLang === "ko"
        ? `${siteConfig.fullName.ko} SGYUN | Builder • Industrial Designer`
        : `${siteConfig.fullName.en} (SGYUN) | Builder • Industrial Designer`,
      template: `%s | ${brandName[validLang]}`,
    },
    description: siteConfig.description[validLang],
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
      <DocumentLanguage locale={validLang} />
      <JsonLd data={[websiteJsonLd(validLang), personJsonLd(validLang)]} />
      <PortfolioShell locale={validLang} legacy={<>
      <Nav locale={validLang} t={t} />
      <VaultTransition />
      <RouteVaultDial locale={validLang} />
      <main className={validLang === "ko" ? "body-text" : ""}>{children}</main>
      <Footer t={t} />
      </>}>{children}</PortfolioShell>
    </div>
  );
}
