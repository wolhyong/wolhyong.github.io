---
layout: post
title: "HTML input type 총정리 — text, email, number, date, checkbox, radio 외"
description: "HTML5에서 추가된 input type 속성을 총정리합니다. text, email, password, number, date, checkbox, radio, file, range, color 등 각 타입의 특징과 올바른 사용법을 예제와 함께 설명합니다."
date: 2015-01-10 09:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 10
tags: [html, input, type, checkbox, radio, date, file, html5]
lang: ko
---

HTML input 태그의 `type` 속성 하나가 달라지면 완전히 다른 입력 위젯이 됩니다. HTML5에서 새로운 type들이 많이 추가됐고, 이를 활용하면 JavaScript 없이도 유효성 검사와 다양한 UI를 구현할 수 있습니다.

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

모바일에서 자동으로 이메일 전용 키보드가 나타납니다. `@`이 없으면 제출 시 오류를 표시합니다.

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

## 실습: 다양한 입력 타입이 있는 프로필 설정 폼

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

## 정리

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