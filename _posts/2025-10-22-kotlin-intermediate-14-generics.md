---
layout: post
title: "Kotlin 제네릭 — 제네릭 클래스, 제네릭 함수, 제네릭 인터페이스, 제네릭 제약, variance"
description: "Kotlin의 제네릭 시스템을 컴파일러 레벨에서 학습합니다. 제네릭은 타입 매개변수로 코드 재사용성과 타입 안전성을 동시에 제공합니다. 제네릭 클래스는 ClassName<T> 문법으로 정의하며 여러 타입 매개변수를 가질 수 있습니다. 제네릭 함수는 메서드 수준에서 타입 매개변수를 정의합니다. 제네릭 제약(where 절)은 타입 매개변수에 제약을 추가하며 where T : class, where T : UpperBound 등을 지정합니다. variance는 in, out 키워드로 공변성과 반공변성을 제어합니다. Kotlin의 제네릭은 컴파일 타임에 구체화되며 런타임에 타입 소거(Type Erasure)가 발생합니다."
date: 2025-10-22 10:00:00 +0900
category: kotlin
tags: [kotlin, generics, generic-constraints, variance, type-erasure, reified]
level: intermediate
---

Kotlin의 제네릭은 타입 안전성과 코드 재사용성을 동시에 제공하는 강력한 기능입니다.

> **핵심 정리** · 제네릭은 타입 매개변수로 코드 재사용성을 제공합니다. `where` 절로 타입 제약을 추가합니다. `in`, `out`으로 공변성을 제어합니다. 컴파일 타임에 구체화됩니다. 타입 소거가 발생합니다. `reified`로 타입 정보를 런타임에 유지할 수 있습니다.


## 수업 목표

- 제네릭 클래스와 함수를 이해합니다.
- 제네릭 인터페이스를 이해합니다.
- 제네릭 제약을 이해합니다.
- variance를 이해합니다.
- 타입 소거를 이해합니다.
- reified를 이해합니다.

## 제네릭 클래스

```kotlin
// 제네릭 클래스
class Box<T>(val value: T)

val intBox = Box(42)
val stringBox = Box("Hello")

println(intBox.value)  // 42
println(stringBox.value)  // Hello

// 여러 타입 매개변수
class Pair<K, V>(val key: K, val value: V)

val pair = Pair("key", 42)
println(pair.key)  // key
println(pair.value)  // 42
```

제네릭 클래스는 `ClassName<T>` 문법으로 정의합니다. 타입 매개변수 `T`는 컴파일 타임에 구체적인 타입으로 대체됩니다. 여러 타입 매개변수를 가질 수 있습니다.

## 제네릭 함수

```kotlin
// 제네릭 함수
fun <T> singleton(item: T): List<T> {
    return listOf(item)
}

val singleInt = singleton(42)
val singleString = singleton("Hello")

println(singleInt)  // [42]
println(singleString)  // [Hello]

// 여러 타입 매개변수
fun <K, V> createPair(key: K, value: V): Pair<K, V> {
    return Pair(key, value)
}

val pair = createPair("key", 42)
println(pair)  // (key, 42)
```

제네릭 함수는 메서드 수준에서 타입 매개변수를 정의합니다. `fun <T> methodName(param: T)` 형식입니다. 여러 타입 매개변수를 가질 수 있습니다. 비제네릭 클래스에서도 정의할 수 있습니다.

## 제네릭 인터페이스

```kotlin
// 제네릭 인터페이스
interface Repository<T> {
    fun getById(id: Int): T?
    fun getAll(): List<T>
    fun save(entity: T)
}

// 구현
class UserRepository : Repository<User> {
    private val users = mutableListOf<User>()

    override fun getById(id: Int): User? {
        return users.find { it.id == id }
    }

    override fun getAll(): List<User> {
        return users.toList()
    }

    override fun save(entity: User) {
        users.add(entity)
    }
}

data class User(val id: Int, val name: String)
```

제네릭 인터페이스는 타입 매개변수를 가진 인터페이스입니다. `Interface<T>` 형식입니다. 구현 클래스는 구체적인 타입을 지정합니다. 타입 안전한 계약을 정의할 수 있습니다.

## 제네릭 제약

```kotlin
// where 절로 제약 추가
fun <T : Comparable<T>> max(a: T, b: T): T {
    return if (a > b) a else b
}

val maxInt = max(10, 20)
val maxString = max("Apple", "Banana")

println(maxInt)  // 20
println(maxString)  // Banana

// 여러 제약
fun <T> process(item: T) where T : Comparable<T>, T : CharSequence {
    println(item)
}

// class 제약
class NumberBox<T : Number>(val value: T)

val intBox = NumberBox(42)
// val stringBox = NumberBox("Hello")  // 컴파일 에러
```

`where` 절로 타입 제약을 추가합니다. `where T : UpperBound`로 상위 타입을 지정합니다. 여러 제약을 결합할 수 있습니다. `class` 제약으로 참조 타입만 허용할 수 있습니다.

## variance

```kotlin
// 공변성 (out)
interface Producer<out T> {
    fun produce(): T
}

class StringProducer : Producer<String> {
    override fun produce(): String = "Hello"
}

// 공변성 허용
val producer: Producer<Any> = StringProducer()

// 반공변성 (in)
interface Consumer<in T> {
    fun consume(item: T)
}

class StringConsumer : Consumer<String> {
    override fun consume(item: String) {
        println(item)
    }
}

// 반공변성 허용
val consumer: Consumer<String> = object : Consumer<Any> {
    override fun consume(item: Any) {
        println(item)
    }
}
```

`out` 키워드는 공변성을 제어합니다. `in` 키워드는 반공변성을 제어합니다. 공변성은 출력 전용, 반공변성은 입력 전용에 사용됩니다. 제네릭 인터페이스와 대리자에 적용됩니다.

## 타입 소거

```kotlin
// 타입 소거 (Type Erasure)
fun <T> printType(item: T) {
    // 런타임에는 타입 정보가 없음
    println(item::class.simpleName)
}

printType(42)  // Int
printType("Hello")  // String

// reified로 타입 정보 유지
inline fun <reified T> printReifiedType(item: T) {
    println(T::class.simpleName)
}

printReifiedType(42)  // Int
printReifiedType("Hello")  // String
```

Kotlin의 제네릭은 타입 소거가 발생합니다. 런타임에는 타입 정보가 없습니다. `reified` 키워드로 타입 정보를 런타임에 유지할 수 있습니다. `inline` 함수에서만 사용할 수 있습니다.

## reified

```kotlin
// reified로 타입 검사
inline fun <reified T> checkType(item: Any) {
    if (item is T) {
        println("타입 일치: ${T::class.simpleName}")
    } else {
        println("타입 불일치")
    }
}

checkType<Int>(42)  // 타입 일치: Int
checkType<String>(42)  // 타입 불일치

// reified로 인스턴스 생성
inline fun <reified T> createInstance(): T {
    return T::class.java.getDeclaredConstructor().newInstance()
}

data class Person(val name: String)

val person = createInstance<Person>()
println(person)  // Person(name=null)
```

`reified` 키워드로 타입 정보를 런타임에 유지합니다. 타입 검사, 인스턴스 생성 등에 사용됩니다. `inline` 함수에서만 사용할 수 있습니다.

## 스타 프로젝션 타입

```kotlin
// 스타 프로젝션 타입
class Box<out T>(val value: T)

val stringBox: Box<String> = Box("Hello")
val anyBox: Box<Any> = stringBox  // 공변성 허용

// 스타 프로젝션 타입 사용
fun process(box: Box<Any>) {
    println(box.value)
}

process(anyBox)
```

스타 프로젝션 타입은 타입 매개변수를 하위 타입으로 제한합니다. `out T`는 공변성을 허용합니다. `in T`는 반공변성을 허용합니다. 제네릭 인터페이스와 클래스에 적용됩니다.

## 제네릭 컬렉션

```kotlin
// 제네릭 컬렉션 사용
val list: List<Int> = listOf(1, 2, 3)
val map: Map<String, Int> = mapOf("key" to 42)
val set: Set<Int> = setOf(1, 2, 3)

// 제네릭 컬렉션 함수
fun <T> firstOrNull(list: List<T>): T? {
    return list.firstOrNull()
}

val first = firstOrNull(list)
println(first)  // 1
```

Kotlin 표준 라이브러리는 풍부한 제네릭 컬렉션을 제공합니다. `List<T>`, `Map<K, V>`, `Set<T>` 등이 있습니다. 제네릭 함수로 타입 안전한 컬렉션 처리를 제공합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 제네릭은 언제 사용해야 하나요?</strong></summary>

제네릭은 다음 경우에 사용합니다: (1) 타입에 의존하지 않는 로직 (2) 컬렉션 (3) 유틸리티 메서드 (4) 팩토리 패턴. 타입 안전성과 코드 재사용성을 동시에 제공합니다. 비제네릭(object)보다 성능이 좋습니다.
</details>

<details>
<summary><strong>Q> 제네릭 제약은 왜 필요한가요?</strong></summary>

제네릭 제약은 타입 매개변수에 제약을 추가하여 컴파일 타임에 타입 안전성을 보장합니다. 예: `where T : class`는 참조 타입만 허용, `where T : UpperBound`는 상위 타입을 요구. 제약을 통해 해당 타입의 메서드를 호출할 수 있습니다.
</details>

<details>
<summary><strong>Q> variance는 언제 사용해야 하나요?</strong></summary>

variance는 제네릭 타입의 할당 호환성을 제어할 때 사용합니다. 공변성(`out`)은 읽기 전용 컬렉션에, 반공변성(`in`)은 쓰기 전용 컬렉션에 사용됩니다. 라이브러리 작성 시 고려해야 합니다.
</details>

<details>
<summary><strong>Q> reified는 언제 사용해야 하나요?</strong></summary>

`reified`는 런타임에 타입 정보가 필요할 때 사용합니다. 타입 검사, 인스턴스 생성, 리플렉션 등에 유용합니다. `inline` 함수에서만 사용할 수 있습니다. 타입 소거를 우회할 때 사용합니다.
</details>

<details>
<summary><strong>Q> 타입 소거는 왜 발생하나요?</strong></summary>

타입 소거는 Java와의 호환성을 위해 발생합니다. 런타임에는 제네릭 타입 정보가 없습니다. 모든 제네릭 타입이 Object로 변환됩니다. `reified`로 타입 정보를 유지할 수 있습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **제네릭 클래스** | ClassName<T> | 타입 매개변수 |
| **제네릭 함수** | fun <T> | 메서드 수준 |
| **제네릭 인터페이스** | Interface<T> | 계약 정의 |
| **where 절** | 타입 제약 | class, UpperBound |
| **out** | 공변성 | 출력 전용 |
| **in** | 반공변성 | 입력 전용 |
| **타입 소거** | 런타임 타입 없음 | Java 호환성 |
| **reified** | 타입 정보 유지 | inline 함수 |
| **스타 프로젝션** | 하위 타입 제한 | out/in |
| **List<T>** | 제네릭 컬렉션 | 타입 안전 |
| **Map<K,V>** | 키-값 쌍 | 제네릭 |
| **Set<T>** | 중복 없음 | 제네릭 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 람다 심화, 고차 함수, 함수형 프로그래밍, 함수 합성을 배웁니다.
