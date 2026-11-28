---
layout: post
title: "자바스크립트 실전 품질 — 에러 처리, 정규식, 성능, Web Worker, 테스트"
description: "실무 코드의 품질을 좌우하는 부분을 모았습니다. 커스텀 에러와 전역 핸들러, 정규식 패턴과 ReDoS 주의, 디바운스·메모이제이션, Web Worker 메시지 패싱, Jest 테스트와 ESLint·TypeScript 설정까지 다룹니다."
date: 2026-11-28 14:00:00 +0900
category: javascript
level: advanced
tags: [javascript, 에러처리, 정규식, 성능최적화, web-worker, 테스트, eslint]
---

기능이 동작하는 코드와 오래 유지되는 코드 사이에는 몇 가지 습관이 있습니다. 에러를 어디서 잡고 어디로 던질지 정하는 일, 반복 계산과 이벤트 폭주를 줄이는 일, 무거운 작업을 메인 스레드에서 떼어내는 일, 바뀐 부분을 테스트로 고정하는 일입니다.

2016년에 올린 에러 처리, 정규식, 성능 최적화, Web Worker, 테스트, 개발 도구 글 여섯 편을 한 편으로 합쳤습니다.

## 에러 처리

### try / catch / finally

```javascript
try {
  const data = JSON.parse(raw);
  process(data);
} catch (err) {
  console.error("처리 실패:", err.message);
} finally {
  cleanup(); // 성공/실패와 무관하게 실행
}
```

`catch`로 받는 객체는 보통 `Error` 인스턴스이고 `message`, `name`, `stack`을 가집니다. 문자열을 `throw`하면 스택이 사라지므로 `Error`로 던집니다.

```javascript
throw new Error("설정 파일을 읽을 수 없습니다");
```

### 에러 종류 구분

```javascript
try {
  risky();
} catch (err) {
  if (err instanceof TypeError) {
    // 타입 문제
  } else if (err instanceof RangeError) {
    // 범위 문제
  } else {
    throw err; // 모르는 에러는 다시 던져 상위에서 처리
  }
}
```

모르는 에러를 조용히 삼키면 원인을 찾을 수 없게 됩니다. 처리할 수 있는 것만 잡고 나머지는 올려 보냅니다.

### 커스텀 에러

도메인별로 에러를 나누면 호출하는 쪽에서 분기하기 쉬워집니다.

```javascript
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

class HttpError extends Error {
  constructor(status, message, options) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
  }
}

function validateAge(age) {
  if (typeof age !== "number") throw new ValidationError("age", "숫자여야 합니다");
  if (age < 0 || age > 150) throw new ValidationError("age", "0~150 사이여야 합니다");
}

try {
  validateAge(-5);
} catch (err) {
  if (err instanceof ValidationError) {
    console.warn(`${err.field}: ${err.message}`);
  } else {
    throw err;
  }
}
```

원인을 보존하려면 `cause`를 씁니다. 최신 브라우저와 Node 16.9 이상에서 지원합니다.

```javascript
try {
  await loadConfig();
} catch (err) {
  throw new Error("설정 로드 실패", { cause: err });
}
```

### 비동기 에러

`async/await`에서는 `try/catch`가 그대로 동작합니다.

```javascript
async function fetchUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new HttpError(res.status, "사용자 조회 실패");
    return await res.json();
  } catch (err) {
    console.error(err.message);
    return null;
  }
}
```

Promise 체인에서는 `.catch()`를 마지막에 붙입니다. 중간에 붙이면 그 뒤로는 정상 흐름이 됩니다.

```javascript
fetchUser(1)
  .then((user) => fetchPosts(user.id))
  .then(render)
  .catch((err) => renderError(err));
```

처리되지 않은 rejection은 조용히 사라집니다. 전역에서 잡아 로그로 남깁니다.

```javascript
window.addEventListener("unhandledrejection", (e) => {
  report(e.reason);
  // e.preventDefault(); // 콘솔 기본 출력을 숨기려면
});

window.addEventListener("error", (e) => {
  report(e.error ?? e.message);
});
```

`unhandledrejection`은 Promise가 거부됐는데 핸들러가 붙지 않았을 때 발생합니다. 로그를 보내되 `preventDefault()`로 콘솔 표시까지 없애면 개발 중 원인 파악이 어려워집니다.

### 이미지 로드 실패 처리

```javascript
document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG") {
      e.target.src = "/assets/images/placeholder.png";
    }
  },
  true // 캡처 단계에서 받아야 리소스 에러를 잡음
);
```

리소스 로드 에러는 버블링되지 않으므로 캡처 단계에서 잡습니다.

## 정규식

### 만드는 방법

```javascript
const literal = /hello/i;              // 리터럴 — 정적 패턴
const dynamic = new RegExp("hello", "i"); // 생성자 — 변수 조합

// 주요 플래그
// i — 대소문자 무시
// g — 전역 검색
// m — 여러 줄 모드 (^, $가 줄 단위)
// s — .이 줄바꿈도 포함
// u — 유니코드 모드
```

### 패턴 문법

| 표기 | 의미 |
|------|------|
| `.` | 줄바꿈을 제외한 임의 문자 |
| `\d` `\w` `\s` | 숫자, 단어 문자, 공백 |
| `[abc]` `[^abc]` | 포함, 제외 |
| `^` `$` | 문자열(또는 줄)의 시작, 끝 |
| `*` `+` `?` | 0회 이상, 1회 이상, 0~1회 |
| `{3}` `{2,4}` | 정확히 3회, 2~4회 |
| `(...)` | 캡처 그룹 |
| `(?:...)` | 캡처하지 않는 그룹 |
| `(?<name>...)` | 이름 있는 그룹 |
| `\b` | 단어 경계 |

```javascript
/^\d{3}-\d{4}-\d{4}$/.test("010-1234-5678"); // true
/a.c/.exec("abc");                           // ["abc"]
```

### 메서드

```javascript
const text = "문의: help@example.com, admin@site.com";

/[\w.]+@[\w.]+/.test(text);       // true — 존재 여부
text.match(/[\w.]+@[\w.]+/g);     // ["help@example.com", "admin@site.com"]
text.replace(/[\w.]+@[\w.]+/g, "[이메일 숨김]");
text.split(/\s*,\s*/);            // 구분자 기준 분리

// 캡처 그룹 전체 순회
const re = /(\d{3})-(\d{4})-(\d{4})/g;
for (const m of text.matchAll(re)) {
  console.log(m[1], m[2], m[3]);
}
```

`match`는 `g` 플래그가 있으면 캡처 그룹을 돌려주지 않습니다. 그룹까지 필요하면 `matchAll()`이나 `exec()`를 반복합니다.

```javascript
// 이름 있는 그룹
const { groups } = "2026-11-28".match(/(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/);
groups.year; // "2026"
```

### 자주 쓰는 패턴

```javascript
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneKR: /^0\d{1,2}-\d{3,4}-\d{4}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i,
  htmlTag: /<[^>]+>/g,
};
```

이메일 정규식을 완벽하게 만들려는 시도는 실패하기 쉽습니다. 실제 검증은 확인 메일 발송으로 하는 편이 정확합니다. 위 패턴은 형식 실수를 거르는 용도입니다.

### 주의할 점

**`g` 플래그와 `lastIndex`**

`test()`와 `exec()`는 `g` 플래그가 있으면 마지막 위치를 기억합니다. 같은 정규식 객체를 재사용하면 두 번째 호출이 엉뚱한 결과를 냅니다.

```javascript
const re = /a/g;
re.test("a");  // true, lastIndex = 1
re.test("a");  // false, lastIndex = 0으로 초기화
```

매번 새로 만들거나 `re.lastIndex = 0`으로 초기화합니다.

**ReDoS**

중첩 수량자(`(a+)+`, `(\w+\s?)*`)는 입력에 따라 실행 시간이 폭발적으로 늘어납니다. 사용자 입력에 이런 패턴을 적용하면 서버나 브라우저가 멈출 수 있습니다.

```javascript
// 위험 — 입력이 길어지면 급격히 느려짐
/^(\w+\s?)*$/.test(longInput);

// 대안 — 단순한 패턴으로 검증하고 길이를 먼저 제한
if (longInput.length > 200) return false;
/^\w+(?:\s\w+)*$/.test(longInput);
```

**`replace`의 치환 문자열**

`$&`, `$1` 같은 표기가 특별한 의미를 가집니다. 달러 기호를 문자로 쓰려면 `$$`로 적거나 함수 치환을 씁니다.

```javascript
"가격: 100".replace(/(\d+)/, (_, n) => `${Number(n).toLocaleString()}원`);
```

## 성능

### 메모이제이션

같은 입력에 대한 결과를 저장합니다. 순수 함수에만 적용해야 합니다.

```javascript
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fib = memoize(function (n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
});

fib(40); // 캐시 덕분에 즉시 계산
```

`JSON.stringify`로 키를 만드는 방식은 인자 순서가 바뀌면 다른 키가 되고, 객체 인자는 내용이 같아도 키가 같아집니다(참조 무시). 인자가 원시값 하나뿐이면 `Map` 키로 바로 쓰는 편이 빠릅니다.

### 디바운스와 스로틀

```javascript
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit = 200) {
  let waiting = false;
  return function (...args) {
    if (waiting) return;
    fn.apply(this, args);
    waiting = true;
    setTimeout(() => {
      waiting = false;
    }, limit);
  };
}
```

- 디바운스: 입력이 멈춘 뒤 한 번. 검색 자동완성, 폼 검증에 씁니다.
- 스로틀: 일정 간격으로 최대 한 번. 스크롤, 리사이즈, 마우스 이동에 씁니다.

```javascript
searchInput.addEventListener("input", debounce((e) => search(e.target.value), 300));
window.addEventListener("resize", throttle(layout, 200));
```

### DOM 작업 묶기

```javascript
// ❌ 반복할 때마다 레이아웃 계산
for (const item of items) {
  list.append(render(item));
}

// ✅ 한 번에 붙임
const fragment = document.createDocumentFragment();
for (const item of items) {
  fragment.append(render(item));
}
list.append(fragment);
```

읽기와 쓰기를 섞으면 레이아웃 스래싱이 생깁니다.

```javascript
// ❌ 읽기 → 쓰기 반복
for (const el of elements) {
  el.style.height = `${el.offsetHeight + 10}px`;
}

// ✅ 읽기를 먼저 모으고 쓰기를 나중에
const heights = elements.map((el) => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.height = `${heights[i] + 10}px`;
});
```

### 유휴 시간에 처리하기

```javascript
function processInChunks(items, handle) {
  let index = 0;

  function run(deadline) {
    while (index < items.length && deadline.timeRemaining() > 0) {
      handle(items[index++]);
    }
    if (index < items.length) requestIdleCallback(run);
  }

  requestIdleCallback(run);
}
```

`requestIdleCallback`은 Safari 지원이 늦었습니다. 범용으로 쓰려면 `setTimeout`으로 나눠 처리하거나 폴리필을 둡니다.

### 메모리 누수 줄이기

- 해제하지 않은 `setInterval`
- 제거하지 않은 `addEventListener` (특히 `window`, `document`)
- `IntersectionObserver`의 `unobserve` 누락
- 큰 DOM을 참조하는 클로저를 오래 유지
- `Map`에 계속 쌓이는 캐시

```javascript
const controller = new AbortController();
window.addEventListener("resize", onResize, { signal: controller.signal });

// 정리 시점
controller.abort(); // 리스너 한 번에 해제
```

## Web Worker

무거운 계산을 별도 스레드로 옮깁니다. 메인 스레드는 화면과 입력을 계속 처리합니다.

```javascript
// worker.js
self.onmessage = (e) => {
  const { numbers } = e.data;
  const sum = numbers.reduce((a, b) => a + b, 0);
  self.postMessage({ sum });
};

// main.js
const worker = new Worker("./worker.js");
worker.postMessage({ numbers: Array.from({ length: 1_000_000 }, (_, i) => i) });
worker.onmessage = (e) => console.log(e.data.sum);
```

Worker에는 `window`가 없습니다. DOM에 직접 접근할 수 없고, `localStorage`도 쓸 수 없습니다. 결과는 메시지로만 주고받습니다.

### Promise로 감싼 작업 실행기

메시지에 작업 ID를 붙여 요청과 응답을 짝지으면 `await`로 쓸 수 있습니다.

```javascript
class TaskRunner {
  #worker;
  #id = 0;
  #pending = new Map();

  constructor(url) {
    this.#worker = new Worker(url);
    this.#worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const task = this.#pending.get(id);
      if (!task) return;
      this.#pending.delete(id);
      error ? task.reject(new Error(error)) : task.resolve(result);
    };
  }

  run(type, data) {
    const id = this.#id++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#worker.postMessage({ id, type, data });
    });
  }

  terminate() {
    this.#worker.terminate();
  }
}

const runner = new TaskRunner("/workers/calc.js");
const sum = await runner.run("sum", [1, 2, 3, 4, 5]);
```

### 데이터 전달 비용

`postMessage`는 구조적 복제를 합니다. 큰 배열을 보내면 복사 비용이 큽니다. `ArrayBuffer`는 소유권을 넘겨 복사를 피할 수 있습니다.

```javascript
const buffer = new ArrayBuffer(1024 * 1024);
worker.postMessage({ buffer }, [buffer]); // 두 번째 인자가 전송 목록
// 이후 메인 스레드의 buffer는 비어 있음 (byteLength 0)
```

`SharedArrayBuffer`는 메모리를 공유하지만, 보안 헤더(`Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`)가 필요합니다. 설정이 없으면 `SharedArrayBuffer`가 정의되지 않습니다.

```javascript
const shared = new SharedArrayBuffer(16);
const view = new Int32Array(shared);
Atomics.add(view, 0, 1); // 원자적 증가
```

### 언제 쓰나

- 수만 건 정렬, 검색, 집계
- 이미지·오디오 처리
- 큰 JSON 파싱과 변환
- 암호화, 해시 계산

단순한 작업이라면 Worker를 만드는 비용이 더 큽니다. 작업 시간이 수십 밀리초를 넘고 화면이 끊긴다면 그때 옮깁니다.

## 테스트

### 기본 구조

```javascript
// math.js
export function add(a, b) {
  return a + b;
}

export function divide(a, b) {
  if (b === 0) throw new Error("0으로 나눌 수 없습니다");
  return a / b;
}
```

```javascript
// math.test.js
import { add, divide } from "./math";

describe("math", () => {
  test("두 수를 더한다", () => {
    expect(add(2, 3)).toBe(5);
  });

  test("0으로 나누면 에러", () => {
    expect(() => divide(10, 0)).toThrow("0으로 나눌 수 없습니다");
  });
});
```

`toBe`는 원시값 비교, `toEqual`은 객체·배열의 구조 비교입니다. 부동소수점은 `toBeCloseTo`를 씁니다.

```javascript
expect({ a: 1 }).toEqual({ a: 1 });
expect(0.1 + 0.2).toBeCloseTo(0.3);
```

### 외부 의존성 격리

```javascript
test("사용자를 불러온다", async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ name: "홍길동" }),
  });
  global.fetch = mockFetch;

  const user = await fetchUser(1);

  expect(user.name).toBe("홍길동");
  expect(mockFetch).toHaveBeenCalledWith("/api/users/1");
});
```

Jest에서는 `jest.fn()`, Vitest에서는 `vi.fn()`을 씁니다. 모킹은 네트워크, 시간, 파일 시스템처럼 테스트가 통제할 수 없는 것에만 씁니다.

### 비동기 테스트

```javascript
test("데이터를 불러온다", async () => {
  const data = await loadData();
  expect(data).toBeDefined();
});

test("타임아웃은 reject", async () => {
  await expect(slowOperation()).rejects.toThrow("Timeout");
});
```

### 경계값과 예외

```javascript
test.each([
  [0, 0, 0],
  [1, 1, 2],
  [-1, 1, 0],
])("add(%i, %i) === %i", (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});

test("빈 배열은 undefined", () => {
  expect(getMax([])).toBeUndefined();
});
```

테스트는 구현이 아니라 동작을 확인해야 합니다. 내부 함수 호출 횟수에 지나치게 의존하면 리팩터링할 때마다 테스트를 고쳐야 합니다.

## 도구

### ESLint

```javascript
// eslint.config.js (flat config)
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    rules: {
      eqeqeq: "error",
      "prefer-const": "error",
      "no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
];
```

```bash
npx eslint src --fix
```

### Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2
}
```

ESLint와 Prettier가 충돌할 때는 `eslint-config-prettier`를 마지막에 둡니다. 역할은 나눕니다. ESLint는 코드 품질, Prettier는 포맷입니다.

### TypeScript 점진 도입

```bash
npm install -D typescript @types/node
npx tsc --init
```

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "checkJs": false,
    "noEmit": true
  },
  "include": ["src"]
}
```

`allowJs`를 켜고 `.js` 파일부터 타입 검사를 붙인 뒤, 새로 만드는 파일과 자주 고치는 파일부터 `.ts`로 바꿉니다. 한 번에 전부 바꾸면 변경 범위가 너무 커집니다.

### 빌드 도구

| 도구 | 특징 | 맞는 경우 |
|------|------|-----------|
| Vite | 개발 서버가 빠르고 설정이 단순 | 대부분의 새 프로젝트 |
| esbuild | Go로 작성, 번들 속도가 매우 빠름 | 빌드 시간이 중요한 파이프라인 |
| webpack | 플러그인 생태계가 넓음 | 기존 설정을 유지해야 하는 프로젝트 |
| Rollup | 라이브러리 번들에 적합 | 패키지 배포 |

### 커밋 전 자동 검사

```bash
npm install -D husky lint-staged
npx husky init
```

```json
{
  "lint-staged": {
    "*.{js,ts}": ["eslint --fix", "prettier --write"]
  }
}
```

## 자주 만나는 문제

**1. 잡히지 않는 rejection**

`await` 없이 호출한 `async` 함수는 rejection이 밖으로 나가지 않습니다. 호출부에서 `await`하거나 `.catch()`를 붙입니다.

**2. 정규식 `lastIndex`**

`g` 플래그가 있는 정규식을 `test()`로 재사용하면 결과가 번갈아 바뀝니다. 정규식을 매번 만들거나 `lastIndex`를 초기화합니다.

**3. Worker에서 `window is not defined`**

Worker에는 DOM과 `window`가 없습니다. 필요한 값은 `postMessage`로 받고, DOM 갱신은 메인 스레드에서 합니다.

**4. 테스트에서 타이머가 안 끝남**

`setInterval`이나 `setTimeout`이 남아 있으면 테스트가 끝나지 않습니다. 가짜 타이머를 쓰거나 `afterEach`에서 정리합니다.

```javascript
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();
```

**5. `structuredClone` 실패**

함수, DOM 노드, 클래스 인스턴스는 복제할 수 없습니다. `DataCloneError`가 나면 필요한 필드만 골라 새 객체를 만듭니다.

**6. 디바운스된 함수의 this**

```javascript
const debounced = debounce(obj.method, 300);
debounced(); // this 상실

const debounced2 = debounce(() => obj.method(), 300);
```

## 정리

- 잡을 수 있는 에러만 잡고, 모르는 에러는 다시 던집니다. 도메인 에러는 클래스로 구분합니다.
- 정규식은 형식 검증 용도로 쓰고, 이메일 존재 확인처럼 확정이 필요한 검증은 다른 수단을 함께 씁니다.
- 성능 문제는 대부분 반복 계산, 이벤트 폭주, 잦은 레이아웃 계산에서 나옵니다. 측정한 뒤 고칩니다.
- Worker는 작업이 수십 밀리초를 넘고 화면이 끊길 때 옮깁니다.
- 테스트는 동작을 고정하고, 경계값과 예외를 포함합니다.

이 시리즈의 앞 글은 [자바스크립트 기본 문법](/2026/11/28/javascript-basics/), [함수와 객체](/2026/11/28/javascript-functions-objects/), [DOM과 이벤트](/2026/11/28/javascript-dom-events/), [비동기 처리](/2026/11/28/javascript-async/), [ES6+ 문법](/2026/11/28/javascript-es6-modern/)에서 이어집니다.
