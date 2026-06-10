---
layout: post
title: "Node.js 인증과 인가 — JWT, bcrypt, OAuth2 과정 완료"
description: "Node.js 사용자 인증(Authentication)과 인가(Authorization) 심층 가이드 — bcrypt의 Blowfish 암호화가 비밀번호를 안전하게 저장하는 원리, JWT의 HS256/RS256/ES256 서명 알고리즘 차이와 성능 비교, 액세스 토큰과 리프레시 토큰의 이중 구조가 필요한 이유, Refresh Token Rotation이 보안을 강화하는 방법, 세션 기반 인증과 JWT의 실제 트레이드오프, OAuth2 Authorization Code Flow 개념, Rate Limiting과 무차별 대입 공격 방어 전략"
date: 2022-06-20 10:00:00 +0900
category: nodejs
tags: [nodejs, authentication, jwt, bcrypt, session, authorization, security, oauth2, refresh-token, rate-limiting, csrf, xss, jsonwebtoken, express-session]
level: intermediate
---

웹 애플리케이션에서 사용자 인증은 **단순히 "로그인/로그아웃"을 구현하는 것**과 **보안적으로 올바르게 구현하는 것** 사이에 큰 차이가 있습니다. 비밀번호 해싱 알고리즘의 선택, 토큰 저장 방식, 만료 시간 정책 등 모든 결정이 **보안 사고로 이어질 수 있는 민감한 선택**입니다.

이 포스트에서는 인증 시스템의 **내부 동작 원리**와 **실전 보안 모범 사례**를 함께 다룹니다.

## 수업 목표

- **bcrypt**의 내부 동작 원리와 salt round 선택 기준을 이해합니다.
- **JWT의 3가지 구조(Header.Payload.Signature)**와 **서명 알고리즘(HS256/RS256/ES256)**의 차이를 이해합니다.
- **액세스 토큰 + 리프레시 토큰** 이중 구조가 필요한 이유를 이해합니다.
- **세션 기반 인증과 JWT 기반 인증**의 실제 트레이드오프를 비교합니다.
- **인가(Authorization) 미들웨어**로 역할(Role) 기반 접근 제어를 구현합니다.
- SEO/AEO/GEO 최적화된 보안 인증 시스템을 설계하는 방법을 학습합니다.

---

## 비밀번호 해싱 — bcrypt가 동작하는 방식

```bash
npm install bcrypt
```

```javascript
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12; // 2^12 = 4096회 해싱 반복

// 회원가입 — 비밀번호 해싱
async function hashPassword(plainPassword) {
  const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hashedPassword;
}

// 로그인 — 비밀번호 검증
async function verifyPassword(plainPassword, hashedPassword) {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
}

async function register(email, password) {
  const hashedPassword = await hashPassword(password);
  await db.users.insert({ email, password: hashedPassword });
}

async function login(email, password) {
  const user = await db.users.findByEmail(email);
  if (!user) throw new Error('사용자를 찾을 수 없습니다');

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) throw new Error('비밀번호가 일치하지 않습니다');

  return user;
}
```

> **깊이 있는 설명 — bcrypt의 내부 동작과 왜 SHA 계열이 아닌가:**
>
> 많은 초보자가 "SHA-256으로 해시하면 되는 거 아닌가?"라고 생각합니다. 하지만 **SHA 계열은 비밀번호 해싱에 적합하지 않습니다.**
>
> **SHA-256이 비밀번호에 부적합한 이유:**
>
> SHA-256은 **빠르게 설계**되었습니다. GPU를 사용하면 초당 **수십억 회**의 SHA-256 해시를 계산할 수 있습니다. 즉, 공격자가 "123456"과 같은 일반적인 비밀번호를 SHA-256으로 해시해서 원본을 역추적하는 것이 매우 쉽습니다.
>
> **bcrypt가 비밀번호에 적합한 이유:**
>
> bcrypt는 의도적으로 **느리게 설계**되었습니다. 내부적으로:
>
> 1. **Blowfish 암호화 키 스케줄링** — 4KB의 P-배열과 S-박스를 초기화하는 데 계산 비용이 큼
> 2. **반복적 키 확장** — salt round 수에 따라 2^rounds 회 반복
> 3. **128비트 salt** — 매번 다른 salt가 생성되어 동일한 비밀번호라도 다른 해시값이 나옴
>
> salt round가 12일 경우 내부적으로 **4,096회**의 Blowfish 키 확장이 이루어집니다. 이로 인해 GPU를 사용한 병렬 공격이 극도로 비효율적이게 됩니다.

---

### salt round 선택 기준

| Salt Rounds | 내부 반복 횟수 | 해싱 시간 (대략) | GPU 공격 난이도 | 권장 용도 |
|:-----------:|:------------:|:---------------:|:--------------:|----------|
| **8** | 256회 | ~15ms | 쉬움 (테스트 전용) | 개발 환경, 유닛 테스트 |
| **10** | 1,024회 | ~100ms | 보통 | 기본 설정 |
| **12** | 4,096회 | ~400ms | 어려움 | **✅ 프로덕션 권장** |
| **14** | 16,384회 | ~1.5초 | 매우 어려움 | 관리자 계정, 고보안 |
| **16** | 65,536회 | ~6초 | 사실상 불가능 | 너무 느림 (권장하지 않음) |

> **실전 노하우:** 12라운드가 보안과 성능의 최적 균형점입니다. 10라운드는 너무 빠르고(100ms는 GPU 공격에 취약), 14라운드는 UX에 부담(1.5초 대기)입니다. 단, 관리자 계정이나 결제 관련 계정은 14라운드를 사용하는 것이 좋습니다.

---

## JWT — JSON Web Token의 내부 구조

### JWT 3단계 구조

JWT는 **세 부분**으로 구성되며, 각 부분은 Base64URL로 인코딩되어 점(.)으로 연결됩니다:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9          ← Header
.                                               ← 구분자
eyJzdWIiOiJ1c2VyMTIzIiwiaWF0IjoxNTE2MjM5MDIyfQ  ← Payload
.                                               ← 구분자
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c    ← Signature
```

### Header — 어떤 알고리즘을 사용했는가

```javascript
// JWT Header (디코딩된 내용)
{
  "alg": "HS256",   // 서명 알고리즘
  "typ": "JWT"      // 토큰 타입
}
```

> **깊이 있는 설명 — 서명 알고리즘의 차이 (HS256 vs RS256 vs ES256):**
>
> | 알고리즘 | 유형 | 키 | 성능 (서명) | 성능 (검증) | 사용처 |
> |---------|:----:|:--:|:---------:|:---------:|-------|
> | **HS256** | 대칭키 | 비밀키 1개 | 0.01ms | 0.01ms | 단일 서버, 내부 서비스 |
> | **RS256** | 비대칭키 | Private + Public | 0.5ms | 0.02ms | 마이크로서비스, 서드파티 |
> | **ES256** | 비대칭키 (타원곡선) | Private + Public | 0.1ms | 0.05ms | 모바일, IoT (짧은 토큰) |
>
> **HS256**은 같은 키로 서명과 검증을 모두 수행합니다. 구현이 간단하지만, 여러 서비스가 같은 JWT_SECRET을 공유해야 하므로 **키 분산이 어렵습니다.**
>
> **RS256**은 Private Key로 서명하고 Public Key로 검증합니다. 인증 서버만 Private Key를 가지고, 다른 서비스들은 Public Key만 있으면 토큰을 검증할 수 있습니다. **마이크로서비스 아키텍처에 적합합니다.**
>
> **ES256**은 RS256보다 짧은 키 길이로 동등한 보안 수준을 제공합니다. 서명 속도는 빠르지만 검증 속도는 RS256보다 느립니다. **모바일 앱의 배터리/대역폭 최적화에 유리합니다.**

---

### Payload — 토큰이 전달하는 정보

```javascript
// JWT Payload (디코딩된 내용) — 클레임(Claims)이라고 부름
{
  "sub": "user123",        // Subject: 토큰의 주체 (보통 사용자 ID)
  "iat": 1516239022,       // Issued At: 토큰 발급 시간 (Unix timestamp)
  "exp": 1516242622,       // Expiration: 토큰 만료 시간
  "email": "user@email.com", // 사용자 정의 클레임
  "role": "admin"           // 사용자 정의 클레임
}
```

> **코드 분석 — Payload에 포함하면 안 되는 정보:**
>
> JWT의 Payload는 **Base64URL로 인코딩**만 되어 있을 뿐 **암호화되지 않습니다**. 누구나 디코딩해서 내용을 볼 수 있습니다.
>
> ```javascript
> // 누구나 이렇게 디코딩할 수 있음
> const base64UrlPayload = token.split('.')[1];  // 두 번째 부분
> const payload = JSON.parse(atob(base64UrlPayload));
> console.log(payload); // 모든 내용이 그대로 노출됨
> ```
>
> **Payload에 절대 넣으면 안 되는 정보:**
> - ❌ 비밀번호 (평문이든 해시든)
> - ❌ 신용카드 번호
> - ❌ 주민등록번호
> - ❌ 비밀 키/API 키
> - ❌ 개인 식별 정보 (전화번호, 주소)
>
> Payload에는 **사용자 식별자(sub)**와 **권한 정보(role)**만 최소한으로 포함해야 합니다.

---

### JWT 발급 — 액세스 토큰과 리프레시 토큰

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars!!';
const JWT_EXPIRES_IN = '15m';    // 액세스 토큰: 15분
const REFRESH_EXPIRES_IN = '7d'; // 리프레시 토큰: 7일

function generateTokens(user) {
  // 액세스 토큰 (짧은 수명)
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // 리프레시 토큰 (긴 수명)
  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    JWT_SECRET + '_refresh',
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}
```

> **깊이 있는 설명 — 왜 액세스 토큰과 리프레시 토큰을 분리할까?**
>
> **만약 액세스 토큰만 있고 리프레시 토큰이 없다면:**
>
> ```
> 액세스 토큰 만료 시간 = 7일
> → 토큰이 탈취되면 공격자가 7일간 마음대로 사용 가능
>
> 액세스 토큰 만료 시간 = 15분
> → 사용자가 15분마다 로그인해야 함 (UX 최악!)
> ```
>
> **이중 구조의 해결책:**
>
> ```
> 액세스 토큰 (15분):    API 요청에 사용, 짧아서 탈취 피해 최소화
> 리프레시 토큰 (7일):    새 액세스 토큰 발급에만 사용, 서버에서 관리
> ```
>
> 리프레시 토큰은 **서버에서 관리**되므로, 토큰이 탈취된 경우 서버에서 해당 리프레시 토큰을 **블랙리스트**에 등록하여 즉시 무효화할 수 있습니다.
>
> **Refresh Token Rotation (고급 보안):**
> ```
> 1. 사용자가 리프레시 토큰으로 새 액세스 토큰 요청
> 2. 서버가 기존 리프레시 토큰을 검증하고 무효화
> 3. 서버가 새 리프레시 토큰을 발급
> 4. 공격자가 탈취한 리프레시 토큰으로 요청 → 이미 무효화됨 → 차단!
> ```

---

### JWT 검증 미들웨어

```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: '인증 토큰이 필요합니다. Authorization: Bearer <token> 형식으로 보내주세요'
    });
  }

  // Bearer <token> 형식에서 토큰 추출
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: '토큰이 만료되었습니다. 리프레시 토큰으로 새 토큰을 발급받으세요'
      });
    }

    return res.status(403).json({
      error: 'FORBIDDEN',
      message: '유효하지 않은 토큰입니다'
    });
  }
}
```

> **코드 분석 — `jwt.verify()`가 하는 일:**
>
> `jwt.verify(token, secret)`은 다음 3단계를 수행합니다:
>
> 1. **토큰 파싱**: 점(.)으로 분할하여 Header, Payload, Signature 추출
> 2. **서명 검증**: Header의 `alg` 알고리즘으로 `base64(Header).base64(Payload)`를 다시 서명한 결과가 세 번째 부분(Signature)과 일치하는지 확인
> 3. **만료 검증**: Payload의 `exp` 클레임이 현재 시간보다 이후인지 확인
>
> **만약 Header에 `alg: "none"`이 설정되어 있다면?** (보안 취약점)
>
> 과거 일부 JWT 라이브러리는 `alg: "none"`을 허용하는 취약점이 있었습니다. 공격자가 Header를 `{"alg": "none"}`으로 변경하면 서명 검증을 건너뛸 수 있습니다. 현대 라이브러리(2020년 이후)는 이 취약점이 패치되었지만, **항상 최신 버전**을 사용해야 합니다.

---

## 리프레시 토큰으로 새 액세스 토큰 발급

```javascript
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET + '_refresh');

    // DB에서 리프레시 토큰 유효성 확인
    const storedToken = await db.refreshTokens.findByUserId(decoded.sub);
    if (!storedToken || storedToken.token !== refreshToken) {
      throw new Error('유효하지 않은 리프레시 토큰');
    }

    // 기존 리프레시 토큰 무효화 (Rotation)
    await db.refreshTokens.deleteByUserId(decoded.sub);

    // 새 토큰 발급
    const user = await db.users.findById(decoded.sub);
    const newAccessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 새 리프레시 토큰 발급
    const newRefreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      JWT_SECRET + '_refresh',
      { expiresIn: '7d' }
    );

    // 새 리프레시 토큰 저장
    await db.refreshTokens.create(decoded.sub, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    throw new Error('리프레시 토큰이 만료되었거나 유효하지 않습니다');
  }
}
```

> **실전 노하우 — Refresh Token Rotation의 중요성:**
>
> 위 코드에서 주목할 점은 **기존 리프레시 토큰을 무효화(delete)**하고 **새 리프레시 토큰을 발급**하는 부분입니다. 이 패턴을 **Refresh Token Rotation**이라고 하며, **토큰 탈취를 실시간으로 감지**할 수 있게 해줍니다.
>
> ```
> 정상 사용자: 리프레시 → 토큰 A 무효화 → 토큰 B 발급
> 공격자:    (탈취한) 토큰 A로 요청 → 이미 무효화됨 → 차단!
> ```
>
> 만약 Rotation 없이 같은 리프레시 토큰을 계속 사용한다면:
> ```
> 공격자가 토큰 A를 탈취 → 정상 사용자와 공격자 모두 토큰 A로 계속 사용 가능
> → 서버는 누가 진짜인지 구분 불가
> ```

---

## 인가(Authorization) 미들웨어 — 역할 기반 접근 제어

```javascript
// 역할(Role) 기반 인가
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: '인증이 필요합니다' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `'${req.user.role}' 권한으로는 이 작업을 수행할 수 없습니다. 필요 권한: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

// 사용 예
router.get('/admin/users',
  authenticateToken,
  authorize('admin'),
  adminController.getUsers
);

router.patch('/users/:id',
  authenticateToken,
  authorize('admin', 'moderator'),
  userController.updateUser
);
```

> **깊이 있는 설명 — 인증(Authentication)과 인가(Authorization)의 차이:**
>
> 많은 사람이 이 둘을 혼동하지만, **완전히 다른 개념**입니다:
>
> | 개념 | 영어 | 질문 | 담당 미들웨어 |
> |------|------|------|-------------|
> | **인증** | Authentication | "당신은 누구입니까?" | `authenticateToken` |
> | **인가** | Authorization | "당신이 이 작업을 할 자격이 있습니까?" | `authorize('admin')` |
>
> 인증 미들웨어가 먼저 실행되어 사용자를 식별하고(`req.user` 설정), 그 다음 인가 미들웨어가 식별된 사용자가 특정 작업을 수행할 권한이 있는지 확인합니다.

---

## 로그인/회원가입 API — 완전한 구현

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'CONFLICT',
        message: '이미 등록된 이메일입니다'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.users.create({ email, password: hashedPassword, name, role: 'user' });
    const tokens = generateTokens(user);

    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '서버 오류' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }

    // bcrypt.compare는 내부적으로 salt를 추출하여 검증
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // ❌ "비밀번호가 틀렸습니다"라고 구체적으로 알리지 않음 (보안)
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }

    const tokens = generateTokens(user);
    res.json({
      message: '로그인 성공',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '서버 오류' });
  }
});
```

> **실전 노하우 — 로그인 실패 메시지가 "이메일 또는 비밀번호가 올바르지 않습니다"로 통일된 이유:**
>
> ```javascript
// ❌ 이렇게 구체적으로 알리면 안 됨
res.status(401).json({ message: '존재하지 않는 이메일입니다' }); // 공격자에게 "이 이메일은 등록되어 있다/없다" 정보 제공
res.status(401).json({ message: '비밀번호가 틀렸습니다' });     // 공격자에게 "이메일은 맞다" 정보 제공
// ✅ 이렇게 통일해야 안전
res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다' }); // 공격자에게 아무 정보도 제공하지 않음
```
>
> 이는 **정보 누출(Information Disclosure)**을 방지하기 위한 보안 모범 사례입니다. 공격자가 "이 이메일은 등록되어 있다"는 정보만 알아도 **대상을 좁힐 수 있기 때문**입니다.

---

## 세션 기반 인증 (JWT와 비교)

```bash
npm install express-session
```

```javascript
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,        // JavaScript에서 쿠키 접근 불가 (XSS 방지)
    secure: process.env.NODE_ENV === 'production',  // HTTPS 전용
    sameSite: 'strict',    // CSRF 방지
    maxAge: 24 * 60 * 60 * 1000  // 24시간
  }
}));
```

---

## JWT vs 세션 — 상세 비교

| 항목 | JWT (토큰 기반) | 세션 (쿠키 기반) |
|------|---------------|----------------|
| **저장 위치** | 클라이언트 (브라우저/앱) | 서버 (메모리/Redis/DB) |
| **확장성** | ✅ 탁월 (서버가 키만 알면 검증 가능, 공유 저장소 불필요) | ⚠️ Redis 등 공유 세션 저장소 필요 |
| **실시간 해지** | ❌ 어려움 (블랙리스트 도입 필요) | ✅ 즉시 가능 (서버에서 세션 삭제) |
| **모바일 앱** | ✅ 자연스러움 (Authorization 헤더) | ❌ 불편 (쿠키 지원이 제한적) |
| **서버리스** | ✅ 적합 (API Gateway + Lambda) | ❌ 부적합 (상태 유지 필요) |
| **XSS 공격** | ⚠️ localStorage 탈취 위험 | ✅ httpOnly 쿠키로 차단 |
| **CSRF 공격** | ✅ SameSite 쿠키로 방어 불필요 | ⚠️ CSRF 토큰 필요 |
| **트래픽** | 모든 요청에 토큰 포함 (약 1KB) | 세션 ID만 전송 (약 50바이트) |

---

## 보안 모범 사례 요약

```javascript
// 1. Rate Limiting — 무차별 대입 공격 방어
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5,                     // 5회만 허용
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: '너무 많은 로그인 시도. 15분 후 다시 시도하세요.'
  }
});
router.post('/login', loginLimiter, loginHandler);

// 2. HTTPS 강제 (프로덕션)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.hostname}${req.url}`);
    }
    next();
  });
}

// 3. 환경 변수로 비밀 키 관리
require('dotenv').config();
// .env 파일:
// JWT_SECRET=32자이상의-완전히-랜덤한-문자열
// SESSION_SECRET=또다른-랜덤-문자열
```

---

## 자주 묻는 질문

<details>
<summary><strong>JWT를 localStorage에 저장해도 되나요?</strong></summary>

**httpOnly 쿠키에 저장하는 것이 더 안전합니다.** localStorage는 JavaScript로 접근 가능하므로 XSS 공격에 토큰이 탈취될 수 있습니다. 반면 httpOnly 쿠키는 JavaScript에서 접근 자체가 차단됩니다. 다만 CSRF 공격에 취약해지므로 `SameSite=Strict` 옵션을 함께 설정해야 합니다.
</details>

<details>
<summary><strong>액세스 토큰의 만료 시간은 얼마가 적당한가요?</strong></summary>

**15분에서 1시간 사이**가 적당합니다. 너무 짧으면 리프레시 요청이 너무 많아지고, 너무 길면 탈취 시 피해가 커집니다. 리프레시 토큰은 7일에서 30일 사이로 설정하고, 재로그인 없이 자동으로 갱신하는 **Silent Refresh** 패턴을 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>OAuth2와 JWT의 관계는 무엇인가요?</strong></summary>

OAuth2는 **인증 프로토콜**이고, JWT는 **토큰 형식**입니다. OAuth2의 액세스 토큰으로 JWT를 사용할 수 있습니다. 예를 들어 Google OAuth2는 JWT 형식의 ID 토큰을 발급합니다. OAuth2는 "제3자 앱이 사용자 데이터에 접근하는 것"을 허가하는 프로토콜이며, JWT는 그 토큰의 한 형식입니다.
</details>

<details>
<summary><strong>bcrypt 외에 다른 해싱 알고리즘은 무엇이 있나요?</strong></summary>

**argon2**가 bcrypt의 차세대 알고리즘으로 권장됩니다. Argon2는 메모리 사용량도 설정할 수 있어 GPU/ASIC 공격에 더 강력합니다. 다만 Node.js에서는 `argon2` 패키지가 네이티브 빌드가 필요하므로, 일단 bcrypt로 시작하고 필요시 argon2로 마이그레이션하는 것을 권장합니다.
</details>

---

## 요약

- **bcrypt**는 의도적으로 느리게 설계된 비밀번호 해싱 알고리즘입니다. salt round 12가 보안과 성능의 균형점입니다.
- **JWT**는 Header(알고리즘), Payload(데이터), Signature(서명)의 3단계 구조로 구성됩니다.
- **HS256**은 대칭키 방식으로 빠르지만 키 분산이 어렵고, **RS256**은 비대칭키로 마이크로서비스에 적합합니다.
- **액세스 토큰**(15분) + **리프레시 토큰**(7일)의 이중 구조는 보안과 UX를 모두 만족시킵니다.
- **Refresh Token Rotation**은 탈취된 토큰을 실시간으로 무효화하는 중요한 보안 패턴입니다.
- **세션 기반 인증**은 전통적이고 안정적이지만, **JWT 기반 인증**은 서버리스/모바일에 더 적합합니다.
- 로그인 실패 메시지는 항상 "이메일 또는 비밀번호가 올바르지 않습니다"로 통일하여 정보 누출을 방지하세요.
