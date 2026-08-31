# SGYUN Portfolio — Validation

## 시각 검증

- [x] 홈 프리뷰가 가로·세로·정사각 작품을 자르지 않는다.
- [x] 데스크톱 1440×1000, 태블릿 1024×900, 모바일 390×844에서 주요 요소가 겹치지 않는다.
- [x] Poppins 대형 제목이 300 이하의 얇은 인상으로 렌더링된다.
- [x] 미디어 프레임과 컨트롤의 반경·표면 등급이 명확히 다르다.
- [x] 홈·목록·상세에서 광원, 자간, 신호색 사용이 일관된다.
- [x] 홈 primary media가 이전 캡처보다 크게 보이며 두꺼운 glass-like bezel이 없다.
- [x] Practice Ledger 제목이 hero 제목보다 작고 자간·행간이 여유롭다.
- [x] nav, 프로젝트 CTA, category action에서 vault datum·rotary latch 문법이 일관된다.
- [x] 마이크로그래픽이 실제 번호·비율·record count·route 정보만 표시하고 작품을 가리지 않는다.
- [x] 다이얼 옆의 장식성 `15°`, 고정 emissive pointer, rail glow가 없다.

## 기능 검증

- [x] 일반 페이지 다이얼은 직접 입력 없이 native scroll에 시각·라쳇 사운드로 동기화된다.
- [ ] 라쳇 사운드와 모바일 native-scroll detent·이스터에그 scrub의 햅틱이 실제 장치에서 인덱스 변경 때만 발생한다.
- [x] 필터와 작품 링크가 동작한다.
- [x] reduced-motion 설정에서 콘텐츠 접근이 가능하다.
- [x] `npm run build`가 타입 검사와 정적 페이지 생성을 포함해 통과한다.

ESLint는 아직 구성하지 않았다. 실행 불가능했던 `next lint` 스크립트는 제거했고 현재 정적 검사는 `npm run typecheck`와 production build를 기준으로 한다.

## 비교 방식

동일한 뷰포트와 상태로 변경 전·후 캡처를 만들고, 프리뷰 크롭, 제목 무게, 표면 위계, 여백, 겹침을 우선 비교한다.

사용자 제공 WRGS 캡처와 842×1330 구현 캡처는 `qa/wrgs-preview-comparison.png`에서 나란히 확인했다.

## Passive page dial and WGA recognition — 2026-08-31

- [x] 홈·Works·About의 일반 다이얼에 `data-interactive=false`가 적용되고 slider, touch hit area, page-scroll mode, 최초 방문 가이드가 각각 0개다.
- [x] 1440×960과 390×844에서 일반 스크롤 후 face transform과 현재 인덱스가 함께 변경됐다.
- [x] 390×844에서 다이얼 위치로 시작한 native touch pan은 `scrollY 0→135`로 통과했고 custom hit area와 interacting 상태는 생성되지 않았다.
- [x] 1440px에서 다이얼 위 mouse drag는 문서를 움직이지 않았고 wheel은 `scrollY 0→650`으로 일반 스크롤됐다.
- [x] `FIELD_00`은 두 화면 폭 모두 interactive slider 1개를 유지해 일반 페이지와 이스터에그 입력 경계가 분리됐다.
- [x] WGA 인증서의 공식 명칭·2026·Student Winner·VESA Based Floating Speaker·Product / Consumer Electronics / Audio Devices를 한·영 Recognition 첫 항목으로 표시했다.
- [x] 홈·Works·About·영문 About에서 horizontal overflow 0, visible broken image 0, console/page error 0이다.
- [x] `jq empty src/content/portfolio.json`, `npm run typecheck`, `npm run build`, `git diff --check`가 통과했다.
- [x] 데스크톱 진입 시 AudioContext 생성·resume을 즉시 시도한다. 자동 재생이 차단된 Chromium 검증에서는 별도 클릭 없이 최초 wheel 뒤 `suspended→running`으로 전환됐다.
- [x] iPhone 경로에 Safari 18 native switch haptic proxy를 렌더하고 Android 등 지원 브라우저에는 Vibration API를 우선 적용했다. 1440×960·390×844에서 proxy가 레이아웃·pointer·overflow에 영향을 주지 않고 console/page error 0이다.
- [x] commit `b5a6257`을 `main`에 fast-forward하고 Vercel production `dpl_EBDuE1J618hRb3eQiBMLxbKFc8Kd`의 `READY`·`sgyun.kr` alias를 확인했다. 실제 도메인의 홈·Works·한/영 About·Calibration은 200, 최근 30분 runtime error 0이다.

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

- [x] 01–06 각각의 active dial marker 순각도가 모두 `-90°`이고 counter-rotation 후 글자 순회전이 `0°`다.
- [x] scroll이 멈추면 `1 / 5` 간격의 가장 가까운 project detent로 snap한다.
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

## Multi-skill design review pass — 2026-07-30

- [x] 홈의 `전체 보기`가 독립 control island에서 primary media telemetry baseline으로 이동해 제어 대상과 소유 관계가 일치한다.
- [x] 390×844 홈은 `media 12,111–382,269.625 → rail 283.625–327.625 → info 341.625–530.0625`의 연속 흐름이며 각 구간이 겹치지 않는다.
- [x] 모바일 half dial은 `x=292`, 중심 `y=597.21875`에 있어 오른쪽 엄지 영역을 유지하고 프로젝트 정보 열과 교차하지 않는다.
- [x] About 첫 장면은 대형 제목, 작업 태도, 이름·위치 datum을 같은 viewport 안에서 독립 grid cell로 표시한다. 1440×960, 768×1024, 390×844에서 제목과 thesis 교차는 0이다.
- [x] `/ko`, `/ko/works`, `/ko/works/wrgs`, `/ko/about`을 1440×960, 768×1024, 390×844에서 확인했고 수평 overflow, 깨진 이미지, page error, console error가 모두 0이다.
- [x] archive dialog는 열릴 때 닫기 버튼으로 focus가 이동하고 Escape 후 trigger로 복귀한다. 다이얼의 `End` 키는 세 viewport에서 모두 `aria-valuenow=6`으로 동기화된다.
- [x] tablet·mobile project rail에 명시적 accessible name을 추가한 뒤 axe-core WCAG 2 A/AA violation이 0건이다.
- [x] `npx tsc --noEmit`과 Next.js production build를 통과했고 정적 페이지 27개가 생성됐다.
- 검증 캡처: `qa/design-gate-home-desktop.png`, `qa/design-gate-home-tablet.png`, `qa/design-system-review-home-mobile.png`, `qa/design-gate-about-desktop.png`, `qa/design-gate-about-tablet.png`, `qa/design-gate-about-mobile.png`.

## Critical audit and correction — 2026-07-30

- [x] 1440×960, 1024×900, 720×960 reflow, 390×844, 320×720에서 홈·인덱스·필터·상세·About·Contact·영문 홈 총 35개 프로덕션 렌더를 검사했다.
- [x] 수평 overflow, 핵심 요소 overlap, 깨진 가시 이미지, console/page error, actionable request failure, axe-core WCAG 2 A/AA violation, 작은 조작 대상이 모두 0건이다.
- [x] 모바일 전역 nav에서 INDEX·About·Contact·언어 전환이 유지되고 320px에서도 문서 overflow가 없다.
- [x] archive dialog focus trap과 Escape focus restore가 5개 폭에서 모두 통과했다.
- [x] 빠른 wheel 정·역방향과 pointer drag가 dial index에 동기화됐다.
- [x] reduced motion, JavaScript-off, 대표 미디어 강제 실패, 잘못된 상세 경로 404를 검증했다.
- [x] locale별 `html lang`, canonical, Open Graph image, 중복 없는 홈 title을 확인했다.
- [x] `npm run typecheck`, `git diff --check`, `npm run build`가 통과했고 정적 페이지 28개가 생성됐다.
- [ ] 느린 3G 로컬 측정의 LCP `3.288s`는 배포 preview에서 다시 측정하고 개선한다. CLS는 `0`, 총 전송은 `551KB`, 첫 화면 이미지는 `2개 / 27KB`였다.
- [ ] 실제 모바일의 Web Audio 음량과 vibration 체감은 실기기 검증이 필요하다.
- [ ] `npm audit` high 3건은 Next.js가 포함한 PostCSS·Sharp 호환 업그레이드가 필요하다. 강제 major upgrade는 이번 감사 범위에서 수행하지 않았다.
- 최종 보고: `docs/CRITICAL_AUDIT.md`
- 원시 결과와 동일 상태 캡처: `qa/critical-audit/before-fixes/`, `qa/critical-audit/after-fixes/`

## Approved content system and Owner Studio — 2026-07-30

- [x] 홈 다이얼·인덱스·상세가 승인된 6개 대표작을 `01–06` 같은 순서로 표시한다.
- [x] Vibey·ALLSET은 공개 프로젝트에 없고 N03는 About·Profile Ledger의 활동에만 표시된다.
- [x] 초기 VESA·RecoPick 빈 이미지가 깨진 요청 없이 `MEDIA_PENDING`으로 렌더링됐고, VESA는 이후 실제 미디어로 전환했다. RecoPick은 대기 상태를 유지하며 실제 이미지 요청 실패는 `MEDIA_UNAVAILABLE`로 전환된다.
- [x] Home·Works·About·Contact·Appendix 5개 route dial 항목이 표시되고 About 진입 시 `03 / PROFILE`로 동기화된다. 방향키 포커스 이동과 Enter 링크 이동을 확인했다.
- [x] Appendix는 `00 RECORDS` 빈 상태이며 보류 작업을 임의로 노출하지 않는다.
- [x] `/studio` 미인증 접근은 로그인으로 이동하고, 잘못된 비밀번호는 거부되며, 인증 후 `06 PUBLISHED`와 승인한 6개 제목을 순서대로 표시한다.
- [x] Studio 인증 상태에서 콘텐츠 API가 6개 원본을 반환한다. 실제 게시 PUT과 GitHub 커밋은 운영용 토큰을 저장하지 않기 위해 이번 로컬 검증에서 실행하지 않았다.
- [x] 1440×960, 1024×900, 720×960, 390×844, 320×720 × 9개 경로의 45개 렌더에서 HTTP 200, 수평 overflow 0, 깨진 이미지 0, console/page error 0을 확인했다.
- [x] wheel 정·역방향은 `01→06→01`, drag는 `01→03`으로 다이얼·스크롤이 동기화됐다. reduced motion, JavaScript-off, 404, Vault 진입·복귀도 통과했다.
- [x] `npm run typecheck`, `git diff --check`, `npm run build`가 통과했고 정적 페이지 29개를 생성했다.
- 로컬 느린 3G 합성의 당시 기준값: LCP 1.020s, CLS 0, 총 전송 704KB. VESA 미디어 등록 뒤 별도 재측정한다.
- 원시 결과와 캡처: `qa/critical-audit/content-system-v2/`

## Global Vault Dial identity pass — 2026-07-30

- [x] 오른쪽 half dial이 홈 첫 장면부터 Practice·Profile까지 fixed 상태로 유지되고 Works·상세·About·Contact·Appendix에도 같은 face anatomy와 화면 축으로 표시된다.
- [x] 페이지별 rail은 Works `Overview / Selected / Appendix`, 상세 `Overview / Premise / Process / Next`, About `Profile / Identity / Education / Practice / Records / Contact`, Contact `Contact / Channels`, Appendix `Reserved / Status`로 실제 section id와 연결된다.
- [x] About의 `Practice`, 상세의 `Next` rail 선택이 해당 섹션 상단으로 이동하고 active index를 함께 갱신한다. 홈은 Ledger 확장 후 키보드 `End→08`, wheel `01→08→01`, 모바일 drag `01→03`으로 동기화된다.
- [x] 작은 rotary latch의 백색 datum을 12시 축의 `1.5–2px × 5–10px` capsule로 통일하고, 기울어진 독립 emissive pointer와 과도한 glow를 제거했다.
- [x] 1440×960, 1024×900, 720×960, 390×844, 320×720 × 9개 경로의 45개 렌더에서 HTTP 200, 수평 overflow 0, 깨진 이미지 0, console/page error 0을 확인했다.
- [x] reduced motion, JavaScript-off, 미디어 실패, 404, 프로젝트 진입·복귀가 유지된다. 로컬 합성 수치는 LCP 1.024s, CLS 0이었다.
- 검증 캡처와 원시 결과: `qa/critical-audit/final-vault-identity-v4/`

## Continuous dial motion correction — 2026-07-30

- [x] 사용자 화면 기록의 Works·About 빠른 스크롤을 0.5초 간격으로 분해해, 기존 face가 정수 section 전환 때만 계단식 회전하고 observer 판정이 콘텐츠보다 늦는 원인을 확인했다.
- [x] 홈은 ScrollTrigger의 소수 cursor를 공통 Vault Dial의 CSS angle에 직접 연결했다. `scrollY 0 / 300 / 600 / 900 / 1200`에서 각도는 `0 / -5.912 / -11.823 / -17.735 / -23.647deg`로 연속 변화했다.
- [x] 내부 페이지는 IntersectionObserver의 최대 교차율 판정을 제거하고 section anchor 사이의 scroll progress를 보간한다. About 빠른 하향 스크롤에서 active sequence는 `01→02→03→04→05`, 역회전 frame은 `0`이었다.
- [x] About section 중간 지점의 face angle은 `-7.207 / -21.604 / -36.006 / -50.399 / -66.396deg`로 정수 각도 사이에서도 연속 변화했다.
- [x] 직접 drag는 `auto` 추종 후 release에서 한 번만 settle하며 About `01→03`, 홈 모바일 `01→03`을 확인했다.
- [x] 5개 화면 폭 × 9개 경로 45개 렌더에서 HTTP 200, overflow 0, 깨진 이미지 0, console/page error 0을 유지했다. Ledger 확장 후 wheel `01→08→01`, reduced motion, JavaScript-off, 404, 미디어 실패도 통과했다.
- 원시 결과와 캡처: `qa/critical-audit/dial-motion-continuous/`

## VESA project publication — 2026-07-30

- [x] 렌더·실물 제작 사진 9개를 hero, process, evidence 순서로 선별했고 원본 비율과 한국어·영어 대체 텍스트를 연결했다.
- [x] VESA의 실제 공개 순서는 `1.jpg → 2.jpg → 3.jpg → 4.jpg → 5.jpg → 6.jpg → 7.jpg → 실사1.jpg → 실사2.jpg`와 일치하며, YouTube 작동 영상은 이미지 기록 뒤에 배치했다.
- [x] 2048px 홈 렌더에서 타이틀·미디어와 인덱스·미디어의 교차 영역이 각각 0px이며, 긴 VESA 타이틀은 정보 열 안에서 축소된다.
- [x] 약 1.8GB ProRes 원본 영상은 저장소에 복제하지 않았다. 포스터 재생 전 YouTube 관련 iframe과 네트워크 요청은 0건이며, 재생 입력 뒤 `youtube-nocookie.com` 임베드와 외부 영상 링크가 동작한다.
- [x] VESA 상세에만 `04 / EVIDENCE`가 생성되고 1440×960, 1024×900, 720×960, 390×844, 320×720 모든 화면에서 해당 섹션과 다이얼 값이 동기화된다. 다른 상세 페이지는 기존 4개 인덱스를 유지한다.
- [x] 다섯 화면 폭에서 페이지 끝까지 순차 스크롤한 결과 수평 overflow, 깨진 이미지, console/page error가 모두 0건이며 재생 버튼의 키보드 포커스와 Enter 재생이 통과했다.
- [x] 기존 9개 핵심 경로 × 5개 화면 폭의 45개 회귀 렌더도 HTTP 200, overflow 0, 깨진 이미지 0, console/page error 0을 유지했다.
- [x] `npm run typecheck`, JSON 파싱, `git diff --check`, `npm run build`가 통과했고 정적 페이지 29개를 생성했다.
- 파일 순서 수정 뒤 느린 3G 로컬 합성: LCP 1.040s, CLS 0, 초기 전송 771KB, 첫 화면 이미지 요청 1개 / 14KB. YouTube는 사용자 재생 전 초기 전송에 포함되지 않는다.
- 원시 결과와 캡처: `qa/critical-audit/vesa-publication/`

## Landing Ledger dial extension — 2026-07-30

- [x] 홈 dial items를 작품 `01–06`과 `07 PRACTICE`, `08 PROFILE`의 8개 anchor로 확장했다.
- [x] 작품 마지막 anchor에서 Practice·Profile까지 face angle은 `-60 / -68.571 / -72 / -80.476 / -84deg`로 연속 변화하고, active value는 `06→07→08`로 갱신된다.
- [x] `07 PRACTICE`, `08 PROFILE` rail 선택이 각 Ledger로 이동하며 drag·keyboard도 같은 8개 anchor를 사용한다.
- [x] 1440×960에서 Profile 최하단까지 horizontal overflow 0, console/page error 0을 확인했다.
- 원시 결과와 캡처: `qa/critical-audit/landing-ledger-dial/`

## VESA detail copy and hierarchy pass — 2026-07-30

- [x] VESA 상세 `/ko/works/vesa-floating-speaker`의 Summary와 Description이 사용자 제공 한국어 원문으로 표시된다. locale 전환 시 영어 원문으로 전환된다.
- [x] 1440px에서 Summary 28.08px, Process heading 31.68px; 720px에서 Summary 24px, Process heading 36px; 390px에서 Summary 28.08px, Process heading 28px; 320px에서 Summary 24px, Process heading 28px으로 계산된다.
- [x] 네 화면 폭에서 document horizontal overflow `0px`, 깨진 이미지 `0`, console/page error `0`을 확인했다.
- [x] 재생 전 iframe `0`개를 확인하고, 재생 입력 후 `https://www.youtube-nocookie.com/embed/PpmmcooixDk?autoplay=1&rel=0` iframe 1개가 생성되는 것을 확인했다.
- [x] `npm run typecheck`, `npm run audit:ui -- detail-copy-review-v2`, `jq empty src/content/portfolio.json`, `git diff --check`가 통과했다.

## The Aviator project publication — 2026-07-30

- [x] `/ko/works/the-aviator`에서 `01.jpg → 02.jpg → 03.jpg → 04.jpg → 05.jpg → process.jpg → real-prototype.jpg` 순서로 7개 이미지가 모두 로드됐다.
- [x] 1440×960과 390×844에서 document horizontal overflow `0px`, 깨진 이미지 `0`, console/page error `0`을 확인했다.
- [x] 재생 전 iframe `0`개를 확인하고, 재생 입력 후 `https://www.youtube-nocookie.com/embed/T-T_7QIveWY?autoplay=1&rel=0` iframe 1개가 생성되는 것을 확인했다.
- [x] The Aviator 상세에 `EVIDENCE`가 생성되고, 이미지 기록·프로세스·실물 프로토타입·영상이 같은 다이얼 인덱스 문맥으로 연결된다.
- [x] `jq empty src/content/portfolio.json`, `npm run typecheck`, `git diff --check`가 통과했다. production build는 다음 최종 검증에서 함께 수행한다.

## Mobile dial native pan and FIELD_00 — 2026-07-31

- [x] 일반 Vault Dial의 computed `touch-action`은 `pan-y pinch-zoom`, `FIELD_00` 전용 scrub dial은 `none`이다.
- [x] 390×844 CDP touch sequence에서 홈 다이얼 위 upward pan은 `scrollY 0→265`, About은 `0→263`으로 이동했다. touch pointer는 capture되지 않고 move별 programmatic scroll을 호출하지 않는다.
- [x] 같은 touch sequence에서 Calibration은 `scrollY 0→0`, slider `01→03`으로 바뀌어 페이지 pan과 toy scrub이 분리됐다.
- [x] `− / SET / +` 대체 입력으로 `03→08→05`를 입력해 desktop·mobile 모두 `LOCKED` 완료 상태에 도달했다.
- [x] route dial에 일반 목적지와 분리된 `00 / 캘리브레이션 / FIELD_00` 링크가 표시되고 `/ko/calibration`으로 연결된다.
- [x] 제거된 About Identity anchor를 다이얼 목록에서도 삭제해 실제 `Profile→Education→Practice→Records→Contact` 다섯 섹션과 `01→05`가 다시 일치한다.
- [x] 1440·1024·720·390·320px Calibration에서 horizontal overflow, 제목 열 overflow, key overlap, console/page error가 모두 0이다.
- [x] reduced motion에서는 scan animation이 제거되고 slider의 rail·방향키·Home·End 조작이 유지된다.
- [x] 전체 회귀 감사 55개 렌더와 `npm run typecheck`, `npm run build`, `git diff --check`가 통과했다.
- 원시 결과와 초기 캡처: `qa/critical-audit/mobile-dial-field00/`. 최종 optical correction 캡처: `/tmp/sgyun-calibration-desktop.png`, `/tmp/sgyun-calibration-mobile.png`, `/tmp/sgyun-calibration-compact.png`.

## Direct page scrub and first-visit guide — 2026-07-31

- [x] 홈과 내부 페이지 slider의 computed `touch-action`은 `none`인 전용 `page-scroll` mode이며, Calibration은 기존 숫자 `scrub` mode를 유지한다. 두 모드는 같은 pointer capture를 쓰지만 전역은 문서 pixel, Calibration은 detent index를 갱신한다.
- [x] 390×844 CDP touch에서 12px 전에는 문서가 움직이지 않고, 120px upward drag는 `scrollY 0→130`, 150px 표준 감사에서는 홈·About 모두 `0→162`로 이동했다. 이전 section 직접 변환식처럼 큰 거리를 건너뛰지 않는다.
- [x] 1440×900 mouse 120px upward drag는 About `scrollY 0→139`로 이동했다. drag 중 `html[data-vault-dial-scrubbing=true]`가 smooth scroll을 끄고 release 뒤 속성이 제거됐다.
- [x] pointer down에서 `data-interacting=true`, 모바일 computed scale 약 `1.07`(190ms 전환 중간값), release 뒤 `false`로 복구됐다. 390·320px document horizontal overflow는 0이다.
- [x] 다이얼 밖 일반 `window.scrollTo(720)`에서도 홈 slider 값이 `01→02`로 바뀌어 passive scroll sync가 유지됐다.
- [x] 최초 방문 가이드는 700ms 뒤 표시되고 `SCROLL_01→DRAG_02`로 전환한다. 노출 즉시 `sgyun:vault-dial-guide:v1=seen`을 기록하며 같은 브라우저 reload 뒤 DOM 노출은 0건이다.
- [x] 320×720에서 모바일 가이드를 94px 높이의 하단 safe panel로 축약해 `프로젝트 열기` CTA와 수직 교차가 0px이다. Calibration과 존재하지 않는 상세 404에서는 가이드·전역 dial을 만들지 않는다.
- [x] 5개 화면 폭 × 11개 경로 55개 렌더에서 HTTP 200, horizontal overflow 0, 깨진 이미지 0, console/page error 0을 유지했다. Calibration의 touch drag `01→03`, 대체 입력 `03→08→05`, `LOCKED` 완료가 통과했다.
- [x] `npm run typecheck`, `npm run build`, `node --check scripts/critical-audit.cjs`, `git diff --check`가 통과했고 정적 페이지 29개를 생성했다.
- 원시 회귀 결과와 캡처: `qa/critical-audit/dial-guide-page-scrub/`. 최종 320px 광학 보정 캡처: `/tmp/sgyun-dial-guide-320-v4.png`.

## Concentric scrim and VAULT_01 — 2026-07-31

- [x] 884×863 Works와 About을 같은 상태로 비교해 다이얼 배경이 원형 중심과 같은 radial falloff로 표시되고 넓은 타원 경계가 사라지는 것을 확인했다.
- [x] Calibration 완료 시 `sgyun:field-calibrated:v1=unlocked`가 저장되고 `OPEN VAULT`가 `/ko/vault`로 연결된다.
- [x] 저장값 없이 `/ko/vault`에 접근하면 `FIELD NOT CALIBRATED`가 표시되고 최초 방문 다이얼 가이드는 생성되지 않는다.
- [x] `− / SET / +`로 `07 UP → 02 DOWN → 09 UP`을 입력해 `data-vault-open=true`, stage 3, archive 복귀 링크를 확인했다.
- [x] 1440·1024·720·390·320px × 12개 경로, 총 60개 production 렌더에서 HTTP 200, horizontal overflow 0, 깨진 이미지 0, console/page error 0, actionable request failure 0이다.
- [x] 390×844 Vault의 horizontal overflow 0과 reduced-motion 적용을 확인했다.
- [x] `npm run typecheck`, `npm run build`, `node --check scripts/critical-audit.cjs`, `git diff --check`가 통과했고 31개 정적 페이지를 생성했다.
- 원시 결과: `qa/critical-audit/vault-easter-egg-v2/report.json`. 비교 캡처: `/tmp/sgyun-works-concentric.png`, `/tmp/sgyun-vault-ready.png`, `/tmp/sgyun-vault-open.png`, `/tmp/sgyun-vault-mobile.png`.
- [x] commit `1778a91`을 `codex/folder-archive-prototype`에 push하고 Vercel production `dpl_Dx873uZaZQFCxQizYZSvbnQyWPR8`을 `READY` 및 `sgyun.kr` alias로 확인했다. 실제 도메인의 `/ko`, `/ko/works`, `/ko/calibration`, `/ko/vault`, `/en/vault`가 200이며 모바일 Vault stage 3 open, overflow 0, browser error 0, 최근 30분 runtime error 0이다.
