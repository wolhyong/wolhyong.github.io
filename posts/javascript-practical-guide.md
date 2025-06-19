# JavaScript 실전 입문: 인터랙티브 웹을 위한 핵심 JS (JS 강의)

**강의 목표:** 본 JavaScript 강의는 수강생들이 웹 페이지에 동적인 기능을 추가하고 사용자 인터랙션을 처리하는 데 필요한 핵심 JavaScript 개념과 실전 활용법을 익히는 것을 목표로 합니다. DOM 조작, 이벤트 처리, 비동기 프로그래밍 기초 등을 다룹니다.

**강의 시간:** 총 6시간 (이론 2.5시간, 실습 3.5시간)

**선수 지식:** HTML과 CSS에 대한 기본적인 이해가 필요합니다. 프로그래밍 경험이 없어도 괜찮지만, 있다면 학습에 도움이 될 수 있습니다.

---

## 1강: JavaScript 시작하기와 기본 문법 (1.5시간)

### 학습 내용
-   JavaScript란 무엇인가? 웹에서의 역할과 중요성
-   JavaScript 실행 환경: 브라우저 콘솔, `<script>` 태그 (내부 vs 외부 파일)
-   변수와 상수: `var`, `let`, `const`의 차이점과 사용법
-   데이터 타입:
    -   원시 타입: `String`, `Number`, `Boolean`, `Null`, `Undefined`, `Symbol`, `BigInt`
    -   객체 타입: `Object` (기본 소개)
-   연산자: 산술, 할당, 비교, 논리, 삼항 연산자 등
-   조건문: `if...else`, `switch`
-   반복문: `for`, `while`, `do...while`
-   함수 기초: 함수 선언, 호출, 매개변수, 반환 값

### 실습
-   간단한 계산기 로직 만들기 (두 숫자 입력 받아 결과 출력)
-   조건문을 활용한 사용자 입력 검증
-   배열 데이터를 반복문으로 처리하여 HTML 목록 생성하기

---

## 2강: DOM 조작과 이벤트 처리 (2시간)

### 학습 내용
-   DOM(Document Object Model)이란?
-   HTML 요소 선택하기:
    -   `getElementById`, `getElementsByClassName`, `getElementsByTagName`
    -   `querySelector`, `querySelectorAll` (CSS 선택자 활용)
-   선택한 요소의 콘텐츠 변경: `textContent`, `innerHTML`
-   선택한 요소의 속성 변경: `getAttribute`, `setAttribute`, `removeAttribute`
-   선택한 요소의 스타일 변경: `element.style` 객체
-   새로운 HTML 요소 생성 및 추가/삭제: `createElement`, `appendChild`, `insertBefore`, `removeChild`
-   클래스 조작: `classList` (`add`, `remove`, `toggle`, `contains`)
-   이벤트란 무엇인가? 이벤트 기반 프로그래밍 소개
-   이벤트 리스너 등록 및 제거: `addEventListener`, `removeEventListener`
-   자주 사용되는 이벤트 타입: `click`, `mouseover`, `mouseout`, `keydown`, `keyup`, `submit`, `change`, `load` 등
-   이벤트 객체와 활용: `event.target`, `event.preventDefault()`, `event.stopPropagation()`

### 실습
-   버튼 클릭 시 텍스트 내용 변경하기
-   이미지 마우스오버 시 다른 이미지로 변경하기
-   To-Do 리스트 만들기 (아이템 추가, 삭제, 완료 처리)
-   간단한 폼 유효성 검사 및 제출 처리

---

## 3강: JavaScript 심화 개념 및 비동기 처리 기초 (2.5시간)

### 학습 내용
-   객체 심화: 객체 리터럴, 속성 접근, 메소드
-   배열 심화: 유용한 배열 메소드 (`forEach`, `map`, `filter`, `reduce`, `find`, `findIndex`, `slice`, `splice` 등)
-   스코프와 클로저 개념 이해하기
-   `this` 키워드의 동작 방식
-   ES6+ 주요 기능 소개: 화살표 함수, 템플릿 리터럴, 구조 분해 할당, 스프레드/레스트 연산자
-   에러 처리: `try...catch...finally`
-   비동기 프로그래밍이란? (콜백 함수의 한계)
-   `setTimeout`, `setInterval`
-   Promise 객체 소개: `pending`, `fulfilled`, `rejected` 상태
-   `async/await`를 사용한 비동기 코드 작성법 (기본)
-   (선택적) 간단한 `fetch` API를 사용한 데이터 요청 예제

### 실습
-   객체와 배열을 활용하여 데이터 관리하기 (예: 학생 정보 목록)
-   화살표 함수와 배열 메소드를 사용하여 코드 간결하게 만들기
-   `setTimeout`을 사용한 간단한 애니메이션 효과 구현
-   `Promise`를 사용하여 비동기 작업 순차적으로 실행하기
-   (선택적) 공개 API에서 데이터 가져와 화면에 표시하기

---

**마무리:** 이 강의를 통해 JavaScript의 핵심 문법을 익히고, DOM 조작과 이벤트 처리를 통해 웹 페이지를 동적으로 제어하는 방법을 배웠습니다. 비동기 처리의 기초와 ES6+의 유용한 기능들도 맛보았습니다. 앞으로 다양한 프로젝트를 통해 실제 문제 해결 능력을 키워나가시길 바랍니다. JavaScript의 세계는 넓고 깊으니 꾸준히 학습하는 자세가 중요합니다!
