// Search and AI-engine metadata shared by route files: titles, canonical/hreflang, Open Graph and JSON-LD.
// Facts come from src/content/portfolio.json (via archive.ts) and site-config.ts, so nothing here is hand-copied.
import type { Metadata } from "next";
import { siteConfig } from "./site-config";
import { archiveProjects, localizeArchiveProject, portfolioProfile, portfolioUpdatedAt, type ArchiveProject } from "./archive";
import { locales, type Locale } from "./i18n";

export const SITE_URL = siteConfig.url;
export const OG_DEFAULT = { url: "/opengraph-image", width: 1200, height: 630, alt: "SGYUN — Builder • Industrial Designer" };
export const NODE_SIM_URL = "https://humanoid-sim.vercel.app";

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
export const toLocale = (v: string): Locale => (isLocale(v) ? v : "ko");
export const abs = (path: string) => new URL(path, SITE_URL).toString();

export const brandName: Record<Locale, string> = { ko: "이석윤 SGYUN", en: "Seokyun Lee · SGYUN" };

/** `/ko/x` + `/en/x` alternates with x-default → Korean (the default locale). `rest` starts with "/" or is "". */
export function localeAlternates(locale: Locale, rest: string): Metadata["alternates"] {
  return {
    canonical: `/${locale}${rest}`,
    languages: { ko: `/ko${rest}`, en: `/en${rest}`, "x-default": `/ko${rest}` },
  };
}

type PageMetaInput = {
  locale: Locale;
  rest: string;
  title: string;
  description: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  absoluteTitle?: boolean;
  type?: "website" | "article" | "profile";
};

/** Full metadata for a localized page. Open Graph / Twitter objects are complete because Next replaces, not merges, them. */
export function pageMetadata({ locale, rest, title, description, images, absoluteTitle, type = "website" }: PageMetaInput): Metadata {
  const shareTitle = absoluteTitle ? title : `${title} | ${brandName[locale]}`;
  const img = images?.length ? images : [OG_DEFAULT];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: localeAlternates(locale, rest),
    openGraph: {
      type,
      siteName: "SGYUN",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      alternateLocale: locale === "ko" ? ["en_US"] : ["ko_KR"],
      url: `/${locale}${rest}`,
      title: shareTitle,
      description,
      images: img,
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: img.map((i) => i.url) },
  };
}

/** Trim to a search-snippet length at a word/sentence boundary. */
export function snippet(text: string, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("다. "), cut.lastIndexOf(" "));
  return `${cut.slice(0, stop > max * 0.6 ? stop + 1 : max).trim()}…`;
}

export const workTitle = (p: ArchiveProject, locale: Locale) => {
  const sub = p.detailSummary?.[locale]?.replace(/\.$/, "");
  return sub ? `${p.title} — ${sub}` : p.title;
};

export const workDescription = (p: ArchiveProject, locale: Locale) => snippet(`${p.description[locale].replace(/\.$/, "")}. ${p.detailIntro[locale]}`, 160);

// ---------- JSON-LD ----------

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const awardText = (locale: Locale) =>
  portfolioProfile.recognitions.map((r) => `${r.year} ${r.title[locale]} — ${r.result[locale]} (${r.note[locale]})`);

export function personJsonLd(locale: Locale) {
  const ko = locale === "ko";
  const p = portfolioProfile;
  const current = p.activities.find((a) => /현재/.test(a.year) && /Design Promotion/.test(a.title.en));
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: p.name[locale],
    alternateName: [ko ? p.name.en : p.name.ko, siteConfig.alias],
    givenName: ko ? "석윤" : "Seokyun",
    familyName: ko ? "이" : "Lee",
    url: SITE_URL,
    image: abs("/portfolio-a/portrait.webp"),
    email: `mailto:${siteConfig.email}`,
    jobTitle: ko
      ? ["빌더", "산업디자이너", "Builder", "Industrial Designer"]
      : ["Builder", "Industrial Designer"],
    description: p.summary[locale],
    address: { "@type": "PostalAddress", addressLocality: ko ? "서울" : "Seoul", addressCountry: "KR" },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: ko ? "서울과학기술대학교" : "Seoul National University of Science and Technology (SeoulTech)",
      alternateName: ko ? "Seoul National University of Science and Technology" : "서울과학기술대학교",
      url: "https://www.seoultech.ac.kr",
    },
    hasCredential: p.education.map((e) => ({ "@type": "EducationalOccupationalCredential", name: e[locale] })),
    ...(current
      ? {
          worksFor: {
            "@type": "Organization",
            name: current.title[locale],
            alternateName: ko ? current.title.en : "한국디자인진흥원",
            url: "https://www.kidp.or.kr",
          },
        }
      : {}),
    award: awardText(locale),
    knowsAbout: ko
      ? ["산업디자인", "제품디자인", "금속공예", "금속 성형·TIG 용접", "프로토타입 제작", "3D 모델링 (Rhino, Fusion 360, Blender, KeyShot)", "Arduino", "생성형 AI 디자인", "AI 기반 웹 개발", "휴머노이드 로봇 디자인", "Three.js 웹 시뮬레이터"]
      : ["Industrial design", "Product design", "Metalcraft", "Metal forming and TIG welding", "Physical prototyping", "3D modeling (Rhino, Fusion 360, Blender, KeyShot)", "Arduino", "Generative AI design", "AI-assisted web development", "Humanoid robot design", "Three.js web simulation"],
    sameAs: [siteConfig.instagram.url],
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: "SGYUN",
    alternateName: [`${portfolioProfile.name.ko} 포트폴리오`, `${portfolioProfile.name.en} Portfolio`],
    description: siteConfig.description[locale],
    inLanguage: ["ko-KR", "en"],
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

export const personRef = { "@id": PERSON_ID };

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function workJsonLd(p: ArchiveProject, locale: Locale) {
  const item = localizeArchiveProject(p, locale);
  const url = abs(`/${locale}/works/${p.slug}`);
  const keywords = [item.categoryText, ...item.roleText.split(" · ").map((s) => s.trim()), ...p.detailChapters.map((c) => c.title.en)];
  const awards = portfolioProfile.recognitions.filter((r) => r.note.en === p.title).map((r) => `${r.year} ${r.title[locale]} — ${r.result[locale]}`);
  return {
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    url,
    name: p.title,
    headline: workTitle(p, locale),
    alternativeHeadline: p.description[locale],
    description: [p.detailIntro[locale], ...item.chapterTexts.map((c) => c.body)].join(" "),
    abstract: item.detailSummaryText,
    image: { "@type": "ImageObject", url: abs(p.heroImage), caption: item.imageAltText },
    creator: personRef,
    author: personRef,
    ...(p.year ? { dateCreated: p.year } : {}),
    genre: item.categoryText,
    keywords: Array.from(new Set(keywords)).join(", "),
    creativeWorkStatus: item.statusText,
    inLanguage: locale === "ko" ? "ko-KR" : "en",
    ...(awards.length ? { award: awards } : {}),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
  };
}

/** Facts for the NODE simulator (exhibition entry in portfolio.json). */
export function nodeJsonLd() {
  const ex = portfolioProfile.exhibitions.find((e) => e.href === "/node");
  return {
    "@type": "CreativeWork",
    "@id": `${SITE_URL}/node#work`,
    url: abs("/node"),
    name: "NODE",
    alternateName: ["NODE 휴머노이드 로봇", "NODE humanoid robot web simulator"],
    description: ex
      ? `${ex.title.ko} · ${ex.detail.ko} / ${ex.title.en} · ${ex.detail.en}`
      : "디자인코리아 2026 NODE 휴머노이드 로봇 웹 시뮬레이터",
    image: abs("/node/og.jpg"),
    // Official credit is "AI Builder & Designer" in a team project, so he is a contributor, not the sole creator.
    contributor: { "@type": "Role", roleName: "AI Builder & Designer", contributor: personRef },
    dateCreated: "2026",
    keywords: "NODE, humanoid robot, 휴머노이드 로봇, Design Korea 2026, 디자인코리아 2026, web simulator, Three.js, Blender, Claude Code",
    isPartOf: { "@id": WEBSITE_ID },
    sameAs: NODE_SIM_URL,
  };
}

export const portfolioLastModified = portfolioUpdatedAt; // "YYYY-MM-DD" (W3C date) as written in portfolio.json
export const publishedWorks = archiveProjects;
