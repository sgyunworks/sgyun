import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { PortfolioProfile } from "@/components/portfolio/Portfolio";
import { JsonLd } from "@/components/JsonLd";
import { abs, breadcrumbJsonLd, pageMetadata, personRef, toLocale } from "@/lib/seo";
import { portfolioUpdatedAt } from "@/lib/archive";

const ABOUT = {
  ko: {
    title: "프로필 — 학력·수상·전시·경력",
    description: "이석윤(Seokyun Lee, SGYUN) 프로필. 서울과학기술대학교 산업디자인·금속공예디자인 전공, 한국디자인진흥원 AI Creative Designer, 제61회 대한민국디자인전람회 은상, 디자인코리아 2026 NODE 참여.",
    crumb: "프로필",
  },
  en: {
    title: "Profile — Education, Awards, Exhibitions & Experience",
    description: "Profile of Seokyun Lee (이석윤, SGYUN): SeoulTech industrial and metalcraft design, AI Creative Designer at KIDP, Silver Award at the 61st Korea Design Exhibition, NODE at Design Korea 2026.",
    crumb: "Profile",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  return pageMetadata({ locale, rest: "/about", type: "profile", title: ABOUT[locale].title, description: ABOUT[locale].description, images: [{ url: "/portfolio-a/portrait.webp", width: 478, height: 603, alt: "Seokyun Lee" }] });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const locale = lang as Locale;
  const url = abs(`/${locale}/about`);
  return <>
    <JsonLd data={[
      { "@type": "ProfilePage", "@id": `${url}#page`, url, name: ABOUT[locale].title, description: ABOUT[locale].description, inLanguage: locale === "ko" ? "ko-KR" : "en", dateModified: portfolioUpdatedAt, mainEntity: personRef, about: personRef },
      breadcrumbJsonLd([{ name: "SGYUN", path: `/${locale}` }, { name: ABOUT[locale].crumb, path: `/${locale}/about` }]),
    ]} />
    <PortfolioProfile locale={locale} />
  </>;
}
