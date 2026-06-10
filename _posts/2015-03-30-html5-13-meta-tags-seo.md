---
layout: post
title: "HTML 메타 태그와 SEO 기초 — meta charset, description, viewport, OG 태그"
description: "SEO를 위한 HTML 메타 태그는 어떻게 설정하나요? charset, viewport, description, robots, canonical 태그와 카카오톡·트위터 공유 시 썸네일을 결정하는 OG 태그 설정 방법까지 다룹니다."
date: 2015-03-30 00:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 13
tags: [html, meta, SEO, og태그, viewport, description, 검색최적화]
lang: ko
---

검색 결과에 잘 노출되려면 HTML head 영역 설정이 필요합니다. 화면에는 보이지 않지만 검색 엔진과 SNS 미리보기에 직접 영향을 미치는 메타 태그를 알아봅니다.

---

## meta 태그 기본 형태

```html
<meta name="속성이름" content="속성값">
```

meta 태그는 빈 태그입니다. 주로 `name`과 `content` 쌍으로 사용하거나, `http-equiv`, `charset` 같은 특수 속성을 사용합니다.

---

## 필수 메타 태그

**charset — 문자 인코딩**

```html
<meta charset="UTF-8">
```

head의 가장 첫 번째로 와야 합니다. UTF-8은 한글을 포함한 전 세계 문자를 지원합니다.

**viewport — 반응형 설정**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

모바일 기기에서 페이지를 올바른 크기로 표시하는 설정입니다. 이 태그가 없으면 모바일에서 PC 화면을 축소해서 보여줍니다.

**description — 페이지 설명**

```html
<meta name="description" content="HTML5 기초부터 고급까지 예제로 배우는 강의입니다. 초보자도 따라할 수 있는 커리큘럼을 제공합니다.">
```

구글 검색 결과에서 제목 아래에 표시되는 설명 텍스트입니다. 160자 이내로 주요 키워드를 자연스럽게 포함해서 작성합니다. 클릭률(CTR)에 직접 영향을 미칩니다.

---

## robots — 검색 엔진 크롤링 제어

```html
<!-- 기본값: 색인하고 링크 따라가기 -->
<meta name="robots" content="index, follow">

<!-- 색인하지 않음 (검색 결과에 안 보임) -->
<meta name="robots" content="noindex">

<!-- 링크를 따라가지 않음 -->
<meta name="robots" content="nofollow">

<!-- 색인도 링크도 안 함 -->
<meta name="robots" content="noindex, nofollow">
```

개발 중인 페이지, 로그인 후에만 보이는 페이지, 중복 콘텐츠 페이지 등에 `noindex`를 씁니다.

---

## canonical — 중복 콘텐츠 처리

같은 내용이 여러 URL에 존재할 때 어느 URL이 원본인지 검색 엔진에 알려줍니다.

```html
<link rel="canonical" href="https://myblog.com/post/html-basics">
```

예를 들어 `https://myblog.com/post/1`과 `https://myblog.com/post/html-basics`가 같은 내용을 보여줄 때, canonical로 어느 쪽이 원본인지 지정합니다.

---

## Open Graph 태그 — SNS 공유 최적화

카카오톡, 페이스북, 슬랙 등에서 링크를 공유했을 때 미리보기가 나타나는 정보를 설정합니다.

```html
<!-- 필수 OG 태그 -->
<meta property="og:title" content="HTML5 메타 태그 정리">
<meta property="og:description" content="SEO와 SNS 공유를 위한 메타 태그 설정 방법을 정리했습니다.">
<meta property="og:image" content="https://myblog.com/images/html5-meta.jpg">
<meta property="og:url" content="https://myblog.com/post/html5-meta-tags">
<meta property="og:type" content="article">
<meta property="og:site_name" content="GHW Dev Blog">
```

`og:image`로 지정한 이미지가 공유 미리보기 썸네일로 사용됩니다. 권장 크기는 1200×630 픽셀입니다.

---

## Twitter Card 태그

트위터(X)에서 링크 공유 시 미리보기를 설정합니다.

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="HTML5 메타 태그 정리">
<meta name="twitter:description" content="SEO와 SNS 공유를 위한 메타 태그 설정 방법을 정리했습니다.">
<meta name="twitter:image" content="https://myblog.com/images/html5-meta.jpg">
```

OG 태그와 함께 설정하는 것이 좋습니다.

---

## 전체 head 설정 예시

```html
<head>
  <!-- 필수 -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML5 메타 태그 정리 — GHW Dev Blog</title>
  <meta name="description" content="검색 최적화와 SNS 공유를 위해 head에 설정하는 메타 태그를 정리합니다.">

  <!-- SEO -->
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://myblog.com/post/meta-tags">

  <!-- OG 태그 -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="HTML5 메타 태그 정리">
  <meta property="og:description" content="검색 최적화와 SNS 공유를 위해 head에 설정하는 메타 태그를 정리합니다.">
  <meta property="og:image" content="https://myblog.com/images/meta-tags.jpg">
  <meta property="og:url" content="https://myblog.com/post/meta-tags">
  <meta property="og:site_name" content="GHW Dev Blog">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="HTML5 메타 태그 정리">
  <meta name="twitter:description" content="검색 최적화와 SNS 공유를 위해 head에 설정하는 메타 태그를 정리합니다.">
  <meta name="twitter:image" content="https://myblog.com/images/meta-tags.jpg">

  <!-- 파비콘 -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
```

---

## 되짚기

| 태그 | 역할 |
|------|------|
| `charset` | 문자 인코딩 설정, 한글 깨짐 방지 |
| `viewport` | 모바일 화면 대응 |
| `description` | 검색 결과 설명 텍스트 (CTR에 영향) |
| `robots` | 검색 엔진 크롤링 허용/차단 |
| `canonical` | 중복 URL 원본 지정 |
| OG 태그 | 카카오톡/페이스북 공유 미리보기 |
| Twitter Card | 트위터 공유 미리보기 |

다음 글에서는 HTML 주석과 특수문자 사용법을 다룹니다.


## 실전 예제로 이해하기

HTML의 메타 태그와 SEO 기초 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 메타 태그와 SEO 기초을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>메타 태그와 SEO 기초 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>메타 태그와 SEO 기초에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 메타 태그와 SEO 기초을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. 메타 태그와 SEO 기초 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 메타 태그와 SEO 기초을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
