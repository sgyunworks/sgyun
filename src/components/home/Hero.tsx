import type { Dict } from "@/lib/i18n";

export function Hero({ t }: { t: Dict }) {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-32 pb-20 relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-end max-w-wide w-full mx-auto">
        <div className="fade-up">
          <h1 className="font-display font-normal leading-[0.9] tracking-tighter text-[80px] sm:text-[120px] md:text-[160px] lg:text-[clamp(140px,12vw,220px)]">
            SGYUN
          </h1>
          <span className="block w-20 h-1 bg-fg mt-3" />
          <p className="text-2xl md:text-[28px] font-light mt-5 tracking-tight">
            {t.home.hero.subtitle}
          </p>
        </div>

        <div
          className="max-w-md text-sm leading-[1.85] text-muted body-text fade-up"
          style={{ animationDelay: "0.15s", opacity: 0 }}
        >
          <p>{t.home.hero.intro1}</p>
          <p className="mt-4">{t.home.hero.intro2}</p>
        </div>
      </div>

      <div className="absolute bottom-8 md:bottom-12 left-6 md:left-12 right-6 md:right-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 text-[11px] tracking-[0.15em] text-muted uppercase">
        <span>SEOUL · {new Date().getFullYear()}</span>
        <span className="hidden md:flex items-center scroll-line">
          {t.home.hero.scroll}
        </span>
        <span>{t.home.hero.meta}</span>
      </div>
    </section>
  );
}
