---
layout: post
title: "Rust 함수 — 매개변수와 반환값, 문 vs 표현식, 클로저와 고차 함수, 캡처 규칙"
description: "Rust의 함수 시스템을 컴파일러 레벨에서 학습합니다. fn 키워드로 함수를 정의하며 매개변수 타입을 명시해야 합니다. 반환 타입은 -> 화살표로 지정하며 표현식의 마지막 값이 자동으로 반환됩니다(세미콜론 없음). 문(statement)은 값을 반환하지 않고 표현식(expression)은 값을 반환합니다. 클로저(closure)는 익명 함수로 환경을 캡처할 수 있으며 Fn/FnMut/FnOnce 트레이트로 캡처 방식이 결정됩니다. 고차 함수는 함수를 인자로 받거나 반환할 수 있습니다. Rust의 함수는 일급 시민(first-class citizen)으로 변수에 할당하고 전달할 수 있습니다. 함수 포인터와 클로저의 차이를 설명합니다."
date: 2025-06-09 10:00:00 +0900
category: rust
tags: [rust, functions, closures, higher-order-functions, fn, fnmut, fnonce]
level: basic
---

Rust의 함수는 일급 시민으로, 변수에 할당하고 인자로 전달할 수 있습니다.

> **핵심 정리** · 함수는 `fn` 키워드로 정의하며 매개변수와 반환 타입을 명시해야 합니다. 표현식은 세미콜론 없이 값을 반환합니다. 클로저는 환경을 캡처하며 Fn/FnMut/FnOnce 트레이트로 캡처 방식이 결정됩니다. 고차 함수는 함수를 인자로 받거나 반환할 수 있습니다.


## 수업 목표

- 함수 정의와 호출 방법을 이해합니다.
- 문과 표현식의 차이를 이해합니다.
- 클로저와 캡처 규칙을 이해합니다.
- Fn/FnMut/FnOnce 트레이트의 차이를 이해합니다.
- 고차 함수를 작성할 수 있습니다.

## 함수 정의와 호출

```rust
fn main() {
    println!("결과: {}", add(5, 3));
    println!("인사: {}", greet("Rust"));
}

// 매개변수 타입 명시
fn add(x: i32, y: i32) -> i32 {
    x + y  // 세미콜론 없음 = 표현식, 값 반환
}

fn greet(name: &str) -> String {
    format!("안녕, {}!", name)
}
```

`fn add(x: i32, y: i32) -> i32`는 두 개의 `i32` 매개변수를 받고 `i32`를 반환하는 함수입니다. Rust는 매개변수 타입을 반드시 명시해야 합니다. `x + y`는 세미콜론이 없으므로 표현식으로 값을 반환합니다. `format!` 매크로는 포맷된 문자열을 반환합니다.

## 문과 표현식

```rust
fn main() {
    // 문 - 값을 반환하지 않음
    let y = 6;  // let 문

    // 표현식 - 값을 반환함
    let x = {
        let y = 3;
        y + 1  // 세미콜론 없음 = 표현식
    };

    println!("x: {}", x);  // 4
}
```

문(statement)은 값을 반환하지 않는 명령입니다(예: `let`, `if` 블록). 표현식(expression)은 값을 반환합니다. 블록 `{ ... }`도 표현식으로, 마지막에 세미콜론이 없는 값이 반환됩니다. 이는 Rust가 함수형 프로그래밍 패턴을 지원하는 이유입니다.

## 매개변수와 소유권

```rust
fn main() {
    let s = String::from("hello");

    // 소유권 이동
    takes_ownership(s);
    // println!("{}", s);  // 컴파일 에러

    // 복사 전달
    let x = 5;
    makes_copy(x);
    println!("{}", x);  // 정상

    // 참조 전달
    let s2 = String::from("hello");
    takes_reference(&s2);
    println!("{}", s2);  // 정상
}

fn takes_ownership(s: String) {
    println!("{}", s);
}  // s가 여기서 해제됨

fn makes_copy(x: i32) {
    println!("{}", x);
}

fn takes_reference(s: &String) {
    println!("{}", s);
}
```

함수에 값을 전달할 때 소유권이 이동할 수 있습니다. `takes_ownership(s)`는 `String`의 소유권을 함수로 이동하므로 호출 후 `s`는 유효하지 않습니다. `makes_copy(x)`는 `i32`가 Copy 트레이트를 구현하므로 복사됩니다. `takes_reference(&s)`는 참조를 전달하므로 소유권이 이동하지 않습니다.

## 반환값과 소유권

```rust
fn main() {
    let s1 = gives_ownership();
    let s2 = String::from("hello");

    let s3 = takes_and_gives_back(s2);
    // println!("{}", s2);  // 컴파일 에러

    println!("s1: {}, s3: {}", s1, s3);
}

fn gives_ownership() -> String {
    String::from("hello")  // 소유권이 호출자로 이동
}

fn takes_and_gives_back(s: String) -> String {
    s  // s의 소유권이 호출자로 이동
}
```

함수가 값을 반환할 때 소유권도 함께 이동합니다. `gives_ownership()`은 새 `String`을 생성하고 소유권을 호출자로 이동합니다. `takes_and_gives_back(s)`는 `s`의 소유권을 받고 다시 호출자로 이동합니다.

## 클로저 (Closures)

```rust
fn main() {
    let x = 4;

    // 클로저 정의
    let equal_to_x = |z| z == x;

    println!("z는 x와 같은가? {}", equal_to_x(4));
}
```

클로저는 익명 함수로 환경의 변수를 캡처할 수 있습니다. `|z| z == x`는 `x`를 캡처하는 클로저입니다. 클로저는 `Fn`, `FnMut`, `FnOnce` 트레이트 중 하나를 구현합니다.

### 클로저 타입 추론

```rust
fn main() {
    let add = |x, y| x + y;
    let result = add(1, 2);
    println!("결과: {}", result);
}
```

클로저는 매개변수와 반환 타입을 추론할 수 있습니다. 필요한 경우 명시할 수도 있습니다: `let add: fn(i32, i32) -> i32 = |x: i32, y: i32| -> i32 { x + y };`

## 캡처 규칙

```rust
fn main() {
    let x = vec![1, 2, 3];

    // Fn - 불변 참조 캡처
    let equal_to_x = |z| z == x;

    // FnMut - 가변 참조 캡처
    let mut counter = 0;
    let mut increment = || {
        counter += 1;
        counter
    };

    // FnOnce - 소유권 캡처
    let consume_x = || {
        println!("x: {:?}", x);
        // x가 여기서 소비됨
    };

    consume_x();
    // equal_to_x(4);  // 컴파일 에러: x가 이미 소비됨
}
```

클로저는 환경을 캡처하는 방식에 따라 세 가지 트레이트를 구현합니다:
- **Fn**: 불변 참조로 캡처, 여러 번 호출 가능
- **FnMut**: 가변 참조로 캡처, 여러 번 호출 가능
- **FnOnce**: 소유권으로 캡처, 단 한 번만 호출 가능

## 고차 함수

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 클로저를 인자로 전달
    let doubled: Vec<i32> = numbers.iter()
        .map(|x| x * 2)
        .collect();

    println!("두 배: {:?}", doubled);

    // 함수를 인자로 전달
    let result = apply_operation(5, 3, add);
    println!("결과: {}", result);
}

fn add(x: i32, y: i32) -> i32 {
    x + y
}

fn apply_operation(x: i32, y: i32, op: fn(i32, i32) -> i32) -> i32 {
    op(x, y)
}
```

고차 함수는 함수를 인자로 받거나 반환할 수 있습니다. `apply_operation`은 함수 포인터 `fn(i32, i32) -> i32`를 인자로 받습니다. `.map(|x| x * 2)`는 클로저를 이터레이터 메서드에 전달합니다.

## 함수 포인터

```rust
fn add_one(x: i32) -> i32 {
    x + 1
}

fn main() {
    let f: fn(i32) -> i32 = add_one;
    println!("결과: {}", f(5));
}
```

함수 포인터 `fn(T) -> R`은 함수를 가리키는 타입입니다. 클로저와 달리 환경을 캡처하지 않습니다. 함수 포인터는 `Fn`, `FnMut`, `FnOnce`를 모두 구현하므로 클로저가 필요한 곳에 사용할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 문과 표현식의 차이는 무엇인가요?</strong></summary>

문(statement)은 값을 반환하지 않는 명령입니다. 예: `let x = 5;`, `if condition { ... }`. 표현식(expression)은 값을 반환합니다. 예: `5`, `x + 1`, `{ let y = 3; y + 1 }`. Rust에서 블록 `{ ... }`도 표현식으로, 마지막에 세미콜론이 없는 값이 반환됩니다. 이는 함수형 프로그래밍 스타일을 지원합니다. `let x = if condition { 1 } else { 2 };`처럼 표현식을 변수에 할당할 수 있습니다.
</details>

<details>
<summary><strong>Q: 왜 Rust는 매개변수 타입을 명시해야 하나요?</strong></summary>

Rust는 타입 추론을 지원하지만 함수 시그니처에서는 타입을 명시해야 합니다. 이는 다음 이유로: (1) **명시성**: 함수 인터페이스가 명확해집니다. (2) **컴파일러**: 함수 본문의 타입 추론을 돕습니다. (3) **문서화**: 타입이 문서 역할을 합니다. (4) **ABI**: 함수 호출 규약을 결정합니다. 함수 본문 내에서는 타입 추론이 가능합니다: `let x = 5;`에서 `x`는 `i32`로 추론됩니다.
</details>

<details>
<summary><strong>Q: Fn, FnMut, FnOnce의 차이는 무엇인가요?</strong></summary>

이들은 클로저가 환경을 캡처하는 방식을 나타내는 트레이트입니다: (1) **Fn**: 불변 참조로 캡처, 여러 번 호출 가능. 읽기 전용 클로저. (2) **FnMut**: 가변 참조로 캡처, 여러 번 호출 가능. 환경을 수정하는 클로저. (3) **FnOnce**: 소유권으로 캡처, 단 한 번만 호출 가능. 환경을 소비하는 클로저. `FnOnce`가 가장 일반적이며, `Fn`과 `FnMut`는 `FnOnce`를 상속합니다.
</details>

<details>
<summary><strong>Q: 클로저와 함수 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

클로저는 다음 경우에 사용합니다: (1) 환경을 캡처해야 할 때 (2) 짧은 일회성 함수가 필요할 때 (3) 이터레이터 메서드에 전달할 때. 함수는 다음 경우에 사용합니다: (1) 재사용 가능한 명명된 함수가 필요할 때 (2) 환경 캡처가 필요 없을 때 (3) 함수 포인터로 전달할 때. 클로저는 더 유연하지만 함수는 더 명시적입니다.
</details>

<details>
<summary><strong>Q: 함수 포인터와 클로저의 차이는 무엇인가요?</strong></summary>

함수 포인터 `fn(T) -> R`은 명명된 함수를 가리키며 환경을 캡처하지 않습니다. 클로저는 익명 함수로 환경을 캡처할 수 있습니다. 함수 포인터는 `Fn`, `FnMut`, `FnOnce`를 모두 구현하므로 클로저가 필요한 곳에 사용할 수 있지만, 그 반대는 불가능합니다. 함수 포인터는 더 가볍고, 클로저는 더 유연합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **fn** | 함수 정의 | 매개변수/반환 타입 명시 |
| **표현식** | 값을 반환 | 세미콜론 없음 |
| **문** | 값을 반환하지 않음 | 세미콜론으로 끝남 |
| **클로저** | 익명 함수 | 환경 캡처 가능 |
| **Fn** | 불변 참조 캡처 | 여러 번 호출 가능 |
| **FnMut** | 가변 참조 캡처 | 여러 번 호출 가능 |
| **FnOnce** | 소유권 캡처 | 단 한 번 호출 가능 |
| **고차 함수** | 함수를 인자/반환 | 함수 포인터 또는 클로저 |


## 다음 수업

다음 글에서는 Rust의 구조체 — 필드, 메서드, 튜플 구조체, 유닛 구조체를 배웁니다.
