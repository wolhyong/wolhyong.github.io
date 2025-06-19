# CSS 마스터 클래스: Flexbox와 Grid로 만드는 반응형 레이아웃 (CSS 강의)

**강의 목표:** 본 CSS 강의를 통해 수강생들은 최신 CSS 레이아웃 기술인 Flexbox와 Grid를 깊이 이해하고, 이를 활용하여 다양한 화면 크기에 완벽하게 대응하는 반응형 웹사이트를 구축할 수 있는 능력을 배양합니다. 실제 예제와 실습을 통해 실무 감각을 익힙니다.

**강의 시간:** 총 6시간 (이론 2.5시간, 실습 3.5시간)

**선수 지식:** HTML 기본 구조에 대한 이해가 필요합니다. CSS 기초 선택자, 속성에 대한 사전 지식이 있으면 도움이 되지만, 필수적인 내용은 강의 초반에 빠르게 복습합니다.

---

## 1강: CSS 기본기와 선택자 심화 (1.5시간)

### 학습 내용
-   CSS의 역할과 웹 스타일링의 중요성
-   CSS 기본 문법 복습: 선택자, 속성, 값
-   다양한 선택자 심층 분석:
    -   기본 선택자: 전체(`*`), 타입(`element`), ID(`#id`), 클래스(`.class`)
    -   그룹 선택자, 복합 선택자 (자손, 자식, 인접 형제, 일반 형제)
    -   속성 선택자 (`[attribute]`, `[attribute=value]`, 등)
    -   가상 클래스 선택자 (`:hover`, `:focus`, `:nth-child()`, `:not()`, 등)
    -   가상 요소 선택자 (`::before`, `::after`, `::first-letter`, 등)
-   CSS 명시도(Specificity)와 상속(Inheritance) 규칙 이해하기
-   박스 모델 심층 탐구: `content`, `padding`, `border`, `margin`
-   `box-sizing: border-box`의 필요성과 활용

### 실습
-   다양한 선택자를 활용하여 복잡한 HTML 구조 스타일링하기
-   명시도 충돌 해결 및 박스 모델 문제 디버깅

---

## 2강: Flexbox 완전 정복 (2시간)

### 학습 내용
-   Flexbox란 무엇인가? 1차원 레이아웃 시스템 소개
-   Flex Container 속성:
    -   `display: flex` / `inline-flex`
    -   `flex-direction` (row, row-reverse, column, column-reverse)
    -   `flex-wrap` (nowrap, wrap, wrap-reverse)
    -   `flex-flow` (단축 속성)
    -   `justify-content` (주 축 정렬)
    -   `align-items` (교차 축 아이템 정렬)
    -   `align-content` (교차 축 여러 줄 정렬)
-   Flex Item 속성:
    -   `order`
    -   `flex-grow`
    -   `flex-shrink`
    -   `flex-basis`
    -   `flex` (단축 속성)
    -   `align-self`
-   Flexbox를 활용한 일반적인 UI 패턴 제작 (네비게이션 바, 카드 레이아웃, 중앙 정렬 등)

### 실습
-   Flexbox를 사용하여 네비게이션 메뉴 만들기
-   이미지 갤러리 카드 레이아웃 구성하기
-   아이템 수직/수평 중앙 정렬 마스터하기

---

## 3강: CSS Grid 마스터하기 (2.5시간)

### 학습 내용
-   CSS Grid란 무엇인가? 2차원 레이아웃 시스템 소개
-   Grid Container 속성:
    -   `display: grid` / `inline-grid`
    -   `grid-template-columns` / `grid-template-rows` (다양한 단위: `fr`, `px`, `%`, `auto`, `minmax()`, `repeat()`)
    -   `grid-template-areas`
    -   `grid-gap` / `gap` (row-gap, column-gap)
    -   `justify-items` / `align-items` (셀 내부 아이템 정렬)
    -   `justify-content` / `align-content` (그리드 자체 정렬 - 공간이 남을 경우)
-   Grid Item 속성:
    -   `grid-column-start` / `grid-column-end` / `grid-column`
    -   `grid-row-start` / `grid-row-end` / `grid-row`
    -   `grid-area`
    -   `justify-self` / `align-self`
-   Grid를 활용한 복잡한 페이지 레이아웃 설계 (Holy Grail 레이아웃 등)
-   Flexbox와 Grid 함께 사용하기: 언제 무엇을 선택할까?

### 실습
-   CSS Grid를 사용하여 잡지 스타일의 기사 레이아웃 만들기
-   상품 목록 페이지 레이아웃 Grid로 구성하기
-   Flexbox와 Grid를 조합하여 복잡한 대시보드 컴포넌트 레이아웃 설계

---

**마무리:** 이 강의를 통해 여러분은 현대적인 CSS 레이아웃 기법의 핵심인 Flexbox와 Grid를 자신 있게 사용할 수 있게 되었습니다. 다양한 실제 프로젝트에 적용해보면서 경험을 쌓는 것이 중요합니다. 반응형 웹 디자인의 가능성은 무궁무진합니다!
