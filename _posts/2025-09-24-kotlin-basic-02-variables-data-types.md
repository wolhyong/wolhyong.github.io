---
layout: post
title: "Kotlin 변수와 데이터 타입 — val/var, 널 안전성, 타입 추론, 기본 타입, 문자열, 배열"
description: "Kotlin의 변수와 데이터 타입 시스템을 컴파일러 레벨에서 학습합니다. val은 읽기 전용 상수이며 var는 변경 가능 변수입니다. 널 안전성은 String(널 불가능)과 String?(널 가능)으로 구분하며 ?. 안전 호출, ?: 엘비스 연산자, !! 널 단정 연산자를 제공합니다. 타입 추론은 컴파일러가 타입을 자동으로 추론하며 명시적 타입 지정도 가능합니다. 기본 타입은 Int, Long, Double, Float, Boolean, Char 등을 제공하며 박싱/언박싱 없이 최적화됩니다. 문자열은 불변이며 문자열 템플릿, 여러 줄 문자열, raw string을 지원합니다. 배열은 Array<T>와 기본 타입 배열(IntArray 등)을 제공하며 listOf, mutableListOf로 리스트를 생성합니다."
date: 2025-09-24 10:00:00 +0900
category: kotlin
tags: [kotlin, variables, data-types, null-safety, type-inference, strings, arrays]
level: basic
---

Kotlin의 변수와 데이터 타입 시스템은 간결하고 안전하며 표현력이 풍부합니다.

> **핵심 정리** · `val`은 읽기 전용, `var`는 변경 가능입니다. 널 안전성은 `String` vs `String?`로 구분합니다. 타입 추론을 지원합니다. 기본 타입은 박싱 없이 최적화됩니다. 문자열은 불변이며 템플릿을 지원합니다. 배열은 `Array<T>`와 기본 타입 배열을 제공합니다.


## 수업 목표

- val과 var를 이해합니다.
- 널 안전성을 이해합니다.
- 타입 추론을 이해합니다.
- 기본 타입을 이해합니다.
- 문자열을 이해합니다.
- 배열과 리스트를 이해합니다.

## val과 var

```kotlin
// val: 읽기 전용 (상수)
val name = "Wolhyong"
// name = "Greyhacker"  // 컴파일 에러: val은 재할당 불가

// var: 변경 가능 (변수)
var age = 30
age = 31  // 허용

// 지연 초기화
val lazyValue: String by lazy {
    println("초기화")
    "Lazy Value"
}

println(lazyValue)  // 여기서 초기화
println(lazyValue)  // 이미 초기화됨
```

`val`은 읽기 전용 상수로 재할당할 수 없습니다. `var`는 변경 가능 변수로 재할당할 수 있습니다. `by lazy`로 지연 초기화를 수행할 수 있습니다. 불변성을 우선시하는 것이 좋습니다.

## 널 안전성

```kotlin
// 널 불가능 타입
var name: String = "Wolhyong"
// name = null  // 컴파일 에러

// 널 가능 타입
var nullableName: String? = "Wolhyong"
nullableName = null  // 허용

// 안전한 호출 (Safe Call)
val length = nullableName?.length  // null이면 null 반환
println(length)  // null

// 엘비스 연산자 (Elvis Operator)
val defaultLength = nullableName?.length ?: 0
println(defaultLength)  // 0

// 널 단정 연산자 (Non-null Assertion)
val nonNullLength = nullableName!!.length  // null이면 NPE
// nullableName이 null이면 NullPointerException 발생

// 안전한 캐스트
val obj: Any = "Hello"
val str: String? = obj as? String  // 캐스트 실패 시 null
```

널 안전성은 널 포인터 예외를 컴파일 타임에 방지합니다. `String`은 널 불가능, `String?`은 널 가능입니다. `?.`로 안전한 호출, `?:`로 엘비스 연산자, `!!`로 널 단정 연산자를 사용합니다. `as?`로 안전한 캐스트를 수행합니다.

## 타입 추론

```kotlin
// 타입 추론
val inferredName = "Wolhyong"  // String으로 추론
val inferredAge = 30           // Int로 추론
val inferredPi = 3.14         // Double로 추론

// 명시적 타입
val explicitName: String = "Wolhyong"
val explicitAge: Int = 30
val explicitPi: Double = 3.14

// 타입 추론과 명시적 타입 혼합
val number = 42  // Int
val longNumber: Long = 42  // Long

// Any 타입 (최상위 타입)
val anyValue: Any = "Hello"
val anyNumber: Any = 42
```

타입 추론은 컴파일러가 타입을 자동으로 추론합니다. 명시적 타입 지정도 가능합니다. `Any`는 최상위 타입으로 모든 타입을 받을 수 있습니다. 타입 추론을 활용하여 코드를 간결하게 작성할 수 있습니다.

## 기본 타입

```kotlin
// 정수
val byte: Byte = 127
val short: Short = 32767
val int: Int = 2147483647
val long: Long = 9223372036854775807L

// 부동소수
val float: Float = 3.14f
val double: Double = 3.14159265359

// 불리언
val isTrue: Boolean = true
val isFalse: Boolean = false

// 문자
val char: Char = 'A'

// 숫자 리터럴
val decimal = 100
val hex = 0xFF
val binary = 0b1010
val longLiteral = 100L

// 숫자 변환
val intNumber = 42
val longNumber = intNumber.toLong()
val doubleNumber = intNumber.toDouble()
```

기본 타입은 `Byte`, `Short`, `Int`, `Long`, `Float`, `Double`, `Boolean`, `Char`를 제공합니다. 박싱/언박싱 없이 최적화됩니다. 숫자 리터럴은 10진수, 16진수, 2진수를 지원합니다. `toLong()`, `toDouble()` 등으로 타입 변환을 수행합니다.

## 문자열

```kotlin
// 문자열 생성
val text = "Hello, World!"

// 문자열 템플릿
val name = "Wolhyong"
val age = 30
val message = "이름: $name, 나이: $age"

// 표현식
val calculation = "1 + 2 = ${1 + 2}"

// 여러 줄 문자열
val multiline = """
    이름: $name
    나이: $age
    주소: 서울
"""

// raw string (이스케이프 무시)
val rawString = """
    |이것은
    |raw string
    |입니다.
""".trimMargin()

// 문자열 함수
val upper = text.uppercase()  // HELLO, WORLD!
val lower = text.lowercase()  // hello, world!
val reversed = text.reversed()  // !dlroW ,olleH
val length = text.length  // 13

// 문자열 접근
val firstChar = text[0]  // H
val substring = text.substring(0, 5)  // Hello
```

문자열은 불변이며 문자열 템플릿을 지원합니다. `$variable`로 변수를, `${expression}`으로 표현식을 포함합니다. `"""`로 여러 줄 문자열을 정의합니다. `trimMargin()`으로 들여쓰기를 제거합니다. `uppercase()`, `lowercase()`, `reversed()` 등의 함수를 제공합니다.

## 배열

```kotlin
// 배열 생성
val numbers = arrayOf(1, 2, 3, 4, 5)
val strings = arrayOf("A", "B", "C")

// 기본 타입 배열 (박싱 없음)
val intArray = intArrayOf(1, 2, 3, 4, 5)
val doubleArray = doubleArrayOf(1.0, 2.0, 3.0)
val booleanArray = booleanArrayOf(true, false, true)

// 배열 접근
val first = numbers[0]  // 1
val second = numbers.get(1)  // 2

// 배열 수정
numbers[0] = 10
numbers.set(1, 20)

// 배열 순회
for (number in numbers) {
    println(number)
}

// 배열 함수
val size = numbers.size  // 5
val contains = numbers.contains(3)  // true
val firstOrNull = numbers.firstOrNull()  // 1
val lastOrNull = numbers.lastOrNull()  // 5
```

`Array<T>`는 일반 배열, `IntArray`, `DoubleArray` 등은 기본 타입 배열입니다. 기본 타입 배열은 박싱 없이 최적화됩니다. `[]` 또는 `get()`/`set()`으로 접근합니다. `size`, `contains`, `firstOrNull`, `lastOrNull` 등의 함수를 제공합니다.

## 리스트

```kotlin
// 불변 리스트
val immutableList = listOf(1, 2, 3, 4, 5)

// 변경 가능 리스트
val mutableList = mutableListOf(1, 2, 3, 4, 5)
mutableList.add(6)
mutableList.remove(1)

// 리스트 접근
val first = immutableList[0]  // 1
val second = immutableList.get(1)  // 2

// 리스트 순회
for (item in immutableList) {
    println(item)
}

// 리스트 함수
val size = immutableList.size  // 5
val contains = immutableList.contains(3)  // true
val first = immutableList.first()  // 1
val last = immutableList.last()  // 5
val filtered = immutableList.filter { it > 2 }  // [3, 4, 5]
val mapped = immutableList.map { it * 2 }  // [2, 4, 6, 8, 10]
```

`listOf`는 불변 리스트, `mutableListOf`는 변경 가능 리스트입니다. `add()`, `remove()`로 요소를 추가/제거합니다. `[]` 또는 `get()`으로 접근합니다. `filter`, `map` 등의 함수를 제공합니다.

## 맵

```kotlin
// 불변 맵
val immutableMap = mapOf("key1" to "value1", "key2" to "value2")

// 변경 가능 맵
val mutableMap = mutableMapOf("key1" to "value1", "key2" to "value2")
mutableMap["key3"] = "value3"
mutableMap.remove("key1")

// 맵 접근
val value = immutableMap["key1"]  // value1
val valueOrNull = immutableMap["key3"]  // null

// 맵 순회
for ((key, value) in immutableMap) {
    println("$key: $value")
}

// 맵 함수
val size = immutableMap.size  // 2
val containsKey = immutableMap.containsKey("key1")  // true
val keys = immutableMap.keys  // [key1, key2]
val values = immutableMap.values  // [value1, value2]
```

`mapOf`는 불변 맵, `mutableMapOf`는 변경 가능 맵입니다. `to`로 키-값 쌍을 생성합니다. `[]`로 접근하며 `remove()`로 제거합니다. `keys`, `values`로 키와 값을 가져옵니다.

## 세트

```kotlin
// 불변 세트
val immutableSet = setOf(1, 2, 3, 3, 2)  // [1, 2, 3] (중복 제거)

// 변경 가능 세트
val mutableSet = mutableSetOf(1, 2, 3)
mutableSet.add(4)
mutableSet.remove(1)

// 세트 함수
val size = immutableSet.size  // 3
val contains = immutableSet.contains(2)  // true
val union = immutableSet.union(setOf(3, 4, 5))  // [1, 2, 3, 4, 5]
val intersect = immutableSet.intersect(setOf(2, 3, 4))  // [2, 3]
val difference = immutableSet.difference(setOf(2, 3, 4))  // [1]
```

`setOf`는 불변 세트, `mutableSetOf`는 변경 가능 세트입니다. 중복을 자동으로 제거합니다. `union`, `intersect`, `difference`로 집합 연산을 수행합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> val과 var 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`val`을 우선 사용해야 합니다. 불변성은 스레드 안전성을 높이며 버그를 줄입니다. 상태 변경이 필요할 때만 `var`를 사용합니다. 함수형 프로그래밍 원칙을 따르는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 널 안전성은 왜 중요한가요?</strong></summary>

널 안전성은 널 포인터 예외를 컴파일 타임에 방지합니다. 런타임 오류를 줄이며 코드 안정성을 높입니다. Java에서 가장 흔한 오류 중 하나인 NPE를 방지합니다. 안전한 코드를 작성하는 데 필수적입니다.
</details>

<details>
<summary><strong>Q> Array<T>와 IntArray 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`IntArray` 등 기본 타입 배열을 사용해야 합니다. 박싱 오버헤드가 없어 성능이 좋습니다. `Array<T>`는 객체 배열에 사용합니다. 성능이 중요한 경우 기본 타입 배열을 사용합니다.
</details>

<details>
<summary><strong>Q> listOf와 mutableListOf 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`listOf`를 우선 사용해야 합니다. 불변 리스트는 스레드 안전하며 예상치 못한 변경을 방지합니다. 변경이 필요할 때만 `mutableListOf`를 사용합니다. 불변성을 우선시하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 문자열 템플릿은 언제 사용해야 하나요?</strong></summary>

문자열 템플릿은 문자열에 변수나 표현식을 포함할 때 사용합니다. 문자열 연결보다 가독성이 좋습니다. 복잡한 문자열 구성에 유용합니다. `+` 연산자 대신 문자열 템플릿을 사용하는 것이 좋습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **val** | 읽기 전용 상수 | 재할당 불가 |
| **var** | 변경 가능 변수 | 재할당 가능 |
| **널 불가능** | String | null 허용 안 함 |
| **널 가능** | String? | null 허용 |
| **?.** | 안전 호출 | null 시 null 반환 |
| **?:** | 엘비스 연산자 | null 시 기본값 |
| **!!** | 널 단정 연산자 | null 시 NPE |
| **타입 추론** | 자동 타입 결정 | 간결한 코드 |
| **기본 타입** | Int, Long, Double | 박싱 없음 |
| **문자열** | 불변 | 템플릿 지원 |
| **Array<T>** | 일반 배열 | 객체 박싱 |
| **IntArray** | 기본 타입 배열 | 박싱 없음 |
| **listOf** | 불변 리스트 | 변경 불가 |
| **mutableListOf** | 변경 가능 리스트 | add/remove |
| **mapOf** | 불변 맵 | 키-값 쌍 |
| **setOf** | 불변 세트 | 중복 제거 |


## 다음 수업

다음 글에서는 Kotlin 기본 — 제어문, if/else, when, for, while, 범위, 시퀀스를 배웁니다.
