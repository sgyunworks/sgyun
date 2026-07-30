# SGYUN — Portfolio Website

이석윤 (Seokyoon Lee, SGYUN) — Product Designer · Builder Portfolio

도메인: [sgyun.kr](https://sgyun.kr)

---

## 기술 스택

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS**
- **next/image** 자동 이미지 최적화
- 폰트: **Poppins** (라틴) + **Pretendard Variable** (한글)
- 다국어: 한국어 / 영어 (`/ko`, `/en`)

## 로컬 개발

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기 → 자동으로 `/ko`로 이동.

## 빌드

```bash
npm run build
npm run start
```

## 디렉토리 구조

```
src/
  app/
    [lang]/                 ← 다국어 라우트 (ko, en)
      page.tsx              ← 홈
      works/page.tsx        ← 작품 목록
      works/[slug]/page.tsx ← 작품 상세
      about/page.tsx        ← About
      contact/page.tsx      ← Contact
      appendix/page.tsx     ← 보류 기록을 위한 빈 Appendix
      layout.tsx
    studio/                 ← 소유자 전용 콘텐츠 편집 화면
    api/studio/             ← 인증·콘텐츠 저장 API
    layout.tsx              ← 루트 레이아웃 (폰트 로딩)
    page.tsx                ← / → /ko 리다이렉트
    globals.css
  components/
    Nav.tsx                 ← 상단 네비 + 언어 토글
    RouteDial.tsx           ← Home/Works/About/Contact/Appendix 경로 다이얼
    Footer.tsx
    archive/                ← 홈 다이얼, 인덱스, 상세 장면 시스템
  lib/
    i18n.ts                 ← 모든 텍스트 (ko/en)
    archive.ts              ← 게시 콘텐츠를 화면 모델로 변환
    portfolio-store.ts      ← 로컬/GitHub 콘텐츠 저장
    works.ts                ← 이전 상세 데이터(마이그레이션 참고용, 현재 미사용)
    site-config.ts          ← 이메일, 인스타 등 사이트 설정

  content/portfolio.json    ← 프로필·대표작의 단일 원본
public/images/              ← 모든 작품 이미지
```

## 콘텐츠 수정 가이드

### 텍스트 (네비, 헤드라인, 버튼 등)
→ `src/lib/i18n.ts`

### 작품·프로필 정보
→ `/studio` 또는 `src/content/portfolio.json`

`published` 상태인 항목만 홈 다이얼과 작품 인덱스에 `order` 순서로 나타난다. 현재 1차 대표작은 VESA Based Floating Speaker, RecoPick, The Aviator, Double Wishbone Chair, WRGS, V-CADO의 6개다. Vibey·ALLSET은 공개 목록에서 제외했고 N03는 About의 활동 이력으로만 관리한다.

### 이메일 / 인스타 / 학력 / 스킬
→ 연락처는 `src/lib/site-config.ts`, 프로필·학력·수상·활동은 `src/content/portfolio.json`

### Owner Studio

로컬 또는 배포 환경에 `.env.example`의 값을 설정한다. 비밀번호와 토큰은 저장소에 커밋하지 않는다.

- `SGYUN_STUDIO_PASSWORD`: 소유자 로그인 비밀번호
- `SGYUN_STUDIO_SESSION_SECRET`: 세션 서명용 긴 임의 문자열
- `SGYUN_GITHUB_TOKEN`: 운영 환경에서 `portfolio.json`을 GitHub에 커밋할 최소 권한 토큰

개발 환경에서는 로컬 JSON에 저장하고, 운영 환경에서는 GitHub Contents API로 지정 브랜치에 커밋한다. 연결된 배포가 완료되면 공개 사이트와 다이얼이 함께 갱신된다.

### 디자인 토큰 (색, 폰트)
→ `tailwind.config.ts` + `src/app/globals.css`

## 품질 검사

```bash
npm run typecheck
npm run build
npm run audit:ui -- after-fixes
```

ESLint는 아직 구성하지 않았다. 이전의 동작하지 않는 `next lint` 명령은 제거했으며, 현재 정적 검사는 TypeScript와 production build를 기준으로 한다.

## 배포 (Vercel)

```bash
# Vercel CLI 사용 시
npm i -g vercel
vercel
```

또는 GitHub 푸시 후 Vercel 대시보드에서 import. 자동으로 빌드 → 배포됨.

## 도메인 연결 (sgyun.kr)

Vercel 대시보드에서:
1. 프로젝트 → Settings → Domains → `sgyun.kr` 추가
2. Vercel이 알려주는 DNS 레코드를 hosting.kr DNS 설정에 등록
   - A 레코드: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`
3. 전파 대기 (수 분 ~ 24시간)
