---
layout: post
title: "JavaScript 비동기 처리 완벽 가이드 - Promise, async/await"
description: "JavaScript의 비동기 처리 방식인 콜백, Promise, async/await를 예제와 함께 완벽하게 이해합니다."
date: 2024-02-20 14:00:00 +0900
category: "JavaScript"
tags: [javascript, async, promise, 비동기]
---

JavaScript에서 비동기 처리는 핵심 개념 중 하나입니다. 처음에는 이해하기 어렵지만, 차근차근 살펴보면 어렵지 않습니다.

## 콜백(Callback)에서 시작

초기 JavaScript에서는 비동기 처리를 콜백 함수로 했습니다.

```javascript
function fetchData(callback) {
  setTimeout(() => {
    callback(null, { name: "GHW", role: "developer" });
  }, 1000);
}

fetchData((err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data); // { name: "GHW", role: "developer" }
});
```

하지만 콜백이 중첩되면 **콜백 지옥**이 발생합니다.

## Promise로 개선하기

ES6에서 Promise가 도입되어 비동기 코드를 더 깔끔하게 작성할 수 있게 되었습니다.

```javascript
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: "GHW" });
      } else {
        reject(new Error("유효하지 않은 ID"));
      }
    }, 1000);
  });
}

fetchUser(1)
  .then(user => console.log(user))
  .catch(err => console.error(err));
```

## async/await - 가장 현대적인 방식

`async/await`는 Promise를 기반으로 하되, 동기 코드처럼 읽히도록 만들어줍니다.

```javascript
async function getUser(id) {
  try {
    const user = await fetchUser(id);
    console.log(user);
    return user;
  } catch (err) {
    console.error("에러:", err.message);
  }
}

getUser(1);
```

## 병렬 처리 - Promise.all

여러 비동기 작업을 동시에 실행할 때는 `Promise.all`을 사용합니다.

```javascript
async function loadAll() {
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts()
  ]);
  
  return { users, posts };
}
```

## 마무리

- **콜백**: 간단하지만 중첩되면 가독성이 떨어진다.
- **Promise**: 체이닝으로 콜백 지옥을 해결한다.
- **async/await**: 가장 읽기 쉽고 현대적인 방식이다.

새 프로젝트에서는 `async/await`를 기본으로 사용하고, 병렬 처리가 필요할 때 `Promise.all`을 활용하세요!
