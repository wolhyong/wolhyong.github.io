---
layout: post
title: "자바스크립트 ES6+ 문법 — 구조 분해, 스프레드, Map·Set, 옵셔널 체이닝, 모듈"
description: "실무에서 매일 쓰는 ES6 이후 문법을 정리했습니다. 구조 분해와 스프레드, 템플릿 리터럴, 옵셔널 체이닝과 널 병합, Map·Set, Symbol·BigInt·Generator, ES Modules까지 예제로 다룹니다."
date: 2026-11-28 13:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, es6, 구조분해, map, set, 옵셔널체이닝, modules]
---

ES6(ECMAScript 2015) 이후 자바스크립트는 매년 문법이 추가됐습니다. 그중 실무에서 반복해서 쓰는 것만 골라 정리했습니다. 2016년에 올린 ES6 기능, Map과 Set, 옵셔널 체이닝, Symbol·BigInt·Generator, 모듈 글을 한 편으로 합쳤습니다.

## 구조 분해

배열과 객체에서 값을 꺼내 변수에 담는 문법입니다.

```javascript
// 배열
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first=1, second=2, rest=[3, 4, 5]

const [, , third] = [1, 2, 3];   // 자리 비우기
// third=3

// 객체
const user = { name: "홍길동", age: 25 };
const { name, age } = user;

// 이름 바꾸기, 기본값
const { name: userName, role = "user" } = user;
```

함수 매개변수에서도 그대로 쓸 수 있습니다. 옵션 객체를 받는 함수에서 유용합니다.

```javascript
function connect({ host, port = 443, secure = true } = {}) {
  return `${secure ? "https" : "http"}://${host}:${port}`;
}

connect({ host: "example.com" }); // "https://example.com:443"
connect();                        // 매개변수 기본값이 없으면 TypeError
```

중첩 구조는 단계를 맞춰야 하고, 중간이 `undefined`면 예외가 납니다.

```javascript
const data = { user: { profile: { city: "서울" } } };

const {
  user: {
    profile: { city },
  },
} = data;

// ❌ 중간이 없으면 TypeError
// const { user: { missing: { x } } } = data;
```

기본값은 `undefined`일 때만 적용됩니다. `null`에는 적용되지 않습니다.

```javascript
const { a = 1 } = { a: null }; // a === null
```

## 스프레드와 레스트

같은 `...` 문법이 위치에 따라 다르게 동작합니다. 값 옆에 있으면 펼치고, 매개변수나 구조 분해 위치에 있으면 모읍니다.

```javascript
// 펼치기
const arr = [1, 2, 3];
Math.max(...arr);            // 3
const copy = [...arr, 4];    // [1, 2, 3, 4]

const base = { theme: "dark", lang: "ko" };
const merged = { ...base, lang: "en" }; // 뒤에 온 값이 이김

// 모으기
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
const [head, ...tail] = arr;
```

객체 복사는 1단계만 됩니다. 중첩 객체는 같은 참조를 공유합니다.

```javascript
const state = { filters: { region: "통영" }, page: 1 };
const next = { ...state, page: 2 };          // page만 새 값
next.filters.region = "서울";
state.filters.region;                        // "서울" — 공유됨

// 한 단계 더 들어가서 복사
const deeper = { ...state, filters: { ...state.filters, region: "서울" } };
```

불변 업데이트를 할 때는 바뀌는 경로만 새 객체로 만들고 나머지는 그대로 둡니다.

```javascript
function updateCity(state, city) {
  return {
    ...state,
    user: {
      ...state.user,
      address: { ...state.user.address, city },
    },
  };
}
```

## 템플릿 리터럴

```javascript
const name = "개발자";
const msg = `안녕하세요, ${name}님!
여러 줄도 그대로 씁니다.`;

const price = 15000;
`${price.toLocaleString("ko-KR")}원`; // "15,000원"
```

태그드 템플릿은 문자열 조각과 값을 따로 받습니다. HTML 이스케이프처럼 값에 규칙을 적용할 때 씁니다.

```javascript
function escapeHtml(strings, ...values) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return strings.reduce((out, str, i) => {
    const value = values[i] === undefined ? "" : String(values[i]);
    return out + str + value.replace(/[&<>"']/g, (ch) => map[ch]);
  }, "");
}

escapeHtml`<p>${userInput}</p>`;
```

## 옵셔널 체이닝과 널 병합

중첩 객체를 읽을 때 `undefined` 때문에 예외가 나는 것을 막습니다.

```javascript
const user = { name: "홍길동", address: { city: "서울" } };

user?.address?.city;      // "서울"
user?.work?.address?.city; // undefined (예외 없음)
user?.getName?.();        // 함수가 없으면 undefined
arr?.[0];                 // 배열이 null/undefined면 undefined
obj?.[dynamicKey];
```

왼쪽이 `null` 또는 `undefined`일 때만 멈춥니다. `0`이나 `""`는 그대로 진행합니다.

```javascript
const value = 0;
value?.toString();  // "0"
```

널 병합 연산자 `??`는 `null`과 `undefined`만 기본값으로 바꿉니다.

```javascript
0 ?? 10;      // 0
"" ?? "기본"; // ""
null ?? 10;   // 10

// ||는 falsy 전부를 바꿈
0 || 10;      // 10
"" || "기본"; // "기본"
```

설정값처럼 `0`과 `false`가 유효한 값이면 `??`를 씁니다.

```javascript
const config = {
  timeout: userConfig?.timeout ?? 5000,
  retries: userConfig?.retries ?? 3,
  enabled: userConfig?.enabled ?? false,
};
```

논리 할당 연산자는 조건이 맞을 때만 대입합니다.

```javascript
let options = null;
options ??= {};        // null/undefined일 때만 대입
options.retries ||= 3; // falsy일 때 대입
options.strict &&= true; // truthy일 때만 대입
```

`?.`와 `??`를 함께 쓸 때 괄호가 필요할 수 있습니다.

```javascript
// SyntaxError — ??와 ||를 괄호 없이 섞을 수 없음
// const x = a ?? b || c;

const x = (a ?? b) || c;   // 의도를 괄호로 표시
```

## Map과 Set

### Map

객체와 비슷하지만 키에 제한이 없고, 삽입 순서를 보장하며, 크기를 바로 알 수 있습니다.

```javascript
const map = new Map();

map.set("name", "홍길동");
map.set(42, "숫자 키");
map.set(true, "불리언 키");

const keyObj = { id: 1 };
map.set(keyObj, "객체 키");

map.get(keyObj);   // "객체 키"
map.has("name");   // true
map.size;          // 4
map.delete(42);
```

순회와 변환이 쉽습니다.

```javascript
for (const [key, value] of map) {
  console.log(key, value);
}

[...map.keys()];
[...map.values()];
[...map.entries()];
Object.fromEntries(map);   // 문자열 키일 때만 객체로 변환
```

`Map`의 키는 참조로 비교합니다. 같은 내용의 객체라도 다른 참조면 다른 키입니다.

```javascript
const a = { id: 1 };
const b = { id: 1 };
const m = new Map([[a, "A"]]);
m.get(b); // undefined
```

### Set

중복을 허용하지 않는 값의 집합입니다.

```javascript
const set = new Set([1, 2, 3, 2, 1]);
set;         // Set(3) { 1, 2, 3 }
set.has(2);  // true
set.add(4);
set.size;    // 4
```

중복 제거와 포함 검사에 씁니다.

```javascript
[...new Set([1, 1, 2, 3, 3])];       // [1, 2, 3]

const allowed = new Set(["admin", "editor"]);
allowed.has(role);                    // 배열 includes보다 빠름

const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

const intersection = [...a].filter((x) => b.has(x)); // [2, 3]
const union = [...new Set([...a, ...b])];            // [1, 2, 3, 4]
const difference = [...a].filter((x) => !b.has(x));  // [1]

// 최신 브라우저에서는 메서드도 지원
a.intersection?.(b);
```

`Set`도 값을 참조로 비교합니다. 객체를 중복 제거하려면 `id` 같은 키로 별도 처리가 필요합니다.

### Map과 객체 비교

| 항목 | Map | 객체 |
|------|-----|------|
| 키 타입 | 모든 값 | 문자열, Symbol |
| 삽입 순서 | 보장 | 문자열 키는 보장, 숫자 키는 정렬됨 |
| 크기 | `size` | `Object.keys().length` |
| 잦은 추가·삭제 | 유리 | 상대적으로 불리 |
| JSON 직렬화 | 직접 변환 필요 | `JSON.stringify` 그대로 |

키가 문자열이고 정해져 있으면 객체가 간단합니다. 키가 동적이거나 숫자·객체이고 순서가 중요하면 `Map`이 맞습니다.

## Symbol과 BigInt

### Symbol

항상 고유한 값입니다. 같은 설명으로 만들어도 다릅니다.

```javascript
const a = Symbol("id");
const b = Symbol("id");
a === b; // false
```

객체의 숨은 속성 키로 씁니다. `Object.keys()`나 `JSON.stringify()`에 나오지 않습니다.

```javascript
const SECRET = Symbol("secret");
const user = { name: "홍길동", [SECRET]: 12345 };

Object.keys(user);        // ["name"]
user[SECRET];             // 12345
```

잘 알려진 심볼은 언어 동작을 확장합니다. `Symbol.iterator`를 구현하면 `for...of`로 순회할 수 있습니다.

```javascript
class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  *[Symbol.iterator]() {
    for (let i = this.start; i <= this.end; i++) yield i;
  }
}

[...new Range(1, 4)]; // [1, 2, 3, 4]
```

### BigInt

`Number.MAX_SAFE_INTEGER`를 넘는 정수를 정확하게 다룹니다. 숫자 뒤에 `n`을 붙이거나 `BigInt()`로 만듭니다.

```javascript
const max = Number.MAX_SAFE_INTEGER; // 9007199254740991
max + 1 === max + 2;                 // true — 정밀도 손실

const big = 9007199254740991n;
big + 1n === big + 2n;               // false

BigInt("9007199254740993");
```

제약이 있습니다. 소수는 표현할 수 없고, `Number`와 섞어서 연산하면 `TypeError`가 납니다. `JSON.stringify()`도 그대로는 실패합니다.

```javascript
1n + 1;            // TypeError
1n + BigInt(1);    // 2n
Number(2n) + 1;    // 3 — 정밀도가 필요한 구간이 아니면 변환

JSON.stringify({ id: 1n }); // TypeError
JSON.stringify({ id: 1n.toString() }); // 가능
```

## Generator와 이터레이터

`function*`은 `yield`에서 멈추고 다시 호출되면 이어서 실행됩니다.

```javascript
function* countTo(n) {
  for (let i = 1; i <= n; i++) {
    yield i;
  }
}

const counter = countTo(3);
counter.next(); // { value: 1, done: false }
counter.next(); // { value: 2, done: false }
counter.next(); // { value: 3, done: false }
counter.next(); // { value: undefined, done: true }

[...countTo(3)]; // [1, 2, 3]
```

무한 시퀀스를 필요한 만큼만 만들 수 있습니다.

```javascript
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
Array.from({ length: 10 }, () => fib.next().value);
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

지연 평가로 필요한 만큼만 계산하는 파이프라인을 만들 수 있습니다.

```javascript
function* map(iterable, fn) {
  for (const item of iterable) yield fn(item);
}

function* filter(iterable, predicate) {
  for (const item of iterable) {
    if (predicate(item)) yield item;
  }
}

const evenDoubled = map(
  filter(fibonacci(), (n) => n % 2 === 0),
  (n) => n * 10
);

// 처음 다섯 개만 계산
Array.from({ length: 5 }, () => evenDoubled.next().value);
// [0, 10, 30, 80, 210]
```

`for...of` 안에서 `yield`를 쓰면 재귀 구조도 자연스럽게 평탄화됩니다.

## 모듈

### ES Modules

```javascript
// math.js
export const PI = 3.14159;
export function add(a, b) {
  return a + b;
}
export default class Calculator {}

// app.js
import Calculator, { PI, add } from "./math.js";
import * as math from "./math.js";
```

`export default`는 파일당 하나이고 이름을 자유롭게 붙일 수 있습니다. 이름 있는 export는 여러 개를 내보내고, 가져올 때 이름이 고정됩니다. 번들러의 트리 셰이킹은 이름 있는 export에서 잘 동작합니다.

```javascript
// 이름 바꿔 가져오기는 import 쪽에서
import { add as sum } from "./math.js";
```

### 동적 임포트

필요한 시점에 모듈을 불러옵니다. Promise를 반환합니다.

```javascript
async function openEditor() {
  const { Editor } = await import("./editor.js");
  return new Editor();
}

// 라우트 단위 코드 분할
const routes = {
  "/dashboard": () => import("./pages/Dashboard.js"),
  "/settings": () => import("./pages/Settings.js"),
};
```

### ESM과 CommonJS

| 항목 | ESM | CommonJS |
|------|-----|----------|
| 문법 | `import` / `export` | `require()` / `module.exports` |
| 분석 시점 | 정적 (빌드 타임) | 실행 시점 |
| 트리 셰이킹 | 가능 | 어려움 |
| 최상위 await | 가능 | 불가능 |
| 사용 환경 | 브라우저, 최신 Node.js | Node.js 레거시 |

```javascript
// CommonJS
const { add } = require("./math");
module.exports = { add };
```

Node.js에서는 `package.json`의 `"type": "module"` 설정이나 `.mjs` 확장자로 ESM을 씁니다. 브라우저에서는 `<script type="module">`이어야 하고, `file://`로 열면 CORS 오류가 납니다. 로컬 서버가 필요합니다.

```html
<script type="module" src="/app.js"></script>
```

## 자주 틀리는 부분

**1. 구조 분해에서 중간 경로가 없음**

```javascript
const { user: { name } } = state; // user가 없으면 TypeError
const name = state.user?.name;     // 옵셔널 체이닝으로 회피
```

**2. `??`와 `||` 혼용**

괄호 없이 섞으면 `SyntaxError`입니다. 의도를 괄호로 드러냅니다.

**3. Map 키를 매번 새 객체로**

```javascript
map.set({ id: 1 }, "값");
map.get({ id: 1 }); // undefined — 다른 참조
```

키로 쓸 객체는 변수에 담아 재사용하거나, `id`를 문자열 키로 씁니다.

**4. BigInt와 Number 혼합**

```javascript
const total = 10n + 5; // TypeError
const total2 = 10n + BigInt(5); // 15n
```

**5. 객체에 spread를 썼는데 원본이 바뀜**

중첩 객체는 참조가 공유됩니다. 필요한 깊이만큼 펼쳐서 복사합니다.

**6. 모듈 확장자 생략**

브라우저의 ESM은 확장자를 생략할 수 없습니다. `import { add } from "./math"`는 404가 납니다. 번들러는 해석해 주지만 브라우저는 그렇지 않습니다.

## 정리

- 구조 분해와 스프레드는 코드 길이를 줄이지만, 중첩 복사는 1단계까지만 됩니다.
- 기본값은 `undefined`에만 적용됩니다. `null`은 그대로 들어갑니다.
- `??`는 `0`과 `""`를 살리고, `||`는 falsy 전부를 기본값으로 바꿉니다.
- 키가 동적이거나 순서가 중요하면 `Map`, 중복 제거와 포함 검사는 `Set`입니다.
- 모듈은 이름 있는 export로 두면 트리 셰이킹과 자동 완성에 유리합니다.

다음 글에서는 [자바스크립트 실전 품질](/2026/11/28/javascript-quality-practice/)에서 에러 처리, 정규식, 성능, Web Worker, 테스트를 다룹니다.
