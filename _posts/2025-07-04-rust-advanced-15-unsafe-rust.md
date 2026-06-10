---
layout: post
title: "Rust unsafe Rust — 원시 포인터, FFI, 어셈블리 인라인, unsafe 함수, 안전하지 않은 트레이트"
description: "Rust의 unsafe 코드를 시스템 레벨에서 학습합니다. unsafe 키워드는 Rust의 보장을 비활성화하며 다음 5가지 작업을 허용합니다: 원시 포인터 역참조, unsafe 함수 호출, FFI 호출, mutable static 접근, unsafe 트레이트 구현. *const T와 *mut T는 원시 포인터로 빌림 규칙이 없으며 포인터 연산이 가능합니다. extern "C"로 C 함수를 호출하며 FFI(Foreign Function Interface)로 다른 언어와 상호작용합니다. asm! 매크로로 인라인 어셈블리를 작성할 수 있습니다. unsafe 코드는 가능한 한 캡슐화하여 안전한 인터페이스를 제공해야 합니다."
date: 2025-07-04 10:00:00 +0900
category: rust
tags: [rust, unsafe, raw-pointers, ffi, inline-assembly, extern]
level: advanced
---

Rust의 unsafe 코드는 컴파일러의 보장을 비활성화하며 개발자가 메모리 안전성을 직접 보장해야 합니다.

> **핵심 정리** · `unsafe` 키워드는 Rust의 보장을 비활성화합니다. 원시 포인터 `*const T`와 `*mut T`는 빌림 규칙이 없습니다. `extern "C"`로 C 함수를 호출하며 FFI로 다른 언어와 상호작용합니다. `asm!` 매크로로 인라인 어셈블리를 작성할 수 있습니다. unsafe 코드는 안전한 인터페이스로 캡슐화해야 합니다.


## 수업 목표

- unsafe 키워드의 5가지 사용 사례를 이해합니다.
- 원시 포인터와 참조의 차이를 이해합니다.
- FFI로 C 함수를 호출할 수 있습니다.
- unsafe 함수와 트레이트를 이해합니다.
- asm! 매크로로 인라인 어셈블리를 작성할 수 있습니다.
- unsafe 코드를 안전하게 캡슐화할 수 있습니다.

## unsafe의 5가지 사용 사례

```rust
unsafe fn dangerous() {}

fn main() {
    unsafe {
        dangerous();
    }
}
```

`unsafe` 키워드는 다음 5가지 작업을 허용합니다:
1. 원시 포인터 역참조
2. unsafe 함수 호출
3. unsafe 트레이트 구현
4. mutable static 변수 접근
5. FFI(외부 함수 인터페이스) 호출

## 원시 포인터

```rust
fn main() {
    let mut num = 5;

    let r1 = &num as *const i32;  // 불변 원시 포인터
    let r2 = &mut num as *mut i32; // 가변 원시 포인터

    unsafe {
        println!("r1: {}", *r1);
        *r2 = 10;
        println!("r2: {}", *r2);
    }
}
```

`*const T`는 불변 원시 포인터, `*mut T`는 가변 원시 포인터입니다. 참조와 달리 빌림 규칙이 없으며 포인터 연산이 가능합니다. 역참조는 `unsafe` 블록 내에서만 가능합니다.

### 원시 포인터와 참조의 차이

| 특징 | 참조 (&T, &mut T) | 원시 포인터 (*const T, *mut T) |
|------|------------------|-------------------------------|
| 빌림 규칙 | 있음 | 없음 |
| 안전성 | 보장됨 | 보장되지 않음 |
| null | 없음 | 있을 수 있음 |
| 포인터 연산 | 불가능 | 가능 |
| 역참조 | 안전 | unsafe 필요 |

### 포인터 연산

```rust
fn main() {
    let numbers = [1, 2, 3, 4, 5];

    let mut ptr = numbers.as_ptr() as *const i32;

    unsafe {
        for i in 0..5 {
            println!("numbers[{}] = {}", i, *ptr.add(i));
        }
    }
}
```

원시 포인터는 `add`, `offset`, `sub` 등으로 포인터 연산이 가능합니다. 범위를 벗어나면 정의되지 않은 동작(UB)이 발생할 수 있습니다.

## unsafe 함수

```rust
unsafe fn dangerous() {
    println!("위험한 작업");
}

fn main() {
    unsafe {
        dangerous();
    }
}
```

`unsafe fn`은 호출 시 `unsafe` 블록이 필요합니다. 함수 내에서 unsafe 작업을 수행함을 나타냅니다. 호출자가 안전성을 보장해야 합니다.

### unsafe 함수 예제

```rust
unsafe fn split_at_mut(slice: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    assert!(mid <= len);

    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = vec![1, 2, 3, 4, 5];
    let (left, right) = unsafe { split_at_mut(&mut v, 2) };

    println!("left: {:?}", left);
    println!("right: {:?}", right);
}
```

`split_at_mut`은 슬라이스를 두 개의 가변 슬라이스로 분리합니다. Rust의 빌림 규칙으로는 불가능하지만 원시 포인터로 구현할 수 있습니다. 호출자는 인덱스가 유효함을 보장해야 합니다.

## unsafe 트레이트

```rust
unsafe trait MyTrait {
    fn method(&self);
}

struct MyStruct;

unsafe impl MyTrait for MyStruct {
    fn method(&self) {
        println!("메서드 호출");
    }
}

fn main() {
    let s = MyStruct;
    s.method();
}
```

`unsafe trait`는 구현 시 `unsafe`가 필요합니다. 트레이트 구현자가 특정 불변성을 유지해야 함을 나타냅니다. 예: `Send`, `Sync`, `GlobalAlloc` 등.

### Send와 Sync

```rust
unsafe impl Send for MyStruct {}
unsafe impl Sync for MyStruct {}
```

`Send`는 타입이 스레드 간 소유권 이동이 가능함을 나타냅니다. `Sync`는 타입의 참조가 스레드 간 안전하게 공유될 수 있음을 나타냅니다. 대부분의 타입은 자동으로 구현되지만, 원시 포인터 등은 수동으로 구현해야 합니다.

## mutable static 접근

```rust
static mut COUNTER: u32 = 0;

fn add_to_counter(inc: u32) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    add_to_counter(1);
    unsafe {
        println!("COUNTER: {}", COUNTER);
    }
}
```

`static mut` 변수에 접근하면 데이터 레이스가 발생할 수 있으므로 `unsafe`가 필요합니다. 일반적으로 `Atomic` 타입을 사용하는 것이 더 안전합니다.

## FFI (Foreign Function Interface)

```rust
extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe {
        println!("Absolute value of -3: {}", abs(-3));
    }
}
```

`extern "C"`는 C ABI(Application Binary Interface)를 사용하여 외부 함수를 선언합니다. `unsafe` 블록 내에서 호출해야 합니다. C 표준 라이브러리 함수를 호출할 수 있습니다.

### C 라이브러리 링크

```rust
#[link(name = "m")]
extern "C" {
    fn cos(input: f64) -> f64;
}

fn main() {
    unsafe {
        println!("cos(1.0) = {}", cos(1.0));
    }
}
```

`#[link(name = "m")]`으로 수학 라이브러리(libm)를 링크합니다. 운영체제에 따라 링크 방식이 다를 수 있습니다.

### Rust 함수를 C에서 호출

```rust
#[no_mangle]
pub extern "C" fn hello_from_rust() {
    println!("Hello from Rust!");
}
```

`#[no_mangle]`으로 이름 맹글링을 비활성화하고 `extern "C"`로 C ABI를 사용합니다. C에서 이 함수를 호출할 수 있습니다.

## 인라인 어셈블리

```rust
use std::arch::asm;

fn add(a: i32, b: i32) -> i32 {
    unsafe {
        let result;
        asm!(
            "add {0}, {1}, {2}",
            out(reg) result,
            in(reg) a,
            in(reg) b,
        );
        result
    }
}

fn main() {
    println!("2 + 3 = {}", add(2, 3));
}
```

`asm!` 매크로로 인라인 어셈블리를 작성할 수 있습니다. 플랫폼에 따라 문법이 다르며 `std::arch::asm` 모듈을 사용합니다. 고성능이 필요한 코드에 사용됩니다.

## 안전한 래퍼

```rust
struct SafeSlice<'a> {
    slice: &'a mut [i32],
}

impl<'a> SafeSlice<'a> {
    fn new(slice: &'a mut [i32]) -> Self {
        SafeSlice { slice }
    }

    fn split_at_mut(&mut self, mid: usize) -> (&mut [i32], &mut [i32]) {
        assert!(mid <= self.slice.len());
        unsafe {
            let ptr = self.slice.as_mut_ptr();
            let len = self.slice.len();
            (
                std::slice::from_raw_parts_mut(ptr, mid),
                std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
            )
        }
    }
}

fn main() {
    let mut v = vec![1, 2, 3, 4, 5];
    let mut safe_slice = SafeSlice::new(&mut v);
    let (left, right) = safe_slice.split_at_mut(2);

    println!("left: {:?}", left);
    println!("right: {:?}", right);
}
```

unsafe 코드는 안전한 래퍼로 캡슐화해야 합니다. 래퍼는 불변성을 검사하고 unsafe 작업을 수행합니다. 사용자는 안전한 인터페이스만 사용하면 됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> unsafe 코드는 언제 사용해야 하나요?</strong></summary>

unsafe 코드는 다음 경우에 사용합니다: (1) 저수준 하드웨어 접근 (2) C 라이브러리와 상호작용 (3) 성능 최적화 (4) Rust의 보장이 너무 엄격할 때. 대부분의 경우 safe Rust로 충분합니다. unsafe는 최후의 수단으로 사용해야 하며, 안전한 래퍼로 캡슐화해야 합니다.
</details>

<details>
<summary><strong>Q> 원시 포인터는 언제 사용해야 하나요?</strong></summary>

원시 포인터는 다음 경우에 사용합니다: (1) C 라이브러리와 상호작용 (2) 포인터 연산이 필요할 때 (3) Rust의 빌림 규칙이 너무 엄격할 때. 대부분의 경우 참조가 더 안전합니다. 원시 포인터는 unsafe 블록 내에서만 역참조할 수 있으며, 개발자가 안전성을 보장해야 합니다.
</details>

<details>
<summary><strong>Q> FFI 호출 시 주의할 점은 무엇인가요?</strong></summary>

FFI 호출 시 다음을 주의해야 합니다: (1) C 함수의 불변성을 이해해야 함 (2) 메모리 관리를 명확히 해야 함 (3) 타입 호환성을 확인해야 함 (4) 패닉이 FFI 경계를 넘지 않도록 해야 함. C 코드에서 Rust 메모리를 해제하면 정의되지 않은 동작이 발생할 수 있습니다.
</details>

<details>
<summary><strong>Q> unsafe 트레이트는 왜 필요한가요?</strong></summary>

unsafe 트레이트는 구현자가 특정 불변성을 유지해야 함을 나타냅니다. 예: `Send`는 타입이 스레드 간 안전하게 이동할 수 있음을 보장해야 합니다. Rust는 자동으로 구현할 수 없으므로 개발자가 수동으로 구현해야 합니다. 잘못 구현하면 데이터 레이스가 발생할 수 있습니다.
</details>

<details>
<summary><strong>Q> unsafe 코드를 안전하게 캡슐화하는 방법은 무엇인가요?</strong></summary>

unsafe 코드를 안전하게 캡슐화하는 방법: (1) 불변성을 검사하는 래퍼 함수 제공 (2) unsafe 블록을 최소화 (3) 문서로 불변성 명시 (4) 테스트로 안전성 검증. 사용자는 안전한 인터페이스만 사용하면 unsafe 코드의 존재를 알 필요가 없습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **unsafe** | Rust 보장 비활성화 | 5가지 작업 허용 |
| **원시 포인터** | *const T, *mut T | 빌림 규칙 없음 |
| **unsafe 함수** | 호출 시 unsafe 필요 | 안전성 보장 필요 |
| **unsafe 트레이트** | 구현 시 unsafe 필요 | 불변성 유지 필요 |
| **mutable static** | 전역 가변 상태 | 데이터 레이스 가능 |
| **FFI** | 외부 함수 호출 | extern "C" 사용 |
| **인라인 어셈블리** | asm! 매크로 | 플랫폼 의존적 |
| **안전한 래퍼** | unsafe 캡슐화 | 불변성 검사 |


## 다음 수업

다음 글에서는 Rust 고급 — 매크로, 선언형 매크로, 절차형 매크로, derive 매크로를 배웁니다.
