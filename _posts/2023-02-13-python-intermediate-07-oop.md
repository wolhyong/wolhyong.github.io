---
layout: post
title: "Python 객체지향 프로그래밍 — 클래스, 상속, 매직 메서드, 프로퍼티"
description: "Python의 객체지향 프로그래밍을 내부 동작 원리와 함께 심층 학습합니다. 클래스가 type()으로 생성되는 메타클래스 구조, MRO(Method Resolution Order)의 C3 선형화 알고리즘, 매직 메서드가 연산자 오버로딩에서 동작하는 방식(__add__ → BINARY_OP), @property가 디스크립터 프로토콜로 구현되는 원리, super()의 내부 동작을 다룹니다."
date: 2023-02-13 10:00:00 +0900
category: python
tags: [python, oop, class, inheritance, magic-methods, property, decorator, metaclass]
level: intermediate
---

Python의 객체지향 시스템은 독특합니다. 모든 것이 객체이고, 클래스 자신도 객체(타입)입니다. Python은 순수한 OOP 언어는 아니지만, 강력하고 유연한 객체지향 기능을 제공합니다.

> **💡 핵심 정리** ・ Python 클래스는 `type(name, bases, dict)` 호출로 생성되며, `__new__` → `__init__` 순서로 초기화됩니다. 상속의 MRO는 C3 선형화 알고리즘(너비 우선 탐색의 변형)으로 결정되며, 다중 상속에서 메서드 호출 순서를 보장합니다. `@property`는 디스크립터 프로토콜(`__get__`/`__set__`)을 구현한 `property` 객체로, 인스턴스 딕셔너리보다 우선 탐색됩니다. 매직 메서드(`__add__`, `__len__` 등)는 연산자에 바인딩되어 C 레벨에서 직접 호출됩니다.

> **이 수업에서 배울 내용:** 클래스와 인스턴스의 메모리 구조, MRO와 C3 선형화, 매직 메서드를 통한 연산자 오버로딩, @property의 디스크립터 프로토콜, super()의 동작 원리, 클래스 변수와 인스턴스 변수의 탐색 순서를 학습합니다.

---

## 📚 수업 목표

- 클래스가 내부적으로 `type()`으로 생성되는 과정을 이해합니다.
- MRO(Method Resolution Order)와 C3 선형화를 이해합니다.
- 매직 메서드를 이용한 연산자 오버로딩을 구현할 수 있습니다.
- @property 데코레이터의 내부 동작을 이해합니다.
- super()의 동작 원리를 이해합니다.
- 클래스 변수와 인스턴스 변수의 탐색 순서를 이해합니다.

## 클래스 정의와 인스턴스 생성

```python
class Person:
    """사람을 나타내는 클래스"""
    species = "Homo sapiens"  # 클래스 변수

    def __init__(self, name, age):
        self.name = name      # 인스턴스 변수
        self.age = age

    def introduce(self):
        return f"안녕하세요, {self.name}입니다. {self.age}살입니다."

# 인스턴스 생성
p1 = Person("Alice", 25)
print(p1.introduce())  # 안녕하세요, Alice입니다. 25살입니다.
print(p1.species)      # Homo sapiens (클래스 변수)
```

**깊이 있는 설명 — 클래스와 인스턴스의 메모리 구조:**

```text
Person 클래스 객체:
  type(Person) → <class 'type'> (모든 클래스는 type의 인스턴스)
  Person.__dict__ → mappingproxy {
      '__module__': '__main__',
      'species': 'Homo sapiens',
      '__init__': <function>,
      'introduce': <function>,
      '__dict__': <attribute>,
      '__weakref__': <attribute>,
      '__doc__': '사람을 나타내는 클래스'
  }
  Person.__bases__ → (<class 'object'>,)

p1 인스턴스:
  type(p1) → <class '__main__.Person'>
  p1.__dict__ → {'name': 'Alice', 'age': 25}
  p1.__class__ → Person

속성 탐색 순서 (p1.introduce):
  1. p1.__dict__ → 'introduce' 없음
  2. type(p1).__dict__ → 'introduce' 발견! → 함수 객체 반환
  3. 함수를 메서드로 바인딩 (p1을 self로 전달)

속성 탐색 순서 (p1.species):
  1. p1.__dict__ → 'species' 없음
  2. Person.__dict__ → 'species' 발견! → 'Homo sapiens'
```

### 클래스 생성 과정 — type()의 역할

```python
# 클래스 정의는 내부적으로 type() 호출로 변환됨

# 이 코드는:
class MyClass:
    x = 10
    def method(self):
        return self.x


# 내부적으로 이렇게 실행됨:
MyClass = type('MyClass', (object,), {'x': 10, 'method': lambda self: self.x})
```

---

## 상속과 MRO — C3 선형화

```python
# 기본 상속
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "멍멍!"

class Cat(Animal):
    def speak(self):
        return "야옹~"

dog = Dog("Buddy")
cat = Cat("Kitty")
print(dog.speak())  # 멍멍!
print(cat.speak())  # 야옹~
```

**깊이 있는 설명 — MRO(Method Resolution Order)와 C3 선형화:**

```python
class A:
    def method(self):
        return "A"

class B(A):
    def method(self):
        return "B"

class C(A):
    def method(self):
        return "C"

class D(B, C):
    pass

d = D()
print(d.method())  # "B" — MRO: D → B → C → A

# MRO 확인
print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)
```

```text
C3 선형화 알고리즘 (D(B, C)의 MRO 계산):

L[D] = D + merge(L[B], L[C], [B, C])

L[B] = B + merge(L[A], [A])
     = B + merge([A, object], [A])
     = B + A + merge([object])
     = B + A + object

L[C] = C + A + object

L[D] = D + merge([B, A, object], [C, A, object], [B, C])
     = D + B + merge([A, object], [C, A, object], [C])
     = D + B + C + merge([A, object], [A, object])
     = D + B + C + A + merge([object], [object])
     = D + B + C + A + object

결과: D → B → C → A → object
```

### 추상 클래스

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

    @abstractmethod
    def perimeter(self):
        pass

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2

    def perimeter(self):
        return 2 * 3.14159 * self.radius

# s = Shape()  # TypeError! 추상 클래스는 인스턴스화 불가
c = Circle(5)
print(c.area())  # 78.53975
```

---

## 매직 메서드 — 연산자 오버로딩

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        return NotImplemented

    def __sub__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x - other.x, self.y - other.y)
        return NotImplemented

    def __mul__(self, scalar):
        return Vector(self.x * scalar, self.y * scalar)

    def __abs__(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def __eq__(self, other):
        if isinstance(other, Vector):
            return self.x == other.x and self.y == other.y
        return False

    def __bool__(self):
        return self.x != 0 or self.y != 0

v1 = Vector(3, 4)
v2 = Vector(1, 2)
print(v1 + v2)     # Vector(4, 6)  — __add__
print(v1 * 3)       # Vector(9, 12) — __mul__
print(abs(v1))      # 5.0          — __abs__
print(v1 == v2)     # False        — __eq__
```

**깊이 있는 설명 — 매직 메서드가 연산자에서 호출되는 과정:**

```text
v1 + v2 실행 시 CPython 내부 과정:

1. BINARY_OP 바이트코드 실행
2. PyNumber_Add(v1, v2) C 함수 호출
3. v1.__add__(v2) 시도
   - v1의 타입(Vector)에서 __add__ 검색
   - Vector.__add__가 정의되어 있음
   - v1.__add__(v2) 호출
4. __add__가 NotImplemented 반환 시:
   - v2.__radd__(v1) 시도
   - PyErr_Format(PyExc_TypeError, "unsupported operand type(s)")
```

### 주요 매직 메서드

| 카테고리 | 메서드 | 설명 |
|----------|--------|------|
| 생성/소멸 | `__new__`, `__init__`, `__del__` | 객체 생성과 소멸 |
| 문자열 | `__str__`, `__repr__`, `__format__` | 문자열 표현 |
| 비교 | `__eq__`, `__ne__`, `__lt__`, `__le__`, `__gt__`, `__ge__` | == != < <= > >= |
| 산술 | `__add__`, `__sub__`, `__mul__`, `__truediv__`, `__floordiv__`, `__mod__`, `__pow__` | + - * / // % ** |
| 반전 산술 | `__radd__`, `__rsub__`, `__rmul__` | 좌변 타입이 우변 연산 미지원 시 |
| 컨테이너 | `__len__`, `__getitem__`, `__setitem__`, `__delitem__`, `__contains__`, `__iter__`, `__next__` | len(), [], del, in, for |
| 숫자 변환 | `__int__`, `__float__`, `__bool__`, `__complex__` | int(), float(), bool() |
| 컨텍스트 | `__enter__`, `__exit__` | with 문 |

---

## @property — 디스크립터 프로토콜

```python
class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    @property
    def celsius(self):
        """섭씨 온도 반환"""
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("절대 영도 이하는 불가능합니다")
        self._celsius = value

    @property
    def fahrenheit(self):
        """화씨 온도 반환 (읽기 전용)"""
        return self._celsius * 9/5 + 32

t = Temperature(25)
print(t.celsius)     # 25 — getter 호출
t.celsius = 30       # setter 호출
print(t.fahrenheit)  # 86.0
# t.fahrenheit = 100  # AttributeError! 읽기 전용
```

**깊이 있는 설명 — @property가 디스크립터로 동작하는 원리:**

```text
@property는 내부적으로 디스크립터 프로토콜을 구현한 property 객체입니다.

class property:
    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if self.fget is None:
            raise AttributeError
        return self.fget(obj)

    def __set__(self, obj, value):
        if self.fset is None:
            raise AttributeError
        self.fset(obj, value)

# Temperature 클래스의 celsius 속성:
# Temperature.__dict__['celsius'] = property(fget=get_celsius, fset=set_celsius)

# t.celsius 조회 시:
# 1. t.__dict__ 확인 → 'celsius' 없음
# 2. type(t).__dict__['celsius'] 확인 → property 객체 발견!
# 3. property.__get__(self, t, Temperature) 호출
# 4. 내부적으로 self.fget(t) 호출 → t._celsius 반환
```

### @property의 장점

```python
# @property 없이 getter/setter만 있는 경우
class OldWay:
    def __init__(self, value):
        self._value = value

    def get_value(self):
        return self._value

    def set_value(self, value):
        self._value = value

obj = OldWay(10)
obj.set_value(20)      # 메서드 호출 — 덜 직관적
print(obj.get_value()) # 20


# @property를 사용한 경우
class NewWay:
    def __init__(self, value):
        self._value = value

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = value

obj = NewWay(10)
obj.value = 20         # 속성처럼 할당
print(obj.value)       # 20 — 속성처럼 읽기
```

---

## super() — 부모 클래스 호출

```python
class Parent:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return f"Hello from {self.name}"

class Child(Parent):
    def __init__(self, name, age):
        super().__init__(name)  # Parent.__init__ 호출
        self.age = age

    def greet(self):
        parent_greet = super().greet()  # Parent.greet 호출
        return f"{parent_greet} (age: {self.age})"

c = Child("Alice", 25)
print(c.greet())  # Hello from Alice (age: 25)
```

**깊이 있는 설명 — super()의 내부 동작:**

```text
super()는 두 개의 인자를 받습니다:
  super(Child, self).greet()

1. MRO 검색:
   type(self).__mro__ → [Child, Parent, object]
   Child 다음에 오는 클래스에서 'greet' 검색
   → Parent.greet 발견!

2. 메서드 바인딩:
   Parent.greet에 self를 바인딩
   → self.name을 사용 (자식 인스턴스의 name)

3. super()의 핵심:
   부모 클래스의 메서드를 호출하면서
   self는 자식 인스턴스를 유지
   → self.__class__는 여전히 Child
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: `__init__`과 `__new__`의 차이는 무엇인가요?</strong></summary>

`__new__`는 **클래스 메서드**로, 새 인스턴스를 생성하여 반환합니다. `__init__`은 **인스턴스 메서드**로, 생성된 인스턴스를 초기화합니다. 즉 `__new__`가 객체를 만들고, `__init__`이 그 객체를 설정합니다. 불변 객체(int, str, tuple)의 서브클래스를 만들 때 `__new__`를 오버라이드해야 합니다. 일반적인 사용에서는 `__init__`만 구현하면 됩니다.
</details>

<details>
<summary><strong>Q: 다중 상속을 사용해도 되나요?</strong></summary>

Python은 다중 상속을 지원하지만, 신중하게 사용해야 합니다. MRO가 복잡해지고 예기치 않은 동작이 발생할 수 있습니다. 다중 상속보다 **Mixin** 패턴(특정 기능을 추가하는 작은 클래스)이나 **컴포지션**(has-a 관계)을 우선 고려하세요. 다중 상속이 필요한 경우 다이아몬드 상속 구조에서 MRO의 C3 선형화가 올바른 순서로 메서드를 호출하는지 확인해야 합니다.
</details>

<details>
<summary><strong>Q: `@staticmethod`와 `@classmethod`의 차이는 무엇인가요?</strong></summary>

`@classmethod`는 자동으로 클래스(cls)를 첫 인자로 받습니다. 클래스 변수에 접근하거나, 대체 생성자를 만들 때 사용합니다. `@staticmethod`는 self나 cls를 받지 않는 일반 함수입니다. 클래스 이름 공간에 있을 뿐 객체나 클래스와 상호작용하지 않습니다. `@classmethod`는 상속 시 올바른 클래스가 전달되므로 더 유연합니다.
</details>

<details>
<summary><strong>Q: `__slots__`은 무엇이고 왜 사용하나요?</strong></summary>

`__slots__`은 클래스의 인스턴스가 가질 수 있는 속성을 제한합니다. `__dict__` 대신 고정된 크기의 배열을 사용하므로 **메모리를 50~70% 절약**하고 속성 접근 속도도 약 10% 향상됩니다. 수백만 개의 인스턴스를 생성하는 데이터 클래스에 유용합니다. 단, `__slots__`에 없는 속성은 동적으로 추가할 수 없고, 다중 상속에서 충돌이 발생할 수 있습니다.
</details>

<details>
<summary><strong>Q: 매직 메서드를 모두 구현해야 하나요?</strong></summary>

아니요. 필요한 것만 구현하면 됩니다. `__repr__`은 디버깅에 유용하므로 거의 항상 구현하는 것이 좋습니다. `__str__`은 `print()`에서 사용됩니다. 연산자가 필요할 때만 `__add__`, `__eq__` 등을 구현하면 됩니다. `functools.total_ordering` 데코레이터를 사용하면 `__eq__`와 `__lt__`만으로 나머지 비교 연산자를 자동 생성할 수 있습니다.
</details>

---

## 요약

- **클래스 생성**: `type(name, bases, dict)` 호출로 `__new__` → `__init__` 순서
- **MRO**: C3 선형화 알고리즘, `ClassName.__mro__`로 확인
- **매직 메서드**: 연산자 오버로딩, `__add__` → `BINARY_OP` 바인딩
- **@property**: 디스크립터 프로토콜(`__get__`/`__set__`), 속성처럼 접근
- **super()**: MRO 기반 부모 메서드 호출, self는 자식 인스턴스 유지
- **클래스 변수 vs 인스턴스 변수**: 인스턴스 `__dict__` → 클래스 `__dict__` 순서 탐색
- **추상 클래스**: ABCMeta, `@abstractmethod`로 인터페이스 강제
