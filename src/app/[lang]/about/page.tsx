import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import {
  archiveProjects,
  localizeArchiveProject,
  portfolioProfile,
} from "@/lib/archive";
import { SafeImage } from "@/components/SafeImage";
import { VaultAction } from "@/components/VaultAction";
import styles from "../EditorialPages.module.css";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const validLang = lang as Locale;
  const isKo = validLang === "ko";
  const proofSource =
    archiveProjects.find((project) => project.slug === "the-aviator") ??
    archiveProjects[0];
  const proof = localizeArchiveProject(proofSource, validLang);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
      <header id="about-profile" className={styles.hero}>
        <div className={styles.heroDatum} aria-hidden="true">
          <span>ABOUT / SGYUN</span>
          <i />
          <b>PROFILE / 01</b>
        </div>
        <div className={styles.heroComposition}>
          <h1>ABOUT</h1>
          <div className={styles.heroThesis}>
            <span className={styles.sectionLabel}>{portfolioProfile.title[validLang]}</span>
            <p>{portfolioProfile.summary[validLang]}</p>
            <div className={styles.heroIdentity} aria-label="Seokyoon Lee, Seoul">
              <span>SEOKYOON LEE</span>
              <i aria-hidden="true" />
              <span>SEOUL</span>
            </div>
            <Link
              href={`/${validLang}/works/${proof.slug}`}
              className={styles.aboutProof}
            >
              <span className={styles.aboutProofMedia}>
                <SafeImage
                  src={proof.heroImage}
                  alt={proof.imageAltText}
                  fill
                  priority
                  sizes="(max-width: 640px) calc(100vw - 90px), 38vw"
                  className={styles.aboutProofImage}
                  style={{ objectPosition: proof.imagePosition }}
                />
              </span>
              <span>
                <small>{proof.number}</small>
                <strong>{proof.title}</strong>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <section id="about-education" className={styles.widePanel}>
        <div>
          <span className={styles.sectionLabel}>
            Education
          </span>
          <h2 className={styles.panelHeading}>
            {isKo ? "교육" : "Education"}
          </h2>
        </div>
        <div className={styles.educationList}>
          {portfolioProfile.education.map((line) => (
            <p key={line.en}>{line[validLang]}</p>
          ))}
        </div>
      </section>

      <section id="about-practice" className={styles.widePanel}>
        <div>
          <span className={styles.sectionLabel}>
            Practice
          </span>
          <h2 className={styles.panelHeading}>
            {isKo ? "작업 축" : "Working modes"}
          </h2>
        </div>
        <div className={styles.practiceList}>
          {portfolioProfile.practices.map((practice) => (
            <article key={practice.code}>
              <small>{practice.code}</small>
              <h3>{practice.title[validLang]}</h3>
              <p>{practice.body[validLang]}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about-records" className={styles.recordSection}>
        <div className={styles.recordColumn}>
          <header>
            <span className={styles.sectionLabel}>Recognition</span>
            <b>{String(portfolioProfile.recognitions.length).padStart(2, "0")}</b>
          </header>
          <ol>
            {portfolioProfile.recognitions.map((item) => (
              <li key={`${item.year}-${item.title.en}`}>
                <time>{item.year}</time>
                <span>
                  <strong>{item.title[validLang]}</strong>
                  <small>{item.result[validLang]}</small>
                  {item.note[validLang] !== (isKo ? "확정" : "Confirmed") ? (
                    <em>{item.note[validLang]}</em>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.recordColumn}>
          <header>
            <span className={styles.sectionLabel}>Activity</span>
            <b>{String(portfolioProfile.activities.length).padStart(2, "0")}</b>
          </header>
          <ol>
            {portfolioProfile.activities.map((item) => (
              <li key={`${item.year}-${item.title.en}`}>
                <time>{item.year}</time>
                <span>
                  <strong>{item.title[validLang]}</strong>
                  <small>{item.detail[validLang]}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div id="about-contact" className={styles.aboutContact}>
        <p>
          {isKo
            ? "제품, 인터페이스, 전시와 협업에 관한 대화를 열어두고 있습니다."
            : "Open to conversations around products, interfaces, exhibitions, and collaboration."}
        </p>
        <VaultAction
          href={`/${validLang}/contact`}
          code="CONTACT_01"
          label={isKo ? "연락하기" : "Contact"}
        />
      </div>
      </div>
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
    title: "About",
    alternates: {
      canonical: `/${locale}/about`,
      languages: { ko: "/ko/about", en: "/en/about" },
    },
  };
}
