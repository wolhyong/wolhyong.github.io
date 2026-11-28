---
layout: post
title: "자바스크립트 기본 문법 — 변수, 타입, 연산자, 조건문, 반복문"
description: "자바스크립트를 처음 다룰 때 필요한 변수 선언(let·const), 원시 타입과 형 변환, ==와 ===의 차이, 조건문과 반복문 선택 기준을 실행되는 코드로 정리했습니다."
date: 2026-11-28 09:00:00 +0900
category: javascript
level: beginner
tags: [javascript, 기초문법, 변수, 연산자, 반복문, 타입]
---

자바스크립트를 처음 배울 때 걸리는 곳은 문법의 양이 아니라 **타입과 비교 규칙**입니다. 같은 값을 `==`와 `===`로 비교했을 때 결과가 달라지고, `var`로 선언한 변수는 블록 밖에서도 살아 있습니다. 이 글은 그런 지점을 중심으로 변수, 타입, 연산자, 조건문, 반복문을 한 번에 정리합니다.

이 글은 2016년에 올렸던 짧은 글 세 편(자바스크립트 소개, 연산자와 조건문, 반복문)을 합치고, 지금 브라우저 기준으로 코드와 주의점을 다시 쓴 것입니다.

## 자바스크립트는 어디에서 실행되나

자바스크립트는 원래 브라우저에서 HTML을 조작하려고 만들어진 언어입니다. 지금은 실행 환경이 넓어졌습니다.

| 환경 | 실행 방법 | 주로 하는 일 |
|------|-----------|--------------|
| 브라우저 | `<script>` 태그, `type="module"` | DOM 조작, 이벤트 처리, 화면 렌더링 |
| Node.js | `node app.js` | 서버, CLI 도구, 빌드 스크립트 |
| 런타임 내장 | 앱에 내장된 엔진 | 플러그인, 자동화, 임베디드 |

브라우저에서 바로 실행되지만 컴파일 단계가 아예 없는 것은 아닙니다. 최신 엔진은 실행 직전에 코드를 기계어로 바꾸는 JIT 컴파일을 합니다. 그래서 "인터프리터 언어라서 느리다"는 설명은 지금은 맞지 않습니다.

## 변수: let, const, var

변수를 선언하는 키워드는 세 가지입니다.

```javascript
var oldStyle = "함수 스코프";
let count = 0;        // 재할당 가능
const MAX = 100;      // 재할당 불가
```

차이는 **스코프**와 **재할당**입니다.

```javascript
if (true) {
  var a = 1;
  let b = 2;
  const c = 3;
}

console.log(a); // 1 — 블록을 벗어나도 살아 있음
// console.log(b); // ReferenceError
// console.log(c); // ReferenceError
```

`var`는 함수 스코프라서 블록을 무시합니다. 반복문 안에서 `var`로 선언한 변수를 콜백에서 잡으면 모두 마지막 값으로 보이는 문제도 여기서 나옵니다.

```javascript
// var — 모두 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}

// let — 0, 1, 2 (반복마다 새 바인딩)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

새 코드에서는 `var`를 쓰지 않습니다. 기본은 `const`로 두고, 값을 다시 대입해야 할 때만 `let`으로 바꾸는 편이 실수를 줄입니다. `const`는 재할당을 막을 뿐, 객체 내부 변경까지 막지는 않습니다.

```javascript
const user = { name: "홍길동" };
user.name = "김철수";   // 가능 — 프로퍼티 변경
// user = {};          // TypeError — 재할당

// 내부까지 고정하려면
const frozen = Object.freeze({ role: "admin" });
frozen.role = "user";   // 조용히 무시됨 (strict mode에서는 TypeError)
```

## 값의 타입

자바스크립트의 원시 타입은 일곱 가지입니다.

| 타입 | 예 | `typeof` 결과 |
|------|-----|----------------|
| 숫자 | `42`, `3.14`, `NaN` | `"number"` |
| 문자열 | `"hello"`, `'hi'` | `"string"` |
| 불리언 | `true`, `false` | `"boolean"` |
| undefined | `let x;` | `"undefined"` |
| null | `null` | `"object"` (버그로 남은 값) |
| 심볼 | `Symbol("id")` | `"symbol"` |
| BigInt | `9007199254740993n` | `"bigint"` |

배열과 함수는 객체입니다. `typeof []`는 `"object"`, `typeof function(){}`는 `"function"`이 나옵니다. 배열인지 확인할 때는 `Array.isArray()`를 씁니다.

```javascript
typeof null;            // "object" — 역사적인 실수, 그대로 남아 있음
Array.isArray([]);      // true
Number.isInteger(3.0);  // true
```

형 변환은 두 가지로 나뉩니다.

```javascript
// 명시적 변환 — 의도가 드러남
Number("42");      // 42
String(42);        // "42"
Boolean(0);        // false

// 암묵적 변환 — 여기서 사고가 난다
"1" + 1;           // "11"  (문자열 연결)
"1" - 1;           // 0     (숫자 뺄셈)
"3" * "4";         // 12
true + 1;          // 2
```

`+`는 문자열이 하나라도 있으면 연결로 동작하고, 나머지 산술 연산자는 숫자로 바꿔 계산합니다. 폼에서 받은 값은 항상 문자열이므로 `Number()`나 `parseInt()`로 먼저 바꿔야 합니다.

## 숫자와 산술 연산

```javascript
let a = 10, b = 3;

a + b;    // 13
a - b;    // 7
a * b;    // 30
a / b;    // 3.3333333333333335
a % b;    // 1    — 나머지
a ** b;   // 1000 — 거듭제곱
```

자바스크립트의 숫자는 모두 64비트 부동소수점입니다. 정수 나눗셈을 원하면 `Math.floor()`나 `Math.trunc()`를 씁니다. `Math.floor(-7 / 2)`는 `-4`, `Math.trunc(-7 / 2)`는 `-3`입니다.

부동소수점 오차도 실무에서 자주 걸립니다.

```javascript
0.1 + 0.2;                  // 0.30000000000000004
(0.1 + 0.2).toFixed(1);     // "0.3"
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON; // true
```

금액 계산을 정수 센트 단위로 하거나, 정밀도가 필요하면 정수로 바꿔 계산한 뒤 다시 나누는 방법을 씁니다. `Number.MAX_SAFE_INTEGER`(9007199254740991)를 넘는 정수는 `BigInt`가 필요합니다.

`NaN`은 "숫자가 아님"을 뜻하는 숫자 값입니다. 자기 자신과도 같지 않습니다.

```javascript
NaN === NaN;          // false
Number.isNaN(NaN);    // true
isNaN("abc");         // true — 문자열을 숫자로 바꿔 보고 판단
Number.isNaN("abc");  // false — 타입까지 검사
```

## 비교 연산자: ==와 ===

```javascript
5 == "5";    // true  — 타입을 바꿔서 비교
5 === "5";   // false — 타입이 다르면 false

0 == false;  // true
0 === false; // false

null == undefined;  // true
null === undefined; // false
```

실무 코드에서는 `===`와 `!==`만 씁니다. `==`는 타입을 임의로 바꾸는 규칙이 복잡해서, 결과를 예측하려고 규칙을 외워야 합니다.

예외적으로 `== null`은 "null 또는 undefined"를 한 번에 검사하는 관용 표현으로 쓰입니다.

```javascript
if (value == null) {
  // value가 null이거나 undefined일 때 진입
}
```

## 논리 연산자와 단축 평가

```javascript
true && false;  // false
true || false;  // true
!true;          // false
```

`&&`와 `||`는 불리언이 아니라 **값**을 돌려줍니다. 그래서 단축 평가로 기본값을 주는 코드가 흔합니다.

```javascript
const name = user && user.name;   // user가 falsy면 user.name을 읽지 않음
const label = input || "기본값";  // input이 ""나 0이면 "기본값"이 됨
```

`||`는 `0`, `""`, `NaN`도 falsy로 보기 때문에 의도하지 않은 기본값이 들어갈 수 있습니다. null과 undefined만 걸러내려면 `??`를 씁니다.

```javascript
const page = 0;
const a = page || 1;   // 1  — 0을 버림
const b = page ?? 1;   // 0  — null/undefined만 기본값
```

## 조건문

```javascript
const score = 85;

if (score >= 90) {
  console.log("A");
} else if (score >= 80) {
  console.log("B");
} else {
  console.log("C");
}
```

조건이 짧으면 삼항 연산자로 줄일 수 있습니다. 중첩이 두 단계를 넘어가면 읽기 어려워지므로 `if`로 되돌리는 편이 낫습니다.

```javascript
const label = score >= 60 ? "합격" : "불합격";
```

값이 여러 개 중 하나면 `switch`가 낫습니다.

```javascript
switch (new Date().getDay()) {
  case 0:
  case 6:
    console.log("주말");
    break;
  default:
    console.log("평일");
}
```

`break`를 빠뜨리면 아래 `case`까지 실행됩니다(fall-through). 의도한 경우가 아니라면 항상 `break`나 `return`을 붙입니다. `switch`는 `===`로 비교하므로 문자열과 숫자를 섞어 쓰면 매칭되지 않습니다.

## 반복문

### for

```javascript
for (let i = 0; i < 5; i++) {
  console.log(`반복 ${i + 1}`);
}
```

초기화 → 조건 검사 → 본문 → 증감 순서입니다. 인덱스가 필요할 때 가장 명확합니다.

### while / do-while

```javascript
let count = 0;
while (count < 3) {
  count++;
}

// 최소 한 번은 실행
let input;
do {
  input = prompt("계속하려면 yes");
} while (input !== "yes");
```

### for...of — 값 순회

```javascript
const fruits = ["사과", "바나나", "체리"];

for (const fruit of fruits) {
  if (fruit === "바나나") break;  // 조기 종료 가능
  console.log(fruit);
}
```

배열, 문자열, `Map`, `Set`처럼 이터러블이면 모두 됩니다.

### for...in — 키 순회

```javascript
const person = { name: "홍길동", age: 25 };

for (const key in person) {
  console.log(key, person[key]);
}
```

`for...in`은 객체의 열거 가능한 속성을 순회합니다. 배열에 쓰면 인덱스가 문자열로 나오고, 프로토타입에 추가된 속성까지 딸려 나올 수 있어 권장하지 않습니다. 객체의 키 목록이 필요하면 `Object.keys()`, 값은 `Object.values()`, 둘 다는 `Object.entries()`를 씁니다.

### forEach

```javascript
[10, 20, 30].forEach((num, index) => {
  console.log(index, num);
});
```

`forEach`는 `break`로 멈출 수 없고 반환값도 없습니다. 중간에 멈춰야 하면 `for...of`, 조건에 맞는 요소만 찾으면 `find()`, 변환은 `map()`을 씁니다.

### 어떤 반복문을 쓸까

| 상황 | 선택 |
|------|------|
| 배열의 값만 필요 | `for...of` |
| 인덱스가 필요 | `for`, `forEach` |
| 객체의 키·값 | `Object.entries()` + `for...of` |
| 반복 횟수를 모름 | `while` |
| 최소 한 번 실행 | `do-while` |
| 조기 종료 필요 | `for...of` + `break` |

## 자주 틀리는 부분

**1. `=`와 `==`를 혼동**

```javascript
if (x = 5) { }   // 대입 후 5가 truthy라 항상 통과
if (x === 5) { } // 의도한 비교
```

**2. `var`의 호이스팅과 TDZ**

```javascript
console.log(a); // undefined — 선언만 끌어올려짐
var a = 1;

console.log(b); // ReferenceError — TDZ
let b = 1;
```

`let`과 `const`도 호이스팅되지만, 선언 줄에 도달하기 전까지 접근할 수 없는 구간(Temporal Dead Zone)이 있습니다.

**3. 빈 값 판별**

```javascript
// ❌ 0과 ""도 걸러짐
if (!value) { }

// ✅ null/undefined만
if (value === undefined || value === null) { }
if (value == null) { }
```

**4. 문자열과 숫자 더하기**

```javascript
const input = "10";
input + 5;          // "105"
Number(input) + 5;  // 15
```

**5. `NaN` 비교**

```javascript
if (result === NaN) { }       // 절대 true가 되지 않음
if (Number.isNaN(result)) { } // 올바른 검사
```

## 정리

- 변수는 `const`를 기본으로, 재할당이 필요할 때만 `let`을 씁니다.
- 비교는 `===`를 쓰고, null 검사만 `== null`을 예외로 씁니다.
- 기본값은 `||`보다 `??`가 안전합니다. `0`과 `""`를 살릴 수 있습니다.
- 반복문은 값 순회에 `for...of`, 조기 종료가 필요하면 `for...of` + `break`를 씁니다.
- 폼 값은 문자열입니다. 계산 전에 `Number()`로 바꿉니다.

다음 글에서는 [자바스크립트 함수와 객체](/2026/11/28/javascript-functions-objects/)에서 스코프, 클로저, `this`, 프로토타입, 클래스를 다룹니다.
