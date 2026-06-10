---
layout: post
title: "Web Storage API — localStorage, sessionStorage 차이와 활용 패턴"
description: "localStorage와 sessionStorage의 차이는 무엇인가요? 기본 CRUD 메서드, JSON 직렬화, 용량 초과 처리, storage 이벤트로 탭 간 동기화, 만료 시간 구현 패턴, 쿠키와의 차이까지 설명합니다."
date: 2015-10-05 00:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 40
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

## 핵심

- `localStorage` — 탭을 닫아도 유지, 같은 출처 모든 탭 공유
- `sessionStorage` — 탭 닫으면 삭제, 현재 탭만 접근 가능
- 객체는 `JSON.stringify` / `JSON.parse`로 직렬화합니다
- `storage` 이벤트로 다른 탭의 변경을 감지해 동기화합니다
- 만료 기능이 필요하면 `expires` 메타데이터를 직접 구현합니다

다음 글에서는 IndexedDB — 브라우저 내 구조적 데이터 저장을 다룹니다.


## 실전 예제로 이해하기

HTML의 Web Storage API 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 Web Storage API을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Storage API 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>Web Storage API에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 Web Storage API을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. Web Storage API 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 Web Storage API을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
