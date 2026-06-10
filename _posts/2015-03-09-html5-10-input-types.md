---
layout: post
title: "HTML input type 종류와 사용법 — text, email, number, date, checkbox, radio"
description: "HTML input 태그 type에는 어떤 종류가 있나요? text, email, password, number, date, checkbox, radio, file, range, color 등 자주 쓰는 타입별 특징과 올바른 사용법을 예제와 함께 설명합니다."
date: 2015-03-09 00:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 10
tags: [html, input, type, checkbox, radio, date, file, html5]
lang: ko
---

HTML input 태그의 `type` 속성 하나가 달라지면 화면에 표시되는 입력 위젯 자체가 완전히 달라집니다. 예를 들어 `type="text"`는 빈칸이 하나 나오지만, `type="date"`는 달력 선택기가 나타나고, `type="range"`는 슬라이더 막대가 표시됩니다.

HTML5에서 새로운 type들이 많이 추가됐습니다. 이걸 잘 활용하면 JavaScript로 따로 UI를 만들거나 유효성 검사 코드를 작성할 필요가 줄어듭니다. 실제로 각 type을 브라우저에서 열어보면 어떻게 표시되는지 직접 눈으로 확인하는 게 가장 효율적으로 익히는 방법입니다.

하나씩 코드를 실행해보면서 입력 화면을 확인해보겠습니다.

---

## 텍스트 계열

**text** — 기본 텍스트 입력

```html
<input type="text" name="username" placeholder="아이디">
```

**email** — 이메일 형식 자동 검증

```html
<input type="email" name="email" placeholder="example@email.com">
```

모바일에서 이 input을 열면 자동으로 이메일 전용 키보드(화면에 @ 키가 보임)가 나타납니다. 그리고 값을 입력하지 않고 제출하면 브라우저가 "이메일 주소 형식이 아닙니다"라는 메시지를 띄우면서 제출을 막습니다. 이 모든 게 JavaScript 한 줄 없이 순수 HTML 속성만으로 동작합니다.

**password** — 입력 내용 숨김

```html
<input type="password" name="pw" minlength="8">
```

**search** — 검색 전용 (지우기 버튼 자동 추가)

```html
<input type="search" name="q" placeholder="검색어를 입력하세요">
```

**tel** — 전화번호 (모바일에서 숫자 키보드)

```html
<input type="tel" name="phone" placeholder="010-0000-0000">
```

**url** — URL 형식 자동 검증

```html
<input type="url" name="website" placeholder="https://example.com">
```

---

## 숫자와 범위

**number** — 숫자 입력 (화살표 버튼 자동 추가)

```html
<input type="number" name="quantity" min="1" max="100" step="1" value="1">
```

**range** — 슬라이더

```html
<label for="volume">볼륨: <output id="volume-output">50</output></label>
<input type="range" id="volume" name="volume" min="0" max="100" value="50">
```

---

## 날짜와 시간

HTML5에서 추가된 type들로, 브라우저가 날짜 선택기(datepicker)를 제공합니다.

```html
<!-- 날짜 -->
<input type="date" name="birthdate" min="1900-01-01" max="2024-12-31">

<!-- 월 -->
<input type="month" name="expire_month">

<!-- 주 -->
<input type="week" name="delivery_week">

<!-- 시간 -->
<input type="time" name="meeting_time">

<!-- 날짜+시간 -->
<input type="datetime-local" name="appointment">
```

---

## 선택

**checkbox** — 다중 선택

```html
<fieldset>
  <legend>관심 기술 (복수 선택 가능)</legend>
  <label><input type="checkbox" name="tech" value="html"> HTML</label>
  <label><input type="checkbox" name="tech" value="css"> CSS</label>
  <label><input type="checkbox" name="tech" value="js"> JavaScript</label>
  <label><input type="checkbox" name="tech" value="react" checked> React</label>
</fieldset>
```

`checked` 속성으로 기본 선택 상태를 지정합니다. 같은 `name`으로 여러 항목을 선택할 수 있습니다.

**radio** — 단일 선택

```html
<fieldset>
  <legend>경험 수준</legend>
  <label><input type="radio" name="level" value="beginner"> 입문</label>
  <label><input type="radio" name="level" value="intermediate"> 중급</label>
  <label><input type="radio" name="level" value="advanced"> 고급</label>
</fieldset>
```

같은 `name`을 가진 radio 중 하나만 선택됩니다.

---

## 파일

**file** — 파일 업로드

```html
<!-- 모든 파일 -->
<input type="file" name="attachment">

<!-- 이미지 파일만 -->
<input type="file" name="photo" accept="image/*">

<!-- 특정 확장자만 -->
<input type="file" name="doc" accept=".pdf,.docx">

<!-- 여러 파일 선택 -->
<input type="file" name="photos" multiple>
```

---

## 기타

**color** — 색상 선택기

```html
<input type="color" name="theme_color" value="#58a6ff">
```

**hidden** — 사용자에게 보이지 않는 값 전달

```html
<input type="hidden" name="csrf_token" value="abc123xyz">
<input type="hidden" name="post_id" value="42">
```

CSRF 토큰, 게시물 ID처럼 서버에 전달해야 하지만 사용자에게 보이지 않아야 하는 값에 씁니다.

---

## 실습: 여러 입력 타입이 있는 프로필 설정 폼

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>프로필 설정</title>
</head>
<body>
  <h1>프로필 설정</h1>

  <form action="/profile" method="POST">

    <div>
      <label for="nickname">닉네임</label>
      <input type="text" id="nickname" name="nickname" maxlength="20" required>
    </div>

    <div>
      <label for="email">이메일</label>
      <input type="email" id="email" name="email" required>
    </div>

    <div>
      <label for="birthdate">생년월일</label>
      <input type="date" id="birthdate" name="birthdate">
    </div>

    <div>
      <label for="website">웹사이트</label>
      <input type="url" id="website" name="website" placeholder="https://">
    </div>

    <fieldset>
      <legend>관심 언어 (복수 선택)</legend>
      <label><input type="checkbox" name="lang" value="python"> Python</label>
      <label><input type="checkbox" name="lang" value="javascript"> JavaScript</label>
      <label><input type="checkbox" name="lang" value="go"> Go</label>
    </fieldset>

    <fieldset>
      <legend>개발 경력</legend>
      <label><input type="radio" name="career" value="0"> 입문 (1년 미만)</label>
      <label><input type="radio" name="career" value="1"> 주니어 (1~3년)</label>
      <label><input type="radio" name="career" value="3"> 시니어 (3년 이상)</label>
    </fieldset>

    <div>
      <label for="avatar">프로필 사진</label>
      <input type="file" id="avatar" name="avatar" accept="image/*">
    </div>

    <div>
      <label for="theme">테마 색상</label>
      <input type="color" id="theme" name="theme_color" value="#58a6ff">
    </div>

    <button type="submit">저장하기</button>
  </form>
</body>
</html>
```

---

## 마치며
| type | 용도 |
|------|------|
| `text` | 일반 텍스트 |
| `email` | 이메일 (자동 검증) |
| `password` | 비밀번호 (숨김) |
| `number` | 숫자 |
| `date` | 날짜 선택기 |
| `checkbox` | 다중 선택 |
| `radio` | 단일 선택 |
| `file` | 파일 업로드 |
| `hidden` | 숨겨진 값 전달 |
| `color` | 색상 선택기 |

다음 글에서는 div와 span 태그의 차이와 레이아웃에서의 역할을 다룹니다.


## 실전 예제로 이해하기

HTML의 input type 종류와 사용법 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 input type 종류와 사용법을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>input type 종류와 사용법 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>input type 종류와 사용법에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 input type 종류와 사용법을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. input type 종류와 사용법 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 input type 종류와 사용법을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
