---
layout: post
title: "Kotlin 언어 소개 — JetBrains가 설계한 현대적 프로그래밍 언어의 철학과 생태계"
description: "Kotlin은 JetBrains가 설계한 현대적 프로그래밍 언어로 JVM, Android, Kotlin/Native, Kotlin/JS를 지원합니다. Kotlin은 널 안전성, 확장 함수, 데이터 클래스, 코루틴 등의 기능을 제공하며 Java와 100% 상호 운용 가능합니다. Kotlin은 간결하고 표현력이 풍부하며 안전한 코드를 작성할 수 있게 합니다. Kotlin 컴파일러는 Kotlin 코드를 Java 바이트코드로 변환하여 JVM에서 실행합니다. Kotlin은 Android 개발의 공식 언어이며 Spring Boot, Ktor 등의 프레임워크를 지원합니다."
date: 2025-09-22 10:00:00 +0900
category: kotlin
tags: [kotlin, introduction, jvm, android, coroutines, null-safety]
level: basic
---

Kotlin은 JetBrains가 설계한 현대적 프로그래밍 언어로 간결하고 안전하며 표현력이 풍부합니다.

> **핵심 정리** · Kotlin은 JVM, Android, Native, JS를 지원합니다. 널 안전성, 확장 함수, 데이터 클래스, 코루틴을 제공합니다. Java와 100% 상호 운용 가능합니다. 간결하고 표현력이 풍부하며 안전합니다. Android 개발의 공식 언어입니다.


## 수업 목표

- Kotlin의 철학과 설계 목표를 이해합니다.
- Kotlin의 플랫폼 지원을 이해합니다.
- Kotlin의 주요 기능을 이해합니다.
- Kotlin과 Java의 상호 운용성을 이해합니다.
- Kotlin 컴파일러의 동작을 이해합니다.
- Kotlin 생태계를 이해합니다.

## Kotlin의 철학

Kotlin은 다음 철학을 따릅니다: (1) 간결성: 불필요한 코드 제거 (2) 안전성: 널 포인터 예외 방지 (3) 상호 운용성: Java와 완벽한 통합 (4) 실용성: 실제 개발 문제 해결. JetBrains는 IntelliJ IDEA 개발자로 개발자 경험을 최우선으로 고려했습니다.

## 플랫폼 지원

Kotlin은 다중 플랫폼을 지원합니다: (1) Kotlin/JVM: Java 바이트코드로 컴파일 (2) Kotlin/Android: Android 개발 (3) Kotlin/Native: 네이티브 바이너리 (4) Kotlin/JS: JavaScript로 컴파일. Kotlin Multiplatform으로 코드를 공유할 수 있습니다.

## 널 안전성

```kotlin
// 널 불가능 타입
var name: String = "Wolhyong"
// name = null  // 컴파일 에러

// 널 가능 타입
var nullableName: String? = "Wolhyong"
nullableName = null  // 허용

// 안전한 호출
val length = nullableName?.length  // null이면 null 반환

// 엘비스 연산자
val defaultLength = nullableName?.length ?: 0

// 널 단정 연산자
val nonNullLength = nullableName!!.length  // null이면 NPE
```

Kotlin은 널 안전성을 기본으로 제공합니다. `String`은 널 불가능, `String?`은 널 가능입니다. `?.`로 안전한 호출, `?:`로 엘비스 연산자, `!!`로 널 단정 연산자를 사용합니다. 널 포인터 예외를 컴파일 타임에 방지합니다.

## 변수와 상수

```kotlin
// val: 읽기 전용 (상수)
val name = "Wolhyong"
// name = "Greyhacker"  // 컴파일 에러

// var: 변경 가능 (변수)
var age = 30
age = 31

// 타입 추론
val inferredName = "Wolhyong"  // String으로 추론
val inferredAge = 30           // Int로 추론

// 명시적 타입
val explicitName: String = "Wolhyong"
val explicitAge: Int = 30
```

`val`은 읽기 전용 상수, `var`는 변경 가능 변수입니다. 타입 추론을 지원하며 명시적 타입 지정도 가능합니다. 불변성을 우선시하는 것이 좋습니다.

## 함수

```kotlin
// 기본 함수
fun greet(name: String): String {
    return "Hello, $name!"
}

// 표현식 본문
fun greetExpression(name: String): String = "Hello, $name!"

// 단일 표현식 (반환 타입 추론)
fun greetSingle(name: String) = "Hello, $name!"

// 기본 매개변수
fun greetWithDefault(name: String = "World") = "Hello, $name!"

// 명명된 인자
greetWithDefault(name = "Wolhyong")

// 가변 인자
fun greetAll(vararg names: String) {
    names.forEach { name -> println("Hello, $name!") }
}
```

`fun` 키워드로 함수를 정의합니다. 표현식 본문으로 간결한 함수를 작성할 수 있습니다. 기본 매개변수와 명명된 인자를 지원합니다. `vararg`로 가변 인자를 정의할 수 있습니다.

## 문자열 템플릿

```kotlin
val name = "Wolhyong"
val age = 30

// 문자열 템플릿
val message = "이름: $name, 나이: $age"

// 표현식
val calculation = "1 + 2 = ${1 + 2}"

// 여러 줄 문자열
val multiline = """
    이름: $name
    나이: $age
"""
```

문자열 템플릿으로 문자열 내에 변수와 표현식을 포함할 수 있습니다. `$variable`로 변수를, `${expression}`으로 표현식을 포함합니다. `"""`로 여러 줄 문자열을 정의할 수 있습니다.

## 데이터 클래스

```kotlin
// 일반 클래스
class Person(val name: String, val age: Int)

// 데이터 클래스
data class DataPerson(val name: String, val age: Int)

val person1 = DataPerson("Wolhyong", 30)
val person2 = DataPerson("Wolhyong", 30)

// equals, hashCode, toString 자동 생성
println(person1 == person2)  // true
println(person1.hashCode() == person2.hashCode())  // true
println(person1)  // DataPerson(name=Wolhyong, age=30)

// copy 함수
val person3 = person1.copy(age = 31)
println(person3)  // DataPerson(name=Wolhyong, age=31)

// 구조 분해
val (name, age) = person1
println(name)  // Wolhyong
println(age)   // 30
```

`data class`는 `equals`, `hashCode`, `toString`, `copy`, `componentN`을 자동 생성합니다. 불변 데이터 모델에 적합합니다. `copy`로 객체를 복사하며 구조 분해를 지원합니다.

## 확장 함수

```kotlin
// String 확장 함수
fun String.isLong(): Boolean = this.length > 10

val text = "Hello, World!"
println(text.isLong())  // true

// Int 확장 함수
fun Int.isEven(): Boolean = this % 2 == 0

val number = 4
println(number.isEven())  // true
```

확장 함수는 기존 클래스에 새로운 함수를 추가합니다. `ClassName.functionName` 형식으로 정의합니다. 상속 없이 기능을 확장할 수 있습니다.

## 코루틴 기본

```kotlin
import kotlinx.coroutines.*

// 코루틴 실행
fun main() = runBlocking {
    launch {
        delay(1000)
        println("코루틴 1")
    }

    launch {
        delay(500)
        println("코루틴 2")
    }

    println("메인")
}
```

코루틴은 비동기 프로그래밍을 간단하게 만듭니다. `launch`로 코루틴을 시작하고 `delay`로 비동기 대기를 수행합니다. `runBlocking`으로 메인 스레드를 블로킹합니다. 스레드보다 가볍고 효율적입니다.

## Java 상호 운용성

```kotlin
// Java 클래스 사용
val list = ArrayList<String>()
list.add("Hello")
list.add("World")

// Kotlin 컬렉션으로 변환
val kotlinList = list.toList()

// Java에서 Kotlin 사용
// Kotlin 코드는 Java 바이트코드로 컴파일되므로 Java에서 호출 가능
```

Kotlin은 Java와 100% 상호 운용 가능합니다. Java 라이브러리를 Kotlin에서 사용할 수 있으며 Kotlin 코드를 Java에서 호출할 수 있습니다. 기존 Java 프로젝트에 점진적으로 도입할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> Kotlin과 Java 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

Kotlin을 사용해야 합니다. 더 간결하고 안전하며 표현력이 풍부합니다. Android 개발에는 Kotlin이 필수적입니다. 기존 Java 프로젝트는 점진적으로 Kotlin으로 마이그레이션할 수 있습니다. 새 프로젝트는 Kotlin으로 시작하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 널 안전성은 왜 중요한가요?</strong></summary>

널 안전성은 널 포인터 예외를 컴파일 타임에 방지합니다. 런타임 오류를 줄이며 코드 안정성을 높입니다. Java에서 가장 흔한 오류 중 하나인 NPE를 방지합니다. 안전한 코드를 작성하는 데 필수적입니다.
</details>

<details>
<summary><strong>Q> val과 var 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`val`을 우선 사용해야 합니다. 불변성은 스레드 안전성을 높이며 버그를 줄입니다. 상태 변경이 필요할 때만 `var`를 사용합니다. 함수형 프로그래밍 원칙을 따르는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 코루틴은 언제 사용해야 하나요?</strong></summary>

코루틴은 비동기 작업에 사용합니다. 네트워크 요청, 데이터베이스 쿼리, 파일 I/O 등. 스레드보다 가볍고 효율적입니다. 콜백 지옥을 피하며 동기 코드처럼 작성할 수 있습니다. Android 개발에 필수적입니다.
</details>

<details>
<summary><strong>Q> Kotlin Multiplatform은 언제 사용해야 하나요?</strong></summary>

Kotlin Multiplatform은 여러 플랫폼에서 코드를 공유할 때 사용합니다. Android, iOS, Web, Desktop에서 공통 로직을 공유합니다. 비즈니스 로직 재사용에 유용합니다. 플랫폼별 코드는 분리해야 합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Kotlin** | JetBrains 설계 | 현대적 언어 |
| **JVM** | Java 바이트코드 | Java 상호 운용 |
| **Android** | 공식 언어 | Android 개발 |
| **Native** | 네이티브 바이너리 | iOS, Desktop |
| **널 안전성** | 컴파일 타임 검사 | String vs String? |
| **val/var** | 상수/변수 | 불변성 우선 |
| **fun** | 함수 정의 | 표현식 본문 |
| **문자열 템플릿** | $variable, ${expr} | 문자열 보간 |
| **data class** | 데이터 모델 | 자동 메서드 |
| **확장 함수** | 기능 확장 | 상속 없음 |
| **코루틴** | 비동기 프로그래밍 | 가벼운 스레드 |
| **Java 상호 운용** | 100% 호환 | 점진적 마이그레이션 |


## 다음 수업

다음 글에서는 Kotlin 기본 — 변수와 데이터 타입, 널 안전성, 타입 추론, 문자열, 배열을 배웁니다.
