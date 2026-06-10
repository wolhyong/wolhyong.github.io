---
layout: post
title: "Web Components 1부 — Custom Elements로 나만의 HTML 태그 만들기"
description: "Web Components의 Custom Elements는 어떻게 만드나요? HTMLElement 상속, 생명주기 콜백(connectedCallback·disconnectedCallback·attributeChangedCallback), observedAttributes, 자율형과 확장형 커스텀 엘리먼트의 차이를 예제와 함께 다룹니다."
date: 2015-08-24 00:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 34
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

## 실제로 실행해보기: 컴포넌트가 동작하는 흐름

직접 브라우저에서 개발자 도구를 열고 `<alert-box type="success" message="완료"></alert-box>`를 콘솔에 추가해보세요. 컴포넌트가 실시간으로 DOM에 추가되는 것을 볼 수 있습니다.

그 다음 콘솔에서 `document.querySelector('alert-box').setAttribute('type', 'warning')`를 실행해보면 컴포넌트의 스타일이 즉시 바뀝니다. 이게 `attributeChangedCallback`이 실시간으로 호출되기 때문입니다.

---

## 핵심

- `customElements.define('태그명', 클래스)`로 커스텀 엘리먼트를 등록합니다
- 태그 이름에는 반드시 하이픈이 포함돼야 합니다
- `connectedCallback` — DOM 추가 시, `disconnectedCallback` — DOM 제거 시
- `observedAttributes` + `attributeChangedCallback`으로 속성 변화를 감지합니다
- `CustomEvent`로 컴포넌트에서 외부로 이벤트를 발생시킵니다

다음 글에서는 Web Components 2부 — Shadow DOM과 스타일 캡슐화를 다룹니다.


## 실전 예제로 이해하기

HTML의 Web Components 1부 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 Web Components 1부을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Components 1부 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>Web Components 1부에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 Web Components 1부을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. Web Components 1부 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 Web Components 1부을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
