# Current status — Portfolio A renewal (2026-10-12)

- Working branch: `codex/portfolio-a-renewal`, based on `d6353c1`.
- Active checkout verified on MacBook 2026-10-12: `~/Workspace/10_PROJECTS/sgyun-portfolio-renewal`.
- Entry: standalone Portfolio A cover with draggable steel-wire Y, damped rebound, animated dial handoff and Works navigation. Sound defaults ON and mute persists across routes.
- User contract: Figma Portfolio A almost unchanged, with a small vault dial and ratchet sound. Latest overlapping copy and images come from Portfolio A.
- Six projects: VESA, Vibey, WRGS, Double Wishbone Chair, The Aviator, CINDER. Source profile and awards updated. Prior non-selected records preserved as Studio drafts.
- Source layout: six cover compositions, 29 detail pages, 103 individually exported assets including source web previews. See asset manifest for actual inventory.
- Public portfolio routes use the white Portfolio shell; source dark pages retain original contrast. Legacy vault/calibration utility routes retain their existing shell.
- Local preview: `npm run dev -- --port 3100` → http://localhost:3100/ko.
- Final verification: TypeScript passed, production build passed (34 routes), git diff --check passed, 103 asset files present. Desktop/mobile browser evidence is recorded in docs/VALIDATION.md.
- Production site has not been deployed from this branch.

---

## Previous deployed implementation (historical)

# SGYUN Portfolio — Status

## 현재 판정

2026-08-31 일반 페이지 다이얼을 native scroll에 반응하는 passive instrument로 단순화하고 WGA 2026 수상을 Recognition에 추가했다. commit `b5a6257`을 `main`에 반영했고 Vercel production `dpl_EBDuE1J618hRb3eQiBMLxbKFc8Kd`가 `READY` 상태로 `sgyun.kr`에 연결됐다.

## 구현된 범위

- 한국어·영어 홈, 작품 인덱스, 작품 상세, About, Contact, 빈 Appendix
- Home·Works·About·Contact·Appendix와 선택적 `FIELD_00`을 여는 상단 route dial
- 홈 전체와 Works·상세·About·Contact·Appendix에서 지속되는 오른쪽 half dial
- 페이지별 실제 섹션 인덱스와 native scroll을 시각·라쳇 사운드로 반영하는 공통 Vault Dial
- 소수 scroll cursor로 연속 회전하고 정수 detent에서만 rail·번호·라쳇을 갱신하는 dial motion
- 홈 작품 `01–06`에서 `07 PRACTICE`, `08 PROFILE`까지 이어지는 전체 페이지 dial cursor
- Vault CTA 및 route transition
- 원본 비율 기반 미디어 프레임과 반응형 재구성
- 데스크톱 즉시 활성화를 먼저 시도하는 라쳇 Web Audio, 모바일 native-scroll detent와 이스터에그 scrub의 지원 기기 haptic
- 12시 축의 가는 datum과 동일한 graphite face anatomy를 공유하는 소형 rotary latch family
- reduced-motion, 이스터에그 키보드 slider, archive dialog
- 홈의 장식 문구·중복 상태·카운트를 덜어낸 quiet portfolio hierarchy
- 일반 페이지에서 hit area·pointer capture·drag-to-scroll·slider role·rail click·gesture guide를 제거한 passive dial
- 다이얼 위에서 시작한 touch도 native pan으로 통과하며 일반 wheel·trackpad·touch scroll과 시각 상태를 동기화
- `03→08→05` detent를 맞추는 한·영 `FIELD_00` 캘리브레이션 토이와 touch·mouse·rail·키보드 대체 입력
- Calibration 완료 뒤에만 발견되는 `VAULT_01`, `07 UP→02 DOWN→09 UP` 교대 방향 조합과 aperture open·replay
- 밝은 surface에서도 패널처럼 보이지 않는 다이얼 중심 동심원형 safety falloff
- 상세 Summary·Description·Process·Evidence의 읽기 폭·자간·행간·한국어 줄바꿈 규칙
- 404·runtime error·미디어 실패 상태
- locale별 canonical, 상세 Open Graph 메타데이터, 공통 Open Graph 이미지
- 비밀번호 인증, draft/published, 순서·분류·문구·미디어 편집을 제공하는 `/studio`
- 개발 환경 로컬 저장과 운영 환경 GitHub Contents API 게시 동기화

## 콘텐츠 상태

- `src/content/portfolio.json`이 프로필과 프로젝트의 단일 원본이다.
- Wonder Global Design Awards 2026의 Product / Consumer Electronics / Audio Devices 부문 Student Winner — VESA Based Floating Speaker를 한·영 Recognition 첫 항목으로 추가했다.
- 현재 공개 대표작 5개가 `published` 상태다: VESA, The Aviator, Double Wishbone Chair, WRGS, V-CADO. RecoPick은 Owner Studio에 `draft`로 보존하지만 공개 포트폴리오에서는 제외했다.
- Vibey·ALLSET은 제외했고 N03는 활동 이력에만 포함했다.
- VESA는 전달받은 파일명 순서 `1→2→3→4→5→6→7→실사1→실사2`로 선별한 렌더·실물 제작 사진과 지연 로딩 YouTube 작동 영상을 연결했다. 홈 미디어와 오른쪽 인덱스 사이에는 전용 안전 열을 확보했다. RecoPick은 현재 공개하지 않고 초안으로 보류한다.
- VESA 상세의 `Summary / Description`은 사용자가 제공한 한국어·영어 원문으로 교체했다. `detailSummary`는 중간 크기의 리드 문장, `detailDescription`은 읽기 본문으로 표시하며 Owner Studio에서도 두 필드를 수정할 수 있다. 이후 작품 설명도 상황·문제·설계 응답·효과를 구체적으로 잇는 같은 어투를 사용한다.
- The Aviator는 기존 이미지 세트를 새로 받은 `01→02→03→04→05→process→real-prototype` 순서로 교체했고, 실제 프로토타입 기록은 YouTube `T-T_7QIveWY` 지연 임베드로 연결했다. Summary/Description과 세 장면은 The Aviator 프로젝트 노트의 확인된 구성·메커니즘·전시·수상 범위 안에서 다시 작성했다.
- `src/lib/works.ts`와 `src/components/home/`은 이전 콘텐츠 모델·컴포넌트로 현재 라우트에서 사용하지 않는다.

## 확인이 남은 범위

- RecoPick의 공개 여부와 최종 이미지 선별은 보류한다.
- VESA 공개 문구·이미지 순서·캡션의 사용자 최종 승인
- V-CADO의 세부 기여 범위와 변동 가능한 수상 결과의 후속 근거
- 실제 iPhone Safari의 native switch detent 햅틱과 일반 페이지 라쳇 사운드 크기, `FIELD_00`·`VAULT_01` 햅틱 강도
- 실제 iOS Safari·Android Chrome에서 다이얼 위 native pan 통과와 `FIELD_00` 숫자 scrub·`VAULT_01` 교대 방향 조합의 손가락 체감
- 배포 환경의 LCP·CLS·INP와 캐시 정책
- 운영 환경 Studio 비밀번호·세션 비밀·최소 권한 GitHub 토큰 설정과 실제 배포 동기화
- 게시 이력 rollback·미리보기는 후속 기능
- ESLint 구성과 2026-07-30 기준 npm audit high 3건의 호환 가능한 상위 버전 검토

## 최종 검증 요약

- 2026-08-31 local 회귀: 1440×960·390×844의 홈·Works·About에서 일반 dial slider/hit area/guide 0, horizontal overflow 0, console/page error 0. 일반 스크롤 뒤 face transform이 변경됐고 모바일 다이얼 위치 native pan은 `scrollY 0→135`, 데스크톱 wheel은 `0→650`으로 통과했다.
- `FIELD_00`은 interactive slider 1개를 유지했고, WGA 항목은 한국어 홈·About과 영문 About에 표시됐다. `jq empty`, typecheck, production build와 diff check가 통과했다.
- 2026-08-31 sound/haptic 보강: desktop mount에서 AudioContext 생성·resume을 먼저 시도하고 autoplay 차단 상태는 최초 wheel 뒤 `running`으로 전환됐다. iPhone용 native switch haptic proxy와 Vibration API fallback을 렌더했으며 두 화면 폭에서 overflow·console error 0이다. 실제 Taptic Engine 감각은 실기기 확인이 남았다.
- 2026-08-31 production 회귀: 1440×960·390×844의 `sgyun.kr/ko`에서 WGA 표시, guide/slider 0, haptic proxy, native scroll, overflow 0, console/page error 0을 확인했다. Works·한/영 About·Calibration은 200이며 최근 30분 runtime error 0이다.

- 1440, 1024, 720 reflow, 390, 320px × 9개 경로: HTTP/overflow/image/console/page error 구현 게이트 통과
- 전역 half dial의 5개 화면 폭 고정 위치, 페이지별 section rail, 홈 wheel `01→08→01`, Ledger `07/08`, 모바일 drag `01→03`, 키보드 `End→08` 동기화 통과
- dialog keyboard trap·focus restore, wheel 정·역방향, dial drag, reduced motion, JavaScript-off, media failure, branded 404 통과
- production build: 정적 페이지 31개
- 전역 page scrub: 390px touch 120px drag에서 `scrollY 0→130`, About 포함 150px 표준 시나리오에서 `0→162`; 1440px mouse 120px drag에서 `0→139`. 조작 중 확대와 release/cancel 복구가 모두 동작했다.
- 최초 방문 가이드: 첫 노출 `visible`, 저장값 `seen`, 같은 브라우저 reload 후 노출 0건. 320px에서 프로젝트 CTA와 교차 0px이며 404에서는 다이얼·가이드를 모두 숨겼다.
- 회귀 감사: 5개 화면 폭 × 11개 경로 55개 렌더에서 HTTP 200, overflow 0, 깨진 이미지 0, console/page error 0. `FIELD_00`의 touch 숫자 scrub과 `LOCKED` 완료를 유지했다.
- 최종 회귀 감사: 5개 화면 폭 × 12개 경로 60개 렌더에서 HTTP 200, overflow 0, 깨진 이미지 0, console/page error 0, actionable request failure 0. production 모바일에서 Vault 직접 접근 잠금·stage 3 open·Archive 복귀까지 통과했다.
- Vercel production `dpl_Dx873uZaZQFCxQizYZSvbnQyWPR8`은 `READY`, `sgyun.kr` alias 연결, `/ko`·Works·Calibration·한/영 Vault 200, 최근 30분 runtime error 0이다.
- VESA 파일 순서 수정 뒤 느린 3G 로컬 합성: LCP 1.040s, CLS 0, 초기 전송 771KB. 첫 화면에는 최적화한 hero 1개만 요청되며 YouTube는 재생 전 요청 0건이다.

## 작업 경계

이번 변경은 사용자의 요청에 따라 재검증 후 커밋·푸시·production 배포를 완료했다.

## Humble visual hierarchy pass — 2026-07-31

- [x] About의 자기소개·교육·작업 축 제목을 한 단계 낮추고, 본문은 읽기 폭과 행간을 유지해 주장보다 작업 방식이 먼저 읽히게 했다.
- [x] 홈 Profile의 이름, Recognition·Activity 헤더, 행 간격을 축소해 기록이 과장된 성취 블록처럼 보이지 않도록 조정했다.
- [x] Works의 `ARCHIVE INDEX`, Contact의 호출 문구, Appendix의 예약 제목을 낮춰 개인을 크게 선언하는 디스플레이 타이포그래피를 줄였다. 작품 상세의 작품명과 프로세스 제목은 작업 탐색에 필요한 위계를 유지했다.
- [x] 1440px·390px에서 홈, Works, The Aviator 상세, About, Contact, Appendix를 production build 서버로 끝까지 스크롤해 HTTP 200, overflow 0, console/page error 0, 표시 이미지 실패 0을 확인했다.
- [x] `npm run typecheck`, `npm run build`, `git diff --check` 통과.
- [x] `88468fd`를 GitHub `main`에 반영하고 Vercel production 배포 `dpl_TmXzUfRewCyBe7NawVTsiNz1sSBL`을 `READY` 상태로 확인했다. `sgyun.kr` alias, 주요 경로 200, runtime error 없음.

## Quiet copy pass — 2026-07-31

- [x] About의 선언문형 Identity 본문과 중복 이름 패널을 제거해 역할·교육·활동·연락처만 남겼다.
- [x] 프로필 요약을 `제품·웹·앱을 설계하고 구현합니다.` / `I design and build products, websites, and apps.`로 낮춰 작업보다 자기서사가 앞서지 않게 했다.
- [x] 20개 개인 포트폴리오의 카피 구조를 조사하고 `docs/RESEARCH.md`에 출처·관찰·적용 원칙을 기록했다.
- [ ] production 재배포 후 About과 홈 Profile의 긴 문장·줄바꿈·다이얼 안전 열을 1440px·390px에서 재승인한다.

## Mobile dial native pan and FIELD_00 — 2026-07-31

- [x] 홈·내부 페이지의 touch pointer capture와 move별 `window.scrollTo`를 제거하고 `touch-action: pan-y pinch-zoom`으로 native scroll을 우선했다.
- [x] CDP 실제 touch sequence를 오른쪽 다이얼에 보낸 결과 390×844 홈은 `scrollY 0→265`, About은 `0→263`으로 이동했으며 브라우저 스크롤이 차단되지 않았다.
- [x] `/ko/calibration`, `/en/calibration`에 공통 Vault Dial anatomy를 사용하는 `FIELD_00` 토이를 추가했다. 일반 페이지와 달리 이 장면만 `touch-action: none` scrub을 사용한다.
- [x] 모바일 touch drag는 페이지를 움직이지 않고 slider `01→03`으로 변했으며, `03→08→05` 완료 뒤 `LOCKED` 상태에 도달했다. `− / SET / +`, rail과 키보드가 대체 입력으로 동작한다.
- [x] 1440·1024·720·390·320px × 기존 경로와 새 Calibration 경로에서 HTTP 200, overflow 0, 깨진 이미지 0, console/page error 0을 확인했다. Calibration 제목 열 침범을 수정한 뒤 다섯 폭 모두 `h1Overflow 0`으로 재검증했다.
- [x] reduced motion에서 field scan animation이 `none`이며 `npm run typecheck`, `npm run build`, `git diff --check`가 통과했다.
- 검증 결과와 캡처: `qa/critical-audit/mobile-dial-field00/`, `/tmp/sgyun-calibration-*-locked.png`.

## Quiet portfolio and dial interaction pass — 2026-07-30

- [x] 홈의 identity signal, 중복 작품 상태·비율·기록 수·검증 문구·Practice 선언문·Appendix 설명을 제거해 필요한 정보만 남겼다.
- [x] 홈 Practice/Profile을 작품 분류, 프로필, 수상·활동 기록 중심으로 재구성하고 실제 문구를 덮지 않도록 전용 여백을 유지했다.
- [x] Vault Dial의 시각 요소와 입력 영역을 분리해 보이는 원판 전체를 드래그 hit area로 사용한다.
- [x] 마우스 170px/단계, 터치·펜 300px/단계로 감도를 분리하고 드래그 직후 페이지가 정수 작품으로 튀는 ScrollTrigger snap을 제거했다.
- [x] 상세 본문에 reading type token, 45–75자 수준의 읽기 폭, 1.7/1.78 행간, 한국어 keep-all과 완화된 tracking을 적용했다.
- [x] 1440·390px 홈/상세에서 HTTP 200, overflow 0, console/page error 0과 다이얼 drag 반응을 확인했다.
- [x] `npm run typecheck`, `npm run build`, `git diff --check`를 통과했다.
- [x] `https://sgyun.kr/ko`와 The Aviator 상세가 200, overflow 0, 이미지 오류 0으로 응답하는 것을 1440·390px에서 확인했다. RecoPick은 공개 보류에 따라 404로 확인했다.
- [x] Vercel production deployment가 Ready 상태이며 `https://sgyun.kr` alias가 연결됐다. 최근 1시간 error log는 없었다.

## VESA detail copy and hierarchy pass — 2026-07-30

- [x] VESA 상세의 기존 `premise` 문장을 사용자 제공 `Summary / Description` 한·영 카피로 교체했다.
- [x] `Summary`와 `Description`을 별도 열과 라벨로 분리해, 긴 설명을 거대한 선언문으로 처리하지 않고 리드 문장과 읽기 본문으로 위계를 낮췄다.
- [x] 프로세스 카드 제목을 데스크톱 28–38px, 모바일 28–36px 범위로 축소하고 카드 높이·간격을 함께 줄였다. 이미지가 프로세스의 주 시각 질량으로 남는다.
- [x] Owner Studio 상세 이야기 영역에 Summary와 Description 편집 필드를 추가했다. 기존 프로젝트는 Summary가 `detailIntro`로 안전하게 fallback되고 Description은 선택적으로 표시된다.
- [x] 1440, 720, 390, 320px에서 VESA 상세를 실제 렌더링해 overflow 0, 깨진 이미지 0, console/page error 0, 재생 전 iframe 0을 확인했다. 재생 클릭 뒤 YouTube no-cookie iframe 생성도 확인했다.
- 검증 명령: `npm run typecheck`, `npm run audit:ui -- detail-copy-review-v2`, `jq empty src/content/portfolio.json`, `git diff --check`.

## The Aviator project publication — 2026-07-30

- [x] The Aviator의 기존 전용 이미지 5개를 공개 경로에서 제거하고, 새 이미지 7개를 원본 비율과 함께 등록했다. 기존 파일은 복구 가능하도록 프로젝트 밖 임시 보관소로 이동했다.
- [x] Summary/Description과 3개 장면을 지식체계의 확인 사실인 3인치 풀레인지 유닛 2개, Bluetooth·앰프, 액추에이터·스프링·힌지·베어링, 알루미늄 윙·스탠드, 실제 프로토타입, 2025 전시·강원디자인전람회 입선 범위에서 작성했다.
- [x] 프로세스 콜라주와 실물 프로토타입 이미지를 `EVIDENCE`에 배치하고, 작동 영상은 로컬 MP4를 복제하지 않고 YouTube 지연 임베드로 연결했다.
- [x] The Aviator 상세를 데스크톱·모바일에서 끝까지 스크롤해 이미지 순서, overflow 0, 깨진 이미지 0, console/page error 0, 재생 전 iframe 0을 확인했다. 재생 클릭 뒤 `youtube-nocookie.com/embed/T-T_7QIveWY?autoplay=1&rel=0` 생성도 확인했다.

## Release continuity refinement — 2026-10-12

User found a pause between rebound and dial travel. Flight now overlaps recoil after 70 ms, with continuous spring/arc blending and rotation; total entry motion reduced from 1700 ms to 1050 ms. No settled middle pose.

- Wishbone cover resolution fixed: replaced exported 256px processed fill with the original 2048×2562 KeyShot image from the same Figma node; original mirrored direction retained.

- 2026-10-12: Landing guidance now follows the logo/subtitle with 44px desktop / 36px mobile spacing and a slow 2.4s contrast-preserving pulse. Reduced motion disables it. Recoil damping reduced, rebound frequency increased; steel-wire tone uses a decaying pitch oscillation. Continuous 1050ms entry remains.

- User removed the direct Works link from the landing; Y pointer and keyboard activation remain the entry actions.

- Mobile image policy (2026-10-12): cover, detail and CINDER web-preview images flow at intrinsic aspect ratio and auto height. Remove slide-ratio and fixed-height cropping on mobile only; desktop Portfolio A composition unchanged.

- 2026-10-12 live Figma check: cover logo 16:4 is Poppins Regular 400, zero tracking, underline on S only. Corrected landing and navigation wordmark. Guidance now pulses opacity 1→0.12 over 1.6s with visible hold phases; 15px/500. Keyboard focus and reduced motion remain steady.

## Detail fidelity and VESA film — 2026-10-12

- Audited 29 Portfolio A detail frames across VESA, Vibey, WRGS, Wishbone, Aviator and CINDER. Restored source percentage line heights, letter spacing, Noto Sans KR, and single-line source labels.
- Restored 16 source SVG graphics and re-exported 15 small images/QR assets at 2x; raised detail image quality to 95 and used node-width responsive sizes.
- Added VESA YouTube film 7zlyT0hP6_w after Prototype and before Next Project, with lazy no-cookie embed and external fallback.
- Compared representative desktop renders for all six projects; checked mobile VESA intrinsic ratios and no horizontal overflow. Player thumbnail loaded successfully; full playback not certified. Build/type/lint passed.
- Superseded: the earlier conclusion that page 8 source renders were pixelated was incorrect; raw uploads were recovered in the following correction.
- Local preview only; production deployment unchanged.

## Raw image correction — 2026-10-12

The previous fidelity audit missed a critical asset-pipeline error: node exports were clipped to parent frames and stretched back over full node bounds. VESA page 6 was distorted by 2.34x vertically. The original uploads are sharp; prior claims of inadequate source quality were incorrect.

Recovered 12 raw fills across VESA, Wishbone and CINDER using download_assets rawImages. Applied original normalized crop transforms to source pixels, retained full uncropped fills for FILL nodes, saved lossless WebP with versioned paths, and bypassed Next image resizing for these restored assets. No AI enhancement or upscaling. Raw source dimensions/crop provenance are in FIGMA_RAW_IMAGE_RESTORATION.json. Two prototype photos now use original exposure, without reproducing Figma's exposure filter.

Browser verified VESA page 7 loads the actual 1779×1879 / 1775×1879 assets at native proportions; page 6 restored full 2048×2899 portrait fill. Build/type/lint passed. Production unchanged.

## Effect volume — 2026-10-12

Raised current portfolio ratchet and wire-pluck peak gains by 3x (+9.54 dB): 0.042→0.126 and 0.035→0.105. Legacy dial level retained. Tone/envelope and mute unchanged. Single wire voice worst-case summed partial peak remains below 0.251. Actual perceived loudness requires user listening on their device.

## Source composition, favicon and films — 2026-10-12

- Replaced favicon with outlined Poppins Regular S and a full-width underline. Export used a temporary Figma text node, removed in the same call; no persistent design changes.
- Wishbone rear view 36:694 now uses original lossless pixels. Motion connector 36:677 uses multiply blending, matching the actual Figma fill (node opacity is 1).
- VESA Prototype and CINDER pages 35–36 use full-resolution 3840×2160 source composites on desktop, preserving exact masks, exposure, background, stacking and typography. Live semantic content remains in DOM; <=700px retains readable text and intrinsic images. Tradeoff: desktop text is rasterized visually; source headers/page numbers are intentionally retained for exact fidelity.
- Added Aviator T-T_7QIveWY and CINDER m0Xcpsa-vuI lazy no-cookie films before Next Project, with external links. Browser confirmed both player thumbnails, corrected source compositions and transparent connector. Mobile CINDER no horizontal overflow; favicon has refreshed content hash.
- Build/type/lint and git diff checks passed. Local preview updated; production unchanged.

## Live bilingual source layers — 2026-10-12

Supersedes the full-frame composite approach above. Removed all three flattened editorial pages and their public assets. VESA uses two individual photographic compositions with native headings/captions. CINDER uses separate background, car view sheets (no editorial copy), web screenshots and native labels. Restored Figma coordinates and image corner radii for Build Process / Assets; raw screenshot pixels replace low-resolution exports. The web composition uses source crop bounds without manual grid rearrangement.

All 45 Korean editorial text nodes across six projects now have English translations in portfolio-a-en.json; remaining nodes are already English. SourcePages receives locale and translates body text, captions, diagram labels, image descriptions and video links. Embedded software/UI screenshots remain documentary source imagery. Removed redundant English-only overview so section order matches Korean. Desktop uses actual text, with explicit heading line breaks; mobile retains reflow and full images.

Verified build and translation coverage (zero missing Korean-node translations), plus browser English Build Process and Korean source pages. No deployment to production.

## CINDER CRT cover — 2026-10-12

Inspected live Figma frame 65:413: CRT screen shader v584 is applied to the parent frame, not the exported image 58:204. Its effect was omitted during layer reconstruction. Added an SVG chromatic split to the live image/text composition and CSS phosphor mask, scanlines and subtle animated static, with reduced-motion support. Uses source values (mask 30, pitch 12, scanlines 20, size 8, aberration 47) as visual guidance. This is a browser equivalent, not the proprietary shader runtime; shader source retrieval was unavailable. Both Works and detail use the shared cover. Text remains selectable and localized. Build passed and English cover visually checked locally.

## Wishbone English cover and motion film — 2026-10-12
- English cover now uses one stacked text block instead of three fixed Korean-sized columns. Revised tagline to “Automotive DNA, reimagined.” Korean cover unchanged.
- Added user-supplied 2.mp4 at the end of Wishbone content, before Next Project, with muted autoplay, repeat playback, playsInline and native controls (user requested autoplay after initial review). Caption accurately identifies joint animation, not engineering simulation.
- Original Downloads file retained. Web derivative is 1440×1802 H.264, faststart, CRF18. Highlight curve preserves black at 0–15%, lifts 80% to98%, keeping metal shading. Silent audio removed. Poster uses same grade.
- Build passed; desktop cover and video playback checked; responsive player contains portrait footage without cropping.

## Mobile review corrections — 2026-10-13
Mobile-only order corrections: VESA page8 front desk configuration now precedes two lifestyle images; Vibey Imaginator follows user-marked 1→2→3 sequence; Output captions directly follow their corresponding images; WRGS Joint & structure groups both sketches before detail photographs. Desktop absolute positions unchanged. Award logo now serves its sharp 568px source directly rather than an undersized mobile responsive derivative.

## Production release preparation — 2026-10-13
User authorized replacement of sgyun.kr with reviewed Portfolio A version. Existing production d6353c128337bc4a652842e12b1ebe1796fdfb15 (Vercel dpl_Ep1jvA2zEedMsxDTi3Gj5TsgvFDa) preserved on GitHub as branch and annotated tag archive/sgyun-before-portfolio-a-2026-10-13. This preserves tracked old content and media for future curation. Current public works are the six reviewed projects; old selection is not republished.

Production confirmed READY: https://sgyun.kr, deployment dpl_ERmTr5Hw5DERRPXa9nty6933s4TS, source 088c329ef3cd7f9631b67688623dbcba2c49bf85. Domain alias assigned without error. Public /ko, /en/works, Vibey and Wishbone detail return 200; six selected projects confirmed; Wishbone MP4 returns video/mp4 and autoplay markup is present. Browser verified new SGYUN wire landing. Prior production remains recoverable through the archive tag/branch. Verification covers release routes/assets, not long-term runtime monitoring.

## Mobile caption association audit — 2026-10-13
Reviewed all 29 source sections. Replaced coordinate-only mobile ordering for media-caption relationships with explicit groups on pages 5, 10, 11, 16, 26, 29, 31, 33, 35 and 39. Aviator assembly's two photographs stay together before their shared caption. CINDER car names/subtitles/descriptions remain grouped with the relevant view sheet. Mobile captions use a closer 12px image gap. Desktop absolute positioning and source geometry remain unchanged. Production build passed; live local browser verified VESA problem/production/prototype ordering and rendered both example captions directly under their images. User authorized production update.
