# SGYUN Portfolio — Research Notes

## 사용한 근거

- 사용자 제공 프리뷰 캡처: 세로 작품 전체가 어두운 프레임 안에 여백과 함께 보이는 전시 방식
- 현재 구현의 데스크톱·모바일 캡처: 홈, 작품 목록, WRGS 상세
- SGYUN Obsidian의 홈페이지 디자인 브리프, 타이포그래피·레이아웃·이미지 아트디렉션, 광학 서피스 및 오버레이 연구
- Vibey Design Pack의 Apple, Linear, BMW 디자인 분석 문서
- Figma Community, `Micrographics Templates — Design Layouts`, node `8:16`. 확인 2026-07-29. https://www.figma.com/design/A3OJvFwOwxwPNZfkcUaOwi/Micrographics-Templates--Design-Layouts--Community-?node-id=8-16

## 관찰

1. 홈의 `cover` 프리뷰는 작품 구도와 맥락을 잘라내어 전시물이 아니라 배경 이미지처럼 보인다.
2. Poppins 500 전후와 과한 음수 자간이 큰 제목을 무겁고 뭉친 덩어리로 만든다.
3. 동일한 라운딩·테두리·그림자·글로우가 반복되어 표면의 등급이 구분되지 않는다.
4. 홈, 목록, 상세의 밝기와 표면 문법이 자주 반전되어 한 제품이 아니라 서로 다른 시안처럼 느껴진다.
5. 필터·내비게이션·상태 표시는 작품보다 조용해야 하지만 현재는 박스와 배경이 많다.
6. 사용자 제공 화면에서 home primary media의 두꺼운 베젤과 nav·도구의 반투명 surface는 liquid glass의 굴절감보다 일반적인 bordered panel로 읽힌다.
7. Micrographics 원본은 1080×1080 정사각 frame 104개로 구성되며, 작은 제목·번호·좌표선·종점·비율·기술 심볼을 하나의 중심 cluster에 압축한다. 우수함은 요소 수보다 정렬과 정보 역할에서 나온다.

## 적용 원칙

- Primary preview = `contain`; contact-sheet thumbnail = 콘텐츠 의도에 따라 `cover` 또는 `contain`.
- 큰 영문 제목은 Poppins 300, 세부 설명과 한글은 Pretendard.
- 미디어 프레임은 원본 비율의 큰 면과 얇은 aperture로 깊이를 만들고, 일반 컨트롤은 얇은 선과 낮은 반경을 사용한다.
- 한 페이지 안에서는 기본 광량을 유지하고, 섹션 구분은 색상 반전보다 간격과 재료 단계로 만든다.
- 오버레이는 상태·탐색·맥락 중 하나를 실제로 제공할 때만 사용한다.
- 마이크로그래픽은 실제 프로젝트 상태와 연결하고, 콘텐츠 위에 흩뿌리지 않는다. 한 화면에서 하나의 cluster만 주도권을 갖는다.
- full-size dial은 홈 탐색에만 사용하고, 전역 확장은 route dial·rotary latch·datum처럼 기능 크기에 맞게 축소한다.
