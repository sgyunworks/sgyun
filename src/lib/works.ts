import type { Locale } from "./i18n";

export type Work = {
  slug: string;
  number: string;
  title: string;
  subtitle: { ko: string; en: string };
  year: string;
  material: { ko: string; en: string };
  role: { ko: string; en: string };
  type: { ko: string; en: string };
  team?: { ko: string; en: string };
  conceptHeadline: { ko: string; en: string };
  conceptHeadlineSub: { ko: string; en: string };
  body: {
    ko: string[];
    en: string[];
  };
  heroImage: string;
  thumbImage: string;
  gallery: { src: string; aspect: "full" | "half" | "third" | "two-thirds" }[];
  video?: {
    type: "instagram";
    url: string;
    thumb: string;
  };
};

export const works: Work[] = [
  {
    slug: "wrgs",
    number: "01",
    title: "WRGS",
    subtitle: {
      ko: "Wire Ratchet Gear Stool",
      en: "Wire Ratchet Gear Stool",
    },
    year: "2024",
    material: {
      ko: "스테인리스 스틸, 와이어",
      en: "Stainless Steel, Wire",
    },
    role: {
      ko: "스툴 파트 담당 (디자인 및 제작)",
      en: "Stool Part Lead (Design & Fabrication)",
    },
    type: { ko: "가구 (스툴)", en: "Furniture — Stool" },
    team: { ko: "팀 프로젝트", en: "Team Project" },
    conceptHeadline: { ko: "제작의 혁신.", en: "Reinventing assembly." },
    conceptHeadlineSub: {
      ko: "조인트를 단 하나의 와이어로.",
      en: "Joints reduced to a single wire.",
    },
    body: {
      ko: [
        "'제작의 혁신'이라는 키워드를 잡고, 이를 조인트와 패스너의 간소화로 재해석했다. 가구의 부품 결합 과정을 단순화하기 위해 단 하나의 '와이어 라쳇 기어'를 핵심 패스너로 고안했다. 와이어의 장력만으로 전체 파츠를 견고하게 고정하는 이 시스템은, 복잡한 조립을 직관적으로 단축시키는 동시에 모던한 조형미를 완성한다.",
        "물리적 하중과 힘의 방향을 철저히 계산하여 구조적 안정성을 극대화했다. 수평 유지에 가장 효율적이고 안정적인 3개의 다리를 채택했으며, 지면을 향해 둔각으로 벌어지는 형태를 적용했다. 이는 하중이 가해질수록 상판과 다리의 짜맞춤 구조가 더욱 강하게 결속되도록 유도한다. 와이어의 장력, 스틸판의 피로 변형을 방지하는 T자형 용접 구조가 완벽하게 맞물려 텐션과 내구성을 동시에 충족시킨다.",
        "설계한 구조를 현실화하고 모던한 실버톤을 연출하기 위해 최종 소재로 스테인리스 스틸을 채택했다. 연성이 높은 알루미늄의 밴딩(휨) 우려를 배제하고, 필수적인 T자 구조 용접의 안정성을 확보하기 위한 선택이다. 표면은 헤어라인으로 마감하여 가늘고 균일한 결을 살렸다. 이를 통해 별도의 폴리싱 없이도 금속 특유의 적절한 반사율과 세련미가 장기간 유지되도록 마감의 완성도를 높였다.",
      ],
      en: [
        "Centered on the keyword 'innovation in making,' the project reinterprets that idea through a radical simplification of joints and fasteners. A single 'wire ratchet gear' serves as the core fastener — the tension of one wire alone holds the entire structure together, replacing conventional assembly with an intuitive system that doubles as a modern visual language.",
        "Loads and force vectors were calculated meticulously for structural stability. Three legs — the most efficient configuration for horizontal balance — splay outward at an obtuse angle so that downward force tightens the joint between top plate and legs rather than weakening it. Wire tension, plate fatigue resistance, and T-section welding interlock to deliver tension and durability at once.",
        "Stainless steel was chosen as the final material to realize the structure with a modern silver tone. The choice avoids the bending concerns of aluminum and secures the stability of the essential T-section welds. The surface is finished with hairline brushing to bring out a fine, uniform grain — preserving the metal's reflectivity and refinement long-term, without polishing.",
      ],
    },
    heroImage: "/images/wrgs_thumb.jpg",
    thumbImage: "/images/wrgs_thumb.jpg",
    gallery: [
      { src: "/images/wrgs_detail_1.jpg", aspect: "half" },
      { src: "/images/wrgs_detail_2.jpg", aspect: "half" },
      { src: "/images/wrgs_detail_4.jpg", aspect: "third" },
      { src: "/images/wrgs_detail_5.jpg", aspect: "third" },
      { src: "/images/wrgs_detail_3.jpg", aspect: "third" },
    ],
  },
  {
    slug: "double-wishbone-chair",
    number: "02",
    title: "Double Wishbone Chair",
    subtitle: {
      ko: "서스펜션의 구조적 이상향",
      en: "The structural ideal of suspension",
    },
    year: "2025",
    material: {
      ko: "카본, 알루미늄, 스틸 (렌더링 단계)",
      en: "Carbon, Aluminum, Steel (Render-stage project)",
    },
    role: {
      ko: "단독 작업 — 디자인 및 3D 모델링",
      en: "Solo — Design & 3D Modeling",
    },
    type: { ko: "가구 (체어) — 컨셉", en: "Furniture — Chair (Concept)" },
    conceptHeadline: {
      ko: "엔지니어링 아트로서의 의자.",
      en: "A chair as engineering art.",
    },
    conceptHeadlineSub: {
      ko: "고성능 차량의 서스펜션, 의자가 되다.",
      en: "Performance-car suspension, redrawn as furniture.",
    },
    body: {
      ko: [
        "가장 완벽한 승차감을 제공하는 자동차의 기술이 정적인 의자와 만난다면 어떨까? 'Double Wishbone Chair'는 고성능 차량의 서스펜션 시스템에서 영감을 받았다. 수천 킬로그램의 차체와 노면의 거친 충격을 제어하는 더블 위시본 시스템은 공학적 안정성의 정점이다. 이 강력하고 우아한 메커니즘을 가구 디자인에 접목하여, 의자가 단순한 휴식 도구를 넘어 '엔지니어링 아트'로 진화할 수 있음을 증명한다.",
        "더블 위시본은 서스펜션의 구조적 이상향이다. 대량 생산을 위한 원가 절감형 서스펜션이나 공간 효율을 위한 저가형 방식과 달리, 더블 위시본은 오직 '성능'과 '승차감'이라는 본질적인 가치를 위해 설계됐다. 복잡한 링크 구조와 높은 제작 단가, 넓은 공간 점유라는 까다로운 조건 때문에 오직 하이엔드 럭셔리 세단과 슈퍼카에서만 허락되는 방식인, 더블 위시본. 그 타협 없는 하이엔드 정신을 계승한다.",
      ],
      en: [
        "What if the technology delivering the most refined ride quality in automobiles met the static form of a chair? The Double Wishbone Chair draws from the suspension system of high-performance vehicles. Capable of controlling the weight of a multi-ton body and the roughness of the road, the double-wishbone system represents a peak of engineering refinement. Translating that powerful, elegant mechanism into furniture, the work argues that a chair can become more than a tool for rest — it can be engineering art.",
        "Double-wishbone is the structural ideal of suspension. Unlike cost-optimized layouts built for mass production or space-saving budget systems, it exists purely for the values of 'performance' and 'ride quality.' Its complex link geometry, high manufacturing cost, and large spatial footprint reserve it for high-end luxury sedans and supercars alone — and that uncompromising spirit is what this chair carries forward.",
      ],
    },
    heroImage: "/images/dwc_thumb.jpg",
    thumbImage: "/images/dwc_thumb.jpg",
    gallery: [
      { src: "/images/dwc_d1.jpg", aspect: "third" },
      { src: "/images/dwc_d2.jpg", aspect: "third" },
      { src: "/images/dwc_d3.jpg", aspect: "third" },
      { src: "/images/dwc_d4_wide.jpg", aspect: "full" },
    ],
    video: {
      type: "instagram",
      url: "https://www.instagram.com/p/DUNxSigksjj/",
      thumb: "/images/dwc_video_thumb.jpg",
    },
  },
  {
    slug: "the-aviator",
    number: "03",
    title: "The Aviator",
    subtitle: {
      ko: "음악의 비행을 연출하는 키네틱 스피커",
      en: "A kinetic speaker that performs the flight of music",
    },
    year: "2025",
    material: {
      ko: "3D 프린팅, 알루미늄, 4인치 스피커 유닛, 앰프 모듈, 리니어 액츄에이터",
      en: "3D-printed parts, Aluminum, 4-inch speaker drivers, Amplifier module, Linear actuator",
    },
    role: {
      ko: "단독 작업 — 디자인, 메커니즘 설계, 회로/제어",
      en: "Solo — Design, Mechanism, Circuit & Control",
    },
    type: {
      ko: "프로덕트 — 키네틱 스피커",
      en: "Product — Kinetic Speaker",
    },
    conceptHeadline: {
      ko: "음악의 비행을 펼치다.",
      en: "Unfolding the flight of music.",
    },
    conceptHeadlineSub: {
      ko: "고정된 형태가 아닌, 움직임을 통해 감각을 자극한다.",
      en: "Not a fixed form — a stimulus through motion itself.",
    },
    body: {
      ko: [
        "The Aviator는 음악의 비행 혹은 유영을 기계적 메커니즘으로 연출한 키네틱 스피커다. 사용하지 않을 때는 날개가 접힌 채 머물며, 양쪽 끝에는 풀레인지 스피커 드라이버가 장착되어 있다. 전원이 켜지는 순간, 스피커는 천천히 날개를 펼치고 청자를 향한다. 이 동작은 단순한 기계 작동이 아닌, 음악이라는 여정을 앞둔 몸짓이자 출발의 신호다.",
        "작품은 특정한 형상을 정의하지 않는다. 대신 구조를 노출한 채 기계적 골조 자체를 드러내어, 관람자가 떠올리는 '비행'이나 '유영'의 이미지를 자유롭게 투영하도록 유도한다. 이는 고정된 형태가 아닌 움직임을 통해 감각을 자극하는 방식이다. 소리가 재생되기 전 펼쳐지는 전환의 순간은 감각의 이륙 신호이자 몰입의 문을 여는 과정이다. 보는 이는 스피커의 동작을 따라 상상의 공간을 비행하게 되고, 작품은 그 여정을 함께하는 하나의 비행체가 된다.",
      ],
      en: [
        "The Aviator is a kinetic speaker that stages the flight — or the swim — of music as a mechanical performance. At rest, its wings are folded, with full-range speaker drivers mounted at each end. The moment power flows, the wings unfold slowly and orient toward the listener. The motion is not mere actuation; it's a gesture preceding a journey, a signal of departure into music.",
        "The work refuses to define a single form. Instead, it exposes its mechanical skeleton openly, inviting viewers to project their own images of flight or motion onto it. The stimulus comes through movement, not silhouette. The transitional unfolding before sound plays is the takeoff cue for the senses, a doorway into immersion — and the listener flies through imagined space alongside the speaker, the work itself becoming a vessel on that journey.",
      ],
    },
    heroImage: "/images/aviator_thumb.jpg",
    thumbImage: "/images/aviator_thumb.jpg",
    gallery: [
      { src: "/images/aviator_d1.jpg", aspect: "half" },
      { src: "/images/aviator_d2.jpg", aspect: "half" },
      { src: "/images/aviator_d3_wide.jpg", aspect: "full" },
    ],
    video: {
      type: "instagram",
      url: "https://www.instagram.com/reel/DWYtP7Lkudp/",
      thumb: "/images/aviator_video_thumb.jpg",
    },
  },
  {
    slug: "v-cado",
    number: "04",
    title: "V-CADO",
    subtitle: {
      ko: "싱크홀 초기 대응 구난 로봇",
      en: "A rapid-response sinkhole rescue robot",
    },
    year: "2025",
    material: {
      ko: "컨셉 디자인 — 4인 팀 프로젝트",
      en: "Concept Design — 4 People Team Project",
    },
    role: {
      ko: "Engineer & Designer (본인 역할)",
      en: "Engineer & Designer (My Role)",
    },
    type: { ko: "프로덕트 — 구난 로봇", en: "Product — Rescue Robot" },
    team: { ko: "4인 팀 프로젝트", en: "4-Person Team Project" },
    conceptHeadline: {
      ko: "골든타임을 위한 구조 로봇.",
      en: "A robot built for the golden hour.",
    },
    conceptHeadlineSub: {
      ko: "사고 직후 가장 먼저 투입되는 초기 대응자.",
      en: "First on the scene, before humans are sent in.",
    },
    body: {
      ko: [
        "도시 지반이 노후화되고 지하공간 활용이 늘면서 예고 없는 싱크홀 사고가 급증하고 있다. 이 재난은 사전 징후가 거의 없어, 예측보다 초기 대응 속도가 생존을 좌우한다. 하지만 기존 구조 방식은 구조용 삼각대 설치 후 구조 대원이 로프에 매달려 직접 싱크홀 안으로 들어가는 방식으로, 인력 의존도가 높고 접근이 어려워 골든타임 확보가 어렵다.",
        "이 지점에서 싱크홀 초기 대응 구난 로봇 V-CADO를 제시한다. 사고 직후 인간 대신 가장 먼저 투입되어, 인명을 파악하고 지형을 맵핑하며 필요시 툴을 사용해 최적의 구조 상황을 만든다.",
      ],
      en: [
        "As urban infrastructure ages and underground spaces grow more crowded, sinkhole incidents are rising — and rising without warning. With almost no precursors, response speed defines survival. Yet existing rescue procedures depend on tripod rigs and human responders rappelling directly into the cavity, a labor-heavy and access-limited workflow that puts the golden hour out of reach.",
        "V-CADO is proposed for that gap: a rapid-response sinkhole rescue robot. Deployed first, before any human descent, it locates victims, maps the terrain, and — when necessary — uses onboard tools to engineer optimal conditions for the rescue that follows.",
      ],
    },
    heroImage: "/images/vcado_thumb.jpg",
    thumbImage: "/images/vcado_thumb.jpg",
    gallery: [
      { src: "/images/vcado_d2_seq.jpg", aspect: "half" },
      { src: "/images/vcado_d1.jpg", aspect: "half" },
      { src: "/images/vcado_d3_scenario.jpg", aspect: "full" },
      { src: "/images/vcado_d4.jpg", aspect: "third" },
      { src: "/images/vcado_d5.jpg", aspect: "third" },
      { src: "/images/vcado_d6.jpg", aspect: "third" },
      { src: "/images/vcado_d7.jpg", aspect: "third" },
    ],
  },
];

export const appendixWork = {
  number: "05",
  title: "2.1 Channel Speaker",
  subtitle: {
    ko: "1940s 차량에서 영감을 받은 2.1채널 스피커",
    en: "A 2.1-channel speaker inspired by 1940s vehicles",
  },
  thumbImage: "/images/appendix_thumb.jpg",
};

export function getWork(slug: string): Work | undefined {
  return works.find((w) => w.slug === slug);
}

export function getNextWork(slug: string): Work {
  const idx = works.findIndex((w) => w.slug === slug);
  return works[(idx + 1) % works.length];
}

export function getLocalizedWorkField<T extends { ko: string; en: string }>(
  field: T,
  locale: Locale
): string {
  return field[locale];
}

export function getLocalizedWorkBody(
  body: { ko: string[]; en: string[] },
  locale: Locale
): string[] {
  return body[locale];
}
