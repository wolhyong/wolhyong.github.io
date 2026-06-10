---
layout: post
title: "Node.js 보안: 위협 분석과 방어 기법"
description: "Node.js 애플리케이션 보안 — OWASP Top 10 실제 공격 사례, bcrypt 원리와 salt rounds 비교, CSRF/XSS/Injection 방어 심화, 취약점 스캐닝과 대응 전략"
date: 2022-07-18 10:00:00 +0900
category: nodejs
tags: [nodejs, javascript, security, helmet, rate-limiting, sql-injection, bcrypt, jwt, cors, owasp, xss, csrf]
level: advanced
---

웹 애플리케이션의 보안은 선택이 아닌 필수입니다. 실제로 전 세계 웹 트래픽의 약 **2%가 악성**이며, 평균적으로 **웹사이트는 하루 94회의 공격**을 받습니다. OWASP Top 10을 기준으로 Node.js 애플리케이션에서 발생할 수 있는 주요 보안 위협과 이를 방어하는 실무 기법을 학습합니다.

## 수업 목표

- OWASP Top 10 웹 보안 위협을 실제 공격 사례와 함께 이해합니다.
- Helmet 미들웨어의 각 헤더가 방어하는 공격을 정확히 이해합니다.
- Rate Limiting 전략을 Brute Force 공격 시나리오별로 설계할 수 있습니다.
- SQL/NoSQL Injection, XSS, CSRF의 동작 원리와 방어 기법을 이해합니다.
- bcrypt 해싱의 내부 동작 원리와 salt rounds 설정 기준을 압니다.
- JWT 토큰의 보안 설정과 Refresh Token 전략을 이해합니다.
- npm 취약점 스캐닝 결과를 해석하고 대응할 수 있습니다.

## OWASP Top 10과 Node.js

OWASP(Open Web Application Security Project) Top 10은 웹 애플리케이션의 가장 중요한 보안 위협을 정리한 목록입니다.

### 실제 공격 사례로 보는 OWASP Top 10

| 순위 | 취약점 | 실제 사례 (피해 규모) | Node.js 대응 |
|-----|--------|---------------------|-------------|
| A01 | Broken Access Control | 2019년 Capital One: 3,000만 고객 데이터 유출 (1.9억 달러 벌금) | JWT 검증, RBAC, ACL |
| A02 | Cryptographic Failures | 2021년 Facebook: 5억 개 계정 비밀번호 평문 저장 노출 | bcrypt(12라운드), crypto 모듈 |
| A03 | Injection | 2014년 Yahoo: SQL Injection으로 5억 개 계정 탈취 | Parameterized Query, input validation |
| A04 | Insecure Design | 2022년 Optus: API 인증 설계 결함으로 1,000만 고객 정보 유출 | 보안 설계 리뷰, threat modeling |
| A05 | Security Misconfiguration | 2020년 Microsoft: 내부 DB 2억 5,000만 건 노출 (CSP 헤더 누락) | Helmet, 환경 변수 분리 |
| A06 | Vulnerable Components | 2020년 SolarWinds: 공급망 공격으로 18,000개 조직 침투 | npm audit, Snyk, Dependabot |
| A07 | Auth Failures | 2021년 Twitch: 125GB 소스 코드 유출 (세션 토큰 만료 누락) | Passport.js, Redis 세션, MFA |
| A08 | Data Integrity Failures | 2021년 Kaseya: Ransomware 공격으로 1,500개 기업 피해 | SSL/TLS, JWT 서명 검증 |
| A09 | Logging Failures | 2019년 British Airways: 50만 건 개인정보 유출, 3개월 후 발견됨 | Winston 로깅, ELK Stack, 침투 탐지 |
| A10 | SSRF | 2019년 Capital One: SSRF로 AWS 메타데이터 접근 → 1.4억 달러 피해 | URL 검증, 화이트리스트, DNS 리바운드 방지 |

Node.js는 샌드박스 환경에서 실행되므로 전통적인 서버보다 일부 공격에 안전하지만, **애플리케이션 레벨의 취약점**은 동일하게 존재합니다.

## Helmet — 각 헤더가 방어하는 것

Helmet은 HTTP 응답 헤더를 설정하여 브라우저 레벨의 공격을 방어합니다.

```javascript
const express = require('express');
const helmet = require('helmet');

// 모든 Helmet 미들웨어 적용
app.use(helmet());

// 개별 설정
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https://trusted-cdn.com"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  hsts: {
    maxAge: 31536000,        // 1년
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 각 헤더가 방어하는 공격

| 헤더 | 방어하는 공격 | 동작 원리 |
|------|-------------|---------|
| `X-XSS-Protection` | 반사형 XSS | 브라우저의 XSS 필터 활성화 (Chrome은 표준 CSP로 대체) |
| `X-Content-Type-Options: nosniff` | MIME 유형 스니핑 공격 | 브라우저가 선언된 Content-Type을 강제로 따르도록 함 |
| `X-Frame-Options: DENY` | Clickjacking | 페이지가 `<frame>`, `<iframe>`, `<object>` 내 로딩 금지 |
| `Strict-Transport-Security` | SSL Stripping | HTTPS만 접속 허용 (301 리다이렉트 우회 방지) |
| `Content-Security-Policy` | XSS, 데이터 인젝션 | 허용된 출처 외 스크립트/스타일 로딩 차단 |
| `Referrer-Policy` | 정보 유출 | HTTP Referer 헤더에 포함되는 정보량 제한 |

### CSP 우회 공격 경고

CSP를 `script-src 'unsafe-inline'`으로 설정하면 **CSP의 핵심 보호 기능이 무력화**됩니다. 인라인 스크립트가 필요한 경우 nonce 사용을 권장합니다.

```javascript
// ❌ 취약한 CSP — unsafe-inline은 XSS 방어를 거의 무력화
res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'");

// ✅ 안전한 CSP — nonce 기반
const crypto = require('crypto');
const nonce = crypto.randomBytes(16).toString('base64');
res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);

// 템플릿에서 nonce 사용
res.render('index', { nonce });
```

## Rate Limiting — Brute Force 공격 방어

Brute Force 공격은 초당 수천 건의 요청을 보내는 자동화된 도구로 수행됩니다. 2023년 기준, 평균적인 Brute Force 공격은 **초당 1,000~10,000회**의 로그인 시도를 보냅니다.

### 공격 시나리오별 Rate Limit 설정

```javascript
const rateLimit = require('express-rate-limit');

// 글로벌 제한 — 모든 API: 분당 100회
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15분
  max: 100,                       // 최대 100회
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
  },
});
app.use(globalLimiter);

// 로그인 시도 — 분당 5회 (Brute Force 방어)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,             // 1분
  max: 5,                          // 최대 5회
  skipSuccessfulRequests: true,     // 성공한 요청은 카운트 제외
  message: {
    error: '너무 많은 로그인 시도. 1분 후 다시 시도하세요.'
  },
});
app.use('/api/auth/login', authLimiter);

// 회원가입 — IP당 1시간 3회 (봇 가입 방지)
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,        // 1시간
  max: 3,
  message: {
    error: '너무 많은 가입 시도. 1시간 후 다시 시도하세요.'
  },
});
app.use('/api/auth/signup', signupLimiter);

// 비밀번호 찾기 — IP당 15분 3회
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: '너무 많은 비밀번호 찾기 요청.'
  },
});
app.use('/api/auth/forgot-password', passwordResetLimiter);
```

**Rate Limit이 없을 때 vs 있을 때:**

```
[공격 시나리오] 공격자가 1분 동안 10,000회 로그인 시도
- Rate Limit 없음: 10,000회 모두 시도 가능
  → 10,000회 DB 조회, 10,000회 bcrypt 비교 (약 400초 CPU)
  → 서버 과부하 + 계정 탈취 위험

- Rate Limit 적용: 5회만 시도 가능, 9,995회 차단
  → CPU 사용량 0.2초로 감소 (99.95% 감소)
  → 차단된 요청은 DB 조회 없이 즉시 429 응답
```

## SQL/NoSQL Injection 방어

### SQL Injection 동작 원리

SQL Injection은 입력값을 SQL 쿼리의 일부로 삽입하여 DB를 조작하는 공격입니다.

```javascript
// ❌ 취약한 코드 — 입력값을 문자열로 직접연결
app.get('/users', async (req, res) => {
  const name = req.query.name;
  // name에 "' OR '1'='1" 입력 시?
  const query = `SELECT * FROM users WHERE name = '${name}'`;
  // 실제 실행: SELECT * FROM users WHERE name = '' OR '1'='1'
  // → 모든 사용자 정보 유출!
  const result = await pool.query(query);
});

// ✅ 안전한 코드 (Parameterized Query)
app.get('/users', async (req, res) => {
  const name = req.query.name;
  const result = await pool.query(
    'SELECT * FROM users WHERE name = $1',
    [name]  // 매개변수화: 입력값이 코드가 아닌 데이터로 처리됨
  );
});
```

**Parameterized Query가 안전한 이유:** SQL 구문 분석과 데이터 평가를 분리합니다. 먼저 `SELECT * FROM users WHERE name = $1` 템플릿을 파싱한 후, `$1`에 데이터를 바인딩합니다. 따라서 입력값에 SQL 키워드(`' OR '1'='1`)가 포함되어도 **단순한 문자열 값**으로만 처리됩니다.

```javascript
// NoSQL Injection — MongoDB에서도 동일한 원리로 공격 가능
// ❌ 취약한 코드
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // { "username": "admin", "password": { "$gt": "" } } 입력 시?
  // → $gt 연산자가 그대로 전달됨 → 모든 비밀번호가 비교 조건 통과
  const user = await User.findOne({ username, password });
});

// ✅ 안전한 코드
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize({
  replaceWith: '_',  // $ → _, . → _ 로 변환
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL Injection 시도 감지: ${key}`);
  },
}));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 타입 검증 — 문자열만 허용
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input type' });
  }

  // 길이 제한 — 버퍼 오버플로우 방지
  if (username.length > 50 || password.length > 128) {
    return res.status(400).json({ error: 'Input too long' });
  }

  const user = await User.findOne({ username, password });
});
```

## XSS (Cross-Site Scripting) 방어

XSS는 공격자가 웹사이트에 악성 스크립트를 주입하여 다른 사용자의 브라우저에서 실행되게 하는 공격입니다.

### XSS 공격 유형

| 유형 | 설명 | 피해 범위 | Node.js 방어 |
|------|------|----------|-------------|
| 저장형 XSS | 악성코드가 DB에 저장됨 → 모든 방문자 실행 | 가장 넓음 | 입력 검증, 이스케이프 |
| 반사형 XSS | URL 파라미터에 코드를 포함시켜 즉시 실행 | 공유 링크 클릭자 | CSP 헤더, URL 파라미터 검증 |
| DOM 기반 XSS | 클라이언트 JS가 사용자 입력을 unsafe하게 DOM에 삽입 | 페이지 방문자 | DOMPurify, innerHTML 사용 금지 |

```javascript
// Express 미들웨어 — 입력 값 이스케이프
const xss = require('xss-clean');
app.use(xss()); // <, >, ", ', & 등을 HTML 엔티티로 변환

// DOMPurify (서버 측 HTML 정화)
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = createDOMPurify(window);

function sanitizeHtml(input) {
  return purify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'class', 'target'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/,  // javascript: 프로토콜 차단
  });
}

// sanitizeHtml('<script>alert("xss")</script>')
// → ''  (스크립트 태그 제거)

// sanitizeHtml('<a href="javascript:alert(1)">click</a>')
// → '<a>click</a>'  (javascript: 프로토콜 차단)
```

### CSP(Content Security Policy) 심화

CSP 헤더는 브라우저가 로드할 수 있는 리소스를 제한하여 XSS의 영향을 최소화합니다. CSP가 있는 사이트는 저장형 XSS가 있더라도 스크립트 실행이 차단되어 **추가 방어막** 역할을 합니다.

```javascript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",                                // 모든 리소스는 동일 출처만
      "script-src 'self' 'nonce-abc123' 'strict-dynamic'", // nonce 기반 스크립트
      "style-src 'self' 'nonce-abc123'",                   // nonce 기반 스타일
      "img-src 'self' data: https:",                       // 이미지는 HTTPS만
      "font-src 'self'",
      "connect-src 'self' https://api.trusted.com",        // API 호출 제한
      "frame-ancestors 'none'",                            // iframe 삽입 금지
      "form-action 'self'",                                // 폼 제출 대상 제한
      "base-uri 'self'",                                   // <base> 태그 제한
    ].join('; ')
  );
  next();
});
```

## CSRF (Cross-Site Request Forgery) 방어

CSRF는 사용자가 로그인된 상태에서 공격자가 만든 위조 요청을 보내도록 유도하는 공격입니다.

**공격 시나리오:**
```
1. 사용자가 banking.com에 로그인되어 있음 (세션 쿠키 있음)
2. 공격자가 만든 evil.com 방문
3. evil.com 페이지가 banking.com/transfer?to=attacker&amount=10000 으로 요청
4. 브라우저가 banking.com 쿠키를 자동으로 포함시켜 전송
5. 서버는 정상 사용자의 요청으로 인식하고 송금 처리
```

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,                  // JS에서 쿠키 접근 차단
    secure: process.env.NODE_ENV === 'production',  // HTTPS 전용
    sameSite: 'strict',              // 크로스 사이트 요청에 쿠키 미포함
  },
});

// CSRF 토큰 생성 라우트
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 보호된 라우트
app.post('/api/transfer', csrfProtection, (req, res) => {
  // CSRF 토큰 검증 — 요청 본문이나 헤더의 토큰과 쿠키의 토큰 비교
  const { to, amount } = req.body;
  // 송금 처리
});

// 🆕 SameSite 쿠키만으로 방어 가능한 경우도 있음
// Set-Cookie: session=abc123; SameSite=Strict
// → Chrome 80+부터 SameSite=Lax가 기본값 (2020년 2월 이후)
// → CSRF 공격의 대부분을 SameSite 쿠키만으로 방어 가능
```

## CORS 설정 — Cross-Origin 통신 제어

CORS(Cross-Origin Resource Sharing)는 브라우저가 다른 출처의 리소스에 접근을 제어하는 메커니즘입니다. CORS는 CSRF와 관련이 있지만 다른 개념입니다.

```
CORS: "이 출처(origin)에서 우리 리소스에 접근해도 되는가?" → 브라우저가 서버에 확인
CSRF: "이 요청이 실제 사용자의 의도인가?" → 서버가 토큰으로 확인
```

```javascript
const cors = require('cors');

// ❌ 위험한 CORS — 모든 출처 허용 (개발 중에도 주의)
// app.use(cors());

// ✅ 안전한 CORS — 화이트리스트 기반
const corsOptions = {
  origin: function(origin, callback) {
    // 출처가 없는 요청(Postman, curl, 모바일 앱)은 허용
    if (!origin) return callback(null, true);

    const whitelist = [
      'https://myapp.com',
      'https://admin.myapp.com',
    ];

    if (whitelist.includes(origin)) {
      callback(null, true);          // 허용
    } else {
      callback(new Error('Not allowed by CORS'));  // 차단
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining'],
  credentials: true,                  // 쿠키 포함 요청 허용
  maxAge: 86400,                      // Preflight 결과 캐시 (24시간)
};

app.use(cors(corsOptions));
```

## 안전한 인증 구현

### bcrypt 비밀번호 해싱 — 내부 동작 원리

bcrypt는 Blowfish 암호화 알고리즘을 기반으로 한 비밀번호 해싱 함수입니다. 단순한 해시 함수(SHA-256 등)와 달리, **의도적으로 느리게 설계**되어 Brute Force 공격을 무력화합니다.

```
bcrypt 작동 원리:

1. salt 생성: 솔트는 16바이트(128비트)의 암호학적 난수
2. salt + 비밀번호 → Blowfish 암호화 (2^saltRounds 반복)
3. 결과: $2b$12$[22자리 salt][31자리 해시]

출력 예시:
$2b$12$LJ3m4ys3Lk0a1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U

구분:
$2b$ → bcrypt 버전 (2a, 2b, 2y)
$12$  → salt rounds(=2^12 = 4,096회 반복)
salt  → 22자리 base64 인코딩된 랜덤 값
hash  → 31자리 실제 해시 값
```

**Salt가 중요한 이유:** 같은 비밀번호라도 salt가 다르면 완전히 다른 해시가 생성됩니다. 이렇게 하면 레인보우 테이블(미리 계산된 해시값 DB) 공격이 무효화됩니다.

```javascript
const bcrypt = require('bcrypt');

// salt rounds: 2^N 회 반복 (기본 권장: 12)
const SALT_ROUNDS = 12;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
  // salt rounds=12 → 약 250ms 소요 (최신 하드웨어 기준)
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
  // bcrypt.compare는 해시에 포함된 salt를 추출하여 동일한 방식으로 해싱 후 비교
}
```

**Salt rounds 별 해싱 시간 비교 (2024년 AMD Ryzen 7 기준):**

| Salt Rounds | 반복 횟수 | 해싱 시간 | Brute Force: 8문자 완전탐색 |
|------------|----------|----------|--------------------------|
| 10 (2^10) | 1,024회 | ~30ms | 약 15년 |
| 12 (2^12) | 4,096회 | ~120ms | 약 60년 |
| 14 (2^14) | 16,384회 | ~480ms | 약 240년 |
| 16 (2^16) | 65,536회 | ~2,000ms | 약 960년 |

**선택 기준:**
- **10라운드:** 레거시 시스템, 1초 내 응답이 필요한 API
- **12라운드:** 일반적인 웹 애플리케이션 (권장)
- **14라운드:** 금융/의료 등 고보안 시스템 (응답 시간 0.5초 증가 감수)
- **16라운드 이상:** 마스터 비밀번호나 암호화 키 (사용자 로그인에는 부적합)

### JWT 안전하게 사용하기

```javascript
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;    // 최소 256비트(32자)
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;   // ACCESS_SECRET과 반드시 분리

function generateTokens(userId) {
  // Access Token: 15분
  const accessToken = jwt.sign(
    {
      userId,
      role: 'user',
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh Token: 7일
  const refreshToken = jwt.sign(
    {
      userId,
      type: 'refresh',
      tokenVersion: 1,  // 토큰 무효화에 사용
    },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}
```

**JWT 보안 체크리스트:**

| 설정 | 권장값 | 이유 |
|------|-------|------|
| 알고리즘 | RS256 (비대칭) 또는 HS256 (대칭) | `none` 알고리즘 차단 필수 |
| Access Token 만료 | 15분 이하 | 탈취 시 피해 최소화 |
| Refresh Token 만료 | 7~30일 | 필요시 재로그인 유도 |
| Token 저장 위치 | httpOnly 쿠키 | localStorage는 XSS에 취약 |
| secret key | 최소 32바이트 암호학적 난수 | `openssl rand -hex 32`로 생성 |
| 토큰 무효화 | 블랙리스트 or tokenVersion | Refresh Token으로 제어 |

```javascript
// Refresh Token을 이용한 Access Token 갱신
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    // 토큰 버전 검증 — 사용자가 비밀번호를 변경하면 tokenVersion 증가
    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new Error('Token revoked');
    }

    // 새 Access Token 발급
    const accessToken = jwt.sign(
      { userId: decoded.userId, role: user.role },
      ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    return { accessToken };
  } catch (err) {
    throw new Error('Invalid refresh token');
  }
}
```

## 취약점 스캐닝과 대응

```bash
# npm audit — 기본 취약점 검사
npm audit

# 심각도별 취약점 수 확인
# npm audit 결과 예시:
#
# === npm audit security report ===
#
# ┌───────────────┬─────────────────────────────────┐
# │ Critical      │ 0                               │
# │ High          │ 2                               │
# │ Moderate      │ 5                               │
# │ Low           │ 3                               │
# ├───────────────┼─────────────────────────────────┤
# │ Total         │ 10                              │
# └───────────────┴─────────────────────────────────┘
#
# 자동 수정 가능한 취약점 → npm audit fix
npm audit fix

# 주요 버전 변경이 필요한 취약점 → --force
npm audit fix --force

# 상세 보고서
npm audit --json
```

```javascript
// package.json에 취약점 스크립트 등록
{
  "scripts": {
    "security:audit": "npm audit --audit-level=high",
    "security:snyk": "snyk test",
    "security:all": "npm audit --audit-level=high && snyk test"
  },
  // CI 파이프라인에서 npm audit --audit-level=high 실행
  // → High 이상 취약점이 있으면 빌드 실패
}
```

## 통합 실전 예제: 보안 강화 Express 앱

```javascript
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const app = express();

// 1. HTTP 헤더 보안 (XSS, Clickjacking, MIME 스니핑 방어)
app.use(helmet());

// 2. Rate Limiting (Brute Force 방어)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' },
}));

// 로그인 라우트는 더 엄격한 제한
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);

// 3. CORS (Cross-Origin 통신 제어)
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  maxAge: 86400,
}));

// 4. Body Parser (크기 제한으로 DoS 방어)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. 데이터 정화 (Injection, XSS 방어)
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// 6. CSRF 방어
app.use(cookieParser());
const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'strict' } });
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 7. 보안 로깅 — 모든 요청 기록
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 8. 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// 9. 404 처리
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 10. 글로벌 에러 핸들러 — 에러 정보 노출 최소화
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? '서버 오류가 발생했습니다.'
      : err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
```

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Helmet만 사용하면 모든 보안 문제가 해결되나요?</strong></summary>

아니요. Helmet은 HTTP 헤더 보안만 담당합니다. SQL Injection, XSS, CSRF, 인증/인가 취약점 등 다른 공격 벡터는 별도로 방어해야 합니다. Helmet은 전체 보안 전략의 첫 번째 방어선(HTTP 헤더)일 뿐이며, 나머지 방어선(입력 검증, 출력 이스케이프, 접근 제어, 암호화)은 모두 직접 구현해야 합니다.
</details>

<details>
<summary><strong>Salt rounds를 너무 높게 설정하면 어떻게 되나요?</strong></summary>

응답 시간이 증가합니다. rounds=14면 로그인 요청 하나에 500ms가 소요되어, 100명이 동시 로그인하면 50초가 걸립니다. rounds=12가 보안과 성능의 최적 균형점입니다. rounds=10은 추천하지 않습니다. GPU 기반 Brute Force 공격(예: Hashcat)으로 rounds=10을 초당 수백만 회까지 시도할 수 있기 때문입니다.
</details>

<details>
<summary><strong>JWT는 어디에 저장해야 하나요?</strong></summary>

가장 안전한 방법은 **httpOnly, Secure, SameSite 쿠키**에 저장하는 것입니다. localStorage에 저장하면 XSS 공격 하나로 모든 토큰이 탈취됩니다. 다만 쿠키에 저장하면 CSRF 방어가 필요하므로, SameSite=Strict 설정으로 CSRF를 함께 방어하는 것이 좋습니다.
</details>

## 요약

- **OWASP Top 10** — 실제 공격 사례와 피해 규모를 기준으로 방어 전략 수립
- **Helmet** — XSS, Clickjacking, MIME 스니핑 등 브라우저 레벨 공격 방어 (단, CSP에 `unsafe-inline`은 금지)
- **Rate Limiting** — 로그인 1분 5회, 회원가입 1시간 3회 등 엔드포인트별 차등 적용
- **SQL/NoSQL Injection** — Parameterized Query와 타입 검증으로 완벽 차단
- **XSS** — CSP nonce 기반 스크립트 제어 + DOMPurify로 HTML 정화
- **CSRF** — SameSite=Strict 쿠키 + CSRF 토큰 이중 방어
- **bcrypt** — salt rounds=12 권장, 약 120ms 소요 (보안과 성능의 균형)
- **JWT** — Access Token 15분, httpOnly 쿠키 저장, Refresh Token 분리
- **의존성 스캐닝** — npm audit + Snyk를 CI에 포함하여 High 이상 취약점은 빌드 차단
