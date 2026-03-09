---
layout: post
title: "HTML 목록 태그 완전 정리 — ul, ol, li, dl 사용법"
description: "순서 없는 목록(ul)과 순서 있는 목록(ol), 정의 목록(dl)의 차이와 사용법을 정리합니다. 중첩 목록 만드는 법, 네비게이션 메뉴에 목록을 활용하는 실전 패턴도 포함합니다."
date: 2015-01-07 09:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 7
tags: [html, ul, ol, li, dl, 목록태그, 리스트]
lang: ko
---

목록은 웹에서 가장 많이 쓰이는 구조 중 하나입니다. 메뉴, 글 목록, 단계별 설명, 용어 정의 등 어디서든 등장합니다. HTML 목록 태그 세 가지를 정확히 알아봅니다.

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

단계별 설치 방법, 요리 레시피, 절차 안내 등 순서가 바뀌면 의미가 달라지는 목록에 씁니다.

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

## 실전 패턴: 네비게이션 메뉴

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

## 정리

| 태그 | 용도 |
|------|------|
| `<ul>` | 순서가 중요하지 않은 목록 |
| `<ol>` | 순서가 중요한 목록 (단계, 절차) |
| `<li>` | ul과 ol의 각 항목 |
| `<dl>` | 용어와 설명 쌍의 목록 |
| `<dt>` | 용어 |
| `<dd>` | 용어에 대한 설명 |

다음 글에서는 표(table) 태그를 다룹니다.