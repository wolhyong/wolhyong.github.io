---
layout: post
title: "Web Components 1부 — Custom Elements로 나만의 HTML 태그 만들기"
description: "Web Components의 첫 번째 기술인 Custom Elements API를 완전히 정리합니다. HTMLElement 상속, connectedCallback·disconnectedCallback·attributeChangedCallback 생명주기, observedAttributes, 자율형과 확장형 커스텀 엘리먼트의 차이를 실전 예제와 함께 설명합니다."
date: 2015-03-01 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 31
tags: [html5, WebComponents, CustomElements, 컴포넌트, 생명주기, HTMLElement]
lang: ko
---

React, Vue 같은 프레임워크 없이도 재사용 가능한 컴포넌트를 만들 수 있습니다. Web Components는 브라우저가 기본으로 지원하는 컴포넌트 기술입니다. 세 가지 핵심 기술(Custom Elements, Shadow DOM, HTML Templates) 중 Custom Elements를 먼저 다룹니다.

---

## Web Components란

네 가지 브라우저 표준 기술의 모음입니다.

| 기술 | 역할 |
|------|------|
| **Custom Elements** | `<my-card>` 같은 나만의 HTML 태그 정의 |
| **Shadow DOM** | 컴포넌트 내부 캡슐화 (외부 CSS 차단) |
| **HTML Templates** | 렌더링되지 않는 재사용 가능 마크업 |
| **ES Modules** | 컴포넌트 파일 분리와 임포트 |

---

## Custom Elements 기본 구조

```javascript
// 1. HTMLElement를 상속한 클래스 정의
class PostCard extends HTMLElement {
  constructor() {
    super(); // 반드시 먼저 호출
    // 초기 설정
  }

  // 생명주기 콜백들
  connectedCallback() {
    // DOM에 추가될 때 실행
  }

  disconnectedCallback() {
    // DOM에서 제거될 때 실행
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // 속성이 변경될 때 실행
  }

  static get observedAttributes() {
    // 감시할 속성 목록
    return ['title', 'category', 'date'];
  }
}

// 2. 커스텀 엘리먼트 등록
customElements.define('post-card', PostCard);
```

```html
<!-- 3. HTML에서 사용 -->
<post-card
  title="Python 기초 문법"
  category="Python"
  date="2024-01-15">
</post-card>
```

태그 이름에는 반드시 하이픈(`-`)이 하나 이상 있어야 합니다. 기존 HTML 태그와 충돌을 방지하기 위한 규칙입니다.

---

## 생명주기 콜백

**connectedCallback**

엘리먼트가 DOM에 추가될 때 호출됩니다. 여기서 내부 HTML을 그립니다.

```javascript
class BadgeCount extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <span class="badge">
        ${this.getAttribute('count') || 0}
      </span>
    `;
  }
}
customElements.define('badge-count', BadgeCount);
```

```html
<badge-count count="42"></badge-count>
```

**disconnectedCallback**

엘리먼트가 DOM에서 제거될 때 호출됩니다. 이벤트 리스너, 타이머를 정리하는 곳입니다.

```javascript
class LiveClock extends HTMLElement {
  connectedCallback() {
    this.timerId = setInterval(() => {
      this.textContent = new Date().toLocaleTimeString('ko-KR');
    }, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.timerId); // 메모리 누수 방지
  }
}
customElements.define('live-clock', LiveClock);
```

**attributeChangedCallback + observedAttributes**

감시 중인 속성 값이 바뀔 때 호출됩니다.

```javascript
class AlertBox extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'message'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const type = this.getAttribute('type') || 'info';
    const message = this.getAttribute('message') || '';
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

    this.innerHTML = `
      <div class="alert alert--${type}" role="alert">
        <span aria-hidden="true">${icons[type]}</span>
        <span>${message}</span>
      </div>
    `;
  }
}
customElements.define('alert-box', AlertBox);
```

```html
<alert-box type="success" message="배포가 완료됐습니다."></alert-box>
<alert-box type="error" message="빌드에 실패했습니다."></alert-box>

<script>
  // JavaScript로 속성 변경 → attributeChangedCallback 자동 호출
  document.querySelector('alert-box').setAttribute('type', 'warning');
</script>
```

---

## 속성 vs 프로퍼티

HTML 속성(attribute)과 JavaScript 프로퍼티(property)는 구분해서 관리하는 것이 좋습니다.

```javascript
class ProgressBar extends HTMLElement {
  // 프로퍼티 getter/setter
  get value() {
    return Number(this.getAttribute('value')) || 0;
  }

  set value(val) {
    const clamped = Math.min(100, Math.max(0, Number(val)));
    this.setAttribute('value', clamped);
  }

  static get observedAttributes() {
    return ['value', 'max'];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const value = this.value;
    const max = Number(this.getAttribute('max')) || 100;
    const pct = Math.round((value / max) * 100);

    this.innerHTML = `
      <div class="progress" role="progressbar"
           aria-valuenow="${value}"
           aria-valuemin="0"
           aria-valuemax="${max}">
        <div class="progress__bar" style="width: ${pct}%"></div>
        <span class="progress__label">${pct}%</span>
      </div>
    `;
  }
}
customElements.define('progress-bar', ProgressBar);
```

```html
<progress-bar value="65" max="100"></progress-bar>

<script>
  const bar = document.querySelector('progress-bar');
  bar.value = 80; // setter 호출 → setAttribute → render
</script>
```

---

## 커스텀 이벤트 발생시키기

컴포넌트 내부에서 외부로 신호를 보낼 때 CustomEvent를 씁니다.

```javascript
class LikeButton extends HTMLElement {
  connectedCallback() {
    this.liked = false;
    this.render();
  }

  render() {
    this.innerHTML = `
      <button class="like-btn ${this.liked ? 'liked' : ''}">
        ${this.liked ? '❤️' : '🤍'} 좋아요
      </button>
    `;
    this.querySelector('button').addEventListener('click', () => {
      this.liked = !this.liked;
      this.render();

      // 외부로 이벤트 발생
      this.dispatchEvent(new CustomEvent('like-change', {
        bubbles: true,
        detail: { liked: this.liked }
      }));
    });
  }
}
customElements.define('like-button', LikeButton);
```

```html
<like-button></like-button>

<script>
  document.querySelector('like-button').addEventListener('like-change', (e) => {
    console.log('좋아요 상태:', e.detail.liked);
    // 서버에 전송 등
  });
</script>
```

---

## customElements.whenDefined — 등록 완료 대기

```javascript
// 엘리먼트가 등록될 때까지 기다린 후 사용
customElements.whenDefined('post-card').then(() => {
  console.log('post-card 컴포넌트 사용 가능');
});

// 이미 등록됐는지 확인
const PostCard = customElements.get('post-card');
if (!PostCard) {
  console.log('아직 등록 안 됨');
}
```

---

## 실습: 기술 태그 배지 컴포넌트

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Tech Badge 컴포넌트</title>
  <style>
    tech-badge {
      display: inline-block;
      margin: 4px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid currentColor;
    }
    .badge--python { color: #3776ab; background: #3776ab1a; }
    .badge--javascript { color: #d29922; background: #d299221a; }
    .badge--react { color: #58a6ff; background: #58a6ff1a; }
    .badge--docker { color: #3fb950; background: #3fb9501a; }
  </style>
</head>
<body>

  <tech-badge lang="python">Python</tech-badge>
  <tech-badge lang="javascript">JavaScript</tech-badge>
  <tech-badge lang="react">React</tech-badge>
  <tech-badge lang="docker">Docker</tech-badge>

  <script>
    class TechBadge extends HTMLElement {
      connectedCallback() {
        const lang = this.getAttribute('lang') || 'default';
        const label = this.textContent.trim();
        this.innerHTML = `
          <span class="badge badge--${lang}">${label}</span>
        `;
      }
    }
    customElements.define('tech-badge', TechBadge);
  </script>
</body>
</html>
```

---

## 정리

- `customElements.define('태그명', 클래스)`로 커스텀 엘리먼트를 등록합니다
- 태그 이름에는 반드시 하이픈이 포함돼야 합니다
- `connectedCallback` — DOM 추가 시, `disconnectedCallback` — DOM 제거 시
- `observedAttributes` + `attributeChangedCallback`으로 속성 변화를 감지합니다
- `CustomEvent`로 컴포넌트에서 외부로 이벤트를 발생시킵니다

다음 글에서는 Web Components 2부 — Shadow DOM과 스타일 캡슐화를 다룹니다.