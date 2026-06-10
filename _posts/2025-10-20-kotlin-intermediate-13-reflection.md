---
layout: post
title: "Kotlin 리플렉션 — KClass, KProperty, 어노테이션, 동적 호출, KCallable"
description: "Kotlin의 리플렉션 시스템을 컴파일러 레벨에서 학습합니다. 리플렉션은 런타임에 타입 정보를 검사하고 동적으로 코드를 실행할 수 있게 합니다. KClass는 Kotlin 클래스의 리플렉션 정보를 제공하며 ::class로 접근합니다. KProperty는 프로퍼티의 리플렉션 정보를 제공하며 get(), set()로 접근합니다. 어노테이션은 메타데이터를 코드에 추가하며 @AnnotationName 문법을 사용합니다. 동적 호출은 call()로 메서드를 호출하며 KCallable로 함수, 프로퍼티, 생성자를 표현합니다. Kotlin은 Java의 java.lang.reflect와 kotlin.reflect 패키지를 활용합니다."
date: 2025-10-20 10:00:00 +0900
category: kotlin
tags: [kotlin, reflection, kclass, kproperty, annotations, dynamic-invocation]
level: intermediate
---

Kotlin의 리플렉션은 런타임에 타입 정보를 검사하고 동적으로 코드를 실행할 수 있게 합니다.

> **핵심 정리** · 리플렉션은 런타임 타입 검사를 제공합니다. `KClass`로 클래스 정보를 얻습니다. `KProperty`로 프로퍼티 정보를 얻습니다. 어노테이션으로 메타데이터를 추가합니다. `call()`로 동적으로 메서드를 호출합니다. `KCallable`로 함수, 프로퍼티, 생성자를 표현합니다.


## 수업 목표

- 리플렉션의 개념과 사용법을 이해합니다.
- KClass를 이해합니다.
- KProperty를 이해합니다.
- 어노테이션을 이해합니다.
- 동적 호출을 이해합니다.
- 리플렉션의 사용 사례를 이해합니다.

## KClass

```kotlin
// KClass 얻기
class Person(val name: String, val age: Int)

val kClass = Person::class
println(kClass)  // class Person
println(kClass.simpleName)  // Person
println(kClass.qualifiedName)  // Person

// 멤버 정보
val members = kClass.members
members.forEach { println(it.name) }

// 생성자 정보
val constructors = kClass.constructors
constructors.forEach { println(it.parameters) }
```

`::class`로 `KClass`를 얻습니다. `simpleName`, `qualifiedName`으로 클래스 이름을 가져옵니다. `members`, `constructors`로 멤버와 생성자 정보를 가져옵니다.

## KProperty

```kotlin
// KProperty 얻기
class Person(val name: String, var age: Int)

val person = Person("Wolhyong", 30)

// 프로퍼티 KProperty
val nameProperty = Person::name
val ageProperty = Person::age

// 프로퍼티 접근
println(nameProperty.get(person))  // Wolhyong
println(ageProperty.get(person))   // 30

// 프로퍼티 수정
ageProperty.set(person, 31)
println(ageProperty.get(person))   // 31
```

`ClassName::propertyName`로 `KProperty`를 얻습니다. `get()`, `set()`으로 프로퍼티에 접근합니다. 동적으로 프로퍼티를 읽고 쓸 수 있습니다.

## 어노테이션

```kotlin
// 어노테이션 정의
@Target(AnnotationTarget.CLASS)
annotation class Author(val name: String, val date: String = "")

// 어노테이션 사용
@Author("Wolhyong", "2025-10-20")
class Calculator {
    fun add(a: Int, b: Int) = a + b
}

// 어노테이션 읽기
val kClass = Calculator::class
val annotation = kClass.annotations.find { it is Author }
if (annotation is Author) {
    println("작성자: ${annotation.name}")
    println("날짜: ${annotation.date}")
}
```

`@AnnotationName`으로 어노테이션을 정의합니다. `@Target`으로 적용 대상을 지정합니다. `annotations`로 어노테이션을 읽습니다. 메타데이터를 추가하는 데 사용됩니다.

## 동적 호출

```kotlin
// 동적 메서드 호출
class Calculator {
    fun add(a: Int, b: Int) = a + b
    fun multiply(a: Int, b: Int) = a * b
}

val calculator = Calculator()
val kClass = calculator::class

// 메서드 찾기
val addMethod = kClass.members.find { it.name == "add" } as? KFunction<*>
if (addMethod != null) {
    val result = addMethod.call(calculator, 10, 20)
    println(result)  // 30
}
```

`call()`로 동적으로 메서드를 호출합니다. `members.find`로 메서드를 찾습니다. `KFunction`으로 함수를 표현합니다. 런타임에 메서드를 호출할 수 있습니다.

## KCallable

```kotlin
// KCallable로 함수, 프로퍼티, 생성자 표현
class Person(val name: String, val age: Int)

val kClass = Person::class

// 생성자 KCallable
val constructor = kClass.constructors.first()
val person = constructor.call("Wolhyong", 30)
println(person)  // Person(name=Wolhyong, age=30)

// 프로퍼티 KCallable
val nameProperty = Person::name
val name = nameProperty.call(person)
println(name)  // Wolhyong
```

`KCallable`은 함수, 프로퍼티, 생성자를 표현합니다. `call()`로 호출합니다. `constructors`로 생성자를, `members`로 멤버를 가져옵니다. 동적으로 호출할 수 있습니다.

## Java 리플렉션

```kotlin
import java.lang.reflect.Method

// Java 리플렉션
class Calculator {
    fun add(a: Int, b: Int) = a + b
}

val calculator = Calculator()
val javaClass = calculator.javaClass

// Java 메서드 호출
val method: Method = javaClass.getMethod("add", Int::class.java, Int::class.java)
val result = method.invoke(calculator, 10, 20)
println(result)  // 30
```

Kotlin은 Java의 `java.lang.reflect`를 활용할 수 있습니다. `javaClass`로 Java 클래스를 얻습니다. `getMethod`, `invoke`로 메서드를 호출합니다. Java 라이브러리와 상호 운용 가능합니다.

## 리플렉션 사용 사례

```kotlin
// JSON 직렬화
fun serialize(obj: Any): String {
    val kClass = obj::class
    val properties = kClass.members.filterIsInstance<KProperty1<Any, *>>()
    
    val map = properties.associate { prop ->
        prop.name to prop.get(obj)
    }
    
    return map.toString()
}

data class Person(val name: String, val age: Int)

val person = Person("Wolhyong", 30)
val serialized = serialize(person)
println(serialized)  // {name=Wolhyong, age=30}
```

리플렉션은 다음에 사용됩니다: (1) JSON 직렬화 (2) DI 컨테이너 (3) ORM (4) 단위 테스트 (5) 플러그인 시스템. 동적 코드 실행과 메타데이터 기반 프로그래밍을 가능하게 합니다.

## 리플렉션 성능

```kotlin
// 직접 접근
val person = Person("Wolhyong", 30)
val directAccess = person.name
println(directAccess)

// 리플렉션 접근
val kClass = person::class
val nameProperty = kClass.members.find { it.name == "name" } as? KProperty1<Person, *>
val reflectionAccess = nameProperty?.get(person)
println(reflectionAccess)
```

리플렉션은 성능 오버헤드가 있습니다. 직접 접근보다 느립니다. 핫 경로에서는 피하고 캐싱을 사용하여 최적화해야 합니다. 필요할 때만 사용해야 합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 리플렉션은 언제 사용해야 하나요?</strong></summary>

리플렉션은 다음 경우에 사용합니다: (1) 런타임에 타입 정보가 필요할 때 (2) 플러그인 시스템 (3) DI 컨테이너 (4) ORM (5) 직렬화. 하지만 성능 오버헤드가 있으므로 핫 경로에서는 피해야 합니다.
</details>

<details>
<summary><strong>Q> KClass와 javaClass 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`KClass`를 우선 사용해야 합니다. Kotlin 전용 리플렉션 정보를 제공합니다. `javaClass`는 Java 리플렉션에 사용합니다. Kotlin 코드에서는 `KClass`를 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 어노테이션은 언제 사용해야 하나요?</strong></summary>

어노테이션은 메타데이터가 필요할 때 사용합니다. 직렬화 제어, ORM 매핑, 단위 테스트, 보안, 로깅 등. 컴파일러와 런타임이 메타데이터를 읽어 동작을 제어합니다.
</details>

<details>
<summary><strong>Q> 동적 호출은 언제 사용해야 하나요?</strong></summary>

동적 호출은 런타임에 메서드를 결정할 때 사용합니다. 플러그인 시스템, 동적 프록시 등에 유용합니다. 성능 오버헤드가 있으므로 신중하게 사용해야 합니다.
</details>

<details>
<summary><strong>Q> 리플렉션 성능을 어떻게 최적화하나요?</strong></summary>

리플렉션 최적화 방법: (1) 캐싱: `KClass`, `KProperty`를 캐시 (2) 필요할 때만 사용 (3) 직접 접근 우선 (4) 코드 생성 사용. 핫 경로에서는 직접 접근을 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **리플렉션** | 런타임 타입 검사 | KClass |
| **::class** | KClass 얻기 | Kotlin 리플렉션 |
| **KClass** | 클래스 정보 | members, constructors |
| **KProperty** | 프로퍼티 정보 | get(), set() |
| **어노테이션** | 메타데이터 | @AnnotationName |
| **@Target** | 적용 대상 지정 | CLASS, FUNCTION |
| **동적 호출** | call() 메서드 | 런타임 결정 |
| **KCallable** | 함수/프로퍼티/생성자 | call() |
| **javaClass** | Java 클래스 | java.lang.reflect |
| **getMethod** | Java 메서드 찾기 | invoke() |
| **사용 사례** | 직렬화, DI, ORM | 동적 코드 |
| **성능 오버헤드** | 느림 | 캐싱으로 최적화 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 제네릭, 제네릭 클래스, 제네릭 함수, 제네릭 제약, variance를 배웁니다.
