---
layout: post
title: "HTML template 태그 완전 정리 — 동적 콘텐츠 생성과 재사용 패턴"
description: "HTML5 template 태그로 페이지 로드 시 렌더링되지 않는 HTML 조각을 정의하고 JavaScript로 복제·삽입하는 방법을 정리합니다. cloneNode와 importNode 차이, slot과의 조합, 카드 목록·모달·알림 컴포넌트 실전 예제까지 다룹니다."
date: 2015-02-14 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 29
tags: [html5, template, 동적콘텐츠, DocumentFragment, cloneNode, 컴포넌트패턴]
lang: ko
---

같은 구조의 카드 컴포넌트를 여러 개 동적으로 만들 때, JavaScript로 HTML 문자열을 직접 조합하면 코드가 지저분해지고 XSS 보안 위험도 있습니다. `<template>` 태그는 이 문제를 깔끔하게 해결합니다.

---

## template 태그란

페이지 로드 시 렌더링되지 않는 HTML 조각을 정의하는 태그입니다.

```html
<template id="post-card">
  <article class="post-card">
    <img class="thumbnail" src="" alt="">
    <div class="content">
      <span class="category"></span>
      <h2 class="title"><a href="#"></a></h2>
      <p class="excerpt"></p>
      <time class="date"></time>
    </div>
  </article>
</template>
```

이 코드는 DOM에 존재하지만 **화면에 아무것도 표시되지 않습니다**. 스크립트에서 필요할 때 꺼내서 쓰는 틀입니다.

---

## template 사용 방법

```javascript
// 1. template 요소 가져오기
const template = document.getElementById('post-card');

// 2. 내용 복제 (true = 자식 요소 포함 깊은 복제)
const clone = template.content.cloneNode(true);

// 3. 데이터 채우기
clone.querySelector('.category').textContent = 'Python';
clone.querySelector('.title a').textContent = 'Python 기초 문법 정리';
clone.querySelector('.title a').href = '/post/python-basics';
clone.querySelector('.excerpt').textContent = '변수, 조건문, 반복문을 예제로 정리합니다.';
clone.querySelector('.date').textContent = '2024.01.15';
clone.querySelector('.date').setAttribute('datetime', '2024-01-15');
clone.querySelector('.thumbnail').src = '/images/python-thumb.jpg';
clone.querySelector('.thumbnail').alt = 'Python 기초 강의 썸네일';

// 4. DOM에 삽입
document.getElementById('post-list').appendChild(clone);
```

---

## 실전 예제 — 게시물 목록 동적 생성

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>게시물 목록</title>
  <style>
    .post-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .post-card { border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
    .post-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
    .post-card .content { padding: 16px; }
    .category { font-size: 0.75rem; color: #58a6ff; }
    .title { font-size: 1rem; margin: 8px 0; }
    .excerpt { font-size: 0.875rem; color: #8b949e; }
    .date { font-size: 0.75rem; color: #6e7681; }
  </style>
</head>
<body>
  <h1>최신 글</h1>
  <div id="post-list" class="post-grid"></div>

  <!-- 카드 템플릿 -->
  <template id="post-card-template">
    <article class="post-card">
      <img class="thumbnail" src="" alt="" loading="lazy">
      <div class="content">
        <span class="category"></span>
        <h2 class="title"><a href="#"></a></h2>
        <p class="excerpt"></p>
        <time class="date"></time>
      </div>
    </article>
  </template>

  <script>
    const posts = [
      {
        title: 'Python 기초 문법 정리',
        category: 'Python',
        excerpt: '변수, 조건문, 반복문을 실전 예제와 함께 배웁니다.',
        date: '2024-01-15',
        dateDisplay: '2024.01.15',
        href: '/post/python-basics',
        thumbnail: '/images/python-thumb.jpg',
        thumbnailAlt: 'Python 강의 썸네일'
      },
      {
        title: 'React useEffect 완전 정리',
        category: 'React',
        excerpt: 'useEffect의 실행 시점과 클린업 함수를 정리합니다.',
        date: '2024-01-16',
        dateDisplay: '2024.01.16',
        href: '/post/react-useeffect',
        thumbnail: '/images/react-thumb.jpg',
        thumbnailAlt: 'React 강의 썸네일'
      },
      {
        title: 'Docker 컨테이너 기초',
        category: 'Docker',
        excerpt: '도커 이미지, 컨테이너, 볼륨 개념을 처음부터 설명합니다.',
        date: '2024-01-17',
        dateDisplay: '2024.01.17',
        href: '/post/docker-basics',
        thumbnail: '/images/docker-thumb.jpg',
        thumbnailAlt: 'Docker 강의 썸네일'
      }
    ];

    const template = document.getElementById('post-card-template');
    const list = document.getElementById('post-list');

    posts.forEach(post => {
      const clone = template.content.cloneNode(true);

      clone.querySelector('.thumbnail').src = post.thumbnail;
      clone.querySelector('.thumbnail').alt = post.thumbnailAlt;
      clone.querySelector('.category').textContent = post.category;
      clone.querySelector('.title a').textContent = post.title;
      clone.querySelector('.title a').href = post.href;
      clone.querySelector('.excerpt').textContent = post.excerpt;
      clone.querySelector('.date').textContent = post.dateDisplay;
      clone.querySelector('.date').setAttribute('datetime', post.date);

      list.appendChild(clone);
    });
  </script>
</body>
</html>
```

---

## DocumentFragment로 성능 최적화

여러 요소를 한꺼번에 삽입할 때 DocumentFragment를 사용하면 DOM 조작 횟수를 줄여 성능을 개선할 수 있습니다.

```javascript
const fragment = document.createDocumentFragment();
const template = document.getElementById('post-card-template');

posts.forEach(post => {
  const clone = template.content.cloneNode(true);
  // ... 데이터 채우기 ...
  fragment.appendChild(clone);  // fragment에 누적
});

// DOM 업데이트는 딱 한 번만
document.getElementById('post-list').appendChild(fragment);
```

---

## 모달 다이얼로그 템플릿

```html
<template id="modal-template">
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-box">
      <header class="modal-header">
        <h2 id="modal-title" class="modal-title"></h2>
        <button class="modal-close" aria-label="닫기">✕</button>
      </header>
      <div class="modal-body"></div>
      <footer class="modal-footer">
        <button class="btn-cancel">취소</button>
        <button class="btn-confirm">확인</button>
      </footer>
    </div>
  </div>
</template>

<script>
function openModal({ title, body, onConfirm }) {
  const template = document.getElementById('modal-template');
  const modal = template.content.cloneNode(true).querySelector('.modal-overlay');

  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-body').innerHTML = body;
  modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('.btn-confirm').addEventListener('click', () => {
    onConfirm?.();
    modal.remove();
  });

  document.body.appendChild(modal);
  modal.querySelector('.btn-confirm').focus();
}
</script>
```

---

## innerHTML vs template 비교

```javascript
// ❌ innerHTML 방식: XSS 위험, 느림
container.innerHTML = `
  <div class="card">
    <h2>${userInput}</h2>  // userInput에 <script> 가 있으면 실행됨!
  </div>
`;

// ✅ template 방식: 안전, 빠름
const clone = template.content.cloneNode(true);
clone.querySelector('h2').textContent = userInput;  // textContent는 HTML을 실행하지 않음
container.appendChild(clone);
```

사용자 입력 데이터를 DOM에 삽입할 때는 반드시 `textContent`를 사용해야 XSS(Cross-Site Scripting) 공격을 방지할 수 있습니다.

---

## 정리

- `<template>` 태그 안의 내용은 페이지 로드 시 렌더링되지 않습니다
- `template.content.cloneNode(true)`로 복제해서 사용합니다
- 사용자 데이터는 `textContent`로 삽입해 XSS를 방지합니다
- `DocumentFragment`로 여러 요소를 한 번에 삽입해 성능을 높입니다

다음 글에서는 HTML 성능 최적화 — preload, prefetch, 지연 로딩 전략을 다룹니다.