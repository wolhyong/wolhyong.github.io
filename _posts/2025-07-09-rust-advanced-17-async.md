---
layout: post
title: "Rust 비동기 프로그래밍 — Future, async/await, Tokio 런타임, 비동기 I/O, 태스크"
description: "Rust의 비동기 프로그래밍 모델을 시스템 레벨에서 학습합니다. Future 트레이트는 비동기 연산을 표현하며 poll 메서드로 진행 상태를 확인합니다. async/await 문법은 비동기 코드를 동기 코드처럼 작성할 수 있게 하는 구문 설탕입니다. Tokio는 가장 인기 있는 비동기 런타임으로 태스크 스케줄링, 타이머, I/O를 제공합니다. 비동기 I/O는 논블로킹 I/O로 스레드를 효율적으로 사용합니다. 태스크는 비동기 작업 단위로 spawn으로 생성되며 JoinHandle로 결과를 기다릴 수 있습니다. Rust의 비동기 모델은 제로-cost 추상화로 동기 코드와 동일한 성능을 보장합니다."
date: 2025-07-09 10:00:00 +0900
category: rust
tags: [rust, async, future, async-await, tokio, async-io, zero-cost]
level: advanced
---

Rust의 비동기 프로그래밍은 제로-cost 추상화로 높은 성능과 안전성을 동시에 제공합니다.

> **핵심 정리** · `Future` 트레이트는 비동기 연산을 표현하며 `poll` 메서드로 진행 상태를 확인합니다. `async/await`는 비동기 코드를 동기 코드처럼 작성하게 합니다. `Tokio`는 비동기 런타임으로 태스크 스케줄링과 I/O를 제공합니다. 비동기 I/O는 논블로킹으로 스레드를 효율적으로 사용합니다.


## 수업 목표

- Future 트레이트의 동작을 이해합니다.
- async/await 문법을 사용할 수 있습니다.
- Tokio 런타임을 설정하고 사용할 수 있습니다.
- 비동기 I/O의 동작을 이해합니다.
- 태스크를 생성하고 관리할 수 있습니다.
- 비동기 에러 처리를 이해합니다.

## Future 트레이트

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct MyFuture {
    state: u32,
}

impl Future for MyFuture {
    type Output = u32;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context) -> Poll<Self::Output> {
        if self.state < 10 {
            self.state += 1;
            cx.waker().wake_by_ref();  // 다음 폴링 예약
            Poll::Pending
        } else {
            Poll::Ready(self.state)
        }
    }
}
```

`Future` 트레이트는 비동기 연산을 표현합니다. `poll` 메서드는 연산의 진행 상태를 확인하며 `Poll::Ready`(완료) 또는 `Poll::Pending`(진행 중)을 반환합니다. `Context`는 웨이커(waker)를 포함하여 완료 시 알림을 받을 수 있습니다.

### async 블록

```rust
async fn hello() -> String {
    String::from("Hello, async!")
}

fn main() {
    let future = hello();
    // future는 즉시 실행되지 않음
    // 런타임에서 실행해야 함
}
```

`async fn`은 비동기 함수를 정의하며 `Future`를 반환합니다. `async` 블록도 `Future`를 반환합니다. 함수가 호출되면 `Future`가 즉시 반환되지만 실제 실행은 런타임에서 폴링될 때 시작됩니다.

## async/await

```rust
async fn hello() -> String {
    String::from("Hello, async!")
}

async fn world() -> String {
    String::from("World!")
}

async fn hello_world() -> String {
    let hello = hello().await;
    let world = world().await;
    format!("{} {}", hello, world)
}
```

`.await`는 `Future`가 완료될 때까지 기다립니다. 비동기 코드를 동기 코드처럼 작성할 수 있게 합니다. `.await`는 비동기 지점(yield point)으로 런타임이 다른 태스크로 전환할 수 있습니다.

## Tokio 런타임

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
use tokio;

#[tokio::main]
async fn main() {
    println!("Hello, Tokio!");
}
```

`#[tokio::main]` 매크로는 런타임을 설정하고 `main` 함수를 비동기로 실행합니다. `full` feature는 모든 Tokio 기능을 포함합니다. 필요한 기능만 선택하여 바이너리 크기를 줄일 수 있습니다.

### Tokio 태스크

```rust
use tokio::task;

async fn task_one() {
    println!("Task one");
}

async fn task_two() {
    println!("Task two");
}

#[tokio::main]
async fn main() {
    let handle1 = task::spawn(task_one());
    let handle2 = task::spawn(task_two());

    handle1.await.unwrap();
    handle2.await.unwrap();
}
```

`task::spawn`은 새 태스크를 생성하고 즉시 실행합니다. `JoinHandle`을 반환하며 `.await`로 태스크 완료를 기다릴 수 있습니다. 태스크는 동시에 실행되며 런타임이 스케줄링합니다.

## 비동기 I/O

```rust
use tokio::io::{self, AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;

    loop {
        let (mut socket, _) = listener.accept().await?;

        tokio::spawn(async move {
            let mut buf = [0; 1024];

            loop {
                let n = match socket.read(&mut buf).await {
                    Ok(n) if n == 0 => return,
                    Ok(n) => n,
                    Err(e) => {
                        eprintln!("failed to read from socket; err = {:?}", e);
                        return;
                    }
                };

                if let Err(e) = socket.write_all(&buf[..n]).await {
                    eprintln!("failed to write to socket; err = {:?}", e);
                    return;
                }
            }
        });
    }
}
```

비동기 I/O는 논블로킹으로 스레드를 효율적으로 사용합니다. `.await`로 I/O 완료를 기다리는 동안 런타임은 다른 태스크를 실행할 수 있습니다. 단일 스레드로 수천 개의 동시 연결을 처리할 수 있습니다.

### 비동기 파일 I/O

```rust
use tokio::fs;
use tokio::io::{self, AsyncReadExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let contents = fs::read_to_string("example.txt").await?;
    println!("파일 내용: {}", contents);

    let mut file = fs::File::open("example.txt").await?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).await?;
    println!("바이트 수: {}", buffer.len());

    Ok(())
}
```

`tokio::fs`는 비동기 파일 I/O를 제공합니다. `read_to_string`, `File::open` 등은 비동기 버전입니다. 파일 I/O도 논블로킹으로 수행됩니다.

## 타이머

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    println!("시작");

    sleep(Duration::from_secs(2)).await;

    println!("2초 후");
}
```

`tokio::time::sleep`은 비동기 타이머를 제공합니다. `.await`로 지정된 시간 동안 대기합니다. 대기 중에 런타임은 다른 태스크를 실행할 수 있습니다.

### interval

```rust
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    let mut interval = interval(Duration::from_secs(1));

    for i in 0..5 {
        interval.tick().await;
        println!("{}초 경과", i + 1);
    }
}
```

`interval`은 주기적으로 틱을 생성합니다. `tick().await`로 다음 틱을 기다립니다. 주기적인 작업에 사용됩니다.

## 동시성

```rust
use tokio::time::{sleep, Duration};

async fn task1() {
    sleep(Duration::from_secs(1)).await;
    println!("Task 1 완료");
}

async fn task2() {
    sleep(Duration::from_secs(2)).await;
    println!("Task 2 완료");
}

#[tokio::main]
async fn main() {
    tokio::join!(task1(), task2());
    println!("모든 작업 완료");
}
```

`tokio::join!`은 여러 비동기 작업을 동시에 실행하고 모두 완료될 때까지 기다립니다. 작업은 병렬로 실행되며 총 시간은 가장 느린 작업의 시간과 같습니다.

### select!

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel::<i32>();

    tokio::spawn(async move {
        sleep(Duration::from_secs(1)).await;
        tx.send(42).await.unwrap();
    });

    tokio::select! {
        value = rx.recv() => {
            println!("받음: {:?}", value);
        }
        _ = sleep(Duration::from_secs(2)) => {
            println!("타임아웃");
        }
    }
}
```

`tokio::select!`는 여러 비동기 작업 중 먼저 완료되는 것을 기다립니다. 채널 수신, 타이머 등 여러 이벤트를 동시에 기다릴 때 사용됩니다.

## 에러 처리

```rust
async fn might_fail() -> Result<String, String> {
    Err(String::from("에러 발생"))
}

#[tokio::main]
async fn main() {
    match might_fail().await {
        Ok(value) => println!("성공: {}", value),
        Err(e) => println!("에러: {}", e),
    }
}
```

비동기 함수에서도 `Result<T, E>`를 사용하여 에러를 처리할 수 있습니다. `?` 연산자도 비동기 함수에서 사용할 수 있습니다.

### ? 연산자

```rust
async fn step1() -> Result<String, String> {
    Ok(String::from("Step 1"))
}

async fn step2(input: String) -> Result<String, String> {
    Ok(format!("{} -> Step 2", input))
}

async fn pipeline() -> Result<String, String> {
    let result = step1().await?;
    step2(result).await
}

#[tokio::main]
async fn main() {
    match pipeline().await {
        Ok(value) => println!("{}", value),
        Err(e) => println!("에러: {}", e),
    }
}
```

`?` 연산자는 비동기 함수에서도 에러를 전파합니다. 비동기 체이닝에서 에러 처리를 간소화합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> async/await는 스레드와 어떻게 다른가요?</strong></summary>

`async/await`는 스레드 기반이 아닌 이벤트 루프 기반입니다. 단일 스레드에서 수천 개의 동시 작업을 처리할 수 있습니다. 스레드는 OS 스레드로 비용이 높지만, 태스크는 가볍습니다. I/O 바운드 작업에 매우 효율적이지만 CPU 바운드 작업에는 스레드 풀이 필요할 수 있습니다.
</details>

<details>
<summary><strong>Q> Tokio는 왜 필요한가요?</strong></summary>

Tokio는 비동기 런타임으로 태스크 스케줄링, 타이머, I/O를 제공합니다. `async` 함수는 런타임 없이 실행할 수 없습니다. Tokio는 가장 인기 있는 런타임으로 생태계가 풍부합니다. 다른 런타임도 있지만 Tokio를 사용하는 것이 일반적입니다.
</details>

<details>
<summary><strong>Q> 비동기 코드는 언제 사용해야 하나요?</strong></summary>

비동기 코드는 I/O 바운드 작업에 적합합니다: 네트워크 요청, 파일 I/O, 데이터베이스 쿼리. CPU 바운드 작업에는 스레드 풀이 더 적합할 수 있습니다. 동시성이 높고 대기 시간이 긴 작업에 비동기 코드를 사용하면 스레드를 효율적으로 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q> async 함수는 언제 실행되나요?</strong></summary>

`async` 함수가 호출되면 `Future`가 즉시 반환되지만 실제 실행은 런타임에서 폴링될 때 시작됩니다. 첫 번째 `.await`에서 실제 실행이 시작됩니다. 런타임이 없으면 `Future`는 절대 실행되지 않습니다. `#[tokio::main]` 또는 런타임 설정이 필요합니다.
</details>

<details>
<summary><strong>Q> select!는 어떻게 동작하나요?</strong></summary>

`select!`는 여러 비동기 작업을 동시에 기다리며 먼저 완료되는 것을 반환합니다. 내부적으로 각 작업을 폴링하고 완료된 작업을 선택합니다. 채널 수신, 타이머, 여러 Future를 동시에 기다릴 때 사용됩니다. 런타임에 따라 구현이 다를 수 있습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Future** | 비동기 연산 | poll 메서드 |
| **async/await** | 비동기 문법 | 동기 코드처럼 작성 |
| **Tokio** | 비동기 런타임 | 태스크 스케줄링 |
| **비동기 I/O** | 논블로킹 I/O | 효율적 스레드 사용 |
| **태스크** | 비동기 작업 단위 | spawn으로 생성 |
| **타이머** | 비동기 대기 | sleep, interval |
| **join!** | 동시 실행 | 모두 완료 대기 |
| **select!** | 첫 완료 대기 | 여러 작업 중 선택 |


## 다음 수업

다음 글에서는 Rust 고급 — 웹 프로그래밍, Actix-web, Axum, HTTP 서버를 배웁니다.
