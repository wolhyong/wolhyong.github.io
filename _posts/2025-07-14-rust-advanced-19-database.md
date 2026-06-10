---
layout: post
title: "Rust 데이터베이스 — SQLx, Diesel ORM, 마이그레이션, 연결 풀, 트랜잭션"
description: "Rust의 데이터베이스 생태계를 실무 레벨에서 학습합니다. SQLx는 컴파일 타임 쿼리 검사를 제공하는 비동기 SQL 라이브러리로 타입 안전한 쿼리를 보장합니다. Diesel ORM은 타입 안전한 쿼리 빌더로 컴파일 타임에 SQL을 생성하며 마이그레이션을 지원합니다. 연결 풀은 데이터베이스 연결을 재사용하여 성능을 최적화하며 PgPoolOptions로 구성합니다. 트랜잭션은 begin, commit, rollback으로 원자성을 보장하며 여러 쿼리를 그룹화합니다. 마이그레이션은 데이터베이스 스키마 버전 관리를 제공하며 up/down 마이그레이션으로 스키마 변경을 추적합니다."
date: 2025-07-14 10:00:00 +0900
category: rust
tags: [rust, database, sqlx, diesel, orm, migration, connection-pool]
level: advanced
---

Rust의 데이터베이스 생태계는 타입 안전성과 성능을 동시에 제공하며 현대적 데이터베이스 애플리케이션을 구축할 수 있습니다.

> **핵심 정리** · SQLx는 컴파일 타임 쿼리 검사를 제공하는 비동기 SQL 라이브러리입니다. Diesel은 타입 안전한 쿼리 빌더 ORM입니다. 연결 풀로 성능을 최적화합니다. 트랜잭션으로 원자성을 보장합니다. 마이그레이션으로 스키마를 버전 관리합니다.


## 수업 목표

- SQLx로 비동기 쿼리를 실행할 수 있습니다.
- Diesel ORM으로 타입 안전한 쿼리를 작성할 수 있습니다.
- 연결 풀을 구성하고 사용할 수 있습니다.
- 트랜잭션을 관리할 수 있습니다.
- 마이그레이션을 작성하고 실행할 수 있습니다.
- 데이터베이스 에러를 처리할 수 있습니다.

## SQLx

```toml
# Cargo.toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres"] }
tokio = { version = "1", features = ["full"] }
```

```rust
use sqlx::PgPool;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPool::connect("postgres://user:password@localhost/db").await?;

    let row = sqlx::query!("SELECT id, username FROM users WHERE id = $1", 1)
        .fetch_one(&pool)
        .await?;

    println!("User: {} ({})", row.username, row.id);

    Ok(())
}
```

SQLx는 비동기 SQL 라이브러리로 컴파일 타임 쿼리 검사를 제공합니다. `sqlx::query!` 매크로로 쿼리를 작성하면 컴파일러가 데이터베이스 스키마를 확인하여 타입 안전성을 보장합니다.

### 쿼리 실행

```rust
use sqlx::PgPool;

async fn create_user(pool: &PgPool, username: &str, email: &str) -> Result<i32, sqlx::Error> {
    let row = sqlx::query!(
        "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id",
        username,
        email
    )
    .fetch_one(pool)
    .await?;

    Ok(row.id)
}

async fn get_user(pool: &PgPool, id: i32) -> Result<Option<(i32, String)>, sqlx::Error> {
    let row = sqlx::query!(
        "SELECT id, username FROM users WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|r| (r.id, r.username)))
}
```

`query!` 매크로는 파라미터화된 쿼리를 지원합니다. `$1`, `$2` 같은 위치 파라미터를 사용하여 SQL 인젝션을 방지합니다. `fetch_one`은 단일 행, `fetch_optional`은 옵션 행, `fetch_all`은 모든 행을 반환합니다.

### 연결 풀

```rust
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://user:password@localhost/db")
        .await?;

    // 연결 풀 사용
    for i in 0..10 {
        let pool_clone = pool.clone();
        tokio::spawn(async move {
            let result = sqlx::query!("SELECT 1").fetch_one(&pool_clone).await;
            println!("Task {}: {:?}", i, result);
        });
    }

    Ok(())
}
```

`PgPoolOptions`로 연결 풀을 구성합니다. `max_connections`로 최대 연결 수를 설정합니다. 연결 풀은 연결을 재사용하여 성능을 최적화합니다. `pool.clone()`은 참조 카운트를 증가시키며 새 연결을 생성하지 않습니다.

## Diesel ORM

```toml
# Cargo.toml
[dependencies]
diesel = { version = "2.0", features = ["postgres"] }
diesel_migrations = "2.0"
```

```bash
# Diesel CLI 설치
cargo install diesel_cli --no-default-features --features postgres

# 프로젝트 설정
diesel setup
diesel migration generate create_users
```

Diesel은 타입 안전한 쿼리 빌더 ORM입니다. 컴파일 타임에 SQL을 생성하여 타입 안전성을 보장합니다. 마이그레이션을 지원하며 스키마를 버전 관리합니다.

### 스키마 정의

```rust
// schema.rs
diesel::table! {
    users (id) {
        id -> Int4,
        username -> Varchar,
        email -> Varchar,
        created_at -> Timestamp,
    }
}

diesel::allow_tables_to_appear_in_same_query!(users);
```

`diesel print-schema`로 스키마를 자동 생성할 수 있습니다. `table!` 매크로로 테이블을 정의하며 컴파일 타임에 타입을 확인합니다.

### 모델 정의

```rust
use diesel::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Debug, Queryable, Serialize, Deserialize)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Insertable)]
#[diesel(table_name = users)]
pub struct NewUser {
    pub username: String,
    pub email: String,
}
```

`Queryable` 트레이트는 SELECT 쿼리 결과를 구조체로 매핑합니다. `Insertable` 트레이트는 INSERT 쿼리를 위한 구조체를 정의합니다. `Serialize`, `Deserialize`로 JSON 직렬화를 지원합니다.

### CRUD 작업

```rust
use diesel::prelude::*;

pub fn create_user(conn: &mut PgConnection, user: &NewUser) -> QueryResult<User> {
    diesel::insert_into(users::table)
        .values(user)
        .get_result(conn)
}

pub fn get_user(conn: &mut PgConnection, user_id: i32) -> QueryResult<User> {
    users::table.find(user_id).first(conn)
}

pub fn update_user(conn: &mut PgConnection, user_id: i32, username: &str) -> QueryResult<User> {
    diesel::update(users::table.find(user_id))
        .set(users::username.eq(username))
        .get_result(conn)
}

pub fn delete_user(conn: &mut PgConnection, user_id: i32) -> QueryResult<usize> {
    diesel::delete(users::table.find(user_id)).execute(conn)
}
```

Diesel은 타입 안전한 쿼리 빌더를 제공합니다. `insert_into`, `find`, `update`, `delete` 등의 메서드로 쿼리를 구성합니다. 컴파일 타임에 SQL 타입을 검사합니다.

## 트랜잭션

```rust
use sqlx::PgPool;

async fn transfer_funds(
    pool: &PgPool,
    from_id: i32,
    to_id: i32,
    amount: i32,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    // 송금자 잔액 감소
    sqlx::query!(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        amount,
        from_id
    )
    .execute(&mut *tx)
    .await?;

    // 수금자 잔액 증가
    sqlx::query!(
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        amount,
        to_id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(())
}
```

`pool.begin()`으로 트랜잭션을 시작합니다. `commit()`으로 변경을 커밋하거나 `rollback()`으로 롤백합니다. 트랜잭션 내에서 에러가 발생하면 자동으로 롤백됩니다. 여러 쿼리를 원자적으로 실행할 때 사용합니다.

### Diesel 트랜잭션

```rust
use diesel::prelude::*;

pub fn transfer_funds(
    conn: &mut PgConnection,
    from_id: i32,
    to_id: i32,
    amount: i32,
) -> QueryResult<()> {
    conn.transaction::<_, diesel::result::Error, _>(|conn| {
        diesel::update(accounts::table.find(from_id))
            .set(accounts::balance.eq(accounts::balance - amount))
            .execute(conn)?;

        diesel::update(accounts::table.find(to_id))
            .set(accounts::balance.eq(accounts::balance + amount))
            .execute(conn)?;

        Ok(())
    })
}
```

Diesel의 `transaction` 메서드로 트랜잭션을 시작합니다. 클로저 내에서 쿼리를 실행하고 에러 발생 시 자동 롤백됩니다. 반환값이 `Ok`이면 커밋됩니다.

## 마이그레이션

```sql
-- migrations/2023-01-01-000000_create_users/up.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

```sql
-- migrations/2023-01-01-000000_create_users/down.sql
DROP TABLE users;
```

마이그레이션은 데이터베이스 스키마 버전 관리를 제공합니다. `up.sql`은 마이그레이션 적용, `down.sql`은 롤백을 정의합니다. `diesel migration run`으로 마이그레이션을 실행합니다.

### SQLx 마이그레이션

```rust
use sqlx::migrate::Migrator;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPool::connect("postgres://user:password@localhost/db").await?;

    Migrator::run(&pool).await?;

    Ok(())
}
```

SQLx도 마이그레이션을 지원합니다. `migrations/` 디렉토리에 마이그레이션 파일을 저장하고 `Migrator::run()`으로 실행합니다. `migrate!` 매크로로 컴파일 타임에 마이그레이션을 포함할 수도 있습니다.

## 에러 처리

```rust
use sqlx::Error as SqlxError;

#[derive(Debug)]
enum AppError {
    Database(SqlxError),
    NotFound,
}

impl From<SqlxError> for AppError {
    fn from(err: SqlxError) -> Self {
        AppError::Database(err)
    }
}

async fn get_user(pool: &PgPool, id: i32) -> Result<User, AppError> {
    let row = sqlx::query!(
        "SELECT id, username FROM users WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(User {
        id: row.id,
        username: row.username,
    })
}
```

데이터베이스 에러는 `sqlx::Error`로 표현됩니다. `From` 트레이트를 구현하여 커스텀 에러 타입으로 변환할 수 있습니다. `?` 연산자로 에러를 전파합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> SQLx와 Diesel 중 어떤 것을 사용해야 하나요?</strong></summary>

SQLx는 SQL을 직접 작성하며 컴파일 타임 쿼리 검사를 제공합니다. SQL에 익숙하거나 복잡한 쿼리가 필요할 때 적합합니다. Diesel은 타입 안전한 쿼리 빌더를 제공하며 컴파일 타임에 SQL을 생성합니다. Rust 친화적이고 타입 안전성이 높습니다. SQL 선호도면 SQLx, Rust 친화적이면 Diesel을 사용합니다.
</details>

<details>
<summary><strong>Q> 연결 풀은 왜 필요한가요?</strong></summary>

연결 풀은 데이터베이스 연결을 재사용하여 성능을 최적화합니다. 연결 생성은 비용이 높으며 연결 풀은 연결을 재사용하여 오버헤드를 줄입니다. 최대 연결 수를 설정하여 데이터베이스 부하를 제어할 수 있습니다. 비동기 웹 애플리케이션에서 필수적입니다.
</details>

<details>
<summary><strong>Q> 트랜잭션은 언제 사용해야 하나요?</strong></summary>

트랜잭션은 여러 쿼리를 원자적으로 실행해야 할 때 사용합니다. 예: 송금, 주문 처리, 데이터 일관성이 필요한 작업. 모든 쿼리가 성공하면 커밋, 하나라도 실패하면 롤백됩니다. 데이터 무결성을 보장합니다.
</details>

<details>
<summary><strong>Q> 마이그레이션은 어떻게 관리하나요?</summary></summary>

마이그레이션은 `migrations/` 디렉토리에 `up.sql`과 `down.sql` 파일로 저장합니다. `diesel migration run` 또는 SQLx의 `Migrator::run()`으로 실행합니다. 버전 관리 시스템으로 어떤 마이그레이션이 적용되었는지 추적합니다. 롤백도 지원합니다.
</details>

<details>
<summary><strong>Q> 컴파일 타임 쿼리 검사는 어떻게 동작하나요?</strong></summary>

SQLx는 `sqlx::query!` 매크로를 컴파일할 때 데이터베이스에 연결하여 쿼리를 실행하고 결과 타입을 추론합니다. `DATABASE_URL` 환경 변수로 데이터베이스 연결을 설정해야 합니다. 컴파일 타임에 SQL 타입과 Rust 타입을 검사하여 타입 안전성을 보장합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **SQLx** | 비동기 SQL 라이브러리 | 컴파일 타임 쿼리 검사 |
| **Diesel** | 타입 안전 ORM | 쿼리 빌더 |
| **연결 풀** | 연결 재사용 | 성능 최적화 |
| **트랜잭션** | 원자적 실행 | commit/rollback |
| **마이그레이션** | 스키마 버전 관리 | up/down 파일 |
| **query!** | 타입 안전 쿼리 | 컴파일 타임 검사 |
| **PgPool** | PostgreSQL 연결 풀 | 비동기 지원 |
| **에러 처리** | sqlx::Error | 커스텀 에러 변환 |


## 다음 수업

다음 글에서는 Rust 고급 — 성능 최적화, 프로파일링, 벤치마킹, 메모리 최적화를 배웁니다.
