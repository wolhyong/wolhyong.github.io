---
layout: post
title: "Rust 테스트 — 유닛 테스트, 통합 테스트, 문서 테스트, assert 매크로, 테스트 조직화"
description: "Rust의 테스트 시스템을 실무 레벨에서 학습합니다. #[test] 속성으로 테스트 함수를 정의하며 assert!, assert_eq!, assert_ne! 매크로로 단언을 수행합니다. should_panic 속성으로 패닉이 발생하는지 확인하며 expected로 예상 메시지를 지정할 수 있습니다. Result<T, E>를 반환하여 테스트에서 에러를 처리할 수 있습니다. 유닛 테스트는 src 디렉토리의 각 모듈 내에 tests 모듈로 작성하며 private 함수도 테스트할 수 있습니다. 통합 테스트는 tests 디렉토리에 별도 파일로 작성하며 라이브러리의 공개 API만 테스트합니다. 문서 테스트는 코드 예제를 테스트하며 ///와 //!로 문서를 작성합니다. cargo test로 모든 테스트를 실행하며 필터링과 병렬 실행을 지원합니다."
date: 2025-07-02 10:00:00 +0900
category: rust
tags: [rust, testing, unit-tests, integration-tests, doc-tests, assertions]
level: intermediate
---

Rust는 표준 라이브러리에 내장된 테스트 프레임워크를 제공하며 추가 의존성 없이 테스트를 작성할 수 있습니다.

> **핵심 정리** · `#[test]` 속성으로 테스트 함수를 정의합니다. `assert!`, `assert_eq!`, `assert_ne!`로 단언을 수행합니다. 유닛 테스트는 모듈 내 `tests` 모듈에 작성하며 private 함수도 테스트할 수 있습니다. 통합 테스트는 `tests` 디렉토리에 작성하며 공개 API만 테스트합니다. 문서 테스트는 코드 예제를 자동으로 테스트합니다.


## 수업 목표

- #[test] 속성으로 테스트를 정의할 수 있습니다.
- assert 매크로로 단언을 수행할 수 있습니다.
- should_panic으로 패닉 테스트를 작성할 수 있습니다.
- 유닛 테스트와 통합 테스트의 차이를 이해합니다.
- 문서 테스트를 작성할 수 있습니다.
- cargo test로 테스트를 실행하고 필터링할 수 있습니다.

## 테스트 함수 정의

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
```

`#[test]` 속성은 함수를 테스트 함수로 표시합니다. `cargo test`로 실행하며 테스트가 패닉이 발생하면 실패로 간주합니다. `#[cfg(test)]`는 테스트 빌드에서만 컴파일되도록 합니다.

### 테스트 실행

```bash
$ cargo test
   Compiling my_project v0.1.0
    Finished test [unoptimized + debuginfo] target(s) in 0.00s
     Running unittests src/lib.rs

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

`cargo test`는 모든 테스트를 실행합니다. 테스트가 통과하면 `ok`, 실패하면 `FAILED`가 출력됩니다. 출력은 기본적으로 캡처되며 실패한 테스트만 출력됩니다.

## assert 매크로

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert!(true);  // 항상 통과
    }

    #[test]
    fn addition() {
        assert_eq!(2 + 2, 4);  // 같으면 통과
    }

    #[test]
    fn not_equal() {
        assert_ne!(2 + 2, 5);  // 다르면 통과
    }
}
```

`assert!(condition)`은 조건이 `true`이면 통과합니다. `assert_eq!(left, right)`는 두 값이 같으면 통과하며 실패 시 두 값을 출력합니다. `assert_ne!(left, right)`는 두 값이 다르면 통과합니다.

### 커스텀 실패 메시지

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn greeting_contains_name() {
        let greeting = "Hello, Wolhyong!";
        assert!(
            greeting.contains("Wolhyong"),
            "Greeting did not contain name, value was `{}`",
            greeting
        );
    }
}
```

`assert!`의 두 번째 인자로 커스텀 실패 메시지를 지정할 수 있습니다. 포맷 문자열을 사용하여 실패 시 추가 정보를 제공합니다.

## should_panic

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {}.", value);
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

`#[should_panic]` 속성은 테스트가 패닉이 발생하면 통과합니다. 패닉이 발생하지 않으면 실패합니다.

### expected로 예상 메시지

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "Guess value must be between 1 and 100")]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

`expected`로 패닉 메시지의 일부를 지정할 수 있습니다. 지정된 부분이 패닉 메시지에 포함되어야 통과합니다. 더 정확한 테스트가 가능합니다.

## Result<T, E> 반환

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() -> Result<(), String> {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("two plus two does not equal four"))
        }
    }
}
```

테스트 함수가 `Result<T, E>`를 반환하면 `Err` 반환 시 실패로 간주합니다. `should_panic`과 함께 사용할 수 없습니다. 에러 메시지를 자동으로 출력합니다.

## 유닛 테스트

```rust
pub fn add_two(a: i32) -> i32 {
    a + 2
}

pub fn internal_adder(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_two() {
        assert_eq!(4, add_two(2));
    }

    #[test]
    fn test_internal() {
        assert_eq!(4, internal_adder(2, 2));
    }
}
```

유닛 테스트는 각 모듈 내 `tests` 모듈에 작성합니다. `use super::*;`로 상위 모듈의 항목을 가져옵니다. private 함수도 테스트할 수 있습니다.

### 테스트 조직화

```
src/
├── lib.rs
├── front_of_house.rs
└── front_of_house/
    ├── mod.rs
    ├── hosting.rs
    └── serving.rs
```

각 모듈에 `tests` 모듈을 추가하여 테스트를 조직화할 수 있습니다. 테스트는 해당 모듈 근처에 위치하여 유지보수성을 높입니다.

## 통합 테스트

```
my_project/
├── Cargo.toml
├── src/
│   └── lib.rs
└── tests/
    └── integration_test.rs
```

```rust
// tests/integration_test.rs
use my_project;

#[test]
fn it_adds_two() {
    assert_eq!(4, my_project::add_two(2));
}
```

통합 테스트는 `tests` 디렉토리에 별도 파일로 작성합니다. 라이브러리의 공개 API만 테스트할 수 있습니다. `use my_project;`로 라이브러리 크레이트를 가져옵니다.

### 통합 테스트 서브모듈

```
tests/
├── common.rs
└── integration_test.rs
```

```rust
// tests/common.rs
pub fn setup() {
    // 공통 설정
}
```

`tests` 디렉토리의 파일은 별도 크레이트로 컴파일되므로 `common.rs`는 테스트 파일이 아닌 모듈로 간주됩니다. `common/mod.rs`로 이름을 변경하면 테스트로 간주됩니다.

## 문서 테스트

```rust
/// 주어진 숫자에 2를 더합니다.
///
/// # Examples
///
/// ```
/// use my_project::add_two;
///
/// assert_eq!(4, add_two(2));
/// ```
pub fn add_two(a: i32) -> i32 {
    a + 2
}
```

`///`로 함수 문서를 작성하며 코드 블록을 포함할 수 있습니다. `cargo test`는 문서의 코드 예제도 테스트합니다. 문서와 테스트가 동기화되어 유지보수성이 높아집니다.

### 문서 테스트 속성

```rust
/// # Examples
///
/// ```
/// # use my_project::add_two;
/// assert_eq!(4, add_two(2));
/// ```
```

`#`로 시작하는 줄은 문서에서는 보이지만 테스트에서는 컴파일되지 않습니다. `use` 문이나 설정 코드를 숨길 때 유용합니다.

## 테스트 실행 제어

```bash
# 특정 테스트만 실행
$ cargo test test_add_two

# 특정 모듈의 테스트만 실행
$ cargo test tests::test_internal

# 단일 스레드로 실행
$ cargo test -- --test-threads=1

# 출력 표시
$ cargo test -- --show-output

# 무시된 테스트 포함
$ cargo test -- --ignored
```

`cargo test`는 인자를 받아 테스트 실행을 제어할 수 있습니다. `--` 뒤의 인자는 테스트 바이너리에 전달됩니다. 필터링, 병렬 실행 제어, 출력 제어 등이 가능합니다.

## 무시된 테스트

```rust
#[test]
#[ignore]
fn expensive_test() {
    // 시간이 오래 걸리는 테스트
}
```

`#[ignore]` 속성으로 테스트를 무시할 수 있습니다. `cargo test -- --ignored`로 무시된 테스트만 실행할 수 있습니다. 시간이 오래 걸리는 테스트에 유용합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 유닛 테스트와 통합 테스트의 차이는 무엇인가요?</strong></summary>

유닛 테스트는 개별 함수, 모듈, 단위를 테스트하며 `src` 디렉토리 내에 작성합니다. private 함수도 테스트할 수 있으며 빠르게 실행됩니다. 통합 테스트는 라이브러리의 공개 API를 테스트하며 `tests` 디렉토리에 작성합니다. 여러 모듈이 함께 작동하는지 테스트하며 느리게 실행됩니다.
</details>

<details>
<summary><strong>Q> 왜 private 함수도 테스트할 수 있나요?</strong></summary>

Rust의 테스트는 같은 크레이트 내에 있으므로 private 항목에도 접근할 수 있습니다. 이는 내부 구현을 테스트할 수 있게 하여 버그를 조기에 발견하게 합니다. 하지만 공개 API 테스트를 우선하고, private 테스트는 보조적으로 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> assert_eq!와 assert! 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`assert_eq!`는 두 값이 같은지 확인할 때 사용하며 실패 시 두 값을 출력하여 디버깅에 유용합니다. `assert!`는 일반적인 조건을 확인할 때 사용합니다. 값 비교가 필요하면 `assert_eq!`를, 그렇지 않으면 `assert!`를 사용합니다. `assert_ne!`는 값이 다른지 확인할 때 사용합니다.
</details>

<details>
<summary><strong>Q> 문서 테스트는 언제 사용해야 하나요?</strong></summary>

문서 테스트는 코드 예제가 올바르게 작동하는지 확인할 때 사용합니다. 문서와 테스트가 동기화되어 유지보수성이 높아집니다. 사용자에게 예제를 제공하며 예제가 항상 작동함을 보장합니다. 모든 공개 함수에 문서 테스트를 추가하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 테스트 병렬 실행은 어떻게 제어하나요?</strong></summary>

`cargo test -- --test-threads=1`로 단일 스레드로 실행할 수 있습니다. 기본적으로 테스트는 병렬로 실행되어 빠르지만, 공유 상태를 수정하는 테스트는 충돌할 수 있습니다. 단일 스레드로 실행하면 충돌을 방지할 수 있지만 느려집니다. 각 테스트가 독립적이도록 작성하는 것이 좋습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **#[test]** | 테스트 함수 표시 | cargo test로 실행 |
| **assert!** | 조건 단언 | 커스텀 메시지 가능 |
| **assert_eq!** | 동등성 단언 | 실패 시 값 출력 |
| **assert_ne!** | 비동등성 단언 | 다르면 통과 |
| **should_panic** | 패닉 테스트 | expected로 메시지 확인 |
| **Result 반환** | 에러 처리 | Err 반환 시 실패 |
| **유닛 테스트** | 모듈 내 테스트 | private 함수도 가능 |
| **통합 테스트** | 공개 API 테스트 | tests 디렉토리 |
| **문서 테스트** | 코드 예제 테스트 /// 문서 포함 |
| **#[ignore]** | 테스트 무시 | --ignored로 실행 |


## 다음 수업

다음 글에서는 Rust 고급 — unsafe Rust, 원시 포인터, FFI, 어셈블리 인라인을 배웁니다.
