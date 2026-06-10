---
layout: post
title: "Python 함수 — 스코프, 인자 전달, 클로저, 람다 완벽 이해"
description: "Python 함수의 내부 동작 원리와 실전 사용법을 학습합니다. 함수가 CPython에서 PyFunctionObject로 표현되는 방식, 인자 전달(pass by assignment)의 실제 메커니즘, LEGB 스코프 규칙, 클로저가 외부 변수를 캡처하는 방법, 람다 함수의 바이트코드와 성능을 다룹니다."
date: 2023-01-23 10:00:00 +0900
category: python
tags: [python, functions, scope, closure, lambda, arguments, first-class]
level: beginner
---

함수는 Python에서 **일급 객체(first-class citizen)**입니다. 변수에 할당하고, 인자로 전달하고, 반환값으로 사용할 수 있습니다. Python 함수는 내부적으로 `PyFunctionObject`로 표현되며, 바이트코드와 실행 환경(클로저, 글로벌 네임스페이스)을 함께 저장합니다.

> **💡 핵심 정리** ・ Python 함수는 `PyFunctionObject` 구조체로 표현되며, `func_code`(바이트코드), `func_globals`(전역 네임스페이스), `func_closure`(클로저 변수)를 속성으로 가집니다. 인자 전달은 **pass by assignment**(참조 값의 복사)입니다. 가변 객체를 인자로 받으면 함수 내부에서 변경 시 원본에도 영향이 갑니다. 기본 인자는 함수 정의 시 한 번만 평가되므로, 가변 기본 인자(`def f(x=[])`)는 주의해야 합니다. LEGB 스코프 규칙(Local → Enclosing → Global → Built-in)으로 변수를 탐색합니다.

> **이 수업에서 배울 내용:** 함수의 일급 객체 특성, 인자 전달의 내부 메커니즘, LEGB 스코프 규칙, 클로저와 람다의 동작 원리, 가변 기본 인자의 함정, 그리고 실전 함수 작성 패턴을 학습합니다.

---

## 📚 수업 목표

- 함수가 일급 객체인 의미와 `PyFunctionObject` 구조를 이해합니다.
- 인자 전달 방식(pass by assignment)을 이해하고 가변/불변 객체의 차이를 압니다.
- LEGB 스코프 규칙으로 변수 탐색 순서를 이해합니다.
- 클로저와 람다의 내부 동작 원리를 이해합니다.
- 기본 인자의 평가 시점과 가변 기본 인자의 위험성을 이해합니다.

## 함수 정의와 호출 — PyFunctionObject

```python
# 함수 정의
def greet(name):
    """인사말을 반환합니다."""
    return f"안녕하세요, {name}님!"

# 함수 호출
message = greet("Alice")
print(message)  # 안녕하세요, Alice님!

# 함수는 객체다
print(type(greet))       # <class 'function'>
print(greet.__name__)    # 'greet'
print(greet.__doc__)     # '인사말을 반환합니다.'
```

**깊이 있는 설명 — 함수가 내부적으로 저장되는 방식:**

```text
def greet(name):
    return f"안녕하세요, {name}님!"

CPython 내부에서:
  greet → PyFunctionObject (힙에 할당)
    func_code → PyCodeObject (컴파일된 바이트코드)
      co_code: 바이트코드 명령어 배열
      co_consts: ('안녕하세요, %s님!', None)
      co_varnames: ('name',)
      co_nlocals: 1
    func_globals → 전역 딕셔너리 참조
    func_defaults → None (기본 인자 없음)
    func_closure → None (클로저 없음)
    func_name → 'greet'
    func_doc → '인사말을 반환합니다.'

함수 호출 greet("Alice") 시:
  1. 프레임 객체 생성 (PyFrameObject)
  2. name = "Alice" 로컬 변수 할당
  3. 바이트코드 실행
  4. 반환값 처리 후 프레임 해제
```

### 일급 함수 — 함수를 값으로 다루기

```python
# 1. 변수에 할당
def square(x):
    return x ** 2

my_func = square
print(my_func(5))  # 25

# 2. 인자로 전달 (고차 함수)
def apply(func, value):
    return func(value)

print(apply(square, 5))  # 25

# 3. 반환값으로 사용 (함수 팩토리)
def make_multiplier(n):
    def multiplier(x):
        return x * n
    return multiplier

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5))   # 10
print(triple(5))   # 15
```

**성능 측정 — 함수 호출 오버헤드:**

| 호출 방식 | 1000만 회 시간 | 상대 비용 |
|----------|:------------:|:--------:|
| 인라인 코드 | ~85ms | 1x (기준) |
| 함수 호출 (로컬) | ~150ms | ~1.8x |
| 함수 호출 (임포트) | ~165ms | ~1.9x |
| 메서드 호출 | ~180ms | ~2.1x |
| 람다 함수 호출 | ~155ms | ~1.8x |

---

## 인자 전달 — Pass by Assignment

```python
# 위치 인자
def add(a, b):
    return a + b

print(add(3, 5))  # 8

# 기본 인자 (키워드 인자)
def power(base, exp=2):
    return base ** exp

print(power(3))     # 9 (3^2)
print(power(3, 3))  # 27 (3^3)
print(power(exp=4, base=2))  # 16 (키워드 지정)

# 가변 인자
def sum_all(*args):  # 튜플로 수집
    return sum(args)

print(sum_all(1, 2, 3, 4, 5))  # 15

# 키워드 가변 인자
def print_info(**kwargs):  # 딕셔너리로 수집
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25, city="Seoul")
```

**깊이 있는 설명 — 가변 기본 인자의 함정:**

```python
# ❌ 위험한 패턴 — 가변 기본 인자
def add_item(item, items=[]):  # 기본 인자는 함수 정의 시 한 번만 평가!
    items.append(item)
    return items

print(add_item(1))  # [1]
print(add_item(2))  # [1, 2]  ← 예상과 다름! 같은 리스트를 공유
print(add_item(3))  # [1, 2, 3]

# 내부 동작:
# 함수 정의 시: items = [] 리스트가 생성되어 func_defaults에 저장
# 첫 호출: func_defaults[0] = [1] (같은 리스트!)
# 두 번째 호출: func_defaults[0] = [1, 2] (계속 누적!)

# ✅ 올바른 패턴
def add_item_safe(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

print(add_item_safe(1))  # [1]
print(add_item_safe(2))  # [2]  ← 매번 새 리스트!
```

**인자 전달 방식 — Pass by Assignment:**

```python
def modify(x):
    x = 10          # 재할당 → 원본 영향 없음
    print(f"내부: {x}")

def append_item(lst):
    lst.append(4)   # 가변 객체 변경 → 원본 영향 있음
    print(f"내부: {lst}")

a = 5
modify(a)           # a는 여전히 5 (불변 객체)
print(f"외부: {a}")  # 5

b = [1, 2, 3]
append_item(b)      # b는 [1, 2, 3, 4]로 변경됨 (가변 객체)
print(f"외부: {b}")  # [1, 2, 3, 4]
```

### 인자 전달 방식 비교

| 특성 | Call by Value | Call by Reference | Python (Pass by Assignment) |
|------|:------------:|:----------------:|:--------------------------:|
| 함수 내 재할당 | 원본 영향 없음 | 원본 변경됨 | 원본 영향 없음 |
| 가변 객체 변경 | 원본 영향 없음 | 원본 변경됨 | **원본 변경됨** |
| 불변 객체 변경 | 원본 영향 없음 | 원본 변경됨 | 원본 영향 없음 |
| 예시 언어 | C (기본형) | C# (ref), C++ (&) | Python, Java, JavaScript |

---

## LEGB 스코프 규칙

Python은 변수를 찾을 때 **LEGB 규칙**을 따릅니다: Local → Enclosing → Global → Built-in

```python
# 전역 변수
x = "global"

def outer():
    # 외부 함수(Enclosing) 변수
    x = "enclosing"

    def inner():
        # 로컬 변수
        x = "local"
        print(f"inner: {x}")  # local

    inner()
    print(f"outer: {x}")  # enclosing

outer()
print(f"global: {x}")  # global
```

**깊이 있는 설명 — 변수 탐색의 4단계:**

```text
print(x) 실행 시 CPython의 변수 탐색 순서:

1단계: LOCAL — 현재 함수의 로컬 네임스페이스
  frame->f_locals에서 x 검색
  → LOAD_FAST 바이트코드로 직접 접근 (가장 빠름, 딕셔너리 불필요)
  → 바이트코드 인덱스가 co_varnames에 미리 저장됨

2단계: ENCLOSING — 외부 함수의 로컬 네임스페이스
  frame->f_back->f_locals에서 x 검색
  → LOAD_DEREF 바이트코드로 셀 변수 접근
  → 클로저 셀(cell) 객체를 통해 접근

3단계: GLOBAL — 모듈 전역 네임스페이스
  func_globals 딕셔너리에서 x 검색
  → LOAD_GLOBAL 바이트코드로 딕셔너리 조회
  → 해시 테이블 O(1) 조회

4단계: BUILTINS — 내장 네임스페이스
  내장 모듈(builtins) 딕셔너리에서 x 검색
  → LOAD_GLOBAL에서 Builtins 모듈로 fallback
  → print, len, range 등 내장 함수는 여기에 있음

검색 실패 시: NameError 발생
```

### global과 nonlocal

```python
count = 0

def increment():
    global count  # 전역 변수 사용 선언
    count += 1
    # global 없으면: UnboundLocalError

increment()
print(count)  # 1

# nonlocal — 중첩 함수에서 외부 함수 변수 수정
def counter():
    count = 0

    def increment():
        nonlocal count  # 외부 함수의 count를 사용
        count += 1
        return count

    return increment

counter1 = counter()
print(counter1())  # 1
print(counter1())  # 2
print(counter1())  # 3
```

---

## 클로저 — 함수가 외부 변수를 기억하는 방법

클로저는 함수가 자신이 정의된 환경의 변수를 **캡처**하여, 그 함수가 나중에 실행될 때도 그 변수에 접근할 수 있게 합니다.

```python
def make_multiplier(n):
    def multiplier(x):
        return x * n  # n은 외부 함수의 변수
    return multiplier

double = make_multiplier(2)
triple = make_multiplier(3)

# double과 triple은 각각 n=2, n=3을 캡처한 클로저
print(double(5))   # 10
print(triple(5))   # 15
```

**깊이 있는 설명 — 클로저가 변수를 캡처하는 내부 메커니즘:**

```python
def make_multiplier(n):
    # n = 2 (호출 시)
    def multiplier(x):
        return x * n  # n은 자유 변수(free variable)
    return multiplier

double = make_multiplier(2)

# 클로저 확인
print(double.__closure__)      # (<cell at 0x...: int object at 0x...>,)
print(double.__code__.co_freevars)  # ('n',)
print(double.__closure__[0].cell_contents)  # 2
```

```text
내부 동작 (CPython):

1. make_multiplier(2) 호출
   → n = 2가 로컬에 할당
   → multiplier 함수 객체 생성 시:
      func_closure = [cell 객체: n=2]
      → n이 자유 변수(free variable)로 감지됨
      → co_freevars = ('n',)

2. multiplier 반환
   → n=2가 저장된 cell 객체는 multiplier의 func_closure에 유지
   → make_multiplier의 프레임은 해제되어도 cell 객체는 유지됨

3. double(5) 호출
   → cell 객체에서 n=2 읽기
   → LOAD_DEREF 바이트코드로 cell 접근
   → x * 2 = 10 계산
```

### 클로저의 지연 캡처 문제

```python
# ❌ 지연 캡처 — 모든 함수가 마지막 값만 참조
funcs = []
for i in range(5):
    funcs.append(lambda: i ** 2)

for f in funcs:
    print(f())  # 16, 16, 16, 16, 16  ← 모두 4^2!

# ✅ 즉시 캡처 — 기본 인자로 값 복사
funcs = []
for i in range(5):
    funcs.append(lambda x=i: x ** 2)  # i의 현재 값을 기본 인자로 캡처

for f in funcs:
    print(f())  # 0, 1, 4, 9, 16
```

---

## 람다 함수 — 익명 함수의 내부

```python
# 기본 람다
square = lambda x: x ** 2
print(square(5))  # 25

# 여러 인자
add = lambda a, b: a + b
print(add(3, 5))  # 8

# 조건부 표현식
max_val = lambda a, b: a if a > b else b

# 고차 함수와 함께 사용
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))
```

**깊이 있는 설명 — 람다 함수의 PyFunctionObject:**

```python
# 람다는 def와 동일한 내부 구조를 가짐
f = lambda x, y: x + y

print(type(f))           # <class 'function'>
print(f.__name__)        # '<lambda>' (자동 생성)
print(f.__code__)        # <code object <lambda>...>
print(f.__code__.co_argcount)  # 2 (인자 수)
```

```text
람다 vs def 함수의 차이:

공통점:
  둘 다 PyFunctionObject로 표현됨
  둘 다 바이트코드로 컴파일됨
  둘 다 클로저와 스코프 규칙이 동일

차이점:
  람다: __name__ = '<lambda>', 'return' 문 외에 다른 문 불가
  def:  __name__ = 함수 이름, 여러 문과 docstring 가능

람다로 할 수 없는 것:
  - 여러 줄의 코드
  - assert, raise, try/except
  - 할당문 (:= 가능)
  - 데코레이터
  - 타입 힌트 (Python 3.6+ def는 가능)
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 함수 안에서 전역 변수를 수정하려면 어떻게 하나요?</strong></summary>

`global` 키워드를 사용합니다. `global x`를 함수 내에서 선언하면, 이후 `x`에 할당하는 값이 전역 변수에 적용됩니다. 선언하지 않으면 할당 시 로컬 변수로 간주되어 `UnboundLocalError`가 발생하거나 의도치 않게 새 로컬 변수가 생성됩니다.
</details>

<details>
<summary><strong>Q: `*args`와 `**kwargs`는 언제 사용하나요?</strong></summary>

`*args`는 가변 개수의 위치 인자를 튜플로 수집합니다. `**kwargs`는 가변 개수의 키워드 인자를 딕셔너리로 수집합니다. 주로 함수 래퍼(wrapper), 데코레이터, 상속 시 부모 클래스 메서드 호출 등 인자를 그대로 전달해야 할 때 사용합니다. 또한 API 클라이언트처럼 다양한 옵션을 받아야 하는 함수에 유용합니다.
</details>

<details>
<summary><strong>Q: 클로저는 메모리를 어떻게 관리하나요?</strong></summary>

클로저가 캡처한 변수는 `cell` 객체에 저장됩니다. 외부 함수가 종료되어도 cell 객체는 클로저 함수가 func_closure 속성으로 참조를 유지하므로 GC되지 않습니다. 클로저가 더 이상 필요 없으면(func_closure 참조가 모두 해제되면) cell 객체와 그 내용도 함께 GC됩니다. 클로저가 큰 데이터를 참조하면 불필요하게 메모리를 점유할 수 있으므로 주의해야 합니다.
</details>

<details>
<summary><strong>Q: 람다와 def 중 어떤 것이 더 빠른가요?</strong></summary>

둘의 성능 차이는 거의 없습니다. 둘 다 동일한 PyFunctionObject로 변환되고 동일한 바이트코드 실행 경로를 따릅니다. 미미한 차이는 람다는 `__name__` 설정(\<lambda\>)과 docstring 처리에서 발생하지만, 1000만 번 호출 기준으로 1~2% 미만입니다. 따라서 성능보다 **가독성**을 기준으로 선택하세요.
</details>

<details>
<summary><strong>Q: 함수의 기본 인자가 가변 객체일 때 위험한 이유는?</strong></summary>

함수의 기본 인자는 **함수 정의 시점에 한 번만 평가**되어 `func_defaults` 튜플에 저장됩니다. 따라서 가변 객체(리스트, 딕셔너리 등)를 기본 인자로 사용하면, 모든 함수 호출이 **같은 객체**를 공유하게 됩니다. 한 호출에서 객체를 수정하면 다음 호출에 영향이 갑니다. 안전한 패턴은 기본값으로 `None`을 사용하고 함수 내부에서 새 객체를 생성하는 것입니다.
</details>

---

## 요약

- **일급 객체**: 함수는 변수 할당, 인자 전달, 반환값 사용이 가능한 PyFunctionObject
- **Pass by Assignment**: 참조 값이 복사되며, 가변 객체 변경은 원본에 영향
- **LEGB 규칙**: Local → Enclosing → Global → Built-in 순서로 변수 탐색
- **클로저**: cell 객체에 외부 변수를 캡처하여 함수가 정의된 환경 유지
- **람다**: def와 동일한 PyFunctionObject, __name__만 '\<lambda\>'로 다름
- **가변 기본 인자**: 함수 정의 시 한 번만 평가되므로 None 패턴 사용
- **global/nonlocal**: 외부 스코프 변수 수정 시 명시적 선언 필요
