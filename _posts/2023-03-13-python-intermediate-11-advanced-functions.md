---
layout: post
title: "Python 고급 함수 — 데코레이터, 제너레이터, 람다, 클로저, 이터레이터"
description: "Python의 고급 함수 개념을 내부 동작 원리와 함께 심층 학습합니다. 데코레이터가 함수를 감싸는 과정(closure + wrapper), 제너레이터의 yield가 프레임 객체를 일시 중단시키는 코루틴 메커니즘, 람다 표현식의 바이트코드 레벨 동작, 클로저가 자유 변수를 __closure__에 캡처하는 과정을 다룹니다."
date: 2023-03-13 10:00:00 +0900
category: python
tags: [python, decorator, generator, lambda, closure, iterator, coroutine]
level: intermediate
---

Python에서 함수는 일급 객체(first-class citizen)입니다. 함수를 변수에 할당하고, 인자로 전달하고, 반환할 수 있습니다. 이러한 특성을 기반으로 데코레이터, 제너레이터, 람다 같은 강력한 패턴이 가능합니다.

> **💡 핵심 정리** · Python의 데코레이터는 `@decorator` 구문이 `func = decorator(func)`로 변환되는 syntactic sugar입니다. 제너레이터는 `yield` 키워드가 포함된 함수가 `PyGenObject`를 반환하며, `gi_frame.f_lasti`로 마지막 실행 위치를 추적합니다. 클로저는 자유 변수를 `__closure__` 튜플의 `cell` 객체에 캡처하며, 람다는 `LOAD_CONST` + `MAKE_FUNCTION` 바이트코드로 실행됩니다. 이터레이터 프로토콜은 `__iter__`가 `self`를 반환하고 `__next__`가 `StopIteration`을 발생시킵니다.

> **이 수업에서 배울 내용:** 데코레이터의 동작 원리와 응용(functools.wraps, 인자 있는 데코레이터), 제너레이터의 yield/ yield from/fuel, 람다의 제한사항과 활용, 클로저의 변수 캡처와 늦은 바인딩 문제를 학습합니다.

---

## 📚 수업 목표

- 데코레이터가 함수를 감싸는 메커니즘을 이해합니다.
- 제너레이터의 상태 일시 중단과 재개 과정을 이해합니다.
- 람다의 내부 동작과 제한사항을 이해합니다.
- 클로저의 자유 변수 캡처를 이해합니다.
- 이터레이터 프로토콜을 직접 구현할 수 있습니다.
- 고급 함수 패턴을 실무에 적용할 수 있습니다.

## 데코레이터 — 함수를 감싸는 패턴

```python
import time
from functools import wraps

def timer(func):
    """함수의 실행 시간을 측정하는 데코레이터"""
    @wraps(func)  # 함수 메타데이터 유지
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__}: {elapsed:.3f}ms")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(0.1)
    return "완료"

# 위 코드는: slow_function = timer(slow_function) 와 동일
result = slow_function()  # slow_function: 100.XXXms
```

**깊이 있는 설명 — 데코레이터의 내부 동작:**

```text
@timer
def slow_function():
    ...

실제 실행 과정:

1. slow_function 함수 정의
   → 함수 객체 생성, __name__ = "slow_function"

2. @timer = timer(slow_function)
   → timer 함수 호출 (인자: slow_function 함수 객체)
   → 내부 wrapper 함수 정의 (클로저)
   → wrapper.__closure__ = (slow_function 함수 객체,)
   → wrapper 반환

3. slow_function 이름에 wrapper 할당
   → slow_function(원본)이 wrapper로 대체됨

4. slow_function() 호출 시:
   → 실제로는 wrapper() 실행
   → wrapper 내부에서 start = time.perf_counter()
   → func(*args, **kwargs) = slow_function(원본) 호출
   → elapsed 계산
   → result 반환

@wraps(func)가 하는 일:
  wrapper.__name__ = func.__name__
  wrapper.__doc__ = func.__doc__
  wrapper.__module__ = func.__module__
  wrapper.__wrapped__ = func  # 원본 참조 유지
```

### 인자가 있는 데코레이터

```python
def repeat(n=2):
    """함수를 n번 반복 실행하는 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            results = []
            for _ in range(n):
                result = func(*args, **kwargs)
                results.append(result)
            return results
        return wrapper
    return decorator

@repeat(n=3)
def greet(name):
    return f"Hello, {name}!"

# @repeat(n=3) = repeat(n=3) → decorator → @decorator
print(greet("Alice"))
# ['Hello, Alice!', 'Hello, Alice!', 'Hello, Alice!']
```

---

## 제너레이터 — yield의 마법

```python
def countdown(n):
    """n부터 0까지 카운트다운하는 제너레이터"""
    while n >= 0:
        yield n
        n -= 1

# 사용
for num in countdown(5):
    print(num)  # 5, 4, 3, 2, 1, 0

# next()로 수동 실행
gen = countdown(3)
print(next(gen))  # 3
print(next(gen))  # 2
print(next(gen))  # 1
print(next(gen))  # 0
print(next(gen))  # StopIteration 발생
```

**깊이 있는 설명 — 제너레이터의 프레임 기반 일시 중단 메커니즘:**

```text
countdown(3) 호출 시:

1. 일반 함수였다면:
   → n=3으로 시작, while 루프 실행, 3 반환하고 종료

2. yield가 있으므로 제너레이터 객체 반환:
   → PyGenObject 생성 (실행되지 않음!)
   
   struct PyGenObject {
       PyObject_HEAD
       PyFrameObject *gi_frame;    // 실행 프레임 (중단 상태 저장)
       int gi_running;             // 실행 중인지 여부
       PyObject *gi_code;          // 함수의 코드 객체
       PyObject *gi_weakreflist;   // 약한 참조 리스트
       PyObject *gi_name;          // 함수 이름
       PyObject *gi_qualname;      // 정규화된 이름
       int gi_exc_state;           // 예외 상태
   };

3. next(gen) 호출 시:
   → gi_frame.f_lasti = 0 (처음부터)
   → 프레임 실행, yield n 만날 때까지
   → yield n:
     a. n 값을 프레임 스택에 푸시
     b. gi_frame.f_lasti = yield 위치 저장
     c. gi_frame.f_locals['n'] = 4 (n -= 1 후)
     d. PyGenObject 반환 (값: 3)
     e. 프레임 일시 중단 (중단된 스레드처럼)

4. 다시 next(gen) 호출:
   → gi_frame.f_lasti 위치에서 재개
   → n -= 1 실행된 상태 (n=2)
   → while 조건 체크
   → yield n (값: 2)
   → 반복...

5. StopIteration:
   → while n >= 0 조건 실패
   → 함수 종료 (return None)
   → StopIteration 발생
```

### 제너레이터 표현식과 yield from

```python
# 제너레이터 표현식 (메모리 효율적)
squares = (x ** 2 for x in range(10))
print(list(squares))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 리스트 컴프리헨션 (메모리 비효율적)
squares_list = [x ** 2 for x in range(10000)]  # 10,000개 요소 저장
squares_gen = (x ** 2 for x in range(10000))   # 생성 즉시 메모리 거의 없음

# yield from — 하위 제너레이터 위임
def flatten(nested):
    """중첩 리스트를 평탄화하는 제너레이터"""
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)  # 재귀적으로 위임
        else:
            yield item

nested = [1, [2, [3, 4], 5], 6]
print(list(flatten(nested)))  # [1, 2, 3, 4, 5, 6]

# yield from vs 중첩 루프 성능
items = list(range(100000))
gen_direct = (x * 2 for x in items)     # 제너레이터 표현식
gen_yield_from = (x * 2 for x in items)  # 동일 (C 레벨 최적화)
```

---

## 람다 — 익명 함수

```python
# 기본 람다
add = lambda x, y: x + y
print(add(3, 4))  # 7

# 정렬 키로 활용
students = [("Alice", 25), ("Bob", 20), ("Charlie", 30)]
students.sort(key=lambda s: s[1])  # 나이순 정렬
print(students)  # [('Bob', 20), ('Alice', 25), ('Charlie', 30)]

# map/filter와 함께
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))
```

**깊이 있는 설명 — 람다의 바이트코드와 제한사항:**

```text
lambda x, y: x + y

바이트코드:
  0 LOAD_FAST    x
  2 LOAD_FAST    y
  4 BINARY_OP    +
  6 RETURN_VALUE

일반 함수와 다른 점:
  - 표현식만 가능 (할당문, return, try 등 불가)
  - 단일 표현식만 가능 (세미콜론 분리 불가)
  - 어노테이션 불가
  - 독스트링 불가

람다의 늦은 바인딩 문제:
  funcs = [lambda: i for i in range(5)]
  print([f() for f in funcs])  # [4, 4, 4, 4, 4]

  이유: 람다가 i를 "값"으로 캡처하지 않고 "참조"로 캡처
  → 모든 람다가 같은 i 변수를 바라봄
  → 루프 종료 후 i = 4

  해결: 기본 인자값 사용
  funcs = [lambda i=i: i for i in range(5)]
  print([f() for f in funcs])  # [0, 1, 2, 3, 4]
```

### 람다 vs 일반 함수 성능

```python
import time

def add_def(a, b):
    return a + b

add_lambda = lambda a, b: a + b

# 바이트코드 비교
import dis
print("=== 일반 함수 ===")
dis.dis(add_def)
print("\n=== 람다 함수 ===")
dis.dis(add_lambda)
# 동일한 바이트코드!
```

---

## 클로저 — 함수가 함수를 기억하는 방법

```python
def make_counter(start=0):
    """시작 값부터 증가하는 카운터 클로저"""
    count = start

    def counter():
        nonlocal count  # 자유 변수
        result = count
        count += 1
        return result

    return counter

# 사용
counter_a = make_counter(10)
print(counter_a())  # 10
print(counter_a())  # 11
print(counter_a())  # 12

counter_b = make_counter(0)
print(counter_b())  # 0 (독립적인 클로저)
print(counter_a())  # 13 (A와 B는 독립적)
```

**깊이 있는 설명 — 클로저의 __closure__ 구조:**

```text
make_counter(10) 호출 시 생성되는 구조:

1. make_counter 실행:
   count = 10 (로컬 변수)
   counter 함수 정의 → 함수 객체 생성
   return counter (함수 반환)

2. 반환된 counter 함수:
   counter.__code__.co_freevars = ('count',)  # 자유 변수
   counter.__closure__ = (<cell at 0x...: int object at 0x...>,)
   
   __closure__는 cell 객체의 튜플:
   cell.cell_contents = 10 (현재 count 값)

3. counter_a() 호출 시:
   count(cell.cell_contents) 읽기 → 10
   nonlocal count → count += 1 → cell.cell_contents = 11
   return 10

4. counter_b = make_counter(0):
   새로운 count=0, 새로운 __closure__ 생성
   counter_a와 완전히 독립적

5. nonlocal 키워드의 역할:
   없으면: count += 1 → UnboundLocalError
   이유: count += 1이 count = count + 1로 해석되어
   새로운 로컬 변수 count를 생성하려고 함

   있으면: 자유 변수(cell)의 값 변경 허용
   → cell.cell_contents = 10 + 1
```

### 클로저 활용 예제

```python
# 프라이빗 상태 관리
def create_account(initial_balance=0):
    balance = initial_balance

    def deposit(amount):
        nonlocal balance
        if amount > 0:
            balance += amount
        return balance

    def withdraw(amount):
        nonlocal balance
        if 0 < amount <= balance:
            balance -= amount
        return balance

    def get_balance():
        return balance

    # 메서드 딕셔너리 반환
    return {"deposit": deposit, "withdraw": withdraw, "balance": get_balance}

acc = create_account(1000)
acc["deposit"](500)
acc["withdraw"](200)
print(acc["balance"]())  # 1300

# 내부 상태 직접 접근 불가
# print(acc.balance)  # ❌ 접근 불가
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 데코레이터를 여러 개 적용하면 실행 순서는 어떻게 되나요?</strong></summary>

데코레이터는 **가장 가까운 함수부터** 적용됩니다(wrapper 순서는 반대). `@A` `@B` `@C` `def f()`는 `f = A(B(C(f)))`로 변환됩니다. 실행 시에는 가장 바깥쪽 래퍼(A)가 먼저 실행되고, 그 안에서 B, C 순서로 호출됩니다. 따라서 실행 순서 A → B → C → f(원본) → C → B → A(출력).
</details>

<details>
<summary><strong>Q: 제너레이터가 메모리를 절약하는 정확한 원리는?</strong></summary>

제너레이터는 **한 번에 하나의 값만 메모리에 유지**합니다. 리스트 컴프리헨션(10,000개 요소)은 80KB의 메모리를 즉시 할당하는 반면, 제너레이터 표현식은 56바이트의 제너레이터 객체만 생성됩니다. 각 `yield`마다 값이 생성되고 소비된 후 폐기됩니다. 파일의 각 줄을 처리할 때 특히 유용합니다.
</details>

<details>
<summary><strong>Q: 람다에서 할당문을 사용할 수 없나요?</strong></summary>

Python 3.8+에서는 월러스 연산자(`:=`)를 사용하여 람다 내에서 표현식에 이름을 바인딩할 수 있습니다: `lambda x: (y := x + 1, y * 2)[-1]`. 하지만 가독성을 해치므로 복잡한 로직은 일반 함수로 작성하는 것이 좋습니다. 람다는 단순한 변환/비교에만 사용하세요.
</details>

<details>
<summary><strong>Q: 클로저에서 변수가 예상치 못한 값을 가질 때가 있습니다. 이유가 무엇인가요?</strong></summary>

이는 **늦은 바인딩(late binding)** 문제입니다. 클로저는 변수의 값이 아닌 **변수 자체에 대한 참조**를 캡처합니다. 루프에서 클로저를 생성할 때(예: 버튼 콜백 생성), 루프가 끝난 후의 최종값을 모든 클로저가 공유하게 됩니다. 해결 방법은 기본 인자값(값이 정의 시점에 평가됨)이나 `functools.partial`을 사용하는 것입니다.
</details>

<details>
<summary><strong>Q: 이터레이터와 제너레이터의 차이는 무엇인가요?</strong></summary>

모든 제너레이터는 이터레이터이지만, 모든 이터레이터가 제너레이터는 아닙니다. **이터레이터**는 `__iter__`와 `__next__` 메서드를 구현한 객체입니다. **제너레이터**는 `yield` 키워드를 사용하는 함수로, 자동으로 이터레이터 프로토콜을 구현합니다. 제너레이터는 이터레이터를 만드는 가장 간편한 방법입니다.
</details>

---

## 요약

- **데코레이터**: `@decorator` = `func = decorator(func)`, `functools.wraps`로 메타데이터 유지
- **제너레이터**: `yield`가 프레임 상태를 일시 중단, `gi_frame.f_lasti`로 위치 추적
- **람다**: 단일 표현식 익명 함수, 늦은 바인딩 문제 주의
- **클로저**: `__closure__`에 cell 객체로 자유 변수 캡처, `nonlocal`로 값 변경
- **이터레이터**: `__iter__` + `__next__` 프로토콜, `for` 루프가 내부적으로 사용
