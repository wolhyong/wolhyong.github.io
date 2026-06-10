---
layout: post
title: "Kotlin 컬렉션 — List, Set, Map, 시퀀스, 컬렉션 함수, 불변/가변 컬렉션"
description: "Kotlin의 컬렉션 시스템을 실무 레벨에서 학습합니다. List는 순서가 있는 컬렉션이며 listOf로 불변, mutableListOf로 가변 리스트를 생성합니다. Set은 중복 없는 컬렉션이며 setOf로 불변, mutableSetOf로 가변 세트를 생성합니다. Map은 키-값 쌍 컬렉션이며 mapOf로 불변, mutableMapOf로 가변 맵을 생성합니다. 시퀀스는 지연 평가 컬렉션으로 sequenceOf로 생성하며 대용량 데이터 처리에 유용합니다. 컬렉션 함수는 map, filter, reduce, fold, flatMap 등을 제공하며 함수형 프로그래밍을 지원합니다. 불변 컬렉션은 스레드 안전하며 가변 컬렉션은 변경 가능합니다."
date: 2025-10-06 10:00:00 +0900
category: kotlin
tags: [kotlin, collections, list, set, map, sequences, functional-programming]
level: intermediate
---

Kotlin의 컬렉션 시스템은 풍부한 API를 제공하며 함수형 프로그래밍을 지원합니다.

> **핵심 정리** · `listOf`로 불변 리스트, `mutableListOf`로 가변 리스트를 생성합니다. `setOf`로 불변 세트, `mutableSetOf`로 가변 세트를 생성합니다. `mapOf`로 불변 맵, `mutableMapOf`로 가변 맵을 생성합니다. 시퀀스는 지연 평가 컬렉션입니다. `map`, `filter`, `reduce` 등의 함수를 제공합니다. 불변 컬렉션은 스레드 안전합니다.


## 수업 목표

- List를 이해하고 사용할 수 있습니다.
- Set을 이해하고 사용할 수 있습니다.
- Map을 이해하고 사용할 수 있습니다.
- 시퀀스를 이해합니다.
- 컬렉션 함수를 이해합니다.
- 불변/가변 컬렉션을 이해합니다.

## List

```kotlin
// 불변 리스트
val immutableList = listOf(1, 2, 3, 4, 5)
println(immutableList)  // [1, 2, 3, 4, 5]

// 가변 리스트
val mutableList = mutableListOf(1, 2, 3, 4, 5)
mutableList.add(6)
mutableList.remove(1)
println(mutableList)  // [2, 3, 4, 5, 6]

// 리스트 접근
val first = immutableList[0]  // 1
val second = immutableList.get(1)  // 2

// 리스트 순회
for (item in immutableList) {
    println(item)
}

// 인덱스와 값
for ((index, item) in immutableList.withIndex()) {
    println("$index: $item")
}

// 리스트 함수
val size = immutableList.size  // 5
val contains = immutableList.contains(3)  // true
val firstOrNull = immutableList.firstOrNull()  // 1
val lastOrNull = immutableList.lastOrNull()  // 5
val indexOf = immutableList.indexOf(3)  // 2
val subList = immutableList.subList(1, 3)  // [2, 3]
```

`listOf`는 불변 리스트, `mutableListOf`는 가변 리스트를 생성합니다. `[]` 또는 `get()`으로 접근합니다. `add()`, `remove()`로 요소를 추가/제거합니다. `size`, `contains`, `firstOrNull`, `lastOrNull` 등의 함수를 제공합니다.

## Set

```kotlin
// 불변 세트
val immutableSet = setOf(1, 2, 3, 3, 2)  // 중복 제거
println(immutableSet)  // [1, 2, 3]

// 가변 세트
val mutableSet = mutableSetOf(1, 2, 3)
mutableSet.add(4)
mutableSet.remove(1)
println(mutableSet)  // [2, 3, 4]

// 세트 함수
val size = immutableSet.size  // 3
val contains = immutableSet.contains(2)  // true
val union = immutableSet.union(setOf(3, 4, 5))  // [1, 2, 3, 4, 5]
val intersect = immutableSet.intersect(setOf(2, 3, 4))  // [2, 3]
val difference = immutableSet.difference(setOf(2, 3, 4))  // [1]

// 정렬된 세트
val sortedSet = sortedSetOf(3, 1, 2)
println(sortedSet)  // [1, 2, 3]
```

`setOf`는 불변 세트, `mutableSetOf`는 가변 세트를 생성합니다. 중복을 자동으로 제거합니다. `union`, `intersect`, `difference`로 집합 연산을 수행합니다. `sortedSetOf`로 정렬된 세트를 생성합니다.

## Map

```kotlin
// 불변 맵
val immutableMap = mapOf("key1" to "value1", "key2" to "value2")
println(immutableMap)  // {key1=value1, key2=value2}

// 가변 맵
val mutableMap = mutableMapOf("key1" to "value1", "key2" to "value2")
mutableMap["key3"] = "value3"
mutableMap.remove("key1")
println(mutableMap)  // {key2=value2, key3=value3}

// 맵 접근
val value = immutableMap["key1"]  // value1
val valueOrNull = immutableMap["key3"]  // null

// 맵 순회
for ((key, value) in immutableMap) {
    println("$key: $value")
}

// 맵 함수
val size = immutableMap.size  // 2
val containsKey = immutableMap.containsKey("key1")  // true
val containsValue = immutableMap.containsValue("value1")  // true
val keys = immutableMap.keys  // [key1, key2]
val values = immutableMap.values  // [value1, value2]
val getOrDefault = immutableMap.getOrDefault("key3", "default")  // default
```

`mapOf`는 불변 맵, `mutableMapOf`는 가변 맵을 생성합니다. `to`로 키-값 쌍을 생성합니다. `[]`로 접근하며 `remove()`로 제거합니다. `keys`, `values`로 키와 값을 가져옵니다.

## 시퀀스

```kotlin
// 시퀀스 생성
val sequence = sequenceOf(1, 2, 3, 4, 5)
for (item in sequence) {
    println(item)
}

// 범위를 시퀀스로 변환
val rangeSequence = (1..10).asSequence()
val filtered = rangeSequence.filter { it % 2 == 0 }
for (item in filtered) {
    println(item)  // 2, 4, 6, 8, 10
}

// 시퀀스 빌더
val customSequence = sequence {
    yield(1)
    yield(2)
    yieldAll(3..5)
}
for (item in customSequence) {
    println(item)  // 1, 2, 3, 4, 5
}

// 지연 평가
val lazySequence = sequence {
    println("생성")
    yield(1)
    yield(2)
}
// 여기서는 아직 생성되지 않음
lazySequence.toList()  // 여기서 생성됨
```

시퀀스는 지연 평가 컬렉션입니다. `sequenceOf`로 생성하거나 `asSequence()`로 변환합니다. `yield`, `yieldAll`으로 값을 생성합니다. 지연 평가로 성능을 최적화합니다.

## 컬렉션 함수

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// map
val doubled = numbers.map { it * 2 }
println(doubled)  // [2, 4, 6, 8, 10]

// filter
val evens = numbers.filter { it % 2 == 0 }
println(evens)  // [2, 4]

// mapNotNull
val nullableNumbers = listOf(1, null, 3, null, 5)
val nonNulls = nullableNumbers.mapNotNull { it }
println(nonNulls)  // [1, 3, 5]

// flatMap
val nested = listOf(listOf(1, 2), listOf(3, 4))
val flattened = nested.flatMap { it }
println(flattened)  // [1, 2, 3, 4]

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

// findLast
val foundLast = numbers.findLast { it < 3 }
println(foundLast)  // 2

// first, last
val first = numbers.first()  // 1
val last = numbers.last()  // 5

// firstOrNull, lastOrNull
val firstOrNull = numbers.firstOrNull { it > 10 }  // null
val lastOrNull = numbers.lastOrNull { it < 0 }  // null

// any, all, none
val hasEven = numbers.any { it % 2 == 0 }  // true
val allPositive = numbers.all { it > 0 }  // true
val noneNegative = numbers.none { it < 0 }  // true

// count
val count = numbers.count { it % 2 == 0 }  // 2

// distinct
val duplicates = listOf(1, 2, 2, 3, 3, 3)
val distinct = duplicates.distinct()
println(distinct)  // [1, 2, 3]

// sorted
val unsorted = listOf(3, 1, 4, 1, 5)
val sorted = unsorted.sorted()
println(sorted)  // [1, 1, 3, 4, 5]

// sortedBy
val people = listOf(Person("Alice", 30), Person("Bob", 25))
val sortedByAge = people.sortedBy { it.age }
println(sortedByAge.map { it.name })  // [Bob, Alice]

// reversed
val reversed = numbers.reversed()
println(reversed)  // [5, 4, 3, 2, 1]

// take, drop
val taken = numbers.take(3)  // [1, 2, 3]
val dropped = numbers.drop(2)  // [3, 4, 5]

// takeWhile, dropWhile
val takenWhile = numbers.takeWhile { it < 4 }  // [1, 2, 3]
val droppedWhile = numbers.dropWhile { it < 3 }  // [3, 4, 5]

// chunked
val chunked = numbers.chunked(2)
println(chunked)  // [[1, 2], [3, 4], [5]]

// zip
val names = listOf("Alice", "Bob", "Charlie")
val ages = listOf(30, 25, 35)
val zipped = names.zip(ages)
println(zipped)  // [(Alice, 30), (Bob, 25), (Charlie, 35)]

// unzip
val pairs = listOf(1 to "A", 2 to "B", 3 to "C")
val (numbers2, letters) = pairs.unzip()
println(numbers2)  // [1, 2, 3]
println(letters)  // [A, B, C]

// groupBy
val grouped = numbers.groupBy { it % 2 }
println(grouped)  // {1=[1, 3, 5], 0=[2, 4]}

// associateBy
val people2 = listOf(Person("Alice", 30), Person("Bob", 25))
val mapByName = people2.associateBy { it.name }
println(mapByName)  // {Alice=Person(Alice, 30), Bob=Person(Bob, 25)}

// partition
val (evens2, odds) = numbers.partition { it % 2 == 0 }
println(evens2)  // [2, 4]
println(odds)  // [1, 3, 5]
```

컬렉션 함수는 `map`, `filter`, `reduce`, `fold`, `flatMap` 등을 제공합니다. 함수형 프로그래밍의 핵심입니다. 체이닝하여 여러 작업을 수행할 수 있습니다.

## 불변/가변 컬렉션

```kotlin
// 불변 컬렉션
val immutableList = listOf(1, 2, 3)
// immutableList.add(4)  // 컴파일 에러

// 가변 컬렉션
val mutableList = mutableListOf(1, 2, 3)
mutableList.add(4)  // 허용

// 불변에서 가변으로 변환
val mutableFromImmutable = immutableList.toMutableList()
mutableFromImmutable.add(4)

// 가변에서 불변으로 변환
val immutableFromMutable = mutableList.toList()
// immutableFromMutable.add(5)  // 컴파일 에러
```

불변 컬렉션은 스레드 안전하며 예상치 못한 변경을 방지합니다. 가변 컬렉션은 변경 가능하며 유연성을 제공합니다. `toMutableList()`, `toList()`로 변환할 수 있습니다.

## 컬렉션 생성 함수

```kotlin
// emptyList
val emptyList = emptyList<Int>()
println(emptyList)  // []

// listOf
val list = listOf(1, 2, 3)

// mutableListOf
val mutableList = mutableListOf(1, 2, 3)

// arrayListOf
val arrayList = arrayListOf(1, 2, 3)

// setOf
val set = setOf(1, 2, 3)

// mutableSetOf
val mutableSet = mutableSetOf(1, 2, 3)

// hashSetOf
val hashSet = hashSetOf(1, 2, 3)

// linkedSetOf
val linkedSet = linkedSetOf(1, 2, 3)

// sortedSetOf
val sortedSet = sortedSetOf(3, 1, 2)

// mapOf
val map = mapOf("key1" to "value1", "key2" to "value2")

// mutableMapOf
val mutableMap = mutableMapOf("key1" to "value1", "key2" to "value2")

// hashMapOf
val hashMap = hashMapOf("key1" to "value1", "key2" to "value2")

// linkedMapOf
val linkedMap = linkedMapOf("key1" to "value1", "key2" to "value2")

// sortedMapOf
val sortedMap = sortedMapOf("b" to 2, "a" to 1)
println(sortedMap)  // {a=1, b=2}
```

다양한 컬렉션 생성 함수를 제공합니다. `emptyList`, `listOf`, `mutableListOf`, `arrayListOf` 등이 있습니다. `hashSetOf`, `linkedSetOf`, `sortedSetOf`로 다른 구현을 선택할 수 있습니다. `hashMapOf`, `linkedMapOf`, `sortedMapOf`로 다른 맵 구현을 선택할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> List와 Sequence 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`List`를 우선 사용해야 합니다. 즉시 평가되며 대부분의 경우 충분합니다. `Sequence`는 대용량 데이터 처리에 사용합니다. 지연 평가로 성능을 최적화합니다. 체이닝이 많을 때 유용합니다.
</details>

<details>
<summary><strong>Q> 불변 컬렉션과 가변 컬렉션 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

불변 컬렉션을 우선 사용해야 합니다. 스레드 안전하며 예상치 못한 변경을 방지합니다. 변경이 필요할 때만 가변 컬렉션을 사용합니다. 불변성을 우선시하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> reduce와 fold 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`reduce`는 초기값 없이 첫 요소를 초기값으로 사용합니다. `fold`는 초기값을 명시합니다. 컬렉션이 비어있을 수 있으면 `fold`를 사용해야 합니다. 초기값이 필요하면 `fold`를 사용합니다.
</details>

<details>
<summary><strong>Q> map과 flatMap 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`map`은 1:1 변환에 사용합니다. `flatMap`은 1:N 변환에 사용합니다. 중첩 컬렉션을 평탄화할 때 유용합니다. 변환 결과가 컬렉션이면 `flatMap`을 사용합니다.
</details>

<details>
<summary><strong>Q> Set과 List 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Set`은 중복을 방지할 때 사용합니다. 멤버십 테스트에 유용합니다. `List`는 순서가 중요할 때 사용합니다. 인덱스 접근이 필요할 때 사용합니다. 중복이 허용되면 `List`를 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **listOf** | 불변 리스트 | 변경 불가 |
| **mutableListOf** | 가변 리스트 | add/remove |
| **setOf** | 불변 세트 | 중복 제거 |
| **mutableSetOf** | 가변 세트 | add/remove |
| **mapOf** | 불변 맵 | 키-값 쌍 |
| **mutableMapOf** | 가변 맵 | [] 접근 |
| **시퀀스** | 지연 평가 | sequenceOf |
| **map** | 변환 | 1:1 |
| **filter** | 필터링 | 조건 만족 |
| **reduce** | 축소 | 초기값 없음 |
| **fold** | 축소 | 초기값 있음 |
| **flatMap** | 평탄화 | 1:N 변환 |
| **불변 컬렉션** | 스레드 안전 | 변경 불가 |
| **가변 컬렉션** | 변경 가능 | 유연성 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 확장 함수, 확장 프로퍼티, 연산자 오버로딩, 중위 함수를 배웁니다.
