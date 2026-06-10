---
layout: post
title: "자바스크립트 웹 스토리지 - localStorage, sessionStorage, IndexedDB"
description: "브라우저 스토리지인 localStorage, sessionStorage, IndexedDB의 특징과 사용법을 비교하며 실전 활용법을 학습합니다."
date: 2016-10-10 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, storage, front-end, 웹]
---

클라이언트 측 데이터 저장은 사용자 설정 유지, 오프라인 지원, 캐싱 등에 필수적입니다. 브라우저가 제공하는 스토리지 기능을 비교하며 학습합니다.

## localStorage

탭/브라우저를 닫아도 데이터가 영구적으로 유지됩니다.

```javascript
// 저장 (문자열만 저장 가능)
localStorage.setItem("theme", "dark");
localStorage.setItem("user", JSON.stringify({ name: "홍길동" }));

// 읽기
const theme = localStorage.getItem("theme");         // "dark"
const user = JSON.parse(localStorage.getItem("user")); // { name: "홍길동" }

// 삭제
localStorage.removeItem("theme");
localStorage.clear(); // 전체 삭제
```

## sessionStorage

현재 탭이 닫힐 때까지 데이터가 유지됩니다.

```javascript
// API는 localStorage와 동일
sessionStorage.setItem("token", "abc123");
sessionStorage.getItem("token");
```

## localStorage vs sessionStorage

| 특징 | localStorage | sessionStorage |
|------|-------------|----------------|
| 수명 | 영구 | 탭 종료 시 삭제 |
| 범위 | 동일 오리진 전체 | 동일 탭 + 동일 오리진 |
| 용량 | 약 5~10MB | 약 5MB |
| 용도 | 사용자 설정, 캐시 | 로그인 세션, 임시 데이터 |

## 실전 활용 — 다크 모드 토글

```javascript
function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}
```

## IndexedDB — 대용량 구조화 데이터

```javascript
const request = indexedDB.open("MyDB", 1);

request.onupgradeneeded = (e) => {
  const db = e.target.result;
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
};

request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction("posts", "readwrite");
  const store = tx.objectStore("posts");
  store.add({ id: 1, title: "첫 글", content: "내용" });
};
```

IndexedDB는 비동기 API이며, 복잡하지만 대용량 데이터와 오프라인 지원에 적합합니다.

## 마무리

- **localStorage**는 사용자 설정, 캐시에 적합합니다
- **sessionStorage**는 일시적인 탭 단위 데이터에 적합합니다
- 구조화된 대용량 데이터는 **IndexedDB**를 고려하세요
- 민감한 데이터(토큰, 비밀번호)는 스토리지에 저장하지 마세요

다음 수업에서는 ES6+ 주요 기능을 정리합니다!
