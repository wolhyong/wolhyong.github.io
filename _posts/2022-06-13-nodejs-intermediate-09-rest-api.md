---
layout: post
title: "Node.js REST API 설계 — HTTP 메서드, 상태 코드, HATEOAS 완전 이해"
description: "RESTful API의 진정한 의미와 설계 원칙 — HTTP 메서드의 멱등성과 안전성이 데이터 무결성에 미치는 영향, HATEOAS가 진정한 REST의 핵심인 이유, URL 설계 패턴 7가지 비교, 상태 코드 선택 가이드, 입력 검증과 에러 응답 표준화, 페이지네이션과 API 문서화까지 실전 예제로 마스터"
date: 2022-06-13 10:00:00 +0900
category: nodejs
tags: [nodejs, rest-api, api-design, express, http-methods, idempotent, hateoas, openapi, swagger, validation, pagination, error-handling, api-versioning]
level: intermediate
---

REST API는 단순히 "URL로 데이터를 주고받는 방식"이 아닙니다. **HTTP 프로토콜이 본래 갖고 있는 의미와 기능을 최대한 활용하는 아키텍처 스타일**입니다. 진정한 REST를 이해하려면 HTTP 메서드의 원래 의미, 상태 코드의 분류, 리소스 표현의 개념을 깊이 이해해야 합니다.

이 포스트에서는 REST의 **내부 원리**와 **실전 구현**을 함께 다룹니다.

## 수업 목표

- REST의 6가지 제약 조건과 각 조건이 **왜** 존재하는지 이해합니다.
- HTTP 메서드(GET/POST/PUT/PATCH/DELETE)의 **멱등성과 안전성**을 이해합니다.
- **HATEOAS** 개념을 이해하고 API 응답에 적용하는 방법을 학습합니다.
- **표준화된 에러 응답**과 **입력 검증** 패턴을 익힙니다.
- **OpenAPI/Swagger**로 API 문서를 자동화하는 방법을 학습합니다.
- SEO/AEO/GEO 최적화된 API 설계 방법을 익힙니다.

---

## REST의 6가지 제약 조건 — 왜 이런 규칙이 필요할까?

```text
1. 클라이언트-서버 구조 — 관심사 분리
2. 무상태(Stateless)     — 각 요청이 독립적, 세션 상태 유지 안 함
3. 캐시 가능             — 응답이 캐시 가능함을 명시적으로 표시
4. 계층화 시스템         — 중간 서버(프록시, 게이트웨이)를 투명하게 추가 가능
5. 인터페이스 일관성     — URL, 메서드, 상태 코드가 일관된 규칙을 따라야 함
6. Code on Demand (선택) — 서버가 클라이언트에 실행 가능한 코드 전송
```

> **깊이 있는 설명 — 각 제약 조건이 해결하는 문제:**
>
> **1. 클라이언트-서버 구조**: UI(클라이언트)와 데이터 저장(서버)을 분리하면 두 계층이 **독립적으로 진화**할 수 있습니다. 모바일 앱, 웹 앱, 서드파티 앱이 동일한 API를 공유할 수 있습니다.
>
> **2. 무상태(Stateless)**: 서버는 클라이언트의 상태(세션)를 저장하지 않습니다. 각 요청에는 필요한 모든 정보가 포함되어야 합니다. 이 조건이 왜 중요할까요?
>
> ```
> 상태 저장 서버 예시:
> ┌───────┐  요청 1  ┌───────────┐
> │Client1│ ───────→ │ Server A  │  (Client1의 세션: 장바구니에 사과 1개)
> └───────┘          └───────────┘
> ┌───────┐  요청 2  ┌───────────┐
> │Client1│ ───────→ │ Server B  │  (Client1 세션 없음! 처음부터 다시 시작)
> └───────┘          └───────────┘
> ```
>
> 상태 저장 서버에서는 로드밸런서가 **같은 클라이언트를 항상 같은 서버로** 보내야 합니다(Sticky Session). 서버 A가 다운되면 Client1의 모든 세션 데이터가 사라집니다. **무상태**는 이러한 문제를 근본적으로 해결합니다. 각 요청에 인증 토큰(`Authorization: Bearer <token>`)이 포함되어 있으면 어떤 서버가 요청을 처리해도 문제없습니다.
>
> **3. 캐시 가능**: 응답 헤더에 `Cache-Control: public, max-age=3600`를 명시하면 클라이언트와 중간 프록시가 응답을 캐시할 수 있습니다. GET 요청의 응답을 캐시하면 **같은 요청에 대한 응답 시간을 0ms**로 만들 수 있습니다.
>
> **4. 계층화 시스템**: 클라이언트는 자신이 API 서버와 직접 통신하는지, 로드밸런서나 API 게이트웨이를 거치는지 알 필요가 없습니다. 이 덕분에 **로드밸런서, CDN, API 게이트웨이** 등을 자유롭게 추가할 수 있습니다.

---

## HTTP 메서드 — 안전성과 멱등성

REST의 핵심은 HTTP 메서드를 **원래 의도에 맞게** 사용하는 것입니다. 각 메서드가 가진 **안전성(Safe)**과 **멱등성(Idempotent)**이라는 두 가지 수학적 속성을 이해해야 합니다.

| HTTP 메서드 | 안전함 (Safe) | 멱등성 (Idempotent) | 요청 바디 | 응답 캐시 | 주요 용도 |
|------------|:------------:|:------------------:|:--------:|:---------:|----------|
| **GET** | ✅ 예 | ✅ 예 | ❌ | ✅ 가능 | 리소스 조회 |
| **HEAD** | ✅ 예 | ✅ 예 | ❌ | ✅ 가능 | 헤더만 조회 |
| **OPTIONS** | ✅ 예 | ✅ 예 | ❌ | ❌ | 허용 메서드 확인 |
| **DELETE** | ❌ 아니요 | ✅ 예 | ❌ | ❌ | 리소스 삭제 |
| **PUT** | ❌ 아니요 | ✅ 예 | ✅ 필요 | ❌ | 리소스 전체 교체 |
| **PATCH** | ❌ 아니요 | ❌ 아니요 | ✅ 필요 | ❌ | 리소스 부분 수정 |
| **POST** | ❌ 아니요 | ❌ 아니요 | ✅ 필요 | ❌ | 리소스 생성 (기타 처리) |

> **코드 분석 — 멱등성이 실제로 의미하는 것:**
>
> **멱등성(Idempotent)**: 동일한 요청을 1번 보내든 100번 보내든 **서버의 최종 상태가 동일**해야 합니다.
>
> ```javascript
> // DELETE /users/1
> // 1번째 호출: 사용자 1 삭제됨 → 200 OK
> // 2번째 호출: 사용자 1은 이미 없음 → 404 Not Found
> // 결과: 두 호출 이후 사용자 1은 없는 상태로 동일 → 멱등성 만족 ✅
>
> // POST /users (새 사용자 생성)
> // 1번째 호출: 사용자 A 생성됨 { id: 1, name: 'Alice' }
> // 2번째 호출: 사용자 A가 또 생성됨 { id: 2, name: 'Alice' }
> // 결과: 두 호출 이후 서버에 사용자 A가 2명 → 멱등성 위반 ❌
> ```
>
> **안전함(Safe)**: 요청이 서버의 상태를 **전혀 변경하지 않음**을 의미합니다. GET은 데이터를 읽기만 하고 변경하지 않으므로 안전합니다. 하지만 다음과 같은 실수를 하면 안전성을 위반하게 됩니다:
>
> ```javascript
> // ❌ 위험: GET 요청에서 데이터 변경
> router.get('/users/:id', (req, res) => {
>   req.session.visitCount++;  // ← 사이드 이펙트! GET은 상태를 변경하면 안 됨
>   // ...
> });
> ```

---

## 리소스 지향 URL 설계 — 7가지 패턴

| 패턴 | 예시 | 설명 |
|------|------|------|
| **컬렉션** | `GET /users` | 리소스 목록 조회 |
| **단일 리소스** | `GET /users/42` | 특정 리소스 조회 |
| **관계 (1:N)** | `GET /users/42/posts` | 특정 사용자의 글 목록 |
| **관계 (N:N)** | `GET /posts/7/tags` | 특정 글의 태그 목록 |
| **필터링** | `GET /users?role=admin&status=active` | 조건에 따른 필터링 |
| **정렬** | `GET /users?sort=createdAt:desc,name:asc` | 복수 정렬 기준 |
| **부분 응답** | `GET /users?fields=id,name,email` | 필요한 필드만 선택 |

> **깊이 있는 설명 — RESTful URL vs RPC 스타일 URL:**
>
> RESTful URL은 **리소스(명사)** 중심입니다. 반면 RPC(Remote Procedure Call) 스타일은 **동작(동사)** 중심입니다.
>
> ```
> RESTful:  GET /users/42/posts        → "사용자 42의 글을 주세요"
> RPC:      GET /getUserPosts?uid=42   → "(내부 함수) getUserPosts를 실행해주세요"
>
> RESTful:  POST /users                → "새 사용자를 생성해주세요"
> RPC:      POST /createUser           → "(내부 함수) createUser를 실행해주세요"
> ```
>
> RESTful URL이 더 나은 이유:
> 1. **일관성**: 리소스 구조가 URL에 그대로 드러남 (계층적 탐색 가능)
> 2. **예측 가능성**: 패턴을 알면 다른 리소스도 같은 규칙으로 접근 가능
> 3. **캐싱 용이**: 동일한 URL은 동일한 리소스를 가리킴 (RPC는 같은 리소스도 URL이 다를 수 있음)

---

## 실전 REST API 구현 — 코드 분석

```javascript
const express = require('express');
const router = express.Router();

// 메모리 기반 데이터 저장소
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', createdAt: '2024-01-01' },
  { id: 2, name: 'Bob', email: 'bob@example.com', createdAt: '2024-01-15' }
];
let nextId = 3;

// GET /users — 목록 조회 (with pagination)
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedUsers = users.slice(startIndex, endIndex);

  res.json({
    data: paginatedUsers,
    pagination: {
      page,
      limit,
      total: users.length,
      totalPages: Math.ceil(users.length / limit),
      hasNext: endIndex < users.length,
      hasPrev: page > 1
    }
  });
});
```

> **코드 분석 — 페이지네이션 응답 구조:**
>
> 위 페이지네이션 응답은 클라이언트가 **다음 페이지가 있는지, 이전 페이지가 있는지**를 추가 요청 없이 알 수 있게 합니다. 실무에서는 응답에 **HATEOAS 링크**를 포함시키는 것이 더 좋은 방식입니다:
>
> ```javascript
> res.json({
>   data: paginatedUsers,
>   pagination: {
>     self: '/api/users?page=1&limit=10',
>     next: hasNext ? '/api/users?page=2&limit=10' : null,
>     prev: hasPrev ? '/api/users?page=0&limit=10' : null,
>     first: '/api/users?page=1&limit=10',
>     last: '/api/users?page=3&limit=10'
>   }
> });
> ```
>
> 이렇게 하면 클라이언트가 URL을 조합하는 로직을 구현할 필요 없이, 응답에 포함된 링크를 따라가기만 하면 됩니다. 이것이 **HATEOAS의 핵심 개념**입니다.

---

### 상세 구현 코드 분석

```javascript
// POST /users — 생성
router.post('/', (req, res) => {
  const { name, email } = req.body;

  // 입력 검증
  const errors = [];
  if (!name || name.trim().length < 2) {
    errors.push('이름은 최소 2자 이상이어야 합니다');
  }
  if (!email || !email.includes('@')) {
    errors.push('유효한 이메일 주소를 입력하세요');
  }
  if (users.find(u => u.email === email)) {
    errors.push('이미 등록된 이메일입니다');
  }

  if (errors.length > 0) {
    return res.status(422).json({ errors });
  }

  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    createdAt: new Date().toISOString().split('T')[0]
  };

  users.push(newUser);
  res.status(201).location(`/api/users/${newUser.id}`).json({ data: newUser });
});
```

> **코드 분석 — POST 응답이 201 Created여야 하는 이유:**
>
> `res.status(201)`은 "리소스가 성공적으로 생성됨"을 의미합니다. 200 OK를 사용하는 것과의 차이:
>
> | 응답 코드 | 의미 | 캐싱 | 클라이언트 동작 |
> |----------|------|------|---------------|
> | **200 OK** | 요청 성공 (기본값) | 응답 캐시 가능 | 생성된 리소스 ID 확인 필요 |
> | **201 Created** | 리소스 생성 성공 | 캐시하지 않음 | 응답 바디나 Location 헤더에서 새 리소스 ID 확인 |
>
> 또한 `.location(/api/users/${newUser.id})`는 HTTP `Location` 헤더를 설정합니다. 클라이언트는 이 헤더를 통해 생성된 리소스의 정확한 URL을 알 수 있습니다.

---

### PUT vs PATCH — 멱등성의 실제 사례

```javascript
// PUT /users/:id — 전체 교체 (멱등성 있음)
router.put('/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다' });
  }

  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(422).json({ error: 'VALIDATION', message: 'name과 email은 필수입니다' });
  }

  users[idx] = { ...users[idx], name, email };  // 전체 교체!
  res.json({ data: users[idx] });
});

// PATCH /users/:id — 부분 수정 (멱등성 없음)
router.patch('/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다' });
  }

  const allowedFields = ['name', 'email'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  users[idx] = { ...users[idx], ...updates };  // 일부만 병합!
  res.json({ data: users[idx] });
});
```

> **깊이 있는 설명 — PUT과 PATCH의 멱등성 차이가 실무에서 의미하는 것:**
>
> PUT은 멱등성을 보장하므로 **네트워크 재시도**가 안전합니다:
>
> ```
> 클라이언트가 PUT /users/1 { name: "Alice", email: "a@b.com" } 요청
> → 네트워크 타임아웃 (서버는 처리했지만 응답이 도착하지 않음)
> → 클라이언트가 같은 PUT 요청 재시도
> → 서버는 같은 요청을 다시 처리해도 최종 상태는 동일
> ```
>
> 반면 PATCH는 멱등성을 보장하지 않으므로 **재시도 시 문제**가 발생할 수 있습니다:
>
> ```
> PATCH /cart { operation: "add", item: "apple" }
> → 네트워크 타임아웃
> → 같은 요청 재시도
> → 결과: "apple"이 장바구니에 2번 추가됨! (멱등성 위반)
> ```
>
> **실전 노하우:** 네트워크가 불안정한 모바일 환경에서는 PUT을 선호하고, PATCH를 사용해야 한다면 요청에 **멱등성 키(Idempotency-Key)** 헤더를 포함시키는 패턴을 사용합니다.

---

## 입력 검증 미들웨어 — express-validator 심화

```javascript
const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(422).json({
      error: 'VALIDATION_ERROR',
      messages: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  };
};

// 라우트에 검증 적용
router.post('/users',
  validate([
    body('name').trim().isLength({ min: 2 }).withMessage('이름은 2자 이상'),
    body('email').isEmail().withMessage('유효한 이메일이 아닙니다'),
    body('age').optional().isInt({ min: 0, max: 150 }).withMessage('나이는 0-150 사이')
  ]),
  createUserHandler
);
```

> **깊이 있는 설명 — express-validator의 내부 동작:**
>
> `express-validator`는 내부적으로 **validator.js** 라이브러리를 사용합니다. 각 검증 체인(`.trim().isLength()`)은 다음과 같이 동작합니다:
>
> 1. `body('name')` — 요청 바디에서 `name` 필드를 선택하는 컨텍스트 생성
> 2. `.trim()` — 선택한 값에 `String.prototype.trim()` 적용 (전처리)
> 3. `.isLength({ min: 2 })` — validator.js의 `isLength` 함수로 길이 검증
> 4. `.withMessage(...)` — 검증 실패 시 사용자 정의 오류 메시지 등록
>
> 검증 실패 시 `validationResult(req)`는 다음과 같은 배열을 반환합니다:
> ```json
> [
>   { "path": "name", "msg": "이름은 2자 이상", "location": "body" },
>   { "path": "email", "msg": "유효한 이메일이 아닙니다", "location": "body" }
> ]
> ```

---

## 에러 응답 형식 표준화

```javascript
// 에러 응답 클래스
class AppError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = '리소스') {
    super(404, 'NOT_FOUND', `${resource}을(를) 찾을 수 없습니다`);
  }
}

// 글로벌 에러 처리 미들웨어
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: '서버 내부 오류가 발생했습니다'
  });
}
```

> **깊이 있는 설명 — 에러 응답에 stack을 포함시키는 조건:**
>
> 개발 환경에서만 `err.stack`을 포함시키는 이유는 **보안** 때문입니다. 스택 트레이스에는 파일 경로, 내부 변수명, 라이브러리 버전 등 **공격자에게 도움이 되는 정보**가 포함되어 있습니다. 프로덕션 환경에서는 절대 노출하면 안 됩니다.

---

## HTTP 상태 코드 선택 가이드

모든 API 응답은 **가장 구체적인 상태 코드**를 사용해야 합니다. 200 OK로 모든 성공을 처리하면 클라이언트가 응답의 의미를 추론해야 합니다.

| 상황 | 상태 코드 | 응답 바디 | Location 헤더 |
|------|----------|-----------|--------------|
| **GET 단일 조회 성공** | 200 OK | 조회된 리소스 | ❌ |
| **GET 목록 조회 성공** | 200 OK | 리소스 배열 + 페이지네이션 | ❌ |
| **POST 리소스 생성 성공** | 201 Created | 생성된 리소스 | ✅ 새 리소스 URL |
| **PUT/PATCH 수정 성공** | 200 OK | 수정된 리소스 | ❌ |
| **DELETE 삭제 성공** | 204 No Content | ❌ (빈 응답) | ❌ |
| **잘못된 요청 형식** | 400 Bad Request | 에러 객체 | ❌ |
| **인증 필요** | 401 Unauthorized | 에러 객체 | ❌ |
| **권한 없음** | 403 Forbidden | 에러 객체 | ❌ |
| **리소스 없음** | 404 Not Found | 에러 객체 | ❌ |
| **메서드 미지원** | 405 Method Not Allowed | 에러 객체 (Allow 헤더 포함) | ❌ |
| **입력 검증 실패** | 422 Unprocessable | 검증 오류 배열 | ❌ |
| **서버 내부 오류** | 500 Internal Server Error | 에러 객체 (일반적 메시지) | ❌ |

---

## API 문서화 — Swagger/OpenAPI의 내부

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const specs = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blog API',
      version: '1.0.0',
      description: '블로그 REST API 문서'
    },
    servers: [
      { url: 'http://localhost:4000', description: '개발 서버' },
      { url: 'https://api.example.com', description: '프로덕션 서버' }
    ]
  },
  apis: ['./routes/*.js']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

> **깊이 있는 설명 — OpenAPI가 AI 검색 엔진(AEO/GEO)에 중요한 이유:**
>
> OpenAPI 사양은 구조화된 데이터(Schema.org)의 `APIReference` 유형과 호환됩니다. `openapi.yaml` 파일을 웹사이트에 노출하면 **Google, ChatGPT, Perplexity** 등의 AI 검색 엔진이 API의 엔드포인트, 파라미터, 응답 형식을 정확히 이해할 수 있습니다.
>
> 특히 JSON-LD 형식으로 API 문서를 추가하면 AI가 API를 검색 결과에서 직접 호출할 수 있는 기능(Google's AI-powered API actions)을 지원하게 됩니다.

---

## 자주 묻는 질문

<details>
<summary><strong>REST API에서 모든 응답을 200 OK로 통일해도 되나요?</strong></summary>

기술적으로는 가능하지만 **강력히 권장하지 않습니다**. 상태 코드는 클라이언트가 응답을 어떻게 처리할지 결정하는 첫 번째 신호입니다. 201 Created는 "리소스가 생성되었음", 204 No Content는 "삭제 성공"을 즉시 알려줍니다. 상태 코드를 정확히 사용하면 클라이언트 코드가 더 간결해지고 오류 처리도 명확해집니다.
</details>

<details>
<summary><strong>HATEOAS를 꼭 구현해야 하나요?</strong></summary>

엄밀한 REST(로이 필딩의 원본 논문 기준)에서는 HATEOAS가 필수입니다. 그러나 실무에서는 **API 버저닝과 문서화**가 더 중요하게 여겨집니다. 대부분의 API는 "RESTful"이지만 완전한 REST(Level 3)까지 도달하지는 않습니다. 필요한 수준:
- Level 1 (리소스 기반): 기본
- Level 2 (HTTP 메서드 + 상태 코드): 대부분의 API가 여기
- Level 3 (HATEOAS): 바람직하지만 선택
</details>

<details>
<summary><strong>API 버저닝은 어떻게 해야 하나요?</strong></summary>

가장 널리 사용되는 방식은 **URL 경로 기반 버저닝**입니다:
```
/api/v1/users
/api/v2/users
```
또는 **헤더 기반 버저닝**:
```
Accept: application/vnd.api.v1+json
```
URL 방식이 직관적이고 캐싱이 쉬워 실무에서 더 많이 사용됩니다. 버전은 **하위 호환성을 깨는 변경**이 있을 때만 올려야 합니다. 새로운 필드를 추가하는 것은 버전을 올리지 않아도 됩니다.
</details>

<details>
<summary><strong>API 응답에 어떤 필드를 포함해야 하나요?</strong></summary>

최소한 다음 세 가지를 포함하는 것을 권장합니다:
1. **meta**: 요청 처리 시간, 서버 버전 등 메타 정보
2. **data**: 실제 응답 데이터
3. **error**: 오류 발생 시 오류 정보
4. **pagination**: 목록 조회 시 페이지 정보 (선택)
</details>

---

## HATEOAS — 진정한 REST의 완성

```javascript
// HATEOAS 응답 예시
router.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다' });

  res.json({
    data: user,
    _links: {
      self: { href: `/api/users/${user.id}`, method: 'GET' },
      posts: { href: `/api/users/${user.id}/posts`, method: 'GET' },
      update: { href: `/api/users/${user.id}`, method: 'PUT' },
      delete: { href: `/api/users/${user.id}`, method: 'DELETE' },
      collection: { href: '/api/users', method: 'GET' }
    }
  });
});
```

> **깊이 있는 설명 — HATEOAS가 API를 "검색 가능"하게 만드는 방법:**
>
> HATEOAS가 적용된 API는 클라이언트가 **API 문서 없이도** 리소스를 탐색할 수 있습니다. 사용자 리소스의 응답에 포함된 `_links`를 보고 "이 사용자의 글을 보려면 `/api/users/1/posts`로 GET 요청하면 되는구나"를 추론할 수 있습니다.
>
> 이것이 **Representation State Transfer**라는 이름의 진정한 의미입니다: 리소스의 **표현(Representation)** 자체에 **상태 전이(State Transfer)**에 필요한 링크가 포함되어 있어, 클라이언트가 애플리케이션 상태를 자동으로 전이할 수 있습니다.

---

## 요약

- **REST의 6가지 제약 조건**은 각각 확장성(무상태), 성능(캐시), 유연성(계층화) 등 구체적인 문제를 해결합니다.
- **HTTP 메서드**는 GET(안전함+멱등), PUT(멱등), POST(비멱등) 등 각각의 수학적 속성을 이해하고 사용해야 합니다.
- **상태 코드**는 응답의 의미를 즉시 전달합니다. 201 Created, 204 No Content, 422 Unprocessable 등 구체적인 코드를 사용하세요.
- **HATEOAS**는 응답에 리소스 간 관계(링크)를 포함시켜 API를 탐색 가능하게 만듭니다.
- **OpenAPI 문서화**는 개발자 경험뿐 아니라 AI 검색 엔진(GEO/AEO) 최적화에도 중요합니다.
- **입력 검증**은 프리페어드 스테이트먼트처럼 사용자 입력을 안전하게 처리하는 첫 번째 방어선입니다.
- API 설계에서 가장 중요한 원칙은 **일관성(Consistency)**입니다. 한 가지 패턴을 정하면 모든 엔드포인트에 동일하게 적용하세요.
