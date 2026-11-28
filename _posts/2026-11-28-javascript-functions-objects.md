---
layout: post
title: "자바스크립트 함수와 객체 — 스코프, this, 클로저, 프로토타입, 클래스"
description: "자바스크립트 함수 선언 방식과 호이스팅, 렉시컬 스코프와 클로저, this 바인딩 4가지 규칙, 객체 복사, 프로토타입 체인과 클래스 문법을 코드로 정리했습니다."
date: 2026-11-28 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, 함수, 클로저, this, 프로토타입, 클래스, 객체]
---

자바스크립트에서 함수는 값입니다. 변수에 담고, 인자로 넘기고, 객체의 속성으로 넣을 수 있습니다. 이 성질 때문에 콜백, 클로저, 메서드, 생성자가 모두 같은 문법 위에서 동작하고, 동시에 `this`와 스코프가 헷갈리는 원인이 됩니다.

2016년에 올렸던 함수, 객체와 프로토타입, `this`, 클로저, 클래스 글 다섯 편을 한 글로 합치고 예제를 다시 검증했습니다.

## 함수를 만드는 세 가지 방법

```javascript
// 1. 함수 선언문
function greet(name) {
  return `안녕하세요, ${name}님!`;
}

// 2. 함수 표현식
const greet2 = function (name) {
  return `안녕하세요, ${name}님!`;
};

// 3. 화살표 함수 (ES6)
const greet3 = (name) => `안녕하세요, ${name}님!`;
```

선언문은 호이스팅되어 파일 어디에서 호출해도 동작합니다. 표현식과 화살표 함수는 변수에 값이 할당된 뒤에만 호출할 수 있습니다.

```javascript
sayHi();          // 동작 — 선언문 전체가 끌어올려짐
function sayHi() { console.log("hi"); }

sayBye();         // ReferenceError — 아직 할당 전
const sayBye = () => console.log("bye");
```

이 차이 때문에 모듈 최상단에서 실행되는 코드가 있다면 호출 순서를 신경 써야 합니다.

## 매개변수

```javascript
// 기본값
function createUser(name, role = "일반 사용자") {
  return { name, role };
}
createUser("홍길동");            // { name: "홍길동", role: "일반 사용자" }

// 나머지 매개변수
function sum(...numbers) {
  return numbers.reduce((acc, cur) => acc + cur, 0);
}
sum(1, 2, 3, 4);                 // 10

// 구조 분해와 함께
function render({ title, tags = [] }) {
  return `${title} (${tags.length})`;
}
```

기본값은 인자가 `undefined`일 때만 적용됩니다. `null`을 넘기면 기본값이 아니라 `null`이 들어갑니다.

```javascript
function f(value = "기본") {
  return value;
}
f();          // "기본"
f(undefined); // "기본"
f(null);      // null
```

## 스코프

스코프는 변수를 읽을 수 있는 범위입니다. 자바스크립트는 함수가 선언된 위치를 기준으로 스코프를 정합니다(렉시컬 스코프).

```javascript
const global = "전역";

function outer() {
  const outerVar = "외부";

  function inner() {
    const innerVar = "내부";
    console.log(global);    // 전역
    console.log(outerVar);  // 외부 — 바깥 함수의 변수
    console.log(innerVar);  // 내부
  }

  inner();
  // console.log(innerVar); // ReferenceError
}
```

안쪽에서 바깥쪽으로만 접근할 수 있습니다. 반대 방향은 불가능합니다. 이 규칙이 클로저의 기반입니다.

## 클로저

클로저는 외부 함수가 끝난 뒤에도 외부 함수의 변수에 접근할 수 있는 내부 함수입니다.

```javascript
function createCounter() {
  let count = 0;

  return {
    increment() { count++; },
    decrement() { count--; },
    getCount() { return count; },
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
counter.getCount(); // 2
```

`count`는 `createCounter()`가 끝나도 사라지지 않습니다. 반환된 객체의 메서드가 `count`를 참조하고 있기 때문입니다. 외부에서는 `counter.count`로 접근할 수 없으므로 데이터 은닉이 됩니다.

자주 쓰는 패턴 세 가지입니다.

```javascript
// 1. 함수 팩토리 — 설정을 미리 묶어 둔 함수
function createMultiplier(multiplier) {
  return (number) => number * multiplier;
}
const double = createMultiplier(2);
double(5); // 10

// 2. 상태를 가진 모듈
function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    get: () => state,
    set(next) {
      state = next;
      listeners.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// 3. 이벤트 핸들러에 값 고정
function bindButton(id, message) {
  document.getElementById(id)?.addEventListener("click", () => {
    console.log(message);
  });
}
```

클로저는 참조하는 변수를 가비지 컬렉션에서 살려 둡니다. 큰 데이터를 참조한 채로 오래 유지하면 메모리를 계속 차지합니다.

```javascript
function heavy() {
  const data = new Array(1_000_000).fill("x");
  return () => data.length;   // data 전체가 유지됨
}

function light() {
  const data = new Array(1_000_000).fill("x");
  const length = data.length;
  return () => length;        // 숫자만 유지, 배열은 해제 가능
}
```

## this 바인딩

`this`는 함수가 **어떻게 호출되었는지**에 따라 달라집니다. 선언 위치가 아닙니다.

### 1. 일반 호출 — 전역 객체 또는 undefined

```javascript
function showThis() {
  console.log(this);
}
showThis();
```

엄격 모드가 아닌 스크립트에서는 `window`, 모듈이나 `"use strict"`에서는 `undefined`입니다. 모듈 코드에서는 `undefined`가 나오는 쪽이 일반적입니다.

### 2. 메서드 호출 — 호출한 객체

```javascript
const user = {
  name: "홍길동",
  greet() {
    console.log(this.name);
  },
};
user.greet(); // "홍길동"
```

### 3. 명시적 바인딩 — call, apply, bind

```javascript
function greet(greeting) {
  console.log(`${greeting}, ${this.name}`);
}
const user = { name: "홍길동" };

greet.call(user, "안녕");      // 인자를 하나씩
greet.apply(user, ["안녕"]);   // 인자를 배열로
const bound = greet.bind(user); // this가 고정된 새 함수
bound("반가워");
```

### 4. new 바인딩 — 새 인스턴스

```javascript
function Person(name) {
  this.name = name;
}
const p = new Person("홍길동");
p.name; // "홍길동"
```

### this를 잃는 경우

메서드를 변수에 담으면 호출 대상이 사라집니다.

```javascript
const user = {
  name: "홍길동",
  greet() { console.log(this.name); },
};

const fn = user.greet;
fn();                  // undefined (this가 전역 또는 undefined)
user.greet.bind(user)(); // "홍길동"
```

콜백에서도 같은 일이 생깁니다. `setTimeout`, `addEventListener`에 일반 함수를 넘기면 `this`가 바뀝니다. 화살표 함수는 자신의 `this`를 만들지 않고 바깥 스코프의 `this`를 그대로 씁니다.

```javascript
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    // ❌ this가 window/undefined
    setInterval(function () {
      this.seconds++;
    }, 1000);

    // ✅ 바깥 this 유지
    setInterval(() => {
      this.seconds++;
    }, 1000);
  }
}
```

화살표 함수는 `arguments`도 갖지 않고 `new`로 호출할 수도 없습니다. 그래서 객체의 메서드나 생성자로는 쓰지 않습니다.

```javascript
const obj = {
  name: "홍길동",
  greet: () => {
    console.log(this.name); // 바깥(모듈)의 this — undefined
  },
};
obj.greet(); // undefined
```

## 객체

```javascript
const user = {
  name: "홍길동",
  age: 25,
  greet() {
    return `안녕하세요, ${this.name}입니다.`;
  },
};

user.name;       // 점 표기법
user["age"];     // 대괄호 표기법 — 키가 변수일 때
user.email = "hong@example.com";
delete user.age;
```

키를 변수로 만들거나 계산해서 넣을 때는 대괄호를 씁니다.

```javascript
const key = "role";
const obj = {
  [key]: "admin",       // 계산된 키
  name,                 // 변수 이름 그대로 (name: name)
};
```

### 복사: 얕은 복사와 깊은 복사

```javascript
const original = { a: 1, b: { c: 2 } };
const shallow = { ...original };

shallow.b.c = 99;
original.b.c; // 99 — 중첩 객체는 같은 참조

const deep = structuredClone(original);
deep.b.c = 0;
original.b.c; // 99 — 독립
```

`{ ...obj }`와 `Object.assign()`은 1단계만 복사합니다. 중첩 객체가 있으면 `structuredClone()`(최신 브라우저, Node 17 이상)을 씁니다. 함수나 클래스 인스턴스가 섞여 있으면 `structuredClone`이 실패할 수 있으므로 그때는 직접 복사 함수를 만듭니다.

### 프로토타입 체인

모든 객체는 내부에 부모 객체를 가리키는 링크(`[[Prototype]]`)를 가집니다. 속성을 찾을 때 자기 자신에 없으면 이 링크를 따라 올라갑니다.

```javascript
const person = {
  greet() {
    return `안녕, ${this.name}`;
  },
};

const student = Object.create(person);
student.name = "학생";

student.greet();              // "안녕, 학생" — person에서 찾음
Object.getPrototypeOf(student) === person; // true
```

`student`에는 `greet`가 없지만 프로토타입 체인을 따라 `person.greet`을 찾습니다. `this`는 호출한 객체(`student`)를 가리키므로 `this.name`은 `"학생"`입니다.

### 클래스

클래스는 프로토타입 상속을 읽기 쉽게 만든 문법입니다. 내부 동작은 같습니다.

```javascript
class Animal {
  #name;                        // 프라이빗 필드

  constructor(name) {
    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  speak() {
    return `${this.#name}이(가) 소리를 냅니다.`;
  }

  static create(name) {
    return new Animal(name);
  }
}

class Dog extends Animal {
  #breed;

  constructor(name, breed) {
    super(name);                // 부모 생성자 — 반드시 먼저
    this.#breed = breed;
  }

  speak() {
    return `${this.name}: 멍멍`;
  }

  get info() {
    return `${this.name} (${this.#breed})`;
  }
}

const dog = new Dog("바둑이", "푸들");
dog.speak();  // "바둑이: 멍멍"
dog.info;     // "바둑이 (푸들)"
```

`#`으로 시작하는 필드는 클래스 밖에서 읽을 수 없습니다. `private` 키워드 대신 쓰는 자바스크립트의 캡슐화 방법입니다.

```javascript
class User {
  #password;
  constructor(password) {
    this.#password = password;
  }
  check(input) {
    return input === this.#password;
  }
}

const u = new User("secret");
u.#password; // SyntaxError — 밖에서는 접근 불가
```

정적 멤버는 인스턴스가 아니라 클래스에 붙습니다. 팩토리 함수나 유틸리티에 씁니다.

```javascript
class MathUtils {
  static PI = 3.14159;
  static circleArea(r) {
    return this.PI * r ** 2;
  }
}
MathUtils.circleArea(5); // 78.53975
```

`Symbol.iterator`를 구현하면 `for...of`로 순회할 수 있는 객체가 됩니다.

```javascript
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

[...new Range(1, 5)]; // [1, 2, 3, 4, 5]
```

## 문자열과 배열 메서드

문자열은 불변입니다. 메서드가 원본을 바꾸지 않고 새 값을 반환합니다.

```javascript
const str = "Hello, World!";

str.slice(0, 5);        // "Hello"
str.substring(7, 12);   // "World"
str.indexOf("World");   // 7, 없으면 -1
str.includes("Hello");  // true
str.startsWith("He");   // true
str.toLowerCase();      // "hello, world!"
str.trim();             // 양쪽 공백 제거
str.split(", ");        // ["Hello", "World!"]
str.replace("World", "JS");    // "Hello, JS!" — 첫 번째만
str.replaceAll("l", "L");      // "HeLLo, WorLd!"
"7".padStart(2, "0");   // "07"
```

`slice`와 `substring`은 음수 인덱스에서 다르게 동작합니다. `slice(-3)`은 뒤에서 세 글자, `substring(-3)`은 0으로 취급합니다. 뒤에서 자를 때는 `slice`를 씁니다.

배열 메서드는 원본을 바꾸는 것과 새 배열을 만드는 것으로 나뉩니다.

```javascript
const numbers = [1, 2, 3, 4, 5, 6];

// 새 배열을 반환
numbers.map((n) => n * 2);            // [2, 4, 6, 8, 10, 12]
numbers.filter((n) => n % 2 === 0);   // [2, 4, 6]
numbers.slice(1, 3);                  // [2, 3]
numbers.concat([7]);                  // [1, ..., 7]
numbers.flatMap((n) => [n, n]);       // 각 요소를 펼쳐서 새 배열

// 하나의 값으로
numbers.reduce((acc, n) => acc + n, 0); // 21
numbers.find((n) => n > 3);             // 4
numbers.findIndex((n) => n > 3);        // 3
numbers.some((n) => n > 5);             // true
numbers.every((n) => n > 0);            // true

// 원본을 바꿈
numbers.sort((a, b) => b - a);  // 정렬 (원본 변경)
numbers.reverse();              // 뒤집기 (원본 변경)
numbers.splice(0, 1);           // 꺼내기 (원본 변경)
numbers.push(7);                // 끝에 추가
```

`sort()`는 기본값이 문자열 비교입니다. 숫자를 정렬하려면 비교 함수를 반드시 넘깁니다.

```javascript
[10, 9, 100].sort();              // [10, 100, 9] — 문자열 정렬
[10, 9, 100].sort((a, b) => a - b); // [9, 10, 100]

// 원본은 그대로 두고 정렬하려면
const sorted = [...numbers].sort((a, b) => a - b);
```

객체 배열을 다룰 때는 `filter`와 `map`을 이어 붙이는 패턴이 가장 많이 쓰입니다.

```javascript
const users = [
  { name: "홍길동", age: 25, active: true },
  { name: "김철수", age: 30, active: false },
  { name: "이영희", age: 22, active: true },
];

const activeNames = users
  .filter((u) => u.active)
  .map((u) => u.name);          // ["홍길동", "이영희"]

const averageAge =
  users.reduce((acc, u) => acc + u.age, 0) / users.length; // 25.67

const byAge = Object.groupBy(users, (u) => (u.age >= 25 ? "senior" : "junior"));
```

`Object.groupBy()`는 최신 브라우저(2024년 이후)에서 동작합니다. 오래된 환경에서는 `reduce`로 같은 결과를 만듭니다.

## 자주 틀리는 부분

**1. 메서드를 콜백으로 넘길 때 this 상실**

```javascript
class Counter {
  constructor() { this.count = 0; }
  inc() { this.count++; }
}

const c = new Counter();
button.addEventListener("click", c.inc);            // this 상실
button.addEventListener("click", () => c.inc());    // 올바름
```

**2. 객체를 spread로 복사했다고 생각하는 경우**

```javascript
const a = { list: [] };
const b = { ...a };
b.list.push(1);
a.list; // [1] — 배열은 공유됨
```

**3. reduce 초기값 누락**

```javascript
[].reduce((acc, cur) => acc + cur);      // TypeError — 빈 배열
[].reduce((acc, cur) => acc + cur, 0);   // 0
```

**4. 화살표 함수로 메서드 정의**

```javascript
const obj = {
  count: 0,
  inc: () => { this.count++; }, // this는 객체가 아님
};
```

**5. `delete`로 배열 요소 제거**

```javascript
const arr = [1, 2, 3];
delete arr[1];      // [1, empty, 3] — 길이는 그대로
arr.splice(1, 1);   // [1, 3]
```

## 정리

- 함수 선언문은 호이스팅되고, 표현식과 화살표 함수는 할당 후에만 쓸 수 있습니다.
- 스코프는 선언 위치로 정해지고, 클로저는 그 스코프를 함수가 끝난 뒤에도 유지합니다.
- `this`는 호출 방식이 정합니다. 콜백에는 화살표 함수를 쓰면 바깥 `this`가 유지됩니다.
- 복사는 1단계만 된다는 점을 기억하고, 중첩 구조는 `structuredClone()`을 씁니다.
- 배열 메서드는 원본을 바꾸는지부터 확인합니다. `sort`, `reverse`, `splice`, `push`는 바꿉니다.

다음 글에서는 [자바스크립트 DOM과 이벤트](/2026/11/28/javascript-dom-events/)에서 요소 선택, 이벤트 위임, 웹 스토리지를 다룹니다.
