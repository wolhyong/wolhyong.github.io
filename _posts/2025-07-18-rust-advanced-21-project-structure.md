---
layout: post
title: "Rust 프로젝트 구조 — 워크스페이스, 빌드 스크립트, CI/CD, 표준 프로젝트 레이아웃, 모범 사례"
description: "Rust 프로젝트 구조와 빌드 시스템을 실무 레벨에서 학습합니다. 워크스페이스(workspace)는 여러 패키지를 단일 프로젝트로 관리하며 Cargo.toml의 [workspace] 섹션으로 정의합니다. 빌드 스크립트(build.rs)는 컴파일 전에 코드를 생성하며 cc, bindgen 등과 함께 사용됩니다. CI/CD는 GitHub Actions, GitLab CI로 자동화된 테스트, 빌드, 배포를 구현합니다. 표준 프로젝트 레이아웃은 src, tests, benches, examples 디렉토리 구조를 따릅니다. 모범 사례는 /internal 패키지로 외부 노출을 차단하고, /bin과 /lib로 바이너리와 라이브러리를 분리하며, /crates로 멀티 크레이트 프로젝트를 구성합니다. cargo-make로 복잡한 빌드 작업을 자동화합니다."
date: 2025-07-18 10:00:00 +0900
category: rust
tags: [rust, project-structure, workspace, build-script, ci-cd, cargo-make]
level: advanced
---

Rust 프로젝트 구조는 대규모 프로젝트를 관리하고 유지보수성을 높이는 데 중요한 역할을 합니다.

> **핵심 정리** · 워크스페이스는 여러 패키지를 단일 프로젝트로 관리합니다. `build.rs`로 컴파일 전 코드를 생성합니다. CI/CD로 자동화된 파이프라인을 구축합니다. 표준 레이아웃을 따르고 `/internal`로 외부 노출을 차단합니다. 모범 사례로 멀티 크레이트 프로젝트를 구성합니다.


## 수업 목표

- 워크스페이스를 구성하고 사용할 수 있습니다.
- build.rs로 빌드 스크립트를 작성할 수 있습니다.
- CI/CD 파이프라인을 구축할 수 있습니다.
- 표준 프로젝트 레이아웃을 이해합니다.
- 모범 사례를 따라 프로젝트를 구성할 수 있습니다.
- cargo-make로 빌드 작업을 자동화할 수 있습니다.

## 워크스페이스

```toml
# Cargo.toml (workspace root)
[workspace]
members = [
    "core",
    "utils",
    "cli",
]

[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

워크스페이스는 여러 패키지를 단일 프로젝트로 관리합니다. `[workspace]` 섹션으로 멤버 패키지를 정의합니다. `[workspace.dependencies]`로 공통 의존성을 관리하여 버전 일관성을 보장합니다.

### 워크스페이스 구조

```
my-project/
├── Cargo.toml          # workspace root
├── core/               # 라이브러리 크레이트
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── utils/              # 유틸리티 라이브러리
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── cli/                # 바이너리 크레이트
    ├── Cargo.toml
    └── src/
        └── main.rs
```

워크스페이스는 바이너리와 라이브러리 크레이트를 분리합니다. `core`는 핵심 로직, `utils`는 유틸리티, `cli`는 명령행 인터페이스를 담당합니다. 의존성은 공유되며 단일 `Cargo.lock`로 관리됩니다.

### 워크스페이스 명령

```bash
# 워크스페이스 전체 빌드
cargo build

# 특정 패키지 빌드
cargo build -p cli

# 워크스페이스 전체 테스트
cargo test

# 워크스페이스 전체 릴리즈 빌드
cargo build --release
```

워크스페이스 명령은 모든 멤버 패키지에 적용됩니다. `-p` 플래그로 특정 패키지를 대상으로 할 수 있습니다. 단일 `target/` 디렉토리를 공유하여 디스크 공간을 절약합니다.

## 빌드 스크립트

```rust
// build.rs
fn main() {
    println!("cargo:rerun-if-changed=src/input.txt");
    
    let input = std::fs::read_to_string("src/input.txt").unwrap();
    let output = format!("const INPUT: &str = {:?};", input.trim());
    
    std::fs::write("src/generated.rs", output).unwrap();
}
```

`build.rs`는 컴파일 전에 실행되는 빌드 스크립트입니다. 코드 생성, 링크 설정, 컴파일러 플래그 등을 수행합니다. `cargo:rerun-if-changed`로 재빌드 조건을 지정할 수 있습니다.

### C 라이브러리 링크

```rust
// build.rs
fn main() {
    cc::Build::new()
        .file("src/c_code.c")
        .compile("c_code");
    
    println!("cargo:rustc-link-lib=dylib=ssl");
    println!("cargo:rustc-link-search=native=/usr/local/lib");
}
```

`cc` 크레이트로 C 코드를 컴파일하고 링크할 수 있습니다. `rustc-link-lib`로 라이브러리를, `rustc-link-search`로 라이브러리 경로를 지정합니다. FFI(Foreign Function Interface)에 사용됩니다.

### bindgen

```rust
// build.rs
fn main() {
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks))
        .generate()
        .expect("Unable to generate bindings");
    
    bindings
        .write_to_file(src/bindings.rs)
        .expect("Couldn't write bindings!");
}
```

`bindgen`은 C 헤더에서 Rust 바인딩을 자동 생성합니다. FFI를 위한 안전한 래퍼를 생성하는 데 사용됩니다. C 라이브러리와 상호작용할 때 유용합니다.

## CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  CARGO_TERM_COLOR: always

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        profile: minimal
        toolchain: stable
        components: rustfmt, clippy
    
    - name: Cache cargo registry
      uses: actions/cache@v3
      with:
        path: ~/.cargo/registry
        key: ${{ runner.os }}-cargo-registry-${{ hashFiles('**/Cargo.lock') }}
    
    - name: Cache cargo index
      uses: actions/cache@v3
      with:
        path: ~/.cargo/git
        key: ${{ runner.os }}-cargo-index-${{ hashFiles('**/Cargo.lock') }}
    
    - name: Cache cargo build
      uses: actions/cache@v3
      with:
        path: target
        key: ${{ runner.os }}-cargo-build-target-${{ hashFiles('**/Cargo.lock') }}
    
    - name: Check formatting
      run: cargo fmt -- --check
    
    - name: Run clippy
      run: cargo clippy -- -D warnings
    
    - name: Run tests
      run: cargo test --verbose
    
    - name: Build release
      run: cargo build --release
```

GitHub Actions로 CI/CD 파이프라인을 구축합니다. 푸시/PR 시 자동으로 테스트, 린트, 빌드를 실행합니다. 캐시로 빌드 시간을 최적화합니다.

### 릴리스 자동화

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        profile: minimal
        toolchain: stable
    
    - name: Build release
      run: cargo build --release
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: binary
        path: target/release/my_app
```

태그 푸시 시 자동으로 릴리스를 생성할 수 있습니다. 바이너리를 아티팩트로 업로드하여 사용자가 다운로드할 수 있습니다.

## 표준 프로젝트 레이아웃

```
my-project/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── main.rs          # 바이너리 진입점
│   ├── lib.rs           # 라이브러리 진입점
│   ├── bin/             # 추가 바이너리
│   │   └── tool.rs
│   └── modules/         # 모듈
│       ├── mod.rs
│       └── feature.rs
├── tests/              # 통합 테스트
│   └── integration_test.rs
├── benches/            # 벤치마크
│   └── my_benchmark.rs
├── examples/           # 예제 코드
│   └── simple.rs
├── benches/            # 벤치마크
└── target/             # 빌드 출력 (gitignore)
```

표준 레이아웃은 Rust 커뮤니티의 모범 사례를 따릅니다. `src/`는 소스 코드, `tests/`는 통합 테스트, `benches/`는 벤치마크, `examples/`는 예제 코드를 담습니다.

## 모범 사례

### /internal 패키지

```
my-project/
├── Cargo.toml
├── src/
│   └── main.rs
└── internal/
    ├── Cargo.toml
    └── src/
        └── lib.rs
```

`/internal` 패키지는 외부 노출을 차단합니다. `internal` 이름은 Rust 커뮤니티 규칙으로, 이 패키지는 공개 API가 아님을 나타냅니다. 내부 구현을 숨기고 공개 API를 명확히 합니다.

### /bin과 /lib 분리

```
my-project/
├── Cargo.toml
├── bin/
│   ├── my-app/
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── main.rs
│   └── my-tool/
│       ├── Cargo.toml
│       └── src/
│           └── main.rs
└── lib/
    ├── Cargo.toml
    └── src/
        └── lib.rs
```

바이너리와 라이브러리를 분리하여 재사용성을 높입니다. 여러 바이너리가 같은 라이브러리를 공유할 수 있습니다. 워크스페이스로 관리합니다.

### /crates 멀티 크레이트

```
my-project/
├── Cargo.toml          # workspace root
├── crates/
│   ├── core/
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs
│   ├── utils/
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs
│   └── api/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
└── src/
    └── main.rs
```

`/crates` 디렉토리로 멀티 크레이트 프로젝트를 구성합니다. 각 크레이트는 독립적인 책임을 가지며 모듈화를 향상합니다. 대규모 프로젝트에서 유지보수성을 높입니다.

## cargo-make

```toml
# Makefile.toml
[tasks.format]
command = "cargo"
args = ["fmt"]

[tasks.clippy]
command = "cargo"
args = ["clippy", "--", "-D", "warnings"]

[tasks.test]
command = "cargo"
args = ["test"]

[tasks.ci]
dependencies = ["format", "clippy", "test"]

[tasks.build-release]
command = "cargo"
args = ["build", "--release"]
```

`cargo-make`는 복잡한 빌드 작업을 자동화합니다. `cargo make ci`로 포맷팅, 클리피, 테스트를 순차적으로 실행할 수 있습니다. 팀 표준을 강제하는 데 유용합니다.

### cargo-make 설치

```bash
cargo install cargo-make
```

```bash
# 태스크 실행
cargo make format
cargo make clippy
cargo make test
cargo make ci
```

`cargo-make`는 크로스 플랫폼 빌드 스크립트를 제공합니다. Makefile보다 Rust 친화적이며 Cargo와 통합됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 워크스페이스는 언제 사용해야 하나요?</strong></summary>

워크스페이스는 여러 관련 패키지를 개발할 때 사용합니다. 예: 모노레포, 라이브러리와 바이너리 분리, 멀티 크레이트 프로젝트. 의존성을 공유하고 단일 빌드로 관리할 수 있습니다. 단일 패키지 프로젝트에서는 필요하지 않습니다.
</details>

<details>
<summary><strong>Q> build.rs는 언제 사용해야 하나요?</strong></summary>

`build.rs`는 다음 경우에 사용합니다: (1) 컴파일 타임 코드 생성 (2) C 라이브러리 링크 (3) 컴파일러 플래그 설정 (4) 환경 감지. 대부분의 경우 필요하지 않으며, 과도한 사용은 컴파일 시간을 느리게 할 수 있습니다. FFI나 코드 생성이 필요할 때 사용합니다.
</details>

<details>
<summary><strong>Q> /internal 패키지는 왜 필요한가요?</strong></summary>

`/internal` 패키지는 외부 노출을 차단하여 공개 API를 명확히 합니다. 내부 구현을 숨기고 API 안정성을 보장합니다. Rust 커뮤니티 규칙으로, 사용자는 `internal` 패키지를 사용하지 않아야 함을 알게 됩니다. 대규모 프로젝트에서 유지보수성을 높입니다.
</details>

<details>
<summary><strong>Q> CI/CD는 어떻게 설정하나요?</strong></summary>

CI/CD 설정 방법: (1) GitHub Actions 또는 GitLab CI 선택 (2) 테스트, 린트, 빌드 작업 정의 (3) 캐시로 빌드 시간 최적화 (4) 태그 푸시 시 릴리스 자동화. GitHub Actions는 Rust 툴체인을 쉽게 설정할 수 있는 액션을 제공합니다.
</details>

<details>
<summary><strong>Q> 표준 레이아웃을 따라야 하는 이유는 무엇인가요?</strong></summary>

표준 레이아웃을 따르면 다음 이점이 있습니다: (1) 다른 Rust 개발자가 쉽게 이해 (2) 도구가 올바르게 동작 (3) 모범 사례 따르기. `src/`, `tests/`, `benches/`, `examples/` 디렉토리는 Cargo가 자동으로 인식합니다. 프로젝트 일관성을 높입니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **워크스페이스** | 멀티 패키지 관리 | 단일 Cargo.lock |
| **build.rs** | 빌드 스크립트 | 컴파일 전 실행 |
| **CI/CD** | 자동화 파이프라인 | GitHub Actions |
| **표준 레이아웃** | 모범 디렉토리 구조 | src, tests, benches |
| **/internal** | 외부 노출 차단 | 내부 구현 숨김 |
| **/bin과 /lib** | 바이너리/라이브러리 분리 | 재사용성 향상 |
| **/crates** | 멀티 크레이트 | 모듈화 향상 |
| **cargo-make** | 빌드 작업 자동화 | 태스크 정의 |
| **cc** | C 코드 컴파일 | FFI 링크 |
| **bindgen** | C 바인딩 생성 | 자동 래퍼 |


## Rust 수업 완료

Rust 기초부터 고급까지 21개 수업을 완료했습니다. 이제 C# 수업을 생성하겠습니다.
