---
layout: post
title: "Go 배열과 슬라이스 — 고정 크기 배열의 메모리 배치와 동적 슬라이스의 Slice Header 구조, append/slice/copy의 내부 동작"
description: "Go의 배열과 슬라이스 메모리 구조를 심층 학습합니다. 배열([n]T)는 고정 크기로 스택이나 힙에 연속 메모리 블록을 할당하며 인덱스로 직접 접근합니다. 슬라이스([]T)는 reflect.SliceHeader(Data unsafe.Pointer + Len int + Cap int)로 구현되어 배열 일부를 참조하는 동적 뷰를 제공합니다. make([]T, len, cap)는 runtime.makeslice()를 호출해 힙에 backing array를 할당하고 SliceHeader를 초기화합니다. append()는 cap이 충분하면 기존 배열에 요소를 추가하고, 부족하면 runtime.growslice()로 2배 또는 1.25배로 메모리를 재할당합니다. slice[i:j]는 새로운 배열을 만들지 않고 원본을 참조해 부분 문자열을 처리하므로 메모리 누수 위험이 있습니다. copy()는 memmove() 시스템 콜 수준에서 메모리 블록을 복사합니다. range for 슬라이스 순회는 컴파일러가 최적화합니다."
date: 2025-02-03 10:00:00 +0900
category: go
tags: [go, golang, arrays, slices, slice-header, append, make, copy, memory]
level: basic
---

Go의 배열은 고정 크기, 슬라이스는 동적 크기의 연속된 메모리 블록입니다.

> **핵심 정리** · 배열 `[n]T`는 고정 크기의 연속 메모리입니다. 슬라이스 `[]T`는 `SliceHeader{Data, Len, Cap}` 구조체로 backing array를 참조합니다. `append()`는 cap이 부족할 때 2배(또는 1.25배)로 메모리를 재할당합니다. 슬라이싱 `s[i:j]`는 새 배열을 만들지 않고 원본을 참조하므로 메모리 누수에 주의해야 합니다.


## 수업 목표

- 배열의 고정 크기와 메모리 배치를 이해합니다.
- 슬라이스의 SliceHeader 세 가지 필드를 이해합니다.
- append의 메모리 재할당 과정을 이해합니다.
- 슬라이싱의 참조 방식과 메모리 누수를 이해합니다.
- make와 copy의 내부 동작을 이해합니다.

## 배열 (Array)

```go
package main

import "fmt"

func main() {
    // 배열 선언
    var nums [5]int               // [0 0 0 0 0] — 제로값 초기화
    var names [3]string           // ["" "" ""]
    nums[0] = 10
    nums[1] = 20
    fmt.Println(nums)             // [10 20 0 0 0]

    // 배열 리터럴
    evens := [5]int{2, 4, 6, 8, 10}
    dots := [...]int{1, 2, 3, 4}  // 크기 추론 (4)

    // 2차원 배열
    matrix := [2][3]int{
        {1, 2, 3},
        {4, 5, 6},
    }

    // 배열 순회
    for i := 0; i < len(evens); i++ {
        fmt.Printf("evens[%d] = %d\n", i, evens[i])
    }

    // 배열은 값 타입 (복사됨)
    original := [3]int{1, 2, 3}
    copied := original
    copied[0] = 100
    fmt.Println(original)  // [1 2 3] — 영향 없음
    fmt.Println(copied)    // [100 2 3]

    fmt.Println(dots, matrix)
}
```

`var nums [5]int`는 5개의 정수를 저장하는 배열로, 모든 요소가 제로값(`0`)으로 초기화됩니다. `[...]int{1, 2, 3, 4}`는 배열 리터럴의 요소 개수로 배열 크기를 자동 추론합니다(4개). 배열의 크기는 **타입의 일부**입니다. `[3]int`와 `[4]int`는 서로 다른 타입입니다. 배열은 **값 타입(value type)**이므로 함수에 전달하거나 변수에 할당할 때 전체 배열이 복사됩니다. `original`을 `copied`에 할당하면 모든 요소가 복사되므로, `copied[0]`을 변경해도 `original`은 영향받지 않습니다. 이는 슬라이스와의 가장 큰 차이점입니다.

### 슬라이스 (Slice)

```go
package main

import "fmt"

func main() {
    // 1. 배열의 일부를 참조
    arr := [5]int{1, 2, 3, 4, 5}
    slice1 := arr[1:4]          // [2, 3, 4] — arr[1]부터 arr[3]까지

    // 2. make로 생성
    slice2 := make([]int, 3)     // len=3, cap=3 — [0, 0, 0]
    slice3 := make([]int, 3, 5)  // len=3, cap=5

    // 3. 슬라이스 리터럴
    slice4 := []int{10, 20, 30}  // len=3, cap=3

    // 4. nil 슬라이스
    var slice5 []int             // nil, len=0, cap=0
    empty := []int{}             // nil 아님, len=0, cap=0

    fmt.Println(slice1)          // [2 3 4]
    fmt.Println(slice2, slice3)  // [0 0 0] [0 0 0]
    fmt.Println(slice4)          // [10 20 30]
    fmt.Println(slice5 == nil)   // true
    fmt.Println(empty == nil)    // false

    // 슬라이스 길이와 용량
    s := []int{1, 2, 3, 4, 5}
    fmt.Println(len(s), cap(s))              // 5 5
    sub := s[1:3]
    fmt.Println(sub, len(sub), cap(sub))     // [2 3] 2 4 (cap=4: s[1]부터 끝까지)

    // 슬라이스 수정 (원본에 영향)
    sub[0] = 99
    fmt.Println(s)    // [1 99 3 4 5] — 원본도 변경됨
}
```

슬라이스는 **SliceHeader** 구조체로 표현됩니다: `Data`(backing array의 첫 요소를 가리키는 포인터), `Len`(슬라이스의 길이), `Cap`(backing array의 총 용량). `arr[1:4]`는 `arr` 배열의 인덱스 1부터 3까지(4는 포함되지 않음)를 참조하는 슬라이스를 생성합니다. `make([]int, 3, 5)`는 길이 3, 용량 5의 슬라이스를 생성합니다. 내부적으로 `runtime.makeslice()`가 호출되어 힙에 5개 요소 크기의 backing array를 할당하고, 앞의 3개를 0으로 초기화합니다. 슬라이스의 `sub := s[1:3]`에서 `len=2, cap=4`인 이유는 `s[1]`부터 backing array의 끝까지가 용량이기 때문입니다. 슬라이스는 **원본 데이터를 참조**하므로, `sub[0] = 99`는 원본 배열 `s`의 `s[1]`도 변경합니다.

### append 함수

```go
package main

import "fmt"

func main() {
    // 기본 append
    var nums []int
    nums = append(nums, 10)     // [10], len=1, cap=1
    nums = append(nums, 20)     // [10 20], len=2, cap=2
    nums = append(nums, 30)     // [10 20 30], len=3, cap=4

    // 여러 요소 추가
    nums = append(nums, 40, 50, 60)  // [10 20 30 40 50 60], len=6, cap=8

    // 다른 슬라이스 병합
    more := []int{70, 80}
    nums = append(nums, more...)      // ...으로 슬라이스 펼치기

    // append의 메모리 재할당 확인
    slice := make([]int, 0, 2)    // cap=2
    oldCap := cap(slice)
    for i := 0; i < 10; i++ {
        slice = append(slice, i)
        if cap(slice) != oldCap {
            fmt.Printf("i=%d: len=%d, cap=%d → %d (%.1fx 증가)\n",
                i, len(slice), oldCap, cap(slice),
                float64(cap(slice))/float64(oldCap))
            oldCap = cap(slice)
        }
    }
}
```

`append`는 슬라이스에 요소를 추가하는 Go의 내장 함수입니다. `nums = append(nums, 10)`은 세 단계로 동작합니다: (1) 현재 `nums`의 `cap`이 충분한지 확인합니다. (2) 충분하면 backing array에 요소를 쓰고 `Len`을 증가시킵니다. (3) 부족하면 `runtime.growslice()`를 호출하여 더 큰 backing array를 할당하고 기존 요소를 복사한 후 새 요소를 추가합니다. **메모리 재할당**은 작은 슬라이스(256개 미만)에서는 2배로, 큰 슬라이스에서는 1.25배로 증가합니다. 위 예제에서 `cap`이 `2 → 4 → 8`으로 2배씩 증가하는 것을 확인할 수 있습니다. `append`는 항상 반환값을 원래 변수에 재할당해야 합니다(`nums = append(nums, 10)`). 재할당하지 않으면 메모리 재할당 후 원본 변수가 오래된 backing array를 가리키게 됩니다.

### 슬라이싱과 copy

```go
package main

import "fmt"

func main() {
    // 슬라이싱 — 원본 참조 (메모리 효율적)
    data := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
    sub := data[2:5]         // [2 3 4], len=3, cap=8
    fmt.Println(sub)

    // 전체 슬라이싱
    all := data[:]           // 모든 요소
    first := data[:3]        // 처음 3개: [0 1 2]
    last := data[7:]         // 마지막 3개: [7 8 9]

    // copy — 독립적인 복사본 생성
    src := []int{1, 2, 3}
    dst := make([]int, len(src))
    n := copy(dst, src)      // 3 (복사된 요소 수)
    dst[0] = 100
    fmt.Println(src)         // [1 2 3] — 영향 없음
    fmt.Println(dst)         // [100 2 3]

    // 부분 복사
    partial := make([]int, 2)
    copy(partial, src[1:])   // src[1:] = [2, 3] → partial = [2, 3]
    fmt.Println(partial)

    // 메모리 누수 방지 — 독립 슬라이스 생성
    bigData := make([]int, 1000000)
    // 나쁜 예: sub = bigData[1000:1005] — bigData 전체가 GC되지 않음
    good := make([]int, 5)
    copy(good, bigData[1000:1005])  // 필요한 5개만 복사       // 이제 bigData는 GC 대상이 됨
}
```

`data[2:5]`는 `data`의 인덱스 2부터 4까지의 요소를 참조하는 슬라이스를 만듭니다. 이때 **새로운 배열이 생성되지 않고** 원본 `data`의 backing array 일부를 참조합니다. `data[:]`는 전체 배열을 참조합니다. `copy(dst, src)`는 `src`의 요소를 `dst`로 복사하여 **완전히 독립적인** 슬라이스를 만듭니다. 복사되는 요소 수는 `min(len(dst), len(src))`입니다. `copy`는 내부적으로 `runtime.memmove()`를 호출하여 CPU 레벨의 메모리 복사 명령어로 동작하므로 매우 빠릅니다. **메모리 누수 주의**: 큰 슬라이스의 일부만 참조하는 작은 슬라이스를 만들면, 작은 슬라이스가 GC를 방지하여 큰 backing array 전체가 메모리에 남습니다. 위 예제에서 `good`은 `copy`로 필요한 데이터만 새로 할당받았으므로, `bigData`는 GC 대상이 되어 메모리가 해제됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 배열 대신 항상 슬라이스를 사용해야 하나요?</strong></summary>

대부분의 경우 슬라이스를 사용하는 것이 Go의 관례입니다. 슬라이스는 더 유연하고(dynamic), 표준 라이브러리 함수들이 대부분 슬라이스를 인자로 받습니다. 배열을 사용하는 경우는 다음과 같습니다: (1) 크기가 정확히 정해져 있고 변경되지 않을 때 (예: `[16]byte` 해시 값) (2) 값 타입의 의미가 중요할 때(복사본이 필요할 때) (3) 제네릭 타입 파라미터에서 타입의 일부로 크기를 사용할 때. 함수의 파라미터는 거의 항상 `[]T`를 사용하고, `[n]T`는 특수한 경우에만 사용합니다.
</details>

<details>
<summary><strong>Q: append의 반환값을 항상 변수에 재할당해야 하는 이유는 무엇인가요?</strong></summary>

`append`가 메모리 재할당을 하면 새로운 backing array가 할당되고, 기존 변수는 여전히 **이전 backing array**를 가리킵니다. `nums = append(nums, 10)`처럼 반환값을 재할당해야 새 배열을 가리키게 됩니다. 재할당하지 않으면 데이터 불일치가 발생합니다: 이전 배열에는 요소가 추가되지 않고, 새 배열에만 추가됩니다. Go에서는 `append`의 반환값을 무시하는 것이 거의 항상 버그입니다. 정적 분석 도구 `go vet`도 이 패턴을 검사합니다.
</details>

<details>
<summary><strong>Q: make([]int, 3)과 make([]int, 0, 3)의 차이는 무엇인가요?</strong></summary>

`make([]int, 3)`은 길이 3, 용량 3인 슬라이스를 생성하고 모든 요소를 0으로 초기화합니다. 인덱스 `[0], [1], [2]`에 즉시 접근할 수 있습니다. `make([]int, 0, 3)`은 길이 0, 용량 3인 슬라이스를 생성합니다. 요소가 없으므로 인덱스 접근은 panic이 발생합니다. `append`로 요소를 추가해야 합니다. 후자는 `append`만 사용하는 패턴에 적합하며, 초기 용량을 미리 지정하여 메모리 재할당을 줄일 수 있습니다. 세 요소를 `append`하면: `make([]int, 0, 3)`은 재할당 없이 cap이 충분하지만, `make([]int, 3)`은 이미 길이가 3이므로 `append`는 인덱스 3부터 추가됩니다.
</details>

<details>
<summary><strong>Q: copy와 append 중 어떤 것을 사용해야 하나요?</strong></summary>

독립적인 복사본이 필요하면 `copy`를, 요소를 추가해야 하면 `append`를 사용합니다. `copy`는 기존 슬라이스에 데이터를 덮어쓰고, `append`는 요소를 추가합니다. 새로운 슬라이스를 만들 때는 보통 `make` + `copy` 조합을 사용합니다: `newSlice := make([]T, len(src)); copy(newSlice, src)`. `append`만으로 복사할 수도 있습니다: `newSlice := append([]T(nil), src...)`. 이 방식은 더 간결하지만, nil 슬라이스도 복사할 수 있어 상황에 따라 편리합니다. `append` 방식은 내부적으로 `growslice`를 호출할 수 있어 `make`+`copy`보다 약간 느릴 수 있지만, 대부분의 경우 차이는 무시할 만합니다.
</details>

<details>
<summary><strong>Q: 슬라이스의 메모리 누수를 방지하는 방법은 무엇인가요?</strong></summary>

가장 흔한 패턴은 큰 슬라이스에서 작은 부분만 슬라이싱할 때 발생합니다. `sub := bigData[1000:1005]`는 `bigData` 전체가 GC되지 못하게 합니다. 해결 방법: (1) `copy`로 필요한 데이터만 새 슬라이스에 복사: `good := make([]int, 5); copy(good, bigData[1000:1005])` (2) Go 1.22+에서 `slices.Clone()` 사용: `good := slices.Clone(bigData[1000:1005])` (3) 주기적으로 큰 슬라이스를 nil로 설정하여 GC를 유도. 특히 로그 데이터나 캐시 같이 장기간 유지되는 큰 데이터 구조를 다룰 때 주의해야 합니다.
</details>


## 요약

| 개념 | 설명 | 메모리 구조 |
|------|------|------------|
| **배열 [n]T** | 고정 크기 연속 메모리 | 스택 또는 힙에 연속 할당, 값 타입 |
| **슬라이스 []T** | 동적 길이 참조 타입 | SliceHeader{Data, Len, Cap} |
| **append** | 요소 추가 | cap 부족 시 2배/1.25배 재할당 (growslice) |
| **슬라이싱 [i:j]** | 부분 참조 | 새 배열 없이 원본 참조 |
| **copy** | 독립 복사 | runtime.memmove() 호출 |
| **make** | 슬라이스 생성 | runtime.makeslice() 호출 |


## 다음 수업

다음 글에서는 Go의 맵(map)과 구조체(struct) — 해시 테이블과 사용자 정의 타입을 배웁니다.
