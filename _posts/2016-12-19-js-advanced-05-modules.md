---
layout: post
title: "자바스크립트 모듈 시스템 - ES Modules, CommonJS, 동적 임포트 완벽 비교"
description: "ES Modules과 CommonJS의 차이, named/default export, 동적 임포트, 모듈 빌드 도구까지 실전 학습합니다."
date: 2016-12-19 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, modules, esm, 웹]
---

모듈 시스템은 코드를 논리적 단위로 분리하고 재사용 가능하게 만드는 자바스크립트의 핵심 아키텍처입니다.

## ES Modules (ESM) — 표준 모듈

```javascript
// math.js — export
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export default class Calculator { /* ... */ }

// app.js — import
import Calculator, { PI, add } from "./math.js";
import * as math from "./math.js"; // 네임스페이스 import
```

### Named vs Default Export

```javascript
// Named export — 여러 개 가능, 이름 필수
export function greet(name) { return `안녕, ${name}`; }
export const VERSION = "1.0";

// Default export — 파일당 1개, 이름 자유
export default function main() { /* ... */ }
```

## CommonJS (CJS) — Node.js 구형 모듈

```javascript
// util.js
function formatDate(date) { /* ... */ }
module.exports = { formatDate };

// app.js
const { formatDate } = require("./util.js");
```

## ESM vs CJS 비교

| 특징 | ESM | CJS |
|------|-----|-----|
| 키워드 | `import`/`export` | `require()`/`module.exports` |
| 동작 | 정적 (빌드 타임 분석) | 동적 (실행 시점) |
| 호이스팅 | 있음 | 없음 (require 시점에 실행) |
| 트리쉐이킹 | 가능 | 불가능 |
| 환경 | 브라우저 + Node.js | Node.js |

## 동적 임포트 (Dynamic Import)

```javascript
// 조건부 모듈 로딩
async function loadFeature(flag) {
  if (flag) {
    const { heavyModule } = await import("./heavy-module.js");
    heavyModule.init();
  }
}

// 라우터에서 활용
const routes = {
  "/dashboard": () => import("./pages/Dashboard.js"),
  "/settings": () => import("./pages/Settings.js"),
};
```

동적 임포트는 코드 스플리팅(code splitting)에 활용되어, 필요한 시점에만 모듈을 로드하여 성능을 향상시킵니다.

## 마무리

- **ES Modules**가 웹과 Node.js의 표준입니다
- **Named export**는 트리쉐이킹에 유리하고, **default export**는 간결합니다
- **동적 임포트**로 코드 스플리팅과 성능 최적화를 하세요
- CommonJS는 legacy Node.js 프로젝트에서만 만나게 됩니다

다음 수업에서는 개발 도구와 디버깅 기법을 학습합니다!
