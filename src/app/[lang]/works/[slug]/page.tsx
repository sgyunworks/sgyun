import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDict, locales } from "@/lib/i18n";
import { works, getWork, getNextWork } from "@/lib/works";

export function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  for (const lang of locales) {
    for (const work of works) {
      params.push({ lang, slug: work.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug, lang } = await params;
  const work = getWork(slug);
  if (!work) return {};
  const validLang = (locales as readonly string[]).includes(lang)
    ? (lang as Locale)
    : "ko";
  return {
    title: work.title,
    description: work.subtitle[validLang],
  };
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;

  const work = getWork(slug);
  if (!work) notFound();

  const t = getDict(validLang);
  const next = getNextWork(slug);

  // 갤러리 그리드 클래스 매핑
  const aspectClass = {
    full: "lg:col-span-12 aspect-[21/9]",
    half: "lg:col-span-6 aspect-[4/3]",
    third: "lg:col-span-4 aspect-square",
    "two-thirds": "lg:col-span-8 aspect-[16/10]",
  };

  return (
    <>
      {/* Hero 섹션 */}
      <section className="px-6 md:px-12 pt-32 md:pt-36 pb-12 md:pb-16 border-b border-line">
        <div className="max-w-wide mx-auto">
          <div className="flex gap-3 text-[11px] tracking-[0.2em] text-muted uppercase mb-8 md:mb-10 flex-wrap">
            <Link href={`/${validLang}`} className="hover:text-fg transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/${validLang}/works`}
              className="hover:text-fg transition-colors"
            >
              Works
            </Link>
            <span>/</span>
            <span className="text-fg">{work.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 lg:gap-16">
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-light leading-[0.9] tracking-tighter text-[80px] sm:text-[120px] md:text-[160px] lg:text-[14vw] xl:text-[200px] break-words">
                {work.title}
              </h1>
              <p className="text-lg md:text-[22px] font-light text-muted mt-4 tracking-tight body-text">
                {work.subtitle[validLang]}
              </p>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-xs md:text-sm shrink-0">
              <Meta label={t.works.year} value={work.year} />
              <Meta label={t.works.material} value={work.material[validLang]} />
              <Meta label={t.works.role} value={work.role[validLang]} />
              <Meta label={t.works.type} value={work.type[validLang]} />
              {work.team && <Meta label={t.works.team} value={work.team[validLang]} />}
            </div>
          </div>
        </div>
      </section>

      {/* Hero 이미지 */}
      <div className="relative w-full h-[60vh] md:h-[90vh] bg-[#1a1a1a] overflow-hidden">
        <Image
          src={work.heroImage}
          alt={work.title}
          fill
          sizes="100vw"
          priority
          className="object-contain"
        />
      </div>

      {/* Description */}
      <section className="px-6 md:px-12 py-20 md:py-32 border-b border-line">
        <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-32">
          <div>
            <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-4">
              {t.works.concept}
            </span>
            <h2 className="font-display font-light leading-[1.1] tracking-tight text-3xl md:text-5xl">
              {work.conceptHeadline[validLang]}
              <em className="not-italic block text-muted">
                {work.conceptHeadlineSub[validLang]}
              </em>
            </h2>
          </div>

          <div className="lg:col-span-2 body-text text-base md:text-[16px] leading-[1.85]">
            {work.body[validLang].map((paragraph, i) => (
              <p
                key={i}
                className={i === 0 ? "text-lg md:text-[19px] leading-[1.7] mb-6 md:mb-8" : "mt-6"}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      {work.gallery.length > 0 && (
        <section className="px-6 md:px-12 pb-20 md:pb-32 pt-12 md:pt-16">
          <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {work.gallery.map((item, i) => (
              <div
                key={i}
                className={`relative overflow-hidden bg-[#1a1a1a] ${aspectClass[item.aspect]}`}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Video Section */}
      {work.video && (
        <section className="px-6 md:px-12 py-20 md:py-32 bg-[#050505] border-t border-b border-line">
          <div className="max-w-wide mx-auto">
            <div className="flex justify-between items-baseline mb-10 md:mb-12">
              <h3 className="font-display text-3xl md:text-5xl font-light tracking-tight">
                {t.works.inMotion}
              </h3>
              <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
                — {t.works.processVideo}
              </span>
            </div>
            <a
              href={work.video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative aspect-video bg-[#1a1a1a] border border-line overflow-hidden"
            >
              <Image
                src={work.video.thumb}
                alt={work.title}
                fill
                sizes="100vw"
                className="object-contain opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg/30 group-hover:bg-bg/10 transition-colors">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-fg/80 flex items-center justify-center bg-bg/40 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <svg
                    width="20"
                    height="22"
                    viewBox="0 0 20 22"
                    fill="none"
                    className="ml-1"
                  >
                    <path d="M0 0L20 11L0 22V0Z" fill="#f4f4f4" />
                  </svg>
                </div>
                <span className="text-xs tracking-[0.2em] uppercase text-fg/90">
                  {t.works.viewOnInstagram}
                </span>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Next Project */}
      <section className="px-6 md:px-12 py-20 md:py-32">
        <div className="max-w-wide mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-4">
              {t.works.next} · {next.number}
            </span>
            <Link
              href={`/${validLang}/works/${next.slug}`}
              className="group font-display font-light tracking-tight text-5xl md:text-7xl lg:text-[120px] leading-[0.95] inline-flex items-center gap-6 md:gap-8 transition-all"
            >
              {next.title}
              <span className="text-[0.7em] group-hover:translate-x-2 transition-transform">
                →
              </span>
            </Link>
          </div>
          <Link
            href={`/${validLang}/works`}
            className="text-sm tracking-wider text-muted hover:text-fg transition-colors"
          >
            ← {t.works.back}
          </Link>
        </div>
      </section>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-[10px] tracking-[0.2em] text-muted uppercase pt-0.5">
        {label}
      </span>
      <span className="text-fg body-text">{value}</span>
    </>
  );
}
