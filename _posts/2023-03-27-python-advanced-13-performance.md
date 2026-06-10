---
layout: post
title: "Python 성능 최적화 — 프로파일링, 메모리 관리, 병목 분석, 고성능 패턴"
description: "Python 성능 최적화를 시스템 레벨에서 심층 학습합니다. cProfile과 py-spy로 프로파일링하는 방법, CPython 메모리 관리의 reference counting과 generational GC, GIL(Global Interpreter Lock)의 동작과 우회, __slots__와 메모리 최적화, Cython/Numba/JIT 컴파일을 통한 고성능 전략, asyncio와 멀티프로세싱을 활용한 동시성 최적화를 다룹니다."
date: 2023-03-27 10:00:00 +0900
category: python
tags: [python, performance, profiling, cprofile, memory, gil, cython, numba, optimization]
level: advanced
---

Python은 생산성이 높지만, 때로는 성능 병목이 발생합니다. Python 코드를 최적화하려면 **측정 없이 추측하지 않는** 것이 가장 중요합니다.

> **💡 핵심 정리** · CPython의 메모리 관리는 reference counting(즉시 해제)과 generational GC(순환 참조 수집)의 이중 구조입니다. GIL은 한 번에 하나의 스레드만 바이트코드를 실행하도록 제한하여 CPU 바운드 작업의 병렬 처리를 막지만, I/O 바운드 작업에서는 영향이 거의 없습니다. 프로파일링 도구(cProfile, py-spy)는 `sys.setprofile()`로 호출 스택을 샘플링하거나 PyEval_SetProfile C API로 함수 호출을 계측합니다. `__slots__`는 인스턴스 `__dict__`를 제거하여 메모리를 50~70% 절약합니다.

> **이 수업에서 배울 내용:** cProfile과 py-spy로 프로파일링, 메모리 프로파일링과 누수 탐지, GIL의 내부 동작과 우회 전략, __slots__와 메모리 최적화, Cython/Numba/JIT 컴파일, 멀티프로세싱과 asyncio를 학습합니다.

---

## 📚 수업 목표

- cProfile과 SnakeViz로 병목 지점을 식별할 수 있습니다.
- 메모리 프로파일러로 누수를 탐지할 수 있습니다.
- GIL의 동작 원리를 이해하고 우회 전략을 적용할 수 있습니다.
- __slots__와 데이터 구조 최적화를 적용할 수 있습니다.
- Cython/Numba를 활용한 고성능 모듈을 작성할 수 있습니다.
- CPU/IO 바운드 작업에 적합한 동시성 모델을 선택할 수 있습니다.

## 프로파일링 — 측정은 최적화의 첫걸음

```python
import cProfile
import pstats

def slow_function():
    total = 0
    for i in range(10**7):
        total += i ** 2
    return total

# 프로파일링 실행
cProfile.run("slow_function()", "profile_output.prof")

# 결과 분석
p = pstats.Stats("profile_output.prof")
p.sort_stats("cumtime").print_stats(10)  # 누적 시간 기준 상위 10개
```

**깊이 있는 설명 — 프로파일러의 계측 방식:**

```text
cProfile의 내부 동작:

1. PyEval_SetProfile() C API 호출
2. 각 바이트코드 명령어 실행 전후에 콜백 실행
3. 콜백에서 타이머(stopwatch) 값 기록
4. 호출 횟수(call count), 총 시간(tottime), 누적 시간(cumtime) 계산

프로파일링 오버헤드:
  cProfile:      ~30% 성능 저하 (정확도 높음)
  py-spy:        ~1% 성능 저하 (샘플링, 낮은 오버헤드)
  timeit 모듈:   마이크로벤치마크에 적합

주요 지표:
  ncalls:  호출 횟수
  tottime: 함수 자체 실행 시간 (자식 함수 제외)
  cumtime: 함수 + 모든 자식 함수 실행 시간
  percall: tottime / ncalls
```

### 메모리 프로파일링

```python
# pip install memory-profiler
@profile
def memory_hungry():
    big_list = [i for i in range(10**7)]
    del big_list
    another_list = [i * 2 for i in range(5**7)]

# 라인별 메모리 사용량 확인
# python -m memory_profiler script.py

# objgraph로 객체 그래프 분석
import objgraph

class Leak:
    pass

def create_leak():
    leak = Leak()
    leak.self_ref = leak  # 순환 참조!
    return leak

leaks = [create_leak() for _ in range(1000)]
objgraph.show_most_common_types(limit=10)  # 가장 많은 객체 유형
```

---

## GIL — Global Interpreter Lock

**깊이 있는 설명 — GIL의 내부 동작:**

```text
CPython의 GIL 구조:

  typedef struct {
      PyThread_type_lock lock;     // 뮤텍스
      unsigned long interval;      // 체크 간격 (기본 500 바이트코드)
      unsigned long count;         // 실행한 바이트코드 수
      unsigned long gil_drop;      // GIL 해제 횟수
  } _PyRuntimeState.gilstate;

GIL 확인/해제 과정:
  1. 현재 스레드가 GIL 소유 확인
  2. count++ (바이트코드 실행마다)
  3. count >= interval(500) → GIL 해제 고려
  4. 다른 스레드가 기다리면 → GIL 해제
  5. 해제 후 5ms 대기 후 재획득 시도

GIL 우회 전략:
  CPU 바운드 작업:
    1. multiprocessing (별도 프로세스, 각각 GIL)
    2. Cython (cdef 함수, GIL 해제 가능)
    3. Numpy/Pandas (C 레벨에서 GIL 해제)
    4. concurrent.futures.ProcessPoolExecutor

  I/O 바운드 작업:
    1. asyncio (단일 스레드 이벤트 루프)
    2. threading (GIL이 I/O 대기 중 해제됨)
```

### GIL 회피 전략

```python
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor
import time

def cpu_intensive(n):
    return sum(i * i for i in range(n))

# 멀티프로세싱 — 각 프로세스가 독립적 GIL
def parallel_process():
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(cpu_intensive, [10**7] * 4))
    return results

# 싱글 vs 멀티 성능 (8코어 CPU)
# 싱글 스레드:    100% (기준)
# 멀티스레드:      ~110% (GIL이 병목)
# 멀티프로세싱:   ~750% (코어 수에 비례)
```

---

## 메모리 최적화 — __slots__와 데이터 구조

```python
# 일반 클래스 (각 인스턴스가 __dict__를 가짐)
class RegularPoint:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

# __slots__ 클래스 (__dict__ 없음)
class OptimizedPoint:
    __slots__ = ("x", "y", "z")

    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

# 메모리 비교
import sys
r = RegularPoint(1, 2, 3)
o = OptimizedPoint(1, 2, 3)
# RegularPoint.__dict__ + 인스턴스 __dict__
# OptimizedPoint는 __dict__ 없음

# sys.getsizeof: RegularPoint ~ 56 bytes + dict ~ 280 bytes
# sys.getsizeof: OptimizedPoint ~ 56 bytes (__dict__ 없음)
```

---

## Cython/Numba — JIT 컴파일

```python
# Numba 예제
from numba import jit
import time

@jit(nopython=True)
def sum_squares_numba(n):
    total = 0
    for i in range(n):
        total += i * i
    return total

# 순수 Python
def sum_squares_python(n):
    total = 0
    for i in range(n):
        total += i * i
    return total

# 성능 비교: Numba JIT가 50~200배 빠름
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Python은 왜 느린가요? 주요 병목은 무엇인가요?</strong></summary>

Python이 느린 주요 원인: 1) **동적 타입 검사** — 모든 연산마다 타입 확인, 2) **박싱/언박싱** — int/float가 Python 객체로 래핑, 3) **GIL** — CPU 병렬 처리 제한, 4) **바이트코드 인터프리터** — 네이티브 코드보다 오버헤드. 일반적으로 Python은 C보다 10~100배 느리지만, Numpy/Pandas/ Cython으로 병목 부분을 C 레벨로 내리면 극복 가능합니다.
</details>

<details>
<summary><strong>Q: 프로파일링 없이 최적화해도 되나요?</strong></summary>

**절대 안 됩니다!** "측정 없이 최적화하지 마라"는 소프트웨어 공학의 황금률입니다. 직관으로 예측한 병목은 실제와 다른 경우가 90%입니다. 항상 cProfile이나 py-spy로 측정하고, 가장 시간을 많이 소비하는 부분(top 3)에 집중하세요. 병목이 전체 시간의 80%를 차지하는 부분을 찾으면, 그 부분만 C 레벨로 최적화해도 전체 성능이 5배 향상됩니다.
</details>

<details>
<summary><strong>Q: 멀티스레딩과 멀티프로세싱 중 어떤 것을 선택해야 하나요?</strong></summary>

**CPU 바운드 작업**(계산 위주) → 멀티프로세싱(GIL 우회). **I/O 바운드 작업**(파일/네트워크/DB) → 멀티스레딩 또는 asyncio. 혼합 작업 → 멀티프로세싱 + asyncio 조합. 멀티프로세싱은 메모리 사용량이 높고 IPC 오버헤드가 있지만, CPU 코어를 완전히 활용할 수 있습니다.
</details>

<details>
<summary><strong>Q: `__slots__`를 항상 사용해야 하나요?</strong></summary>

아니요. `__slots__`는 동적 속성 할당을 막고, 상속이 복잡해집니다. 수천~수백만 개의 인스턴스를 생성하는 데이터 클래스(게임 개체, 과학 계산)에만 사용하세요. 일반적인 애플리케이션 클래스에서는 `__dict__`의 유연성이 더 중요합니다.
</details>

<details>
<summary><strong>Q: 리스트 컴프리헨션이 항상 더 빠른가요?</strong></summary>

일반적으로 **네**, 리스트 컴프리헨션은 for 루프보다 1.5~2배 빠릅니다. 이유는 for 루프처럼 `.append()` 메서드 조회를 반복하지 않고, C 레벨에서 리스트를 미리 할당하기 때문입니다. 하지만 너무 복잡한 컴프리헨션은 가독성을 해치므로, 간단한 변환에만 사용하세요.
</details>

---

## 요약

- **프로파일링**: cProfile(계측), py-spy(샘플링), memory-profiler(메모리)
- **GIL**: 500 바이트코드마다 해제, CPU 작업은 multiprocessing으로 우회
- **메모리**: reference counting + generational GC, `__slots__`로 50~70% 절약
- **JIT 컴파일**: Numba(nopython=True)로 50~200배 성능 향상
- **멀티프로세싱**: 각 프로세스가 독립 GIL, CPU 코어 완전 활용
