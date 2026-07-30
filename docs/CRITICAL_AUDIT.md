# SGYUN Portfolio — Critical Audit

> 이 문서는 7개 fixture를 사용하던 감사 시점의 증거를 보존한다. 이후 1차 대표작 6개, 전역 route dial, 빈 Appendix와 Owner Studio가 구현되었다. 현재 판정과 수치는 `STATUS.md`, `NEXT.md`, `docs/VALIDATION.md`의 `Approved content system and Owner Studio` 항목 및 `qa/critical-audit/content-system-v2/`를 기준으로 한다.

## 범위와 기준

- 감사일: 2026-07-30
- Git 기준점: `a605b20` 이후의 미커밋 디자인 작업을 보존한 상태
- 페이지: `/ko`, `/en`, `/ko/works`, 필터 상태, `/ko/works/wrgs`, `/ko/about`, `/ko/contact`, 잘못된 상세 경로
- 화면: 1440×960, 1024×900, 390×844, 320×720, 720×960 reflow
- 입력: 스크롤, slider keyboard, archive dialog keyboard, pointer, route navigation
- 자동 검사: HTTP, console, page error, failed request, image decode, document overflow, axe-core WCAG 2 A/AA, TypeScript, production build

## 스킬 라우팅

### 수정 전 감사

- primary — `design-debt-audit`: 시각·구조·접근성·문서·구현 부채를 P0–P3로 분류했다.
- specialist — `heuristic-evaluation`: 처음 방문, 프로젝트 탐색, 상세 진입, 연락, 오류 복귀 과업을 실제 화면에서 순회했다.
- gate — `design-qa-checklist`: 같은 viewport와 상태의 수정 전후 증거를 고정했다.

### 교정

- `navigation-patterns`: 모바일에서 사라진 About·Contact를 전역 목적지로 복원했다.
- `accessibility-audit`: modal focus trap, focus restore, tablet 44px rail target, 404 복귀 경로를 교정했다.
- `content-strategy`: 중복 content source와 fixture 상태를 식별하고 `SYSTEM PREVIEW`를 홈·인덱스·상세에 노출했다.

### 제외

- `frontend-design`, `design-taste-frontend`, `high-end-visual-design`: 이번 핵심 위험은 새 시각 방향 생성보다 기존 결과의 정직성·경로·키보드·상태 검증이었다.
- 세부 `critique-*`: 현재 P1을 직접 줄이는 감사·탐색·접근성 스킬보다 우선순위가 낮았다.
- Figma·image generation 계열: 새 아트디렉션이나 최종 작품 제작이 범위가 아니었다.

## 수정 전 부채 목록

| 등급 | 증거 | 문제 |
|---|---|---|
| P0 | `localhost:3001/ko` HTTP 500, `.next/server` missing chunk | 기존 “HTTP 200” 기록과 현재 실행 상태가 불일치했다. 생성 캐시를 격리하고 dev server를 재시작해 복구했다. |
| P1 | 390px nav에 INDEX와 언어만 표시 | About·Contact가 모바일 전역 경로에서 사라졌다. |
| P1 | dialog의 마지막 record 다음 Tab이 folder link로 이동 | `aria-modal`과 달리 keyboard focus가 배경으로 빠졌다. |
| P1 | 1024px project rail button이 14×3px | 표식 크기를 실제 조작 영역으로 사용했다. |
| P1 | 7개 record 모두 `provisional: true`, 화면 표시는 없음 | 임시 작품과 일반론적 상세 문구가 완성 사례처럼 보였다. |
| P2 | 잘못된 상세 경로 404 body가 비어 있음 | 복귀 방법이 없는 실패 상태였다. |
| P2 | `/en`의 document language가 `ko`, 홈 title 중복 | 언어·metadata 구현이 실제 route와 어긋났다. |
| P2 | 홈 hero에 7개 대표 이미지 element가 한 슬롯에 동시 배치 | 첫 화면에 필요하지 않은 미디어까지 viewport 후보가 됐다. |
| P2 | 이미지 오류 폴백 없음 | 미디어 실패 시 의미 전달이 사라졌다. |
| P2 | README는 `works.ts`를 현재 source로 지목, 실제 route는 `archive.ts` 사용 | 문서와 구현의 source of truth가 달랐다. |
| P2 | `npm run lint`가 존재하지만 `next lint`는 실행 불가 | 품질 명령이 통과 가능한 검사처럼 기록됐다. |
| P3 | legacy `works.ts`·`components/home` 유지 | 현재 bundle에는 포함되지 않지만 migration 전까지 구조 부채다. |

## 교정 결과

- 전역 nav 목적지 복원, 작은 폭에서는 brand descriptor만 감춤
- archive dialog Tab·Shift+Tab 순환 및 Escape focus restore
- tablet rail 44×44px hit area와 3px visual marker 분리
- `SYSTEM PREVIEW`와 설명을 홈·dialog·index·detail에 일관되게 노출
- 현재·인접 hero image만 mount하고 나머지는 선택 시 로드
- 공통 `SafeImage` fallback 추가
- 내용이 있는 404와 runtime error recovery 화면 추가
- locale document language, canonical, Open Graph, 중복 title 교정
- README, STATUS, NEXT, DESIGN_SPEC, DECISIONS의 현재 계약 갱신
- 동작하지 않는 lint script 제거, `typecheck`와 재현 가능한 `audit:ui` 명령 추가

## 재검증

최종 수치는 `qa/critical-audit/after-fixes/report.json`과 `docs/VALIDATION.md`의 critical audit 섹션을 기준으로 한다.

### 최종 구현 게이트

- 5개 화면 폭 × 7개 경로, 총 35개 프로덕션 렌더가 모두 HTTP 200이었다.
- 35개 렌더에서 수평 문서 overflow, 핵심 제목·미디어·다이얼 overlap, 깨진 가시 이미지, console error, page error, actionable failed request, axe-core WCAG 2 A/AA violation, 24px 미만 조작 대상이 모두 0건이었다.
- archive dialog는 5개 화면 폭에서 Tab이 내부 8개 조작 요소를 순환했고 Escape 뒤 trigger로 focus가 복귀했다.
- mobile stress test에서 빠른 정방향 wheel `1→7`, 역방향 `7→1`, dial drag `1→3`이 동기화됐고 오류와 overflow가 없었다.
- 잘못된 상세 경로는 HTTP 404와 브랜드 오류 설명·인덱스/홈 복귀 링크를 표시했다.
- JavaScript를 끈 홈도 H1, 전역 nav 6개 링크, 미디어를 제공했다. 대표 미디어를 강제 실패시켰을 때 `MEDIA_UNAVAILABLE` 폴백이 표시됐다.
- 느린 3G를 흉내 낸 로컬 프로덕션 측정은 CLS `0`, LCP `3.288s`, 총 전송 `551KB`, 첫 화면 image request `2개 / 27KB`였다. 구조 흔들림과 과도한 첫 미디어 전송은 없지만 LCP는 배포 환경에서 추가 최적화가 필요하다.
- `npm run typecheck`, `git diff --check`, `npm run build`가 통과했고 정적 페이지 28개가 생성됐다.

## 당시 판정

**조건부 통과 — 웹 전시 시스템 구현은 P0·구현 P1을 해소했지만 최종 포트폴리오는 아직 완료가 아니다.**

당시 게시 전 차단 조건은 실제 작품 선정·사실 검증·사례 원고, CMS/admin 흐름, 실제 모바일 사운드·햅틱, 배포 Web Vitals, 호환 가능한 dependency 보안 업그레이드였다. 이 중 작품 선정과 기본 Studio 게시 구조는 후속 작업에서 해소되었고, 최종 이미지·운영 환경 동기화·실기기 검증은 여전히 남아 있다.
