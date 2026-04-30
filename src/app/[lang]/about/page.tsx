import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDict, locales } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

export default async function AboutPage({
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
      {/* Hero */}
      <div className="max-w-wide mx-auto mb-20 md:mb-32">
        <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-6">
          {t.about.eyebrow}
        </span>
        <h1 className="font-display font-light leading-[0.9] tracking-tighter text-7xl md:text-9xl lg:text-[180px]">
          {t.about.title}
        </h1>
      </div>

      {/* Identity + main copy */}
      <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-32 mb-20 md:mb-32">
        <div className="lg:col-span-1">
          <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-4">
            Identity
          </span>
          <p className="font-display text-2xl md:text-3xl font-light tracking-tight leading-snug">
            이석윤
            <br />
            <span className="text-muted">Seokyoon Lee</span>
          </p>
          <p className="mt-3 text-sm tracking-wider text-muted">
            aka. {siteConfig.alias}
          </p>
        </div>

        <div className="lg:col-span-2 body-text text-base md:text-[17px] leading-[1.85]">
          <p className="text-lg md:text-[20px] leading-[1.7] mb-6">
            {t.home.about.headline} {t.home.about.headlineSub}
          </p>
          <p>{t.home.hero.intro1}</p>
          <p className="mt-5">{t.home.hero.intro2}</p>
          <p className="mt-5">{t.home.about.body1}</p>
          <p className="mt-5">{t.home.about.body2}</p>
        </div>
      </div>

      {/* Education */}
      <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-32 mb-20 md:mb-32 pt-12 md:pt-16 border-t border-line">
        <div>
          <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-4">
            Education
          </span>
          <h3 className="font-display text-2xl md:text-3xl font-light tracking-tight">
            {t.about.sectionEducation}
          </h3>
        </div>
        <div className="lg:col-span-2 body-text text-base md:text-[17px] leading-[1.85] space-y-2">
          {siteConfig.education[validLang].map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-32 pt-12 md:pt-16 border-t border-line">
        <div>
          <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-4">
            Skills
          </span>
          <h3 className="font-display text-2xl md:text-3xl font-light tracking-tight">
            {t.about.sectionSkills}
          </h3>
        </div>
        <div className="lg:col-span-2">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 list-none">
            {siteConfig.skills.map((skill) => (
              <li
                key={skill}
                className="font-display text-base md:text-lg tracking-tight border-b border-line pb-2 flex items-baseline gap-3"
              >
                <span className="text-[10px] tracking-[0.2em] text-muted">
                  ·
                </span>
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function generateMetadata() {
  return {
    title: "About",
  };
}
