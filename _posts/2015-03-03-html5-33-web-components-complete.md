---
layout: post
title: "Web Components 3부 — template, slot 심화와 완성된 컴포넌트 패턴"
description: "HTML template 태그를 Shadow DOM과 결합하는 방법, slot 이벤트(slotchange), 컴포넌트를 ES 모듈로 분리하는 방법, form 연동 가능한 Form-Associated Custom Elements, 완성된 재사용 컴포넌트 라이브러리 패턴까지 정리합니다."
date: 2015-03-03 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 33
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

## 정리

- `template.content.cloneNode(true)`를 Shadow DOM에 삽입하면 성능이 향상됩니다
- `type="module"`로 컴포넌트를 파일로 분리하고 import로 재사용합니다
- `slotchange` 이벤트로 slot 내용 변경을 감지합니다
- `formAssociated = true`로 커스텀 엘리먼트를 form에 연동합니다

다음 글에서는 PWA 시작하기 — Web App Manifest 설정을 다룹니다.