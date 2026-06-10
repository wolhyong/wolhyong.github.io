---
layout: post
title: "HTML 폼 태그 심화 — select, textarea, fieldset, datalist 사용법"
description: "HTML 폼에서 select, textarea, datalist는 어떻게 사용하나요? select 드롭다운, textarea 여러 줄 입력, fieldset으로 폼 그룹화, datalist로 자동완성 목록 만드는 방법을 설명합니다. 접근성 개선법도 포함합니다."
date: 2015-05-04 00:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 18
tags: [html, select, textarea, fieldset, datalist, optgroup, 폼심화]
lang: ko
---

기초 폼 태그에서 input, button, label을 다뤘습니다. 실제 서비스에서는 드롭다운 선택, 여러 줄 입력, 자동완성 목록 같은 더 여러 폼 요소가 필요합니다. 자주 쓰는 폼 태그를 자세히 다룹니다.

---

## select — 드롭다운 선택

클릭하면 선택 목록이 펼쳐지는 드롭다운 메뉴입니다.

```html
<label for="language">주력 언어</label>
<select id="language" name="language">
  <option value="">-- 선택하세요 --</option>
  <option value="python">Python</option>
  <option value="javascript">JavaScript</option>
  <option value="java">Java</option>
  <option value="go">Go</option>
</select>
```

첫 번째 option의 value를 빈 문자열로 설정하면 선택하지 않은 상태를 나타냅니다.

**selected 속성으로 기본 선택값 지정**

```html
<select name="country">
  <option value="kr" selected>대한민국</option>
  <option value="us">미국</option>
  <option value="jp">일본</option>
</select>
```

---

## optgroup — 옵션 그룹화

항목이 많을 때 카테고리로 묶어줍니다.

```html
<label for="tech-stack">기술 스택</label>
<select id="tech-stack" name="tech_stack">
  <optgroup label="프론트엔드">
    <option value="react">React</option>
    <option value="vue">Vue.js</option>
    <option value="angular">Angular</option>
  </optgroup>
  <optgroup label="백엔드">
    <option value="nodejs">Node.js</option>
    <option value="django">Django</option>
    <option value="spring">Spring Boot</option>
  </optgroup>
  <optgroup label="데이터베이스">
    <option value="mysql">MySQL</option>
    <option value="mongodb">MongoDB</option>
  </optgroup>
</select>
```

---

## multiple 속성 — 다중 선택

`multiple` 속성을 추가하면 여러 항목을 동시에 선택할 수 있습니다.

```html
<label for="skills">보유 기술 (Ctrl/Cmd 클릭으로 다중 선택)</label>
<select id="skills" name="skills" multiple size="6">
  <option value="html">HTML</option>
  <option value="css">CSS</option>
  <option value="javascript">JavaScript</option>
  <option value="react">React</option>
  <option value="node">Node.js</option>
  <option value="python">Python</option>
</select>
```

`size` 속성으로 보이는 항목 수를 조절합니다. 다중 선택임을 사용자에게 안내 문구로 알려주는 것이 좋습니다.

---

## textarea — 여러 줄 텍스트 입력

댓글, 본문, 자기소개처럼 긴 텍스트를 입력받을 때 사용합니다.

```html
<label for="comment">댓글</label>
<textarea
  id="comment"
  name="comment"
  rows="5"
  cols="50"
  placeholder="댓글을 입력하세요. (최대 500자)"
  maxlength="500">
</textarea>
```

**주요 속성**

| 속성 | 설명 |
|------|------|
| `rows` | 표시할 행 수 (세로 크기) |
| `cols` | 표시할 열 수 (가로 크기) |
| `maxlength` | 최대 입력 글자 수 |
| `minlength` | 최소 입력 글자 수 |
| `placeholder` | 입력 전 안내 문구 |
| `readonly` | 읽기 전용 |
| `disabled` | 비활성화 |
| `required` | 필수 입력 |
| `wrap` | 줄 바꿈 방식 (soft/hard) |

CSS로 크기를 조절하려면 `resize` 속성을 활용합니다.

```css
textarea {
  resize: vertical;   /* 세로만 크기 조절 허용 */
  resize: none;       /* 크기 조절 비허용 */
  resize: both;       /* 가로·세로 모두 허용 (기본값) */
}
```

**기본값 설정**

textarea의 기본값은 태그 사이에 직접 텍스트를 넣습니다. 앞뒤 공백에 주의하세요.

```html
<!-- 기본값 있음 -->
<textarea name="bio">안녕하세요. 웹 개발자입니다.</textarea>

<!-- 기본값 없음 (빈 줄 주의) -->
<textarea name="comment"></textarea>
```

---

## fieldset과 legend — 폼 그룹화

관련 있는 입력 요소를 시각적·의미적으로 묶습니다.

```html
<form action="/register" method="POST">

  <fieldset>
    <legend>기본 정보</legend>
    <div>
      <label for="name">이름</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div>
      <label for="email">이메일</label>
      <input type="email" id="email" name="email" required>
    </div>
  </fieldset>

  <fieldset>
    <legend>개발자 정보</legend>
    <div>
      <label for="github">GitHub 아이디</label>
      <input type="text" id="github" name="github">
    </div>
    <div>
      <label for="career">경력 (년)</label>
      <input type="number" id="career" name="career" min="0" max="50">
    </div>
  </fieldset>

  <fieldset>
    <legend>관심 기술 (복수 선택)</legend>
    <label><input type="checkbox" name="interest" value="frontend"> 프론트엔드</label>
    <label><input type="checkbox" name="interest" value="backend"> 백엔드</label>
    <label><input type="checkbox" name="interest" value="devops"> DevOps</label>
    <label><input type="checkbox" name="interest" value="ai"> AI/ML</label>
  </fieldset>

  <button type="submit">가입하기</button>
</form>
```

스크린 리더는 fieldset에 진입할 때 legend를 읽어줍니다. radio, checkbox 그룹에는 반드시 fieldset + legend를 사용하는 것이 접근성 모범 사례입니다.

---

## datalist — 자동완성 목록

input에 자동완성 제안 목록을 추가합니다. 자유 입력과 목록 선택을 동시에 지원합니다.

```html
<label for="framework">프레임워크</label>
<input type="text" id="framework" name="framework" list="frameworks" placeholder="입력하거나 선택하세요">
<datalist id="frameworks">
  <option value="React">
  <option value="Vue.js">
  <option value="Angular">
  <option value="Svelte">
  <option value="Next.js">
  <option value="Nuxt.js">
  <option value="Django">
  <option value="FastAPI">
  <option value="Spring Boot">
</datalist>
```

input의 `list` 속성값과 datalist의 `id`를 일치시켜서 연결합니다.

select와 달리 사용자가 목록에 없는 값도 직접 입력할 수 있습니다. 검색창, 태그 입력 등에 유용합니다.

---

## output — 계산 결과 표시

폼 내 계산 결과를 표시하는 의미적 태그입니다.

```html
<form oninput="result.value = parseInt(price.value) * parseInt(qty.value)">
  <label for="price">단가: </label>
  <input type="number" id="price" name="price" value="10000">원

  <label for="qty">수량: </label>
  <input type="number" id="qty" name="qty" value="1">개

  <p>합계: <output name="result">10000</output>원</p>
</form>
```

---

## 실습: 기술 블로그 댓글 폼

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>댓글 작성</title>
</head>
<body>
  <h2>댓글 작성</h2>

  <form action="/comments" method="POST">

    <fieldset>
      <legend>작성자 정보</legend>
      <div>
        <label for="author-name">이름 <span aria-label="필수">*</span></label>
        <input type="text" id="author-name" name="author_name" required maxlength="20">
      </div>
      <div>
        <label for="author-email">이메일 (공개되지 않습니다)</label>
        <input type="email" id="author-email" name="author_email">
      </div>
      <div>
        <label for="author-url">웹사이트</label>
        <input type="url" id="author-url" name="author_url" placeholder="https://">
      </div>
    </fieldset>

    <fieldset>
      <legend>댓글 내용</legend>
      <div>
        <label for="comment-body">내용 <span aria-label="필수">*</span></label>
        <textarea
          id="comment-body"
          name="comment_body"
          rows="6"
          maxlength="1000"
          placeholder="질문이나 의견을 남겨주세요. 코드는 백틱(`)으로 감싸주세요."
          required></textarea>
      </div>
      <div>
        <label for="post-category">관련 카테고리</label>
        <select id="post-category" name="category">
          <option value="">선택 안 함</option>
          <optgroup label="언어">
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </optgroup>
          <optgroup label="프레임워크">
            <option value="react">React</option>
            <option value="django">Django</option>
          </optgroup>
        </select>
      </div>
    </fieldset>

    <button type="submit">댓글 등록</button>

  </form>
</body>
</html>
```

## 개발 팁: 브라우저별 기본 스타일 차이

select, textarea, datalist는 브라우저마다 기본 스타일이 다릅니다. 크롬과 파이어폭스에서 같은 select 태그를 열어보면 드롭다운 화살표의 모양이 다르다는 걸 알 수 있습니다. 실무에서는 CSS로 이 기본 스타일을 통일하거나, select2 같은 라이브러리로 아예 커스텀 드롭다운을 만드는 경우가 많습니다.

## 직접 확인해보기

1. `textarea`에 `rows="3"`과 `rows="10"`을 각각 설정하고 브라우저에서 크기 차이를 확인하기
2. `select multiple`을 만들고 Ctrl 키를 누른 상태로 여러 항목을 선택해보기
3. `datalist`를 이용한 자동완성 input에서 직접 값을 입력해보고, 목록에 없는 값도 입력 가능한지 확인하기
4. `fieldset` + `legend`로 라디오 버튼 그룹을 묶고, 스크린 리더가 어떻게 읽는지 테스트해보기

---

## 핵심

| 태그 | 핵심 용도 |
|------|----------|
| `<select>` | 드롭다운 선택 |
| `<optgroup>` | select 옵션 그룹화 |
| `<textarea>` | 여러 줄 텍스트 입력 |
| `<fieldset>` | 관련 폼 요소 그룹화 |
| `<legend>` | fieldset 제목 |
| `<datalist>` | input 자동완성 후보 목록 |
| `<output>` | 폼 계산 결과 표시 |

다음 글에서는 HTML5 폼 유효성 검사 — required, pattern, min, max, step을 다룹니다.