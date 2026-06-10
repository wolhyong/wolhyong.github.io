---
layout: post
title: "자바스크립트 클로저와 스코프 - 렉시컬 스코프, 클로저 활용 패턴 정리"
description: "자바스크립트의 렉시컬 스코프, 클로저의 동작 원리, 메모이제이션, 모듈 패턴 등 실전 활용법을 학습합니다."
date: 2016-11-28 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, closure, scope, 웹]
---

클로저는 자바스크립트에서 가장 강력하면서도 헷갈리는 개념 중 하나입니다. 한 번 제대로 이해하면 캡슐화, 데이터 은닉, 함수형 프로그래밍 등 다양한 패턴에 활용할 수 있습니다.

## 렉시컬 스코프 (Static Scope)

자바스크립트의 스코프는 함수가 **선언된 위치**에 의해 결정됩니다.

```javascript
let outer = "외부";

function outerFunc() {
  let middle = "중간";

  function innerFunc() {
    let inner = "내부";
    console.log(outer, middle, inner); // 모두 접근 가능
  }

  innerFunc();
}
```

## 클로저란?

**클로저**는 외부 함수의 변수에 접근할 수 있는 내부 함수입니다. 외부 함수가 종료된 후에도 내부 함수는 외부 변수를 "닫다(dontains)"고 있습니다.

```javascript
function createCounter() {
  let count = 0; // 외부 함수의 지역 변수

  return {
    increment() { count++; },
    decrement() { count--; },
    getCount() { return count; }
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
// count 변수는 외부에서 직접 접근할 수 없음 (캡슐화!)
```

## 클로저 활용 패턴

### 1. 데이터 은닉

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance;

  return {
    deposit(amount) {
      if (amount > 0) balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > 0 && amount <= balance) balance -= amount;
      return balance;
    },
    getBalance() { return balance; }
  };
}
```

### 2. 함수 팩토리

```javascript
function createMultiplier(multiplier) {
  return function(number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

### 3. 이벤트 핸들러에서의 활용

```javascript
function setupButton(buttonId, message) {
  const button = document.getElementById(buttonId);
  button.addEventListener("click", function() {
    alert(message); // message가 클로저로 캡처됨
  });
}
```

## 클로저와 메모리

```javascript
// ⚠️ 클로저는 참조하는 변수를 GC하지 않음
function heavyClosure() {
  const hugeData = new Array(1000000).fill("x");
  return function() {
    return hugeData.length; // hugeData가 메모리에 유지됨
  };
}

// 해결: 필요하지 않은 변수 참조 제거
function optimizedClosure() {
  const hugeData = new Array(1000000).fill("x");
  const length = hugeData.length; // 길이만 저장
  return function() {
    return length;
  };
}
```

## 마무리

- 클로저는 **외부 함수의 변수에 접근하는 내부 함수**입니다
- **데이터 은닉**과 **캡슐화**를 위한 가장 간단한 방법입니다
- 클로저는 참조하는 변수를 **GC하지 않으므로** 메모리에 주의하세요
- **이벤트 핸들러**, **팩토리 함수**, **모듈 패턴**에서 빈번하게 활용됩니다

다음 수업에서는 ES6 클래스와 상속을 학습합니다!
