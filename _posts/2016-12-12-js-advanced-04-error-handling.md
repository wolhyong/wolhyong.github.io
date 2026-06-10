---
layout: post
title: "자바스크립트 에러 처리 - try/catch, 커스텀 에러, 에러 핸들링 베스트 프랙티스"
description: "자바스크립트 에러 처리 메커니즘, 커스텀 에러 클래스, 비동기 에러 핸들링, 전역 에러 핸들링까지 실습 정리를 학습합니다."
date: 2016-12-12 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, error-handling, debugging, 웹]
---

안정적인 애플리케이션을 만들려면 에러를 적절히 발생시키고, 잡아내고, 복구하는 과정이 필요합니다.

## try / catch / finally

```javascript
try {
  const data = JSON.parse(invalidJSON);
} catch (err) {
  console.error("JSON 파싱 실패:", err.message);
  console.error("위치:", err.stack);
} finally {
  console.log("항상 실행됨 — 리소스 정리에 활용");
}
```

`catch` 블록의 `err` 객체는 `message`, `name`, `stack` 속성을 가집니다.

## 커스텀 에러

```javascript
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

function validateAge(age) {
  if (typeof age !== "number") {
    throw new ValidationError("age", "숫자여야 합니다");
  }
  if (age < 0 || age > 150) {
    throw new ValidationError("age", "0~150 사이여야 합니다");
  }
  return true;
}

try {
  validateAge(-5);
} catch (err) {
  if (err instanceof ValidationError) {
    console.error(`${err.field}: ${err.message}`);
  } else {
    throw err; // 예상치 못한 에러는 재발생
  }
}
```

## 비동기 에러 처리

```javascript
// async/await에서의 에러 처리
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error("데이터 로드 실패:", err.message);
    return null;
  }
}

// Promise에서의 에러 처리
fetch(url)
  .then(res => res.json())
  .catch(err => console.error(err));

// 전역 비동기 에러 핸들링
window.addEventListener("unhandledrejection", (e) => {
  console.error("처리되지 않은 Promise 거부:", e.reason);
  e.preventDefault(); // 콘솔 에러 숨김
});
```

## 전역 에러 핸들링

```javascript
// 처리되지 않은 에러
window.addEventListener("error", (e) => {
  console.error("전역 에러:", e.message, e.filename, e.lineno);
});

// 리소스 로드 에러
document.addEventListener("error", (e) => {
  if (e.target.tagName === "IMG") {
    e.target.src = "/images/placeholder.png";
  }
}, true);
```

## 마무리

- **`try/catch`** 로 예상 가능한 에러를 처리하세요
- **커스텀 에러 클래스**로 도메인별 에러를 구분하세요
- **`finally`** 로 리소스 정리(파일 닫기, 연결 해제 등)를 하세요
- 비동기 에러는 **`try/catch`** + **`async/await`** 조합이 가장 깔끔합니다
- 전역 에러 핸들링으로 런타임 에러를 놓치지 마세요

다음 수업에서는 자바스크립트 모듈 시스템(ES Modules)을 학습합니다!
