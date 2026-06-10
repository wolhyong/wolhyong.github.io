---
layout: post
title: "Python 테스팅 — unittest, pytest, mocking, TDD, 통합 테스트"
description: "Python 테스팅을 도구와 방법론까지 심층 학습합니다. unittest의 TestLoader가 discover()로 테스트를 수집하는 과정과 setUp/tearDown의 실행 순서, pytest의 fixture 시스템과 conftest.py의 계층 구조, unittest.mock의 patch()가 속성을 임시로 대체하는 Mechanism, TDD의 Red-Green-Refactor 사이클을 다룹니다."
date: 2023-04-10 10:00:00 +0900
category: python
tags: [python, testing, unittest, pytest, mocking, tdd, pytest-fixture]
level: advanced
---

테스트는 안정적인 소프트웨어의 기반입니다. Python은 unittest, pytest 등 풍부한 테스팅 도구를 제공합니다.

> **💡 핵심 정리** · pytest는 발견된 모든 `test_*.py` 파일에서 `test_*` 함수를 수집하여 실행합니다. fixture는 `conftest.py`의 디렉토리 계층에 따라 scope(session/module/class/function)별로 한 번만 생성되고 자동으로 정리됩니다. `unittest.mock.patch()`는 대상 객체의 속성을 `Mock` 객체로 임시 교체하며, with 문 종료 시 원래 값으로 복원됩니다.

---

## 📚 수업 목표

- pytest와 unittest를 사용하여 테스트를 작성할 수 있습니다.
- fixture와 의존성 주입을 이해합니다.
- mocking을 사용하여 외부 의존성을 격리할 수 있습니다.
- TDD 사이클을 적용할 수 있습니다.
- 통합 테스트와 E2E 테스트를 구분할 수 있습니다.

## pytest 기본

```python
# test_calculator.py
import pytest

def test_addition():
    assert 1 + 1 == 2

def test_subtraction():
    assert 3 - 1 == 2

class TestCalculator:
    def test_multiplication(self):
        assert 2 * 3 == 6

    def test_division(self):
        assert 10 / 2 == 5
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: pytest와 unittest 중 어떤 것을 선택해야 하나요?</strong></summary>

**pytest**를 권장합니다. pytest는 더 간결한 문법(assert 한 줄), 자동 fixture 관리, 강력한 플러그인 시스템, 더 상세한 에러 메시지를 제공합니다. unittest는 표준 라이브러리이므로 별도 설치가 필요 없고, JUnit 스타일에 익숙한 팀에 적합합니다. 대부분의 새 프로젝트는 pytest를 선택합니다.
</details>

<details>
<summary><strong>Q: Mock 객체는 어떻게 동작하나요?</strong></summary>

Mock 객체는 모든 속성 접근과 메서드 호출을 가로채서 새로운 Mock을 반환합니다. `assert_called_with()`로 호출 인자를 검증하고, `side_effect`로 예외를 발생시키거나, `return_value`로 반환값을 설정할 수 있습니다. `patch()`는 컨텍스트 관리자로 사용하여 특정 범위에서만 Mock을 적용합니다.
</details>

<details>
<summary><strong>Q: 테스트 커버리지는 100%가 목표인가요?</strong></summary>

**아니요.** 100% 커버리지는 오히려 해롭습니다. 단순 getter/setter, 외부 라이브러리 호출, 죽은 코드까지 테스트하면 유지보수 비용만 증가합니다. 핵심 비즈니스 로직에 집중하고, 중요한 분기(if-else, 예외 처리)를 우선 테스트하세요. 일반적으로 70~80% 커버리지가 실용적인 목표입니다.
</details>

<details>
<summary><strong>Q: TDD를 꼭 해야 하나요?</strong></summary>

TDD는 강력한 방법론이지만 모든 상황에 적합하지는 않습니다. 탐색적 프로그래밍(프로토타입, 데이터 분석)에는 TDD가 오히려 방해가 됩니다. 하지만 안정성이 중요한 비즈니스 로직, API, 라이브러리 코드에는 TDD가 큰 도움이 됩니다. 중요한 것은 **테스트를 아예 작성하지 않는 것**이 최악이라는 점입니다.
</details>

<details>
<summary><strong>Q: 통합 테스트와 단위 테스트의 비율은 어떻게 되나요?</strong></summary>

**테스트 피라미드**에 따르면: 단위 테스트 70%, 통합 테스트 20%, E2E 테스트 10%가 이상적입니다. 단위 테스트는 빠르고(ms 단위) 신뢰할 수 있으며, 문제 발생 시 정확히 어디가 잘못되었는지 알려줍니다. E2E 테스트는 느리고(초~분 단위) 불안정하지만, 실제 사용자 시나리오를 검증합니다.
</details>

---

## 요약

- **pytest**: 간결한 assert, 자동 발견, fixture 시스템
- **Mock**: `patch()`로 의존성 격리, `side_effect`로 다양한 시나리오
- **TDD**: Red-Green-Refactor 사이클, 테스트를 먼저 작성
- **테스트 피라미드**: 단위(70%) > 통합(20%) > E2E(10%)
