---
layout: post
title: "자바스크립트 이벤트 루프 - 태스크 큐, 마이크로태스크, 렌더링 순서 완벽 이해"
description: "자바스크립트 이벤트 루프의 동작 원리, 태스크 큐와 마이크로태스크 큐의 차이, 렌더링 타이밍을 깊게 이해합니다."
date: 2016-10-24 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, event-loop, performance, 웹]
---

이벤트 루프는 자바스크립트가 싱글 스레드임에도 비동기 처리를 할 수 있게 만드는 핵심 메커니즘입니다. 이 동작 원리를 이해하면 타이밍 관련 버그를 예방할 수 있습니다.

## 싱글 스레드와 이벤트 루프

자바스크립트 엔진(V8 등)은 단 하나의 **호출 스택(Call Stack)** 을 가집니다. 이벤트 루프는 이 스택이 비어있을 때마다 큐에서 다음 작업을 꺼내 실행합니다.

```javascript
console.log("1");           // 동기 — 즉시 실행
setTimeout(() => console.log("2"), 0); // 비동기 — 태스크 큐로 이동
Promise.resolve().then(() => console.log("3")); // 마이크로태스크 큐
console.log("4");           // 동기 — 즉시 실행

// 출력 순서: 1 → 4 → 3 → 2
```

## 태스크 큐 vs 마이크로태스크 큐

```javascript
// 태스크 큐 (Task Queue / Macrotask Queue)
setTimeout(() => console.log("태스크 1"), 0);
setInterval(() => console.log("태스크 2"), 1000);

// 마이크로태스크 큐 (Microtask Queue)
Promise.resolve().then(() => console.log("마이크로태스크 1"));
queueMicrotask(() => console.log("마이크로태스크 2"));
```

**실행 순서**: 동기 코드 → 마이크로태스크 큐 전체 → 태스크 큐 1개

마이크로태스크는 태스크보다 **우선순위**가 높습니다. 마이크로태스크 큐가 비어야 비로소 태스크 큐의 작업이 실행됩니다.

## 렌더링 타이밍

```javascript
// requestAnimationFrame — 다음 렌더링 전에 실행
requestAnimationFrame(() => {
  // DOM 변경 후 브라우저가 다시 그리기 전에 실행
  console.log("렌더링 직전!");
});

// 렌더링 파이프라인
// 1. JavaScript 실행
// 2. 스타일 계산
// 3. 레이아웃
// 4. 페인트
// 5. 합성
```

## 실전 — 타이밍 버그 예방

```javascript
// ❌ setTimeout(0)으로 충분하지 않은 경우
element.innerHTML = newContent;
setTimeout(() => {
  //DOM이 아직 업데이트되지 않았을 수 있음
  element.offsetHeight; // 강제 리플로우
}, 0);

// ✅ requestAnimationFrame 사용
element.innerHTML = newContent;
requestAnimationFrame(() => {
  //DOM 업데이트 후 안전하게 접근
});
```

## 마무리

- 자바스크립트는 **싱글 스레드**이지만, 이벤트 루프로 비동기를 처리합니다
- **마이크로태스크**(Promise)는 **태스크**(setTimeout)보다 우선 실행됩니다
- DOM 업데이트 후 시각적 반영이 필요하면 **`requestAnimationFrame`** 을 사용하세요
- 무거운 동기 작업은 이벤트 루프를 블로킹하므로 주의하세요

다음 수업에서는 정규표현식의 문법과 활용법을 학습합니다!
