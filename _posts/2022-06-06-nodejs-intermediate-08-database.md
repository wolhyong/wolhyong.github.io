---
layout: post
title: "Node.js 데이터베이스 연동 — SQLite, MySQL, Prisma 깊이 이해하기"
description: "Node.js에서 데이터베이스를 연동할 때 알아야 할 모든 것 — SQLite와 MySQL의 내부 동작 원리, 커넥션 풀이 메모리와 성능에 미치는 영향, SQL 인젝션이 실제로 어떻게 동작하는지, Prisma와 Knex.js의 내부 쿼리 생성 방식 비교, 트랜잭션 격리 수준이 동시성에 미치는 영향, N+1 문제 해결 전략과 인덱싱 최적화"
date: 2022-06-06 10:00:00 +0900
category: nodejs
tags: [nodejs, database, sqlite, mysql, postgresql, orm, knex, prisma, crud, connection-pool, transaction, sql-injection, n-plus-one, indexing, database-optimization]
level: intermediate
---

웹 애플리케이션에서 데이터베이스는 단순한 저장소가 아니라 **애플리케이션의 전체 성능과 안정성을 결정짓는 핵심 계층**입니다. 어떤 데이터베이스를 선택하느냐, 커넥션을 어떻게 관리하느냐, 쿼리를 어떻게 최적화하느냐에 따라 동일한 비즈니스 로직이 10배 이상의 성능 차이를 보일 수 있습니다.

이 포스트에서는 Node.js와 데이터베이스 연동 시 **내부에서 실제로 일어나는 일**을 중심으로 설명합니다.

## 수업 목표

- SQLite와 MySQL의 **내부 아키텍처 차이**와 선택 기준을 이해합니다.
- **프리페어드 스테이트먼트**가 SQL 인젝션을 막는 원리를 이해합니다.
- **커넥션 풀**의 내부 구조와 최적 설정 방법을 학습합니다.
- **트랜잭션 격리 수준**이 동시성에 미치는 영향을 이해합니다.
- **ORM의 N+1 문제**가 발생하는 원인과 해결책을 학습합니다.
- **Prisma와 Knex.js**의 내부 쿼리 생성 방식을 비교합니다.
- **SEO/AEO/GEO 최적화**된 데이터베이스 연동 방법을 익힙니다.

---

## 데이터베이스 선택 — SQLite vs MySQL의 내부 차이

초보자가 가장 먼저 고민하는 질문입니다. 단순히 "SQLite는 가볍고 MySQL은 강력하다"는 설명으로는 충분하지 않습니다. **내부 아키텍처의 차이**를 이해해야 올바른 선택을 할 수 있습니다.

| 항목 | SQLite | MySQL (InnoDB) | PostgreSQL |
|------|--------|----------------|------------|
| **아키텍처** | 임베디드 라이브러리 (서버 불필요) | 클라이언트-서버 (별도 프로세스) | 클라이언트-서버 (별도 프로세스) |
| **파일 저장** | 단일 파일 (`.db` 또는 `.sqlite`) | 데이터 디렉토리 (여러 파일) | 데이터 디렉토리 (여러 파일) |
| **동시 쓰기** | ⚠️ 한 번에 하나의 쓰기만 허용 | ✅ 동시 쓰기 지원 (행 수준 잠금) | ✅ 동시 쓰기 지원 (MVCC) |
| **동시 읽기** | ✅ 여러 읽기 가능 (WAL 모드) | ✅ 여러 읽기 가능 | ✅ 여러 읽기 가능 |
| **메모리 사용** | 수 MB (매우 낮음) | 수백 MB ~ 수 GB | 수백 MB ~ 수 GB |
| **초당 쿼리 처리량** | ~5,000 QPS (단일 코어) | ~50,000 QPS (튜닝 시) | ~100,000 QPS (튜닝 시) |
| **프로덕션 적합성** | ❌ (동시 쓰기 많을 경우) | ✅ | ✅ |
| **설정 난이도** | 매우 쉬움 (npm install만) | 보통 (서버 설정 필요) | 보통 (서버 설정 필요) |
| **복제/샤딩** | ❌ 지원 안 함 | ✅ 지원 | ✅ 지원 |

**언제 무엇을 선택해야 할까요?**

- **SQLite**: 개발 환경, 테스트, 1인 사용자 앱, 임베디드 시스템, Electron 앱, 소규모 IoT
- **MySQL**: 전통적인 웹 애플리케이션, WordPress, 높은 읽기 처리량 필요 시
- **PostgreSQL**: 복잡한 쿼리, JSON/Geospatial 데이터, 분석/OLAP, 금융/정산 시스템

---

## SQLite — better-sqlite3 내부 동작

### 설정과 연결

```bash
npm install better-sqlite3
```

```javascript
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'blog.db'));

// WAL 모드 활성화 (성능 향상)
db.pragma('journal_mode = WAL');

// 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

> **코드 분석 — 한 줄씩 이해하기:**
>
> **`new Database(...)`**: SQLite 데이터베이스 파일을 엽니다. 파일이 없으면 자동 생성합니다. `better-sqlite3`는 **동기식 API**를 사용하는데, 이는 SQLite가 단일 파일 기반이라 I/O가 매우 빠르기 때문입니다. 대부분의 쿼리가 0.1ms ~ 1ms 내에 완료되므로 async/await 오버헤드가 오히려 성능을 떨어뜨릴 수 있습니다.
>
> **`pragma('journal_mode = WAL')`**: WAL(Write-Ahead Logging) 모드로 전환합니다. 기본 SQLite는 롤백 저널 모드로, 쓰기 시 원본 데이터를 별도 파일에 저장합니다. WAL 모드는 **변경 사항을 로그 파일에 먼저 기록**하고, 체크포인트 시점에 메인 데이터베이스에 반영합니다. 이 방식의 장점:
>   - **읽기와 쓰기가 동시에 가능** (기존 모드에서는 읽기 중 쓰기 불가)
>   - **쓰기 성능 약 2~3배 향상**
>   - 단점: WAL 파일(`.db-wal`, `.db-shm`)이 추가로 생성됨

---

### CRUD — SQLite에서 prepared statement의 내부

```javascript
// Create — 사용자 생성
const insertUser = db.prepare(
  'INSERT INTO users (name, email) VALUES (?, ?)'
);
const result = insertUser.run('Alice', 'alice@example.com');
console.log('새 사용자 ID:', result.lastInsertRowid);

// Read — 모든 사용자 조회
const getAllUsers = db.prepare('SELECT * FROM users');
const users = getAllUsers.all();
console.log('사용자 목록:', users);

// Update
const updateUser = db.prepare('UPDATE users SET name = ? WHERE id = ?');
updateUser.run('Alice Updated', 1);

// Delete
const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');
deleteUser.run(1);
```

> **깊이 있는 설명 — `db.prepare()`가 하는 일:**
>
> `db.prepare()`는 단순히 SQL 문자열을 저장하는 것이 아닙니다. 내부적으로 SQLite 엔진이 이 SQL을 **파싱 → 분석 → 바이트코드로 컴파일**하여 재사용 가능한 **statement 핸들**을 생성합니다. 이 과정을 **"쿼리 컴파일"** 이라고 하며, 약 0.01ms ~ 0.1ms가 소요됩니다.
>
> prepared statement의 핵심은 **SQL 템플릿과 파라미터를 분리**하는 것입니다:
> - `INSERT INTO users (name, email) VALUES (?, ?)` — 이 부분이 **템플릿** (한 번만 컴파일)
> - `'Alice', 'alice@example.com'` — 이 부분이 **파라미터** (실행할 때마다 바인딩)
>
> 이 분리가 **SQL 인젝션을 근본적으로 차단**하는 원리입니다. 사용자 입력이 SQL 구문으로 해석될 기회 자체를 없애기 때문입니다. 문자열 연결로 쿼리를 만들면 사용자 입력이 SQL 파서에 의해 **명령어로 해석**될 수 있지만, prepared statement에서는 파라미터가 **항상 데이터로만** 취급됩니다.

---

### 트랜잭션 — 원자성의 실제 의미

```javascript
// 트랜잭션으로 여러 작업을 원자적으로 처리
const createPostWithTags = db.transaction((userId, title, content, tags) => {
  const postResult = db.prepare(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)'
  ).run(userId, title, content);

  const postId = postResult.lastInsertRowid;

  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  const linkTag = db.prepare(
    'INSERT INTO post_tags (post_id, tag_id) VALUES (?, (SELECT id FROM tags WHERE name = ?))'
  );

  for (const tag of tags) {
    insertTag.run(tag);
    linkTag.run(postId, tag);
  }

  return postId;
});

try {
  const postId = createPostWithTags(1, '첫 글', '내용입니다', ['nodejs', 'database']);
  console.log('포스트 생성 완료 ID:', postId);
} catch (error) {
  console.error('포스트 생성 실패:', error);
}
```

> **깊이 있는 설명 — 트랜잭션과 ACID:**
>
> 위 코드에서 `db.transaction(...)`으로 감싼 함수 내부의 모든 `db.prepare().run()`은 **하나의 원자적 단위**로 실행됩니다. 중간에 오류가 발생하면 지금까지 실행된 모든 작업이 **롤백**됩니다. 이것이 트랜잭션의 **A(Atomicity, 원자성)**입니다.
>
> **트랜잭션이 없을 때 발생할 수 있는 시나리오:**
>
> ```
> 1. posts 테이블에 포스트 INSERT → 성공 (postId = 100)
> 2. ✋ 서버 충돌 발생
> 3. tags와 post_tags에는 아무것도 기록되지 않음
> 4. 결과: 고아 레코드(orphan record) 발생 — 누구도 참조하지 않는 post 100번이 영원히 남음
> ```
>
> **트랜잭션이 있을 때:**
>
> ```
> 1. BEGIN TRANSACTION
> 2. posts에 INSERT
> 3. tags에 INSERT
> 4. ✋ 서버 충돌 발생
> 5. ROLLBACK — 2, 3단계의 모든 변경 사항이 취소됨
> 6. 결과: 데이터베이스는 완전히 깨끗한 상태 유지
> ```
>
> SQLite의 트랜잭션은 **ROLLBACK 저널** 또는 **WAL**을 사용하여 구현됩니다. 트랜잭션 시작 시 원본 데이터를 저널 파일에 백업하고, 트랜잭션이 성공하면 저널을 삭제합니다. 실패하면 저널에서 원본 데이터를 복원합니다.

---

## MySQL — 커넥션 풀의 내부 동작

### 커넥션 풀 설정과 메모리 구조

```bash
npm install mysql2
```

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```

> **깊이 있는 설명 — 커넥션 풀의 내부 구조:**
>
> MySQL 연결을 맺는 과정(TCP 핸드셰이크 + SSL 협상 + 인증)은 **약 10~50ms**가 소요됩니다. 매 요청마다 이 과정을 반복하면 페이지 로딩 시간이 기하급수적으로 늘어납니다.
>
> 커넥션 풀은 **이미 연결된 TCP 소켓을 재사용**하는 기법입니다. 내부적으로 다음과 같은 구조로 동작합니다:
>
> ```
> ┌─────────────────────────────────────┐
> │          Connection Pool            │
> │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
> │  │Conn1│ │Conn2│ │Conn3│ │Conn4│  │  ← 미리 연결된 소켓 풀
> │  └─────┘ └─────┘ └─────┘ └─────┘  │
> │         ▲ 대기 큐(queueLimit)        │
> │    [요청5] [요청6] [요청7] ...        │
> └─────────────────────────────────────┘
> ```
>
> **`waitForConnections: true`**: 모든 커넥션이 사용 중일 때 새 요청을 대기시킵니다. `false`면 즉시 오류를 반환합니다.
>
> **`connectionLimit: 10`**: 동시에 유지할 최대 연결 수입니다. 너무 작으면 대기 시간이 늘어나고, 너무 크면 MySQL 서버의 메모리와 CPU가 고갈됩니다. MySQL은 커넥션당 약 **1~2MB**의 메모리를 사용하므로, connectionLimit이 100이면 약 100~200MB가 순수 커넥션 유지에 사용됩니다.
>
> **최적 connectionLimit 찾기:**
> | 동시 요청 수 | connectionLimit | 예상 대기 시간 | MySQL 메모리 |
> |-------------|----------------|---------------|-------------|
> | 10 req/s | 5 | ~100ms (큐 대기) | 10MB |
> | 10 req/s | 10 | ~0ms | 20MB |
> | 100 req/s | 20 | ~10ms | 40MB |
> | 1000 req/s | 50 | ~50ms | 100MB |
>
> 일반적인 공식: **connectionLimit = (초당 요청 수 × 평균 쿼리 시간(초)) × 1.5**

---

### CRUD with async/await

```javascript
// Create
async function createUser(name, email) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email]
  );
  return result.insertId;
}

// Read — 단일 조회
async function getUserById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}
```

> **코드 분석 — `pool.execute()`의 내부:**
>
> `pool.execute()`는 내부적으로:
>
> 1. **`pool.getConnection()`** — 사용 가능한 커넥션을 풀에서 가져옵니다. 모든 커넥션이 사용 중이면 `waitForConnections` 설정에 따라 대기하거나 오류를 반환합니다.
> 2. **`connection.execute(sql, params)`** — 가져온 커넥션으로 프리페어드 스테이트먼트를 실행합니다. mysql2는 내부적으로 **파라미터 바인딩**을 수행하여 `?` 자리에 실제 값을 안전하게 채워 넣습니다.
> 3. **`connection.release()`** — 실행이 완료되면 커넥션을 풀에 반환합니다. (주의: `pool.end()`나 오류 발생 시 release가 누락될 수 있으므로 `finally` 블록에서 처리해야 함)
>
> **실제 프로젝트에서는 이렇게 사용합니다:**
> ```javascript
> async function safeQuery(sql, params) {
>   const conn = await pool.getConnection();
>   try {
>     const [rows] = await conn.execute(sql, params);
>     return rows;
>   } finally {
>     conn.release(); // 오류가 발생해도 반드시 실행
>   }
> }
> ```
>
> 이렇게 `try...finally` 패턴을 사용하면 어떤 경우에도 커넥션이 풀로 반환되어 **커넥션 누수(connection leak)**를 방지할 수 있습니다. 커넥션 누수가 발생하면 결국 풀이 고갈되어 애플리케이션이 더 이상 데이터베이스에 연결할 수 없게 됩니다.

---

## SQL Injection — 실제 공격이 어떻게 이루어지는가

```javascript
// ❌ 절대 이렇게 하지 마세요
const userInput = "'; DROP TABLE users; --";
const query = `SELECT * FROM users WHERE name = '${userInput}'`;
// 실행 결과: users 테이블이 삭제됩니다!

// ✅ 항상 프리페어드 스테이트먼트 사용
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE name = ?',
  [userInput]
);
// 실행 결과: '을(를) 포함한 이름으로 안전하게 검색
```

> **깊이 있는 설명 — SQL 인젝션이 정확히 어떻게 동작하는가:**
>
> 위험한 코드에서 실제로 생성되는 SQL을 보면:
>
> ```sql
> SELECT * FROM users WHERE name = ''; DROP TABLE users; --'
> ```
>
> SQL 파서는 이 문자열을 다음과 같이 해석합니다:
> 1. `SELECT * FROM users WHERE name = ''` — name이 빈 문자열인 사용자 찾기
> 2. `;` — SQL 문장 구분자. 여기서 첫 번째 쿼리 종료
> 3. `DROP TABLE users` — **완전히 새로운 SQL 문장**으로 해석됨! users 테이블 삭제
> 4. `--'` — SQL 주석. 뒤의 싱글 쿼트를 주석 처리하여 문법 오류 방지
>
> **프리페어드 스테이트먼트가 이를 방지하는 방법:**
>
> `pool.execute('SELECT * FROM users WHERE name = ?', [userInput])`에서 mysql2는:
>
> 1. SQL 템플릿을 MySQL 서버로 전송하여 **컴파일**
> 2. MySQL 서버가 `?` 자리를 **파라미터 placeholder**로 인식
> 3. 실제 `userInput` 값을 **바이너리 프로토콜**로 안전하게 전송
> 4. MySQL 서버가 값에 포함된 `'`, `;`, `--` 등을 **문자열 데이터로만** 처리
>
> 즉, 프리페어드 스테이트먼트는 **SQL 명령어와 데이터를 완전히 분리**하므로 어떤 입력이 와도 SQL 명령어로 해석될 수 없습니다.

---

## ORM 비교 — Knex.js와 Prisma의 내부 차이

### Knex.js — SQL 쿼리 빌더

```bash
npm install knex
```

```javascript
const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: './blog.db' },
  useNullAsDefault: true
});

// CRUD with Knex
async function crudWithKnex() {
  // Create
  const [id] = await knex('users').insert({
    name: 'Alice', email: 'alice@example.com'
  });

  // Read — 조건 검색
  const user = await knex('users').where({ id: 1 }).first();
  const users = await knex('users').orderBy('created_at', 'desc').limit(10);

  // Update
  await knex('users').where({ id: 1 }).update({ name: 'Alice Updated' });

  // Delete
  await knex('users').where({ id: 1 }).del();
}
```

> **깊이 있는 설명 — Knex.js가 SQL을 생성하는 과정:**
>
> Knex.js는 **체이닝 메서드 호출을 SQL 문자열로 변환**합니다. `knex('users').where({ id: 1 }).first()`는 내부적으로:
>
> 1. `knex('users')` → `FROM users` 컨텍스트 생성
> 2. `.where({ id: 1 })` → `WHERE id = 1` 조건 추가
> 3. `.first()` → `LIMIT 1` 추가 + 실행 트리거
> 4. 최종 생성 SQL: `SELECT * FROM users WHERE id = 1 LIMIT 1`
>
> **실행 시점은 언제일까요?** Knex.js는 **지연 실행(lazy evaluation)** 방식을 사용합니다. `.first()`나 `.then()`처럼 실제 데이터가 필요한 순간에 체이닝된 모든 조건을 모아 하나의 SQL 문장으로 만든 후 실행합니다. 이 방식의 장점은 조건을 동적으로 추가/제거하기 쉽다는 것입니다.
>
> ```javascript
> function buildUserQuery(filters) {
>   let query = knex('users');
>   if (filters.name) query = query.where('name', 'like', `%${filters.name}%`);
>   if (filters.email) query = query.where('email', filters.email);
>   if (filters.minAge) query = query.where('age', '>=', filters.minAge);
>   query = query.orderBy('created_at', 'desc').limit(filters.limit || 10);
>   return query; // 아직 실행되지 않음!
> }
> // 실제 실행은 여기서:
> const results = await buildUserQuery({ name: 'Alice', limit: 5 });
> ```

---

### Prisma — 차세대 ORM

```bash
npm install prisma @prisma/client
npx prisma init
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```bash
npx prisma migrate dev --name init
```

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CRUD with Prisma
async function crudWithPrisma() {
  // Create — 관계 포함
  const user = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@example.com',
      posts: {
        create: { title: '첫 글', content: 'Prisma로 만든 글' }
      }
    },
    include: { posts: true }
  });

  // Read
  const users = await prisma.user.findMany({
    include: { posts: true },
    orderBy: { createdAt: 'desc' }
  });

  // Update
  await prisma.user.update({
    where: { id: 1 },
    data: { name: 'Alice Updated' }
  });
}
```

> **깊이 있는 설명 — Prisma가 생성하는 실제 SQL:**
>
> Prisma는 **타입 안전성**에 초점을 맞춘 ORM입니다. 위 `prisma.user.create(...)`는 내부적으로 다음과 같은 SQL을 생성합니다:
>
> ```sql
> BEGIN TRANSACTION;
> INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
> -- 방금 생성된 user.id = 1
> INSERT INTO posts (title, content, userId) VALUES ('첫 글', 'Prisma로 만든 글', 1);
> COMMIT;
> SELECT * FROM users WHERE id = 1;
> SELECT * FROM posts WHERE userId = 1;
> ```
>
> Prisma는 먼저 User를 생성하고, 그 결과로 받은 id를 Post의 userId로 사용합니다. 마지막에 `include: { posts: true }`가 있으므로 User와 관련 Post를 다시 조회합니다.
>
> **Prisma의 가장 큰 장점**은 모든 쿼리가 **컴파일 타임에 타입 검사**된다는 점입니다. `prisma.user.create({ data: { wrongField: '값' } })` 같은 코드는 실행하기도 전에 TypeScript 컴파일러가 오류를 잡아냅니다.

---

## ORM 비교 표 — Raw SQL vs Knex.js vs Prisma

| 항목 | Raw SQL (mysql2) | Knex.js (Query Builder) | Prisma (ORM) |
|------|-----------------|----------------------|-------------|
| **SQL 제어력** | 100% 완전 제어 | 90% (복잡한 쿼리는 Raw SQL fallback) | 70% (복잡한 JOIN/서브쿼리는 raw query 필요) |
| **생산성** | 낮음 (매 SQL 작성) | 중간 (체이닝으로 빠른 개발) | 높음 (선언적, 자동 마이그레이션) |
| **타입 안전성** | 없음 | 없음 (TypeScript 래퍼 가능) | ✅ 완전함 (Prisma Client 자동 생성) |
| **학습 곡선** | SQL만 알면 됨 | Knex API 학습 필요 | Prisma Schema 문법 학습 필요 |
| **N+1 문제** | 개발자가 직접 제어 | with/join으로 제어 가능 | `include`로 제어 (기본은 lazy) |
| **마이그레이션** | 수동 | Knex Migrate | Prisma Migrate (자동) |
| **쿼리 성능** | 최고 (직접 최적화) | 매우 좋음 | 좋음 (간접 레이어) |
| **복잡한 쿼리** | 모든 것 가능 | 서브쿼리/UNION 지원 | 제한적 (rawQuery fallback) |

---

## N+1 문제 — ORM의 가장 큰 함정

```javascript
// ❌ N+1 문제가 발생하는 코드
const users = await prisma.user.findMany();            // 1번 쿼리
for (const user of users) {
  const posts = await prisma.post.findMany({            // N번 쿼리 (사용자 수만큼)
    where: { userId: user.id }
  });
  console.log(user.name, '의 글:', posts.length);
}
```

> **깊이 있는 설명 — N+1 문제가 성능에 미치는 영향:**
>
> `findMany()`로 100명의 사용자를 조회했다면 총 **1 + 100 = 101번**의 데이터베이스 쿼리가 실행됩니다. 각 쿼리에 5ms가 소요된다면:
>
> - N+1 방식: 1ms(첫 쿼리) + 100 × 5ms = **501ms**
> - JOIN 방식: 1ms(JOIN 쿼리) + 0ms = **1ms → 약 500배 차이!**
>
> **해결책 — `include`로 JOIN 한 번으로:**
>
> ```javascript
> // ✅ JOIN으로 단 한 번의 쿼리로 해결
> const usersWithPosts = await prisma.user.findMany({
>   include: { posts: true }       // ← LEFT JOIN으로 단일 쿼리
> });
> // 실제 생성 SQL: SELECT users.*, posts.* FROM users LEFT JOIN posts ON users.id = posts.userId
> ```
>
> **대규모 데이터에서 주의할 점:** `include: { posts: true }`는 모든 사용자의 모든 포스트를 로드합니다. 사용자가 10,000명이고 각각 10개의 포스트가 있다면 100,000개의 레코드가 메모리에 로드됩니다. 이런 경우 페이지네이션이 필요합니다:
>
> ```javascript
> const usersWithPosts = await prisma.user.findMany({
>   take: 20,             // 20명만 조회
>   include: { posts: { take: 5 } }  // 각 사용자당 5개 포스트만
> });
> ```

---

## 어떤 데이터베이스와 ORM을 선택해야 할까?

### 상황별 추천

| 상황 | 추천 조합 | 이유 |
|------|----------|------|
| **1인 블로그/포트폴리오** | SQLite + better-sqlite3 | 서버 설치 불필요, 관리 비용 0원 |
| **스타트업 MVP (빠른 개발)** | SQLite + Prisma | 초기에는 SQLite로 개발, 나중에 PostgreSQL로 전환 |
| **중규모 팀 (타입 안전성 중요)** | PostgreSQL + Prisma | 타입 안전성 + 강력한 쿼리 |
| **대규모 트래픽** | PostgreSQL/MySQL + Knex.js | 최대 성능 제어 필요 |
| **금융/정산 시스템** | PostgreSQL + Raw SQL | 트랜잭션 격리 수준 완전 제어 |
| **IoT/임베디드** | SQLite | 최소 리소스, 최대 안정성 |

---

## 자주 묻는 질문

<details>
<summary><strong>SQLite로 개발하고 나중에 PostgreSQL로 전환하는 것이 쉬운가요?</strong></summary>

Prisma를 사용하면 데이터 소스 설정만 변경하면 됩니다. SQLite → PostgreSQL 전환 시 주의할 점:
- SQLite는 `AUTOINCREMENT`이고 PostgreSQL은 `SERIAL` 또는 `IDENTITY` — Prisma가 자동 처리
- SQLite는 `DATETIME` 타입(문자열 저장), PostgreSQL은 `TIMESTAMP` — Prisma가 자동 변환
- SQLite는 동시 쓰기가 제한적이므로, 전환 후 부하 테스트 필수
</details>

<details>
<summary><strong>ORM을 사용하면 성능이 항상 느린가요?</strong></summary>

**꼭 그렇지는 않습니다.** 잘 작성된 ORM 쿼리는 Raw SQL과 5~10% 정도의 성능 차이만 있습니다. 문제는 **ORM이 생성하는 쿼리를 개발자가 모르는 상태**에서 발생합니다. Prisma는 `logging: ['query']` 옵션으로 생성된 SQL을 모두 확인할 수 있습니다:
```javascript
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
// 콘솔에 모든 SQL이 출력됨
```
</details>

<details>
<summary><strong>커넥션 풀 크기는 어떻게 결정하나요?</strong></summary>

공식: **`connectionLimit = (CPU 코어 수 × 2) + 디스크 I/O 오버헤드`**

간단한 추정치:
- 4코어 서버: connectionLimit 10~15
- 8코어 서버: connectionLimit 20~30
- 16코어 서버: connectionLimit 40~60

너무 크게 설정하면 MySQL이 "너무 많은 연결" 오류를 반환할 수 있습니다. 실제 트래픽을 측정하면서 조정하는 것이 가장 좋습니다.
</details>

<details>
<summary><strong>SQLite는 프로덕션에 절대 사용할 수 없나요?</strong></summary>

동시 쓰기가 거의 없는 애플리케이션에서는 프로덕션 사용이 가능합니다. 예를 들어:
- **개인 블로그** (하루에 1~2개 글 작성)
- **설정 파일 저장소** (Config 관리)
- **읽기 전용 데이터** (Reference 데이터)
- **Electron/데스크톱 앱** (로컬 저장소)

동시 쓰기가 초당 10회 이상이면 MySQL/PostgreSQL로 전환하는 것이 좋습니다.
</details>

---

## 요약

- **SQLite**는 임베디드 엔진으로 설정이 간편하지만 동시 쓰기에 제한이 있습니다.
- **MySQL/PostgreSQL**은 클라이언트-서버 구조로 동시성과 확장성이 뛰어납니다.
- **프리페어드 스테이트먼트**는 SQL 명령어와 데이터를 분리하여 인젝션을 근본적으로 차단합니다.
- **커넥션 풀**은 연결 맺기 비용(10~50ms)을 없애고, 크기는 트래픽에 맞게 조정해야 합니다.
- **트랜잭션**은 ACID를 보장하며, 격리 수준에 따라 동시성과 일관성의 트레이드오프가 있습니다.
- **N+1 문제**는 ORM 사용 시 가장 흔한 성능 저하 원인으로, `include`/JOIN으로 해결합니다.
- **Prisma**는 타입 안전성이 뛰어나고, **Knex.js**는 SQL 제어력이 뛰어납니다.
- 데이터베이스 선택은 **동시성 요구사항**과 **관리 리소스**에 따라 결정해야 합니다.
