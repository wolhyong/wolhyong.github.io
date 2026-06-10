---
layout: post
title: "Go 아키텍처와 디자인 패턴 — 클린 아키텍처, 의존성 주입, 레이어드 아키텍처, 모듈화 전략"
description: "Go 애플리케이션의 아키텍처 설계와 디자인 패턴을 실무 레벨에서 학습합니다. 클린 아키텍처(Clean Architecture)의 의존성 규칙(Dependency Rule) — 외부 계층(인프라)이 내부 계층(비즈니스 로직)에 의존하고 내부는 외부를 절대 알지 못하는 구조를 Go 인터페이스로 구현하는 방식, 레이어드 아키텍처(Layered Architecture)에서 핸들러(Handler) → 서비스(Service) → 리포지토리(Repository)의 3계층 분리와 각 계층의 책임, 의존성 주입(Dependency Injection)을 생성자 함수를 통해 명시적으로 구현하고 Wire와 같은 DI 도구를 사용하는 방법, 도메인 주도 설계(DDD)의 핵심 개념(Entity, Value Object, Repository, Use Case)을 Go 패키지 구조에 적용하는 방식, Go 1.18+의 제네릭을 활용한 리포지토리 패턴 구현, 표준 Go 프로젝트 레이아웃(golang-standards/project-layout)과 모듈화 전략(/internal 패키지로 외부 노출 차단), 마이크로서비스 아키텍처에서 Go의 HTTP/gRPC 통신 패턴을 다룹니다."
date: 2025-05-26 10:00:00 +0900
category: go
tags: [go, golang, architecture, clean-architecture, dependency-injection, ddd, project-layout, microservices, design-patterns]
level: advanced
---

Go 아키텍처는 단순성과 명확성을 유지하면서 확장 가능한 구조를 제공합니다.

> **핵심 정리** · 클린 아키텍처는 의존성 규칙으로 외부(인프라)가 내부(비즈니스)에 의존하게 합니다. 3계층 아키텍처(Handler → Service → Repository)가 가장 일반적입니다. 의존성 주입은 생성자 함수로 명시적으로 구현합니다. `/internal` 패키지로 외부 노출을 차단합니다. 인터페이스는 소비자(consumer)가 정의합니다. Go의 디자인 패턴은 단순함(simplicity)을 최우선으로 합니다.

## 수업 목표

- 클린 아키텍처의 의존성 규칙을 이해합니다.
- 레이어드 아키텍처의 각 계층 책임을 이해합니다.
- 의존성 주입 패턴을 구현할 수 있습니다.
- Go 프로젝트 레이아웃과 모듈화 전략을 이해합니다.
- 인터페이스 정의 위치와 시점을 이해합니다.

## 프로젝트 레이아웃

```
myapp/
├── cmd/
│   └── server/
│       └── main.go          # 진입점 (가장 얇게)
├── internal/
│   ├── domain/              # 핵심 비즈니스 엔티티
│   │   ├── user.go          # User 엔티티
│   │   └── errors.go        # 도메인 에러
│   ├── usecase/             # 애플리케이션 유즈케이스
│   │   ├── user_usecase.go  # 비즈니스 로직
│   │   └── interfaces.go    # 필요한 인터페이스 정의
│   ├── repository/          # 데이터 접근 계층
│   │   └── user_repo.go     # 실제 구현
│   └── handler/             # HTTP/gRPC 핸들러
│       ├── user_handler.go  # 요청/응답 처리
│       └── router.go        # 라우팅
├── pkg/                     # 외부에 공개 가능한 라이브러리
│   └── middleware/
├── migrations/              # DB 마이그레이션
├── config/
│   └── config.go
├── go.mod
└── go.sum
```

`/cmd/server/main.go`는 애플리케이션의 진입점으로, 의존성을 생성하고 주입하는 역할만 담당합니다(main 함수는 가능한 한 얇게 유지). `/internal` 패키지는 Go 컴파일러가 외부에서의 import를 차단하므로, 내부 구현을 캡슐화하는 데 사용합니다. `/domain`은 비즈니스 엔티티(Entity)와 값 객체(Value Object)를 정의합니다. `/usecase`는 애플리케이션의 비즈니스 로직을 구현하고, 필요한 인터페이스를 정의합니다. `/repository`는 데이터 접근을 구현하고, `/handler`는 HTTP/gRPC 요청을 처리합니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 클린 아키텍처의 의존성 규칙은 Go에서 어떻게 적용하나요?</strong></summary>

클린 아키텍처의 핵심 규칙: **의존성은 항상 외부에서 내부로 향해야 합니다**. Go에서 이는 다음과 같이 구현됩니다: (1) `domain` 계층은 아무것도 의존하지 않습니다(순수 Go 구조체와 인터페이스만). (2) `usecase` 계층은 `domain`에만 의존하고, 자신이 필요한 인터페이스를 정의합니다(Repository, Presenter 등). (3) `repository` 계층은 `usecase`에 정의된 인터페이스를 구현합니다. (4) `handler` 계층은 `usecase`에 의존합니다. (5) `main` 함수에서 모든 의존성을 생성하고 주입합니다(컴포지션 루트). Go의 인터페이스는 이 패턴에 완벽히 맞습니다: 소비자(usecase)가 인터페이스를 정의하고, 제공자(repository)가 이를 구현합니다.
</details>

<details>
<summary><strong>Q: 의존성 주입(DI)은 어떻게 구현하나요?</strong></summary>

Go에서 DI는 생성자 함수 패턴으로 구현합니다: `func NewUserService(repo UserRepository, logger Logger) *UserService`. 주요 방식: (1) **수동 DI** — main 함수에서 일일이 생성하고 주입. 간단하고 명시적이며 디버깅이 쉽습니다. (2) **Wire** — Google의 DI 도구로, 코드 생성으로 의존성 그래프를 자동 생성합니다. 컴파일 타임에 의존성 누락을 검출합니다. (3) **Dig/Inject** — Uber의 DI 라이브러리로, 리플렉션 기반 런타임 DI를 제공합니다. Go 커뮤니티는 수동 DI를 선호하는 경향이 있습니다. 수동 DI는 명시적이고, 컴파일 타임 안전하며, 디버깅이 쉽습니다. 프로젝트가 커지면 Wire가 효과적입니다.
</details>

<details>
<summary><strong>Q: Go 인터페이스는 어디에 정의해야 하나요?</strong></summary>

Go의 원칙: **인터페이스는 소비자(사용하는 쪽)에서 정의합니다**. 즉, 인터페이스는 제공자(구현하는 쪽)가 아닌, 사용자가 그들의 필요에 따라 정의합니다. 예를 들어: (1) `UserService`가 데이터 저장이 필요하면 `UserRepository` 인터페이스를 `usecase` 패키지에서 정의합니다. (2) `repository` 패키지는 이 인터페이스를 구현합니다. (3) `repository` 패키지는 자체 인터페이스를 정의하지 않습니다(필요 시 별도로 정의). 이 방식은 인터페이스가 불필요하게 커지는 것을 방지하고(Interface Segregation), 각 사용처에 정확히 필요한 메서드만 정의하게 합니다. 표준 라이브러리의 `io.Reader`도 이 원칙을 따릅니다.
</details>

<details>
<summary><strong>Q: Go 프로젝트에서 패키지 구조의 모범 사례는 무엇인가요?</strong></summary>

Go 패키지 구조의 모범 사례: (1) **패키지 이름은 의미 있고 짧게** — `user`, `order`, `payment`. `utils`, `common`, `helpers`는 피하세요(잡동사니 상자가 됩니다). (2) **순환 의존성 금지** — Go 컴파일러가 순환 import를 금지합니다. 필요한 경우 인터페이스로 분리합니다. (3) **내부 패키지로 캡슐화** — `/internal`은 외부 접근을 차단합니다. (4) **도메인 중심 구조** — 기술 계층(controllers, models, views)보다 도메인 패키지(users, products)를 우선합니다. (5) **init() 함수 최소화** — 명시적 초기화가 더 예측 가능합니다. (6) **인터페이스는 작게** — 단일 메서드 인터페이스가 가장 유연합니다. "A little copying is better than a little dependency"가 Go의 원칙입니다.
</details>

<details>
<summary><strong>Q: DDD(Domain-Driven Design)를 Go에 어떻게 적용하나요?</strong></summary>

DDD를 Go에 적용하는 방법: (1) **Entity** — 고유 식별자(ID)를 가진 도메인 객체. Go 구조체로 표현. (2) **Value Object** — 속성으로 식별되는 불변 객체. `type Money struct { Amount Decimal; Currency string }`. (3) **Repository** — 엔티티의 저장/조회를 추상화하는 인터페이스. (4) **Use Case** — 애플리케이션의 비즈니스 로직을 담은 서비스. (5) **Domain Event** — 도메인에서 발생한 중요한 사건. Go에서는 인터페이스와 구조체로 모든 DDD 개념을 구현할 수 있습니다. 중요한 것은 DDD 패턴을 억지로 적용하지 않고, 도메인의 복잡성이 필요로 할 때만 사용하는 것입니다. DDD는 복잡한 비즈니스 로직에 적합하고, CRUD 위주의 단순한 애플리케이션에는 오버엔지니어링입니다.
</details>

## 요약

| 개념 | 설명 | Go 구현 |
|------|------|--------|
| **클린 아키텍처** | 의존성 규칙 | 내부(domain) ← 외부(handler) |
| **레이어드 아키텍처** | 3계층 분리 | Handler → Service → Repository |
| **의존성 주입** | 생성자 주입 | `NewX(a A, b B) *X` 패턴 |
| **/internal** | 외부 노출 차단 | Go 컴파일러가 import 차단 |
| **인터페이스 위치** | 소비자 정의 | usecase 패키지에서 정의 |
| **프로젝트 레이아웃** | 표준 구조 | cmd/internal/pkg/p 로 구분 |

## 다음 수업

다음 글에서는 Go 마이크로서비스와 배포 — gRPC 서비스, Docker 컨테이너화, 쿠버네티스 배포를 배웁니다.
