---
layout: post
title: "자바스크립트 this와 컨텍스트 - 바인딩 규칙 4가지 완벽 이해"
description: "자바스크립트 this 키워드의 4가지 바인딩 규칙(기본, 암묵적, 명시적, new), 화살표 함수의 this 차이를 깊게 이해합니다."
date: 2016-11-21 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, this, context, 웹]
---

`this`는 자바스크립트에서 가장 혼란스러운 키워드 중 하나입니다. 호출 방식에 따라 `this`가 가리키는 대상이 달라지기 때문입니다. 4가지 바인딩 규칙을 이해하면 모든 상황에서 this를 예측할 수 있습니다.

## 4가지 바인딩 규칙

### 1. 기본 바인딩 (전역 객체)

```javascript
function showThis() {
  console.log(this);
}
showThis(); // window (브라우저) 또는 globalThis (Node.js)
```

독립적으로 호출된 함수의 `this`는 전역 객체를 가리킵니다.

### 2. 암묵적 바인딩 (호출 객체)

```javascript
const user = {
  name: "홍길동",
  greet() {
    console.log(this.name); // "홍길동"
  }
};

user.greet(); // this === user
```

함수가 객체의 메서드로 호출되면 `this`는 해당 객체를 가리킵니다.

### 3. 명시적 바인딩 (call, apply, bind)

```javascript
function greet(greeting) {
  console.log(`${greeting}, ${this.name}`);
}

const user = { name: "홍길동" };

greet.call(user, "안녕");       // "안녕, 홍길동" — 인자 개별 전달
greet.apply(user, ["안녕"]);    // "안녕, 홍길동" — 인자 배열로 전달

const bound = greet.bind(user); // 새 함수 반환 (this 고정)
bound("반가워");                // "반가워, 홍길동"
```

### 4. new 바인딩 (생성자)

```javascript
function Person(name) {
  this.name = name; // this === 새로 생성된 인스턴스
}

const p = new Person("홍길동");
console.log(p.name); // "홍길동"
```

## this 누락 문제와 해결

```javascript
const user = {
  name: "홍길동",
  greet() {
    console.log(this.name);
  }
};

// ❌ this가 상실됨
const fn = user.greet;
fn(); // undefined (this === window)

// ✅ 해결 1: bind
const bound = user.greet.bind(user);
bound(); // "홍길동"

// ✅ 해결 2: 화살표 함수
const user2 = {
  name: "김철수",
  greet: () => {
    console.log(this.name); // 화살표 함수는 자신만의 this를 안 가짐
  }
};
```

## 화살표 함수의 this

```javascript
class Timer {
  constructor() {
    this.seconds = 0;
  }
  start() {
    // ❌ 일반 함수: this가 setInterval 콜백에서 window로 바뀜
    setInterval(function() {
      this.seconds++;
    }, 1000);

    // ✅ 화살표 함수: 상위 스코프의 this를 유지
    setInterval(() => {
      this.seconds++;
    }, 1000);
  }
}
```

화살표 함수는 자신만의 `this`를 가지지 않고, **정의된 시점의 상위 스코프**의 `this`를 그대로 사용합니다.

## 마무리

- **메서드 호출** → 호출 객체가 this
- **독립 호출** → 전역 객체가 this
- **`call/apply/bind`** → 명시적으로 this 지정
- **화살표 함수** → 상위 스코프의 this를 유지 (메서드에는 사용하지 않는 게 좋습니다)
- 콜백 함수에서 this가 바뀌는 문제는 **화살표 함수**로 해결하세요

다음 수업에서는 클로저와 스코프를 심화 학습합니다!
