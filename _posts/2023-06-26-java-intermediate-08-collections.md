---
layout: post
title: "Java 컬렉션 프레임워크 — List, Set, Map, Queue, 정렬, 검색"
description: "Java Collections Framework를 내부 자료구조 레벨에서 심층 학습합니다. ArrayList의 동적 배열 구조와 grow() 메서드의 크기 증가 전략(50%), LinkedList의 이중 연결 리스트 노드 구조, HashMap의 해시 충돌 처리(Java 8+ TreeNode/Red-Black Tree)와 해시 버킷 재할당(rehash), TreeMap의 Red-Black Tree 균형 유지, Collections 유틸리티의 정렬(MergeSort/TimSort)과 이진 검색을 다룹니다."
date: 2023-06-26 10:00:00 +0900
category: java
tags: [java, collections, arraylist, linkedlist, hashmap, treeset, timsort]
level: intermediate
---

Java Collections Framework는 데이터를 저장하고 조작하기 위한 통합 아키텍처입니다. 각 컬렉션은 서로 다른 성능 특성을 가집니다.

> **💡 핵심 정리** · ArrayList는 내부 Object[] 배열을 사용하며, 크기 초과 시 `grow()`가 1.5배씩 증가시킵니다(O(n) 재할당). LinkedList는 각 노드가 이전/다음 포인터를 가진 이중 연결 리스트로, 삽입/삭제 O(1)이지만 검색 O(n)입니다. HashMap(Java 8+)은 해시 충돌 시 8개 이상이면 TreeNode(Red-Black Tree)로 변환하여 최악 O(log n)을 보장합니다.

---

## 📚 수업 목표

- List, Set, Map, Queue의 특성과 구현체를 이해합니다.
- ArrayList와 LinkedList의 성능 차이를 이해합니다.
- HashMap의 내부 구조와 해시 충돌 처리 방식을 이해합니다.
- TreeSet/TreeMap의 정렬 동작을 이해합니다.
- Collections 유틸리티 메서드를 활용할 수 있습니다.

## 컬렉션 주요 구현체

| 인터페이스 | 구현체 | 내부 구조 | 정렬 | 중복 | 순서 | 검색 | 삽입/삭제 |
|-----------|--------|----------|:---:|:---:|:---:|:---:|:--------:|
| **List** | ArrayList | 동적 배열 | ❌ | ✅ | ✅ | O(1) | O(n) |
| **List** | LinkedList | 이중 연결 리스트 | ❌ | ✅ | ✅ | O(n) | O(1)* |
| **Set** | HashSet | HashMap 기반 | ❌ | ❌ | ❌ | O(1) | O(1) |
| **Set** | TreeSet | Red-Black Tree | ✅ | ❌ | ✅ | O(log n) | O(log n) |
| **Map** | HashMap | 해시 테이블 | ❌ | 키만 | ❌ | O(1) | O(1) |
| **Map** | TreeMap | Red-Black Tree | ✅ | 키만 | ✅ | O(log n) | O(log n) |
| **Queue** | PriorityQueue | 힙(Heap) | ✅ | ✅ | ✅ | O(1) | O(log n) |

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: ArrayList와 LinkedList 중 어떤 것을 선택해야 하나요?</strong></summary>

대부분의 경우 **ArrayList**가 더 좋습니다. 메모리 지역성(CPU 캐시 히트)이 좋고, get()이 O(1)이며, 메모리 오버헤드가 적습니다. LinkedList는 **맨 앞/뒤에서의 빈번한 삽입/삭제**가 있고, 검색보다 순차 접근이 주된 경우에만 고려하세요. LinkedList의 get(index)은 O(n)이므로, 인덱스 접근이 필요하면 절대 사용하지 마세요.
</details>

<details>
<summary><strong>Q: HashMap의 초기 용량과 로드 팩터는 어떻게 설정하나요?</strong></summary>

기본값(초기 용량 16, 로드 팩터 0.75)은 대부분의 상황에 적합합니다. 데이터 개수를 예측할 수 있다면 `new HashMap<>(예상크기 * 1.33)`으로 초기 용량을 설정하여 재할당(rehash)을 방지하세요. 로드 팩터 0.75는 시간과 공간의 균형점입니다. 너무 높으면(1.0) 공간은 절약되지만 해시 충돌이 증가하고, 너무 낮으면(0.5) 공간 낭비가 심합니다.
</details>

<details>
<summary><strong>Q: HashSet과 TreeSet 중 어떤 것을 선택해야 하나요?</strong></summary>

**정렬이 필요**하면 TreeSet, **정렬이 필요 없고 성능이 중요**하면 HashSet을 선택하세요. HashSet은 O(1)의 삽입/검색/삭제를 제공하고, TreeSet은 O(log n)입니다. TreeSet은 요소가 `Comparable`을 구현하거나 생성자에 `Comparator`를 제공해야 합니다. LinkedHashSet은 입력 순서를 유지하는 HashSet의 중간 옵션입니다.
</details>

<details>
<summary><strong>Q: HashMap과 Hashtable의 차이는 무엇인가요?</strong></summary>

**HashMap**: 동기화되지 않음(더 빠름), null 키/값 허용. **Hashtable**: 동기화됨(스레드 안전, 더 느림), null 키/값 불허. HashMap은 Iterator가 fail-fast(수정 감지 시 ConcurrentModificationException)이고, Hashtable은 Enumeration이 fail-safe입니다. 멀티스레드 환경에서는 `ConcurrentHashMap`을 사용하세요(Hashtable보다 성능이 좋음).
</details>

<details>
<summary><strong>Q: Collections.sort()는 어떤 정렬 알고리즘을 사용하나요?</strong></summary>

Java 7+부터는 **TimSort**(Tim Peters가 개발한 MergeSort + InsertionSort 하이브리드)를 사용합니다. TimSort는 이미 정렬된 데이터에서 O(n)의 성능을 보이고, 최악의 경우 O(n log n)입니다. Java 6까지는 MergeSort를 사용했습니다. TimSort는 부분적으로 정렬된 실제 데이터(real-world data)에서 뛰어난 성능을 보입니다.
</details>

---

## 요약

- **ArrayList**: 동적 배열, 1.5배 증가, get O(1)
- **LinkedList**: 이중 연결 리스트, 양쪽 끝 O(1), 검색 O(n)
- **HashMap**: 해시 테이블 + Red-Black Tree(충돌 8+), O(1) 평균
- **TreeSet/TreeMap**: Red-Black Tree, O(log n), 자동 정렬
- **Collections**: sort(TimSort), binarySearch, unmodifiable, synchronized
