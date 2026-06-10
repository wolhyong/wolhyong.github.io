---
layout: post
title: "Python 디자인 패턴 — 싱글턴, 팩토리, 전략, 옵저버, 데코레이터 패턴"
description: "Python으로 GoF 디자인 패턴을 구현하는 방법을 심층 학습합니다. 싱글턴 패턴의 여러 구현 방식(메타클래스, __new__, 모듈)과 스레드 안전성, 팩토리 메서드와 추상 팩토리 패턴, 전략 패턴의 일급 함수 기반 구현, 옵저버 패턴의 이벤트 기반 아키텍처, Python의 @ 구문을 활용한 데코레이터 패턴을 다룹니다."
date: 2023-04-03 10:00:00 +0900
category: python
tags: [python, design-patterns, singleton, factory, strategy, observer, decorator-pattern]
level: advanced
---

디자인 패턴은 검증된 소프트웨어 설계 솔루션입니다. Python의 동적 특성 덕분에 많은 패턴을 더 간결하고 우아하게 구현할 수 있습니다.

> **💡 핵심 정리** · Python의 싱글턴은 메타클래스(`__call__` 오버라이드), `__new__`, 또는 모듈 레벨(가장 Pythonic)로 구현됩니다. 전략 패턴은 Strategy 인터페이스 대신 일급 함수(람다, 함수 참조)로 직접 전달할 수 있어 GoF보다 간결합니다. 옵저버 패턴은 이벤트 시스템으로 확장되며, Python의 `callable` 프로토콜을 통해 리스너가 함수나 객체 모두 가능합니다. 데코레이터 패턴은 Python의 `@` 구문을 통해 언어 레벨에서 기본 지원됩니다.

> **이 수업에서 배울 내용:** Pythonic 싱글턴 구현, 팩토리 메서드와 추상 팩토리, 함수 기반 전략 패턴, 옵저버 패턴의 이벤트 시스템, Python @ 구문의 데코레이터 패턴을 학습합니다.

---

## 📚 수업 목표

- Python에서 싱글턴 패턴을 여러 방식으로 구현할 수 있습니다.
- 팩토리 메서드와 추상 팩토리 패턴을 이해합니다.
- 전략 패턴을 일급 함수로 간결하게 구현할 수 있습니다.
- 옵저버 패턴으로 이벤트 시스템을 구축할 수 있습니다.
- 데코레이터 패턴을 함수와 클래스에 적용할 수 있습니다.

## 싱글턴 패턴

```python
# 방식 1: 모듈 레벨 (가장 Pythonic)
class Database:
    def query(self, sql):
        pass

db = Database()  # 모듈 임포트 시 한 번만 생성

# 방식 2: 메타클래스
class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class Config(metaclass=SingletonMeta):
    def __init__(self):
        self.settings = {}
```

---

## 전략 패턴

```python
from typing import Callable

# 함수 기반 전략 (GoF보다 간결)
def quick_sort(data):
    return sorted(data)

def merge_sort(data):
    if len(data) <= 1:
        return data
    mid = len(data) // 2
    left = merge_sort(data[:mid])
    right = merge_sort(data[mid:])
    return merge(left, right)

class Sorter:
    def __init__(self, strategy: Callable):
        self.strategy = strategy

    def sort(self, data):
        return self.strategy(data)

sorter = Sorter(strategy=quick_sort)
result = sorter.sort([3, 1, 4, 1, 5])
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Python의 디자인 패턴과 GoF 패턴의 차이는 무엇인가요?</strong></summary>

Python은 동적 타이핑, 일급 함수, 데코레이터, 메타클래스 등 GoF 패턴을 더 간결하게 만드는 기능이 많습니다. 예를 들어 전략 패턴은 Strategy 인터페이스가 필요 없고 함수를 직접 전달합니다. 싱글턴은 메타클래스나 모듈로 구현합니다. 하지만 GoF 패턴의 핵심 의도와 문제 해결 방식은 동일합니다.
</details>

<details>
<summary><strong>Q: 싱글턴 패턴의 단점은 무엇인가요?</strong></summary>

싱글턴은 전역 상태를 만들고 단위 테스트를 어렵게 합니다. 의존성 주입(DI)으로 대체하는 것이 좋습니다. Python에서는 `app.config` 같은 모듈 레벨 객체가 싱글턴 역할을 하지만, 테스트 시 교체가 어렵습니다. FastAPI/Flask의 `app.config`도 실제로는 싱글턴입니다.
</details>

<details>
<summary><strong>Q: 옵저버 패턴 대신 asyncio를 사용할 수 있나요?</strong></summary>

옵저버 패턴과 asyncio는 다른 개념입니다. 옵저버는 상태 변경 알림(동기/이벤트)에 사용되고, asyncio는 I/O 동시성(비동기 작업)에 사용됩니다. GUI 이벤트 처리에는 옵저버가, 데이터베이스 쿼리 병렬 처리에는 asyncio가 적합합니다.
</details>

<details>
<summary><strong>Q: 팩토리 패턴이 항상 필요한가요?</strong></summary>

아니요. 객체 생성이 단순하면 직접 생성하는 것이 좋습니다. 팩토리는 1) 생성 로직이 복잡하거나, 2) 생성할 클래스를 런타임에 결정해야 하거나, 3) 생성 과정을 유연하게 확장해야 할 때 유용합니다. 과도한 패턴 사용은 YAGNI 원칙을 위반할 수 있습니다.
</details>

---

## 요약

- **싱글턴**: 메타클래스/__new__/모듈 레벨, 모듈 레벨이 가장 Pythonic
- **팩토리**: 복잡한 객체 생성 추상화, 설정 기반 인스턴스 생성
- **전략**: 일급 함수로 간결하게 구현, Duck Typing으로 인터페이스 없음
- **옵저버**: 이벤트 기반 알림, `__call__`로 함수/객체 모두 리스너 가능
- **데코레이터**: Python `@` 구문 기본 지원, 관점 지향 프로그래밍
