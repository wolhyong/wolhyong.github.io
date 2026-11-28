---
layout: post
title: "자바스크립트 비동기 처리 — 이벤트 루프, Promise, async/await, fetch"
description: "자바스크립트가 싱글 스레드로 비동기를 처리하는 원리와 태스크·마이크로태스크 실행 순서, Promise 체이닝, async/await에서 직렬 실행이 되는 함정, fetch 에러 처리까지 정리했습니다."
date: 2026-11-28 12:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, 비동기, promise, async-await, fetch, 이벤트루프]
---

비동기 코드에서 자주 나오는 버그는 문법 실수가 아니라 순서 문제입니다. `await`를 빠뜨려서 `Promise` 객체가 그대로 출력되거나, 반복문 안에서 요청이 병렬로 나가는지 직렬로 나가는지 모른 채 넘어갑니다. 이 글은 실행 순서를 먼저 잡고, Promise와 `async/await`, `fetch`로 이어집니다.

2016년에 올린 비동기 기초, Promise, Fetch API, 이벤트 루프 글과 2024년 비동기 요약 글을 한 편으로 합쳤습니다.

## 동기와 비동기

동기 코드는 한 줄이 끝나야 다음 줄로 갑니다. 비동기 코드는 결과를 기다리는 동안 다른 일을 합니다.

```javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
// A → C → B
```

`setTimeout`의 두 번째 인자가 0이어도 콜백은 즉시 실행되지 않습니다. 현재 실행 중인 코드가 끝난 뒤에 큐에서 꺼내 실행합니다.

## 싱글 스레드와 이벤트 루프

자바스크립트 엔진은 호출 스택 하나를 가집니다. 한 번에 한 함수만 실행합니다. 네트워크 요청, 타이머, 사용자 입력은 엔진이 아니라 브라우저(또는 Node.js)가 처리하고, 끝난 작업의 콜백을 큐에 넣습니다. 이벤트 루프가 스택이 비었을 때 큐에서 다음 작업을 꺼내 실행합니다.

큐는 두 종류로 나뉩니다.

- **태스크 큐(macrotask)**: `setTimeout`, `setInterval`, I/O 콜백, UI 이벤트
- **마이크로태스크 큐**: Promise의 `then`/`catch`/`finally`, `queueMicrotask`, `MutationObserver`

실행 순서는 정해져 있습니다.

1. 현재 동기 코드를 끝까지 실행
2. 마이크로태스크 큐가 빌 때까지 모두 실행
3. 렌더링이 필요하면 렌더링
4. 태스크 큐에서 작업 하나를 꺼내 실행하고 2번으로 돌아감

```javascript
console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => console.log("3"));

queueMicrotask(() => console.log("4"));

console.log("5");

// 1 → 5 → 3 → 4 → 2
```

마이크로태스크가 계속 새로 생기면 태스크 큐는 영원히 차례를 못 받습니다. Promise 체인 안에서 무한히 `then`을 이어 붙이는 코드가 화면을 멈추게 하는 이유입니다.

```javascript
function loop() {
  Promise.resolve().then(loop); // ❌ 렌더링도, 타이머도 실행되지 않음
}
```

### 타이머는 정확하지 않습니다

```javascript
const start = performance.now();
setTimeout(() => console.log(performance.now() - start), 100);
// 100보다 항상 크거나 같고, 앞의 동기 작업이 길면 훨씬 늦어짐
```

`setTimeout`은 "최소 이 시간 뒤에 큐에 넣는다"는 뜻입니다. 정확한 주기가 필요하면 `requestAnimationFrame`이나 `performance.now()` 기준 보정을 씁니다.

### 렌더링 직전에 실행하기

```javascript
element.textContent = "새 값";

requestAnimationFrame(() => {
  // 스타일 계산 전, 다음 프레임 직전
  console.log(element.offsetHeight);
});
```

DOM을 바꾸고 바로 크기를 읽으면 강제 리플로우가 일어납니다. 여러 번 읽고 써야 한다면 읽기를 모아서 처리합니다.

## 콜백

비동기 작업이 끝나면 실행할 함수를 넘기는 방식입니다.

```javascript
function fetchData(callback) {
  setTimeout(() => {
    callback(null, { name: "홍길동" });
  }, 500);
}

fetchData((err, data) => {
  if (err) return console.error(err);
  console.log(data);
});
```

Node.js에서 흔한 형태는 에러를 첫 인자로 받는 콜백입니다. 중첩이 깊어지면 읽기 어려워지고, 에러 처리가 단계마다 흩어집니다.

```javascript
getUser(id, (err, user) => {
  if (err) return handle(err);
  getOrders(user.id, (err, orders) => {
    if (err) return handle(err);
    getDetail(orders[0].id, (err, detail) => {
      if (err) return handle(err);
      console.log(detail);
    });
  });
});
```

이 구조를 정리하려고 나온 것이 Promise입니다.

## Promise

Promise는 미래에 끝날 작업의 결과를 담는 객체입니다. 상태는 세 가지입니다.

| 상태 | 의미 |
|------|------|
| pending | 아직 끝나지 않음 |
| fulfilled | 성공적으로 완료 |
| rejected | 실패 |

한 번 fulfilled나 rejected가 되면 상태는 바뀌지 않습니다.

```javascript
const promise = new Promise((resolve, reject) => {
  const ok = true;
  if (ok) resolve("성공");
  else reject(new Error("실패"));
});

promise
  .then((value) => console.log(value))
  .catch((err) => console.error(err))
  .finally(() => console.log("항상 실행"));
```

`then`에서 값을 반환하면 다음 `then`으로 전달되고, Promise를 반환하면 그 Promise가 끝날 때까지 기다립니다.

```javascript
fetchUser(1)
  .then((user) => fetchPosts(user.id))
  .then((posts) => posts.filter((p) => p.published))
  .then((published) => console.log(published.length))
  .catch((err) => console.error("실패:", err.message));
```

`catch`는 체인 어디에서든 발생한 에러를 잡습니다. 중간에 `catch`를 넣으면 그 뒤 체인은 정상 흐름으로 돌아갑니다.

### 여러 Promise 다루기

```javascript
// 모두 성공해야 결과를 받음 — 하나라도 실패하면 reject
const [users, posts] = await Promise.all([
  fetch("/api/users").then((r) => r.json()),
  fetch("/api/posts").then((r) => r.json()),
]);

// 모두 기다리되 성공/실패를 각각 받음
const results = await Promise.allSettled([taskA(), taskB()]);
results.forEach((r) => {
  if (r.status === "fulfilled") console.log(r.value);
  else console.error(r.reason);
});

// 가장 먼저 끝난 것
const fastest = await Promise.race([fetch("/api/a"), fetch("/api/b")]);

// 가장 먼저 성공한 것 (실패는 무시)
const firstOk = await Promise.any([mirror1(), mirror2()]);
```

`Promise.all`은 하나가 실패하면 이미 시작된 다른 요청도 결과를 버립니다. 일부만 실패해도 나머지를 살려야 한다면 `allSettled`를 씁니다.

## async/await

`async` 함수는 항상 Promise를 반환합니다. `await`는 Promise가 처리될 때까지 함수 실행을 멈춥니다. 멈추는 것은 그 함수뿐이고, 다른 코드는 계속 실행됩니다.

```javascript
async function loadUser(id) {
  try {
    const user = await fetchUser(id);
    const posts = await fetchPosts(user.id);
    return { user, posts };
  } catch (err) {
    console.error("불러오기 실패:", err.message);
    throw err;
  }
}
```

`try/catch`로 동기 코드와 같은 방식으로 에러를 다룰 수 있는 것이 가장 큰 장점입니다.

### 직렬과 병렬

서로 의존하지 않는 요청을 `await`로 나란히 쓰면 순서대로 기다립니다.

```javascript
// ❌ 직렬 — 1초 + 1초
const users = await fetchUsers();
const posts = await fetchPosts();

// ✅ 병렬 — 약 1초
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);
```

의존 관계가 있으면 직렬이 맞습니다. `user.id`가 있어야 게시글을 요청할 수 있는 경우가 그렇습니다.

### 반복문에서의 await

`forEach`는 콜백의 Promise를 기다리지 않습니다.

```javascript
// ❌ 모든 요청이 동시에 나가고, 끝나는 순서는 보장되지 않음
ids.forEach(async (id) => {
  await save(id);
});

// ✅ 순서를 지켜야 할 때
for (const id of ids) {
  await save(id);
}

// ✅ 동시에 보내도 될 때
await Promise.all(ids.map((id) => save(id)));
```

### await를 빠뜨리면

```javascript
async function getData() {
  return fetch("/api/data");
}

const result = getData();
console.log(result); // Promise { <pending> }

const data = await getData(); // Response 객체
const json = await data.json(); // 실제 데이터
```

`fetch`는 응답 헤더를 받는 즉시 resolve됩니다. 본문을 읽으려면 `json()`, `text()`, `blob()`을 한 번 더 기다려야 합니다.

## fetch

```javascript
async function getUsers() {
  const response = await fetch("https://jsonplaceholder.typicode.com/users");

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

`fetch`는 404나 500에서 reject하지 않습니다. 네트워크 자체가 실패했을 때만 reject합니다. 그래서 `response.ok`를 직접 확인해야 합니다.

### POST 요청

```javascript
async function createUser(user) {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

본문을 JSON으로 보낼 때는 `Content-Type`을 반드시 맞춥니다. 이 헤더가 없으면 서버가 폼 데이터로 해석하는 경우가 있습니다.

### 타임아웃과 취소

```javascript
async function request(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    if (err.name === "AbortError") throw new Error("요청 시간이 초과되었습니다");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
```

검색어 입력처럼 이전 요청을 취소해야 하는 경우에도 `AbortController`를 씁니다. 새 요청을 보내기 전에 이전 컨트롤러의 `abort()`를 호출하면 늦게 도착한 응답이 화면을 덮어쓰는 문제를 막을 수 있습니다.

## 자주 만나는 문제

**1. `await` 없이 Promise를 비교**

```javascript
if (fetchUser(1)) { }          // 항상 true — Promise는 객체
if (await fetchUser(1)) { }    // 실제 결과
```

**2. `try/catch` 밖에서 만든 Promise**

```javascript
// ❌ catch가 잡지 못함
async function bad() {
  const p = fetchData();   // reject되면 unhandled rejection
  await somethingElse();
  return p;
}

// ✅ await한 자리에서 처리
async function good() {
  const p = fetchData();
  try {
    await somethingElse();
    return await p;
  } catch (err) {
    console.error(err);
  }
}
```

**3. 처리되지 않은 rejection**

```javascript
window.addEventListener("unhandledrejection", (e) => {
  console.error("처리되지 않은 Promise:", e.reason);
});
```

Node.js에서는 `process.on("unhandledRejection", ...)`으로 잡습니다. 로그를 남기되 에러를 삼키지는 않도록 주의합니다.

**4. CORS 오류**

브라우저 콘솔에 `blocked by CORS policy`가 나오면 요청 자체는 나갔지만 응답을 읽지 못한 것입니다. 서버에서 `Access-Control-Allow-Origin` 헤더를 내려줘야 하고, 클라이언트 코드로는 우회할 수 없습니다. 프록시를 두거나 같은 출처에서 호출합니다.

**5. `JSON.parse` 실패**

응답이 HTML 에러 페이지인 경우가 많습니다. `response.headers.get("content-type")`을 먼저 확인하면 원인을 빨리 찾습니다.

```javascript
const type = response.headers.get("content-type") ?? "";
return type.includes("application/json") ? response.json() : response.text();
```

**6. `Promise.all` 하나가 실패해 전체가 멈춤**

일부 실패를 허용해야 한다면 `allSettled`로 바꾸고 `status`를 확인합니다.

## 정리

- 동기 코드가 끝나고 마이크로태스크가 모두 실행된 뒤에 태스크가 실행됩니다.
- `setTimeout`은 최소 지연이고, 정확한 주기를 보장하지 않습니다.
- `fetch`는 HTTP 에러로 reject되지 않습니다. `response.ok`를 확인합니다.
- 독립적인 요청은 `Promise.all`로 병렬 처리하고, 의존 관계가 있으면 직렬로 둡니다.
- `forEach` 안의 `async` 콜백은 기다려지지 않습니다. `for...of`나 `Promise.all`을 씁니다.

다음 글에서는 [자바스크립트 ES6+ 문법](/2026/11/28/javascript-es6-modern/)에서 구조 분해, Map·Set, 옵셔널 체이닝, 모듈을 다룹니다.
