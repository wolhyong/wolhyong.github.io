---
layout: post
title: "Intersection Observer — 스크롤 애니메이션, 지연 로딩, 무한 스크롤"
description: "Intersection Observer로 스크롤 애니메이션을 구현하는 방법은? threshold·rootMargin 옵션, 스크롤 등장 애니메이션, 이미지 지연 로딩 직접 구현, 무한 스크롤, 광고 노출 측정 패턴까지 예제와 함께 다룹니다."
date: 2015-11-16 00:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 46
tags: [html5, IntersectionObserver, 스크롤애니메이션, 지연로딩, 무한스크롤, 뷰포트감지]
lang: ko
---

요소가 화면에 들어오는 시점을 감지하려면 이전에는 `scroll` 이벤트 + `getBoundingClientRect()`를 써야 했습니다. 스크롤마다 레이아웃 계산이 발생해 성능이 나빴습니다. Intersection Observer는 이 문제를 비동기로 해결합니다.

---

## 기본 사용법

```javascript
// Observer 생성
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    console.log(entry.target);          // 관찰 중인 요소
    console.log(entry.isIntersecting);  // 뷰포트 안에 있는지 (true/false)
    console.log(entry.intersectionRatio); // 얼마나 보이는지 (0 ~ 1)
    console.log(entry.boundingClientRect); // 요소의 위치와 크기
  });
}, {
  root: null,          // null = 뷰포트 기준
  rootMargin: '0px',   // 관찰 영역 확장/축소
  threshold: 0.1       // 10% 보일 때 콜백 실행
});

// 관찰 시작
observer.observe(document.getElementById('target'));

// 관찰 중지
observer.unobserve(document.getElementById('target'));

// 모든 관찰 중지
observer.disconnect();
```

---

## threshold — 콜백 실행 기준

```javascript
// threshold 예시
{ threshold: 0 }      // 1px라도 보이면 실행 (기본값)
{ threshold: 0.5 }    // 50% 이상 보일 때 실행
{ threshold: 1.0 }    // 완전히 다 보일 때 실행
{ threshold: [0, 0.25, 0.5, 0.75, 1.0] } // 각 비율마다 실행
```

---

## rootMargin — 관찰 영역 조정

```javascript
// 뷰포트보다 200px 아래를 기준으로 감지 (스크롤 전 미리 로드)
{ rootMargin: '0px 0px 200px 0px' } // top right bottom left

// 뷰포트보다 100px 위로 확장 (헤더 높이 보정)
{ rootMargin: '-100px 0px 0px 0px' }
```

`rootMargin`은 CSS `margin`처럼 `top right bottom left` 순서입니다.

---

## 스크롤 등장 애니메이션

```html
<style>
  .fade-in {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style>

<article class="fade-in">
  <h2>게시물 제목</h2>
  <p>내용...</p>
</article>
```

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // 한 번만 실행
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px' // 뷰포트 아래 50px 전에 미리 트리거
});

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
```

---

## 지연 로딩 직접 구현

`loading="lazy"` 속성이 있지만, 더 세밀하게 제어하고 싶을 때 직접 구현합니다.

```html
<!-- data-src에 실제 URL, src는 플레이스홀더 -->
<img
  class="lazy"
  data-src="/images/post-thumb.jpg"
  data-srcset="/images/post-thumb-400.jpg 400w, /images/post-thumb-800.jpg 800w"
  src="/images/placeholder.svg"
  alt="게시물 썸네일"
  width="400"
  height="250">
```

```javascript
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const img = entry.target;
    img.src = img.dataset.src;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.classList.remove('lazy');
    lazyObserver.unobserve(img);
  });
}, {
  rootMargin: '0px 0px 300px 0px' // 300px 전에 미리 로드
});

document.querySelectorAll('img.lazy').forEach(img => lazyObserver.observe(img));
```

---

## 무한 스크롤

목록 맨 아래에 센티널(sentinel) 요소를 두고 감지합니다.

```html
<div id="post-list">
  <!-- 게시물 카드들 -->
</div>
<div id="sentinel" aria-label="추가 콘텐츠 로딩 중"></div>
<div id="loading" hidden>
  <p>불러오는 중...</p>
</div>
```

```javascript
let page = 1;
let isLoading = false;
let hasMore = true;

const sentinel = document.getElementById('sentinel');
const loadingEl = document.getElementById('loading');
const postList = document.getElementById('post-list');

const infiniteScrollObserver = new IntersectionObserver(async (entries) => {
  const entry = entries[0];
  if (!entry.isIntersecting || isLoading || !hasMore) return;

  isLoading = true;
  loadingEl.hidden = false;

  try {
    const posts = await fetchPosts(page);

    if (posts.length === 0) {
      hasMore = false;
      infiniteScrollObserver.unobserve(sentinel);
      sentinel.textContent = '모든 글을 불러왔습니다.';
      return;
    }

    posts.forEach(post => {
      postList.appendChild(createPostCard(post));
    });
    page++;
  } catch (err) {
    console.error('로딩 실패:', err);
  } finally {
    isLoading = false;
    loadingEl.hidden = true;
  }
}, {
  rootMargin: '0px 0px 200px 0px'
});

infiniteScrollObserver.observe(sentinel);

async function fetchPosts(page) {
  const res = await fetch(`/api/posts?page=${page}&limit=10`);
  return res.json();
}
```

---

## 읽기 진행률 표시

```javascript
const article = document.querySelector('article');
const progressBar = document.getElementById('read-progress');

// 문서 전체를 여러 섹션으로 나눠 관찰
const sections = article.querySelectorAll('h2, h3');
let readSections = new Set();

const readObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      readSections.add(entry.target);
      const pct = Math.round((readSections.size / sections.length) * 100);
      progressBar.value = pct;
      progressBar.setAttribute('aria-valuenow', pct);
    }
  });
}, { threshold: 1.0 });

sections.forEach(section => readObserver.observe(section));
```

---

## 성능 비교

| 방법 | 메인 스레드 부하 | 정확도 |
|------|----------------|--------|
| `scroll` + `getBoundingClientRect()` | 높음 (매 스크롤 실행) | 높음 |
| `IntersectionObserver` | 낮음 (비동기, 백그라운드) | 충분함 |

IntersectionObserver는 브라우저가 최적 타이밍에 비동기로 콜백을 호출합니다. 스크롤 성능에 영향을 주지 않습니다.

---

## 핵심

- `IntersectionObserver`로 요소의 뷰포트 진입/이탈을 비동기로 감지합니다
- `threshold`로 얼마나 보일 때 콜백을 실행할지 설정합니다
- `rootMargin`으로 관찰 영역을 확장해 미리 로드를 구현합니다
- 한 번만 실행하면 되는 경우 `unobserve`로 관찰을 중지합니다
- 스크롤 애니메이션, 지연 로딩, 무한 스크롤, 읽기 진행률에 활용합니다

다음 글에서는 WebRTC 기초 — 브라우저 간 P2P 통신을 다룹니다.


## 실전 예제로 이해하기

HTML의 Intersection Observer 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 Intersection Observer을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Intersection Observer 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>Intersection Observer에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 Intersection Observer을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. Intersection Observer 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 Intersection Observer을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
