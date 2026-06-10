---
layout: post
title: "HTML 폼 태그 기초 — form, input, button, label 사용법"
description: "HTML 폼(form)은 어떻게 동작하나요? form 태그의 action과 method 속성, input·button·label 태그의 기본 사용법을 배웁니다. label과 input 연결법, GET과 POST의 차이, 폼 전송 흐름을 설명합니다."
date: 2015-03-02 00:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 9
tags: [html, form, input, button, label, 폼, 회원가입]
lang: ko
---

회원가입, 로그인, 검색, 댓글 작성 등 사용자가 데이터를 입력하는 모든 곳에 폼이 있습니다. HTML 폼의 기본 구조와 각 태그의 역할을 알아봅니다.

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

## 핵심

- `form`의 `action`은 전송 주소, `method`는 GET 또는 POST
- `input`의 `name` 속성이 서버에 전달되는 키 이름입니다
- `label`의 `for`와 `input`의 `id`를 연결해야 접근성과 UX가 향상됩니다
- `button`의 `type`은 반드시 명시합니다 (`submit`, `reset`, `button`)

다음 글에서는 input의 여러 type 속성을 다룹니다.


## 실전 예제로 이해하기

HTML의 폼 태그 기초 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 폼 태그 기초을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>폼 태그 기초 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>폼 태그 기초에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 폼 태그 기초을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. 폼 태그 기초 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 폼 태그 기초을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
