---
layout: post
title: "Go 함수 — func 키워드, 다중 반환값, defer 지연 실행, 에러 처리 패턴과 일급 함수"
description: "Go의 함수 시스템을 컴파일러와 런타임 레벨에서 학습합니다. func 키워드로 함수를 정의하며 func name(params) returnType 시그니처로 타입 안전성을 보장합니다. Go의 다중 반환값은 여러 값을 스택이나 레지스터에 연속 배치해 반환합니다. defer는 함수 종료까지 실행을 지연시키고 LIFO 스택으로 역순으로 실행됩니다. 이 패턴은 file.Close, mutex.Unlock 같은 리소스 정리에 자주 쓰입니다. (result, error)와 if err != nil 관용구는 Go의 명시적 에러 처리 철학을 구현합니다. 함수는 일급 객체로 변수에 할당되며 다른 함수의 인자나 반환값으로 사용할 수 있습니다. 함수 타입은 인터페이스와 결합해 추상화를 제공합니다."
date: 2025-01-27 10:00:00 +0900
category: go
tags: [go, golang, functions, defer, multiple-return, error-handling, closure, first-class]
level: basic
---

Go의 함수는 `func` 키워드로 정의되며, 다중 반환값과 defer 같은 독특한 기능을 제공합니다.

> **핵심 정리** · Go 함수는 `func name(params) returnType { body }` 형태입니다. 다중 반환값으로 (값, 에러) 쌍을 반환하는 것이 표준 패턴입니다. `defer`는 함수 종료 시까지 실행을 지연시키며, LIFO 스택 순서로 역순 실행됩니다. 함수는 일급 객체로, 변수에 할당하거나 다른 함수의 인자로 전달할 수 있습니다.


## 수업 목표

- func 키워드와 함수 시그니처를 이해합니다.
- 다중 반환값의 동작 방식을 이해합니다.
- defer의 LIFO 실행 순서를 이해합니다.
- Go의 에러 처리 패턴을 이해합니다.
- 일급 함수와 클로저의 개념을 이해합니다.

## 함수 정의와 호출

```go
package main

import (
    "errors"
    "fmt"
)

// 기본 함수
func add(a int, b int) int {
    return a + b
}

// 같은 타입의 연속된 파라미터는 타입 생략 가능
func multiply(a, b int) int {
    return a * b
}

// 다중 반환값
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("0으로 나눌 수 없습니다")
    }
    return a / b, nil
}

// named return values (이름 있는 반환값)
func split(sum int) (x, y int) {
    x = sum * 4 / 9
    y = sum - x
    return  // naked return (반환값 명시 생략)
}

// 가변 인자 (variadic)
func sum(numbers ...int) int {
    total := 0
    for _, n := range numbers {
        total += n
    }
    return total
}

func main() {
    fmt.Println(add(3, 5))           // 8
    fmt.Println(multiply(4, 7))      // 28

    result, err := divide(10, 3)
    if err != nil {
        fmt.Println("에러:", err)
    } else {
        fmt.Println("10/3 =", result)  // 3
    }

    _, err = divide(10, 0)
    if err != nil {
        fmt.Println("에러:", err)       // 에러: 0으로 나눌 수 없습니다
    }

    fmt.Println(split(17))           // (7, 10)
    fmt.Println(sum(1, 2, 3, 4, 5))  // 15
}
```

`func add(a int, b int) int`는 두 정수를 받아 정수를 반환하는 함수입니다. 같은 타입의 파라미터는 `func multiply(a, b int) int`처럼 타입을 한 번만 명시할 수 있습니다. `func divide(a, b int) (int, error)`는 **다중 반환값**으로, 정수 결과와 에러를 함께 반환합니다. Go에서 에러는 반환값의 일부이므로, 호출자는 항상 에러를 확인해야 합니다(`if err != nil`). `func split(sum int) (x, y int)`는 반환값에 이름(`x`, `y`)을 붙입니다. 이름 있는 반환값은 함수 시작 시 제로값으로 초기화되며, `return`만 적으면(naked return) 현재 값들을 자동으로 반환합니다. `func sum(numbers ...int) int`는 **가변 인자**로, 여러 개의 인자를 슬라이스로 받습니다.

### defer

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // 기본 defer — 함수 종료 직전 실행
    defer fmt.Println("첫 번째 defer")
    defer fmt.Println("두 번째 defer")
    defer fmt.Println("세 번째 defer")
    fmt.Println("함수 본문 실행")

    // 출력:
    // 함수 본문 실행
    // 세 번째 defer
    // 두 번째 defer
    // 첫 번째 defer

    // 파일 처리 예제
    file, err := os.Open("hello.go")
    if err != nil {
        fmt.Println("파일 열기 실패:", err)
        return
    }
    defer file.Close()  // 함수 종료 시 파일 자동 정리

    // mutex 예제
    // mu.Lock()
    // defer mu.Unlock()  // 함수 종료 시 자동 언락

    // defer의 인자 평가 시점
    x := 10
    defer fmt.Println("defer x:", x)  // 10 (defer 선언 시점의 x)
    x = 20
    fmt.Println("x:", x)              // 20
}
```

`defer`는 함수가 종료될 때까지 실행을 지연시키는 Go의 독특한 기능입니다. 여러 `defer`는 **LIFO(Last-In-First-Out)** 스택으로 관리되어, 마지막에 등록된 defer가 가장 먼저 실행됩니다. 위 예제에서 "세 번째 defer" → "두 번째 defer" → "첫 번째 defer" 순서로 출력됩니다. `defer file.Close()`는 파일 열기 직후 defer로 등록하여, 함수가 정상 종료되든 에러로 중단되든 항상 파일이 닫히도록 보장합니다. `defer`의 **인자는 defer 선언 시점에 평가**됩니다. 위 예제에서 `x`는 `defer` 등록 시점의 값인 `10`을 출력합니다. 함수 본문에서 `x`를 `20`으로 변경해도, `defer`는 이미 `10`을 캡처했으므로 영향을 받지 않습니다.

### 에러 처리

```go
package main

import (
    "fmt"
    "strconv"
)

// 커스텀 에러
type DivideError struct {
    Dividend int
    Divisor  int
}

func (e *DivideError) Error() string {
    return fmt.Sprintf("%d를 %d로 나눌 수 없습니다", e.Dividend, e.Divisor)
}

func safeDivide(a, b int) (int, error) {
    if b == 0 {
        return 0, &DivideError{Dividend: a, Divisor: b}
    }
    return a / b, nil
}

func parseAndDouble(s string) (int, error) {
    n, err := strconv.Atoi(s)
    if err != nil {
        return 0, fmt.Errorf("변환 실패: %w", err)  // 에러 래핑
    }
    return n * 2, nil
}

func main() {
    // 표준 에러 처리 패턴
    result, err := safeDivide(10, 0)
    if err != nil {
        fmt.Println("에러:", err)   // 에러: 10를 0로 나눌 수 없습니다
    } else {
        fmt.Println("결과:", result)
    }

    // 에러 타입 확인
    var de *DivideError
    if errors.As(err, &de) {
        fmt.Printf("DivideError: %d / %d\n", de.Dividend, de.Divisor)
    }

    // 에러 래핑 확인
    _, err = parseAndDouble("abc")
    if err != nil {
        fmt.Println(err)                     // 변환 실패: strconv.Atoi: parsing "abc": invalid syntax
        fmt.Println(errors.Unwrap(err))      // strconv.Atoi: parsing "abc": invalid syntax
    }
}
```

Go의 에러 처리 핵심은 **에러를 반환값으로 명시적으로 처리**한다는 점입니다. 예외(exception)를 던지지 않고, 함수가 에러를 반환하면 호출자가 직접 검사합니다. `if err != nil`이 Go 코드에서 가장 자주 등장하는 패턴입니다. 에러는 `Error() string` 메서드를 구현한 `error` 인터페이스입니다. `fmt.Errorf("... %w", err)`의 `%w`는 에러를 래핑(wrapping)하여, `errors.Unwrap()`이나 `errors.Is()`로 원본 에러를 추적할 수 있게 합니다. `errors.As()`는 에러 타입을 검사하여 구체적인 에러 타입으로 변환합니다. 이 패턴은 에러에 추가 컨텍스트를 붙이면서도 원본 에러 정보를 보존합니다.

### 일급 함수와 클로저

```go
package main

import "fmt"

// 함수 타입 정의
type Operation func(a, b int) int

// 함수를 인자로 받기
func compute(a, b int, op Operation) int {
    return op(a, b)
}

// 함수를 반환하는 함수 (클로저)
func makeMultiplier(factor int) func(int) int {
    return func(x int) int {
        return x * factor  // factor를 캡처 (클로저)
    }
}

func main() {
    // 함수를 변수에 할당
    add := func(a, b int) int {
        return a + b
    }
    fmt.Println(add(3, 4))  // 7

    // 함수를 인자로 전달
    result := compute(10, 5, func(a, b int) int {
        return a - b
    })
    fmt.Println(result)  // 5

    // 클로저 사용
    double := makeMultiplier(2)
    triple := makeMultiplier(3)

    fmt.Println(double(5))   // 10
    fmt.Println(triple(5))   // 15

    // 즉시 실행 함수 (IIFE)
    max := func(values ...int) int {
        m := values[0]
        for _, v := range values[1:] {
            if v > m {
                m = v
            }
        }
        return m
    }(3, 7, 1, 9, 4)
    fmt.Println(max)  // 9
}
```

Go의 함수는 **일급 객체(first-class citizen)**입니다. 함수를 변수에 할당하고, 다른 함수의 인자로 전달하며, 반환값으로 사용할 수 있습니다. `type Operation func(a, b int) int`는 함수 시그니처에 타입 별칭을 부여합니다. `compute` 함수는 `Operation` 타입의 함수를 인자로 받아 실행합니다. `makeMultiplier` 함수는 **클로저(closure)**를 반환합니다. 클로저는 자신이 정의된 환경의 변수(`factor`)를 캡처하여, 함수가 반환된 후에도 그 변수에 접근할 수 있습니다. `double(5)`는 `factor=2`가 캡처된 클로저를 통해 `5 * 2 = 10`을 계산합니다. 즉시 실행 함수(IIFE)는 함수를 정의하자마자 바로 호출하여 결과를 변수에 할당합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: defer와 finally의 차이는 무엇인가요?</strong></summary>

`defer`는 Java의 `finally`와 유사하지만 중요한 차이가 있습니다: (1) **실행 시점**: `finally`는 try 블록 직후 즉시 실행됩니다. `defer`는 함수 전체가 종료될 때 실행됩니다. (2) **순서**: `finally`는 단일 블록, `defer`는 LIFO 스택으로 여러 개를 등록할 수 있습니다. (3) **스코프**: `finally`는 try 블록에 종속되고, `defer`는 함수 스코프입니다. (4) **인자 평가**: `defer`의 인자는 선언 시점에 평가되고, `finally`의 변수는 실행 시점의 값을 참조합니다. (`*`는 `/**` 사이의 내용을 강조 표시한 것입니다.)
</details>

<details>
<summary><strong>Q: 다중 반환값은 내부적으로 어떻게 동작하나요?</strong></summary>

Go의 다중 반환값은 컴파일러가 여러 값을 연속된 메모리(스택 또는 레지스터)에 배치하여 구현합니다. 작은 값(정수, 포인터 등)은 레지스터를 통해 반환되고, 큰 값은 스택에 임시로 저장됩니다. 호출자는 반환값의 순서와 타입을 알고 있으므로, 각 값을 올바르게 읽어옵니다. C에서는 구조체를 반환하거나 포인터를 통해 여러 값을 반환해야 했지만, Go는 언어 레벨에서 다중 반환을 지원하여 더 안전하고 편리합니다. 이는 PHP의 `list()`나 Python의 튜플 반환과 유사합니다.
</details>

<details>
<summary><strong>Q: named return values를 사용해야 하나요?</strong></summary>

named return values는 함수 시그니처를 더 명확하게 하지만, 남용하면 가독성이 떨어질 수 있습니다. 주로 다음과 같은 경우에 사용하는 것이 좋습니다: (1) 반환값이 여러 개이고 각각의 의미를 명확히 하고 싶을 때 `func parse(input string) (value int, err error)` (2) 짧은 함수에서 naked return이 자연스러울 때. naked return은 함수가 짧을 때(10줄 이내)만 사용하는 것이 좋습니다. 긴 함수에서 naked return을 사용하면 반환값을 추적하기 어려워집니다. Go 커뮤니티의 관례는 "named returns는 문서화 목적으로 사용하되, naked return은 간단한 함수에서만 사용하라"입니다.
</details>

<details>
<summary><strong>Q: panic과 recover는 언제 사용하나요?</strong></summary>

`panic`과 `recover`는 예외적인 상황(예: 배열 범위 초과, nil 포인터 역참조)에서 사용됩니다. 일반적인 에러 처리에는 `(result, error)` 패턴을 사용하고, `panic`은 **프로그램을 계속 실행할 수 없는 치명적 상태**에서만 사용합니다. 예를 들어 설정 파일이 없어 프로그램이 정상 동작할 수 없는 경우 `panic`을 사용할 수 있습니다. `recover`는 `defer` 블록 안에서만 유효하며, panic을 잡아내어 프로그램을 종료시키지 않고 정상 상태로 복원합니다. 표준 라이브러리의 JSON 파서, HTTP 서버 등은 내부적으로 `recover`를 사용하여 개별 요청의 panic이 전체 서버를 중단시키지 않도록 합니다.
</details>

<details>
<summary><strong>Q: Go에서 함수 오버로딩이 없는 이유는 무엇인가요?</strong></summary>

Go는 **명시성(explicitness)**을 설계 원칙으로 삼아 함수 오버로딩을 지원하지 않습니다. 함수 오버로딩은 같은 이름의 함수가 다른 파라미터 타입에 따라 다르게 동작하게 하지만, 호출자가 어떤 함수가 실행될지 명확하지 않을 수 있습니다. Go는 대신 다음과 같은 대안을 제공합니다: (1) 가변 인자 `func sum(numbers ...int)`, (2) 인터페이스를 활용한 일반화 `func process(r io.Reader)`, (3) 제네릭(Go 1.18+) `func Max[T constraints.Ordered](a, b T) T`. 이 방식들은 오버로딩보다 더 명시적이고 타입 안전합니다.
</details>


## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **func** | 함수 정의 | `func name(params) returnType { }` |
| **다중 반환** | 여러 값 반환 | 연속된 메모리(스택/레지스터) 배치 |
| **defer** | 지연 실행 | LIFO 스택, 함수 종료 시 실행 |
| **에러 처리** | error 인터페이스 | `if err != nil` 패턴, `%w` 래핑 |
| **클로저** | 환경 캡처 함수 | 함수 + 캡처된 변수 묶음 |
| **가변 인자** | 여러 인자 처리 | 슬라이스로 변환되어 전달 |


## 다음 수업

다음 글에서는 Go의 배열과 슬라이스 — 고정 크기 배열과 동적 슬라이스의 메모리 구조, slice header를 배웁니다.
