import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { PortfolioContact } from "@/components/portfolio/Portfolio";
import { JsonLd } from "@/components/JsonLd";
import { abs, pageMetadata, personRef, toLocale } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

const CONTACT = {
  ko: { title: "연락처 — 협업·프로젝트 문의", description: `이석윤(SGYUN)에게 제품 디자인·빌드 협업을 문의하세요. 이메일 ${siteConfig.email}, 인스타그램 @sgyunworks.` },
  en: { title: "Contact — Collaboration & Project Inquiries", description: `Contact Seokyun Lee (SGYUN) for product design and build collaborations. Email ${siteConfig.email}, Instagram @sgyunworks.` },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  return pageMetadata({ locale, rest: "/contact", ...CONTACT[locale] });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const locale = lang as Locale;
  const url = abs(`/${locale}/contact`);
  return <>
    <JsonLd data={{ "@type": "ContactPage", "@id": `${url}#page`, url, name: CONTACT[locale].title, description: CONTACT[locale].description, inLanguage: locale === "ko" ? "ko-KR" : "en", about: personRef, mainEntity: personRef }} />
    <PortfolioContact locale={locale} />
  </>;
}
