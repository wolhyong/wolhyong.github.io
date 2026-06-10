---
layout: post
title: "자바스크립트 성능 최적화 - 메모이제이션, 디바운싱, 가비지 컬렉션 정리"
description: "자바스크립트 성능 최적화 기법인 메모이제이션, 디바운싱, 쓰로틀링, 가비지 컬렉션 이해를 학습합니다."
date: 2017-01-02 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, performance, optimization, 웹]
---

자바스크립트 애플리케이션의 성능은 사용자 경험에 직접적인 영향을 미칩니다. 핵심 최적화 기법들을 실전 예제와 함께 학습합니다.

## 메모이제이션 (Memoization)

동일한 입력에 대한 결과를 캐싱하여 반복 계산을 방지합니다.

```javascript
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fibonacci = memoize(function(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(40)); // 즉시 계산됨 (캐싱 덕분)
```

## 디바운싱과 쓰로틀링

```javascript
// 디바운스 — 연속 호출 중 마지막 호출 후 일정 시간 대기
function debounce(fn, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 쓰로틀 — 일정 시간 간격으로 최대 1회 호출
function throttle(fn, limit = 200) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 실전 활용
window.addEventListener("resize", throttle(() => {
  console.log("리사이즈 처리");
}, 200));

searchInput.addEventListener("input", debounce((e) => {
  fetchSearchResults(e.target.value);
}, 400));
```

## DOM 조작 최적화

```javascript
// ❌ 문서 fragment 없이 반복 삽입
for (let i = 0; i < 1000; i++) {
  container.appendChild(createItem(i)); // 매번 리플로우 발생
}

// ✅ DocumentFragment 사용
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  fragment.appendChild(createItem(i));
}
container.appendChild(fragment); // 한 번만 리플로우

// ✅ requestIdleCallback으로 백그라운드 작업
function processLargeList(items) {
  let index = 0;
  function processChunk(deadline) {
    while (index < items.length && deadline.timeRemaining() > 0) {
      processItem(items[index++]);
    }
    if (index < items.length) {
      requestIdleCallback(processChunk);
    }
  }
  requestIdleCallback(processChunk);
}
```

## 마무리

- **메모이제이션**으로 반복 계산이 많은 함수를 최적화하세요
- **디바운스**는 검색 입력에, **쓰로틀**은 스크롤/리사이즈에 사용하세요
- DOM 조작은 **배치 처리**하여 리플로우를 최소화하세요
- **requestIdleCallback**으로 무거운 작업을 유휴 시간에 분산하세요

다음 수업에서는 Symbol, BigInt, Generator를 학습합니다!
