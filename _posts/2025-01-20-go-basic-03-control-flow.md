---
layout: post
title: "Go 제어문 — if/for/switch와 조건문, Go에서 유일한 반복문인 for의 다양한 형태"
description: "Go의 제어문과 반복문을 컴파일러와 어셈블리 레벨에서 학습합니다. if 조건문은 조건식을 평가하고 참일 때만 분기 블록을 실행합니다. Go의 독특한 문법은 괄호 없이 중괄호를 필수로 사용합니다. if 조건절 내에서 statement-if 선언을 하면 변수의 스코프가 if-else 블록으로 제한됩니다. Go의 유일한 반복문 for는 전통적인 for, while-style for, infinite for(true), range for의 네 가지 형태를 모두 지원합니다. range for는 배열/슬라이스/맵/문자열/채널을 순회하면서 인덱스와 값을 분해합니다. switch는 break 없이 자동 탈출하고, case에 표현식을 쓰거나 복수 조건을 콤마로 나열할 수 있는 유연성을 제공합니다."
date: 2025-01-20 10:00:00 +0900
category: go
tags: [go, golang, control-flow, if, for, switch, range, break, continue]
level: basic
---

Go의 제어문은 if/for/switch 세 가지 키워드로 구성됩니다. 반복문은 for가 유일합니다.

> **핵심 정리** · Go의 if는 조건에 괄호가 없고 중괄호가 필수입니다. 조건절에서 짧은 변수 선언이 가능하며, 그 변수의 스코프는 if-else 블록으로 제한됩니다. for는 Go의 유일한 반복문으로, C의 for / while / infinite / range의 네 가지 형태를 모두 for 하나로 표현합니다. switch는 break가 없어도 자동 탈출하며, case에 여러 조건을 콤마로 나열할 수 있습니다.


## 수업 목표

- if 조건문의 Go에 고유한 문법을 이해합니다.
- 조건절 내 변수 선언(statement-if)의 스코프를 이해합니다.
- for의 네 가지 형태를 이해합니다.
- range for의 순회 방식을 이해합니다.
- switch의 break 없는 자동 탈출을 이해합니다.

## if 조건문

```go
package main

import (
    "fmt"
    "math/rand"
)

func main() {
    score := 85

    // 기본 if
    if score >= 90 {
        fmt.Println("A")
    } else if score >= 80 {
        fmt.Println("B")    // 출력
    } else if score >= 70 {
        fmt.Println("C")
    } else {
        fmt.Println("F")
    }

    // statement-if: 조건절에 변수 선언
    if n := rand.Intn(100); n >= 50 {
        fmt.Printf("%d는 50 이상입니다\n", n)
    } else {
        fmt.Printf("%d는 50 미만입니다\n", n)
    }
    // 여기서 n은 접근 불가 (스코프 종료)

    // 조건 검사의 다양한 방식
    if age := 18; age >= 20 {
        fmt.Println("성인")
    } else {
        fmt.Println("미성년자")
    }
}
```

Go의 `if`는 C/Java와 달리 조건식에 **괄호`()`가 필요 없습니다**. 중괄호`{}`는 **필수**이며, 같은 줄에 열어야 합니다. 조건식이 간단한 표현식이므로 괄호가 없어도 파서가 모호하지 않게 해석합니다. `if n := rand.Intn(100); n >= 50`은 **statement-if**라고 부르며, 조건절 앞에 짧은 변수 선언을 넣을 수 있습니다. 이렇게 선언된 변수 `n`의 스코프는 if-else 블록 전체로 제한되므로, 블록 밖에서 실수로 `n`을 사용하는 것을 방지합니다. 이 패턴은 에러 처리에서 자주 사용됩니다.

### for 반복문

```go
package main

import "fmt"

func main() {
    // 1. 전통적인 for (C 스타일)
    for i := 0; i < 5; i++ {
        fmt.Print(i, " ")   // 0 1 2 3 4
    }
    fmt.Println()

    // 2. while 스타일 (조건만)
    count := 0
    for count < 3 {
        fmt.Print(count, " ")  // 0 1 2
        count++
    }
    fmt.Println()

    // 3. 무한 루프
    sum := 0
    for {
        sum++
        if sum > 5 {
            break
        }
    }
    fmt.Println("sum:", sum)   // 6

    // 4. range for (컬렉션 순회)
    nums := []int{10, 20, 30, 40, 50}
    for index, value := range nums {
        fmt.Printf("nums[%d] = %d\n", index, value)
    }

    // range for — 값만 필요할 때
    for _, value := range nums {
        fmt.Print(value, " ")   // 10 20 30 40 50
    }
    fmt.Println()

    // range for — 인덱스만 필요할 때
    for index := range nums {
        fmt.Print(index, " ")   // 0 1 2 3 4
    }
    fmt.Println()

    // break와 continue
    for i := 0; i < 10; i++ {
        if i%2 == 0 {
            continue    // 짝수는 건너뜀
        }
        if i > 7 {
            break       // 7 초과면 종료
        }
        fmt.Print(i, " ")   // 1 3 5 7
    }
    fmt.Println()
}
```

`for i := 0; i < 5; i++`는 C와 동일한 구문으로, 초기화식 → 조건식 → 증감식의 순서로 실행됩니다. `for count < 3`은 C의 `while(count < 3)`과 동일하며 조건식만 있는 형태입니다. `for { ... }`는 무한 루프로, `break`나 `return`으로 탈출할 때까지 계속 실행됩니다. `range for`는 **Go의 핵심 기능**으로, 배열, 슬라이스, 맵, 문자열, 채널 등 다양한 컬렉션을 순회할 수 있습니다. `for index, value := range nums`에서 `index`는 0부터 시작하는 정수 인덱스, `value`는 해당 인덱스의 요소 값입니다. `_`(blank identifier)는 값을 무시할 때 사용합니다.

### switch 문

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // 기본 switch
    score := 85
    switch {
    case score >= 90:
        fmt.Println("A")
    case score >= 80:
        fmt.Println("B")    // 출력 (85 >= 80)
    case score >= 70:
        fmt.Println("C")
    default:
        fmt.Println("F")
    }

    // 값 기반 switch
    day := time.Now().Weekday()
    switch day {
    case time.Saturday, time.Sunday:
        fmt.Println("주말입니다")
    case time.Monday:
        fmt.Println("월요일입니다")
    default:
        fmt.Println("평일입니다")
    }

    // switch도 statement-if 가능
    switch n := 7; n % 2 {
    case 0:
        fmt.Println("짝수")
    case 1:
        fmt.Println("홀수")
    }

    // type switch (인터페이스 타입 검사)
    var value interface{} = "Hello"
    switch v := value.(type) {
    case string:
        fmt.Println("문자열:", v)        // 출력
    case int:
        fmt.Println("정수:", v)
    case bool:
        fmt.Println("불리언:", v)
    default:
        fmt.Println("알 수 없는 타입")
    }

    // fallthrough (다음 case 강제 실행)
    i := 1
    switch i {
    case 1:
        fmt.Println("하나")    // 출력
        fallthrough
    case 2:
        fmt.Println("둘")      // 출력 (fallthrough로 실행)
    case 3:
        fmt.Println("셋")
    }
}
```

Go의 `switch`는 C와 달리 각 `case`가 끝나면 **자동으로 break**됩니다. C처럼 다음 case로 넘어가지 않으므로, break를 일일이 적을 필요가 없습니다. `switch { case score >= 90: ... }`처럼 조건식을 직접 사용할 수 있어 if-else 체인을 대체합니다. `case time.Saturday, time.Sunday:`는 여러 조건을 콤마로 나열하여 **OR 조건**을 표현합니다. `switch n := 7; n % 2`는 조건절에 변수 선언을 포함한 형태입니다. `value.(type)`은 **type switch**로, 인터페이스 값의 실제 타입에 따라 분기합니다. `fallthrough`는 명시적으로 다음 case를 실행하도록 지시합니다. 단, `fallthrough`는 조건을 다시 평가하지 않고 다음 case의 본문을 무조건 실행합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Go에서 while과 do-while이 없는 이유는 무엇인가요?</strong></summary>

Go는 **단순함(simplicity)**을 핵심 설계 원칙으로 삼습니다. while과 do-while은 for의 변형에 불과하므로, for 하나로 모든 반복 패턴을 표현할 수 있습니다. `for condition { body }`는 while과 동일하고, `for { body; if !condition { break } }`는 do-while 패턴을 구현할 수 있습니다. 하나의 키워드로 4가지 형태(for, while, infinite, range)를 표현함으로써 언어 명세가 단순해지고, 개발자는 한 가지 키워드만 익히면 됩니다.
</details>

<details>
<summary><strong>Q: for range의 내부 동작은 어떻게 되나요?</strong></summary>

`for i, v := range slice`는 컴파일러에 의해 다음과 같은 C 유사 코드로 변환됩니다: `for i := 0; i < len(slice); i++ { v = slice[i]; ... }`. range는 순회를 시작하기 전에 컬렉션의 길이를 한 번만 평가(copy)합니다. 따라서 range 중에 슬라이스에 요소를 추가해도 순회 범위는 변하지 않습니다. 맵의 range 순서는 **무작위**입니다(Go 1.0부터 의도적으로 랜덤화됨). `for i, v := range str`에서 문자열을 순회하면 바이트 단위가 아니라 **rune(유니코드 코드 포인트)** 단위로 순회합니다. 채널의 range는 채널이 닫힐(close) 때까지 값을 계속 수신합니다.
</details>

<details>
<summary><strong>Q: switch에서 fallthrough를 사용해야 할 때는 언제인가요?</strong></summary>

`fallthrough`는 Go에서 드물게 사용됩니다. 주로 숫자 범위가 겹치는 경우나 일부 case에서만 공통 로직이 필요한 경우에 사용합니다. 예를 들어 요금 계산에서 `case 1: base = 1000; fallthrough; case 2: total = base + 500` 같은 패턴입니다. 하지만 대부분의 경우 fallthrough보다는 case 조건을 명시적으로 나열하거나(`,`로 구분), 공통 코드를 함수로 추출하는 것이 더 명확합니다. Go 커뮤니티에서는 fallthrough 사용을 권장하지 않습니다.
</details>

<details>
<summary><strong>Q: if 조건절에서 선언한 변수의 스코프는 어떻게 되나요?</strong></summary>

`if n := rand.Intn(100); n >= 50`에서 선언된 `n`의 스코프는 **if-else 블록 전체**입니다. `else` 블록에서도 `n`에 접근할 수 있지만, if-else 블록 밖에서는 접근할 수 없습니다. 이는 변수의 의도치 않은 사용을 방지하는 Go의 안전한 설계입니다. C++의 if-init 문법(C++17)과 유사하지만, Go가 8년 먼저 도입했습니다.
</details>

<details>
<summary><strong>Q: break에 레이블을 붙일 수 있나요?</strong></summary>

네, Go는 레이블과 함께 `break`와 `continue`를 사용할 수 있습니다. 이는 중첩 루프에서 바깥 루프를 한 번에 탈출할 때 유용합니다: `outer: for i := 0; i < 3; i++ { for j := 0; j < 3; j++ { if i*j > 2 { break outer } } }`. `break outer`는 `outer` 레이블이 붙은 바깥 for 루프를 완전히 종료합니다. `continue outer`는 바깥 루프의 다음 반복으로 이동합니다. 레이블은 함수 스코프 내에서 고유해야 하며, 함수 호출 간 경계를 넘을 수 없습니다.
</details>


## 요약

| 개념 | 설명 | 문법 형태 |
|------|------|----------|
| **if** | 조건부 분기 | `if condition { } else if { } else { }` |
| **statement-if** | 조건절 내 변수 선언 | `if n := f(); n > 0 { }` |
| **for (전통적)** | 초기화/조건/증감 | `for i := 0; i < n; i++ { }` |
| **for (while)** | 조건만 | `for condition { }` |
| **for (infinite)** | 무한 루프 | `for { }` |
| **for (range)** | 컬렉션 순회 | `for i, v := range slice { }` |
| **switch** | 다중 분기 | `switch { case x > 0: ... }` |
| **break/continue** | 루프 제어 | `break`, `continue`, `break outer` |


## 다음 수업

다음 글에서는 Go의 함수 — func 키워드, 다중 반환값, defer, 에러 처리 패턴을 배웁니다.
