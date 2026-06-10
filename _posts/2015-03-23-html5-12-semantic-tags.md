---
layout: post
title: "HTML5 시맨틱 태그 — header, nav, main, section, article, footer"
description: "HTML5 시맨틱 태그는 왜 중요한가요? header, nav, main, section, article, aside, footer의 역할과 div와의 차이, 실제 블로그 레이아웃에 적용하는 방법을 설명합니다."
date: 2015-03-23 00:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 12
tags: [html5, 시맨틱태그, header, nav, main, article, section, footer, SEO]
lang: ko
---

HTML5 이전에는 모든 레이아웃을 div로 만들었습니다. 그래서 코드를 보면 `<div id="header">`, `<div id="content">` 같은 이름으로 역할을 구분했습니다. HTML5는 그 역할에 맞는 태그를 직접 제공합니다. 이것이 시맨틱(Semantic, 의미 있는) 태그입니다.

---

## 시맨틱 태그가 필요한 이유

```html
<!-- HTML4 방식 (div로만 구성) -->
<div id="header">...</div>
<div id="nav">...</div>
<div id="main">...</div>
<div id="footer">...</div>

<!-- HTML5 시맨틱 방식 -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<footer>...</footer>
```

시각적으로 같아 보이지만 의미가 다릅니다.

- **검색 엔진**이 페이지 구조를 더 정확히 파악합니다
- **스크린 리더**가 사용자에게 구조를 설명합니다
- **개발자**가 코드를 읽을 때 구조를 직관적으로 파악합니다

---

## header — 헤더

페이지나 섹션의 소개 영역입니다. 로고, 제목, 내비게이션이 들어갑니다.

```html
<header>
  <a href="/" class="logo">
    <img src="logo.svg" alt="GHW Dev Blog">
  </a>
  <nav>
    <ul>
      <li><a href="/">홈</a></li>
      <li><a href="/blog">블로그</a></li>
    </ul>
  </nav>
</header>
```

한 페이지에 여러 header가 있어도 됩니다. article이나 section 안에도 header를 넣을 수 있습니다.

---

## nav — 내비게이션

사이트 내 주요 링크 묶음입니다. 모든 링크 목록이 nav여야 하는 것은 아닙니다. 사이트 탐색에 중요한 메인 메뉴, 목차 등에 사용합니다.

```html
<nav aria-label="주요 메뉴">
  <ul>
    <li><a href="/">홈</a></li>
    <li><a href="/series">시리즈</a></li>
    <li><a href="/tags">태그</a></li>
  </ul>
</nav>
```

---

## main — 페이지의 핵심 콘텐츠

페이지에서 가장 중요한 내용을 담는 영역입니다. 한 페이지에 **하나만** 사용합니다. header, footer, nav처럼 반복되는 콘텐츠는 main에 포함하지 않습니다.

```html
<body>
  <header>...</header>
  <main>
    <!-- 이 페이지의 주요 내용 -->
    <h1>글 제목</h1>
    <article>...</article>
  </main>
  <footer>...</footer>
</body>
```

---

## article — 독립적인 콘텐츠

그 자체로 완결된 내용을 나타냅니다. 다른 사이트나 RSS 피드에 그대로 배포될 수 있는 콘텐츠입니다.

- 블로그 게시글
- 뉴스 기사
- 포럼 게시물
- 제품 카드

```html
<article>
  <header>
    <h2>React 18 업데이트 내용 정리</h2>
    <time datetime="2024-01-15">2024년 1월 15일</time>
  </header>
  <p>React 18에서 추가된 Concurrent Features를 소개합니다...</p>
  <footer>
    <p>태그: <a href="/tags/react">React</a></p>
  </footer>
</article>
```

---

## section — 주제별 구획

같은 주제로 묶이는 콘텐츠 구획입니다. section에는 반드시 제목(h2~h6)이 있어야 합니다.

```html
<main>
  <section>
    <h2>최신 글</h2>
    <!-- 최신 글 목록 -->
  </section>

  <section>
    <h2>시리즈</h2>
    <!-- 시리즈 목록 -->
  </section>
</main>
```

**article vs section 구분**
- 내용이 독립적으로 완결됐는가? → `article`
- 다른 내용과 주제로 묶인 구획인가? → `section`
- 둘 다 아니고 단순히 스타일을 위한 묶음인가? → `div`

---

## aside — 사이드바

본문과 간접적으로 관련된 내용입니다. 관련 링크, 광고, 저자 정보, 태그 클라우드 등이 들어갑니다.

```html
<aside>
  <h3>관련 글</h3>
  <ul>
    <li><a href="/post/html-basics">HTML 기초</a></li>
    <li><a href="/post/css-intro">CSS 입문</a></li>
  </ul>
</aside>
```

---

## footer — 푸터

페이지나 섹션의 마무리 영역입니다. 저작권, 연락처, 사이트맵 링크 등이 들어갑니다.

```html
<footer>
  <p>&copy; 2015 GHW Dev Blog. All rights reserved.</p>
  <nav>
    <a href="/privacy">개인정보 처리방침</a>
    <a href="/contact">연락처</a>
  </nav>
</footer>
```

---

## 실제 블로그 레이아웃 전체 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>HTML5 시맨틱 구조 실습 — GHW Dev Blog</title>
</head>
<body>

  <header>
    <a href="/" class="logo">GHW Dev Blog</a>
    <nav aria-label="주요 메뉴">
      <ul>
        <li><a href="/">홈</a></li>
        <li><a href="/blog">블로그</a></li>
        <li><a href="/about">소개</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <section>
      <h2>최신 글</h2>

      <article>
        <header>
          <h3><a href="/post/1">Python 데이터 분석 입문</a></h3>
          <time datetime="2024-01-15">2024. 1. 15</time>
        </header>
        <p>pandas와 matplotlib으로 데이터를 시각화하는 방법을 다룹니다.</p>
      </article>

      <article>
        <header>
          <h3><a href="/post/2">Docker 기초부터 배포까지</a></h3>
          <time datetime="2024-01-14">2024. 1. 14</time>
        </header>
        <p>컨테이너 개념부터 실제 배포까지 정리합니다.</p>
      </article>
    </section>
  </main>

  <aside>
    <h2>카테고리</h2>
    <ul>
      <li><a href="/category/python">Python (12)</a></li>
      <li><a href="/category/react">React (8)</a></li>
      <li><a href="/category/docker">Docker (5)</a></li>
    </ul>
  </aside>

  <footer>
    <p>&copy; 2015 GHW Dev Blog</p>
  </footer>

</body>
</html>
```

---

## 마치며
| 태그 | 역할 |
|------|------|
| `<header>` | 페이지/섹션의 소개, 로고, 메뉴 |
| `<nav>` | 주요 탐색 링크 |
| `<main>` | 페이지의 핵심 콘텐츠 (페이지당 하나) |
| `<article>` | 독립적으로 완결된 콘텐츠 |
| `<section>` | 주제별 콘텐츠 구획 (제목 필수) |
| `<aside>` | 본문과 간접 관련 콘텐츠 |
| `<footer>` | 저작권, 연락처, 사이트맵 |

다음 글에서는 SEO에 중요한 메타 태그와 head 안에 넣는 여러 설정을 다룹니다.


## 실전 예제로 이해하기

HTML의 HTML5 시맨틱 태그 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 HTML5 시맨틱 태그을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML5 시맨틱 태그 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>HTML5 시맨틱 태그에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 HTML5 시맨틱 태그을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. HTML5 시맨틱 태그 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 HTML5 시맨틱 태그을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
