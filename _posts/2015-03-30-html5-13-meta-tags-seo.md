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

---

## 주의할 점

- `description`은 순위를 올리는 요소가 아니라 검색 결과의 클릭률을 좌우합니다. 80~150자 안에서 페이지 내용을 요약합니다.
- `viewport`가 없으면 모바일 브라우저가 페이지를 축소해 보여 줍니다. `width=device-width, initial-scale=1`을 기본으로 둡니다.
- Open Graph의 `og:image`는 절대 URL이어야 하고 1200×630 비율이 가장 안전합니다. 상대 경로는 대부분의 공유 도구가 무시합니다.
- `canonical`에는 자기 자신을 포함해 정확한 주소를 적습니다. 서로 다른 글에 같은 canonical을 넣으면 한쪽이 검색에서 빠집니다.
- `robots` 메타의 `noindex`와 `robots.txt`의 `Disallow`는 다릅니다. 전자는 색인을, 후자는 크롤링 자체를 막습니다.
