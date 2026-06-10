---
layout: post
title: "Go 채널과 select — 채널의 hchan 내부 구조, 버퍼링/언버퍼링, select 다중 채널, context 패키지"
description: "Go의 채널과 select 문을 런타임 레벨에서 학습합니다. chan T는 runtime.hchan 구조체(buf unsafe.Pointer, elemsize uint16, closed uint32, sendx/recvx uint32, sendq/recvq waitq)로 구현되어 원형 큐(ring buffer)에 데이터를 저장하고 고루틴 대기열을 관리합니다. ch <- v(송신)와 <-ch(수신)은 각각 runtime.chansend()와 runtime.chanrecv()를 호출해 hchan의 sendq/recvq에 대기 중인 고루틴을 깨우거나 직접 데이터를 전달합니다. 언버퍼 채널(unbuffered)은 고루틴 간 동기화에 사용되고, 버퍼 채널(buffered)은 비동기 통신을 제공합니다. select 문은 여러 case를 scase 배열로 변환해 다중 채널을 동시에 대기합니다. context 패키지는 Done() 채널로 취소 신호를 전파하고 WithTimeout/WithDeadline으로 시간 제한을 설정하는 구조를 제공합니다."
date: 2025-03-24 10:00:00 +0900
category: go
tags: [go, golang, channels, select, hchan, context, csp, concurrency]
level: intermediate
---

채널은 고루틴 간 통신(Communicating Sequential Processes, CSP)의 핵심 메커니즘입니다.

> **핵심 정리** · `chan T`는 `runtime.hchan{buf, sendx, recvx, sendq, recvq, closed}` 구조체입니다. `ch <- v`는 chansend(), `<-ch`는 chanrecv()를 호출합니다. 언버퍼 채널은 동기화, 버퍼 채널은 비동기 통신에 사용됩니다. select는 여러 채널을 동시에 대기합니다. context.Done()으로 취소 신호를 전파합니다.

## 수업 목표

- 채널의 hchan 내부 구조를 이해합니다.
- 버퍼 채널과 언버퍼 채널의 차이를 이해합니다.
- select 문의 다중 채널 대기 방식을 이해합니다.
- context 패키지의 취소와 타임아웃을 이해합니다.
- 채널 닫기(close)와 range 순회를 이해합니다.

## 채널 기초

```go
package main

import "fmt"

func main() {
    // 언버퍼 채널 (동기)
    ch := make(chan int)

    // 버퍼 채널 (비동기)
    buffered := make(chan string, 3)

    // 송신 고루틴
    go func() {
        buffered <- "Go"
        buffered <- "Channel"
        buffered <- "Hello"
        close(buffered)  // 채널 닫기
    }()

    // 수신 (range로 채널이 닫힐 때까지 읽기)
    for msg := range buffered {
        fmt.Println(msg)
    }

    // 버퍼 크기 확인
    fmt.Println("버퍼 크기:", cap(buffered))  // 3
    fmt.Println("현재 길이:", len(buffered))  // 0 (모두 읽음)
}
```

`make(chan int)`는 **언버퍼 채널**(버퍼 크기 0)을 생성합니다. 송신은 수신자가 준비될 때까지 블로킹됩니다. `make(chan string, 3)`은 **버퍼 채널**로, 버퍼가 가득 찰 때까지 송신이 블로킹되지 않습니다. `close(ch)`는 채널을 닫아 더 이상 송신이 없음을 알립니다. 닫힌 채널에서 수신은 버퍼에 남은 값을 계속 읽고, 버퍼가 비면 제로값을 반환합니다. `for msg := range ch`는 채널이 닫힐 때까지 값을 계속 읽습니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: select 문은 여러 채널을 어떻게 동시에 대기하나요?</strong></summary>

select 문은 컴파일러에 의해 여러 `scase` 구조체를 가진 select 배열로 변환됩니다. 런타임은 모든 case의 채널을 폴링(polling)합니다: (1) **빠른 경로**: 하나라도 준비된 case가 있으면 무작위로 하나 선택하여 실행. (2) **느린 경로**: 모두 준비되지 않았으면 현재 고루틴을 모든 채널의 대기열에 등록(sudog 구조체)하고 블로킹. (3) **깨어남**: 어떤 채널이 준비되면 고루틴이 깨어나고, 다른 채널의 대기열에서 제거됩니다. `default` case는 모든 채널이 준비되지 않았을 때 즉시 실행됩니다. select는 case 순서를 shuffle하여 채널 간 공정성(fairness)을 보장합니다.
</details>

<details>
<summary><strong>Q: 버퍼 채널의 크기는 어떻게 선택해야 하나요?</strong></summary>

버퍼 채널의 크기는 다음과 같이 선택합니다: (1) **0 (언버퍼)** — 고루틴 간 동기화가 필요할 때. 이벤트 신호, 작업 완료 통지. (2) **1** — 하나의 값을 비동기로 보내고 즉시 계속 실행해야 할 때. 핑퐁 통신. (3) **작은 값(2~100)** — 생산자-소비자 패턴에서 속도 차이를 완충할 때. (4) **큰 값(100+)** — 대량의 데이터를 배치 처리할 때. 버퍼가 너무 크면 메모리 낭비, 너무 작으면 블로킹이 증가합니다. Go의 관례는 \"언버퍼부터 시작하고, 프로파일링 후 필요하면 버퍼를 추가\"입니다.
</details>

<details>
<summary><strong>Q: context 패키지는 내부적으로 어떻게 동작하나요?</strong></summary>

context.Context는 인터페이스로, `Done() <-chan struct{}` 메서드가 핵심입니다. `context.WithCancel(parent)`은 `cancelCtx` 구조체를 생성하고, 취소 시 `Done()` 채널을 닫아(close channel) 모든 수신자에게 취소를 알립니다. `context.WithTimeout(parent, d)`는 `timerCtx`를 생성하고, 시간이 지나면 자동으로 취소를 호출합니다. 컨텍스트는 트리 구조로, 부모가 취소되면 모든 자식도 취소됩니다(취소 전파). HTTP 서버, 데이터베이스 쿼리 등 시간 제한이 필요한 모든 작업에서 컨텍스트를 첫 번째 파라미터로 전달하는 것이 Go의 관례입니다.
</details>

<details>
<summary><strong>Q: 채널 송신/수신 시 고루틴 블로킹은 어떻게 처리되나요?</strong></summary>

채널에서 블로킹된 고루틴은 `sudog`(sleep until goroutine) 구조체로 `sendq` 또는 `recvq` 대기열에 등록됩니다. 이 구조체는 블로킹된 고루틴의 포인터와 송신/수신할 값의 주소를 저장합니다. 이후 상대방 고루틴이 도착하면: (1) `<sudog.elem>`에서 직접 데이터를 복사 (고루틴 스택 간 직접 복사) (2) 대기열에서 제거 (3) `goready()`로 고루틴을 실행 가능 상태로 전환. 이 과정에서 락-프리(lock-free)에 가까운 효율적인 동기화가 이루어집니다. 채널 연산은 뮤텍스보다 가볍습니다.
</details>

<details>
<summary><strong>Q: close(ch)를 호출한 채널에서 수신하면 어떻게 되나요?</strong></summary>

닫힌 채널에서 수신(`<-ch`)은 즉시 제로값을 반환합니다. `v, ok := <-ch`에서 `ok`는 `false`입니다. 닫힌 채널로 송신(`ch <- v`)은 panic을 발생시킵니다. 닫힌 채널을 다시 닫아도 panic입니다. range로 채널을 순회하면 채널이 닫힐 때까지 값을 읽고 종료됩니다. 채널을 닫는 것은 송신자(sender)의 책임이며, 수신자는 절대 채널을 닫아서는 안 됩니다. nil 채널에서 송신/수신은 영원히 블로킹됩니다.
</details>

## 요약

| 개념 | 설명 | 내부 구조 |
|------|------|----------|
| **chan T** | 고루틴 간 통신 | hchan{buf, sendx, recvx, sendq, recvq, closed} |
| **언버퍼 채널** | 동기화 통신 | 송신 = 수신이 준비될 때까지 블로킹 |
| **버퍼 채널** | 비동기 통신 | 원형 큐(ring buffer)로 데이터 저장 |
| **select** | 다중 채널 대기 | scase 배열, 무작위 선택, sudog 대기열 |
| **context** | 취소/타임아웃 전파 | Done() 채널 close, 트리 구조 전파 |
| **close()** | 채널 닫기 | closed=1, range로 소진 가능 |

## 다음 수업

다음 글에서는 Go 파일 입출력 — io.Reader/Writer 인터페이스, os.File, bufio, encoding 패키지를 배웁니다.
