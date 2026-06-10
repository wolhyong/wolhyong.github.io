---
layout: post
title: "Kotlin 코루틴 — suspend 함수, async/await, CoroutineScope, Job, Dispatcher"
description: "Kotlin의 코루틴 시스템을 시스템 레벨에서 학습합니다. 코루틴은 비동기 프로그래밍을 간단하게 만들며 스레드보다 가볍고 효율적입니다. suspend 함수는 비동기 작업을 표현하며 suspend 키워드로 정의합니다. async/await는 코루틴을 시작하고 결과를 기다리며 async로 코루틴을 생성하고 await로 완료를 기다립니다. CoroutineScope는 코루틴의 수명 주기를 관리하며 launch, async로 코루틴을 시작합니다. Job은 코루틴을 제어하며 cancel로 취소할 수 있습니다. Dispatcher는 코루틴이 실행될 스레드를 지정하며 Dispatchers.Main, Dispatchers.IO 등을 제공합니다."
date: 2025-10-15 10:00:00 +0900
category: kotlin
tags: [kotlin, coroutines, async-await, suspend, coroutine-scope, dispatcher]
level: intermediate
---

Kotlin의 코루틴은 비동기 프로그래밍을 간단하게 만들며 스레드보다 가볍고 효율적입니다.

> **핵심 정리** · 코루틴은 비동기 프로그래밍을 간단하게 만듭니다. `suspend` 함수로 비동기 작업을 표현합니다. `async`/`await`로 코루틴을 시작하고 결과를 기다립니다. `CoroutineScope`로 수명 주기를 관리합니다. `Job`으로 코루틴을 제어합니다. `Dispatcher`로 스레드를 지정합니다.


## 수업 목표

- 코루틴의 개념과 사용법을 이해합니다.
- suspend 함수를 이해합니다.
- async/await를 이해합니다.
- CoroutineScope를 이해합니다.
- Job을 이해합니다.
- Dispatcher를 이해합니다.

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

`launch`로 코루틴을 시작합니다. `delay`로 비동기 대기를 수행합니다. `runBlocking`으로 메인 스레드를 블로킹합니다. 코루틴은 스레드보다 가볍습니다.

## suspend 함수

```kotlin
import kotlinx.coroutines.*

// suspend 함수
suspend fun doWork() {
    delay(1000)
    println("작업 완료")
}

fun main() = runBlocking {
    launch {
        doWork()
    }
}
```

`suspend` 함수는 비동기 작업을 표현합니다. 다른 코루틴 내에서만 호출할 수 있습니다. `delay`와 같은 비동기 작업을 포함할 수 있습니다.

## async/await

```kotlin
import kotlinx.coroutines.*

// async로 코루틴 시작
fun main() = runBlocking {
    val deferred1 = async {
        delay(1000)
        "결과 1"
    }

    val deferred2 = async {
        delay(500)
        "결과 2"
    }

    // await로 결과 기다림
    println(deferred1.await())  // 결과 1
    println(deferred2.await())  // 결과 2
}
```

`async`로 코루틴을 시작하고 결과를 반환합니다. `await`로 결과를 기다립니다. 여러 코루틴을 병렬로 실행할 수 있습니다.

## CoroutineScope

```kotlin
import kotlinx.coroutines.*

// CoroutineScope 사용
fun main() = runBlocking {
    val scope = CoroutineScope(Dispatchers.Main)

    scope.launch {
        delay(1000)
        println("코루틴")
    }

    delay(2000)
}
```

`CoroutineScope`로 코루틴의 수명 주기를 관리합니다. `launch`, `async`로 코루틴을 시작합니다. 범위가 취소되면 자식 코루틴도 취소됩니다.

## Job

```kotlin
import kotlinx.coroutines.*

// Job로 코루틴 제어
fun main() = runBlocking {
    val job = launch {
        repeat(5) { i ->
            delay(500)
            println("작업 $i")
        }
    }

    delay(1500)
    job.cancel()  // 코루틴 취소
    job.join()
    println("완료")
}
```

`Job`은 코루틴을 제어합니다. `cancel`로 코루틴을 취소합니다. `join`으로 코루틴 완료를 기다립니다. `isActive`로 취소 여부를 확인할 수 있습니다.

## Dispatcher

```kotlin
import kotlinx.coroutines.*

// Dispatcher로 스레드 지정
fun main() = runBlocking {
    // Main 스레드
    launch(Dispatchers.Main) {
        println("Main: ${Thread.currentThread().name}")
    }

    // IO 스레드
    launch(Dispatchers.IO) {
        println("IO: ${Thread.currentThread().name}")
    }

    // Default 스레드
    launch(Dispatchers.Default) {
        println("Default: ${Thread.currentThread().name}")
    }
}
```

`Dispatcher`는 코루틴이 실행될 스레드를 지정합니다. `Dispatchers.Main`은 UI 스레드, `Dispatchers.IO`는 I/O 작업, `Dispatchers.Default`는 CPU 작업에 사용됩니다.

## withContext

```kotlin
import kotlinx.coroutines.*

// withContext로 컨텍스트 전환
suspend fun fetchData(): String {
    return withContext(Dispatchers.IO) {
        // IO 스레드에서 실행
        delay(1000)
        "데이터"
    }
}

fun main() = runBlocking {
    val data = fetchData()
    println(data)
}
```

`withContext`로 컨텍스트를 전환합니다. 결과를 반환하며 코루틴을 일시 중단합니다. 스레드 전환에 유용합니다.

## coroutineScope

```kotlin
import kotlinx.coroutines.*

// coroutineScope로 구조화된 동시성
suspend fun fetchUserData(): String {
    return coroutineScope {
        val deferred1 = async { fetchName() }
        val deferred2 = async { fetchAge() }
        "${deferred1.await()}, ${deferred2.await()}"
    }
}

suspend fun fetchName(): String {
    delay(500)
    return "Wolhyong"
}

suspend fun fetchAge(): Int {
    delay(500)
    return 30
}

fun main() = runBlocking {
    val userData = fetchUserData()
    println(userData)
}
```

`coroutineScope`로 구조화된 동시성을 구현합니다. 자식 코루틴이 모두 완료될 때까지 기다립니다. 구조화된 동시성에 필수적입니다.

## 취소 확인

```kotlin
import kotlinx.coroutines.*

// 취소 확인
fun main() = runBlocking {
    val job = launch {
        repeat(100) { i ->
            if (!isActive) return@launch
            delay(100)
            println("작업 $i")
        }
    }

    delay(500)
    job.cancel()
    job.join()
    println("취소됨")
}
```

`isActive`로 취소 여부를 확인합니다. 취소 시 깔끔하게 종료할 수 있습니다. `ensureActive()`로 취소 확인을 간소화할 수 있습니다.

## 예외 처리

```kotlin
import kotlinx.coroutines.*

// 코루틴 예외 처리
fun main() = runBlocking {
    val job = launch {
        try {
            delay(100)
            throw RuntimeException("에러")
        } catch (e: Exception) {
            println("예외 포착: ${e.message}")
        }
    }

    job.join()
}
```

코루틴의 예외는 `try-catch`로 포착할 수 있습니다. 예외는 부모 코루틴으로 전파됩니다. `CoroutineExceptionHandler`로 전역 예외 처리를 할 수 있습니다.

## SupervisorJob

```kotlin
import kotlinx.coroutines.*

// SupervisorJob로 자식 실패 시 부모 취소 방지
fun main() = runBlocking {
    val supervisor = SupervisorJob()

    with(CoroutineScope(supervisor)) {
        val child1 = launch {
            delay(100)
            throw RuntimeException("에러")
        }

        val child2 = launch {
            delay(200)
            println("자식 2 완료")
        }

        child1.join()
        child2.join()
    }
}
```

`SupervisorJob`은 자식 실패 시 부모 취소를 방지합니다. 독립적인 작업에 유용합니다. 자식 코루틴의 실패가 다른 자식에 영향을 주지 않습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 코루틴과 스레드 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

코루틴을 사용해야 합니다. 스레드보다 가볍고 효율적입니다. 비동기 작업에 적합합니다. 스레드는 CPU 바운드 작업에만 사용합니다. 대부분의 경우 코루틴이 더 좋은 선택입니다.
</details>

<details>
<summary><strong>Q> launch와 async 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`launch`는 결과가 필요 없을 때 사용합니다. `async`는 결과가 필요할 때 사용합니다. `launch`는 `Job`을, `async`는 `Deferred`를 반환합니다. 결과가 필요하면 `async`를 사용합니다.
</details>

<details>
<summary><strong>Q> Dispatcher는 언제 사용해야 하나요?</strong></summary>

`Dispatcher`는 스레드 지정이 필요할 때 사용합니다. UI 작업은 `Main`, I/O 작업은 `IO`, CPU 작업은 `Default`를 사용합니다. 기본적으로 `Default`가 사용됩니다.
</details>

<details>
<summary><strong>Q> coroutineScope와 CoroutineScope 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`coroutineScope`는 suspend 함수 내에서 사용합니다. 구조화된 동시성을 구현합니다. `CoroutineScope`는 일반 함수에서 사용합니다. 수명 주기를 명시적으로 관리합니다.
</details>

<details>
<summary><strong>Q> SupervisorJob은 언제 사용해야 하나요?</strong></summary>

`SupervisorJob`은 독립적인 작업에 사용합니다. 자식 실패 시 다른 자식에 영향을 주지 않습니다. UI 구성 요소 등에 유용합니다. 일반적인 동시성에는 필요하지 않습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **코루틴** | 비동기 프로그래밍 | 가볍고 효율적 |
| **suspend** | 비동기 함수 | 코루틴 내 호출 |
| **async** | 코루틴 시작 | 결과 반환 |
| **await** | 결과 대기 | Deferred.await() |
| **CoroutineScope** | 수명 주기 관리 | launch, async |
| **Job** | 코루틴 제어 | cancel, join |
| **Dispatcher** | 스레드 지정 | Main, IO, Default |
| **withContext** | 컨텍스트 전환 | 결과 반환 |
| **coroutineScope** | 구조화된 동시성 | 자식 완료 대기 |
| **isActive** | 취소 확인 | 취소 시 false |
| **SupervisorJob** | 자식 독립성 | 부모 취소 방지 |
| **runBlocking** | 메인 블로킹 | 테스트용 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 파일 I/O, File, Stream, 직렬화를 배웁니다.
