---
layout: post
title: "IndexedDB 사용법 — 브라우저에서 대용량 구조적 데이터 저장하기"
description: "IndexedDB로 브라우저에 대용량 데이터를 저장하는 방법은? 데이터베이스 열기, Object Store 생성, 트랜잭션 CRUD, 인덱스로 쿼리, 커서로 전체 순회, idb 라이브러리로 Promise화하는 방법까지 예제와 함께 다룹니다."
date: 2015-10-12 00:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 41
tags: [html5, IndexedDB, 브라우저DB, 트랜잭션, ObjectStore, idb, 오프라인저장]
lang: ko
---

localStorage는 문자열만 저장하고 용량이 ~5MB로 제한됩니다. 수백 개의 게시물, 이미지 blob, 복잡한 객체를 오프라인에서 저장하고 쿼리해야 한다면 IndexedDB를 사용합니다.

---

## IndexedDB 특징

- **대용량**: 수백 MB ~ GB 수준 (브라우저/기기에 따라 다름)
- **비동기**: UI 스레드를 차단하지 않음
- **구조적 데이터**: 자바스크립트 객체, Blob, ArrayBuffer 저장 가능
- **트랜잭션**: ACID 특성 보장
- **인덱스**: 특정 필드로 빠른 검색 가능

---

## 기본 구조

```
Database (ghw-blog-db)
  └── Object Store (posts)        ← SQL의 테이블
        ├── 레코드 { id: 1, ... }
        ├── 레코드 { id: 2, ... }
        └── Index (by-category)   ← 특정 필드로 빠른 검색
```

---

## 데이터베이스 열기와 스키마 정의

```javascript
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ghw-blog-db', 1); // (이름, 버전)

    // 처음 열거나 버전이 올라갈 때 실행
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // posts Object Store 생성
      if (!db.objectStoreNames.contains('posts')) {
        const postsStore = db.createObjectStore('posts', {
          keyPath: 'slug'  // 기본 키 필드
        });

        // 인덱스 생성 (검색에 사용)
        postsStore.createIndex('by-category', 'category', { unique: false });
        postsStore.createIndex('by-date', 'date', { unique: false });
        postsStore.createIndex('by-level', 'level', { unique: false });
      }

      // settings Object Store 생성 (자동 증가 키)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}
```

---

## CRUD 구현

```javascript
// ── 추가/수정 (put은 upsert) ─────────────────────────
async function savePost(db, post) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('posts', 'readwrite');
    const store = tx.objectStore('posts');
    const request = store.put(post);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── 단일 조회 ────────────────────────────────────────
async function getPost(db, slug) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('posts', 'readonly');
    const store = tx.objectStore('posts');
    const request = store.get(slug);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

// ── 전체 조회 ────────────────────────────────────────
async function getAllPosts(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('posts', 'readonly');
    const store = tx.objectStore('posts');
    const request = store.getAll();


// ── 삭제 ─────────────────────────────────────────────
async function deletePost(db, slug) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('posts', 'readwrite');
    const store = tx.objectStore('posts');
    const request = store.delete(slug);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
```

---

## 인덱스로 쿼리

```javascript
// 카테고리가 'python'인 게시물 전체 조회
async function getPostsByCategory(db, category) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('posts', 'readonly');
    const store = tx.objectStore('posts');
    const index = store.index('by-category');
    const request = index.getAll(category);


// 날짜 범위 쿼리 (IDBKeyRange)
async function getPostsByDateRange(db, from, to) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('posts', 'readonly');
    const index = tx.objectStore('posts').index('by-date');
    const range = IDBKeyRange.bound(from, to, false, false);
    const request = index.getAll(range);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

---

## idb 라이브러리로 단순화

원시 IndexedDB API는 콜백 기반으로 작성하기 번거롭습니다. `idb` 라이브러리를 사용하면 Promise 기반으로 깔끔하게 작성할 수 있습니다.

```html
<script type="module">
import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/build/index.js';

const db = await openDB('ghw-blog-db', 1, {
  upgrade(db) {
    const store = db.createObjectStore('posts', { keyPath: 'slug' });
    store.createIndex('by-category', 'category');
    store.createIndex('by-date', 'date');
  }
});

// 저장
await db.put('posts', {
  slug: 'python-basics',
  title: 'Python 기초 문법',
  category: 'Python',
  level: 'beginner',
  date: '2024-01-15',
  content: '...'
});

// 조회
const post = await db.get('posts', 'python-basics');

// 인덱스로 쿼리
const pythonPosts = await db.getAllFromIndex('posts', 'by-category', 'Python');

// 삭제
await db.delete('posts', 'python-basics');

// 전체 삭제
await db.clear('posts');
</script>
```

---

## 활용 패턴: 오프라인 게시물 캐싱

```javascript
import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/build/index.js';

const db = await openDB('blog-cache', 1, {
  upgrade(db) {
    db.createObjectStore('posts', { keyPath: 'slug' });
  }
});

async function fetchPostWithCache(slug) {
  // 1. 캐시에서 먼저 확인
  const cached = await db.get('posts', slug);
  if (cached) {
    console.log('캐시에서 반환:', slug);
    // 백그라운드에서 최신 버전 갱신
    refreshCache(slug);
    return cached;
  }

  // 2. 네트워크에서 가져오기
  return fetchFromNetwork(slug);
}

async function fetchFromNetwork(slug) {
  const response = await fetch(`/api/posts/${slug}`);
  if (!response.ok) throw new Error('네트워크 오류');
  const post = await response.json();

  // 캐시에 저장
  await db.put('posts', { ...post, cachedAt: Date.now() });
  return post;
}

async function refreshCache(slug) {
  try {
    await fetchFromNetwork(slug);
  } catch {
    // 갱신 실패해도 캐시 버전 계속 사용
  }
}
```

---

## 요약

- IndexedDB는 브라우저에서 대용량 구조적 데이터를 저장하는 NoSQL DB입니다
- `objectStore`는 SQL의 테이블, `index`는 특정 필드로 빠른 검색을 가능하게 합니다
- 모든 작업은 `transaction` 안에서 이루어집니다
- `idb` 라이브러리로 Promise 기반으로 작성하면 코드가 훨씬 간결해집니다

다음 글에서는 Geolocation API — 사용자 위치 가져오기를 다룹니다.


## 실전 예제로 이해하기

HTML의 IndexedDB 사용법 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 IndexedDB 사용법을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IndexedDB 사용법 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>IndexedDB 사용법에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 IndexedDB 사용법을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. IndexedDB 사용법 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 IndexedDB 사용법을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
