---
layout: post
title: "HTML 기본 구조 이해하기 — DOCTYPE, html, head, body가 하는 일"
description: "HTML 파일 구조는 어떻게 생겼나요? HTML 파일을 만들 때 반드시 알아야 할 기본 뼈대를 설명합니다. DOCTYPE 선언부터 html, head, body 각 태그의 역할, charset과 viewport 설정까지 순서대로 알아봅니다."
date: 2015-01-12 00:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 2
tags: [html, html5, 기본구조, DOCTYPE, head, body]
lang: ko
---

HTML 파일을 처음 만들면 늘 같은 틀로 시작합니다. 이 틀이 왜 필요한지, 각 줄이 무슨 역할을 하는지 모르고 복사해서 쓰는 경우가 많습니다. 구조를 하나씩 분해해서 설명합니다.

---

## HTML 기본 뼈대 전체 코드

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="페이지 설명을 여기에 입력합니다.">
  <title>페이지 제목</title>
</head>
<body>
  <!-- 화면에 보이는 내용은 여기에 -->
  <h1>안녕하세요</h1>
  <p>본문 내용입니다.</p>
</body>
</html>
```

이 구조가 모든 HTML 파일의 시작점입니다. 위에서부터 하나씩 설명합니다.

---

## 1. `<!DOCTYPE html>`

문서의 첫 줄에 씁니다. "이 파일은 HTML5로 작성됐다"는 선언입니다.

HTML 이전 버전들은 DOCTYPE 선언이 훨씬 복잡했습니다.

```html
<!-- HTML4 시절 DOCTYPE (복잡하고 외우기 어려웠음) -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
"http://www.w3.org/TR/html4/loose.dtd">

<!-- HTML5 DOCTYPE (단순함) -->
<!DOCTYPE html>
```

DOCTYPE을 빠뜨리면 브라우저가 "쿽스 모드(Quirks Mode)"로 동작해서 오래된 규칙을 적용합니다. 레이아웃이 의도와 다르게 렌더링되는 원인이 됩니다. 반드시 첫 줄에 써야 합니다.

---

## 2. `<html lang="ko">`

전체 HTML 문서를 감싸는 최상위 태그입니다.

`lang` 속성은 페이지의 언어를 지정합니다. 한국어 페이지는 `ko`, 영어는 `en`, 일본어는 `ja`입니다.

이 속성이 필요한 이유가 세 가지 있습니다.

- 스크린 리더(시각 장애인 보조 기기)가 올바른 발음으로 읽어줍니다
- 브라우저 자동 번역 기능이 원본 언어를 정확히 감지합니다
- 검색 엔진이 어느 나라 사용자에게 보여줄지 판단합니다

---

## 3. `<head>`

브라우저에게 필요한 정보를 담는 영역입니다. **화면에는 보이지 않습니다.**

head 안에 들어가는 것들을 요약하면 아래와 같습니다.

```html
<head>
  <!-- 문자 인코딩 -->
  <meta charset="UTF-8">

  <!-- 반응형 화면 설정 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- 검색엔진에 표시되는 페이지 설명 -->
  <meta name="description" content="160자 이내로 페이지 내용 요약">

  <!-- 브라우저 탭에 표시되는 제목 -->
  <title>페이지 제목 — 사이트명</title>

  <!-- CSS 파일 연결 -->
  <link rel="stylesheet" href="style.css">

  <!-- JavaScript 파일 연결 (head 보다 body 끝에 넣는 경우가 많음) -->
  <script src="app.js"></script>
</head>
```

### `<meta charset="UTF-8">`

문자 인코딩을 UTF-8로 설정합니다. 이 설정이 없으면 한글이 깨져서 보입니다. 반드시 head의 가장 앞에 와야 합니다.

### `<meta name="viewport" ...>`

모바일 화면 대응을 위한 설정입니다. 이 설정이 없으면 모바일 브라우저가 페이지를 PC 화면 크기로 축소해서 보여줍니다.

`width=device-width`는 화면 너비를 기기 너비에 맞추라는 뜻이고, `initial-scale=1.0`은 초기 배율을 1배로 설정하라는 뜻입니다.

### `<title>`

브라우저 탭에 표시되는 제목입니다. 검색 결과에도 그대로 노출되기 때문에 SEO에서 매우 필요합니다. 주요 키워드를 앞에 배치하고 30자 이내로 작성하는 것이 좋습니다.

---

## 4. `<body>`

실제 화면에 보이는 모든 내용을 담는 영역입니다. 텍스트, 이미지, 버튼, 표 등 사용자가 보는 모든 것이 body 안에 들어갑니다.

```html
<body>
  <header>
    <nav>메뉴</nav>
  </header>

  <main>
    <h1>메인 제목</h1>
    <p>본문 내용</p>
  </main>

  <footer>
    <p>저작권 정보</p>
  </footer>
</body>
```

---

## head와 body 구분이 헷갈릴 때

간단한 기준이 있습니다.

- 화면에 보이는 내용 → `<body>`
- 화면에는 안 보이지만 브라우저나 검색엔진에 필요한 정보 → `<head>`

파비콘(탭 아이콘), 구글 폰트 연결, 애널리틱스 코드 같은 것들은 전부 head에 들어갑니다.

---

## 실습: 기본 구조 완성하기

아래 코드를 `index.html`로 저장하고 브라우저에서 열어봅니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="HTML 기본 구조를 학습하는 예제 페이지입니다.">
  <title>HTML 기본 구조 실습</title>
</head>
<body>
  <h1>HTML 기본 구조를 배웠습니다</h1>
  <p>이 페이지는 올바른 HTML 구조를 갖추고 있습니다.</p>
  <p>개발자 도구(F12)를 열어서 Elements 탭을 확인해보세요.</p>
</body>
</html>
```

F12를 눌러 개발자 도구를 열고 Elements 탭을 보면 방금 작성한 구조가 그대로 보입니다.

---

## 요약

- `<!DOCTYPE html>` — HTML5 문서 선언, 항상 첫 줄에 작성
- `<html lang="ko">` — 문서 전체를 감싸는 태그, 언어 속성 필수
- `<head>` — 화면에 보이지 않는 설정 정보 (charset, viewport, title 등)
- `<body>` — 화면에 보이는 모든 콘텐츠

다음 글에서는 body 안에서 가장 많이 쓰는 제목 태그(`h1`~`h6`)와 문단 태그(`p`)를 다룹니다.