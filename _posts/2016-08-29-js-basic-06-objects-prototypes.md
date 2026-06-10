---
layout: post
title: "자바스크립트 객체와 프로토타입 - 구조, 복사, 프로토타입 체인 완벽 이해"
description: "자바스크립트 객체의 속성 조작, 얕은/깊은 복사, 프로토타입 체인과 상속 메커니즘을 깊게 이해합니다."
date: 2016-08-29 10:00:00 +0900
category: javascript
level: beginner
tags: [javascript, objects, prototypes, 웹]
---

자바스크립트는 객체 기반 언어입니다. 숫자, 문자열, 배열도 내부적으로 객체로 동작합니다. 객체를 제대로 이해하는 것이 자바스크립트 실력의 기준이 됩니다.

## 객체 생성과 속성 조작

```javascript
// 리터럴 방식 (가장 일반적)
const user = {
  name: "홍길동",
  age: 25,
  greet() {
    return `안녕하세요, ${this.name}입니다.`;
  }
};

// 속성 접근
user.name;       // "홍길동" — 점 표기법
user["age"];     // 25       — 대괄호 표기법 (동적 키에 유용)

// 속성 추가/수정
user.email = "hong@example.com";
delete user.age;

// 구조 분해 할당 (ES6)
const { name, greet } = user;
console.log(name); // "홍길동"
console.log(greet()); // "안녕하세요, 홍길동입니다."
```

## spread로 객체 복사

```javascript
// 얕은 복사 (Shallow Copy)
const original = { a: 1, b: { c: 2 } };
const copy = { ...original };

copy.b.c = 99;
console.log(original.b.c); // 99 — 중첩 객체는 같은 참조!

// 깊은 복사 (Deep Copy)
const deep = structuredClone(original); // ES2022
deep.b.c = 0;
console.log(original.b.c); // 99 — 이제 독립적
```

얕은 복사와 깊은 복사의 차이는 실무에서 빈번한 버그 원인입니다. 중첩된 객체가 있다면 항상 `structuredClone()`을 사용하세요.

## 프로토타입 체인

자바스크립트의 모든 객체는 내부적으로 `[[Prototype]]` 링크를 가집니다.

```javascript
const person = {
  greet() {
    return `안녕, ${this.name}`;
  }
};

const student = Object.create(person); // person을 프로토타입으로 설정
student.name = "학생";
student.study = function() {
  return `${this.greet()}! 공부 중`;
};

console.log(student.study()); // "안녕, 학생! 공부 중"
console.log(student.greet()); // "안녕, 학생" — person의 메서드를 상속
```

`student`는 `greet` 메서드를 직접 갖지 않지만, 프로토타입 체인을 탐색하여 `person.greet()`를 찾습니다.

## 클래스 (ES6)

프로토타입 기반 상속을 더 직관적으로 작성하는 문법입니다.

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name}이(가) 소리냅니다.`;
  }
}

class Dog extends Animal {
  speak() {
    return `${this.name}이(가) 멍멍 합니다.`;
  }
}

const dog = new Dog("바둑이");
console.log(dog.speak()); // "바둑이이(가) 멍멍 합니다."
```

클래스는 프로토타입의 설탕 문법(syntactic sugar)입니다. 내부적으로는 여전히 프로토타입 체인으로 동작합니다.

## 마무리

- 객체는 **키-값 쌍**의 컬렉션이며, 메서드도 값으로 저장됩니다
- **얕은 복사**는 spread(`...`)로, **깊은 복사**는 `structuredClone()`으로 합니다
- **프로토타입 체인**은 자바스크립트 상속의 핵심 메커니즘입니다
- **클래스**는 프로토타입을 더 읽기 쉽게 만든 문법입니다

이제 기본 과정을 마쳤습니다! 다음 수업부터는 중급 개념인 DOM 조작을 시작합니다.
