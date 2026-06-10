---
layout: post
title: "자바스크립트 Fetch API - HTTP 요청, JSON 처리, 에러 핸들링 정리"
description: "Fetch API로 GET, POST 요청을 보내고, JSON 응답을 처리하며, 실전 에러 핸들링 패턴을 학습합니다."
date: 2016-10-03 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, fetch, api, 웹]
---

Fetch API는 브라우저에서 HTTP 요청을 보내는 현대적인 인터페이스입니다. XMLHttpRequest의 복잡한 구조를 대체하고 Promise 기반으로 깔끔하게 동작합니다.

## 기본 GET 요청

```javascript
async function getUsers() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const users = await response.json();
    console.log(users);
  } catch (err) {
    console.error("요청 실패:", err.message);
  }
}
```

**핵심**: `fetch`는 HTTP 에러(404, 500 등)를reject하지 않습니다. `response.ok`를 직접 확인해야 합니다.

## POST 요청 보내기

```javascript
async function createUser(userData) {
  const response = await fetch("https://jsonplaceholder.typicode.com/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData)
  });

  const newUser = await response.json();
  return newUser;
}

createUser({ name: "홍길동", email: "hong@example.com" });
```

## 실전 에러 핸들링 패턴

```javascript
async function apiRequest(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API 에러 (${response.status}): ${errorBody}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("요청 시간 초과");
    }
    throw err;
  }
}
```

## 요청 옵션 정리

| 옵션 | 설명 | 예시 |
|------|------|------|
| `method` | HTTP 메서드 | `"GET"`, `"POST"`, `"PUT"`, `"DELETE"` |
| `headers` | 요청 헤더 | `{ "Content-Type": "application/json" }` |
| `body` | 요청 본문 | `JSON.stringify(data)` |
| `signal` | AbortController 시그널 | `controller.signal` |

## 마무리

- **`fetch`** 는 기본적으로 GET 요청이며, Promise를 반환합니다
- HTTP 에러는 **`response.ok`** 를 직접 확인하여 처리하세요
- **AbortController**로 타임아웃이나 사용자 취소를 구현하세요
- **POST/PUT** 요청 시 `Content-Type` 헤더를 반드시 설정하세요

다음 수업에서는 localStorage, sessionStorage 등 웹 스토리지를 학습합니다!
