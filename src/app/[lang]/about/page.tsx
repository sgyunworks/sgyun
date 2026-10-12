import {notFound} from "next/navigation";
import {locales,type Locale} from "@/lib/i18n";
import {PortfolioProfile} from "@/components/portfolio/Portfolio";
export default async function Page({params}:{params:Promise<{lang:string}>}) {const {lang}=await params;if(!(locales as readonly string[]).includes(lang))notFound();return <PortfolioProfile locale={lang as Locale}/>;}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (locales as readonly string[]).includes(lang) ? lang : "ko";
  return {
    title: "About",
    alternates: {
      canonical: `/${locale}/about`,
      languages: { ko: "/ko/about", en: "/en/about" },
    },
  };
}
