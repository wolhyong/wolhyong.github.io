---
layout: post
title: "Kotlin 예외 처리 — try-catch, 사용자 정의 예외, throw, finally, 예외 필터"
description: "Kotlin의 예외 처리 시스템을 실무 레벨에서 학습합니다. try-catch-finally로 예외를 포착하고 처리하며 catch 블록에서 특정 예외 타입을 지정할 수 있습니다. throw 키워드로 예외를 발생시키며 throw Exception(message) 형식을 사용합니다. 사용자 정의 예외는 Exception 클래스를 상속하여 정의하며 커스텀 에러 정보를 제공합니다. finally 블록은 예외 발생 여부와 상관없이 실행되며 리소스 정리에 사용됩니다. Kotlin은 예외 필터를 지원하지 않지만 when과 함께 사용하여 조건부 catch를 구현할 수 있습니다. use 함수로 자동 리소스 해제를 제공합니다."
date: 2025-10-13 10:00:00 +0900
category: kotlin
tags: [kotlin, exceptions, try-catch, custom-exceptions, throw, finally, use]
level: intermediate
---

Kotlin의 예외 처리는 구조화된 에러 관리를 제공하며 리소스 정리와 에러 복구를 지원합니다.

> **핵심 정리** · `try-catch-finally`로 예외를 포착하고 처리합니다. `throw`로 예외를 발생시킵니다. 사용자 정의 예외는 `Exception`을 상속하여 정의합니다. `finally` 블록은 항상 실행됩니다. `use` 함수로 자동 리소스 해제를 제공합니다.


## 수업 목표

- try-catch-finally를 사용할 수 있습니다.
- 사용자 정의 예외를 정의할 수 있습니다.
- throw로 예외를 발생시킬 수 있습니다.
- finally를 이해합니다.
- use 함수를 이해합니다.
- 예외 전파를 이해합니다.

## try-catch-finally

```kotlin
// 기본 예외 처리
try {
    val numbers = listOf(1, 2, 3)
    println(numbers[10])  // IndexOutOfBoundsException
} catch (e: IndexOutOfBoundsException) {
    println("인덱스 오류: ${e.message}")
} catch (e: Exception) {
    println("일반 오류: ${e.message}")
} finally {
    println("정리 작업")
}
```

`try` 블록은 예외가 발생할 수 있는 코드를 포함합니다. `catch` 블록은 특정 예외 타입을 포착합니다. `finally` 블록은 예외 발생 여부와 상관없이 실행됩니다. 리소스 정리에 사용됩니다.

## throw

```kotlin
// 예외 발생
fun divide(a: Int, b: Int): Int {
    if (b == 0) {
        throw IllegalArgumentException("0으로 나눌 수 없습니다.")
    }
    return a / b
}

try {
    divide(10, 0)
} catch (e: IllegalArgumentException) {
    println("오류: ${e.message}")
}
```

`throw` 키워드로 예외를 발생시킵니다. `throw Exception(message)` 형식을 사용합니다. 조건 검사 후 예외를 발생시켜 에러를 명확히 합니다.

## 사용자 정의 예외

```kotlin
// 사용자 정의 예외
class InvalidAgeException(message: String) : Exception(message)

class Person(val name: String, val age: Int) {
    init {
        if (age < 0 || age > 150) {
            throw InvalidAgeException("나이는 0~150 사이여야 합니다: $age")
        }
    }
}

try {
    val person = Person("Wolhyong", 200)
} catch (e: InvalidAgeException) {
    println("오류: ${e.message}")
}
```

사용자 정의 예외는 `Exception` 클래스를 상속하여 정의합니다. 커스텀 에러 정보를 제공하며 도메인 특정 예외를 정의할 수 있습니다. 여러 생성자를 제공하여 유연성을 높입니다.

## finally

```kotlin
// finally 블록
fun readFile(path: String) {
    val reader = java.io.FileReader(path)
    try {
        // 파일 읽기
        println(reader.read())
    } catch (e: Exception) {
        println("오류: ${e.message}")
    } finally {
        reader.close()
        println("파일 닫기")
    }
}
```

`finally` 블록은 예외 발생 여부와 상관없이 실행됩니다. 리소스 정리에 사용됩니다. 파일 닫기, 연결 해제 등에 사용됩니다.

## use 함수

```kotlin
// use 함수 (자동 리소스 해제)
fun readFileWithUse(path: String) {
    java.io.FileReader(path).use { reader ->
        println(reader.read())
    }
    // reader는 자동으로 close됨
}
```

`use` 함수는 `AutoCloseable`을 구현한 객체의 자동 리소스 해제를 제공합니다. 범위 종료 시 `close()`가 자동으로 호출됩니다. 파일, 데이터베이스 연결 등에 사용됩니다.

## 예외 전파

```kotlin
// 예외 전파
fun level3() {
    throw Exception("Level 3 오류")
}

fun level2() {
    try {
        level3()
    } catch (e: Exception) {
        throw Exception("Level 2 오류", e)  // 내부 예외 포함
    }
}

fun level1() {
    try {
        level2()
    } catch (e: Exception) {
        println("예외: ${e.message}")
        println("내부 예외: ${e.cause?.message}")
        println("스택 트레이스:")
        e.printStackTrace()
    }
}

level1()
```

예외는 호출 스택을 따라 전파됩니다. `throw Exception(message, cause)`로 내부 예외를 포함할 수 있습니다. `cause`로 내부 예외를 확인할 수 있습니다. `printStackTrace()`로 스택 트레이스를 확인합니다.

## 예외 다시 throw

```kotlin
// 예외 다시 throw
fun process() {
    try {
        throw Exception("오류 발생")
    } catch (e: Exception) {
        println("로깅: ${e.message}")
        throw  // 예외 다시 throw (스택 트레이스 보존)
    }
}

try {
    process()
} catch (e: Exception) {
    println("최종 처리: ${e.message}")
}
```

`throw`만 사용하여 예외를 다시 throw할 수 있습니다. 스택 트레이스가 보존되어 원래 발생 위치를 추적할 수 있습니다. 로깅 후 예외를 다시 throw할 때 사용됩니다.

## Nothing 타입

```kotlin
// Nothing 타입 (절대 반환하지 않는 함수)
fun fail(message: String): Nothing {
    throw IllegalArgumentException(message)
}

fun processUser(name: String?) {
    val userName = name ?: fail("이름은 null일 수 없습니다.")
    println(userName)
}

processUser("Wolhyong")
// processUser(null)  // IllegalArgumentException
```

`Nothing` 타입은 절대 반환하지 않는 함수의 반환 타입입니다. 예외를 발생하거나 무한 루프에 사용됩니다. 컴파일러가 코드 경로를 분석할 때 유용합니다.

## runCatching

```kotlin
// runCatching (예외를 Result로 래핑)
val result = runCatching {
    divide(10, 0)
}

if (result.isFailure) {
    println("오류: ${result.exceptionOrNull()?.message}")
} else {
    println("결과: ${result.getOrNull()}")
}

// getOrElse
val value = result.getOrElse { 0 }
println(value)  // 0

// getOrThrow
try {
    val value2 = result.getOrThrow()
} catch (e: Exception) {
    println("예외: ${e.message}")
}
```

`runCatching`은 예외를 `Result`로 래핑합니다. `isFailure`, `isSuccess`로 성공/실패를 확인합니다. `getOrElse`, `getOrThrow`로 결과를 처리합니다. 함수형 예외 처리에 유용합니다.

## 조건부 catch

```kotlin
// when과 함께 사용하여 조건부 catch 구현
fun handleException(e: Exception) {
    when (e) {
        is IllegalArgumentException -> println("인자 오류: ${e.message}")
        is IndexOutOfBoundsException -> println("인덱스 오류: ${e.message}")
        else -> println("기타 오류: ${e.message}")
    }
}

try {
    divide(10, 0)
} catch (e: Exception) {
    handleException(e)
}
```

Kotlin은 예외 필터를 직접 지원하지 않지만 `when`과 함께 사용하여 조건부 catch를 구현할 수 있습니다. 여러 예외 타입을 처리할 때 유용합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 예외 처리는 언제 사용해야 하나요?</strong></summary>

예외 처리는 복구 가능한 에러에 사용합니다. 파일 없음, 네트워크 오류, 잘못된 입력 등. 프로그램 로직의 정상적인 흐름이 아닌 예외적인 상황에 사용합니다. 제어 흐름으로 예외를 사용해서는 안 됩니다.
</details>

<details>
<summary><strong>Q> finally는 언제 사용해야 하나요?</strong></summary>

`finally`는 리소스 정리가 필요할 때 사용합니다. 파일 닫기, 데이터베이스 연결 해제, 잠금 해제 등. 예외 발생 여부와 상관없이 실행되어야 하는 코드에 사용합니다. `use` 함수로 대체할 수 있습니다.
</details>

<details>
<summary><strong>Q> 사용자 정의 예외는 언제 정의해야 하나요?</strong></summary>

사용자 정의 예외는 도메인 특정 에러가 필요할 때 정의합니다. 비즈니스 로직 에러, 애플리케이션 특정 상태 등. 표준 예외로 표현할 수 없는 에러에 사용합니다. `Exception`을 상속하여 정의합니다.
</details>

<details>
<summary><strong>Q> use 함수는 언제 사용해야 하나요?</strong></summary>

`use` 함수는 `AutoCloseable`을 구현한 객체에 사용합니다. 파일, 데이터베이스 연결, 스트림 등. 더 간결하고 자동으로 `Dispose()`를 호출합니다. 대부분의 경우 `use` 함수를 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> Nothing 타입은 언제 사용해야 하나요?</strong></summary>

`Nothing` 타입은 절대 반환하지 않는 함수에 사용합니다. 예외를 발생하거나 무한 루프에 사용됩니다. 컴파일러가 코드 경로를 분석할 때 유용합니다. `fail` 함수 등에 사용됩니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **try-catch** | 예외 포착 | 특정 예외 타입 |
| **finally** | 정리 작업 | 항상 실행 |
| **throw** | 예외 발생 | Exception(message) |
| **사용자 정의 예외** | Exception 상속 | 도메인 특정 |
| **use** | 자동 리소스 해제 | AutoCloseable |
| **예외 전파** | 스택 전파 | cause 포함 |
| **다시 throw** | throw | 스택 트레이스 보존 |
| **Nothing** | 절대 반환 안 함 | 예외/무한 루프 |
| **runCatching** | Result 래핑 | 함수형 처리 |
| **조건부 catch** | when 사용 | 여러 예외 타입 |
| **cause** | 내부 예외 | 원인 추적 |
| **printStackTrace** | 스택 트레이스 | 디버깅 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 코루틴, suspend 함수, async/await, CoroutineScope를 배웁니다.
