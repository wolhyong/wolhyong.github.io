---
layout: post
title: "자바스크립트 ES6+ 주요 기능 - 구조 분해, 스프레드, 템플릿 리터럴 살펴보기"
description: "ES6부터 최신 자바스크립트까지 추가된 주요 기능들을 실전 예제와 함께 정리합니다."
date: 2016-10-17 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, es6, modern-js, 웹]
---

ES6(ECMAScript 2015) 이후 자바스크립트는 많은 문법적 개선을 이루었습니다. 가장 자주 사용되는 기능들을 핵심 위주로 정리합니다.

## 구조 분해 할당 (Destructuring)

```javascript
// 배열 구조 분해
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first=1, second=2, rest=[3,4,5]

// 객체 구조 분해
const { name, age, job = "개발자" } = { name: "홍길동", age: 25 };
// name="홍길동", age=25, job="개발자" (기본값 적용)

// 함수 매개변수에서 활용
function greet({ name, greeting = "안녕" }) {
  return `${greeting}, ${name}!`;
}
```

## 스프레드 / 레스트 연산자

```javascript
// 스프레드 — 배열/객체를 펼침
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 }; // { a: 1, b: 2, c: 3 }

// 레스트 — 나머지 매개변수를 배열로 모음
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
```

## 템플릿 리터럴

```javascript
const name = "개발자";
const msg = `안녕하세요, ${name}님!
여러 줄 문자도 편하게 작성할 수 있습니다.`;

// 태그드 템플릿 (보안에 활용)
function safeHTML(strings, ...values) {
  return strings.reduce((result, str, i) =>
    result + str + (values[i] || "").replace(/</g, "&lt;"), ""
  );
}
```

## 옵셔널 체이닝과 널 병합

```javascript
// 옵셔널 체이닝 (?.)
const street = user?.address?.street; // null/undefined이면 undefined 반환

// 널 병합 연산자 (??)
const name = input ?? "기본값"; // input이 null/undefined일 때만 기본값

// 차이점
const value1 = 0 || "기본값";  // "기본값" (0은 falsy)
const value2 = 0 ?? "기본값";  // 0 (null/undefined만 기본값 적용)
```

## 기타 유용한 기능

```javascript
// Object.entries / keys / values
const entries = Object.entries({ a: 1, b: 2 }); // [["a",1], ["b",2]]

// Array.from
const divs = Array.from(document.querySelectorAll("div"));

// null 병합 할당 (??=)
let config = null;
config ??= {}; // config가 null이면 빈 객체 할당

// Logical Assignment (&&=, ||=)
let user = null;
user ||= { name: "게스트" }; // falsy이면 할당
```

## 마무리

- **구조 분해**와 **스프레드**는 코드를 대폭 줄여줍니다
- **옵셔널 체이닝**은 null 체크 코드를 간결하게 만듭니다
- **널 병합(??)**은 falsy 값을 구분하여 처리할 때 유용합니다
- 최신 브라우저에서는 대부분의 ES6+ 기능이 지원됩니다

다음 수업에서는 이벤트 루프와 태스크 큐의 동작 원리를 심화 학습합니다!
