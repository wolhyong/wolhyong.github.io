---
layout: post
title: "Web Storage API 완전 정리 — localStorage, sessionStorage 차이와 활용 패턴"
description: "localStorage와 sessionStorage의 차이, 기본 CRUD 메서드, JSON 직렬화, 용량 초과(QuotaExceededError) 처리, storage 이벤트로 탭 간 동기화, 만료 시간 구현 패턴까지 정리합니다. 쿠키와 Web Storage의 차이도 비교합니다."
date: 2015-03-07 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 37
tags: [html5, localStorage, sessionStorage, WebStorage, 브라우저저장소, 탭동기화]
lang: ko
---

사용자 설정(다크 모드, 언어), 로그인 상태, 최근 읽은 글 목록처럼 서버 없이 브라우저에 데이터를 저장해야 할 때 Web Storage API를 사용합니다.

---

## localStorage vs sessionStorage vs Cookie

| 항목 | localStorage | sessionStorage | Cookie |
|------|-------------|----------------|--------|
| 생명주기 | 명시적 삭제 전까지 영구 | 탭/창 닫으면 삭제 | 만료일 설정 가능 |
| 용량 | ~5~10MB | ~5MB | ~4KB |
| 서버 전송 | 안 됨 | 안 됨 | 모든 요청에 자동 전송 |
| 탭 간 공유 | 같은 출처 모든 탭 | 현재 탭만 | 같은 출처 공유 |
| 접근 방법 | JavaScript | JavaScript | JavaScript + HTTP 헤더 |

---

## 기본 CRUD

```javascript
// ── 저장 ─────────────────────────────────────────
localStorage.setItem('theme', 'dark');
localStorage.setItem('language', 'ko');

// ── 읽기 ─────────────────────────────────────────
const theme = localStorage.getItem('theme');    // 'dark'
const missing = localStorage.getItem('없는키'); // null

// ── 삭제 ─────────────────────────────────────────
localStorage.removeItem('theme');

// ── 전체 삭제 ─────────────────────────────────────
localStorage.clear();

// ── 전체 순회 ─────────────────────────────────────
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, localStorage.getItem(key));
}
```

---

## JSON 객체 저장

localStorage는 문자열만 저장할 수 있습니다. 객체는 JSON으로 직렬화합니다.

```javascript
// 저장
const settings = {
  theme: 'dark',
  fontSize: 16,
  sidebarOpen: true,
  lastVisit: new Date().toISOString()
};
localStorage.setItem('settings', JSON.stringify(settings));

// 읽기
const raw = localStorage.getItem('settings');
const savedSettings = raw ? JSON.parse(raw) : null;

// 안전한 파싱 헬퍼
function getJSON(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    console.error(`localStorage 파싱 오류 (키: ${key})`);
    return fallback;
  }
}

const settings2 = getJSON('settings', { theme: 'light' });
```

---

## 용량 초과 오류 처리

```javascript
function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (e instanceof DOMException && (
      e.code === 22 ||                         // Firefox
      e.code === 1014 ||                       // Firefox
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn('localStorage 용량 초과. 오래된 데이터 정리 필요');
      // 오래된 데이터 삭제 로직
      clearOldData();
      return false;
    }
    throw e;
  }
}
```

---

## 만료 시간 구현

localStorage에는 기본 만료 기능이 없습니다. 메타데이터로 직접 구현합니다.

```javascript
const storage = {
  set(key, value, ttlMs = null) {
    const item = {
      value,
      expires: ttlMs ? Date.now() + ttlMs : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const item = JSON.parse(raw);

      // 만료 확인
      if (item.expires && Date.now() > item.expires) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch {
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};

// 사용
storage.set('auth_token', 'abc123', 60 * 60 * 1000); // 1시간 후 만료
storage.set('user_prefs', { theme: 'dark' });          // 영구 저장

const token = storage.get('auth_token'); // 만료되면 null 반환
```

---

## storage 이벤트 — 탭 간 동기화

같은 출처의 다른 탭에서 localStorage가 변경될 때 이벤트가 발생합니다.

```javascript
// 모든 탭에서 테마 변경을 동기화
window.addEventListener('storage', (event) => {
  if (event.key === 'theme') {
    console.log('다른 탭에서 테마 변경:', event.oldValue, '->', event.newValue);
    applyTheme(event.newValue);
  }

  if (event.key === null) {
    // localStorage.clear() 호출됨
    console.log('전체 데이터 삭제됨');
  }
});
```

**주의**: `storage` 이벤트는 변경을 일으킨 탭에서는 발생하지 않습니다. 다른 탭에서만 발생합니다.

---

## sessionStorage — 탭 격리

탭이 닫히면 자동 삭제됩니다. 단계별 폼처럼 세션 내에서만 유지할 데이터에 씁니다.

```javascript
// 회원가입 멀티 스텝 폼 — 단계별 데이터 임시 저장
function saveStep(step, data) {
  const formData = JSON.parse(sessionStorage.getItem('signup') || '{}');
  formData[`step${step}`] = data;
  sessionStorage.setItem('signup', JSON.stringify(formData));
}

function getSignupData() {
  return JSON.parse(sessionStorage.getItem('signup') || '{}');
}

// 1단계: 기본 정보
saveStep(1, { name: '홍길동', email: 'hong@email.com' });

// 2단계: 추가 정보
saveStep(2, { career: '3', interests: ['Python', 'React'] });

// 최종 제출
const allData = getSignupData();
```

---

## 실용 패턴 모음

**다크 모드 설정 저장**

```javascript
const themeKey = 'preferred-theme';

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(themeKey, next);
}

// 페이지 로드 시 복원 (깜빡임 방지: <head>에 인라인 스크립트로)
const savedTheme = localStorage.getItem(themeKey) ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
```

**최근 읽은 글 목록**

```javascript
function addRecentPost(post) {
  const key = 'recent-posts';
  const recent = JSON.parse(localStorage.getItem(key) || '[]');

  // 중복 제거 후 맨 앞에 추가
  const updated = [post, ...recent.filter(p => p.slug !== post.slug)].slice(0, 5);
  localStorage.setItem(key, JSON.stringify(updated));
}

function getRecentPosts() {
  return JSON.parse(localStorage.getItem('recent-posts') || '[]');
}
```

---

## 정리

- `localStorage` — 탭을 닫아도 유지, 같은 출처 모든 탭 공유
- `sessionStorage` — 탭 닫으면 삭제, 현재 탭만 접근 가능
- 객체는 `JSON.stringify` / `JSON.parse`로 직렬화합니다
- `storage` 이벤트로 다른 탭의 변경을 감지해 동기화합니다
- 만료 기능이 필요하면 `expires` 메타데이터를 직접 구현합니다

다음 글에서는 IndexedDB — 브라우저 내 구조적 데이터 저장을 다룹니다.