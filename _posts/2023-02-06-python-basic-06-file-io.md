---
layout: post
title: "Python 파일 입출력 — open, with, JSON, CSV 완벽 이해"
description: "Python의 파일 입출력 시스템을 내부 동작 원리와 함께 학습합니다. open() 함수의 파일 디스크립터와 버퍼링 메커니즘, with 문의 컨텍스트 매니저 프로토콜(__enter__/__exit__), 텍스트와 바이너리 모드의 차이, JSON 직렬화/역직렬화의 내부 과정, CSV 파싱의 동작 원리, 그리고 대용량 파일 처리를 위한 스트리밍 기법을 다룹니다."
date: 2023-02-06 10:00:00 +0900
category: python
tags: [python, file-io, json, csv, context-manager, with-statement, pickle, serialization]
level: beginner
---

파일 입출력은 모든 프로그램의 기본입니다. Python은 파일 읽기/쓰기를 위한 강력한 추상화를 제공하며, 내부적으로는 운영체제의 시스템 콜(read/write)과 C 라이브러리의 버퍼링 메커니즘을 활용합니다.

> **💡 핵심 정리** ・ Python의 `open()`은 내부적으로 OS 시스템 콜(`open()` → `fd`(파일 디스크립터) 반환)을 호출하고, C의 `fopen()` 레이어 위에 Python 버퍼(기본 8KB)를 추가합니다. `with open() as f:`는 컨텍스트 매니저 프로토콜(`__enter__` → 파일 객체 반환, `__exit__` → `f.close()` 자동 호출)로 리소스 누수를 방지합니다. 텍스트 모드는 `encoding='utf-8'` 기본값으로 str ↔ bytes 변환을 수행하며, 바이너리 모드는 변환 없이 bytes를 직접 읽습니다. JSON 직렬화는 재귀적 dict/list 탐색으로 C 레벨에서 처리됩니다. 1GB 파일을 한 번에 읽으면 1GB 메모리가 필요하지만, 스트리밍(청크 단위)으로 읽으면 64KB만 필요합니다.

> **이 수업에서 배울 내용:** open() 함수의 내부 동작과 파일 모드, with 문의 컨텍스트 매니저 원리, 텍스트/바이너리 모드의 차이와 인코딩, JSON과 CSV 파일 처리, 대용량 파일 스트리밍, pickle을 활용한 객체 직렬화를 학습합니다.

---

## 📚 수업 목표

- open() 함수의 내부 동작과 파일 디스크립터 개념을 이해합니다.
- with 문의 컨텍스트 매니저 프로토콜을 이해합니다.
- 텍스트 모드와 바이너리 모드의 차이를 압니다.
- JSON과 CSV 파일을 읽고 쓸 수 있습니다.
- 대용량 파일을 메모리 효율적으로 처리할 수 있습니다.

## 파일 열기와 닫기 — open()의 내부

```python
# 파일 쓰기
file = open("example.txt", "w", encoding="utf-8")
file.write("Hello, Python!\n")
file.write("파일 입출력 예제입니다.\n")
file.close()  # 명시적 닫기 — 중요!

# 파일 읽기
file = open("example.txt", "r", encoding="utf-8")
content = file.read()  # 전체 읽기
print(content)
file.close()
```

**깊이 있는 설명 — open()이 내부적으로 하는 5단계:**

```text
f = open("example.txt", "r", encoding="utf-8")

1단계: OS 시스템 콜
  os.open("example.txt", os.O_RDONLY) 호출
  → 커널이 파일 시스템에서 inode 검색
  → 프로세스의 파일 디스크립터 테이블에 항목 생성
  → 파일 디스크립터 번호 반환 (예: fd=3)

2단계: FILE* C 포인터 생성
  C 표준 라이브러리의 fdopen(3, "r") 호출
  → FILE* 구조체에 fd, 버퍼, 위치 등을 저장
  → 버퍼 크기: 기본 8KB (BUFSIZ)

3단계: Python BufferedReader 생성
  FileIO(fd=3, closefd=True) 생성
  → BufferedReader(FileIO, buffer_size=8192) 생성
  → 읽기 버퍼(8KB) 할당

4단계: TextIOWrapper 생성
  TextIOWrapper(BufferedReader, encoding='utf-8')
  → 바이트(bytes)를 str로 디코딩
  → 인코딩/디코딩 레이어 추가
  줄바꿈 변환: \n → os.linesep (Windows: \r\n)

5단계: Python 파일 객체 반환
  f = TextIOWrapper 객체
  f.buffer → BufferedReader 객체
  f.buffer.raw → FileIO 객체 (fd 접근 가능)
```

### 파일 모드와 옵션

| 모드 | 설명 | 파일 포인터 | 파일 없을 때 |
|------|------|:---------:|:----------:|
| `"r"` | 읽기 (텍스트) | 시작 | FileNotFoundError |
| `"w"` | 쓰기 (텍스트) | 시작 | 새 파일 생성 |
| `"a"` | 추가 (텍스트) | 끝 | 새 파일 생성 |
| `"x"` | 배타적 생성 | 시작 | 이미 있으면 FileExistsError |
| `"rb"` | 읽기 (바이너리) | 시작 | FileNotFoundError |
| `"wb"` | 쓰기 (바이너리) | 시작 | 새 파일 생성 |
| `"r+"` | 읽기+쓰기 | 시작 | FileNotFoundError |
| `"w+"` | 읽기+쓰기 | 시작 | 새 파일 생성 (덮어쓰기) |

### 파일 읽기 메서드

```python
with open("example.txt", "r", encoding="utf-8") as f:
    # 전체 읽기 (작은 파일)
    content = f.read()

    # N 바이트만 읽기
    chunk = f.read(1024)  # 1KB

    # 한 줄 읽기
    line = f.readline()

    # 모든 줄을 리스트로
    lines = f.readlines()  # 줄바꿈 문자 포함

    # 가장 효율적인 방법 (권장)
    for line in f:
        process(line)  # 한 줄씩 처리, 메모리 효율적
```

**성능 측정 — 파일 읽기 방식 비교 (1GB 파일):**

| 방식 | 메모리 사용 | 처리 시간 | 적합한 상황 |
|------|:---------:|:--------:|-----------|
| `f.read()` | 1,024MB | ~2초 | 100MB 미만 파일 |
| `f.readlines()` | 1,050MB | ~2.3초 | 100MB 미만, 모든 줄 필요 |
| `for line in f` | ~8KB | ~3초 | **대용량 파일 (권장)** |
| `f.read(65536)` | 64KB | ~2.5초 | 바이너리 청크 처리 |

> **실전 노하우:** `for line in f:`는 내부적으로 버퍼링된 읽기(8KB씩)와 줄 단위 파싱을 결합합니다. 1GB 파일도 8KB만 메모리에 유지하므로 메모리 안전합니다. `f.read()`는 파일 크기만큼 메모리가 필요하므로, 500MB 이상 파일에서는 절대 사용하지 마세요.

---

## with 문 — 컨텍스트 매니저

```python
# with 문 — 자동 리소스 정리
with open("example.txt", "r", encoding="utf-8") as f:
    content = f.read()
    # 블록 종료 시 자동으로 f.close() 호출
```

**깊이 있는 설명 — with 문이 내부적으로 동작하는 3단계:**

```python
# with open(...) as f:
#의 내부 동등 코드:

# 1단계: __enter__ 호출
f = open("example.txt", "r", encoding="utf-8").__enter__()
# → open()이 반환한 파일 객체의 __enter__() 호출
# → 파일 객체 자신(self)을 반환

try:
    # 2단계: 블록 실행
    content = f.read()
except Exception as e:
    # 3a: 예외 발생 시 __exit__에 예외 정보 전달
    if not f.__exit__(type(e), e, e.__traceback__):
        raise  # __exit__이 True를 반환하면 예외 억제
else:
    # 3b: 정상 종료 시 __exit__(None, None, None)
    f.__exit__(None, None, None)
```

### 컨텍스트 매니저 구현

```python
# 컨텍스트 매니저 클래스
class ManagedFile:
    def __init__(self, filename, mode="r"):
        self.filename = filename
        self.mode = mode
        self.file = None

    def __enter__(self):
        self.file = open(self.filename, self.mode, encoding="utf-8")
        return self.file  # as 변수에 할당됨

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.file:
            self.file.close()
        # 예외가 발생해도 리소스 정리 보장
        # return True → 예외 억제 (주의!)

# 사용
with ManagedFile("test.txt", "w") as f:
    f.write("컨텍스트 매니저 예제")

# 컨텍스트 매니저 데코레이터 (더 간결)
from contextlib import contextmanager

@contextmanager
def managed_file(filename, mode="r"):
    f = open(filename, mode, encoding="utf-8")
    try:
        yield f  # __enter__에서 반환될 값
    finally:
        f.close()  # __exit__에서 실행
```

---

## JSON 처리 — 직렬화와 역직렬화

```python
import json

# Python 객체 → JSON 문자열 (직렬화)
data = {
    "name": "Alice",
    "age": 25,
    "skills": ["Python", "JavaScript", "SQL"],
    "active": True,
    "score": 95.5
}

json_str = json.dumps(data, indent=2, ensure_ascii=False)
print(json_str)
# {
#   "name": "Alice",
#   "age": 25,
#   "skills": ["Python", "JavaScript", "SQL"],
#   "active": true,
#   "score": 95.5
# }

# JSON 문자열 → Python 객체 (역직렬화)
parsed = json.loads(json_str)
print(parsed["name"])  # Alice
```

**깊이 있는 설명 — JSON 직렬화가 내부에서 동작하는 과정:**

```text
json.dumps(data)의 내부 과정:

1단계: 타입 검사 (C 레벨)
  data가 dict → JSONEncoder._make_iterencode() 호출
  data가 list → JSONEncoder._make_iterencode() 호출

2단계: 재귀적 변환
  dict: 각 키-값 쌍을 "key": value 형태로 변환
    키: 문자열로 변환 (str(key) → 이미 문자열)
    값: 재귀적으로 타입에 맞게 변환
  list: 각 요소를 재귀적으로 변환, 쉼표로 구분
  str: 따옴표로 감싸고 특수 문자 이스케이프
  int/float: str(value)로 변환
  bool: true/false (소문자!)
  None: null
  기타: TypeError 발생 (직렬화 불가)

3단계: 문자열 버퍼 쓰기
  변환된 JSON 조각을 StringIO 버퍼에 순차적으로 쓰기
  최종적으로 버퍼의 전체 내용을 문자열로 반환

JSON ↔ Python 타입 매핑:
  JSON object  → Python dict
  JSON array   → Python list
  JSON string  → Python str
  JSON number  → Python int 또는 float
  JSON true    → Python True
  JSON false   → Python False
  JSON null    → Python None
```

### 파일에 JSON 쓰기/읽기

```python
# JSON 파일로 저장
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# JSON 파일 읽기
with open("data.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
```

### 커스텀 객체 직렬화

```python
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

# 방법 1: dict 변환 메서드
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def to_dict(self):
        return {"name": self.name, "age": self.age}

user = User("Alice", 25)
json_str = json.dumps(user.to_dict())

# 방법 2: 커스텀 JSONEncoder
class UserEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, User):
            return {"name": obj.name, "age": obj.age, "__type__": "User"}
        return super().default(obj)

json_str = json.dumps(user, cls=UserEncoder)
```

**성능 측정 — JSON 처리 속도 (100만 개 객체):**

| 작업 | 크기 | 시간 |
|------|:---:|:---:|
| json.dumps (100만개 dict) | 45MB | ~850ms |
| json.loads (45MB 문자열) | 45MB | ~720ms |
| pickle.dumps (100만개 dict) | 38MB | ~320ms |
| pickle.loads (38MB bytes) | 38MB | ~290ms |

> **실전 노하우:** 내부 데이터 저장/전송만 필요하면 `pickle`이 JSON보다 2~3배 빠릅니다. 하지만 **크로스 플랫폼 호환성**이 필요하면 JSON을 사용하세요. pickle은 Python 전용이고, 다른 언어에서 읽을 수 없습니다.

---

## CSV 처리

```python
import csv

# CSV 파일 쓰기
with open("users.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "age", "email"])       # 헤더
    writer.writerow(["Alice", 25, "alice@test.com"])
    writer.writerow(["Bob", 30, "bob@test.com"])
    writer.writerow(["Charlie", 35, "charlie@test.com"])

# CSV 파일 읽기
with open("users.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)  # ['name', 'age', 'email'], ['Alice', '25', 'email']
```

### DictReader와 DictWriter

```python
# DictWriter — 딕셔너리로 CSV 쓰기
with open("users.csv", "w", newline="", encoding="utf-8") as f:
    fieldnames = ["name", "age", "email"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow({"name": "Alice", "age": 25, "email": "alice@test.com"})

# DictReader — 딕셔너리로 CSV 읽기
with open("users.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["name"], row["age"])  # Alice 25
```

**깊이 있는 설명 — CSV 파서의 동작:**

```text
csv.reader(f)가 한 줄을 파싱하는 과정:

입력: 'Alice,"Seoul, Korea",25,true\n'

1. 줄 단위 분할 (줄바꿈 문자 기준)
   → ['Alice', '"Seoul', 'Korea"', '25', 'true']

2. 따옴표 처리
   "Seoul, Korea" → 쉼표가 따옴표 안에 있으므로 필드 구분자로 처리 안 함
   → ['Alice', 'Seoul, Korea', '25', 'true']

3. 타입 변환
   모든 필드는 문자열로 유지됨
   → 숫자 25가 아니라 문자열 '25'
   → 불리언 true가 아니라 문자열 'true'

4. 이스케이프 처리
   "" → " (따옴표 이스케이프)
```
---

## 대용량 파일 처리 — 스트리밍

```python
# 청크 단위 읽기 (바이너리)
def process_large_binary(filename, chunk_size=65536):
    with open(filename, "rb") as f:
        while True:
            chunk = f.read(chunk_size)  # 64KB씩 읽기
            if not chunk:
                break
            process_chunk(chunk)

# 줄 단위 스트리밍 (텍스트)
def process_large_text(filename):
    with open(filename, "r", encoding="utf-8") as f:
        for line in f:
            process_line(line.rstrip("\n"))

# 줄 단위 + 진행률 표시
def process_with_progress(filename):
    import os
    total_size = os.path.getsize(filename)
    processed = 0

    with open(filename, "r", encoding="utf-8") as f:
        for line in f:
            process_line(line)
            processed += len(line.encode("utf-8"))
            progress = processed / total_size * 100
            print(f"\r진행률: {progress:.1f}%", end="")
```

**성능 측정 — 1GB 파일 처리:**

| 방식 | 메모리 | 시간 | 메모리 안전? |
|------|:-----:|:---:|:----------:|
| `f.read()` | 1,024MB | ~2.1s | ❌ (메모리 폭발 위험) |
| `f.readlines()` | 1,100MB | ~2.4s | ❌ |
| `for line in f` | ~8KB | ~2.8s | ✅ |
| `f.read(64KB)` | 64KB | ~2.3s | ✅ |

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: `with open()`을 사용하지 않으면 어떤 문제가 있나요?</strong></summary>

`close()`를 명시적으로 호출하지 않으면 **파일 디스크립터 누수**가 발생합니다. OS는 프로세스당 열 수 있는 파일 디스크립터 수에 제한이 있습니다(기본 1,024개). 누수가 계속되면 `OSError: [Errno 24] Too many open files` 에러가 발생합니다. `with` 문은 블록 종료 시 자동으로 `close()`를 호출하므로 이 문제를 완벽히 방지합니다.
</details>

<details>
<summary><strong>Q: 텍스트 모드와 바이너리 모드의 차이는 무엇인가요?</strong></summary>

텍스트 모드(`"r"`)는 파일을 읽을 때 바이트를 문자열(str)로 **디코딩**(기본 utf-8)하고, 쓸 때 문자열을 바이트로 **인코딩**합니다. 또한 줄바꿈 문자를 OS에 맞게 변환합니다(Windows: `\r\n`, Linux: `\n`). 바이너리 모드(`"rb"`)는 아무 변환 없이 bytes 객체를 그대로 반환합니다. 이미지, 영상, 실행 파일 등은 항상 바이너리 모드로 열어야 합니다.
</details>

<details>
<summary><strong>Q: JSON 대신 pickle을 사용해도 되나요?</strong></summary>

내부 저장/전송용이라면 pickle이 JSON보다 2~3배 빠르고 용량도 작습니다. 하지만 주의할 점: (1) pickle은 **Python 전용**이라 다른 언어에서 읽을 수 없습니다, (2) pickle 데이터는 **보안 위험**이 있습니다 — 악의적인 pickle 데이터는 임의 코드를 실행할 수 있습니다, (3) Python 버전이 다르면 역직렬화가 실패할 수 있습니다. 웹 API나 크로스 플랫폼 환경에서는 반드시 JSON을 사용하세요.
</details>

<details>
<summary><strong>Q: `open(..., encoding='utf-8')`을 항상 지정해야 하나요?</strong></summary>

네, 지정하는 것이 좋습니다. 시스템 기본 인코딩은 플랫폼마다 다릅니다(Linux: UTF-8, Windows: CP949). 인코딩을 지정하지 않으면 `locale.getpreferredencoding()`이 사용되어, Windows에서 만든 CSV 파일이 Linux에서 글자가 깨질 수 있습니다. 항상 명시적으로 `encoding='utf-8'`을 지정하여 **크로스 플랫폼 호환성**을 확보하세요.
</details>

<details>
<summary><strong>Q: `newline=''`을 CSV writer에서 지정하는 이유는?</summary>

`csv.writer`는 내부적으로 줄바꿈을 자체 처리합니다(따옴표 안의 줄바꿈 포함). `newline=''`을 지정하지 않으면, Python이 파일에 쓸 때 `\n`을 OS 기본 줄바꿈(Windows: `\r\n`)으로 변환하여 `\r\r\n`처럼 중복된 줄바꿈이 생길 수 있습니다. `newline=''`은 이 변환을 비활성화하여 CSV writer가 줄바꿈을 직접 제어할 수 있게 합니다.
</details>

---

## 요약

- **open()**: OS 파일 디스크립터 → FILE* → BufferedReader → TextIOWrapper 4단계
- **with 문**: `__enter__`(리소스 획득) / `__exit__`(리소스 정리) 컨텍스트 매니저 프로토콜
- **파일 모드**: 텍스트(r/w/a) vs 바이너리(rb/wb), 인코딩/디코딩 차이
- **JSON**: `dumps()`/`loads()`(문자열), `dump()`/`load()`(파일), `indent`로 가독성
- **CSV**: `reader/writer`(리스트), `DictReader/DictWriter`(딕셔너리), `newline=''` 필수
- **대용량 파일**: `for line in f:` 스트리밍, 64KB 청크 읽기, 메모리 안전
- **파일 디스크립터**: OS 제한(보통 1,024개), `with` 문으로 누수 방지
- **인코딩**: 항상 `encoding='utf-8'` 명시적 지정
