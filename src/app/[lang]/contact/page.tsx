import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDict, locales } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";
import styles from "../EditorialPages.module.css";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;
  const t = getDict(validLang);
  const isKo = validLang === "ko";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header id="contact-intro" className={styles.contactHero}>
        <span className={styles.sectionLabel}>
          {t.contact.eyebrow}
        </span>

        <div className={styles.contactLead}>
          <h1>
            {t.contact.headline1}
            <br />
            {t.contact.headline2}{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className={styles.contactAction}
            >
              {t.contact.headline3}
            </a>
          </h1>
          <p>
            {isKo
              ? "물리적 제품, 디지털 제품, 전시와 실험적 협업까지 형식에 제한 없이 이야기할 수 있습니다."
              : "Open to physical products, digital products, exhibitions, and experimental collaborations."}
          </p>
        </div>
        </header>

        <div id="contact-channels" className={styles.contactGrid}>
          <Block label={t.contact.labelEmail}>
            <a
              href={`mailto:${siteConfig.email}`}
            >
              {siteConfig.email}
            </a>
          </Block>
          <Block label={t.contact.labelInstagram}>
            <a
              href={siteConfig.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
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
    <div className={styles.contactBlock}>
      <span>
        {label}
      </span>
      <span>{children}</span>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (locales as readonly string[]).includes(lang) ? lang : "ko";
  return {
    title: "Contact",
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { ko: "/ko/contact", en: "/en/contact" },
    },
  };
}
