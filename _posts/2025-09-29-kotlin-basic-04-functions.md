---
layout: post
title: "Kotlin 함수 — 람다, 고차 함수, 기본 매개변수, 명명된 인자, 가변 인자, 표현식 본문"
description: "Kotlin의 함수 시스템을 컴파일러 레벨에서 학습합니다. fun 키워드로 함수를 정의하며 표현식 본문으로 간결한 함수를 작성할 수 있습니다. 기본 매개변수와 명명된 인자로 유연한 함수 호출을 지원합니다. 가변 인자(vararg)로 여러 인자를 받을 수 있습니다. 람다는 익명 함수로 { -> } 문법을 사용하며 it로 단일 매개변수에 접근합니다. 고차 함수는 함수를 매개변수로 받거나 반환하며 map, filter, reduce 등을 제공합니다. 꼬리 재귀(tail recursion)은 tailrec 키워드로 스택 오버플로우를 방지합니다. 함수 타입은 (Type) -> ReturnType으로 정의하며 함수 리터럴로 전달할 수 있습니다."
date: 2025-09-29 10:00:00 +0900
category: kotlin
tags: [kotlin, functions, lambda, higher-order-functions, default-parameters, named-arguments, varargs]
level: basic
---

Kotlin의 함수 시스템은 간결하고 표현력이 풍부하며 함수형 프로그래밍을 지원합니다.

> **핵심 정리** · `fun`으로 함수를 정의합니다. 표현식 본문으로 간결한 함수를 작성합니다. 기본 매개변수와 명명된 인자를 지원합니다. `vararg`로 가변 인자를 받습니다. 람다는 익명 함수입니다. 고차 함수는 함수를 매개변수로 받거나 반환합니다. `tailrec`로 꼬리 재귀를 최적화합니다.


## 수업 목표

- 함수 정의와 사용법을 이해합니다.
- 람다를 이해하고 사용할 수 있습니다.
- 고차 함수를 이해합니다.
- 기본 매개변수와 명명된 인자를 이해합니다.
- 가변 인자를 이해합니다.
- 꼬리 재귀를 이해합니다.

## 함수 정의

```kotlin
// 기본 함수
fun greet(name: String): String {
    return "Hello, $name!"
}

// 표현식 본문
fun greetExpression(name: String): String = "Hello, $name!"

// 단일 표현식 (반환 타입 추론)
fun greetSingle(name: String) = "Hello, $name!"

// Unit 반환 (void)
fun greetVoid(name: String): Unit {
    println("Hello, $name!")
}

// Unit 반환 생략
fun greetVoidShort(name: String) {
    println("Hello, $name!")
}

// 호출
println(greet("Wolhyong"))
println(greetExpression("Wolhyong"))
println(greetSingle("Wolhyong"))
greetVoid("Wolhyong")
greetVoidShort("Wolhyong")
```

`fun` 키워드로 함수를 정의합니다. 표현식 본문(`=`)으로 간결한 함수를 작성할 수 있습니다. `Unit`은 반환 값이 없음을 나타내며 생략할 수 있습니다.

## 기본 매개변수

```kotlin
// 기본 매개변수
fun greetWithDefault(name: String = "World") = "Hello, $name!"

// 호출
println(greetWithDefault())  // Hello, World!
println(greetWithDefault("Wolhyong"))  // Hello, Wolhyong!

// 여러 기본 매개변수
fun createUser(
    name: String,
    age: Int = 30,
    city: String = "Seoul"
) = "이름: $name, 나이: $age, 도시: $city"

println(createUser("Wolhyong"))  // 이름: Wolhyong, 나이: 30, 도시: Seoul
println(createUser("Wolhyong", 25))  // 이름: Wolhyong, 나이: 25, 도시: Seoul
println(createUser("Wolhyong", 25, "Busan"))  // 이름: Wolhyong, 나이: 25, 도시: Busan
```

기본 매개변수는 함수 호출 시 인자를 생략할 수 있게 합니다. 매개변수 목록 끝에 위치해야 합니다. 유연한 함수 호출을 제공합니다.

## 명명된 인자

```kotlin
// 명명된 인자
fun createUser(name: String, age: Int, city: String) = "이름: $name, 나이: $age, 도시: $city"

// 순서대로 호출
println(createUser("Wolhyong", 30, "Seoul"))

// 명명된 인자 호출
println(createUser(name = "Wolhyong", age = 30, city = "Seoul"))

// 순서 변경
println(createUser(age = 30, city = "Seoul", name = "Wolhyong"))

// 기본 매개변수와 함께
fun createUserWithDefaults(name: String, age: Int = 30, city: String = "Seoul") = "이름: $name, 나이: $age, 도시: $city"

println(createUserWithDefaults(name = "Wolhyong"))  // 이름: Wolhyong, 나이: 30, 도시: Seoul
println(createUserWithDefaults(name = "Wolhyong", city = "Busan"))  // 이름: Wolhyong, 나이: 30, 도시: Busan
```

명명된 인자는 매개변수 순서를 자유롭게 지정할 수 있습니다. 가독성을 높이며 기본 매개변수와 함께 사용할 때 유용합니다.

## 가변 인자

```kotlin
// 가변 인자
fun greetAll(vararg names: String) {
    names.forEach { name ->
        println("Hello, $name!")
    }
}

greetAll("Alice", "Bob", "Charlie")

// 배열 전달
val names = arrayOf("Alice", "Bob", "Charlie")
greetAll(*names)  // 스프레드 연산자

// 일반 매개변수와 함께
fun greetWithPrefix(prefix: String, vararg names: String) {
    names.forEach { name ->
        println("$prefix, $name!")
    }
}

greetWithPrefix("Hello", "Alice", "Bob")
```

`vararg`로 가변 인자를 정의합니다. 여러 인자를 받을 수 있습니다. 스프레드 연산자(`*`)로 배열을 전달할 수 있습니다. 가변 인자는 마지막 매개변수여야 합니다.

## 람다

```kotlin
// 람다 정의
val greet: (String) -> String = { name -> "Hello, $name!" }
println(greet("Wolhyong"))

// 단일 매개변수 (it)
val greetIt: (String) -> String = { "Hello, $it!" }
println(greetIt("Wolhyong"))

// 람다 전달
fun processString(str: String, processor: (String) -> String): String {
    return processor(str)
}

val result = processString("hello") { it.uppercase() }
println(result)  // HELLO

// 람다 반환
fun getGreeter(): (String) -> String {
    return { name -> "Hello, $name!" }
}

val greeter = getGreeter()
println(greeter("Wolhyong"))
```

람다는 익명 함수입니다. `{ -> }` 문법으로 정의합니다. 단일 매개변수는 `it`로 접근할 수 있습니다. 함수 타입 `(Type) -> ReturnType`으로 정의합니다. 함수를 매개변수로 전달하거나 반환할 수 있습니다.

## 고차 함수

```kotlin
// map
val numbers = listOf(1, 2, 3, 4, 5)
val doubled = numbers.map { it * 2 }
println(doubled)  // [2, 4, 6, 8, 10]

// filter
val evens = numbers.filter { it % 2 == 0 }
println(evens)  // [2, 4]

// reduce
val sum = numbers.reduce { acc, n -> acc + n }
println(sum)  // 15

// fold
val product = numbers.fold(1) { acc, n -> acc * n }
println(product)  // 120

// forEach
numbers.forEach { println(it) }

// find
val found = numbers.find { it > 3 }
println(found)  // 4

// any, all
val hasEven = numbers.any { it % 2 == 0 }
println(hasEven)  // true

val allPositive = numbers.all { it > 0 }
println(allPositive)  // true
```

고차 함수는 함수를 매개변수로 받거나 반환합니다. `map`, `filter`, `reduce`, `fold`, `forEach`, `find`, `any`, `all` 등을 제공합니다. 함수형 프로그래밍의 핵심입니다.

## 사용자 정의 고차 함수

```kotlin
// 고차 함수 정의
fun <T, R> List<T>.customMap(transform: (T) -> R): List<R> {
    val result = mutableListOf<R>()
    for (item in this) {
        result.add(transform(item))
    }
    return result
}

val numbers = listOf(1, 2, 3, 4, 5)
val squared = numbers.customMap { it * it }
println(squared)  // [1, 4, 9, 16, 25]

// 여러 함수 매개변수
fun <T> List<T>.customFilter(
    predicate: (T) -> Boolean,
    transform: (T) -> T
): List<T> {
    val result = mutableListOf<T>()
    for (item in this) {
        if (predicate(item)) {
            result.add(transform(item))
        }
    }
    return result
}

val filtered = numbers.customFilter(
    predicate = { it % 2 == 0 },
    transform = { it * 2 }
)
println(filtered)  // [4, 8]
```

사용자 정의 고차 함수를 작성할 수 있습니다. 제네릭 타입으로 유연한 함수를 정의합니다. 여러 함수 매개변수를 받을 수 있습니다.

## 꼬리 재귀

```kotlin
// 일반 재귀 (스택 오버플로우 가능)
fun factorial(n: Int): Long {
    return if (n <= 1) 1 else n * factorial(n - 1)
}

// 꼬리 재귀 최적화
tailrec fun factorialTailRec(n: Int, acc: Long = 1): Long {
    return if (n <= 1) acc else factorialTailRec(n - 1, acc * n)
}

println(factorial(10))  // 3628800
println(factorialTailRec(10))  // 3628800

// 꼬리 재귀 조건: 재귀 호출이 마지막 연산이어야 함
tailrec fun sumTailRec(n: Int, acc: Int = 0): Int {
    return if (n <= 0) acc else sumTailRec(n - 1, acc + n)
}

println(sumTailRec(100))  // 5050
```

`tailrec` 키워드로 꼬리 재귀를 최적화합니다. 스택 오버플로우를 방지합니다. 재귀 호출이 마지막 연산이어야 합니다. 누적 인자(`acc`)를 사용하여 꼬리 재귀를 구현합니다.

## 지역 함수

```kotlin
// 지역 함수
fun outerFunction(x: Int): Int {
    fun innerFunction(y: Int): Int {
        return y * 2
    }
    return innerFunction(x) + 1
}

println(outerFunction(5))  // 11

// 지역 함수에서 외부 변수 접근
fun outerFunctionWithCapture(x: Int): Int {
    fun innerFunction(): Int {
        return x * 2
    }
    return innerFunction() + 1
}

println(outerFunctionWithCapture(5))  // 11
```

지역 함수는 함수 내부에 정의된 함수입니다. 외부 변수에 접근할 수 있습니다. 캡슐화와 코드 조직화에 유용합니다.

## 인라인 함수

```kotlin
// 인라인 함수
inline fun <T> measureTime(block: () -> T): T {
    val start = System.currentTimeMillis()
    val result = block()
    val end = System.currentTimeMillis()
    println("시간: ${end - start}ms")
    return result
}

val result = measureTime {
    var sum = 0
    for (i in 1..1000000) {
        sum += i
    }
    sum
}
```

`inline` 키워드로 함수를 인라인화합니다. 람다 오버헤드를 줄입니다. 성능이 중요한 고차 함수에 사용합니다. `noinline`, `crossinline`으로 인라인 제어를 할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 표현식 본문과 블록 본문 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

표현식 본문은 단일 표현식을 반환할 때 사용합니다. 간결하고 가독성이 좋습니다. 블록 본문은 여러 문장이 필요할 때 사용합니다. 복잡한 로직에 사용합니다. 대부분의 경우 표현식 본문을 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 람다와 익명 함수 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

람다를 사용해야 합니다. 더 간결하고 표현력이 풍부합니다. 익명 함수는 반환 타입을 명시해야 할 때 사용합니다. 대부분의 경우 람다를 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> tailrec는 언제 사용해야 하나요?</strong></summary>

`tailrec`는 재귀 깊이가 깊을 때 사용합니다. 스택 오버플로우를 방지합니다. 재귀 호출이 마지막 연산이어야 합니다. 누적 인자를 사용하여 꼬리 재귀를 구현해야 합니다.
</details>

<details>
<summary><strong>Q> inline 함수는 언제 사용해야 하나요?</strong></summary>

`inline` 함수는 람다 오버헤드를 줄여야 할 때 사용합니다. 성능이 중요한 고차 함수에 사용합니다. 과도한 사용은 코드 크기를 증가시킵니다. 핫 경로에서 고려해야 합니다.
</details>

<details>
<summary><strong>Q> vararg는 언제 사용해야 하나요?</strong></summary>

`vararg`는 가변 개수의 인자를 받을 때 사용합니다. 로깅, 포맷팅 등에 유용합니다. 마지막 매개변수여야 합니다. 스프레드 연산자로 배열을 전달할 수 있습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **fun** | 함수 정의 | 표현식 본문 |
| **표현식 본문** | = 연산자 | 간결한 함수 |
| **기본 매개변수** | = value | 인자 생략 가능 |
| **명명된 인자** | param = value | 순서 자유 |
| **vararg** | 가변 인자 | 스프레드 연산자 |
| **람다** | 익명 함수 | { -> } 문법 |
| **it** | 단일 매개변수 | 암시적 이름 |
| **고차 함수** | 함수 매개변수 | map, filter |
| **tailrec** | 꼬리 재귀 최적화 | 스택 오버플로우 방지 |
| **지역 함수** | 내부 함수 | 캡슐화 |
| **inline** | 인라인화 | 람다 오버헤드 감소 |
| **함수 타입** | (Type) -> ReturnType | 함수 리터럴 |


## 다음 수업

다음 글에서는 Kotlin 기본 — 클래스와 객체, 프로퍼티, 생성자, 상속, 인터페이스를 배웁니다.
