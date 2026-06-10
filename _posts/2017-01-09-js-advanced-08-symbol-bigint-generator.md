---
layout: post
title: "자바스크립트 Symbol, BigInt, Generator - 고급 타입과 제너레이터 살펴보기"
description: "Symbol, BigInt, Generator 함수의 개념과 실전 활용법을 예제와 함께 상세히 설명합니다."
date: 2017-01-09 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, symbol, bigint, generator, 웹]
---

자바스크립트에는 자주 사용하지만 깊이 이해하기 어려운 고급 타입들이 있습니다. Symbol, BigInt, Generator의 특징과 실전 활용법을 학습합니다.

## Symbol — 고유한 식별자

```javascript
const id1 = Symbol("id");
const id2 = Symbol("id");
console.log(id1 === id2); // false — 항상 고유

// 객체에 숨겨진 속성으로 활용
const user = { name: "홍길동" };
const secretId = Symbol("id");
user[secretId] = 12345;

console.log(Object.keys(user)); // ["name"] — 숨겨짐
console.log(user[secretId]);    // 12345

// Well-known Symbol — 이터러블 프로토콜
class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  *[Symbol.iterator]() {
    for (let i = this.start; i <= this.end; i++) {
      yield i;
    }
  }
}
```

## BigInt — 임의 정밀도 정수

```javascript
// 일반 숫자의 한계
const max = Number.MAX_SAFE_INTEGER; // 9007199254740991
console.log(max + 1 === max + 2);    // true! (정밀도 손실)

// BigInt — 정확한 큰 수 처리
const big = 9007199254740991n;
console.log(big + 1n === big + 2n);  // false (정확!)

// 타입 변환
const num = Number(big);     // BigInt → Number
const big2 = BigInt(num);    // Number → BigInt

// 활용: 고유 ID 생성, 암호학, 금융 계산
const orderId = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
```

## Generator 함수

```javascript
// 기본 Generator
function* countTo(n) {
  for (let i = 1; i <= n; i++) {
    yield i; // 일시 정지하고 값을 반환
  }
}

const counter = countTo(3);
console.log(counter.next()); // { value: 1, done: false }
console.log(counter.next()); // { value: 2, done: false }
console.log(counter.next()); // { value: 3, done: false }
console.log(counter.next()); // { value: undefined, done: true }

// 무한 시퀀스
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
for (let i = 0; i < 10; i++) {
  console.log(fib.next().value); // 0, 1, 1, 2, 3, 5, 8, 13, 21, 34
}
```

## Generator 활용 — 지연 평가

```javascript
function* filter(iterable, predicate) {
  for (const item of iterable) {
    if (predicate(item)) {
      yield item;
    }
  }
}

function* map(iterable, transform) {
  for (const item of iterable) {
    yield transform(item);
  }
}

// 무한 시퀀스에서 필터링 + 변환
const result = map(
  filter(fibonacci(), n => n % 2 === 0),
  n => n * 10
);

// 처음 5개 짝수 피보나치 × 10
for (let i = 0; i < 5; i++) {
  console.log(result.next().value); // 0, 10, 30, 80, 210
}
```

## 마무리

- **Symbol**은 고유 식별자가 필요할 때, 숨겨진 속성으로 활용됩니다
- **BigInt**는 정수 범위를 초과하는 큰 수를 정확하게 처리합니다
- **Generator**는 지연 평가와 무한 시퀀스에 유용합니다
- Generator는 메모리를 효율적으로 사용하면서 순차적인 데이터 생성에 적합합니다

다음 수업에서는 Web Worker로 멀티스레드 프로그래밍을 학습합니다!
