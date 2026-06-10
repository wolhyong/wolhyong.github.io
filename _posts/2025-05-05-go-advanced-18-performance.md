---
layout: post
title: "Go 성능 최적화 — pprof CPU/메모리 프로파일링, escape analysis, GC 튜닝, 동시성 최적화"
description: "Go 애플리케이션의 성능 최적화 방법을 실무 레벨에서 학습합니다. runtime/pprof 패키지가 SIGPROF 신호로 100밀리초마다 CPU 샘플링을 수행하여 CPU 시간을 가장 많이 소비하는 함수를 식별하는 과정, runtime.MemStats와 pprof 힙 프로파일링으로 메모리 할당 패턴을 분석하고 불필요한 힙 할당을 줄이는 방법, go test -bench와 -benchmem으로 벤치마크를 실행하고 allocs/op을 최소화하는 객체 풀링(object pool)과 sync.Pool의 동작 원리, escape analysis 최적화를 위해 변수의 수명을 컴파일러가 분석하도록 유도하고 go build -gcflags='-m'로 결과를 확인하는 과정, GC 튜닝을 위한 GOGC 설정과 GODEBUG=gctrace=1로 GC 로그를 분석하는 방법, 고루틴 프로파일링으로 블로킹과 경합(contention)을 식별하는 runtime/trace 사용법, Go 1.22+의 메모리 최적화(로드맵)와 profile-guided optimization(PGO)의 원리를 다룹니다."
date: 2025-05-05 10:00:00 +0900
category: go
tags: [go, golang, performance, pprof, profiling, escape-analysis, gc-tuning, sync-pool, pgo]
level: advanced
---

Go 성능 최적화는 측정(profiling), 분석(analysis), 개선(optimization)의 순환 과정입니다.

> **핵심 정리** · `pprof`는 CPU(샘플링 100Hz)와 메모리(할당 프로파일)를 프로파일링합니다. `go test -bench`로 벤치마크하고 `-benchmem`으로 메모리 할당을 확인합니다. `sync.Pool`은 객체 재사용으로 GC 부담을 줄입니다. `go build -gcflags='-m'`로 escape analysis 결과를 확인합니다. PGO(Profile-Guided Optimization)로 프로덕션 프로파일을 기반으로 컴파일러가 최적화합니다.

## 수업 목표

- pprof로 CPU와 메모리 프로파일링을 이해합니다.
- escape analysis 결과를 해석하는 방법을 이해합니다.
- sync.Pool로 객체 재사용을 구현할 수 있습니다.
- GC 튜닝과 trace 분석을 이해합니다.
- PGO(Profile-Guided Optimization)를 이해합니다.

## pprof 프로파일링

```go
package main

import (
    "fmt"
    "os"
    "runtime/pprof"
)

// CPU 프로파일링
func startCPUProfile() func() {
    f, _ := os.Create("cpu.prof")
    pprof.StartCPUProfile(f)
    return func() {
        pprof.StopCPUProfile()
        f.Close()
    }
}

// 메모리 프로파일링
func writeMemProfile() {
    f, _ := os.Create("mem.prof")
    defer f.Close()
    runtime.GC()  // GC 전에 정확한 통계를 위해
    pprof.WriteHeapProfile(f)
}

func expensiveFunction() {
    result := 0
    for i := 0; i < 1000000; i++ {
        result += i * i
    }
    fmt.Println(result)
}

func main() {
    stop := startCPUProfile()
    defer stop()

    expensiveFunction()
    writeMemProfile()

    // 분석: go tool pprof cpu.prof
    // 명령어: top, top10, list expensiveFunction, web
}
```

`pprof.StartCPUProfile(f)`는 100Hz(100ms마다)로 CPU 샘플링을 시작합니다. 각 샘플에서 현재 실행 중인 함수의 호출 스택을 기록합니다. `pprof.WriteHeapProfile(f)`는 현재 힙 메모리 할당 상태를 기록합니다. 분석은 `go tool pprof cpu.prof` 명령어로 수행합니다: `top`으로 가장 많은 CPU를 사용하는 함수, `list funcName`으로 함수별 라인 단위 분석, `web`으로 그래프 시각화를 할 수 있습니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: sync.Pool은 어떤 상황에서 사용하나요?</strong></summary>

sync.Pool은 **자주 할당되고 해제되는 객체**를 재사용하여 GC 부담을 줄입니다. 적합한 사용 사례: (1) JSON 인코딩/디코딩용 버퍼 (2) 정규식 매칭 결과 (3) 연결 풀이 아닌 임시 객체. 주의: (1) Pool의 객체는 언제든지 GC에 의해 해제될 수 있습니다(영구 저장소가 아님). (2) Pool은 고루틴 간 객체 공유가 아닌, 각 고루틴이 임시로 사용할 객체를 제공하는 용도입니다. (3) 프로파일링으로 확인된 메모리 할당 병목이 있을 때만 사용하세요. 잘못 사용하면 오히려 성능이 나빠질 수 있습니다.
</details>

<details>
<summary><strong>Q: PGO(Profile-Guided Optimization)는 어떻게 작동하나요?</strong></summary>

PGO는 Go 1.20+에 도입된 최적화 기술입니다. 프로덕션 환경에서 수집된 프로파일 데이터를 기반으로 컴파일러가 더 나은 최적화를 수행합니다. 과정: (1) 프로덕션에서 `pprof`로 CPU 프로파일 수집 (`default.pgo` 파일명 권장). (2) 다음 빌드에서 `-pgo=auto` 플래그로 PGO 활성화. (3) 컴파일러가 프로파일 데이터를 분석하여 인라인(inline), 함수 배치(function layout), 분기 예측(branch prediction) 등을 최적화. 실제 애플리케이션에서 3~10%의 성능 향상을 보여줍니다. PGO는 특히 핫 경로(hot path)가 명확한 애플리케이션(HTTP 서버, 데이터 처리 파이프라인)에서 효과적입니다.
</details>

<details>
<summary><strong>Q: runtime/trace는 pprof와 어떤 차이가 있나요?</strong></summary>

pprof는 **샘플링 기반 통계**를 제공합니다(어디에 시간을 쓰는지). `runtime/trace`는 **이벤트 기반 상세 추적**을 제공합니다(시간에 따라 무엇이 발생하는지). trace를 사용하면: (1) 고루틴 생성/블로킹/종료의 전체 타임라인을 볼 수 있습니다. (2) GC 이벤트와 STW 시간을 정확히 측정할 수 있습니다. (3) 네트워크 폴링, 시스템 콜, 채널 연산의 상세를 분석할 수 있습니다. 사용법: `trace.Start(f)` → `trace.Stop()` → `go tool trace trace.out`. trace는 pprof보다 더 자세하지만 오버헤드도 더 큽니다. 문제 진단의 첫 단계는 pprof, 상세 분석이 필요하면 trace를 사용합니다.
</details>

<details>
<summary><strong>Q: 고루틴 누수(goroutine leak)는 어떻게 탐지하나요?</strong></summary>

고루틴 누수는 종료되지 않고 계속 대기하는 고루틴입니다. 탐지 방법: (1) `runtime.NumGoroutine()`으로 현재 고루틴 수를 모니터링합니다 (정상보다 많으면 누수). (2) `net/http/pprof` 핸들러에 등록된 `/debug/pprof/goroutine`에서 각 고루틴의 스택 트레이스를 확인합니다. (3) `go tool pprof http://localhost:6060/debug/pprof/goroutine`으로 상세 분석. (4) `goleak` 라이브러리로 테스트에서 누수를 자동 탐지. 흔한 원인: 채널에서 영원히 대기, 뮤텍스 미해제, time.Sleep 종료 안 됨. 해결: context 취소 전파, select에 타임아웃 추가, defer로 리소스 정리 보장.
</details>

<details>
<summary><strong>Q: 성능 최적화의 일반적인 접근법은 무엇인가요?</strong></summary>

Go 성능 최적화의 단계: (1) **측정 먼저** — 프로파일링 없이 최적화하지 마세요. pprof로 병목을 식별합니다. (2) **의심하지 말고 증명하라** — 벤치마크로 가설을 검증합니다. (3) **알고리즘 최적화 우선** — O(n²) → O(n log n)이 가장 큰 효과를 냅니다. (4) **메모리 할당 최소화** — 힙 할당을 줄이면 GC 부담이 감소합니다. (5) **동시성 활용** — I/O 바운드 작업은 고루틴으로 병렬 처리. (6) **가독성 유지** — 최적화로 인해 코드가 너무 복잡해지면 안 됩니다. 핵심: "Premature optimization is the root of all evil" (Knuth). 먼저 동작하게 만들고, 측정하고, 필요한 곳만 최적화하세요.
</details>

## 요약

| 개념 | 설명 | 도구 |
|------|------|------|
| **CPU 프로파일링** | 100Hz 샘플링 | runtime/pprof, go tool pprof |
| **메모리 프로파일링** | 힙 할당 분석 | WriteHeapProfile, alloc_space |
| **벤치마크** | 성능 측정 | go test -bench -benchmem |
| **sync.Pool** | 객체 재사용 | GC 부담 감소 |
| **Escape Analysis** | 스택/힙 결정 | -gcflags='-m' |
| **trace** | 이벤트 기반 추적 | runtime/trace, go tool trace |
| **PGO** | 프로파일 기반 최적화 | -pgo=auto, default.pgo |

## 다음 수업

다음 글에서는 Go 네트워킹 심화 — net/http, TCP 서버, HTTP 미들웨어를 배웁니다.
