import Link from "next/link";
import Image from "next/image";
import type { Locale, Dict } from "@/lib/i18n";
import { works, appendixWork } from "@/lib/works";

export function WorksGrid({ locale, t }: { locale: Locale; t: Dict }) {
  // 그리드 배치: WRGS(7col), DWC(5col) | Aviator(5col), V-CADO(7col) | Appendix(12col full)
  const layout = [
    "lg:col-span-7",
    "lg:col-span-5",
    "lg:col-span-5",
    "lg:col-span-7",
  ];

  return (
    <section
      id="works"
      className="px-6 md:px-12 py-20 md:py-32 bg-bg scroll-mt-24"
    >
      <div className="flex flex-col md:flex-row justify-between items-baseline gap-3 md:gap-12 mb-12 md:mb-20 max-w-wide mx-auto">
        <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
          {t.home.works.eyebrow}
        </span>
        <h2 className="font-display font-light tracking-tight text-5xl md:text-7xl lg:text-[88px] leading-none">
          {t.home.works.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-wide mx-auto">
        {works.map((work, i) => (
          <Link
            key={work.slug}
            href={`/${locale}/works/${work.slug}`}
            className={`group block ${layout[i]}`}
          >
            <div className="work-image-wrap relative overflow-hidden bg-black aspect-[4/3]">
              <Image
                src={work.thumbImage}
                alt={work.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain transition-all duration-700"
              />
            </div>
            <div className="flex justify-between items-baseline pt-5 pb-1 px-1 border-t border-line mt-4">
              <span className="text-[11px] tracking-[0.2em] text-muted">
                {work.number}
              </span>
              <div className="flex flex-col md:flex-row gap-1 md:gap-6 items-baseline">
                <span className="font-display text-lg md:text-[22px] font-normal tracking-tight">
                  {work.title}
                </span>
                <span className="text-xs text-muted hidden md:inline">
                  {work.subtitle[locale]}
                </span>
              </div>
              <span className="text-lg group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform inline-block">
                ↗
              </span>
            </div>
          </Link>
        ))}

        {/* Appendix — full width */}
        <div className="lg:col-span-12 mt-2">
          <div className="block">
            <div className="relative overflow-hidden bg-black aspect-[21/9]">
              <Image
                src={appendixWork.thumbImage}
                alt={appendixWork.title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="flex justify-between items-baseline pt-5 pb-1 px-1 border-t border-line mt-4">
              <span className="text-[11px] tracking-[0.2em] text-muted">
                {appendixWork.number} — Appendix
              </span>
              <div className="flex flex-col md:flex-row gap-1 md:gap-4 items-baseline">
                <span className="font-display text-lg md:text-[22px] font-normal tracking-tight">
                  {appendixWork.title}
                </span>
                <span className="text-xs text-muted hidden md:inline">
                  {appendixWork.subtitle[locale]}
                </span>
              </div>
              <span className="text-muted text-xs uppercase tracking-widest">
                Reference
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
