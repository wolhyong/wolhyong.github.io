---
layout: post
title: "자바스크립트 함수 - 선언, 스코프, 기본값, 화살표 함수 정리"
description: "자바스크립트 함수의 선언 방식, 스코프, 매개변수 기본값, 화살표 함수까지 함수의 모든 것을 예제와 함께 학습합니다."
date: 2016-08-15 10:00:00 +0900
category: javascript
level: beginner
tags: [javascript, functions, scope, 웹]
---

함수는 자바스크립트의 핵심 building block입니다. 코드를 재사용하고, 로직을 분리하고, 추상화를 구현하는 모든 곳에 함수가 등장합니다.

## 함수 선언 방식

자바스크립트에는 함수를 만드는 세 가지 방법이 있습니다.

```javascript
// 1. 함수 선언문 (Function Declaration)
function greet(name) {
  return `안녕하세요, ${name}님!`;
}

// 2. 함수 표현식 (Function Expression)
const greet2 = function(name) {
  return `안녕하세요, ${name}님!`;
};

// 3. 화살표 함수 (Arrow Function) — ES6
const greet3 = (name) => `안녕하세요, ${name}님!`;
```

**함수 선언문은 호이스팅됩니다.** 코드 어디에서 호출해도 함수 선언 전이라도 사용할 수 있습니다. 반면 함수 표현식은 할당된 변수에서만 접근 가능합니다.

## 매개변수와 기본값

```javascript
// 기본 매개변수 (ES6)
function createUser(name, role = "일반 사용자") {
  return { name, role };
}

console.log(createUser("홍길동"));          // { name: "홍길동", role: "일반 사용자" }
console.log(createUser("관리자", "관리자")); // { name: "관리자", role: "관리자" }

// 나머지 매개변수 (Rest Parameters)
function sum(...numbers) {
  return numbers.reduce((acc, cur) => acc + cur, 0);
}

console.log(sum(1, 2, 3, 4)); // 10
```

## 스코프 (Scope)

스코프는 변수가 접근 가능한 범위를 결정합니다.

```javascript
let global = "전역 변수";

function outer() {
  let outerVar = "외부 함수 변수";

  function inner() {
    let innerVar = "내부 함수 변수";
    console.log(global);    // ✅ 전역 스코프
    console.log(outerVar);  // ✅ 외부 함수 스코프 (클로저)
    console.log(innerVar);  // ✅ 내부 함수 스코프
  }

  inner();
  // console.log(innerVar); // ❌ ReferenceError
}
```

자바스크립트는 **function scope**를 사용합니다. `let`, `const`는 블록 스코프(`{}` 단위)를 가지지만, `var`는 함수 스코프를 가집니다. 실무에서는 `var` 대신 `let`/`const`를 사용합니다.

## 반환값 (Return)

```javascript
// 명시적 반환
function multiply(a, b) {
  return a * b;
}

// 암묵적 반환 (화살표 함수)
const multiply2 = (a, b) => a * b;

// 여러 값을 반환할 때 — 구조 분해 활용
function getPosition() {
  return { x: 10, y: 20 };
}
const { x, y } = getPosition();
```

## 마무리

- **화살표 함수**는 간결하지만 `this` 바인딩이 다릅니다 (다음 수업에서 심화)
- **기본 매개변수**로 매개변수 누락에 대한 방어 코딩을 하세요
- **스코프**를 이해해야 클로저와 this 문제를 해결할 수 있습니다
- `var` 대신 **`let`/`const`** 를 사용하세요

다음 수업에서는 문자열과 배열의 주요 메서드를 살펴봅니다!
