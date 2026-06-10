---
layout: post
title: "HTML5 폼 유효성 검사 — required, pattern, min, max, step 속성"
description: "HTML5 폼 유효성 검사를 JavaScript 없이 구현하는 방법은? required, pattern, min, max, minlength, maxlength, step, novalidate 속성 사용법과 :valid/:invalid CSS 가상 클래스 활용법도 다룹니다."
date: 2015-05-11 00:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 19
tags: [html5, 폼유효성검사, required, pattern, 정규식, validation, CSS가상클래스]
lang: ko
---

회원가입 폼에서 이메일 형식이 맞는지, 비밀번호가 8자 이상인지 확인하는 기능을 JavaScript 없이 HTML 속성만으로 구현할 수 있습니다. HTML5 폼 유효성 검사 속성을 알아봅니다.

---

## required — 필수 입력

이 속성이 있으면 값이 비어있을 때 폼을 제출할 수 없습니다.

```html
<input type="text" name="name" required>
<input type="email" name="email" required>
<select name="category" required>
  <option value="">선택하세요</option>
  <option value="html">HTML</option>
</select>
<textarea name="comment" required></textarea>
```

브라우저가 자동으로 "이 입력란을 입력해 주세요." 같은 메시지를 표시합니다.

---

## minlength, maxlength — 글자 수 제한

```html
<!-- 비밀번호: 8자 이상 20자 이하 -->
<input type="password" name="pw" minlength="8" maxlength="20" required>

<!-- 닉네임: 2자 이상 10자 이하 -->
<input type="text" name="nickname" minlength="2" maxlength="10" required>

<!-- 댓글: 최소 10자 -->
<textarea name="comment" minlength="10" required></textarea>
```

`maxlength`는 입력 자체를 막고, `minlength`는 제출 시 검사합니다.

---

## min, max, step — 숫자/날짜 범위

```html
<!-- 나이: 0~120 -->
<input type="number" name="age" min="0" max="120">

<!-- 수량: 1~99, 1씩 증가 -->
<input type="number" name="qty" min="1" max="99" step="1" value="1">

<!-- 가격: 1000원 단위 -->
<input type="number" name="price" min="1000" max="1000000" step="1000">

<!-- 날짜 범위 -->
<input type="date" name="birthdate" min="1900-01-01" max="2024-12-31">

<!-- range 슬라이더: 0~100, 5 단위 -->
<input type="range" name="rating" min="0" max="100" step="5" value="50">
```

---

## pattern — 정규식으로 형식 검사

입력값이 지정한 정규식과 일치해야 폼을 제출할 수 있습니다.

```html
<!-- 영문·숫자만 허용, 3~16자 -->
<input
  type="text"
  name="username"
  pattern="[a-zA-Z0-9]{3,16}"
  title="영문자와 숫자만 사용 가능합니다. (3~16자)"
  required>

<!-- 한국 휴대폰 번호 형식 -->
<input
  type="tel"
  name="phone"
  pattern="010-[0-9]{4}-[0-9]{4}"
  placeholder="010-0000-0000"
  title="010-0000-0000 형식으로 입력하세요"
  required>

<!-- 비밀번호: 영문+숫자+특수문자 모두 포함, 8자 이상 -->
<input
  type="password"
  name="password"
  pattern="^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,}$"
  title="영문, 숫자, 특수문자(!@#$%)를 모두 포함한 8자 이상"
  required>

<!-- 영문 소문자만 허용 -->
<input
  type="text"
  name="slug"
  pattern="[a-z0-9-]+"
  title="영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다">
```

`title` 속성에 오류 시 보여줄 설명을 적어두면 사용자가 규칙을 알 수 있습니다.

**자주 쓰는 정규식 패턴**

| 패턴 | 설명 |
|------|------|
| `[a-zA-Z0-9]{4,12}` | 영문·숫자 4~12자 |
| `[가-힣]{2,6}` | 한글 2~6자 |
| `\d{6}` | 숫자 6자리 (우편번호) |
| `[a-z0-9-]+` | 영문 소문자·숫자·하이픈 |
| `https?://.+` | http 또는 https URL |

---

## :valid와 :invalid CSS 가상 클래스

유효성 상태에 따라 스타일을 바꿀 수 있습니다.

```css
/* 유효한 입력 */
input:valid {
  border-color: #3fb950;
  outline-color: #3fb950;
}

/* 유효하지 않은 입력 */
input:invalid {
  border-color: #f85149;
  outline-color: #f85149;
}

/* 필수 입력란 */
input:required {
  border-left: 3px solid #d29922;
}

/* 비활성화 */
input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

페이지 처음 로드 시에도 `:invalid` 스타일이 적용될 수 있어서 사용자가 아직 아무것도 입력하지 않았는데 빨간 테두리가 보이는 문제가 있습니다. `:user-invalid`나 JavaScript 클래스 조작으로 이를 개선합니다.

```css
/* 사용자가 입력한 후 유효하지 않은 경우만 스타일 적용 */
input:user-invalid {
  border-color: #f85149;
}
```

---

## novalidate — 유효성 검사 비활성화

개발 중이거나, JavaScript에서 직접 검사하고 싶을 때 form에 추가합니다.

```html
<form action="/submit" method="POST" novalidate>
  <!-- 브라우저 기본 유효성 검사가 비활성화됨 -->
  <input type="email" name="email" required>
  <button type="submit">제출</button>
</form>
```

---

## checkValidity() — JavaScript에서 유효성 검사

HTML 속성과 JavaScript를 함께 쓰면 더 세밀한 제어가 가능합니다.

```html
<form id="signup-form" novalidate>
  <input type="email" id="email" name="email" required>
  <p id="email-error" class="error-msg" hidden></p>
  <button type="submit">가입</button>
</form>

<script>
  document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const emailInput = document.getElementById('email');
    const errorMsg = document.getElementById('email-error');

    if (!emailInput.checkValidity()) {
      errorMsg.textContent = emailInput.validationMessage;
      errorMsg.hidden = false;
    } else {
      errorMsg.hidden = true;
      // 정상 제출 처리
    }
  });
</script>
```

---

## 실습: 회원가입 폼 완성 버전

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>회원가입</title>
  <style>
    input:user-invalid,
    textarea:user-invalid {
      border-color: #f85149;
    }
    input:valid,
    textarea:valid {
      border-color: #3fb950;
    }
    .hint { font-size: 0.85rem; color: #888; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>회원가입</h1>
  <form action="/register" method="POST">

    <fieldset>
      <legend>계정 정보</legend>

      <div>
        <label for="username">아이디 *</label>
        <input
          type="text"
          id="username"
          name="username"
          pattern="[a-zA-Z0-9]{4,16}"
          title="영문자와 숫자만 사용 가능합니다."
          minlength="4"
          maxlength="16"
          required>
        <p class="hint">영문, 숫자만 사용 가능 (4~16자)</p>
      </div>

      <div>
        <label for="email">이메일 *</label>
        <input type="email" id="email" name="email" required>
      </div>

      <div>
        <label for="password">비밀번호 *</label>
        <input
          type="password"
          id="password"
          name="password"
          minlength="8"
          maxlength="32"
          required>
        <p class="hint">8자 이상</p>
      </div>
    </fieldset>

    <fieldset>
      <legend>추가 정보</legend>

      <div>
        <label for="birthdate">생년월일</label>
        <input type="date" id="birthdate" name="birthdate"
               min="1900-01-01" max="2024-12-31">
      </div>

      <div>
        <label for="github">GitHub 아이디</label>
        <input
          type="text"
          id="github"
          name="github"
          pattern="[a-zA-Z0-9-]+"
          title="GitHub 아이디 형식으로 입력하세요">
      </div>
    </fieldset>

    <button type="submit">가입하기</button>
  </form>
</body>
</html>
```

## 실제로 이 패턴들이 동작하는 흐름

브라우저는 폼을 제출할 때마다 유효성 검사를 자동으로 실행합니다. 예를 들어 `required`가 붙은 input이 비어 있으면, 브라우저가 "이 입력란을 입력해 주세요."라는 메시지를 띄우면서 제출을 막습니다. 이 모든 과정이 JavaScript 없이 HTML 속성만으로 동작한다는 점이 필요합니다.

사용자 입장에서는 입력란 옆에 빨간/초록 테두리가 생기면 '아, 이 칸을 잘못 입력했구나' 하고 바로 알 수 있습니다. `:valid`와 `:invalid` CSS 스타일을 적용해두면 사용자 경험이 훨씬 좋아집니다.

---

## 요약

| 속성 | 대상 | 역할 |
|------|------|------|
| `required` | 모든 입력 | 필수 입력 지정 |
| `minlength` / `maxlength` | text, textarea | 글자 수 제한 |
| `min` / `max` | number, date, range | 값 범위 제한 |
| `step` | number, range, date | 증가 단위 |
| `pattern` | text, tel, url 등 | 정규식 형식 검사 |
| `novalidate` | form | 브라우저 검사 비활성화 |

다음 글에서는 HTML5 멀티미디어 태그 — video, audio, source, track을 다룹니다.


## 실전 예제로 이해하기

HTML의 HTML5 폼 유효성 검사 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 HTML5 폼 유효성 검사을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML5 폼 유효성 검사 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>HTML5 폼 유효성 검사에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 HTML5 폼 유효성 검사을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. HTML5 폼 유효성 검사 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 HTML5 폼 유효성 검사을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
