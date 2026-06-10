---
layout: post
title: "Rust 언어 소개 — Mozilla가 설계한 메모리 안전 시스템 프로그래밍 언어의 철학과 컴파일러 구조"
description: "Rust 언어의 탄생 배경과 설계 철학, 컴파일러 구조를 시스템 레벨에서 학습합니다. Graydon Hoare가 2006년부터 개발을 시작하여 Mozilla에서 2010년에 공식 발표한 Rust는 C++의 메모리 안전성 문제를 해결하기 위해 설계되었습니다. Rust 컴파일러(rustc)는 소스 코드를 lexing하고 파싱하여 HIR(Higher IR) → MIR(Mid IR) → LLVM IR로 변환한 후 네이티브 머신 코드로 컴파일합니다. 소유권(Ownership), 대여(Borrowing), 수명(Lifetime) 시스템이 컴파일 타임에 메모리 안전성을 보장하는 방식을 다룹니다. cargo new/cargo build/cargo run/cargo test 등의 도구 체인과 crates.io 생태계를 설명합니다. Rust의 Zero-cost abstractions 원칙과 안전한 동시성 모델을 설명합니다."
date: 2025-06-02 10:00:00 +0900
category: rust
tags: [rust, ownership, borrowing, memory-safety, mozilla, compiler, llvm, cargo]
level: basic
---

Rust는 Graydon Hoare가 2006년부터 개발을 시작하여 Mozilla에서 2010년에 공식 발표한 시스템 프로그래밍 언어입니다. "메모리 안전성과 동시성"을 최우선 설계 목표로 합니다.

> **핵심 정리** · Rust 컴파일러(rustc)는 소스 코드를 lexing → parsing → HIR → MIR → LLVM IR → 네이티브 코드 순서로 AOT 컴파일합니다. 소유권(Ownership) 시스템이 컴파일 타임에 메모리 안전성을 보장하여 가비지 컬렉터 없이도 메모리 누수와 댕글링 포인터를 방지합니다. cargo는 빌드, 테스트, 의존성 관리를 통합하는 도구입니다.


## 수업 목표

- Rust의 탄생 배경과 설계 철학을 이해합니다.
- Rust 컴파일러의 AOT 컴파일 과정을 이해합니다.
- 소유권, 대여, 수명 시스템의 개념을 이해합니다.
- cargo 도구 체인의 동작을 이해합니다.
- Hello World를 작성하고 실행할 수 있습니다.

## Rust의 탄생 배경과 설계 철학

Rust는 2006년 Graydon Hoare의 개인 프로젝트로 시작되어, 2009년 Mozilla에서 후원을 받고 2010년에 공식 발표되었습니다. 당시 Mozilla는 Firefox 브라우저의 C++ 코드베이스에서 메모리 안전성 버그가 지속적으로 발생하는 문제를 겪고 있었습니다.

| 문제 | 기존 언어(C/C++) | Rust의 해결책 |
|------|------------------|--------------|
| **메모리 안전성** | 수동 메모리 관리로 버퍼 오버플로우, 댕글링 포인터 발생 | 소유권 시스템으로 컴파일 타임에 안전성 보장 |
| **동시성** | 데이터 레이스(Data Race) 방지 어려움 | 타입 시스템 수준에서 데이터 레이스 방지 |
| **성능** | 가비지 컬렉터 오버헤드 또는 수동 관리 복잡성 | Zero-cost abstractions로 GC 없이도 고성능 |
| **에러 처리** | 예외 또는 에러 코드로 일관성 부족 | Result 타입으로 명시적 에러 처리 강제 |
| **의존성 관리** | 서드파티 패키지 매니저 부재 | cargo와 crates.io로 통합 생태계 |

### Hello World

```rust
// main.rs
fn main() {
    println!("Hello, Rust!");
    println!("안녕, Rust!");
}
```

`fn main()`은 프로그램의 진입점(entry point)입니다. Rust에서는 함수가 `fn` 키워드로 정의됩니다. `println!`은 매크로(macro)로, 문자열을 표준 출력에 쓰고 개행 문자를 추가합니다. 매크로는 `!`로 끝나는 식별자로 구분됩니다. `println!`은 `std::println` 매크로로, 컴파일 타임에 문자열 포맷팅 코드로 확장됩니다.

### Rust 도구 체인

```bash
# 프로젝트 생성
cargo new hello_rust

# 빌드
cargo build

# 실행 (빌드 후 실행)
cargo run

# 릴리즈 빌드 (최적화)
cargo build --release

# 테스트
cargo test

# 체크 (컴파일만 확인)
cargo check

# 문서 생성
cargo doc --open
```

`cargo new hello_rust`는 새로운 프로젝트 디렉토리를 생성하고 Git 초기화, `Cargo.toml` 설정 파일, `src/main.rs` 소스 파일을 생성합니다. `cargo build`는 `target/debug/` 디렉토리에 디버그 바이너리를 생성합니다. `cargo run`은 빌드 후 즉시 실행합니다. `cargo build --release`는 최적화된 릴리즈 바이너리를 `target/release/`에 생성합니다. `cargo test`는 프로젝트의 모든 테스트를 실행합니다. `cargo check`는 빌드 없이 컴파일 에러만 빠르게 확인합니다.

### Rust 프로젝트 구조

```
hello_rust/
├── Cargo.toml          # 패키지 매니페스트 (이름, 버전, 의존성)
├── Cargo.lock          # 의존성 버전 고정 (자동 생성)
└── src/
    └── main.rs         # 소스 파일
```

`Cargo.toml` 파일은 다음과 같은 구조입니다:

```toml
[package]
name = "hello_rust"
version = "0.1.0"
edition = "2021"

[dependencies]
```

`Cargo.lock`은 각 의존성의 정확한 버전을 기록하여 재현 가능한 빌드(reproducible build)를 보장합니다. Rust는 Semantic Versioning을 따르며, `^1.0.0` 표기는 1.0.0 이상 2.0.0 미만의 호환 가능한 버전을 의미합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Rust와 C의 주요 차이점은 무엇인가요?</strong></summary>

Rust와 C는 모두 시스템 프로그래밍 언어이지만 메모리 안전성에서 근본적인 차이가 있습니다: (1) **메모리 안전성**: Rust는 소유권 시스템으로 컴파일 타임에 메모리 안전성을 보장합니다. C는 수동 메모리 관리로 버퍼 오버플로우, 댕글링 포인터, 이중 해제 등의 버그가 발생할 수 있습니다. (2) **메모리 관리**: Rust는 소유권과 대여 규칙으로 명시적인 메모리 해제 없이도 안전하게 메모리를 관리합니다. C는 `malloc/free`를 수동으로 호출해야 합니다. (3) **동시성**: Rust는 타입 시스템 수준에서 데이터 레이스를 컴파일 타임에 방지합니다. C는 스레드 안전성을 프로그래머가 수동으로 보장해야 합니다. (4) **추상화 비용**: Rust의 Zero-cost abstractions 원칙으로 고수준 추상화도 C와 동일한 성능을 보장합니다. (5) **에코시스템**: Rust는 cargo와 crates.io로 통합된 패키지 관리 시스템을 제공합니다. C는 다양한 패키지 매니저가 존재하지만 표준이 없습니다.
</details>

<details>
<summary><strong>Q: Rust의 소유권(Ownership)이란 무엇인가요?</strong></summary>

소유권은 Rust의 핵심 메모리 관리 메커니즘입니다. 각 값은 소유자(owner)라고 불리는 변수를 정확히 하나 가집니다. 소유자가 스코프를 벗어나면 값은 자동으로 해제(dropped)됩니다. 이 규칙은 다음과 같습니다: (1) 각 값은 소유자가 정확히 하나입니다. (2) 소유자가 스코프를 벗어나면 값은 해제됩니다. (3) 소유권은 이동(move)될 수 있습니다. 예를 들어 `let s1 = String::from("hello"); let s2 = s1;`에서 `s1`의 소유권이 `s2`로 이동하므로 `s1`은 더 이상 유효하지 않습니다. 이 규칙은 컴파일 타임에 적용되어 런타임 오버헤드 없이 메모리 안전성을 보장합니다.
</details>

<details>
<summary><strong>Q: Rust가 가비지 컬렉터가 없는데 어떻게 메모리를 관리하나요?</strong></summary>

Rust는 소유권 시스템과 대여(Borrowing) 규칙으로 컴파일 타임에 메모리 수명을 추적합니다. 값이 스코프를 벗어날 때 컴파일러는 자동으로 `drop` 코드를 삽입하여 메모리를 해제합니다. 이는 RAII(Resource Acquisition Is Initialization) 패턴의 일반화입니다. 예를 들어 `let s = String::from("hello");`는 힙에 문자열 데이터를 할당하고, `s`가 스코프를 벗어날 때 `drop(s)`가 호출되어 메모리가 해제됩니다. 가비지 컬렉터와 달리 런타임 오버헤드가 없고, 수동 메모리 관리와 달리 해제를 잊을 위험이 없습니다.
</details>

<details>
<summary><strong>Q: cargo와 npm, pip의 차이는 무엇인가요?</strong></summary>

cargo는 Rust 전용 패키지 매니저이자 빌드 시스템입니다. npm(Node.js), pip(Python)과 비교할 때: (1) **통합성**: cargo는 빌드, 테스트, 문서 생성, 의존성 관리를 하나의 도구로 통합했습니다. npm/pip는 빌드 시스템이 별도로 필요할 수 있습니다. (2) **성능**: cargo는 Rust로 작성되어 매우 빠릅니다. (3) **재현 가능성**: `Cargo.lock` 파일으로 의존성 버전을 정확히 고정합니다. npm의 `package-lock.json`, pip의 `pip freeze`와 유사합니다. (4) **워크스페이스**: cargo는 멀티 패키지 프로젝트(워크스페이스)를 네이티브하게 지원합니다. (5) **컴파일 타임 의존성**: Rust는 컴파일 타임에 의존성을 링크하므로 런타임 의존성이 없습니다.
</details>

<details>
<summary><strong>Q: Rust의 Zero-cost abstractions 원칙은 무엇인가요?</strong></summary>

Zero-cost abstractions은 "사용하지 않는 추상화에 대한 비용을 지불하지 않는다"는 Rust의 핵심 원칙입니다. Bjarne Stroustrup(C++ 창시자)의 말에서 유래했습니다. 고수준 추상화(반복자, 클로저, 패턴 매칭 등)를 사용해도 컴파일러가 최적화를 통해 수동으로 작성한 저수준 코드와 동일한 기계어를 생성합니다. 예를 들어 반복자 체인 `iter().map().filter().collect()`는 루프 최적화(loop fusion)로 단일 루프로 컴파일될 수 있습니다. 이는 Rust가 LLVM 최적화를 활용하기 때문에 가능합니다.
</details>


## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **rustc 컴파일러** | 공식 Rust 컴파일러 | lexing → parsing → HIR → MIR → LLVM IR → 네이티브 코드 |
| **소유권** | 메모리 관리 시스템 | 컴파일 타임에 메모리 수명 추적, 자동 해제 |
| **대여(Borrowing)** | 참조 규칙 | 컴파일 타임에 댕글링 포인터, 데이터 레이스 방지 |
| **cargo** | 빌드 및 패키지 매니저 | Cargo.toml로 의존성 관리, 통합 도구 체인 |
| **Zero-cost** | 추상화 비용 없음 | LLVM 최적화로 고수준 코드를 저수준으로 변환 |


## 다음 수업

다음 글에서는 Rust의 변수와 데이터 타입 — 소유권과 이동, 스택과 힙 할당, 기본 타입의 메모리 구조를 배웁니다.
