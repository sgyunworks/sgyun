import portfolioSource from "@/content/portfolio.json";
import type { Locale } from "./i18n";

export type LocalizedText = Record<Locale, string>;
export type ArchiveCategory = "physical" | "digital" | "systems";
export type PublishStatus = "draft" | "published";
export type ProjectStage = "completed" | "active" | "concept";

export type ArchiveMedia = {
  src: string;
  alt: LocalizedText;
  aspectRatio: number;
  fit?: "cover" | "contain";
  tone?: "dark" | "light";
  position?: string;
};

export type ArchiveChapter = {
  code: string;
  title: LocalizedText;
  body: LocalizedText;
};

export type ArchiveProjectSource = {
  id: string;
  slug: string;
  order: number;
  status: PublishStatus;
  stage: ProjectStage;
  title: string;
  year: string;
  category: ArchiveCategory;
  description: LocalizedText;
  role: LocalizedText;
  heroImage: string;
  heroAspectRatio: number;
  imageAlt: LocalizedText;
  imageFit?: "cover" | "contain";
  imageTone?: "dark" | "light";
  imagePosition?: string;
  detailMedia?: ArchiveMedia[];
  detailIntro: LocalizedText;
  detailChapters: ArchiveChapter[];
};

export type ArchiveProject = ArchiveProjectSource & {
  number: string;
  provisional: false;
};

export type PortfolioProfile = {
  name: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  education: LocalizedText[];
  practices: Array<{
    code: string;
    title: LocalizedText;
    body: LocalizedText;
  }>;
  recognitions: Array<{
    year: string;
    title: LocalizedText;
    result: LocalizedText;
    note: LocalizedText;
  }>;
  activities: Array<{
    year: string;
    title: LocalizedText;
    detail: LocalizedText;
  }>;
};

export type PortfolioSource = {
  version: number;
  updatedAt: string;
  profile: PortfolioProfile;
  projects: ArchiveProjectSource[];
};

const portfolio = portfolioSource as PortfolioSource;

export const portfolioProfile = portfolio.profile;
export const portfolioUpdatedAt = portfolio.updatedAt;

export const archiveCategoryOrder: ArchiveCategory[] = [
  "physical",
  "digital",
  "systems",
];

export const archiveCategories: Record<
  ArchiveCategory,
  {
    code: string;
    title: LocalizedText;
    description: LocalizedText;
    intro: LocalizedText;
    chapters: ArchiveChapter[];
  }
> = {
  physical: {
    code: "P",
    title: { ko: "Physical", en: "Physical" },
    description: {
      ko: "재료, 구조, 메커니즘과 제작을 다루는 물리적 작업.",
      en: "Physical work across material, structure, mechanism, and fabrication.",
    },
    intro: {
      ko: "형태를 장식으로 분리하지 않고 재료, 결합과 작동 방식의 결과로 기록한다.",
      en: "Form is recorded as the outcome of material, assembly, and behavior rather than styling alone.",
    },
    chapters: [],
  },
  digital: {
    code: "D",
    title: { ko: "Digital", en: "Digital" },
    description: {
      ko: "입력, 상태, 데이터와 결과를 연결하는 웹·앱 제품.",
      en: "Web and app products connecting input, state, data, and outcomes.",
    },
    intro: {
      ko: "화면의 모양보다 사용자의 선택이 실제 결과까지 이어지는 제품 구조를 기록한다.",
      en: "Digital cases focus on how a user decision travels through the product to a real outcome.",
    },
    chapters: [],
  },
  systems: {
    code: "S",
    title: { ko: "Systems", en: "Systems" },
    description: {
      ko: "제품, 서비스와 운영 흐름을 함께 설계하는 시스템 작업.",
      en: "Systems work connecting products, services, and operational flows.",
    },
    intro: {
      ko: "개별 물체보다 여러 기능과 참여자가 어떤 순서로 연결되는지 보여준다.",
      en: "The case shows how functions and participants connect rather than treating the object in isolation.",
    },
    chapters: [],
  },
};

export const archiveProjects: ArchiveProject[] = portfolio.projects
  .filter((project) => project.status === "published")
  .sort((a, b) => a.order - b.order)
  .map((project, index) => ({
    ...project,
    number: String(index + 1).padStart(2, "0"),
    provisional: false,
  }));

export function isArchiveCategory(value: string): value is ArchiveCategory {
  return archiveCategoryOrder.includes(value as ArchiveCategory);
}

export function getArchiveProject(slug: string) {
  return archiveProjects.find((project) => project.slug === slug);
}

export function getNextArchiveProject(slug: string) {
  const index = archiveProjects.findIndex((project) => project.slug === slug);
  return archiveProjects[(index + 1) % archiveProjects.length];
}

export function localizeArchiveProject(project: ArchiveProject, locale: Locale) {
  const category = archiveCategories[project.category];
  const stageText: Record<ProjectStage, LocalizedText> = {
    completed: { ko: "완료", en: "Completed" },
    active: { ko: "진행 중", en: "Active" },
    concept: { ko: "콘셉트", en: "Concept" },
  };
  const stageCode: Record<ProjectStage, string> = {
    completed: "COMPLETE",
    active: "ACTIVE",
    concept: "CONCEPT",
  };

  return {
    ...project,
    categoryCode: category.code,
    categoryText: category.title[locale],
    categoryDescriptionText: category.description[locale],
    descriptionText: project.description[locale],
    roleText: project.role[locale],
    imageAltText: project.imageAlt[locale],
    statusCode: stageCode[project.stage],
    statusText: stageText[project.stage][locale],
    detailIntroText: project.detailIntro[locale],
    chapterTexts: project.detailChapters.map((chapter) => ({
      code: chapter.code,
      title: chapter.title[locale],
      body: chapter.body[locale],
    })),
    detailMediaText: (project.detailMedia ?? []).map((media) => ({
      ...media,
      altText: media.alt[locale],
    })),
  };
}
