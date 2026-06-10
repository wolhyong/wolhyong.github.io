---
layout: post
title: "Go 고급 동시성 패턴 — Worker Pool, Fan-In/Fan-Out, Pipeline, 배압 관리와 graceful shutdown"
description: "Go의 고급 동시성 패턴을 실제 애플리케이션 설계 레벨에서 학습합니다. Worker Pool 패턴이 제한된 수의 고루틴을 미리 생성하고 작업 채널을 통해 작업을 분배하여 리소스 사용량을 제어하는 방식(채널 버퍼링과 고루틴 풀의 관계), Fan-Out 패턴이 하나의 입력 채널에서 여러 Workers에게 작업을 분산하여 처리량을 높이는 구조(동적 worker 수 조절), Fan-In 패턴이 여러 입력 채널을 하나의 출력 채널로 병합하는 방식(merge 함수의 select + goroutine 조합), Pipeline 패턴이 각 단계를 채널로 연결하여 데이터가 순차적으로 흐르는 구조(gen → sq → print), 배압 관리(Backpressure)를 위해 버퍼 크기를 제한하고 채널이 가득 차면 생산자가 블로킹되도록 하는 방식, 컨텍스트 취소와 sync.WaitGroup 조합으로 graceful shutdown을 구현하는 방법을 다룹니다."
date: 2025-04-14 10:00:00 +0900
category: go
tags: [go, golang, concurrency-patterns, worker-pool, fan-in, fan-out, pipeline, backpressure, graceful-shutdown]
level: advanced
---

Go의 고급 동시성 패턴은 채널과 고루틴의 조합으로 복잡한 병렬 처리 시스템을 구축합니다.

> **핵심 정리** · Worker Pool은 고정된 수의 고루틴으로 작업 채널을 처리합니다. Fan-Out은 입력 채널을 여러 Worker로 분산하고, Fan-In은 여러 채널을 하나로 병합합니다. Pipeline은 각 단계를 채널로 연결한 순차 처리 구조입니다. 채널 버퍼 크기 제한으로 배압(backpressure)을 구현하고, context + WaitGroup으로 graceful shutdown을 구현합니다.

## 수업 목표

- Worker Pool 패턴을 구현할 수 있습니다.
- Fan-Out/Fan-In 패턴을 이해합니다.
- Pipeline 패턴을 구현할 수 있습니다.
- 배압(backpressure)을 구현하는 방법을 이해합니다.
- Graceful shutdown을 구현할 수 있습니다.

## Worker Pool 패턴

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// Job — 작업 단위
type Job struct {
    ID   int
    Data string
}

// Result — 처리 결과
type Result struct {
    JobID  int
    Output string
}

// worker — 실제 작업 처리 함수
func worker(id int, jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        fmt.Printf("Worker %d: 처리 중 %d\n", id, job.ID)
        time.Sleep(100 * time.Millisecond) // 시뮬레이션
        results <- Result{JobID: job.ID, Output: fmt.Sprintf("완료: %s", job.Data)}
    }
}

func main() {
    numJobs := 20
    numWorkers := 5

    jobs := make(chan Job, numJobs)
    results := make(chan Result, numJobs)

    // Worker Pool 시작
    var wg sync.WaitGroup
    for i := 1; i <= numWorkers; i++ {
        wg.Add(1)
        go worker(i, jobs, results, &wg)
    }

    // 작업 전송
    for i := 1; i <= numJobs; i++ {
        jobs <- Job{ID: i, Data: fmt.Sprintf("Task %d", i)}
    }
    close(jobs) // 더 이상 작업 없음

    // 모든 Worker 완료 대기
    wg.Wait()
    close(results) // 결과 채널 닫기

    // 결과 수집
    for result := range results {
        fmt.Printf("결과: %s\n", result.Output)
    }
}
```

Worker Pool 패턴은 **제한된 수의 고루틴**을 미리 생성하고, 작업 채널(`jobs chan Job`)을 통해 작업을 분배합니다. `numWorkers = 5`로 5개의 고루틴이 20개의 작업을 처리합니다. 각 Worker는 `range jobs`로 채널에서 작업을 읽고, 완료되면 결과를 `results` 채널에 씁니다. `close(jobs)`로 모든 작업을 전송했음을 알리면, Worker들이 작업을 모두 소비한 후 자동으로 종료됩니다. 장점: 동시 고루틴 수를 제어하여 리소스 사용량을 예측 가능하게 관리할 수 있습니다.

### Fan-Out / Fan-In 패턴

```go
package main

import (
    "fmt"
    "sync"
)

// Fan-Out: 하나의 입력 채널 → 여러 Worker
func fanOut(input <-chan int, numWorkers int) []<-chan int {
    channels := make([]<-chan int, numWorkers)
    for i := 0; i < numWorkers; i++ {
        channels[i] = processWorker(i, input)
    }
    return channels
}

func processWorker(id int, input <-chan int) <-chan int {
    output := make(chan int)
    go func() {
        defer close(output)
        for val := range input {
            output <- val * val // 제곱 처리
        }
    }()
    return output
}

// Fan-In: 여러 입력 채널 → 하나의 출력 채널
func fanIn(channels ...<-chan int) <-chan int {
    output := make(chan int)
    var wg sync.WaitGroup

    // 각 입력 채널을 읽어서 출력 채널로 전달
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for val := range c {
                output <- val
            }
        }(ch)
    }

    // 모든 입력 채널이 닫히면 출력 채널도 닫기
    go func() {
        wg.Wait()
        close(output)
    }()

    return output
}

func main() {
    // 입력 생성
    input := make(chan int, 10)
    go func() {
        for i := 1; i <= 10; i++ {
            input <- i
        }
        close(input)
    }()

    // Fan-Out: 3개의 Worker로 분산
    workers := fanOut(input, 3)

    // Fan-In: 결과 병합
    results := fanIn(workers...)

    // 결과 출력
    for result := range results {
        fmt.Printf("결과: %d\n", result)
    }
}
```

**Fan-Out**은 하나의 입력 채널을 여러 Worker 고루틴에게 분산하여 병렬 처리합니다. 입력 데이터의 각 항목이 하나의 Worker에 의해 처리됩니다(채널이 자동으로 분배). **Fan-In**은 여러 입력 채널의 결과를 하나의 출력 채널로 병합합니다. 각 입력 채널을 읽는 고루틴을 생성하고, 결과를 공통 출력 채널에 씁니다. 모든 입력 채널이 닫히면 WaitGroup으로 모든 고루틴의 완료를 기다린 후 출력 채널을 닫습니다.

### Pipeline 패턴

```go
package main

import "fmt"

// Stage 1: 숫자 생성
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            out <- n
        }
    }()
    return out
}

// Stage 2: 제곱
func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * n
        }
    }()
    return out
}

// Stage 3: 결과 출력 (최종 단계)
func printResults(in <-chan int) {
    for n := range in {
        fmt.Printf("결과: %d\n", n)
    }
}

func main() {
    // Pipeline 구성: generate → square → print
    nums := generate(1, 2, 3, 4, 5)
    squares := square(nums)
    printResults(squares)
    // 출력:
    // 결과: 1
    // 결과: 4
    // 결과: 9
    // 결과: 16
    // 결과: 25
}
```

**Pipeline** 패턴은 각 단계를 채널로 연결합니다. `generate` → `square` → `print` 순서로 데이터가 흐릅니다. 각 단계는 입력 채널(`<-chan int`)을 받고 출력 채널(`<-chan int`)을 반환하는 함수로 표현됩니다. 각 단계는 독립적인 고루틴에서 실행되며, `range`로 입력 채널을 읽고 출력 채널에 씁니다. 채널이 닫히면 `range` 루프가 종료되면서 단계가 자동으로 종료됩니다(데이터 종료 신호).

### Graceful Shutdown

```go
package main

import (
    "context"
    "fmt"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

func workerWithContext(ctx context.Context, id int, wg *sync.WaitGroup) {
    defer wg.Done()
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d: 종료 신호 받음\n", id)
            return
        default:
            fmt.Printf("Worker %d: 작업 중...\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // 시그널 채널
    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

    var wg sync.WaitGroup
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go workerWithContext(ctx, i, &wg)
    }

    select {
    case <-sigCh:
        fmt.Println("시그널 감지, 종료 중...")
        cancel()
    case <-ctx.Done():
        fmt.Println("타임아웃")
    }

    wg.Wait()
    fmt.Println("모든 Worker 종료 완료")
}
```

Graceful Shutdown은 `os.Signal`로 SIGINT/SIGTERM을 감지하고, `context.WithCancel()`로 모든 고루틴에 종료 신호를 전파합니다. `sync.WaitGroup`으로 모든 고루틴이 안전하게 종료될 때까지 기다립니다. `select`로 시그널과 타임아웃을 동시에 대기합니다. 이 패턴은 HTTP 서버, 메시지 큐 소비자 등 장기 실행 서비스에서 필수적입니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Worker Pool의 크기는 어떻게 결정하나요?</strong></summary>

Worker Pool의 크기는 작업의 특성에 따라 결정됩니다: (1) **CPU 바운드 작업** — `runtime.GOMAXPROCS(0)` 이하로 설정합니다. CPU 코어 수를 초과하면 컨텍스트 스위칭 오버헤드만 증가합니다. (2) **I/O 바운드 작업** — 네트워크, 파일, 데이터베이스 요청 등은 CPU보다 대기 시간이 지배적이므로 더 많은 Worker가 효과적입니다. 보통 2~10배까지 실험적으로 결정합니다. (3) **외부 API 호출** — API의 Rate Limit에 맞춰 Worker 수를 제한합니다. (4) **메모리 제한** — 각 Worker가 사용하는 메모리를 고려하여 총 메모리 한도 내에서 결정합니다. 실제로는 메트릭을 수집하면서 조정하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: Fan-Out과 Fan-In 패턴의 일반적인 구현은 어떻게 되나요?</strong></summary>

Fan-Out: 하나의 입력 채널에서 데이터를 읽어 여러 Worker 고루틴에게 분배합니다. 각 Worker는 동일한 입력 채널에서 `range`로 읽습니다. 채널은 여러 수신자에게 데이터를 안전하게 분배합니다. 각 Worker는 결과를 개별 출력 채널에 씁니다. Fan-In: 여러 입력 채널의 데이터를 하나의 출력 채널로 병합합니다. Select 문이나 별도의 고루틴이 각 입력 채널을 읽어 출력 채널에 씁니다. Fan-In 함수는 `sync.WaitGroup`으로 모든 입력 소스의 완료를 기다린 후 출력 채널을 닫습니다. 이 패턴은 대규모 데이터 처리 시스템의 기본 구성 요소입니다.
</details>

<details>
<summary><strong>Q: Pipeline 패턴에서 에러 처리는 어떻게 하나요?</strong></summary>

Pipeline의 각 단계에서 에러가 발생하면: (1) **에러 채널 도입** — 각 단계에 별도의 에러 채널을 추가하여 에러를 전파합니다. (2) **컨텍스트 취소** — 모든 단계가 동일한 `context.Context`를 공유하여, 에러 발생 시 컨텍스트를 취소하면 모든 단계가 중단됩니다. (3) **결과 구조체** — `type Result struct { Value T; Err error }` 형태로 값과 에러를 함께 전달합니다. (4) **조기 종료** — `done` 채널을 파이프라인에 전달하여 에러 발생 시 모든 단계가 조기에 종료되도록 합니다. 실제 프로덕션 코드에서는 컨텍스트 취소 + 에러 채널 조합이 가장 일반적입니다.
</details>

<details>
<summary><strong>Q: 배압(backpressure)이 중요한 이유는 무엇인가요?</strong></summary>

배압이 없으면 생산자가 소비자보다 빠를 때 채널 버퍼가 무한정 커지거나(메모리 고갈), 생산자가 블로킹되지 않고 계속 데이터를 생성하여 시스템이 과부하 상태가 됩니다. Go에서 배압을 구현하는 방법: (1) **버퍼 크기 제한** — 채널 버퍼에 상한을 설정하여 버퍼가 가득 차면 생산자가 블로킹되도록 합니다. (2) **명시적 블로킹** — 생산자와 소비자 속도를 일치시키기 위해 언버퍼 채널을 사용합니다. (3) **동적 조절** — 소비자의 처리 속도를 측정하여 생산자의 속도를 조절합니다. 배압은 시스템 안정성의 핵심 메커니즘입니다.
</details>

<details>
<summary><strong>Q: Graceful Shutdown은 어떻게 구현하나요?</strong></summary>

Graceful Shutdown은 애플리케이션 종료 시 진행 중인 작업을 안전하게 완료하고 리소스를 정리하는 과정입니다. 구현: (1) `os.Signal` 채널로 SIGINT/SIGTERM을 감지합니다. (2) 컨텍스트 취소로 모든 고루틴에 종료 신호를 보냅니다. (3) `sync.WaitGroup`으로 모든 고루틴이 완료될 때까지 기다립니다. HTTP 서버는 `Shutdown(ctx)` 메서드로 기존 요청을 완료하고 새 요청을 거부합니다. 타임아웃을 설정하여 무한 대기를 방지합니다. 실제 예: `srv.Shutdown(ctx) + wg.Wait() + close(done)`.
</details>

## 요약

| 패턴 | 설명 | 핵심 요소 |
|------|------|----------|
| **Worker Pool** | 제한된 고루틴으로 작업 처리 | 고정 고루틴 + 작업 채널 |
| **Fan-Out** | 단일 입력 → 다중 처리 | 하나의 채널을 여러 Worker가 읽음 |
| **Fan-In** | 다중 소스 → 단일 출력 | 여러 채널을 하나로 병합 |
| **Pipeline** | 단계별 채널 연결 | 각 단계를 채널로 직렬 연결 |
| **Backpressure** | 속도 조절 | 채널 버퍼 제한, 블로킹 |
| **Graceful Shutdown** | 안전한 종료 | signal + context + WaitGroup |

## 다음 수업

다음 글에서는 Go 리플렉션 — reflect 패키지, 동적 타입 검사와 값 조작을 배웁니다.
