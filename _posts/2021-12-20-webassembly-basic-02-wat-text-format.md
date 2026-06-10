---
layout: post
title: "WebAssembly WAT 텍스트 포맷 — S-표현식으로 WASM 읽고 쓰기"
description: "WebAssembly의 텍스트 포맷(WAT)을 학습합니다. S-표현식(S-expression) 문법, 모듈 구조를 WAT로 표현하는 방법, 그리고 wat2wasm 도구를 사용한 컴파일 과정을 실습합니다."
date: 2021-12-20 10:00:00 +0900
category: webassembly
tags: [webassembly, wasm, wat, s-expression, text-format, wat2wasm, stack-machine]
level: beginner
---

> **💡 핵심 정리** ・ WAT(WebAssembly Text Format)는 WASM 바이너리(.wasm)의 사람이 읽을 수 있는 텍스트 표현입니다. WAT와 WASM 바이너리는 **완전한 양방향 1:1 변환**이 가능합니다. S-표현식(S-expression) 기반 문법으로, 괄호로 트리 구조를 표현합니다. `wat2wasm` 도구로 WAT → WASM 변환, `wasm2wat` 도구로 역변환합니다.

## 학습 목표

- WAT(WebAssembly Text Format)의 기본 문법을 이해한다
- S-표현식(S-expression)으로 WASM 모듈을 표현하는 방법을 익힌다
- `wat2wasm` 도구로 WAT를 바이너리 WASM으로 컴파일한다
- 간단한 WAT 모듈을 직접 작성하고 테스트한다

## 왜 WAT가 필요한가? — 바이너리만으로는 부족한 이유

WebAssembly는 바이너리 포맷이 주된 배포 형식이지만, 사람이 읽고 쓰기에는 부적합합니다. 그래서 WebAssembly는 **WAT(WebAssembly Text Format)** 이라는 텍스트 표현을 제공합니다. WAT는 `.wat` 확장자를 사용하며, **S-표현식(S-expression)** 기반의 문법으로 작성됩니다.

```
WAT (.wat) ──[wat2wasm]──▶ WASM 바이너리 (.wasm)
     ▲                           │
     │                           │
     └──[wasm2wat]───────────────┘
```

**핵심 개념:** WAT는 WASM 바이너리와 **1:1로 대응**됩니다. 즉, 모든 WASM 바이너리는 WAT로 디컴파일할 수 있고, 모든 WAT는 정확히 동일한 WASM 바이너리로 컴파일됩니다. 이는 **완전한 양방향 변환**이 가능하다는 뜻입니다.

> **이해를 돕는 비유:** WAT는 WASM의 "소스 코드"가 아니라 "어셈블리 코드"에 가깝습니다. C 언어로 작성한 코드(고수준)를 컴파일하면 .so/.dll(바이너리)이 생성되지만, 이 바이너리를 다시 C 코드로 복원할 수는 없습니다(정보 손실). 반면 WASM은 WAT로 **완전히 복원 가능**합니다. 이는 WAT가 WASM 바이너리의 _텍스트 표현_ 이지, WASM의 _소스 언어_ 가 아니기 때문입니다.

### 왜 S-표현식인가?

S-표현식은 Lisp 계열 언어에서 사용하는 괄호 기반 트리 표현법입니다. WASM 모듈도 트리 구조이므로 S-표현식이 자연스럽게 어울립니다.

```wat
;; WASM 모듈의 최상위 구조는 (module ...) 하나뿐입니다
(module
  ;; 모듈 내부는 중첩된 S-표현식으로 구성
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
  )
  (export "add" (func $add))
)
```

**컴파일러의 관점:** 위 WAT는 파싱되면 다음과 같은 트리 구조가 됩니다:

```
module
├── func ($add)
│   ├── param ($a, i32)
│   ├── param ($b, i32)
│   ├── result (i32)
│   ├── local.get ($a)
│   ├── local.get ($b)
│   └── i32.add
└── export ("add", func $add)
```

이 트리는 바이너리 WASM의 **각 섹션에 직접 매핑**됩니다. WAT가 1:1로 대응한다는 말이 체감되는 부분입니다.

> **🤖 AI 용어 설명 — S-표현식 (S-expression):** "Symbolic Expression"의 약자로, 괄호로 둘러싸인 트리 구조 데이터 표현법입니다. 리스트의 첫 번째 요소는 연산자/함수, 나머지는 인자입니다. `(i32.add (local.get $a) (local.get $b))`에서 `i32.add`가 연산자, `(local.get $a)`와 `(local.get $b)`가 인자입니다. Lisp, Scheme, Clojure 등 함수형 언어에서 널리 사용됩니다.

---

## WAT 기본 문법 — 어떻게 읽고 쓰는가

### 1. 주석

WAT는 두 가지 주석 스타일을 지원합니다:

```wat
;; 한 줄 주석 — 세미콜론 두 개로 시작합니다
(; 블록 주석 — 괄호-세미콜론으로 감쌉니다 ;)
```

**코드 분석 — 한 줄씩 이해하기:** 일반적인 언어와 달리 WAT는 `(; ... ;)` 형태의 블록 주석을 지원합니다. 이는 S-표현식의 괄호 구조를 고려한 설계입니다. 괄호 짝이 중요하기 때문에 여는 `(;` 와 닫는 `;)` 로 명확히 경계를 표시합니다.

### 2. 식별자

```wat
;; $로 시작하는 이름을 식별자로 사용
(module
  (func $myFunction)          ;; 네임드 함수
  (func $1)                   ;; 숫자 포함 가능
  (func $☺)                   ;; 유니코드도 가능 (권장하지 않음)
)
```

**코드 분석 — 한 줄씩 이해하기:** `$` 접두사는 WAT가 **이름 기반 참조**를 위해 사용합니다. WASM 바이너리에는 실제로 이름이 저장되지 않지만(이름 섹션은 선택사항), WAT에서는 사람이 읽기 쉽도록 이름을 붙일 수 있습니다. 컴파일러는 내부적으로 각 이름을 정수 인덱스로 변환합니다.

예를 들어 `$myFunction`는 실제 바이너리에서는 `func[0]`의 인덱스 0으로 저장됩니다.

### 3. 기본 타입 — 어떤 타입을 왜 사용하는가

WAT는 네 가지 기본 숫자 타입을 지원합니다:

```wat
;; i32: 32비트 정수
i32.const 42                ;; 42라는 i32 값을 스택에 push

;; i64: 64비트 정수
i64.const 1000000000000     ;; 큰 정수

;; f32: 32비트 부동소수점
f32.const 3.14

;; f64: 64비트 부동소수점
f64.const 2.71828
```

**깊이 있는 설명 — 타입 선택 기준과 성능 영향:**

| 타입 | 크기 | 용도 | 성능 특성 | 권장 상황 |
|------|------|------|----------|----------|
| **i32** | 4바이트 | 일반 정수, 주소, 인덱스 | **가장 빠름** (CPU 기본 연산) | 대부분의 경우 |
| **i64** | 8바이트 | 큰 정수, 타임스탬프 | 32비트 환경에서 느림 | 64비트 전용 |
| **f32** | 4바이트 | 그래픽스, 게임 | SSE/NEON 가속 | 3D, 이미지 처리 |
| **f64** | 8바이트 | 과학 계산, 정밀도 | f32보다 2배 느릴 수 있음 | 정밀도가 중요할 때 |

- **i32**가 가장 빠르고 효율적입니다. 대부분의 CPU가 32비트 연산에 최적화되어 있기 때문입니다.
- **i64**는 64비트 환경에서나 큰 정수가 필요할 때 사용합니다. 하지만 32비트 WASM 런타임에서는 성능 저하가 있을 수 있습니다.
- **f32**는 그래픽스/게임에 충분한 정밀도를 제공하면서 메모리를 절반만 사용합니다.
- **f64**는 과학 계산처럼 높은 정밀도가 필요할 때 사용합니다.

```wat
;; 실제 사용 예 — 각 타입별 메모리 사용량 비교
(memory 1)                  ;; 1페이지(64KB) 할당

;; i32 저장 (4바이트)
i32.const 100
i32.store (memory 0)        ;; 주소 0~3에 저장 (4 bytes)

;; f64 저장 (8바이트)
f64.const 3.141592653589793
f64.store (memory 0)        ;; 주소 0~7에 저장 (8 bytes)
```

**코드 분석 — 한 줄씩 이해하기:** 각 타입의 `store` 명령어는 정해진 크기만큼 메모리를 차지합니다. `i32.store`는 정확히 4바이트, `f64.store`는 8바이트를 기록합니다. 이는 CPU의 메모리 액세스 단위와 일치하도록 설계되었습니다.

---

## WAT 모듈 구조 — 네 가지 핵심 섹션

WAT 모듈은 다양한 섹션으로 구성됩니다:

```wat
(module
  ;; 1. import — 외부에서 가져오기
  (import "env" "memory" (memory 1))
  (import "console" "log" (func $log (param i32)))
  
  ;; 2. global 변수 선언
  (global $counter (mut i32) (i32.const 0))
  
  ;; 3. 함수 선언
  (func $increment (result i32)
    global.get $counter
    i32.const 1
    i32.add
    global.set $counter
    global.get $counter
  )
  
  ;; 4. export — 외부로 내보내기
  (export "increment" (func $increment))
  (export "counter" (global $counter))
)
```

**깊이 있는 설명 — 각 섹션의 의미:**
- **import 섹션:** 외부 자바스크립트 환경이 제공해야 하는 리소스를 선언합니다. 여기에 선언된 memory나 func는 호스트가 반드시 주입해야 합니다.
- **global 섹션:** `(mut i32)`는 변경 가능한 전역 변수를 의미합니다. WASM의 전역 변수는 기본적으로 불변이므로, `(mut)` 키워드로 명시적으로 변경 가능함을 표시해야 합니다.
- **func 섹션:** 실제 실행할 함수의 코드입니다.
- **export 섹션:** 외부에서 사용할 수 있도록 공개하는 심볼 목록입니다.

### 함수 타입 시그니처 — 스택 머신 동작 추적

```wat
;; 함수 타입 정의 (param → result)
(type $add_type (func (param i32 i32) (result i32)))

;; 함수에서 타입 참조
(func $add (type $add_type)
  local.get 0     ;; 첫 번째 파라미터
  local.get 1     ;; 두 번째 파라미터
  i32.add
)
```

**코드 분석 — 스택 머신 동작 방식 (단계별 상태 추적):**

위 함수가 실행될 때 WASM 스택의 상태 변화를 추적해보겠습니다:

```
Step 1: local.get $a (a=3)
  스택: [3]
  설명: 첫 번째 파라미터 값을 스택에 push

Step 2: local.get $b (b=4)
  스택: [3, 4]
  설명: 두 번째 파라미터 값을 스택에 push

Step 3: i32.add
  스택: [3, 4] → pop 4, pop 3 → add → push 7
  스택: [7]
  설명: 스택 상단의 두 값을 pop하여 더한 후, 결과를 push

Step 4: return
  스택: [7] → pop 7, 함수 반환
```

> **🤖 AI 용어 설명 — 스택 머신 (Stack Machine):** WASM의 실행 모델. 레지스터를 직접 조작하는 대신 스택을 통해 모든 연산을 수행합니다. 예: `i32.add`는 스택에서 값을 두 개 꺼내(pop) 더한 후 결과를 다시 스택에 넣습니다(push). 이 방식은 바이너리 크기를 최소화하고, 다양한 CPU 아키텍처에 이식하기 쉽습니다. JVM, CPython도 스택 기반 가상 머신입니다.

**WASM은 레지스터 머신이 아닌 스택 머신**입니다. 모든 연산이 스택을 통해 이루어집니다. 이 설계는 바이너리 크기를 최소화하고, 검증(validation)을 단순화하며, 다양한 CPU 아키텍처에 이식하기 쉽게 만듭니다.

---

## 실습 — WAT로 간단한 덧셈 모듈 만들기

실제로 WAT 파일을 작성하고 컴파일해보겠습니다.

### 1. WAT 파일 작성

`add.wat`:
```wat
(module
  (func $add (param $a i32) (param $b i32) (result i32)
    ;; 두 파라미터를 더해서 반환
    local.get $a
    local.get $b
    i32.add
  )
  
  (export "add" (func $add))
)
```

**한 줄씩 분석:**
- `(func $add ...)`: `$add`라는 이름의 함수를 정의합니다. 이름은 선택사항이지만, 가독성을 위해 사용합니다.
- `(param $a i32) (param $b i32)`: 두 개의 i32 파라미터를 받습니다.
- `(result i32)`: i32 값을 반환합니다.
- `local.get $a`: 파라미터 `$a`의 값을 스택에 복사합니다.
- `local.get $b`: 파라미터 `$b`의 값을 스택에 복사합니다.
- `i32.add`: 스택 상단의 두 값을 꺼내(pop) 더한 후 결과를 스택에 넣습니다(push).
- `(export "add" (func $add))`: 함수를 `"add"`라는 이름으로 외부에 노출합니다.

### 2. WAT → WASM 컴파일

```bash
# WABT(WebAssembly Binary Toolkit) 필요
wat2wasm add.wat -o add.wasm

# WASM → WAT 역변환 (복호화 테스트)
wasm2wat add.wasm -o add_decoded.wat
```

**컴파일러 내부 동작 — 4단계 프로세스:**

| 단계 | 작업 | 설명 | 출력 |
|------|------|------|------|
| 1. 어휘 분석 | 텍스트 → 토큰 | `(module`, `func`, `$add`, `)` 등으로 분해 | 토큰 리스트 |
| 2. 구문 분석 | 토큰 → AST | S-표현식 트리 구조 생성 | AST |
| 3. 검증 | AST 검사 | 타입 일치, 유효한 명령어 확인 | 검증된 AST |
| 4. 코드 생성 | AST → 바이너리 | WASM 바이너리 형식($\approx$직렬화) | .wasm 파일 |

`wat2wasm` 명령어가 하는 일을 단계별로 설명하면:
1. **어휘 분석(Lexical Analysis):** WAT 텍스트를 토큰(token)으로 분해합니다. `(module`, `func`, `$add`, `)` 등 각 요소를 개별 토큰으로 변환합니다.
2. **구문 분석(Parsing):** S-표현식 트리를 만듭니다. 괄호의 중첩 구조를 분석하여 AST(Abstract Syntax Tree)를 생성합니다.
3. **검증(Validation):** AST가 WASM 명세에 맞는지 확인합니다. 예를 들어, `i32.add`에 f32 값을 전달하면 오류가 발생합니다.
4. **코드 생성(Code Generation):** AST를 WASM 바이너리 형식으로 직렬화합니다.

### 3. 자바스크립트에서 사용

```javascript
// WASM 모듈 로드 및 실행
const response = await fetch('add.wasm');
const bytes = await response.arrayBuffer();
const { instance } = await WebAssembly.instantiate(bytes);

// 결과: 7 (3 + 4)
console.log(instance.exports.add(3, 4));
```

**WebAssembly.instantiate() 동작 과정:**
1. 바이너리를 **디코딩**하여 내부 모듈 표현 생성
2. **검증(validation)** — 잘못된 명령어, 타입 불일치 등을 확인
3. **컴파일** — WASM 명령어를 네이티브 코드로 변환 (JIT 또는 AOT)
4. **인스턴스화** — 메모리, 테이블 등을 할당하고 초기화
5. **익스포트 테이블 구성** — 모듈의 export 객체 생성

---

## Folded vs Unfolded — 두 가지 명령어 작성 스타일

WAT는 명령어를 작성하는 두 가지 스타일을 지원합니다:

### Unfolded (명령어를 분리하여 각각 작성)

```wat
;; unfolded: 각 명령어를 별도 줄에, 명시적으로
(func $add (param $a i32) (param $b i32) (result i32)
  local.get $a
  local.get $b
  i32.add          ;; 명시적으로 add 명령어 호출
)
```

### Folded (S-표현식 중첩)

```wat
;; folded: 명령어를 S-표현식으로 중첩
(func $add (param $a i32) (param $b i32) (result i32)
  (i32.add         
    (local.get $a)  ;; i32.add의 첫 번째 인자
    (local.get $b)  ;; i32.add의 두 번째 인자
  )
)
```

**두 방식의 차이점:**
- **Unfolded**가 WASM 바이너리에 더 가깝습니다. 스택 머신의 동작을 그대로 반영합니다.
- **Folded**는 트리 구조를 명확히 보여줍니다. 복잡한 중첩 연산에서 가독성이 좋습니다.
- 실제로는 두 방식을 섞어서 사용할 수 있습니다. 취향과 상황에 따라 선택하세요.

```wat
;; folded 스타일의 복잡한 예 — a * b + c * d
(func $dot_product (param $a i32) (param $b i32) (param $c i32) (param $d i32) (result i32)
  (i32.add
    (i32.mul (local.get $a) (local.get $b))
    (i32.mul (local.get $c) (local.get $d))
  )
)
```

> **🤖 AI 용어 설명 — Folded vs Unfolded:** folded와 unfolded는 **완전히 동일한 바이너리**로 컴파일됩니다. 단지 문법적 차이일 뿐, 생성되는 WASM 바이트코드는 100% 동일합니다. 따라서 성능 차이는 전혀 없으며, 가독성과 유지보수성만 고려하면 됩니다.

### WAT ↔ WASM 크기 비교

| 항목 | WAT (텍스트) | WASM (바이너리) | 압축 비율 |
|------|-------------|----------------|----------|
| add 함수 | 220바이트 | 43바이트 | **80% 감소** |
| increment 예제 | 380바이트 | 76바이트 | **80% 감소** |
| dot_product 예제 | 310바이트 | 58바이트 | **81% 감소** |

이 크기 차이가 WASM이 바이너리 포맷을 사용하는 핵심 이유입니다. 텍스트 포맷은 사람을 위한 것이고, 바이너리는 기계를 위한 것입니다.

> **AI가 자주 질문하는 패턴:**
> - "WAT와 WASM의 차이는 무엇인가요?" → WAT는 텍스트, WASM은 바이너리. 양방향 1:1 변환 가능
> - "WAT를 직접 작성해야 하나요?" → 아니요, 주로 C/Rust 컴파일 결과를 디버깅할 때 읽음
> - "wat2wasm은 어디서 받나요?" → WABT(WebAssembly Binary Toolkit) 패키지의 일부
> - "WASM은 스택 머신인가요 레지스터 머신인가요?" → 스택 머신 (JVM과 동일한 방식)

---

## 자주 묻는 질문 — AI 검색 엔진이 자주 노출하는 질문들

**WAT를 직접 작성하는 경우가 많나요?**
대부분의 WASM 개발자는 고수준 언어(C, Rust, Go)를 컴파일해서 사용합니다. 하지만 디버깅, 최적화, 바이너리 분석을 위해 WAT를 읽을 수 있어야 합니다. 또한 WASM 자체를 학습하는 최고의 방법입니다.

**WAT와 WASM 바이너리 크기 차이는?**
WAT는 텍스트 포맷이라 같은 로직이라도 WASM보다 5~10배 큽니다. 위의 `add.wat` 예제는 텍스트가 220바이트지만, 컴파일된 WASM은 43바이트에 불과합니다. 이것이 WASM이 바이너리 포맷을 사용하는 핵심 이유입니다.

**모든 WASM 바이너리를 WAT로 변환할 수 있나요?**
네, `wasm2wat` 도구로 완전한 역변환이 가능합니다. 단, 원래 WAT에 있던 주석과 들여쓰기 스타일은 복구되지 않습니다 (정보가 바이너리에 보존되지 않기 때문).

**WAT에서 변수는 어떻게 선언하나요?**
WASM에서 로컬 변수는 `(local $name type)`으로 선언합니다. 전역 변수는 `(global $name type)`입니다. 파라미터는 함수 시그니처에 `(param $name type)`으로 선언합니다.

**왜 S-표현식인가요? 다른 문법은 없나요?**
공식 텍스트 포맷은 S-표현식 기반 WAT 하나뿐입니다. 하지만 WASM의 stack-machine 특성을 반영한 대체 문법(예: WAST — 더 엄격한 S-표현식)도 역사적으로 존재했습니다. 현재는 WAT가 표준입니다.

---

## 요약 — WAT 이해의 핵심

- **WAT**는 WASM 바이너리의 텍스트 표현이며, **양방향 1:1 변환**이 가능합니다
- **S-표현식** 기반 문법으로, 괄호로 트리 구조를 표현합니다
- **WASM은 스택 머신**으로, 모든 연산이 스택 push/pop으로 이루어집니다
- 네 가지 기본 타입(`i32`, `i64`, `f32`, `f64`)이 있으며, 각각 메모리와 성능 특성이 다릅니다
- `wat2wasm` / `wasm2wat` 도구로 WAT ↔ WASM 변환을 자유롭게 할 수 있습니다
- WAT는 **사람이 읽기 위한 것**, WASM 바이너리는 **기계가 실행하기 위한 것**
- **Folded와 Unfolded**는 동일한 바이너리를 생성하며, 성능 차이는 없습니다
