---
layout: post
title: "자바스크립트 반복문 - for, while, for...of, forEach 완벽 비교"
description: "자바스크립트의 모든 반복문(for, while, do-while, for...in, for...of, forEach)을 상황별로 비교하며 실전 활용법을 익힙니다."
date: 2016-08-08 10:00:00 +0900
category: javascript
level: beginner
tags: [javascript, loops, iteration, 웹]
---

반복문은 동일한 작업을 여러 번 실행해야 할 때 사용합니다. 자바스크립트에는 여러 종류의 반복문이 있으며, 각각 적합한 사용 상황이 다릅니다.

## for 문

가장 기본적이고 가장 많이 사용되는 반복문입니다.

```javascript
for (let i = 0; i < 5; i++) {
  console.log(`반복 ${i + 1}번째`);
}
// 반복 1번째, 반복 2번째, ... 반복 5번째
```

`for` 문의 세 부분:
- **초기화** (`let i = 0`): 반복 시작 전 한 번 실행
- **조건** (`i < 5`): 매 반복 전 검사, `false`가 되면 종료
- **증감** (`i++`): 매 반복 후 실행

## while / do-while 문

반복 횟수를 모를 때, 조건이 만족되는 동안 반복합니다.

```javascript
// while — 조건 먼저 검사
let count = 0;
while (count < 3) {
  console.log(count);
  count++;
}

// do-while — 최소 1번은 실행
let input;
do {
  input = "yes"; // 실제로는 사용자 입력을 받음
} while (input !== "yes");
```

`do-while`은 `while`과 달리 루프 본문이 **최소 한 번** 실행됩니다. 사용자 입력 검증 등에서 유용합니다.

## for...of 문 (ES6)

배열, 문자열, Map, Set 등 **이터러블 객체**를 순회합니다.

```javascript
const fruits = ["사과", "바나나", "체리"];

for (const fruit of fruits) {
  console.log(fruit);
}
// 사과, 바나나, 체리
```

`for...of`는 값(value)을 직접 얻기 때문에 가장 직관적입니다.

## for...in 문

객체의 **키(key)**를 순회합니다.

```javascript
const person = { name: "홍길동", age: 25, job: "개발자" };

for (const key in person) {
  console.log(`${key}: ${person[key]}`);
}
// name: 홍길동, age: 25, job: 개발자
```

> **주의** — `for...in`은 배열에 사용하지 마세요. 프로토타입 체인의 enumerable 속성까지 순회할 수 있어 예상치 못한 결과를 만듭니다.

## forEach 메서드

배열의 각 요소에 대해 콜백 함수를 실행합니다.

```javascript
const nums = [10, 20, 30];

nums.forEach((num, index) => {
  console.log(`${index}번째: ${num}`);
});
// 0번째: 10, 1번째: 20, 2번째: 30
```

`forEach`는 `break`나 `continue`로 루프를 중간에 멈출 수 없습니다. 조건부 종료가 필요하면 `for...of`나 `Array.some()`, `Array.every()`를 사용합니다.

## 반복문별 사용 상황 정리

| 상황 | 추천 반복문 |
|------|------------|
| 배열 순회 (값 필요) | `for...of` |
| 배열 순회 (인덱스 필요) | `for` 또는 `forEach` |
| 객체 키 순회 | `for...in` |
| 반복 횟수 미정 | `while` / `do-while` |
| 조기 종료 필요 | `for...of` + `break` |

## 마무리

- **`for...of`** 가 가장 직관적이며 실무에서 자주 사용됩니다
- **`for...in`** 은 객체 키 순회에만 사용하세요
- **`forEach`** 는 간단한 처리에 좋지만, `break`/`continue`가 안 됩니다
- **`while`** 은 반복 횟수를 모를 때 사용합니다

다음 수업에서는 자바스크립트 함수 선언, 스코프, 클로저의 기본 개념을 다룹니다!
