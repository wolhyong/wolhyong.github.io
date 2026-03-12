---
layout: post
title: "HTML data-* 속성 완전 정리 — HTML에 데이터 저장하고 JavaScript로 읽기"
description: "HTML5 data-* 커스텀 속성으로 HTML 요소에 데이터를 저장하는 방법을 정리합니다. dataset API로 JavaScript에서 읽고 쓰는 법, CSS attr()과 연동, 필터링·탭 UI 구현 실전 예제까지 다룹니다."
date: 2015-02-06 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 21
tags: [html5, data속성, dataset, JavaScript, CSS, 커스텀속성]
lang: ko
---

HTML 요소에 추가 데이터를 저장하고 싶을 때가 있습니다. 예를 들어 카드 컴포넌트에 게시물 ID를 저장해두거나, 버튼에 카테고리 정보를 달아두는 경우입니다. `data-*` 속성은 이런 상황을 위해 HTML5에서 공식으로 제공하는 방법입니다.

---

## data-* 속성이란

`data-` 뒤에 원하는 이름을 붙여 HTML 요소에 데이터를 저장합니다.

```html
<article
  data-post-id="42"
  data-category="python"
  data-level="beginner"
  data-published="2024-01-15">
  <h2>Python 기초 문법 정리</h2>
</article>
```

규칙은 단순합니다.

- `data-` 로 시작해야 합니다
- 대문자는 쓸 수 없습니다 (소문자, 숫자, 하이픈만)
- 값은 문자열이면 무엇이든 가능합니다

---

## JavaScript에서 dataset으로 접근

JavaScript의 `dataset` 속성으로 data-* 값을 읽고 쓸 수 있습니다.

```html
<button
  data-post-id="42"
  data-action="like"
  id="like-btn">
  ❤ 좋아요
</button>
```

```javascript
const btn = document.getElementById('like-btn');

// 읽기
console.log(btn.dataset.postId);   // "42"   (data-post-id → postId, 카멜케이스 변환)
console.log(btn.dataset.action);   // "like"

// 쓰기
btn.dataset.postId = '99';
btn.dataset.liked = 'true';        // 새 속성 추가

// 삭제
delete btn.dataset.action;

// getAttribute / setAttribute 로도 접근 가능
console.log(btn.getAttribute('data-post-id'));  // "42"
btn.setAttribute('data-post-id', '100');
```

**카멜케이스 변환 규칙**

HTML의 하이픈 이름이 JavaScript에서는 카멜케이스로 자동 변환됩니다.

| HTML 속성 | JavaScript dataset |
|-----------|-------------------|
| `data-post-id` | `dataset.postId` |
| `data-user-name` | `dataset.userName` |
| `data-is-active` | `dataset.isActive` |
| `data-bg-color` | `dataset.bgColor` |

---

## 실전 패턴 1 — 목록 필터링

카테고리 버튼을 클릭하면 해당 카테고리 게시물만 보이는 필터 UI입니다.

```html
<div class="filter-buttons">
  <button data-filter="all" class="active">전체</button>
  <button data-filter="python">Python</button>
  <button data-filter="javascript">JavaScript</button>
  <button data-filter="react">React</button>
</div>

<div class="post-grid">
  <article data-category="python">
    <h3>Python 리스트 컴프리헨션</h3>
  </article>
  <article data-category="javascript">
    <h3>JavaScript 클로저 이해하기</h3>
  </article>
  <article data-category="react">
    <h3>React useEffect 완전 정리</h3>
  </article>
  <article data-category="python">
    <h3>Python 데코레이터 패턴</h3>
  </article>
</div>

<script>
  const buttons = document.querySelectorAll('[data-filter]');
  const posts = document.querySelectorAll('[data-category]');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // 버튼 활성화 상태 변경
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 게시물 필터링
      posts.forEach(post => {
        if (filter === 'all' || post.dataset.category === filter) {
          post.style.display = 'block';
        } else {
          post.style.display = 'none';
        }
      });
    });
  });
</script>
```

---

## 실전 패턴 2 — 탭 UI

```html
<div class="tabs">
  <button data-tab="html" class="tab-btn active">HTML</button>
  <button data-tab="css" class="tab-btn">CSS</button>
  <button data-tab="js" class="tab-btn">JavaScript</button>
</div>

<div data-panel="html" class="tab-panel active">
  <p>HTML은 웹 페이지의 구조를 담당합니다.</p>
</div>
<div data-panel="css" class="tab-panel" hidden>
  <p>CSS는 웹 페이지의 스타일을 담당합니다.</p>
</div>
<div data-panel="js" class="tab-panel" hidden>
  <p>JavaScript는 웹 페이지의 동작을 담당합니다.</p>
</div>

<script>
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.hidden = true);

      btn.classList.add('active');
      document.querySelector(`[data-panel="${target}"]`).hidden = false;
    });
  });
</script>
```

---

## CSS attr()로 data-* 값 표시

CSS에서 `attr()` 함수로 data-* 값을 읽어 가상 요소에 표시할 수 있습니다.

```html
<span data-tooltip="GitHub에서 코드를 확인하세요">소스 코드 보기</span>
```

```css
[data-tooltip] {
  position: relative;
  cursor: help;
}

[data-tooltip]::after {
  content: attr(data-tooltip);   /* data-tooltip 값을 가져옴 */
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  font-size: 0.8rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

[data-tooltip]:hover::after {
  opacity: 1;
}
```

JavaScript 없이 순수 CSS만으로 툴팁을 구현할 수 있습니다.

---

## data-* 사용 시 주의사항

**민감한 데이터는 저장하지 말 것**

data-* 속성은 HTML 소스코드에서 그대로 보입니다. 비밀번호, API 키, 개인정보는 절대로 data-* 속성에 저장하면 안 됩니다.

**복잡한 데이터는 JSON으로**

```html
<div data-config='{"theme":"dark","lang":"ko","items":["a","b"]}'></div>
```

```javascript
const config = JSON.parse(el.dataset.config);
console.log(config.theme);  // "dark"
```

값에 작은따옴표를 쓰고 JSON 내부에 큰따옴표를 사용하면 충돌을 피할 수 있습니다.

---

## 정리

- `data-이름="값"` 형태로 HTML 요소에 임의 데이터를 저장합니다
- JavaScript에서 `element.dataset.이름` (카멜케이스)으로 읽고 씁니다
- CSS `attr(data-이름)`으로 값을 가상 요소에 출력할 수 있습니다
- 필터링, 탭 UI 등 JavaScript와 연동되는 UI에 널리 사용됩니다
- 민감한 데이터는 절대 저장하지 않습니다

다음 글에서는 웹 접근성(a11y) 기초와 ARIA 속성 입문을 다룹니다.