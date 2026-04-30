export type Locale = "ko" | "en";

export const locales: Locale[] = ["ko", "en"];
export const defaultLocale: Locale = "ko";

export type Dict = {
  nav: { works: string; about: string; contact: string };
  home: {
    hero: {
      subtitle: string;
      intro1: string;
      intro2: string;
      scroll: string;
      meta: string;
    };
    works: { eyebrow: string; title: string };
    about: {
      eyebrow: string;
      title: string;
      headline: string;
      headlineSub: string;
      body1: string;
      body2: string;
      more: string;
    };
    contact: {
      eyebrow: string;
      line1: string;
      line2: string;
      line3: string;
    };
  };
  works: {
    title: string;
    eyebrow: string;
    year: string;
    material: string;
    role: string;
    type: string;
    team: string;
    next: string;
    back: string;
    concept: string;
    inMotion: string;
    processVideo: string;
    viewOnInstagram: string;
    noVideoNote: string;
  };
  about: {
    title: string;
    eyebrow: string;
    sectionEducation: string;
    sectionSkills: string;
    sectionPhilosophy: string;
    educationLine: string;
  };
  contact: {
    title: string;
    eyebrow: string;
    headline1: string;
    headline2: string;
    headline3: string;
    labelEmail: string;
    labelInstagram: string;
    labelLocation: string;
    labelName: string;
    locationValue: string;
  };
  footer: { tagline: string };
};

export const dict: Record<Locale, Dict> = {
  ko: {
    nav: {
      works: "Works",
      about: "About",
      contact: "Contact",
    },
    home: {
      hero: {
        subtitle: "Portfolio",
        intro1:
          "서울과학기술대학교에서 금속공예와 산업디자인을 전공하며, 단순히 시각적으로 아름다운 형태를 그리는 것을 넘어 '실제 만들어지고 작동할 수 있는가'에 대해 탐구해 왔다.",
        intro2:
          "디자이너이자 엔지니어의 시각으로 접근한다. 아두이노와 전자부품을 활용해 디자인과 메커니즘을 직접 설계하는 등, 아이디어가 현실에서 제대로 작동하도록.",
        scroll: "SCROLL",
        meta: "ENGINEERING ART",
      },
      works: {
        eyebrow: "01 — Selected Works",
        title: "Works",
      },
      about: {
        eyebrow: "02 — About",
        title: "About",
        headline: "디자이너이자 엔지니어.",
        headlineSub: "상상을 작동하는 하드웨어로 구현하는 '엔지니어링 아트'.",
        body1:
          "금속공예로 다져진 소재에 대한 깊은 이해와 산업디자인의 논리를 바탕으로, 물리적 하중과 구조적 안정성까지 치밀하게 고려한다.",
        body2:
          "디자이너의 감각과 엔지니어의 논리를 동시에 견지하며, 상상을 실제 구동하는 하드웨어이자 정교한 '엔지니어링 아트'로 구현해 내는 작업을 하고있다.",
        more: "더 알아보기",
      },
      contact: {
        eyebrow: "03 — 연락하기",
        line1: "함께",
        line2: "무언가를",
        line3: "만들어봐요.",
      },
    },
    works: {
      title: "Works",
      eyebrow: "Selected Works",
      year: "Year",
      material: "Material",
      role: "Role",
      type: "Type",
      team: "Team",
      next: "Next Project",
      back: "All Works",
      concept: "Concept",
      inMotion: "In Motion",
      processVideo: "Process Video",
      viewOnInstagram: "Instagram에서 보기",
      noVideoNote: "이 작품의 영상은 준비 중입니다.",
    },
    about: {
      title: "About",
      eyebrow: "About",
      sectionEducation: "Education",
      sectionSkills: "Skills",
      sectionPhilosophy: "Philosophy",
      educationLine:
        "서울과학기술대학교 금속공예디자인학과 / 산업디자인학과 (복수전공)",
    },
    contact: {
      title: "Contact",
      eyebrow: "Get in touch",
      headline1: "함께",
      headline2: "무언가를",
      headline3: "만들어봐요.",
      labelEmail: "Email",
      labelInstagram: "Instagram",
      labelLocation: "Location",
      labelName: "Name",
      locationValue: "Seoul, Korea",
    },
    footer: {
      tagline: "ENGINEERING ART · SEOUL",
    },
  },
  en: {
    nav: {
      works: "Works",
      about: "About",
      contact: "Contact",
    },
    home: {
      hero: {
        subtitle: "Portfolio",
        intro1:
          "Studying Metal Craft Design and Industrial Design at Seoul National University of Science and Technology, exploring not just how things look beautiful, but whether they can actually be made — and made to work.",
        intro2:
          "Approaching design through the lens of both designer and engineer — designing mechanisms directly with Arduino and electronics, ensuring ideas function properly in the real world.",
        scroll: "SCROLL",
        meta: "ENGINEERING ART",
      },
      works: {
        eyebrow: "01 — Selected Works",
        title: "Works",
      },
      about: {
        eyebrow: "02 — About",
        title: "About",
        headline: "Designer & Engineer.",
        headlineSub:
          "Crafting hardware that operates as 'engineering art.'",
        body1:
          "A deep understanding of materials forged through metal craft, combined with the logic of industrial design — meticulously considering physical loads and structural stability.",
        body2:
          "Holding both the designer's sensibility and the engineer's logic, building work that operates as hardware while standing as a precise piece of 'engineering art.'",
        more: "More about me",
      },
      contact: {
        eyebrow: "03 — Get in touch",
        line1: "Let's build",
        line2: "something",
        line3: "together.",
      },
    },
    works: {
      title: "Works",
      eyebrow: "Selected Works",
      year: "Year",
      material: "Material",
      role: "Role",
      type: "Type",
      team: "Team",
      next: "Next Project",
      back: "All Works",
      concept: "Concept",
      inMotion: "In Motion",
      processVideo: "Process Video",
      viewOnInstagram: "View on Instagram",
      noVideoNote: "Motion video for this project is in preparation.",
    },
    about: {
      title: "About",
      eyebrow: "About",
      sectionEducation: "Education",
      sectionSkills: "Skills",
      sectionPhilosophy: "Philosophy",
      educationLine:
        "Seoul National University of Science and Technology / Metal Craft Design (B.F.A.) · Industrial Design (Double Major)",
    },
    contact: {
      title: "Contact",
      eyebrow: "Get in touch",
      headline1: "Let's build",
      headline2: "something",
      headline3: "together.",
      labelEmail: "Email",
      labelInstagram: "Instagram",
      labelLocation: "Location",
      labelName: "Name",
      locationValue: "Seoul, Korea",
    },
    footer: {
      tagline: "ENGINEERING ART · SEOUL",
    },
  },
};

export function getDict(locale: Locale): Dict {
  return dict[locale];
}
