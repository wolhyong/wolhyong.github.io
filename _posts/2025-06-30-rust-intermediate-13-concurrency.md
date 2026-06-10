---
layout: post
title: "Rust 동시성 — 스레드, 메시지 전달, 채널, 공유 상태, Mutex, RwLock, Atomics"
description: "Rust의 동시성 모델을 시스템 레벨에서 학습합니다. thread::spawn으로 새 스레드를 생성하며 move 클로저로 소유권을 이동합니다. 메시지 전달(message passing)은 채널(channel)을 통해 스레드 간 통신을 안전하게 수행하며 mpsc::channel로 다중 생산자 단일 소비자 패턴을 구현합니다. 공유 상태(concurrency)는 Mutex와 RwLock으로 동시 접근을 제어하며 lock으로 가변 접근을 보호합니다. Arc<T>로 스레드 간 안전한 공유를 구현합니다. Atomic 타입은 원자적 연산으로 락 없이 동시성을 제어합니다. Rust는 타입 시스템 수준에서 데이터 레이스를 컴파일 타임에 방지하며 Send와 Sync 트레이트로 스레드 안전성을 보장합니다."
date: 2025-06-30 10:00:00 +0900
category: rust
tags: [rust, concurrency, threads, channels, mutex, arc, atomics, message-passing]
level: intermediate
---

Rust는 메모리 안전한 동시성을 타입 시스템 수준에서 보장하며 데이터 레이스를 컴파일 타임에 방지합니다.

> **핵심 정리** · `thread::spawn`으로 스레드를 생성하며 `move`로 소유권을 이동합니다. 채널로 메시지 전달을 안전하게 수행합니다. `Mutex`와 `Arc`로 공유 상태를 안전하게 관리합니다. `Atomic` 타입으로 락 없는 동시성을 구현합니다. Rust는 데이터 레이스를 컴파일 타임에 방지합니다.


## 수업 목표

- 스레드 생성과 join을 이해합니다.
- 채널로 메시지 전달을 구현할 수 있습니다.
- Mutex와 RwLock으로 공유 상태를 관리할 수 있습니다.
- Arc로 스레드 간 안전한 공유를 이해합니다.
- Atomic 타입의 사용법을 이해합니다.
- Send와 Sync 트레이트를 이해합니다.

## 스레드 생성

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..=10 {
            println!("hi number {} from the spawned thread", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..=5 {
        println!("hi number {} from the main thread", i);
        thread::sleep(Duration::from_millis(1));
    }
}
```

`thread::spawn`은 새 스레드를 생성하고 클로저를 실행합니다. 메인 스레드가 종료되면 생성된 스레드도 종료됩니다. 스레드 간 실행 순서는 비결정적입니다.

### join으로 대기

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..=10 {
            println!("hi number {} from the spawned thread", i);
        }
    });

    for i in 1..=5 {
        println!("hi number {} from the main thread", i);
    }

    handle.join().unwrap();  // 스레드 종료 대기
}
```

`join`은 스레드가 종료될 때까지 대기합니다. `JoinHandle`의 `join` 메서드는 `Result`를 반환하며 스레드 패닉 시 `Err`를 반환합니다.

### move 클로저

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        println!("벡터: {:?}", v);
    });

    handle.join().unwrap();
}
```

`move` 클로저는 캡처된 변수의 소유권을 스레드로 이동합니다. 스레드가 메인 스레드보다 오래 살 수 있으므로 소유권 이동이 필요합니다.

## 메시지 전달

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
    });

    let received = rx.recv().unwrap();
    println!("받음: {}", received);
}
```

`mpsc::channel`은 다중 생산자 단일 소비자(multi-producer, single-consumer) 채널을 생성합니다. `send`는 메시지를 전송하고, `recv`는 메시지를 수신합니다. `send`는 소유권을 이동합니다.

### 다중 값 전송

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    for received in rx {
        println!("받음: {}", received);
    }
}
```

`rx`는 이터레이터로 사용할 수 있습니다. 채널이 닫히면 반복이 종료됩니다. `tx`가 드롭되면 채널이 닫힙니다.

### 다중 생산자

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    let tx1 = tx.clone();
    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx1.send(val).unwrap();
        }
    });

    thread::spawn(move || {
        let vals = vec![
            String::from("more"),
            String::from("messages"),
            String::from("for"),
            String::from("you"),
        ];

        for val in vals {
            tx.send(val).unwrap();
        }
    });

    for received in rx {
        println!("받음: {}", received);
    }
}
```

`tx.clone()`으로 추가 송신자를 생성할 수 있습니다. 모든 송신자가 드롭되면 채널이 닫힙니다.

## 공유 상태 동시성

```rust
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Mutex::new(0);
    let mut handles = vec![];

    for _ in 0..10 {
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("결과: {}", *counter.lock().unwrap());
}
```

`Mutex<T>`는 상호 배제(mutual exclusion)를 제공하여 한 번에 하나의 스레드만 데이터에 접근할 수 있습니다. `lock`으로 락을 획득하고 `MutexGuard`를 반환합니다. 락이 해제되지 않으면 데드락이 발생할 수 있습니다.

### Arc와 Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("결과: {}", *counter.lock().unwrap());
}
```

`Arc<T>`는 원자적 참조 카운팅으로 스레드 간 안전한 공유를 제공합니다. `Rc`는 스레드 안전하지 않으므로 `Arc`를 사용해야 합니다. `Arc::clone`은 참조 카운트를 증가시킵니다.

### RwLock

```rust
use std::sync::RwLock;
use std::thread;

fn main() {
    let lock = RwLock::new(5);

    // 여러 읽기
    {
        let r1 = lock.read().unwrap();
        let r2 = lock.read().unwrap();
        println!("r1: {}, r2: {}", r1, r2);
    }

    // 단일 쓰기
    {
        let mut w = lock.write().unwrap();
        *w += 1;
    }

    println!("결과: {}", *lock.read().unwrap());
}
```

`RwLock<T>`는 읽기-쓰기 락을 제공합니다. 여러 읽기 또는 단일 쓰기를 허용합니다. 읽기가 많은 작업에 유용합니다. 쓰기 락은 읽기 락보다 우선순위가 높습니다.

## Atomic 타입

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

fn main() {
    let counter = AtomicUsize::new(0);
    let mut handles = vec![];

    for _ in 0..10 {
        let handle = thread::spawn(move || {
            for _ in 0..100 {
                counter.fetch_add(1, Ordering::SeqCst);
            }
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("결과: {}", counter.load(Ordering::SeqCst));
}
```

`Atomic` 타입은 원자적 연산을 제공하여 락 없이 동시성을 제어합니다. `fetch_add`는 원자적 덧셈을 수행합니다. `Ordering`은 메모리 순서를 지정합니다. `SeqCst`는 순차적 일관성(sequentially consistent)을 보장합니다.

### 메모리 순서

```rust
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;

fn main() {
    let ready = AtomicBool::new(false);

    thread::spawn(|| {
        println!("작업 수행");
        ready.store(true, Ordering::Release);
    });

    while !ready.load(Ordering::Acquire) {
        thread::sleep(std::time::Duration::from_millis(100));
    }

    println!("준비 완료");
}
```

`Ordering::Release`와 `Ordering::Acquire`는 릴리즈-획득(release-acquire) 순서를 제공합니다. `Release`는 이전 쓰기가 완료됨을 보장하고, `Acquire`는 이후 읽기가 이전 쓰기를 관찰함을 보장합니다. `SeqCst`는 가장 강력하지만 느립니다.

## Send와 Sync 트레이트

```rust
use std::marker::PhantomData;

struct MyStruct<T> {
    data: T,
    _marker: PhantomData<T>,
}

// Send: 스레드 간 소유권 이동 가능
unsafe impl<T: Send> Send for MyStruct<T> {}

// Sync: &T가 스레드 간 공유 가능
unsafe impl<T: Sync> Sync for MyStruct<T> {}
```

`Send` 트레이트는 타입이 스레드 간 소유권 이동이 가능함을 나타냅니다. `Sync` 트레이트는 타입의 참조가 스레드 간 안전하게 공유될 수 있음을 나타냅니다. 대부분의 타입은 자동으로 구현됩니다. `Rc<T>`는 `Send`가 아니므로 스레드 간 공유가 불가능합니다. `Arc<T>`는 `Send`와 `Sync`를 구현합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 메시지 전달과 공유 상태 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

메시지 전달은 "통신으로 메모리 공유를 피하라(do not communicate by sharing memory; instead, share memory by communicating)" 철학을 따릅니다. 스레드 간 독립성이 높고 단순한 통신이 필요할 때 사용합니다. 공유 상태는 복잡한 동기화가 필요하거나 성능이 중요할 때 사용합니다. Rust는 두 패턴 모두를 안전하게 지원합니다.
</details>

<details>
<summary><strong>Q> Mutex와 RwLock 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Mutex`는 단일 스레드만 접근을 허용하며 간단한 경우에 사용합니다. `RwLock`은 여러 읽기 또는 단일 쓰기를 허용하며 읽기가 많은 작업에 유용합니다. `RwLock`은 더 복잡하고 오버헤드가 있습니다. 대부분의 경우 `Mutex`로 충분합니다.
</details>

<details>
<summary><strong>Q> Arc와 Rc 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Arc<T>`는 스레드 간 안전한 공유가 필요할 때 사용합니다. `Rc<T>`는 단일 스레드에서만 사용할 수 있습니다. 스레드를 사용하지 않으면 `Rc`가 더 빠릅니다. 스레드를 사용하면 반드시 `Arc`를 사용해야 합니다. `Arc`는 원자적 연산으로 인해 약간의 오버헤드가 있습니다.
</details>

<details>
<summary><strong>Q> Atomic 타입은 언제 사용해야 하나요?</strong></summary>

`Atomic` 타입은 락 없는 동시성이 필요할 때 사용합니다. 단순한 카운터, 플래그, 포인터 등에 유용합니다. 복잡한 동기화에는 `Mutex`가 더 적합합니다. `Atomic`은 락 오버헤드가 없으므로 고성능이 필요한 경우에 사용합니다. 하지만 메모리 순서를 이해해야 합니다.
</details>

<details>
<summary><strong>Q> 데드락은 어떻게 방지하나요?</strong></summary>

데드락 방지 방법: (1) 락 획득 순서를 일관되게 유지 (2) 락 범위를 최소화 (3) `try_lock`로 타임아웃 사용 (4) 락 계층 구조 유지. Rust는 `MutexGuard`가 드롭되면 자동으로 락을 해제하므로 실수로 락을 유지할 위험이 줄어듭니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **thread::spawn** | 스레드 생성 | move로 소유권 이동 |
| **join** | 스레드 종료 대기 | JoinHandle 사용 |
| **채널** | 메시지 전달 | mpsc::channel |
| **Mutex** | 상호 배제 | 단일 스레드 접근 |
| **RwLock** | 읽기-쓰기 락 | 여러 읽기 또는 단일 쓰기 |
| **Arc** | 원자적 참조 카운팅 | 스레드 안전 공유 |
| **Atomic** | 원자적 연산 | 락 없는 동시성 |
| **Send** | 소유권 이동 가능 | 스레드 간 전송 |
| **Sync** | 참조 공유 가능 | 스레드 간 공유 |


## 다음 수업

다음 글에서는 Rust 중급 — 테스트, 유닛 테스트, 통합 테스트, 문서 테스트를 배웁니다.
