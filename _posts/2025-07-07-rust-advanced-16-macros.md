---
layout: post
title: "Rust 매크로 — 선언형 매크로, 절차형 매크로, derive 매크로, 매크로 시스템, 메타 프로그래밍"
description: "Rust의 매크로 시스템을 컴파일러 레벨에서 학습합니다. 선언형 매크로(declarative macro)는 macro_rules!로 패턴 매칭 기반 코드 생성을 수행하며 match와 유사한 구문을 사용합니다. 절차형 매크로(procedural macro)는 함수처럼 입력 토큰을 처리하여 코드를 생성하며 TokenStream을 조작합니다. derive 매크로는 #[derive] 속성으로 트레이트 구현을 자동화하며 DeriveInput을 파싱합니다. attribute-like 매크로는 사용자 정의 속성을 추가하며 function-like 매크로는 함수 호출처럼 사용됩니다. Rust 매크로는 컴파일 타임에 확장되어 런타임 오버헤드가 없으며 강력한 메타 프로그래밍을 제공합니다."
date: 2025-07-07 10:00:00 +0900
category: rust
tags: [rust, macros, declarative-macros, procedural-macros, derive-macros, meta-programming]
level: advanced
---

Rust의 매크로 시스템은 컴파일 타임에 코드를 생성하여 런타임 오버헤드 없이 강력한 메타 프로그래밍을 제공합니다.

> **핵심 정리** · 선언형 매크로는 `macro_rules!`로 패턴 매칭 기반 코드 생성을 수행합니다. 절차형 매크로는 `TokenStream`을 조작하여 코드를 생성합니다. derive 매크로는 `#[derive]` 속성으로 트레이트 구현을 자동화합니다. 매크로는 컴파일 타임에 확장되어 런타임 오버헤드가 없습니다.


## 수업 목표

- 선언형 매크로를 정의하고 사용할 수 있습니다.
- 절차형 매크로의 구조를 이해합니다.
- derive 매크로를 구현할 수 있습니다.
- 매크로 시스템의 동작을 이해합니다.
- 메타 프로그래밍의 사용 사례를 이해합니다.

## 선언형 매크로

```rust
macro_rules! say_hello {
    () => {
        println!("Hello!");
    };
    ($name:expr) => {
        println!("Hello, {}!", $name);
    };
}

fn main() {
    say_hello!();
    say_hello!("Wolhyong");
}
```

`macro_rules!`로 선언형 매크로를 정의합니다. 패턴 매칭으로 입력을 처리하며 `match`와 유사한 구문을 사용합니다. `$name:expr`은 표현식을 캡처하는 패턴입니다.

### 패턴 매칭

```rust
macro_rules! calculate {
    (add $a:expr, $b:expr) => {
        $a + $b
    };
    (mul $a:expr, $b:expr) => {
        $a * $b
    };
}

fn main() {
    println!("2 + 3 = {}", calculate!(add 2, 3));
    println!("2 * 3 = {}", calculate!(mul 2, 3));
}
```

매크로는 여러 패턴을 가질 수 있습니다. 입력에 맞는 패턴이 선택되어 코드가 생성됩니다. 패턴은 순서대로 평가됩니다.

### 반복

```rust
macro_rules! vec_of_strings {
    ($($x:expr),*) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push(String::from($x));
            )*
            temp_vec
        }
    };
}

fn main() {
    let v = vec_of_strings!("hello", "world", "rust");
    println!("{:?}", v);
}
```

`$($x:expr),*`는 쉼표로 구분된 표현식들을 캡처합니다. `$()*`는 캡처된 각 항목에 대해 코드를 반복합니다. `$()+`는 최소 하나, `$()?`는 옵션을 나타냅니다.

### 식별자 캡처

```rust
macro_rules! make_function {
    ($func_name:ident, $input:expr) => {
        fn $func_name() -> i32 {
            $input
        }
    };
}

make_function!(add_two, 2 + 2);
make_function!(multiply, 3 * 3);

fn main() {
    println!("add_two: {}", add_two());
    println!("multiply: {}", multiply());
}
```

`$func_name:ident`는 식별자를 캡처합니다. 매크로는 함수, 구조체, 변수 이름 등을 생성할 수 있습니다. `$ident`, `$ty`, `$literal`, `$path` 등의 디자이너터가 있습니다.

## 절차형 매크로

```toml
# Cargo.toml
[lib]
proc-macro = true

[dependencies]
syn = "1.0"
quote = "1.0"
proc-macro2 = "1.0"
```

```rust
// src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let expanded = quote! {
        impl MyTrait for #name {
            fn method(&self) {
                println!("Method called for {}", stringify!(#name));
            }
        }
    };

    TokenStream::from(expanded)
}
```

절차형 매크로는 함수처럼 입력을 처리하여 코드를 생성합니다. `proc-macro` 크레이트 타입이 필요합니다. `syn`으로 파싱하고 `quote`로 코드를 생성합니다.

### derive 매크로

```rust
// main.rs
use my_macro::MyTrait;

#[derive(MyTrait)]
struct MyStruct;

trait MyTrait {
    fn method(&self);
}

fn main() {
    let s = MyStruct;
    s.method();
}
```

`#[derive(MyTrait)]` 속성으로 derive 매크로를 호출합니다. 트레이트 구현을 자동화하는 데 사용됩니다. `Debug`, `Clone`, `Serialize` 등이 derive 매크로입니다.

### attribute-like 매크로

```rust
#[proc_macro_attribute]
pub fn my_attribute(attr: TokenStream, item: TokenStream) -> TokenStream {
    let item = parse_macro_input!(item as ItemFn);
    let expanded = quote! {
        #item
        println!("Function was annotated!");
    };
    TokenStream::from(expanded)
}
```

```rust
#[my_attribute]
fn my_function() {
    println!("Hello!");
}
```

attribute-like 매크로는 사용자 정의 속성을 추가합니다. 함수, 구조체 등에 적용할 수 있습니다. 속성 인자와 항목을 모두 처리할 수 있습니다.

### function-like 매크로

```rust
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as Expr);
    let expanded = quote! {
        println!("Macro called with: {}", #input);
        #input * 2
    };
    TokenStream::from(expanded)
}
```

```rust
fn main() {
    let result = my_macro!(5);
    println!("Result: {}", result);
}
```

function-like 매크로는 함수 호출처럼 사용됩니다. `macro_rules!`와 유사하지만 더 강력한 파싱 기능을 제공합니다.

## 매크로 시스템

```rust
macro_rules! print_ast {
    ($expr:expr) => {
        println!("AST: {}", stringify!($expr));
    };
}

fn main() {
    let x = 5;
    print_ast!(x + 1);  // AST: x + 1
}
```

매크로는 AST(Abstract Syntax Tree) 수준에서 동작합니다. `stringify!`로 입력을 문자열로 변환하여 AST를 확인할 수 있습니다. 매크로는 컴파일 타임에 확장됩니다.

### 하이기닉 매크로

```rust
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}
```

표준 라이브러리의 `vec!` 매크로는 가변 인자를 받아 `Vec`을 생성합니다. 복잡한 로직을 매크로로 캡슐화하여 사용자 편의성을 높일 수 있습니다.

## 메타 프로그래밍

```rust
#[derive(Debug)]
enum Color {
    Red,
    Green,
    Blue,
}

fn main() {
    let color = Color::Red;
    println!("{:?}", color);  // Debug derive로 자동 구현
}
```

메타 프로그래밍은 코드를 생성하는 코드를 작성하는 것입니다. derive 매크로로 반복적인 코드를 자동화할 수 있습니다. 유지보수성을 높이고 버그를 줄입니다.

### serde 예제

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Person {
    name: String,
    age: u32,
}
```

`serde`의 derive 매크로는 구조체에 직렬화/역직렬화 코드를 자동으로 생성합니다. 수백 줄의 코드를 한 줄로 대체할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 선언형 매크로와 절차형 매크로의 차이는 무엇인가요?</strong></summary>

선언형 매크로는 `macro_rules!`로 패턴 매칭 기반 코드 생성을 수행합니다. 간단한 경우에 적합하며 추가 의존성이 필요 없습니다. 절차형 매크로는 함수처럼 입력을 처리하여 코드를 생성합니다. 더 강력한 파싱 기능을 제공하지만 `syn`, `quote` 등의 의존성이 필요합니다.
</details>

<details>
<summary><strong>Q> 매크로는 언제 사용해야 하나요?</strong></summary>

매크로는 다음 경우에 사용합니다: (1) 반복적인 코드를 줄일 때 (2) 도메인 특화 언어(DSL)을 만들 때 (3) 컴파일 타임 검사가 필요할 때 (4) 제네릭으로 표현할 수 없을 때. 과도한 사용은 코드를 읽기 어렵게 만들 수 있으므로 신중하게 사용해야 합니다.
</details>

<details>
<summary><strong>Q> derive 매크로는 어떻게 구현하나요?</strong></summary>

derive 매크로는 `#[proc_macro_derive]` 속성으로 구현합니다. `DeriveInput`을 파싱하여 구조체 정보를 얻고, `quote!`로 트레이트 구현 코드를 생성합니다. `proc-macro` 크레이트 타입이 필요하며 별도 패키지로 배포하는 것이 일반적입니다.
</details>

<details>
<summary><strong>Q> 매크로의 성능 영향은 무엇인가요?</strong></summary>

매크로는 컴파일 타임에 확장되므로 런타임 성능에 영향이 없습니다. 하지만 컴파일 시간이 증가할 수 있습니다. 복잡한 매크로는 컴파일을 느리게 할 수 있으므로 필요한 경우에만 사용해야 합니다. 매크로 확장 결과는 캐시될 수 있습니다.
</details>

<details>
<summary><strong>Q> 매크로 디버깅은 어떻게 하나요?</strong></summary>

매크로 디버깅 방법: (1) `cargo expand`로 매크로 확장 결과 확인 (2) `stringify!`로 AST 출력 (3) `eprintln!`로 디버깅 정보 출력 (4) 단위 테스트로 매크로 동작 검증. `cargo expand`는 매크로가 어떻게 확장되는지 확인하는 데 유용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **선언형 매크로** | macro_rules! | 패턴 매칭 기반 |
| **절차형 매크로** | 함수형 | TokenStream 조작 |
| **derive 매크로** | #[derive] | 트레이트 자동 구현 |
| **attribute-like** | 사용자 속성 | 항목에 적용 |
| **function-like** | 함수 호출 | 입력 처리 |
| **syn** | 파싱 라이브러리 | AST 파싱 |
| **quote** | 코드 생성 | TokenStream 생성 |
| **메타 프로그래밍** | 코드 생성 코드 | 반복 제거 |


## 다음 수업

다음 글에서는 Rust 고급 — 비동기 프로그래밍, Future, async/await, Tokio 런타임을 배웁니다.
