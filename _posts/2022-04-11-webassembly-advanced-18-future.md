---
layout: post
title: "WebAssembly 고급(18) — WASM의 미래: Component Model, GC, 스레드, 레퍼런스 타입"
description: "WebAssembly의 미래 로드맵 — Component Model(모듈 간 직접 통신), GC(Garbage Collection) 통합, 멀티스레딩 표준화, 레퍼런스 타입(Reference Types), Tail Call 최적화, Exception Handling, 확장 가능한 WASM 생태계 전망"
date: 2022-04-11 10:00:00 +0900
category: webassembly
tags: [webassembly, component-model, gc, reference-types, tail-call, exception-handling, wasm-roadmap, multi-value, interface-types, wasm-gc]
level: advanced
---

> **💡 한 줄 요약:** WebAssembly의 미래는 Component Model(모듈 간 직접 통신, 인터페이스 타입 자동 변환)과 GC 통합(가비지 컬렉션 언어를 WASM 기본 타겟으로)이 핵심이며, 이로 인해 WASM은 모든 언어의 **범용 컴파일 대상(Universal Compilation Target)** 으로 진화하고 있습니다.

## WebAssembly의 진화 로드맵

WebAssembly는 2017년 MVP(Minimum Viable Product) 출시 이후 지속적으로 발전하고 있습니다. 각 단계는 다음 수준의 표현력과 성능을 추가했습니다.

```
2017 ── MVP (Minimum Viable Product)
        ├── 기본 타입 (i32, i64, f32, f64)
        ├── 선형 메모리
        └── 함수 호출

2019 ── WASM 1.0 → 1.1 (Multi-value, Bulk memory)
        ├── 여러 반환값
        ├── memory.copy / memory.fill
        └── table.copy / table.fill

2021 ── SIMD, Reference Types, Exception Handling (MVP)
        ├── 128비트 SIMD
        ├── externref (JavaScript 객체 참조)
        └── try/catch (WASM 레벨)

2023 ── GC, Tail Call, Extended Const
        ├── GC 타입 (struct, array)
        ├── Tail Call 최적화
        └── Extended Constant Expressions

2025+ ── Component Model, Threads, Interface Types
        ├── 모듈 간 직접 통신
        ├── WIT (WebAssembly Interface Types)
        └── 표준화된 멀티스레딩
```

---

## 수업 목표

- WASM Component Model의 아키텍처와 WIT(WebAssembly Interface Types) 이해
- GC(Garbage Collection) 통합이 WASM 생태계에 미치는 영향 파악
- 레퍼런스 타입(externref)과 멀티스레딩 표준화 방향 이해
- Exception Handling과 Tail Call 최적화의 성능 영향 이해
- WASM 생태계의 미래 전망과 준비 전략 수립

---

## 1. Component Model — WASM 모듈 간 직접 통신

현재 WASM 모듈은 JavaScript를 통해서만 통신할 수 있습니다. Component Model은 **모듈 간 직접 통신**을 가능하게 합니다.

### 1.1 현재 방식 vs Component Model

```javascript
// 현재: JavaScript를 경유한 WASM ↔ WASM 통신
const wasm1 = (await WebAssembly.instantiate(bytes1, {})).instance;
const wasm2 = (await WebAssembly.instantiate(bytes2, {
    wasm1: {                  // JavaScript가 중개자 역할
        getData: wasm1.exports.getData
    }
})).instance;
```

```wit
// Component Model: WIT (WebAssembly Interface Types) 선언
// module1.wit — 첫 번째 컴포넌트의 인터페이스
interface calculator {
    add: func(a: s32, b: s32) -> s32
    multiply: func(a: s32, b: s32) -> s32
}

// module2.wit — 두 번째 컴포넌트 (calculator 사용)
interface data-processor {
    // calculator 컴포넌트 가져오기
    use { calculator } from module1
    
    process: func(data: list<s32>) -> s32
    // 내부적으로 calculator.add 호출
}
```

```rust
// Rust — Component Model을 사용한 모듈 통신
// 모듈 1: 계산기
#[component_model]
mod calculator {
    pub fn add(a: i32, b: i32) -> i32 { a + b }
    pub fn multiply(a: i32, b: i32) -> i32 { a * b }
}

// 모듈 2: 데이터 프로세서 (모듈 1을 직접 import)
#[component_model]
mod data_processor {
    // WIT 기반으로 모듈 1의 함수 자동 import
    use calculator::{add, multiply};
    
    pub fn process(data: Vec<i32>) -> i32 {
        data.iter().fold(0, |acc, x| add(acc, *x))
    }
}
```

#### Component Model의 주요 이점

| 특징 | 현재 WASM | Component Model |
|------|---------|----------------|
| **모듈 간 통신** | JavaScript 경유 (오버헤드 12.5ns) | 직접 호출 (오버헤드 2.4ns) |
| **타입 변환** | 수동 (JavaScript에서 처리) | 자동 (WIT이 처리) |
| **의존성 관리** | 없음 | WIT 기반 명시적 선언 |
| **트리 쉐이킹** | 불가능 | 사용하지 않는 함수/모듈 자동 제거 |
| **패키징** | 수동 (개별 .wasm 파일) | 자동 (단일 .wasm 컴포넌트) |

> **🔬 깊이 있는 설명 — Component Model이 WASM 생태계를 변화시키는 방식:** 현재 WASM 모듈은 JavaScript의 `WebAssembly.instantiate()`로 개별적으로 로드되고, JavaScript 객체를 통해 통신합니다. Component Model은 (1) WIT(WebAssembly Interface Types)로 모듈의 인터페이스를 선언하고, (2) 컴포저(Composer)가 여러 모듈을 하나의 컴포넌트로 묶어주며, (3) JavaScript 없이 WASM 모듈 간 직접 호출을 가능하게 합니다. 이는 마치 npm이 JavaScript 모듈의 의존성을 관리하는 것처럼, warg(WebAssembly Registry)가 WASM 컴포넌트의 의존성을 관리하는 생태계로 발전할 것입니다.

---

## 2. GC (가비지 컬렉션) 통합

WASM GC는 **JavaScript, Python, Java, Kotlin** 등 가비지 컬렉션 언어를 WASM의 1등 시민으로 만듭니다.

### 2.1 GC 타입 시스템

```wat
;; WASM GC — 구조체 타입 정의
(module
  ;; JavaScript 객체와 유사한 구조체 정의
  (type $person (struct
    (field $name (ref null string))
    (field $age i32)
    (field $address (ref null $address))
  ))
  
  (type $address (struct
    (field $city string)
    (field $zip i32)
  ))
  
  ;; 배열 타입
  (type $person_list (array (ref $person)))
  
  ;; 구조체 생성
  (func $create_person (param $name (ref string)) (param $age i32) (result (ref $person))
    (struct.new $person
      (local.get $name)
      (local.get $age)
      (ref.null $address)
    )
  )
  
  ;; 필드 접근
  (func $get_age (param $p (ref $person)) (result i32)
    (struct.get $person $age (local.get $p))
  )
)
```

```kotlin
// Kotlin — WASM GC 타겟으로 컴파일
@WasmExport
data class Person(
    val name: String,
    val age: Int,
    val address: Address?
)

@WasmExport
data class Address(
    val city: String,
    val zip: String
)

@WasmExport
fun createPeople(): List<Person> {
    return listOf(
        Person("Alice", 30, Address("Seoul", "12345")),
        Person("Bob", 25, null)
    )
}
```

#### WASM GC 성능 특성

| 언어 | 현재 (MVP WASM) | WASM GC 적용 후 | 설명 |
|------|---------------|----------------|------|
| **JavaScript** | ~100% (자연적) | ~95% | GC 오버헤드 감소 |
| **Kotlin** | ❌ 미지원 | ~80% | 가비지 컬렉션 가능 |
| **Dart/Flutter** | ❌ 미지원 | ~90% | Flutter 웹 성능 대폭 개선 |
| **Python** | ❌ 미지원 | ~50% (인터프리터 크기 한계) | 순수 Python 코드 실행 가능 |
| **Java** | ❌ 미지원 | ~75% | JVM 없이 Java 코드 실행 |

> **⚠️ WASM GC의 한계:** WASM GC가 추가되어도 Python, Ruby 등 동적 언어의 완전한 지원은 어렵습니다. 이러한 언어는 (1) 실행 중 타입 변경 (2) 동적 코드 평가 (eval) (3) JIT 컴파일 (PyPy) 등의 기능이 필요하지만, WASM의 정적 타입 모델과 충돌합니다. WASM GC는 **정적 타입의 GC 언어**(Java, Kotlin, Dart, C#, Swift)에 가장 큰 이점을 제공합니다.

---

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: WASM GC가 추가되면 JavaScript를 WASM으로 컴파일하는 것이 의미가 있나요?</strong></summary>
기술적으로 가능하지만 실용적이지 않습니다. JavaScript는 WASM의 타겟 언어가 되기에는 (1) 동적 타입 시스템, (2) 프로토타입 기반 객체 모델, (3) eval과 같은 동적 기능, (4) JIT 최적화에 의존하는 성능 특성 등이 WASM의 정적 모델과 맞지 않습니다. JavaScript는 V8 엔진에서 가장 잘 실행되며, WASM은 JavaScript를 대체하는 것이 아니라 **보완하는 역할**을 합니다.
</details>

<details>
<summary><strong>Q: Component Model이 실제로 언제 사용 가능한가요?</strong></summary>
2025년 기준, Component Model은 Bytecode Alliance(Wasmtime, Wasmtime, Wit)를 중심으로 활발히 개발 중입니다. Wasmtime은 이미 Component Model의 프리뷰를 지원합니다. warg(WebAssembly Registry)도 알파 단계입니다. 프로덕션 완전 지원은 2025~2026년으로 예상됩니다. 지금은 WIT 문법을 학습하고, 소규모 프로젝트에 Component Model을 적용해보는 것을 권장합니다.
</details>

<details>
<summary><strong>Q: Exception Handling이 WASM에서 중요한 이유는 무엇인가요?</strong></summary>
Exception Handling이 없으면 C++의 `try/catch`, Rust의 `panic!`, Java의 `throw` 등이 WASM에서 정상 동작하지 않습니다. 현재 Emscripten은 JavaScript의 `try/catch`를 통해 예외를 에뮬레이션하지만, 이는 성능 저하를 유발합니다. WASM 레벨의 Exception Handling이 추가되면 (1) 예외 처리 성능이 10~100배 개선되고, (2) C++/Rust 표준 라이브러리의 예외 의존 코드가 정상 동작하며, (3) 디버깅 경험이 크게 향상됩니다.
</details>

---

## 3. 멀티스레딩 표준화

현재 WASM의 멀티스레딩은 SharedArrayBuffer + Web Workers에 의존합니다. 표준화된 멀티스레딩은 WASM 레벨에서 직접 스레드 생성과 동기화를 지원합니다.

```wat
;; 미래 WASM — 표준 스레드 생성
(module
  ;; 스레드 함수 정의
  (func $worker (export "worker_main") (param $id i32)
    ;; 스레드 로컬 저장소 접근
    (local.tee $local_data (thread_local.get 0))
    ;; ... 작업 수행
  )
  
  ;; 스레드 생성
  (func $start_workers
    (thread.spawn (i32.const 4) (func $worker))
    ;; 4개의 스레드가 $worker 함수를 각각 실행
  )
)
```

#### 멀티스레딩 진화 단계

| 단계 | 현재 (2022~2024) | 표준화 후 (2025+) |
|------|-----------------|-----------------|
| **스레드 생성** | `new Worker()` (JavaScript) | `thread.spawn` (WASM 레벨) |
| **메모리 공유** | SharedArrayBuffer | 기본 메모리 = shared |
| **동기화** | Atomic 연산 + JavaScript | Atomic + futex/wait |
| **스레드 로컬** | 없음 | `thread_local` 저장소 |
| **성능** | 1~5μs (Worker 생성) | 0.1~1μs (가벼운 스레드) |

---

## 4. Tail Call 최적화

Tail Call Optimization(TCO)은 **재귀 함수의 마지막 호출을 함수 호출 대신 점프(jump)로 변환**하여 스택 오버플로우를 방지합니다.

```wat
;; Tail Call이 적용된 재귀 함수
(module
  ;; 일반 재귀: O(n) 스택 사용
  (func $factorial (param $n i32) (result i32)
    (if (i32.le_s (local.get $n) (i32.const 1))
      (then (return (i32.const 1)))
    )
    ;; 마지막 연산이 곱셈 → Tail Call 아님
    (i32.mul
      (local.get $n)
      (call $factorial (i32.sub (local.get $n) (i32.const 1)))
    )
  )
  
  ;; Tail Call 재귀: O(1) 스택 사용
  (func $factorial_tail (param $n i32) (param $acc i32) (result i32)
    (if (i32.le_s (local.get $n) (i32.const 1))
      (then (return (local.get $acc)))
    )
    ;; 마지막 연산이 함수 호출 → Tail Call!
    (return_call $factorial_tail
      (i32.sub (local.get $n) (i32.const 1))
      (i32.mul (local.get $n) (local.get $acc))
    )
  )
)
```

#### Tail Call 성능 비교

| 방식 | factorial(100,000) | 스택 사용 | 메모리 |
|------|-------------------|----------|-------|
| **일반 재귀** | ❌ 스택 오버플로우 (약 10만 프레임) | O(n) | ~800KB (스택) |
| **Tail Call (return_call)** | ✅ 2.3ms | O(1) | 0B (추가) |
| **반복문 (loop)** | ✅ 1.8ms | O(1) | 0B |

---

## 🎉 WebAssembly 과정 완료

축하합니다! WebAssembly Basic(1~6), Intermediate(7~12), Advanced(13~18)까지 18개 강좌를 모두 완료했습니다.

**여정회고:**
- **Basic 1-6**: WASM의 기본 개념, WAT 문법, 데이터 타입, 선형 메모리, 제어 흐름
- **Intermediate 7-12**: JS Interop, 메모리 관리, 함수 포인터, 도구 체인, 디버깅, WASI
- **Advanced 13-18**: 성능 최적화, 멀티스레딩, SIMD, 서버 측 WASM, 미래 전망

**다음 추천 학습 경로:**
1. **Rust + wasm-pack**: 가장 현대적인 WASM 개발 스택 시작
2. **Wasmtime + Component Model**: 미래 WASM 표준 준비
3. **WASI + 엣지 컴퓨팅**: Fastly, Cloudflare Workers에서 WASM 활용
4. **Bytecode Alliance 프로젝트**: WIT, warg, Wit 컴포넌트 생태계 탐험

## 요약 — WASM 미래 핵심 포인트

- **Component Model**: WIT로 모듈 간 인터페이스 정의, JavaScript 없이 직접 통신, warg 생태계
- **GC 통합**: Java/Kotlin/Dart/C#/Swift 등 GC 언어를 WASM 타겟으로. 동적 언어(Python/Ruby)는 제한적
- **표준 스레드**: `thread.spawn`으로 WASM 레벨 직접 스레드 생성. 현재 Worker 의존성 해소
- **Tail Call**: `return_call`로 재귀 최적화. O(n) 스택 → O(1). 함수형 프로그래밍에 중요
- **Exception Handling**: WASM 레벨 try/catch. C++/Rust 예외 처리 성능 10~100배 개선
- **WASM의 미래**: 브라우저를 넘어 모든 언어의 **범용 컴파일 대상**으로 진화. 임베디드, 서버, 엣지, 블록체인, 게임 등 무한한 가능성
