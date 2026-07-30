# SGYUN Portfolio — Status

## 현재 판정

2026-07-30 콘텐츠 시스템 개편 기준으로 1차 대표작 구조와 소유자 게시 흐름은 **구현·로컬 검증 통과**다. 최종 이미지 선별과 운영 환경 연결 전이므로 공개 배포 완료 상태는 아니다.

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
- 404·runtime error·미디어 실패 상태
- locale별 canonical, 상세 Open Graph 메타데이터, 공통 Open Graph 이미지
- 비밀번호 인증, draft/published, 순서·분류·문구·미디어 편집을 제공하는 `/studio`
- 개발 환경 로컬 저장과 운영 환경 GitHub Contents API 게시 동기화

## 콘텐츠 상태

- `src/content/portfolio.json`이 프로필과 프로젝트의 단일 원본이다.
- 1차 대표작 6개가 `published` 상태다: VESA, RecoPick, The Aviator, Double Wishbone Chair, WRGS, V-CADO.
- Vibey·ALLSET은 제외했고 N03는 활동 이력에만 포함했다.
- VESA와 RecoPick은 이미지 선별 전이므로 의도적인 `MEDIA_PENDING` 상태를 사용한다.
- `src/lib/works.ts`와 `src/components/home/`은 이전 콘텐츠 모델·컴포넌트로 현재 라우트에서 사용하지 않는다.

## 확인이 남은 범위

- VESA·RecoPick을 포함한 최종 이미지 선별과 각 이미지의 원본 비율·대체 텍스트
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
- 느린 3G 로컬 합성: LCP 1.020s, CLS 0, 704KB. 첫 대표작이 이미지 대기 상태인 조건의 로컬 수치이므로 최종 이미지 등록 뒤 다시 측정한다.

## 작업 경계

커밋과 푸시는 이번 감사 작업이 재검증을 통과하고 사용자가 요청할 때만 진행한다.
