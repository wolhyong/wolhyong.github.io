---
layout: post
title: "Node.js 테스트와 TDD: Jest, 통합 테스트, E2E"
description: "Node.js 테스트 전략 — Jest의 Mocking 시스템 동작 원리, 유닛/통합/E2E 테스트 비교와 비용 분석, TDD 실전 적용, 커버리지 메트릭 해석, CI/CD 파이프라인 연동"
date: 2022-07-25 10:00:00 +0900
category: nodejs
tags: [nodejs, javascript, testing, jest, tdd, mocking, ci-cd, integration-test, e2e]
level: advanced
---

테스트는 소프트웨어의 안전망입니다. 연구에 따르면 TDD를 적용한 프로젝트는 **버그 발생률이 40~80% 감소**하고, 테스트가 있는 코드는 **리팩토링 비용이 50% 이상 절감**됩니다. 이번 강의에서는 Jest를 중심으로 Node.js 애플리케이션의 체계적인 테스트 전략을 학습합니다.

## 수업 목표

- Jest 테스트 프레임워크의 Mocking 시스템 동작 원리를 이해합니다.
- Mocking과 Stub을 활용하여 의존성을 분리한 테스트를 작성할 수 있습니다.
- 통합 테스트로 데이터베이스와 API를 검증할 수 있습니다.
- TDD(테스트 주도 개발) 사이클을 실제 프로젝트에 적용할 수 있습니다.
- 테스트 커버리지 메트릭을 정확히 해석하고 관리할 수 있습니다.
- CI/CD 파이프라인에 테스트 단계를 최적화하여 연동할 수 있습니다.

## 테스트 피라미드와 비용

테스트에는 **속도와 신뢰도 간의 트레이드오프**가 있습니다.

```
         ┌──────┐
         │ E2E  │    ← 가장 느림, 가장 비쌈, 가장 확실
        ┌┴──────┴┐
        │통합 테스트│  ← 중간 속도, 중간 비용
    ┌───┴────────┴───┐
    │  유닛 테스트    │  ← 가장 빠름, 가장 쌈, 가장 불완전
    └────────────────┘
```

| 테스트 유형 | 실행 속도 (100개 기준) | 작성 비용 | 유지보수 비용 | 발견 가능한 버그 |
|-----------|---------------------|---------|------------|--------------|
| 유닛 테스트 | ~0.5초 | 낮음 | 낮음 | 함수 로직 오류, 엣지 케이스 |
| 통합 테스트 | ~10초 | 중간 | 중간 | 모듈 간 인터페이스 오류, DB 스키마 불일치 |
| E2E 테스트 | ~300초 (5분) | 높음 | 높음 | 전체 시스템 흐름 오류, 환경 설정 문제 |

**권장 비율:** 유닛 60% / 통합 25% / E2E 10% + 수동 탐색 5%

**테스트가 없을 때 리팩토링 비용:**
```
기능 추가 시간 = 구현 1시간 + 회귀 테스트(수동) 3시간 = 4시간
→ 테스트가 있으면: 구현 1시간 + 자동 테스트 0.1초 = 1시간
→ 시간 절감: 75%
```

## Jest 테스트 프레임워크

### 설치 및 설정

```bash
npm install --save-dev jest supertest @types/jest
```

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/app.js"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### 기본 테스트 구조

```javascript
// math.js
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
function multiply(a, b) { return a * b; }
function divide(a, b) {
  if (b === 0) throw new Error('0으로 나눌 수 없습니다');
  return a / b;
}

module.exports = { add, subtract, multiply, divide };

// math.test.js
const { add, subtract, multiply, divide } = require('./math');

describe('Math 함수 테스트', () => {
  describe('add()', () => {
    test('두 양수 더하기', () => {
      expect(add(2, 3)).toBe(5);
    });

    test('음수 더하기', () => {
      expect(add(-1, -1)).toBe(-2);
    });

    test('소수 더하기 — 부동소수점 오차 처리', () => {
      // ❌ expect(0.1 + 0.2).toBe(0.3);  // 실패! (0.30000000000000004)
      // ✅ toBeCloseTo 사용
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('divide()', () => {
    test('정상 나눗셈', () => {
      expect(divide(10, 2)).toBe(5);
    });

    test('0으로 나누기 에러', () => {
      expect(() => divide(10, 0)).toThrow('0으로 나눌 수 없습니다');
    });
  });
});
```

## Mocking 시스템 — Jest의 Mock 동작 원리

Jest의 Mock은 **모듈 시스템을 후킹하여 원래 함수를 가짜 함수로 교체**합니다. `jest.mock('axios')`를 호출하면 Jest가 `require('axios')`가 반환하는 모든 함수를 자동 Mock으로 대체합니다.

```javascript
// ❌ 외부 API 호출 — 테스트 시 실제로 네트워크 요청 발생
const axios = require('axios');

async function getWeather(city) {
  const response = await axios.get(
    `https://api.weather.com/v1/${city}`
  );
  return response.data;
}

// ✅ Mock으로 대체 — 네트워크 요청 없이 즉시 응답
jest.mock('axios');

test('날씨 API 호출 테스트', async () => {
  const mockData = { temperature: 25, humidity: 60 };
  axios.get.mockResolvedValue({ data: mockData });

  const result = await getWeather('Seoul');
  expect(result).toEqual(mockData);
  expect(axios.get).toHaveBeenCalledWith(
    'https://api.weather.com/v1/Seoul'
  );
});
```

**Mock이 실제로 하는 일:**
```
1. jest.mock('axios') 호출 시점:
   - Jest가 axios 모듈의 모든 export 함수를 jest.fn()으로 교체
   - axios.get → 빈 Mock 함수 (호출되면 undefined 반환)

2. axios.get.mockResolvedValue({ data: mockData }):
   - Mock 함수가 Promise.resolve({ data: mockData })를 반환하도록 설정
   - 실제 네트워크 요청 없이 즉시 응답

3. expect(axios.get).toHaveBeenCalledWith(...):
   - Mock 함수는 자신이 어떻게 호출되었는지 기록
   - 인자, 호출 횟수, this 바인딩 등을 검증 가능
```

### Spy를 활용한 검증

Spy는 원래 함수를 유지하면서 호출 정보만 기록합니다. Mock과 달리 **실제 구현이 그대로 실행**되며, 호출 여부와 인자만 감시합니다.

```javascript
const logger = require('../utils/logger');
const emailService = require('../services/email');

describe('알림 서비스', () => {
  let loggerSpy;
  let emailMock;

  beforeEach(() => {
    // Spy: 원래 함수는 실행되지만 호출 정보 기록
    loggerSpy = jest.spyOn(logger, 'info').mockImplementation();
    // Mock: 함수 자체를 대체
    emailMock = jest.spyOn(emailService, 'sendEmail')
      .mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();  // 모든 Mock/Spy를 원래대로 복원
  });

  test('알림 발송 성공 시 로깅', async () => {
    await sendNotification('user@test.com', '환영합니다!');

    expect(emailMock).toHaveBeenCalledWith({
      to: 'user@test.com',
      subject: '환영합니다!',
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('알림 발송 성공')
    );
  });
});
```

**Mock vs Spy 선택 기준:**

| 상황 | 선택 | 이유 |
|------|------|------|
| 외부 API/DB 호출 방지 | Mock | 실제 호출을 아예 차단 |
| 함수가 호출되었는지만 확인 | Spy | 원래 동작 유지 + 감시 |
| 특정 값 반환 강제 | Mock | `mockReturnValue`로 제어 |
| 로깅 확인 (부수 효과) | Spy | 실제 로깅을 막고 호출만 확인 |
| 타이머 제어 | jest.useFakeTimers() | setTimeout/setInterval 가속 |

### Timer Mock으로 시간 단축

비동기 타이머가 있는 코드를 테스트할 때, 실제 시간을 기다리면 테스트가 매우 느려집니다.

```javascript
// ❌ 실제 시간 대기 — 5초 걸림
test('5초 후 메시지 전송', async () => {
  const result = await sendDelayedMessage('Hello', 5000);
  expect(result).toBe('Message sent');
});

// ✅ Fake Timer — 0.1초로 단축
jest.useFakeTimers();

test('5초 후 메시지 전송 (가상 시간)', async () => {
  const promise = sendDelayedMessage('Hello', 5000);

  // 5초를 즉시 진행 (가상 시간)
  jest.advanceTimersByTime(5000);

  const result = await promise;
  expect(result).toBe('Message sent');
});

// 사용 후 실제 타이머 복원
afterAll(() => {
  jest.useRealTimers();
});
```

## 통합 테스트

### 데이터베이스 통합 테스트 — 인메모리 MongoDB

MongoMemoryServer는 실제 MongoDB 바이너리를 다운로드하여 인메모리로 실행합니다. 테스트 간 데이터 격리가 완벽하고, 외부 DB가 필요 없습니다.

```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// 각 테스트 전 데이터 초기화
beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

describe('User Model 통합 테스트', () => {
  test('사용자 생성 및 조회', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
    };

    const user = await User.create(userData);
    expect(user.username).toBe('testuser');

    const found = await User.findOne({ email: 'test@example.com' });
    expect(found).toBeTruthy();
    expect(found.username).toBe('testuser');
  });

  test('중복 이메일 — 유니크 제약 조건', async () => {
    await User.create({
      username: 'user1',
      email: 'duplicate@test.com',
    });

    await expect(User.create({
      username: 'user2',
      email: 'duplicate@test.com',
    })).rejects.toThrow();  // MongoDB duplicate key error
  });
});
```

### API 통합 테스트 (Supertest)

Supertest는 Express 앱을 실제 HTTP 서버 없이 인메모리로 실행하여 요청을 보냅니다. 따라서 포트 충돌이나 서버 시작/종료가 필요 없습니다.

```javascript
const request = require('supertest');
const app = require('../app');

describe('User API 통합 테스트', () => {
  describe('POST /api/users', () => {
    test('사용자 생성 성공 — 201 응답', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'Password123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('newuser');
      expect(response.body).not.toHaveProperty('password'); // 비밀번호 미노출
    });

    test('필수 필드 누락 — 400 에러', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ username: 'test' })  // email, password 없음
        .expect(400);

      expect(response.body.error).toContain('이메일');
    });

    test('유효하지 않은 이메일 — 400 에러', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'not-an-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.error).toContain('유효한 이메일');
    });
  });
});
```

## TDD (테스트 주도 개발)

### TDD가 실제 프로젝트에 미치는 영향

| 지표 | TDD 미적용 | TDD 적용 | 개선 효과 |
|------|-----------|---------|---------|
| 프로덕션 버그 밀도 | 100% (기준) | 40~80% 감소 | 2~5배 품질 향상 |
| 초기 개발 속도 | 빠름 (느낌) | 느림 (느낌) | 장기 20~40% 빠름 |
| 리팩토링 자신감 | 낮음 | 높음 | 기술 부채 관리 가능 |
| 코드 문서화 수준 | 낮음 | 높음 (테스트=문서) | 유지보수 비용 절감 |
| 디버깅 시간 | 전체 시간의 50% | 전체 시간의 20% | 2.5배 단축 |

### TDD 사이클 (Red-Green-Refactor)

```
1. RED:  실패하는 테스트를 먼저 작성 ← 설계를 강제
2. GREEN: 테스트를 통과하는 최소한의 코드 작성 ← 구현
3. REFACTOR: 코드 리팩토링 (테스트는 계속 통과) ← 품질 개선
```

### TDD 실습 예제 — TodoService

```javascript
// STEP 1: RED — 실패하는 테스트 작성
// 이 단계에서 인터페이스(함수 이름, 파라미터, 반환값)를 먼저 설계합니다.
// todo-service.test.js
describe('TodoService', () => {
  describe('createTodo()', () => {
    test('할일 생성 성공 — id, title, completed 반환', async () => {
      const result = await todoService.createTodo({
        title: '테스트 작성하기',
        userId: 'user1',
      });

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('테스트 작성하기');
      expect(result.completed).toBe(false);
    });

    test('제목이 없는 경우 에러 발생', async () => {
      await expect(
        todoService.createTodo({ userId: 'user1' })
      ).rejects.toThrow('제목은 필수입니다');
    });
  });

  describe('getTodos()', () => {
    test('사용자의 할일 목록을 최신순으로 조회', async () => {
      await todoService.createTodo({ title: '할일1', userId: 'user1' });
      await todoService.createTodo({ title: '할일2', userId: 'user1' });

      const todos = await todoService.getTodos('user1');
      expect(todos).toHaveLength(2);
      expect(todos[0].title).toBe('할일2');  // 최신순 정렬
    });

    test('타 사용자의 할일은 조회되지 않음', async () => {
      await todoService.createTodo({ title: 'user1 할일', userId: 'user1' });
      await todoService.createTodo({ title: 'user2 할일', userId: 'user2' });

      const todos = await todoService.getTodos('user1');
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('user1 할일');
    });
  });
});

// STEP 2: GREEN — 테스트를 통과하는 최소한의 코드
// todo-service.js
class TodoService {
  constructor(TodoModel) {
    this.Todo = TodoModel;
  }

  async createTodo({ title, userId }) {
    if (!title) throw new Error('제목은 필수입니다');
    return this.Todo.create({ title, userId, completed: false });
  }

  async getTodos(userId) {
    return this.Todo.find({ userId }).sort({ createdAt: -1 });
  }

  async completeTodo(id) {
    return this.Todo.findByIdAndUpdate(
      id,
      { completed: true, completedAt: new Date() },
      { new: true }
    );
  }
}

// STEP 3: REFACTOR — 중복 제거, 검증 추가, 성능 개선
// 테스트는 그대로 통과하면서 코드 품질만 개선
class TodoServiceRefactored {
  constructor(TodoModel) {
    if (!TodoModel) throw new Error('TodoModel is required');
    this.Todo = TodoModel;
  }

  _validateCreateTodo({ title, userId }) {
    if (!title?.trim()) throw new Error('제목은 필수입니다');
    if (!userId) throw new Error('사용자 ID는 필수입니다');
  }

  async createTodo(data) {
    this._validateCreateTodo(data);
    return this.Todo.create({
      title: data.title.trim(),
      userId: data.userId,
      completed: false,
    });
  }

  async getTodos(userId, options = {}) {
    const { limit = 50, skip = 0 } = options;
    return this.Todo.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }
}
```

## 테스트 커버리지 — 메트릭 해석

```bash
# 커버리지 측정
npx jest --coverage
```

**커버리지 리포트 해석:**

```
--------------------|---------|---------|---------|---------|-----------
File                | % Stmts | % Branch| % Funcs | % Lines | Uncovered Line #
--------------------|---------|---------|---------|---------|-----------
All files           |   92.3% |   85.7% |   95.1% |   92.3% |
 src/services/      |   95.2% |   88.9% |  100.0% |   95.2% |
  todo-service.js   |   95.2% |   88.9% |  100.0% |   95.2% | 42,58
 src/utils/         |   85.7% |   75.0% |   85.7% |   85.7% |
  validator.js      |   85.7% |   75.0% |   85.7% |   85.7% | 15,23
 src/middleware/     |   80.0% |   66.7% |   80.0% |   80.0% |
  auth.js           |   80.0% |   66.7% |   80.0% |   80.0% | 12,18
--------------------|---------|---------|---------|---------|-----------
```

**각 메트릭이 의미하는 것:**
- **% Stmts(Statements):** 실행된 전체 명령문의 비율 (92.3% → 100개 중 약 8개가 테스트되지 않음)
- **% Branch(Branches):** if/else, switch 등 분기 처리 비율 (85.7% → 조건문의 14%가 미검증)
- **% Funcs(Functions):** 호출된 함수의 비율 (95.1% → 함수 대부분 테스트됨, 5% 미달)
- **% Lines:** 실행된 코드 라인 비율 (Statements와 유사)

**주의할 점:** 커버리지 100%가 완벽한 테스트를 의미하지는 않습니다. 예를 들어 `if (x > 0)` 조건에 대해 `x = 1`만 테스트하면 라인 커버리지는 100%지만, `x = 0` (false 분기)는 테스트되지 않았습니다. **Branch 커버리지**를 함께 봐야 합니다.

## CI/CD 파이프라인 테스트 최적화

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    # 통합 테스트용 MongoDB 서비스
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017

    steps:
    - uses: actions/checkout@v3

    - name: Node.js 설정
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: 의존성 설치
      run: npm ci  # npm install보다 빠르고 재현 가능

    - name: 린트 검사
      run: npm run lint

    - name: 유닛 테스트 (현재 변경사항만)
      run: npx jest --changedSince=main --ci --coverage
      # --changedSince: main 브랜치 이후 변경된 파일의 테스트만 실행
      # 일반: ~2분, changedSince: ~10초

    - name: 통합 테스트 (전체)
      run: npx jest --testPathPattern=integration --ci
      env:
        MONGODB_URI: mongodb://localhost:27017/test

    - name: 커버리지 업로드
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        fail_ci_if_error: true
```

**CI 테스트 시간 최적화 전략:**

| 전략 | 효과 | 구현 |
|------|------|------|
| --changedSince 사용 | 80% 시간 단축 | 변경 파일만 테스트 |
| 테스트 분할 실행 | 50% 시간 단축 | 유닛/통합/E2E를 병렬 job으로 분리 |
| 캐싱 | 30% 시간 단축 | node_modules, Jest 캐시 |
| --maxWorkers=N | 코어 수에 따라 최적화 | CI 환경에 맞게 조정 |

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>유닛 테스트와 통합 테스트의 차이는 무엇인가요?</strong></summary>

유닛 테스트는 개별 함수나 모듈을 **독립적으로** 테스트합니다. 외부 의존성(DB, API)은 Mock으로 대체하므로 속도가 빠릅니다. 통합 테스트는 여러 모듈이 **함께 동작**하는 것을 테스트하며, 실제 DB를 사용하지만 MongoDB 인메모리 등 격리된 환경에서 실행합니다. 유닛 테스트는 구현 세부사항을 검증하고, 통합 테스트는 인터페이스 계약을 검증합니다.
</details>

<details>
<summary><strong>TDD를 모든 프로젝트에 적용해야 하나요?</strong></summary>

TDD는 방법론일 뿐, 모든 상황에 필수는 아닙니다. 복잡한 비즈니스 로직, 협업이 필요한 프로젝트, 유지보수가 중요한 라이브러리에는 강력 추천합니다. 반면 프로토타입, 단순 CRUD, 1회성 스크립트에는 TDD가 오버헤드일 수 있습니다. 핵심은 **위험도가 높은 코드부터 테스트를 작성**하는 것입니다.
</details>

<details>
<summary><strong>커버리지 80%면 충분한가요?</strong></summary>

80%는 좋은 시작점이지만, **어떤 코드가 테스트되지 않았는지**가 더 중요합니다. 핵심 비즈니스 로직(결제, 인증, 데이터 무결성)은 100%를 목표로 하고, 보일러플레이트(설정, 라우팅)는 80%로 충분합니다. 또한 단순 커버리지 %보다 **테스트의 질** — 엣지 케이스, 에러 케이스, 경쟁 조건을 포함하는지 — 가 더 중요합니다.
</details>

## 요약

- **테스트 피라미드** — 유닛 60% / 통합 25% / E2E 10%, 속도와 비용의 균형
- **Mocking 원리** — jest.mock()이 모듈 시스템을 후킹하여 함수 교체
- **Mock vs Spy** — Mock(함수 자체 대체) vs Spy(원래 함수 유지 + 감시)
- **통합 테스트** — MongoMemoryServer(인메모리 DB) + Supertest(인메모리 HTTP)
- **TDD** — Red(실패 테스트) → Green(최소 구현) → Refactor(개선), 버그 40~80% 감소
- **커버리지 메트릭** — Stmts/Branch/Funcs/Lines 모두 확인, Branch가 가장 중요
- **CI 최적화** — --changedSince + 병렬 job 분할로 테스트 시간 80% 단축
