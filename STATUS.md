# SGYUN Portfolio — Status

## 현재 판정

2026-07-30 콘텐츠 시스템·조용한 정보 구조·다이얼 조작성 개편 기준으로 1차 대표작 구조와 소유자 게시 흐름은 **구현·로컬 및 production 검증 통과**다. production 배포는 `dpl_AZd3jN3aR28118HXbvHBYDJYtvCi`로 완료했다.

## 구현된 범위

- 한국어·영어 홈, 작품 인덱스, 작품 상세, About, Contact, 빈 Appendix
- Home·Works·About·Contact·Appendix를 여는 상단 route dial
- 홈 전체와 Works·상세·About·Contact·Appendix에서 지속되는 오른쪽 half dial
- 페이지별 실제 섹션 인덱스와 스크롤·drag·키보드를 양방향 동기화하는 공통 Vault Dial
- 소수 scroll cursor로 연속 회전하고 정수 detent에서만 rail·번호·라쳇을 갱신하는 dial motion
- 홈 작품 `01–06`에서 `07 PRACTICE`, `08 PROFILE`까지 이어지는 전체 페이지 dial cursor
- Vault CTA 및 route transition
- 원본 비율 기반 미디어 프레임과 반응형 재구성
- 라쳇 Web Audio, 지원 기기 drag haptic
- 12시 축의 가는 datum과 동일한 graphite face anatomy를 공유하는 소형 rotary latch family
- reduced-motion, 키보드 slider, archive dialog
- 홈의 장식 문구·중복 상태·카운트를 덜어낸 quiet portfolio hierarchy
- 다이얼 전체 hit area, 마우스·터치 감도 분리, 직접 드래그 시 자동 snap 제거
- 상세 Summary·Description·Process·Evidence의 읽기 폭·자간·행간·한국어 줄바꿈 규칙
- 404·runtime error·미디어 실패 상태
- locale별 canonical, 상세 Open Graph 메타데이터, 공통 Open Graph 이미지
- 비밀번호 인증, draft/published, 순서·분류·문구·미디어 편집을 제공하는 `/studio`
- 개발 환경 로컬 저장과 운영 환경 GitHub Contents API 게시 동기화

## 콘텐츠 상태

- `src/content/portfolio.json`이 프로필과 프로젝트의 단일 원본이다.
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
- 실제 모바일 기기의 사운드 크기·햅틱 강도
- 배포 환경의 LCP·CLS·INP와 캐시 정책
- 운영 환경 Studio 비밀번호·세션 비밀·최소 권한 GitHub 토큰 설정과 실제 배포 동기화
- 게시 이력 rollback·미리보기는 후속 기능
- ESLint 구성과 2026-07-30 기준 npm audit high 3건의 호환 가능한 상위 버전 검토

## 최종 검증 요약

- 1440, 1024, 720 reflow, 390, 320px × 9개 경로: HTTP/overflow/image/console/page error 구현 게이트 통과
- 전역 half dial의 5개 화면 폭 고정 위치, 페이지별 section rail, 홈 wheel `01→08→01`, Ledger `07/08`, 모바일 drag `01→03`, 키보드 `End→08` 동기화 통과
- dialog keyboard trap·focus restore, wheel 정·역방향, dial drag, reduced motion, JavaScript-off, media failure, branded 404 통과
- production build: 정적 페이지 29개
- VESA 파일 순서 수정 뒤 느린 3G 로컬 합성: LCP 1.040s, CLS 0, 초기 전송 771KB. 첫 화면에는 최적화한 hero 1개만 요청되며 YouTube는 재생 전 요청 0건이다.

## 작업 경계

이번 변경은 사용자의 요청에 따라 재검증 후 커밋·푸시·production 배포를 완료했다.

## Humble visual hierarchy pass — 2026-07-31

- [x] About의 자기소개·교육·작업 축 제목을 한 단계 낮추고, 본문은 읽기 폭과 행간을 유지해 주장보다 작업 방식이 먼저 읽히게 했다.
- [x] 홈 Profile의 이름, Recognition·Activity 헤더, 행 간격을 축소해 기록이 과장된 성취 블록처럼 보이지 않도록 조정했다.
- [x] Works의 `ARCHIVE INDEX`, Contact의 호출 문구, Appendix의 예약 제목을 낮춰 개인을 크게 선언하는 디스플레이 타이포그래피를 줄였다. 작품 상세의 작품명과 프로세스 제목은 작업 탐색에 필요한 위계를 유지했다.
- [x] 1440px·390px에서 홈, Works, The Aviator 상세, About, Contact, Appendix를 production build 서버로 끝까지 스크롤해 HTTP 200, overflow 0, console/page error 0, 표시 이미지 실패 0을 확인했다.
- [x] `npm run typecheck`, `npm run build`, `git diff --check` 통과.

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
