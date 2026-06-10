---
layout: post
title: "Node.js 모듈 시스템 — CommonJS와 ES Modules 완벽 이해"
description: "Node.js의 모듈 시스템을 심층 학습합니다. CommonJS(require/exports), ES Modules(import/export), 모듈 캐싱과 메모리 구조, 순환 참조 해결 전략, 두 시스템 간의 차이점과 상호 운용 방법을 라인별 코드 분석과 함께 다룹니다."
date: 2022-04-25 10:00:00 +0900
category: nodejs
tags: [nodejs, javascript, commonjs, es-modules, module-system, require, import, tree-shaking]
level: beginner
---

Node.js에서 **모듈**은 코드를 논리적 단위로 분리하고 재사용하는 기본 메커니즘입니다. 하나의 파일이 하나의 모듈이며, `require`나 `import`로 다른 모듈을 불러올 수 있습니다.

> **이 수업에서 배울 내용:** CommonJS의 `require()` 내부 동작 방식(Module._load의 5단계), `exports`와 `module.exports`의 참조 관계와 메모리 구조, ES Modules의 정적 분석이 Tree Shaking을 가능하게 하는 원리, 모듈 캐싱의 메모리 레이아웃, 순환 참조가 발생했을 때 Node.js의 처리 방식, 그리고 두 모듈 시스템의 상호 운용 전략까지 단계별로 학습합니다.

## 수업 목표

- CommonJS 모듈 시스템의 `require`/`exports`를 이해합니다.
- ES Modules의 `import`/`export` 문법을 학습합니다.
- 모듈 캐싱과 순환 참조의 동작 방식을 이해합니다.
- CommonJS와 ES Modules의 차이점과 상호 운용 방법을 압니다.

## CommonJS 모듈 시스템이 동작하는 방식

Node.js는 초기부터 **CommonJS** 모듈 시스템을 사용했습니다. 모든 파일은 독립된 모듈로, `module.exports`로 내보내고 `require()`로 가져옵니다.

### 모듈 내보내기 (exports)

```javascript
// math.js — 모듈 내보내기

// 개별 속성 내보내기
exports.add = (a, b) => a + b;
exports.subtract = (a, b) => a - b;

// 하나의 객체로 내보내기
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => {
    if (b === 0) throw new Error('0으로 나눌 수 없습니다');
    return a / b;
  }
};

// 또는 함수 자체를 내보내기
module.exports = function(a, b) {
  return a + b;
};
```

**코드 분석 — `exports`와 `module.exports`의 메모리 구조:**

Node.js가 모듈을 로드할 때 내부적으로 생성하는 객체 구조를 추적해보겠습니다:

```text
모듈 로드 시점:
  module = { exports: {} }    // 빈 객체 생성
  exports = module.exports    // 같은 객체를 가리킴
  
  초기 상태:
  module.exports ──→ {} ←── exports
  
  exports.add = (a, b) => a + b 실행 후:
  module.exports ──→ { add: fn } ←── exports
  
  module.exports = { ... } 실행 후:
  module.exports ──→ { add: fn, subtract: fn, multiply: fn, divide: fn }
  exports ──→ { add: fn }  ← 참조가 끊어짐!
```

`exports`는 `module.exports`의 **별칭(alias)** 일 뿐입니다. `exports.add`처럼 속성을 추가하면 `module.exports.add`도 같은 객체를 수정합니다. 그러나 `exports = {...}`처럼 **재할당**하면 `exports`가 다른 객체를 가리키게 되어 연결이 끊어집니다.

**깊이 있는 설명 — `require()`가 모듈을 로드하는 5단계 내부 동작:**

Node.js의 `require()` 함수는 내부적으로 `Module._load()`를 호출하며, 다음 5단계로 동작합니다:

```text
1. Module._resolveFilename():
   → 모듈 경로 해석 (.js, .json, .node 순서로 시도)
   → require('./math') → ./math.js, ./math.json, ./math/index.js 순서 검색
   → resolve 시간: 평균 0.01~0.05ms (캐시된 경로)

2. Module._cache 확인:
   → 이미 로드된 모듈이면 캐시에서 즉시 반환
   → 캐시 히트 시: 0.001ms (거의 무비용)
   → 첫 로드 시: 이 단계 스킵

3. new Module():
   → 새 Module 인스턴스 생성
   → module.id = 파일의 전체 경로
   → module.exports = {} (빈 객체)

4. Module.prototype.load():
   → 파일 확장자에 따라 적절한 로더 호출
   → .js → Module._extensions['.js'](module, filename)
   → .json → JSON.parse
   → .node → process.dlopen (C++ 애드온)

5. Module._extensions['.js']:
   → fs.readFileSync로 파일 읽기 (동기!)
   → 파일 내용을 함수로 감싸기:
     (function(exports, require, module, __filename, __dirname) {
       // 사용자 코드가 여기에 삽입됨
     })
   → VM 모듈로 컴파일 후 실행
   → module.exports 반환
```

이 5단계 과정은 모듈이 처음 `require()`될 때만 실행됩니다. 이후 동일한 모듈을 `require()`하면 2단계에서 캐시를 반환하므로 부하가 거의 없습니다.

### require의 모듈 로딩 순서와 성능

```javascript
require('express');    // 1. 내장 모듈 확인 → fs, path, http 등
                       // 2. node_modules/express 확인
                       // 3. node_modules 상위 디렉토리까지 검색
                       // 4. 없으면 MODULE_NOT_FOUND 에러

require('./helper');   // 1. 동일 디렉토리에서 ./helper.js 확인
                       // 2. ./helper.json 확인
                       // 3. ./helper/index.js 확인 (디렉토리인 경우)
                       // 4. ./helper/index.node 확인
```

**깊이 있는 설명 — `require.resolve()`의 경로 탐색 비용:**

```javascript
// require.resolve()로 실제 모듈 경로 확인 가능
console.log(require.resolve('express'));
// → /Users/user/node_modules/express/index.js

// 경로 탐색에 걸리는 시간 측정
const start = process.hrtime.bigint();
for (let i = 0; i < 10000; i++) {
  require.resolve('path');  // 내장 모듈
}
const end = process.hrtime.bigint();
console.log(`내장 모듈 resolve 평균: ${Number(end - start) / 10000 / 1000}μs`);
// → 약 0.2~0.5μs (매우 빠름)

const start2 = process.hrtime.bigint();
for (let i = 0; i < 1000; i++) {
  require.resolve('lodash');  // node_modules
}
const end2 = process.hrtime.bigint();
console.log(`node_modules resolve 평균: ${Number(end2 - start2) / 1000 / 1000}μs`);
// → 약 2~10μs (디렉토리 깊이에 따라 증가)
```

**실전 노하우:** `node_modules`가 깊게 중첩될수록 `require()` 경로 탐색 시간이 늘어납니다. npm 3+는 평탄한 구조로 설치하지만, 패키지 간 의존성이 충돌하면 여전히 중첩이 발생합니다. 프로젝트 시작 시 `require.resolve()` 시간이 비정상적으로 길다면 중복 설치된 패키지가 없는지 확인하세요.

### 디렉토리 형태의 모듈

```text
my-module/
├── index.js      # 진입점 (require('./my-module') → index.js)
├── helper.js
└── utils.js
```

```javascript
// my-module/index.js
const helper = require('./helper');
const utils = require('./utils');

module.exports = {
  run: () => {
    helper.doWork();
    utils.format();
  }
};
```

## ES Modules (ESM)의 정적 분석이 가능한 이유

Node.js 12부터 **ES Modules**(ESM)을 공식 지원합니다. 브라우저와 동일한 `import`/`export` 문법을 사용합니다.

### ESM 활성화 방법

```json
// package.json에 추가
{
  "type": "module"
}
```

또는 `.mjs` 확장자 사용:

```text
app.mjs    → ESM으로 인식
helper.mjs → ESM으로 인식
app.js     → type: "module"이 없으면 CommonJS
```

### 모듈 내보내기 (export)

```javascript
// math.mjs
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// 기본 내보내기 (default export)
export default class Calculator {
  constructor() {
    this.history = [];
  }

  add(a, b) {
    this.history.push(`${a} + ${b} = ${a + b}`);
    return a + b;
  }
}

// 이름을 바꿔 내보내기
export { add as sum };

// 여러 값을 그룹화하여 내보내기
const PI = 3.14159;
const E = 2.71828;
export { PI, E };
```

### 모듈 가져오기 (import)

```javascript
// app.mjs

// 이름 있는 내보내기 가져오기
import { add, subtract, PI } from './math.mjs';
console.log(add(2, 3)); // 5

// 기본 내보내기 가져오기
import Calculator from './math.mjs';
const calc = new Calculator();
console.log(calc.add(2, 3)); // 5

// 모두 가져와서 네임스페이스로 사용
import * as math from './math.mjs';
console.log(math.add(2, 3)); // 5
console.log(math.PI);        // 3.14159

// 이름 바꿔 가져오기
import { add as sum } from './math.mjs';
```

**깊이 있는 설명 — ESM의 정적 분석이 Tree Shaking을 가능하게 하는 원리:**

CommonJS와 ESM의 가장 큰 차이는 **로딩 방식이 동적인지 정적인지**입니다. 이 차이가 번들러의 최적화 가능성을 결정합니다.

```text
CommonJS (동적):
  const moduleName = getUserInput();     // ← 런타임에 결정됨
  const module = require(`./plugins/${moduleName}`);
  
  번들러(webpack, esbuild)는:
  - ./plugins/ 디렉토리의 모든 파일을 포함해야 함
  - 어떤 함수를 사용할지 알 수 없음
  - 결과: 모든 코드가 번들에 포함됨 (크기 증가)

ESM (정적):
  import { add } from './math.mjs';      // ← 컴파일 타임에 결정됨
  
  번들러는:
  - add 함수만 사용됨을 정적으로 분석 가능
  - subtract, multiply는 제거해도 안전함을 확신
  - 결과: 사용되지 않는 코드가 번들에서 제거됨 (크기 감소)
```

**Tree Shaking의 실제 효과 측정:**

```javascript
// math.js — 모든 함수를 export
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export const multiply = (a, b) => a * b;
export const divide = (a, b) => a / b;
export const pow = (a, b) => a ** b;
export const sqrt = (a) => Math.sqrt(a);
export const log = (a) => Math.log(a);
export const sin = (a) => Math.sin(a);
export const cos = (a) => Math.cos(a);
export const tan = (a) => Math.tan(a);

// app.js — add와 multiply만 사용
import { add, multiply } from './math.js';
console.log(add(2, 3), multiply(4, 5));

// 번들 결과 비교:
// CommonJS: 전체 10개 함수 모두 포함 → 약 1.2KB
// ESM + Tree Shaking: add, multiply만 포함 → 약 250바이트 (79% 감소!)
```

**실전 노하우:** Tree Shaking이 효과적으로 동작하려면:
1. **사이드 이펙트가 없는 순수 함수**로 작성할 것 (전역 변수 수정 금지)
2. `package.json`에 `"sideEffects": false` 설정 (번들러에게 "이 패키지는 부수 효과가 없음"을 알림)
3. CSS import는 `"sideEffects": ["./*.css"]`로 예외 처리
4. barrel 파일(`index.js`에서 모든 것을 re-export)은 Tree Shaking을 방해할 수 있으므로 주의

## 모듈 캐싱의 메모리 레이아웃

Node.js는 `require()` 호출 시 모듈을 **한 번만 실행**하고 결과를 캐싱합니다. 같은 모듈을 여러 번 `require()`해도 첫 번째 결과가 반환됩니다.

```javascript
// counter.js
let count = 0;
module.exports = {
  increment: () => ++count,
  getCount: () => count
};

// app.js
const counter1 = require('./counter');
const counter2 = require('./counter');

counter1.increment();
counter1.increment();

console.log(counter2.getCount()); // 2 — 같은 인스턴스!
console.log(counter1 === counter2); // true — 같은 객체!
```

**깊이 있는 설명 — `require.cache`의 메모리 구조:**

```text
require.cache = {
  '/Users/user/project/node_modules/express/index.js': Module {
    id: '.',                          // 모듈 ID
    path: '/Users/user/project',      // 모듈 경로
    exports: { ... },                 // 내보낸 객체
    filename: '.../express/index.js', // 전체 파일 경로
    loaded: true,                     // 로드 완료 여부
    children: [ ... ],                // 이 모듈이 require한 모듈들
    parent: Module { ... }            // 이 모듈을 require한 모듈
  },
  '/Users/user/project/app.js': Module { ... },
  '/Users/user/project/counter.js': Module {
    ...
    exports: { increment: fn, getCount: fn },
    loaded: true
  }
}
```

모든 `require()` 호출은 이 `require.cache` 객체를 먼저 확인합니다. 캐시 히트 시 `Module._load()`는 1~2단계에서 바로 `module.exports`를 반환하므로 추가 파일 I/O가 발생하지 않습니다.

**캐싱 초기화하기 (개발 시 유용):**

```javascript
// 캐시된 모듈 삭제
delete require.cache[require.resolve('./counter')];
const freshCounter = require('./counter'); // 새로 실행됨

// 특정 디렉토리의 모든 캐시 초기화
const clearModuleCache = (dir) => {
  Object.keys(require.cache).forEach(key => {
    if (key.startsWith(dir)) {
      delete require.cache[key];
    }
  });
};
```

**성능 측정 — 캐시 히트 vs 미스:**

```javascript
const start = process.hrtime.bigint();
for (let i = 0; i < 100000; i++) {
  require('fs');  // 캐시 히트 (이미 로드됨)
}
const cached = process.hrtime.bigint();
console.log(`캐시 히트: ${Number(cached - start) / 100000}ns`);  // 약 50~100ns

delete require.cache[require.resolve('path')];
const start2 = process.hrtime.bigint();
for (let i = 0; i < 100; i++) {
  require('path');  // 캐시 미스 (매번 새로 로드)
}
const missed = process.hrtime.bigint();
console.log(`캐시 미스: ${Number(missed - start2) / 100 / 1000}μs`);  // 약 500~2000μs
```

캐시 미스는 히트 대비 약 **5,000~20,000배** 느립니다. 핫 리로드 환경(예: `nodemon`)에서 캐시가 자주 초기화되면 성능 저하가 발생할 수 있습니다.

## 순환 참조 (Circular Dependencies)가 발생하는 이유와 해결 전략

모듈 A가 B를 참조하고, B가 다시 A를 참조하는 상황입니다. Node.js는 이를 허용하지만, 미완성된 모듈이 반환될 수 있습니다.

```javascript
// a.js
console.log('a.js 시작');
const b = require('./b');
console.log('a.js에서 b.add:', b.add(1, 2));
module.exports = { value: 'A' };
console.log('a.js 완료');

// b.js
console.log('b.js 시작');
const a = require('./a');
console.log('b.js에서 a.value:', a.value); // undefined!
module.exports = { add: (x, y) => x + y };
console.log('b.js 완료');

// main.js
require('./a');

// 실행 결과:
// a.js 시작
// b.js 시작
// b.js에서 a.value: undefined  ← 아직 a.js가 완성되지 않음!
// b.js 완료
// a.js에서 b.add: 3
// a.js 완료
```

**코드 분석 — 순환 참조가 undefined를 반환하는 이유:**

Node.js가 순환 참조를 처리하는 과정을 단계별로 추적해보겠습니다:

```text
1. main.js가 require('./a') 호출
   → a.js 파일 읽기 시작
   → require.cache에 a.js 등록 (아직 exports = {})
   
2. a.js의 const b = require('./b') 실행
   → b.js 파일 읽기 시작
   → require.cache에 b.js 등록
   
3. b.js의 const a = require('./a') 실행
   → require.cache에서 a.js 발견 (캐시 히트!)
   → 하지만 a.js의 module.exports는 아직 {} (실행 중)
   → a.value = undefined (빈 객체이므로)
   
4. b.js의 module.exports = { add: (x, y) => x + y } 실행
   → b.js 실행 완료
   
5. a.js로 돌아와서 b에 할당
   → b = { add: fn } (방금 완성됨)
   → b.add(1, 2) → 3 정상 출력
```

**순환 참조 해결 전략:**

```javascript
// 전략 1: 의존성 역전 — 공통 기능을 별도 모듈로 분리
// common.js — A와 B가 모두 의존하는 공통 모듈
module.exports = {
  sharedFunction: () => '공통 기능'
};

// a.js — common만 의존, b 의존 제거
const common = require('./common');
module.exports = { value: 'A', ...common };

// b.js — common만 의존, a 의존 제거
const common = require('./common');
module.exports = { value: 'B', ...common };

// 전략 2: 지연 로딩 — 함수 내부에서 require
// a.js
module.exports = {
  getValue: () => 'A',
  useB: () => {
    const b = require('./b');  // 실제 사용 시점에 로드
    return b.doSomething();
  }
};
```

**실전 노하우:** 순환 참조는 대부분 **설계 문제**를 나타냅니다. 의존성 그래프가 복잡해지면 다음과 같은 패턴을 고려하세요:
1. **의존성 방향 단순화:** A → B → C (단방향)으로 리팩토링
2. **이벤트 에미터 패턴:** 직접 참조 대신 이벤트로 통신
3. **의존성 주입:** 모듈이 직접 require하지 않고 외부에서 주입받음

## CommonJS와 ES Modules의 차이점이 성능에 미치는 영향

| 특징 | CommonJS | ES Modules | 성능 영향 |
|------|----------|------------|-----------|
| 로딩 방식 | 동기 (require) | 비동기 (import) | CJS: 초기 로드 시 블로킹, ESM: 병렬 로딩 가능 |
| 문법 | `require()`, `module.exports` | `import`, `export` | — |
| 기본값 | 모든 .js 파일 | package.json에 `\"type\": \"module\"` 필요 | — |
| 확장자 | .js, .cjs | .mjs, .js (type: module) | — |
| Top-level await | ❌ 불가능 | ✅ 가능 | ESM: 비동기 초기화 코드 작성 가능 |
| Tree shaking | ❌ 어려움 | ✅ 정적 분석 가능 | ESM: 번들 크기 30~80% 감소 가능 |
| 순환 참조 | ✅ 부분적 허용 | ❌ 에러 발생 가능 | CJS: 유연하지만 예측 어려움 |
| this | module.exports (빈 객체) | undefined | — |
| 시작 시간 | 빠름 (직접 실행) | 느림 (파싱 후 실행) | ESM: 전체 파싱 필요, 약 10~30% 더 오래 걸림 |
| 모듈 그래프 분석 | 불가능 (런타임) | 가능 (컴파일 타임) | ESM: 번들러 최적화에 유리 |

### ESM에서 CommonJS 불러오기

```javascript
// ESM 파일에서 CommonJS 모듈은 기본 내보내기로만 가져올 수 있음
import fs from 'fs';           // 기본: module.exports 전체
import { readFile } from 'fs'; // ❌ 오류 — CJS는 named export가 없음

// createRequire로 CJS 모듈 직접 사용
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const lodash = require('lodash'); // require 함수 직접 사용
```

**깊이 있는 설명 — `createRequire`가 ESM 내에서 CJS를 실행하는 방식:**

`createRequire(import.meta.url)`는 ESM 컨텍스트 안에 CJS 실행 환경을 만듭니다:

```text
1. import.meta.url → 현재 ESM 파일의 URL (예: file:///project/app.mjs)
2. createRequire()가 이 URL을 기준으로 CJS 모듈 해석기 생성
3. 생성된 require()는 내부적으로 Module._load()를 호출
4. CJS 모듈은 별도의 함수 스코프에서 실행되어 ESM과 격리
```

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: package.json의 "type": "module"이 무슨 역할을 하나요?</strong></summary>
프로젝트의 모든 .js 파일을 ES Modules로 처리하도록 지정합니다. 설정하지 않으면 기본값은 CommonJS입니다. .cjs와 .mjs 확장자는 이 설정보다 우선합니다. 즉, `"type": "module"`이어도 `.cjs` 파일은 항상 CommonJS로 처리됩니다.
</details>

<details>
<summary><strong>Q: require와 import를 함께 사용할 수 있나요?</strong></summary>
같은 파일 내에서는 불가능합니다. CommonJS 파일(`require`)과 ESM 파일(`import`)은 프로젝트 단위로 통일하는 것이 좋습니다. 전환이 필요하다면 `createRequire()`를 사용해 ESM 파일 내에서 CJS 모듈을 불러올 수 있습니다. 반대로 CJS에서 ESM을 불러오려면 동적 `import()`를 사용해야 합니다.
</details>

<details>
<summary><strong>Q: 모듈 캐싱이 테스트에 방해가 되는데 어떻게 해야 하나요?</strong></summary>
`jest` 같은 테스트 프레임워크는 자동으로 모듈 캐시를 초기화합니다. 수동으로는 `delete require.cache[key]`를 사용할 수 있습니다. 단, 캐시 초기화 후에도 모듈 내부의 클로저 변수 상태가 완전히 초기화되지 않을 수 있으므로, 테스트 환경에서는 각 테스트 케이스마다 모듈이 새로 로딩되도록 `beforeEach`에서 캐시를 초기화하는 패턴을 권장합니다.
</details>

<details>
<summary><strong>Q: Tree Shaking이 항상 효과적인가요?</strong></summary>
아니요. Tree Shaking은 다음 조건에서만 효과적입니다:
1. ESM 문법 사용 (`import`/`export`)
2. 번들러가 정적 분석 가능한 구조 (동적 import 경로 금지)
3. 사이드 이펙트가 없는 순수 함수
4. `package.json`에 `"sideEffects": false` 설정
5. CSS, 폴리필 등 사이드 이펙트가 있는 모듈은 별도 예외 처리

실제 프로젝트에서는 번들 크기를 **30~60%** 감소시킬 수 있지만, 라이브러리가 CJS로만 제공되는 경우 효과가 제한적입니다.
</details>

<details>
<summary><strong>Q: CommonJS에서 ESM으로 마이그레이션하는 가장 안전한 방법은?</strong></summary>
단계적 마이그레이션이 가장 안전합니다: (1) 새 파일은 `.mjs` 확장자로 ESM 작성, (2) `createRequire()`로 기존 CJS 모듈을 ESM에서 import, (3) 기존 CJS 파일은 동적 `import()`로 ESM 호출, (4) 모든 파일이 ESM으로 전환되면 `"type": "module"` 설정. 이 방법은 프로젝트를 중단하지 않고 점진적으로 전환할 수 있습니다.
</details>

## 요약

- **CommonJS** — Node.js 기본 모듈 시스템, `require()`는 5단계(`_resolveFilename` → `_cache` → `new Module` → `load` → `_extensions`)로 동작
- **ES Modules** — 표준 JavaScript 모듈 시스템, 정적 분석으로 Tree Shaking 가능 (번들 크기 30~80% 감소)
- 모듈은 **한 번만 실행**되고 `require.cache`에 결과가 캐싱됨 (캐시 히트: ~100ns, 미스: ~2000μs, 약 20,000배 차이)
- **순환 참조**는 가능하면 피하고, 불가피하면 지연 로딩이나 의존성 역전으로 해결
- **ESM은 정적 분석**이 가능하여 번들러의 Tree Shaking에 유리, `createRequire()`로 CJS 상호 운용 가능
- `.mjs`/`.cjs` 확장자로 모듈 시스템을 명시적으로 지정 가능
