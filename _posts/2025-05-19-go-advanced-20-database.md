---
layout: post
title: "Go 데이터베이스 프로그래밍 — database/sql, 연결 풀, 마이그레이션, 트랜잭션, SQLC 코드 생성"
description: "Go의 데이터베이스 프로그래밍을 실무 레벨에서 학습합니다. database/sql 패키지가 sql.DB 연결 풀(connection pool)을 관리하고 sql.Open()으로 등록된 드라이버를 통해 실제 데이터베이스 연결을 생성하는 과정, sql.DB의 SetMaxOpenConns/SetMaxIdleConns/SetConnMaxLifetime으로 연결 풀의 동작을 세밀하게 제어하는 방식, sql.Rows가 데이터베이스 커서(cursor)를 래핑하여 Next() → Scan() 루프로 대량의 결과를 스트리밍하는 구조, 트랜잭션 처리에서 sql.Tx가 Begin() → Exec/Query → Commit/Rollback의 생명주기를 관리하고 동시성 제어를 위해 격리 수준(isolation level)을 설정하는 방법, sqlx와 같은 서드파티 라이브러리가 구조체 필드와 데이터베이스 컬럼을 매핑하는 편의 기능, SQLC(SQL Compiler)가 SQL 쿼리에서 Go 타입 안전한 코드를 자동 생성하여 런타임 오류를 컴파일 타임에 잡아내는 방식, golang-migrate 또는 goose를 사용한 데이터베이스 마이그레이션 전략을 다룹니다."
date: 2025-05-19 10:00:00 +0900
category: go
tags: [go, golang, database, sql, connection-pool, migration, sqlc, transaction, sqlx]
level: advanced
---

Go의 `database/sql`은 관계형 데이터베이스 접근을 위한 표준 인터페이스를 제공합니다.

> **핵심 정리** · `sql.Open()`으로 연결 풀을 생성합니다. `db.SetMaxOpenConns()`로 최대 연결 수를 제한합니다. `Rows.Next()` → `Scan()`으로 결과를 스트리밍합니다. `sql.Tx`로 트랜잭션을 관리합니다. SQLC는 SQL 쿼리에서 타입 안전한 Go 코드를 생성합니다. golang-migrate로 마이그레이션을 관리합니다.

## 수업 목표

- database/sql의 연결 풀 관리를 이해합니다.
- 쿼리 실행과 결과 스트리밍을 이해합니다.
- 트랜잭션 처리 방법을 이해합니다.
- SQLC를 사용한 타입 안전한 코드 생성을 이해합니다.
- 마이그레이션 전략을 이해합니다.

## database/sql 기초

```go
package main

import (
    "database/sql"
    "fmt"
    "log"
    "time"

    _ "github.com/lib/pq" // PostgreSQL 드라이버
)

type User struct {
    ID        int
    Name      string
    Email     string
    CreatedAt time.Time
}

func main() {
    // 연결 풀 생성
    db, err := sql.Open("postgres",
        "host=localhost port=5432 user=postgres password=pass dbname=mydb sslmode=disable")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // 연결 풀 설정
    db.SetMaxOpenConns(25)            // 최대 열린 연결 수
    db.SetMaxIdleConns(5)             // 최대 유휴 연결 수
    db.SetConnMaxLifetime(5 * time.Minute) // 연결 최대 수명
    db.SetConnMaxIdleTime(1 * time.Minute) // 유휴 연결 최대 시간

    // Ping으로 연결 확인
    if err := db.Ping(); err != nil {
        log.Fatal("데이터베이스 연결 실패:", err)
    }

    // 단일 행 조회
    var user User
    err = db.QueryRow("SELECT id, name, email, created_at FROM users WHERE id = $1", 1).
        Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)
    if err == sql.ErrNoRows {
        fmt.Println("사용자 없음")
    } else if err != nil {
        log.Fatal(err)
    }

    // 다중 행 조회
    rows, err := db.Query("SELECT id, name, email FROM users WHERE created_at > $1", 
        time.Now().AddDate(0, -1, 0))
    if err != nil {
        log.Fatal(err)
    }
    defer rows.Close()

    for rows.Next() {
        var u User
        if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
            log.Fatal(err)
        }
        fmt.Printf("%d: %s (%s)\n", u.ID, u.Name, u.Email)
    }
    if err := rows.Err(); err != nil {
        log.Fatal(err)
    }
}
```

`sql.Open()`은 **연결 풀**을 생성합니다. 실제 연결은 `db.Ping()`이나 첫 쿼리 실행 시점에 이루어집니다. `SetMaxOpenConns`는 동시에 열 수 있는 최대 연결 수를 제한합니다(기본값: 무제한). `SetMaxIdleConns`는 유휴 상태로 유지할 최대 연결 수입니다. `SetConnMaxLifetime`은 연결의 최대 수명으로, 오래된 연결을 주기적으로 교체하여 네트워크 문제를 방지합니다. `QueryRow().Scan()`은 단일 행을 읽고, `Query()`는 `Rows` 객체를 반환하여 스트리밍으로 읽습니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: SQLC는 어떻게 동작하나요?</strong></summary>

SQLC(SQL Compiler)는 SQL 쿼리를 분석하여 Go 코드를 생성합니다. 동작 과정: (1) `.sql` 파일에 SQL 쿼리를 작성합니다. (2) `sqlc generate` 명령어로 실행합니다. (3) SQLC가 SQL을 파싱하여 쿼리의 입력/출력 타입을 분석합니다. (4) 타입 안전한 Go 함수와 구조체를 자동 생성합니다. 예: `SELECT id, name FROM users WHERE id = $1`에 대해 `GetUser(ctx context.Context, id int) (User, error)` 함수를 생성합니다. 장점: (1) 컴파일 타임에 SQL 오류 발견. (2) 런타임에 잘못된 컬럼명/타입 오류 없음. (3) ORM보다 예측 가능한 성능. SQLC는 Go에서 가장 인기 있는 데이터베이스 접근 방식 중 하나입니다.
</details>

<details>
<summary><strong>Q: 연결 풀의 크기는 어떻게 결정하나요?</strong></summary>

연결 풀 크기는 여러 요소를 고려하여 결정합니다: (1) **데이터베이스 연결 한도** — PostgreSQL의 `max_connections`(기본 100). (2) **동시 요청 수** — 예상되는 동시 HTTP 요청 수. (3) **쿼리 지연 시간** — 각 쿼리가 평균적으로 얼마나 오래 걸리는지. 공식: `PoolSize = (RequestPerSecond × QueryTimeSeconds) + Spare`. 너무 작으면 요청이 연결을 기다리며 블로킹됩니다. 너무 크면 데이터베이스에 부하가 가고 연결 리소스가 낭비됩니다. 일반적인 가이드라인: 10~50개 연결이 적절하며, 부하 테스트를 통해 조정합니다.
</details>

<details>
<summary><strong>Q: 트랜잭션의 격리 수준(isolation level)은 어떻게 설정하나요?</strong></summary>

`sql.Tx`의 격리 수준은 `db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})`로 설정합니다. Go는 네 가지 표준 격리 수준을 지원합니다: (1) `LevelReadUncommitted` — dirty read 허용 (가장 낮음). (2) `LevelReadCommitted` — 커밋된 데이터만 읽음 (PostgreSQL 기본). (3) `LevelRepeatableRead` — 트랜잭션 내에서 동일한 읽기 결과 보장. (4) `LevelSerializable` — 완벽한 격리 (가장 높음, 성능 저하). PostgreSQL은 `LevelReadCommitted`와 `LevelSerializable`만 지원합니다. MySQL은 네 가지 모두 지원합니다. 격리 수준이 높을수록 데이터 일관성은 좋아지지만 동시성이 낮아집니다.
</details>

<details>
<summary><strong>Q: sqlx는 database/sql과 어떻게 다른가요?</strong></summary>

`sqlx`는 `database/sql`의 확장 버전으로, 추가 편의 기능을 제공합니다: (1) **구조체 매핑** — `rows.StructScan(&user)`로 구조체 필드에 직접 매핑. (2) **Named 인자** — `db.NamedExec("INSERT INTO users (name) VALUES (:name)", user)`. (3) **인라인 매핑** — `db.Get(&user, "SELECT * FROM users WHERE id=?", 1)`. (4) **IN 쿼리** — `db.In("SELECT * FROM users WHERE id IN (?)", ids)`. sqlx는 database/sql을 대체하지 않고 확장하므로, 기존 database/sql 코드와 함께 사용할 수 있습니다. SQLC와 달리 런타임 매핑이므로 타입 안전성은 SQLC가 더 높습니다.
</details>

<details>
<summary><strong>Q: 마이그레이션은 어떻게 관리하나요?</strong></summary>

Go에서 가장 널리 사용되는 마이그레이션 도구는 `golang-migrate/migrate`와 `pressly/goose`입니다. 기본 패턴: (1) 각 마이그레이션은 `timestamp_description.up.sql`(변경 적용)과 `timestamp_description.down.sql`(변경 롤백) 파일 쌍으로 구성됩니다. (2) `migrate up`으로 적용되지 않은 마이그레이션을 순차적으로 실행합니다. (3) `migrate down`으로 마지막 마이그레이션을 롤백합니다. (4) 마이그레이션 상태는 데이터베이스의 `schema_migrations` 테이블에 기록됩니다. 마이그레이션은 버전 관리되어야 하며, 절대 수정하면 안 됩니다. 새로운 수정은 새로운 마이그레이션 파일로 추가합니다.
</details>

## 요약

| 개념 | 설명 | 주요 설정 |
|------|------|----------|
| **sql.DB** | 연결 풀 | SetMaxOpenConns, SetMaxIdleConns |
| **Query/QueryRow** | 쿼리 실행 | Rows 스트리밍, Scan으로 읽기 |
| **sql.Tx** | 트랜잭션 | Begin/Commit/Rollback, 격리 수준 |
| **Prepare** | 준비된 문 | 쿼리 계획 재사용, SQL 인젝션 방지 |
| **SQLC** | 코드 생성 | SQL → 타입 안전 Go 함수 |
| **golang-migrate** | 마이그레이션 | up/down SQL 파일, 버전 관리 |

## 다음 수업

다음 글에서는 Go 아키텍처와 디자인 패턴 — 클린 아키텍처, 의존성 주입, 모듈화를 배웁니다.
