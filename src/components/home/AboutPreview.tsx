import Link from "next/link";
import type { Locale, Dict } from "@/lib/i18n";

export function AboutPreview({ locale, t }: { locale: Locale; t: Dict }) {
  return (
    <section
      id="about"
      className="px-6 md:px-12 py-20 md:py-32 bg-bg border-t border-line scroll-mt-24"
    >
      <div className="flex flex-col md:flex-row justify-between items-baseline gap-3 md:gap-12 mb-12 md:mb-20 max-w-wide mx-auto">
        <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
          {t.home.about.eyebrow}
        </span>
        <h2 className="font-display font-light tracking-tight text-5xl md:text-7xl lg:text-[88px] leading-none">
          {t.home.about.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-32 max-w-wide mx-auto">
        <h3 className="font-display font-light leading-[1.15] tracking-tight text-4xl md:text-5xl lg:text-[56px]">
          {t.home.about.headline}
          <em className="not-italic block mt-2 text-muted">
            {t.home.about.headlineSub}
          </em>
        </h3>

        <div>
          <div className="text-[15px] leading-[1.85] body-text">
            <p>{t.home.about.body1}</p>
            <p className="mt-5">{t.home.about.body2}</p>
          </div>

          <Link
            href={`/${locale}/about`}
            className="group inline-flex items-center gap-3 mt-8 font-display text-sm tracking-wider border-b border-line pb-2 hover:border-fg transition-all"
          >
            {t.home.about.more}
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
