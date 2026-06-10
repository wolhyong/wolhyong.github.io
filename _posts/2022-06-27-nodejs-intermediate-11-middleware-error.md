---
layout: post
title: "Node.js 미들웨어와 에러 처리 — 체인, 파이프라인, 안전한 종료"
description: "Express.js 미들웨어 시스템의 내부 동작 원리와 체계적인 에러 처리 전략 — 미들웨어 체인이 next()를 통해 요청을 전달하는 정확한 메커니즘, 비동기 에러가 Express 4.x에서 자동으로 잡히지 않는 이유, asyncHandler가 Promise를 catch하는 내부 동작, 운영 에러(Operational Error)와 프로그래밍 버그(Programmer Error)를 구분하는 실제 기준, 계층화된 에러 처리 파이프라인 설계, Winston 로깅 시스템 구성, Graceful Shutdown이 프로세스 종료 시그널(SIGTERM/SIGINT)을 처리하는 방법"
date: 2022-06-27 10:00:00 +0900
category: nodejs
tags: [nodejs, express, middleware, error-handling, async-error, logging, winston, graceful-shutdown, cors, rate-limiting, compression, sigterm]
level: intermediate
---

Express.js의 핵심 철학은 **미들웨어**입니다. 모든 요청은 미들웨어 체인을 통과하며, 각 미들웨어는 요청을 검사하고, 변형하고, 응답을 보내거나 다음 미들웨어로 전달합니다. **에러 처리 역시 미들웨어로 구현**되며, 올바른 순서로 배치하는 것이 가장 중요합니다.

이 포스트에서는 미들웨어의 **내부 동작 원리**와 **실전 에러 처리 전략**을 깊이 있게 다룹니다.

## 수업 목표

- **미들웨어 체인의 실행 순서**와 **next()의 3가지 호출 방식**을 완벽히 이해합니다.
- 비동기 에러가 Express 4.x에서 자동으로 잡히지 않는 **이유와 해결책**을 학습합니다.
- **운영 에러(Operational Error)**와 **프로그래밍 버그(Programmer Error)**를 구분하는 기준을 이해합니다.
- **계층화된 에러 처리 시스템**을 구축하는 방법을 학습합니다.
- **Graceful Shutdown**으로 안전한 서버 종료를 구현합니다.
- SEO/AEO/GEO 최적화된 에러 처리 전략을 익힙니다.

---

## 미들웨어 실행 흐름 — 체인의 내부 동작

```javascript
const express = require('express');
const app = express();

// 미들웨어 실행 순서
app.use((req, res, next) => {
  console.log('1. 첫 번째 미들웨어 (글로벌)');
  next();
});

app.use('/api', (req, res, next) => {
  console.log('2. /api 경로 미들웨어');
  next();
});

app.get('/test',
  (req, res, next) => {
    console.log('3. 라우트별 미들웨어');
    next();
  },
  (req, res) => {
    console.log('4. 최종 핸들러');
    res.json({ message: '완료' });
  }
);

// 응답 후 실행되는 미들웨어 (에러 처리)
app.use((err, req, res, next) => {
  console.error('5. 에러 처리 미들웨어');
  res.status(500).json({ error: err.message });
});
```

> **깊이 있는 설명 — Express 미들웨어 체인의 내부 동작:**
>
> Express 애플리케이션은 내부적으로 **미들웨어 큐(middleware queue)**를 유지합니다. `app.use()`, `app.get()`, `app.post()` 등으로 등록된 모든 함수는 이 큐에 **등록된 순서대로** 저장됩니다.
>
> ```
> 요청 도착
>    │
>    ▼
> ┌─────────────┐   next()    ┌─────────────┐   next()    ┌─────────────┐
> │ 미들웨어 1   │ ─────────→ │ 미들웨어 2   │ ─────────→ │   라우터    │
> │ (글로벌)     │            │ (/api 경로)  │            │ (/test)     │
> └─────────────┘            └─────────────┘            └──────┬──────┘
>                                                              │
>                                                     next()  │  또는 응답
>                                                              ▼
>                                                      ┌─────────────┐
>                                                      │ 에러 처리기  │
>                                                      │ (4개 파라미터)│
>                                                      └─────────────┘
> ```
>
> Express의 내부 코드는 다음과 같은 구조로 동작합니다:
> ```javascript
> // Express 내부 (단순화)
> function handleRequest(req, res) {
>   let idx = 0;
>   function next(err) {
>     const middleware = stack[idx++];  // 큐에서 다음 미들웨어를 꺼냄
>     if (!middleware) return;          // 더 이상 미들웨어가 없으면 종료
>
>     if (err) {
>       // 에러가 있으면 에러 처리 미들웨어(4개 파라미터)만 실행
>       if (middleware.length === 4) {
>         middleware(err, req, res, next);
>       } else {
>         next(err); // 일반 미들웨어는 건너뜀
>       }
>     } else {
>       // 정상 요청은 일반 미들웨어(3개 파라미터)만 실행
>       if (middleware.length < 4) {
>         middleware(req, res, next);
>       } else {
>         next(); // 에러 처리 미들웨어는 건너뜀
>       }
>     }
>   }
>   next(); // 첫 번째 미들웨어부터 시작
> }
> ```

---

### next()의 3가지 호출 방식

| 호출 방식 | 의미 | 동작 |
|----------|------|------|
| **`next()`** | 정상 진행 | 큐의 다음 미들웨어로 이동 |
| **`next('route')`** | 라우트 건너뛰기 | 같은 경로의 다음 핸들러로 이동 (다음 라우트) |
| **`next(err)`** | 에러 전달 | 에러 처리 미들웨어(4개 파라미터)로 즉시 이동 |

```javascript
// next() — 다음 미들웨어로 진행
app.use((req, res, next) => {
  req.timestamp = Date.now();
  next();
});

// next('route') — 같은 라우트의 다음 핸들러 건너뛰기
app.get('/user/:id',
  (req, res, next) => {
    if (req.params.id === '0') {
      next('route'); // 다음 라우트로 건너뜀 (아래 핸들러 무시)
    } else {
      next();
    }
  },
  (req, res) => {
    res.json({ user: 'normal' });
  }
);

// next('route')에 의해 실행됨
app.get('/user/:id', (req, res) => {
  res.json({ user: 'default' });
});

// next(err) — 에러 처리 미들웨어로 즉시 이동
app.use((req, res, next) => {
  if (!req.headers.authorization) {
    next(new Error('인증이 필요합니다')); // 일반 미들웨어를 모두 건너뛰고 에러 처리기로
  }
  next();
});
```

> **코드 분석 — `next('route')`의 정확한 동작:**
>
> `next('route')`는 `next()`에 문자열 `'route'`를 전달하는 것이 아니라, Express 내부에서 특별히 처리되는 **매직 문자열**입니다. Express는 `next()`의 인자가 `'route'`인 경우 현재 라우트의 나머지 핸들러를 건너뛰고 **다음 라우트 매치**로 이동합니다.
>
> 반면 `next(new Error(...))`는 **에러 객체**를 전달합니다. Express 내부에서는 `next()`의 인자가 `'route'`도 아니고 `undefined`도 아니면 모두 **에러**로 간주합니다. 즉시 일반 미들웨어 큐를 건너뛰고 **에러 처리 미들웨어(4개 파라미터)**로 이동합니다.

---

## 비동기 에러 처리 — 왜 Express 4.x는 async 에러를 못 잡을까?

```javascript
// ❌ Express 4.x — async 에러가 catch되지 않음
app.get('/users', async (req, res, next) => {
  const user = await db.findUser(req.params.id);
  res.json(user.toJSON()); // user가 null이면: "Cannot read property 'toJSON' of null"
});
```

> **깊이 있는 설명 — Express 4.x가 async 에러를 잡지 못하는 이유:**
>
> Express 4.x는 **동기식 에러만 자동으로 잡을 수 있습니다**. async 함수는 **Promise를 반환**하는데, Express 4.x의 라우트 핸들러는 반환값이 Promise인지 확인하지 않습니다.
>
> async 함수 내부에서 `throw`가 발생하면:
> 1. async 함수는 자동으로 `Promise.reject(err)`를 반환
> 2. Express 4.x는 이 Promise를 무시함 (`.catch()`를 호출하지 않음)
> 3. 결과: **처리되지 않은 Promise 거부(Unhandled Promise Rejection)**가 발생
> 4. Node.js가 이 상황을 감지하면 경고를 출력하지만 프로세스는 죽지 않음 (최신 Node.js에서는 프로세스 종료)
>
> Express 5.x에서는 이 문제가 해결되어 async 핸들러의 Promise를 자동으로 처리합니다.

---

### 3가지 해결 방법

```javascript
// ✅ 해결 방법 1: asyncHandler 래퍼 (가장 일반적)
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.findUser(req.params.id);
  if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다');
  res.json(user);
}));

// ✅ 해결 방법 2: try/catch 직접 감싸기 (간단한 경우)
app.get('/users', async (req, res, next) => {
  try {
    const user = await db.findUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// ✅ 해결 방법 3: express-async-errors (한 줄로 모든 라우트에 적용)
require('express-async-errors');
// 이후 모든 async 핸들러의 에러가 자동으로 next(err)로 전달됨
```

> **코드 분석 — `asyncHandler`가 하는 일:**
>
> `asyncHandler`는 **고차 함수(Higher-Order Function)**입니다. async 함수를 받아서 **Express가 이해하는 일반 미들웨어 함수**로 감쌉니다:
>
> ```javascript
> const wrappedFn = asyncHandler(async (req, res) => {
>   // 이 안에서 에러가 발생하면...
>   throw new Error('뭔가 잘못됨');
> });
>
> // 위 코드는 내부적으로 이렇게 동작합니다:
> const wrappedFn = (req, res, next) => {
>   Promise.resolve(async (req, res) => {
>     throw new Error('뭔가 잘못됨');
>   }(req, res)).catch(next);  // ← Promise의 .catch()로 next(err)를 호출!
>   // express-async-errors는 Express의 라우트 핸들러 등록 함수를 Monkey-patch하여
>   // 모든 핸들러를 자동으로 asyncHandler로 감쌉니다.
> };
> ```

---

## 미들웨어 유형별 비교

| 미들웨어 유형 | 파라미터 수 | 실행 조건 | 주요 용도 |
|-------------|:---------:|----------|----------|
| **애플리케이션** | (req, res, next) | 3개 | 항상 실행 | 로깅, CORS, 파싱 |
| **라우트** | (req, res, next) | 3개 | 경로 일치 시 | 인증, 권한 검사 |
| **에러 처리** | (err, req, res, next) | **4개** | next(err) 호출 시 | 에러 로깅, 응답 |
| **내장** | `express.json()` 등 | 라이브러리 | 등록된 순서 | JSON 파싱, 정적 파일 |
| **서드파티** | `cors`, `helmet` 등 | 라이브러리 | 설정에 따라 | CORS, 보안, 압축 |

---

## 계층화된 에러 처리 시스템

### 1단계: 커스텀 에러 클래스

```javascript
class AppError extends Error {
  constructor(statusCode, code, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational; // 운영 에러 vs 프로그래밍 버그
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다') {
    super(404, 'NOT_FOUND', message);
  }
}

class BadRequestError extends AppError {
  constructor(message = '잘못된 요청입니다') {
    super(400, 'BAD_REQUEST', message);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(401, 'UNAUTHORIZED', message);
  }
}
```

### 2단계: 라우트 핸들러

```javascript
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.users.findById(req.params.id);
  if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다');

  if (req.user.id !== user.id && req.user.role !== 'admin') {
    throw new UnauthorizedError('이 사용자의 정보를 볼 권한이 없습니다');
  }

  res.json({ data: user });
}));
```

### 3단계: 404 처리 + 글로벌 에러 핸들러

```javascript
// 404 처리 미들웨어 (모든 라우트 다음에)
app.use((req, res, next) => {
  next(new NotFoundError(`경로 ${req.originalUrl}를 찾을 수 없습니다`));
});

// 글로벌 에러 처리 미들웨어 (마지막)
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: err.stack
  });

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.isOperational
    ? err.message
    : '서버 내부 오류가 발생했습니다';

  res.status(statusCode).json({
    error: code,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // 예상치 못한 에러는 프로세스 종료 (후에 재시작)
  if (!err.isOperational) {
    console.error('치명적 에러 발생, 서버 종료');
    process.exit(1);
  }
});
```

> **깊이 있는 설명 — 운영 에러(Operational Error)와 프로그래밍 버그(Programmer Error)의 구분 기준:**
>
> 모든 에러를 같은 방식으로 처리하면 안 됩니다. **운영 에러**는 예측 가능하고 복구 가능하지만, **프로그래밍 버그**는 코드 자체의 문제이므로 복구할 수 없습니다.
>
> | 구분 | 운영 에러 (Operational) | 프로그래밍 버그 (Programmer) |
> |------|----------------------|--------------------------|
> | **예시** | 잘못된 입력, DB 연결 실패, 파일 없음 | null 참조, 타입 에러, `undefined` 호출 |
> | **발생 원인** | 외부 요인 (사용자 입력, 네트워크) | 개발자 실수 (코드 버그) |
> | **`isOperational`** | `true` | `false` |
> | **사용자 응답** | 구체적 에러 메시지 | "서버 내부 오류" (정보 노출 방지) |
> | **프로세스 영향** | 정상 계속 실행 | **프로세스 종료 후 재시작** 필요 |
> | **대응 방법** | try/catch로 처리, 사용자에게 안내 | 코드 수정 필요, 모니터링 알림 |

---

## 에러 로깅 시스템 — Winston

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 10
    })
  ]
});

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  });
  next();
});
```

> **실전 노하우 — 로그 레벨과 파일 로테이션:**
>
> Winston의 로그 레벨은 다음과 같은 계층 구조입니다: `error` (0) < `warn` (1) < `info` (2) < `http` (3) < `verbose` (4) < `debug` (5) < `silly` (6)
>
> - 개발 환경: `level: 'debug'` — 모든 로그 출력
> - 프로덕션: `level: 'info'` — info 이상만 출력 (에러는 error.log에 별도 저장)
>
> **파일 로테이션**은 `maxsize`와 `maxFiles`로 제어합니다. `maxsize: 5242880`(5MB)는 로그 파일이 5MB를 초과하면 자동으로 새 파일을 생성합니다. `maxFiles: 5`는 최근 5개 파일만 유지하고 오래된 파일은 자동 삭제합니다.

---

## 유용한 커스텀 미들웨어 — 라이브러리 비교

| 라이브러리 | 용도 | 설정 예시 | 중요도 |
|-----------|------|----------|:----:|
| **`cors`** | Cross-Origin 요청 허용 | `origin: 'https://frontend.com'` | 필수 |
| **`helmet`** | HTTP 보안 헤더 설정 | CSP, X-Frame-Options 등 15개 헤더 | 필수 |
| **`compression`** | Gzip/Brotli 응답 압축 | `level: 6` (균형) | 권장 |
| **`express-rate-limit`** | 속도 제한 | 15분에 100회 | 권장 |
| **`morgan`** | HTTP 요청 로깅 | `'combined'` 포맷 | 개발 편의 |
| **`express-mongo-sanitize`** | NoSQL 인젝션 방지 | 모든 `$` 접두사 제거 | MongoDB 사용 시 |

```javascript
// 실전 미들웨어 구성
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');

app.use(helmet());                          // 보안 헤더
app.use(compression());                     // 응답 압축
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));   // JSON 파싱 + 크기 제한
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 100,                    // 100회
  message: { error: 'TOO_MANY_REQUESTS', message: '너무 많은 요청입니다' }
}));
```

---

## Graceful Shutdown — 안전한 서버 종료

```javascript
const server = app.listen(port);

async function gracefulShutdown(signal) {
  console.log(`\n${signal} 신호 수신. 서버 종료 중...`);

  // 1. 새 요청 거부
  server.close(() => {
    console.log('HTTP 서버 종료됨');
  });

  // 2. 진행 중인 요청 완료 대기 (최대 10초)
  server.setTimeout(10000);

  // 3. 데이터베이스 연결 종료
  await db.disconnect();
  await cache.disconnect();
  await messageQueue.close();

  console.log('서버가 안전하게 종료되었습니다');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('처리되지 않은 예외:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('처리되지 않은 Promise 거부:', reason);
});
```

> **깊이 있는 설명 — SIGTERM과 SIGINT의 차이:**
>
> | 시그널 | 발생 상황 | 기본 동작 | Graceful Shutdown |
> |--------|----------|----------|-------------------|
> | **SIGTERM** (15) | `kill` 명령어, Docker stop, 클라우드 오토스케일링 | 프로세스 종료 | ✅ 필수 |
> | **SIGINT** (2) | `Ctrl+C` | 프로세스 종료 | ✅ 권장 |
> | **SIGUSR2** (12) | `nodemon` 재시작 | 프로세스 종료 | nodemon 사용 시 |
>
> **컨테이너 환경(GCP, AWS ECS, Kubernetes)에서 SIGTERM 처리의 중요성:**
>
> 클라우드 환경에서 컨테이너가 종료될 때:
> 1. 오케스트레이터가 **SIGTERM** 전송
> 2. 애플리케이션은 `gracefulShutdown()` 실행: 진행 중인 요청 완료, DB 연결 정리
> 3. 일정 시간(보통 30초) 후에도 종료되지 않으면 **SIGKILL** 전송 (강제 종료)
>
> Graceful Shutdown을 구현하지 않으면:
> - 진행 중인 요청이 갑자기 중단되어 **데이터 손실** 발생
> - DB 연결이 갑자기 끊어져 **커넥션 누수**
> - 메시지 큐의 메시지가 **손실**

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>미들웨어 순서가 정말 그렇게 중요한가요?</strong></summary>

**매우 중요합니다.** Express는 미들웨어가 등록된 순서대로 실행됩니다. 가장 흔한 실수:
1. `express.json()`을 라우트보다 **늦게** 등록 → 모든 POST 요청에서 `req.body`가 `undefined`
2. CORS 미들웨어를 라우트보다 **늦게** 등록 → 브라우저 CORS 에러
3. 에러 처리 미들웨어를 라우트보다 **먼저** 등록 → 에러가 에러 처리기에 도달하지 않음

**올바른 순서:**
```javascript
1. 보안 미들웨어 (helmet)
2. CORS
3. 요청 파서 (express.json, express.urlencoded)
4. 압축 (compression)
5. 요청 로깅 (morgan/winston)
6. 속도 제한 (rate-limit)
7. 라우트 (커스텀 로직)
8. 404 처리기
9. 글로벌 에러 처리기 (마지막!)
```
</details>

<details>
<summary><strong>`process.exit(1)`을 호출하면 안전한가요?</strong></summary>

프로그래머 버그(프로그래밍 버그)의 경우에만 호출해야 합니다. 운영 에러는 예외입니다. `process.exit(1)`을 호출한 후에는 **프로세스 매니저(PM2, Docker, Kubernetes)**가 자동으로 프로세스를 재시작합니다. 단, `process.exit(1)` 전에는 반드시 Graceful Shutdown을 수행해야 합니다.
</details>

<details>
<summary><strong>모든 에러를 AppError로 처리해야 하나요?</strong></summary>

AppError는 **예측 가능한 에러**를 처리하기 위한 것입니다. 예측 불가능한 에러(null 참조, 타입 에러)는 글로벌 에러 핸들러가 `isOperational = false`로 처리합니다. 모든 에러를 AppError로 만들려고 하면 오히려 코드가 복잡해집니다. **예측 가능한 에러만** AppError로 처리하고, 나머지는 글로벌 핸들러에 맡기세요.
</details>

---

## 요약

- **미들웨어 체인**은 등록 순서대로 실행되며, `next()`의 호출 방식(일반/route/에러)에 따라 제어 흐름이 결정됩니다.
- **비동기 에러**는 Express 4.x가 자동으로 처리하지 못하므로 `asyncHandler` 래퍼나 `express-async-errors`가 필요합니다.
- **운영 에러**는 `isOperational = true`로 사용자에게 구체적인 메시지를 제공하고, **프로그래밍 버그**는 `false`로 일반 메시지만 제공하며 프로세스를 종료합니다.
- **에러 처리 파이프라인**은 3단계로 구성: 커스텀 에러 클래스 → 라우트에서 throw → 글로벌 핸들러
- **Winston**으로 로깅을 체계화하고, 로그 레벨과 파일 로테이션을 설정합니다.
- **Graceful Shutdown**은 SIGTERM/SIGINT 신호를 처리하여 진행 중인 요청 완료 후 리소스를 안전하게 정리합니다.
- 미들웨어의 **등록 순서**가 애플리케이션의 동작을 결정합니다.
