---
layout: post
title: "HTML 폼 태그 기초 — form, input, button, label 사용법"
description: "HTML form 태그의 action, method 속성과 input, button, label 태그의 기본 사용법을 정리합니다. for와 id로 label을 input에 연결하는 법, GET과 POST 차이, 폼 전송 흐름을 설명합니다."
date: 2015-01-09 09:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 9
tags: [html, form, input, button, label, 폼, 회원가입]
lang: ko
---

회원가입, 로그인, 검색, 댓글 작성 등 사용자가 데이터를 입력하는 모든 곳에 폼이 있습니다. HTML 폼의 기본 구조와 각 태그의 역할을 정리합니다.

---

## form 태그 — 폼의 컨테이너

모든 입력 요소를 감싸는 컨테이너입니다.

```html
<form action="/submit" method="POST">
  <!-- 입력 요소들 -->
</form>
```

**action 속성** — 폼 데이터를 전송할 서버 주소입니다. 생략하면 현재 페이지 URL로 전송됩니다.

**method 속성** — 데이터 전송 방식입니다.

| 값 | 특징 | 사용 상황 |
|----|------|----------|
| `GET` | URL에 데이터가 노출됨, 북마크 가능 | 검색, 필터링 |
| `POST` | URL에 데이터가 노출되지 않음 | 로그인, 회원가입, 파일 업로드 |

```html
<!-- 검색 폼: GET 방식 (URL에 검색어가 보임) -->
<form action="/search" method="GET">
  <input type="text" name="q" placeholder="검색어 입력">
  <button type="submit">검색</button>
</form>

<!-- 로그인 폼: POST 방식 (URL에 비밀번호가 노출되지 않음) -->
<form action="/login" method="POST">
  <input type="email" name="email">
  <input type="password" name="password">
  <button type="submit">로그인</button>
</form>
```

---

## input 태그 — 입력 필드

사용자가 데이터를 입력하는 필드입니다. 빈 태그입니다.

```html
<input type="text" name="username" placeholder="아이디를 입력하세요">
```

**자주 쓰는 속성들**

| 속성 | 설명 |
|------|------|
| `type` | 입력 타입 (다음 글에서 자세히) |
| `name` | 서버에 전달되는 키 이름 |
| `id` | label과 연결, JavaScript에서 사용 |
| `placeholder` | 입력 전 안내 문구 |
| `value` | 기본 입력값 |
| `required` | 필수 입력 설정 |
| `disabled` | 비활성화 |
| `readonly` | 읽기 전용 |
| `maxlength` | 최대 입력 글자 수 |

---

## label 태그 — 입력 필드 설명

input에 설명 텍스트를 붙이는 태그입니다. 단순히 텍스트를 나란히 쓰는 것과 다릅니다.

```html
<!-- 잘못된 방법: label과 input이 연결되지 않음 -->
이름: <input type="text" name="name">

<!-- 올바른 방법 1: for와 id로 연결 -->
<label for="username">아이디</label>
<input type="text" id="username" name="username">

<!-- 올바른 방법 2: label 안에 input을 감싸기 -->
<label>
  아이디
  <input type="text" name="username">
</label>
```

label과 input을 연결하면 두 가지 장점이 있습니다.

1. label 텍스트를 클릭해도 input이 포커스됩니다 (클릭 영역이 넓어져 UX 향상)
2. 스크린 리더가 어떤 필드인지 읽어줍니다 (접근성 향상)

---

## button 태그

클릭 가능한 버튼입니다.

```html
<!-- 폼 제출 버튼 (기본값) -->
<button type="submit">제출하기</button>

<!-- 폼 초기화 버튼 -->
<button type="reset">초기화</button>

<!-- 일반 버튼 (JavaScript로 동작 설정) -->
<button type="button" onclick="doSomething()">클릭</button>
```

`type` 속성을 반드시 지정하세요. 생략하면 기본값이 `submit`이 되어서, form 안에 있는 버튼을 클릭했을 때 의도치 않게 폼이 제출될 수 있습니다.

---

## input vs button

같은 역할처럼 보이는 `<input type="submit">`과 `<button type="submit">`의 차이를 알아야 합니다.

```html
<!-- input: 텍스트만 가능 -->
<input type="submit" value="제출하기">

<!-- button: 아이콘, HTML 삽입 가능 -->
<button type="submit">
  <img src="icon.svg" alt=""> 제출하기
</button>
```

실무에서는 `<button>` 태그를 훨씬 많이 씁니다.

---

## 실습: 회원가입 폼 만들기

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>회원가입</title>
</head>
<body>
  <h1>회원가입</h1>

  <form action="/register" method="POST">

    <div>
      <label for="name">이름</label>
      <input type="text" id="name" name="name" placeholder="홍길동" required>
    </div>

    <div>
      <label for="email">이메일</label>
      <input type="email" id="email" name="email" placeholder="example@email.com" required>
    </div>

    <div>
      <label for="password">비밀번호</label>
      <input type="password" id="password" name="password" minlength="8" required>
    </div>

    <div>
      <label for="password-confirm">비밀번호 확인</label>
      <input type="password" id="password-confirm" name="password_confirm" required>
    </div>

    <div>
      <button type="submit">가입하기</button>
      <button type="reset">다시 입력</button>
    </div>

  </form>
</body>
</html>
```

---

## 정리

- `form`의 `action`은 전송 주소, `method`는 GET 또는 POST
- `input`의 `name` 속성이 서버에 전달되는 키 이름입니다
- `label`의 `for`와 `input`의 `id`를 연결해야 접근성과 UX가 향상됩니다
- `button`의 `type`은 반드시 명시합니다 (`submit`, `reset`, `button`)

다음 글에서는 input의 다양한 type 속성을 총정리합니다.