---
layout: post
title: "자바스크립트 클래스 - 상속, 프라이빗 필드, 정적 메서드 심화"
description: "ES6 클래스의 심화 개념인 상속, 스태틱 메서드, 프라이빗 필드, Symbol.iterator를 학습합니다."
date: 2016-12-05 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, classes, oop, 웹]
---

ES6 클래스는 프로토타입 기반 상속을 더 직관적으로 만든 문법입니다. 상속, 캡슐화, 정적 메서드 등 OOP 개념을 클래스로 어떻게 구현하는지 학습합니다.

## 클래스 기본과 상속

```javascript
class Animal {
  #name; // 프라이빗 필드 (ES2022)

  constructor(name) {
    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  speak() {
    return `${this.#name}이(가) 소리냅니다.`;
  }

  static create(name) {
    return new Animal(name); // 정적 메서드 — 팩토리
  }
}

class Dog extends Animal {
  #breed;

  constructor(name, breed) {
    super(name); // 부모 생성자 호출 (반드시 첫 줄)
    this.#breed = breed;
  }

  speak() {
    return `${this.name}이(가) 멍멍 합니다!`;
  }

  get info() {
    return `${this.name} (${this.#breed})`;
  }
}

const dog = new Dog("바둑이", "푸들");
console.log(dog.speak()); // "바둑이이(가) 멍멍 합니다!"
console.log(dog.info);    // "바둑이 (푸들)"

const cat = Animal.create("나비");
console.log(cat.speak()); // "나비이(가) 소리냅니다."
```

## 프라이빗 필드 (#)

```javascript
class User {
  #password;

  constructor(name, password) {
    this.name = name;
    this.#password = password;
  }

  checkPassword(input) {
    return input === this.#password;
  }
}

const user = new User("홍길동", "secret123");
console.log(user.name);           // "홍길동"
// console.log(user.#password);  // SyntaxError!
```

`#`으로 선언된 필드는 클래스 외부에서 접근할 수 없습니다. `private` 키워드 대신 사용하는 자바스크립트의 캡슐화 방법입니다.

## 정적 메서드와 정적 필드

```javascript
class MathUtils {
  static PI = 3.14159;

  static circleArea(radius) {
    return this.PI * radius ** 2;
  }

  static lerp(start, end, t) {
    return start + (end - start) * t;
  }
}

MathUtils.PI;                // 3.14159
MathUtils.circleArea(5);     // 78.54
MathUtils.lerp(0, 100, 0.5); // 50
```

정적 멤버는 인스턴스를 만들지 않고 클래스 자체에서 직접 호출합니다.

## Symbol.iterator — 커스텀 이터러블

```javascript
class Range {
  #start;
  #end;

  constructor(start, end) {
    this.#start = start;
    this.#end = end;
  }

  *[Symbol.iterator]() {
    for (let i = this.#start; i <= this.#end; i++) {
      yield i;
    }
  }
}

for (const num of new Range(1, 5)) {
  console.log(num); // 1, 2, 3, 4, 5
}
```

## 마무리

- **프라이빗 필드** (`#`) 로 캡슐화를 구현하세요
- **`extends`** 와 **`super()`** 로 상속을 구현합니다
- **정적 메서드**는 인스턴스 없이 호출하며, 팩토리나 유틸리티에 활용됩니다
- **Symbol.iterator**로 커스텀 이터러블을 만들 수 있습니다

다음 수업에서는 자바스크립트 에러 처리를 심화 학습합니다!
