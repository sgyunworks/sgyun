import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDict, locales } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;
  const t = getDict(validLang);

  return (
    <div className="min-h-[80vh] px-6 md:px-12 pt-32 md:pt-40 pb-20 md:pb-32">
      <div className="max-w-wide mx-auto">
        <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-6">
          {t.contact.eyebrow}
        </span>

        <h1 className="font-display font-light leading-[0.95] tracking-tighter text-[56px] sm:text-[80px] md:text-[120px] lg:text-[160px] mb-16 md:mb-20">
          {t.contact.headline1}
          <br />
          {t.contact.headline2}{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="border-b-2 border-transparent hover:border-fg transition-colors"
          >
            {t.contact.headline3}
          </a>
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 pt-10 border-t border-line">
          <Block label={t.contact.labelEmail}>
            <a
              href={`mailto:${siteConfig.email}`}
              className="hover:opacity-60 transition-opacity break-all"
            >
              {siteConfig.email}
            </a>
          </Block>
          <Block label={t.contact.labelInstagram}>
            <a
              href={siteConfig.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-60 transition-opacity"
            >
              {siteConfig.instagram.handle}
            </a>
          </Block>
          <Block label={t.contact.labelName}>
            <span>{siteConfig.fullName.ko} / {siteConfig.fullName.en}</span>
          </Block>
          <Block label={t.contact.labelLocation}>
            <span>{t.contact.locationValue}</span>
          </Block>
        </div>
      </div>
    </div>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-2.5">
        {label}
      </span>
      <span className="block text-sm md:text-[15px] text-fg">{children}</span>
    </div>
  );
}

export function generateMetadata() {
  return {
    title: "Contact",
  };
}
