---
layout: post
title: "HTML 주석과 특수문자(HTML 엔티티) 사용법"
description: "HTML 주석을 작성하는 법과 꺾쇠 괄호, 앰퍼샌드처럼 HTML에서 직접 쓸 수 없는 특수문자를 HTML 엔티티로 표현하는 방법을 정리합니다. 자주 쓰는 엔티티 코드 표도 포함합니다."
date: 2015-01-14 09:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 14
tags: [html, 주석, 특수문자, html엔티티, nbsp, lt, gt]
lang: ko
---

HTML을 작성하다 보면 꺾쇠 괄호(`<`)를 텍스트로 보여줘야 하거나, 코드에 메모를 남겨야 할 때가 있습니다. HTML 주석과 특수문자 처리 방법을 정리합니다.

---

## HTML 주석

코드에 메모를 남기는 방법입니다. 브라우저 화면에는 표시되지 않습니다.

```html
<!-- 이것은 주석입니다. 화면에 보이지 않습니다. -->

<p>이 문장은 화면에 보입니다.</p>

<!--
  여러 줄 주석도 가능합니다.
  복잡한 코드 블록을 설명할 때 유용합니다.
-->

<!-- TODO: 이 섹션에 이미지 추가 필요 -->
<section>
  <h2>서비스 소개</h2>
</section>
```

**주석 활용법**

개발 중 임시로 코드를 비활성화할 때도 씁니다.

```html
<!-- 임시 비활성화
<div class="banner">
  <p>이벤트 배너 (아직 준비 중)</p>
</div>
-->
```

주의할 점: HTML 주석은 개발자 도구(F12)에서 누구나 볼 수 있습니다. 비밀번호, API 키 같은 민감한 정보를 절대 주석에 남기지 마세요.

---

## HTML 엔티티 (특수문자)

HTML에서 특별한 의미를 가지는 문자들이 있습니다. 이런 문자를 텍스트로 표현하려면 엔티티 코드를 사용해야 합니다.

가장 대표적인 예가 `<`와 `>`입니다. 그대로 쓰면 태그로 인식됩니다.

```html
<!-- 잘못된 방법: 태그로 해석됨 -->
<p>비교 연산자: a < b 는 a가 b보다 작다는 의미입니다.</p>

<!-- 올바른 방법: 엔티티 코드 사용 -->
<p>비교 연산자: a &lt; b 는 a가 b보다 작다는 의미입니다.</p>
```

---

## 자주 쓰는 HTML 엔티티 표

| 문자 | 엔티티 코드 | 이름 | 설명 |
|------|------------|------|------|
| `<` | `&lt;` | Less Than | 태그 시작 기호 |
| `>` | `&gt;` | Greater Than | 태그 종료 기호 |
| `&` | `&amp;` | Ampersand | 엔티티 시작 기호 |
| `"` | `&quot;` | Quotation Mark | 큰따옴표 |
| `'` | `&apos;` | Apostrophe | 작은따옴표 |
| ` ` | `&nbsp;` | Non-Breaking Space | 줄 바꿈 없는 공백 |
| `©` | `&copy;` | Copyright | 저작권 |
| `®` | `&reg;` | Registered | 등록 상표 |
| `™` | `&trade;` | Trademark | 상표 |
| `→` | `&rarr;` | Right Arrow | 오른쪽 화살표 |
| `←` | `&larr;` | Left Arrow | 왼쪽 화살표 |
| `•` | `&bull;` | Bullet | 점 |
| `…` | `&hellip;` | Ellipsis | 말줄임표 |
| `—` | `&mdash;` | Em Dash | 긴 대시 |

---

## &nbsp; — 줄 바꿈 없는 공백

일반 스페이스바 공백은 HTML에서 여러 개를 입력해도 하나로 압축됩니다.

```html
<!-- 여러 공백이 하나로 표시됨 -->
<p>a      b      c</p>  <!-- 출력: a b c -->

<!-- 공백 여러 개 유지 -->
<p>a&nbsp;&nbsp;&nbsp;b&nbsp;&nbsp;&nbsp;c</p>  <!-- 출력: a   b   c -->
```

단어 사이에서 줄 바꿈이 일어나지 않게 고정하는 용도로도 씁니다.

```html
<!-- "10 km"가 "10"과 "km" 사이에서 줄 바꿈되지 않음 -->
<p>거리: 10&nbsp;km</p>
```

---

## 코드 블록에서 엔티티 활용

HTML 코드를 웹 페이지에서 텍스트로 보여줄 때 엔티티가 필수입니다.

```html
<pre><code>
&lt;!DOCTYPE html&gt;
&lt;html lang="ko"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
&lt;/head&gt;
</code></pre>
```

---

## 실습: 저작권과 코드 예제가 있는 페이지

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>주석과 특수문자 실습</title>
</head>
<body>

  <!-- 메인 콘텐츠 시작 -->
  <h1>HTML 비교 연산자 정리</h1>

  <p>JavaScript에서 사용하는 비교 연산자입니다.</p>

  <ul>
    <li><code>a &lt; b</code> — a가 b보다 작다</li>
    <li><code>a &gt; b</code> — a가 b보다 크다</li>
    <li><code>a &lt;= b</code> — a가 b보다 작거나 같다</li>
    <li><code>a &gt;= b</code> — a가 b보다 크거나 같다</li>
    <li><code>a &amp;&amp; b</code> — a와 b 모두 참</li>
  </ul>

  <!-- TODO: 예제 코드 추가 필요 -->

  <footer>
    <p>&copy; 2015 GHW Dev Blog. All rights reserved.</p>
  </footer>

</body>
</html>
```

---

## 정리

- `<!-- 내용 -->` 으로 HTML 주석을 작성합니다
- 주석은 화면에 보이지 않지만 개발자 도구에서는 볼 수 있습니다
- `<`, `>`, `&` 같은 특수문자는 HTML 엔티티 코드로 표현합니다
- `&nbsp;`는 줄 바꿈 없는 공백, `&copy;`는 저작권 기호입니다

다음 글에서는 HTML 작업 환경을 VS Code로 최적화하는 방법을 다룹니다.