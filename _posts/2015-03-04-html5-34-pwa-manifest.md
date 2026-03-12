---
layout: post
title: "PWA 시작하기 — Web App Manifest로 앱처럼 설치되는 블로그 만들기"
description: "Progressive Web App(PWA)의 개념과 Web App Manifest 파일 작성법을 정리합니다. name, icons, display, start_url, theme_color 설정, 다양한 플랫폼 아이콘 준비, 설치 프롬프트(beforeinstallprompt) 제어, 설치 여부 감지까지 실전 예제와 함께 설명합니다."
date: 2015-03-04 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 34
tags: [html5, PWA, manifest, 설치가능, 오프라인, ServiceWorker, 앱아이콘]
lang: ko
---

PWA(Progressive Web App)는 웹 기술로 만들면서 네이티브 앱처럼 동작하는 웹 애플리케이션입니다. 홈 화면에 아이콘 추가, 오프라인 동작, 푸시 알림 등을 지원합니다. 첫 번째 단계인 Web App Manifest를 다룹니다.

---

## PWA의 세 가지 핵심

| 기술 | 역할 |
|------|------|
| **Web App Manifest** | 앱 이름, 아이콘, 설치 설정 |
| **Service Worker** | 오프라인 캐싱, 백그라운드 동기화 |
| **HTTPS** | 보안 컨텍스트 (Service Worker 필수 요건) |

GitHub Pages는 기본으로 HTTPS를 제공하므로 별도 설정이 필요 없습니다.

---

## manifest.json 파일 작성

프로젝트 루트에 `manifest.json`을 만듭니다.

```json
{
  "name": "GHW Dev Blog",
  "short_name": "GHW Blog",
  "description": "프로그래밍 튜토리얼과 개발 팁을 공유하는 기술 블로그",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0d1117",
  "theme_color": "#161b22",
  "lang": "ko",
  "dir": "ltr",
  "categories": ["education", "technology"],
  "icons": [
    {
      "src": "/assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/assets/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/assets/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "최신 글",
      "url": "/blog",
      "description": "최근 게시된 글 목록",
      "icons": [{ "src": "/assets/icons/shortcut-blog.png", "sizes": "96x96" }]
    },
    {
      "name": "태그 검색",
      "url": "/tags",
      "description": "태그별 글 검색",
      "icons": [{ "src": "/assets/icons/shortcut-tags.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    {
      "src": "/assets/screenshots/desktop.jpg",
      "sizes": "1280x720",
      "type": "image/jpeg",
      "form_factor": "wide",
      "label": "데스크탑 메인 화면"
    },
    {
      "src": "/assets/screenshots/mobile.jpg",
      "sizes": "390x844",
      "type": "image/jpeg",
      "form_factor": "narrow",
      "label": "모바일 메인 화면"
    }
  ]
}
```

---

## 주요 속성 설명

**display — 표시 모드**

| 값 | 설명 |
|----|------|
| `standalone` | 브라우저 UI 없음, 앱처럼 보임 (권장) |
| `fullscreen` | 상태 표시줄도 없는 전체 화면 |
| `minimal-ui` | 최소한의 브라우저 UI (뒤로/앞으로) |
| `browser` | 일반 브라우저 탭 |

**start_url**

앱 실행 시 열리는 URL입니다. 분석을 위해 UTM 파라미터를 붙이기도 합니다.

```json
"start_url": "/?source=pwa"
```

**icons purpose**

- `any` — 일반 아이콘
- `maskable` — Android의 Adaptive Icon에 맞게 안전 영역 안에 들어오는 아이콘

maskable 아이콘을 만들 때는 아이콘 디자인이 전체 크기의 80% 원 안에 들어와야 합니다. [maskable.app](https://maskable.app)에서 확인할 수 있습니다.

---

## HTML에 manifest 연결

```html
<head>
  <!-- manifest 연결 -->
  <link rel="manifest" href="/manifest.json">

  <!-- iOS 홈 화면 추가 지원 (Safari는 manifest의 일부만 지원) -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="GHW Blog">
  <link rel="apple-touch-icon" href="/assets/icons/icon-192x192.png">

  <!-- 테마 색상 (주소창 색상) -->
  <meta name="theme-color" content="#161b22"
        media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#ffffff"
        media="(prefers-color-scheme: light)">
</head>
```

---

## 설치 프롬프트 제어

브라우저가 자동으로 표시하는 설치 배너 대신 직접 제어할 수 있습니다.

```javascript
let deferredPrompt; // 설치 이벤트 저장

window.addEventListener('beforeinstallprompt', (e) => {
  // 브라우저 기본 프롬프트를 막고
  e.preventDefault();
  deferredPrompt = e;

  // 직접 만든 설치 버튼 표시
  document.getElementById('install-btn').hidden = false;
});

document.getElementById('install-btn').addEventListener('click', async () => {
  if (!deferredPrompt) return;

  // 설치 프롬프트 표시
  deferredPrompt.prompt();

  // 사용자 응답 기다리기
  const { outcome } = await deferredPrompt.userChoice;
  console.log(outcome === 'accepted' ? '설치 완료' : '설치 거절');

  deferredPrompt = null;
  document.getElementById('install-btn').hidden = true;
});

// 이미 설치된 경우
window.addEventListener('appinstalled', () => {
  console.log('PWA 설치 완료');
  document.getElementById('install-btn').hidden = true;
});
```

```html
<button id="install-btn" hidden>
  앱으로 설치하기
</button>
```

---

## 설치 여부 감지

```javascript
// 독립 실행 모드로 열렸는지 확인
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone  // iOS Safari
  || document.referrer.includes('android-app://');

if (isStandalone) {
  console.log('PWA 모드로 실행 중');
  // 앱 전용 UI 표시
}
```

---

## Jekyll 블로그에 manifest 적용

`_config.yml`에 baseurl이 있다면 start_url을 수정합니다.

```yaml
# _config.yml
url: "https://wolhyong.github.io"
baseurl: ""
```

```json
{
  "start_url": "/",
  "scope": "/"
}
```

`_layouts/default.html`에 manifest link 태그를 추가합니다.

```html
{% raw %}<link rel="manifest" href="{{ '/manifest.json' | relative_url }}">{% endraw %}
```

---

## PWA 체크리스트 (Lighthouse 기준)

- [ ] `manifest.json` 파일 존재
- [ ] 192x192 및 512x512 아이콘 있음
- [ ] `name` 또는 `short_name` 설정
- [ ] `start_url` 설정
- [ ] `display` 설정 (standalone 권장)
- [ ] HTTPS 서빙
- [ ] Service Worker 등록 (다음 글에서 다룸)
- [ ] `<meta name="viewport">` 설정
- [ ] `theme-color` 설정

Chrome DevTools → Lighthouse 탭에서 PWA 점수를 확인할 수 있습니다.

---

## 정리

- `manifest.json`으로 앱 이름, 아이콘, 테마 색상, 시작 URL을 설정합니다
- `display: standalone`으로 브라우저 UI 없는 앱처럼 보이게 합니다
- `purpose: maskable` 아이콘을 추가하면 Android 적응형 아이콘을 지원합니다
- `beforeinstallprompt` 이벤트로 설치 타이밍을 직접 제어할 수 있습니다

다음 글에서는 Service Worker — 오프라인 캐싱과 백그라운드 동기화를 다룹니다.