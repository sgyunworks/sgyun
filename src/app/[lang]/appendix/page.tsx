import { notFound } from "next/navigation";
import { VaultAction } from "@/components/VaultAction";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import styles from "../EditorialPages.module.css";

export default async function AppendixPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const locale = lang as Locale;
  const isKo = locale === "ko";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header id="appendix-overview" className={styles.appendixHero}>
          <div className={styles.heroDatum} aria-hidden="true">
            <span>APPENDIX / RESERVED</span>
            <i />
            <b>00 RECORDS</b>
          </div>
          <div>
            <span className={styles.sectionLabel}>OPEN WHEN READY</span>
            <h1>APPENDIX</h1>
          </div>
        </header>

        <section
          id="appendix-state"
          className={styles.appendixState}
          aria-labelledby="appendix-state-title"
        >
          <span aria-hidden="true">00</span>
          <div>
            <h2 id="appendix-state-title">
              {isKo ? "아직 공개된 기록이 없습니다." : "No public records yet."}
            </h2>
            <p>
              {isKo
                ? "대표작의 흐름을 흐리지 않으면서 보조 실험, 과정과 보류 작업을 담기 위한 공간입니다. 선별과 검증이 끝난 뒤 항목을 엽니다."
                : "This space is reserved for supporting experiments, process, and held work without diluting the primary selection. Entries open after curation and verification."}
            </p>
          </div>
          <VaultAction
            href={`/${locale}/works`}
            code="INDEX_06"
            label={isKo ? "대표작 보기" : "View selected work"}
          />
        </section>
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
    title: "Appendix",
    description:
      locale === "ko"
        ? "SGYUN 포트폴리오의 보류·보조 기록을 위한 예약 공간."
        : "Reserved space for held and supporting SGYUN portfolio records.",
    alternates: {
      canonical: `/${locale}/appendix`,
      languages: { ko: "/ko/appendix", en: "/en/appendix" },
    },
  };
}
