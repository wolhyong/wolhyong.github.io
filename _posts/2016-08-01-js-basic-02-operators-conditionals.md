---
layout: post
title: "자바스크립트 연산자와 조건문 - 비교, 논리, 삼항 연산자 살펴보기"
description: "자바스크립트의 산술, 비교, 논리, 삼항 연산자와 if/else, switch 조건문을 예제와 함께 쉽고 깊게 이해합니다."
date: 2016-08-01 10:00:00 +0900
category: javascript
level: beginner
tags: [javascript, operators, conditionals, 웹]
---

자바스크립트에서 연산자는 값을 비교하고 조작하는 핵심 도구입니다. 조건문은 프로그램의 흐름을 결정하는 갈림길 역할을 합니다. 이 두 가지를 제대로 이해해야 실전 코딩이 가능합니다.

## 산술 연산자

가장 기본적인 연산자부터 시작합니다.

```javascript
let a = 10, b = 3;

console.log(a + b);   // 13 — 덧셈
console.log(a - b);   // 7  — 뺄셈
console.log(a * b);   // 30 — 곱셈
console.log(a / b);   // 3.333... — 나눗셈
console.log(a % b);   // 1  — 나머지
console.log(a ** b);  // 1000 — 거듭제곱 (ES2016)
```

**주의할 점**: 자바스크립트에서 나눗셈 결과는 항상 부동소수점 숫자입니다. 정수 나눗셈을 원하면 `Math.floor()`나 `Math.trunc()`를 사용합니다.

## 비교 연산자

비교 연산자는 `true` 또는 `false`를 반환합니다.

```javascript
// 느슨한 비교 (==) — 타입 변환 후 비교
console.log(5 == "5");    // true  — 문자열 "5"가 숫자 5로 변환됨
console.log(0 == false);  // true  — false가 0으로 변환됨
console.log(null == undefined); // true

// 엄격한 비교 (===) — 타입과 값 모두 비교 (권장)
console.log(5 === "5");   // false — 타입이 다름
console.log(0 === false); // false — 타입이 다름
console.log(null === undefined); // false
```

> **핵심 정리** — 실무에서는 항상 `===` (엄격 비교)를 사용하세요. 느슨한 비교는 예상치 못한 결과를 만들 수 있습니다.

## 논리 연산자

```javascript
let x = true, y = false;

console.log(x && y);  // false — AND: 둘 다 true여야 true
console.log(x || y);  // true  — OR: 하나라도 true면 true
console.log(!x);      // false — NOT: 반전

// 단축 평가 (Short-circuit Evaluation)
let name = user && user.name;       // user가 falsy면 user.name 접근 안 함
let value = input || "기본값";      // input이 falsy면 "기본값" 사용
```

## 삼항 연산자

조건이 간결할 때 유용합니다.

```javascript
let age = 20;
let result = age >= 18 ? "성인" : "미성년";
console.log(result); // "성인"
```

너무 길게 중첩하면 가독성이 떨어지므로, 간단한 조건에만 사용하는 것이 좋습니다.

## if / else 조건문

```javascript
let score = 85;

if (score >= 90) {
  console.log("A");
} else if (score >= 80) {
  console.log("B");
} else if (score >= 70) {
  console.log("C");
} else {
  console.log("F");
}
```

조건문에서 가장 흔한 실수는 `=` (대입)과 `==` (비교)를 혼동하는 것입니다. 조건절에는 항상 비교 연산자를 사용하세요.

## switch 문

비교 대상이 여러 개일 때 효율적입니다.

```javascript
let day = new Date().getDay();

switch (day) {
  case 0:
    console.log("일요일");
    break;
  case 6:
    console.log("토요일");
    break;
  default:
    console.log("평일");
}
```

`break`를 빠뜨리면 다음 `case`도 실행됩니다 (fall-through). 의도하지 않은 fall-through는 버그의 원인이 됩니다.

## 마무리

- **`===`** 를 기본으로 사용하고, 느슨한 비교는 피하세요
- **삼항 연산자**는 간결한 조건에만, 복잡하면 `if/else`를 사용하세요
- **switch**는 `break`를 반드시 넣으세요
- **단축 평가**를 활용하면 코드를 깔끔하게 줄일 수 있습니다

다음 수업에서는 자바스크립트의 반복문(for, while, for...of, forEach)에 대해 알아보겠습니다!
