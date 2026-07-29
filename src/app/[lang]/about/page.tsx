import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDict, locales } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";
import styles from "../EditorialPages.module.css";

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
    <div className={styles.page}>
      <div className={styles.shell}>
      <header className={styles.hero}>
        <span className={styles.sectionLabel}>
          {t.about.eyebrow}
        </span>
        <h1>
          {t.about.title}
        </h1>
      </header>

      <div className={styles.aboutGrid}>
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
            {t.home.about.headline} {t.home.about.headlineSub}
          </p>
          <p>{t.home.hero.intro1}</p>
          <p>{t.home.hero.intro2}</p>
          <p>{t.home.about.body1}</p>
          <p>{t.home.about.body2}</p>
        </section>
      </div>

      <section className={styles.widePanel}>
        <div>
          <span className={styles.sectionLabel}>
            Education
          </span>
          <h2 className={styles.panelHeading}>
            {t.about.sectionEducation}
          </h2>
        </div>
        <div className={styles.educationList}>
          {siteConfig.education[validLang].map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className={styles.widePanel}>
        <div>
          <span className={styles.sectionLabel}>
            Skills
          </span>
          <h2 className={styles.panelHeading}>
            {t.about.sectionSkills}
          </h2>
        </div>
        <div>
          <ul className={styles.skillGrid}>
            {siteConfig.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      </section>
      </div>
    </div>
  );
}

export function generateMetadata() {
  return {
    title: "About",
  };
}
