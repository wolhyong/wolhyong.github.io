---
layout: post
title: "Web Components 3부 — template, slot 심화와 완성된 컴포넌트 패턴"
description: "Web Components에서 template과 slot을 어떻게 활용하나요? HTML template 태그를 Shadow DOM과 결합하는 방법, slot 이벤트(slotchange), ES 모듈로 컴포넌트 분리, Form-Associated Custom Elements까지 다룹니다."
date: 2015-09-07 00:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 36
tags: [html5, WebComponents, template, slot, ESModule, FormAssociated, 컴포넌트패턴]
lang: ko
---

Custom Elements와 Shadow DOM을 배웠습니다. 이제 HTML template을 결합해 성능을 최적화하고, ES 모듈로 컴포넌트를 파일로 분리하는 완성된 패턴을 정리합니다.

---

## template과 Shadow DOM 결합

`innerHTML`로 매번 HTML 문자열을 파싱하는 것보다 `<template>`을 복제하는 것이 훨씬 빠릅니다.

```html
<!-- HTML 파일에 template 정의 -->
<template id="card-template">
  <style>
    :host { display: block; }
    .card {
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 16px;
      background: #161b22;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
  </style>
  <article class="card">
    <div class="header">
      <slot name="category"></slot>
      <slot name="date"></slot>
    </div>
    <slot></slot>
  </article>
</template>

<script>
class PostCard extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });

    // template 복제해서 Shadow Root에 삽입
    const template = document.getElementById('card-template');
    shadow.appendChild(template.content.cloneNode(true));
  }
}
customElements.define('post-card', PostCard);
</script>
```

같은 컴포넌트가 여러 번 사용될 때 template을 한 번만 파싱하고 복제만 하므로 성능이 좋습니다.

---

## ES 모듈로 컴포넌트 분리

```javascript
// components/post-card.js

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    .card {
      border: 1px solid var(--border-color, #30363d);
      border-radius: 8px;
      padding: 16px;
    }
  </style>
  <article class="card">
    <slot name="header"></slot>
    <slot></slot>
    <slot name="footer"></slot>
  </article>
`;

class PostCard extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(template.content.cloneNode(true));
    }
  }
}

// export하거나 직접 등록
if (!customElements.get('post-card')) {
  customElements.define('post-card', PostCard);
}

export default PostCard;
```

```html
<!-- HTML에서 사용 -->
<script type="module" src="/components/post-card.js"></script>
<script type="module">
  import PostCard from '/components/post-card.js';
</script>

<post-card>
  <h2 slot="header">컴포넌트 제목</h2>
  <p>본문 내용</p>
  <a slot="footer" href="#">더 읽기</a>
</post-card>
```

`type="module"`은 기본적으로 defer처럼 동작해서 HTML 파싱을 차단하지 않습니다.

---

## slotchange 이벤트 — slot 내용 변경 감지

```javascript
class TabPanel extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <div class="tabs">
        <div class="tab-list" role="tablist"></div>
        <slot></slot>
      </div>
    `;

    const slot = shadow.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      const tabs = slot.assignedElements();
      this.buildTabList(tabs);
    });
  }

  buildTabList(tabs) {
    const tabList = this.shadowRoot.querySelector('.tab-list');
    tabList.innerHTML = '';
    tabs.forEach((tab, i) => {
      const btn = document.createElement('button');
      btn.textContent = tab.getAttribute('label') || `탭 ${i + 1}`;
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.hidden = true);
        tab.hidden = false;
      });
      tabList.appendChild(btn);
    });
    // 첫 번째 탭만 보이기
    tabs.forEach((t, i) => t.hidden = i !== 0);
  }
}
customElements.define('tab-panel', TabPanel);
```

```html
<tab-panel>
  <div label="HTML">HTML 내용</div>
  <div label="CSS">CSS 내용</div>
  <div label="JavaScript">JS 내용</div>
</tab-panel>
```

---

## Form-Associated Custom Elements

커스텀 엘리먼트를 `<form>`에 연동할 수 있습니다.

```javascript
class StarRating extends HTMLElement {
  static formAssociated = true; // form 연동 선언

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
    this._value = '0';
  }

  connectedCallback() {
    this.render();
  }

  get value() { return this._value; }
  set value(v) {
    this._value = v;
    this.internals.setFormValue(v); // form에 값 전달
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .stars { display: flex; gap: 4px; cursor: pointer; }
        .star { font-size: 1.5rem; color: #30363d; }
        .star.active { color: #d29922; }
      </style>
      <div class="stars" role="group" aria-label="별점 선택">
        ${[1,2,3,4,5].map(n => `
          <span class="star ${n <= this._value ? 'active' : ''}"
                data-value="${n}"
                role="radio"
                aria-checked="${n == this._value}"
                tabindex="${n == 1 ? '0' : '-1'}">★</span>
        `).join('')}
      </div>
    `;

    this.shadowRoot.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', () => {
        this.value = star.dataset.value;
      });
    });
  }
}
customElements.define('star-rating', StarRating);
```

```html
<form action="/review" method="POST">
  <label>만족도</label>
  <star-rating name="rating"></star-rating>
  <button type="submit">제출</button>
</form>
```

---

## 컴포넌트 라이브러리 구조 예시

```
components/
├── index.js              # 모든 컴포넌트 모아서 export
├── post-card/
│   ├── post-card.js
│   ├── post-card.css     # 스타일 별도 파일 (선택)
│   └── post-card.test.js
├── tech-badge/
│   └── tech-badge.js
└── alert-box/
    └── alert-box.js
```

```javascript
// components/index.js
export { default as PostCard } from './post-card/post-card.js';
export { default as TechBadge } from './tech-badge/tech-badge.js';
export { default as AlertBox } from './alert-box/alert-box.js';
```

```html
<script type="module">
  import '/components/index.js';
  // 등록된 컴포넌트를 HTML에서 바로 사용 가능
</script>
```

---

## 되짚기

- `template.content.cloneNode(true)`를 Shadow DOM에 삽입하면 성능이 향상됩니다
- `type="module"`로 컴포넌트를 파일로 분리하고 import로 재사용합니다
- `slotchange` 이벤트로 slot 내용 변경을 감지합니다
- `formAssociated = true`로 커스텀 엘리먼트를 form에 연동합니다

다음 글에서는 PWA 시작하기 — Web App Manifest 설정을 다룹니다.


## 실전 예제로 이해하기

HTML의 Web Components 3부 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 Web Components 3부을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Components 3부 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>Web Components 3부에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 Web Components 3부을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. Web Components 3부 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 Web Components 3부을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
