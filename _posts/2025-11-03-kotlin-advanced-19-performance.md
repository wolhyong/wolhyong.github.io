---
layout: post
title: "Kotlin 성능 최적화 — 메모리 관리, 프로파일링, 코루틴 최적화, 컬렉션 최적화"
description: "Kotlin의 성능 최적화 기법을 시스템 레벨에서 학습합니다. 메모리 관리는 객체 생성을 줄이고 객체 풀을 사용하며 불변 객체를 활용합니다. 프로파일링은 Android Profiler, VisualVM, JProfiler 등으로 성능 병목을 찾습니다. 코루틴 최적화는 Dispatchers.IO로 I/O 작업을, Dispatchers.Default로 CPU 작업을 처리하며 구조화된 동시성을 사용합니다. 컬렉션 최적화는 시퀀스를 사용하여 지연 평가를 활용하고 적절한 컬렉션 타입을 선택합니다. 인라인 함수는 람다 오버헤드를 줄이며 tailrec로 꼬리 재귀를 최적화합니다."
date: 2025-11-03 10:00:00 +0900
category: kotlin
tags: [kotlin, performance, memory-management, profiling, coroutines, collections]
level: advanced
---

Kotlin의 성능 최적화는 메모리 관리, 코루틴 최적화, 컬렉션 최적화 등 다양한 기법을 제공합니다.

> **핵심 정리** · 객체 생성을 줄여 메모리를 최적화합니다. 프로파일링으로 병목을 찾습니다. `Dispatchers.IO`, `Dispatchers.Default`로 코루틴을 최적화합니다. 시퀀스로 지연 평가를 활용합니다. `inline`으로 람다 오버헤드를 줄입니다. `tailrec`로 꼬리 재귀를 최적화합니다.


## 수업 목표

- 메모리 관리를 이해합니다.
- 프로파일링을 이해합니다.
- 코루틴 최적화를 이해합니다.
- 컬렉션 최적화를 이해합니다.
- 인라인 함수를 이해합니다.
- 성능 최적화 기법을 이해합니다.

## 메모리 관리

```kotlin
// 객체 생성 줄이기
// 나쁜 예
fun processItems(items: List<String>): List<String> {
    return items.map { it.uppercase() }
}

// 좋은 예 (시퀀스 사용)
fun processItemsOptimized(items: List<String>): List<String> {
    return items.asSequence()
        .map { it.uppercase() }
        .toList()
}

// 객체 풀 사용
object StringPool {
    private val pool = mutableMapOf<String, String>()

    fun get(key: String): String {
        return pool.getOrPut(key) { key }
    }
}

// 불변 객체 활용
data class Point(val x: Int, val y: Int)

val point1 = Point(10, 20)
val point2 = point1.copy(x = 30)
```

객체 생성을 줄여 메모리를 최적화합니다. 시퀀스로 지연 평가를 활용합니다. 객체 풀로 재사용을 늘립니다. 불변 객체로 상태 변경을 방지합니다.

## 프로파일링

```kotlin
// Android Profiler (안드로이드)
// CPU, 메모리, 네트워크, 에너지 프로파일링

// VisualVM (JVM)
// 메모리, CPU, 스레드, 클래스 로딩 프로파일링

// JProfiler (JVM)
// 상용 프로파일링 도구

// Kotlin/Native 프로파일링
// Xcode Instruments (macOS)
// Perf (Linux)
```

프로파일링 도구로 성능 병목을 찾습니다. Android Profiler는 안드로이드 애플리케이션에 사용합니다. VisualVM, JProfiler는 JVM 애플리케이션에 사용합니다. Xcode Instruments는 Kotlin/Native에 사용합니다.

## 코루틴 최적화

```kotlin
import kotlinx.coroutines.*

// 적절한 Dispatcher 사용
suspend fun fetchData(): String = withContext(Dispatchers.IO) {
    // I/O 작업
    Thread.sleep(1000)
    "Data"
}

suspend fun processData(data: String): String = withContext(Dispatchers.Default) {
    // CPU 작업
    data.uppercase()
}

// 구조화된 동시성
suspend fun fetchAndProcess(): String = coroutineScope {
    val data = async(Dispatchers.IO) { fetchData() }
    val processed = async(Dispatchers.Default) { processData(data.await()) }
    processed.await()
}

// 코루틴 취소 확인
suspend fun longRunningTask() {
    repeat(100) { i ->
        if (!isActive) return
        delay(100)
        println("작업 $i")
    }
}
```

`Dispatchers.IO`로 I/O 작업을 처리합니다. `Dispatchers.Default`로 CPU 작업을 처리합니다. 구조화된 동시성으로 취소를 관리합니다. `isActive`로 취소를 확인합니다.

## 컬렉션 최적화

```kotlin
// 시퀀스 사용 (지연 평가)
val numbers = (1..1000000).asSequence()
    .filter { it % 2 == 0 }
    .map { it * 2 }
    .take(10)
    .toList()

// 적절한 컬렉션 타입 선택
val list = listOf(1, 2, 3)  // 순서 중요
val set = setOf(1, 2, 3)  // 중복 방지
val map = mapOf(1 to "one", 2 to "two")  // 키-값 쌍

// 초기 용량 지정
val list = ArrayList<Int>(1000)
val map = HashMap<String, Int>(100)

// forEach 대신 for 루프
val numbers = listOf(1, 2, 3, 4, 5)

// 나쁜 예
numbers.forEach { println(it) }

// 좋은 예
for (number in numbers) {
    println(number)
}
```

시퀀스로 지연 평가를 활용합니다. 적절한 컬렉션 타입을 선택합니다. 초기 용량을 지정하여 재할당을 줄입니다. `for` 루프를 `forEach`보다 우선 사용합니다.

## 인라인 함수

```kotlin
// 인라인 함수 (람다 오버헤드 감소)
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

// noinline (인라인 방지)
inline fun process(noinline block: () -> Unit) {
    // block은 인라인되지 않음
    block()
}
```

`inline` 키워드로 람다 오버헤드를 줄입니다. 함수 호출 오버헤드를 제거합니다. `noinline`으로 특정 람다의 인라인을 방지합니다. 핫 경로에서 사용합니다.

## 꼬리 재귀 최적화

```kotlin
// 꼬리 재귀 최적화
tailrec fun factorial(n: Int, acc: Long = 1): Long {
    return if (n <= 1) acc else factorial(n - 1, acc * n)
}

println(factorial(10))  // 3628800

// 일반 재귀 (스택 오버플로우 가능)
fun factorialNoTailRec(n: Int): Long {
    return if (n <= 1) 1 else n * factorialNoTailRec(n - 1)
}

// 꼬리 재귀 조건: 재귀 호출이 마지막 연산이어야 함
tailrec fun sumTailRec(n: Int, acc: Int = 0): Int {
    return if (n <= 0) acc else sumTailRec(n - 1, acc + n)
}
```

`tailrec` 키워드로 꼬리 재귀를 최적화합니다. 스택 오버플로우를 방지합니다. 재귀 호출이 마지막 연산이어야 합니다. 누적 인자를 사용하여 구현합니다.

## 문자열 최적화

```kotlin
// 문자열 빌더 사용
val builder = StringBuilder()
builder.append("Hello")
builder.append(", ")
builder.append("World")
val result = builder.toString()

// 문자열 템플릿 사용
val name = "Wolhyong"
val greeting = "Hello, $name!"

// 문자열 비교
val str1 = "Hello"
val str2 = "Hello"
val equals = str1 == str2  // true (구조적 비교)

// 문자열 인터닝
val str3 = "Hello".intern()
val str4 = "Hello".intern()
val same = str3 === str4  // true (참조 비교)
```

`StringBuilder`로 문자열 연결을 최적화합니다. 문자열 템플릿으로 가독성을 높입니다. `==`로 구조적 비교를 수행합니다. `intern()`으로 문자열 인터닝을 사용합니다.

## 캐싱

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

// LRU 캐시
import java.util.LinkedHashMap

class LRUCache<K, V>(private val capacity: Int) {
    private val cache = object : LinkedHashMap<K, V>(capacity, 0.75f, true) {
        override fun removeEldestEntry(eldest: Map.Entry<K, V>?): Boolean {
            return size > capacity
        }
    }

    fun get(key: K): V? = cache[key]
    fun put(key: K, value: V) { cache[key] = value }
}
```

메모이제이션으로 반복 계산을 방지합니다. 캐싱으로 성능을 향상합니다. LRU 캐시로 메모리 사용을 제어합니다. 순수 함수에 적합합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 시퀀스와 리스트 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

리스트를 우선 사용해야 합니다. 즉시 평가되며 대부분의 경우 충분합니다. 시퀀스는 대용량 데이터 처리에 사용합니다. 지연 평가로 성능을 최적화합니다. 체이닝이 많을 때 유용합니다.
</details>

<details>
<summary><strong>Q> 코루틴 최적화는 언제 필요한가요?</strong></summary>

코루틴 최적화는 다음 경우에 필요합니다: (1) 많은 코루틴 사용 (2) I/O 작업 많음 (3) CPU 작업 많음. 적절한 Dispatcher를 사용하고 구조화된 동시성을 유지해야 합니다.
</details>

<details>
<summary><strong>Q> 인라인 함수는 언제 사용해야 하나요?</strong></summary>

인라인 함수는 람다 오버헤드를 줄여야 할 때 사용합니다. 핫 경로에서 사용합니다. 과도한 사용은 코드 크기를 증가시킵니다. 성능이 중요한 고차 함수에 사용합니다.
</details>

<details>
<summary><strong>Q> 메모이제이션은 언제 사용해야 하나요?</strong></summary>

메모이제이션은 비용 있는 계산에 사용합니다. 반복 계산을 방지하여 성능을 향상합니다. 순수 함수에 적합합니다. 재귀, 동적 프로그래밍에 유용합니다.
</details>

<details>
<summary><strong>Q> 프로파일링은 언제 수행해야 하나요?</strong></summary>

프로파일링은 성능 문제가 있을 때 수행합니다. 개발 중 정기적으로 수행하는 것이 좋습니다. 병목을 찾아 최적화의 우선순위를 결정합니다. 실제 환경에서 수행하는 것이 좋습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **메모리 관리** | 객체 생성 줄이기 | 시퀀스, 객체 풀 |
| **프로파일링** | 병목 찾기 | Android Profiler |
| **Dispatchers.IO** | I/O 작업 | 코루틴 최적화 |
| **Dispatchers.Default** | CPU 작업 | 코루틴 최적화 |
| **시퀀스** | 지연 평가 | asSequence |
| **inline** | 람다 오버헤드 감소 | 인라인 함수 |
| **tailrec** | 꼬리 재귀 최적화 | 스택 오버플로우 방지 |
| **StringBuilder** | 문자열 연결 최적화 | 빌더 패턴 |
| **메모이제이션** | 결과 캐싱 | 성능 향상 |
| **LRU 캐시** | 메모리 제어 | LinkedHashMap |
| **초기 용량** | 재할당 줄이기 | ArrayList(1000) |
| **구조화된 동시성** | 취소 관리 | coroutineScope |
| **isActive** | 취소 확인 | 코루틴 |


## 다음 수업

다음 글에서는 Kotlin 고급 — 보안, 암호화, 인증, 권한 부여를 배웁니다.
