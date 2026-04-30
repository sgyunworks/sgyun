# SGYUN — Portfolio Website

이석윤 (Seokyoon Lee, SGYUN) — Engineering Art Portfolio

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
      layout.tsx
    layout.tsx              ← 루트 레이아웃 (폰트 로딩)
    page.tsx                ← / → /ko 리다이렉트
    globals.css
  components/
    Nav.tsx                 ← 상단 네비 + 언어 토글
    Footer.tsx
    home/                   ← 홈페이지 섹션들
  lib/
    i18n.ts                 ← 모든 텍스트 (ko/en)
    works.ts                ← 작품 데이터
    site-config.ts          ← 이메일, 인스타 등 사이트 설정

public/images/              ← 모든 작품 이미지
```

## 콘텐츠 수정 가이드

### 텍스트 (네비, 헤드라인, 버튼 등)
→ `src/lib/i18n.ts`

### 작품 정보 (제목, 설명, 메타, 갤러리)
→ `src/lib/works.ts`

### 이메일 / 인스타 / 학력 / 스킬
→ `src/lib/site-config.ts`

### 디자인 토큰 (색, 폰트)
→ `tailwind.config.ts` + `src/app/globals.css`

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
