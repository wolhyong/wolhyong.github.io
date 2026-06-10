---
layout: post
title: "Rust 모듈 시스템 — 패키지, 크레이트, 모듈, use, pub, 파일 구조, 가시성 규칙"
description: "Rust의 모듈 시스템을 컴파일러 레벨에서 학습합니다. 패키지(package)는 Cargo.toml로 정의되며 하나 이상의 크레이트(crate)를 포함합니다. 크레이트는 라이브러리(lib.rs) 또는 바이너리(main.rs)입니다. mod 키워드로 모듈을 정의하며 파일 시스템과 매핑됩니다. pub 키워드로 가시성을 제어하며 기본적으로 비공개입니다. use 키워드로 경로를 단축하며 as로 별칭을 지정할 수 있습니다. super와 self로 상대 경로를 참조합니다. Rust의 가시성 규칙은 캡슐화를 강제하며 pub(crate)로 크레이트 내부 공개, pub(super)로 상위 모듈 공개 등 세밀한 제어가 가능합니다."
date: 2025-06-25 10:00:00 +0900
category: rust
tags: [rust, modules, packages, crates, visibility, use, pub]
level: intermediate
---

Rust의 모듈 시스템은 코드를 조직화하고 캡슐화하여 유지보수성을 높입니다.

> **핵심 정리** · 패키지는 `Cargo.toml`로 정의되며 크레이트를 포함합니다. `mod`로 모듈을 정의하며 파일 시스템과 매핑됩니다. `pub`로 가시성을 제어하며 기본적으로 비공개입니다. `use`로 경로를 단축합니다. Rust의 가시성 규칙은 캡슐화를 강제합니다.


## 수업 목표

- 패키지, 크레이트, 모듈의 차이를 이해합니다.
- mod 키워드로 모듈을 정의할 수 있습니다.
- pub 키워드로 가시성을 제어할 수 있습니다.
- use 키워드로 경로를 단축할 수 있습니다.
- 파일 시스템과 모듈의 매핑을 이해합니다.
- 가시성 규칙을 이해합니다.

## 패키지와 크레이트

```toml
# Cargo.toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"

[dependencies]
```

패키지는 `Cargo.toml`로 정의되며 빌드, 테스트, 공유를 위한 기능을 제공합니다. 하나 이상의 크레이트를 포함합니다.

### 크레이트 타입

```
my_project/
├── Cargo.toml
├── src/
│   ├── main.rs       # 바이너리 크레이트
│   └── lib.rs        # 라이브러리 크레이트
└── tests/            # 통합 테스트
```

바이너리 크레이트는 실행 가능한 프로그램을 생성하며 `main.rs`가 진입점입니다. 라이브러리 크레이트는 재사용 가능한 라이브러리를 제공하며 `lib.rs`가 라이브러리 진입점입니다.

## 모듈 정의

```rust
// src/lib.rs
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}
```

`mod` 키워드로 모듈을 정의합니다. 모듈은 중첩될 수 있으며 코드를 논리적으로 그룹화합니다. 기본적으로 모든 항목은 비공개(private)입니다.

### 파일 시스템 매핑

```
src/
├── lib.rs
├── front_of_house/
│   ├── mod.rs
│   ├── hosting.rs
│   └── serving.rs
```

모듈은 파일 시스템과 매핑됩니다. `mod front_of_house;`는 `front_of_house/mod.rs` 또는 `front_of_house.rs`를 찾습니다. 중첩 모듈은 디렉토리 구조로 표현합니다.

```rust
// src/lib.rs
mod front_of_house;  // front_of_house/mod.rs 또는 front_of_house.rs

// src/front_of_house/mod.rs
pub mod hosting;
pub mod serving;

// src/front_of_house/hosting.rs
pub fn add_to_waitlist() {}
```

## 경로 (Paths)

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 절대 경로
    crate::front_of_house::hosting::add_to_waitlist();

    // 상대 경로
    front_of_house::hosting::add_to_waitlist();
}
```

절대 경로는 `crate`로 시작하며 크레이트 루트에서 시작합니다. 상대 경로는 현재 모듈에서 시작합니다. `self`는 현재 모듈, `super`는 상위 모듈을 참조합니다.

## pub 키워드

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}  // 공개
        fn seat_at_table() {}        // 비공개
    }
}

pub fn eat_at_restaurant() {
    // 공개 함수만 접근 가능
    front_of_house::hosting::add_to_waitlist();
    // front_of_house::hosting::seat_at_table();  // 컴파일 에러
}
```

`pub` 키워드로 항목을 공개합니다. 기본적으로 모든 항목은 비공개입니다. 모듈, 함수, 구조체, 필드, 트레이트 등에 적용됩니다.

### 구조체와 열거형의 pub

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,        // 공개 필드
        seasonal_fruit: String,   // 비공개 필드
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }

    pub enum Appetizer {
        Soup,      // 공개 변형
        Salad,     // 공개 변형
    }
}

pub fn eat_at_restaurant() {
    let meal = back_of_house::Breakfast::summer("Rye");
    meal.toast = String::from("Wheat");  // 공개 필드 접근
    // meal.seasonal_fruit = String::from("blueberries");  // 컴파일 에러

    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
}
```

구조체는 `pub struct`로 공개해도 필드는 기본적으로 비공개입니다. 필드를 개별적으로 `pub`로 공개해야 합니다. 열거형은 `pub enum`으로 공개하면 모든 변형이 자동으로 공개됩니다.

## use 키워드

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

`use` 키워드로 경로를 단축합니다. `use crate::front_of_house::hosting;`로 `hosting`만 사용하여 접근할 수 있습니다.

### 관용적 use

```rust
use std::collections::HashMap;

// 함수 - 전체 경로
fn main() {
    let map = HashMap::new();
}

// 구조체, 열거형 - 타입만
use std::collections::HashMap;

// 같은 이름 - as 별칭
use std::fmt::Result;
use std::io::Result as IoResult;

// 여러 항목 - 중첩 경로
use std::{cmp::Ordering, io::Write};

// glob - 모든 공개 항목
use std::collections::*;
```

함수는 전체 경로를 사용하는 것이 관용적입니다. 구조체와 열거형은 타입만 `use`하는 것이 관용적입니다. `as`로 별칭을 지정하여 이름 충돌을 방지할 수 있습니다. 중첩 경로와 glob(`*`)으로 여러 항목을 가져올 수 있습니다.

## 가시성 규칙

```rust
mod a {
    pub fn public_function() {
        println!("public function");
    }

    fn private_function() {
        println!("private function");
    }

    pub mod b {
        pub fn public_function() {
            println!("public function in b");
        }

        fn private_function() {
            println!("private function in b");
        }

        pub(crate) fn crate_public_function() {
            println!("crate public function");
        }

        pub(super) fn super_public_function() {
            println!("super public function");
        }
    }
}
```

`pub(crate)`는 크레이트 내부에서만 공개합니다. `pub(super)`는 상위 모듈에서만 공개합니다. `pub(in path::to::module)`로 특정 모듈에서만 공개할 수 있습니다. 세밀한 가시성 제어가 가능합니다.

## super와 self

```rust
fn function() {
    println!("function");
}

mod cool_module {
    fn function() {
        println!("cool_module::function");
    }

    pub fn call_function() {
        println!("cool_module::call_function");
        self::function();  // 현재 모듈의 function
        super::function(); // 상위 모듈의 function
    }
}
```

`self`는 현재 모듈을 참조합니다. `super`는 상위 모듈을 참조합니다. 상대 경로에서 사용하여 명확성을 높입니다.

## 외부 패키지

```toml
# Cargo.toml
[dependencies]
rand = "0.8.5"
```

```rust
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1..=100);
    println!("비밀 번호: {}", secret_number);
}
```

외부 패키지는 `Cargo.toml`의 `[dependencies]`에 추가합니다. `cargo build`로 다운로드하고 컴파일합니다. `use`로 경로를 단축하여 사용합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 패키지와 크레이트의 차이는 무엇인가요?</strong></summary>

패키지는 `Cargo.toml`로 정의되며 빌드, 테스트, 공유를 위한 기능을 제공합니다. 하나 이상의 크레이트를 포함합니다. 크레이트는 모듈 트리로 컴파일되는 단위입니다. 라이브러리 크레이트(`lib.rs`)는 재사용 가능한 코드를 제공하고, 바이너리 크레이트(`main.rs`)는 실행 가능한 프로그램을 생성합니다.
</details>

<details>
<summary><strong>Q> mod.rs와 파일명 모듈 중 어떤 것을 사용해야 하나요?</strong></summary>

Rust 2018 에디션부터는 파일명 모듈을 선호합니다. `front_of_house.rs`는 `front_of_house/mod.rs`와 동일합니다. 하지만 하위 모듈이 있는 경우에는 `mod.rs`가 필요합니다: `front_of_house/hosting.rs`와 `front_of_house/serving.rs`가 있으면 `front_of_house/mod.rs`가 필요합니다. 파일명 모듈이 더 간결하고 관용적입니다.
</details>

<details>
<summary><strong>Q> 왜 Rust는 기본적으로 비공개인가요?</strong></summary>

Rust는 캡슐화를 강제하여 내부 구현을 숨깁니다. 이는 다음 이유로 안전합니다: (1) **유지보수**: 내부 구현을 변경해도 사용자 코드에 영향을 주지 않습니다. (2) **안전성**: 불안전한 코드를 숨길 수 있습니다. (3) **명시성**: 공개 항목을 명시적으로 지정하여 API를 명확히 합니다. `pub`로 필요한 항목만 공개합니다.
</details>

<details>
<summary><strong>Q> use와 extern crate의 차이는 무엇인가요?</strong></summary>

`extern crate`는 Rust 2015 에디션에서 외부 크레이트를 링크할 때 사용했습니다. Rust 2018 에디션부터는 `extern crate`가 필요 없으며 `Cargo.toml`에 의존성을 추가하면 자동으로 링크됩니다. `use`는 경로를 단축하는 데 사용됩니다. 현재는 `use`만 사용하면 됩니다.
</details>

<details>
<summary><strong>Q> glob import(*)는 언제 사용해야 하나요?</strong></summary>

glob import는 테스트 코드나 prelude에서 사용합니다. 프로덕션 코드에서는 피하는 것이 좋습니다: (1) **명확성**: 어떤 항목이 가져와졌는지 명확하지 않습니다. (2) **충돌**: 이름 충돌이 발생할 수 있습니다. (3) **컴파일 시간**: 불필요한 항목을 가져올 수 있습니다. 명시적으로 필요한 항목만 `use`하는 것이 좋습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **패키지** | Cargo.toml 정의 | 빌드, 테스트, 공유 |
| **크레이트** | 컴파일 단위 | 라이브러리 또는 바이너리 |
| **모듈** | 코드 그룹화 | mod 키워드 |
| **pub** | 가시성 제어 | 기본 비공개 |
| **use** | 경로 단축 | as 별칭 가능 |
| **절대 경로** | crate로 시작 | 크레이트 루트 |
| **상대 경로** | self, super | 현재/상위 모듈 |
| **pub(crate)** | 크레이트 내 공개 | 세밀한 제어 |
| **pub(super)** | 상위 모듈 공개 | 세밀한 제어 |


## 다음 수업

다음 글에서는 Rust 중급 — 스마트 포인터, Box, Rc, Arc, RefCell, 내부 가변성을 배웁니다.
