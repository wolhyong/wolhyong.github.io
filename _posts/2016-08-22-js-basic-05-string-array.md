---
layout: post
title: "자바스크립트 문자열과 배열 메서드 - slice, map, filter, reduce 살펴보기"
description: "자바스크립트 문자열과 배열의 핵심 메서드들을 실제 활용 예제와 함께 상세히 설명합니다."
date: 2016-08-22 10:00:00 +0900
category: javascript
level: beginner
tags: [javascript, string, array, methods, 웹]
---

문자열과 배열은 자바스크립트에서 가장 자주 다루는 데이터 타입입니다. 표준 메서드들을 익히면 코드를 훨씬 간결하고 효율적으로 작성할 수 있습니다.

## 문자열 메서드

문자열은 불변(immutable)입니다. 메서드를 호출해도 원본 문자열은 변경되지 않고, 새로운 문자열이 반환됩니다.

```javascript
const str = "Hello, World!";

// 부분 문자열
str.slice(0, 5);      // "Hello" — 인덱스 0~4
str.substring(7, 12); // "World"

// 검색
str.indexOf("World");  // 7 — 위치 반환, 없으면 -1
str.includes("Hello"); // true — 포함 여부
str.startsWith("Hello"); // true

// 변환
str.toLowerCase();     // "hello, world!"
str.toUpperCase();     // "HELLO, WORLD!"
str.trim();            // 양쪽 공백 제거

// 치환
"가나다".split("").join("-"); // "가-나-다"

// 템플릿 리터럴 (ES6)
const name = "개발자";
const msg = `안녕하세요, ${name}님!`;
```

## 배열 메서드 — 변경하지 않는 메서드

```javascript
const fruits = ["사과", "바나나", "체리", "대추"];

// slice — 부분 배열 (원본 변경 없음)
fruits.slice(1, 3);  // ["바나나", "체리"]

// concat — 결합
fruits.concat(["오렌지"]); // ["사과", "바나나", "체리", "대추", "오렌지"]

// indexOf / includes — 검색
fruits.indexOf("체리"); // 2
fruits.includes("바나나"); // true
```

## 배열 메서드 — 고차 함수 (Higher-Order Function)

배열의 고차 함수는 콜백 함수를 인자로 받아 새로운 배열이나 값을 만듭니다.

```javascript
const numbers = [1, 2, 3, 4, 5, 6];

// map — 각 요소를 변환하여 새 배열 반환
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10, 12]

// filter — 조건을 만족하는 요소만 새 배열로
const evens = numbers.filter(n => n % 2 === 0);
// [2, 4, 6]

// reduce — 누적값을 하나로 합침
const total = numbers.reduce((acc, cur) => acc + cur, 0);
// 21

// find — 조건을 만족하는 첫 번째 요소
const found = numbers.find(n => n > 3); // 4

// some / every — 조건 검사
numbers.some(n => n > 4);  // true — 하나라도 true면 true
numbers.every(n => n > 0); // true — 모두 true여야 true
```

## 배열 변환 메서드 실전 활용

```javascript
const users = [
  { name: "홍길동", age: 25, active: true },
  { name: "김철수", age: 30, active: false },
  { name: "이영희", age: 22, active: true },
];

// 활성 사용자 이름만 추출
const activeNames = users
  .filter(user => user.active)
  .map(user => user.name);
// ["홍길동", "이영희"]

// 나이 평균 계산
const avgAge = users.reduce((acc, user) => acc + user.age, 0) / users.length;
// 25.67
```

## 마무리

- **`map`** / **`filter`** / **`reduce`** 는 조합하면 강력한 데이터 처리가 가능합니다
- 문자열은 **불변**이므로, 메서드 결과를 항상 변수에 할당하세요
- **체이닝** (메서드 연속 호출)은 가독성을 높이지만, 너무 길면 분리하세요
- 배열 메서드는 **새 배열을 반환**하는지, **원본을 변경**하는지 구분하세요

다음 수업에서는 객체와 프로토타입의 동작 원리를 학습합니다!
