---
layout: post
title: "자바스크립트 비동기 기초 - 콜백, 타이머, 이벤트 루프 이해하기"
description: "자바스크립트의 비동기 프로그래밍 기초 개념인 콜백 함수, setTimeout, setInterval과 이벤트 루프를 쉽게 설명합니다."
date: 2016-09-19 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, async, callbacks, 웹]
---

자바스크립트는 싱글 스레드 언어이지만, 비동기 처리를 통해 여러 작업을 효율적으로 수행합니다. 비동기의 동작 원리를 이해하는 것이 자바스크립트 실력 향상의 핵심입니다.

## 동기 vs 비동기

```javascript
// 동기 — 코드가 순서대로 실행됨
console.log("1");
console.log("2");
console.log("3");
// 1, 2, 3 순서로 출력

// 비동기 — 코드가 순서대로 실행되지 않음
console.log("A");
setTimeout(() => console.log("B"), 0); // 0ms 후에도 큐에 대기
console.log("C");
// A, C, B 순서로 출력!
```

`setTimeout`은 0ms라도 콜백 함수를 **태스크 큐**에 넣고, 현재 실행 중인 코드가 모두 끝난 후 실행됩니다.

## 콜백 함수 (Callback)

비동기 작업 완료 후 실행할 함수를 전달하는 패턴입니다.

```javascript
function fetchData(callback) {
  setTimeout(() => {
    const data = { name: "홍길동" };
    callback(data);
  }, 1000);
}

fetchData((data) => {
  console.log(data); // 1초 후: { name: "홍길동" }
});
```

## 콜백 지옥과 그 한계

```javascript
// 콜백 지옥 (Callback Hell)
getUser(id, (user) => {
  getOrders(user.id, (orders) => {
    getOrderDetail(orders[0].id, (detail) => {
      console.log(detail);
      // 점점 더 깊어지는 구조...
    });
  });
});
```

콜백 지옥은 가독성이 떨어지고, 에러 처리가 어렵습니다. 이를 해결하기 위해 등장한 것이 **Promise**와 **async/await**입니다.

## setTimeout과 setInterval

```javascript
// 특정 시간 후 한 번 실행
const timer = setTimeout(() => {
  console.log("1초 후 실행");
}, 1000);

clearTimeout(timer); // 실행 전 취소

// 주기적으로 반복 실행
let count = 0;
const interval = setInterval(() => {
  count++;
  console.log(`${count}초 경과`);
  if (count >= 5) clearInterval(interval);
}, 1000);
```

## 마무리

- 자바스크립트는 **싱글 스레드**이지만, 이벤트 루프로 비동기를 처리합니다
- **콜백 함수**는 비동기 패턴의 기반이지만, 콜백 지옥에 빠지기 쉽습니다
- **`setTimeout`** / **`setInterval`** 은 타이밍 제어에 유용하지만, 정확한 시간 보장은 아닙니다
- 비동기의 복잡함은 **Promise**와 **async/await**로 해결할 수 있습니다

다음 수업에서는 Promise와 async/await를 본격적으로 다룹니다!
