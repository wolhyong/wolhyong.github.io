---
layout: post
title: "Go 포인터와 메모리 관리 — &/* 연산자, new/make의 차이, 스택과 힙 할당, GC의 동작 원리"
description: "Go의 포인터와 메모리 관리 시스템을 컴파일러와 런타임 레벨에서 학습합니다. & 연산자는 변수의 메모리 주소를 반환하고 * 연산자는 포인터가 가리키는 값을 역참조하는 과정을 다룹니다. new(T)는 T 타입의 제로값 인스턴스를 힙에 할당하고 그 포인터(*T)를 반환하는 방식과 make()가 슬라이스/맵/채널의 내부 헤더를 초기화하고 값 자체를 반환하는 차이를 설명합니다. Go 컴파일러의 escape analysis는 변수의 수명(lifetime)을 분석하여 함수가 종료된 후에도 필요한 변수는 힙에 할당하고 그렇지 않으면 스택에 할당하는 과정을 다룹니다. Go GC의 동시적 Mark&Sweep(Concurrent Mark & Sweep) 알고리즘이 STW(Stop-The-World) 시간을 1ms 미만으로 유지하면서 힙 메모리를 관리하는 방식을 설명합니다. GODEBUG=gctrace=1 환경 변수로 GC 로그를 확인하고 GOGC 변수로 GC 빈도를 조정하는 튜닝 방법을 다룹니다."
date: 2025-02-24 10:00:00 +0900
category: go
tags: [go, golang, pointers, memory, escape-analysis, gc, stack, heap, allocation]
level: intermediate
---

Go의 포인터는 메모리 주소를 저장하는 값이고, 메모리 관리는 컴파일러와 GC가 함께 처리합니다.

> **핵심 정리** · `&`는 변수의 주소를, `*`는 포인터가 가리키는 값을 반환합니다. `new(T)`는 힙에 제로값 인스턴스를 할당하고 포인터를 반환합니다. Go 컴파일러는 escape analysis로 변수를 스택 또는 힙 중 효율적인 위치에 할당합니다. GC는 Concurrent Mark&Sweep으로 1ms 미만의 STW를 유지합니다.

## 수업 목표

- &와 * 연산자의 동작을 이해합니다.
- new와 make의 차이를 이해합니다.
- escape analysis의 동작 원리를 이해합니다.
- 스택과 힙 할당의 차이를 이해합니다.
- Go GC의 동작 방식과 튜닝 방법을 이해합니다.

## 포인터 기초

```go
package main

import "fmt"

func main() {
    x := 42

    // & 연산자 — 변수의 메모리 주소
    p := &x
    fmt.Printf("x의 값: %d\n", x)     // 42
    fmt.Printf("x의 주소: %p\n", p)   // 0xc000010090 (예시)

    // * 연산자 — 포인터가 가리키는 값 (역참조)
    fmt.Printf("p가 가리키는 값: %d\n", *p)  // 42

    // 포인터를 통한 값 변경
    *p = 100
    fmt.Printf("변경된 x: %d\n", x)   // 100

    // zero value: nil
    var nilPtr *int
    fmt.Println(nilPtr == nil)         // true
    // fmt.Println(*nilPtr)            // panic: nil 포인터 역참조
}
```

`&x`는 변수 `x`의 메모리 주소를 반환합니다. 이 주소는 `*int` 타입의 포인터 변수 `p`에 저장됩니다. `*p`는 포인터 `p`가 가리키는 메모리 위치의 값을 읽습니다(역참조). `*p = 100`은 포인터가 가리키는 메모리 위치에 직접 값을 씁니다. 포인터의 제로값은 `nil`이며, nil 포인터를 역참조하면 panic이 발생합니다. C와 달리 Go는 포인터 연산(pointer arithmetic)을 금지하므로, `p++` 같은 코드는 컴파일 오류입니다.

### new vs make

```go
package main

import (
    "fmt"
    "unsafe"
)

func main() {
    // new(T) — 제로값 할당, 포인터 반환
    p := new(int)         // *int, 값은 0
    fmt.Println(*p)       // 0
    *p = 42
    fmt.Println(*p)       // 42

    s := new(string)
    fmt.Println(*s == "") // true (제로값)

    st := new(struct{ X int; Y int })
    fmt.Println(st.X, st.Y) // 0 0

    // make(T, args) — 초기화된 값 반환 (슬라이스/맵/채널 전용)
    slice := make([]int, 3, 5)     // []int, len=3, cap=5
    m := make(map[string]int, 10)  // map[string]int
    ch := make(chan int, 5)        // chan int (버퍼 5)

    fmt.Println(len(slice), cap(slice)) // 3 5

    // new([]int)는 슬라이스 헤더의 포인터를 반환하지만
    // backing array가 없어서 사용 불가
    nilSlice := new([]int)
    fmt.Println(*nilSlice == nil) // true (backing array 없음)
}
```

`new(T)`는 T 타입의 **제로값 인스턴스를 힙에 할당**하고 `*T` 포인터를 반환합니다. `new(int)`는 `*int`를 반환하며, 이 포인터가 가리키는 값은 `0`입니다.

`make(T, args)`는 T 타입(**슬라이스, 맵, 채널만 가능**)의 **초기화된 값**을 반환합니다. `make([]int, 3, 5)`는 내부적으로 `runtime.makeslice()`를 호출하여 backing array를 할당하고 SliceHeader를 초기화한 후 `[]int` 값을 반환합니다.

| 특징 | `new(T)` | `make(T, args)` |
|------|----------|-----------------|
| 적용 타입 | 모든 타입 | slice, map, channel만 |
| 반환값 | `*T` (포인터) | `T` (초기화된 값) |
| 메모리 | 제로값 할당 | 구조체 초기화 + 내부 데이터 할당 |
| 예 | `p := new(int)` | `s := make([]int, 5)` |

### Escape Analysis

```go
package main

import "fmt"

// 스택 할당 — 변수가 함수 범위를 벗어나지 않음
func stackAlloc() int {
    x := 42
    return x  // x의 복사본이 반환됨, x는 스택에 안전
}

// 힙 할당 — 변수가 함수 밖으로 escape
func heapAlloc() *int {
    x := 42
    return &x  // x의 주소가 반환됨 → x는 힙으로 escape
}

// 구조체 escape
type User struct {
    Name string
    Age  int
}

func createUser(name string, age int) *User {
    u := User{Name: name, Age: age}  // u는 힙으로 escape
    return &u
}

func main() {
    a := stackAlloc()
    b := *heapAlloc()
    user := createUser("Alice", 30)

    fmt.Println(a, b, user.Name)

    // escape analysis 확인
    // go build -gcflags='-m' main.go
}
```

Escape analysis는 Go 컴파일러가 변수의 **수명(lifetime)**을 분석하여 스택과 힙 중 어디에 할당할지 결정하는 최적화입니다.

- **스택 할당**: 변수가 함수 내에서만 사용되고 함수 종료 후 참조되지 않으면 스택에 할당됩니다. 스택 할당은 함수 호출 시 push, 종료 시 pop으로 매우 빠릅니다(O(1)).
- **힙 할당**: 변수의 주소가 함수 밖으로 전달되거나(return &x), 외부에서 참조될 수 있으면(클로저, 인터페이스 변환) 힙으로 escape합니다. 힙 할당은 GC의 대상이 되어 더 느립니다.

`go build -gcflags='-m' main.go`로 escape analysis 결과를 확인할 수 있습니다. 출력에서 `moved to heap` 메시지가 힙 할당된 변수를 나타냅니다.

### GC (Garbage Collection)

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    // GC 통계 출력
    var stats runtime.MemStats

    // 강제 GC 실행
    runtime.GC()
    runtime.ReadMemStats(&stats)
    fmt.Printf("GC 실행 후: Alloc=%d MB, TotalAlloc=%d MB\n",
        stats.Alloc/1024/1024, stats.TotalAlloc/1024/1024)

    // 메모리 할당
    data := make([][]byte, 0, 100)
    for i := 0; i < 100; i++ {
        slice := make([]byte, 1024*1024)  // 1MB
        data = append(data, slice)

        if i%10 == 9 {
            runtime.GC()
            runtime.ReadMemStats(&stats)
            fmt.Printf("할당 %d: NumGC=%d, PauseTotal=%dμs\n",
                i+1, stats.NumGC, stats.PauseTotalNs/1000)
        }
    }

    // GOGC 설정 확인
    fmt.Println("GOGC:", runtime.GOGC())  // 기본 100

    // runtime.GC() — 명시적 GC 호출
    // debug.SetGCPercent(200)  // GC 빈도 낮춤 (메모리 2배 허용)
    // debug.SetGCPercent(-1)   // GC 비활성화 (권장하지 않음)

    // GODEBUG=gctrace=1 ./program  // GC 로그 출력
}
```

Go의 GC는 **Concurrent Mark & Sweep**(동시적 표시-쓸기) 알고리즘을 사용합니다.

1. **Mark Phase**: GC가 루트(스택, 전역 변수, 레지스터)에서 시작하여 도달 가능한(reachable) 모든 객체를 표시합니다. 대부분의 작업이 애플리케이션과 동시에(concurrently) 실행됩니다.
2. **Sweep Phase**: 표시되지 않은(unmarked) 객체의 메모리를 해제합니다. Sweep도 동시에 실행됩니다.
3. **STW (Stop-The-World)**: Mark 시작과 종료 시점에 짧은 STW가 발생합니다. Go 1.19+에서는 1ms 미만으로 유지됩니다.

`GOGC` 환경 변수(기본 100)는 마지막 GC 이후 힙이 몇 % 성장했을 때 다음 GC를 실행할지 결정합니다. `GOGC=200`은 GC 빈도를 절반으로 줄여 CPU 사용량은 줄지만 메모리 사용량은 증가합니다.

| 설정 | 효과 | 사용 사례 |
|------|------|----------|
| `GOGC=100` (기본) | CPU와 메모리 균형 | 일반적인 애플리케이션 |
| `GOGC=200` | GC 50% 감소, 메모리 2배 | CPU 민감 서비스 |
| `GOGC=off` | GC 비활성화 | 일회성 배치 작업 |
| `GODEBUG=gctrace=1` | GC 로그 출력 | GC 튜닝 분석 |

### 포인터와 슬라이스 함수 인자

```go
package main

import "fmt"

// 값 전달 — 복사본으로 동작
func updateValue(v int) {
    v = 100  // 복사본만 변경
}

// 포인터 전달 — 원본 수정
func updatePointer(p *int) {
    *p = 100  // 원본 변경
}

// 슬라이스 인자 — 헤더는 복사되지만 backing array는 공유
func appendSlice(s []int) {
    s = append(s, 100)  // 로컬 s의 헤더만 변경 (재할당 시)
    s[0] = 999          // backing array 공유 → 원본 영향
}

func main() {
    x := 10
    updateValue(x)
    fmt.Println("값 전달 후:", x)  // 10

    updatePointer(&x)
    fmt.Println("포인터 전달 후:", x)  // 100

    // 슬라이스
    nums := []int{1, 2, 3}
    appendSlice(nums)
    fmt.Println(nums)  // [999 2 3] (s[0] 변경 영향, append는 영향 없음)
}
```

Go에서 **모든 것은 값으로 전달**(pass by value)됩니다. 포인터도 값(주소)으로 전달됩니다. `updateValue(v int)`는 `v`의 복사본을 받으므로 원본에 영향을 줄 수 없습니다. `updatePointer(p *int)`는 포인터 값(주소)이 복사되지만, `*p = 100`으로 같은 메모리 위치를 수정하므로 원본이 변경됩니다.

슬라이스는 `SliceHeader{Data, Len, Cap}` 구조체가 값으로 전달됩니다. `s[0] = 999`는 공유된 backing array를 직접 수정하므로 원본에 영향을 줍니다. 하지만 `append(s, 100)`은 `s`의 로컬 복사본의 `Len`과 `Cap`만 변경하므로, 원본 슬라이스의 길이는 변하지 않습니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Go에서 포인터 연산이 금지된 이유는 무엇인가요?</strong></summary>

Go는 **메모리 안전성(memory safety)**을 위해 포인터 연산(pointer arithmetic)을 금지합니다. C에서 포인터 연산은 버퍼 오버플로우, 댕글링 포인터, 세그멘테이션 폴트 등 심각한 메모리 버그의 주요 원인이었습니다. Go의 `unsafe.Pointer`와 `uintptr`을 사용하면 `unsafe` 패키지로 포인터 연산이 가능하지만, 이는 신중하게 사용해야 합니다. Go의 디자인 철학은 \"안전한 기본값 + 명시적 unsafe 탈출구\"입니다.
</details>

<details>
<summary><strong>Q: interface{}에 값을 할당하면 항상 힙 할당이 발생하나요?</strong></summary>

네, 구체적 타입을 `interface{}`에 할당하면 **박싱(boxing)**이 발생하여 힙 할당이 일어납니다. `var v interface{} = 42`는 정수 `42`를 힙에 할당하고 `eface{type: *int, data: &42}` 구조체를 생성합니다. 이는 `reflect` 패키지나 `fmt.Printf("%v", x)` 등의 사용에서도 발생합니다. 성능이 중요한 코드에서는 불필요한 인터페이스 변환을 피하는 것이 좋습니다. Go 1.18+의 제네릭은 컴파일 타임에 구체적 타입으로 인스턴스화되므로 박싱이 발생하지 않습니다.
</details>

<details>
<summary><strong>Q: escape analysis 결과를 어떻게 확인하나요?</strong></summary>

`go build -gcflags='-m'` 플래그로 확인합니다. `-m` 레벨을 여러 번 사용하면 더 자세한 정보를 볼 수 있습니다: `-gcflags='-m -m -m'`. 출력 예: `./main.go:14:6: moved to heap: x`는 `x`가 힙으로 escape했음을 의미합니다. `./main.go:10:6: stackAlloc x does not escape`는 스택에 할당되었음을 의미합니다. 이 정보를 바탕으로 핫 경로(hot path)에서 힙 할당을 최소화하도록 코드를 최적화할 수 있습니다.
</details>

<details>
<summary><strong>Q: GC 튜닝은 언제 필요한가요?</strong></summary>

GC 튜닝은 다음과 같은 상황에서 필요합니다: (1) **GC CPU 오버헤드가 15% 이상일 때** — `GODEBUG=gctrace=1`로 GC CPU 사용량 확인 (2) **STW 시간이 10ms 이상일 때** — Go 1.19+에서는 드물지만, 힙이 매우 크면(수백 GB) 발생 가능 (3) **처리량(latency)이 민감한 서비스** — GC pause로 인한 지연 시간이 문제될 때. 튜닝 방법: `GOGC`를 높여 GC 빈도 감소, `runtime.GOMAXPROCS` 조정, 힙 할당을 줄이는 코드 최적화. 대부분의 Go 애플리케이션은 기본 설정으로 충분합니다.
</details>

<details>
<summary><strong>Q: 스택과 힙 중 어디에 할당되는지가 왜 중요한가요?</strong></summary>

**스택 할당**은 함수 호출 시 포인터 조정(SP 증가)만으로 할당되고, 함수 종료 시(SP 복원) 자동 해제되므로 거의 무료입니다. **힙 할당**은 GC의 관리 대상이 되어 추가 비용이 발생합니다: 할당 자체의 오버헤드 + GC의 Mark/Sweep 비용 + 메모리 단편화. 하지만 스택은 크기가 제한되어 있고(고루틴당 2KB~1GB), 큰 데이터나 함수를 escape하는 데이터는 힙에 할당되어야 합니다. Go의 escape analysis는 최적의 선택을 자동으로 찾아주므로, 개발자는 일반적으로 신경 쓸 필요가 없습니다. 단, 성능이 중요한 코드에서는 heap escape를 최소화하는 것이 좋습니다.
</details>

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **& 연산자** | 변수의 메모리 주소 | 포인터 타입 반환 |
| *** 연산자** | 포인터 역참조 | 메모리 주소의 값 읽기/쓰기 |
| **new(T)** | 제로값 힙 할당, 포인터 반환 | runtime.newobject() 호출 |
| **make(T)** | slice/map/channel 초기화 | runtime.makeslice/makemap/makechan |
| **Escape Analysis** | 컴파일 타임 할당 위치 결정 | 변수 수명 분석 → 스택/힙 선택 |
| **GC** | 동시적 Mark&Sweep | 1ms 미만 STW, GOGC로 빈도 조절 |

## 다음 수업

다음 글에서는 Go 제네릭 — 1.18에 도입된 타입 파라미터와 제약 조건을 배웁니다.
