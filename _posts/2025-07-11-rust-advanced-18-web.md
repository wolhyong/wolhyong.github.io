---
layout: post
title: "Rust 웹 프로그래밍 — Actix-web, Axum, HTTP 서버, 핸들러, 미들웨어, 상태 관리"
description: "Rust의 웹 프로그래밍 생태계를 실무 레벨에서 학습합니다. Actix-web은 고성능 웹 프레임워크로 액터 모델 기반 동시성을 제공하며 핸들러, 라우팅, 미들웨어를 지원합니다. Axum은 Tokio 기반 현대적 웹 프레임워크로 타입 안전한 라우팅과 추출器(extractor)를 제공합니다. HTTP 서버는 TcpListener로 연결을 수락하고 비동기로 요청을 처리합니다. 핸들러는 요청을 처리하고 응답을 반환하며 경로 매개변수, 쿼리 파라미터, JSON 바디를 추출할 수 있습니다. 미들웨어는 요청/응답 처리 파이프라인에 로깅, 인증, CORS 등을 추가합니다. 상태 관리는 AppState로 데이터베이스 풀, 설정 등을 공유합니다."
date: 2025-07-11 10:00:00 +0900
category: rust
tags: [rust, web, actix-web, axum, http-server, middleware, handlers]
level: advanced
---

Rust의 웹 프레임워크는 타입 안전성과 고성능을 동시에 제공하며 현대적 웹 애플리케이션을 구축할 수 있습니다.

> **핵심 정리** · Actix-web은 액터 모델 기반 고성능 웹 프레임워크입니다. Axum은 Tokio 기반 현대적 프레임워크로 타입 안전한 라우팅을 제공합니다. 핸들러는 요청을 처리하고 응답을 반환합니다. 미들웨어는 로깅, 인증 등을 추가합니다. AppState로 데이터베이스 풀 등을 공유합니다.


## 수업 목표

- Actix-web과 Axum의 차이를 이해합니다.
- HTTP 서버를 구축할 수 있습니다.
- 핸들러와 라우팅을 작성할 수 있습니다.
- 미들웨어를 구성할 수 있습니다.
- 상태 관리를 구현할 수 있습니다.
- JSON 직렬화/역직렬화를 이해합니다.

## Actix-web

```toml
# Cargo.toml
[dependencies]
actix-web = "4"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

```rust
use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct Response {
    message: String,
}

async fn index() -> impl Responder {
    HttpResponse::Ok().json(Response {
        message: String::from("Hello, Actix-web!"),
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(index))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

Actix-web은 액터 모델 기반 웹 프레임워크로 높은 성능을 제공합니다. `HttpServer`로 서버를 시작하고 `App::new()`로 애플리케이션을 구성합니다. `route()`로 경로를 등록하고 핸들러를 연결합니다.

### 경로 매개변수

```rust
use actix_web::{web, App, HttpServer, HttpResponse, Path};

async fn user_info(path: Path<(u32,)>) -> HttpResponse {
    let user_id = path.into_inner().0;
    HttpResponse::Ok().body(format!("User ID: {}", user_id))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/user/{id}", web::get().to(user_info))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

`{id}` 같은 경로 매개변수를 추출할 수 있습니다. `Path<(u32,)>`로 타입을 지정하면 자동으로 파싱됩니다. 여러 매개변수는 `Path<(u32, String)>`처럼 튜플로 추출합니다.

### 쿼리 파라미터

```rust
use actix_web::{web, HttpResponse};
use serde::Deserialize;

#[derive(Deserialize)]
struct QueryParams {
    page: Option<u32>,
    limit: Option<u32>,
}

async fn search(query: web::Query<QueryParams>) -> HttpResponse {
    HttpResponse::Ok().json(query.into_inner())
}
```

`web::Query<T>`로 쿼리 파라미터를 추출합니다. `Deserialize` 트레이트를 구현한 구조체로 자동 파싱됩니다. `Option` 타입으로 선택적 파라미터를 처리할 수 있습니다.

### JSON 요청

```rust
use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CreateUser {
    username: String,
    email: String,
}

#[derive(Serialize)]
struct User {
    id: u32,
    username: String,
    email: String,
}

async fn create_user(user: web::Json<CreateUser>) -> HttpResponse {
    HttpResponse::Ok().json(User {
        id: 1,
        username: user.username.clone(),
        email: user.email.clone(),
    })
}
```

`web::Json<T>`로 JSON 바디를 추출합니다. `Deserialize` 트레이트로 자역직렬화됩니다. `Json` 타입은 `Deref`를 구현하므로 내부 값에 접근할 수 있습니다.

## Axum

```toml
# Cargo.toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

```rust
use axum::{
    routing::get,
    Router,
    Json,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct Response {
    message: String,
}

async fn index() -> Json<Response> {
    Json(Response {
        message: String::from("Hello, Axum!"),
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(index));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

Axum은 Tokio 기반 현대적 웹 프레임워크입니다. `Router`로 라우팅을 구성하고 `axum::serve`로 서버를 시작합니다. 타입 안전한 추출器(extractor)를 제공합니다.

### 추출器

```rust
use axum::{
    extract::{Path, Query},
    Json,
    routing::get,
    Router,
};
use serde::Deserialize;

#[derive(Deserialize)]
struct QueryParams {
    page: Option<u32>,
}

async fn user(
    Path(id): Path<u32>,
    Query(params): Query<QueryParams>,
) -> String {
    format!("User ID: {}, Page: {:?}", id, params.page)
}
```

Axum의 추출器는 튜플 패턴으로 여러 추출을 결합할 수 있습니다. `Path<T>`, `Query<T>`, `Json<T>` 등이 제공됩니다. 타입 시스템으로 안전하게 추출됩니다.

### 상태 관리

```rust
use axum::{
    extract::State,
    routing::get,
    Router,
};
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    counter: Arc<std::sync::atomic::AtomicU32>,
}

async fn increment(State(state): State<AppState>) -> String {
    let count = state.counter.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    format!("Count: {}", count)
}

#[tokio::main]
async fn main() {
    let state = AppState {
        counter: Arc::new(std::sync::atomic::AtomicU32::new(0)),
    };

    let app = Router::new()
        .route("/increment", get(increment))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

`with_state()`로 상태를 라우터에 추가합니다. `State<T>` 추출器로 핸들러에서 상태에 접근할 수 있습니다. `Clone`을 구현해야 하며 `Arc`로 공유 상태를 관리합니다.

## 미들웨어

```rust
use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, Transform},
    Error,
};
use futures::future::{ready, Ready};

pub struct LoggingMiddleware;

impl<S, B> Transform<S, ServiceRequest> for LoggingMiddleware
where
    S: Service<ServiceRequest, Response = B, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = B;
    type Error = Error;
    type Transform = LoggingMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(LoggingMiddlewareService { service }))
    }
}

pub struct LoggingMiddlewareService<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for LoggingMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = B, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = B;
    type Error = Error;
    type Future = S::Future;

    fn poll_ready(&self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        println!("Request: {}", req.path());
        self.service.call(req)
    }
}
```

미들웨어는 요청/응답 처리 파이프라인에 로직을 추가합니다. `Transform` 트레이트를 구현하여 미들웨어를 정의합니다. 로깅, 인증, CORS 등에 사용됩니다.

## 에러 처리

```rust
use actix_web::{error::ResponseError, http::StatusCode, HttpResponse};
use serde::Serialize;

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

#[derive(Debug)]
struct MyError {
    message: String,
}

impl ResponseError for MyError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code())
            .json(ErrorResponse {
                error: self.message.clone(),
            })
    }

    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
}
```

`ResponseError` 트레이트를 구현하여 커스텀 에러를 정의할 수 있습니다. `error_response()`로 에러 응답을 생성하고 `status_code()`로 HTTP 상태 코드를 지정합니다.

## 데이터베이스 연결

```rust
use sqlx::{PgPool, postgres::PgPoolOptions};
use actix_web::{web, App, HttpServer};

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

async fn get_users(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, sqlx::Error> {
    let users = sqlx::query!("SELECT id, username FROM users")
        .fetch_all(pool.get_ref())
        .await?;

    Ok(HttpResponse::Ok().json(users))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://user:password@localhost/db")
        .await
        .unwrap();

    let app_state = AppState { db: pool };

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(app_state.clone()))
            .route("/users", web::get().to(get_users))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

`web::Data<T>`로 데이터베이스 풀 등을 공유합니다. `sqlx`는 컴파일 타임 쿼리 검사를 제공하는 비동기 SQL 라이브러리입니다. 연결 풀을 사용하여 효율적으로 데이터베이스 연결을 관리합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> Actix-web과 Axum 중 어떤 것을 사용해야 하나요?</strong></summary>

Actix-web은 액터 모델 기반으로 성능이 뛰어나며 생태계가 성숙했습니다. Axum은 Tokio 기반으로 타입 안전성이 높고 현대적입니다. Actix-web은 더 많은 기능을 제공하지만 Axum은 더 간결하고 타입 안전합니다. Rust 웹 개발 경험이 없다면 Axum을 시작하고, 성능이 중요하면 Actix-web을 고려합니다.
</details>

<details>
<summary><strong>Q> 왜 Rust 웹 프레임워크는 비동기인가요?</strong></summary>

웹 애플리케이션은 I/O 바운드 작업이 많습니다. 비동기 모델은 단일 스레드로 수천 개의 동시 연결을 처리할 수 있어 효율적입니다. 스레드 기반 모델은 스레드 생성 비용이 높고 컨텍스트 스위칭 오버헤드가 있습니다. Rust의 비동기 모델은 제로-cost 추상화로 동기 코드와 동일한 성능을 보장합니다.
</details>

<details>
<summary><strong>Q> 상태 관리는 어떻게 구현하나요?</summary></summary>

상태는 `AppState` 구조체에 정의하고 라우터에 추가합니다. Actix-web은 `web::Data<T>`, Axum은 `with_state()`와 `State<T>` 추출器를 사용합니다. `Clone`을 구현해야 하며 `Arc`로 공유 상태를 관리합니다. 데이터베이스 풀, 설정, 캐시 등을 공유할 수 있습니다.
</details>

<details>
<summary><strong>Q> 미들웨어는 어떻게 작성하나요?</summary></summary>

미들웨어는 `Transform` 트레이트를 구현하여 작성합니다. 요청 전후에 로직을 추가할 수 있습니다. 로깅, 인증, CORS, 압축 등에 사용됩니다. Actix-web과 Axum은 다른 미들웨어 API를 제공하지만 개념은 유사합니다. 간단한 미들웨어는 프레임워크가 제공하는 내장 미들웨어를 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q> JSON 직렬화는 어떻게 처리하나요?</summary></summary>

`serde`와 `serde_json`을 사용하여 JSON 직렬화/역직렬화를 처리합니다. 구조체에 `#[derive(Serialize, Deserialize)]` 속성을 추가하면 자동으로 구현됩니다. `web::Json<T>`(Actix-web) 또는 `Json<T>`(Axum) 추출器로 자동 파싱됩니다. 타입 안전하고 빠릅니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Actix-web** | 액터 모델 프레임워크 | 고성능, 성숙한 생태계 |
| **Axum** | Tokio 기반 프레임워크 | 타입 안전, 현대적 |
| **핸들러** | 요청 처리 함수 | async fn으로 정의 |
| **라우팅** | 경로 등록 | 경로 매개변터 추출 |
| **추출器** | 요청 데이터 추출 | 타입 안전 |
| **미들웨어** | 파이프라인 로직 | 로깅, 인증 등 |
| **상태 관리** | 데이터 공유 | AppState, Arc |
| **에러 처리** | ResponseError 트레이트 | 커스텀 에러 |
| **JSON** | serde로 직렬화 | 자동 파싱 |


## 다음 수업

다음 글에서는 Rust 고급 — 데이터베이스, SQLx, Diesel ORM, 마이그레이션을 배웁니다.
