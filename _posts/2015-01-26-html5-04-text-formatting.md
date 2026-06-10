---
layout: post
title: "HTML 텍스트 서식 태그 — strong, em, span, blockquote 사용법"
description: "HTML에서 텍스트를 강조하는 태그는 어떻게 다를까요? strong과 b의 차이, em과 i의 차이, span 활용법, blockquote와 pre 태그 사용법까지 예제와 함께 설명합니다."
date: 2015-01-26 00:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 4
tags: [html, strong, em, span, blockquote, 텍스트서식]
lang: ko
---

텍스트를 굵게, 기울임체로, 혹은 인용문으로 표시하는 태그들이 있습니다. 비슷해 보이는 태그들이 여럿 있는데, 각각 언제 어떤 태그를 써야 하는지 정확히 알아봅니다.

---

## strong — 중요한 내용 강조

의미적으로 **중요한** 텍스트를 강조할 때 사용합니다. 브라우저에서 굵게 표시됩니다.

```html
<p>비밀번호는 <strong>절대로 타인에게 공유하지 마세요.</strong></p>
<p>제출 버튼을 누르기 전에 <strong>내용을 반드시 확인하세요.</strong></p>
```

검색 엔진은 strong으로 감싼 텍스트를 "이 페이지에서 중요한 키워드"로 인식합니다. 그래서 남용하면 효과가 없어집니다. 정말 중요한 내용에만 사용해야 합니다.

---

## b — 시각적으로만 굵게

의미적 중요성 없이 단순히 굵게 표시할 때 사용합니다.

```html
<p>이번 달 인기 검색어: <b>HTML 입문</b>, <b>CSS 기초</b></p>
```

strong과 b의 차이를 한 줄로 정리하면 이렇습니다.

- `strong` → 이 내용이 중요하다 (의미 + 굵기)
- `b` → 굵게 보이게만 한다 (굵기만)

실무에서는 대부분 strong을 사용하는 것이 더 적절합니다.

---

## em — 강세 기울임체

말할 때 특정 단어를 강조하는 뉘앙스입니다. 기울임체로 표시됩니다.

```html
<p>저는 커피를 <em>정말</em> 좋아합니다.</p>
<p>오늘 <em>반드시</em> 제출해야 합니다.</p>
```

---

## i — 시각적 기울임체

기술 용어, 외국어, 생각을 나타낼 때 사용합니다.

```html
<p>이 함수는 <i>callback</i>을 인수로 받습니다.</p>
<p>그는 <i lang="fr">déjà vu</i>를 느꼈다고 했다.</p>
```

em과 i의 차이도 마찬가지입니다.

- `em` → 강세가 있는 강조 (의미 + 기울임)
- `i` → 시각적 구분만 필요한 기울임

---

## span — 인라인 요소 묶기

특정 텍스트에 CSS 스타일을 적용하거나 JavaScript로 접근하고 싶을 때 사용합니다. 자체적인 의미는 없고 텍스트를 묶어주는 역할만 합니다.

```html
<p>가격: <span class="price">29,000원</span></p>
<p>상태: <span class="status available">재고 있음</span></p>
```

span은 인라인 요소이기 때문에 줄 바꿈 없이 텍스트 흐름 안에서 사용됩니다. 블록 단위로 묶을 때는 div를 사용합니다.

---

## blockquote — 인용문

다른 출처의 내용을 인용할 때 사용합니다.

```html
<blockquote cite="https://developer.mozilla.org">
  <p>HTML은 웹의 구성 요소 중 가장 기본이 되는 언어입니다.</p>
</blockquote>
```

`cite` 속성에 출처 URL을 적으면 검색 엔진이 원본 출처를 파악하는 데 도움이 됩니다.

짧은 인라인 인용은 `<q>` 태그를 사용합니다.

```html
<p>스티브 잡스는 <q>Stay hungry, stay foolish</q>라고 말했습니다.</p>
```

브라우저가 자동으로 따옴표를 붙여 표시합니다.

---

## pre — 형식 그대로 표시

코드나 ASCII 아트처럼 공백과 줄 바꿈을 그대로 유지해야 할 때 사용합니다.

```html
<pre>
  function hello() {
    console.log("Hello, World!");
  }
</pre>
```

pre 안에서는 스페이스, 탭, 줄 바꿈이 모두 그대로 렌더링됩니다. 코드 표시에는 보통 `<pre><code>` 조합을 사용합니다.

```html
<pre><code>
const greet = (name) => {
  return `Hello, ${name}!`;
};
</code></pre>
```

---

## small — 작은 글씨

저작권 표시, 부가 설명처럼 중요도가 낮은 텍스트에 사용합니다.

```html
<p><small>© 2024 GHW Dev Blog. All rights reserved.</small></p>
```

---

## mark — 형광펜 효과

검색 결과에서 키워드를 하이라이트하거나 중요한 구절을 표시할 때 사용합니다.

```html
<p>이 함수에서 <mark>비동기 처리</mark>가 핵심입니다.</p>
```

---

## 실습: 블로그 본문 텍스트 꾸미기

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>텍스트 서식 태그 실습</title>
</head>
<body>
  <h1>Python 시작 전 알아야 할 것들</h1>

  <p>Python은 <strong>가장 배우기 쉬운 프로그래밍 언어</strong> 중 하나입니다.
  문법이 <em>영어 문장처럼</em> 읽히기 때문에 처음 프로그래밍을 배우는 분들에게 특히 추천합니다.</p>

  <blockquote cite="https://python.org">
    <p>Python is a programming language that lets you work quickly and integrate systems more effectively.</p>
  </blockquote>

  <p>설치 후 터미널에서 아래 명령어로 버전을 확인하세요.</p>

  <pre><code>python --version
# Python 3.11.0</code></pre>

  <p><small>* 버전은 설치 시점에 따라 다를 수 있습니다.</small></p>
</body>
</html>
```

---

## 요약

| 태그 | 용도 |
|------|------|
| `<strong>` | 의미적으로 중요한 내용 강조 (굵게) |
| `<b>` | 시각적 굵기만 필요할 때 |
| `<em>` | 강세가 있는 강조 (기울임) |
| `<i>` | 기술 용어, 외국어 등 시각적 기울임 |
| `<span>` | CSS/JS 접근을 위한 인라인 묶음 |
| `<blockquote>` | 외부 출처 인용문 |
| `<pre>` | 공백/줄 바꿈 유지 텍스트 |
| `<mark>` | 형광펜 하이라이트 |
| `<small>` | 부가 설명, 저작권 표시 |

다음 글에서는 링크 태그(`<a>`)를 자세히 다룹니다.


## 실전 예제로 이해하기

HTML의 텍스트 서식 태그 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 텍스트 서식 태그을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>텍스트 서식 태그 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>텍스트 서식 태그에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 텍스트 서식 태그을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. 텍스트 서식 태그 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 텍스트 서식 태그을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
