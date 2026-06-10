---
layout: post
title: "Rust 열거형 — 데이터가 있는 열거형, Option과 Result, match로 패턴 매칭, 널 안전성"
description: "Rust의 열거형 시스템을 타입 레벨에서 학습합니다. enum 키워드로 열거형을 정의하며 데이터가 있는 열거형은 각 변형이 다른 타입의 데이터를 가질 수 있습니다. Option<T>는 값이 있거나 없음을 표현하는 널 안전 타입으로 Some(T)과 None 변형을 가집니다. Result<T, E>는 성공 또는 실패를 표현하며 Ok(T)과 Err(E) 변형을 가집니다. match로 열거형을 패턴 매칭하며 exhaustive하게 모든 경우를 처리해야 합니다. if let과 while let으로 간단한 패턴 매칭을 할 수 있습니다. Rust의 열거형은 널 포인터 예외를 컴파일 타임에 방지합니다."
date: 2025-06-13 10:00:00 +0900
category: rust
tags: [rust, enums, option, result, pattern-matching, null-safety]
level: basic
---

Rust의 열거형은 다양한 데이터를 하나의 타입으로 표현하며 널 안전성을 보장합니다.

> **핵심 정리** · 열거형은 `enum` 키워드로 정의하며 각 변형이 다른 데이터를 가질 수 있습니다. `Option<T>`는 널 안전성을 제공하며 `Some(T)`과 `None` 변형을 가집니다. `Result<T, E>`는 에러 처리를 위한 타입입니다. `match`로 exhaustive하게 패턴 매칭합니다.


## 수업 목표

- 열거형 정의와 사용법을 이해합니다.
- 데이터가 있는 열거형을 이해합니다.
- Option<T>와 널 안전성을 이해합니다.
- Result<T, E>와 에러 처리를 이해합니다.
- match로 패턴 매칭을 할 수 있습니다.

## 기본 열거형

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

fn main() {
    let home = IpAddr::V4(127, 0, 0, 1);
    let loopback = IpAddr::V6(String::from("::1"));

    route(home);
    route(loopback);
}

fn route(ip: IpAddr) {
    match ip {
        IpAddr::V4(a, b, c, d) => println!("IPv4: {}.{}.{}.{}", a, b, c, d),
        IpAddr::V6(addr) => println!("IPv6: {}", addr),
    }
}
```

열거형은 각 변형이 다른 타입과 개수의 데이터를 가질 수 있습니다. `IpAddr::V4`는 4개의 `u8`을, `IpAddr::V6`는 `String`을 가집니다. `match`로 각 변형을 패턴 매칭합니다.

## Option<T>

```rust
enum Option<T> {
    Some(T),
    None,
}

fn main() {
    let some_number = Some(5);
    let some_string = Some("문자열");
    let absent_number: Option<i32> = None;

    println!("{:?}", some_number);
    println!("{:?}", some_string);
    println!("{:?}", absent_number);
}
```

`Option<T>`는 표준 라이브러리에 정의된 열거형으로 값이 있거나 없음을 표현합니다. `Some(T)`는 값을 가지며, `None`은 값이 없음을 나타냅니다. `None`을 사용할 때는 타입을 명시해야 합니다.

### Option 사용

```rust
fn main() {
    let x: Option<i32> = Some(5);
    let y: Option<i32> = None;

    // Option에 연산 적용
    let sum = x.and_then(|a| {
        y.map(|b| a + b)
    });

    println!("합: {:?}", sum);  // None

    let x2: Option<i32> = Some(5);
    let y2: Option<i32> = Some(3);

    let sum2 = x2.and_then(|a| {
        y2.map(|b| a + b)
    });

    println!("합: {:?}", sum2);  // Some(8)
}
```

`Option<T>`는 널 안전성을 제공합니다. 값이 없을 수 있는 경우 `Option<T>`를 사용하여 컴파일 타임에 널 체크를 강제합니다. `.and_then()`, `.map()` 등의 메서드로 체이닝할 수 있습니다.

## Result<T, E>

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("0으로 나눌 수 없음"))
    } else {
        Ok(a / b)
    }
}

fn main() {
    let result = divide(10, 2);
    match result {
        Ok(value) => println!("결과: {}", value),
        Err(e) => println!("에러: {}", e),
    }

    let result2 = divide(10, 0);
    match result2 {
        Ok(value) => println!("결과: {}", value),
        Err(e) => println!("에러: {}", e),
    }
}
```

`Result<T, E>`는 성공(`Ok(T)`) 또는 실패(`Err(E)`)를 표현합니다. 에러 처리를 위한 타입으로 예외 대신 사용합니다. `?` 연산자로 에러 전파를 간소화할 수 있습니다.

### ? 연산자

```rust
fn read_file() -> Result<String, std::io::Error> {
    let content = std::fs::read_to_string("test.txt")?;
    Ok(content)
}

fn main() {
    match read_file() {
        Ok(content) => println!("내용: {}", content),
        Err(e) => println!("에러: {}", e),
    }
}
```

`?` 연산자는 `Result`를 반환하는 함수에서 에러를 전파합니다. `Ok`면 값을 추출하고, `Err`면 즉시 함수에서 에러를 반환합니다. 예외와 유사하지만 타입 안전합니다.

## match로 패턴 매칭

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: &Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {
    let coin = Coin::Quarter;
    println!("값: {}센트", value_in_cents(&coin));
}
```

`match`는 열거형의 각 변형을 패턴 매칭합니다. 모든 경우를 exhaustive하게 처리해야 합니다. `_` 와일드카드로 나머지 경우를 처리할 수 있습니다.

### 값 바인딩

```rust
#[derive(Debug)]
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::Move { x: 10, y: 20 };

    match msg {
        Message::Quit => println!("종료"),
        Message::Move { x, y } => println!("이동: {}, {}", x, y),
        Message::Write(text) => println!("쓰기: {}", text),
        Message::ChangeColor(r, g, b) => println!("색상: {}, {}, {}", r, g, b),
    }
}
```

패턴에서 값을 바인딩할 수 있습니다. `Message::Move { x, y }`는 `x`와 `y` 필드를 추출합니다.

## if let과 while let

```rust
fn main() {
    let some_value = Some(7);
    let none_value: Option<i32> = None;

    // if let
    if let Some(x) = some_value {
        println!("값: {}", x);
    }

    // while let
    let mut optional = Some(0);

    while let Some(i) = optional {
        if i > 5 {
            optional = None;
        } else {
            println!("i = {:?}", i);
            optional = Some(i + 1);
        }
    }
}
```

`if let`은 단일 패턴 매칭을 간소화합니다. `while let`은 패턴이 매칭되는 동안 반복합니다. `match`의 간단한 경우에 사용됩니다.

## 널 안전성

```rust
fn main() {
    // Rust에는 null이 없음
    // let x: i32 = null;  // 컴파일 에러

    // 대신 Option 사용
    let x: Option<i32> = None;

    // 명시적 처리 필요
    match x {
        Some(value) => println!("값: {}", value),
        None => println!("값 없음"),
    }
}
```

Rust에는 널 포인터가 없습니다. 대신 `Option<T>`를 사용하여 값이 없음을 표현합니다. 이는 컴파일 타임에 널 체크를 강제하여 널 포인터 예외를 방지합니다. Tony Hoare의 "십억 달러의 실수"를 해결합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Rust에 null이 없는 이유는 무엇인가요?</strong></summary>

null은 "값이 없음"을 표현하지만, 타입 시스템과 충돌하여 널 포인터 예외를 유발합니다. Rust는 `Option<T>`로 "값이 있거나 없음"을 타입 수준에서 표현합니다. 이는 컴파일 타임에 널 체크를 강제하여 런타임 에러를 방지합니다. Tony Hoare(null 도입자)은 이를 "십억 달러의 실수"라고 회고했습니다.
</details>

<details>
<summary><strong>Q: Option과 Result 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Option<T>`는 값이 있거나 없음을 표현할 때 사용합니다. 예: 데이터베이스 조회 결과, 선택적 매개변수. `Result<T, E>`는 작업이 성공하거나 실패할 때 사용합니다. 예: 파일 읽기, 네트워크 요청. `Option`은 "값 없음"이 정상적인 경우이고, `Result`는 "에러"가 발생한 경우입니다.
</details>

<details>
<summary><strong>Q: ? 연산자는 어떻게 동작하나요?</strong></summary>

`?` 연산자는 `Result`를 반환하는 함수에서 에러를 전파하는 구문 설탕입니다. `Ok(value)`면 `value`를 추출하고, `Err(e)`면 즉시 `return Err(e)`를 수행합니다. 내부적으로 `match result { Ok(v) => v, Err(e) => return Err(e), }`와 유사하게 동작합니다. 예외와 유사하지만 타입 안전하고 명시적입니다.
</details>

<details>
<summary><strong>Q: match가 왜 exhaustive해야 하나요?</strong></summary>

`match`는 모든 가능한 경우를 처리하도록 강제하여 런타임 패닉을 방지합니다. 열거형에 새로운 변형을 추가하면 컴파일 에러가 발생하여 누락된 경우를 발견하게 합니다. 이는 컴파일 타임에 버그를 조기에 방지합니다. `_` 와일드카드로 나머지 경우를 처리할 수 있지만, 명시적으로 모든 경우를 처리하는 것이 더 안전합니다.
</details>

<details>
<summary><strong>Q: if let과 match 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`if let`은 단일 패턴만 매칭할 때 사용합니다. 코드가 더 간결해집니다. `match`는 여러 패턴을 매칭하거나 모든 경우를 처리해야 할 때 사용합니다. `if let Some(x) = value { ... }`는 `match value { Some(x) => { ... }, _ => () }`와 동일하지만 더 간결합니다. `if let`은 `_` 패턴을 처리할 필요가 없을 때 유용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **enum** | 열거형 정의 | 데이터가 있는 변형 가능 |
| **Option<T>** | 널 안전 타입 | Some(T), None |
| **Result<T, E>** | 에러 처리 타입 | Ok(T), Err(E) |
| **match** | 패턴 매칭 | exhaustive 검사 |
| **? 연산자** | 에러 전파 | Result 함수에서 사용 |
| **if let** | 단일 패턴 매칭 | match의 간소화 |
| **while let** | 반복 패턴 매칭 | 패턴이 매칭되는 동안 반복 |
| **널 안전성** | null 없음 | Option으로 표현 |


## 다음 수업

다음 글에서는 Rust의 소유권 심화 — 대여 규칙, 라이프타임, 댕글링 참조 방지를 배웁니다.
