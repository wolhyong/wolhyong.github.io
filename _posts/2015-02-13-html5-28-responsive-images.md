---
layout: post
title: "반응형 이미지 완전 정리 — picture, srcset, sizes 속성 사용법"
description: "HTML5 picture 태그와 img의 srcset, sizes 속성으로 화면 크기와 해상도에 따라 최적 이미지를 제공하는 방법을 정리합니다. 1x/2x 디스플레이 대응, 아트 디렉션, WebP 포맷 폴백 패턴, 이미지 최적화로 Core Web Vitals 개선하는 방법까지 다룹니다."
date: 2015-02-13 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 28
tags: [html5, picture, srcset, sizes, 반응형이미지, WebP, 이미지최적화, CoreWebVitals]
lang: ko
---

모바일에서 4K 이미지를 그대로 받아오면 불필요한 데이터를 낭비합니다. 반대로 Retina 디스플레이(2배 해상도)에서 저해상도 이미지를 쓰면 흐릿하게 보입니다. HTML5의 `picture`, `srcset`, `sizes`를 사용하면 브라우저가 상황에 맞는 최적의 이미지를 자동으로 선택합니다.

---

## 왜 반응형 이미지가 필요한가

같은 이미지를 하나의 파일로 모든 기기에 제공하면 두 가지 문제가 생깁니다.

- **데이터 낭비**: 모바일 사용자가 데스크탑용 2000px 이미지를 받음
- **화질 저하**: Retina 디스플레이에서 저해상도 이미지가 흐릿하게 보임

Core Web Vitals의 LCP(Largest Contentful Paint)는 화면에서 가장 큰 이미지의 로딩 속도입니다. 반응형 이미지를 제대로 설정하면 LCP 점수가 크게 개선됩니다.

---

## srcset — 해상도별 이미지 목록

```html
<img
  src="hero.jpg"
  srcset="hero-400.jpg 400w,
          hero-800.jpg 800w,
          hero-1200.jpg 1200w,
          hero-1600.jpg 1600w"
  alt="히어로 이미지"
  width="800"
  height="400">
```

`400w`는 이미지 파일의 실제 너비(width descriptor)입니다. 브라우저가 뷰포트 크기와 화면 픽셀 밀도를 고려해서 가장 적합한 이미지를 선택합니다.

`src`는 srcset을 지원하지 않는 구형 브라우저를 위한 폴백입니다.

---

## sizes — 이미지가 화면에서 차지하는 크기

브라우저는 srcset만으로는 이미지가 레이아웃에서 얼마나 큰지 모릅니다. `sizes`로 알려줍니다.

```html
<img
  src="post-thumb.jpg"
  srcset="post-thumb-400.jpg 400w,
          post-thumb-800.jpg 800w,
          post-thumb-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
  alt="게시물 썸네일"
  width="400"
  height="250"
  loading="lazy">
```

`sizes` 해석:
- 화면이 600px 이하: 이미지가 뷰포트 100% 너비를 차지
- 화면이 601~1200px: 이미지가 뷰포트 50% 너비를 차지
- 그 이상: 이미지가 뷰포트 33% 너비를 차지

마지막 값이 기본값입니다.

---

## 픽셀 밀도 대응 (1x, 2x, 3x)

Retina 디스플레이(2x, 3x)에서 선명한 이미지를 제공합니다.

```html
<img
  src="logo.png"
  srcset="logo.png 1x,
          logo@2x.png 2x,
          logo@3x.png 3x"
  alt="GHW Dev Blog 로고"
  width="120"
  height="40">
```

`1x`, `2x`, `3x`는 픽셀 밀도 디스크립터(density descriptor)입니다. 일반 모니터에서는 `logo.png`, Retina에서는 `logo@2x.png`가 자동으로 선택됩니다.

---

## picture 태그 — 아트 디렉션

단순히 해상도가 다른 것이 아니라, 화면 크기에 따라 **완전히 다른 이미지**를 보여줄 때 사용합니다.

```html
<picture>
  <!-- 화면이 넓을 때: 가로 이미지 -->
  <source media="(min-width: 800px)"
          srcset="hero-landscape.webp"
          type="image/webp">
  <source media="(min-width: 800px)"
          srcset="hero-landscape.jpg">

  <!-- 화면이 좁을 때: 세로 이미지 (얼굴에 맞게 크롭) -->
  <source media="(max-width: 799px)"
          srcset="hero-portrait.webp"
          type="image/webp">
  <source media="(max-width: 799px)"
          srcset="hero-portrait.jpg">

  <!-- 폴백 img (srcset, picture 미지원 브라우저용) -->
  <img src="hero-landscape.jpg" alt="팀 소개 히어로 이미지"
       width="1200" height="600">
</picture>
```

---

## WebP 포맷 폴백 패턴

WebP는 JPEG보다 평균 25~35% 작습니다. 하지만 구형 브라우저는 지원하지 않습니다. `picture`로 WebP를 먼저 제공하고 폴백으로 JPEG를 씁니다.

```html
<picture>
  <source srcset="photo.webp" type="image/webp">
  <source srcset="photo.avif" type="image/avif">
  <img src="photo.jpg" alt="사진 설명"
       width="800" height="500"
       loading="lazy">
</picture>
```

브라우저는 지원하는 첫 번째 source를 사용합니다. AVIF는 WebP보다도 작지만 지원 브라우저가 더 제한적입니다.

---

## 완전한 반응형 이미지 패턴

모든 상황을 처리하는 패턴입니다.

```html
<picture>
  <!-- 와이드 스크린 + WebP -->
  <source
    media="(min-width: 1200px)"
    srcset="hero-xl.webp 1x, hero-xl@2x.webp 2x"
    type="image/webp">

  <!-- 와이드 스크린 + JPEG 폴백 -->
  <source
    media="(min-width: 1200px)"
    srcset="hero-xl.jpg 1x, hero-xl@2x.jpg 2x">

  <!-- 태블릿 + WebP -->
  <source
    media="(min-width: 600px)"
    srcset="hero-md.webp 1x, hero-md@2x.webp 2x"
    type="image/webp">

  <!-- 태블릿 + JPEG 폴백 -->
  <source
    media="(min-width: 600px)"
    srcset="hero-md.jpg 1x, hero-md@2x.jpg 2x">

  <!-- 모바일 기본 (WebP) -->
  <source
    srcset="hero-sm.webp 1x, hero-sm@2x.webp 2x"
    type="image/webp">

  <!-- 최후 폴백 -->
  <img
    src="hero-sm.jpg"
    alt="블로그 히어로 이미지"
    width="600"
    height="400"
    loading="eager"
    fetchpriority="high">
</picture>
```

히어로 이미지처럼 첫 화면에 보이는 LCP 이미지에는 `loading="eager"`와 `fetchpriority="high"`를 붙입니다.

---

## 이미지 최적화 체크리스트

| 항목 | 방법 |
|------|------|
| 포맷 최적화 | 사진은 WebP/AVIF, 아이콘은 SVG |
| 크기 최적화 | 표시 크기에 맞는 이미지 제공 (srcset) |
| 압축 | Squoosh, TinyPNG 등으로 압축 |
| 지연 로딩 | 뷰포트 밖 이미지에 `loading="lazy"` |
| width/height | 레이아웃 이동 방지를 위해 반드시 명시 |
| CDN | 이미지 CDN(Cloudflare Images 등) 사용 고려 |

---

## 정리

- `srcset`으로 해상도별 이미지 목록을 제공합니다
- `sizes`로 레이아웃에서 이미지가 차지하는 크기를 알려줍니다
- `picture`로 미디어 쿼리에 따른 아트 디렉션을 구현합니다
- `picture` + `source type="image/webp"`로 WebP 폴백 패턴을 만듭니다
- LCP 이미지에는 `loading="eager"` + `fetchpriority="high"` 설정

다음 글에서는 HTML template 태그와 동적 콘텐츠 생성을 다룹니다.