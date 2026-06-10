---
layout: post
title: "Kotlin 널 안전성 심화 — 스마트 캐스트, 안전한 캐스트, 널 가능성 어노테이션, 플랫폼 타입"
description: "Kotlin의 널 안전성 시스템을 컴파일러 레벨에서 학습합니다. 스마트 캐스트는 타입 검사 후 자동으로 캐스트를 수행하며 is 연산자로 타입을 확인합니다. 안전한 캐스트는 as? 연산자로 캐스트 실패 시 null을 반환합니다. 널 가능성 어노테이션은 @Nullable, @NotNull으로 Java 코드와 상호 운용성을 제공합니다. 플랫폼 타입은 Java 코드에서 널 가능성 정보가 없는 타입으로 Kotlin에서는 널 가능으로 처리됩니다. require, check, assert 함수로 사전 조건을 검사합니다. let 함수로 널 체크 후 안전하게 실행할 수 있습니다."
date: 2025-10-03 10:00:00 +0900
category: kotlin
tags: [kotlin, null-safety, smart-cast, safe-cast, platform-types, nullability-annotations]
level: basic
---

Kotlin의 널 안전성 시스템은 컴파일 타임에 널 포인터 예외를 방지하며 스마트 캐스트와 안전한 캐스트를 제공합니다.

> **핵심 정리** · 스마트 캐스트는 `is` 연산자로 타입 확인 후 자동 캐스트합니다. `as?`로 안전한 캐스트를 수행합니다. `@Nullable`, `@NotNull`으로 Java 상호 운용성을 제공합니다. 플랫폼 타입은 널 가능으로 처리됩니다. `require`, `check`, `assert`로 사전 조건을 검사합니다. `let`으로 널 체크 후 안전하게 실행합니다.


## 수업 목표

- 스마트 캐스트를 이해합니다.
- 안전한 캐스트를 이해합니다.
- 널 가능성 어노테이션을 이해합니다.
- 플랫폼 타입을 이해합니다.
- 사전 조건 함수를 이해합니다.
- let 함수를 이해합니다.

## 스마트 캐스트

```kotlin
// 기본 스마트 캐스트
val obj: Any = "Hello"

if (obj is String) {
    // obj는 자동으로 String으로 캐스트됨
    println(obj.length)  // 5
}

// when에서 스마트 캐스트
val value: Any = 42

when (value) {
    is Int -> println("정수: ${value + 1}")
    is String -> println("문자열: ${value.length}")
    else -> println("기타")
}

// && 연산자와 스마트 캐스트
val obj2: Any? = "Hello"

if (obj2 != null && obj2 is String) {
    println(obj2.length)  // 5
}

// !is 연산자
val obj3: Any = 42

if (obj3 !is String) {
    println("문자열이 아님")
}
```

스마트 캐스트는 타입 검사 후 자동으로 캐스트를 수행합니다. `is` 연산자로 타입을 확인합니다. `when`, `&&`, `!is` 등에서 스마트 캐스트가 작동합니다. 명시적 캐스트가 필요 없습니다.

## 안전한 캐스트

```kotlin
// 기본 캐스트 (ClassCastException 가능)
val obj: Any = "Hello"
val str = obj as String  // 성공

val obj2: Any = 42
val str2 = obj2 as String  // ClassCastException

// 안전한 캐스트
val obj3: Any = "Hello"
val str3 = obj3 as? String  // "Hello"

val obj4: Any = 42
val str4 = obj4 as? String  // null

// 안전한 캐스트와 엘비스 연산자
val obj5: Any = 42
val str5 = obj5 as? String ?: "기본값"
println(str5)  // 기본값
```

`as`는 기본 캐스트로 실패 시 `ClassCastException`을 발생시킵니다. `as?`는 안전한 캐스트로 실패 시 `null`을 반환합니다. 엘비스 연산자(`?:`)와 함께 사용하여 기본값을 제공할 수 있습니다.

## 널 가능성 어노테이션

```kotlin
// Java 코드
// @Nullable String getNullableName()
// @NotNull String getNotNullName()

// Kotlin에서 사용
val nullableName: String? = javaObject.getNullableName()
val notNullName: String = javaObject.getNotNullName()

// Kotlin에서 Java 코드 호출
// @Nullable 어노테이션이 있으면 String?로 처리
// @NotNull 어노테이션이 있으면 String으로 처리
// 어노테이션이 없으면 플랫폼 타입으로 처리
```

`@Nullable`, `@NotNull` 어노테이션은 Java 코드와 상호 운용성을 제공합니다. `@Nullable`은 널 가능, `@NotNull`은 널 불가능으로 처리합니다. 어노테이션이 없으면 플랫폼 타입으로 처리됩니다.

## 플랫폼 타입

```kotlin
// Java 코드에서 널 가능성 정보가 없는 타입
// String getName()  // 어노테이션 없음

// Kotlin에서는 널 가능으로 처리
val name: String? = javaObject.getName()

// 명시적 선언
val nameNotNull: String = javaObject.getName()  // 컴파일 경고
val nameNullable: String? = javaObject.getName()  // 명시적 널 가능
```

플랫폼 타입은 Java 코드에서 널 가능성 정보가 없는 타입입니다. Kotlin에서는 널 가능(`T?`)으로 처리됩니다. 명시적으로 타입을 선언하여 경고를 줄일 수 있습니다.

## 사전 조건 함수

```kotlin
// require - 인자 검증
fun setAge(age: Int) {
    require(age >= 0) { "나이는 0 이상이어야 합니다." }
    println("나이: $age")
}

setAge(30)  // 나이: 30
// setAge(-1)  // IllegalArgumentException

// check - 상태 검증
class Connection {
    private var connected = false

    fun sendData(data: String) {
        check(connected) { "연결되지 않음" }
        println("데이터 전송: $data")
    }

    fun connect() {
        connected = true
    }
}

val connection = Connection()
// connection.sendData("Hello")  // IllegalStateException
connection.connect()
connection.sendData("Hello")  // 데이터 전송: Hello

// assert - 개발 중 검증
fun calculate(x: Int, y: Int): Int {
    assert(x > 0) { "x는 양수여야 함" }
    assert(y > 0) { "y는 양수여야 함" }
    return x + y
}

calculate(10, 20)  // 30
// calculate(-1, 20)  // AssertionError (assert 활성화 시)
```

`require`는 인자 검증에 사용합니다. `IllegalArgumentException`을 발생시킵니다. `check`는 상태 검증에 사용합니다. `IllegalStateException`을 발생시킵니다. `assert`는 개발 중 검증에 사용합니다. `AssertionError`를 발생시킵니다.

## let 함수

```kotlin
// let 함수
val name: String? = "Wolhyong"

name?.let { nonNullName ->
    println("이름: $nonNullName")
}

// 체이닝
val result = name?.let {
    println("이름: $it")
    it.length
}
println(result)  // 7

// 여러 널 체크
val firstName: String? = "Wolhyong"
val lastName: String? = "Greyhacker"

firstName?.let { first ->
    lastName?.let { last ->
        println("전체 이름: $first $last")
    }
}
```

`let` 함수는 널 체크 후 안전하게 실행합니다. `?.let`으로 널이 아닐 때만 실행됩니다. 체이닝하여 여러 널 체크를 수행할 수 있습니다.

## also 함수

```kotlin
// also 함수
val person = Person().also {
    it.name = "Wolhyong"
    it.age = 30
}

println(person.name)  // Wolhyong
println(person.age)   // 30

// 체이닝
val result = "Hello".also {
    println("원본: $it")
}.uppercase()
println(result)  // HELLO
```

`also` 함수는 객체를 반환하며 부작용을 수행합니다. 초기화, 로깅 등에 사용됩니다. 체이닝하여 여러 작업을 수행할 수 있습니다.

## apply 함수

```kotlin
// apply 함수
val person = Person().apply {
    name = "Wolhyong"
    age = 30
}

println(person.name)  // Wolhyong
println(person.age)   // 30

// 체이닝
val result = StringBuilder().apply {
    append("Hello")
    append(", ")
    append("World")
}.toString()
println(result)  // Hello, World
```

`apply` 함수는 객체를 반환하며 프로퍼티를 설정합니다. 객체 초기화에 사용됩니다. 체이닝하여 여러 작업을 수행할 수 있습니다.

## with 함수

```kotlin
// with 함수
val person = Person("Wolhyong", 30)

with(person) {
    println("이름: $name")
    println("나이: $age")
}

// 체이닝
val result = with(StringBuilder()) {
    append("Hello")
    append(", ")
    append("World")
    toString()
}
println(result)  // Hello, World
```

`with` 함수는 객체를 받아 람다 내에서 사용합니다. 여러 작업을 수행할 때 사용됩니다. 체이닝하여 결과를 반환할 수 있습니다.

## run 함수

```kotlin
// run 함수
val person = Person("Wolhyong", 30)

val result = person.run {
    println("이름: $name")
    println("나이: $age")
    age + 10
}
println(result)  // 40

// 널 체크와 함께
val person2: Person? = Person("Wolhyong", 30)

val result2 = person2?.run {
    println("이름: $name")
    age + 10
}
println(result2)  // 40
```

`run` 함수는 객체를 받아 람다 결과를 반환합니다. 널 체크와 함께 사용할 수 있습니다. 여러 작업을 수행하고 결과를 반환할 때 사용됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 스마트 캐스트는 언제 작동하나요?</strong></summary>

스마트 캐스트는 다음 조건에서 작동합니다: (1) `val` 프로퍼티 (2) `is` 연산자로 타입 확인 (3) 확인 후 변경되지 않음. `var` 프로퍼티는 변경 가능하므로 스마트 캐스트가 작동하지 않을 수 있습니다.
</details>

<details>
<summary><strong>Q> as와 as? 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`as?`를 사용해야 합니다. 안전한 캐스트로 실패 시 `null`을 반환합니다. `as`는 실패 시 `ClassCastException`을 발생시킵니다. 예외 처리를 피하기 위해 `as?`를 우선 사용해야 합니다.
</details>

<details>
<summary><strong>Q> require, check, assert 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`require`는 인자 검증에 사용합니다. `check`는 상태 검증에 사용합니다. `assert`는 개발 중 검증에 사용합니다. 각각 다른 예외를 발생시키며 용도가 다릅니다.
</details>

<details>
<summary><strong>Q> let, also, apply, with, run 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`let`은 널 체크 후 실행에 사용합니다. `also`는 부작용에 사용합니다. `apply`는 객체 초기화에 사용합니다. `with`는 여러 작업에 사용합니다. `run`은 결과 반환에 사용합니다. 각각 다른 용도가 있습니다.
</details>

<details>
<summary><strong>Q> 플랫폼 타입은 왜 문제가 되나요?</strong></summary>

플랫폼 타입은 널 가능성 정보가 없어 컴파일러가 널 체크를 수행할 수 없습니다. 런타임에 `NullPointerException`이 발생할 수 있습니다. 명시적으로 타입을 선언하여 문제를 줄일 수 있습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **스마트 캐스트** | is 연산자 후 자동 캐스트 | val 프로퍼티 |
| **as** | 기본 캐스트 | ClassCastException |
| **as?** | 안전한 캐스트 | null 반환 |
| **@Nullable** | 널 가능 어노테이션 | Java 상호 운용 |
| **@NotNull** | 널 불가능 어노테이션 | Java 상호 운용 |
| **플랫폼 타입** | 널 가능성 정보 없음 | 널 가능 처리 |
| **require** | 인자 검증 | IllegalArgumentException |
| **check** | 상태 검증 | IllegalStateException |
| **assert** | 개발 중 검증 | AssertionError |
| **let** | 널 체크 후 실행 | ?.let |
| **also** | 부작용 수행 | 객체 반환 |
| **apply** | 객체 초기화 | 프로퍼티 설정 |
| **with** | 여러 작업 수행 | 람다 내 사용 |
| **run** | 결과 반환 | 람다 결과 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 컬렉션, List, Set, Map, 시퀀스, 컬렉션 함수를 배웁니다.
