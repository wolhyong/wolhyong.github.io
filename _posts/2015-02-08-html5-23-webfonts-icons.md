---
layout: post
title: "웹 폰트와 아이콘 완전 정리 — Google Fonts, Font Awesome, SVG 아이콘"
description: "HTML에 웹 폰트를 적용하는 방법을 정리합니다. Google Fonts CDN 연결법, @font-face로 직접 호스팅하는 법, font-display 최적화, Font Awesome 아이콘 사용법, SVG 스프라이트 아이콘 시스템까지 다룹니다."
date: 2015-02-08 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 23
tags: [html, 웹폰트, Google-Fonts, Font-Awesome, SVG아이콘, font-display, 성능최적화]
lang: ko
---

기본 시스템 폰트만 쓰면 디자인에 한계가 있습니다. 웹 폰트를 적용하면 어떤 기기에서도 동일한 폰트로 보이는 일관된 디자인을 만들 수 있습니다. Google Fonts 적용부터 성능 최적화까지 정리합니다.

---

## Google Fonts 적용

가장 빠르고 간단한 방법입니다.

**1단계: fonts.google.com에서 폰트 선택**

원하는 폰트를 검색하고 굵기(weight)를 선택합니다. 한국어 폰트는 "Noto Sans KR", "Nanum Gothic" 등을 검색하면 됩니다.

**2단계: link 태그 HTML에 삽입**

```html
<head>
  <meta charset="UTF-8">

  <!-- Google Fonts 권장 연결 방법 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
</head>
```

`preconnect`로 DNS 조회와 TCP 연결을 미리 해두면 폰트 로딩이 빨라집니다.

**3단계: CSS에서 적용**

```css
body {
  font-family: 'Noto Sans KR', sans-serif;
}

h1, h2, h3 {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
}
```

---

## 여러 폰트 한 번에 불러오기

```html
<!-- 제목용 + 본문용 폰트 동시 로드 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

```css
body {
  font-family: 'Noto Sans KR', sans-serif;
}

code, pre {
  font-family: 'JetBrains Mono', monospace;
}
```

폰트 굵기는 실제로 사용하는 것만 선택해야 합니다. 불필요한 굵기를 불러오면 페이지 로딩이 느려집니다.

---

## @font-face — 직접 호스팅

CDN을 사용하지 않고 폰트 파일을 직접 서버에 올려서 적용하는 방법입니다. 개인정보 정책 상 외부 CDN을 사용할 수 없거나, 오프라인 환경에서도 동작해야 할 때 씁니다.

```css
@font-face {
  font-family: 'MyFont';
  src: url('/assets/fonts/myfont.woff2') format('woff2'),
       url('/assets/fonts/myfont.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'MyFont';
  src: url('/assets/fonts/myfont-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

**폰트 파일 형식 우선순위**: woff2 → woff (woff2가 더 작고 빠릅니다)

---

## font-display — 폰트 로딩 전략

웹 폰트가 로드되기 전에 텍스트를 어떻게 보여줄지 결정합니다.

| 값 | 동작 |
|----|------|
| `auto` | 브라우저 기본값 |
| `block` | 폰트 로드될 때까지 텍스트 숨김 (FOIT) |
| `swap` | 즉시 시스템 폰트로 표시 후 교체 (FOUT) |
| `fallback` | 100ms 대기 후 시스템 폰트, 나중에 교체 |
| `optional` | 빠른 연결에서만 웹 폰트 적용 |

블로그에는 `font-display: swap`이 가장 무난합니다. 텍스트가 폰트 로드 전에도 바로 보이기 때문에 사용자 경험이 좋습니다.

---

## Font Awesome 아이콘

벡터 아이콘을 웹에서 쉽게 쓸 수 있는 라이브러리입니다.

**CDN으로 연결**

```html
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
```

**아이콘 사용**

```html
<!-- Solid 아이콘 (fas) -->
<i class="fas fa-home"></i>
<i class="fas fa-search"></i>
<i class="fas fa-star"></i>

<!-- Regular 아이콘 (far) -->
<i class="far fa-heart"></i>
<i class="far fa-bookmark"></i>

<!-- 브랜드 아이콘 (fab) -->
<i class="fab fa-github"></i>
<i class="fab fa-twitter"></i>
<i class="fab fa-python"></i>
```

**크기 조절**

```html
<i class="fas fa-home fa-xs"></i>   <!-- 0.75em -->
<i class="fas fa-home fa-sm"></i>   <!-- 0.875em -->
<i class="fas fa-home"></i>         <!-- 1em (기본) -->
<i class="fas fa-home fa-lg"></i>   <!-- 1.25em -->
<i class="fas fa-home fa-2x"></i>   <!-- 2em -->
<i class="fas fa-home fa-3x"></i>   <!-- 3em -->
```

**접근성 처리**

```html
<!-- 장식용 아이콘: aria-hidden -->
<i class="fas fa-star" aria-hidden="true"></i> 4.8

<!-- 의미 있는 아이콘: aria-label -->
<button>
  <i class="fas fa-trash" aria-hidden="true"></i>
  <span class="sr-only">삭제</span>
</button>
```

---

## SVG 아이콘 — 가장 권장되는 방법

Font Awesome보다 성능이 좋고, 색상 변경이 자유롭습니다.

**인라인 SVG**

```html
<button>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
  검색
</button>
```

`currentColor`를 사용하면 CSS의 `color` 속성에 따라 아이콘 색상이 자동으로 바뀝니다.

**SVG 스프라이트 — 아이콘 모음 관리**

```html
<!-- HTML 파일 상단 (숨김 처리) -->
<svg style="display:none">
  <symbol id="icon-home" viewBox="0 0 24 24">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  </symbol>
  <symbol id="icon-search" viewBox="0 0 24 24">
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </symbol>
</svg>

<!-- 사용 -->
<svg width="20" height="20" aria-hidden="true">
  <use href="#icon-home"/>
</svg>

<svg width="20" height="20" aria-hidden="true">
  <use href="#icon-search"/>
</svg>
```

---

## 실습: 블로그 헤더에 폰트와 아이콘 적용

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GHW Dev Blog</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&family=JetBrains+Mono&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Noto Sans KR', sans-serif;
    }
    code {
      font-family: 'JetBrains Mono', monospace;
      background: #1e1e2e;
      color: #cdd6f4;
      padding: 2px 6px;
      border-radius: 4px;
    }
    nav a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>
  <header>
    <a href="/">GHW Dev Blog</a>
    <nav>
      <a href="/">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        홈
      </a>
      <a href="/blog">블로그</a>
    </nav>
  </header>

  <main>
    <h1>환경 변수는 <code>.env</code> 파일에 저장합니다</h1>
  </main>
</body>
</html>
```

---

## 정리

- Google Fonts: `preconnect` + `link` 태그로 연결, `font-display: swap` 권장
- `@font-face`: 폰트를 직접 호스팅할 때 사용, woff2 우선
- Font Awesome: CDN 연결 후 `<i class="fas fa-이름">` 사용
- SVG 아이콘: 가장 권장되는 방법, `currentColor`로 색상 제어
- 아이콘에는 항상 접근성 처리 (`aria-hidden` 또는 `aria-label`)

다음 글에서는 Open Graph 태그 심화 — SNS 공유 최적화 실전을 다룹니다.