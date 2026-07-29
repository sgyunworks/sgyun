import type { Locale } from "./i18n";

export type LocalizedText = Record<Locale, string>;

export type ArchiveCategory =
  | "physical"
  | "digital"
  | "experiments"
  | "awards";

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

export type ArchiveProject = {
  id: string;
  slug: string;
  number: string;
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
  detailIntro?: LocalizedText;
  detailChapters?: ArchiveChapter[];
  provisional: boolean;
};

export const archiveCategoryOrder: ArchiveCategory[] = [
  "physical",
  "digital",
  "experiments",
  "awards",
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
      ko: "산업디자인, 금속공예, 구조와 재료를 다루는 작업.",
      en: "Industrial design, metal craft, structure, and material studies.",
    },
    intro: {
      ko: "형태와 재료, 결합 방식이 하나의 논리로 읽히도록 물리적 대상을 기록한다.",
      en: "Physical work is recorded so form, material, and assembly read as one logic.",
    },
    chapters: [
      {
        code: "01",
        title: { ko: "형태는 첫 번째 정보다.", en: "Form is the first information." },
        body: {
          ko: "설명보다 먼저 비례, 실루엣, 무게 중심이 읽힌다. 이 장면은 대상의 전체 인상을 보존한다.",
          en: "Proportion, silhouette, and balance arrive before explanation. This scene preserves the complete impression.",
        },
      },
      {
        code: "02",
        title: { ko: "구조가 형태를 결정한다.", en: "Structure determines form." },
        body: {
          ko: "결합, 장력, 지지, 움직임을 분리해 보여 주며 형태가 만들어진 이유를 드러낸다.",
          en: "Assembly, tension, support, and movement are separated to reveal why the form exists.",
        },
      },
      {
        code: "03",
        title: { ko: "물성은 가까이에서 완성된다.", en: "Material resolves at close range." },
        body: {
          ko: "표면, 모서리, 접합부의 작은 차이를 통해 제작 방식과 사용 감각을 전달한다.",
          en: "Surface, edge, and joint details communicate fabrication and the feel of use.",
        },
      },
    ],
  },
  digital: {
    code: "D",
    title: { ko: "Digital", en: "Digital" },
    description: {
      ko: "웹사이트, 웹앱, 앱과 인터랙티브 시스템.",
      en: "Websites, web apps, mobile apps, and interactive systems.",
    },
    intro: {
      ko: "화면의 모양보다 입력, 상태 변화, 결과가 이어지는 경험의 구조를 기록한다.",
      en: "Digital work is recorded through the chain between input, state, and outcome.",
    },
    chapters: [
      {
        code: "01",
        title: { ko: "입력은 명확해야 한다.", en: "Input must be legible." },
        body: {
          ko: "사용자가 무엇을 조작할 수 있고 어떤 변화가 일어날지 화면의 구조로 먼저 알게 한다.",
          en: "The structure shows what can be controlled and what will change before interaction begins.",
        },
      },
      {
        code: "02",
        title: { ko: "상태는 하나의 원본을 가진다.", en: "State has one source of truth." },
        body: {
          ko: "클릭, 스크롤, 키보드와 시스템 반응이 같은 상태를 가리키도록 연결한다.",
          en: "Click, scroll, keyboard, and system feedback are connected to the same state.",
        },
      },
      {
        code: "03",
        title: { ko: "결과는 작동감으로 증명한다.", en: "Outcome is proven through behavior." },
        body: {
          ko: "짧은 데모와 실제 흐름으로 인터페이스의 속도, 피드백, 완결성을 보여 준다.",
          en: "Short demonstrations and real flows show speed, feedback, and completion.",
        },
      },
    ],
  },
  experiments: {
    code: "E",
    title: { ko: "Experiments", en: "Experiments" },
    description: {
      ko: "AI, 창의 코딩, 키네틱 프로토타입과 진행 중인 실험.",
      en: "AI, creative coding, kinetic prototypes, and active experiments.",
    },
    intro: {
      ko: "완성된 답보다 질문, 작동 원리, 다음 실험으로 이어지는 학습을 기록한다.",
      en: "Experiments preserve the question, behavior, and learning that lead to the next iteration.",
    },
    chapters: [
      {
        code: "01",
        title: { ko: "질문이 범위를 만든다.", en: "The question defines the field." },
        body: {
          ko: "무엇을 확인하려는 실험인지 먼저 고정해 새로움이 목적 없는 장식이 되지 않게 한다.",
          en: "The experiment begins with what it needs to learn, keeping novelty from becoming decoration.",
        },
      },
      {
        code: "02",
        title: { ko: "행동을 빠르게 만든다.", en: "Behavior is built early." },
        body: {
          ko: "완벽한 외형보다 핵심 움직임과 피드백을 먼저 구현해 가능성을 실제로 확인한다.",
          en: "Core motion and feedback are built before polish so the possibility can be tested for real.",
        },
      },
      {
        code: "03",
        title: { ko: "배운 것이 다음 형태가 된다.", en: "Learning becomes the next form." },
        body: {
          ko: "성공과 실패를 모두 기록하고 다음 버전에서 무엇이 달라질지 명확히 남긴다.",
          en: "Success and failure are both recorded, clarifying what the next version must change.",
        },
      },
    ],
  },
  awards: {
    code: "R",
    title: { ko: "Recognition", en: "Recognition" },
    description: {
      ko: "수상, 전시와 실제 성과를 근거와 함께 기록하는 영역.",
      en: "Awards, exhibitions, and verified outcomes recorded with evidence.",
    },
    intro: {
      ko: "결과만 나열하지 않고 어떤 맥락에서 무엇이 검증되었는지 근거와 함께 기록한다.",
      en: "Recognition is recorded with the context and evidence behind each verified outcome.",
    },
    chapters: [
      {
        code: "01",
        title: { ko: "맥락을 먼저 밝힌다.", en: "Context comes first." },
        body: {
          ko: "프로그램, 전시, 심사의 목적과 범위를 먼저 제시해 결과가 무엇을 의미하는지 알게 한다.",
          en: "The program, exhibition, or review context explains what the result means.",
        },
      },
      {
        code: "02",
        title: { ko: "근거를 직접 연결한다.", en: "Evidence is connected directly." },
        body: {
          ko: "주최 기관, 발표 자료, 전시 기록처럼 확인 가능한 출처를 결과와 함께 배치한다.",
          en: "Verifiable sources such as organizers, announcements, and exhibition records sit beside the result.",
        },
      },
      {
        code: "03",
        title: { ko: "영향을 과장하지 않는다.", en: "Impact stays precise." },
        body: {
          ko: "확인된 성과와 이후의 가능성을 분리해 포트폴리오의 신뢰도를 지킨다.",
          en: "Verified outcomes are separated from future potential to preserve credibility.",
        },
      },
    ],
  },
};

/**
 * These records are presentation fixtures, not a final portfolio selection.
 * Titles, copy, and media can be replaced without changing the archive shell.
 */
export const archiveProjects: ArchiveProject[] = [
  {
    id: "material-study",
    slug: "material-study",
    number: "01",
    title: "MATERIAL STUDY",
    year: "2026",
    category: "physical",
    description: {
      ko: "물성과 구조를 탐색하는 차기 피지컬 프로젝트를 위한 시네마틱 슬롯.",
      en: "A cinematic slot for the next physical study in material and structure.",
    },
    role: { ko: "오브젝트 디자인", en: "Object design" },
    heroImage: "/images/archive/cinematic-basalt-gallery.png",
    heroAspectRatio: 1915 / 821,
    imageAlt: {
      ko: "어두운 전시 공간의 검은 조형 오브젝트",
      en: "A black sculptural object in a dark gallery",
    },
    imageFit: "cover",
    imageTone: "dark",
    provisional: true,
  },
  {
    id: "vibey",
    slug: "vibey",
    number: "02",
    title: "VIBEY",
    year: "2026",
    category: "digital",
    description: {
      ko: "햅틱 제어 콘솔과 인터페이스를 하나의 감각으로 연결한 디지털 실험.",
      en: "A digital experiment connecting haptic controls and interface as one sense.",
    },
    role: { ko: "인터랙션 시스템", en: "Interaction system" },
    heroImage: "/images/archive/vibey-control-console.png",
    heroAspectRatio: 1586 / 992,
    imageAlt: {
      ko: "노브와 파란 표시등이 있는 바이비 제어 콘솔",
      en: "Vibey control console with a dial and blue indicator",
    },
    imageFit: "cover",
    imageTone: "light",
    provisional: true,
  },
  {
    id: "wrgs",
    slug: "wrgs",
    number: "03",
    title: "WRGS",
    year: "2024",
    category: "physical",
    description: {
      ko: "하나의 와이어 장력으로 결합되는 라쳇 기어 스툴 시스템.",
      en: "A ratchet-gear stool system assembled through the tension of one wire.",
    },
    role: { ko: "제품과 구조", en: "Product and structure" },
    heroImage: "/images/wrgs_thumb.jpg",
    heroAspectRatio: 1890 / 2160,
    imageAlt: { ko: "WRGS 스툴", en: "WRGS stool" },
    imageFit: "contain",
    imageTone: "light",
    detailMedia: [
      {
        src: "/images/wrgs_detail_1.jpg",
        alt: { ko: "WRGS 전체 형태", en: "WRGS full form" },
        aspectRatio: 1384 / 1074,
        fit: "contain",
        tone: "light",
      },
      {
        src: "/images/wrgs_detail_2.jpg",
        alt: { ko: "WRGS 구조 상세", en: "WRGS structural detail" },
        aspectRatio: 1384 / 1075,
        fit: "contain",
        tone: "light",
      },
      {
        src: "/images/wrgs_detail_3.jpg",
        alt: { ko: "WRGS 결합부", en: "WRGS joint detail" },
        aspectRatio: 1,
        fit: "contain",
        tone: "light",
      },
    ],
    provisional: true,
  },
  {
    id: "the-aviator",
    slug: "the-aviator",
    number: "04",
    title: "THE AVIATOR",
    year: "2025",
    category: "experiments",
    description: {
      ko: "음악의 비행을 움직임으로 연출하는 키네틱 스피커.",
      en: "A kinetic speaker that stages the flight of music through motion.",
    },
    role: { ko: "키네틱 오브젝트", en: "Kinetic object" },
    heroImage: "/images/aviator_thumb.jpg",
    heroAspectRatio: 2048 / 2560,
    imageAlt: { ko: "키네틱 스피커 The Aviator", en: "The Aviator kinetic speaker" },
    imageFit: "contain",
    imageTone: "dark",
    detailMedia: [
      {
        src: "/images/aviator_d1.jpg",
        alt: { ko: "The Aviator 정면", en: "The Aviator front view" },
        aspectRatio: 2048 / 2560,
        fit: "contain",
        tone: "dark",
      },
      {
        src: "/images/aviator_d2.jpg",
        alt: { ko: "The Aviator 움직임 상세", en: "The Aviator motion detail" },
        aspectRatio: 2048 / 2560,
        fit: "contain",
        tone: "dark",
      },
      {
        src: "/images/aviator_d3_wide.jpg",
        alt: { ko: "The Aviator 전개 장면", en: "The Aviator sequence" },
        aspectRatio: 2614 / 940,
        fit: "contain",
        tone: "dark",
      },
    ],
    provisional: true,
  },
  {
    id: "v-cado",
    slug: "v-cado",
    number: "05",
    title: "V-CADO",
    year: "2025",
    category: "digital",
    description: {
      ko: "싱크홀 골든타임에 먼저 투입되는 초기 대응 구난 로봇.",
      en: "A rapid-response rescue robot built for the sinkhole golden hour.",
    },
    role: { ko: "서비스와 로보틱스", en: "Service and robotics" },
    heroImage: "/images/vcado_thumb.jpg",
    heroAspectRatio: 2760 / 2160,
    imageAlt: { ko: "구난 로봇 V-CADO", en: "V-CADO rescue robot" },
    imageFit: "cover",
    imageTone: "dark",
    detailMedia: [
      {
        src: "/images/vcado_d1.jpg",
        alt: { ko: "V-CADO 로봇 형태", en: "V-CADO robot form" },
        aspectRatio: 1080 / 1265,
        fit: "contain",
        tone: "dark",
      },
      {
        src: "/images/vcado_d2_seq.jpg",
        alt: { ko: "V-CADO 작동 순서", en: "V-CADO operation sequence" },
        aspectRatio: 1680 / 2160,
        fit: "contain",
        tone: "dark",
      },
      {
        src: "/images/vcado_d3_scenario.jpg",
        alt: { ko: "V-CADO 사용 시나리오", en: "V-CADO use scenario" },
        aspectRatio: 2164 / 622,
        fit: "contain",
        tone: "dark",
      },
    ],
    provisional: true,
  },
  {
    id: "double-wishbone-chair",
    slug: "double-wishbone-chair",
    number: "06",
    title: "DOUBLE WISHBONE",
    year: "2025",
    category: "physical",
    description: {
      ko: "고성능 서스펜션의 구조를 가구로 번역한 엔지니어링 아트.",
      en: "Engineering art translating high-performance suspension into furniture.",
    },
    role: { ko: "가구와 메커니즘", en: "Furniture and mechanism" },
    heroImage: "/images/dwc_thumb.jpg",
    heroAspectRatio: 1842 / 2160,
    imageAlt: { ko: "Double Wishbone Chair", en: "Double Wishbone Chair" },
    imageFit: "contain",
    imageTone: "light",
    detailMedia: [
      {
        src: "/images/dwc_d1.jpg",
        alt: { ko: "Double Wishbone Chair 전체 형태", en: "Double Wishbone Chair full form" },
        aspectRatio: 2048 / 2560,
        fit: "contain",
        tone: "light",
      },
      {
        src: "/images/dwc_d2.jpg",
        alt: { ko: "Double Wishbone Chair 구조", en: "Double Wishbone Chair structure" },
        aspectRatio: 2048 / 2560,
        fit: "contain",
        tone: "light",
      },
      {
        src: "/images/dwc_d3.jpg",
        alt: { ko: "Double Wishbone Chair 상세", en: "Double Wishbone Chair detail" },
        aspectRatio: 2048 / 2560,
        fit: "contain",
        tone: "light",
      },
    ],
    provisional: true,
  },
  {
    id: "recognition-log",
    slug: "recognition-log",
    number: "07",
    title: "RECOGNITION LOG",
    year: "OPEN",
    category: "awards",
    description: {
      ko: "수상, 전시, 선정 기록을 확인 가능한 근거와 함께 담기 위한 기록 슬롯.",
      en: "A record slot for awards, exhibitions, and selections with verifiable evidence.",
    },
    role: { ko: "검증 기록", en: "Evidence record" },
    heroImage: "/images/appendix_thumb.jpg",
    heroAspectRatio: 3840 / 2160,
    imageAlt: {
      ko: "밝은 공간에 배치된 스피커 오브젝트 렌더",
      en: "Speaker object render in a bright space",
    },
    imageFit: "cover",
    imageTone: "light",
    provisional: true,
  },
];

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
  const chapters = project.detailChapters ?? category.chapters;

  return {
    ...project,
    categoryCode: category.code,
    categoryText: category.title[locale],
    categoryDescriptionText: category.description[locale],
    descriptionText: project.description[locale],
    roleText: project.role[locale],
    imageAltText: project.imageAlt[locale],
    detailIntroText: (project.detailIntro ?? category.intro)[locale],
    chapterTexts: chapters.map((chapter) => ({
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
