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

## 개인 포트폴리오 카피 감사 — 2026-07-31

### 조사 범위와 방법

개인 디자이너·제품 디자이너·산업 디자이너·디자이너/개발자 포트폴리오 20개를 대상으로 홈 첫 화면, About, Selected Work 목록의 실제 문장과 정보 순서를 확인했다. 조사는 2026-07-31에 진행했으며, 작품을 먼저 보여 주는지, 역할을 어떻게 명명하는지, 자기소개를 몇 문장으로 제한하는지, 수상·활동·연락 정보를 어디에 두는지를 비교했다.

표본:

- [Tobias van Schneider](https://vanschneider.com/)
- [Daniel Spatzek](https://www.danielspatzek.com/home/)
- [Brittany Chiang](https://brittanychiang.com/)
- [Jay Hersh](https://jayhersh.com/)
- [Alfian Ridwan](https://alfian.co/)
- [Christina Day](https://christinamday.com/)
- [Obed Tredouna](https://tredouna.com/)
- [Marker Design / Lesley Marker](https://www.markerdesign.com/)
- [Jerwin Ordillano](https://www.jawe.dev/)
- [Karina Design](https://karina.design/)
- [Alex Ryan](https://www.alexryan.design/)
- [Anshuman Dixit](https://anshumandixit.com/)
- [Rizka Nurul Afifah](https://rizka.works/)
- [amatstudio](https://www.amatstudios.com/)
- [Glenn Guilloux](https://glennguilloux.com/)
- [Amin Yosoh](https://www.aminyosoh.com/)
- [Dalton Patterson](https://www.daltonpatterson.design/)
- [Joseph Barrios](https://www.josephbarrios.design/)
- [BogdanieDesign / Bogdan Kovačević](https://bogdaniedesign.com/)
- [Hua Guo](https://www.guohuaswebsite.com/)

### 반복해서 확인된 카피 패턴

1. **작품이 첫 번째 문장이다.** 많은 사이트가 첫 화면에서 이름·역할·지역을 짧게 제시한 뒤 곧바로 `Selected Work`, `Projects`, `Case Studies`로 이동한다. 소개문이 있더라도 작품을 설명하기 위한 한 문장에 그친다.
2. **역할은 명사로 쓴다.** `Product Designer`, `Industrial Designer`, `Designer & Developer`처럼 현재 할 수 있는 일을 직접 표기하며, 태도·철학·세계관을 직함처럼 과장하지 않는다.
3. **About은 검증 가능한 사실의 묶음이다.** 지역, 현재 역할, 경력·교육, 연락처, 선택 작업을 짧게 정리한다. 긴 자기서사는 별도 글이나 case study로 밀어낸다.
4. **작업 설명은 프로젝트 단위로 구체적이다.** 프로젝트명 아래에 연도, 역할, 유형, 결과 또는 사용 맥락을 붙인다. “무엇을 믿는가”보다 “무엇을 만들었고 어떤 문제를 다뤘는가”가 먼저 읽힌다.
5. **수상·활동은 증거 목록으로 다룬다.** 별도 Recognition/Activity 블록에 연도·기관·역할·결과를 짧게 나열하고, 홈 첫 화면의 자기소개를 부풀리는 장식으로 사용하지 않는다.
6. **연락 문장은 가장 짧아도 된다.** `Get in touch`, `Contact`, 이메일처럼 행동이 분명한 정보만 남기고, “함께 무언가를 만들어봐요” 같은 광고형 문구는 선택 사항이다.

### SGYUN 적용 결정

- About의 긴 `Identity` 선언문을 제거한다. 현재 About hero의 역할·짧은 프로필 요약, Education, Practice, Recognition, Activity, Contact만 유지한다.
- 중복되는 이름·alias 패널은 제거한다. 이름과 지역은 About hero의 작은 identity datum에 이미 있으므로 다시 설명하지 않는다.
- 프로필 요약은 한 문장으로 제한한다: `제품·웹·앱을 설계하고 구현합니다.` / `I design and build products, websites, and apps.`
- 작품 상세는 현재의 `Summary / Description / Process / Evidence` 구조를 유지한다. 이 영역은 자기소개가 아니라 작품의 문제·설계 응답·검증 근거를 설명하므로 미니멀 카피 원칙과 충돌하지 않는다.
- 수상·활동은 현재처럼 About의 기록 섹션에 두되, 사실·연도·기관·역할만 남긴다. 새로운 주장이나 성과 문장은 추가하지 않는다.

### 확신도와 반증 조건

- 확신도: 중간 이상. 20개 표본에서 동일한 정보 순서와 짧은 역할 표기가 반복됐지만, 개인 포트폴리오에는 업종·경력·작업 성격에 따른 예외가 있다.
- 반증 조건: 실제 방문자 또는 의뢰 검토자가 SGYUN에서 역할·작품 분야·연락 방법을 즉시 파악하지 못하거나, 작품 상세 진입 전에 추가 설명을 요구하면 한 문장짜리 보조 설명을 재도입한다.
