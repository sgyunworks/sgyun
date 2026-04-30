import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDict, locales } from "@/lib/i18n";
import { works, appendixWork } from "@/lib/works";

export default async function WorksPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;
  const t = getDict(validLang);

  return (
    <div className="px-6 md:px-12 pt-32 md:pt-40 pb-20 md:pb-32">
      <div className="max-w-wide mx-auto mb-12 md:mb-20">
        <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-4">
          {t.works.eyebrow}
        </span>
        <h1 className="font-display font-light leading-[0.9] tracking-tighter text-7xl md:text-9xl lg:text-[180px]">
          {t.works.title}
        </h1>
      </div>

      <div className="max-w-wide mx-auto space-y-16 md:space-y-24">
        {works.map((work, i) => (
          <Link
            key={work.slug}
            href={`/${validLang}/works/${work.slug}`}
            className="group block"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
              <div
                className={`work-image-wrap relative overflow-hidden bg-[#1a1a1a] aspect-[4/3] ${
                  i % 2 === 0
                    ? "lg:col-span-8 lg:col-start-1"
                    : "lg:col-span-8 lg:col-start-5"
                }`}
              >
                <Image
                  src={work.thumbImage}
                  alt={work.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-contain transition-all duration-700"
                />
              </div>

              <div
                className={`flex flex-col gap-3 lg:col-span-3 ${
                  i % 2 === 0 ? "lg:col-start-10" : "lg:col-start-2 lg:row-start-1"
                }`}
              >
                <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
                  {work.number} · {work.year}
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-light tracking-tight">
                  {work.title}
                </h2>
                <p className="text-sm text-muted body-text leading-relaxed">
                  {work.subtitle[validLang]}
                </p>
                <span className="inline-flex items-center gap-2 mt-2 text-sm tracking-wider group-hover:gap-3 transition-all">
                  View <span>→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}

        {/* Appendix */}
        <div className="pt-12 mt-12 border-t border-line">
          <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-8">
            Appendix
          </span>
          <div className="relative overflow-hidden bg-[#1a1a1a] aspect-[21/9]">
            <Image
              src={appendixWork.thumbImage}
              alt={appendixWork.title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="mt-5 flex flex-col md:flex-row justify-between items-baseline gap-2">
            <h3 className="font-display text-2xl md:text-3xl font-light tracking-tight">
              {appendixWork.title}
            </h3>
            <p className="text-sm text-muted body-text">
              {appendixWork.subtitle[validLang]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function generateMetadata() {
  return {
    title: "Works",
  };
}
