---
layout: post
title: "Python 자료구조 — 리스트, 딕셔너리, 집합의 내부와 성능"
description: "Python 내장 자료구조의 내부 구현과 성능 특성을 학습합니다. 리스트의 동적 배열(O(1) 분할 상환 append), 딕셔너리의 해시 테이블(Open Addressing, Python 3.6+ Compact Dict), 집합의 해시 기반 멤버십 테스트(O(1)), 큐/스택으로서의 리스트 사용과 collections.deque의 성능 비교, 그리고 자료구조 선택 기준을 다룹니다."
date: 2023-01-30 10:00:00 +0900
category: python
tags: [python, data-structures, list, dict, set, tuple, deque, performance]
level: beginner
---

Python은 강력한 내장 자료구조를 제공합니다. 리스트, 튜플, 딕셔너리, 집합은 Python 프로그램의 기본 구성 요소이며, 각각의 내부 구현을 이해하면 성능 최적화와 메모리 효율성에서 큰 차이를 만들 수 있습니다.

> **💡 핵심 정리** ・ Python 리스트는 **동적 배열**(PyListObject, 포인터 배열 + over-allocation)로 분할 상환 O(1) append를 보장합니다. 딕셔너리(Python 3.6+ Compact Dict)는 해시 테이블(Open Addressing + Quadratic Probing)로 O(1) 조회/삽입/삭제, 삽입 순서를 보존합니다. 집합(set)은 딕셔너리와 동일한 해시 구조로 O(1) 멤버십 테스트를 제공합니다. 리스트의 insert(0, x)는 O(n)이지만, collections.deque는 양쪽 O(1)입니다.

> **이 수업에서 배울 내용:** 각 자료구조의 내부 메모리 구조, 시간 복잡도 비교표, 상황별 최적 자료구조 선택 기준, 리스트 vs 튜플의 메모리 차이, 딕셔너리 해시 충돌 해결 메커니즘, collections 모듈의 특수 자료구조를 학습합니다.

---

## 📚 수업 목표

- 리스트의 동적 배열 구조와 over-allocation 메커니즘을 이해합니다.
- 튜플이 리스트보다 메모리를 적게 사용하는 이유를 압니다.
- 딕셔너리의 해시 테이블 구조와 Python 3.6+ Compact Dict의 장점을 이해합니다.
- 집합의 해시 기반 멤버십 테스트 원리를 이해합니다.
- 상황별 최적의 자료구조를 선택할 수 있습니다.
- collections.deque, defaultdict, Counter를 활용할 수 있습니다.

## 리스트 — 동적 배열의 내부

```python
# 리스트 생성과 기본 연산
fruits = ["apple", "banana", "cherry"]
fruits.append("date")        # 끝에 추가
fruits.insert(0, "avocado")  # 앞에 삽입
fruits.pop()                 # 끝에서 제거
fruits.remove("banana")      # 값으로 제거
fruits.sort()                # 정렬
```

**깊이 있는 설명 — 리스트의 내부 메모리 구조:**

```text
PyListObject (C 구조체):
  PyObject ob_base;           # 공통 헤더 (16바이트)
  Py_ssize_t ob_size;         # 실제 요소 수 (8바이트)
  PyObject **ob_item;         # PyObject* 포인터 배열 (8바이트)
  Py_ssize_t allocated;       # 할당된 총 용량 (8바이트)

메모리 예시: fruits = ["apple", "banana", "cherry"]
  리스트 객체: 40바이트 (헤더 + 필드)
  포인터 배열: 24바이트 (8바이트 × 3개 포인터, allocated=4면 32바이트)
  문자열 객체: 각각 약 50~60바이트 (힙에 별도 저장)

  총 리스트 관련 메모리: 약 72바이트 (문자열 제외)
```

### 리스트 연산의 시간 복잡도

| 연산 | 시간 복잡도 | 설명 | 예시 | 10만 개 기준 |
|------|:---------:|------|------|:----------:|
| 인덱싱 | O(1) | 포인터 배열 직접 접근 | `lst[50000]` | ~0.05μs |
| append | O(1)* | 분할 상환, 대부분 즉시 | `lst.append(x)` | ~0.1μs |
| pop() | O(1) | 마지막 요소 제거 | `lst.pop()` | ~0.1μs |
| insert(0, x) | O(n) | 모든 요소 이동 | `lst.insert(0, x)` | ~5ms |
| pop(0) | O(n) | 첫 요소 제거 + 이동 | `lst.pop(0)` | ~5ms |
| 검색 (in) | O(n) | 선형 탐색 | `x in lst` | ~5ms |
| 슬라이싱 | O(k) | k개 요소 복사 | `lst[10:20]` | ~0.5μs |
| 정렬 | O(n log n) | Timsort | `lst.sort()` | ~16ms |
| len() | O(1) | ob_size 필드 읽기 | `len(lst)` | ~0.02μs |

### 리스트 vs 튜플 메모리 비교

```python
import sys

lst = [1, 2, 3, 4, 5]
tpl = (1, 2, 3, 4, 5)

print(f"리스트 크기: {sys.getsizeof(lst)} 바이트")  # 104
print(f"튜플 크기: {sys.getsizeof(tpl)} 바이트")    # 80
# 튜플이 23% 더 작음!
```

**깊이 있는 설명 — 튜플이 리스트보다 작은 이유:**

```text
리스트 (104바이트, 요소 5개):
  ob_size = 5, allocated = 8 (over-allocation으로 3개 여유 공간)
  오버헤드: 40 (헤더) + 64 (8개 포인터 × 8) = 104

튜플 (80바이트, 요소 5개):
  ob_size = 5, allocated = 5 (정확히 필요한 만큼만)
  오버헤드: 40 (헤더) + 40 (5개 포인터 × 8) = 80
  + 불변이므로 over-allocation 불필요

1000만 개 요소 기준:
  리스트: 약 80MB (8바이트 × 1000만 + allocated 오버헤드)
  튜플:  약 64MB (8바이트 × 1000만 + 정확한 할당)
  차이: 약 20% (리스트가 더 큼)
```

---

## 딕셔너리 — 해시 테이블의 내부

```python
# 딕셔너리 생성과 기본 연산
scores = {
    "Alice": 95,
    "Bob": 87,
    "Charlie": 92
}

# 조회
print(scores["Alice"])     # 95
print(scores.get("David", 0))  # 0 (기본값)

# 추가/수정
scores["David"] = 78
scores["Alice"] = 98

# 삭제
del scores["Bob"]

# 키/값 반복
for name, score in scores.items():
    print(f"{name}: {score}점")
```

**깊이 있는 설명 — Python 3.6+ Compact Dict 구조:**

```text
Python 3.5 이하 (비효율적):
  entries = [
    [hash_0, key_0, value_0],  # 인덱스 0
    [hash_1, key_1, value_1],  # 인덱스 1
    [empty, empty, empty],     # 인덱스 2 (빈 슬롯)
    [hash_3, key_3, value_3],  # 인덱스 3
  ]
  → entries의 1/3이 비어 있어도 메모리 점유
  → 삽입 순서 보존 안 됨

Python 3.6+ Compact Dict (메모리 효율적):
  indices = [2, 0, -1, 1]    # 해시 테이블 (int8/int16/int32 배열)
  entries = [
    [-792..., 'Alice', 95],    # 인덱스 0: 실제 항목
    [1187..., 'Bob', 87],      # 인덱스 1
    [---],                      # 인덱스 2 (더미)
    [5689..., 'Charlie', 92],  # 인덱스 3
  ]

장점:
  1. 메모리 약 30% 절약 (indices 배열이 작음)
  2. 삽입 순서 보존 (entries 배열이 순서대로)
  3. 반복(Iteration)이 더 빠름 (entries만 순회)
```

### 딕셔너리 연산의 시간 복잡도

| 연산 | 평균 | 최악 | 설명 |
|------|:---:|:---:|------|
| 조회 (d[key]) | O(1) | O(n) | 해시 → 인덱스 → entries 접근 |
| 삽입 (d[key] = v) | O(1) | O(n) | 해시 충돌 시 probing |
| 삭제 (del d[key]) | O(1) | O(n) | dummy 표시 (재해싱 필요 시 정리) |
| 멤버십 (key in d) | O(1) | O(n) | 해시 테이블 조회 |
| 반복 (for k in d) | O(n) | O(n) | entries 배열 순회 |

### 해시 가능한 객체 (Hashable)

```python
# 해시 가능 — 딕셔너리 키로 사용 가능
hash("hello")    # 정수 (문자열)
hash(42)         # 정수 (숫자)
hash((1, 2, 3))  # 정수 (튜플 — 모든 요소가 불변이면 가능)

# 해시 불가능 — 딕셔너리 키로 사용 불가
# hash([1, 2, 3])  # TypeError: unhashable type: 'list'
# hash({"a": 1})   # TypeError: unhashable type: 'dict'

# 커스텀 객체는 기본적으로 해시 가능 (id 기반)
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __hash__(self):
        return hash((self.x, self.y))

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
```

**성능 측정 — 리스트 vs 딕셔너리 검색:**

| 자료구조 | 10만 개 중 검색 | 100만 개 중 검색 |
|---------|:-------------:|:--------------:|
| 리스트 (in) | ~5ms | ~50ms |
| 집합 (in) | ~0.05μs | ~0.05μs |
| 딕셔너리 (in) | ~0.05μs | ~0.05μs |

100만 개 중 검색 시 **리스트는 집합/딕셔너리보다 100만 배 느립니다!**

---

## 집합 — 해시 기반 멤버십 테스트

```python
# 집합 생성
fruits = {"apple", "banana", "cherry"}
numbers = set([1, 2, 3, 4, 5])

# 집합 연산
fruits.add("date")
fruits.remove("banana")

# 집합 연산
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)  # 합집합: {1, 2, 3, 4, 5, 6}
print(a & b)  # 교집합: {3, 4}
print(a - b)  # 차집합: {1, 2}
print(a ^ b)  # 대칭 차집합: {1, 2, 5, 6}
```

**깊이 있는 설명 — 집합의 해시 테이블 구조:**

```text
집합(set)은 딕셔너리와 거의 동일한 해시 테이블 구조를 사용합니다.
차이점: 값(value) 필드가 없고, 키(key)만 저장합니다.

PySetObject:
  PyObject ob_base;           # 헤더
  Py_ssize_t fill;            # 사용 중인 슬롯 + dummy
  Py_ssize_t used;            # 실제 사용 중인 슬롯
  PySetEntry *table;          # 해시 테이블 (entries 배열)
  Py_hash_t hash;             # frozenset의 해시 (집합은 해시 불가)
  Py_ssize_t mask;            # 테이블 크기 - 1

PySetEntry (각 슬롯):
  PyObject *key;              # 키 객체 참조
  Py_hash_t hash;             # 키의 해시 (캐싱)

메모리 (10만 개 정수 집합):
  해시 테이블 크기: 약 1.6MB (16바이트 × 10만 개)
  리스트: 약 0.8MB (8바이트 × 10만 개)
  → 집합이 약 2배 더 크지만 O(1) 검색!
```

---

## collections 모듈 — 특수 자료구조

```python
from collections import deque, defaultdict, Counter, OrderedDict

# 1. deque — 양방향 큐 (O(1) 양쪽 추가/제거)
dq = deque([1, 2, 3])
dq.append(4)        # 오른쪽 추가: [1, 2, 3, 4]
dq.appendleft(0)    # 왼쪽 추가: [0, 1, 2, 3, 4]
dq.pop()            # 오른쪽 제거: 4
dq.popleft()        # 왼쪽 제거: 0

# 2. defaultdict — 기본값이 있는 딕셔너리
word_counts = defaultdict(int)  # int() = 0
words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
for word in words:
    word_counts[word] += 1  # 키가 없어도 KeyError 없이 0부터 시작
# {'apple': 3, 'banana': 2, 'cherry': 1}

# 3. Counter — 요소 개수 세기
from collections import Counter
cnt = Counter(words)
print(cnt.most_common(2))  # [('apple', 3), ('banana', 2)]
```

**성능 측정 — 리스트 vs deque (앞에 삽입):**

| 연산 | 리스트 | deque | 10만 번 기준 |
|------|:-----:|:----:|:----------:|
| append (뒤) | O(1)* | O(1) | ~10ms (동일) |
| appendleft (앞) | O(n) | **O(1)** | **리스트 2,500ms vs deque 10ms** |
| pop (뒤) | O(1) | O(1) | ~10ms (동일) |
| popleft (앞) | O(n) | **O(1)** | **리스트 2,500ms vs deque 10ms** |
| 인덱싱 | O(1) | O(n) | deque는 느림 (내부 연결 리스트 탐색) |

> **실전 노하우:** 큐/스택이 필요하면 `deque`를 사용하세요. 리스트의 `pop(0)`이나 `insert(0, x)`는 O(n)으로, 10만 개 리스트에서 앞에 삽입하면 약 2.5초가 걸리지만 deque는 0.01초도 걸리지 않습니다.

---

## 자료구조 선택 가이드

```python
# 상황별 최적 자료구조 선택

# 1. 순서 있는 데이터 + 인덱싱 → 리스트
scores = [85, 92, 78, 95]
print(scores[2])  # 78

# 2. 중복 제거 + 멤버십 검사 → 집합
unique_ids = {101, 102, 103, 104}
if 102 in unique_ids:  # O(1)!
    print("존재함")

# 3. 키-값 매핑 → 딕셔너리
user = {"name": "Alice", "age": 25}

# 4. FIFO 큐 → deque
from collections import deque
queue = deque(["task1", "task2", "task3"])
queue.popleft()  # 'task1'

# 5. LIFO 스택 → 리스트 (또는 deque)
stack = []
stack.append(1)
stack.pop()  # 1

# 6. 개수 세기 → Counter
from collections import Counter
counts = Counter("hello world")
# {'l': 3, 'o': 2, 'h': 1, 'e': 1, ' ': 1, 'w': 1, 'r': 1, 'd': 1}
```

### 자료구조 선택 기준표

| 필요한 기능 | 권장 자료구조 | 시간 복잡도 | 메모리 |
|-----------|------------|:---------:|:-----:|
| 순서 + 인덱싱 | list | O(1) 접근 | 중간 |
| 순서 + 변경 없음 | tuple | O(1) 접근 | 낮음 |
| 키-값 매핑 | dict | O(1) 조회 | 높음 |
| 중복 제거 | set | O(1) 검색 | 높음 |
| 양방향 큐 | deque | O(1) 양쪽 | 중간 |
| 개수 세기 | Counter | O(n) 생성 | 중간 |
| 기본값 딕셔너리 | defaultdict | O(1) 조회 | 높음 |

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 리스트와 튜플 중 무엇을 선택해야 하나요?</strong></summary>

변경이 필요하면 리스트, 변경되지 않으면 튜플을 사용하세요. 튜플은 리스트보다 메모리를 약 20~30% 적게 사용하고, 생성 속도도 빠릅니다. 또한 튜플은 해시 가능하므로 딕셔너리 키로 사용할 수 있습니다. 함수가 여러 값을 반환할 때도 튜플이 자연스럽습니다. `return x, y`는 사실 튜플을 반환하는 것입니다.
</details>

<details>
<summary><strong>Q: 딕셔너리와 리스트 중 검색이 더 빠른 것은?</strong></summary>

딕셔너리입니다. 딕셔너리의 키 검색은 O(1) (해시 테이블), 리스트의 값 검색은 O(n) (선형 탐색)입니다. 100만 개 요소에서 검색할 때 딕셔너리는 약 0.05μs, 리스트는 약 50ms가 걸립니다. 즉 **딕셔너리가 100만 배 빠릅니다**. 단, 딕셔너리는 리스트보다 메모리를 2~3배 더 사용합니다.
</details>

<details>
<summary><strong>Q: 집합과 리스트 중 멤버십 검사는 무엇이 빠른가요?</strong></summary>

집합입니다. `x in set`은 O(1) (해시 테이블), `x in list`는 O(n) (선형 탐색)입니다. 중복이 없고 순서가 중요하지 않으며 멤버십 검사가 필요한 경우에는 항상 집합을 사용하세요. 단, 집합은 리스트보다 메모리를 약 2배 더 사용합니다.
</details>

<details>
<summary><strong>Q: for 루프에서 딕셔너리를 수정해도 되나요?</strong></summary>

순회 중인 딕셔너리에 키를 추가/삭제하면 `RuntimeError: dictionary changed size during iteration`이 발생합니다. 딕셔너리를 수정해야 한다면 **키 목록의 복사본**을 순회하세요: `for key in list(d.keys()):` 또는 `for key in list(d):`. 딕셔너리 컴프리헨션을 사용하는 것도 좋은 방법입니다.
</details>

<details>
<summary><strong>Q: OrderedDict는 여전히 필요한가요?</strong></summary>

Python 3.7부터 일반 딕셔너리도 삽입 순서를 보존합니다. 하지만 `OrderedDict`가 필요한 경우가 있습니다: (1) 순서가 중요한 비교 — `OrderedDict는 == 비교 시 순서도 비교, (2) `move_to_end()` 메서드 — 특정 키를 앞/뒤로 이동, (3) `popitem(last=True/False)` — LIFO/FIFO 동작. 일반적인 용도라면 일반 딕셔너리로 충분합니다.
</details>

---

## 요약

- **리스트**: 동적 배열, O(1) 인덱싱/append, O(n) 앞 삽입/제거
- **튜플**: 불변 배열, 리스트보다 20~30% 작은 메모리, 해시 가능
- **딕셔너리**: 해시 테이블(Compact Dict), O(1) 조회/삽입/삭제, Python 3.7+ 삽입 순서 보존
- **집합**: 해시 테이블(딕셔너리와 동일 구조), O(1) 멤버십 테스트, 중복 자동 제거
- **deque**: 양방향 큐, O(1) 양쪽 추가/제거, 큐/스택에 최적
- **Counter**: 요소 개수 자동 집계, `most_common()`으로 상위 N개 추출
- **defaultdict**: KeyError 없는 딕셔너리, 기본값 자동 생성
- **선택 기준**: 검색 → set/dict, 순서+인덱싱 → list, 큐 → deque, 불변 → tuple
