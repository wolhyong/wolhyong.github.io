---
layout: post
title: "Kotlin 확장 함수 — 확장 함수, 확장 프로퍼티, 연산자 오버로딩, 중위 함수"
description: "Kotlin의 확장 시스템을 컴파일러 레벨에서 학습합니다. 확장 함수는 기존 클래스에 새로운 함수를 추가하며 ClassName.functionName 문법으로 정의합니다. 확장 프로퍼티는 기존 클래스에 새로운 프로퍼티를 추가하며 val/var로 정의합니다. 연산자 오버로딩은 operator 키워드로 연산자를 재정의하며 plus, minus, times 등을 구현합니다. 중위 함수는 infix 키워드로 중위 표기법을 지원하며 to, until 등이 예입니다. 확장은 상속 없이 기능을 확장할 수 있으며 정적 디스패치로 컴파일됩니다."
date: 2025-10-08 10:00:00 +0900
category: kotlin
tags: [kotlin, extensions, extension-functions, extension-properties, operator-overloading, infix-functions]
level: intermediate
---

Kotlin의 확장 시스템은 상속 없이 기존 클래스에 기능을 추가할 수 있게 합니다.

> **핵심 정리** · 확장 함수는 `ClassName.functionName`으로 정의합니다. 확장 프로퍼티는 `val/var`로 정의합니다. `operator`로 연산자를 재정의합니다. `infix`로 중위 표기법을 지원합니다. 상속 없이 기능을 확장합니다. 정적 디스패치로 컴파일됩니다.


## 수업 목표

- 확장 함수를 이해하고 작성할 수 있습니다.
- 확장 프로퍼티를 이해하고 작성할 수 있습니다.
- 연산자 오버로딩을 이해합니다.
- 중위 함수를 이해합니다.
- 확장의 내부 동작을 이해합니다.

## 확장 함수

```kotlin
// String 확장 함수
fun String.isLong(): Boolean {
    return this.length > 10
}

val text = "Hello, World!"
println(text.isLong())  // true

val shortText = "Hi"
println(shortText.isLong())  // false

// Int 확장 함수
fun Int.isEven(): Boolean {
    return this % 2 == 0
}

val number = 4
println(number.isEven())  // true

// List 확장 함수
fun <T> List<T>.customFilter(predicate: (T) -> Boolean): List<T> {
    val result = mutableListOf<T>()
    for (item in this) {
        if (predicate(item)) {
            result.add(item)
        }
    }
    return result
}

val numbers = listOf(1, 2, 3, 4, 5)
val evens = numbers.customFilter { it % 2 == 0 }
println(evens)  // [2, 4]
```

확장 함수는 기존 클래스에 새로운 함수를 추가합니다. `ClassName.functionName` 형식으로 정의합니다. `this`로 수신 객체에 접근합니다. 제네릭으로 유연한 확장 함수를 정의할 수 있습니다.

## 확장 프로퍼티

```kotlin
// String 확장 프로퍼티
val String.isLong: Boolean
    get() = this.length > 10

val text = "Hello, World!"
println(text.isLong)  // true

// List 확장 프로퍼티
val <T> List<T>.customSize: Int
    get() = this.size

val numbers = listOf(1, 2, 3)
println(numbers.customSize)  // 3

// 변경 가능 확장 프로퍼티 (지원하지 않음)
// 확장 프로퍼티는 backing field를 가질 수 없으므로 var는 제한적
```

확장 프로퍼티는 기존 클래스에 새로운 프로퍼티를 추가합니다. `val`로 읽기 전용, `var`로 변경 가능 프로퍼티를 정의할 수 있습니다. backing field를 가질 수 없으므로 `var`는 제한적입니다.

## 연산자 오버로딩

```kotlin
// Point 클래스
data class Point(val x: Int, val y: Int)

// plus 연산자 오버로딩
operator fun Point.plus(other: Point): Point {
    return Point(x + other.x, y + other.y)
}

val p1 = Point(1, 2)
val p2 = Point(3, 4)
val p3 = p1 + p2
println(p3)  // Point(x=4, y=6)

// minus 연산자 오버로딩
operator fun Point.minus(other: Point): Point {
    return Point(x - other.x, y - other.y)
}

val p4 = p1 - p2
println(p4)  // Point(x=-2, y=-2)

// times 연산자 오버로딩
operator fun Point.times(scalar: Int): Point {
    return Point(x * scalar, y * scalar)
}

val p5 = p1 * 2
println(p5)  // Point(x=2, y=4)

// unary minus
operator fun Point.unaryMinus(): Point {
    return Point(-x, -y)
}

val p6 = -p1
println(p6)  // Point(x=-1, y=-2)

// equals 연산자 오버로딩
data class Person(val name: String, val age: Int) {
    operator fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Person) return false
        return name == other.name && age == other.age
    }
}
```

`operator` 키워드로 연산자를 재정의합니다. `plus`, `minus`, `times`, `unaryMinus` 등을 구현할 수 있습니다. `equals`, `hashCode`, `compareTo` 등도 재정의할 수 있습니다.

## 중위 함수

```kotlin
// 중위 함수 정의
infix fun Int.add(other: Int): Int {
    return this + other
}

val result = 5 add 3
println(result)  // 8

// to는 이미 정의된 중위 함수
val pair = 1 to "One"
println(pair)  // (1, One)

// until은 이미 정의된 중위 함수
for (i in 1 until 5) {
    println(i)  // 1, 2, 3, 4
}

// 사용자 정의 중위 함수
infix fun String.or(other: String): String {
    return "$this or $other"
}

val result2 = "Option A" or "Option B"
println(result2)  // Option A or Option B
```

`infix` 키워드로 중위 표기법을 지원합니다. `function` 대신 `arg1 function arg2` 형식으로 호출할 수 있습니다. `to`, `until` 등이 예입니다. 사용자 정의 중위 함수를 작성할 수 있습니다.

## 확장 함수의 제한

```kotlin
// 확장 함수는 기존 멤버를 오버라이드할 수 없음
class MyClass {
    fun greet() = "Hello"
}

fun MyClass.greet() = "Hi"  // 컴파일 에러: 이름 충돌

// 해결: 다른 이름 사용
fun MyClass.greetLoudly() = "HELLO"

val obj = MyClass()
println(obj.greet())  // Hello
println(obj.greetLoudly())  // HELLO
```

확장 함수는 기존 멤버를 오버라이드할 수 없습니다. 이름 충돌 시 컴파일 에러가 발생합니다. 다른 이름을 사용하여 해결할 수 있습니다.

## 확장 함수의 정적 디스패치

```kotlin
open class Animal {
    open fun makeSound() = "동물 소리"
}

class Dog : Animal() {
    override fun makeSound() = "멍멍"
}

fun Animal.makeSoundExtension() = "확장: ${makeSound()}"

val animal: Animal = Dog()
println(animal.makeSound())  // 멍멍 (다형성)
println(animal.makeSoundExtension())  // 확장: 동물 소리 (정적 디스패치)
```

확장 함수는 정적 디스패치로 컴파일됩니다. 선언된 타입에 따라 호출됩니다. 다형성이 적용되지 않습니다. 런타임 타입이 아닌 컴파일 타입에 따라 결정됩니다.

## 확장 함수와 멤버 함수

```kotlin
class MyClass {
    fun greet() = "멤버 함수"
}

fun MyClass.greet() = "확장 함수"  // 컴파일 에러

// 해결: 다른 이름
fun MyClass.greetExtension() = "확장 함수"

val obj = MyClass()
println(obj.greet())  // 멤버 함수
println(obj.greetExtension())  // 확장 함수
```

확장 함수와 멤버 함수가 이름이 같으면 멤버 함수가 우선합니다. 확장 함수는 다른 이름을 사용해야 합니다. 이름 충돌을 피하는 것이 좋습니다.

## 확장 함수의 사용 사례

```kotlin
// 문자열 유틸리티
fun String.isEmail(): Boolean {
    return this.contains("@") && this.contains(".")
}

val email = "test@example.com"
println(email.isEmail())  // true

// 숫자 유틸리티
fun Int.isPrime(): Boolean {
    if (this <= 1) return false
    for (i in 2..Math.sqrt(this.toDouble()).toInt()) {
        if (this % i == 0) return false
    }
    return true
}

val prime = 7
println(prime.isPrime())  // true

// 컬렉션 유틸리티
fun <T> List<T>.randomOrNull(): T? {
    if (this.isEmpty()) return null
    return this[(Math.random() * size).toInt()]
}

val list = listOf(1, 2, 3, 4, 5)
println(list.randomOrNull())  // 랜덤 요소
```

확장 함수는 유틸리티 함수에 유용합니다. 문자열, 숫자, 컬렉션 등에 기능을 추가할 수 있습니다. 코드 재사용성을 높입니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 확장 함수와 상속 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

확장 함수를 우선 사용해야 합니다. 상속 없이 기능을 추가할 수 있습니다. 다형성이 필요하면 상속을 사용합니다. 확장 함수는 정적 디스패치이므로 다형성이 적용되지 않습니다.
</details>

<details>
<summary><strong>Q> 확장 함수는 언제 사용해야 하나요?</strong></summary>

확장 함수는 유틸리티 함수에 사용합니다. 기존 클래스에 기능을 추가할 때 유용합니다. 상속이 불가능한 클래스에도 사용할 수 있습니다. 코드 재사용성을 높입니다.
</details>

<details>
<summary><strong>Q> 연산자 오버로딩은 언제 사용해야 하나요?</strong></summary>

연산자 오버로딩은 도메인 특정 연산에 사용합니다. 수학적 연산, 비교 연산 등에 유용합니다. 과도한 사용은 가독성을 떨어뜨립니다. 의미 있는 연산에만 사용해야 합니다.
</details>

<details>
<summary><strong>Q> 중위 함수는 언제 사용해야 하나요?</strong></summary>

중위 함수는 자연스러운 표현에 사용합니다. `to`, `until`처럼 읽기 쉬운 표현에 유용합니다. 과도한 사용은 혼란을 야기할 수 있습니다. 명확한 의미가 있을 때 사용해야 합니다.
</details>

<details>
<summary><strong>Q> 확장 프로퍼티는 언제 사용해야 하나요?</strong></summary>

확장 프로퍼티는 계산된 속성에 사용합니다. backing field가 필요 없는 속성에 유용합니다. 상태를 저장할 수 없으므로 제한적입니다. 읽기 전용 속성에 적합합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **확장 함수** | ClassName.functionName | 상속 없음 |
| **확장 프로퍼티** | val/var property | backing field 없음 |
| **operator** | 연산자 재정의 | plus, minus |
| **infix** | 중위 표기법 | arg1 func arg2 |
| **정적 디스패치** | 컴파일 타입 | 다형성 없음 |
| **this** | 수신 객체 | 확장 내 접근 |
| **제한** | 멤버 오버라이드 불가 | 이름 충돌 |
| **유틸리티** | 코드 재사용 | 문자열, 숫자 |
| **to** | Pair 생성 | 내장 중위 |
| **until** | 범위 끝 제외 | 내장 중위 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 범위, 진법, 비트 연산, 타입 캐스팅, 타입 검사를 배웁니다.
