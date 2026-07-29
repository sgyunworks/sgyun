# SGYUN Portfolio — Validation

## 시각 검증

- [x] 홈 프리뷰가 가로·세로·정사각 작품을 자르지 않는다.
- [x] 데스크톱 1440×1000, 태블릿 1024×900, 모바일 390×844에서 주요 요소가 겹치지 않는다.
- [x] Poppins 대형 제목이 300 이하의 얇은 인상으로 렌더링된다.
- [x] 미디어 프레임과 컨트롤의 반경·표면 등급이 명확히 다르다.
- [x] 홈·목록·상세에서 광원, 자간, 신호색 사용이 일관된다.
- [x] 홈 primary media가 이전 캡처보다 크게 보이며 두꺼운 glass-like bezel이 없다.
- [x] folder intro 제목이 hero 제목보다 작고 자간·행간이 여유롭다.
- [x] nav, 프로젝트 CTA, category action에서 vault datum·rotary latch 문법이 일관된다.
- [x] 마이크로그래픽이 실제 번호·비율·record count·route 정보만 표시하고 작품을 가리지 않는다.
- [x] 다이얼 옆의 장식성 `15°`, 고정 emissive pointer, rail glow가 없다.

## 기능 검증

- [x] 다이얼 드래그·휠·키보드 탐색과 스크롤 동기화가 유지된다.
- [ ] 라쳇 사운드와 지원 기기의 햅틱이 실제 장치에서 인덱스 변경 때만 발생한다.
- [x] 필터와 작품 링크가 동작한다.
- [x] reduced-motion 설정에서 콘텐츠 접근이 가능하다.
- [x] `npm run build`가 타입 검사와 정적 페이지 생성을 포함해 통과한다.

`npm run lint`는 ESLint 설정 파일이 없어 대화형 초기 설정 화면에서 멈춘다. 이번 변경의 오류가 아니라 기존 품질 게이트의 미설정 상태이며, 별도 개발 작업으로 남긴다.

## 비교 방식

동일한 뷰포트와 상태로 변경 전·후 캡처를 만들고, 프리뷰 크롭, 제목 무게, 표면 위계, 여백, 겹침을 우선 비교한다.

사용자 제공 WRGS 캡처와 842×1330 구현 캡처는 `qa/wrgs-preview-comparison.png`에서 나란히 확인했다.

## Vault instrument polish — 2026-07-29

- 1440px 홈에서 primary media는 `822 × 352.4px`이며 정보→미디어와 미디어→레일 간격은 각각 `18px`이다. 이전 약 `638px` 폭보다 약 29% 커졌다.
- 390×844 홈에서 primary media는 `x=12`, `width=370`, 오른쪽 끝 `382px`이며 viewport 밖으로 넘치지 않는다. CTA 오른쪽 끝은 `183px`, 다이얼 노출 폭은 약 `90.7px`, document horizontal overflow는 `0px`이다.
- `/ko`, `/ko/works`, `/ko/works/wrgs`에 axe-core WCAG 2 A/AA를 실행했고 확정 violation은 모두 `0`건이다.
- 동일 상태 캡처: `qa/vault-system-polish-home-1440.png`, `qa/vault-system-polish-home-390.png`, `qa/vault-system-polish-folder-hover-1440.png`, `qa/nav-detail-diagnostic.png`.

## 감산 디자인 패스 — 2026-07-29

- [x] 홈 primary media 주변 정보가 번호·제목·원본 비율 한 줄로 제한되고 하단 장식축이 없다.
- [x] 프로젝트 CTA가 사각 카드로 보이지 않고 rotary latch·문구·datum rail만 남는다.
- [x] 전역 route 문구와 상세 이미지 내부 번호처럼 다른 위치와 중복되는 micrographics가 없다.
- [x] 홈·상세의 대형 광원이 푸른 glow가 아닌 중성 silver-grey 반사광이다.
- [x] INDEX 필터가 독립 사각 버튼 묶음이 아니라 하나의 selection rail로 보인다.
- [x] 모바일 primary media가 기존보다 위에서 시작하고 다이얼·project rail의 기능 영역을 침범하지 않는다.
- `git diff --check`, `npx tsc --noEmit`, Next.js production build를 통과했으며 정적 페이지 27개를 생성했다.

## Dial sync·Vault transition — 2026-07-29

- [x] 01–07 각각의 active dial marker 순각도가 모두 `-90°`이고 counter-rotation 후 글자 순회전이 `0°`다.
- [x] scroll이 멈추면 `1 / 6` 간격의 가장 가까운 project detent로 snap한다.
- [x] 고정 emissive pointer와 desktop active rail glow가 없으며 tablet·mobile bar도 발광 shadow를 사용하지 않는다.
- [x] `SOUND START/ON/OFF` UI, localStorage preference, sound toggle state가 source와 렌더링 결과에 없다.
- [x] 첫 pointer·keyboard·touch 입력이 Web Audio를 준비하고 이후 ratchet tick은 기본 활성 상태다.
- [x] 프로젝트 CTA에서 closing shutter·central lock·opening shutter 순서의 route transition이 실행되고 reduced motion에서 즉시 축약된다.

## 상세 composition pass — 2026-07-29

- [x] WRGS hero의 연도·분야·형식·archive 번호가 제목·설명 아래 하나의 2×2 사양군으로 묶인다.
- [x] 1440×960에서 제목 정보군과 원본 비율 media가 독립 2열로 유지되고, 390×844에서는 media → 제목 → 사양군 순서로 재구성된다.
- [x] 한국어 설명의 `시스템.`이 한두 글자 고아줄로 분리되지 않는다.
- [x] story chapter surface는 3px radius, 중성 graphite, 1px active edge를 사용하며 glow가 없다.
- [x] Next.js 개발 표시를 로컬 검토 화면에서 비활성화했고, 숨겨진 mobile story media의 `fill` parent·`sizes` 경고를 제거했다.
- 동일 상태 캡처: `qa/detail-composition-final-1440.png`, `qa/detail-composition-final-390.png`, `qa/detail-premise-composition-final-1440.png`, `qa/detail-story-composition-final-1440.png`.

## 타이포그래피 시스템 패스 — 2026-07-29

- [x] 라틴 디스플레이와 한글 디스플레이가 서로 다른 자간·행간 토큰을 사용한다. Poppins 작품명·INDEX의 압축 리듬은 유지하고, Pretendard 한글 제목은 `-0.018em / 1.07`로 완화했다.
- [x] 핵심 본문은 데스크톱 `16px / 1.68`, 모바일 `15px / 1.68`, 보조 설명은 데스크톱 `15px`, 모바일 `14px`를 기준으로 통일했다.
- [x] 홈 선언문의 이미지와 문장이 독립 grid cell을 유지하고, 종결어 `잇는다.`는 오른쪽 종결행으로 정렬되어 화면 밖으로 나가지 않는다.
- [x] INDEX의 두 줄 영문 제목 행간을 모바일 `0.86`, 데스크톱 `0.88`로 완화했다.
- [x] About 본문, 상세 premise·story 제목과 설명에 `keep-all`, `balance`, `pretty`를 역할별로 적용했다.
- [x] `/ko`, `/ko/works`, `/ko/works/wrgs`, `/ko/about`을 1440×960과 390×844에서 검사했고 모든 경로의 document horizontal overflow가 `0px`다.
- [x] `npx tsc --noEmit`, `git diff --check`, 별도 임시 복제본의 Next.js production build가 통과했으며 정적 페이지 27개를 생성했다.
- 검증 캡처: `qa/typography-refined-home-manifesto-desktop.png`, `qa/typography-refined-home-manifesto-mobile.png`, `qa/typography-refined-works-hero-desktop.png`, `qa/typography-refined-detail-premise-mobile.png`, `qa/typography-refined-detail-story-mobile.png`, `qa/typography-refined-about-copy-desktop.png`, `qa/typography-refined-about-copy-mobile.png`.
