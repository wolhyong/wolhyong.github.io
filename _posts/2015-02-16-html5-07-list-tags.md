---
layout: post
title: "HTML 목록 태그 ul, ol, li, dl로 콘텐츠 구조화하기"
description: "HTML에서 목록을 만드는 방법은 무엇인가요? ul(비순서형), ol(순서형), dl(정의형)의 차이와 올바른 사용법, 중첩 목록 만드는 법, 네비게이션 메뉴의 활용 패턴까지 설명합니다."
date: 2015-02-16 00:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 7
tags: [html, ul, ol, li, dl, 목록태그, 리스트]
lang: ko
---

목록은 웹에서 가장 많이 쓰이는 구조 중 하나입니다. 메뉴, 글 목록, 설명, 용어 정의 등 어디서든 등장합니다. 목록 태그는 겉보기에는 단순해 보이지만, 어떤 태그를 쓰느냐에 따라 검색 엔진과 스크린 리더가 콘텐츠를 이해하는 방식이 달라집니다.

ul, ol, dl 세 가지 목록 태그를 각각 언제 써야 하는지, 실제로 코드를 실행하면 화면에 어떻게 표시되는지까지 확인해보겠습니다.

---

## ul — 순서 없는 목록

항목의 순서가 중요하지 않을 때 사용합니다. 기본적으로 점(bullet)으로 표시됩니다.

```html
<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ul>
```

출력:
- HTML
- CSS
- JavaScript

순서를 바꿔도 의미가 변하지 않는 목록에 씁니다. 재료 목록, 기능 목록, 메뉴 항목 등이 해당합니다.

브라우저에서 이 코드를 열어보면 각 항목 앞에 동그란 점(bullet)이 표시됩니다. 이 점은 CSS의 `list-style` 속성으로 없애거나 다른 모양으로 바꿀 수 있습니다.

---

## ol — 순서 있는 목록

항목의 순서가 의미를 가질 때 사용합니다. 숫자로 표시됩니다.

```html
<ol>
  <li>Python 설치</li>
  <li>가상 환경 생성</li>
  <li>패키지 설치</li>
  <li>코드 실행</li>
</ol>
```

출력:
1. Python 설치
2. 가상 환경 생성
3. 패키지 설치
4. 코드 실행

설치 방법, 요리 레시피, 절차 안내 등 순서가 바뀌면 의미가 달라지는 목록에 씁니다.

ol 태그로 작성한 코드를 브라우저에서 열면 1, 2, 3, 4 숫자가 자동으로 붙어서 표시됩니다. 만약 중간에 항목을 추가하거나 삭제해도 브라우저가 알아서 번호를 다시 매겨줍니다. 이게 ol을 쓰는 핵심 장점입니다. ul처럼 직접 숫자를 입력할 필요가 없습니다.

**ol 속성**

```html
<!-- 시작 번호 변경 (4번부터 시작) -->
<ol start="4">
  <li>네 번째 단계</li>
  <li>다섯 번째 단계</li>
</ol>

<!-- 역순 -->
<ol reversed>
  <li>세 번째</li>
  <li>두 번째</li>
  <li>첫 번째</li>
</ol>

<!-- 표시 형식 변경 -->
<ol type="A">  <!-- A, B, C... -->
<ol type="a">  <!-- a, b, c... -->
<ol type="I">  <!-- I, II, III... -->
<ol type="i">  <!-- i, ii, iii... -->
```

---

## 중첩 목록

목록 안에 또 다른 목록을 넣을 수 있습니다.

```html
<ul>
  <li>프론트엔드
    <ul>
      <li>HTML</li>
      <li>CSS</li>
      <li>JavaScript</li>
    </ul>
  </li>
  <li>백엔드
    <ul>
      <li>Node.js</li>
      <li>Python</li>
    </ul>
  </li>
</ul>
```

중첩 목록을 만들 때 새 ul/ol 태그는 **li 태그 안에** 넣어야 합니다. li 밖에 두면 유효하지 않은 HTML이 됩니다.

---

## dl — 정의 목록

용어와 설명 쌍으로 이루어진 목록입니다.

```html
<dl>
  <dt>HTML</dt>
  <dd>웹 페이지의 구조를 정의하는 마크업 언어입니다.</dd>

  <dt>CSS</dt>
  <dd>HTML 요소의 스타일을 정의하는 언어입니다.</dd>

  <dt>JavaScript</dt>
  <dd>웹 페이지에 동적 기능을 추가하는 프로그래밍 언어입니다.</dd>
</dl>
```

- `dl` — Definition List, 전체 정의 목록
- `dt` — Definition Term, 용어
- `dd` — Definition Description, 설명

용어사전, FAQ, 메타데이터 표시 등에 적합합니다.

---

## 활용: 네비게이션 메뉴

웹에서 메뉴는 거의 항상 ul로 만듭니다. CSS로 스타일을 입히면 수평 메뉴가 됩니다.

```html
<nav>
  <ul>
    <li><a href="/">홈</a></li>
    <li><a href="/blog">블로그</a></li>
    <li><a href="/about">소개</a></li>
    <li><a href="/contact">연락처</a></li>
  </ul>
</nav>
```

이것이 실제 웹사이트 메뉴의 기본 구조입니다. ul 태그의 점(bullet)은 CSS로 `list-style: none`으로 제거하고, li를 가로로 배치합니다.

---

## 실습: 튜토리얼 목차 만들기

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>React 입문 강의 목차</title>
</head>
<body>
  <h1>React 입문 강의</h1>

  <h2>강의 목차</h2>
  <ol>
    <li>React 소개와 개발환경 설정
      <ul>
        <li>Node.js 설치</li>
        <li>create-react-app으로 프로젝트 생성</li>
        <li>VS Code 세팅</li>
      </ul>
    </li>
    <li>컴포넌트 기초
      <ul>
        <li>함수형 컴포넌트</li>
        <li>JSX 문법</li>
        <li>Props 전달</li>
      </ul>
    </li>
    <li>State와 이벤트 처리</li>
    <li>useEffect Hook</li>
  </ol>

  <h2>이 강의에서 사용하는 기술</h2>
  <ul>
    <li>React 18</li>
    <li>JavaScript ES6+</li>
    <li>VS Code</li>
  </ul>

  <h2>주요 용어 정리</h2>
  <dl>
    <dt>컴포넌트 (Component)</dt>
    <dd>UI를 독립적이고 재사용 가능한 조각으로 나눈 단위입니다.</dd>

    <dt>Props</dt>
    <dd>부모 컴포넌트에서 자식 컴포넌트로 전달하는 데이터입니다.</dd>

    <dt>State</dt>
    <dd>컴포넌트가 관리하는 내부 상태 데이터입니다.</dd>
  </dl>
</body>
</html>
```

---

## 핵심

| 태그 | 용도 |
|------|------|
| `<ul>` | 순서가 중요하지 않은 목록 |
| `<ol>` | 순서가 중요한 목록 (단계, 절차) |
| `<li>` | ul과 ol의 각 항목 |
| `<dl>` | 용어와 설명 쌍의 목록 |
| `<dt>` | 용어 |
| `<dd>` | 용어에 대한 설명 |

다음 글에서는 표(table) 태그를 다룹니다.


## 실전 예제로 이해하기

HTML의 목록 태그 ul, ol, li, dl로 콘텐츠 구조화하기 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 목록 태그 ul, ol, li, dl로 콘텐츠 구조화하기을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>목록 태그 ul, ol, li, dl로 콘텐츠 구조화하기 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>목록 태그 ul, ol, li, dl로 콘텐츠 구조화하기에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 목록 태그 ul, ol, li, dl로 콘텐츠 구조화하기을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. 목록 태그 ul, ol, li, dl로 콘텐츠 구조화하기 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 목록 태그 ul, ol, li, dl로 콘텐츠 구조화하기을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
