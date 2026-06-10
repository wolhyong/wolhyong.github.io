---
layout: post
title: "Python 파일 입출력 심화 — CSV, JSON, pickle, os, pathlib, tempfile"
description: "Python의 파일 입출력을 실무 수준에서 심층 학습합니다. CSV 파싱의 다양한 옵션과 대용량 처리, JSON 직렬화의 내부 구조와 커스텀 인코더, pickle의 프로토콜 버전별 동작과 보안 위험, os 모듈의 파일/디렉토리 조작과 저수준 시스템 콜, pathlib의 객체 지향 경로 처리, tempfile의 안전한 임시 파일 생성을 다룹니다."
date: 2023-03-20 10:00:00 +0900
category: python
tags: [python, file-io, csv, json, pickle, pathlib, tempfile, serialization]
level: intermediate
---

파일 입출력은 프로그래밍의 기본입니다. Python은 텍스트, 바이너리, 구조화된 데이터 등 다양한 형식의 파일 처리를 위한 풍부한 도구를 제공합니다.

> **💡 핵심 정리** · Python의 `csv` 모듈은 `_csv.reader` C 확장으로 구현되어 순수 Python 파싱보다 약 5배 빠릅니다. `json` 모듈은 `json.JSONEncoder`와 `json.JSONDecoder`를 상속하여 커스텀 타입 직렬화가 가능하며, `pickle`은 Python 객체 그래프를 프로토콜 버전(5단계)으로 직렬화하지만 보안상 신뢰할 수 없는 데이터에는 절대 사용해서는 안 됩니다. `pathlib.Path`는 `PurePosixPath`/`PureWindowsPath`의 계층 구조로 플랫폼 독립적인 경로 조작을 제공합니다.

> **이 수업에서 배울 내용:** CSV 파싱 옵션과 대용량 처리, JSON 커스텀 인코딩, pickle의 프로토콜과 보안, os 모듈의 파일/디렉토리 조작, pathlib의 객체 지향 경로, tempfile의 안전한 임시 파일을 학습합니다.

---

## 📚 수업 목표

- CSV 파일을 다양한 옵션으로 읽고 쓸 수 있습니다.
- JSON 직렬화에서 커스텀 타입을 처리할 수 있습니다.
- pickle의 프로토콜 버전과 보안 위험을 이해합니다.
- os 모듈로 파일과 디렉토리를 조작할 수 있습니다.
- pathlib로 플랫폼 독립적인 경로를 처리할 수 있습니다.
- 안전하게 임시 파일을 생성하고 관리할 수 있습니다.

## CSV — 구조화된 텍스트 데이터

```python
import csv

# CSV 읽기
with open("data.csv", "r", newline="") as f:
    reader = csv.DictReader(f)  # 헤더를 키로 사용
    for row in reader:
        print(row["name"], row["age"])

# CSV 쓰기
with open("output.csv", "w", newline="") as f:
    fieldnames = ["name", "age", "city"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow({"name": "Alice", "age": 25, "city": "Seoul"})
```

**깊이 있는 설명 — CSV 파서의 내부 구조와 최적화:**

```text
csv.reader는 내부적으로 C 확장(_csv.reader)으로 구현됨:

typedef struct {
    PyObject_HEAD
    PyObject *dialect;       // 구분자, 인용문자 등 설정
    int line_num;            // 현재 줄 번호
    unsigned long field_num; // 현재 필드 인덱스
    int state;               // 파서 상태 (START, FIELD, QUOTED, ...)
    PyObject *fields;        // 현재까지 수집된 필드 리스트
} ReaderObject;

파서 상태 머신:
  START → FIELD(따옴표 없음) → RECORD_END → START
        → QUOTED(따옴표 시작) → FIELD → QUOTED 종료 → START

성능 비교 (100만 행, 10열):
  csv.DictReader:  ~1.8s  (C 확장)
  순수 Python split(): ~9.2s (따옴표 처리 없음)
  pandas.read_csv:  ~0.8s  (C 엔진, numpy 배열)
```

### 고급 CSV 옵션

```python
import csv

# 사용자 정의 방언
csv.register_dialect("pipes", delimiter="|", quoting=csv.QUOTE_NONE)

with open("pipedata.csv") as f:
    reader = csv.reader(f, dialect="pipes")

# 대용량 CSV 청크 처리
def process_large_csv(filename, chunk_size=1000):
    with open(filename) as f:
        reader = csv.DictReader(f)
        chunk = []
        for i, row in enumerate(reader):
            chunk.append(row)
            if (i + 1) % chunk_size == 0:
                yield chunk  # 제너레이터로 청크 반환
                chunk = []
        if chunk:
            yield chunk
```

---

## JSON — 데이터 교환 형식

```python
import json

# 기본 직렬화
data = {
    "name": "Alice",
    "age": 25,
    "skills": ["Python", "JavaScript"],
    "active": True,
    "score": None,
}

json_str = json.dumps(data, indent=2, ensure_ascii=False)
print(json_str)

# 역직렬화
parsed = json.loads(json_str)
print(parsed["name"])  # Alice
```

**깊이 있는 설명 — JSON 직렬화 엔진의 내부 구조:**

```text
json.dumps(data)의 내부 동작:

1. json.encoder.JSONEncoder 인스턴스 생성
2. _make_iterencode() → 재귀적 인코더 생성
3. 각 타입별 처리:
   dict → _iterencode_dict (키-값 쌍 반복)
   list → _iterencode_list (요소 반복)
   str  → _iterencode_string (이스케이프 처리)
   int/float → repr() 호출
   True/False/None → 문자열로 변환

4. 기본 타입이 아닌 경우:
   → cls.default(o) 호출 (실패 시 TypeError)

커스텀 직렬화:
  class CustomEncoder(json.JSONEncoder):
      def default(self, obj):
          if isinstance(obj, datetime):
              return obj.isoformat()
          if isinstance(obj, Decimal):
              return str(obj)
          return super().default(obj)

성능 측정 (100만 번):
  json.dumps(simple_dict):  ~0.12s (C 최적화)
  json.dumps(complex_obj):  ~0.45s (커스텀 인코더)
```

### JSON 커스텀 인코딩

```python
from datetime import datetime, date
from decimal import Decimal
import json

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return {"$date": obj.isoformat()}
        if isinstance(obj, date):
            return {"$date": obj.isoformat()}
        if isinstance(obj, Decimal):
            return {"$decimal": str(obj)}
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, bytes):
            return {"$binary": obj.hex()}
        return super().default(obj)

data = {
    "created": datetime(2024, 1, 15, 10, 30, 0),
    "price": Decimal("19.99"),
    "tags": {"python", "json", "serialization"},
}

json_str = json.dumps(data, cls=CustomEncoder, indent=2, ensure_ascii=False)
```

---

## pickle — Python 객체 직렬화

```python
import pickle

# 객체 저장
data = {"name": "Alice", "scores": [85, 92, 78], "meta": {"version": 1}}
with open("data.pkl", "wb") as f:
    pickle.dump(data, f)

# 객체 로드
with open("data.pkl", "rb") as f:
    loaded = pickle.load(f)
print(loaded == data)  # True
```

**깊이 있는 설명 — pickle 프로토콜과 보안:**

```text
pickle 프로토콜 버전 (※보안 경고: 절대 신뢰할 수 없는 데이터를 load()하지 마세요!):

  버전 0: 텍스트 기반 (가장 호환, 가장 느림)
  버전 1: 바이너리 형식
  버전 2: Python 2.3+ (new-style class)
  버전 3: Python 3.0+ (bytes, dict 뷰)
  버전 4: Python 3.4+ (대용량 데이터, namedtuple 최적화)
  버전 5: Python 3.8+ (out-of-band 데이터, 버퍼 프로토콜)

pickle.load()의 위험성:
  pickle은 Python 객체를 완전히 복원하므로,
  악의적인 pickle 데이터는 임의 코드 실행(arbitrary code execution) 가능

  보안 대안:
  1. JSON 사용 (안전하지만 Python 고유 타입 손실)
  2. 커스텀 언피클러 (Unpickler.find_class() 오버라이드)
  3. pickle.loads() 대신 json.loads()

  # 안전한 언피클: 허용된 클래스만 복원
  class SafeUnpickler(pickle.Unpickler):
      ALLOWED = {"builtins.print", ...}
      
      def find_class(self, module, name):
          if f"{module}.{name}" not in self.ALLOWED:
              raise pickle.UnpicklingError(f"금지된 클래스: {module}.{name}")
          return super().find_class(module, name)
```

---

## os & pathlib — 파일 시스템 조작

```python
import os
from pathlib import Path

# os 모듈
os.makedirs("data/subdir", exist_ok=True)
os.rename("old.txt", "new.txt")
os.remove("temp.txt")

for dirpath, dirnames, filenames in os.walk("."):
    for filename in filenames:
        if filename.endswith(".py"):
            print(os.path.join(dirpath, filename))

# pathlib (객체 지향)
base = Path("data/subdir")
filepath = base / "output.txt"  # / 연산자로 경로 결합
print(filepath.suffix)     # .txt
print(filepath.stem)       # output
print(filepath.parent)     # data/subdir
print(filepath.exists())   # True/False
```

**깊이 있는 설명 — pathlib의 클래스 계층 구조:**

```text
pathlib의 클래스 계층:

  PurePath (순수 경로 조작, I/O 없음)
  ├── PurePosixPath (Linux/macOS 스타일)
  └── PureWindowsPath (Windows 스타일)

  Path (실제 파일 시스템 I/O)
  ├── PosixPath (Unix 계열)
  └── WindowsPath (Windows)

Path 객체의 연산자 오버로딩:
  p = Path("/home") / "user" / "docs" / "file.txt"
  내부적으로 각 /가 __truediv__ 호출:
    Path("/home").__truediv__("user").__truediv__("docs")...

성능 비교 (10,000번 반복):
  os.path.join:   ~0.5ms
  pathlib / 연산자: ~1.2ms
  (pathlib이 더 직관적이지만 약간 느림)

주요 pathlib 메서드:
  .iterdir()       → 디렉토리 내용 반복
  .glob("*.py")    → 패턴 매칭
  .rglob("*.py")   → 재귀적 패턴 매칭
  .read_text()     → 텍스트 파일 읽기
  .write_text()    → 텍스트 파일 쓰기
  .read_bytes()    → 바이너리 파일 읽기
  .mkdir(parents=True)  → 부모 디렉토리도 생성
  .resolve()       → 절대 경로로 변환
```

---

## tempfile — 안전한 임시 파일

```python
import tempfile

# 임시 파일 (자동 삭제)
with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=True) as f:
    f.write("임시 데이터")
    temp_path = f.name
    print(f"임시 파일 경로: {temp_path}")
    # with 블록 종료 시 파일 자동 삭제

# 임시 디렉토리
with tempfile.TemporaryDirectory() as tmpdir:
    tmp_path = Path(tmpdir)
    work_file = tmp_path / "work.txt"
    work_file.write_text("작업 데이터")
    print(f"임시 디렉토리: {tmpdir}")
    # with 블록 종료 시 디렉토리 자동 삭제

# 수동 관리 (자동 삭제 안 됨)
tmp = tempfile.NamedTemporaryFile(mode="w", delete=False)
tmp.write("직접 삭제 필요")
tmp.close()
# os.unlink(tmp.name)  # 직접 삭제 필요
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: CSV와 JSON 중 어떤 형식을 사용해야 하나요?</strong></summary>

**CSV**는 표 형식 데이터(스프레드시트, 데이터베이스 내보내기)에 적합하고 용량이 작습니다. **JSON**은 중첩 구조, 다양한 데이터 타입, API 통신에 적합합니다. CSV는 스키마가 단순하고 Excel에서 직접 열 수 있지만, 중첩 데이터를 표현할 수 없습니다. JSON은 구조화된 데이터를 자연스럽게 표현하지만 용량이 더 큽니다.
</details>

<details>
<summary><strong>Q: pickle은 왜 위험한가요?</strong></summary>

pickle은 Python 객체를 완전히 복원하는 과정에서 **악의적인 코드를 실행**할 수 있습니다. pickle 파일에는 객체 생성에 필요한 모든 정보(모듈, 클래스, 인자)가 포함되어 있고, 이 과정에서 `__reduce__` 메서드가 호출되어 임의의 함수를 실행할 수 있습니다. 따라서 **신뢰할 수 없는 소스의 pickle 데이터는 절대 load()하지 마세요**. 데이터 교환에는 JSON이나 다른 안전한 포맷을 사용하세요.
</details>

<details>
<summary><strong>Q: pathlib과 os.path 중 어떤 것이 더 좋은가요?</strong></summary>

**pathlib**이 더 현대적이고 직관적입니다. 객체 지향 API로 경로를 다루고, `/` 연산자로 경로를 결합하며, 메서드 체이닝이 가능합니다. Python 3.6+에서는 pathlib을 권장합니다. **os.path**는 문자열 기반으로 더 빠르고 하위 호환성이 좋지만, 가독성이 떨어집니다. 성능이 중요한 단순한 경로 조작에는 os.path를, 가독성과 유지보수성이 중요하면 pathlib을 사용하세요.
</details>

<details>
<summary><strong>Q: 대용량 JSON 파일을 메모리 효율적으로 읽으려면?</strong></summary>

`json.load()`는 파일 전체를 메모리에 로드하므로 대용량 파일에 부적합합니다. 대안: 1) **ijson** 라이브러리(스트리밍 JSON 파서), 2) **JSON Lines** 형식(각 줄이 하나의 JSON 객체), 3) **청크 단위 분할**, 4) `orjson` 같은 고성능 라이브러리. JSON Lines은 가장 간단한 방법으로, 각 줄을 `json.loads()`로 개별 파싱할 수 있습니다.
</details>

<details>
<summary><strong>Q: 임시 파일을 사용해야 하는 이유는 무엇인가요?</strong></summary>

임시 파일은 **이름 충돌 방지**, **보안**(예측 불가능한 파일명), **자동 정리**의 장점이 있습니다. 여러 프로세스가 동시에 임시 파일을 생성해도 충돌하지 않습니다. `tempfile` 모듈은 `/tmp/` 또는 `TEMP` 디렉토리에 안전하게 생성하며, with 블록 종료 시 자동으로 삭제됩니다. 보안이 중요한 경우 `mkstemp()`로 파일 디스크립터만 반환받아 사용할 수 있습니다.
</details>

---

## 요약

- **CSV**: C 확장 `_csv.reader`, DictReader/DictWriter, 사용자 정의 방언
- **JSON**: JSONEncoder/JSONDecoder 상속으로 커스텀 타입 처리, ensure_ascii=False
- **pickle**: 프로토콜 버전 0-5, **보안 위험** 주의, 신뢰할 수 있는 데이터만 load()
- **os**: os.walk() 디렉토리 탐색, os.makedirs() 중첩 디렉토리 생성
- **pathlib**: PurePath/Path 계층, / 연산자 오버로딩, 객체 지향 경로 조작
- **tempfile**: NamedTemporaryFile/TemporaryDirectory, with 문으로 자동 정리
