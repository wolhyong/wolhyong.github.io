---
layout: post
title: "HTML 이미지 태그 완전 정리 — img, src, alt, 최적화까지"
description: "HTML img 태그의 src, alt, width, height 속성 사용법을 정리합니다. alt 텍스트를 잘 쓰는 법, 이미지 경로 설정, loading lazy 지연 로딩, 이미지 최적화 팁까지 다룹니다."
date: 2015-01-06 09:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 6
tags: [html, img태그, 이미지, alt, 이미지최적화, lazy-loading]
lang: ko
---

웹 페이지에서 이미지는 텍스트 다음으로 많이 사용되는 콘텐츠입니다. img 태그 하나에도 알아야 할 속성과 주의사항이 꽤 됩니다. 속성별로 정확히 정리합니다.

---

## 기본 사용법

```html
<img src="photo.jpg" alt="한강 공원에서 찍은 야경 사진">
```

img 태그는 닫는 태그가 없는 빈 태그(void element)입니다. `src`와 `alt`는 항상 함께 씁니다.

---

## src 속성 — 이미지 경로

**로컬 파일 (상대 경로)**

```html
<!-- 같은 폴더에 있는 이미지 -->
<img src="photo.jpg" alt="사진">

<!-- images 하위 폴더에 있는 이미지 -->
<img src="images/photo.jpg" alt="사진">

<!-- 상위 폴더에 있는 이미지 -->
<img src="../images/photo.jpg" alt="사진">
```

**외부 이미지 URL**

```html
<img src="https://example.com/images/banner.jpg" alt="배너 이미지">
```

외부 이미지는 해당 서버가 다운되면 안 보입니다. 중요한 이미지는 직접 호스팅하는 것이 좋습니다.

---

## alt 속성 — 대체 텍스트

이미지가 로드되지 않을 때 표시되는 텍스트입니다. 하지만 그보다 더 중요한 역할이 있습니다.

**접근성:** 스크린 리더가 alt 텍스트를 읽어줍니다. 시각 장애인 사용자가 이미지를 이해하는 유일한 방법입니다.

**SEO:** 검색 엔진은 이미지를 "볼" 수 없습니다. alt 텍스트로 이미지 내용을 파악합니다.

```html
<!-- 나쁜 alt 텍스트 -->
<img src="dog.jpg" alt="이미지">
<img src="dog.jpg" alt="사진">
<img src="dog.jpg" alt="dog.jpg">

<!-- 좋은 alt 텍스트 -->
<img src="dog.jpg" alt="공원에서 공을 물고 뛰어오는 골든 리트리버">
```

**장식용 이미지는 alt를 빈 문자열로**

의미 없이 장식 목적으로만 넣은 이미지는 alt를 빈 문자열로 설정합니다. 스크린 리더가 읽어넘깁니다.

```html
<img src="decorative-line.png" alt="">
```

alt 속성 자체를 빠뜨리면 스크린 리더가 파일명을 그대로 읽어버립니다. 빈 alt라도 반드시 작성해야 합니다.

---

## width, height 속성

이미지의 크기를 지정합니다.

```html
<img src="photo.jpg" alt="사진" width="800" height="600">
```

단위는 픽셀이며, `px`는 쓰지 않습니다.

width와 height를 명시하면 브라우저가 이미지 로딩 전에 공간을 미리 확보합니다. 이미지가 늦게 로드되면서 레이아웃이 흔들리는 현상(Layout Shift)을 방지할 수 있습니다. 성능 지표인 CLS(Cumulative Layout Shift)에 직접 영향을 줍니다.

CSS로 크기를 조절한다면 HTML 속성은 원본 비율 정보 제공 목적으로만 써도 됩니다.

---

## loading 속성 — 지연 로딩

페이지 로드 시 화면 밖에 있는 이미지는 나중에 불러오도록 하는 설정입니다. 초기 로딩 속도를 크게 개선할 수 있습니다.

```html
<!-- 페이지 로드 시 즉시 로드 (기본값, 중요한 이미지에 사용) -->
<img src="hero.jpg" alt="히어로 이미지" loading="eager">

<!-- 화면에 보일 때 로드 (스크롤 아래 이미지에 사용) -->
<img src="photo.jpg" alt="사진" loading="lazy">
```

첫 화면에 보이는 이미지(히어로 이미지, 로고 등)에는 `eager`를, 스크롤해야 보이는 이미지에는 `lazy`를 사용하면 좋습니다.

---

## 이미지 형식 선택 가이드

| 형식 | 특징 | 적합한 용도 |
|------|------|------------|
| JPEG | 손실 압축, 파일 작음 | 사진, 복잡한 이미지 |
| PNG | 무손실, 투명도 지원 | 로고, 아이콘, 스크린샷 |
| WebP | JPEG보다 30% 작음 | 사진 대체 (최신 권장) |
| SVG | 벡터, 무한 확대 가능 | 아이콘, 로고, 일러스트 |
| GIF | 애니메이션 지원 | 간단한 애니메이션 |

---

## 이미지를 figure로 감싸기

이미지와 설명을 함께 묶을 때 figure와 figcaption을 사용합니다.

```html
<figure>
  <img src="chart.png" alt="2024년 월별 방문자 수 막대 그래프">
  <figcaption>그림 1. 2024년 월별 방문자 수 (출처: Google Analytics)</figcaption>
</figure>
```

---

## 실습: 포트폴리오 이미지 갤러리

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>프로젝트 갤러리</title>
</head>
<body>
  <h1>개발 프로젝트 갤러리</h1>

  <figure>
    <img
      src="project1.jpg"
      alt="쇼핑몰 메인 페이지 — 반응형 디자인 적용, 다크 테마"
      width="800"
      height="450"
      loading="eager">
    <figcaption>프로젝트 1 — React 기반 쇼핑몰 (2024)</figcaption>
  </figure>

  <figure>
    <img
      src="project2.jpg"
      alt="대시보드 화면 — 차트와 통계 카드 구성"
      width="800"
      height="450"
      loading="lazy">
    <figcaption>프로젝트 2 — 관리자 대시보드 (2024)</figcaption>
  </figure>
</body>
</html>
```

---

## 정리

- `src` — 이미지 파일 경로 (로컬 상대경로 또는 외부 URL)
- `alt` — 대체 텍스트. 접근성과 SEO에 모두 중요, 항상 작성
- `width`, `height` — 레이아웃 이동 방지를 위해 명시 권장
- `loading="lazy"` — 스크롤 아래 이미지 지연 로딩으로 성능 향상
- 장식용 이미지는 `alt=""`로 설정

다음 글에서는 목록 태그 (ul, ol, li, dl)를 다룹니다.