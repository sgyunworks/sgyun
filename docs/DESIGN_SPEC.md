# SGYUN Portfolio — Design Specification

## 디자인 다이얼

- Design variance: 8/10
- Motion intensity: 7/10
- Information density: 3/10

## 시그니처 시스템 — Vault Instrument

- 사이트를 기억하게 하는 단일 시그니처는 오른쪽의 vault dial이다. 홈뿐 아니라 Works·상세·About·Contact·Appendix에서도 같은 위치와 face anatomy를 유지하고, 페이지 맥락에 따라 rail의 인덱스만 바꾼다. 홈에서는 01–06 프로젝트와 07–08 Ledger를, 내부 페이지에서는 실제 섹션을 가리키며 현재 scroll section과 항상 같은 정수 인덱스를 공유한다.
- 공통 어휘는 `검은 산화금속 face`, `촘촘한 방사형 spoke`, `recessed core`, `bone-white capsule datum`, `프로젝트 번호`, `원본 비율`, `선의 종점`이다. 역할에 따라 지름과 정보량만 바꾸고 이 해부는 전역에서 유지한다. capsule datum은 회전 상태나 활성 번호 축과 정확히 결합할 때만 사용하며, 별도로 떠 있는 emissive pointer는 만들지 않는다. 각도는 회전 동작의 내부 상수로만 쓰며 화면에 장식 숫자로 노출하지 않는다.
- 작은 rotary latch의 datum은 항상 face의 12시 축에 정렬된 가는 capsule로 시작한다. 너비 `1.5–2px`, 높이 `5–10px` 범위만 허용하며 face와 함께 회전한다. 별도 glow와 기울어진 독립 포인터, face에 비해 과도하게 큰 백색 면적은 사용하지 않는다.
- 마이크로그래픽은 콘텐츠를 덮는 장식이 아니라 빈 공간에서 정보를 압축하는 기술 라벨이다. 한 묶음 안에서 선 굵기, 종점, 숫자, 심볼의 기준선을 공유한다. 실제 값이어도 제목·레일·다이얼에 이미 노출됐다면 반복하지 않는다.

## 타이포그래피

- 영문 제목·부제: Poppins, 기본 300. 대형 인덱스 제목만 200 허용.
- 한글 및 설명: Pretendard Variable, 350–500.
- 영문 메타데이터: Pretendard 또는 Geist Mono.
- 대형 제목 자간은 `-0.055em`을 넘지 않고, 본문은 읽기 폭 42–62ch를 유지한다.
- 짧은 한국어 설명은 `word-break: keep-all`과 균형 줄바꿈을 사용해 `시스템.`처럼 의미 단위가 한두 글자만 다음 줄에 고립되지 않게 한다.
- 라틴 디스플레이와 한글 디스플레이는 같은 크기 토큰을 공유할 수 있지만 조판 토큰은 분리한다. 라틴은 `0.84–0.92` 행간과 최대 `-0.055em` 자간을, 한글은 `1.04–1.10` 행간과 `-0.012–-0.022em` 자간을 사용한다.
- 핵심 본문은 데스크톱 `15–17px`, 모바일 `14–15px`, 행간 `1.60–1.68`을 사용한다. `12px` 이하는 상태·번호·계측처럼 내용 이해에 필수적이지 않은 마이크로그래픽에만 허용한다.
- 큰 한글 제목은 `word-break: keep-all`과 `text-wrap: balance`, 문단은 `word-break: keep-all`과 `text-wrap: pretty`를 사용한다. 이미지가 포함된 선언문은 이미지와 문장을 별도 grid cell로 배치해 이미지가 텍스트 line box를 왜곡하지 않게 한다.
- 공통 조판 토큰은 `--type-body`, `--type-body-small`, `--leading-body`, `--leading-body-relaxed`, `--leading-display-latin`, `--leading-display-ko`, `--tracking-display-latin`, `--tracking-display-ko`를 사용한다.

## 형태

- 홈 primary media: 2–3px radius의 기계식 aperture. 두꺼운 이중 베젤과 유리처럼 보이기 위한 테두리를 쓰지 않는다.
- 일반 패널: 6px radius 이하.
- 버튼·탭: 3–5px radius. 대표 CTA는 별도 카드나 pill 없이 원형 rotary latch, 짧은 문구, 한 개의 datum rail로 구성한다.
- 다이얼: 기능상 원형 유지.

## 재료와 색

- 기반: near-black graphite `#08090b`.
- 표면 단계: `#0d0f12`, `#14171b`, `#1b1e23`.
- 밝은 인덱스: bone/silver `#dfe0dd`를 한 페이지에 연속 적용.
- 신호색: cobalt `#268cff`는 접근성 focus에만 사용한다. 현재 프로젝트는 다이얼 번호와 레일 타이포그래피의 명도·무게로 표시하고, rotary face 안에는 비발광 bone-white capsule datum 한 개만 허용한다. 별도의 발광 bar나 각도 숫자는 노출하지 않는다.
- 모든 하이라이트는 좌상단의 단일 광원 방향을 공유한다.
- 고정 내비게이션과 홈 상단 도구는 반투명 glass가 아니라 불투명 graphite instrument plate로 처리한다. blur는 modal처럼 배경과의 분리가 실제로 필요한 레이어에만 남긴다.

## 이미지

- 홈·상세·다음 작품의 주요 프리뷰는 원본 종횡비를 보존하고, 프레임 자체가 해당 비율에 맞춰 변한다.
- 홈 primary media의 계측 정보는 상단 한 줄로 제한한다. 프로젝트 번호·제목·원본 비율을 한 baseline에 묶고 하단 장식축이나 중복 이미지 번호 overlay를 만들지 않는다.
- 작품 데이터는 `heroAspectRatio`와 각 상세 매체의 `aspectRatio`를 필수 메타데이터로 가진다. 미디어 교체 시 파일과 비율을 함께 갱신한다.
- 주요 프리뷰의 이미지와 프레임 사이에는 장식용 내부 패딩을 두지 않는다. 프레임 밖의 page negative space로 호흡을 만든다.
- `object-fit: contain`은 비율 변화 중 안전장치로만 사용하며, 안정 상태에서는 이미지와 프레임 비율이 같아 letterbox가 보이지 않아야 한다.
- 높이와 너비가 모두 제한된 슬롯에서는 컨테이너 단위로 `min(가용 너비, 가용 높이 × 원본 비율)`을 계산한다. 한 축을 고정한 뒤 `max-height`로 누르는 방식은 금지한다.
- 목록 contact sheet도 각 원본 비율을 사용한다. 빠른 스캔용 작은 dialog만 의도적 `cover`를 허용한다.
- 밝은 소스 이미지는 주변 표면과 분리될 정도로만 명도·채도를 낮춘다.

## 반응형

- 901px 이상: 작품 정보, 적응형 미디어, 작품 레일, 오른쪽 다이얼의 4영역을 유지한다.
- 601–900px: 미디어를 상단 전체 폭에 두고 정보와 다이얼을 아래에서 분리한다.
- 600px 이하: 미디어는 자연 비율과 최대 높이를 함께 지키며, 제목·CTA는 왼쪽 안전 열 안에서 한 줄기 흐름으로 쌓는다.
- 모든 대형 문장은 좌우 최소 16px, 768px 이상에서는 최소 32px의 광학 안전 여백을 남긴다.
- 태블릿·모바일의 상단 도구 패널과 세로형 미디어 사이에는 최소 8px의 비중첩 안전 간격을 둔다.
- 작은 프로젝트 표식은 시각 크기와 무관하게 44px 높이의 터치 영역을 제공한다.
- 오른쪽 half dial은 데스크톱에서 전체 지름 `300–380px`, 태블릿에서 `240–300px`, 모바일에서 `196–270px`를 기준으로 한다. 항상 전용 열을 가지며 미디어보다 큰 시각 질량이 되지 않는다.
- 전역 half dial은 viewport 오른쪽 중앙보다 약간 아래에 고정하고, 홈에서는 첫 장면 이후 마지막 섹션까지 사라지지 않는다. 내부 페이지도 같은 고정축을 사용하되, rail은 다이얼의 보이는 왼쪽 면 안에 결합해 본문 위에 별도 패널처럼 떠 있지 않게 한다.
- 모바일은 활성 rail 항목만 노출하고 오른쪽 안전 열을 예약한다. 다이얼이 본문·수치·CTA를 덮으면 콘텐츠 padding을 줄이는 것이 아니라 다이얼 전용 안전 여백을 먼저 확보한다.

## 모션과 피드백

- 다이얼 face는 실제 스크롤·drag 진행률을 소수 cursor로 연속 추종한다. rail 강조·번호·라쳇·햅틱은 cursor가 정수 사이의 중간 detent를 통과할 때만 변경한다. 홈과 직접 drag는 손을 놓으면 가장 가까운 정수 detent로 160–340ms 안에 정렬하고, 긴 편집 페이지의 일반 스크롤은 독자의 읽기 위치를 강제로 snap하지 않는다.
- 홈 다이얼은 문서 전체의 스크롤 진행과 01–06 프로젝트·07 Practice·08 Profile 인덱스를 연결한다. 내부 페이지 다이얼은 section anchor 사이의 실제 scroll progress를 보간해 face를 연속 회전시키고, rail 선택·키보드 입력은 해당 anchor로 이동한다. drag 중에는 `auto`로 즉시 추종하고 release에서만 가까운 section으로 smooth settle한다.
- 모바일의 홈·내부 페이지 다이얼은 `touch-action: pan-y pinch-zoom`을 사용한다. touch pointer를 capture하거나 매 move마다 `scrollTo`를 호출하지 않고 native vertical scroll이 먼저 동작하며, 다이얼은 passive scroll sync로 따라간다. mouse·pen drag와 rail·키보드 조작은 기존 직접 scrub을 유지한다.
- 화면 오른쪽 반원 배치는 비율 기반 `translate(50%)`로 유지하며, 진입 모션이 해당 x축 transform을 픽셀값으로 덮어쓰지 않게 한다.
- 콘텐츠 전환은 opacity, translate, 짧은 scale로 제한한다.
- Vault CTA는 hover/focus에서 rotary latch가 짧게 회전하고 datum rail이 발광 없이 확장된다. 반응은 180–320ms 안에 끝나며 전체 버튼은 눌릴 때만 0.985 scale로 압축한다.
- CTA의 래치 회전과 datum 확장은 같은 상태 변화를 설명해야 하며, CTA 전체를 또 하나의 패널처럼 띄우지 않는다.
- 프로젝트 진입은 좌우 graphite shutter가 520ms 동안 닫히고 중앙 lock이 회전한 뒤 새 기록에서 600ms 동안 다시 열리는 Vault transition을 사용한다. reduced motion에서는 90ms 이내의 짧은 전환으로 축약한다.
- 라쳇 사운드는 기본 활성 상태이며 별도 SOUND UI를 만들지 않는다. 브라우저 autoplay 정책 때문에 첫 사용자 입력에서 AudioContext를 준비한 뒤 이후 detent 변화에 계속 반응한다.
- 라쳇 음량은 여러 detent가 겹쳐도 clipping이 생기지 않는 범위에서 짧은 noise와 tooth layer를 같은 비율로 조절한다. 시각 상태보다 늦게 들리거나 배경음처럼 지속되면 실패다.
- `prefers-reduced-motion`에서는 핵심 상태만 즉시 전환한다.

## 홈 화면 위계

- 상단 프로젝트 제목의 현재 크기와 무게를 기준점으로 유지한다.
- primary media는 데스크톱 가용 폭을 이전보다 크게 점유하고, 프로젝트 레일과 다이얼에는 필요한 기능 폭만 예약한다.
- 프로젝트 선택을 제어하는 보조 행동은 해당 미디어의 telemetry baseline 안에 둔다. 미디어와 관계없이 우측 상단에 떠 있는 control island는 만들지 않는다.
- 모바일 첫 장면은 `media → progress → identity/CTA`의 연속된 세 구간으로 편집한다. 미디어 하단과 프로젝트 제목 사이에 12svh를 넘는 무정보 공백을 만들지 않는다.
- 긴 단어가 포함된 작품명은 정보 열의 실제 가용 폭을 기준으로 별도 optical scale을 사용한다. 어떤 상태에서도 제목 bounding box가 primary media bounding box와 교차하지 않는다.
- 하단의 밝은 Practice Ledger는 Physical·Digital·Systems의 실제 게시 개수를 한 줄 기록으로 보여 주고, 배경 이미지를 장식으로 사용하지 않는다.
- 이어지는 Profile Ledger는 이름·작업 정의·수상·활동·About·Contact를 실제 데이터로 구성한다. N03는 프로젝트가 아니라 Activity에만 위치한다.
- 홈 half dial은 작품 `01–06`에서 끝나지 않고 `07 PRACTICE`, `08 PROFILE`을 같은 연속 arc에 포함한다. 작품 미디어는 06에서 유지되지만 face·rail·drag·keyboard 탐색은 마지막 Ledger까지 페이지 전체 위치를 반영한다.
- 첫 장면에는 이름만 두지 않고 `DESIGNER / BUILDER`, 프로젝트 단계와 실제 기록 번호를 표시한다. 이미지 미정은 다른 이미지로 채우지 않고 `MEDIA_PENDING`을 사용한다.

## 상세 화면 위계

- hero는 왼쪽 작품 정체성, 오른쪽 primary media의 2열 장면이다. 이미지는 가장 큰 시각 질량을 유지한다.
- 연도·분야·형식·archive 번호는 화면 하단 전체 폭에 흩어 놓지 않고 제목·설명 아래 2×2 사양군으로 묶는다. 정보의 소유 영역이 분명해야 넓은 여백도 의도적으로 읽힌다.
- 상세 설명은 `Summary`와 `Description`의 두 단계로 구성한다. Summary는 프로젝트의 위치와 효용을 한 번에 이해시키는 짧은 편집 문장으로 제한하고, Description은 맥락·문제·설계 응답·사용자/시스템 효과를 45–75자 폭의 읽기 문장으로 풀어 쓴다. 두 블록은 같은 영역에 두되 크기·명도·행간으로 위계를 분리한다.
- premise의 큰 문장은 hero 제목보다 낮은 대비와 완화된 자간을 사용한다. 긴 설명을 거대한 선언문으로 처리하지 않고, Summary는 중간 크기의 리드 문장으로 낮춘다. story chapter는 3px graphite plane과 한 개의 활성 edge만 사용하고 glow를 만들지 않는다. 프로세스 제목은 이미지보다 두 번째 시각 질량이 되지 않도록 데스크톱 28–38px, 모바일 28–36px 범위로 관리한다.
- 작품 설명은 추상적인 태도보다 구체적인 상황 → 설계 응답 → 사용자/시스템 효과의 순서로 쓴다. 국문과 영문은 직역보다 같은 사실 구조와 밀도를 유지한다.
- 제작·작동 근거가 있는 프로젝트는 story 뒤에 `EVIDENCE`를 선택적으로 추가한다. 이 섹션이 존재할 때만 상세 다이얼 인덱스에도 같은 항목을 생성한다.
- 외부 영상은 정지 포스터를 먼저 보여 주고 재생 입력 뒤에만 privacy-enhanced iframe을 생성한다. 자동 재생 네트워크 요청, 장식용 영상 다운로드와 로컬 원본 영상 복제를 피한다.
- 모바일은 media → 제목·설명 → 사양군의 단일 읽기 순서를 유지한다. 고정된 개발 도구나 장식물이 사양군 위에 겹치지 않아야 한다.

## 오버레이 규칙

오버레이는 상태, 탐색, 맥락 중 하나를 제공해야 한다. 다른 콘텐츠와 겹칠 때 읽기 대비와 안전 여백이 확보되지 않으면 독립 레이아웃 영역으로 옮긴다.

## 편집 페이지 첫 장면

- `About`처럼 추상 명사 하나만 있는 대형 제목은 그 자체로 첫 화면의 증거가 아니다. 같은 viewport 안에 역할, 짧은 요약, 위치처럼 확인 가능한 보조 정보 한 묶음을 함께 둔다.
- 대형 제목과 보조 정보는 서로 다른 grid cell을 사용한다. 시네마틱 여백은 두 정보군의 관계가 읽힌 다음에만 남긴다.
- 전역 half dial을 같은 오른쪽 고정축에 유지하되 페이지의 실제 섹션명으로 rail을 재구성한다. 첫 장면의 대형 제목·보조 정보는 다이얼 안전 열을 침범하지 않는다.

## 전역 탐색과 모달

- route dial은 `HOME`, `WORKS`, `ABOUT`, `CONTACT`, `APPENDIX`를 모든 화면 폭에서 유지한다. 560px 이하에서 직접 About·Contact 링크를 감출 수 있지만 다이얼 메뉴에서는 다섯 목적지를 모두 노출한다.
- route dial 하단에는 일반 정보 구조와 분리된 `00 / FIELD_00`을 낮은 명도로 둔다. 이는 포트폴리오 읽기를 방해하지 않는 선택적 캘리브레이션 토이 진입점이며, 직접 URL과 키보드 탐색으로도 접근 가능하다.
- route dial은 현재 목적지 번호·datum 각도를 함께 갱신하고, 클릭·방향키·Enter·Escape와 외부 클릭 닫기를 지원한다.
- 작은 rail 표식은 3px로 보여도 44×44px 조작 영역을 유지한다.
- archive dialog는 열릴 때 내부 첫 컨트롤로 포커스를 이동하고, Tab·Shift+Tab을 내부에서 순환시키며, Escape 후 원래 trigger로 복귀한다.

## FIELD_00 캘리브레이션 토이

- 별도 이미지나 장식적 카드 없이 공통 Vault Dial, 세 자리 target register, 하나의 반응 field로 구성한다.
- 목표 숫자는 한 번에 하나씩 분명히 표시한다. 사용자는 다이얼을 돌린 뒤 손을 놓거나 숫자 rail을 선택해 detent를 확정한다.
- 틀린 값은 진행을 잃게 하지 않고 현재 목표를 유지한다. 세 값을 모두 맞추면 400–600ms의 짧은 lock sequence와 `CALIBRATED` 상태를 보여 준다.
- touch 전용 페이지이므로 다이얼만 `touch-action: none`인 scrub mode를 사용한다. 방향키·Home·End·rail button을 완전한 대체 입력으로 제공하고 reduced motion에서는 lock sequence를 즉시 축약한다.

## 콘텐츠 상태와 실패 상태

- 승인된 1차 대표작은 홈, 인덱스, 상세에서 동일한 번호·단계로 표시한다. 자료가 미정인 대표 이미지는 `MEDIA_PENDING`, 로드 실패는 `MEDIA_UNAVAILABLE`로 구분한다.
- Appendix는 선별 전 보류 작업을 임의로 채우지 않고 `00 RECORDS` 빈 상태와 대표작 복귀 경로를 제공한다.
- Owner Studio는 공개 내비게이션에서 링크하지 않으며 비밀번호 세션, draft/published와 저장 결과를 명확히 표시한다.
- 대표 미디어는 실패 시 동일한 프레임 안에서 `MEDIA_UNAVAILABLE` 상태와 의미 있는 설명을 제공한다.
- 없는 기록은 빈 검은 화면이 아니라 404 설명과 인덱스·홈 복귀 경로를 제공한다.
