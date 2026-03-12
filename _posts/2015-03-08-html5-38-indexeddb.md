---
layout: post
title: "IndexedDB 완전 정리 — 브라우저에서 대용량 구조적 데이터 저장하기"
description: "IndexedDB로 브라우저에 구조적 데이터를 저장하는 방법을 정리합니다. 데이터베이스 열기, Object Store 생성, 트랜잭션 CRUD, 인덱스로 쿼리, 커서로 전체 순회, idb 라이브러리로 Promise화하는 방법까지 실전 예제와 함께 설명합니다."
date: 2015-03-08 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 38
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

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

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

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

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

## 실전 패턴: 오프라인 게시물 캐싱

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

## 정리

- IndexedDB는 브라우저에서 대용량 구조적 데이터를 저장하는 NoSQL DB입니다
- `objectStore`는 SQL의 테이블, `index`는 특정 필드로 빠른 검색을 가능하게 합니다
- 모든 작업은 `transaction` 안에서 이루어집니다
- `idb` 라이브러리로 Promise 기반으로 작성하면 코드가 훨씬 간결해집니다

다음 글에서는 Geolocation API — 사용자 위치 가져오기를 다룹니다.