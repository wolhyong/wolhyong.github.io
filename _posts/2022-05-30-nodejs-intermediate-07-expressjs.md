---
layout: post
title: "Express.js 웹 프레임워크 — 미들웨어, 라우팅, Layer 내부 구조 완전 이해"
description: "Express.js 프레임워크의 내부 동작 원리와 실전 구현 — http 모듈 위에서 Express가 동작하는 계층 구조, 미들웨어 Layer 객체가 router.stack 배열에 저장되고 next()로 연결되는 정확한 실행 흐름, app.get('/users/:id')이 Layer 객체의 path/regexp/keys를 설정하고 URL 매칭 시 정규식으로 파라미터를 추출하는 과정, 미들웨어 유형별 성능 오버헤드(내장/서드파티/커스텀 비교), express.json()이 내부적으로 스트림을 읽고 JSON.parse()를 호출하는 본문 파싱 과정, 에러 처리 미들웨어가 Function.length로 4개 파라미터를 감지하는 원리, next()의 3가지 호출 방식(next/next('route')/next(err))이 내부 Layer 스택 탐색에 미치는 영향"
date: 2022-05-30 10:00:00 +0900
category: nodejs
tags: [nodejs, express, middleware, routing, web-framework, server, next-function, layer, controller, service, model, ejs, template-engine, error-handling, project-structure, http-module]
level: intermediate
---

Express.js는 Node.js에서 가장 널리 사용되는 웹 프레임워크입니다. http 모듈의 복잡성을 추상화하여 라우팅, 미들웨어, 요청/응답 처리를 훨씬 간결하게 만들어줍니다. 하지만 Express를 깊이 이해하려면 **내부 Layer 객체 구조, next()의 3가지 호출 방식이 스택 탐색에 미치는 영향, 라우트 매칭이 정규식으로 동작하는 과정**을 알아야 합니다.

## 수업 목표

- Express.js가 **http 모듈 위에서 동작하는 계층 구조**를 이해합니다.
- **Layer 객체**가 router.stack 배열에 저장되고 next()로 연결되는 실행 흐름을 학습합니다.
- **라우트 매칭 알고리즘**(정규식 기반 파라미터 추출)을 이해합니다.
- **미들웨어 유형별 성능 오버헤드**를 비교합니다.
- **에러 처리 미들웨어**가 Function.length로 자동 감지되는 원리를 학습합니다.
- **계층화된 프로젝트 구조**(Route → Controller → Service → Model)를 설계합니다.
- SEO/AEO/GEO 최적화된 Express 애플리케이션 구조를 익힙니다.

---

## Express.js 시작하기 — http 모듈 위에서 동작하는 방식

```bash
npm init -y
npm install express
```

```javascript
// app.js — 기본 Express 서버
const express = require('express');
const app = express();
const port = 3000;

// 라우트 정의
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// 서버 시작
app.listen(port, () => {
  console.log(`Express 서버: http://localhost:${port}`);
});
```

> **깊이 있는 설명 — Express.js가 http 모듈 위에서 동작하는 계층 구조:**
>
> `app.listen(3000)`을 호출하면 Express는 내부적으로 `http.createServer(app).listen(3000)`을 실행합니다. **Express의 `app` 객체는 함수이기도 합니다**: `function app(req, res) { app.handle(req, res); }`
>
> ```
> TCP 연결 (net.Server)
>   └─ HTTP 파서 (http-parser — C++로 작성된 고성능 파서)
>      └─ http.createServer(app.handle)
>         └─ Express 라우터 (Layer 스택)
>            ├─ 미들웨어 1 (express.json)  → req.body 파싱
>            ├─ 미들웨어 2 (logger)         → 요청 로깅
>            ├─ 라우터 (router)             → URL 매칭 + 핸들러 실행
>            └─ 에러 처리 미들웨어            → err 처리
> ```

---

### 성능 측정 — http 모듈 vs Express

| 방식 | 초당 요청 처리량 | 상대 성능 | 메모리 사용 |
|------|:--------------:|:--------:|:---------:|
| **http 모듈 (순수)** | ~45,000~50,000 req/s | 100% (기준) | ~5MB |
| **Express (미들웨어 없음)** | ~25,000~30,000 req/s | ~60% | ~15MB |
| **Express + 미들웨어 5개** | ~15,000~20,000 req/s | ~35% | ~25MB |
| **Express + 100개 라우트** | ~22,000~27,000 req/s | ~55% | ~20MB |
| **Express + 1,000개 라우트** | ~18,000~22,000 req/s | ~45% | ~40MB |

> **실전 노하우 — Express 오버헤드의 실제 의미:**
>
> Express는 http 모듈 대비 약 **40~50%의 성능 오버헤드**가 있습니다. 하지만 대부분의 애플리케이션에서 실제 병목은 **데이터베이스 쿼리**(5~50ms)나 **외부 API 호출**(50~500ms)이지, Express 라우팅 자체(0.01~0.1ms)가 아닙니다. 따라서 Express의 오버헤드는 실무에서 무시할 수 있는 수준입니다.
>
> 단, **초당 10만 요청 이상**을 처리해야 하는 초고성능 API 게이트웨이 같은 경우에는 http 모듈이나 Fastify 같은 대안을 고려해야 합니다.

---

## 라우팅 — 내부 Layer 객체와 매칭 알고리즘

```javascript
// 기본 라우팅
app.get('/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob'] });
});

app.post('/users', (req, res) => {
  res.status(201).json({ message: '사용자 생성 완료' });
});

app.put('/users/:id', (req, res) => {
  res.json({ message: `사용자 ${req.params.id} 수정 완료` });
});

app.delete('/users/:id', (req, res) => {
  res.json({ message: `사용자 ${req.params.id} 삭제 완료` });
});
```

> **코드 분석 — `app.get('/users/:id', handler)`가 내부적으로 하는 일:**
>
> ```
> 1. 새로운 Layer 객체 생성:
>    Layer {
>      path: '/users/:id',             // 원본 경로 패턴
>      method: 'get',                   // HTTP 메서드
>      regexp: /^\/users\/([^\/]+?)(?:\/)?$/i,  // :id → 정규식 캡처 그룹
>      keys: [{ name: 'id', ... }],    // :id 파라미터 이름
>      handler: fn                      // 사용자 정의 핸들러 함수
>    }
>
> 2. router.stack 배열에 Layer 추가:
>    router.stack = [
>      Layer { path: '/api', handler: logger },        // app.use 등록
>      Layer { path: '/users/:id', method: 'get' },    // app.get 등록
>      ...
>    ]
>
> 3. 요청이 들어오면 순차 탐색:
>    for (let i = 0; i < router.stack.length; i++) {
>      const layer = router.stack[i];
>      if (!layer.match(req.path)) continue;         // 1단계: path 매칭
>      if (layer.method && layer.method !==          // 2단계: method 매칭
>          req.method.toLowerCase()) continue;
>      const match = layer.regexp.exec(req.path);    // 3단계: 정규식 실행
>      req.params = extractParams(layer.keys, match);// 4단계: 파라미터 추출
>      layer.handler(req, res, next);                // 5단계: 핸들러 실행
>    }
> ```

---

### 라우트 파라미터와 쿼리

```javascript
// :id — 동적 파라미터
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  // req.params = { userId: '42', postId: '7' }
  res.json({ userId, postId });
});

// 쿼리 파라미터
app.get('/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  // /search?q=express&page=2&limit=20
  // req.query = { q: 'express', page: '2', limit: '20' }
  res.json({ query: q, page, limit });
});
```

> **깊이 있는 설명 — `:id`가 정규식으로 변환되는 과정:**
>
> Express는 `path-to-regexp` 라이브러리를 사용하여 URL 패턴을 정규식으로 변환합니다:
>
> | 패턴 | 생성된 정규식 | 매칭 예 |
> |------|-------------|---------|
> | `/users/:id` | `/^\/users\/([^\/]+?)(?:\/)?$/i` | `/users/42` → `{id: '42'}` |
> | `/users/:id/posts/:pid` | `/^\/users\/([^\/]+?)\/posts\/([^\/]+?)(?:\/)?$/i` | `/users/42/posts/7` → `{id: '42', pid: '7'}` |
> | `/files/*` | `/^\/files\/(.*?)(?:\/)?$/i` | `/files/a/b/c` → `{'0': 'a/b/c'}` |
> | `/optional?` | `/^\/optional?$/i` | `/optional` 또는 `/optiona` |

---

### 라우터 모듈화 — Express.Router()

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ users: [] }));
router.get('/:id', (req, res) => res.json({ id: req.params.id, name: 'Alice' }));
router.post('/', (req, res) => res.status(201).json({ message: '생성됨' }));

module.exports = router;

// app.js — 마운트
const userRouter = require('./routes/users');
app.use('/api/users', userRouter);  // /api/users로 마운트
```

> **깊이 있는 설명 — `app.use('/api', router)`가 경로를 결합하는 방식:**
>
> Express의 Layer 객체는 **mount path**와 **router path**를 분리하여 관리합니다:
>
> ```
> 요청: GET /api/users/42
>
> 1. app의 스택에서 '/api'와 일치하는 Layer 발견
> 2. router의 스택으로 제어 전달 (req.path에서 '/api' 제거)
> 3. router 내부에서 '/:id'와 매칭 → req.params = { id: '42' }
> 4. 실제 경로 = '/api' + '/users/:id' = '/api/users/42'
> ```

---

## 미들웨어 유형별 비교

| 유형 | 등록 방식 | 파라미터 | 실행 조건 | 예시 | 성능 오버헤드 |
|------|----------|:-------:|----------|------|:-----------:|
| **애플리케이션** | `app.use(fn)` | (req, res, next) | 모든 요청 | 로깅, CORS | ~0.01ms |
| **경로별** | `app.use('/api', fn)` | (req, res, next) | 경로 일치 | 인증 | ~0.02ms |
| **라우트별** | `app.get('/x', fn1, fn2)` | (req, res, next) | 메서드+경로 일치 | 입력 검증 | ~0.02ms |
| **에러 처리** | `app.use(fn)` | **(err, req, res, next)** | next(err) 호출 시 | 에러 응답 | ~0.01ms |
| **내장** | `express.json()` | 라이브러리 | Content-Type 확인 | JSON 파싱 | ~0.1~1ms |
| **서드파티** | `cors()`, `helmet()` | 라이브러리 | 모든 요청 | CORS 처리 | ~0.1~0.5ms |

---

## 미들웨어 실행 흐름 — next()의 3가지 호출 방식

```javascript
const express = require('express');
const app = express();

// 1. 글로벌 미들웨어 (모든 요청에 실행)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 2. 경로별 미들웨어
app.use('/api', (req, res, next) => {
  console.log('API 요청 감지');
  next();
});

// 3. 인증 미들웨어 (특정 라우트에만 적용)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: '인증 필요' });
  }
  req.user = { id: 1, name: 'Alice' };
  next();
};

app.get('/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

> **코드 분석 — next()의 3가지 호출 방식과 내부 동작:**
>
> | 호출 방식 | 의미 | 내부 동작 |
> |----------|------|----------|
> | **`next()`** | 정상 진행 | 스택 인덱스 증가 → 다음 Layer 실행 |
> | **`next('route')`** | 현재 라우트 건너뛰기 | 같은 경로의 **다음 라우트**로 이동 |
> | **`next(err)`** | 에러 전달 | Express 내부 `err` 상태 플래그 설정 → 에러 처리 미들웨어 탐색 |
>
> **`next(err)`가 호출되면 Express 내부에서:**
>
> ```javascript
> // Express 내부 (단순화)
> function next(err) {
>   if (err) {
>     // 에러 상태로 전환 — 일반 미들웨어는 모두 건너뜀
>     while (idx < stack.length) {
>       const layer = stack[idx++];
>       if (layer.handle.length === 4) { // 에러 처리기 발견!
>         layer.handle(err, req, res, next);
>         return;
>       }
>     }
>     // 에러 처리기를 찾지 못하면 기본 에러 핸들러
>     defaultErrorHandler(err, req, res);
>   } else {
>     // 정상 — 다음 일반 미들웨어 실행
>     const layer = stack[idx++];
>     layer.handle(req, res, next);
>   }
> }
> ```

---

## 내장 미들웨어 — express.json()의 내부 동작

```javascript
const express = require('express');
const app = express();

// JSON 본문 파싱
app.use(express.json());

// URL-encoded 본문 파싱 (폼 데이터)
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static('public'));
```

> **깊이 있는 설명 — `express.json()` 미들웨어가 요청 본문을 파싱하는 5단계:**
>
> ```
> 1. Content-Type 확인:
>    req.headers['content-type']이 'application/json'을 포함?
>    아니오 → next()로 건너뜀 (다음 미들웨어가 처리)
>
> 2. 본문 스트림 읽기:
>    let body = '';
>    req.on('data', chunk => body += chunk.toString());
>    req.on('end', () => { ... });
>    → 청크(Chunk) 단위로 수신, 기본 인코딩은 utf-8
>
> 3. 본문 크기 제한 확인:
>    기본 limit: '100kb' (약 100,000 바이트)
>    설정 변경: express.json({ limit: '10mb' })
>    초과 시: 413 Payload Too Large 에러
>
> 4. JSON.parse() 실행:
>    try { req.body = JSON.parse(body); }
>    catch (e) { next(new SyntaxError('Invalid JSON')); }
>    → 파싱 실패 시 SyntaxError를 next(err)로 전달
>
> 5. req.body에 할당 완료:
>    이후 미들웨어에서 req.body로 접근 가능
>    req.body.name, req.body.email 등
> ```

---

## 에러 처리 미들웨어 — Function.length로 감지되는 원리

```javascript
// 404 처리 — 모든 라우트 다음에 위치
app.use((req, res, next) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `경로 ${req.originalUrl}를 찾을 수 없습니다`
  });
});

// 에러 처리 미들웨어 — 4개 파라미터
app.use((err, req, res, next) => {
  console.error('서버 에러:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || '내부 서버 오류';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

> **깊이 있는 설명 — Express가 4개 파라미터를 감지하는 방법:**
>
> 자바스크립트에서 함수의 **파라미터 개수**는 `.length` 속성으로 확인할 수 있습니다:
>
> ```javascript
> function normalMiddleware(req, res, next) { }
> normalMiddleware.length === 3  // 일반 미들웨어
>
> function errorMiddleware(err, req, res, next) { }
> errorMiddleware.length === 4   // 에러 처리 미들웨어
> ```
>
> Express는 Layer 객체를 생성할 때 `handler.length`를 확인합니다. 길이가 4이면 `Layer.prototype.handle_error === true`로 설정되어, `next(err)`가 호출될 때만 이 Layer가 실행됩니다.
>
> **주의:** 화살표 함수는 자체 `arguments` 객체가 없고 `.length`가 예상과 다를 수 있습니다:
> ```javascript
> app.use((err, req, res, next) => { ... });
> // 화살표 함수의 .length는 정상 작동하지만, 일부 패턴에서는 문제가 발생할 수 있음
> // 안전하게 function 키워드를 사용하는 것이 좋음
> ```

---

## 구조화된 프로젝트 — 계층 분리 4단계

```
my-express-app/
├── app.js                 # 앱 설정과 미들웨어 등록
├── server.js              # 서버 시작 (listen)
├── routes/                # HTTP 경로 매핑
│   ├── users.js
│   └── posts.js
├── controllers/           # 요청 검증 + 응답 형식
│   ├── userController.js
│   └── postController.js
├── services/              # 비즈니스 로직
│   └── userService.js
├── models/                # 데이터 접근
│   ├── User.js
│   └── Post.js
├── middleware/             # 커스텀 미들웨어
│   ├── auth.js
│   └── errorHandler.js
├── config/                # 설정 파일
│   └── database.js
└── views/                 # EJS 템플릿
    └── index.ejs
```

> **깊이 있는 설명 — 각 계층의 책임과 의사소통 방향:**
>
> ```
> Route → Controller → Service → Model
>
> 1. Route Layer (routes/):
>    책임: HTTP 메서드 + URL 경로 → Controller 연결
>    코드: router.get('/:id', userController.getUser)
>    의존: Controller만 의존 (Service/Model은 몰라도 됨)
>
> 2. Controller Layer (controllers/):
>    책임: req.body 검증 + 적절한 상태 코드 + 응답 형식
>    코드: const user = await userService.getUser(id); res.json({ data: user })
>    의존: Service만 의존
>
> 3. Service Layer (services/):
>    책임: 비즈니스 로직 + 트랜잭션 + 권한 검사 + 다중 모델 조합
>    코드: const user = await User.findById(id); if (!user) throw new NotFoundError()
>    의존: Model만 의존
>
> 4. Model Layer (models/):
>    책임: 데이터베이스 CRUD + 데이터 무결성
>    코드: static findById(id) { return db.query('SELECT * FROM users WHERE id = ?', [id]) }
>    의존: 데이터베이스만 의존
> ```
>
> **이 패턴의 핵심은 의존성의 방향이 위에서 아래로만 흐른다는 것**입니다. Controller는 Service를 호출하지만, Service는 Controller를 알지 못합니다. 이렇게 하면 각 계층을 독립적으로 테스트하고 교체할 수 있습니다.

---

## 미들웨어 라이브러리 비교

| 라이브러리 | 용도 | 설치 명령어 | 성능 영향 | 대안 |
|-----------|------|-----------|:--------:|------|
| **`cors`** | Cross-Origin 요청 허용 | `npm i cors` | ~0.1ms | 직접 구현 (간단한 경우) |
| **`helmet`** | HTTP 보안 헤더 15종 | `npm i helmet` | ~0.3ms | 각 헤더 직접 설정 |
| **`compression`** | Gzip/Brotli 압축 | `npm i compression` | ~1~5ms | Nginx 레벨 압축 |
| **`morgan`** | HTTP 요청 로깅 | `npm i morgan` | ~0.05ms | Winston 커스텀 |
| **`express-rate-limit`** | 속도 제한 | `npm i express-rate-limit` | ~0.1ms | Nginx 레벨 제한 |
| **`cookie-parser`** | 쿠키 파싱 | `npm i cookie-parser` | ~0.05ms | 수동 파싱 |

---

## 자주 묻는 질문

<details>
<summary><strong><code>app.use()</code>와 <code>app.get()</code>의 차이는 무엇인가요?</strong></summary>

내부적으로 `app.use(fn)`은 `layer.method = undefined`로 설정되고, `app.get('/path', fn)`은 `layer.method = 'get'`으로 설정됩니다. `app.use()`는 경로가 일치하면 **모든 HTTP 메서드**를 처리하고, `app.get()`은 **GET 메서드만** 처리합니다. 미들웨어 등록에는 `app.use()`를, 라우트 정의에는 `app.get()`, `app.post()` 등을 사용합니다.
</details>

<details>
<summary><strong><code>next()</code>를 호출하지 않으면 어떻게 되나요?</strong></summary>

응답이 클라이언트에 전송되지 않고 **타임아웃까지 대기**합니다. Express는 `next()`가 호출될 때까지 아무 일도 하지 않습니다. `res.send()`나 `res.json()`으로 응답을 보냈더라도 `next()`를 호출하지 않으면 이후 미들웨어가 실행되지 않습니다. 응답이 이미 전송된 상태에서 `next()`를 호출하면 "Cannot set headers after they are sent" 에러가 발생합니다.
</details>

<details>
<summary><strong>Express 앱의 성능을 어떻게 측정하나요?</strong></summary>

autocannon이나 wrk 도구를 사용할 수 있습니다:
```bash
npx autocannon -c 100 -d 10 http://localhost:3000/users
```
위 명령어는 100개의 동시 연결로 10초간 부하 테스트를 수행합니다. 응답 시간의 p50, p95, p99 값과 초당 요청 수를 확인할 수 있습니다.
</details>

<details>
<summary><strong>Express 5.x는 4.x와 무엇이 다른가요?</strong></summary>

Express 5.x의 주요 변경 사항: async/await 에러를 자동으로 catch (asyncHandler 불필요), `app.delete()` 메서드 지원, Promise 기반 미들웨어, Path-to-Regexp v8 업데이트로 라우트 매칭 변경. Express 4.x에서 5.x로의 마이그레이션은 대부분 호환되지만, 일부 라우트 패턴이 다르게 동작할 수 있습니다.
</details>

---

## 요약

- **Express.js**는 http 모듈 위에서 동작하며, `Layer` 객체의 `router.stack` 배열로 미들웨어를 관리합니다.
- **라우팅**은 Layer 객체에 저장된 정규식(regexp)으로 URL을 매칭하고 파라미터를 추출합니다.
- **미들웨어 체인**은 `next()`의 3가지 호출 방식(next/next('route')/next(err))으로 제어 흐름이 결정됩니다.
- **에러 처리 미들웨어**는 `Function.length === 4`로 자동 감지됩니다.
- **`express.json()`** 은 내부적으로 스트림을 읽고 JSON.parse()를 수행하며, 크기 제한(100kb)을 초과하면 413 에러를 반환합니다.
- **성능:** http 모듈 대비 약 40~50% 오버헤드가 있지만, 실무 병목은 대부분 데이터베이스 쿼리입니다.
- **프로젝트 구조**는 Route → Controller → Service → Model의 4계층으로 분리하여 각 계층의 책임을 명확히 합니다.
- **내장 미들웨어**보다 서드파티 미들웨어가 더 많은 기능을 제공하지만, 성능 오버헤드도 더 큽니다.
