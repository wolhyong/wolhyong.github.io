---
layout: post
title: "Rust 제어문 — if/else 조건문, match 패턴 매칭, loop/for/while 반복문과 break/continue/레이블"
description: "Rust의 제어문을 컴파일러 레벨에서 학습합니다. if/else는 조건식으로 표현식이며 불리언이 아닌 타입도 조건으로 사용할 수 있습니다. match는 패턴 매칭으로 모든 가능한 경우를 컴파일 타임에 검사하며 exhaustive하도록 강제합니다. loop는 무한 루프로 break로 탈출하며 레이블과 함께 사용하여 중첩 루프를 제어할 수 있습니다. for는 이터레이터 기반 반복으로 범위, 컬렉션을 순회하며 while은 조건식이 true인 동안 반복합니다. if let과 while let은 패턴 매칭을 간소화하는 구문 설탕(syntactic sugar)입니다. Rust의 제어문은 표현식으로 값을 반환할 수 있어 함수형 스타일의 코드를 작성할 수 있습니다."
date: 2025-06-06 10:00:00 +0900
category: rust
tags: [rust, control-flow, if-else, match, loop, for, while, pattern-matching]
level: basic
---

Rust의 제어문은 표현식으로 값을 반환할 수 있으며, 패턴 매칭으로 타입 안전성을 보장합니다.

> **핵심 정리** · if/else는 표현식으로 값을 반환하며 불리언 조건을 사용합니다. match는 모든 경우를 exhaustive하게 처리하도록 강제합니다. loop는 무한 루프로 break로 탈출하며 레이블로 중첩 루프를 제어합니다. for는 이터레이터 기반으로 컬렉션을 순회합니다.


## 수업 목표

- if/else 조건문의 표현식으로서의 동작을 이해합니다.
- match 패턴 매칭의 exhaustive 검사를 이해합니다.
- loop/for/while 반복문의 차이를 이해합니다.
- 레이블과 break/continue의 사용법을 이해합니다.
- if let/while let 구문 설탕을 이해합니다.

## if/else 조건문

```rust
fn main() {
    let number = 6;

    // 기본 if/else
    if number < 5 {
        println!("5보다 작음");
    } else if number < 10 {
        println!("5 이상 10 미만");
    } else {
        println!("10 이상");
    }

    // 표현식으로 사용
    let condition = true;
    let number = if condition { 5 } else { 6 };

    println!("number: {}", number);
}
```

`if` 조건문은 불리언 표현식을 평가합니다. Rust는 자동 타입 변환을 수행하지 않으므로 조건은 반드시 `bool` 타입이어야 합니다. `if`는 표현식으로 값을 반환할 수 있으며, 이 때 모든 블록의 반환 타입이 일치해야 합니다. `if condition { 5 } else { 6 }`은 조건에 따라 `5` 또는 `6`을 반환합니다.

## match 패턴 매칭

```rust
fn main() {
    let number = 7;

    match number {
        1 => println!("하나"),
        2 | 3 | 4 | 5 => println!("2에서 5"),
        6..=10 => println!("6에서 10"),
        _ => println!("그 외"), // 와일드카드 패턴
    }

    // 표현식으로 사용
    let result = match number {
        1 => "하나",
        2..=10 => "여러 개",
        _ => "기타",
    };

    println!("결과: {}", result);
}
```

`match`는 값을 패턴과 비교하여 해당하는 블록을 실행합니다. 모든 가능한 경우를 처리해야 하며(exhaustive), `_` 와일드카드 패턴으로 나머지 경우를 처리할 수 있습니다. `|`로 여러 패턴을 결합하고, `..=`로 범위를 표현합니다. `match`도 표현식으로 값을 반환할 수 있습니다.

### match와 소유권

```rust
fn main() {
    let s = String::from("hello");

    match s {
        // s가 이동됨
        value => println!("{}", value),
    }

    // println!("{}", s); // 컴파일 에러: value borrowed after move
}
```

`match`에서 패턴이 값을 소유하면 원본 변수의 소유권이 이동합니다. 참조를 사용하면 소유권 이동을 방지할 수 있습니다.

## loop 반복문

```rust
fn main() {
    let mut count = 0;

    // 무한 루프
    loop {
        count += 1;
        println!("{}", count);

        if count == 5 {
            break;
        }
    }

    // 루프 레이블과 break로 값 반환
    let mut counter = 0;
    let result = loop {
        counter += 1;

        if counter == 10 {
            break counter * 2;
        }
    };

    println!("결과: {}", result);
}
```

`loop`는 무한 루프를 생성합니다. `break`로 루프를 탈출할 수 있으며, `break value`로 값을 반환할 수 있습니다. 레이블을 사용하여 중첩 루프에서 특정 루프를 탈출할 수 있습니다.

### 루프 레이블

```rust
fn main() {
    let mut count = 0;

    'outer: loop {
        let mut remaining = 10;

        loop {
            println!("count = {}, remaining = {}", count, remaining);

            if remaining == 9 {
                break;
            }

            if count == 2 {
                break 'outer; // 외부 루프 탈출
            }

            remaining -= 1;
        }

        count += 1;
    }

    println!("최종 count: {}", count);
}
```

`'outer:`와 같은 레이블을 루프 앞에 지정하고, `break 'outer`로 해당 루프를 탈출할 수 있습니다. 중첩 루프에서 유용합니다.

## for 반복문

```rust
fn main() {
    // 범위 순회
    for i in 1..5 { // 1, 2, 3, 4
        println!("{}", i);
    }

    // 포함 범위
    for i in 1..=5 { // 1, 2, 3, 4, 5
        println!("{}", i);
    }

    // 컬렉션 순회
    let a = [10, 20, 30, 40, 50];

    for element in a {
        println!("{}", element);
    }

    // 인덱스와 함께 순회
    for (index, value) in a.iter().enumerate() {
        println!("인덱스 {}: 값 {}", index, value);
    }
}
```

`for`는 이터레이터를 기반으로 동작합니다. `1..5`는 반 열린 범위(half-open range)로 1부터 4까지, `1..=5`는 닫힌 범위(closed range)로 1부터 5까지입니다. `.iter().enumerate()`로 인덱스와 값을 함께 얻을 수 있습니다.

## while 반복문

```rust
fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{}", number);
        number -= 1;
    }

    println!("종료!");
}
```

`while`은 조건식이 `true`인 동안 반복합니다. 조건이 `false`가 되면 루프를 종료합니다. 대부분의 경우 `for`가 더 선호되지만, 조건식이 필요할 때 `while`을 사용합니다.

## if let과 while let

```rust
fn main() {
    let some_value = Some(7);
    let none_value: Option<i32> = None;

    // if let - 패턴 매칭 간소화
    if let Some(x) = some_value {
        println!("값: {}", x);
    }

    // while let - 반복 패턴 매칭
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

`if let`은 단일 패턴 매칭을 간소화하는 구문 설탕입니다. `while let`은 패턴이 매칭되는 동안 반복합니다. `match`의 간단한 경우에 사용됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: if 조건에 불리언이 아닌 값을 사용할 수 없나요?</strong></summary>

아니요, Rust는 조건식이 반드시 `bool` 타입이어야 합니다. C나 JavaScript와 달리 0, 빈 문자열, null 등이 자동으로 `false`로 변환되지 않습니다. 이는 명시성을 높이고 실수를 방지하기 위함입니다. `if number { ... }` 같은 코드는 컴파일 에러가 발생하며, `if number != 0 { ... }`로 명시적으로 작성해야 합니다.
</details>

<details>
<summary><strong>Q: match가 왜 exhaustive해야 하나요?</strong></summary>

`match`는 모든 가능한 경우를 처리하도록 강제하여 런타임 패닉을 방지합니다. 예를 들어 `enum`의 모든 변형을 처리하지 않으면 컴파일 에러가 발생합니다. 이는 컴파일 타임에 누락된 경우를 발견하게 하여 버그를 조기에 방지합니다. `_` 와일드카드로 나머지 경우를 처리할 수 있지만, 명시적으로 모든 경우를 처리하는 것이 더 안전합니다.
</details>

<details>
<summary><strong>Q: loop와 while 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`loop`는 무한 루프가 필요할 때 사용합니다. `break`로 명시적으로 탈출하며, 루프 내에서 복잡한 조건으로 탈출할 때 유용합니다. `while`은 조건식이 `false`가 될 때까지 반복할 때 사용합니다. 대부분의 경우 `for`가 더 선호되는데, 이는 이터레이터 기반으로 더 안전하고 표현력이 높기 때문입니다. `for`는 인덱스 오버플로우를 방지하고 이터레이터 체이닝이 가능합니다.
</details>

<details>
<summary><strong>Q: for 루프에서 인덱스가 필요할 때 어떻게 하나요?</strong></summary>

`.iter().enumerate()`를 사용합니다. 이는 `(index, value)` 튜플의 이터레이터를 반환합니다. 인덱스가 0부터 시작합니다. 또는 `.iter().enumerate().rev()`로 역순으로 순회할 수도 있습니다. 인덱스만 필요하면 `.len()`과 범위를 사용할 수도 있지만, `enumerate`가 더 관용적입니다.
</details>

<details>
<summary><strong>Q: if let과 match 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`if let`은 단일 패턴만 매칭할 때 사용합니다. 코드가 더 간결해집니다. `match`는 여러 패턴을 매칭하거나 모든 경우를 처리해야 할 때 사용합니다. `if let Some(x) = value { ... }`는 `match value { Some(x) => { ... }, _ => () }`와 동일하지만 더 간결합니다. `if let`은 `_` 패턴을 처리할 필요가 없을 때 유용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **if/else** | 조건문 | 표현식으로 값 반환, bool 조건만 허용 |
| **match** | 패턴 매칭 | exhaustive 검사, 표현식으로 값 반환 |
| **loop** | 무한 루프 | break로 탈출, 레이블 지원 |
| **for** | 이터레이터 기반 반복 | 컬렉션 순회, 인덱스 오버플로우 방지 |
| **while** | 조건 기반 반복 | 조건이 true인 동안 반복 |
| **if let** | 단일 패턴 매칭 | match의 간소화된 형태 |
| **while let** | 반복 패턴 매칭 | 패턴이 매칭되는 동안 반복 |


## 다음 수업

다음 글에서는 Rust의 함수 — 매개변수, 반환값, 클로저, 고차 함수를 배웁니다.
