---
layout: post
title: "HTML 프로젝트 폴더 구조 설계 — 규모 있는 사이트의 파일 관리"
description: "페이지가 3개일 때와 30개일 때 폴더 구조는 어떻게 달라져야 할까요? HTML, CSS, 이미지, JavaScript 파일을 역할별로 나누는 기준과 실무에서 자주 쓰는 디렉토리 구조 예시를 설명했습니다."
date: 2015-05-25 12:00:00 +0900
category: html
level: intermediate
tags: [html, 폴더구조, 프로젝트설계, 파일관리, 디렉토리구조]
lang: ko
---

파일이 몇 개 안 될 때는 전부 같은 폴더에 넣어도 상관없습니다. 그런데 페이지가 10개, 20개로 늘어나면 파일을 찾는 시간이 점점 길어집니다. 처음부터 폴더를 나누는 기준을 정해두면 나중에 관리가 훨씬 편해집니다.

---

## 파일이 많아지면 생기는 문제

```
📁 프로젝트
  index.html
  about.html
  blog.html
  post1.html
  post2.html
  post3.html
  style.css
  main.js
  logo.png
  photo1.jpg
  photo2.jpg
  photo3.jpg
```

파일이 12개라서 아직 볼만합니다. 그런데 이 상태에서 페이지가 30개, 이미지가 100개가 되면 원하는 파일을 찾기 위해 스크롤을 계속 내려야 합니다. 브라우저 개발자 도구에서 이미지 경로를 쓸 때도 어떤 폴더에 있는지 알기 어렵습니다.

---

## 기본 폴더 구조

```
📁 project-root/
├── index.html              # 메인 페이지
├── pages/                  # 서브 페이지
│   ├── about.html
│   ├── blog.html
│   └── contact.html
├── assets/                 # 정적 리소스
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       ├── logo.svg
│       └── hero-bg.jpg
└── README.md
```

이 구조의 핵심은 두 가지입니다.

1. **페이지는 `pages/` 폴더에 모은다** — 루트에는 `index.html`만 둡니다
2. **리소스는 `assets/` 아래에 타입별로 나눈다** — css, js, images를 구분

`assets/` 폴더 안에 타입별로 나누는 이유는 브라우저가 CSS와 JS를 로드할 때 경로가 명확해지기 때문입니다. `assets/css/style.css`는 "CSS 파일"이라는 게 경로만 봐도 알 수 있습니다.

---

## 페이지가 많을 때 구조

블로그처럼 페이지 수가 많아지면 카테고리별로 폴더를 나눕니다.

```
📁 project-root/
├── index.html
├── pages/
│   ├── about.html
│   ├── blog/
│   │   ├── index.html          # /blog/ 주소
│   │   ├── html-basics.html
│   │   └── css-flexbox.html
│   ├── tags/
│   │   └── index.html
│   └── categories/
│       ├── html.html
│       └── css.html
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       ├── logo.svg
│       ├── posts/              # 게시물별 이미지
│       │   ├── html-basics-thumb.jpg
│       │   └── css-flexbox-thumb.jpg
│       └── common/             # 공통 이미지
│           ├── icon-search.svg
│           └── bg-footer.png
└── _posts/                     # 마크다운 블로그 글
    └── ... (여기 블로그는 Jekyll 방식)
```

이 구조에서 알 수 있는 점:

- `blog/` 폴더 안에 각 게시물 HTML을 넣으면 주소가 `pages/blog/html-basics.html`처럼 정리됩니다
- 이미지도 `posts/`와 `common/`으로 용도별로 나누면 "이 이미지는 어디에 쓰는 거지?"라는 혼란이 줄어듭니다
- 블로그 플랫폼(Jekyll, Hugo 등)을 쓰면 `_posts/` 같은 별도 폴더에 글을 보관하는 게 일반적입니다

---

## 상대 경로 vs 절대 경로

```
📁 project/
├── index.html
└── pages/
    ├── about.html
    └── blog.html
📁 assets/
    └── css/
        └── style.css
```

각 페이지에서 CSS를 불러올 때 경로가 달라집니다.

```html
<!-- index.html (루트) -->
<link rel="stylesheet" href="assets/css/style.css">

<!-- pages/about.html (pages 폴더 안) -->
<link rel="stylesheet" href="../assets/css/style.css">
```

`../`는 "한 단계 위 폴더"를 뜻합니다. `pages/about.html`에서 `assets/`로 가려면 `pages/` 밖으로 나가야 하므로 `../`가 필요합니다.

이런 차이를 피하려면 서버 설정이나 빌드 도구를 써서 절대 경로로 처리하는 방법도 있습니다.

```html
<!-- 절대 경로 (루트 기준, /로 시작) -->
<link rel="stylesheet" href="/assets/css/style.css">
```

절대 경로는 HTML 파일이 어디에 있든 항상 같은 경로로 접근할 수 있습니다. 단, 로컬에서 파일을 직접 열면(`file://` 프로토콜) 절대 경로가 동작하지 않을 수 있습니다. 로컬에서는 상대 경로를 쓰고 배포 시 절대 경로로 바꾸는 방식이 실무에서 자주 쓰입니다.

---

## 이미지 경로 정리

```
📁 assets/images/
├── logo.svg
├── common/
│   ├── icon-search.svg
│   └── icon-menu.svg
└── posts/
    ├── 2024/
    │   ├── html-basics-thumb.jpg
    │   └── css-flexbox-thumb.jpg
    └── default-thumb.jpg
```

이미지도 연도별로 정리하면 파일이 수백 개가 되어도 관리가 됩니다. 블로그를 오래 운영할수록 이미지 파일이 계속 쌓이기 때문에 폴더로 구분하지 않으면 나중에 필요 없는 이미지를 지우기도 어렵습니다.

```html
<img src="assets/images/posts/2024/html-basics-thumb.jpg" alt="HTML 기초 썸네일">
```

---

## 폴더 구조를 정할 때 기준 세 가지

**1. 자주 바뀌는 것과 안 바뀌는 것을 분리한다**

CSS, JS, 이미지 같은 정적 파일은 한곳에 모으고, HTML 페이지는 따로 둡니다. 이러면 사이트 디자인을 바꿀 때 `assets/css/`만 수정하면 됩니다.

**2. 검색하기 쉬운 이름을 쓴다**

`img/`보다 `images/`, `styles/`보다 `css/`가 더 직관적입니다. 다른 개발자가 봐도 바로 이해할 수 있는 이름이 좋습니다.

**3. 2단계를 넘기지 않는다**

`assets/css/components/buttons/`는 너무 깊습니다. `assets/css/`에 모아두고 파일명으로 구분하는 게 더 낫습니다.

```
❌ assets/css/components/buttons/primary/style.css
✅ assets/css/button-primary.css
```

---

## 실제로 폴더 구조를 만들어서 비교해보면

직접 `project-flat/` 폴더와 `project-structured/` 폴더를 각각 만들고 파일을 20개 정도 넣어보세요. `project-flat/`에서는 원하는 파일을 찾기 위해 매번 스크롤을 내려야 하지만, `project-structured/`에서는 `assets/images/` 폴더만 열면 이미지만 모여 있어서 바로 찾을 수 있습니다. 파일이 50개를 넘어가면 이 차이가 생산성에 직접 영향을 줍니다.

---

## 마치며
- 루트에는 `index.html`만 두고 페이지는 `pages/` 폴더에 모은다
- 정적 리소스는 `assets/css/`, `assets/js/`, `assets/images/`로 타입별 구분
- 이미지가 많아지면 `posts/`, `common/` 등 용도별로 나눈다
- 상대 경로(`../`)와 절대 경로(`/`)의 차이를 이해하고 상황에 맞게 쓴다
- 폴더 깊이는 2단계를 넘기지 않고 직관적인 이름을 쓴다

다음 글에서는 HTML5 멀티미디어 태그 — video, audio, source 사용법을 다룹니다.
