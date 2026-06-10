---
layout: post
title: "Go 변수와 데이터 타입 — 정적 타이핑, 제로값, 타입 추론, int/string/bool/float의 메모리 구조"
description: "Go의 변수 시스템과 데이터 타입을 메모리 레벨에서 학습합니다. var 키워드와 := 짧은 선언은 각각 명시적 타입 선언과 타입 추론으로 동작합니다. Go의 정적 타이핑은 컴파일 타임에 모든 변수의 타입을 결정해 런타임 타입 오류를 줄입니다. int/int8/int16/int32/int64/uint/float32/float64는 고정 크기 메모리로 할당되며 C 타입과의 유사점을 설명합니다. string은 reflect.StringHeader(Data uintptr + Len int)로 표현되어 UTF-8 바이트 시퀀스를 저장하는 불변 타입입니다. bool이 1바이트만 차지하는 이유와 메모리 정렬을 설명합니다. const는 컴파일 타임에 리터럴로 치환되어 런타임 오버헤드가 없습니다. 제로값은 변수 선언 시 초기화 없이 int=0, string=\"\", bool=false, float=0.0으로 자동 설정되는 Go의 안전성 철학을 다룹니다."
date: 2025-01-13 10:00:00 +0900
category: go
tags: [go, golang, variables, data-types, static-typing, zero-value, constants, type-inference]
level: basic
---

Go는 정적 타입 언어로, 모든 변수는 컴파일 타임에 타입이 결정됩니다.

> **핵심 정리** · Go의 변수 선언은 `var name type`(명시적)과 `name := value`(타입 추론) 두 가지 방식이 있습니다. 모든 타입은 컴파일 타임에 고정된 메모리 크기를 가집니다(int=8바이트, float64=8바이트, bool=1바이트). 선언 후 초기화 없이도 제로값으로 자동 초기화됩니다. string은 reflect.StringHeader(Data + Len)로 관리되는 불변 바이트 시퀀스입니다.


## 수업 목표

- var와 := 선언 방식의 차이를 이해합니다.
- Go의 기본 데이터 타입과 메모리 크기를 이해합니다.
- 제로값(zero value)의 의미를 이해합니다.
- 상수의 컴파일 타임 치환을 이해합니다.
- 타입 변환(type conversion) 규칙을 이해합니다.

## 변수 선언 방식

```go
package main

import "fmt"

func main() {
    // 1. var 선언 (명시적 타입)
    var name string = "Go"
    var version = 1.22         // float64 (타입 추론)

    // 2. 타입 추론 (:=)
    language := "Golang"
    year := 2009
    rating := 9.5

    // 3. var 선언 + 초기화 생략 (제로값)
    var count int       // 0
    var message string  // ""
    var active bool     // false
    var price float64   // 0.0

    // 4. 다중 변수 선언
    var x, y int = 10, 20
    a, b := "hello", true

    // 5. var 블록 선언
    var (
        appName  string = "MyApp"
        maxUsers int    = 1000
        debug    bool   = false
    )

    fmt.Println(name, version, language, year, rating)
    fmt.Println(count, message, active, price)
    fmt.Println(x, y, a, b)
    fmt.Println(appName, maxUsers, debug)
}
```

`var name string = "Go"`는 `string` 타입의 변수를 선언하고 값을 할당합니다. `:=`는 짧은 선언(short declaration)으로, 변수 타입을 우변의 값으로부터 추론합니다. `var count int`처럼 초기값 없이 선언하면 **제로값(zero value)**이 자동 할당됩니다. 다중 선언 `var x, y int = 10, 20`은 같은 타입의 여러 변수를 한 줄에 선언합니다. `var` 블록은 관련 변수들을 그룹화하여 가독성을 높입니다. 함수 내에서 `:=`는 var보다 더 간결하지만, 패키지 레벨(전역) 변수는 `var` 키워드로만 선언할 수 있습니다.

### 기본 데이터 타입

```go
// 정수형 — 크기와 부호에 따라 세분화
var i int         // 64비트 시스템에서 8바이트 (플랫폼 의존)
var i8  int8      // 1바이트 (-128 ~ 127)
var i16 int16     // 2바이트 (-32768 ~ 32767)
var i32 int32     // 4바이트 (-21억 ~ 21억)
var i64 int64     // 8바이트 (-922경 ~ 922경)
var ui  uint      // 부호 없는 정수 (플랫폼 의존, 32/64비트)
var ui8 uint8     // 1바이트 (0 ~ 255) = byte의 별칭

// 실수형
var f32 float32   // 4바이트 (IEEE 754, 정밀도 약 7자리)
var f64 float64   // 8바이트 (IEEE 754, 정밀도 약 15자리) — 기본

// 복소수
var c64 complex64   // 8바이트 (float32 실수부 + float32 허수부)

// 논리형
var b bool         // 1바이트 (true 또는 false)

// 문자열
var s string       // 16바이트 (reflect.StringHeader 구조체)

// 타입 별칭
var bt byte        // uint8과 동일
var r rune         // int32와 동일 (Unicode 코드 포인트)
```

Go의 정수형은 크기와 부호에 따라 11가지로 세분화됩니다. `int`와 `uint`는 플랫폼 의존적으로, 64비트 시스템에서는 8바이트, 32비트 시스템에서는 4바이트입니다. `float64`가 기본 실수형이며, 특별한 이유가 없으면 `float64`를 사용하는 것이 Go의 관례입니다. `byte`는 `uint8`의 별칭으로 바이너리 데이터 처리에 사용되고, `rune`은 `int32`의 별칭으로 유니코드 문자 하나를 표현합니다.

### 타입의 메모리 구조

```go
package main

import (
    "fmt"
    "unsafe"
)

func main() {
    fmt.Println("int:", unsafe.Sizeof(int(0)))       // 8 (64비트)
    fmt.Println("int32:", unsafe.Sizeof(int32(0)))   // 4
    fmt.Println("int64:", unsafe.Sizeof(int64(0)))   // 8
    fmt.Println("float64:", unsafe.Sizeof(float64(0))) // 8
    fmt.Println("bool:", unsafe.Sizeof(true))        // 1
    fmt.Println("string:", unsafe.Sizeof("hello"))   // 16 (Data 8 + Len 8)
    fmt.Println("rune:", unsafe.Sizeof(rune(0)))     // 4

    // string의 내부 구조
    s := "Hello"
    fmt.Printf("string: %v, len: %d\n", s, len(s))   // Hello, 5
    fmt.Printf("bytes: %v\n", []byte(s))              // [72 101 108 108 111]
}
```

`unsafe.Sizeof()`는 변수의 메모리 크기를 바이트 단위로 반환합니다. `string`이 16바이트를 차지하는 이유는 내부적으로 `reflect.StringHeader` 구조체(Data 필드 8바이트 + Len 필드 8바이트)로 구현되어 있기 때문입니다. `Data`는 실제 문자열 데이터가 저장된 힙 메모리를 가리키는 포인터이고, `Len`은 문자열의 바이트 길이입니다. `bool`은 1바이트지만, 실제로는 0(false) 또는 1(true)의 값만 저장합니다.

### 상수

```go
// 개별 상수 선언
const Pi = 3.14159
const Language string = "Go"

// iota를 사용한 열거형 상수
const (
    StatusOK       = 0  // 0
    StatusNotFound = 1  // 1
    StatusError    = 2  // 2
)

const (
    _  = iota             // 0 (버림)
    KB = 1 << (10 * iota) // 1024 (1 << 10)
    MB = 1 << (10 * iota) // 1048576 (1 << 20)
    GB = 1 << (10 * iota) // 1073741824 (1 << 30)
    TB = 1 << (10 * iota) // 1099511627776 (1 << 40)
)

// 타입 없는 상수(untyped constant)
const BigValue = 1 << 100       // 큰 값, 타입 없음
const BigFloat = 3.141592653589793238462643383279502884197

func main() {
    fmt.Println(Pi, Language)
    fmt.Println(StatusOK, StatusNotFound, StatusError)
    fmt.Println(KB, MB, GB, TB)
}
```

Go의 `const`는 컴파일 타임에 평가됩니다. `Pi = 3.14159` 상수는 사용되는 모든 곳에서 리터럴 `3.14159`로 치환(inlining)되므로 런타임 오버헤드가 없습니다. `iota`는 `const` 블록 내에서 행 인덱스를 나타내는 카운터로, 0부터 시작하여 새로운 상수 선언마다 1씩 증가합니다. `KB = 1 << (10 * iota)`는 `iota`가 1일 때 `1 << 10` = 1024가 됩니다. Go의 상수는 **타입이 없는(untyped)** 상태로 선언될 수 있어, `BigValue` 같은 매우 큰 값도 정밀도를 유지합니다. 타입 없는 상수는 실제 변수에 할당될 때 그 변수의 타입으로 자동 변환됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: :=와 var 중 어떤 것을 사용해야 하나요?</strong></summary>

함수 내부에서는 `:=`를 우선 사용하는 것이 Go의 관례입니다. `:=`는 더 간결하고 타입 추론으로 코드 중복을 줄입니다. `var`는 다음과 같은 경우에 사용합니다: (1) 제로값으로 초기화할 때 — `var count int` (2) 패키지 레벨 변수(var만 가능) (3) 변수 블록으로 그룹화할 때 `var (...)`. Go 커뮤니티에서는 가독성을 위해 두 방식을 적절히 혼용합니다. 단, `:=`는 함수 내에서만 사용 가능하고, 패키지 레벨에서는 `var`만 가능합니다.
</details>

<details>
<summary><strong>Q: int와 int64는 완전히 동일한가요?</strong></summary>

64비트 시스템에서 `int`는 8바이트(int64와 동일한 크기)이지만, **타입 시스템에서 다른 타입**입니다. `int`와 `int64`는 서로 다른 타입이므로 명시적 변환 없이 할당할 수 없습니다. 예를 들어 `var a int = 10; var b int64 = a`는 컴파일 오류가 발생합니다. `var b int64 = int64(a)`로 변환해야 합니다. 이는 32비트 시스템에서 `int`가 4바이트가 되어 `int64`와 크기가 달라지는 경우를 대비한 안전장치입니다.
</details>

<details>
<summary><strong>Q: string이 불변(immutable)인 이유는 무엇인가요?</strong></summary>

Go의 `string`은 불변(immutable) 타입입니다. 즉, 문자열의 특정 문자를 변경할 수 없습니다. `s[0] = 'H'` 같은 코드는 컴파일 오류가 발생합니다. 이는 문자열이 여러 곳에서 안전하게 공유될 수 있도록 하기 위함입니다. 문자열을 변경하려면 새로운 문자열을 생성해야 합니다: `s = "H" + s[1:]`. 불변성 덕분에 문자열 슬라이싱 `s[1:3]`이 새로운 메모리 할당 없이 원본 데이터의 일부를 참조할 수 있어 효율적입니다. 또한 문자열을 map의 key로 사용할 때 안전합니다.
</details>

<details>
<summary><strong>Q: 타입 변환(type conversion)과 타입 단언(type assertion)의 차이는 무엇인가요?</strong></summary>

**타입 변환**(type conversion)은 컴파일 타임에 알려진 구체적 타입 간의 변환입니다: `int64(42)` 또는 `float64(3.14)`. 변환 규칙이 명확하며, 손실이 발생할 수 있는 변환(예: int64 → int32)도 허용됩니다. **타입 단언**(type assertion)은 인터페이스 타입을 구체적 타입으로 복원할 때 사용합니다: `value.(string)`. 런타임에 타입을 검사하며, 실패하면 panic이 발생합니다. 안전한 단언은 `value.(string)` 대신 `value, ok := value.(string)`의 콤마-ok 패턴을 사용합니다. 타입 변환은 컴파일 타임에, 타입 단언은 런타임에 동작합니다.
</details>

<details>
<summary><strong>Q: int와 uint 중 어떤 것을 기본으로 사용해야 하나요?</strong></summary>

Go에서는 일반적인 정수에는 `int`를 기본으로 사용합니다. 슬라이스 인덱스나 len() 함수의 반환값도 `int`입니다. `uint`는 비트 연산이나 특정 프로토콜에서 부호 없는 값이 필요할 때만 사용합니다. `uint`를 남용하면 음수 값을 실수로 전달할 때 런타임 오버플로우가 발생할 수 있어 위험합니다. 예를 들어 `for i := uint(0); i >= 0; i++`는 영원히 종료되지 않는 무한 루프입니다.
</details>


## 요약

| 개념 | 설명 | 메모리/내부 동작 |
|------|------|----------------|
| **var** | 명시적 타입 선언 | 제로값 자동 초기화 |
| **:=** | 타입 추론 선언 | 우변 값으로 타입 결정 |
| **제로값** | 초기화 없는 변수의 기본값 | int=0, string="", bool=false |
| **const** | 컴파일 타임 상수 | 리터럴 치환(inlining), 런타임 비용 0 |
| **string** | 불변 UTF-8 시퀀스 | StringHeader{Data, Len}, 16바이트 |
| **타입 변환** | 명시적 타입 변경 | T(v) 문법, 컴파일 타임 검사 |


## 다음 수업

다음 글에서는 Go의 제어문 — if/for/switch와 조건문, 반복문의 유일한 키워드를 배웁니다.
