---
layout: post
title: "Python 모듈과 패키지 — import 시스템, __init__, pip 심화"
description: "Python의 모듈과 패키지 시스템을 내부 동작 원리와 함께 심층 학습합니다. import의 3단계 탐색 과정(1. sys.modules 캐시 → 2. 내장 모듈 → 3. sys.path), __init__.py가 패키지를 초기화하는 과정, 상대 임포트(.)와 절대 임포트의 차이, pip의 의존성 해결 알고리즘, 가상 환경의 내부 구조, 그리고 패키지 배포(PyPI)까지 다룹니다."
date: 2023-02-20 10:00:00 +0900
category: python
tags: [python, modules, packages, import, pip, pypi, virtualenv]
level: intermediate
---

Python의 모듈과 패키지 시스템은 코드를 조직화하고 재사용하는 핵심 메커니즘입니다. import 한 줄이 내부적으로 수행하는 3단계 탐색 과정과 패키지 시스템의 동작 원리를 이해하면, 더 체계적인 Python 프로젝트를 구성할 수 있습니다.

> **💡 핵심 정리** ・ Python의 `import`는 3단계로 동작합니다: (1) `sys.modules` 캐시 확인(O(1) 딕셔너리 조회) → (2) 내장 모듈 확인 → (3) `sys.path`의 각 디렉토리에서 `.py`/`.pyc`/`.so` 파일 검색. 패키지는 디렉토리 + `__init__.py`로, `__init__.py`는 패키지 임포트 시 자동 실행됩니다. pip는 PyPI에서 패키지를 다운로드하고 **SAT(충족 가능성) 솔버**로 의존성 트리를 해결합니다. 가상 환경은 `PATH` 환경 변수를 조작하여 독립된 site-packages를 사용합니다.

> **이 수업에서 배울 내용:** import 시스템의 3단계 탐색 과정, __init__.py의 역할, 상대/절대 임포트 차이, 패키지 설계 패턴, pip의 의존성 해결, requirements.txt 관리, 가상 환경 심화, 그리고 PyPI 패키지 배포까지 학습합니다.

---

## import 시스템 — 3단계 탐색

```python
import math          # 내장 모듈
import os.path       # 서브모듈
from datetime import date  # 특정 이름만 임포트
import numpy as np   # 별칭
from mypackage import mymodule  # 사용자 패키지
```

**깊이 있는 설명 — import math가 내부에서 하는 3단계:**

```text
1단계: sys.modules 캐시 확인
  sys.modules['math'] 존재?
  → 있으면: 바로 반환 (딕셔너리 O(1) 조회)
  → 없으면: 2단계로

2단계: 내장 모듈 확인
  math가 내장 모듈 목록에 있는지 확인
  → 있으면: C 확장 모듈 로드 (파이썬 바이너리에 포함)
  → 없으면: 3단계로

3단계: sys.path 탐색
  sys.path의 각 디렉토리에서 math 검색:
    1. math.py (소스 파일)
    2. math.pyc (컴파일된 바이트코드)
    3. math.so (C 확장, Linux)
    4. math.pyd (C 확장, Windows)
  → 첫 번째로 발견된 파일 로드
  → 없으면: ModuleNotFoundError

sys.path의 구성:
  1. 현재 스크립트의 디렉토리 (또는 '' 빈 문자열)
  2. PYTHONPATH 환경 변수
  3. 표준 라이브러리 디렉토리
  4. site-packages 디렉토리 (pip 설치 패키지)
```

### 모듈 캐싱 — sys.modules

```python
import sys

# 이미 임포트된 모듈 확인
print('math' in sys.modules)  # True (방금 임포트)

# sys.modules는 딕셔너리 (모든 임포트된 모듈 저장)
print(sys.modules['math'].pi)  # 3.14159

# 주의: sys.modules에서 삭제하면?
del sys.modules['math']
import math  # 다시 로드됨 (파일에서)
```

---

## 패키지 — __init__.py의 역할

```python
# 디렉토리 구조:
# mypackage/
#   __init__.py
#   module_a.py
#   module_b.py
#   subpackage/
#     __init__.py
#     module_c.py

# mypackage/__init__.py
from .module_a import useful_function
from .module_b import HelperClass

__all__ = ['useful_function', 'HelperClass']  # from mypackage import * 시 공개할 이름
```

**깊이 있는 설명 — __init__.py의 실행 과정:**

```text
import mypackage 실행 시:

1. mypackage/ 디렉토리 발견 (sys.path에서)
2. __init__.py 파일 로드 및 실행
   → from .module_a import useful_function
      → mypackage/module_a.py 로드
      → useful_function을 mypackage 네임스페이스에 추가
   → from .module_b import HelperClass
      → mypackage/module_b.py 로드
      → HelperClass를 mypackage 네임스페이스에 추가

3. mypackage 모듈 객체 생성
   __name__ = 'mypackage'
   __path__ = ['/path/to/mypackage']
   __file__ = '/path/to/mypackage/__init__.py'
```

### __init__.py 모범 사례

```python
# __init__.py — 패키지의 공개 API 정의

# 1. 편리한 임포트 경로 제공
from .models import User, Post, Comment
from .services import UserService, PostService
from .exceptions import NotFoundError, ValidationError

# 2. __all__로 공개 API 명시
__all__ = [
    'User', 'Post', 'Comment',
    'UserService', 'PostService',
    'NotFoundError', 'ValidationError',
]

# 3. 버전 정보
__version__ = '1.0.0'

# 4. 패키지 레벨 설정
import logging
logging.getLogger(__name__).addHandler(logging.NullHandler())
```

---

## 상대 임포트 vs 절대 임포트

```python
# package/
#   __init__.py
#   sub_a.py
#   sub_b.py

# sub_b.py에서 sub_a.py를 임포트하는 방법:

# 절대 임포트 (권장)
from package import sub_a
from package.sub_a import some_function

# 상대 임포트 (같은 패키지 내에서만)
from . import sub_a           # 같은 디렉토리
from .sub_a import some_function  # 같은 디렉토리의 모듈
from .. import parent_module  # 부모 패키지
from ..subpackage import mod  # 형제 패키지
```

| 방식 | 장점 | 단점 | 권장 상황 |
|------|------|------|---------|
| 절대 임포트 | 명확함, 이동에 강함 | 경로가 길어짐 | **대부분의 경우 (권장)** |
| 상대 임포트 | 간결함, 패키지 내부 | 이동 시 깨짐 | 패키지 내부 참조, 리팩토링 덜 되는 코드 |

---

## pip와 의존성 관리

```bash
# 기본 명령어
pip install requests           # 최신 버전 설치
pip install requests==2.31.0   # 특정 버전
pip install requests>=2.30,<3 # 버전 범위
pip install -r requirements.txt # 파일로 설치
pip list                       # 설치된 패키지 목록
pip show requests              # 상세 정보
pip uninstall requests         # 제거
```

### requirements.txt

```txt
# requirements.txt
flask==3.0.0
requests>=2.31,<3.0
numpy>=1.26
pandas==2.1.0
pytest>=7.0
black==23.12.0
```

```bash
# 현재 환경 저장
pip freeze > requirements.txt

# 환경 복원
pip install -r requirements.txt
```

**깊이 있는 설명 — pip의 의존성 해결 과정:**

```text
pip install flask 실행 시:

1단계: flask의 메타데이터 확인 (PyPI API)
  → flask==3.0.0의 의존성:
    Werkzeug>=3.0.0
    Jinja2>=3.1.2
    click>=8.1.3
    itsdangerous>=2.1.2

2단계: 각 의존성의 의존성 확인 (재귀)
  Werkzeug>=3.0.0 → (의존성 없음)
  Jinja2>=3.1.2 → MarkupSafe>=2.0
  click>=8.1.3 → (의존성 없음)
  itsdangerous>=2.1.2 → (의존성 없음)
  MarkupSafe>=2.0 → (의존성 없음)

3단계: SAT 솔버로 버전 충돌 확인
  모든 패키지의 버전 요구사항을 만족하는 조합 찾기
  충돌이 있으면: ResolutionImpossible 에러

4단계: 다운로드 및 설치
  wheel(.whl) 파일 다운로드 (바이너리, 설치 빠름)
  없으면: source(.tar.gz) → 빌드 → 설치
  각 패키지를 site-packages에 압축 해제
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: `if __name__ == "__main__"`은 왜 필요한가요?</strong></summary>

이 조건문은 모듈이 직접 실행될 때와 임포트될 때를 구분합니다. `python script.py`로 직접 실행하면 `__name__`이 `"__main__"`이 되고, `import script`로 임포트하면 모듈 이름(script)이 됩니다. 이 패턴을 사용하면 모듈을 CLI 도구와 라이브러리로 동시에 사용할 수 있습니다. 테스트 코드나 데모 코드를 이 블록 안에 넣는 것이 일반적입니다.
</details>

<details>
<summary><strong>Q: `from module import *`을 사용하면 안 되는 이유는?</summary></strong>

네임스페이스를 오염시키고 예기치 않은 이름 충돌을 일으킬 수 있습니다. `*`로 임포트된 이름을 추적하기 어렵고, 모듈이 업데이트되면 새로운 이름이 갑자기 코드에 나타날 수 있습니다. `__all__`로 제어할 수 있지만, 명시적 임포트가 항상 더 좋습니다. `from module import specific_name`처럼 필요한 것만 임포트하세요.
</details>

<details>
<summary><strong>Q: pip와 conda의 차이는 무엇인가요?</strong></summary>

pip는 Python 전용 패키지 매니저로 PyPI에서 패키지를 설치합니다. conda는 언어에 독립적인 패키지 매니저로, Python뿐 아니라 C/C++ 라이브러리, R 등도 관리합니다. conda는 의존성 해결이 더 강력하고(충돌이 적음), 바이너리 패키지를 제공하여 컴파일이 필요 없습니다. 데이터 과학 분야에서는 conda를, 일반 Python 개발에서는 pip를 주로 사용합니다.
</details>

<details>
<summary><strong>Q: 패키지를 PyPI에 배포하려면 어떻게 하나요?</strong></summary>

`setuptools`를 사용하여 `setup.py` 또는 `pyproject.toml`을 작성하고, `build`로 패키지를 빌드한 후 `twine upload`로 PyPI에 업로드합니다. 최근에는 `pyproject.toml` 기반의 `flit`이나 `poetry`를 사용하는 것이 표준이 되고 있습니다. 테스트 배포는 `test.pypi.org`를 먼저 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: 가상 환경은 어떻게 작동하나요?</strong></summary>

가상 환경은 `PATH` 환경 변수를 수정하여 시스템 Python 대신 가상 환경의 Python이 먼저 실행되도록 합니다. `site-packages` 디렉토리가 격리되어 있어, 시스템에 설치된 패키지와 독립적으로 패키지를 관리할 수 있습니다. `python -m venv myenv`로 생성되고, `source myenv/bin/activate`(Linux) 또는 `myenv\\Scripts\\activate`(Windows)로 활성화합니다.
</details>

---

## 요약

- **import 3단계**: sys.modules → 내장 모듈 → sys.path 탐색
- **모듈 캐싱**: sys.modules는 LRU 딕셔너리, 재임포트 방지
- **__init__.py**: 패키지 임포트 시 자동 실행, 공개 API 정의
- **절대 임포트 권장**: 명확하고 이동에 강함
- **pip**: SAT 솔버로 의존성 해결, requirements.txt로 관리
- **가상 환경**: PATH 조작으로 격리된 Python 환경
- **__name__ == "__main__"**: 직접 실행과 임포트 구분
