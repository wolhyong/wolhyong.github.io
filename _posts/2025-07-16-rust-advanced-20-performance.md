---
layout: post
title: "Rust 성능 최적화 — 프로파일링, 벤치마킹, 메모리 최적화, 알고리즘 최적화, 컴파일러 최적화"
description: "Rust의 성능 최적화 기법을 시스템 레벨에서 학습합니다. 프로파일링은 perf, flamegraph, cargo-flamegraph로 병목 지점을 식별합니다. 벤치마킹은 criterion 라이브러리로 정확한 성능 측정을 제공하며 통계적 분석을 수행합니다. 메모리 최적화는 스택 할당, 힙 할당 최소화, 작은 크기 최적화, 인라이닝으로 메모리 사용을 줄입니다. 알고리즘 최적화는 Big-O 분석, 캐시 친화적 알고리즘, 병렬화로 계산 복잡도를 줄입니다. 컴파일러 최적화는 LTO(Link Time Optimization), PGO(Profile-Guided Optimization), 코드 생성 옵션으로 성능을 향상합니다. Rust의 제로-cost 추상화 원칙으로 고수준 코드도 저수준 코드와 동일한 성능을 보장합니다."
date: 2025-07-16 10:00:00 +0900
category: rust
tags: [rust, performance, profiling, benchmarking, optimization, lto, pgo]
level: advanced
---

Rust는 제로-cost 추상화 원칙으로 고수준 코드도 저수준 코드와 동일한 성능을 보장하며 다양한 최적화 기법을 제공합니다.

> **핵심 정리** · 프로파일링으로 병목 지점을 식별합니다. criterion으로 정확한 벤치마킹을 수행합니다. 메모리 최적화로 할당을 줄입니다. 알고리즘 최적화로 복잡도를 줄입니다. LTO와 PGO로 컴파일러 최적화를 수행합니다.


## 수업 목표

- 프로파일링 도구를 사용할 수 있습니다.
- criterion으로 벤치마킹을 작성할 수 있습니다.
- 메모리 최적화 기법을 이해합니다.
- 알고리즘 최적화를 수행할 수 있습니다.
- 컴파일러 최적화 옵션을 이해합니다.
- 성능 병목을 식별하고 해결할 수 있습니다.

## 프로파일링

```bash
# perf 설치 (Linux)
sudo apt install linux-tools-generic

# 프로파일링 실행
perf record --call-graph dwarf ./target/release/my_app

# 결과 분석
perf report
```

`perf`는 Linux 프로파일링 도구로 CPU 시간, 캐시 미스, 분기 예측 실패 등을 측정합니다. `perf record`로 데이터를 수집하고 `perf report`로 분석합니다. 병목 지점을 식별하는 데 사용됩니다.

### flamegraph

```toml
# Cargo.toml
[dependencies]
flamegraph = "0.6"
```

```rust
use flamegraph::flame_graph;

fn main() {
    flame_graph("my_flamegraph.svg", || {
        expensive_function();
    });
}
```

`flamegraph`는 플레임 그래프를 생성하여 함수 호출 스택을 시각화합니다. 너비가 넓을수록 해당 함수가 많은 CPU 시간을 사용합니다. 병목 지점을 시각적으로 식별할 수 있습니다.

### cargo-flamegraph

```bash
cargo install flamegraph
cargo flamegraph
```

`cargo-flamegraph`는 별도의 코드 수정 없이 플레임 그래프를 생성합니다. `cargo flamegraph` 명령으로 실행하고 `flamegraph.svg` 파일이 생성됩니다.

## 벤치마킹

```toml
# Cargo.toml
[dev-dependencies]
criterion = "0.5"

[[bench]]
name = "my_benchmark"
harness = false
```

```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("fibonacci 20", |b| b.iter(|| fibonacci(black_box(20))));
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```

criterion은 정확한 벤치마킹 라이브러리입니다. 통계적 분석을 수행하며 노이즈를 줄이고 신뢰할 수 있는 결과를 제공합니다. `black_box`로 컴파일러 최적화를 방지합니다.

### 벤치마킹 실행

```bash
cargo bench
```

`cargo bench`로 벤치마킹을 실행합니다. 결과는 평균, 표준 편차, 신뢰 구간 등을 포함합니다. 기준선(baseline)과 비교하여 회귀를 감지할 수 있습니다.

## 메모리 최적화

### 스택 할당

```rust
// 힙 할당
fn heap_allocation() -> Vec<i32> {
    vec![1, 2, 3, 4, 5]
}

// 스택 할당
fn stack_allocation() -> [i32; 5] {
    [1, 2, 3, 4, 5]
}
```

고정 크기 데이터는 스택에 할당하는 것이 빠릅니다. `Vec` 대신 배열을 사용하면 힙 할당 오버헤드를 피할 수 있습니다. 하지만 크기가 컴파일 타임에 알려져야 합니다.

### 작은 크기 최적ization

```rust
#[repr(C)]
struct Point {
    x: f32,
    y: f32,
    z: f32,
}
```

`#[repr(C)]`로 C 호환 레이아웃을 지정하거나 `#[repr(packed)]`로 패딩을 제거할 수 있습니다. 하지만 정렬이 깨지면 성능 저하가 발생할 수 있습니다. 일반적으로 컴파일러가 최적의 패딩을 선택합니다.

### 인라이닝

```rust
#[inline]
fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[inline(always)]
fn always_inline(a: i32, b: i32) -> i32 {
    a + b
}

#[inline(never)]
fn never_inline(a: i32, b: i32) -> i32 {
    a + b
}
```

`#[inline]`은 컴파일러에게 인라이닝을 제안합니다. `#[inline(always)]`는 강제 인라이닝, `#[inline(never)]`는 인라이닝 방지입니다. 작은 함수는 인라이닝되어 함수 호출 오버헤드를 줄입니다.

## 알고리즘 최적화

### Big-O 분석

```rust
// O(n) - 선형
fn linear_search(arr: &[i32], target: i32) -> Option<usize> {
    for (i, &val) in arr.iter().enumerate() {
        if val == target {
            return Some(i);
        }
    }
    None
}

// O(log n) - 로그
fn binary_search(arr: &[i32], target: i32) -> Option<usize> {
    let mut left = 0;
    let mut right = arr.len();

    while left < right {
        let mid = left + (right - left) / 2;
        match arr[mid].cmp(&target) {
            std::cmp::Ordering::Equal => return Some(mid),
            std::cmp::Ordering::Less => left = mid + 1,
            std::cmp::Ordering::Greater => right = mid,
        }
    }
    None
}
```

알고리즘 복잡도를 분석하여 최적화합니다. 선형 검색 O(n) 대신 이진 검색 O(log n)을 사용하면 큰 데이터셋에서 훨씬 빠릅니다. 하지만 정렬된 데이터가 필요합니다.

### 캐시 친화적 알고리즘

```rust
// 캐시 비친화적
fn sum_rows(matrix: &[Vec<i32>]) -> i32 {
    let mut sum = 0;
    for row in matrix {
        for &val in row {
            sum += val;
        }
    }
    sum
}

// 캐시 친화적
fn sum_columns(matrix: &[Vec<i32>]) -> i32 {
    let mut sum = 0;
    let cols = matrix[0].len();
    for col in 0..cols {
        for row in matrix {
            sum += row[col];
        }
    }
    sum
}
```

캐시 친화적 알고리즘은 메모리 접근 패턴을 최적화합니다. 연속 메모리 접근은 캐시 히트율을 높입니다. 행 우선 vs 열 우선 접근은 성능에 큰 영향을 미칩니다.

### 병렬화

```rust
use rayon::prelude::*;

fn parallel_sum(arr: &[i32]) -> i32 {
    arr.par_iter().sum()
}
```

`rayon`은 데이터 병렬화 라이브러리입니다. `par_iter()`로 병렬 반복자를 생성하며 멀티코어를 활용합니다. CPU 바운드 작업에 효과적입니다.

## 컴파일러 최적화

### LTO (Link Time Optimization)

```toml
# Cargo.toml
[profile.release]
lto = true
```

LTO는 링크 타임 최적화로 전체 프로그램을 분석하여 최적화합니다. 인라이닝, 데드 코드 제거 등을 수행하며 바이너리 크기와 성능을 최적화합니다. 컴파일 시간이 증가하지만 런타임 성능이 향상됩니다.

### PGO (Profile-Guided Optimization)

```bash
# PGO 빌드
cargo build --release --profile pgo

# 프로파일 데이터 수집
./target/pgo/my_app

# PGO 적용 빌드
cargo build --release --profile pgo-use
```

PGO는 프로파일 데이터를 기반으로 최적화합니다. 실제 실행 패턴을 분석하여 핫 경로를 최적화합니다. 최대 10-30% 성능 향상이 가능합니다.

### 코드 생성 옵션

```toml
[profile.release]
opt-level = 3           # 최적화 레벨 (0-3, s, z)
codegen-units = 1      # 단일 코드 생성 단위 (더 좋은 최적화)
panic = "abort"         # 패닉 시 abort (더 작은 바이너리)
strip = true            # 디버깅 심볼 제거
```

`opt-level = 3`는 최대 최적화입니다. `codegen-units = 1`은 더 좋은 최적화를 제공하지만 컴파일 시간이 증가합니다. `panic = "abort"`는 패닉 해제 코드를 제거하여 바이너리를 줄입니다.

## 메모리 프로파일링

```bash
# valgrind 설치
sudo apt install valgrind

# 메모리 누수 검사
valgrind --leak-check=full ./target/release/my_app
```

`valgrind`는 메모리 누수, 잘못된 메모리 접근 등을 감지합니다. `--leak-check=full`로 상세한 메모리 누스 보고를 얻을 수 있습니다.

### heaptrack

```bash
# heaptrack 설치
sudo apt install heaptrack

# 힙 프로파일링
heaptrack ./target/release/my_app
```

`heaptrack`은 힙 할당을 추적하여 메모리 사용 패턴을 분석합니다. 어떤 함수가 많은 메모리를 할당하는지 식별할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 제로-cost 추상화는 무엇인가요?</strong></summary>

제로-cost 추상화는 고수준 추상화를 사용해도 저수준 코드와 동일한 성능을 보장하는 원칙입니다. Rust는 컴파일러 최적화로 추상화 오버헤드를 제거합니다. 예: 반복자, 클로저, 패턴 매칭 등은 컴파일되면 최적화된 저수준 코드로 변환됩니다. 성능을 희생하지 않고 추상화를 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q> LTO는 언제 사용해야 하나요?</strong></summary>

LTO는 최대 성능이 필요할 때 사용합니다. 바이너리 크기가 커지고 컴파일 시간이 증가하지만 런타임 성능이 향상됩니다. 릴리즈 빌드에서 사용하는 것이 일반적입니다. 작은 프로젝트에서는 효과가 크지 않을 수 있습니다.
</details>

<details>
<summary><strong>Q> 벤치마킹은 왜 필요한가요?</strong></summary>

벤치마킹은 성능 회귀를 감지하고 최적화 효과를 측정하기 위해 필요합니다. 직관은 종종 틀리며 실제 측정이 필요합니다. criterion은 통계적 분석으로 신뢰할 수 있는 결과를 제공합니다. 최적화 전후 비교로 개선을 확인할 수 있습니다.
</details>

<details>
<summary><strong>Q> 캐시 친화적 알고리즘은 왜 중요한가요?</strong></summary>

캐시 친화적 알고리즘은 CPU 캐시 히트율을 높여 성능을 향상합니다. 메모리 접근은 CPU 속도보다 훨씬 느리므로 캐시 효율이 중요합니다. 연속 메모리 접근은 캐시 라인을 효율적으로 사용합니다. 행 우선 vs 열 우선 접근은 큰 성능 차이를 만들 수 있습니다.
</details>

<details>
<summary><strong>Q> 프로파일링은 어떻게 시작하나요?</strong></summary>

프로파일링 시작 방법: (1) `perf record`로 CPU 프로파일링 (2) `cargo-flamegraph`로 시각화 (3) `valgrind`로 메모리 프로파일링. 병목 지점을 식별한 후 최적화를 수행합니다. 최적화 후 다시 프로파일링하여 개선을 확인합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **프로파일링** | 병목 식별 | perf, flamegraph |
| **벤치마킹** | 성능 측정 | criterion 라이브러리 |
| **스택 할당** | 힙 오버헤드 감소 | 고정 크기 데이터 |
| **인라이닝** | 함수 호출 오버헤드 감소 | #[inline] 속성 |
| **알고리즘 최적화** | 복잡도 감소 | Big-O 분석 |
| **캐시 친화적** | 캐시 히트율 향상 | 연속 메모리 접근 |
| **병렬화** | 멀티코어 활용 | rayon 라이브러리 |
| **LTO** | 링크 타임 최적화 | 전체 프로그램 분석 |
| **PGO** | 프로파일 기반 최적화 | 실행 패턴 분석 |
| **메모리 프로파일링** | 메모리 사용 분석 | valgrind, heaptrack |


## 다음 수업

다음 글에서는 Rust 고급 — 프로젝트 구조, 워크스페이스, 빌드 스크립트, CI/CD를 배웁니다.
