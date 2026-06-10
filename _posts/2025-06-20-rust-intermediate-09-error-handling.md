---
layout: post
title: "Rust 에러 처리 — Result와 Option 체이닝, ? 연산자, 커스텀 에러 타입, panic과 unwrap"
description: "Rust의 에러 처리 시스템을 실무 레벨에서 학습합니다. Result<T, E>는 성공(Ok) 또는 실패(Err)를 표현하며 예외 대신 타입 안전한 에러 처리를 제공합니다. Option<T>는 값이 있거나 없음을 표현하며 널 안전성을 보장합니다. ? 연산자는 에러 전파를 간소화하는 구문 설탕으로 Result 함수에서 사용됩니다. unwrap과 expect는 에러 발생 시 패닉을 일으키며 프로토타이핑에 사용됩니다. 커스텀 에러 타입은 std::error::Error 트레이트를 구현하여 에러를 구조화합니다. map, and_then, or_else 등의 메서드로 체이닝을 수행하며 함수형 에러 처리가 가능합니다. panic!은 복구 불가능한 에러에 사용되며 스택 트레이스를 출력합니다."
date: 2025-06-20 10:00:00 +0900
category: rust
tags: [rust, error-handling, result, option, panic, unwrap, custom-error]
level: intermediate
---

Rust는 예외 대신 타입 시스템을 통한 에러 처리를 제공하여 컴파일 타임에 에러를 처리하도록 강제합니다.

> **핵심 정리** · `Result<T, E>`는 성공 또는 실패를 표현하며 `?` 연산자로 에러를 전파합니다. `Option<T>`는 값이 있거나 없음을 표현합니다. `unwrap`과 `expect`는 패닉을 일으키며 프로토타이핑에 사용됩니다. 커스텀 에러 타입은 `std::error::Error`를 구현합니다. 체이닝으로 함수형 에러 처리가 가능합니다.


## 수업 목표

- Result와 Option의 차이를 이해합니다.
- ? 연산자로 에러 전파를 할 수 있습니다.
- unwrap과 expect의 사용법과 위험성을 이해합니다.
- 커스텀 에러 타입을 정의할 수 있습니다.
- 체이닝으로 함수형 에러 처리를 할 수 있습니다.
- panic과 복구 가능/불가능 에러를 이해합니다.

## Result<T, E>

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

fn main() {
    match read_file("test.txt") {
        Ok(contents) => println!("내용: {}", contents),
        Err(e) => println!("에러: {}", e),
    }
}
```

`Result<T, E>`는 `Ok(T)`(성공) 또는 `Err(E)`(실패)를 표현합니다. `?` 연산자는 `Ok`면 값을 추출하고, `Err`면 즉시 에러를 반환합니다. 예외와 유사하지만 타입 안전합니다.

### Result 메서드

```rust
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("0으로 나눌 수 없음"))
    } else {
        Ok(a / b)
    }
}

fn main() {
    let result = divide(10, 2);

    // map - 성공 시 값 변환
    let doubled = result.map(|x| x * 2);
    println!("두 배: {:?}", doubled);

    // and_then - 성공 시 다른 Result 반환
    let result2 = divide(10, 2).and_then(|x| divide(x, 2));
    println!("연산: {:?}", result2);

    // or_else - 실패 시 다른 Result 반환
    let fallback = divide(10, 0).or_else(|_| Ok(0));
    println!("대체: {:?}", fallback);
}
```

`map`은 성공 시 값을 변환합니다. `and_then`은 성공 시 다른 `Result`를 반환하는 함수를 체이닝합니다. `or_else`는 실패 시 대체 `Result`를 반환합니다.

## Option<T>

```rust
fn find_user(id: u32) -> Option<String> {
    if id == 1 {
        Some(String::from("Wolhyong"))
    } else {
        None
    }
}

fn main() {
    let user = find_user(1);

    // unwrap - None이면 패닉
    let name = user.unwrap();
    println!("사용자: {}", name);

    // expect - None이면 메시지와 함께 패닉
    let name2 = find_user(2).expect("사용자를 찾을 수 없음");
}
```

`Option<T>`는 `Some(T)`(값 있음) 또는 `None`(값 없음)을 표현합니다. `unwrap`은 `None`이면 패닉을 일으키며, `expect`는 메시지와 함께 패닉을 일으킵니다. 프로토타이핑에 사용하며 프로덕션 코드에서는 피해야 합니다.

### Option 메서드

```rust
fn main() {
    let maybe_number = Some(10);

    // map - Some이면 값 변환
    let doubled = maybe_number.map(|x| x * 2);
    println!("두 배: {:?}", doubled);

    // and_then - Some이면 다른 Option 반환
    let result = maybe_number.and_then(|x| {
        if x > 5 {
            Some(x * 2)
        } else {
            None
        }
    });
    println!("조건: {:?}", result);

    // or - None이면 대체값
    let fallback = None.or(Some(0));
    println!("대체: {:?}", fallback);
}
```

`Option`도 `Result`와 유사한 메서드를 제공합니다. `map`, `and_then`, `or`, `unwrap_or`, `unwrap_or_else` 등으로 체이닝할 수 있습니다.

## ? 연산자

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username() -> Result<String, io::Error> {
    let username_file_result = File::open("username.txt");

    let mut username_file = match username_file_result {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut username = String::new();

    match username_file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}

// ? 연산자로 간소화
fn read_username_short() -> Result<String, io::Error> {
    let mut username_file = File::open("username.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}
```

`?` 연산자는 `match` 패턴을 간소화하는 구문 설탕입니다. `Ok`면 값을 추출하고, `Err`면 즉시 `return Err(e)`를 수행합니다. 에러 전파 코드를 훨씬 간결하게 만듭니다.

## unwrap과 expect

```rust
fn main() {
    // unwrap - 성공 가정, 실패 시 패닉
    let result = Ok(10);
    let value = result.unwrap();
    println!("값: {}", value);

    // expect - 실패 시 메시지와 함께 패닉
    let result2: Result<i32, &str> = Err("에러 발생");
    let value2 = result2.expect("이 작업은 필수입니다");
}
```

`unwrap`은 성공을 가정하고 값을 추출합니다. 실패 시 패닉을 일으킵니다. `expect`는 패닉 메시지를 지정할 수 있습니다. 프로토타이핑과 테스트에 사용하며, 프로덕션 코드에서는 명시적인 에러 처리를 선호합니다.

## 커스텀 에러 타입

```rust
use std::fmt;

#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Parse(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Io(e) => write!(f, "IO 에러: {}", e),
            AppError::Parse(msg) => write!(f, "파싱 에러: {}", msg),
        }
    }
}

impl std::error::Error for AppError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            AppError::Io(e) => Some(e),
            AppError::Parse(_) => None,
        }
    }
}

fn parse_config(content: &str) -> Result<u32, AppError> {
    content.trim().parse().map_err(|e| AppError::Parse(e.to_string()))
}

fn main() {
    match parse_config("invalid") {
        Ok(value) => println!("값: {}", value),
        Err(e) => println!("에러: {}", e),
    }
}
```

커스텀 에러 타입은 `std::error::Error` 트레이트를 구현해야 합니다. `Display`로 에러 메시지를 제공하고, `source`로 근본 원인(cause)을 제공합니다. `?` 연산자와 함께 사용하여 에러를 구조화할 수 있습니다.

### From 트레이트

```rust
impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::Io(error)
    }
}

fn read_config() -> Result<String, AppError> {
    let mut content = String::new();
    std::fs::File::open("config.txt")?.read_to_string(&mut content)?;
    Ok(content)
}
```

`From` 트레이트를 구현하면 `?` 연산자가 자동으로 에러를 변환합니다. `std::io::Error`가 `AppError::Io`로 자동 변환됩니다.

## panic과 복구 불가능 에러

```rust
fn main() {
    // panic! - 복구 불가능 에러
    // panic!("치명적인 에러 발생!");

    // unwrap - 패닉 발생
    let result: Result<i32, &str> = Err("에러");
    // let value = result.unwrap();  // 패닉

    // expect - 메시지와 함께 패닉
    // let value = result.expect("에러 발생");
}
```

`panic!`은 복구 불가능한 에러에 사용합니다. 스택을 해제하고 스택 트레이스를 출력합니다. 프로그램을 종료합니다. 복구 가능한 에러는 `Result`를 사용하고, 복구 불가능한 에러만 `panic!`을 사용합니다.

### catch_unwind

```rust
use std::panic;

fn main() {
    let result = panic::catch_unwind(|| {
        panic!("패닉!");
    });

    match result {
        Ok(_) => println!("성공"),
        Err(_) => println!("패닉 발생"),
    }
}
```

`catch_unwind`는 패닉을 캐치하여 복구할 수 있습니다. 하지만 일반적으로 패닉은 복구하지 않고 프로그램을 종료하는 것이 좋습니다. 주로 테스트나 특수한 경우에 사용됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Rust에 예외가 없는 이유는 무엇인가요?</strong></summary>

예외는 제어 흐름을 혼란스럽게 하고 에러 처리를 강제하지 않습니다. Rust는 타입 시스템을 통한 에러 처리로 컴파일 타임에 에러를 처리하도록 강제합니다. 이는 다음 이유로 안전합니다: (1) **명시성**: 에러를 처리하지 않으면 컴파일 에러가 발생합니다. (2) **타입 안전**: `Result`와 `Option`으로 에러를 타입으로 표현합니다. (3) **함수형**: 체이닝으로 함수형 에러 처리가 가능합니다.
</details>

<details>
<summary><strong>Q> Result와 Option 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Result<T, E>`는 작업이 성공하거나 실패할 때 사용합니다. 예: 파일 읽기, 네트워크 요청, 파싱. `Option<T>`는 값이 있거나 없음을 표현할 때 사용합니다. 예: 데이터베이스 조회 결과, 선택적 매개변수. `Result`는 에러 정보가 필요하고, `Option`은 단순히 값의 존재 여부만 중요할 때 사용합니다.
</details>

<details>
<summary><strong>Q: unwrap과 expect는 언제 사용해야 하나요?</strong></summary>

`unwrap`과 `expect`는 프로토타이핑, 테스트, 예제 코드에 사용합니다. 프로덕션 코드에서는 피해야 합니다. 대신 `match`, `?` 연산자, 체이닝 메서드를 사용하여 명시적으로 에러를 처리해야 합니다. `unwrap`은 에러가 절대 발생하지 않음을 확신할 때만 사용합니다(예: 하드코딩된 값).
</details>

<details>
<summary><strong>Q: ? 연산자는 어떻게 동작하나요?</strong></summary>

`?` 연산자는 `Result`를 반환하는 함수에서만 사용할 수 있습니다. 내부적으로 다음과 같이 동작합니다: `match result { Ok(v) => v, Err(e) => return Err(e.into()), }`. `Ok`면 값을 추출하고, `Err`면 즉시 함수에서 에러를 반환합니다. `.into()`로 에러를 자동 변환합니다. 예외와 유사하지만 타입 안전하고 명시적입니다.
</details>

<details>
<summary><strong>Q> 언제 panic을 사용해야 하나요?</strong></summary>

`panic!`은 복구 불가능한 에러에 사용합니다. 예: 논리적 불가능한 상태, 메모리 부족, 보안 위반. 복구 가능한 에러는 `Result`를 사용해야 합니다. `panic!`은 프로그램을 종료하므로 신중하게 사용해야 합니다. 라이브러리 코드에서는 `panic!`을 피하고 `Result`를 반환하는 것이 좋습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Result<T, E>** | 성공/실패 표현 | Ok(T), Err(E) |
| **Option<T>** | 값 있음/없음 표현 | Some(T), None |
| **? 연산자** | 에러 전파 | Result 함수에서 사용 |
| **unwrap** | 값 추출, 실패 시 패닉 | 프로토타이핑용 |
| **expect** | 메시지와 함께 패닉 | 디버깅용 |
| **커스텀 에러** | std::error::Error 구현 | 구조화된 에러 |
| **From 트레이트** | 에러 자동 변환 | ? 연산자와 함께 |
| **panic!** | 복구 불가능 에러 | 프로그램 종료 |
| **catch_unwind** | 패닉 캐치 | 특수한 경우에만 |


## 다음 수업

다음 글에서는 Rust 중급 — 컬렉션, Vec, HashMap, BTreeMap, HashSet, 이터레이터를 배웁니다.
