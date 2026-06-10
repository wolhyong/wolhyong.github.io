---
layout: post
title: "Rust 트레이트와 제네릭 — 트레이트 정의와 구현, 제네릭 타입, 트레이트 바운드, 트레이트 객체"
description: "Rust의 트레이트와 제네릭 시스템을 컴파일러 레벨에서 학습합니다. trait 키워드로 공유 동작을 정의하며 impl 키워드로 타입에 트레이트를 구현합니다. 제네릭은 타입 매개변수로 코드를 재사용 가능하게 만들며 T, U 등의 이름을 사용합니다. 트레이트 바운드<T: Trait>는 제네릭 타입이 특정 트레이트를 구현하도록 제한합니다. impl Trait은 함수 인자나 반환값에 트레이트 구현을 허용합니다. 트레이트 객체는 dyn Trait으로 런타임 다형성을 제공하며 vtable로 동적 디스패치를 수행합니다. Rust는 모노모피제이션(monomorphization)으로 제네릭을 컴파일 타임에 구체화하여 성능을 보장합니다."
date: 2025-06-18 10:00:00 +0900
category: rust
tags: [rust, traits, generics, trait-bounds, trait-objects, monomorphization, vtable]
level: intermediate
---

Rust의 트레이트와 제네릭은 코드 재사용성과 타입 안전성을 동시에 제공합니다.

> **핵심 정리** · 트레이트는 공유 동작을 정의하며 `impl`로 구현합니다. 제네릭은 타입 매개변수로 코드를 재사용 가능하게 합니다. 트레이트 바운드는 제네릭 타입을 제한합니다. 트레이트 객체는 `dyn Trait`으로 런타임 다형성을 제공합니다. 모노모피제이션으로 제네릭을 컴파일 타임에 구체화합니다.


## 수업 목표

- 트레이트 정의와 구현 방법을 이해합니다.
- 제네릭 타입과 함수를 작성할 수 있습니다.
- 트레이트 바운드를 이해하고 사용할 수 있습니다.
- impl Trait 문법을 이해합니다.
- 트레이트 객체와 동적 디스패치를 이해합니다.
- 모노모피제이션의 동작을 이해합니다.

## 트레이트 정의와 구현

```rust
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
    author: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{} by {}", self.title, self.author)
    }
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

fn main() {
    let article = Article {
        title: String::from("Rust 소개"),
        author: String::from("Wolhyong"),
        content: String::from("내용..."),
    };

    let tweet = Tweet {
        username: String::from("@greyhacker"),
        content: String::from("Hello Rust!"),
    };

    println!("기사: {}", article.summarize());
    println!("트윗: {}", tweet.summarize());
}
```

`trait`은 공유 동작을 정의합니다. 메서드 시그니처만 정의하며 구현은 `impl Trait for Type`으로 제공합니다. 여러 타입이 같은 트레이트를 구현할 수 있습니다.

### 기본 구현

```rust
trait Summary {
    fn summarize(&self) -> String {
        String::from("(기본 요약)")
    }
}

struct Article {
    title: String,
    author: String,
}

impl Summary for Article {
    // 기본 구현 사용
}

fn main() {
    let article = Article {
        title: String::from("Rust"),
        author: String::from("Wolhyong"),
    };

    println!("{}", article.summarize());  // (기본 요약)
}
```

트레이트 메서드에 기본 구현을 제공할 수 있습니다. 구현 시 기본 구현을 그대로 사용하거나 오버라이드할 수 있습니다.

## 제네릭 타입

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    let integer_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };

    println!("x: {}", integer_point.x());
    println!("거리: {}", float_point.distance_from_origin());
}
```

`<T>`는 타입 매개변수로 컴파일 타임에 구체적인 타입으로 대체됩니다. `impl<T>`는 모든 타입에 대한 구현이며, `impl Point<f32>`는 특정 타입에 대한 구현입니다.

### 제네릭 함수

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let chars = vec!['a', 'b', 'c', 'd'];

    println!("최대 숫자: {}", largest(&numbers));
    println!("최대 문자: {}", largest(&chars));
}
```

제네릭 함수는 타입 매개변수를 받습니다. `T: PartialOrd`는 트레이트 바운드로 `T`가 비교 가능해야 함을 나타냅니다.

## 트레이트 바운드

```rust
use std::fmt::Display;

fn notify<T: Display>(item: &T) {
    println!("알림: {}", item);
}

// 여러 트레이트 바운드
fn notify2<T: Display + Clone>(item: &T) {
    println!("알림: {}", item);
}

// where 절
fn notify3<T>(item: &T)
where
    T: Display + Clone,
{
    println!("알림: {}", item);
}

fn main() {
    let s = String::from("Hello");
    notify(&s);
    notify2(&s);
    notify3(&s);
}
```

트레이트 바운드는 제네릭 타입이 특정 트레이트를 구현하도록 제한합니다. `T: Trait` 문법 또는 `where` 절을 사용합니다. 여러 트레이트는 `+`로 결합합니다.

## impl Trait

```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("@greyhacker"),
        content: String::from("Hello"),
    }
}

fn main() {
    let tweet = returns_summarizable();
    println!("{}", tweet.summarize());
}
```

`impl Trait`은 반환 타입에 트레이트 구현을 허용합니다. 구체적인 타입을 숨길 때 유용합니다. 인자에도 사용할 수 있습니다: `fn notify(item: &impl Summary)`.

## 트레이트 객체

```rust
trait Draw {
    fn draw(&self);
}

struct Button {
    width: u32,
    height: u32,
}

impl Draw for Button {
    fn draw(&self) {
        println!("버튼 그리기: {}x{}", self.width, self.height);
    }
}

struct SelectBox {
    width: u32,
    height: u32,
}

impl Draw for SelectBox {
    fn draw(&self) {
        println!("선택박스 그리기: {}x{}", self.width, self.height);
    }
}

fn main() {
    let button = Button { width: 50, height: 10 };
    let select_box = SelectBox { width: 75, height: 10 };

    let components: Vec<Box<dyn Draw>> = vec![
        Box::new(button),
        Box::new(select_box),
    ];

    for component in components {
        component.draw();
    }
}
```

`dyn Trait`은 트레이트 객체로 런타임 다형성을 제공합니다. `Box<dyn Draw>`는 힙에 할당된 트레이트 객체입니다. vtable(가상 함수 테이블)로 동적 디스패치를 수행합니다.

### 트레이트 객체 제한

```rust
trait ObjectSafe {
    // fn not_safe(&self);  // 제네릭 메서드 불가
    fn safe(&self) -> String;  // Self를 반환하지 않음
}
```

트레이트 객체는 다음 조건을 만족해야 합니다(object-safe):
1. 제네릭 타입 매개변수가 없어야 함
2. Self를 반환하지 않아야 함

## 모노모피제이션

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let numbers: Vec<i32> = vec![1, 2, 3];
    let chars: Vec<char> = vec!['a', 'b', 'c'];

    println!("최대 숫자: {}", largest(&numbers));
    println!("최대 문자: {}", largest(&chars));
}
```

모노모피제이션은 컴파일 타임에 제네릭을 구체적인 타입으로 대체하는 과정입니다. `largest::<i32>`와 `largest::<char>` 두 버전의 함수가 생성됩니다. 이는 런타임 오버헤드 없이 제네릭을 사용할 수 있게 합니다.

### 정적 vs 동적 디스패치

```rust
// 정적 디스패치 - 컴파일 타임 결정
fn static_dispatch<T: Display>(item: &T) {
    println!("{}", item);
}

// 동적 디스패치 - 런타임 결정
fn dynamic_dispatch(item: &dyn Display) {
    println!("{}", item);
}
```

정적 디스패치는 컴파일 타임에 구체적인 함수를 호출하므로 빠릅니다. 동적 디스패치는 vtable을 통해 런타임에 함수를 호출하므로 유연하지만 약간의 오버헤드가 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 트레이트와 인터페이스의 차이는 무엇인가요?</strong></summary>

트레이트는 인터페이스와 유사하지만 더 강력합니다: (1) **기본 구현**: 트레이트는 메서드의 기본 구현을 제공할 수 있습니다. (2) **다중 구현**: 타입은 여러 트레이트를 구현할 수 있습니다. (3) **연관 타입**: 트레이트는 연관 타입을 가질 수 있습니다. (4) **제네릭**: 트레이트는 제네릭일 수 있습니다. 인터페이스는 일반적으로 메서드 시그니처만 정의합니다.
</details>

<details>
<summary><strong>Q: impl Trait과 제네릭의 차이는 무엇인가요?</strong></summary>

`impl Trait`은 구문 설탕으로 제네릭과 유사하게 동작합니다. 인자에서는 동일하지만 반환값에서 차이가 있습니다: `impl Trait` 반환은 단일 구체적인 타입만 반환할 수 있습니다. 제네릭 `T: Trait`은 호출자가 타입을 선택할 수 있습니다. `impl Trait`은 더 간결하고 구체적인 타입을 숨길 때 유용합니다.
</details>

<details>
<summary><strong>Q> 트레이트 객체는 언제 사용해야 하나요?</strong></summary>

트레이트 객체는 다음 경우에 사용합니다: (1) 런타임에 다양한 타입을 처리해야 할 때 (2) 컬렉션에 서로 다른 타입을 저장해야 할 때 (3) 타입을 컴파일 타임에 알 수 없을 때. 정적 디스패치가 가능하면 제네릭을 우선하고, 런타임 다형성이 필요하면 트레이트 객체를 사용합니다.
</details>

<details>
<summary><strong>Q: 모노모피제이션이 컴파일 시간에 미치는 영향은 무엇인가요?</strong></summary>

모노모피제이션은 각 제네릭 사용마다 구체적인 코드를 생성하므로 컴파일 시간과 바이너리 크기가 증가할 수 있습니다. 하지만 런타임 성능은 최적화됩니다. Rust는 이를 최적화하기 위해 코드 중복을 줄이는 기능을 제공합니다. 대부분의 경우 성능 이득이 컴파일 시간 비용보다 중요합니다.
</details>

<details>
<summary><strong>Q: 트레이트 바운드와 where 절 중 어떤 것을 사용해야 하나요?</strong></summary>

간단한 경우에는 트레이트 바운드를 사용합니다: `fn foo<T: Display + Clone>(x: T)`. 복잡한 경우에는 `where` 절이 더 가독성이 좋습니다: `fn foo<T>(x: T) where T: Display + Clone`. 여러 제네릭 타입에 바운드가 있거나 바운드가 길 때 `where` 절을 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **trait** | 공유 동작 정의 | impl로 구현 |
| **기본 구현** | 트레이트 메서드 기본값 | 오버라이드 가능 |
| **제네릭** | 타입 매개변수 | 코드 재사용 |
| **트레이트 바운드** | 제네릭 타입 제한 | T: Trait |
| **impl Trait** | 트레이트 구현 허용 | 구문 설탕 |
| **트레이트 객체** | dyn Trait | 런타임 다형성 |
| **모노모피제이션** | 제네릭 구체화 | 컴파일 타임 |
| **정적 디스패치** | 컴파일 타임 호출 | 빠름 |
| **동적 디스패치** | 런타임 호출 | vtable 사용 |


## 다음 수업

다음 글에서는 Rust 중급 — 에러 처리, Result와 Option 체이닝, 커스텀 에러 타입을 배웁니다.
