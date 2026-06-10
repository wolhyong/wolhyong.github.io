---
layout: post
title: "Kotlin 범위와 진법 — 범위, 진법, 비트 연산, 타입 캐스팅, 타입 검사"
description: "Kotlin의 범위와 진법 시스템을 컴파일러 레벨에서 학습합니다. 범위는 .. 연산자로 정의하며 IntRange, LongRange 등을 제공합니다. downTo, step, until로 범위를 제어할 수 있습니다. 진법은 0x(16진수), 0b(2진수) 리터럴을 지원하며 toInt(radix)로 변환합니다. 비트 연산은 shl, shr, ushr, and, or, xor, inv를 제공합니다. 타입 캐스팅은 as, as? 연산자로 수행하며 안전한 캐스트를 지원합니다. 타입 검사는 is, !is 연산자로 수행하며 스마트 캐스트를 지원합니다."
date: 2025-10-10 10:00:00 +0900
category: kotlin
tags: [kotlin, ranges, number-systems, bit-operations, type-casting, type-checking]
level: intermediate
---

Kotlin의 범위와 진법 시스템은 간결하고 표현력이 풍부하며 다양한 숫자 연산을 지원합니다.

> **핵심 정리** · 범위는 `..` 연산자로 정의합니다. `downTo`, `step`, `until`로 범위를 제어합니다. 진법은 `0x`, `0b` 리터럴을 지원합니다. 비트 연산은 `shl`, `shr`, `and`, `or`, `xor`를 제공합니다. `as`, `as?`로 타입 캐스팅을 수행합니다. `is`, `!is`로 타입 검사를 수행합니다.


## 수업 목표

- 범위를 이해하고 사용할 수 있습니다.
- 진법을 이해합니다.
- 비트 연산을 이해합니다.
- 타입 캐스팅을 이해합니다.
- 타입 검사를 이해합니다.

## 범위

```kotlin
// 기본 범위
val range = 1..10
println(range)  // 1..10

// 범위 순회
for (i in 1..10) {
    println(i)
}

// 범위 포함 확인
val inRange = 5 in 1..10  // true
val notInRange = 11 in 1..10  // false

// 범위 함수
val range1 = 1..10
println(range1.first)  // 1
println(range1.last)   // 10
println(range1.step)   // 1
println(range1.count())  // 10
```

범위는 `..` 연산자로 정의합니다. `in` 연산자로 포함 여부를 확인합니다. `first`, `last`, `step`, `count()` 등의 함수를 제공합니다.

## 범위 제어

```kotlin
// 내림차순 범위
val descendingRange = 10 downTo 1
for (i in descendingRange) {
    println(i)  // 10, 9, 8, ..., 1
}

// 범위 간격
val stepRange = 1..10 step 2
for (i in stepRange) {
    println(i)  // 1, 3, 5, 7, 9
}

// until (끝값 제외)
val untilRange = 1 until 10
for (i in untilRange) {
    println(i)  // 1, 2, 3, ..., 9
}

// 조합
val combined = 10 downTo 1 step 2
for (i in combined) {
    println(i)  // 10, 8, 6, 4, 2
}
```

`downTo`로 내림차순, `step`으로 간격, `until`로 끝값 제외를 지정합니다. 조합하여 복잡한 범위를 정의할 수 있습니다.

## 진법

```kotlin
// 10진수
val decimal = 42
println(decimal)  // 42

// 16진수
val hex = 0xFF
println(hex)  // 255

// 2진수
val binary = 0b1010
println(binary)  // 10

// 8진수 (지원하지 않음)
// val octal = 077  // 컴파일 에러

// 진법 변환
val decimalNumber = 255
val hexString = decimalNumber.toString(16)  // "ff"
val binaryString = decimalNumber.toString(2)  // "11111111"

// 문자열에서 숫자로 변환
val hexNumber = "FF".toInt(16)  // 255
val binaryNumber = "1010".toInt(2)  // 10
```

진법 리터럴을 지원합니다. `0x`는 16진수, `0b`는 2진수입니다. `toString(radix)`로 진법 변환을 수행합니다. `toInt(radix)`로 문자열을 숫자로 변환합니다.

## 비트 연산

```kotlin
val a = 5  // 0101
val b = 3  // 0011

// shl (왼쪽 시프트)
val shiftedLeft = a shl 1  // 1010 (10)
println(shiftedLeft)

// shr (오른쪽 시프트)
val shiftedRight = a shr 1  // 0010 (2)
println(shiftedRight)

// ushr (부호 없는 오른쪽 시프트)
val unsignedShiftRight = (-5).ushr(1)
println(unsignedShiftRight)

// and (비트 AND)
val andResult = a and b  // 0001 (1)
println(andResult)

// or (비트 OR)
val orResult = a or b  // 0111 (7)
println(orResult)

// xor (비트 XOR)
val xorResult = a xor b  // 0110 (6)
println(xorResult)

// inv (비트 반전)
val inverted = a.inv()  // 1010 -> 0101
println(inverted)
```

비트 연산은 `shl`, `shr`, `ushr`, `and`, `or`, `xor`, `inv`를 제공합니다. 정수 타입에만 적용됩니다. 비트 조작에 유용합니다.

## 타입 캐스팅

```kotlin
// 기본 캐스팅
val number: Any = 42
val intNumber = number as Int
println(intNumber)  // 42

// 안전한 캐스팅
val obj: Any = "Hello"
val str = obj as? String  // "Hello"
println(str)

val obj2: Any = 42
val str2 = obj2 as? String  // null
println(str2)

// 캐스팅 실패
val obj3: Any = "Hello"
val intNumber2 = obj3 as Int  // ClassCastException
```

`as`는 기본 캐스팅으로 실패 시 `ClassCastException`을 발생시킵니다. `as?`는 안전한 캐스팅으로 실패 시 `null`을 반환합니다. 안전한 캐스팅을 우선 사용해야 합니다.

## 타입 검사

```kotlin
// is 연산자
val obj: Any = "Hello"

if (obj is String) {
    println("문자열입니다.")
}

// !is 연산자
if (obj !is Int) {
    println("정수가 아닙니다.")
}

// 스마트 캐스트
val obj2: Any = "Hello"

if (obj2 is String) {
    // obj2는 자동으로 String으로 캐스트됨
    println(obj2.length)  // 5
}

// when에서 스마트 캐스트
val obj3: Any = 42

when (obj3) {
    is Int -> println("정수: ${obj3 + 1}")
    is String -> println("문자열: ${obj3.length}")
    else -> println("기타")
}
```

`is` 연산자로 타입을 확인합니다. `!is`로 타입이 아님을 확인합니다. 스마트 캐스트는 타입 확인 후 자동으로 캐스트를 수행합니다. `when`에서도 스마트 캐스트가 작동합니다.

## 숫자 타입 변환

```kotlin
// toLong
val intNumber = 42
val longNumber = intNumber.toLong()

// toInt
val longNumber2 = 42L
val intNumber2 = longNumber2.toInt()

// toDouble
val intNumber3 = 42
val doubleNumber = intNumber3.toDouble()

// toFloat
val intNumber4 = 42
val floatNumber = intNumber4.toFloat()

// toShort
val intNumber5 = 42
val shortNumber = intNumber5.toShort()

// toByte
val intNumber6 = 42
val byteNumber = intNumber6.toByte()

// toChar
val intNumber7 = 65
val charNumber = intNumber7.toChar()
println(charNumber)  // A
```

`toLong()`, `toInt()`, `toDouble()`, `toFloat()`, `toShort()`, `toByte()`, `toChar()`로 타입 변환을 수행합니다. 명시적 변환만 지원하며 자동 변환은 없습니다.

## 숫자 리터럴

```kotlin
// Long 리터럴
val longLiteral = 42L

// Float 리터럴
val floatLiteral = 3.14f

// Double 리터럴
val doubleLiteral = 3.14

// 밑줄로 가독성 향상 (Kotlin 1.1+)
val largeNumber = 1_000_000
val creditCardNumber = 1234_5678_9012_3456L

// 16진수
val hexNumber = 0xFF

// 2진수
val binaryNumber = 0b1010
```

숫자 리터럴에 접미사를 사용하여 타입을 지정합니다. `L`은 Long, `f`는 Float입니다. 밑줄로 가독성을 높일 수 있습니다. `0x`, `0b`로 진법을 지정합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> ..과 until 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`..`는 끝값을 포함합니다. `until`은 끝값을 제외합니다. 0부터 n-1까지 순회할 때 `until`을 사용합니다. 끝값을 포함할 때 `..`를 사용합니다.
</details>

<details>
<summary><strong>Q> as와 as? 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`as?`를 사용해야 합니다. 안전한 캐스트로 실패 시 `null`을 반환합니다. `as`는 실패 시 `ClassCastException`을 발생시킵니다. 예외 처리를 피하기 위해 `as?`를 우선 사용해야 합니다.
</details>

<details>
<summary><strong>Q> 비트 연산은 언제 사용해야 하나요?</strong></summary>

비트 연산은 플래그 처리, 마스킹, 최적화에 사용합니다. 하드웨어 제어, 암호화, 압축 등에 유용합니다. 일반적인 비즈니스 로직에는 거의 사용되지 않습니다.
</details>

<details>
<summary><strong>Q> 스마트 캐스트는 언제 작동하나요?</strong></summary>

스마트 캐스트는 다음 조건에서 작동합니다: (1) `val` 프로퍼티 (2) `is` 연산자로 타입 확인 (3) 확인 후 변경되지 않음. `var` 프로퍼티는 변경 가능하므로 스마트 캐스트가 작동하지 않을 수 있습니다.
</details>

<details>
<summary><strong>Q> 진법 변환은 언제 사용해야 하나요?</strong></summary>

진법 변환은 데이터 직렬화, 네트워크 프로토콜, 암호화에 사용합니다. 16진수는 바이트 표현에, 2진수는 비트 조작에 유용합니다. 일반적인 비즈니스 로직에는 거의 사용되지 않습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **범위** | .. 연산자 | IntRange |
| **downTo** | 내림차순 | 10 downTo 1 |
| **step** | 간격 | step 2 |
| **until** | 끝값 제외 | 1 until 10 |
| **진법** | 0x, 0b | 16진수, 2진수 |
| **toString(radix)** | 진법 변환 | 문자열로 |
| **toInt(radix)** | 문자열 변환 | 숫자로 |
| **shl** | 왼쪽 시프트 | 비트 이동 |
| **shr** | 오른쪽 시프트 | 비트 이동 |
| **and** | 비트 AND | & |
| **or** | 비트 OR | \| |
| **xor** | 비트 XOR | ^ |
| **inv** | 비트 반전 | ~ |
| **as** | 기본 캐스팅 | ClassCastException |
| **as?** | 안전한 캐스팅 | null 반환 |
| **is** | 타입 검사 | 스마트 캐스트 |
| **!is** | 타입 아님 검사 | 부정 |
| **toLong()** | Long 변환 | 명시적 변환 |
| **toInt()** | Int 변환 | 명시적 변환 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 예외 처리, try-catch, 사용자 정의 예외, throw, finally을 배웁니다.
