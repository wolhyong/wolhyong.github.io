---
layout: post
title: "Kotlin 람다 심화 — 고차 함수, 함수형 프로그래밍, 함수 합성, 커링, 부분 적용"
description: "Kotlin의 람다와 함수형 프로그래밍 시스템을 심화 레벨에서 학습합니다. 람다는 익명 함수로 { -> } 문법을 사용하며 it로 단일 매개변수에 접근합니다. 고차 함수는 함수를 매개변수로 받거나 반환하며 map, filter, reduce 등을 제공합니다. 함수 합성은 여러 함수를 체이닝하여 새로운 함수를 만들며 compose와 andThen을 사용합니다. 커링은 여러 인자를 받는 함수를 단일 인자 함수로 변환하며 커링된 함수를 반환합니다. 부분 적용은 일부 인자를 미리 설정하여 새로운 함수를 만듭니다. Kotlin은 함수형 프로그래밍 패턴을 지원하며 불변성과 순수 함수를 권장합니다."
date: 2025-10-24 10:00:00 +0900
category: kotlin
tags: [kotlin, lambda, higher-order-functions, functional-programming, function-composition, currying]
level: intermediate
---

Kotlin의 람다와 함수형 프로그래밍은 간결하고 표현력이 풍부한 코드를 작성할 수 있게 합니다.

> **핵심 정리** · 람다는 익명 함수입니다. 고차 함수는 함수를 매개변수로 받거나 반환합니다. 함수 합성은 여러 함수를 체이닝합니다. 커링은 다중 인자를 단일 인자로 변환합니다. 부분 적용은 일부 인자를 미리 설정합니다. 불변성과 순수 함수를 권장합니다.


## 수업 목표

- 람다 심화를 이해합니다.
- 고차 함수를 이해합니다.
- 함수 합성을 이해합니다.
- 커링을 이해합니다.
- 부분 적용을 이해합니다.
- 함수형 프로그래밍 패턴을 이해합니다.

## 람다 캡처

```kotlin
// 람다 캡처
var x = 10
val lambda = { y: Int -> x + y }

x = 20
println(lambda(5))  // 25 (캡처 시점의 값)

// 명시적 캡처
var x2 = 10
val lambda2 = { y: Int ->
    val captured = x2
    captured + y
}

x2 = 20
println(lambda2(5))  // 15 (명시적 캡처)
```

람다는 외부 변수를 캡처합니다. 기본적으로 참조를 캡처하며 변경 가능합니다. 명시적으로 캡처 시점의 값을 복사할 수 있습니다.

## 고차 함수 심화

```kotlin
// 고차 함수 체이닝
val numbers = listOf(1, 2, 3, 4, 5)

val result = numbers
    .map { it * 2 }
    .filter { it % 2 == 0 }
    .map { it * it }
    .reduce { acc, n -> acc + n }

println(result)  // 120

// 사용자 정의 고차 함수
fun <T, R> List<T>.customMap(transform: (T) -> R): List<R> {
    return map(transform)
}

fun <T> List<T>.customFilter(predicate: (T) -> Boolean): List<T> {
    return filter(predicate)
}

val squared = numbers.customMap { it * it }
val evens = numbers.customFilter { it % 2 == 0 }
```

고차 함수 체이닝으로 복잡한 변환을 수행합니다. `map`, `filter`, `reduce` 등을 체이닝할 수 있습니다. 사용자 정의 고차 함수를 작성할 수 있습니다.

## 함수 합성

```kotlin
// 함수 합성
fun <A, B, C> compose(f: (B) -> C, g: (A) -> B): (A) -> C {
    return { x -> f(g(x)) }
}

fun <A, B, C> andThen(f: (A) -> B, g: (B) -> C): (A) -> C {
    return { x -> g(f(x)) }
}

val add: (Int) -> Int = { it + 1 }
val multiply: (Int) -> Int = { it * 2 }

val composed = compose(multiply, add)
println(composed(5))  // (5 + 1) * 2 = 12

val andThened = andThen(add, multiply)
println(andThened(5))  // (5 + 1) * 2 = 12
```

함수 합성은 여러 함수를 체이닝하여 새로운 함수를 만듭니다. `compose`는 오른쪽에서 왼쪽으로, `andThen`은 왼쪽에서 오른쪽으로 실행합니다. 함수형 프로그래밍의 핵심입니다.

## 커링

```kotlin
// 커링
fun <A, B, C> curry(f: (A, B) -> C): (A) -> (B) -> C {
    return { a -> { b -> f(a, b) } }
}

fun add(a: Int, b: Int): Int = a + b

val curriedAdd = curry(::add)
val addFive = curriedAdd(5)
println(addFive(10))  // 15

// 3개 인자 커링
fun <A, B, C, D> curry3(f: (A, B, C) -> D): (A) -> (B) -> (C) -> D {
    return { a -> { b -> { c -> f(a, b, c) } } }
}

fun multiply(a: Int, b: Int, c: Int): Int = a * b * c

val curriedMultiply = curry3(::multiply)
val multiplyByTwo = curriedMultiply(2)
val multiplyByTwoAndThree = multiplyByTwo(3)
println(multiplyByTwoAndThree(4))  // 24
```

커링은 다중 인자를 단일 인자 함수로 변환합니다. 부분 적용을 쉽게 할 수 있습니다. 함수형 프로그래밍에서 유용합니다.

## 부분 적용

```kotlin
// 부분 적용
fun <A, B, C> partial(f: (A, B) -> C, a: A): (B) -> C {
    return { b -> f(a, b) }
}

fun subtract(a: Int, b: Int): Int = a - b

val subtractFromTen = partial(::subtract, 10)
println(subtractFromTen(3))  // 7

// 여러 부분 적용
fun <A, B, C, D> partial2(f: (A, B, C) -> D, a: A, b: B): (C) -> D {
    return { c -> f(a, b, c) }
}

fun sum(a: Int, b: Int, c: Int): Int = a + b + c

val sumOneAndTwo = partial2(::sum, 1, 2)
println(sumOneAndTwo(3))  // 6
```

부분 적용은 일부 인자를 미리 설정하여 새로운 함수를 만듭니다. 재사용 가능한 함수를 만들 수 있습니다. 커링과 함께 사용됩니다.

## 순수 함수

```kotlin
// 순수 함수 (부작용 없음)
fun pureAdd(a: Int, b: Int): Int = a + b

// 불순수 함수 (부작용 있음)
var counter = 0
fun impureAdd(a: Int, b: Int): Int {
    counter++
    return a + b
}

// 순수 함수 권장
val result1 = pureAdd(10, 20)
val result2 = pureAdd(10, 20)
println(result1 == result2)  // true

val result3 = impureAdd(10, 20)
val result4 = impureAdd(10, 20)
println(result3 == result4)  // false (counter가 증가함)
```

순수 함수는 부작용이 없는 함수입니다. 같은 입력에 대해 항상 같은 출력을 반환합니다. 불순수 함수는 부작용이 있습니다. 함수형 프로그래밍에서는 순수 함수를 권장합니다.

## 불변성

```kotlin
// 불변 데이터
data class ImmutablePerson(val name: String, val age: Int)

val person1 = ImmutablePerson("Wolhyong", 30)
val person2 = person1.copy(age = 31)

println(person1)  // ImmutablePerson(name=Wolhyong, age=30)
println(person2)  // ImmutablePerson(name=Wolhyong, age=31)

// 불변 컬렉션
val list = listOf(1, 2, 3)
val modifiedList = list + 4

println(list)  // [1, 2, 3]
println(modifiedList)  // [1, 2, 3, 4]
```

불변성은 상태 변경을 방지합니다. `val`로 불변 프로퍼티를 정의합니다. `copy`로 새로운 객체를 생성합니다. 불변 컬렉션은 원본을 변경하지 않고 새 컬렉션을 반환합니다.

## 메모이제이션

```kotlin
// 메모이제이션
fun <T, R> memoize(f: (T) -> R): (T) -> R {
    val cache = mutableMapOf<T, R>()
    return { input ->
        cache.getOrPut(input) { f(input) }
    }
}

fun expensiveCalculation(n: Int): Int {
    println("계산 중...")
    return n * n
}

val memoizedCalculation = memoize(::expensiveCalculation)

println(memoizedCalculation(10))  // 계산 중... 100
println(memoizedCalculation(10))  // 100 (캐시됨)
```

메모이제이션은 함수 결과를 캐싱합니다. 반복 계산을 방지하여 성능을 향상합니다. 순수 함수에 적합합니다.

## 함수 참조

```kotlin
// 함수 참조
fun greet(name: String): String = "Hello, $name!"

val greetFunction = ::greet
println(greetFunction("Wolhyong"))  // Hello, Wolhyong!

// 확장 함수 참조
val numbers = listOf(1, 2, 3, 4, 5)
val squared = numbers.map(Int::toDouble)
println(squared)  // [1.0, 2.0, 3.0, 4.0, 5.0]

// 생성자 참조
data class Person(val name: String, val age: Int)

val people = listOf("Alice", "Bob", "Charlie")
val personObjects = people.map(::Person)
println(personObjects)  // [Person(name=Alice, age=null), ...]
```

함수 참조는 함수를 값으로 전달합니다. `::functionName` 형식입니다. 확장 함수, 생성자도 참조할 수 있습니다. 고차 함수에 전달할 때 유용합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 순수 함수와 불순수 함수 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

순수 함수를 우선 사용해야 합니다. 부작용이 없으며 테스트 가능성이 높습니다. 불순수 함수는 I/O, 상태 변경이 필요할 때만 사용합니다. 함수형 프로그래밍에서는 순수 함수를 권장합니다.
</details>

<details>
<summary><strong>Q> 커링과 부분 적용 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

커링은 다중 인자를 단일 인자로 변환할 때 사용합니다. 부분 적용은 일부 인자를 미리 설정할 때 사용합니다. 커링은 더 일반적이며 부분 적용은 특정 상황에 사용됩니다.
</details>

<details>
<summary><strong>Q> 함수 합성은 언제 사용해야 하나요?</strong></summary>

함수 합성은 여러 함수를 체이닝할 때 사용합니다. 데이터 파이프라인, 변환 체인에 유용합니다. 코드 재사용성을 높이며 가독성이 좋습니다. 복잡한 변환 로직에 사용합니다.
</details>

<details>
<summary><strong>Q> 메모이제이션은 언제 사용해야 하나요?</strong></summary>

메모이제이션은 비용 있는 계산에 사용합니다. 반복 계산을 방지하여 성능을 향상합니다. 순수 함수에 적합합니다. 재귀, 동적 프로그래밍에 유용합니다.
</details>

<details>
<summary><strong>Q> 불변성은 왜 중요한가요?</strong></summary>

불변성은 스레드 안전성을 높이며 버그를 줄입니다. 상태 변경을 추적하기 쉽습니다. 함수형 프로그래밍에서는 필수적입니다. `val`을 우선 사용해야 합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **람다 캡처** | 외부 변수 참조 | 참조/복사 |
| **고차 함수** | 함수 매개변수 | map, filter |
| **함수 합성** | 함수 체이닝 | compose, andThen |
| **커링** | 다중 인자 변환 | 단일 인자 |
| **부분 적용** | 일부 인자 설정 | 재사용 가능 |
| **순수 함수** | 부작용 없음 | 같은 입력, 같은 출력 |
| **불순수 함수** | 부작용 있음 | 상태 변경 |
| **불변성** | 상태 변경 방지 | val, copy |
| **메모이제이션** | 결과 캐싱 | 성능 향상 |
| **함수 참조** | ::functionName | 고차 함수 전달 |
| **compose** | 오른쪽→왼쪽 | f(g(x)) |
| **andThen** | 왼쪽→오른쪽 | g(f(x)) |


## 다음 수업

다음 글에서는 Kotlin 고급 — 안드로이드 개발, Activity, Fragment, ViewModel, LiveData를 배웁니다.
