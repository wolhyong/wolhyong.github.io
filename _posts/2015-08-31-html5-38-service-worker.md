---
layout: post
title: "Web Components 2부 — Shadow DOM으로 컴포넌트 스타일 캡슐화하기"
description: "Shadow DOM으로 스타일을 캡슐화하는 방법은? attachShadow로 Shadow Root를 생성하는 법, open/closed 모드 차이, :host와 ::slotted 가상 선택자, CSS 변수로 외부에서 스타일을 제어하는 방법, 카드 컴포넌트 예제까지 다룹니다."
date: 2015-08-31 00:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 35
tags: [html5, WebComponents, ShadowDOM, 캡슐화, CSS변수, slot, host]
lang: ko
---

Custom Elements로 나만의 태그를 만들었는데, 외부 CSS가 침범해서 스타일이 깨지는 문제가 있습니다. Shadow DOM은 컴포넌트 내부를 외부와 격리된 DOM 트리로 만들어서 이 문제를 해결합니다.

---

## Shadow DOM이 필요한 이유

일반 Custom Elements는 외부 CSS의 영향을 받습니다.

```html
<style>
  p { color: red; }  /* 전역 스타일 */
</style>

<my-card></my-card>

<script>
  class MyCard extends HTMLElement {
    connectedCallback() {
      this.innerHTML = '<p>카드 내용</p>';
      // 전역 p { color: red } 가 적용되어 빨간색으로 표시됨
    }
  }
  customElements.define('my-card', MyCard);
</script>
```

Shadow DOM을 사용하면 내부가 외부와 격리됩니다.

---

## Shadow DOM 기본 사용

```javascript
class MyCard extends HTMLElement {
  connectedCallback() {
    // Shadow Root 생성
    const shadow = this.attachShadow({ mode: 'open' });

    // Shadow DOM 안에 콘텐츠 추가
    shadow.innerHTML = `
      <style>
        /* 이 스타일은 이 컴포넌트에만 적용됨 */
        p { color: blue; }
        .card {
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 16px;
        }
      </style>
      <div class="card">
        <p>카드 내용 (파란색)</p>
      </div>
    `;
  }
}
customElements.define('my-card', MyCard);
```

전역에 `p { color: red }`가 있어도 Shadow DOM 안의 `<p>`는 파란색입니다. 반대로 Shadow DOM 안의 스타일도 외부로 새어나가지 않습니다.

---

## mode: 'open' vs 'closed'

```javascript
// open: JavaScript에서 shadowRoot로 접근 가능
const shadow = this.attachShadow({ mode: 'open' });
element.shadowRoot; // Shadow Root에 접근 가능

// closed: 외부에서 shadowRoot 접근 불가
const shadow = this.attachShadow({ mode: 'closed' });
element.shadowRoot; // null
```

실무에서는 대부분 `open`을 사용합니다. `closed`는 완전한 블랙박스가 필요한 경우에 씁니다.

---

## :host — 호스트 엘리먼트 스타일링

Shadow DOM 안에서 컴포넌트 자체(호스트 엘리먼트)를 스타일링합니다.

```javascript
shadow.innerHTML = `
  <style>
    /* 컴포넌트 자체 스타일 */
    :host {
      display: block;           /* 기본값은 inline */
      box-sizing: border-box;
    }

    /* 속성에 따른 조건부 스타일 */
    :host([variant="danger"]) .alert {
      background: #3d1c1c;
      border-color: #f85149;
    }

    :host([variant="success"]) .alert {
      background: #1c2d1c;
      border-color: #3fb950;
    }

    /* 비활성화 상태 */
    :host(:disabled), :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    /* 포커스 상태 */
    :host(:focus-within) .card {
      box-shadow: 0 0 0 2px #58a6ff;
    }
  </style>
  <div class="alert">
    <slot></slot>
  </div>
`;
```

---

## slot — 외부 콘텐츠 삽입 지점

Shadow DOM 안에 외부에서 넣어주는 내용을 표시할 위치를 지정합니다.

**기본 slot**

```javascript
class InfoCard extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        .card { border: 1px solid #30363d; padding: 16px; border-radius: 8px; }
      </style>
      <div class="card">
        <slot></slot>  <!-- 외부 콘텐츠가 여기에 삽입됨 -->
      </div>
    `;
  }
}
customElements.define('info-card', InfoCard);
```

```html
<info-card>
  <h2>Python 기초 문법</h2>
  <p>변수, 조건문, 반복문을 다룹니다.</p>
</info-card>
```

`<h2>`와 `<p>`가 `.card` 안의 `<slot>` 위치에 렌더링됩니다.

**이름 있는 slot**

```javascript
shadow.innerHTML = `
  <style>
    .card { border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
    .card-header { padding: 12px 16px; background: #161b22; }
    .card-body { padding: 16px; }
    .card-footer { padding: 12px 16px; border-top: 1px solid #30363d; }
  </style>
  <div class="card">
    <div class="card-header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>  <!-- 기본 slot -->
    </div>
    <div class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
`;
```

```html
<post-card>
  <h2 slot="header">React useEffect 이해하기</h2>
  <p>의존성 배열의 동작 원리를 설명합니다.</p>
  <a slot="footer" href="/post/react-useeffect">더 읽기 →</a>
</post-card>
```

---

## ::slotted — slot에 삽입된 요소 스타일링

```css
/* slot에 삽입된 모든 요소 */
::slotted(*) {
  margin: 0;
}

/* slot에 삽입된 특정 요소 */
::slotted(h2) {
  font-size: 1.1rem;
  color: #c9d1d9;
}

::slotted(p) {
  color: #8b949e;
  font-size: 0.9rem;
}

/* name 있는 slot에 삽입된 요소 */
/* (slot 이름으로 구분 불가, 외부에서 스타일 적용 필요) */
```

`::slotted`는 직접 자식만 선택할 수 있습니다. 깊은 자식은 선택할 수 없습니다.

---

## CSS 변수로 외부에서 테마 제어

Shadow DOM은 외부 CSS를 차단하지만 CSS 변수(커스텀 프로퍼티)는 Shadow DOM을 통과합니다.

```javascript
shadow.innerHTML = `
  <style>
    .card {
      background: var(--card-bg, #161b22);
      border: 1px solid var(--card-border, #30363d);
      border-radius: var(--card-radius, 8px);
      color: var(--card-color, #c9d1d9);
      padding: var(--card-padding, 16px);
    }
  </style>
  <div class="card">
    <slot></slot>
  </div>
`;
```

```css
/* 외부 CSS에서 테마 설정 */
post-card {
  --card-bg: #1c2d1c;
  --card-border: #3fb950;
  --card-radius: 4px;
}

/* 다크 모드 */
@media (prefers-color-scheme: dark) {
  post-card {
    --card-bg: #0d1117;
  }
}
```

CSS 변수는 Shadow DOM을 통과하기 때문에 컴포넌트 외부에서 테마를 자유롭게 제어할 수 있습니다.

---

## 실습: 완성된 PostCard 컴포넌트

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>PostCard 컴포넌트</title>
  <style>
    body { background: #0d1117; font-family: 'Noto Sans KR', sans-serif; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  </style>
</head>
<body>
  <div class="grid">
    <post-card category="Python" date="2024-01-15">
      <h2 slot="title">Python 기초 문법 정리</h2>
      <p slot="excerpt">변수, 조건문, 반복문을 예제와 함께 배웁니다.</p>
      <a slot="link" href="/post/python">더 읽기</a>
    </post-card>

    <post-card category="React" date="2024-01-16">
      <h2 slot="title">React useEffect 이해하기</h2>
      <p slot="excerpt">의존성 배열의 동작 원리를 설명합니다.</p>
      <a slot="link" href="/post/react">더 읽기</a>
    </post-card>
  </div>

  <script>
    class PostCard extends HTMLElement {
      static get observedAttributes() { return ['category', 'date']; }

      connectedCallback() { this.render(); }
      attributeChangedCallback() { this.render(); }

      render() {
        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
        }
        const category = this.getAttribute('category') || '';
        const date = this.getAttribute('date') || '';

        this.shadowRoot.innerHTML = `
          <style>
            :host { display: block; }
            .card {
              background: var(--card-bg, #161b22);
              border: 1px solid var(--card-border, #30363d);
              border-radius: 8px;
              overflow: hidden;
              transition: border-color 0.2s;
            }
            .card:hover { border-color: #58a6ff; }
            .meta {
              display: flex;
              justify-content: space-between;
              padding: 12px 16px;
              font-size: 0.75rem;
              color: #8b949e;
            }
            .category {
              color: #58a6ff;
              font-weight: 600;
              text-transform: uppercase;
            }
            .body { padding: 0 16px 16px; }
            ::slotted(h2) {
              font-size: 1rem;
              color: #c9d1d9;
              margin: 0 0 8px;
            }
            ::slotted(p) {
              font-size: 0.875rem;
              color: #8b949e;
              margin: 0 0 12px;
              line-height: 1.6;
            }
            ::slotted(a) {
              font-size: 0.875rem;
              color: #58a6ff;
              text-decoration: none;
            }
          </style>
          <article class="card">
            <div class="meta">
              <span class="category">${category}</span>
              <time datetime="${date}">${date}</time>
            </div>
            <div class="body">
              <slot name="title"></slot>
              <slot name="excerpt"></slot>
              <slot name="link"></slot>
            </div>
          </article>
        `;
      }
    }
    customElements.define('post-card', PostCard);
  </script>
</body>
</html>
```

---

## 직접 확인해보기: Shadow DOM 캡슐화 테스트

개발자 도구에서 `<post-card>` 요소를 선택하면 `#shadow-root`라는 섹션이 표시됩니다. 여기에 Shadow DOM 내부의 HTML이 전부 보입니다. `mode: 'open'`으로 생성했기 때문입니다.

Shadow DOM의 캡슐화를 테스트하려면, 전역 CSS에 `p { color: red !important; }`를 추가해보세요. Shadow DOM 안의 `<p>`는 빨간색으로 변하지 않고 그대로입니다. 반대로 Shadow DOM 안에서 `::slotted`로 스타일을 줘도 외부에는 영향이 없습니다.

---

## 되짚기

- `attachShadow({ mode: 'open' })`으로 Shadow Root를 생성합니다
- Shadow DOM 안의 CSS는 외부와 격리됩니다
- `:host`로 컴포넌트 자체를, `::slotted`로 slot 삽입 요소를 스타일링합니다
- `<slot>`으로 외부 콘텐츠를 컴포넌트 내부에 배치합니다
- CSS 변수(`--var`)는 Shadow DOM을 통과해 외부에서 테마를 제어할 수 있습니다

다음 글에서는 Web Components 3부 — HTML Templates와 Slot 심화를 다룹니다.


## 실전 예제로 이해하기

HTML의 Web Components 2부 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 Web Components 2부을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Components 2부 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>Web Components 2부에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 Web Components 2부을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. Web Components 2부 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 Web Components 2부을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
