# Current next steps — Portfolio A renewal

1. Review the uncropped mobile imagery, the restored high-resolution Wishbone cover, the new Y wire-pluck landing, stronger guidance pulse and Figma-matched wordmark, elastic sound and overlapping recoil/travel timing and the small rotary navigation at `http://localhost:3100/ko`.
2. Production deployment authorized on 2026-10-13. Verify sgyun.kr after main update; old version is archived under archive/sgyun-before-portfolio-a-2026-10-13.
3. If the Figma prototype placeholder becomes ready, replace it with verified Vibey physical prototype evidence.
4. A full English translation of the original Korean detail essays is a separate content pass. Current English routes have English covers and summaries with original Korean portfolio pages.
5. Check audible ratchet level and real-device touch/haptics on the user's hardware. Automated/visual interaction checks do not certify physical playback.

Exact source: `src/content/portfolio-a-pages.json`; project/profile records: `src/content/portfolio.json`; visual contract: `UI-SYSTEM.md`; Figma asset trace: `docs/PORTFOLIO_A_ASSETS.json`.

---

## Historical next steps (superseded where above differs)

# SGYUN Portfolio — Next

## 사용자 결정이 필요한 다음 단계

1. VESA의 공개 문구·이미지 순서·캡션을 최종 승인한다.
2. RecoPick은 공개 포트폴리오에서 보류한다. 재개할 때 최종 이미지와 공개 범위를 다시 정한다.
3. V-CADO의 세부 기여 범위와 추후 변동되는 수상 결과를 근거와 함께 보강한다.
4. 1차 대표작의 문구·순서를 실제 공개 전 최종 검토한다.

VESA의 이번 상세 카피는 사용자가 제공한 Summary / Description 원문을 적용한 상태다. 사용자가 검토할 때는 문장 자체뿐 아니라 실제 페이지에서 Summary의 길이, Description의 읽기 폭, 프로세스와 이미지의 질량 관계를 함께 확인한다.

5. The Aviator의 공개 카피와 이미지 순서를 최종 검토한다. 현재는 `01→02→03→04→05→process→real-prototype`의 논리적 제작 순서와 실제 프로토타입 YouTube 임베드를 적용했다.

## 이후 개발 단계

1. 실제 iPhone Safari 18 이상에서 일반 페이지 다이얼 위 native pan 통과, native switch detent 햅틱과 라쳇 음량을 검증한다. 같은 실기기 검증에서 `FIELD_00` 숫자 scrub, `VAULT_01`의 교대 방향 조합·햅틱·aperture open 전환도 확인한다.
2. Studio에 상세 미디어 배열 편집, 게시 전 미리보기와 Git 이력 기반 rollback 안내를 추가한다.
3. 최종 이미지 등록 뒤 배포 preview에서 Web Vitals와 이미지 캐시를 측정한다.
4. Next.js·Sharp·PostCSS 보안 공지와 호환 가능한 업그레이드 경로를 검토한 뒤 dependency upgrade를 별도 변경으로 수행한다.

## 이번 시각 계층 패스 이후

- 실제 사용자에게 공개하기 전, 1440px·390px에서 조용해진 제목 위계와 긴 한국어 문장의 줄바꿈을 한 번 더 승인한다.
- `537ddd7`은 production에 배포 완료했다. 이번 quiet copy pass는 같은 브라우저 검증 게이트를 통과한 뒤 별도 배포한다.

## 지금 하지 않는 것

- Appendix에 보류 작업을 임의로 채우지 않는다.
- 사용자 근거 없이 수상·성과·역할을 작성하지 않는다.
- Studio 인증을 랜딩 다이얼 비밀번호와 결합하지 않는다. `FIELD_00`은 게시 권한과 분리된 인터랙션 토이로만 유지한다.
- `VAULT_01`의 calibration 저장값을 보안·권한 판정으로 사용하지 않는다. 발견 흐름을 위한 로컬 상태로만 취급한다.

- VESA original uploads recovered; no replacement renders requested from the user.



- Review bilingual live text and restored individual media layouts before production release. Whole editorial pages must never be flattened into image assets.
- CINDER cover now includes a browser CRT equivalent around native localized content; preserve this parent-frame effect when changing assets.
- Wishbone film source: user-supplied Downloads/2.mp4; keep original untouched. Graded H.264 derivative and poster are in public/portfolio-a.
- Continue user's mobile review; desktop composition is approved. Preserve explicit mobile media sequences in SourcePages.
- Production is live on sgyun.kr (088c329). Curate archived projects later; source archive branch/tag: archive/sgyun-before-portfolio-a-2026-10-13.
- Mobile image captions are explicitly associated in mobileMediaGroups; new media/captions must extend these relationships, not rely on desktop y-coordinates.
- Social sharing uses updated 1200×630 /opengraph-image. Actual Kakao/Instagram preview caches are external to deployment verification.
- Team White29 profile record reflects participation only; add specific role/projects only when user supplies evidence.

- 팀화이트 표기는 한국소비자포럼 · 브랜딩 소사이어티를 유지합니다.

Review the new off-screen Y return feel on the deployed homepage.

User to review the sharper Y slingshot feel on production.

Keep the KIDP workshop role as instructor; do not add attendee names or unconfirmed outcomes to public profile.
