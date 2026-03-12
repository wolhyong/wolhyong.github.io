---
layout: post
title: "웹 접근성(a11y) 기초와 ARIA 속성 입문 — 스크린 리더 대응 방법"
description: "웹 접근성(Web Accessibility)의 개념과 왜 중요한지 설명합니다. ARIA role, aria-label, aria-hidden, aria-expanded, aria-live 속성의 올바른 사용법, 키보드 탐색 지원, 색상 대비 등 실전에서 바로 적용할 수 있는 a11y 체크리스트를 정리합니다."
date: 2015-02-07 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 22
tags: [html, 접근성, a11y, ARIA, 스크린리더, WAI-ARIA, 키보드탐색]
lang: ko
---

웹 접근성(Accessibility, 줄여서 a11y)은 장애가 있는 사람도 웹을 동등하게 이용할 수 있도록 만드는 것입니다. 시각 장애인의 스크린 리더, 청각 장애인의 자막, 운동 장애인의 키보드 탐색 등이 대상입니다. SEO 점수와도 직결되며, 많은 나라에서 법적 의무 사항이기도 합니다.

---

## 접근성이 중요한 현실적인 이유

개발자들이 접근성을 챙겨야 하는 이유는 도덕적 의무만이 아닙니다.

- **SEO**: 구글은 접근성이 높은 사이트를 더 잘 이해합니다. alt 텍스트, 시맨틱 구조, 레이블 연결은 SEO에도 직접 영향을 미칩니다.
- **법적 의무**: 한국의 「장애인차별금지법」은 웹 접근성 준수를 의무화하고 있습니다.
- **더 넓은 사용자**: 전 세계 약 15%가 어떤 형태로든 장애를 가지고 있습니다.
- **모든 상황**: 밝은 햇빛 아래 화면이 잘 안 보이거나, 한 손이 바쁠 때처럼 일시적 상황에서도 접근성이 좋은 사이트가 더 편합니다.

---

## 접근성의 기본 원칙 — POUR

W3C WCAG(웹 콘텐츠 접근성 지침)의 4가지 원칙입니다.

| 원칙 | 설명 |
|------|------|
| **P**erceivable (인식 가능) | 모든 콘텐츠를 인식할 수 있어야 함 (이미지에 alt 텍스트) |
| **O**perable (운용 가능) | 키보드만으로도 모든 기능 사용 가능 |
| **U**nderstandable (이해 가능) | 콘텐츠와 UI가 이해하기 쉬워야 함 |
| **R**obust (견고함) | 다양한 보조 기술에서 동작해야 함 |

---

## 시맨틱 HTML이 최선의 접근성

ARIA를 쓰기 전에, 올바른 시맨틱 태그를 먼저 사용하는 것이 훨씬 중요합니다.

```html
<!-- 나쁜 예: div로 버튼처럼 만들기 -->
<div onclick="submit()" style="cursor:pointer">제출</div>

<!-- 좋은 예: button 태그 사용 -->
<button type="submit">제출</button>
```

`<button>`은 키보드 포커스, Enter/Space 키 동작, 스크린 리더 읽기가 모두 자동으로 됩니다. div로 만들면 이 모든 것을 직접 구현해야 합니다.

---

## ARIA란

**ARIA(Accessible Rich Internet Applications)** 는 HTML이 전달할 수 없는 역할, 상태, 속성을 보조 기술에 전달하는 속성 모음입니다.

기본 규칙: **HTML 시맨틱으로 충분하면 ARIA를 쓰지 않습니다.** ARIA는 시맨틱 HTML로 표현할 수 없을 때만 씁니다.

---

## role — 요소의 역할 명시

```html
<!-- 탐색 메뉴임을 명시 -->
<div role="navigation">
  <ul>...</ul>
</div>

<!-- nav 태그를 쓸 수 있다면 이게 더 좋음 -->
<nav>
  <ul>...</ul>
</nav>
```

자주 쓰는 role 값:

| role | 설명 | 대응 시맨틱 태그 |
|------|------|----------------|
| `button` | 버튼 | `<button>` |
| `navigation` | 내비게이션 | `<nav>` |
| `main` | 주요 콘텐츠 | `<main>` |
| `banner` | 페이지 헤더 | `<header>` |
| `contentinfo` | 페이지 푸터 | `<footer>` |
| `search` | 검색 영역 | (없음) |
| `alert` | 중요 알림 | (없음) |
| `dialog` | 모달 대화상자 | `<dialog>` |
| `tablist`, `tab`, `tabpanel` | 탭 UI | (없음) |

---

## aria-label — 요소 이름 지정

텍스트가 없는 버튼이나 아이콘에 이름을 붙입니다.

```html
<!-- 아이콘 버튼에 이름 지정 -->
<button aria-label="검색">
  <svg>...</svg>
</button>

<button aria-label="메뉴 닫기">✕</button>

<!-- 같은 텍스트를 가진 링크가 여러 개일 때 구분 -->
<article>
  <h2>Python 기초 문법</h2>
  <a href="/post/1" aria-label="Python 기초 문법 더 읽기">더 읽기</a>
</article>
<article>
  <h2>React 입문 가이드</h2>
  <a href="/post/2" aria-label="React 입문 가이드 더 읽기">더 읽기</a>
</article>
```

---

## aria-labelledby — 다른 요소를 이름으로 참조

```html
<h2 id="modal-title">로그인</h2>
<div role="dialog" aria-labelledby="modal-title">
  <!-- 모달 내용 -->
</div>
```

id로 연결하면 해당 요소의 텍스트가 이름으로 사용됩니다.

---

## aria-hidden — 보조 기술에서 숨기기

장식용 아이콘이나 시각적 요소를 스크린 리더가 읽지 않도록 합니다.

```html
<!-- 장식 아이콘은 숨기고, 텍스트는 남김 -->
<button>
  <svg aria-hidden="true" focusable="false">...</svg>
  저장하기
</button>

<!-- 중복 내용 숨기기 -->
<span class="star" aria-hidden="true">★★★★☆</span>
<span class="sr-only">5점 만점에 4점</span>
```

`sr-only` 클래스는 화면에는 보이지 않지만 스크린 리더에는 읽히는 숨김 텍스트 패턴입니다.

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## aria-expanded — 펼침/접힘 상태

드롭다운, 아코디언, 메뉴의 열림/닫힘 상태를 전달합니다.

```html
<button
  aria-expanded="false"
  aria-controls="dropdown-menu"
  id="menu-btn">
  메뉴 열기
</button>
<ul id="dropdown-menu" hidden>
  <li><a href="/">홈</a></li>
  <li><a href="/blog">블로그</a></li>
</ul>

<script>
  const btn = document.getElementById('menu-btn');
  const menu = document.getElementById('dropdown-menu');

  btn.addEventListener('click', () => {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !isExpanded);
    menu.hidden = isExpanded;
  });
</script>
```

---

## aria-live — 동적 콘텐츠 알림

페이지가 새로고침 없이 콘텐츠가 바뀔 때, 스크린 리더에 변경 사항을 알립니다.

```html
<!-- 폼 제출 결과 메시지 -->
<div aria-live="polite" id="status-msg"></div>

<script>
  // 제출 완료 후
  document.getElementById('status-msg').textContent = '댓글이 등록됐습니다.';
</script>
```

| 값 | 동작 |
|----|------|
| `polite` | 현재 읽던 것 완료 후 알림 |
| `assertive` | 즉시 중단하고 알림 (오류, 긴급 알림) |
| `off` | 변경 알림 안 함 |

---

## 키보드 탐색 — tabindex

모든 인터랙티브 요소는 키보드(Tab 키)로 탐색 가능해야 합니다.

```html
<!-- 기본 포커스 불가 요소에 포커스 추가 -->
<div tabindex="0" role="button" onclick="toggle()">
  토글 버튼
</div>

<!-- 탭 순서에서 제외 (JavaScript로만 포커스) -->
<div tabindex="-1" id="error-msg">에러 메시지</div>
```

- `tabindex="0"` — 탭 순서에 포함 (문서 순서대로)
- `tabindex="-1"` — 탭 순서에서 제외, JavaScript `focus()`로만 가능
- `tabindex="1"` 이상 — 순서 강제 지정 (사용 비권장)

---

## 색상 대비

텍스트와 배경의 색상 대비가 충분해야 합니다.

- 일반 텍스트: 대비율 **4.5:1** 이상 (WCAG AA 기준)
- 큰 텍스트(18pt 이상): **3:1** 이상
- UI 컴포넌트(버튼 테두리 등): **3:1** 이상

```css
/* 나쁜 예: 대비 낮음 */
.light-text { color: #aaaaaa; background: #ffffff; }

/* 좋은 예: 대비 높음 */
.good-text { color: #333333; background: #ffffff; }
```

[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)에서 색상 대비를 쉽게 확인할 수 있습니다.

---

## 접근성 체크리스트

블로그 게시물 작성 시 확인해야 할 항목입니다.

- [ ] 모든 이미지에 의미 있는 `alt` 텍스트 (장식용은 `alt=""`)
- [ ] 제목 태그(h1~h6) 계층 구조 올바름
- [ ] 모든 폼 입력에 `<label>` 연결됨
- [ ] 링크 텍스트가 "여기를 클릭"이 아닌 의미 있는 내용
- [ ] 텍스트와 배경 색상 대비 4.5:1 이상
- [ ] 키보드로 모든 인터랙티브 요소 접근 가능
- [ ] 아이콘 버튼에 `aria-label` 있음
- [ ] 동적 알림에 `aria-live` 설정
- [ ] `lang` 속성 설정됨 (`<html lang="ko">`)
- [ ] 페이지 title 태그에 의미 있는 내용

---

## 정리

- 시맨틱 HTML을 올바르게 쓰는 것이 접근성의 첫 번째 단계입니다
- ARIA는 HTML로 표현할 수 없는 역할·상태·속성을 보조 기술에 전달합니다
- `aria-label`로 텍스트 없는 버튼에 이름을 붙입니다
- `aria-hidden="true"`로 장식용 요소를 스크린 리더에서 숨깁니다
- `aria-expanded`로 드롭다운·아코디언 상태를 전달합니다
- `aria-live`로 동적으로 변하는 콘텐츠를 알립니다

다음 글에서는 웹 폰트와 아이콘 — Google Fonts, Font Awesome 적용 방법을 다룹니다.