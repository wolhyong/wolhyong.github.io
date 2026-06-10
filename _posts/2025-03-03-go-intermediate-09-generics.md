---
layout: post
title: "Go 제네릭 — 1.18 타입 파라미터, 타입 제약과 인터페이스 제약, 제네릭 함수와 타입"
description: "Go 1.18에 도입된 제네릭(Generics) 프로그래밍을 컴파일러 레벨에서 학습합니다. func F[T any](args T) T 구문으로 타입 파라미터를 선언하고 호출 시 구체적 타입으로 인스턴스화되는 방식을 다룹니다. 타입 제약(Type Constraint)은 인터페이스를 기반으로 하며 ~int | ~string 같은 타입 집합(type set)을 지정할 수 있습니다. 제네릭 함수는 컴파일 타임에 구체적 타입별로 별도 함수를 생성하는 monomorphization(단형화)을 사용합니다. 이 방식은 제로 런타임 오버헤드(zero-cost abstraction)를 가능하게 합니다. 제네릭 타입 struct와 interface에 타입 파라미터를 사용하는 방법(type Stack[T any] struct)을 살펴봅니다. comparable 제약은 맵의 키나 비교 연산이 필요한 제네릭 함수를 작성할 때 사용합니다. Go 팀은 단순성과 명확성을 위해 메서드의 타입 파라미터를 허용하지 않는 결정을 내렸고, 그 대안을 다룹니다."
date: 2025-03-03 10:00:00 +0900
category: go
tags: [go, golang, generics, type-parameters, type-constraints, monomorphization, go1.18]
level: intermediate
---

Go 제네릭은 타입 파라미터를 사용하여 함수와 타입을 여러 구체적 타입에 대해 일반화합니다.

> **핵심 정리** · `func F[T any](p T) T`로 타입 파라미터를 선언합니다. 타입 제약은 `interface { ~int | ~float64 }` 형태로 지정합니다. 컴파일러는 monomorphization으로 각 구체적 타입별로 별도의 함수를 생성하여 런타임 오버헤드가 없습니다. Go의 제네릭은 단순성과 컴파일 속도를 위해 메서드의 타입 파라미터를 지원하지 않습니다.

## 수업 목표

- 타입 파라미터 선언 문법을 이해합니다.
- 타입 제약 조건과 타입 집합을 이해합니다.
- Monomorphization의 동작 원리를 이해합니다.
- 제네릭 타입과 인터페이스를 정의하는 방법을 이해합니다.
- comparable 제약의 용도를 이해합니다.

## 제네릭 함수

```go
package main

import (
    "fmt"
    "golang.org/x/exp/constraints"
)

// 기본 제네릭 함수
func Min[T constraints.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

// 여러 타입 파라미터
func Map[T, U any](items []T, fn func(T) U) []U {
    result := make([]U, len(items))
    for i, item := range items {
        result[i] = fn(item)
    }
    return result
}

// 타입 추론으로 호출 가능
func main() {
    // 명시적 타입 인자
    fmt.Println(Min[int](3, 5))        // 3
    fmt.Println(Min[string]("a", "b")) // "a"

    // 타입 추론 (생략 가능)
    fmt.Println(Min(3.14, 2.71))       // 2.71 (float64 추론)
    fmt.Println(Min(10, 20))           // 10 (int 추론)

    // Map 함수
    nums := []int{1, 2, 3, 4, 5}
    doubled := Map(nums, func(n int) int {
        return n * 2
    })
    fmt.Println(doubled)  // [2 4 6 8 10]

    // 타입 변환
    strs := Map(nums, func(n int) string {
        return fmt.Sprintf("n=%d", n)
    })
    fmt.Println(strs)     // [n=1 n=2 n=3 n=4 n=5]
}
```

`func Min[T constraints.Ordered](a, b T) T`에서 `[T constraints.Ordered]`는 **타입 파라미터**입니다. `T`는 타입 변수이고, `constraints.Ordered`는 `T`가 만족해야 하는 **타입 제약**(`Ordered`는 `<`, `<=`, `>`, `>=` 연산을 지원하는 타입의 집합)입니다. 호출 시 `Min(3, 5)`처럼 타입 인자를 생략하면 컴파일러가 인자의 타입으로 `T`를 추론합니다. `Map[T, U any]`처럼 여러 개의 타입 파라미터를 가질 수 있습니다.

### 타입 제약 (Type Constraints)

```go
package main

import "fmt"

// 타입 집합 (Type Set)을 지정하는 인터페이스 제약
type Number interface {
    ~int | ~int32 | ~int64 | ~float32 | ~float64
}

// 기본 타입뿐만 아니라 별칭 타입도 허용 (~)
type Integer interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 | ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64
}

// 메서드 + 타입 집합 혼합 제약
type Stringer interface {
    ~string
    String() string  // 둘 다 만족해야 함
}

// 합계 함수
func Sum[T Number](values []T) T {
    var sum T
    for _, v := range values {
        sum += v
    }
    return sum
}

// 별칭 타입도 ~로 허용
type MyInt int

func main() {
    fmt.Println(Sum([]int{1, 2, 3, 4, 5}))          // 15
    fmt.Println(Sum([]float64{1.1, 2.2, 3.3}))      // 6.6

    // ~int로 MyInt도 허용
    fmt.Println(Sum([]MyInt{10, 20, 30}))            // 60

    // 명시적 타입 인자 필요 시
    fmt.Println(Sum[int32]([]int32{1, 2, 3}))        // 6
}

// comparable 제약 — ==, != 연산 지원
func Index[T comparable](slice []T, target T) int {
    for i, v := range slice {
        if v == target {  // comparable이 없으면 컴파일 오류
            return i
        }
    }
    return -1
}
```

타입 제약은 **인터페이스 타입**으로 정의됩니다. Go 1.18+에서 인터페이스는 메서드 집합뿐만 아니라 **타입 집합(type set)**도 지정할 수 있습니다: `type Number interface { ~int | ~float64 }`. `~`는 해당 타입의 **underlying type**(기반 타입)이 일치하는 모든 타입을 허용합니다. 예를 들어 `~int`는 `int` 자체뿐만 아니라 `type MyInt int`로 정의된 `MyInt`도 포함합니다. `comparable`은 Go에 내장된 제약으로, `==`와 `!=` 연산을 지원하는 타입을 나타냅니다. 맵의 키, 슬라이스 검색 등에 사용됩니다.

### 제네릭 타입

```go
package main

import "fmt"

// 제네릭 스택
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T  // 제로값 생성
        return zero, false
    }
    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item, true
}

// 제네릭 트리
type Node[T comparable] struct {
    Value    T
    Children []*Node[T]
}

func (n *Node[T]) AddChild(child *Node[T]) {
    n.Children = append(n.Children, child)
}

func (n *Node[T]) Find(value T) *Node[T] {
    if n.Value == value {
        return n
    }
    for _, child := range n.Children {
        if found := child.Find(value); found != nil {
            return found
        }
    }
    return nil
}

// 제네릭 맵 (직접 정의)
type HashMap[K comparable, V any] map[K]V

func NewHashMap[K comparable, V any]() HashMap[K, V] {
    return make(HashMap[K, V])
}

func main() {
    // 스택 사용
    intStack := Stack[int]{}
    intStack.Push(10)
    intStack.Push(20)
    val, ok := intStack.Pop()
    fmt.Println(val, ok)  // 20 true

    // 트리 사용
    root := &Node[int]{Value: 1}
    child := &Node[int]{Value: 2}
    root.AddChild(child)
    found := root.Find(2)
    fmt.Println(found != nil)  // true

    // 제네릭 맵
    m := NewHashMap[string, int]()
    m["key"] = 42
    fmt.Println(m["key"])  // 42

    // 제로값 생성
    var zero T  // T의 제로값
    var zeroPtr = new(T)  // T의 포인터
}
```

`type Stack[T any] struct { items []T }`는 **제네릭 타입**을 선언합니다. `T`는 타입 파라미터로, 실제 사용 시점에 구체적 타입으로 대체됩니다. 메서드 정의 시에도 `func (s *Stack[T]) Push(item T)`처럼 타입 파라미터를 명시해야 합니다. `var zero T`는 `T` 타입의 제로값을 생성합니다(함수 내에서만 가능).

### Monomorphization

```go
// 컴파일러는 아래 제네릭 함수에 대해
func Min[T constraints.Ordered](a, b T) T {
    if a < b { return a }
    return b
}

// 호출 지점에서 각 타입별로 별도 함수를 생성합니다
// (컴파일러의 내부 동작, 개발자가 직접 작성할 필요 없음)
//
// func Min_int(a, b int) int {
//     if a < b { return a }
//     return b
// }
//
// func Min_float64(a, b float64) float64 {
//     if a < b { return a }
//     return b
// }
//
// func Min_string(a, b string) string {
//     if a < b { return a }
//     return b
// }

// 호출
// x := Min(3, 5)         → Min_int(3, 5)
// y := Min(3.14, 2.71)   → Min_float64(3.14, 2.71)
// z := Min("a", "b")     → Min_string("a", "b")
```

Go의 제네릭은 **Monomorphization**(단형화) 방식으로 구현됩니다. 제네릭 함수의 각 타입 인자 조합에 대해 컴파일러가 별도의 구체적 함수를 생성합니다. 이는 런타임에 타입 정보를 유지할 필요가 없으므로 **zero-cost abstraction**을 제공합니다. Java의 Type Erasure(런타임 타입 정보 소실)나 C++의 Template(컴파일 시간 증가)과 달리, Go의 monomorphization은 빠른 컴파일 시간과 제로 런타임 오버헤드를 균형 있게 제공합니다. 단점은 코드 블로트(code bloat)로, 바이너리 크기가 증가할 수 있습니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Go 제네릭과 Java 제네릭의 차이는 무엇인가요?</strong></summary>

가장 큰 차이는 **구현 방식**입니다. Go는 **Monomorphization**으로 컴파일 타임에 각 타입별로 별도 함수를 생성하여 런타임 오버헤드가 없습니다. Java는 **Type Erasure**로 컴파일 타임에만 타입 정보를 사용하고, 런타임에는 `Object`로 변환되어 박싱/언박싱 오버헤드가 발생합니다. Go의 제네릭은 기본 타입(int, float64 등)도 오버헤드 없이 사용할 수 있습니다. 또한 Go의 타입 제약은 인터페이스를 기반으로 하여 더 유연하고 타입 안전합니다.
</details>

<details>
<summary><strong>Q: 제네릭 함수와 인터페이스 파라미터 중 어떤 것을 선택해야 하나요?</strong></summary>

제네릭은 **컴파일 타임**에 타입이 결정되고 monomorphization으로 각 타입별 코드가 생성됩니다. 인터페이스는 **런타임**에 동적 디스패치(iface 호출)가 발생합니다. 선택 기준: (1) 같은 타입의 값이 여러 개 필요하거나(예: `T a, b T`), 타입 간 관계가 중요하면 제네릭. (2) 단일 값만 필요하고 다양한 타입을 받아야 하면 인터페이스. (3) 성능이 중요하고 여러 타입을 처리해야 하면 제네릭(추가 간접 참조 없음). Go의 관례는 **인터페이스로 시작하고, 제네릭이 명확히 더 나을 때만 제네릭을 사용**하는 것입니다.
</details>

<details>
<summary><strong>Q: 제네릭 타입의 메서드에 추가 타입 파라미터를 가질 수 있나요?</strong></summary>

아니요, Go 제네릭은 **메서드에 추가 타입 파라미터를 허용하지 않습니다**. `func (s *Stack[T]) Convert[U any]() U`는 컴파일 오류입니다. 이유는 Go의 단순성(simplicity) 철학에 있습니다. 메서드 타입 파라미터는 컴파일러 구현과 타입 추론을 크게 복잡하게 만듭니다. 대신 **일반 함수를 사용**하여 타입 파라미터를 추가할 수 있습니다: `func ConvertStack[T, U any](s *Stack[T], fn func(T) U) *Stack[U]`.
</details>

<details>
<summary><strong>Q: ~int와 int의 차이는 무엇인가요?</strong></summary>

`~int`는 **underlying type**(기반 타입)이 `int`인 모든 타입을 허용합니다. 즉, `int` 자체와 `type MyInt int` 같은 별칭 타입도 포함됩니다. `int`만 쓰면 정확히 `int` 타입만 허용하고 `MyInt`는 허용하지 않습니다. 일반적으로 제네릭 제약에서는 `~`를 붙이는 것이 더 유연합니다. 예를 들어 `Sum[T ~int | ~float64]`는 `int`, `float64`, 그리고 이들의 별칭 타입 모두를 지원합니다. `~`는 Go 1.18에서 타입 집합과 함께 도입된 새로운 문법입니다.
</details>

<details>
<summary><strong>Q: 제네릭과 빈 인터페이스(any) 중 어떤 것이 더 효율적인가요?</strong></summary>

제네릭이 훨씬 효율적입니다. `any`(`interface{}`)는 값을 박싱하여 힙에 할당하고, iface/eface 구조체를 통해 간접 참조(indirection)가 발생합니다. 제네릭은 monomorphization으로 각 타입별로 직접 코드가 생성되므로 박싱, 간접 참조, GC 부담이 없습니다. 예를 들어 `func Process[T any](v T)`는 `T`가 `int`일 때 정수를 직접 스택에 전달하지만, `func Process(v any)`는 정수를 힙에 박싱하고 eface 포인터를 전달합니다. 성능이 중요한 라이브러리 코드에서는 제네릭을 우선 고려하세요.
</details>

## 요약

| 개념 | 설명 | 컴파일/런타임 동작 |
|------|------|------------------|
| **타입 파라미터** | `func F[T any](p T) T` | 호출 시 구체적 타입으로 대체 |
| **타입 제약** | 타입 파라미터가 만족해야 하는 조건 | 인터페이스 기반 타입 집합 |
| **~ (tilde)** | underlying type 포함 | type MyInt도 허용 |
| **Monomorphization** | 타입별 코드 생성 | 런타임 오버헤드 없음 (zero-cost) |
| **comparable** | ==, != 연산 지원 | 맵 키, 검색 함수에 사용 |
| **제네릭 타입** | `type Stack[T any] struct` | 타입 파라미터를 가진 구조체/인터페이스 |

## 다음 수업

다음 글에서는 고급 인터페이스 패턴 — iface 내부 구조, 덕 타이핑 심화, 의존성 주입을 배웁니다.
