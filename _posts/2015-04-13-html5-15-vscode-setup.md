---
layout: post
title: "HTML 개발 환경 세팅 — VS Code 설치부터 플러그인까지"
description: "HTML 개발 환경은 어떻게 세팅하나요? VS Code 설치부터 HTML 개발에 최적화된 필수 플러그인과 유용한 단축키를 알아봅니다. Emmet 자동완성으로 HTML 코드를 작성하는 법, Live Server로 실시간 미리보기 설정법도 포함합니다."
date: 2015-04-13 00:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 15
tags: [html, vscode, 개발환경, emmet, live-server, 단축키]
lang: ko
---

지금까지 HTML 기초를 배웠습니다. 이제 효율적으로 코드를 작성할 수 있는 환경을 세팅합니다. VS Code와 주요 플러그인 설치부터 Emmet 자동완성까지 알아봅니다.

---

## VS Code 설치

VS Code(Visual Studio Code)는 마이크로소프트에서 만든 무료 코드 에디터입니다. 웹 개발에서 사실상 표준으로 사용됩니다.

**Windows / macOS / Linux 공통**

[code.visualstudio.com](https://code.visualstudio.com)에서 운영체제에 맞는 버전 다운로드 후 설치합니다.

**Linux (Debian/Ubuntu 기반)**

```bash
sudo apt update && sudo apt install code
```

---

## 필수 플러그인

VS Code 왼쪽 Extensions 아이콘(네모 4개) 클릭 후 검색해서 설치합니다.

**Prettier — Code Formatter**

코드를 자동으로 정돈해주는 포매터입니다. 들여쓰기, 따옴표 스타일을 일관되게 유지합니다.

설치 후 설정:
```json
// settings.json에 추가
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

**Korean Language Pack**

VS Code UI를 한국어로 변경합니다. 명령어 팔레트(Ctrl+Shift+P) → "Configure Display Language" → ko 선택.

**Auto Rename Tag**

여는 태그를 수정하면 닫는 태그가 자동으로 같이 바뀝니다.

```html
<!-- <h2>를 <h3>으로 바꾸면 </h2>도 자동으로 </h3>으로 변경 -->
<h2>제목</h2>  →  <h3>제목</h3>
```

**Indent Rainbow**

들여쓰기 깊이마다 다른 색상을 표시합니다. 중첩된 HTML 구조를 파악하기 쉬워집니다.

**Live Server**

파일을 저장할 때마다 브라우저가 자동으로 새로고침됩니다. HTML/CSS 작업 시 필수입니다.

---

## Live Server 사용법

1. 플러그인 설치 후 VS Code 하단 상태바에 **"Go Live"** 버튼이 생깁니다
2. HTML 파일이 열린 상태에서 "Go Live" 클릭
3. 브라우저에서 `http://127.0.0.1:5500` 으로 자동 열림
4. 파일을 저장하면 브라우저가 자동 새로고침

---

## Emmet — 빠른 HTML 작성

Emmet은 VS Code에 기본 내장된 HTML/CSS 자동완성 도구입니다.

**! + Tab — 기본 구조 자동 생성**

```
입력: !
Tab 키 누르면:
```

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

</body>
</html>
```

**태그 이름 + Tab**

```
p         →  <p></p>
h1        →  <h1></h1>
ul>li     →  <ul><li></li></ul>
ul>li*3   →  <ul><li></li><li></li><li></li></ul>
div.card  →  <div class="card"></div>
div#main  →  <div id="main"></div>
```

**자주 쓰는 Emmet 단축 문법**

```
nav>ul>li*4>a     →  nav 안에 ul, 그 안에 li 4개, 각각 a 태그
header+main+footer →  3개 태그를 형제로 생성
div.card>img+h2+p  →  div.card 안에 img, h2, p 생성
```

---

## 유용한 VS Code 단축키

| 단축키 | 기능 |
|--------|------|
| `Ctrl + /` | 주석 토글 |
| `Alt + ↑/↓` | 줄 이동 |
| `Alt + Shift + ↑/↓` | 줄 복사 |
| `Ctrl + D` | 같은 단어 순차 선택 |
| `Ctrl + Shift + P` | 명령어 팔레트 |
| `Ctrl + \`` | 터미널 열기/닫기 |
| `Ctrl + B` | 사이드바 토글 |
| `Ctrl + Z` | 실행 취소 |
| `Shift + Alt + F` | 문서 전체 포맷팅 |

---

## settings.json 추천 설정

`Ctrl+Shift+P` → "Open User Settings (JSON)" 선택 후 아래 내용 추가:

```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.formatOnSave": true,
  "editor.wordWrap": "on",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true
}
```

- `tabSize: 2` — HTML은 보통 2칸 들여쓰기
- `wordWrap: on` — 긴 줄이 화면 안에서 줄 바꿈
- `formatOnSave` — 저장 시 자동 포맷팅

한 번 직접 Emmet을 써보면 차이를 바로 느낄 수 있습니다. `!` + Tab으로 HTML 구조를 만들고, `ul>li*5>a`를 입력하고 Tab을 누른 뒤 어떤 결과가 나오는지 VS Code에서 직접 해보세요.

이전 글들(14개)에서 우리는 하나하나 손으로 태그를 입력했습니다. 하지만 이제 Emmet을 쓰면 `ul>li*3>a` 같은 짧은 입력으로 ul > li*3 > a 구조가 한 번에 만들어집니다. 직접 해보면 "이걸 왜 진작 안 썼을까" 싶을 겁니다.

---

## 직접 확인해보기

1. VS Code 설치 후 새 HTML 파일 만들기
2. 빈 파일에 `!` 입력 후 Tab 키 누르기 — 기본 HTML 구조가 자동 생성되는지 확인
3. `ul>li*5>a{Link $}` 입력 후 Tab — 5개 링크가 있는 목록이 만들어지는지 확인
4. `Ctrl+S`로 저장 후 Live Server로 Go Live 버튼 눌러서 브라우저에 실시간 반영되는지 확인

```
my-blog/
├── index.html
├── about.html
├── assets/
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       ├── logo.svg
│       └── posts/
│           └── thumbnail.jpg
└── _posts/
    └── 2024-01-01-first-post.md
```

---

## 초급 과정 마치며
지금까지 HTML5 초급 과정에서 배운 내용입니다.

1. HTML의 개념과 브라우저 동작 원리
2. HTML 기본 구조 (DOCTYPE, html, head, body)
3. 제목(h1~h6)과 문단(p) 태그
4. 텍스트 서식 태그 (strong, em, span, blockquote)
5. 링크 태그 (a, href, target)
6. 이미지 태그 (img, src, alt)
7. 목록 태그 (ul, ol, li, dl)
8. 테이블 태그 (table, tr, td, th)
9. 폼 기초 (form, input, button, label)
10. input type 한눈에 보기
11. div와 span, 블록/인라인 요소
12. 시맨틱 태그 (header, nav, main, article, section, footer)
13. 메타 태그와 SEO 기초
14. 주석과 특수문자
15. VS Code 개발 환경 세팅

다음 중급 과정에서는 시맨틱 HTML 심화, 폼 유효성 검사, 멀티미디어 태그, 접근성(a11y), Canvas, SVG 등을 다룹니다.