---
layout: post
title: "Go 메서드와 인터페이스 — 리시버 기반 메서드, 덕 타이핑 인터페이스, 빈 인터페이스와 타입 단언"
description: "Go의 메서드와 인터페이스 시스템을 컴파일러와 런타임 레벨에서 학습합니다. func 키워드와 리시버(receiver)는 타입에 메서드를 연결합니다. 값 리시버(func (t Type) Method())는 복사본을 수정하고, 포인터 리시버(func (t *Type) Method())는 원본을 수정합니다. 값 리시버는 포인터와 값 모두 호출 가능하지만 포인터 리시버는 값 호출 시 자동 역참조됩니다. 인터페이스는 runtime.iface 구조체(tab *itab + data unsafe.Pointer)로 구현되어 메서드 테이블(itab)과 데이터를 저장합니다. 덕 타이핑(duck typing)은 명시적 implements 선언 없이 메서드 집합으로 타입 적합성을 검사합니다. 빈 인터페이스(interface{})는 모든 타입을 담는 any 타입 별칭(Go 1.18+)으로 동작하며 runtime.eface 구조체(type *_type + data unsafe.Pointer)로 구현됩니다. 타입 단언(type assertion) x.(T)는 인터페이스 값에서 구체적 타입을 추출하고, 콤마-ok 패턴(value, ok := x.(T))은 안전한 검사 방법입니다. 타입 스위치(type switch)와 인터페이스는 의존성 주입(Dependency Injection) 패턴에도 활용됩니다."
date: 2025-02-17 10:00:00 +0900
category: go
tags: [go, golang, methods, interfaces, duck-typing, type-assertion, iface, eface, generics]
level: basic
---

Go의 메서드는 타입에 동작을 연결하고, 인터페이스는 메서드 집합으로 추상화를 제공합니다.

> **핵심 정리** · 메서드는 `func (r Type) Method() { }` 형태로 타입에 함수를 연결합니다. 포인터 리시버는 원본을 수정하고, 값 리시버는 복사본으로 동작합니다. 인터페이스는 `runtime.iface{tab *itab, data unsafe.Pointer}` 구조체로 구현됩니다. 명시적 implements 없이 메서드 집합만으로 타입이 인터페이스를 만족하는지 컴파일 타임에 검사하는 덕 타이핑(duck typing)을 사용합니다.


## 수업 목표

- 값 리시버와 포인터 리시버의 차이를 이해합니다.
- 인터페이스의 내부 구조(iface)를 이해합니다.
- 덕 타이핑의 동작 방식을 이해합니다.
- 빈 인터페이스(any)의 용도를 이해합니다.
- 타입 단언과 타입 스위치를 이해합니다.

## 메서드 (Methods)

```go
package main

import (
    "fmt"
    "math"
)

// 기본 타입에 메서드 정의
type Rectangle struct {
    Width  float64
    Height float64
}

// 값 리시버 — 복사본으로 동작 (읽기 전용)
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// 값 리시버로 호출해도 원본 변경 불가
func (r Rectangle) ScaleValue(factor float64) {
    r.Width *= factor   // 복사본만 변경
    r.Height *= factor
}

// 포인터 리시버 — 원본을 수정
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor    // 원본 변경
    r.Height *= factor
}

// 포인터 리시버 — 큰 구조체 복사 방지
func (r *Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

// int의 별칭 타입에도 메서드 가능
type MyInt int

func (m MyInt) Double() MyInt {
    return m * 2
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}

    // 값 리시버 호출
    fmt.Println("면적:", rect.Area())         // 50

    // 값 리시버로 호출 — 원본 변경 안 됨
    rect.ScaleValue(2)
    fmt.Println("ScaleValue 후:", rect)       // {10 5} — 변경 없음

    // 포인터 리시버로 호출 — 원본 변경
    rect.Scale(2)
    fmt.Println("Scale 후:", rect)            // {20 10} — 변경됨

    // MyInt 메서드
    n := MyInt(21)
    fmt.Println("Double:", n.Double())        // 42
}
```

`func (r Rectangle) Area() float64`에서 `(r Rectangle)`이 **리시버**입니다. 메서드는 일반 함수 앞에 리시버 파라미터를 추가한 형태입니다. **값 리시버**(`r Rectangle`)는 구조체의 복사본으로 메서드를 호출하므로, 원본을 수정할 수 없습니다. **포인터 리시버**(`r *Rectangle`)는 원본의 포인터를 받아 직접 수정합니다. 포인터 리시버를 사용하는 이유는 (1) 원본을 변경해야 할 때 (2) 큰 구조체의 복사 비용을 피할 때 (3) 일관성(모든 메서드가 포인터 리시버를 사용할 때)입니다. Go는 값으로 호출해도 자동으로 주소를 취하거나, 포인터로 호출해도 자동으로 역참조합니다. `rect.Scale(2)`는 `(&rect).Scale(2)`로 자동 변환됩니다.

### 인터페이스 (Interfaces)

```go
package main

import "fmt"

// 인터페이스 정의 — 메서드 집합
type Shape interface {
    Area() float64
    Perimeter() float64
}

// 다른 인터페이스
type Stringer interface {
    String() string
}

// Circle 타입 — Shape 인터페이스를 암시적으로 구현
type Circle struct {
    Radius float64
}

// Circle이 Shape의 메서드를 모두 가지면 Shape 구현
func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

// Circle이 Stringer도 구현
func (c Circle) String() string {
    return fmt.Sprintf("Circle(r=%.2f)", c.Radius)
}

// 인터페이스를 파라미터로 사용
func printShapeInfo(s Shape) {
    fmt.Printf("면적: %.2f\n", s.Area())
    fmt.Printf("둘레: %.2f\n", s.Perimeter())
}

// 여러 인터페이스를 만족하는 타입
func printDescription(s fmt.Stringer) {
    fmt.Println(s.String())
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}
    circle := Circle{Radius: 7}

    // Rectangle도 Shape의 메서드를 가지고 있음
    printShapeInfo(rect)     // 면적: 50.00, 둘레: 30.00
    printShapeInfo(circle)   // 면적: 153.94, 둘레: 43.98

    // Stringer 인터페이스
    printDescription(circle) // Circle(r=7.00)

    // 인터페이스 변수
    var s Shape = rect
    fmt.Printf("s 타입: %T, 값: %.2f\n", s, s.Area())  // s 타입: main.Rectangle, 값: 50.00
}
```

`type Shape interface { Area() float64; Perimeter() float64 }`는 Shape 인터페이스를 정의합니다. 인터페이스는 **메서드 집합**으로, 구체적인 구현 없이 메서드 시그니처만 선언합니다. `Rectangle`과 `Circle`은 `Shape`의 모든 메서드를 가지고 있으므로, **명시적인 `implements` 선언 없이** 자동으로 `Shape` 인터페이스를 구현합니다. 이것이 Go의 **덕 타이핑(duck typing)**입니다. 인터페이스 변수 `var s Shape = rect`는 구체적 타입을 인터페이스 타입으로 업캐스트(upcast)합니다. 내부적으로 `s`는 `iface` 구조체로, `tab`(타입 메서드 테이블)과 `data`(실제 값 포인터)를 저장합니다.

### 빈 인터페이스와 타입 단언

```go
package main

import "fmt"

func main() {
    // 빈 인터페이스 (any) — 모든 타입을 담을 수 있음
    var any interface{}
    any = 42
    fmt.Println(any)        // 42
    any = "Hello"
    fmt.Println(any)        // Hello
    any = Rectangle{Width: 3, Height: 4}
    fmt.Println(any)        // {3 4}

    // any는 Go 1.18+에서 interface{}의 별칭
    var anything any = "Go 1.18"

    // 타입 단언 — 인터페이스에서 구체적 타입 추출
    value := any.(string)         // any가 string이면 반환, 아니면 panic
    fmt.Println(value)            // Hello

    // 안전한 타입 단언 (콤마-ok 패턴)
    if num, ok := anything.(int); ok {
        fmt.Println("정수:", num)
    } else {
        fmt.Println("정수가 아님")  // 출력
    }

    // 타입 스위치
    checkType(42)
    checkType("Hello")
    checkType(3.14)
    checkType(Rectangle{})
}

func checkType(v interface{}) {
    switch t := v.(type) {
    case int:
        fmt.Printf("int: %d\n", t)
    case string:
        fmt.Printf("string: %s\n", t)
    case float64:
        fmt.Printf("float64: %.2f\n", t)
    case Shape:
        fmt.Printf("Shape, 면적: %.2f\n", t.Area())
    default:
        fmt.Printf("알 수 없는 타입: %T\n", t)
    }
}
```

`interface{}`는 **빈 인터페이스**로, 메서드가 하나도 없는 인터페이스입니다. 모든 타입은 빈 인터페이스를 구현하므로, 어떤 값이든 담을 수 있습니다. Go 1.18부터는 `any`가 `interface{}`의 공식 별칭으로 추가되었습니다. 내부적으로 빈 인터페이스는 `runtime.eface` 구조체(`type *_type` + `data unsafe.Pointer`)로 구현됩니다. **타입 단언** `v.(T)`는 인터페이스 값 `v`에서 구체적 타입 `T`의 값을 추출합니다. 타입이 일치하지 않으면 panic이 발생하므로, **콤마-ok 패턴** `value, ok := v.(T)`로 안전하게 검사합니다. **타입 스위치** `switch t := v.(type)`는 인터페이스 값의 실제 타입에 따라 분기합니다.

### 인터페이스 활용 — 의존성 주입

```go
package main

import (
    "fmt"
    "strings"
)

// Logger 인터페이스 — 구체적 구현에 의존하지 않음
type Logger interface {
    Log(message string)
}

// ConsoleLogger — 실제 구현
type ConsoleLogger struct{}

func (l ConsoleLogger) Log(message string) {
    fmt.Println("[LOG]", message)
}

// PrefixLogger — 데코레이터 패턴
type PrefixLogger struct {
    Prefix string
    Logger  Logger
}

func (l PrefixLogger) Log(message string) {
    l.Logger.Log(l.Prefix + " " + message)
}

// UpperCaseLogger — 변환 데코레이터
type UpperCaseLogger struct {
    Logger Logger
}

func (l UpperCaseLogger) Log(message string) {
    l.Logger.Log(strings.ToUpper(message))
}

// Service — Logger 인터페이스에 의존
type Service struct {
    logger Logger
}

func NewService(logger Logger) *Service {
    return &Service{logger: logger}
}

func (s *Service) DoSomething() {
    s.logger.Log("작업 시작")
    s.logger.Log("작업 완료")
}

func main() {
    // 기본 로거
    console := ConsoleLogger{}
    service := NewService(console)
    service.DoSomething()
    // [LOG] 작업 시작
    // [LOG] 작업 완료

    // 데코레이터 체인
    prefixed := PrefixLogger{Prefix: "[INFO]", Logger: console}
    upper := UpperCaseLogger{Logger: prefixed}
    service2 := NewService(upper)
    service2.DoSomething()
    // [LOG] [INFO] 작업 시작 (UPPERCASE로 출력)
    // [LOG] [INFO] 작업 완료 (UPPERCASE로 출력)
}
```

인터페이스를 활용한 **의존성 주입(Dependency Injection)**은 Go에서 코드의 유연성과 테스트 용이성을 높이는 핵심 패턴입니다. `Service`는 구체적인 `ConsoleLogger`에 의존하지 않고 `Logger` 인터페이스에만 의존합니다. 따라서 로거 구현체를 쉽게 교체하거나 데코레이터 패턴으로 확장할 수 있습니다. 테스트 시에는 `MockLogger`를 주입하여 로그 출력을 검증할 수 있습니다. 이 패턴은 HTTP 핸들러, 데이터베이스 접근, 메시지 큐 등 모든 계층에서 사용됩니다. Go 표준 라이브러리의 `io.Reader`, `io.Writer`, `http.Handler` 등이 대표적인 예입니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 값 리시버와 포인터 리시버 중 어떤 것을 선택해야 하나요?</strong></summary>

Go의 공식 가이드라인: (1) 메서드가 리시버를 수정해야 하면 **포인터 리시버** (2) 큰 구조체(수십 바이트 이상)면 **포인터 리시버** (3) 일관성을 위해 같은 타입의 모든 메서드는 같은 리시버 타입을 사용 (4) 기본 타입(int, string 등), 슬라이스, 맵은 보통 값 리시버. 작은 구조체(4개 필드 이하)는 값 리시버가 더 효율적일 수 있습니다. 중요한 것은 **일관성**입니다. 같은 타입의 메서드가 값과 포인터 리시버를 혼용하면 혼란을 줄 수 있습니다.
</details>

<details>
<summary><strong>Q: 인터페이스의 내부 구조(iface)는 어떻게 되나요?</strong></summary>

인터페이스 값은 내부적으로 `runtime.iface` 구조체로 표현됩니다: `type iface struct { tab *itab; data unsafe.Pointer }`. `tab`은 `itab`(interface table) 구조체로, 인터페이스 타입 메타데이터와 구체적 타입의 메서드 주소를 담고 있습니다. `data`는 실제 값에 대한 포인터입니다. `itab`은 `(interface_type, concrete_type)` 쌍에 대해 한 번 생성되어 캐싱되므로, 반복적인 타입 단언이 효율적입니다. 빈 인터페이스는 `eface` 구조체(`type *_type`, `data unsafe.Pointer`)로 더 가볍습니다.
</details>

<details>
<summary><strong>Q: 인터페이스는 nil 체크를 어떻게 해야 하나요?</strong></summary>

인터페이스는 내부적으로 `(type, value)` 쌍으로, 인터페이스가 `nil`이려면 **둘 다 nil**이어야 합니다. `var s Shape = (*Rectangle)(nil)`은 `type`은 `*Rectangle`이고 `value`는 `nil`이므로, `s == nil`은 `false`입니다. 인터페이스의 nil을 올바르게 체크하려면 리플렉션이나 타입 단언을 사용해야 합니다: `reflect.ValueOf(s).IsNil()`. 또는 인터페이스에 nil 값을 할당하지 않도록 함수의 반환값을 명시적으로 `nil`로 반환하는 것이 좋습니다. 이 문제는 Go에서 가장 흔한 실수 중 하나입니다.
</details>

<details>
<summary><strong>Q: Go 1.18 제네릭과 인터페이스의 관계는 무엇인가요?</strong></summary>

Go 1.18+의 제네릭은 인터페이스를 **타입 제약(type constraint)**으로 사용합니다. `func Sum[T Number](values []T) T`에서 `Number`는 인터페이스입니다. 인터페이스는 이제 메서드뿐만 아니라 타입 집합(type set)도 지정할 수 있습니다: `type Number interface { ~int | ~float64 }`. `~`는 해당 타입의 별칭(underlying type)도 포함합니다. 제네릭은 컴파일 타임에 구체적 타입으로 인스턴스화(monomorphization)되고, 인터페이스는 런타임에 동적 디스패치를 사용합니다. 제네릭은 서로 다른 구체적 타입에 대해 컴파일 타임 타입 안전성을 제공하고, 인터페이스는 런타임 다형성을 제공합니다.
</details>

<details>
<summary><strong>Q: 인터페이스와 구체적 타입 중 어떤 것을 파라미터로 사용해야 하나요?</strong></summary>

가이드라인: **(1) 가능한 한 인터페이스를 받고, 구체적 타입을 반환하라** — "Be liberal in what you accept, conservative in what you produce". 함수가 입력으로 인터페이스를 받으면 다양한 구현체를 수용할 수 있습니다. 함수가 구체적 타입을 반환하면 호출자가 인터페이스로 변환할지 결정할 수 있습니다. (2) 함수가 값의 메서드만 필요하면 인터페이스를 사용하고, 필드에 접근해야 하면 구체적 타입을 사용합니다. (3) 불필요한 인터페이스는 오히려 추상화의 비용(간접 참조, 메모리 할당)을 증가시킵니다. **인터페이스가 필요할 때만 정의**하는 것이 Go의 철학입니다.
</details>


## 요약

| 개념 | 설명 | 내부 구조 |
|------|------|----------|
| **값 리시버** | 복사본으로 메서드 호출 | func (t Type) Method() |
| **포인터 리시버** | 원본 참조로 메서드 호출 | func (t *Type) Method() |
| **인터페이스** | 메서드 집합 추상화 | iface{tab *itab, data unsafe.Pointer} |
| **덕 타이핑** | 명시적 implements 없음 | 컴파일 타임 메서드 집합 검사 |
| **빈 인터페이스** | 모든 타입 허용 | eface{type *_type, data unsafe.Pointer} |
| **타입 단언** | 구체적 타입 추출 | v.(T) / value, ok := v.(T) |
| **타입 스위치** | 타입 기반 분기 | switch v := x.(type) |


## 다음 수업

다음 글에서는 Go의 포인터와 메모리 관리 — new/make의 차이, 스택과 힙 할당, GC의 동작 원리를 배웁니다.
