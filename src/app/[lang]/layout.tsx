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
    title: { absolute: `${siteConfig.name} | Industrial · Metalcraft · AI Creative Design` },
    description: siteConfig.description[validLang],
    alternates: {
      canonical: `/${validLang}`,
      languages: {
        ko: `/ko`,
        en: `/en`,
      },
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteConfig.name} | Industrial · Metalcraft · AI Creative Design`,
      description: siteConfig.description[validLang],
    },
    openGraph: {
      title: `${siteConfig.name} | Industrial · Metalcraft · AI Creative Design`,
      description: siteConfig.description[validLang],
      url: `/${validLang}`,
      locale: validLang === "ko" ? "ko_KR" : "en_US",
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
      <DocumentLanguage locale={validLang} />
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
