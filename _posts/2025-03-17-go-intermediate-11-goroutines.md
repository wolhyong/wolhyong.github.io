---
layout: post
title: "Go 고루틴과 동시성 — goroutine의 스택 구조, M:N 스케줄러, sync.WaitGroup/Mutex/Once"
description: "Go의 고루틴과 동시성 제어를 런타임 레벨에서 학습합니다. go 키워드는 runtime.newproc()를 호출해 새로운 고루틴을 생성합니다. 초기 스택 크기는 2KB에서 시작하고 필요에 따라 동적으로 확장됩니다. Go 런타임의 M:N 스케줄러는 G(고루틴)와 P(Processor)를 OS 스레드 위에서 조합해 work stealing으로 스레드 간 고루틴을 분산합니다. sync.WaitGroup은 counter와 semaphore로 구현되어 Add()로 카운터를 증가시키고 Done()으로 감소시키며 Wait()가 0이 될 때까지 대기합니다. sync.Mutex는 runtime mutex와 OS 페러먼트(futex)를 사용해 잠금 경합 시 고루틴을 GOMAXPROCS 기반으로 블로킹합니다. sync.Once는 atomic 연산과 fast path/slow path로 단 한 번의 초기화를 보장합니다."
date: 2025-03-17 10:00:00 +0900
category: go
tags: [go, golang, goroutines, concurrency, scheduler, gmp, waitgroup, mutex, sync]
level: intermediate
---

고루틴은 Go 런타임이 관리하는 경량 스레드로, 수천 개의 고루틴을 하나의 프로세스에서 실행할 수 있습니다.

> **핵심 정리** · `go f()`는 runtime.newproc()으로 새 고루틴을 생성합니다. 초기 스택 2KB, 필요 시 동적 확장. M:N 스케줄러는 G(고루틴) → P(컨텍스트) → M(OS 스레드) 모델로 work stealing을 통해 고루틴을 분산합니다. sync.WaitGroup은 counter + semaphore로 대기를 구현합니다. sync.Mutex는 내부 mutex로 잠금 경합 시 고루틴을 블로킹합니다.

## 수업 목표

- 고루틴의 G-M-P 스케줄링 모델을 이해합니다.
- go 키워드의 내부 동작을 이해합니다.
- sync.WaitGroup의 동작 방식을 이해합니다.
- sync.Mutex와 sync.RWMutex의 차이를 이해합니다.
- sync.Once의 단일 실행 보장을 이해합니다.

## 고루틴 기초

```go
package main

import (
    "fmt"
    "time"
)

func sayHello(n int) {
    for i := 0; i < 3; i++ {
        fmt.Printf("고루틴 %d: %d\n", n, i)
        time.Sleep(10 * time.Millisecond)
    }
}

func main() {
    // 고루틴 시작
    for i := 1; i <= 3; i++ {
        go sayHello(i)
    }

    // 메인 고루틴이 종료되지 않도록 대기
    time.Sleep(100 * time.Millisecond)
    fmt.Println("메인 종료")
}
```

`go sayHello(i)`는 `sayHello(i)` 함수를 새로운 고루틴에서 실행합니다. `go` 키워드는 현재 실행을 블로킹하지 않고 즉시 반환됩니다. 고루틴은 OS 스레드보다 훨씬 가벼워 초기 스택이 2KB에 불과합니다. 메인 고루틴이 종료되면 프로그램이 종료되므로, 고루틴이 완료될 때까지 `time.Sleep`이나 `sync.WaitGroup`으로 대기해야 합니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: sync.WaitGroup은 내부적으로 어떻게 동작하나요?</strong></summary>

sync.WaitGroup은 내부적으로 `state1` 배열(64비트: counter 32비트 + waiter counter 32비트)과 `semaphore`로 구현됩니다. `Add(delta)`는 counter를 원자적으로(atomic) 증가시킵니다. `Done()`은 `Add(-1)`과 같습니다. `Wait()`은 counter가 0이 아니면 `runtime_Semacquire`를 호출하여 고루틴을 대기 상태로 전환합니다. counter가 0이 되면 `runtime_Semrelease`로 모든 대기 중인 고루틴을 깨웁니다. WaitGroup은 재사용 가능하며, 모든 Wait()이 반환된 후에만 Add()를 다시 호출할 수 있습니다.
</details>

<details>
<summary><strong>Q: G-M-P 모델에서 P(Processor)의 역할은 무엇인가요?</strong></summary>

P(Processor)는 고루틴을 실행하기 위한 **컨텍스트**입니다. GOMAXPROCS 값이 P의 개수를 결정합니다. 각 P는 로컬 고루틴 큐를 가지고 있습니다. 고루틴이 실행되려면 P가 반드시 있어야 합니다: Go루틴이 OS 스레드에서 실행되려면 G + P 짝이 필요합니다. P는 work stealing의 핵심입니다: 자신의 로컬 큐가 비면 다른 P의 큐에서 고루틴을 절반 가져와 실행합니다. 시스템 콜이나 네트워크 I/O로 고루틴이 블로킹되면, P는 해제되어 다른 고루틴을 실행할 수 있습니다.
</details>

<details>
<summary><strong>Q: Mutex와 RWMutex의 차이는 무엇인가요?</strong></summary>

sync.Mutex는 **배타적 잠금**(exclusive lock)으로, 하나의 고루틴만 임계 영역에 접근할 수 있습니다. sync.RWMutex는 **읽기/쓰기 잠금**(read/write lock)으로, 읽기는 여러 고루틴이 동시에 접근 가능하고 쓰기는 배타적입니다. 읽기 작업이 많고 쓰기 작업이 적은 상황에서 RWMutex는 Mutex보다 성능이 좋습니다. RWMutex는 내부적으로 writer-priority를 사용하여 쓰기 기아(starvation)를 방지합니다. 읽기 잠금은 `RLock()/RUnlock()`, 쓰기 잠금은 `Lock()/Unlock()`을 사용합니다.
</details>

<details>
<summary><strong>Q: sync.Once는 어떻게 한 번만 실행되는 것을 보장하나요?</strong></summary>

sync.Once는 내부적으로 `done uint32`(1=실행 완료)와 `m Mutex`를 사용합니다. `Do(f)` 호출 시: (1) `atomic.LoadUint32(&done)`으로 fast path 체크 (2) 0이면 slow path에서 mutex 확보 후 재확인(double-checked locking) (3) `f()` 실행 후 `atomic.StoreUint32(&done, 1)`로 완료 표시. 한 번 done=1이 되면 이후 모든 `Do(f)` 호출은 fast path에서 즉시 반환됩니다. 이 패턴은 싱글톤, 지연 초기화(lazy initialization), 설정 파일 로딩 등에 사용됩니다.
</details>

<details>
<summary><strong>Q: GOMAXPROCS는 어떻게 설정하나요?</strong></summary>

`runtime.GOMAXPROCS(n)`으로 설정하거나 `GOMAXPROCS=n` 환경 변수로 설정합니다. 기본값은 CPU 코어 수입니다. GOMAXPROCS는 **동시에 실행될 수 있는 OS 스레드의 수**를 결정합니다(P의 개수). 주의: GOMAXPROCS를 늘린다고 항상 성능이 좋아지는 것은 아닙니다. CPU 바운드 작업은 보통 GOMAXPROCS = CPU 코어 수가 최적입니다. I/O 바운드 작업은 더 많은 P가 효과적일 수 있습니다. Docker/쿠버네티스 환경에서는 Go 1.5+가 자동으로 CPU 할당량을 감지합니다.
</details>

## 요약

| 개념 | 설명 | 내부 구조 |
|------|------|----------|
| **고루틴** | Go 런타임 경량 스레드 | G 구조체, 초기 스택 2KB, 동적 확장 |
| **G-M-P 모델** | 고루틴 스케줄러 | G(고루틴) - P(컨텍스트) - M(OS 스레드) |
| **Work Stealing** | 부하 분산 | P의 로컬 큐가 비면 다른 P에서 절반 가져옴 |
| **sync.WaitGroup** | 고루틴 완료 대기 | counter + semaphore (atomic 연산) |
| **sync.Mutex** | 배타적 잠금 | runtime mutex + futex |
| **sync.RWMutex** | 읽기/쓰기 잠금 | reader count + writer priority |
| **sync.Once** | 단일 실행 보장 | atomic + double-checked locking |

## 다음 수업

다음 글에서는 Go 채널과 select — 채널의 내부 구조, 버퍼링, select 다중 채널 대기를 배웁니다.
