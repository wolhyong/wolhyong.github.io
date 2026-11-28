---
layout: post
title: "HTML5 폼 유효성 검사 — required, pattern, min, max, step 속성"
description: "HTML5 폼 유효성 검사를 JavaScript 없이 구현하는 방법은? required, pattern, min, max, minlength, step, novalidate 속성과 :valid/:invalid CSS 활용을 예제로 설명합니다."
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

---

## 주의할 점

- 브라우저 검증은 사용자 편의를 위한 장치입니다. 개발자 도구로 속성을 지우면 그만이므로 서버에서 같은 규칙을 다시 검사합니다.
- `pattern`은 값 전체와 일치해야 합니다. 앞뒤에 `^`와 `$`를 자동으로 붙여 검사하므로 직접 넣을 필요는 없지만, 문법이 JavaScript `RegExp`와 조금 다릅니다.
- `:invalid`는 페이지가 열린 직후 빈 필수 입력에도 적용됩니다. 그래서 빨간 테두리가 처음부터 보이는 일이 생깁니다. 최신 브라우저에서는 `:user-invalid`를 쓰거나 `novalidate`를 두고 직접 검증합니다.
- `setCustomValidity("...")`로 넣은 메시지는 값을 고쳐도 자동으로 지워지지 않습니다. 검증 로직에서 `setCustomValidity("")`로 다시 비워야 합니다.
- `min`/`max`는 숫자와 날짜 타입에서만 동작합니다. `type="text"`에 붙이면 아무 효과가 없습니다.
- `step`을 지정하지 않으면 `type="number"`는 정수 단위로 검사합니다. 소수를 받으려면 `step="0.01"`처럼 명시합니다.
