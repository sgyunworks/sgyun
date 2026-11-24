import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { PortfolioHome } from "@/components/portfolio/Portfolio";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMetadata, toLocale } from "@/lib/seo";

const HOME = {
  ko: {
    title: "이석윤 SGYUN | Builder • Industrial Designer 포트폴리오",
    description: "빌더·산업디자이너 이석윤(SGYUN)의 포트폴리오. 제품을 디자인하고 직접 만들어 작동시킵니다. 대한민국디자인전람회 은상 VESA Based Floating Speaker, 디자인코리아 2026 NODE 휴머노이드 로봇·웹 시뮬레이터, Vibey 등.",
  },
  en: {
    title: "Seokyun Lee (SGYUN) | Builder • Industrial Designer Portfolio",
    description: "Portfolio of Seokyun Lee (SGYUN), industrial, metalcraft and AI creative designer in Seoul: VESA Based Floating Speaker (Korea Design Exhibition Silver Award), NODE humanoid robot for Design Korea 2026, Vibey and more.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  return pageMetadata({ locale, rest: "", absoluteTitle: true, ...HOME[locale] });
}

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
