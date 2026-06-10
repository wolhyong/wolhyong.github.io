---
layout: post
title: "WebAssembly 모듈 구조 — 타입, 함수, 메모리, 테이블 섹션"
description: "WebAssembly 바이너리 모듈의 내부 구조를 학습합니다. WASM 파일을 구성하는 12개 섹션의 역할과 구조, 각 섹션이 어떻게 모듈의 로직과 메모리를 정의하는지 이해합니다."
date: 2021-12-27 10:00:00 +0900
category: webassembly
tags: [webassembly, wasm, module, sections, binary-format, leb128, magic-number]
level: beginner
---

> **💡 핵심 정리** ・ WASM 바이너리 파일은 **매직 넘버(0x00 0x61 0x73 0x6D = \"\\0asm\") + 버전(1) + 최대 12개 섹션**으로 구성됩니다. 섹션은 Type(함수 타입 정의), Function(함수 선언), Code(함수 구현), Memory(메모리 선언), Data(초기 데이터), Export(내보내기) 등으로 나뉩니다. Type → Function → Code는 **인덱스 체인**으로 연결되어 1:1 매칭됩니다.

## 학습 목표

- WASM 바이너리 모듈의 12개 섹션 구조를 이해한다
- 각 섹션(Type, Function, Code, Memory, Table 등)의 역할을 안다
- 섹션 간의 참조 관계(인덱스 연결)를 파악한다
- `wasm-objdump`로 실제 .wasm 파일의 섹션을 분석한다

## WASM 모듈 구조 — 12개 섹션의 개요

WASM 바이너리 파일은 **매직 넘버 + 버전 + 일련의 섹션**으로 구성됩니다:

```
┌──────────────────────────────────┐
│ Magic Number: 0x00 0x61 0x73 0x6D │  ← "\\0asm" (ASCII)
│ Version: 0x01 0x00 0x00 0x00     │  ← WASM 1.0
├──────────────────────────────────┤
│ Section 1: Type (ID=1)           │  ← 함수 타입 시그니처
│ Section 2: Import (ID=2)         │  ← 외부 의존성
│ Section 3: Function (ID=3)       │  ← 함수 선언 (타입 참조)
│ Section 4: Table (ID=4)          │  ← 함수 포인터 테이블
│ Section 5: Memory (ID=5)         │  ← 선형 메모리 선언
│ Section 6: Global (ID=6)         │  ← 전역 변수
│ Section 7: Export (ID=7)         │  ← 외부 노출
│ Section 8: Start (ID=8)          │  ← 초기화 함수
│ Section 9: Element (ID=9)        │  ← 테이블 초기화
│ Section 10: Code (ID=10)         │  ← 함수 구현 바디
│ Section 11: Data (ID=11)         │  ← 메모리 초기 데이터
│ Section 12: Custom (ID=0)        │  ← 디버깅/이름 정보
└──────────────────────────────────┘
```

> **이해를 돕는 비유:** WASM 모듈은 **건물 설계도**와 같습니다. 매직 넘버+버전은 건물의 식별 정보, Type 섹션은 "방의 유형 정의", Function 섹션은 "방의 개수와 위치", Code 섹션은 "각 방의 실제 인테리어 설계", Data 섹션은 "건물에 이미 배치된 가구", Memory 섹션은 "건물의 바닥 면적"에 비유할 수 있습니다.

### 섹션 개요표 — 한눈에 비교

| 섹션 | ID | 필수 여부 | 주요 내용 | 크기(일반적) |
|------|----|----------|----------|-------------|
| **Type** | 1 | ✅ 필수 | 함수 시그니처 목록 | ~10바이트 |
| **Import** | 2 | ❌ 선택 | 외부 의존성 선언 | 변동 |
| **Function** | 3 | ✅ 필수 | 함수 목록 (타입 인덱스) | ~4바이트/함수 |
| **Table** | 4 | ❌ 선택 | 함수 포인터 테이블 | 변동 |
| **Memory** | 5 | ❌ 선택 | 메모리 페이지 수 | ~5바이트 |
| **Global** | 6 | ❌ 선택 | 전역 변수 선언 | 변동 |
| **Export** | 7 | ❌ 선택 | 외부 노출 심볼 | ~10바이트/export |
| **Start** | 8 | ❌ 선택 | 초기화 함수 인덱스 | ~5바이트 |
| **Element** | 9 | ❌ 선택 | 테이블 초기값 | 변동 |
| **Code** | 10 | ✅ 필수 | 함수 바이트코드 | **가장 큼** (~90%) |
| **Data** | 11 | ❌ 선택 | 메모리 초기 데이터 | 변동 |
| **Custom** | 0 | ❌ 선택 | 이름, 디버깅 정보 | 변동 |

> **🤖 AI 용어 설명 — LEB128 (Little Endian Base 128) 인코딩:** WASM이 숫자를 저장할 때 사용하는 가변 길이 정수 인코딩 방식입니다. 작은 숫자는 1바이트, 큰 숫자는 최대 5바이트로 저장합니다. 예: 숫자 42는 1바이트(`0x2A`), 숫자 624485는 3바이트(`0xE5 0x8E 0x26`)로 저장됩니다. 이는 WASM 바이너리 크기를 최소화하는 핵심 기술입니다.

---

## Type Section (ID=1) — 함수의 설계도

모든 함수는 먼저 타입 시그니처를 Type 섹션에 등록합니다:

```wat
(type $add_func (func (param i32 i32) (result i32)))
(type $void_func (func))
```

**깊이 있는 설명 — 타입 인코딩:**
WASM은 각 숫자 타입에 고유 바이트를 할당합니다: `0x7F` = i32, `0x7E` = i64, `0x7D` = f32, `0x7C` = f64. 이 값들은 LEB128 인코딩으로 압축됩니다. `0x60`은 functype을 나타내는 고정 태그입니다.

```
바이너리 표현 예: (i32, i32) → i32
0x60                ;; functype 태그
0x02                ;; 파라미터 개수 = 2
0x7F 0x7F           ;; i32, i32
0x01                ;; 반환값 개수 = 1
0x7F                ;; i32
→ 총 6바이트
```

---

## Function Section (ID=3) — 함수의 명부

Function 섹션은 **함수의 타입만** 나열합니다:

```wat
(func $add (type 0) ...)
(func $square (type 0) ...)
```

인덱스 연결 구조:
```
Type[0] = (i32, i32) → i32        ← 타입 정의
Function 섹션: func[0] → Type[0] → Code[0]   ← 함수 0: 타입 0, 코드 0
                 func[1] → Type[0] → Code[1]   ← 함수 1: 타입 0, 코드 1
```

> **🤖 AI 용어 설명 — 인덱스 체인 (Index Chain):** WASM의 핵심 설계 패턴입니다. Type 섹션은 "어떤 signature의 함수가 있는지", Function 섹션은 "그 함수들 중 어떤 타입을 가졌는지", Code 섹션은 "그 함수의 실제 구현이 무엇인지"를 분리하여 저장합니다. 이 분리가 WASM의 **스트리밍 컴파일**을 가능하게 합니다. 브라우저는 Type 섹션만 읽고 메모리 레이아웃을 미리 결정할 수 있습니다.

---

## Memory Section (ID=5) — WASM의 작업 공간

```wat
(memory 1)           ;; 1페이지(64KB)
(memory 1 4)         ;; 최소 1, 최대 4페이지
```

**왜 메모리 페이지 크기가 64KB인가?** 이는 대부분의 OS 가상 메모리 페이지(4KB)의 16배로, TLB(Translation Lookaside Buffer) 효율을 최적화합니다. WASM이 단일 페이지로 64KB를 사용하면 CPU의 TLB 캐시를 더 효율적으로 활용할 수 있습니다.

---

## Code Section (ID=10) — 실제 실행 코드

실제 함수 바디가 저장되는 곳입니다. Function 섹션이 "이런 타입의 함수가 있다"를 선언한다면, Code 섹션은 "이 함수가 실제로 무엇을 하는지"를 담습니다.

```wat
;; Function 섹션: 함수 시그니처 선언
(type $add_func (func (param i32 i32) (result i32)))
(func $add (type 0))  ;; type 0 = $add_func

;; Code 섹션: 실제 구현
;; (별도로 저장됨)
```

**바이너리에서의 Code 섹션 구조:**
```
Code Section
├── Code[0]: 함수 $add
│   ├── body size (LEB128)        ← 3바이트 (LEB128)
│   ├── local count               ← 0 (로컬 변수 없음)
│   ├── bytecode (WASM 명령어)     ← local.get * 2 + i32.add
│   └── end (0x0B)                ← 함수 종료
└── Code[1]: 함수 $square
    ├── body size (LEB128)        ← LEB128
    ├── local count
    ├── bytecode
    └── end (0x0B)
```

**주의할 점:** Function 섹션과 Code 섹션은 인덱스로 1:1 매칭됩니다. Function[0]의 구현은 Code[0], Function[1]의 구현은 Code[1]입니다. 각 함수의 타입은 Type 섹션에서 찾습니다.

---

## Data Section (ID=11) — 미리 채워진 데이터

정적 데이터를 메모리에 초기화합니다:

```wat
(data (i32.const 0) "Hello, WASM!")  ;; 주소 0부터 데이터 복사
(data (i32.const 1024) "World")      ;; 주소 1024부터 데이터 복사
```

**바이너리에서 Data 섹션의 구조:**
```
Data Section
├── Data[0]
│   ├── memory index (0x00 = memory 0)
│   ├── offset expression (i32.const 0, end)
│   ├── data size (LEB128)
│   └── raw bytes ("Hello, WASM!")
└── Data[1]
    ├── memory index (0x00)
    ├── offset expression (i32.const 1024, end)
    ├── data size (LEB128)
    └── raw bytes ("World")
```

**코드 분석 — offset expression이란?**
단순한 상수뿐 아니라 `global.get` 같은 명령어도 사용할 수 있습니다:
```wat
(data (global.get $base_ptr) "dynamic data")
```
단, offset expression은 `i32.const`나 `global.get` 같은 **제한된 명령어만** 사용 가능합니다. 이는 모듈 인스턴스화 시점에 반드시 결정되어야 하기 때문입니다.

---

## 섹션 간 연결 구조 — 실전 인덱스 체인 분석

실제 WAT 코드가 바이너리에서 어떻게 연결되는지 추적해보겠습니다.

```wat
(module
  (type $int_func (func (param i32) (result i32)))
  (func $double (type $int_func)
    local.get 0
    i32.const 2
    i32.mul)
  (export "double" (func $double))
)
```

이 모듈을 `wat2wasm`으로 컴파일하면 생성되는 섹션 연결:

```
Type[0] = (i32) → i32           ← $int_func 시그니처
    ↑
Function[0] → Type[0]           ← $double의 타입 (sig=0)
    ↑
Code[0] = [local.get 0,         ← $double의 구현 바디 (7바이트)
          i32.const 2,
          i32.mul, end]
    ↑
Export["double"] → Function[0]  ← 외부에 "double"로 노출
```

**의미:**
1. Export 섹션에서 `"double"`이라는 이름으로 Function 인덱스 0을 export
2. Function[0]은 Type[0]의 시그니처를 가짐 → `(i32) → i32`
3. Code[0]이 Function[0]의 실제 구현 → `local.get 0; i32.const 2; i32.mul`

이 인덱스 체인이 WASM의 **모듈 구조 전체를 지탱**합니다. 각 섹션은 독립적이지만 인덱스로 서로를 참조하여 하나의 완전한 모듈을 구성합니다.

### 바이너리 크기 분석

| 섹션 | double.wasm에서 차지하는 크기 | 전체 비율 |
|------|----------------------------|----------|
| 매직 넘버 + 버전 | 8바이트 | 13% |
| Type | 6바이트 | 10% |
| Function | 2바이트 | 3% |
| Export | 7바이트 | 11% |
| Code | 9바이트 (size=7 + locals + end) | **30%** |
| Custom(name) | 19바이트 | **33%** |
| **총합** | **~60바이트** | 100% |

---

## 실습 — wasm-objdump로 섹션 확인하기

WABT 도구의 `wasm-objdump`를 사용하면 실제 .wasm 파일의 섹션 구조를 볼 수 있습니다:

```bash
# 위 $double 모듈을 컴파일
wat2wasm double.wat -o double.wasm

# 섹션 정보 출력
wasm-objdump -x double.wasm

# 출력 예시:
#
# double.wasm:  file format wasm 0x1
#
# Section Details:
#
# Type[1]:
#  - type[0] (i32) -> i32
# Function[1]:
#  - func[0] sig=0
# Export[1]:
#  - func[0] <"double">
# Code[1]:
#  - func[0] size=7 locals=0
# Custom:
#  - name: "name"
```

**출력 분석:**
- `Type[1]`: Type 섹션에 1개 타입 등록
- `Function[1]`: Function 섹션에 1개 함수, `sig=0`은 Type[0] 참조
- `Export[1]`: "double" 이름으로 func[0] export
- `Code[1]`: `size=7` — 함수 바디가 7바이트 (매우 작음!)
- `Custom: name`: 선택적 이름 섹션 (디버깅용)

> **AI가 자주 질문하는 패턴:**
> - "WASM 바이너리에서 가장 큰 섹션은?" → Code 섹션 (전체의 90% 차지)
> - "매직 넘버 0x00 0x61 0x73 0x6D는 무슨 의미인가?" → "\\0asm" = null-terminated "asm" 문자열
> - "섹션 순서가 중요한 이유는?" → 스트리밍 컴파일을 위해 Type을 먼저 읽고, Code를 나중에 읽음
> - "LEB128 인코딩이란?" → 가변 길이 정수 압축 방식, 작은 수를 1바이트로 저장

---

## 자주 묻는 질문 — AI 검색 엔진이 자주 노출하는 질문들

**모든 섹션이 필수인가요?**
아닙니다. Type, Function, Code 섹션만 있으면 최소 모듈이 동작합니다. Import, Export, Memory, Data 등은 필요에 따라 추가합니다.

| 섹션 구성 | 예시 | 용도 |
|-----------|------|------|
| Type + Function + Code만 | `add.wasm` | 순수 계산 함수 |
| + Memory + Data | 문자열 처리 | 정적 데이터 필요 |
| + Import + Export | JS와 상호작용 | 웹 API 호출 |
| + Table + Element | 콜백/함수 포인터 | 고급 패턴 |

**섹션 순서가 중요한가요?**
엄격합니다. Type → Import → Function → Table → Memory → Global → Export → Start → Element → Code → Data 순서여야 합니다. 순서가 틀리면 WASM 검증기가 모듈을 거부하고 오류를 반환합니다.

---

## 요약 — WASM 모듈 구조 핵심

- WASM 모듈은 **12개 섹션 + 매직 넘버 + 버전**으로 구성됩니다
- 각 섹션은 **고유 ID**로 식별되며, 엄격한 순서로 배치됩니다
- Type → Function → Code 섹션은 **인덱스 체인**으로 연결됩니다 (함수의 타입-선언-구현 분리)
- Memory는 **64KB 페이지** 단위로 할당됩니다 (TLB 최적화)
- 가장 큰 섹션은 Code (전체의 ~90%), 가장 작은 섹션은 Function (~3%)
- **LEB128** 인코딩으로 숫자를 가변 길이로 저장하여 바이너리 크기 최소화
