---
layout: post
title: "Service Worker — 오프라인 캐싱, 네트워크 전략, 업데이트 처리"
description: "Service Worker로 오프라인 캐싱을 구현하는 방법은? Service Worker의 생명주기(install·activate·fetch), Cache API로 오프라인 캐싱 구현, Cache First·Network First·Stale-While-Revalidate 전략 비교, 업데이트 처리까지 다룹니다."
date: 2015-09-21 00:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 38
tags: [html5, ServiceWorker, PWA, 오프라인, 캐싱, Cache-API, Workbox, 네트워크전략]
lang: ko
---

Service Worker는 브라우저 탭과 독립적으로 백그라운드에서 실행되는 JavaScript 워커입니다. 네트워크 요청을 가로채서 캐싱하거나, 오프라인일 때 캐시에서 응답을 돌려주는 것이 핵심 기능입니다.

---

## Service Worker의 특징

- 메인 스레드와 분리된 별도 워커에서 실행 (DOM 접근 불가)
- HTTPS 또는 localhost에서만 동작
- 한 번 등록되면 탭이 닫혀도 살아있음
- 브라우저가 필요할 때 자동으로 종료하고 다시 시작
- 범위(scope) 내의 모든 네트워크 요청을 가로챌 수 있음

---

## 생명주기

```
등록 → Download → Install → Activate → Idle ↔ Fetch
```

1. **Register**: 메인 JavaScript에서 워커를 등록
2. **Install**: 정적 파일을 캐시에 저장 (캐시 구축)
3. **Activate**: 오래된 캐시 정리, 컨트롤 획득
4. **Fetch**: 네트워크 요청을 가로채서 처리

---

## Service Worker 등록

```javascript
// main.js (메인 스레드)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('SW 등록 성공:', reg.scope);

      // 업데이트 확인 (수동)
      reg.addEventListener('updatefound', () => {
        console.log('새 Service Worker 설치 중...');
      });
    } catch (err) {
      console.error('SW 등록 실패:', err);
    }
  });
}
```

---

## Service Worker 파일 작성 (sw.js)

```javascript
// sw.js
const CACHE_NAME = 'ghw-blog-v1';
const CACHE_VERSION = 1;

// 설치 시 미리 캐시할 파일 목록
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/offline.html',
  '/assets/images/logo.svg',
];

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Install');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 정적 파일 캐싱 중...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // 대기 없이 즉시 활성화
        return self.skipWaiting();
      })
  );
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');

  event.waitUntil(
    // 오래된 캐시 삭제
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] 오래된 캐시 삭제:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // 모든 탭에 즉시 컨트롤
      return self.clients.claim();
    })
  );
});
```

---

## Fetch 이벤트와 캐싱 전략

**Cache First — 캐시 우선**

캐시에 있으면 캐시에서, 없으면 네트워크에서 가져옵니다. CSS, JS, 폰트처럼 자주 바뀌지 않는 정적 파일에 적합합니다.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // 네트워크 응답을 캐시에도 저장
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      });
    }).catch(() => {
      // 오프라인 + 캐시 없음
      return caches.match('/offline.html');
    })
  );
});
```

**Network First — 네트워크 우선**

네트워크에서 먼저 가져오고, 실패하면 캐시를 사용합니다. 블로그 게시물처럼 최신성이 중요한 콘텐츠에 적합합니다.

```javascript
const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html');
  }
};
```

**Stale-While-Revalidate — 캐시 반환 후 백그라운드 갱신**

캐시를 즉시 반환해 빠른 응답을 보여주면서, 백그라운드에서 최신 버전을 가져와 캐시를 갱신합니다. 최신성과 속도를 동시에 챙길 수 있어 블로그 페이지에 가장 적합합니다.

```javascript
const staleWhileRevalidate = async (request) => {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then(response => {
    caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  });

  return cached || fetchPromise;
};
```

---

## 요청 유형별 전략 적용

```javascript
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 다른 출처 요청은 처리하지 않음
  if (url.origin !== location.origin) return;

  // 정적 자산: Cache First
  if (/\.(css|js|woff2?|png|jpg|svg|webp)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML 페이지: Stale-While-Revalidate
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // API 요청: Network First
  event.respondWith(networkFirst(request));
});
```

---

## 오프라인 페이지 만들기

```html
<!-- offline.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오프라인 — GHW Dev Blog</title>
  <style>
    body {
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0d1117;
      color: #c9d1d9;
      text-align: center;
      padding: 20px;
    }
    .icon { font-size: 4rem; margin-bottom: 20px; }
    h1 { color: #58a6ff; }
    button {
      margin-top: 20px;
      padding: 10px 24px;
      background: #238636;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="icon">📡</div>
  <h1>인터넷 연결을 확인하세요</h1>
  <p>오프라인 상태입니다. 인터넷에 연결되면 페이지가 표시됩니다.</p>
  <button onclick="location.reload()">다시 시도</button>
</body>
</html>
```

---

## Service Worker 업데이트 처리

새 버전의 sw.js가 배포됐을 때 사용자에게 알리고 새로고침을 유도합니다.

```javascript
// main.js
const reg = await navigator.serviceWorker.register('/sw.js');

reg.addEventListener('updatefound', () => {
  const newWorker = reg.installing;

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // 새 버전이 준비됨 → 사용자에게 알림
      showUpdateBanner();
    }
  });
});

function showUpdateBanner() {
  const banner = document.createElement('div');
  banner.innerHTML = `
    <p>새 버전이 있습니다.</p>
    <button id="update-btn">지금 업데이트</button>
  `;
  banner.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#161b22;padding:16px;border:1px solid #30363d;border-radius:8px;';
  document.body.appendChild(banner);

  document.getElementById('update-btn').addEventListener('click', () => {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    location.reload();
  });
}
```

```javascript
// sw.js
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

---

## Workbox — Service Worker 라이브러리

구글이 만든 Service Worker 헬퍼 라이브러리입니다. 위에서 직접 구현한 캐싱 전략을 한 줄로 처리할 수 있습니다.

```javascript
// sw.js (Workbox CDN 버전)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { precacheAndRoute } = workbox.precaching;

// 정적 파일 사전 캐싱
precacheAndRoute([
  { url: '/', revision: '1' },
  { url: '/offline.html', revision: '1' },
]);

// 이미지: Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images-v1' })
);

// HTML: Stale-While-Revalidate
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({ cacheName: 'pages-v1' })
);
```

---

## 핵심

- Service Worker는 install → activate → fetch 순서로 생명주기가 진행됩니다
- Cache First는 정적 자산, Network First는 API, Stale-While-Revalidate는 HTML 페이지에 적합합니다
- `skipWaiting()` + `clients.claim()`으로 새 워커가 즉시 컨트롤을 가져옵니다
- Workbox를 사용하면 복잡한 캐싱 로직을 더 간결하게 구현할 수 있습니다

다음 글에서는 WebSocket — 실시간 채팅 앱 구현을 다룹니다.


## 실전 예제로 이해하기

HTML의 Service Worker 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 Service Worker을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Worker 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>Service Worker에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 Service Worker을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. Service Worker 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 Service Worker을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
