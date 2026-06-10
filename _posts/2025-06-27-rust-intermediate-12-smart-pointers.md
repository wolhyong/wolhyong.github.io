---
layout: post
title: "Rust 스마트 포인터 — Box, Rc, Arc, RefCell, 내부 가변성, Deref 트레이트"
description: "Rust의 스마트 포인터 시스템을 메모리 레벨에서 학습합니다. Box<T>는 힙에 데이터를 할당하며 컴파일 타임에 크기를 알 수 없는 타입을 저장할 수 있습니다. Rc<T>는 참조 카운팅으로 다중 소유권을 허용하며 단일 스레드에서만 사용됩니다. Arc<T>는 원자적 참조 카운팅으로 스레드 안전한 다중 소유권을 제공합니다. RefCell<T>는 내부 가변성으로 런타임에 빌림 규칙을 검사하며 컴파일 타임에 불가능한 가변성을 허용합니다. Deref 트레이트는 스마트 포인터를 일반 참조처럼 동작하게 합니다. Drop 트레이트는 스마트 포인터가 범위를 벗어날 때 자동으로 리소스를 해제합니다."
date: 2025-06-27 10:00:00 +0900
category: rust
tags: [rust, smart-pointers, box, rc, arc, refcell, interior-mutability, deref]
level: intermediate
---

Rust의 스마트 포인터는 추가 기능을 제공하는 포인터로 메모리 관리와 소유권을 유연하게 제어합니다.

> **핵심 정리** · `Box<T>`는 힙 할당과 재귀적 타입을 지원합니다. `Rc<T>`는 단일 스레드 다중 소유권을 제공합니다. `Arc<T>`는 스레드 안전 다중 소유권을 제공합니다. `RefCell<T>`는 내부 가변성을 제공합니다. `Deref` 트레이트는 스마트 포인터를 참조처럼 동작하게 합니다.


## 수업 목표

- Box<T>의 사용법과 사용 사례를 이해합니다.
- Rc<T>와 Arc<T>의 차이를 이해합니다.
- RefCell<T>와 내부 가변성을 이해합니다.
- Deref 트레이트의 동작을 이해합니다.
- Drop 트레이트의 동작을 이해합니다.
- 스마트 포인터 선택 기준을 이해합니다.

## Box<T>

```rust
fn main() {
    let b = Box::new(5);
    println!("b = {}", b);
}
```

`Box<T>`는 힙에 데이터를 할당하는 스마트 포인터입니다. 스택에 포인터만 저장하므로 크기가 고정됩니다.

### Box 사용 사례

```rust
// 1. 컴파일 타임에 크기를 알 수 없는 타입
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
}

// 2. 큰 데이터를 이동하고 싶을 때
let large_data = Box::new([0; 1000000]);

// 3. 트레이트 객체
trait MyTrait {
    fn method(&self);
}

struct MyStruct;

impl MyTrait for MyStruct {
    fn method(&self) {
        println!("메서드 호출");
    }
}

fn main() {
    let trait_object: Box<dyn MyTrait> = Box::new(MyStruct);
    trait_object.method();
}
```

`Box`는 다음 경우에 사용됩니다: (1) 컴파일 타임에 크기를 알 수 없는 재귀적 타입 (2) 큰 데이터를 이동하고 싶을 때 (3) 트레이트 객체로 동적 디스패치가 필요할 때.

## Rc<T>

```rust
use std::rc::Rc;

enum List {
    Cons(i32, Rc<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    println!("a의 참조 카운트: {}", Rc::strong_count(&a));

    let b = Cons(3, Rc::clone(&a));
    println!("a의 참조 카운트: {}", Rc::strong_count(&a));

    {
        let c = Cons(4, Rc::clone(&a));
        println!("a의 참조 카운트: {}", Rc::strong_count(&a));
    }

    println!("a의 참조 카운트: {}", Rc::strong_count(&a));
}
```

`Rc<T>`는 참조 카운팅 스마트 포인터로 다중 소유권을 허용합니다. 단일 스레드에서만 사용 가능합니다. `Rc::clone`은 데이터를 복사하지 않고 참조 카운트만 증가시킵니다.

### Rc와 참조 카운팅

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(5);
    println!("참조 카운트: {}", Rc::strong_count(&a));  // 1

    let b = Rc::clone(&a);
    println!("참조 카운트: {}", Rc::strong_count(&a));  // 2

    let c = Rc::clone(&a);
    println!("참조 카운트: {}", Rc::strong_count(&a));  // 3

    drop(b);
    println!("참조 카운트: {}", Rc::strong_count(&a));  // 2
}
```

`Rc::strong_count`로 현재 참조 카운트를 확인할 수 있습니다. 참조 카운트가 0이 되면 데이터가 해제됩니다. 순환 참조(cycle)이 발생하면 메모리 누수가 발생할 수 있습니다.

## Arc<T>

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let mut handles = vec![];

    for _ in 0..5 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            println!("데이터: {:?}", *data);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

`Arc<T>`는 원자적 참조 카운팅으로 스레드 안전한 다중 소유권을 제공합니다. `Rc`와 유사하지만 스레드 간에 안전하게 공유할 수 있습니다. `Send`와 `Sync` 트레이트를 구현해야 합니다.

### Rc vs Arc

| 특징 | Rc<T> | Arc<T> |
|------|-------|--------|
| 스레드 안전 | 아니오 | 예 |
| 성능 | 빠름 | 느림 (원자적 연산) |
| 사용 사례 | 단일 스레드 | 멀티 스레드 |

## RefCell<T>

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    // 불변 빌림
    let borrowed = data.borrow();
    println!("불변 참조: {}", *borrowed);

    // 가변 빌림
    let mut borrowed_mut = data.borrow_mut();
    *borrowed_mut = 10;
    println!("가변 참조: {}", *borrowed_mut);
}
```

`RefCell<T>`는 내부 가변성을 제공하는 스마트 포인터입니다. 런타임에 빌림 규칙을 검사하며, 규칙 위반 시 패닉이 발생합니다. 컴파일 타임에 불가능한 가변성을 허용합니다.

### 내부 가변성

```rust
pub struct Messenger {
    messages: RefCell<Vec<String>>,
}

impl Messenger {
    pub fn new() -> Self {
        Messenger {
            messages: RefCell::new(vec![]),
        }
    }

    pub fn send(&self, message: &str) {
        self.messages.borrow_mut().push(String::from(message));
    }

    pub fn get_messages(&self) -> Vec<String> {
        self.messages.borrow().clone()
    }
}

fn main() {
    let messenger = Messenger::new();
    messenger.send("Hello");
    messenger.send("World");
    println!("{:?}", messenger.get_messages());
}
```

내부 가변성은 외부 API는 불변이지만 내부에서는 가변성이 필요할 때 사용됩니다. `RefCell`은 `borrow_mut`로 가변 참조를 얻을 수 있습니다. 런타임에 빌림 규칙을 검사합니다.

## Deref 트레이트

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn hello(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m);  // Deref 강제 변환
}
```

`Deref` 트레이트는 스마트 포인터를 일반 참조처럼 동작하게 합니다. `deref` 메서드는 `&Target`을 반환합니다. Deref 강제 변환(deref coercion)으로 `&MyBox<T>`가 `&T`로 자동 변환됩니다.

### Deref와 DerefMut

```rust
use std::ops::{Deref, DerefMut};

struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> DerefMut for MyBox<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

fn main() {
    let mut m = MyBox::new(5);
    *m = 10;
    println!("{}", *m);
}
```

`DerefMut`는 가변 참조에 대한 `Deref`입니다. `deref_mut` 메서드는 `&mut Target`을 반환합니다. 가변 참조에 대한 Deref 강제 변환을 지원합니다.

## Drop 트레이트

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("my stuff"),
    };
    let d = CustomSmartPointer {
        data: String::from("other stuff"),
    };

    println!("CustomSmartPointers created.");
    drop(c);  // 명시적 해제
    println!("CustomSmartPointer c dropped before end of main.");
}
```

`Drop` 트레이트는 값이 범위를 벗어날 때 자동으로 호출됩니다. 리소스 해제 로직을 구현할 수 있습니다. `drop` 함수로 명시적으로 해제할 수도 있습니다.

### Drop 순서

```rust
struct Droppable<'a> {
    name: &'a str,
}

impl<'a> Drop for Droppable<'a> {
    fn drop(&mut self) {
        println!("Dropping: {}", self.name);
    }
}

fn main() {
    let _a = Droppable { name: "a" };
    let _b = Droppable { name: "b" };
    {
        let _c = Droppable { name: "c" };
        let _d = Droppable { name: "d" };
    }
    println!("end of inner scope");
    println!("end of main");
}
```

변수는 선언의 역순으로 해제됩니다. 내부 스코프의 변수가 먼저 해제됩니다. `Drop`은 자동으로 호출되며 명시적으로 호출할 필요가 없습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 스마트 포인터와 일반 참조의 차이는 무엇인가요?</strong></summary>

스마트 포인터는 추가 기능을 제공하는 포인터입니다: (1) **메모리 관리**: `Box`, `Rc`, `Arc`는 메모리 할당/해제를 자동화합니다. (2) **소유권**: `Rc`, `Arc`는 다중 소유권을 허용합니다. (3) **내부 가변성**: `RefCell`은 런타임에 가변성을 제공합니다. 일반 참조는 빌림 규칙을 따르며 추가 기능이 없습니다.
</details>

<details>
<summary><strong>Q> Rc와 Arc 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Rc<T>`는 단일 스레드에서 다중 소유권이 필요할 때 사용합니다. 더 빠르지만 스레드 간 공유가 불가능합니다. `Arc<T>`는 멀티 스레드에서 다중 소유권이 필요할 때 사용합니다. 원자적 연산으로 인해 느리지만 스레드 안전합니다. 스레드를 사용하지 않으면 `Rc`를, 스레드를 사용하면 `Arc`를 사용합니다.
</details>

<details>
<summary><strong>Q> RefCell이 언제 필요한가요?</strong></summary>

`RefCell<T>`는 다음 경우에 필요합니다: (1) 불변 메서드 내에서 내부 상태를 수정해야 할 때 (2) 트레이트 구현에서 가변성이 필요하지만 트레이트 시그니처가 불변일 때 (3) 컴파일 타임 빌림 규칙이 너무 엄격할 때. 런타임 검사로 패닉 가능성이 있으므로 신중하게 사용해야 합니다.
</details>

<details>
<summary><strong>Q> Deref 강제 변환은 어떻게 동작하나요?</strong></summary>

Deref 강제 변환은 `Deref` 트레이트를 구현한 타입을 참조로 자동 변환합니다. 컴파일러는 `&T`가 필요한 곳에 `&U`(`U: Deref<Target=T>`)를 허용합니다. 여러 번 연쇄적으로 적용됩니다. 예: `&MyBox<String>` → `&String` → `&str`. 이는 스마트 포인터를 일반 참조처럼 사용할 수 있게 합니다.
</details>

<details>
<summary><strong>Q> 순환 참조는 어떻게 방지하나요?</strong></summary>

순환 참조는 참조 카운트가 0이 되지 않아 메모리 누수를 유발합니다. 방지 방법: (1) `Weak<T>`로 약한 참조 사용 (2) 데이터 구조 재설계 (3) 순환을 끊는 메서드 제공. `Weak`는 참조 카운트를 증가시키지 않으므로 순환 참조를 방지할 수 있습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Box<T>** | 힙 할당 | 재귀적 타입, 트레이트 객체 |
| **Rc<T>** | 참조 카운팅 | 단일 스레드 다중 소유권 |
| **Arc<T>** | 원자적 참조 카운팅 | 스레드 안전 다중 소유권 |
| **RefCell<T>** | 내부 가변성 | 런타임 빌림 검사 |
| **Deref** | 참처럼 동작 | Deref 강제 변환 |
| **Drop** | 자동 해제 | 범위 종료 시 호출 |
| **Weak<T>** | 약한 참조 | 순환 참조 방지 |


## 다음 수업

다음 글에서는 Rust 중급 — 동시성, 스레드, 메시지 전달, 공유 상태, Mutex를 배웁니다.
