---
layout: post
title: "HTML data-* 속성으로 데이터 저장하고 JavaScript로 읽는 법"
description: "HTML data-* 속성은 어떻게 활용하나요? HTML5 data-* 커스텀 속성으로 HTML 요소에 데이터를 저장하는 방법, dataset API로 JavaScript에서 읽고 쓰는 법, CSS attr()과 연동, UI 예제까지 다룹니다."
date: 2015-06-15 00:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 24
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

## 패턴 1 — 목록 필터링

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
    <h3>React useEffect 이해하기</h3>
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

## 패턴 2 — 탭 UI

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

data-* 속성은 HTML 소스코드에서 그대로 보입니다. 브라우저 개발자 도구(F12)로 누구나 볼 수 있기 때문에 비밀번호, API 키, 개인정보는 절대로 data-*에 저장하면 안 됩니다.

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

## 되짚기

- `data-이름="값"` 형태로 HTML 요소에 임의 데이터를 저장합니다
- JavaScript에서 `element.dataset.이름` (카멜케이스)으로 읽고 씁니다
- CSS `attr(data-이름)`으로 값을 가상 요소에 출력할 수 있습니다
- 필터링, 탭 UI 등 JavaScript와 연동되는 UI에 널리 사용됩니다
- 민감한 데이터는 절대 저장하지 않습니다

다음 글에서는 웹 접근성(a11y) 기초와 ARIA 속성 입문을 다룹니다.


## 실전 예제로 이해하기

HTML의 data 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 data을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>data 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>data에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 data을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. data 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 data을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
