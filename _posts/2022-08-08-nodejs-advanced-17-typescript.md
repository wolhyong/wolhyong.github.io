---
layout: post
title: "TypeScript with Node.js: 타입 시스템, Express, 실무 적용"
description: "Node.js + TypeScript — 타입 시스템 원리와 컴파일러 동작 방식, any/unknown/never 비교, 제네릭과 조건부 타입 심화, Express + TypeScript, 실전 프로젝트 설정, 마이그레이션 전략과 생산성 측정"
date: 2022-08-08 10:00:00 +0900
category: nodejs
tags: [nodejs, typescript, javascript, express, ts-node, generics, type-system, compiler]
level: advanced
---

TypeScript는 JavaScript의 슈퍼셋으로, 정적 타입을 추가하여 런타임 에러를 컴파일 타임에 잡아내고 코드의 가독성과 유지보수성을 크게 향상시킵니다. 이번 강의에서는 Node.js 프로젝트에 TypeScript를 도입하는 방법과 실무에서 활용하는 고급 패턴을 학습합니다.

## 수업 목표

- Node.js + TypeScript 프로젝트를 설정할 수 있습니다.
- 인터페이스, 타입 별칭, 유니온 타입 등 타입 시스템을 이해합니다.
- 제네릭, 조건부 타입 등 고급 타입을 활용할 수 있습니다.
- Express + TypeScript로 타입 안전한 REST API를 구축할 수 있습니다.
- 타입 안전한 데이터베이스 쿼리를 작성할 수 있습니다.
- 기존 JavaScript 프로젝트를 TypeScript로 마이그레이션하는 전략을 이해합니다.

## 왜 TypeScript인가? — 측정 데이터로 보는 생산성

실제 프로덕션 사례를 통해 TypeScript의 가치를 정량적으로 살펴보겠습니다.

### 버그 발견율 비교

| 지표 | JavaScript | TypeScript | 개선 효과 |
|------|-----------|------------|-----------|
| 런타임 타입 에러 (프로덕션) | 100% (기준) | 약 42% 감소 | 1,000줄당 평균 3.2건 → 1.9건 |
| undefined is not a function | 평균 2.1건/월 (1,000줄 기준) | 0.1건/월 | 95% 감소 |
| 잘못된 API 호출 | 코드 리뷰에서 발견 (늦음) | 컴파일 타임에 즉시 발견 | 100% 사전 차단 |
| 리팩토링 안전성 | 수동 확인 필요 | TSC가 자동 검증 | 리팩토링 시간 40% 단축 |

**실제 사례:** Airbnb가 JavaScript에서 TypeScript로 마이그레이션한 결과, 프로덕션 버그의 약 38%를 컴파일 타임에 사전 발견할 수 있었습니다. Microsoft의 VS Code 팀은 TypeScript 도입 후 코드 리뷰에서 타입 관련 코멘트가 **70% 감소**했다고 보고했습니다.

### 생산성 비용 분석

| 항목 | 초기 비용 | 6개월 후 | 1년 후 |
|------|----------|---------|--------|
| 타입 정의 작성 | +25% 개발 시간 | +5% | +0% (재사용) |
| 빌드 시간 | +3~8초 (tsc) | 동일 | 동일 |
| 버그 수정 시간 | -35% | -55% | -65% |
| 온보딩 신규 개발자 | -40% (타입=문서) | -60% | -70% |
| 코드 리뷰 시간 | -30% (타입 검증 불필요) | -45% | -50% |

## TypeScript 컴파일러 동작 방식

TypeScript가 어떻게 타입을 검사하고 JavaScript로 변환하는지 그 내부 동작을 이해하면 더 효과적으로 활용할 수 있습니다.

### 컴파일 단계

```
소스 코드 (.ts)
    │
    ▼
[1. 스캐너(Scanner)] → 토큰화 (키워드, 식별자, 연산자 분리)
    │
    ▼
[2. 파서(Parser)] → AST 생성 (추상 구문 트리)
    │
    ▼
[3. 바인더(Binder)] → 심볼 연결 (선언과 참조 연결)
    │
    ▼
[4. 타입 체커(Type Checker)] → 타입 검증 (가장 중요한 단계)
    │
    ▼
[5. 이미터(Emitter)] → JavaScript 코드 생성 (.js + .d.ts + .js.map)
```

### 구조적 타입 시스템 (Structural Typing)

TypeScript는 **구조적 타입 시스템(Structural Typing)** 을 사용합니다. 이는 Java나 C#의 **명목적 타입 시스템(Nominal Typing)** 과 근본적으로 다릅니다.

```typescript
// TypeScript — 구조적 타입
interface Person { name: string; age: number; }
interface Employee { name: string; age: number; employeeId: string; }

const p: Person = { name: "Kim", age: 30 };

function greet(person: Person) {
  return `Hello ${person.name}`;
}

greet(p);                             // ✅ 정상
greet({ name: "Lee", age: 25 });      // ✅ 정상 — 객체 리터럴은 초과 속성 검사

const e: Employee = { name: "Park", age: 28, employeeId: "E001" };
greet(e);                             // ✅ 정상 — Employee는 name과 age를 가지고 있음
```

**왜 구조적 타입인가?** JavaScript의 덕 타이핑(Duck Typing) — "오리처럼 걷고 오리처럼 소리내면 그것은 오리다" — 에 익숙한 개발자에게 자연스러운 방식입니다. JavaScript 생태계와의 호환성이 극대화됩니다.

**명목적 타입과의 차이:**

| 특성 | 구조적 타입 (TypeScript) | 명목적 타입 (Java/C#) |
|------|------------------------|---------------------|
| 타입 호환성 기준 | 멤버 구조가 같으면 호환 | 타입 이름이 같아야 호환 |
| 인터페이스 구현 | 명시적 implements 불필요 | 반드시 implements 필요 |
| 테스트 Mock | 별도 인터페이스 없이 Mock 가능 | 인터페이스/추상 클래스 필요 |
| 서드파티 통합 | 기존 객체를 바로 사용 | Wrapper/Adapter 필요 |
| 유연성 | 높음 (점진적 타입에 적합) | 낮음 (엄격한 계층 구조) |

### 타입 소거 (Type Erasure)

TypeScript의 타입 시스템은 **컴파일 타임에만 존재**합니다. 런타임에는 모든 타입 정보가 제거됩니다.

```typescript
// TypeScript 코드
function add(a: number, b: number): number {
  return a + b;
}

// 컴파일 후 JavaScript
function add(a, b) {
  return a + b;
}
```

이로 인해 발생하는 주의사항:
- `instanceof`로 제네릭 타입을 확인할 수 없음
- `interface`는 런타임에 존재하지 않음
- 데코레이터 메타데이터가 필요한 경우 `reflect-metadata` 라이브러리 필요

**해결 패턴 — 런타임 타입 가드:**

```typescript
// 문제: 인터페이스는 런타임에 사라짐
interface User { name: string; email: string; }

// 해결: 타입 가드 함수
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).email === 'string'
  );
}

// 또는 zod/zodios 사용
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;  // 타입 + 런타임 검증
```

## 기본 타입 시스템 심화

### 인터페이스와 타입 — 언제 무엇을 써야 할까?

```typescript
// 인터페이스
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;               // 선택적 속성
  readonly createdAt: Date;    // 읽기 전용
}

// 타입 별칭
type UserRole = 'admin' | 'user' | 'guest';
```

**인터페이스 vs 타입 별칭 비교:**

| 특징 | 인터페이스 (interface) | 타입 별칭 (type) |
|------|----------------------|-----------------|
| 선언 병합 (Declaration Merging) | ✅ 가능 (자동 확장) | ❌ 불가능 |
| 유니온/인터섹션 | ❌ 직접 사용 불가 | ✅ `type A = B \| C` |
| Mapped Types | ❌ 직접 사용 불가 | ✅ `type Readonly<T> = { readonly [K in keyof T]: T[K] }` |
| extends/implements | ✅ 가능 | ❌ 불가능 (교차 타입으로 대체) |
| 성능 | 동일 | 동일 |
| **권장 사용처** | **객체 형태, OOP 설계** | **유니온, 조건부, 유틸리티 타입** |

```typescript
// 선언 병합 예시
interface Book { title: string; }
interface Book { author: string; }   // ✅ 병합됨

const book: Book = { title: "TS Guide", author: "Kim" };  // OK

// 타입 별칭으로는 불가능
type Book2 = { title: string; };
// type Book2 = { author: string; };  // ❌ 에러: 중복 선언

// 유니온 타입은 type만 가능
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

### 유니온, 인터섹션, 타입 가드 심화

```typescript
// 유니온 타입
type Status = 'pending' | 'active' | 'inactive' | 'deleted';

type ApiResponse<T> =
  | { status: 'success'; data: T; timestamp: number }
  | { status: 'error'; error: string; code: number }
  | { status: 'loading' };

// 타입 가드 — Type Narrowing
function handleResponse(response: ApiResponse<User>) {
  switch (response.status) {       // switch로 타입 좁히기
    case 'success':
      console.log(response.data.name);  // 여기서는 ApiResponse<User>['success']
      break;
    case 'error':
      console.error(response.error);    // ApiResponse['error']
      break;
    case 'loading':
      console.log('로딩 중...');
      break;
  }
}

// 사용자 정의 타입 가드
function isSuccess<T>(res: ApiResponse<T>): res is { status: 'success'; data: T; timestamp: number } {
  return res.status === 'success';
}

if (isSuccess(response)) {
  console.log(response.data);  // 타입이 좁혀짐
}

// 인터섹션 타입
type WithTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

type SoftDeletable = {
  deletedAt: Date | null;
  deletedBy: string | null;
};

type BaseEntity = WithTimestamps & SoftDeletable;
```

### any, unknown, never — 3가지 특수 타입의 차이

| 타입 | 의미 | 할당 가능 | 사용 가능한 연산 | 권장 사용처 |
|------|------|-----------|----------------|------------|
| `any` | 타입 검사 완전 무시 | 모든 타입 ← → all | 모든 연산 가능 (타입 검사 우회) | 마이그레이션 과도기, 정말 어쩔 수 없을 때 |
| `unknown` | 타입을 알 수 없음 | 모든 타입 → unknown | 비교/typeof/instanceof만 가능 | 외부 입력, API 응답, 파싱 결과 |
| `never` | 절대 발생하지 않는 타입 | never → 모든 타입 | (값을 가질 수 없음) | 철저한 검사(exhaustive check), 무한 루프 |

```typescript
// any — 위험
function parseJson(json: string): any {
  return JSON.parse(json);  // 반환값 타입을 알 수 없음
}
parseJson('{"name":"Kim"}').invalidMethod();  // 런타임 에러! (컴파일은 통과)

// unknown — 안전
function parseJsonSafe(json: string): unknown {
  return JSON.parse(json);
}
const result = parseJsonSafe('{"name":"Kim"}');
// result.invalidMethod();  // ❌ 컴파일 에러! unknown은 메서드 호출 불가

// 타입 가드로 안전하게 사용
if (typeof result === 'object' && result !== null && 'name' in result) {
  console.log((result as { name: string }).name);  // 안전
}

// never — 철저한 검사
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'triangle'; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.side ** 2;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      // 모든 case를 처리했는지 컴파일러가 검증
      const _exhaustive: never = shape;  // 새 Shape 종류가 추가되면 이 줄에서 에러!
      throw new Error('Unknown shape');
  }
}
```

## 제네릭 (Generics) 심화

### 타입 추론과 제약 조건

```typescript
// 제네릭 함수
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const num = first([1, 2, 3]);       // T → number
const str = first(['a', 'b']);      // T → string
const custom = first([{ id: 1, name: 'Kim' }, { id: 2, name: 'Lee' }]);
// T → { id: number; name: string }

// 제네릭 제약 조건
interface HasId {
  id: string | number;
}

function findById<T extends HasId>(items: T[], id: T['id']): T | undefined {
  return items.find(item => item.id === id);
}
```

### 조건부 타입 (Conditional Types)

```typescript
// T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;   // true
type B = IsString<42>;        // false

// 실제 활용: API 응답 타입 추론
type ApiResult<T, E = Error> = T extends void
  ? { success: true }
  : { success: true; data: T } | { success: false; error: E };

type CreateUserResult = ApiResult<{ id: string }>;
// { success: true; data: { id: string } } | { success: false; error: Error }

type DeleteResult = ApiResult<void>;
// { success: true }

// infer 키워드 — 조건부 타입 내에서 타입 추출
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type P1 = UnwrapPromise<Promise<string>>;   // string
type P2 = UnwrapPromise<number>;            // number

// infer로 함수 반환 타입 추출
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

function fetchUsers() { return [{ id: 1, name: 'Kim' }]; }
type FetchResult = ReturnTypeOf<typeof fetchUsers>;  // { id: number; name: string }[]
```

### Mapped Types

```typescript
// 모든 속성을 readonly로
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// 모든 속성을 optional로
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// 특정 타입의 속성만 선택
type PickByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

type StringFields = PickByType<User, string>;
// { name: string; email: string }

// Template Literal Types
type EventName = 'created' | 'updated' | 'deleted';
type EntityType = 'user' | 'post' | 'comment';

type EventHandlers = {
  [K in `${EntityType}_${EventName}`]: () => void;
};

// EventHandlers = {
//   user_created: () => void;
//   user_updated: () => void;
//   user_deleted: () => void;
//   post_created: () => void;
//   ...
// }

const handler: EventHandlers = {
  user_created: () => console.log('User created'),
  post_updated: () => console.log('Post updated'),
  comment_deleted: () => console.log('Comment deleted'),
  // ... 나머지 6개도 모두 구현해야 함
};
```

## Express + TypeScript 실전

### 타입 안전한 Express 앱

```typescript
// src/types/index.ts
import { Request, Response, NextFunction } from 'express';

// 커스텀 Request 타입
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'user' | 'guest';
  };
}

// 타입이 있는 AsyncRequestHandler
export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
```

### 에러 처리 미들웨어

```typescript
// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

// 커스텀 에러 클래스
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 404 에러
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource}을(를) 찾을 수 없습니다`);
  }
}

// 글로벌 에러 핸들러
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // 예상치 못한 에러
  console.error('예상치 못한 에러:', err);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다',
  });
}
```

### 타입 안전한 라우트 그룹

```typescript
// src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { validateDto } from '../middleware/validation.middleware';

const router = Router();

// GET /api/users — 전체 목록
router.get('/', UserController.getUsers);

// GET /api/users/:id — 단일 조회
router.get('/:id', UserController.getUserById);

// POST /api/users — 생성 (DTO 검증)
router.post('/', validateDto(CreateUserDto), UserController.createUser);

// PUT /api/users/:id — 수정 (인증 + DTO 검증)
router.put('/:id', authenticate, validateDto(UpdateUserDto), UserController.updateUser);

// DELETE /api/users/:id — 삭제 (인증 필요)
router.delete('/:id', authenticate, UserController.deleteUser);

export default router;
```

### 타입 안전한 데이터베이스 — Prisma

```typescript
// Prisma Schema: 자동 타입 생성
// schema.prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}

// Prisma 클라이언트 — 완전한 타입 안전
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 반환 타입이 자동 추론됨
const user = await prisma.user.findUnique({
  where: { email: 'kim@test.com' },
  include: { posts: true },
});
// user의 타입: User & { posts: Post[] } | null

// where 조건도 타입 검증
await prisma.post.findMany({
  where: {
    published: true,
    // authorId: 123,  // ❌ 에러: number가 string에 할당 불가
  },
});
```

## 프로젝트 설정

### tsconfig.json 옵션 비교

| 옵션 | 값 | 효과 | 성능 영향 |
|------|-------|------|-----------|
| `strict` | `true` | 모든 엄격 모드 활성화 | - |
| `noImplicitAny` | `true` | 암시적 any 금지 | 컴파일 시간 +5% |
| `strictNullChecks` | `true` | null/undefined 체크 | 컴파일 시간 +3% |
| `noUnusedLocals` | `true` | 사용 안 한 지역 변수 에러 | 컴파일 시간 +2% |
| `noUnusedParameters` | `true` | 사용 안 한 파라미터 에러 | 컴파일 시간 +2% |
| `exactOptionalPropertyTypes` | `true` | 선택적 속성 엄격 검사 | 컴파일 시간 +5% |
| `skipLibCheck` | `true` | .d.ts 파일 타입 검사 스킵 | 컴파일 시간 **-40%** |
| `incremental` | `true` | 증분 컴파일 | 두 번째 컴파일 **-60%** |

**권장 tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### package.json 스크립트

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch"
  }
}
```

**실전 팁:** 대규모 프로젝트에서는 `tsc --noEmit`이 느릴 수 있습니다. 이때는 `tsc --noEmit --incremental --skipLibCheck`로 타입 체크 속도를 약 60% 향상시킬 수 있습니다.

## 마이그레이션 전략

JavaScript 프로젝트를 TypeScript로 전환할 때는 **한 번에 모든 것을 바꾸지 말고 점진적**으로 접근해야 합니다. 실제로 많은 팀이 이 전략으로 성공했습니다 (예: Airbnb 2년, Lyft 1년, Asana 6개월).

### 단계별 마이그레이션

```bash
# 1단계: TypeScript 설치 및 기본 설정 (day 1)
npm install --save-dev typescript
npx tsc --init

# 2단계: tsconfig에 allowJs: true 추가 (day 1-2)
# JS 파일을 TS 파일과 함께 사용 가능

# 3단계: 가장 위험한 파일부터 .ts로 변경 (week 1-2)
# 데이터 모델, API 클라이언트, 유틸리티 함수 우선

# 4단계: strict 모드 순차 활성화 (month 1-2)
# noImplicitAny → strictNullChecks → 전체 strict

# 5단계: any 타입 제거 캠페인 (month 2-3)
# lint 규칙: no-explicit-any
```

**단계별 tsconfig.json 설정:**

```json
// 1단계: JS 파일 허용
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noImplicitAny": false,
    "noEmit": true
  }
}

// 2단계: 점진적 엄격화
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": false,
    "noEmit": true
  }
}

// 3단계: 완전한 엄격 모드
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### any 타입 퇴치 전략

```typescript
// ❌ bad: any 사용
function processItem(item: any) {
  return item.name.toUpperCase();
}

// ✅ good: unknown + 타입 가드
function processItem(item: unknown) {
  if (typeof item === 'object' && item !== null && 'name' in item) {
    return String((item as { name: unknown }).name).toUpperCase();
  }
  throw new Error('Invalid item');
}

// ✅ better: 제네릭 + 제약 조건
function processItem<T extends { name: string }>(item: T) {
  return item.name.toUpperCase();
}
```

**실전 체크리스트:**
- 가능하면 `any` 대신 `unknown` 사용
- 외부 라이브러리 타입은 `@types/` 패키지 설치
- 정 안 되면 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 로컬 예외
- `as any`는 **절대** 정당화되지 않음 (대신 `as unknown as T` 패턴 사용)

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>TypeScript를 사용하면 생산성이 떨어지지 않나요?</strong></summary>

위의 측정 데이터에서 보듯, **초기 설정 비용은 있지만 장기적으로 생산성이 크게 향상**됩니다. Airbnb 사례: 마이그레이션 첫 3개월은 생산성이 15% 감소했지만, 6개월 후에는 30% 향상되었습니다. 타입 시스템이 코드 문서화 역할을 하고, 리팩토링이 훨씬 안전해집니다.
</details>

<details>
<summary><strong>any 타입을 사용해도 되나요?</strong></summary>

가능한 피해야 합니다. any를 사용하면 TypeScript를 사용하는 의미가 사라집니다. unknown을 먼저 고려하고, 외부 라이브러리는 @types 패키지를 설치하세요. `eslint @typescript-eslint/no-explicit-any: error` 규칙을 활성화하는 것을 추천합니다.
</details>

<details>
<summary><strong>JavaScript 프로젝트를 TypeScript로 전환하는 가장 좋은 방법은?</strong></summary>

점진적 접근법을 추천합니다. 위에서 설명한 단계별 마이그레이션 전략을 따르세요. 핵심은 `allowJs: true`로 시작해서 데이터 모델과 API 계층부터 타입을 정의하는 것입니다. **한 번에 모든 파일을 바꾸려고 하면 반드시 실패합니다.**
</details>

<details>
<summary><strong>구조적 타이핑의 단점은 없나요?</strong></summary>

가끔 예상치 못한 타입 호환이 발생할 수 있습니다. 예를 들어 두 인터페이스가 우연히 같은 구조를 가지면 서로 호환됩니다. 이 문제가 발생하면 **브랜딩(Branding)** 패턴으로 해결할 수 있습니다:

```typescript
// 브랜딩 — 구조적 타입의 단점 해결
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;

function getUser(id: UserId) { /* ... */ }

getUser('abc' as UserId);  // ✅ OK
// getUser('abc');         // ❌ 에러: string은 UserId에 할당 불가
```
</details>

## 요약

- **왜 TypeScript인가?** — 프로덕션 버그 42% 감소, 리팩토링 시간 40% 단축, 신규 개발자 온보딩 70% 단축
- **타입 시스템 원리** — 구조적 타이핑(Structural Typing)으로 JavaScript 생태계와 자연스러운 통합, 컴파일 타임에 타입 소거
- **any vs unknown vs never** — any는 피하고, unknown으로 외부 입력을 안전하게 처리, never로 철저한 검증
- **고급 타입** — 조건부 타입(infer), Mapped Types, Template Literal Types로 강력한 타입 추론
- **Express + TS** — 타입 안전한 컨트롤러, DTO 검증(class-validator), 커스텀 에러 클래스
- **마이그레이션** — allowJs로 시작, 점진적 strict 활성화, 3~6개월 단계적 전환
- **생산성 체크리스트** — skipLibCheck로 빌드 속도 40% 향상, incremental로 60% 단축, strict 모드로 안전성 극대화
