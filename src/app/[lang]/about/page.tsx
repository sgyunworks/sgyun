import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";
import { portfolioProfile } from "@/lib/archive";
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
          </div>
        </div>
      </header>

      <div id="about-identity" className={styles.aboutGrid}>
        <section className={styles.panel}>
          <span className={styles.sectionLabel}>
            Identity
          </span>
          <p className={styles.identityName}>
            이석윤
            <br />
            <span>Seokyoon Lee</span>
          </p>
          <p className={styles.alias}>
            aka. {siteConfig.alias}
          </p>
        </section>

        <section className={`${styles.panel} ${styles.bodyCopy}`}>
          <p>
            {isKo
              ? "재료를 다룰 때와 코드를 작성할 때, 같은 질문에서 시작합니다. 이것은 왜 이렇게 작동해야 하는가."
              : "The same question begins both material work and code: why should this operate this way?"}
          </p>
          <p>
            {isKo
              ? "금속공예에서 배운 물성과 제작 감각, 산업디자인의 구조적 사고를 바탕으로 오브젝트·웹·앱을 실제 사용 가능한 상태까지 발전시킵니다."
              : "Material sensitivity from metal craft and structural thinking from industrial design guide objects, websites, and apps toward usable outcomes."}
          </p>
          <p>
            {isKo
              ? "분야를 넓히는 것이 목적이 아니라, 물리와 디지털 사이에서 아이디어가 작동하기 위해 필요한 수단을 직접 선택하고 연결하는 것이 작업 방식입니다."
              : "The goal is not breadth for its own sake, but choosing and connecting the means required for an idea to work across physical and digital contexts."}
          </p>
        </section>
      </div>

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
