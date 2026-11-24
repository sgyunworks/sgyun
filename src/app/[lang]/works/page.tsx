import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioHome } from "@/components/portfolio/Portfolio";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { JsonLd } from "@/components/JsonLd";
import { abs, breadcrumbJsonLd, pageMetadata, personRef, publishedWorks, toLocale } from "@/lib/seo";

const WORKS = {
  ko: {
    title: "작품 — VESA 플로팅 스피커, NODE 휴머노이드, Vibey 외",
    description: "이석윤(SGYUN)의 대표 작품: VESA Based Floating Speaker, 디자인코리아 2026 NODE 휴머노이드 로봇 웹 시뮬레이터, Vibey & Vibey Deck, The Aviator, WRGS, Double Wishbone Chair, CINDER.",
    crumb: "작품",
  },
  en: {
    title: "Selected Works — VESA Floating Speaker, NODE Humanoid, Vibey & More",
    description: "Selected works by Seokyun Lee (SGYUN): VESA Based Floating Speaker, NODE humanoid robot web simulator for Design Korea 2026, Vibey & Vibey Deck, The Aviator, WRGS, Double Wishbone Chair and CINDER.",
    crumb: "Works",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  return pageMetadata({ locale, rest: "/works", title: WORKS[locale].title, description: WORKS[locale].description });
}

export default async function WorksPage({
  params,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const locale = lang as Locale;
  const url = abs(`/${locale}/works`);
  const items = [
    ...publishedWorks.map((p) => ({ name: p.title, url: abs(`/${locale}/works/${p.slug}`) })),
    { name: "NODE", url: abs("/node") },
  ];

  return <>
    <JsonLd data={[
      {
        "@type": "CollectionPage", "@id": `${url}#page`, url, name: WORKS[locale].title, description: WORKS[locale].description,
        inLanguage: locale === "ko" ? "ko-KR" : "en", author: personRef,
        mainEntity: { "@type": "ItemList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: it.url })) },
      },
      breadcrumbJsonLd([{ name: "SGYUN", path: `/${locale}` }, { name: WORKS[locale].crumb, path: `/${locale}/works` }]),
    ]} />
    <PortfolioHome locale={locale} indexOnly />
  </>;
}
