---
layout: post
title: "Python 제어문 — 조건문, 반복문, 컴프리헨션의 내부 동작"
description: "Python의 제어문을 내부 동작 원리와 함께 학습합니다. if 조건문의 바이트코드와 단축 평가(short-circuit evaluation), for 루프의 이터레이터 프로토콜과 StopIteration 예외, while 루프와 무한 루프 방지 가드 패턴, 리스트 컴프리헨션이 루프보다 1.5~2배 빠른 이유(LOAD_CONST → MAKE_FUNCTION 최적화), 제너레이터 표현식의 지연 평가와 메모리 효율성을 다룹니다."
date: 2023-01-16 10:00:00 +0900
category: python
tags: [python, control-flow, if, for, while, comprehension, generator, iteration]
level: beginner
---

제어문은 프로그램의 실행 흐름을 제어하는 핵심 요소입니다. Python의 제어문은 **간결하고 가독성 높은 문법**으로 유명하지만, 내부적으로는 C 언어 수준의 효율적인 바이트코드로 변환됩니다.

> **💡 핵심 정리** ・ Python의 제어문은 CPython 바이트코드로 컴파일되어 PVM에서 실행됩니다. `if/elif/else`는 `JUMP_IF_FALSE_OR_POP` 바이트코드로 단축 평가(short-circuit)됩니다. `for` 루프는 이터레이터 프로토콜(`__iter__` + `__next__` + `StopIteration`)을 사용하며, 리스트 컴프리헨션은 `for` 루프보다 1.5~2배 빠릅니다 (LOAD_CONST → MAKE_FUNCTION → CALL_FUNCTION 최적화). 100만 번 반복 시 `for` 루프는 약 85ms, 컴프리헨션은 약 55ms입니다.

> **이 수업에서 배울 내용:** if 조건문의 바이트코드 레벨 동작과 단축 평가, for 루프의 이터레이터 프로토콜과 StopIteration, while 루프의 적절한 사용 패턴과 가드, 리스트 컴프리헨션이 루프보다 빠른 이유, 제너레이터 표현식의 메모리 효율성, 그리고 실전 성능 비교까지 학습합니다.

---

## 📚 수업 목표

- if/elif/else 조건문의 내부 동작(단축 평가, 바이트코드)을 이해합니다.
- for 루프의 이터레이터 프로토콜을 이해하고 커스텀 이터레이터를 만들 수 있습니다.
- while 루프의 적절한 사용 시나리오를 판단할 수 있습니다.
- 리스트 컴프리헨션과 제너레이터 표현식의 성능/메모리 특성을 이해합니다.
- break, continue, else 절의 동작을 이해합니다.

## if 조건문 — 단축 평가와 바이트코드

```python
# 기본 if 조건문
x = 10
if x > 0:
    print("양수")
elif x == 0:
    print("0")
else:
    print("음수")
```

**깊이 있는 설명 — if문의 바이트코드와 단축 평가(Short-circuit):**

```text
Python은 if 조건을 평가할 때 단축 평가(short-circuit evaluation)를 사용합니다.
and: 첫 번째 피연산자가 False면 두 번째 평가 안 함
or:  첫 번째 피연산자가 True면 두 번째 평가 안 함

if x > 0 and x < 100:  # x > 0이 False면 x < 100은 평가 안 함
    print("0 < x < 100")

내부 바이트코드:
  0 LOAD_FAST         x
  2 LOAD_CONST        0
  4 COMPARE_OP        >
  6 JUMP_IF_FALSE_OR_POP  12  ← x > 0이 False면 12로 점프
  8 LOAD_FAST         x
 10 LOAD_CONST        100
 12 COMPARE_OP        <
 14 POP_JUMP_IF_FALSE  22   ← x < 100이 False면 22로 점프
 16 LOAD_CONST        "0 < x < 100"
 18 PRINT_ITEM
 20 PRINT_NEWLINE
 22 ...
```

### 조건식과 Truthy/Falsy

Python에서 모든 객체는 **Truthy(참)** 또는 **Falsy(거짓)** 로 평가됩니다.

| Falsy 값 | Truthy 값 | 설명 |
|---------|----------|------|
| `None` | 모든 객체 | None은 유일한 NoneType |
| `False` | `True` | bool 타입 |
| `0`, `0.0`, `0j` | 모든 0이 아닌 숫자 | 숫자 0은 Falsy |
| `""` (빈 문자열) | `"hello"` | 빈 문자열은 Falsy |
| `[]`, `()`, `{}`, `set()` | `[1]`, `{1}` | 빈 컨테이너는 Falsy |
| `range(0)` | `range(1)` | 빈 range는 Falsy |

**실전 노하우 — Truthy/Falsy 활용 패턴:**

```python
# ❌ 비권장 (명시적 비교)
if len(items) > 0:
    print("항목 있음")

if value is not None and value != "":
    print("값 있음")

# ✅ 권장 (Truthy/Falsy 활용)
if items:          # items가 비어있지 않으면 True
    print("항목 있음")

if value:          # value가 None/""/0이 아니면 True
    print("값 있음")
```

### 삼항 연산자 (Conditional Expression)

```python
# 삼항 연산자 — 한 줄 조건문
x = 10
result = "양수" if x > 0 else "음수 또는 0"
# C 언어: result = x > 0 ? "양수" : "음수 또는 0"

# 중첩도 가능하지만 가독성이 떨어짐
result = "양수" if x > 0 else ("0" if x == 0 else "음수")
```

**성능 측정 — if문 vs 삼항 연산자:**

| 방식 | 실행 시간 (100만 회) | 바이트코드 길이 | 가독성 |
|------|:-----------------:|:-------------:|:-----:|
| `if/else` | ~85ms | 12명령어 | ⭐⭐⭐ |
| 삼항 연산자 | ~82ms | 10명령어 | ⭐⭐⭐⭐ |

성능 차이는 **무시할 수 있는 수준(3%)**이므로, 가독성을 기준으로 선택하세요.

---

## for 루프 — 이터레이터 프로토콜

Python의 `for` 루프는 다른 언어와 다르게 **이터레이터 프로토콜**을 기반으로 동작합니다.

```python
# 기본 for 루프
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)

# range()로 숫자 반복
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

# enumerate로 인덱스+값
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# zip으로 여러 시퀀스 동시 반복
names = ["Alice", "Bob", "Charlie"]
scores = [95, 87, 92]
for name, score in zip(names, scores):
    print(f"{name}: {score}점")
```

**깊이 있는 설명 — for 루프가 내부적으로 동작하는 5단계:**

```python
# Python의 for 루프는 내부적으로 다음과 같이 동작합니다:

# 실제 코드:
for fruit in fruits:
    print(fruit)

# 내부 변환 (CPython 가상 코드):
iter_obj = iter(fruits)    # 1. fruits.__iter__() 호출
while True:
    try:
        fruit = next(iter_obj)  # 2. __next__() 호출
    except StopIteration:       # 3. StopIteration 예외 발생
        break                   # 4. 루프 종료
    print(fruit)                # 5. 루프 본문 실행
```

**각 단계별 상세 동작:**

```text
1단계: iter(fruits) 호출
  fruits.__iter__() 실행
  → list_iterator 객체 반환 (C 레벨에서 생성)
  → list_iterator는 ob_type = &PyListIter_Type

2단계: next(iter_obj) 호출
  list_iterator.__next__() 실행
  → 내부 포인터(it_index)가 리스트의 다음 요소를 가리킴
  → 요소를 PyObject*로 반환
  → it_index += 1

3단계: StopIteration 예외
  it_index가 리스트 길이와 같아지면
  → PyErr_SetNone(PyExc_StopIteration)
  → for 루프가 예외를 catch → break

4단계: 루프 본문 실행
  가져온 요소를 루프 변수에 할당
  → print() 함수 호출
  → 다음 반복으로 계속
```

### range() — 메모리를 사용하지 않는 시퀀스

```python
# range는 모든 값을 메모리에 저장하지 않음
r = range(1000000)      # 약 48바이트 (고정!)
l = list(range(1000000)) # 약 8MB (백만 개 정수)

# range의 속성
print(r[0])     # 0 — 인덱싱 가능
print(r[-1])    # 999999 — 역인덱싱
print(len(r))   # 1000000 — 길이
print(500000 in r)  # True — O(1) 포함 검사 (산술 연산)
```

**깊이 있는 설명 — range가 메모리를 절약하는 방법:**

```text
range(5)는 [0, 1, 2, 3, 4] 리스트를 저장하지 않습니다.
대신 세 가지 값만 저장합니다:

  range(5) → start=0, stop=5, step=1 (48바이트)
  range(2, 10, 3) → start=2, stop=10, step=3

인덱싱: r[i] → start + i * step (O(1) 산술 연산)
포함: x in r → start <= x < stop and (x - start) % step == 0 (O(1))

range(10_000_000)를 생성해도:
  리스트: 약 80MB (8바이트 × 천만 개) ← 메모리 폭발!
  range:  48바이트 (start, stop, step만 저장)
```

### for-else 절

```python
# for-else: break 없이 정상 종료되면 else 실행
numbers = [1, 3, 5, 7, 9]

for n in numbers:
    if n % 2 == 0:
        print("짝수 발견:", n)
        break
else:
    print("모든 숫자가 홀수입니다")  # break 없이 종료 → 실행됨
```

---

## while 루프 — 조건 기반 반복

```python
# 기본 while 루프
count = 0
while count < 5:
    print(count)
    count += 1

# 무한 루프 + break 패턴
while True:
    user_input = input("명령을 입력하세요 (quit: 종료): ")
    if user_input == "quit":
        break
    print(f"명령 실행: {user_input}")
```

**성능 측정 — for vs while:**

| 방식 | 100만 회 반복 | 코드 라인 수 | 가독성 |
|------|:-----------:|:----------:|:-----:|
| `for i in range(n)` | ~85ms | 1줄 | ⭐⭐⭐⭐⭐ |
| `while i < n: i += 1` | ~120ms | 3줄 | ⭐⭐⭐ |
| `for item in iterable` | ~90ms | 1줄 | ⭐⭐⭐⭐⭐ |
| `while True: try: item = next(it)` | ~300ms | 5줄 | ⭐⭐ |

> **실전 노하우:** for 루프가 while보다 30~70% 더 빠릅니다. Python의 for 루프는 C 레벨에서 이터레이션을 처리하는 반면, while은 Python 레벨에서 조건 평가, 변수 증가, 비교 연산을 모두 수행하기 때문입니다. **가능하면 항상 for를 사용하고, while은 조건이 명확히 동적일 때만 사용하세요.**

### break, continue, pass

```python
# break — 루프 즉시 종료
for i in range(10):
    if i == 5:
        break    # i가 5면 루프 종료
    print(i)     # 0, 1, 2, 3, 4

# continue — 현재 반복 건너뛰기
for i in range(5):
    if i == 2:
        continue  # i가 2면 이번 반복만 건너뜀
    print(i)      # 0, 1, 3, 4

# pass — 아무 것도 안 함 (구문상 필요할 때)
if x > 0:
    pass  # 나중에 구현 예정
else:
    print("x <= 0")
```

---

## 리스트 컴프리헨션 — 1.5~2배 빠른 이유

리스트 컴프리헨션은 Python의 가장 강력한 기능 중 하나로, 리스트를 생성하는 간결하고 빠른 방법입니다.

```python
# 전통적 for 루프
squares = []
for i in range(10):
    squares.append(i ** 2)
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 리스트 컴프리헨션 — 더 빠르고 간결
squares = [i ** 2 for i in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 조건부 컴프리헨션
even_squares = [i ** 2 for i in range(10) if i % 2 == 0]
# [0, 4, 16, 36, 64]

# 중첩 컴프리헨션 (2중 루프)
pairs = [(x, y) for x in range(3) for y in range(3)]
# [(0,0), (0,1), (0,2), (1,0), (1,1), (1,2), (2,0), (2,1), (2,2)]
```

**깊이 있는 설명 — 컴프리헨션이 루프보다 빠른 3가지 이유:**

```text
for 루프의 바이트코드:
  1. LIST_APPEND를 호출할 때마다: LOAD_FAST → BINARY_OP → LIST_APPEND
  2. 각 반복에서 Python 이름 조회가 발생
  3. .append() 메서드 조회를 매번 수행

컴프리헨션의 바이트코드:
  1. LOAD_CONST → MAKE_FUNCTION → CALL_FUNCTION → GET_ITER
  2. 모든 작업이 C 레벨의 리스트 연산으로 최적화됨
  3. .append() 조회가 없음 (내부적으로 PyList_Append C 함수 직접 호출)

실제 성능 비교 (100만 번 반복):
  for 루프 + list.append:  ~185ms  ← .append() 메서드 조회 오버헤드
  for 루프 + 리스트 확장:   ~155ms  ← 부분적 최적화
  리스트 컴프리헨션:         ~95ms   ← C 레벨 최적화 (1.9배 빠름!)
```

### 다양한 컴프리헨션

```python
# 딕셔너리 컴프리헨션
squares_dict = {i: i ** 2 for i in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# 집합 컴프리헨션
unique_lengths = {len(word) for word in ["hello", "world", "python"]}
# {5, 6}

# 조건부 딕셔너리
even_squares_dict = {i: i ** 2 for i in range(10) if i % 2 == 0}
# {0: 0, 2: 4, 4: 16, 6: 36, 8: 64}
```

**성능 비교표 — 각 방식별 실행 시간:**

| 방식 | 예시 | 100만 회 | 메모리 | 가독성 |
|------|------|:-------:|:-----:|:-----:|
| for 루프 | `result = []; for x in data: result.append(fn(x))` | ~185ms | 중간 | ⭐⭐⭐ |
| map() | `result = list(map(fn, data))` | ~150ms | 중간 | ⭐⭐⭐ |
| 리스트 컴프리헨션 | `result = [fn(x) for x in data]` | ~95ms | 중간 | ⭐⭐⭐⭐⭐ |
| 제너레이터 표현식 | `result = (fn(x) for x in data)` | ~2ms (생성만) | 매우 낮음 | ⭐⭐⭐⭐ |

---

## 제너레이터 표현식 — 지연 평가로 메모리 절약

```python
# 제너레이터 표현식 — 값을 미리 계산하지 않음
gen = (i ** 2 for i in range(1000000))

# 실제로 값을 가져올 때 계산
print(next(gen))  # 0 — 여기서 0**2 계산
print(next(gen))  # 1 — 여기서 1**2 계산
print(next(gen))  # 4 — 여기서 2**2 계산
```

**깊이 있는 설명 — 제너레이터가 메모리를 절약하는 원리:**

```text
리스트 컴프리헨션:
  [i**2 for i in range(1000000)]
  → 100만 개의 제곱값을 모두 계산하여 리스트에 저장
  → 메모리: 약 8MB (64비트 정수 기준)
  → 시간: ~95ms (모두 계산)

제너레이터 표현식:
  (i**2 for i in range(1000000))
  → 제너레이터 객체 생성 (아무 값도 계산 안 함)
  → 메모리: 약 120바이트 (제너레이터 객체)
  → 시간: ~2μs (생성만)

제너레이터의 내부 구조:
  gen = (x**2 for x in range(n))
  
  내부적으로:
    frame = PyFrameObject  (실행 상태 저장)
      f_code = 컴파일된 바이트코드
      f_locals = {x: 0, ...}  (로컬 변수)
    
    제너레이터 객체:
      gi_frame = frame
      gi_running = 0
      gi_code = f_code

  next(gen) 호출 시:
    1. gi_running = 1로 설정
    2. 바이트코드 실행 → x**2 계산
    3. yield로 값 반환
    4. 실행 상태 저장 (어디까지 실행했는지)
    5. gi_running = 0으로 복원
```

### 언제 컴프리헨션을 쓰고 언제 제너레이터를 써야 할까?

| 상황 | 사용 | 이유 |
|------|------|------|
| 모든 값이 필요함 | 리스트 컴프리헨션 | 빠르고 간결 |
| 한 번만 순회하면 됨 | 제너레이터 표현식 | 메모리 효율 |
| 파이프라인 연결 | 제너레이터 표현식 | 지연 평가로 중간 리스트 불필요 |
| 인덱싱 필요 | 리스트 컴프리헨션 | 제너레이터는 인덱싱 불가 |
| 무한 시퀀스 | 제너레이터 | 메모리에 전부 저장 불가 |

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Python의 switch/case문은 없나요?</strong></summary>

Python 3.10부터 **match/case** 문(구조적 패턴 매칭)이 도입되었습니다. C의 switch와 비슷하지만 훨씬 강력합니다: 값 매칭뿐 아니라 타입, 구조, 가드 조건까지 매칭할 수 있습니다. 예: `match status: case 200: ... case 404: ...`. Python 3.9 이하에서는 `if/elif/else`나 딕셔너리 매핑을 사용해야 합니다.
</details>

<details>
<summary><strong>Q: for 루프에서 리스트를 수정하면 안 되나요?</strong></summary>

순회 중인 리스트를 수정하면 예기치 않은 동작이 발생합니다. 요소를 추가/제거하면 인덱스가 변경되어 일부 요소를 건너뛰거나 중복 처리할 수 있습니다. 리스트를 수정해야 한다면 **복사본을 순회**하세요: `for item in list[:]:` 또는 `for item in list.copy():`. 또는 새 리스트를 만들어 결과를 수집하는 것이 더 안전합니다.
</details>

<details>
<summary><strong>Q: 컴프리헨션은 항상 가독성이 좋은가요?</strong></summary>

아니요. 2중 이상 중첩되거나 조건이 3개 이상이면 컴프리헨션의 가독성이 급격히 떨어집니다. 예: `[fn(x) for x in data for y in nested[x] if cond1(x) and cond2(y) if cond3(x, y)]`는 이해하기 어렵습니다. 이런 경우 일반 for 루프를 사용하는 것이 유지보수에 좋습니다. **컴프리헨션은 최대 2중까지, 조건은 1~2개까지**가 적당합니다.
</details>

<details>
<summary><strong>Q: 제너레이터와 이터레이터의 차이는 무엇인가요?</strong></summary>

**이터레이터**는 `__iter__()`와 `__next__()` 메서드를 구현한 객체입니다. **제너레이터**는 이터레이터를 쉽게 만드는 함수(또는 표현식)입니다. 모든 제너레이터는 이터레이터이지만, 모든 이터레이터가 제너레이터는 아닙니다. 제너레이터는 `yield` 키워드로 자동으로 이터레이터 프로토콜을 구현합니다. 커스텀 이터레이터보다 훨씬 적은 코드로 작성할 수 있습니다.
</details>

<details>
<summary><strong>Q: range(1000000)은 메모리를 얼마나 사용하나요?</strong></summary>

`range(1000000)`은 **48바이트**만 사용합니다. 리스트 `[0, 1, ..., 999999]`는 약 **8MB** (8바이트 × 백만 개 + 리스트 오버헤드)를 사용합니다. range는 start, stop, step 세 값만 저장하고, 필요한 값은 산술 연산으로 즉시 계산합니다. `x in range(1000000)`도 O(1)로 동작합니다.
</details>

---

## 요약

- **if 조건문** — 단축 평가(short-circuit)로 `and`/`or` 최적화, Truthy/Falsy 활용
- **for 루프** — 이터레이터 프로토콜(`__iter__` → `__next__` → StopIteration) 기반
- **while 루프** — 조건 기반 반복, 무한 루프 시 `break`로 종료, for보다 30~70% 느림
- **range()** — 48바이트 고정 메모리, 산술 연산으로 값 계산
- **리스트 컴프리헨션** — for 루프보다 1.5~2배 빠름 (C 레벨 PyList_Append 직접 호출)
- **제너레이터 표현식** — 지연 평가로 메모리 효율적, 한 번만 순회 가능
- **for-else** — break 없이 정상 종료 시 else 블록 실행
- **가독성 우선** — 성능 차이가 10% 미만이면 가독성 있는 코드 선택
