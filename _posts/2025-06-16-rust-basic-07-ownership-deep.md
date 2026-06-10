---
layout: post
title: "Rust 소유권 심화 — 대여 규칙, 라이프타임, 댕글링 참조 방지, 슬라이스"
description: "Rust의 소유권 시스템을 컴파일러 레벨에서 심화 학습합니다. 대여 규칙(borrowing rules)은 데이터에 여러 불변 참조 또는 단일 가변 참조만 허용하여 데이터 레이스를 방지합니다. 댕글링 참조(dangling reference)는 컴파일러가 라이프타임(lifetime)을 추적하여 방지합니다. 라이프타임은 참조가 유효한 범위를 나타내며 'a 문법으로 명시할 수 있습니다. 슬라이스는 컬렉션의 연속된 요소 참조로 &str은 문자열 슬라이스, &[T]는 배열 슬라이스입니다. Rust 컴파일러는 빌림 검사기(borrow checker)로 대여 규칙을 컴파일 타임에 검사합니다."
date: 2025-06-16 10:00:00 +0900
category: rust
tags: [rust, ownership, borrowing, lifetime, slice, dangling-reference, borrow-checker]
level: basic
---

Rust의 소유권 시스템은 대여 규칙과 라이프타임으로 메모리 안전성을 컴파일 타임에 보장합니다.

> **핵심 정리** · 대여 규칙은 여러 불변 참조 또는 단일 가변 참조만 허용합니다. 라이프타임은 참조의 유효 범위를 나타내며 컴파일러가 추적합니다. 댕글링 참조는 라이프타임 검사로 방지됩니다. 슬라이스는 컬렉션의 일부를 참조합니다.


## 수업 목표

- 대여 규칙(borrowing rules)을 이해합니다.
- 라이프타임(lifetime)의 개념을 이해합니다.
- 댕글링 참조가 방지되는 원리를 이해합니다.
- 슬라이스(slice)의 사용법을 이해합니다.
- 빌림 검사기(borrow checker)의 동작을 이해합니다.

## 대여 규칙 (Borrowing Rules)

```rust
fn main() {
    let mut s = String::from("hello");

    // 불변 참조 - 여러 개 가능
    let r1 = &s;
    let r2 = &s;
    println!("r1: {}, r2: {}", r1, r2);

    // 가변 참조 - 단일만 가능
    let r3 = &mut s;
    println!("r3: {}", r3);

    // 불변과 가변 참조는 동시에 불가
    // let r4 = &s;  // 컴파일 에러
}
```

대여 규칙은 다음 세 가지입니다:
1. 데이터에 여러 불변 참조(&T)를 가질 수 있습니다.
2. 데이터에 단일 가변 참조(&mut T)를 가질 수 있습니다.
3. 불변 참조와 가변 참조는 동시에 가질 수 없습니다.

이 규칙은 데이터 레이스(data race)를 컴파일 타임에 방지합니다.

### 데이터 레이스

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3];

    let handle = thread::spawn(|| {
        // data.push(4);  // 컴파일 에러: 데이터 레이스 방지
        println!("스레드: {:?}", data);
    });

    data.push(4);
    handle.join().unwrap();
}
```

데이터 레이스는 다음 조건에서 발생합니다:
1. 두 개 이상의 포인터가 동시에 같은 데이터에 접근
2. 최소 하나의 포인터가 데이터를 쓰기
3. 동기화 메커니즘이 없음

Rust는 대여 규칙으로 이를 컴파일 타임에 방지합니다.

## 라이프타임 (Lifetime)

```rust
fn main() {
    let r;                // 'a 시작

    {
        let x = 5;        // 'b 시작
        r = &x;           // 컴파일 에러: x의 라이프타임이 더 짧음
    }                     // 'b 종료, x 해제

    // println!("{}", r); // 댕글링 참조
}
```

라이프타임은 참조가 유효한 범위를 나타냅니다. 컴파일러는 모든 참조의 라이프타임이 참조하는 데이터보다 길거나 같은지 확인합니다. 위 코드는 `r`이 `x`보다 더 오래 살아있으므로 댕글링 참조가 발생하여 컴파일 에러가 발생합니다.

### 라이프타임 명시

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("긴 문자열");
    let string2 = String::from("짧음");

    let result = longest(&string1, &string2);
    println!("더 긴 문자열: {}", result);
}
```

`'a`는 라이프타임 파라미터로, 참조의 유효 범위를 나타냅니다. `longest<'a>`는 반환값의 라이프타임이 매개변수 중 더 짧은 라이프타임과 같음을 보장합니다. 이는 댕글링 참조를 방지합니다.

### 라이프타임 생략 (Lifetime Elision)

```rust
fn first_word(s: &str) -> &str {
    // 라이프타임 명시가 필요 없음
    // 컴파일러가 추론함
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

라이프타임 생략 규칙(lifetime elision rules)으로 컴파일러가 라이프타임을 추론할 수 있습니다. 다음 세 가지 규칙이 적용됩니다:
1. 각 참조 매개변수는 고유한 라이프타임 파라미터를 가짐
2. 단일 참조 매개변수이면 반환값도 그 라이프타임을 가짐
3. 여러 참조 매개변수이면 반환값 라이프타임을 추론할 수 없음

## 댕글링 참조 방지

```rust
fn dangle() -> &String {  // 컴파일 에러
    let s = String::from("hello");
    &s  // s가 여기서 해제됨
}

fn no_dangle() -> String {  // 정상
    let s = String::from("hello");
    s  // 소유권 이동
}
```

댕글링 참조는 해제된 메모리를 참조하는 포인터입니다. Rust는 라이프타임 검사로 이를 컴파일 타임에 방지합니다. `dangle()`은 `s`의 참조를 반환하지만 `s`는 함수 종료 시 해제되므로 컴파일 에러가 발생합니다. `no_dangle()`은 소유권을 이동하므로 정상입니다.

## 슬라이스 (Slice)

```rust
fn main() {
    let s = String::from("hello world");

    let hello = &s[0..5];   // 문자열 슬라이스
    let world = &s[6..11];

    println!("hello: {}, world: {}", hello, world);

    // 전체 슬라이스
    let whole = &s[..];
    println!("전체: {}", whole);
}
```

슬라이스는 컬렉션의 연속된 요소 참조입니다. `&s[0..5]`는 인덱스 0부터 5 미만까지의 슬라이스입니다. `&s[..]`는 전체 슬라이스입니다. 슬라이스는 소유권 없이 데이터를 읽을 수 있습니다.

### 문자열 슬라이스

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

fn main() {
    let s = String::from("hello world");
    let word = first_word(&s);
    println!("첫 단어: {}", word);

    let s_literal = "hello world";
    let word_literal = first_word(s_literal);
    println!("첫 단어: {}", word_literal);
}
```

`&str`은 문자열 슬라이스로 `String`의 일부 또는 문자열 리터럴을 참조할 수 있습니다. `first_word` 함수는 `&str`을 받아 첫 단어의 슬라이스를 반환합니다. `String`과 문자열 리터럴 모두 `&str`로 변환 가능합니다.

### 배열 슬라이스

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];

    let slice = &a[1..3];
    println!("슬라이스: {:?}", slice);  // [2, 3]

    let whole = &a[..];
    println!("전체: {:?}", whole);  // [1, 2, 3, 4, 5]
}
```

`&[T]`는 배열 슬라이스로 배열의 일부를 참조합니다. `&a[1..3]`는 인덱스 1부터 3 미만까지의 슬라이스입니다. 슬라이스는 길이 정보를 가지므로 안전하게 접근할 수 있습니다.

## 빌림 검사기 (Borrow Checker)

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;  // 불변 참조 생성
    let r2 = &s;  // 또 다른 불변 참조

    println!("r1: {}, r2: {}", r1, r2);
    // r1, r2가 여기서 사용됨

    let r3 = &mut s;  // 가변 참조 생성
    // r1, r2는 더 이상 사용되지 않으므로 문제 없음
    println!("r3: {}", r3);
}
```

빌림 검사기는 컴파일 타임에 대여 규칙을 검사합니다. 참조의 라이프타임(Non-Lexical Lifetime, NLL)을 추적하여 불변 참조가 사용된 후에 가변 참조를 허용합니다. 이는 더 유연한 코드를 작성할 수 있게 합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 왜 불변 참조와 가변 참조를 동시에 가질 수 없나요?</strong></summary>

불변 참조와 가변 참조를 동시에 허용하면 데이터 레이스가 발생할 수 있습니다. 가변 참조가 데이터를 수정하는 동안 불변 참조가 데이터를 읽으면 예측 불가능한 동작이 발생합니다. Rust는 이를 컴파일 타임에 방지하여 메모리 안전성을 보장합니다. 가변 참조가 필요하면 불변 참조를 먼저 사용하고 종료한 후 가변 참조를 생성해야 합니다.
</details>

<details>
<summary><strong>Q: 라이프타임은 언제 명시해야 하나요?</strong></summary>

대부분의 경우 컴파일러가 라이프타임을 추론할 수 있습니다. 라이프타임을 명시해야 하는 경우: (1) 여러 참조 매개변수가 있고 반환값 라이프타임을 결정할 때 (2) 구조체에 참조 필드가 있을 때 (3) 제네릭 타입에 참조가 포함될 때. 명시적 라이프타임은 참조 간의 관계를 명확히 하여 컴파일러가 올바르게 추론할 수 있게 합니다.
</details>

<details>
<summary><strong>Q: 슬라이스와 포인터의 차이는 무엇인가요?</strong></summary>

슬라이스는 포인터와 길이 정보를 가집니다. `&[T]`는 포인터와 길이의 구조체로, 범위 검사를 수행할 수 있습니다. 포인터는 메모리 주소만 가지며 범위 정보가 없습니다. 슬라이스는 더 안전하고 유연합니다. Rust는 슬라이스를 사용하여 배열 인덱스 오버플로우를 방지합니다.
</details>

<details>
<summary><strong>Q: NLL(Non-Lexical Lifetime)은 무엇인가요?</strong></summary>

NLL은 라이프타임을 블록 끝이 아닌 실제 마지막 사용 지점으로 추정하는 기능입니다. Rust 2018 에디션부터 도입되었습니다. 이는 더 유연한 코드를 작성할 수 있게 합니다. 예: 불변 참조를 사용한 후 가변 참조를 생성할 수 있습니다. 이전에는 불변 참조가 블록 끝까지 유효하다고 가정했으므로 가변 참조를 생성할 수 없었습니다.
</details>

<details>
<summary><strong>Q: 빌림 검사기는 어떻게 동작하나요?</strong></summary>

빌림 검사기는 컴파일 타임에 다음을 검사합니다: (1) 모든 대여가 유효한 라이프타임을 가지는지 (2) 대여 규칙을 준수하는지 (3) 댕글링 참조가 없는지. 라이프타임 추적으로 참조의 수명을 추적하고, NLL로 실제 사용 지점을 계산합니다. 검사에 실패하면 컴파일 에러가 발생합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **대여 규칙** | 참조 규칙 | 여러 불변 또는 단일 가변 |
| **데이터 레이스** | 동시 접근 문제 | 컴파일 타임 방지 |
| **라이프타임** | 참조 유효 범위 | 'a 문법으로 명시 |
| **댕글링 참조** | 해제된 메모리 참조 | 라이프타임 검사로 방지 |
| **슬라이스** | 컬렉션 일부 참조 | 포인터 + 길이 |
| **&str** | 문자열 슬라이스 | String의 일부 |
| **&[T]** | 배열 슬라이스 | 배열의 일부 |
| **빌림 검사기** | 대여 규칙 검사 | 컴파일 타임 검사 |
| **NLL** | Non-Lexical Lifetime | 실제 사용 지점으로 추정 |


## 다음 수업

다음 글에서는 Rust 중급 — 트레이트와 제네릭, 트레이트 바운드, 트레이트 객체를 배웁니다.
