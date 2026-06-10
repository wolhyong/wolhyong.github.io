---
layout: post
title: "Python 자료형과 변수 — 동적 타이핑과 객체 참조의 이해"
description: "Python의 자료형 시스템을 내부 동작 원리와 함께 학습합니다. 동적 타이핑의 실제 메커니즘(PyObject*, 타입 태깅), 불변 객체와 가변 객체의 메모리 차이, 숫자형의 내부 표현, 문자열 인터닝과 슬라이싱의 원리를 다룹니다."
date: 2023-01-09 10:00:00 +0900
category: python
tags: [python, data-types, variables, dynamic-typing, integers, strings, boolean, type-system]
level: beginner
---

Python은 **동적 타이핑(dynamic typing)** 언어로, 변수의 타입이 런타임에 결정됩니다. 이는 C나 Java처럼 변수 선언 시 타입을 명시하는 정적 타이핑과 근본적으로 다른 방식입니다.

> **💡 핵심 정리** ・ Python의 모든 변수는 **객체 참조**입니다. `x = 5`는 정수 5를 담는 것이 아니라, 정수 객체(메모리 28바이트)에 대한 참조를 저장합니다. 동적 타이핑은 CPython의 `PyObject*` 구조체(ob_refcnt + ob_type + ob_size)로 구현되며, 타입 확인은 실행마다 이루어집니다. 정수 1회 연산은 약 50ns, 문자열 연결은 새 객체 할당으로 인해 O(n)입니다.

> **이 수업에서 배울 내용:** Python 변수가 C 변수와 메모리 구조가 어떻게 다른지, 정수가 메모리에서 어떻게 표현되는지(가변 길이 정수), 문자열이 왜 불변(immutable)인지와 슬라이싱의 O(k) 시간 복잡도, 리스트와 튜플의 메모리 사용량 차이가 30~50% 나는 이유, 그리고 타입 변환의 내부 비용까지 학습합니다.

---

## 📚 수업 목표

- Python의 동적 타이핑 메커니즘을 이해합니다.
- 불변(immutable)과 가변(mutable) 객체의 차이를 메모리 수준에서 이해합니다.
- 주요 내장 자료형의 특징과 성능 특성을 파악합니다.
- 타입 변환과 형변환의 비용을 이해합니다.
- 변수의 스코프와 참조 방식을 학습합니다.

## 변수와 객체 — C와 Python의 메모리 차이

```python
# Python 변수 선언
x = 5
y = x
x = 10

print(x)  # 10
print(y)  # 5
```

**깊이 있는 설명 — Python 변수가 C와 근본적으로 다른 이유:**

```text
C 언어에서:
  int x = 5;    // 메모리 주소 0x1000에 4바이트 정수 저장
  int y = x;    // x의 값 5를 복사하여 y의 메모리(0x1004)에 저장
  x = 10;       // 0x1000의 값을 10으로 변경

Python에서:
  x = 5         // 힙에 PyObject (정수 5)를 생성
                // x라는 이름을 로컬 딕셔너리에 등록
                // x → PyObject 주소 0x7f... (참조)
  
  y = x         // y라는 이름을 로컬 딕셔너리에 등록
                // y → 같은 PyObject 주소 0x7f... (참조 복사)
                // ob_refcnt = 2 (x와 y가 참조)
  
  x = 10        // 새 PyObject (정수 10)를 힙에 생성
                // x → 새 PyObject 주소 0x9f... (재바인딩)
                // 이전 객체의 ob_refcnt = 1 (y만 참조)
```

### PyObject 구조체

모든 Python 객체의 메모리 시작 부분에는 공통 헤더인 `PyObject`가 있습니다:

```c
// CPython 내부 구조 (Include/object.h)
typedef struct _object {
    Py_ssize_t ob_refcnt;      // 참조 카운트 (8바이트)
    PyTypeObject *ob_type;     // 타입 객체 포인터 (8바이트)
} PyObject;

// 예: PyLongObject (정수)
struct _longobject {
    PyObject ob_base;           // 공통 헤더 (16바이트)
    Py_ssize_t ob_size;         // 숫자의 길이 (8바이트, 부호 포함)
    uint32_t ob_digit[1];       // 가변 길이 숫자 배열 (각 30비트)
};
```

**참조 카운팅 메커니즘:**

```python
import sys

a = 42
print(sys.getrefcount(a))  # 최소 3 이상 (a, 인자, 인터닝)

b = a
print(sys.getrefcount(a))  # 1 증가 (b가 추가 참조)

del b
print(sys.getrefcount(a))  # 1 감소 (b 참조 해제)
```

---

## 숫자형 — int, float, complex의 내부 표현

```python
# 정수 (int) — 임의 정밀도
a = 42          # 작은 정수
b = 2 ** 100    # 큰 정수 — 30자리 십진수

# 실수 (float) — IEEE 754 배정밀도 (64비트)
c = 3.14
d = 1.5e-10

# 복소수 (complex)
e = 3 + 4j
```

**깊이 있는 설명 — Python 정수의 가변 길이 표현:**

대부분의 언어에서 정수는 32비트(4바이트) 또는 64비트(8바이트)로 고정되지만, Python은 **임의 정밀도(arbitrary precision)** 를 지원합니다.

```text
작은 정수 (예: 42):
  PyLongObject { ob_refcnt: 3, ob_type: &PyLong_Type, ob_size: 1, ob_digit[0]: 42 }
  총 크기: 16 (헤더) + 8 (ob_size) + 4 (ob_digit[0]) + 4 (패딩) = 32바이트

큰 정수 (예: 2**100):
  ob_size = 4 (4개의 30비트 "digit"으로 표현)
  ob_digit = [0x403D, 0x186A0, 0x65A4B, 0x3]
  값 = 0x3 * 2^90 + 0x65A4B * 2^60 + 0x186A0 * 2^30 + 0x403D
  = 1,267,650,600,228,229,401,496,703,205,376 (30자리)
  총 크기: 16 + 8 + 16 + 4(패딩) = 44바이트

작은 정수 캐싱:
  CPython은 -5부터 256까지의 정수를 미리 생성하여 캐싱합니다.
  a = 100; b = 100 → a is b (True) — 같은 객체
  a = 1000; b = 1000 → a is b (False) — 다른 객체 (경우에 따라 다름)
```

| 연산 | 시간 복잡도 | 예시 |
|------|:----------:|------|
| int + int (작은 수) | O(1) | 42 + 7 ≈ 50ns |
| int + int (큰 수, n자리) | O(n) | 2^10000 + 2^10000 |
| float + float | O(1) | 3.14 + 2.72 ≈ 50ns |
| int ↔ float 변환 | O(1) | float(42) ≈ 100ns |
| 문자열 → int | O(n) | int("12345") |

---

## 문자열 — 불변 객체와 메모리 관리

```python
# 문자열 생성
s1 = "Hello"
s2 = 'World'
s3 = """여러 줄
문자열"""

# 문자열 연산
s = "Hello" + " " + "World"  # 새 문자열 생성
sub = s[0:5]                   # 슬라이싱 → 새 문자열
length = len(s)                # 길이
```

**깊이 있는 설명 — 문자열이 불변(immutable)인 이유:**

```text
문자열이 불변인 이유:
  1. 해시 가능 → 딕셔너리 키로 사용 가능
  2. 인터닝(interning) → 동일 문자열이 메모리를 공유
  3. 스레드 안전성 → 읽기 전용 데이터는 동기화 불필요
  4. 보안 → 비밀번호 등 민감 정보가 실수로 변경되지 않음

메모리 구조:
  s = "Hello" → PyUnicodeObject { ... , length: 5, state: 0, ... }
  → 내부적으로 UTF-8, UTF-16, UTF-32 중 가장 압축적인 인코딩 선택

문자열 연결의 성능:
  "A" + "B" + "C" → 3개의 중간 문자열 생성 (O(n^2))
  "".join(["A", "B", "C"]) → 한 번에 연결 (O(n))
  
  100,000개 문자열 연결:
    + 연산자: 약 5,000ms (문자열 복사가 제곱 증가)
    join(): 약 10ms (500배 빠름!)
```

**문자열 인터닝:**

```python
# 인터닝: 동일 리터럴이 같은 메모리 주소를 공유
a = "hello_world"
b = "hello_world"
print(a is b)  # True (CPython이 짧은 문자열 리터럴을 인터닝)

# 동적 생성은 인터닝되지 않음
c = "hello_" + "world"
print(a is c)  # False (런타임에 생성)
```

---

## 불변 vs 가변 객체

Python의 모든 객체는 **불변(immutable)** 또는 **가변(mutable)** 으로 분류됩니다.

| 자료형 | 가변성 | 메모리 할당 | 예시 |
|-------|:-----:|-----------|------|
| int | 불변 | 새 값마다 새 객체 | `x = 5; x += 1` → 새 객체 |
| float | 불변 | 새 값마다 새 객체 | `y = 3.14` |
| str | 불변 | 연결 시 새 객체 | `"a" + "b"` → 새 문자열 |
| tuple | 불변 | 생성 시 고정 | `(1, 2, 3)` |
| bytes | 불변 | 생성 시 고정 | `b"hello"` |
| **list** | **가변** | **내부 변경 가능** | `lst.append(4)` |
| **dict** | **가변** | **키/값 추가 가능** | `d["key"] = "value"` |
| **set** | **가변** | **추가/제거 가능** | `s.add(5)` |

```python
# 가변 객체의 참조 동작
list1 = [1, 2, 3]
list2 = list1      # 참조 복사 (같은 객체)
list2.append(4)    # list1도 변경됨!

print(list1)  # [1, 2, 3, 4]
print(list2)  # [1, 2, 3, 4]

# 불변 객체는 이런 문제가 없음
a = 10
b = a
b = 20         # a는 변경되지 않음 (b가 새 객체 참조)
print(a)       # 10
print(b)       # 20
```

**깊이 있는 설명 — 함수 인자 전달의 동작:**

```python
def modify_list(lst):
    lst.append(4)      # 원본 리스트 변경 (가변 객체)
    
def reassign_list(lst):
    lst = [10, 20, 30]  # 새 리스트 생성 (원본 영향 없음)

my_list = [1, 2, 3]
modify_list(my_list)
print(my_list)  # [1, 2, 3, 4] — 변경됨!

reassign_list(my_list)
print(my_list)  # [1, 2, 3, 4] — 변경 안 됨!
```

```text
내부 동작:
  Python의 함수 인자는 "참조에 의한 전달(pass by reference)"이 아니라
  "참조 값의 복사(pass by assignment)"입니다.
  
  함수 호출 시:
    1. 인자로 받은 참조(포인터)가 복사되어 함수의 로컬 변수에 저장
    2. 가변 객체의 내용을 변경하면 원본도 영향 받음 (같은 객체니까)
    3. 하지만 변수 자체에 새 값을 할당(reassign)하면
       로컬 변수만 새 객체를 가리키게 되고 원본은 영향 없음
```

---

## 리스트 — 동적 배열의 내부 구조

```python
# 리스트 생성
empty = []
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14]
nested = [[1, 2], [3, 4]]

# 리스트 연산
numbers.append(6)
numbers.insert(0, 0)
numbers.pop()
numbers.sort()
```

**깊이 있는 설명 — 리스트의 내부 메모리 구조:**

```text
Python 리스트는 동적 배열(dynamic array)로 구현되어 있습니다.

내부 구조 (C):
  typedef struct {
      PyObject ob_base;           // 헤더 (16바이트)
      Py_ssize_t ob_size;         // 실제 요소 수 (8바이트)
      PyObject **ob_item;         // PyObject 포인터 배열 (8바이트)
      Py_ssize_t allocated;       // 할당된 총 용량 (8바이트)
  } PyListObject;

메모리 예시: [1, "hello", 3.14]
  리스트 객체 (56바이트):
    ob_size = 3
    ob_item → [ptr_to_1, ptr_to_hello, ptr_to_3.14] (24바이트)
    allocated = 4 (실제 요소 3개지만 4개 공간 할당됨)

크기 조정 (resize):
  append 시 allocated가 부족하면:
    1. 새 크기 = (old_size >> 3) + (old_size < 9 ? 3 : 6) + old_size
       → 약 1.125배 증가 (분할 상환 O(1) 보장)
    2. 새 포인터 배열 할당
    3. 기존 포인터 복사 (memcpy)
    4. 기존 배열 해제

연산별 시간 복잡도:
  접근: lst[i] → O(1) — 포인터 배열의 i번째 항목 직접 접근
  추가: lst.append(x) → 분할 상환 O(1)
  삽입: lst.insert(0, x) → O(n) — 모든 요소를 한 칸씩 이동
  제거: lst.pop() → O(1) — 마지막 요소 제거
  제거: lst.pop(0) → O(n) — 첫 요소 제거 후 모두 이동
  포함: x in lst → O(n) — 선형 탐색
  정렬: lst.sort() → O(n log n) — Timsort 알고리즘
```

---

## 딕셔너리 — 해시 테이블의 내부 구조

```python
# 딕셔너리 생성
empty = {}
scores = {"Alice": 95, "Bob": 87, "Charlie": 92}
mixed = {1: "one", "two": 2, (3, 4): "tuple_key"}  # 키는 불변만 가능

# 딕셔너리 연산
scores["David"] = 78
del scores["Bob"]
"Alice" in scores
```

**깊이 있는 설명 — 딕셔너리의 해시 테이블 충돌 해결:**

```text
내부 구조 (Python 3.6+ Compact Dict):
  PyDictObject:
    PyDictKeysObject *ma_keys;    // 키 배열 (해시 테이블)
    PyObject **ma_values;         // 값 배열 (인덱스로 접근)
    
  키 배열의 각 항목 (PyDictKeyEntry):
    Py_hash_t hash;     // 해시 값 (8바이트, 캐싱됨)
    PyObject *key;      // 키 객체 참조 (8바이트)
    PyObject *value;    // 값 객체 참조 (8바이트)
    
해시 충돌 해결: Open Addressing + Quadratic Probing
  충돌 시: index = (hash + i + i^2) & mask
  → i는 충돌 횟수, mask는 테이블 크기 - 1
  
예: "Alice"의 해시 = 0x12345678
  테이블 크기 = 8, mask = 7
  1차 시도: index = (0x12345678 + 0 + 0) & 7 = 0
  인덱스 0이 비어있음 → 저장 완료!

예: "Bob"의 해시 = 0x87654321
  1차 시도: index = (0x87654321 + 0 + 0) & 7 = 1
  인덱스 1이 비어있음 → 저장 완료!

예: "Charlie"의 해시 = 0x12345678 (Alice와 해시 충돌!)
  1차 시도: index = (0x12345678 + 0 + 0) & 7 = 0
  인덱스 0이 Alice로 점유됨 → 충돌!
  2차 시도: index = (0x12345678 + 1 + 1) & 7 = 2
  인덱스 2가 비어있음 → Charlie 저장 완료!
```

| 연산 | 평균 | 최악 | 설명 |
|------|:---:|:---:|------|
| 조회 | O(1) | O(n) | 해시 충돌이 많으면 느려짐 |
| 삽입 | O(1) | O(n) | 리사이징 시 O(n) |
| 삭제 | O(1) | O(n) | |
| 반복 | O(n) | O(n) | 삽입 순서 보존 (Python 3.7+) |

---

## 타입 변환과 형변환

```python
# 명시적 타입 변환 (casting)
int("42")           # 문자열 → 정수: "42" → 42
float("3.14")       # 문자열 → 실수: "3.14" → 3.14
str(42)             # 정수 → 문자열: 42 → "42"
list("hello")       # 문자열 → 리스트: 'h', 'e', 'l', 'l', 'o'
tuple([1, 2, 3])    # 리스트 → 튜플: (1, 2, 3)
set([1, 2, 2, 3])   # 리스트 → 집합: {1, 2, 3} (중복 제거)

# 주의: float → int는 버림 (내림이 아님)
int(3.999)          # 3 (소수점 이하 버림)
int(-3.999)         # -3 (0 방향으로 버림)
```

**깊이 있는 설명 — 타입 변환의 내부 비용:**

```text
int("12345"):
  1. PyUnicode_AsUTF8String() — UTF-8 변환
  2. _PyLong_FromBytes() — 바이트 → PyLongObject 변환
  3. 각 자릿수별 연산: result = result * 10 + digit
  비용: O(n), n=5 → 약 200ns

str(12345):
  1. PyLong_AsLong() — PyLongObject → C long (검증)
  2. _PyLong_Format() — 숫자를 문자열로 변환
  3. PyUnicode_FromString() — C 문자열 → Python 문자열
  비용: O(n), n=5 → 약 150ns

float("3.14"):
  1. PyUnicode_AsUTF8String()
  2. PyOS_string_to_double() — C의 strtod() 사용
  3. 결과를 PyFloatObject로 감싸기
  비용: 약 100ns
```

---

## 불변 객체의 재사용 (Small Object Cache)

```python
# 작은 정수 캐싱 (-5 ~ 256)
print(100 is 100)    # True (같은 객체)
print(1000 is 1000)  # 일반적으로 False (별도 객체)

# 문자열 인터닝
print("hello" is "hello")  # True (인터닝)
print("hello world!" is "hello world!")  # False (긴 문자열)

# None, True, False는 싱글턴
print(None is None)    # True
print(True is True)    # True
print(False is False)  # True
```

**실전 노하우 — `is` vs `==`의 올바른 사용:**

```python
# is: 객체 정체성 (같은 메모리 주소?)
# ==: 동등성 (같은 값?)

a = [1, 2, 3]
b = [1, 2, 3]

print(a == b)   # True (값이 같음)
print(a is b)   # False (다른 객체)

# 올바른 사용:
# None 체크 → is (관용구)
if result is None:  # 권장
    print("결과 없음")

if result == None:  # 동작은 하지만 비권장
    print("결과 없음")

# 불변 타입 비교 → == (값 비교)
print(x == 42)  # 권장
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Python에서 `is`와 `==`의 차이는 무엇인가요?</strong></summary>
`is`는 객체의 **메모리 주소(정체성)**를 비교하고, `==`는 객체의 **값(동등성)**을 비교합니다. `a is b`는 `id(a) == id(b)`와 같습니다. 정수처럼 작은 불변 객체는 CPython이 재사용하지만, 큰 객체나 가변 객체는 각각 다른 주소를 가집니다. None 체크에는 항상 `is`를 사용하는 것이 관용구입니다.
</details>

<details>
<summary><strong>Q: 문자열 연결에는 왜 join을 사용하라고 하나요?</strong></summary>
파이썬에서 `+`로 문자열을 연결하면 매번 **새 문자열 객체**가 생성되고 기존 문자열이 모두 복사됩니다. 100,000개의 문자열을 `+`로 연결하면 약 5,000ms가 걸리지만, `"".join(list)`는 한 번에 메모리를 할당하고 복사하여 약 10ms만 걸립니다. O(n) vs O(n²)의 차이입니다.
</details>

<details>
<summary><strong>Q: 리스트와 튜플의 성능 차이는 얼마나 되나요?</strong></summary>
튜플은 **불변**이므로 생성 후 메모리가 고정되고 크기가 더 작습니다(리스트의 50~70%). 접근 속도는 비슷하지만, 튜플은 딕셔너리 키로 사용할 수 있고 해시 가능합니다. 반면 리스트는 가변적이어서 추가 메모리(over-allocation)를 미리 확보합니다. 100만 개 요소 기준으로 튜플이 약 30% 적은 메모리를 사용합니다.
</details>

<details>
<summary><strong>Q: Python의 작은 정수 캐싱 범위는 왜 -5부터 256인가요?</strong></summary>
이 범위는 Python이 가장 자주 사용하는 정수 값들입니다. ASCII 문자(0-127), 바이트 값(0-255), 그리고 작은 음수(-5에서 0)를 포함합니다. CPython 소스코드에서 `_PyLong_Init()` 함수가 시작 시 이 범위의 정수 262개를 미리 생성합니다. 257 이상의 정수는 리터럴이라도 일반적으로 매번 새 객체를 생성합니다.
</details>

---

## 요약

- **동적 타이핑**: 모든 변수는 PyObject* 참조, 타입은 런타임에 결정
- **PyObject 헤더**: 모든 객체는 ob_refcnt(참조 카운트) + ob_type(타입 포인터)를 가짐
- **불변 객체**: int, float, str, tuple, bytes — 수정 시 새 객체 생성
- **가변 객체**: list, dict, set — 내부 변경 가능, 참조 공유 주의
- **문자열**: 불변, 인터닝(짧은 리터럴), join()으로 연결 최적화
- **리스트**: 동적 배열, over-allocation으로 분할 상환 O(1) append
- **딕셔너리**: 해시 테이블, Open Addressing + Quadratic Probing
- **참조 카운팅**: 객체의 수명 관리, 0이 되면 즉시 메모리 해제
- **is vs ==**: is는 정체성(메모리 주소), ==는 동등성(값)
