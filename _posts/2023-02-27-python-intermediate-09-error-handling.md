---
layout: post
title: "Python 에러 처리 — try/except, 사용자 정의 예외, 예외 체이닝"
description: "Python의 예외 처리 시스템을 내부 동작 원리와 함께 심층 학습합니다. try/except/else/finally의 4블록 구조와 PVM의 예외 전파 과정, raise와 raise ... from의 차이(예외 체이닝과 __cause__), 사용자 정의 예외 클래스 작성 패턴, traceback 객체의 스택 프레임 역참조, 컨텍스트 관리자의 예외 처리(__exit__의 exc_info), 그리고 EAFP vs LBYL 철학을 다룹니다."
date: 2023-02-27 10:00:00 +0900
category: python
tags: [python, exceptions, error-handling, try-except, traceback, eafp, context-manager]
level: intermediate
---

예외 처리는 견고한 프로그램의 핵심입니다. Python의 예외 처리는 단순히 에러를 잡는 것 이상으로, **제어 흐름의 한 형태**로 사용됩니다. "허가보다 용서가 쉽다(EAFP: Easier to Ask for Forgiveness than Permission)"는 Python의 철학은 예외를 적극적으로 활용합니다.

> **💡 핵심 정리** · Python의 예외 처리는 PVM이 `PyErr_SetString()`으로 예외를 설정하고 호출 스택을 역으로 탐색하며 except 절과 매칭되는 타입을 찾습니다. `try/except/else/finally`의 4블록 구조는 정해진 순서(try → except(예외 시) → else(정상 시) → finally(항상))로 실행됩니다. `raise ... from`은 `__cause__` 속성으로 예외 체인을 형성하고, `raise` 단독 호출은 `sys.exc_info()`의 현재 예외를 재발생시킵니다. 사용자 정의 예외는 Exception을 상속받으며, `__init__`으로 추가 데이터를 전달할 수 있습니다.

> **이 수업에서 배울 내용:** try/except/else/finally의 실행 순서와 PVM의 예외 전파, raise와 예외 체이닝, 사용자 정의 예외 클래스, traceback 분석, 컨텍스트 관리자와 예외 처리, EAFP vs LBYL 철학 비교를 학습합니다.

## 📚 수업 목표

- try/except/else/finally의 실행 순서와 PVM 레벨 동작을 이해합니다.
- raise와 raise ... from의 차이(예외 체이닝)를 이해합니다.
- 사용자 정의 예외 클래스를 작성할 수 있습니다.
- traceback 객체를 분석하고 로깅할 수 있습니다.
- 컨텍스트 관리자에서 예외를 처리하는 방법을 이해합니다.
- EAFP와 LBYL의 차이와 적절한 사용 시나리오를 판단할 수 있습니다.

## try/except/finally — PVM의 예외 전파

```python
try:
    result = 10 / 0  # ZeroDivisionError 발생
except ZeroDivisionError:
    print("0으로 나눌 수 없습니다")
except TypeError:
    print("타입이 잘못되었습니다")
else:
    print(f"결과: {result}")  # 예외 없을 때만 실행
finally:
    print("항상 실행됩니다")  # 무조건 실행
```

**깊이 있는 설명 — PVM의 예외 전파 과정:**

```text
10 / 0 실행 시 PVM의 예외 처리 과정:

1. BINARY_OP 바이트코드 실행 (10 / 0)
   → PyNumber_TrueDivide(10, 0) 호출
   → int___truediv__에서 0 체크
   → PyErr_SetString(PyExc_ZeroDivisionError, "division by zero")
   → 함수 반환 없이 에러 표시 (NULL 반환)

2. PVM 메인 루프가 에러 감지
   → PyErr_Occurred() != NULL
   → 현재 프레임의 except 핸들러 검색

3. try 블록의 except 절 확인
   → except ZeroDivisionError: → 타입 일치!
   → 예외 객체를 except 변수에 할당
   → except 블록의 바이트코드 실행

4. finally 블록 실행
   → try/except/else 블록 이후 finally 무조건 실행
   → finally에서 예외 발생 시 이전 예외 대체됨 (주의!)

5. except가 없으면:
   → 현재 프레임 반환 (스택 언와인딩)
   → 호출자 프레임에서 재검색
   → 최상위까지 없으면: sys.excepthook 호출 → stderr 출력
```

### 여러 예외 처리

```python
# 여러 예외를 같은 방식으로 처리
try:
    value = int(input("숫자 입력: "))
    result = 100 / value
except (ValueError, TypeError) as e:
    print(f"입력 오류: {e}")
except ZeroDivisionError:
    print("0으로 나눌 수 없습니다")

# 예외 정보 저장
import sys
try:
    risky_operation()
except:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    print(f"예외 타입: {exc_type.__name__}")
    print(f"예외 메시지: {exc_value}")
```

---

## raise와 예외 체이닝

```python
# 기본 raise
def divide(a, b):
    if b == 0:
        raise ValueError("0으로 나눌 수 없습니다")
    return a / b

# 예외 재발생
try:
    divide(10, 0)
except ValueError as e:
    print(f"오류 발생: {e}")
    raise  # 같은 예외 다시 발생 (스택 트레이스 유지)
```

**깊이 있는 설명 — raise ... from의 예외 체이닝:**

```python
# 예외 체이닝 (chain exceptions)
def process_data(filename):
    try:
        with open(filename) as f:
            return f.read()
    except FileNotFoundError as e:
        raise RuntimeError(f"파일 처리 실패: {filename}") from e
        # 원본 예외(e)가 __cause__에 저장됨

try:
    process_data("nonexistent.txt")
except RuntimeError as e:
    print(f"RuntimeError: {e}")
    print(f"원인: {e.__cause__}")  # FileNotFoundError
```

```text
raise X from Y의 내부 동작:

1. Y 예외 발생 (FileNotFoundError)
2. X 예외 생성 (RuntimeError)
3. X.__cause__ = Y 설정
4. X 발생

출력:
  Traceback (most recent call last):
    File ..., line X, in process_data
      with open(filename) as f:
  FileNotFoundError: [Errno 2] No such file or directory: 'nonexistent.txt'

  The above exception was the direct cause of the following exception:

  Traceback (most recent call last):
    File ..., line Y, in <module>
      process_data("nonexistent.txt")
  RuntimeError: 파일 처리 실패: nonexistent.txt

raise X from None → __cause__ = None (원본 예외 숨김)
raise (단독) → sys.exc_info()의 현재 예외 재발생
```

---

## 사용자 정의 예외

```python
class ApplicationError(Exception):
    """애플리케이션 기본 예외"""
    pass

class ValidationError(ApplicationError):
    """입력 검증 실패"""
    def __init__(self, field, message, value=None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"{field}: {message}")

class NotFoundError(ApplicationError):
    """리소스를 찾을 수 없음"""
    def __init__(self, resource_type, resource_id):
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(f"{resource_type}(id={resource_id})를 찾을 수 없습니다")

class DatabaseError(ApplicationError):
    """데이터베이스 오류"""
    pass

# 사용
def get_user(user_id):
    if user_id <= 0:
        raise ValidationError("user_id", "양수여야 합니다", user_id)
    if user_id > 100:
        raise NotFoundError("User", user_id)
    return {"id": user_id, "name": "Alice"}

try:
    user = get_user(-1)
except ValidationError as e:
    print(f"[검증 오류] {e.field}: {e.message} (입력값: {e.value})")
except NotFoundError as e:
    print(f"[찾을 수 없음] {e}")
```

---

## 컨텍스트 관리자에서 예외 처리

```python
class DatabaseConnection:
    def __enter__(self):
        print("데이터베이스 연결")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            # 예외 발생 시: 롤백
            print(f"롤백 중... ({exc_type.__name__}: {exc_val})")
            # return True → 예외 억제 (조심히 사용!)
            # return False 또는 None → 예외 전파
        else:
            # 정상: 커밋
            print("커밋 완료")
        print("연결 종료")
        return False  # 예외 전파

with DatabaseConnection() as db:
    result = 10 / 0  # ZeroDivisionError
    # __exit__에 예외 정보 전달됨
```

---

## EAFP vs LBYL

| 철학 | 방식 | Python | 예시 |
|------|------|--------|------|
| **EAFP** | 일단 시도하고 예외 처리 | ✅ 권장 | `try: x = d[key]; except KeyError: x = default` |
| **LBYL** | 먼저 검사하고 실행 | ❌ 덜 선호 | `if key in d: x = d[key]; else: x = default` |

```python
# LBYL (Look Before You Leap) — C 스타일
def get_value_lbyl(d, key, default=None):
    if key in d:           # 1차 검사
        value = d[key]     # 2차 접근
        return value
    return default

# EAFP (Easier to Ask for Forgiveness) — Python 스타일
def get_value_eafp(d, key, default=None):
    try:
        return d[key]      # 일단 접근
    except KeyError:       # 실패 시 처리
        return default
```

**성능 측정 — EAFP vs LBYL (100만 번 호출):**

| 방식 | 키 존재(성공) | 키 부재(실패) |
|------|:----------:|:----------:|
| LBYL: `if key in d` | ~55ms | ~55ms |
| EAFP: `try: d[key]` | **~40ms** | ~450ms |
| LBYL: `d.get(key)` | ~45ms | ~45ms |

> **실전 노하우:** EAFP는 **성공 경로**에서 LBYL보다 빠릅니다(LBYL은 두 번 검색). 하지만 예외가 자주 발생하는 경로에서는 LBYL이 더 빠릅니다. 예외 비용이 높기 때문입니다.

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: `except:`와 `except Exception:`의 차이는 무엇인가요?</strong></summary>

`except:` (인자 없음)은 **모든 예외**를 잡습니다. 심지어 `SystemExit`, `KeyboardInterrupt`, `GeneratorExit` 같은 특수 예외도 잡아서 프로그램 종료를 방해할 수 있습니다. `except Exception:`은 `Exception`의 서브클래스만 잡아서 위 세 가지 특수 예외는 통과시킵니다. 따라서 대부분의 경우 `except Exception:`을 사용해야 합니다. 정말로 모든 예외를 잡아야 하는 경우는 극히 드뭅니다.
</details>

<details>
<summary><strong>Q: finally 블록에서 예외가 발생하면 어떻게 되나요?</strong></summary>

finally 블록의 예외는 **이전 예외를 대체**합니다. 즉, try 블록에서 발생한 예외가 finally 블록의 예외로 덮어써집니다. 이는 디버깅을 어렵게 만들 수 있으므로, finally 블록에서는 예외가 발생하지 않도록 주의해야 합니다. finally 블록에서 리소스 정리와 같은 안전한 작업만 수행하고, 예외가 발생할 수 있는 코드는 try 블록 밖에 두는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: assert는 예외 처리에 사용해도 되나요?</strong></summary>

`assert`는 **디버깅 용도**로만 사용해야 합니다. `python -O`(최적화) 모드에서 assert는 완전히 제거됩니다. 따라서 입력 검증이나 중요한 비즈니스 로직 검증에는 `if condition: raise ValueError(...)`를 사용하세요. assert는 절대 발생하지 않아야 하는 조건(내부 불변식)을 테스트하는 용도로 적합합니다.
</details>

<details>
<summary><strong>Q: 예외를 너무 많이 사용하면 성능에 문제가 있나요?</strong></summary>

네, 예외 발생은 성능 비용이 큽니다. 예외가 발생하면 PVM이 스택 트레이스를 구성하고, 각 프레임의 로컬 변수를 캡처하고, 예외 핸들러를 탐색해야 합니다. 정상 경로에서 예외가 자주 발생한다면 LBYL 패턴을 고려하세요. 하지만 예외가 드물게 발생하는 경우(1% 미만)라면 EAFP가 더 깔끔하고 빠릅니다.
</details>

<details>
<summary><strong>Q: 내 예외 클래스는 어디에 정의해야 하나요?</strong></summary>

관련 모듈의 최상위 레벨에 정의하거나, `exceptions.py` 모듈로 분리하는 것이 일반적입니다. 패키지의 `__init__.py`에서 임포트하여 사용자에게 공개 API로 제공하면 편리합니다. 예외 클래스 계층은 깊게 만들지 말고, 보통 2~3단계 깊이가 적당합니다.
</details>

---

## 요약

- **try/except/else/finally**: try(시도) → except(예외 처리) → else(정상 시) → finally(항상)
- **예외 전파**: PVM이 호출 스택을 역탐색하며 except 절 매칭, 없으면 sys.excepthook
- **raise ... from**: `__cause__`로 예외 체이닝, None으로 원본 숨김
- **사용자 정의 예외**: Exception 상속, `__init__`으로 추가 데이터 전달
- **컨텍스트 관리자**: `__exit__`에서 exc_type/exc_val/exc_tb로 예외 처리
- **EAFP 권장**: 성공 경로에서 더 빠름, 예외가 드물 때 적합
- **except Exception:** 사용: SystemExit/KeyboardInterrupt를 잡지 않음
