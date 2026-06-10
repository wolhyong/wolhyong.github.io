---
layout: post
title: "자바스크립트 Promise와 async/await - 알아보는 비동기 처리"
description: "Promise의 3가지 상태, 체이닝, 에러 처리, async/await 문법을 실전 예제와 함께 깊게 이해합니다."
date: 2016-09-26 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, promise, async-await, 웹]
---

Promise와 async/await는 콜백 지옥을 해결하고 비동기 코드를 동기처럼 읽히게 만드는 현대적인 비동기 처리 방법입니다.

## Promise의 3가지 상태

```javascript
const myPromise = new Promise((resolve, reject) => {
  const success = true;
  if (success) {
    resolve("성공!");
  } else {
    reject(new Error("실패!"));
  }
});

myPromise
  .then(result => console.log(result))  // "성공!"
  .catch(err => console.error(err))     // 에러 발생 시
  .finally(() => console.log("항상 실행")); // 성공/실패 무관
```

Promise는 세 가지 상태를 가집니다:
- **Pending**: 아직 완료되지 않음
- **Fulfilled**: 성공적으로 완료됨
- **Rejected**: 에러로 인해 실패함

## Promise 체이닝

```javascript
function getUser(id) {
  return fetch(`/api/users/${id}`).then(res => res.json());
}

function getPosts(userId) {
  return fetch(`/api/posts?user=${userId}`).then(res => res.json());
}

// Promise 체이닝
getUser(1)
  .then(user => getPosts(user.id))
  .then(posts => console.log(posts))
  .catch(err => console.error("에러:", err));
```

## Promise.all과 Promise.race

```javascript
// Promise.all — 모든 Promise가 완료될 때까지 대기
const [users, posts] = await Promise.all([
  fetch("/api/users").then(r => r.json()),
  fetch("/api/posts").then(r => r.json())
]);

// Promise.race — 가장 먼저 완료된 Promise의 결과 사용
const result = await Promise.race([
  fetch("/api/fast"),
  fetch("/api/slow")
]);
```

## async/await — 가장 현대적인 방식

```javascript
async function loadUserData(userId) {
  try {
    const user = await getUser(userId);
    const posts = await getPosts(user.id);
    return { user, posts };
  } catch (err) {
    console.error("데이터 로드 실패:", err.message);
    throw err; // 에러를 상위로 전파
  }
}

// 사용
const data = await loadUserData(1);
```

`async` 함수는 항상 Promise를 반환합니다. `await`은 Promise가 처리될 때까지 함수 실행을 일시 정지시킵니다.

## 실전 팁

```javascript
// 병렬 처리 — 시간 단축
async function loadAll() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);
}

// 에러 처리 — try/catch 또는 .catch()
async function riskyOperation() {
  try {
    return await fetchData();
  } catch (err) {
    return getFallbackData(); // 대체 데이터 반환
  }
}
```

## 마무리

- **async/await** 가 가장 직관적이고 실무에서 자주 사용됩니다
- **`Promise.all`** 로 여러 요청을 병렬 처리하면 성능이 향상됩니다
- 에러 처리는 반드시 **`try/catch`** 나 `.catch()`로 감싸세요
- `await`은 Promise를 기다리므로, 독립적인 작업은 병렬로 실행하세요

다음 수업에서는 Fetch API를 활용한 HTTP 요청 방법을 학습합니다!
