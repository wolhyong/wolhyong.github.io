---
layout: post
title: "Rust 컬렉션 — Vec, HashMap, BTreeMap, HashSet, BTreeSet, 이터레이터와 소비자"
description: "Rust의 컬렉션 시스템을 메모리 레벨에서 학습합니다. Vec<T>는 가변 크기 동적 배열로 힙에 할당되며 capacity와 length를 가집니다. HashMap<K, V>는 해시 테이블로 O(1) 평균 조회 시간을 제공하며 DefaultHasher를 사용합니다. BTreeMap<K, V>는 정렬된 맵으로 O(log n) 조회 시간을 제공하며 순서가 보존됩니다. HashSet<T>와 BTreeSet<T>는 중복 없는 집합을 제공합니다. 이터레이터는 lazy evaluation으로 체이닝이 가능하며 map, filter, fold 등의 어댑터를 제공합니다. 소비자(consumer)는 collect, sum, count 등으로 이터레이터를 소비합니다. Rust의 컬렉션은 제네릭으로 타입 안전성을 보장합니다."
date: 2025-06-23 10:00:00 +0900
category: rust
tags: [rust, collections, vec, hashmap, btreemap, iterator, hashset]
level: intermediate
---

Rust의 표준 라이브러리는 다양한 컬렉션을 제공하며 각각의 특성에 맞는 사용 사례가 있습니다.

> **핵심 정리** · `Vec<T>`는 가변 크기 동적 배열로 힙에 할당됩니다. `HashMap<K, V>`는 O(1) 평균 조회 시간을 제공합니다. `BTreeMap<K, V>`는 정렬된 맵으로 O(log n) 조회 시간을 제공합니다. 이터레이터는 lazy evaluation으로 체이닝이 가능합니다.


## 수업 목표

- Vec<T>의 사용법과 내부 구조를 이해합니다.
- HashMap과 BTreeMap의 차이를 이해합니다.
- HashSet과 BTreeSet의 사용법을 이해합니다.
- 이터레이터와 어댑터를 이해합니다.
- 소비자(consumer)를 이해하고 사용할 수 있습니다.

## Vec<T>

```rust
fn main() {
    // 매크로로 생성
    let mut v: Vec<i32> = Vec::new();
    v.push(5);
    v.push(6);
    v.push(7);

    // 매크로로 초기화
    let v2 = vec![1, 2, 3];

    // 타입 추론
    let v3 = vec![1, 2, 3];  // Vec<i32>

    println!("v: {:?}", v);
    println!("v2: {:?}", v2);
    println!("v3: {:?}", v3);
}
```

`Vec<T>`는 가변 크기 동적 배열입니다. 힙에 할당되며 capacity와 length를 가집니다. `vec!` 매크로로 간단히 초기화할 수 있습니다.

### Vec 메서드

```rust
fn main() {
    let mut v = vec![1, 2, 3, 4, 5];

    // 요소 접근
    let third = &v[2];      // 인덱스 접근 (패닉 가능)
    let third_option = v.get(2);  // Option 반환 (안전)

    println!("세 번째: {}", third);
    println!("세 번째 (Option): {:?}", third_option);

    // 반복
    for i in &v {
        println!("{}", i);
    }

    // 가변 반복
    for i in &mut v {
        *i *= 2;
    }

    println!("두 배: {:?}", v);
}
```

`&v[i]`는 인덱스 접근으로 범위를 벗어나면 패닉이 발생합니다. `v.get(i)`는 `Option<&T>`를 반환하여 안전하게 접근할 수 있습니다. `&v`로 불변 반복, `&mut v`로 가변 반복이 가능합니다.

### Vec 내부 구조

```rust
fn main() {
    let mut v = Vec::with_capacity(10);
    println!("capacity: {}, len: {}", v.capacity(), v.len());

    v.push(1);
    println!("capacity: {}, len: {}", v.capacity(), v.len());

    v.reserve(20);
    println!("capacity: {}, len: {}", v.capacity(), v.len());

    v.shrink_to_fit();
    println!("capacity: {}, len: {}", v.capacity(), v.len());
}
```

`Vec`은 내부적으로 포인터, capacity, length를 가집니다. `capacity`는 할당된 메모리 크기, `len`은 실제 요소 개수입니다. `reserve`로 capacity를 미리 확보하여 재할당을 줄일 수 있습니다. `shrink_to_fit`으로 capacity를 len으로 줄일 수 있습니다.

## HashMap<K, V>

```rust
use std::collections::HashMap;

fn main() {
    // 새 HashMap 생성
    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    println!("{:?}", scores);

    // zip과 collect로 생성
    let teams = vec![String::from("Blue"), String::from("Yellow")];
    let initial_scores = vec![10, 50];

    let scores2: HashMap<_, _> = teams.into_iter().zip(initial_scores.into_iter()).collect();

    println!("{:?}", scores2);
}
```

`HashMap<K, V>`는 키-값 쌍을 저장합니다. `insert`로 요소를 추가하고, `zip`과 `collect`로 두 컬렉션에서 HashMap을 생성할 수 있습니다.

### HashMap 접근

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    // 값 접근
    let team_name = String::from("Blue");
    let score = scores.get(&team_name);

    match score {
        Some(s) => println!("Blue의 점수: {}", s),
        None => println!("Blue를 찾을 수 없음"),
    }

    // 반복
    for (key, value) in &scores {
        println!("{}: {}", key, value);
    }
}
```

`get`은 `Option<&V>`를 반환하여 안전하게 접근할 수 있습니다. `&scores`로 반복하면 `(key, value)` 튜플을 얻을 수 있습니다.

### HashMap 업데이트

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);

    // 키가 없으면 삽입
    scores.entry(String::from("Yellow")).or_insert(50);
    scores.entry(String::from("Blue")).or_insert(50);

    println!("{:?}", scores);

    // 기존 값 기반 업데이트
    let text = "hello world wonderful world";

    let mut map = HashMap::new();

    for word in text.split_whitespace() {
        let count = map.entry(word).or_insert(0);
        *count += 1;
    }

    println!("{:?}", map);
}
```

`entry` API는 키가 있는지 확인하고 없으면 값을 삽입합니다. `or_insert`는 기본값을 설정합니다. 기존 값을 기반으로 업데이트할 때 유용합니다.

## BTreeMap<K, V>

```rust
use std::collections::BTreeMap;

fn main() {
    let mut map = BTreeMap::new();

    map.insert(3, "three");
    map.insert(1, "one");
    map.insert(2, "two");

    // 정렬된 순서로 반복
    for (key, value) in &map {
        println!("{}: {}", key, value);
    }

    // 범위 조회
    println!("1..=2: {:?}", map.range(1..=2).collect::<Vec<_>>());
}
```

`BTreeMap<K, V>`는 정렬된 맵으로 키가 정렬된 순서로 저장됩니다. O(log n) 조회 시간을 제공하며 범위 조회가 가능합니다. `HashMap`과 달리 순서가 보존됩니다.

## HashSet<T>

```rust
use std::collections::HashSet;

fn main() {
    let mut set = HashSet::new();

    set.insert(1);
    set.insert(2);
    set.insert(3);
    set.insert(2);  // 중복 무시

    println!("{:?}", set);

    // 포함 여부 확인
    println!("1이 있는가? {}", set.contains(&1));
    println!("4가 있는가? {}", set.contains(&4));

    // 집합 연산
    let a: HashSet<i32> = vec![1, 2, 3].into_iter().collect();
    let b: HashSet<i32> = vec![2, 3, 4].into_iter().collect();

    println!("교집합: {:?}", a.intersection(&b).collect::<Vec<_>>());
    println!("합집합: {:?}", a.union(&b).collect::<Vec<_>>());
    println!("차집합: {:?}", a.difference(&b).collect::<Vec<_>>());
}
```

`HashSet<T>`는 중복 없는 값의 집합입니다. `insert`는 중복을 무시합니다. `contains`로 포함 여부를 확인할 수 있습니다. 교집합, 합집합, 차집합 연산을 제공합니다.

## 이터레이터

```rust
fn main() {
    let v = vec![1, 2, 3];

    // 이터레이터 생성
    let iter = v.iter();  // &T
    let into_iter = v.into_iter();  // T
    let iter_mut = v.iter_mut();  // &mut T

    // for 루프는 이터레이터를 사용
    for val in v.iter() {
        println!("{}", val);
    }
}
```

이터레이터는 컬렉션을 순회하는 방법을 제공합니다. `iter`는 불변 참조, `into_iter`는 소유권, `iter_mut`는 가변 참조를 반환합니다.

### 이터레이터 어댑터

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // map - 변환
    let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
    println!("두 배: {:?}", doubled);

    // filter - 필터링
    let evens: Vec<&i32> = v.iter().filter(|x| *x % 2 == 0).collect();
    println!("짝수: {:?}", evens);

    // chain - 연결
    let v2 = vec![6, 7, 8];
    let chained: Vec<&i32> = v.iter().chain(v2.iter()).collect();
    println!("연결: {:?}", chained);

    // zip - 쌍 만들기
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![10, 20, 30];
    let paired: Vec<(&str, &i32)> = names.iter().zip(scores.iter()).collect();
    println!("쌍: {:?}", paired);
}
```

이터레이터 어댑터는 lazy evaluation으로 체이닝이 가능합니다. `map`은 변환, `filter`는 필터링, `chain`은 연결, `zip`은 쌍을 만듭니다. 실제 계산은 소비자가 호출될 때 수행됩니다.

### 이터레이터 소비자

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // collect - 컬렉션으로 수집
    let sum: i32 = v.iter().sum();
    println!("합: {}", sum);

    // fold - 누적
    let product = v.iter().fold(1, |acc, x| acc * x);
    println!("곱: {}", product);

    // count - 개수
    let count = v.iter().filter(|x| *x % 2 == 0).count();
    println!("짝수 개수: {}", count);

    // any/all - 조건 확인
    let any_even = v.iter().any(|x| x % 2 == 0);
    let all_positive = v.iter().all(|x| *x > 0);
    println!("짝수 있음? {}, 모두 양수? {}", any_even, all_positive);

    // find - 첫 번째 매칭
    let first_even = v.iter().find(|x| *x % 2 == 0);
    println!("첫 짝수: {:?}", first_even);
}
```

소비자는 이터레이터를 소비하여 결과를 반환합니다. `sum`, `fold`, `count`, `any`, `all`, `find` 등이 있습니다. `collect`는 다양한 컬렉션으로 변환할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> Vec과 배열의 차이는 무엇인가요?</strong></summary>

`Vec<T>`는 가변 크기 동적 배열로 힙에 할당됩니다. 크기를 런타임에 변경할 수 있습니다. 배열 `[T; N]`은 고정 크기로 스택에 할당됩니다. 크기가 컴파일 타임에 알려져야 합니다. `Vec`은 더 유연하지만 약간의 오버헤드가 있습니다. 배열은 더 빠르지만 크기가 고정됩니다.
</details>

<details>
<summary><strong>Q> HashMap과 BTreeMap 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`HashMap`은 O(1) 평균 조회 시간을 제공하며 순서가 보장되지 않습니다. 대부분의 경우 `HashMap`을 사용합니다. `BTreeMap`은 O(log n) 조회 시간을 제공하며 정렬된 순서를 보장합니다. 정렬된 순서나 범위 조회가 필요할 때 `BTreeMap`을 사용합니다. `BTreeMap`은 메모리 사용량이 더 많습니다.
</details>

<details>
<summary><strong>Q> 이터레이터가 lazy evaluation인 이유는 무엇인가요?</strong></summary>

Lazy evaluation은 성능 최적화를 위함입니다: (1) **단락 평가**: `find`, `any` 등은 필요한 만큼만 평가합니다. (2) **메모리 효율**: 전체 결과를 저장하지 않고 필요할 때 계산합니다. (3) **체이닝**: 여러 어댑터를 체이닝해도 중간 결과를 저장하지 않습니다. 실제 계산은 소비자가 호출될 때 수행됩니다.
</details>

<details>
<summary><strong>Q> collect는 어떻게 타입을 추론하나요?</strong></summary>

`collect`는 타입 힌트(type hint)로 반환 타입을 결정합니다. `let v: Vec<i32> = iter.collect();`처럼 명시적으로 타입을 지정하거나, `let v = iter.collect::<Vec<i32>>();`처럼 터보피시(turbofish) 문법을 사용할 수 있습니다. 타입을 지정하지 않으면 컴파일 에러가 발생합니다.
</details>

<details>
<summary><strong>Q> HashSet과 Vec의 차이는 무엇인가요?</strong></summary>

`HashSet<T>`는 중복 없는 값의 집합으로 O(1) 평균 조회 시간을 제공합니다. 순서가 보장되지 않습니다. `Vec<T>`는 중복을 허용하며 순서가 보장됩니다. `HashSet`은 포함 여부 확인이 빠르며 집합 연산(교집합, 합집합 등)을 제공합니다. `Vec`은 인덱스 접근이 빠르며 순서가 중요할 때 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Vec<T>** | 가변 크기 배열 | 힙 할당, capacity/len |
| **HashMap<K, V>** | 해시 테이블 | O(1) 평균 조회 |
| **BTreeMap<K, V>** | 정렬된 맵 | O(log n) 조회, 순서 보존 |
| **HashSet<T>** | 중복 없는 집합 | O(1) 평균 조회 |
| **이터레이터** | 순회 방법 | lazy evaluation |
| **어댑터** | 이터레이터 변환 | map, filter, chain |
| **소비자** | 이터레이터 소비 | collect, sum, fold |


## 다음 수업

다음 글에서는 Rust 중급 — 모듈 시스템, 패키지, 크레이트, use, pub, 파일 구조를 배웁니다.
