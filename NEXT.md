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
