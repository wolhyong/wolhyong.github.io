---
layout: post
title: "Rust 구조체 — 필드 구조체, 튜플 구조체, 유닛 구조체, 메서드, 연관 함수, 디버그 출력"
description: "Rust의 구조체 시스템을 메모리 레벨에서 학습합니다. struct 키워드로 사용자 정의 타입을 정의하며 필드 구조체는 이름 있는 필드를 가집니다. 튜플 구조체는 이름 없는 필드를 가지며 튜플처럼 접근합니다. 유닛 구조체는 필드가 없는 타입으로 타입 마커로 사용됩니다. impl 블록으로 메서드와 연관 함수를 정의하며 self는 메서드의 수신자입니다. &self, &mut self, self는 소유권 전달 방식을 결정합니다. #[derive(Debug)]로 디버그 출력을 자동 구현할 수 있습니다. 구조체는 메모리에 필드 순서대로 저장되며 패딩(padding)으로 정렬됩니다."
date: 2025-06-11 10:00:00 +0900
category: rust
tags: [rust, structs, methods, associated-functions, derive, memory-layout]
level: basic
---

Rust의 구조체는 사용자 정의 타입으로 관련 데이터를 그룹화합니다.

> **핵심 정리** · 구조체는 `struct` 키워드로 정의하며 필드 구조체, 튜플 구조체, 유닛 구조체 세 가지가 있습니다. `impl` 블록으로 메서드와 연관 함수를 정의합니다. `self`는 메서드 수신자로 소유권 전달 방식을 결정합니다. 구조체는 메모리에 필드 순서대로 저장되며 패딩으로 정렬됩니다.


## 수업 목표

- 세 가지 구조체 타입의 차이를 이해합니다.
- impl 블록으로 메서드를 정의할 수 있습니다.
- self의 세 가지 형태를 이해합니다.
- 연관 함수와 메서드의 차이를 이해합니다.
- 구조체의 메모리 레이아웃을 이해합니다.

## 필드 구조체

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

fn main() {
    let user1 = User {
        username: String::from("wolhyong"),
        email: String::from("wolhyong@example.com"),
        sign_in_count: 1,
        active: true,
    };

    println!("사용자: {}", user1.username);
}
```

필드 구조체는 이름 있는 필드를 가집니다. 각 필드는 타입을 명시해야 합니다. 구조체 인스턴스를 생성할 때 모든 필드를 초기화해야 합니다. 필드에 접근할 때는 `.` 연산자를 사용합니다.

### 구조체 업데이트 문법

```rust
fn main() {
    let user1 = User {
        username: String::from("wolhyong"),
        email: String::from("wolhyong@example.com"),
        sign_in_count: 1,
        active: true,
    };

    let user2 = User {
        username: String::from("greyhacker"),
        email: String::from("greyhacker@example.com"),
        ..user1  // 나머지 필드는 user1에서 복사
    };

    println!("사용자2: {}", user2.username);
}
```

`..user1` 문법은 나머지 필드를 `user1`에서 복사합니다. 이 때 `user1`의 소유권이 이동하는 필드(String 등)는 `user1`이 더 이상 유효하지 않습니다.

## 튜플 구조체

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0);

    println!("검정: {}, {}, {}", black.0, black.1, black.2);
    println!("원점: {}, {}", origin.0, origin.1);
}
```

튜플 구조체는 이름 없는 필드를 가집니다. 튜플처럼 인덱스로 접근합니다. 필드에 의미 있는 이름이 필요 없을 때 사용합니다. 예: RGB 색상, 3D 좌표.

## 유닛 구조체

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

유닛 구조체는 필드가 없습니다. 타입 마커(type marker)로 사용됩니다. 예: 트레이트 구현을 위한 마커 타입.

## 메서드

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 메서드 - self를 받음
    fn area(&self) -> u32 {
        self.width * self.height
    }

    // 가변 메서드
    fn set_width(&mut self, width: u32) {
        self.width = width;
    }

    // 소유권을 가져가는 메서드
    fn consume(self) {
        println!("소비됨: {}x{}", self.width, self.height);
    }
}

fn main() {
    let mut rect = Rectangle { width: 30, height: 50 };

    println!("넓이: {}", rect.area());
    rect.set_width(40);
    println!("새 너비: {}", rect.width);

    rect.consume();
    // println!("{}", rect.width);  // 컴파일 에러
}
```

`impl` 블록 안에서 메서드를 정의합니다. 첫 번째 매개변수는 `self`로 메서드 수신자입니다. `&self`는 불변 참조, `&mut self`는 가변 참조, `self`는 소유권을 가져갑니다.

### self의 세 가지 형태

```rust
impl Example {
    fn method1(&self) { }      // 불변 참조
    fn method2(&mut self) { }   // 가변 참조
    fn method3(self) { }       // 소유권 이동
}
```

`&self`는 구조체를 수정하지 않을 때 사용합니다. `&mut self`는 구조체를 수정할 때 사용합니다. `self`는 구조체를 소비할 때 사용합니다.

## 연관 함수

```rust
impl Rectangle {
    // 연관 함수 - self를 받지 않음
    fn new(width: u32, height: u32) -> Self {
        Rectangle { width, height }
    }

    fn square(size: u32) -> Self {
        Rectangle { width: size, height: size }
    }
}

fn main() {
    let rect1 = Rectangle::new(30, 50);
    let rect2 = Rectangle::square(20);

    println!("rect1: {}x{}", rect1.width, rect1.height);
    println!("rect2: {}x{}", rect2.width, rect2.height);
}
```

연관 함수는 `self`를 받지 않습니다. 생성자(constructor) 패턴으로 사용됩니다. `Rectangle::new()`처럼 `::`로 호출합니다.

## 여러 impl 블록

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

구조체는 여러 `impl` 블록을 가질 수 있습니다. 일반적으로 관련 메서드를 그룹화합니다.

## 디버그 출력

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("{:?}", rect);        // 한 줄 출력
    println!("{:#?}", rect);       // 멀티라인 출력
}
```

`#[derive(Debug)]` 속성으로 디버그 출력을 자동 구현합니다. `{:?}` 플레이스홀더로 출력합니다. `{:#?}`는 보기 좋은 멀티라인 출력입니다.

## 메모리 레이아웃

```rust
#[repr(C)]
struct Example {
    a: u8,   // 1바이트
    b: u32,  // 4바이트
    c: u8,   // 1바이트
}

fn main() {
    println!("크기: {}", std::mem::size_of::<Example>());  // 12바이트 (패딩 포함)
}
```

구조체는 메모리에 필드 순서대로 저장됩니다. `#[repr(C)]`로 C 호환 레이아웃을 지정할 수 있습니다. 패딩(padding)으로 메모리 정렬을 맞춥니다. 위 예제에서 `a` 뒤에 3바이트 패딩, `c` 뒤에 3바이트 패딩이 추가되어 총 12바이트가 됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 구조체와 튜플의 차이는 무엇인가요?</strong></summary>

구조체는 이름 있는 필드를 가지며 각 필드에 의미 있는 이름을 부여할 수 있습니다. 튜플은 이름 없는 필드를 가지며 인덱스로 접근합니다. 구조체는 필드 순서가 중요하지 않지만 튜플은 순서가 중요합니다. 구조체는 명시적인 필드 이름으로 코드를 더 읽기 쉽게 만듭니다. 튜플 구조체는 필드 이름이 필요 없을 때(예: RGB 색상) 사용합니다.
</details>

<details>
<summary><strong>Q: &self와 &mut self 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`&self`는 구조체를 수정하지 않을 때 사용합니다. 읽기 전용 메서드입니다. `&mut self`는 구조체를 수정할 때 사용합니다. 예: `set_width` 같은 setter 메서드. Rust는 빌림 규칙으로 동시에 여러 가변 참조를 방지하므로, 가변 메서드를 호출하면 해당 인스턴스에 대한 다른 참조가 불가능합니다.
</details>

<details>
<summary><strong>Q: 연관 함수와 메서드의 차이는 무엇인가요?</strong></summary>

연관 함수는 `self`를 받지 않으며 `Struct::function()`으로 호출합니다. 생성자 패턴으로 사용됩니다. 메서드는 `self`를 받으며 `instance.method()`로 호출합니다. 인스턴스에 동작합니다. 연관 함수는 정적 메서드와 유사하고, 메서드는 인스턴스 메서드와 유사합니다.
</details>

<details>
<summary><strong>Q: 구조체 업데이트 문법에서 소유권이 이동하는 이유는 무엇인가요?</strong></summary>

`..user1` 문법은 나머지 필드를 복사하지만, `String` 같은 힙 할당 타입은 소유권이 이동합니다. 이는 이중 해제(double free)를 방지하기 위함입니다. 복사 후 원본과 새 인스턴스가 같은 힙 메모리를 가리키면 둘 다 해제될 때 문제가 발생합니다. 소유권 이동은 이를 방지합니다. `Copy` 트레이트를 구현한 타입은 대신 복사됩니다.
</details>

<details>
<summary><strong>Q: 왜 구조체에 패딩이 추가되나요?</strong></summary>

패딩은 메모리 정렬(memory alignment)을 위함입니다. CPU는 특정 경계(예: 4바이트)에 정렬된 메모리 접근이 더 빠릅니다. 컴파일러는 필드 사이에 패딩을 추가하여 정렬을 맞춥니다. `#[repr(C)]`로 C 호환 레이아웃을 지정하거나 `#[repr(packed)]`로 패딩을 제거할 수 있지만, 성능 저하가 발생할 수 있습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **필드 구조체** | 이름 있는 필드 | 점 연산자로 접근 |
| **튜플 구조체** | 이름 없는 필드 | 인덱스로 접근 |
| **유닛 구조체** | 필드 없음 | 타입 마커로 사용 |
| **impl 블록** | 메서드/연관 함수 정의 | 여러 개 가능 |
| **&self** | 불변 메서드 | 구조체 수정 불가 |
| **&mut self** | 가변 메서드 | 구조체 수정 가능 |
| **self** | 소유권 메서드 | 구조체 소비 |
| **연관 함수** | self 없음 | 생성자로 사용 |
| **#[derive(Debug)]** | 디버그 출력 | {:?}로 출력 |


## 다음 수업

다음 글에서는 Rust의 열거형 — 데이터가 있는 열거형, match로 패턴 매칭, Option과 Result를 배웁니다.
