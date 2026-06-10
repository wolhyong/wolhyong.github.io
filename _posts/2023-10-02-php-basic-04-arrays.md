---
layout: post
title: "PHP 배열 — 연관 배열, 배열 함수, 다차원 배열, 배열 정렬"
description: "PHP의 배열 시스템을 Zend Engine 해시 테이블(HashTable) 구조와 함께 심층 학습합니다. PHP 배열이 사실상 Ordered Hash Table(정렬된 해시 테이블)로 구현되어 정수 키와 문자열 키를 동시에 지원하는 원리, array_merge와 + 연산자의 차이(키 중복 시 덮어쓰기 vs 유지), sort/asort/ksort의 정렬 알고리즘(Quick Sort 기반), array_map/array_filter/array_reduce의 콜백 기반 배열 처리, 다차원 배열의 메모리 구조와 순회를 다룹니다."
date: 2023-10-02 10:00:00 +0900
category: php
tags: [php, arrays, hashing, sort, array-functions]
level: basic
---

PHP의 배열은 사실상 정렬된 해시 테이블(Ordered Hash Table)로, C 언어의 HashTable 구조체로 구현되어 있습니다.

> **💡 핵심 정리** · PHP 배열은 Zend Engine의 `HashTable` 구조체로 구현됩니다. `arBuckets`(버킷 배열), `nTableSize`(2ⁿ 크기), `nNumOfElements`(실제 요소 수), `pListHead`(삽입 순서 연결 리스트) 필드를 가집니다. 정수 키는 `nIndex = key & (nTableSize - 1)`로 버킷 위치를 계산하고, 문자열 키는 DJBX33A 해시 함수로 변환 후 동일한 인덱싱을 사용합니다. `array_merge()`는 키를 재배열하지만 `+`는 첫 번째 배열의 키를 우선시합니다.

---

## 📚 수업 목표

- PHP 배열의 HashTable 내부 구조를 이해합니다.
- 배열 함수(array_merge, array_map, array_filter)를 이해합니다.
- 다차원 배열의 메모리 구조를 이해합니다.
- 배열 정렬 함수의 차이를 이해합니다.

## 배열 생성

```php
<?php
// 인덱스 배열
$fruits = ["apple", "banana", "cherry"];
$numbers = [1, 2, 3, 4, 5];

// 연관 배열
$user = [
    "name" => "Alice",
    "age" => 25,
    "city" => "Seoul"
];

// 혼합 키
$mixed = [
    0 => "zero",
    "key" => "value",
    1 => "one"
];

// 다차원 배열
$matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: array_merge()와 + 연산자의 차이는 무엇인가요?</strong></summary>

`array_merge($a, $b)`는 숫자 키를 재배열(0부터 다시 할당)하고, 문자열 키는 나중 값으로 덮어씁니다. `$a + $b`는 **첫 번째 배열의 키를 우선시**합니다. 즉, 중복 키가 있으면 `$a`의 값이 유지되고 `$b`의 값은 무시됩니다. 숫자 키도 키로 취급되어 중복 시 `$a`가 우선됩니다. 예: `[0 => 'a'] + [0 => 'b']` → `[0 => 'a']`.
</details>

<details>
<summary><strong>Q: 배열 정렬 함수들의 차이는 무엇인가요?</strong></summary>

| 함수 | 키 유지 | 정렬 기준 | 방향 |
|------|---------|----------|------|
| `sort()` | ❌ (재할당) | 값 | 오름차순 |
| `rsort()` | ❌ (재할당) | 값 | 내림차순 |
| `asort()` | ✅ | 값 | 오름차순 |
| `arsort()` | ✅ | 값 | 내림차순 |
| `ksort()` | ✅ | 키 | 오름차순 |
| `krsort()` | ✅ | 키 | 내림차순 |
| `usort()` | ❌ | 사용자 정의 | 사용자 정의 |

`sort()`는 값 기준 오름차순이지만 키를 재할당하므로 연관 배열에는 `asort()`를 사용하세요.
</details>

<details>
<summary><strong>Q: foreach에서 배열을 수정해도 안전한가요?</strong></summary>

`foreach ($array as $key => &$value)`로 참조 순회하면 배열 요소를 직접 수정할 수 있습니다. 값 복사 순회(`$value`)에서는 수정해도 원본 배열에 영향을 주지 않습니다. **루프 내에서 `unset($array[$key])`로 요소를 제거하는 것은 안전**하지만, `array_push()` 등으로 요소를 추가하면 예상치 못한 동작이 발생할 수 있습니다. 순회 중 구조 변경은 피하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: array_map, array_filter, array_reduce의 차이는 무엇인가요?</strong></summary>

`array_map($callback, $array)`는 각 요소에 콜백을 적용한 새 배열을 반환합니다. `array_filter($array, $callback)`는 콜백이 true를 반환하는 요소만 필터링합니다(콜백 생략 시 false 값 제거). `array_reduce($array, $callback, $initial)`는 배열을 단일 값으로 축소합니다(초기값 누적). `array_map`은 배열 크기가 유지되고, `array_filter`는 축소될 수 있으며, `array_reduce`는 스칼라 값을 반환합니다.
</details>

<details>
<summary><strong>Q: 배열 검색 함수 중에서 가장 빠른 것은 무엇인가요?</strong></summary>

`in_array()`와 `array_search()`는 내부적으로 배열을 순차 검색하므로 O(n)입니다. `isset($array[$key])`와 `array_key_exists()`는 해시 테이블 조회이므로 O(1)입니다. 값 검색이 빈번하다면 `array_flip()`으로 키-값을 뒤집어 `isset()`으로 조회하는 것이 효율적입니다. 단, 중복 값이 있으면 flip 시 마지막 값만 유지되므로 주의하세요.
</details>

---

## 요약

- **HashTable 구조**: 버킷 배열 + 삽입 순서 연결 리스트, 2ⁿ 크기
- **해싱**: 정수 키는 AND 마스킹, 문자열 키는 DJBX33A 해시
- **병합**: `array_merge`(키 재배열) vs `+`(첫 배열 우선)
- **정렬**: sort(값, 키 재할당) vs asort(값, 키 유지) vs ksort(키 기준)
- **함수형**: map(변환) / filter(선별) / reduce(축소)
