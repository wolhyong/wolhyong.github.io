---
layout: post
title: "Kotlin 제어문 — if/else, when, for, while, 범위, 시퀀스, break, continue, return"
description: "Kotlin의 제어문 시스템을 컴파일러 레벨에서 학습합니다. if/else는 표현식으로 값을 반환할 수 있으며 삼항 연산자 대신 사용합니다. when은 Java의 switch 문의 강화된 버전으로 여러 조건을 처리하며 표현식으로 사용할 수 있습니다. for는 범위, 컬렉션, 시퀀스를 순회하며 in 연산자와 함께 사용합니다. while과 do-while은 조건부 반복을 수행합니다. 범위는 .. 연산자로 정의하며 downTo, step으로 제어할 수 있습니다. 시퀀스는 지연 평가 컬렉션으로 sequenceOf로 생성합니다. break, continue, return으로 제어 흐름을 제어하며 레이블로 중첩 루프를 제어할 수 있습니다."
date: 2025-09-26 10:00:00 +0900
category: kotlin
tags: [kotlin, control-flow, if-else, when, for, while, ranges, sequences]
level: basic
---

Kotlin의 제어문은 간결하고 표현력이 풍부하며 표현식으로 사용할 수 있습니다.

> **핵심 정리** · `if/else`는 표현식으로 값을 반환합니다. `when`은 강화된 switch 문입니다. `for`는 범위와 컬렉션을 순회합니다. `while`과 `do-while`은 조건부 반복입니다. 범위는 `..`으로 정의합니다. 시퀀스는 지연 평가 컬렉션입니다. `break`, `continue`, `return`으로 제어 흐름을 제어합니다.


## 수업 목표

- if/else를 이해하고 사용할 수 있습니다.
- when을 이해하고 사용할 수 있습니다.
- for 루프를 이해하고 사용할 수 있습니다.
- while과 do-while을 이해합니다.
- 범위를 이해합니다.
- 시퀀스를 이해합니다.
- break, continue, return을 이해합니다.

## if/else

```kotlin
// 기본 if/else
val age = 20
if (age >= 18) {
    println("성인")
} else {
    println("미성년자")
}

// 표현식으로 사용
val message = if (age >= 18) "성인" else "미성년자"
println(message)

// else if
val grade = 85
val result = if (grade >= 90) "A"
            else if (grade >= 80) "B"
            else if (grade >= 70) "C"
            else "F"
println(result)

// 블록과 표현식
val max = if (a > b) {
    println("a가 큼")
    a
} else {
    println("b가 큼")
    b
}
```

`if/else`는 표현식으로 값을 반환할 수 있습니다. 삼항 연산자가 없으며 `if/else`로 대체합니다. 블록 내에서 마지막 표현식이 반환됩니다.

## when

```kotlin
// 기본 when
val day = 3
val dayName = when (day) {
    1 -> "월요일"
    2 -> "화요일"
    3 -> "수요일"
    4 -> "목요일"
    5 -> "금요일"
    6 -> "토요일"
    7 -> "일요일"
    else -> "알 수 없음"
}
println(dayName)

// 여러 조건
val x = 10
val description = when (x) {
    1, 2, 3 -> "작은 수"
    in 4..10 -> "중간 수"
    else -> "큰 수"
}
println(description)

// 타입 체크
val obj: Any = "Hello"
val type = when (obj) {
    is String -> "문자열"
    is Int -> "정수"
    else -> "기타"
}
println(type)

// 인자 없는 when
val y = 10
when {
    y < 0 -> "음수"
    y > 0 -> "양수"
    else -> "영"
}

// 표현식으로 사용
val result = when (grade) {
    in 90..100 -> "A"
    in 80..89 -> "B"
    in 70..79 -> "C"
    else -> "F"
}
```

`when`은 Java의 switch 문의 강화된 버전입니다. 여러 조건, 범위, 타입 체크를 지원합니다. 인자 없이 사용할 수도 있습니다. 표현식으로 값을 반환할 수 있습니다.

## for 루프

```kotlin
// 범위 순회
for (i in 1..5) {
    println(i)
}

// 컬렉션 순회
val fruits = listOf("Apple", "Banana", "Cherry")
for (fruit in fruits) {
    println(fruit)
}

// 인덱스와 값
for ((index, fruit) in fruits.withIndex()) {
    println("$index: $fruit")
}

// 범위 제어
for (i in 1..10 step 2) {
    println(i)  // 1, 3, 5, 7, 9
}

// 내림차순
for (i in 10 downTo 1) {
    println(i)
}

// until (끝값 제외)
for (i in 1 until 5) {
    println(i)  // 1, 2, 3, 4
}

// 맵 순회
val map = mapOf("key1" to "value1", "key2" to "value2")
for ((key, value) in map) {
    println("$key: $value")
}
```

`for`는 범위, 컬렉션, 맵을 순회합니다. `in` 연산자로 순회 대상을 지정합니다. `step`, `downTo`, `until`으로 범위를 제어합니다. `withIndex()`로 인덱스와 값을 함께 가져옵니다.

## while과 do-while

```kotlin
// while
var i = 0
while (i < 5) {
    println(i)
    i++
}

// do-while
var j = 0
do {
    println(j)
    j++
} while (j < 5)

// 무한 루프
var k = 0
while (true) {
    println(k)
    k++
    if (k >= 5) break
}
```

`while`은 조건이 참인 동안 반복합니다. `do-while`은 최소 한 번 실행 후 조건을 확인합니다. `while (true)`로 무한 루프를 만들 수 있습니다.

## 범위

```kotlin
// 기본 범위
val range = 1..10
println(range.contains(5))  // true

// 범위 순회
for (i in 1..10) {
    println(i)
}

// 내림차순 범위
val descendingRange = 10 downTo 1
for (i in descendingRange) {
    println(i)
}

// 범위 제어
val stepRange = 1..10 step 2
for (i in stepRange) {
    println(i)  // 1, 3, 5, 7, 9
}

// until
val untilRange = 1 until 10
for (i in untilRange) {
    println(i)  // 1, 2, 3, 4, 5, 6, 7, 8, 9
}

// 범위 함수
val range1 = 1..10
println(range1.first)  // 1
println(range1.last)   // 10
println(range1.step)   // 1
println(range1.count())  // 10
```

범위는 `..` 연산자로 정의합니다. `downTo`로 내림차순, `step`으로 간격, `until`로 끝값 제외를 지정합니다. `first`, `last`, `step`, `count()` 등의 함수를 제공합니다.

## 시퀀스

```kotlin
// 시퀀스 생성
val sequence = sequenceOf(1, 2, 3, 4, 5)
for (item in sequence) {
    println(item)
}

// 범위를 시퀀스로 변환
val rangeSequence = (1..10).asSequence()
val filtered = rangeSequence.filter { it % 2 == 0 }
for (item in filtered) {
    println(item)  // 2, 4, 6, 8, 10
}

// 시퀀스 빌더
val customSequence = sequence {
    yield(1)
    yield(2)
    yieldAll(3..5)
}
for (item in customSequence) {
    println(item)  // 1, 2, 3, 4, 5
}

// 지연 평가
val lazySequence = sequence {
    println("생성")
    yield(1)
    yield(2)
}
// 여기서는 아직 생성되지 않음
lazySequence.toList()  // 여기서 생성됨
```

시퀀스는 지연 평가 컬렉션입니다. `sequenceOf`로 생성하거나 `asSequence()`로 변환합니다. `yield`, `yieldAll`으로 값을 생성합니다. 지연 평가로 성능을 최적화합니다.

## break와 continue

```kotlin
// break
for (i in 1..10) {
    if (i == 5) break
    println(i)  // 1, 2, 3, 4
}

// continue
for (i in 1..10) {
    if (i % 2 == 0) continue
    println(i)  // 1, 3, 5, 7, 9
}

// 레이블과 break
outer@ for (i in 1..3) {
    for (j in 1..3) {
        if (i == 2 && j == 2) break@outer
        println("i=$i, j=$j")
    }
}

// 레이블과 continue
outer@ for (i in 1..3) {
    for (j in 1..3) {
        if (i == 2 && j == 2) continue@outer
        println("i=$i, j=$j")
    }
}
```

`break`는 루프를 종료합니다. `continue`는 다음 반복으로 건너뜁니다. 레이블(`label@`)로 중첩 루프를 제어할 수 있습니다. `break@label`, `continue@label`로 특정 루프를 제어합니다.

## return

```kotlin
// 기본 return
fun max(a: Int, b: Int): Int {
    return if (a > b) a else b
}

// 표현식 본문 return
fun maxExpression(a: Int, b: Int): Int = if (a > b) a else b

// 람다에서 return
val numbers = listOf(1, 2, 3, 4, 5)
numbers.forEach {
    if (it == 3) return@forEach  // 람다에서만 return
    println(it)
}

// 레이블 return
fun outer() {
    val numbers = listOf(1, 2, 3, 4, 5)
    numbers.forEach label@ {
        if (it == 3) return@label
        println(it)
    }
}
```

`return`은 함수에서 값을 반환합니다. 표현식 본문에서는 `return` 없이 마지막 표현식이 반환됩니다. 람다에서 `return@label`로 람다만 종료할 수 있습니다.

## 조건부 표현식

```kotlin
// if/else 표현식
val age = 20
val isAdult = if (age >= 18) true else false

// when 표현식
val day = 3
val dayName = when (day) {
    1 -> "월요일"
    2 -> "화요일"
    3 -> "수요일"
    else -> "알 수 없음"
}

// 범위 표현식
val inRange = 5 in 1..10  // true

// 타입 체크 표현식
val obj: Any = "Hello"
val isString = obj is String  // true
```

조건부 표현식은 `if/else`, `when`, `in`, `is` 등을 표현식으로 사용합니다. 간결하고 가독성 있는 코드를 작성할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> Kotlin에는 삼항 연산자가 없나요?</strong></summary>

Kotlin에는 삼항 연산자(`?:`)가 없습니다. 대신 `if/else`를 표현식으로 사용합니다. `if (condition) value1 else value2` 형식입니다. 더 명확하고 가독성이 좋습니다.
</details>

<details>
<summary><strong>Q> when과 if/else 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`when`은 여러 조건을 처리할 때 사용합니다. 특히 여러 값, 범위, 타입 체크가 필요할 때 유용합니다. 단순한 조건에는 `if/else`를 사용합니다. `when`이 더 가독성이 좋습니다.
</details>

<details>
<summary><strong>Q> for 루프와 while 루프 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`for` 루프는 컬렉션, 범위 순회에 사용합니다. 반복 횟수가 명확할 때 유용합니다. `while` 루프는 조건부 반복에 사용합니다. 반복 횟수가 불확실할 때 유용합니다. 대부분의 경우 `for` 루프를 사용합니다.
</details>

<details>
<summary><strong>Q> 범위와 시퀀스 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

범위는 즉시 평가되며 작은 데이터에 적합합니다. 시퀀스는 지연 평가되며 대용량 데이터에 적합합니다. 성능이 중요하면 시퀀스를 사용합니다. 대부분의 경우 범위로 충분합니다.
</details>

<details>
<summary><strong>Q> 레이블은 언제 사용해야 하나요?</strong></summary>

레이블은 중첩 루프 제어에 사용합니다. 특정 루프를 종료하거나 건너뛸 때 유용합니다. 람다에서 `return`을 제어할 때도 사용합니다. 중첩 구조가 복잡할 때 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **if/else** | 조건문 | 표현식 가능 |
| **when** | 다중 조건 | switch 강화 |
| **for** | 순회 루프 | in 연산자 |
| **while** | 조건부 반복 | 조건 확인 후 실행 |
| **do-while** | 조건부 반복 | 최소 한 번 실행 |
| **범위** | .. 연산자 | step, downTo, until |
| **시퀀스** | 지연 평가 | sequenceOf |
| **break** | 루프 종료 | 레이블 지원 |
| **continue** | 다음 반복 | 레이블 지원 |
| **return** | 함수 반환 | 표현식 본문 |
| **레이블** | 중첩 제어 | label@ |
| **in** | 범위 포함 | 조건부 표현식 |
| **is** | 타입 체크 | 조건부 표현식 |


## 다음 수업

다음 글에서는 Kotlin 기본 — 함수, 람다, 고차 함수, 기본 매개변수, 명명된 인자, 가변 인자를 배웁니다.
