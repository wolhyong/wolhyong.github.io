---
layout: post
title: "HTML 성능 최적화 완전 정리 — preload, prefetch, 지연 로딩, Core Web Vitals"
description: "HTML head에서 할 수 있는 리소스 로딩 최적화 방법을 정리합니다. preload, prefetch, preconnect, dns-prefetch 차이, script defer·async 속성, 이미지·폰트 지연 로딩, Core Web Vitals(LCP·CLS·FID) 개선 체크리스트까지 다룹니다."
date: 2015-02-15 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 30
tags: [html, 성능최적화, preload, prefetch, defer, async, CoreWebVitals, LCP, CLS]
lang: ko
---

아무리 좋은 내용의 블로그라도 페이지가 느리면 사용자가 떠납니다. 구글은 페이지 성능을 Core Web Vitals로 측정해 검색 순위에 반영합니다. HTML 단에서 할 수 있는 성능 최적화 방법을 총정리합니다.

---

## Core Web Vitals 기초

구글이 사용자 경험을 측정하는 세 가지 지표입니다.

| 지표 | 이름 | 측정 대상 | 좋음 기준 |
|------|------|-----------|-----------|
| **LCP** | Largest Contentful Paint | 가장 큰 콘텐츠가 화면에 그려지는 시간 | 2.5초 이내 |
| **CLS** | Cumulative Layout Shift | 페이지 로드 중 레이아웃 이동 정도 | 0.1 이하 |
| **INP** | Interaction to Next Paint | 사용자 입력 후 화면 갱신까지 시간 | 200ms 이내 |

HTML에서 직접 영향을 줄 수 있는 것은 LCP와 CLS입니다.

---

## LCP 개선 — 가장 큰 이미지 빠르게 로드하기

LCP의 주요 원인은 히어로 이미지 로딩 지연입니다.

**`preload`로 중요한 이미지 미리 요청**

```html
<head>
  <!-- 히어로 이미지를 다른 리소스보다 먼저 요청 -->
  <link rel="preload" href="/images/hero.webp" as="image" type="image/webp">
  <link rel="preload" href="/images/hero.jpg" as="image">

  <!-- 반응형 이미지 preload -->
  <link
    rel="preload"
    as="image"
    href="/images/hero-sm.webp"
    imagesrcset="/images/hero-sm.webp 600w, /images/hero-lg.webp 1200w"
    imagesizes="100vw">
</head>
```

**히어로 이미지에 `fetchpriority="high"` 설정**

```html
<img
  src="hero.jpg"
  alt="히어로 이미지"
  fetchpriority="high"
  loading="eager">
```

**스크롤 아래 이미지에 `loading="lazy"` 설정**

```html
<img src="post-thumb.jpg" alt="썸네일" loading="lazy" width="400" height="250">
```

---

## CLS 개선 — 레이아웃 이동 방지

이미지나 광고가 로드되면서 아래 콘텐츠가 밀려 내려가는 현상입니다.

**이미지에 width, height 명시**

```html
<!-- ❌ 크기 없음: 이미지 로드 시 레이아웃 이동 발생 -->
<img src="photo.jpg" alt="사진">

<!-- ✅ 크기 명시: 브라우저가 공간 미리 확보 -->
<img src="photo.jpg" alt="사진" width="800" height="600">
```

**CSS aspect-ratio로 비율 유지**

```css
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;  /* 이미지 로드 전에도 공간 확보 */
}
```

**폰트 로딩으로 인한 텍스트 이동 방지**

```css
@font-face {
  font-family: 'Noto Sans KR';
  src: url('font.woff2') format('woff2');
  font-display: swap;   /* 시스템 폰트로 먼저 보여주고 나중에 교체 */
  /* optional: 폰트 교체 자체를 포기 — CLS 완전 제거 */
}
```

---

## preconnect — 외부 도메인 연결 미리 맺기

```html
<!-- Google Fonts 사용 시 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- 외부 API 사용 시 -->
<link rel="preconnect" href="https://api.myblog.com">
```

DNS 조회 + TCP 연결 + TLS 핸드셰이크를 미리 해둡니다. 실제 요청 시 대기 시간이 줄어듭니다.

---

## dns-prefetch — DNS만 미리 조회

`preconnect`보다 가볍습니다. 나중에 쓸 도메인에 DNS 조회만 미리 해둡니다.

```html
<link rel="dns-prefetch" href="https://cdn.example.com">
<link rel="dns-prefetch" href="https://analytics.google.com">
```

---

## prefetch — 다음 페이지 리소스 미리 받기

현재 페이지에는 필요 없지만, 사용자가 곧 방문할 가능성이 높은 리소스를 미리 다운로드합니다.

```html
<!-- 다음 글 페이지를 미리 받아두기 -->
<link rel="prefetch" href="/post/python-intermediate">

<!-- 다음 글의 이미지 미리 받기 -->
<link rel="prefetch" href="/images/python-next.jpg" as="image">
```

브라우저가 유휴 시간에 낮은 우선순위로 다운로드합니다.

---

## script 태그 최적화 — defer vs async

JavaScript 파일이 HTML 파싱을 차단하지 않도록 설정합니다.

```html
<!-- ❌ 기본: HTML 파싱 차단 -->
<script src="app.js"></script>

<!-- ✅ defer: HTML 파싱 완료 후 실행, 순서 보장 -->
<script src="app.js" defer></script>

<!-- ✅ async: 다운로드 완료 즉시 실행, 순서 미보장 -->
<script src="analytics.js" async></script>
```

| 방식 | 다운로드 | 실행 시점 | 순서 보장 | 적합한 용도 |
|------|---------|-----------|-----------|------------|
| 기본 | 차단 | 즉시 | O | 레거시 |
| `defer` | 비차단 | DOM 완성 후 | O | 일반 스크립트 |
| `async` | 비차단 | 다운로드 완료 즉시 | X | GA, 광고 등 독립적 스크립트 |

```html
<head>
  <!-- defer: DOM에 의존하는 스크립트 -->
  <script src="main.js" defer></script>

  <!-- async: DOM에 의존하지 않는 독립 스크립트 -->
  <script src="https://www.googletagmanager.com/gtag/js" async></script>
</head>
```

---

## CSS 로딩 최적화

```html
<!-- 중요 CSS: 차단 방식으로 로드 (레이아웃에 필요한 것) -->
<link rel="stylesheet" href="critical.css">

<!-- 비중요 CSS: 비차단 방식으로 로드 (프린트, 이후 보이는 스타일) -->
<link rel="preload" href="non-critical.css" as="style"
      onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="non-critical.css"></noscript>
```

---

## 리소스 힌트 우선순위 요약

| 힌트 | 용도 | 우선순위 |
|------|------|----------|
| `preload` | 현재 페이지에서 곧 필요한 리소스 | 높음 |
| `preconnect` | 외부 도메인 연결 미리 맺기 | 중간 |
| `dns-prefetch` | DNS 조회만 미리 | 낮음 |
| `prefetch` | 다음 페이지 리소스 미리 받기 | 매우 낮음 |

---

## 성능 최적화 체크리스트

**LCP 개선**
- [ ] 히어로 이미지에 `<link rel="preload">` 추가
- [ ] 히어로 이미지에 `fetchpriority="high"` 설정
- [ ] 스크롤 아래 이미지에 `loading="lazy"` 설정
- [ ] 이미지를 WebP/AVIF로 변환
- [ ] Google Fonts에 `preconnect` 추가

**CLS 개선**
- [ ] 모든 이미지에 `width`, `height` 속성 명시
- [ ] 웹 폰트에 `font-display: swap` 또는 `optional` 설정
- [ ] 광고·임베드 영역 크기 미리 지정

**일반 성능**
- [ ] 앱 스크립트에 `defer` 속성
- [ ] 분석 도구 스크립트에 `async` 속성
- [ ] 외부 도메인에 `preconnect` 설정
- [ ] 다음 페이지 리소스에 `prefetch` 설정

---

## 정리

- `preload`: 현재 페이지에서 곧 필요한 리소스를 높은 우선순위로 미리 요청
- `preconnect`: 외부 도메인 연결 수립을 미리 진행
- `prefetch`: 다음 페이지의 리소스를 유휴 시간에 미리 다운로드
- `defer`: HTML 파싱이 끝난 후 스크립트 실행 (순서 보장)
- `async`: 스크립트 다운로드 완료 즉시 실행 (순서 미보장)
- 이미지에 `width`/`height` 명시로 CLS 방지

이로써 HTML5 중급 과정 15편이 완료됩니다. 다음 고급 과정에서는 Web Components, PWA, Service Worker, WebSocket, Web Workers, WebRTC 등을 다룹니다.