---
layout: post
title: "Kotlin Ktor 웹 프레임워크 — HTTP 서버, 라우팅, 플러그인, 콘텐트 협상"
description: "Kotlin의 Ktor 웹 프레임워크를 실무 레벨에서 학습합니다. Ktor는 경량화된 비동기 웹 프레임워크로 코루틴을 기반으로 합니다. HTTP 서버는 embeddedServer로 시작하며 Netty 엔진을 사용합니다. 라우팅은 routing 플러그인으로 URL 패턴을 핸들러에 매핑하며 get, post, put, delete 등을 지원합니다. 플러그인은 기능을 모듈화하며 ContentNegotiation, StatusPages, CallLogging 등을 제공합니다. 콘텐트 협상은 JSON, XML 등의 콘텐트 타입을 자동으로 변환합니다. Ktor는 유연하고 확장 가능한 아키텍처를 제공합니다."
date: 2025-10-29 10:00:00 +0900
category: kotlin
tags: [kotlin, ktor, web-framework, http-server, routing, plugins, content-negotiation]
level: advanced
---

Ktor는 Kotlin으로 작성된 경량화된 비동기 웹 프레임워크로 코루틴을 기반으로 합니다.

> **핵심 정리** · `embeddedServer`로 HTTP 서버를 시작합니다. `routing` 플러그인으로 URL을 핸들러에 매핑합니다. `ContentNegotiation`으로 콘텐트 협상을 수행합니다. 플러그인으로 기능을 모듈화합니다. 코루틴을 기반으로 비동기 처리를 제공합니다. 유연하고 확장 가능합니다.


## 수업 목표

- Ktor의 구조를 이해합니다.
- HTTP 서버를 시작할 수 있습니다.
- 라우팅을 이해하고 사용할 수 있습니다.
- 플러그인을 이해합니다.
- 콘텐트 협상을 이해합니다.
- Ktor의 아키텍처를 이해합니다.

## 프로젝트 설정

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.0"
    application
}

dependencies {
    implementation("io.ktor:ktor-server-core:2.3.0")
    implementation("io.ktor:ktor-server-netty:2.3.0")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.0")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.5.1")
}

application {
    mainClass.set("ApplicationKt")
}
```

Ktor 프로젝트는 Gradle로 설정합니다. `ktor-server-core`, `ktor-server-netty` 등의 의존성을 추가합니다. `kotlinx.serialization`으로 JSON 직렬화를 지원합니다.

## HTTP 서버

```kotlin
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun main() {
    embeddedServer(Netty, port = 8080) {
        routing {
            get("/") {
                call.respondText("Hello, Ktor!")
            }
        }
    }.start(wait = true)
}
```

`embeddedServer`로 HTTP 서버를 시작합니다. `Netty` 엔진을 사용합니다. `routing`으로 라우트를 정의합니다. `get`으로 GET 요청을 처리합니다.

## 라우팅

```kotlin
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.server.request.*

routing {
    get("/") {
        call.respondText("Hello, Ktor!")
    }

    get("/users/{id}") {
        val id = call.parameters["id"]
        call.respondText("User ID: $id")
    }

    post("/users") {
        val body = call.receiveText()
        call.respondText("Created: $body")
    }

    put("/users/{id}") {
        val id = call.parameters["id"]
        val body = call.receiveText()
        call.respondText("Updated: $id, $body")
    }

    delete("/users/{id}") {
        val id = call.parameters["id"]
        call.respondText("Deleted: $id")
    }
}
```

`routing`으로 URL 패턴을 핸들러에 매핑합니다. `get`, `post`, `put`, `delete`로 HTTP 메서드를 지정합니다. `{id}`로 경로 매개변수를 정의합니다. `call.parameters`로 매개변수를 가져옵니다.

## 플러그인

```kotlin
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.http.*
import io.ktor.server.response.*

fun Application.configurePlugins() {
    install(ContentNegotiation) {
        json()
    }

    install(CallLogging) {
        level = org.slf4j.event.Level.INFO
    }

    install(StatusPages) {
        exception<Exception> { call, cause ->
            call.respond(HttpStatusCode.InternalServerError, cause.message ?: "Error")
        }
    }
}
```

`install`로 플러그인을 설치합니다. `ContentNegotiation`으로 콘텐트 협상을 설정합니다. `CallLogging`으로 요청 로깅을 설정합니다. `StatusPages`로 예외 처리를 설정합니다.

## 콘텐트 협상

```kotlin
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable

@Serializable
data class User(val id: Int, val name: String)

fun Application.configureContentNegotiation() {
    install(ContentNegotiation) {
        json()
    }
}

routing {
    get("/users") {
        val users = listOf(
            User(1, "Alice"),
            User(2, "Bob")
        )
        call.respond(users)
    }

    post("/users") {
        val user = call.receive<User>()
        call.respond(HttpStatusCode.Created, user)
    }
}
```

`ContentNegotiation`으로 JSON, XML 등의 콘텐트 타입을 자동으로 변환합니다. `@Serializable`로 직렬화를 지정합니다. `call.respond`으로 객체를 반환합니다. `call.receive`로 요청 바디를 파싱합니다.

## 정적 파일

```kotlin
import io.ktor.server.plugins.staticfiles.*
import io.ktor.http.*
import java.io.File

fun Application.configureStaticFiles() {
    install(StaticFiles) {
        files("static")
        default("index.html")
    }
}

routing {
    static("/static") {
        resources("static")
    }
}
```

`StaticFiles` 플러그인으로 정적 파일을 제공합니다. `files`로 디렉토리를 지정합니다. `resources`로 리소스 폴더에서 파일을 제공합니다. CSS, JS, 이미지 등을 제공할 때 사용합니다.

## 세션

```kotlin
import io.ktor.server.sessions.*
import io.ktor.util.*
import java.io.File

data class UserSession(val id: String, val name: String) : Principal

fun Application.configureSessions() {
    install(Sessions) {
        cookie<UserSession>("SESSION") {
            cookie.path = "/"
            cookie.maxAgeInSeconds = 3600
        }
    }
}

routing {
    get("/login") {
        val session = call.sessions.get<UserSession>()
        if (session != null) {
            call.respondText("Logged in as ${session.name}")
        } else {
            call.sessions.set(UserSession("1", "Wolhyong"))
            call.respondText("Logged in")
        }
    }

    get("/logout") {
        call.sessions.clear<UserSession>()
        call.respondText("Logged out")
    }
}
```

`Sessions` 플러그인으로 세션을 관리합니다. 쿠키 기반 세션을 제공합니다. `call.sessions.get`으로 세션을 가져옵니다. `call.sessions.set`으로 세션을 설정합니다.

## 인증

```kotlin
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

fun Application.configureAuthentication() {
    install(Authentication) {
        jwt("auth-jwt") {
            realm = "ktor sample"
            verifier(
                JWTVerifier.create()
                    .withAudience("ktor-audience")
                    .withIssuer("ktor-issuer")
                    .build()
            )
            validate { credential ->
                if (credential.payload.audience.contains("ktor-audience")) {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }
        }
    }
}

routing {
    authenticate("auth-jwt") {
        get("/protected") {
            val principal = call.principal<JWTPrincipal>()
            call.respondText("Protected: ${principal?.payload?.subject}")
        }
    }
}
```

`Authentication` 플러그인으로 인증을 설정합니다. JWT 인증을 지원합니다. `authenticate`로 보호된 라우트를 정의합니다. `call.principal`으로 인증 정보를 가져옵니다.

## 데이터베이스

```kotlin
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

object Users : Table() {
    val id = integer("id").autoIncrement()
    val name = varchar("name", length = 50)
    override val primaryKey = PrimaryKey(id)
}

fun Application.configureDatabase() {
    Database.connect("jdbc:h2:mem:test", driver = "org.h2.Driver")
    transaction {
        SchemaUtils.create(Users)
        Users.insert {
            it[name] = "Wolhyong"
        }
    }
}

routing {
    get("/users") {
        val users = transaction {
            Users.selectAll().map {
                User(it[Users.id], it[Users.name])
            }
        }
        call.respond(users)
    }
}
```

Exposed로 데이터베이스를 연결합니다. `Database.connect`로 연결을 설정합니다. `transaction`으로 트랜잭션을 시작합니다. `SchemaUtils.create`로 테이블을 생성합니다.

## WebSocket

```kotlin
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import java.time.Duration

fun Application.configureWebSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(15)
        timeout = Duration.ofSeconds(15)
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }
}

routing {
    webSocket("/chat") {
        send(Frame.Text("Welcome!"))
        for (frame in incoming) {
            when (frame) {
                is Frame.Text -> {
                    val text = frame.readText()
                    send(Frame.Text("Echo: $text"))
                }
                else -> {}
            }
        }
    }
}
```

`WebSockets` 플러그인으로 WebSocket을 지원합니다. `webSocket`으로 WebSocket 라우트를 정의합니다. `send`, `incoming`으로 메시지를 주고받습니다. 실시간 통신에 사용됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> Ktor와 Spring Boot 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

Ktor는 경량화된 마이크로서비스에 적합합니다. 코루틴 기반으로 비동기 처리가 우수합니다. Spring Boot는 엔터프라이즈 애플리케이션에 적합합니다. 풍부한 생태계와 DI를 제공합니다. 프로젝트 요구사항에 따라 선택합니다.
</details>

<details>
<summary><strong>Q> Netty와 CIO 엔진 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

Netty를 우선 사용해야 합니다. 높은 성능과 확장성을 제공합니다. CIO는 간단한 애플리케이션에 적합합니다. 대부분의 경우 Netty를 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> ContentNegotiation은 언제 사용해야 하나요?</strong></summary>

`ContentNegotiation`은 RESTful API에 사용합니다. JSON, XML 등의 콘텐트 타입을 자동으로 변환합니다. 클라이언트와 서버 간의 콘텐트 협상을 간소화합니다. 웹 API에 필수적입니다.
</details>

<details>
<summary><strong>Q> 플러그인은 언제 사용해야 하나요?</strong></summary>

플러그인은 기능을 모듈화할 때 사용합니다. 로깅, 인증, 세션 등을 플러그인으로 구현합니다. 재사용 가능한 컴포넌트를 만들 수 있습니다. Ktor의 핵심 개념입니다.
</details>

<details>
<summary><strong>Q> routing은 언제 사용해야 하나요?</strong></summary>

`routing`은 URL 패턴을 핸들러에 매핑할 때 사용합니다. RESTful API, 웹 페이지 등에 사용됩니다. 모든 HTTP 요청을 처리하는 데 필수적입니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Ktor** | 웹 프레임워크 | 코루틴 기반 |
| **embeddedServer** | HTTP 서버 시작 | Netty 엔진 |
| **routing** | URL 매핑 | get, post |
| **플러그인** | 기능 모듈화 | install |
| **ContentNegotiation** | 콘텐트 협상 | JSON 변환 |
| **StaticFiles** | 정적 파일 | CSS, JS |
| **Sessions** | 세션 관리 | 쿠키 기반 |
| **Authentication** | 인증 | JWT |
| **WebSockets** | 실시간 통신 | WebSocket |
| **Exposed** | ORM | 데이터베이스 |
| **Netty** | 엔진 | 고성능 |
| **CIO** | 엔진 | 간단함 |
| **call.parameters** | 경로 매개변수 | {id} |


## 다음 수업

다음 글에서는 Kotlin 고급 — 테스트, 단위 테스트, 통합 테스트, MockK를 배웁니다.
