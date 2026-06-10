---
layout: post
title: "WebAssembly 중급(09) — 테이블(Tables)과 함수 포인터(Function Pointers)"
description: "WebAssembly 테이블과 간접 함수 호출 — call_indirect 동작 원리, 함수 포인터 테이블 구조, C++ 가상 함수와의 연관성, 동적 함수 디스패치, 성능 측정"
date: 2022-02-07 10:00:00 +0900
category: webassembly
tags: [webassembly, tables, function-pointers, call-indirect, dynamic-dispatch, virtual-functions, table-get, table-set, anyfunc]
level: intermediate
---

> **💡 한 줄 요약:** WebAssembly의 `call_indirect`는 함수 포인터 테이블을 통해 간접 호출을 구현하며, C++의 가상 함수 테이블(vtable)과 동일한 원리로 동작합니다. 테이블 기반 호출은 직접 호출보다 약 2.7배 느리지만(6.5ns vs 2.4ns), 다형성(Polymorphism)을 가능하게 합니다.

## 함수 포인터가 WASM에서 중요한 이유

C/C++/Rust 같은 시스템 프로그래밍 언어는 **함수 포인터(Function Pointer)** 와 **가상 함수(Virtual Function)** 를 광범위하게 사용합니다. WebAssembly는 이러한 간접 호출(Indirect Call)을 지원하기 위해 **테이블(Tables)** 이라는 특별한 구조를 제공합니다.

테이블은 함수 포인터의 배열로, WASM이 컴파일타임이 아닌 **런타임에 호출할 함수를 결정**할 수 있게 해줍니다.

---

## 수업 목표

- WebAssembly 테이블의 개념과 선언 방법 이해
- `call_indirect` 명령어의 동작 원리 이해
- C++ 가상 함수 테이블(vtable)과 WASM 테이블의 연관성 파악
- 동적 함수 디스패치의 성능 특성 이해
- `table.set`/`table.get`을 활용한 런타임 함수 교체 습득

---

## 1. 테이블의 기본 개념

테이블은 **`anyfunc`**(모든 함수 시그니처를 담을 수 있는 참조) 타입의 요소로 구성된 배열입니다.

```wat
;; WAT — 테이블 선언
(module
  ;; 10개 요소 테이블, 최대 20개
  (table 10 20 funcref)
  
  ;; 두 개의 함수
  (func $add (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add
  )
  
  (func $sub (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.sub
  )
  
  ;; 테이블 초기화: 0번 슬롯에 $add, 1번 슬롯에 $sub 배치
  (elem (i32.const 0) func $add $sub)
)
```

### 테이블의 메모리 구조

```
테이블 [0]: func $add (i32, i32) → i32    ← 0번 슬롯
테이블 [1]: func $sub (i32, i32) → i32    ← 1번 슬롯
테이블 [2]: null                          ← 2~9번 슬롯 (초기화 안 됨)
테이블 [3]: null
   ...
테이블 [9]: null
```

> **🔬 깊이 있는 설명 — 테이블이 메모리가 아닌 별도 공간에 저장되는 이유:** WASM의 설계에서 테이블은 **메모리(Memory)와 분리된 별도 구조**입니다. 이는 보안상의 이유입니다. 함수 포인터를 메모리에 저장하면, 메모리 버그(버퍼 오버플로우 등)로 함수 포인터가 손상되거나 악의적인 코드로 교체될 수 있습니다. 테이블은 WASM 가상 머신이 직접 관리하므로, 메모리 버그가 있어도 테이블의 내용이 손상되지 않습니다.

---

### 1.2 call_indirect 명령어

`call_indirect`는 테이블의 특정 인덱스에 있는 함수를 호출합니다.

```wat
;; WAT — 간접 호출
(module
  (table 2 funcref)
  (elem (i32.const 0) func $add $sub)
  
  (func $add (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add
  )
  
  (func $sub (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.sub
  )
  
  ;; 테이블 인덱스로 함수 호출
  (func (export "calc") (param $a i32) (param $b i32) (param $op i32) (result i32)
    ;; $op가 0이면 add, 1이면 sub
    local.get $a
    local.get $b
    local.get $op
    ;; 스택: [a, b, op] → $op가 테이블 인덱스로 사용됨
    call_indirect (type (func (param i32 i32) (result i32)))
  )
)
```

```javascript
// JavaScript — 간접 호출
const calc = instance.exports.calc;
console.log(calc(10, 5, 0));  // 15 (add)
console.log(calc(10, 5, 1));  // 5  (sub)
```

#### 호출 방식별 성능 비교

| 호출 방식 | 예시 | 속도 | 오버헤드 원인 |
|----------|------|------|-------------|
| **직접 호출** | `call $add` | 2.4ns (기준) | 없음 (컴파일타임에 주소 결정) |
| **간접 호출 (call_indirect)** | 테이블[인덱스] 호출 | 6.5ns (2.7x) | 테이블 조회 + 타입 검증 + 경계 검사 |
| **JS → WASM 호출** | `exports.add()` | 12.5ns (5.2x) | 컨텍스트 전환 + 타입 변환 |
| **WASM → JS 호출** | import 콜백 | 6.5ns (2.7x) | 컨텍스트 전환 |

> **⚠️ call_indirect의 안전성 검증:** `call_indirect`는 호출 전에 3가지 검증을 수행합니다: (1) 인덱스가 테이블 범위 내에 있는지, (2) 해당 슬롯에 함수가 있는지(null이 아닌지), (3) 함수의 시그니처(파라미터 타입/개수, 반환 타입)가 호출하려는 타입과 일치하는지. 이 중 하나라도 실패하면 **트랩(Trap)**이 발생합니다. 이 검증이 간접 호출의 안전성을 보장하지만, 2.7배 속도 저하의 원인이기도 합니다.

---

## 2. C++ 가상 함수와의 연관성

C++ 컴파일러는 가상 함수를 구현하기 위해 **vtable(가상 함수 테이블)**을 생성합니다. WASM의 테이블은 이 vtable과 동일한 역할을 합니다.

### C++ 가상 함수의 WASM 변환

```cpp
// C++ 가상 함수
class Shape {
public:
    virtual double area() = 0;  // 순수 가상 함수
    virtual ~Shape() = default;
};

class Circle : public Shape {
    double radius;
public:
    Circle(double r) : radius(r) {}
    double area() override { return 3.14159 * radius * radius; }
};

class Square : public Shape {
    double side;
public:
    Square(double s) : side(s) {}
    double area() override { return side * side; }
};

// 다형적 호출
void printArea(Shape* shape) {
    std::cout << shape->area();  // 간접 호출!
}
```

C++ 컴파일러(Emscripten)가 위 코드를 WASM으로 컴파일하면 다음과 같은 구조가 생성됩니다:

```wat
;; C++ vtable이 변환된 WASM 테이블
(table 4 funcref)

;; vtable 슬롯 매핑
;; 0: Circle.area()
;; 1: Circle.~Circle()
;; 2: Square.area()
;; 3: Square.~Square()

(elem (i32.const 0) func $Circle_area $Circle_dtor $Square_area $Square_dtor)
```

```javascript
// JavaScript에서의 다형적 호출
const memory = new Uint8Array(instance.exports.memory.buffer);

// Circle 객체 (메모리 시작: 0x1000)
// [0x1000]: vtable 포인터 (Circle → 슬롯 0)
memory[0x1000] = 0;  // vtable index for Circle

// Square 객체 (메모리 시작: 0x2000)
memory[0x2000] = 2;  // vtable index for Square

// printArea(shape): shape의 vtable을 통해 area() 호출
function printArea(shapePtr) {
    const vtableIndex = memory[shapePtr];  // vtable 인덱스 읽기
    const result = instance.exports.call_virtual(vtableIndex, shapePtr);
    console.log(`Area: ${result}`);
}
```

> **🔬 깊이 있는 설명 — C++ 가상 함수의 내부 동작:** C++ 객체가 가상 함수를 가지면, 객체의 첫 8바이트(64비트)는 **vtable 포인터(vptr)**를 가리킵니다. 이 포인터는 해당 클래스의 가상 함수 테이블을 가리킵니다. `shape->area()` 호출은 다음과 같이 변환됩니다: (1) `shape` 포인터에서 vptr 읽기, (2) vtable에서 area()의 오프셋 찾기, (3) 함수 포인터로 간접 호출. WASM에서 이 과정은 `call_indirect`와 테이블 인덱스로 동일하게 구현됩니다. C++의 vtable이 WASM의 table로, 간접 호출이 `call_indirect`로 매핑되는 것입니다.

---

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: call_indirect가 직접 호출보다 2.7배 느린 이유는 무엇인가요?</strong></summary>
`call_indirect`는 세 가지 추가 검증을 수행하기 때문입니다: (1) 테이블 인덱스가 유효한 범위(0 ~ 테이블 크기-1) 내에 있는지 확인, (2) 해당 슬롯에 null이 아닌 함수 참조가 있는지 확인, (3) 함수의 시그니처(타입)가 호출 시 기대한 타입과 일치하는지 검증. 이 검증들은 CPU 분기 예측에 악영향을 주어 파이프라인 스톨을 유발합니다. 하지만 현대 WASM 엔진(V8의 Liftoff)은 이러한 검증을 최적화하여 초기 버전 대비 약 40% 개선되었습니다.
</details>

<details>
<summary><strong>Q: WASM에서 함수 포인터 배열을 동적으로 수정할 수 있나요?</strong></summary>
네, `table.set` 명령어로 런타임에 테이블 슬롯을 변경할 수 있습니다. 예를 들어 플러그인 시스템에서 새로운 기능을 동적으로 로드하여 테이블에 추가할 수 있습니다. JavaScript에서도 `instance.exports.__table_base`를 통해 간접적으로 테이블을 조작할 수 있습니다. 이는 동적 코드 로딩과 플러그인 아키텍처의 기초가 됩니다.
</details>

<details>
<summary><strong>Q: C++ 소멸자와 WASM 테이블은 어떤 관계인가요?</strong></summary>
C++의 가상 소멸자도 vtable을 통해 호출됩니다. Emscripten으로 컴파일하면 각 클래스의 소멸자가 WASM 테이블의 별도 슬롯에 배치됩니다. `delete shape` 호출은 테이블에서 해당 소멸자 함수를 찾아 `call_indirect`로 실행합니다. 이 과정에서 메모리 해제(operator delete)도 함께 수행됩니다.
</details>

---

## 3. 고급 테이블 조작

### 3.1 런타임 함수 교체

WASM 모듈이 로드된 후에도 `table.set`으로 테이블 슬롯을 동적으로 교체할 수 있습니다.

```wat
;; WAT — 런타임 함수 교체
(module
  (table 4 funcref)
  (elem (i32.const 0) func $op1 $op2)
  
  (func $op1 (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add
  )
  
  (func $op2 (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.mul
  )
  
  ;; 새로운 함수 (나중에 추가)
  (func $op3 (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.sub
  )
  
  ;; 테이블 슬롯 교체 (런타임에 $op3를 2번 슬롯에 설정)
  (func (export "setOp3")
    i32.const 2
    ref.func $op3
    table.set
  )
  
  ;; 간접 호출 실행
  (func (export "compute") (param $a i32) (param $b i32) (param $idx i32) (result i32)
    local.get $a
    local.get $b
    local.get $idx
    call_indirect (type (func (param i32 i32) (result i32)))
  )
)
```

```javascript
// JavaScript — 런타임에 함수 교체
const { compute, setOp3, memory } = instance.exports;

console.log(compute(10, 5, 0));  // 15 (add)
console.log(compute(10, 5, 1));  // 50 (mul)

// 런타임에 새로운 함수 등록
setOp3();
console.log(compute(10, 5, 2));  // 5 (sub)
```

#### 동적 함수 교체의 활용 사례

| 활용 사례 | 설명 | 테이블 크기 | 교체 빈도 |
|----------|------|-----------|---------|
| **플러그인 시스템** | 런타임에 플러그인 함수 로드 | 가변 | 낮음 (설치 시) |
| **A/B 테스팅** | 두 가지 알고리즘 동시 운영 | 고정 (2) | 중간 (실험 전환) |
| **핫 패치** | 버그 수정을 런타임에 적용 | 고정 | 매우 낮음 |
| **조건부 최적화** | 입력 특성에 따라 알고리즘 선택 | 고정 | 높음 (호출마다) |
| **머신러닝 모델 선택** | 입력 유형별 추론 엔진 선택 | 가변 | 중간 |

---

### 실전 노하우 — 함수 포인터 최적화 5계명

1. **직접 호출 우선**: 가능하면 `call_indirect` 대신 직접 `call` 사용 (2.7배 빠름)
2. **테이블 인라인화**: 자주 사용되는 간접 호출은 Devirtualization으로 직접 호출로 변환
3. **테이블 크기 제한**: 테이블이 클수록 타입 검증 비용 증가 → 필요한 만큼만 유지
4. **null 슬롯 방지**: 사용하지 않는 슬롯은 null로 두지 말고 기본 함수로 채우기
5. **C++ 가상 함수 주의**: 성능이 중요한 루프에서는 가상 함수 대신 `std::variant` + `std::visit` 사용

---

## 요약 — 테이블과 함수 포인터 핵심 포인트

- **테이블(Tables)**: `anyfunc` 타입의 배열로 함수 포인터 저장. WASM 가상 머신이 직접 관리 (메모리와 분리)
- **call_indirect**: 테이블 인덱스로 함수 호출. 직접 호출보다 2.7배 느리지만 안전성 보장 (3중 검증)
- **C++ vtable 매핑**: C++ 가상 함수의 vtable이 WASM 테이블로, `shape->area()`가 `call_indirect`로 변환
- **동적 교체**: `table.set`으로 런타임에 함수 포인터 변경 가능. 플러그인 시스템의 기초
- **성능 원칙**: 직접 호출 우선, Devirtualization 활용, 테이블 크기 최소화
- **실전 응용**: 플러그인 시스템, A/B 테스팅, 핫 패치, 조건부 최적화

**다음 강의 예고:** 중급 10강에서는 **도구 체인 심화(Toolchains)** — Emscripten, wasm-pack, LLVM wasm-ld, Binaryen, WABT, 실제 프로젝트 설정과 최적화를 다룹니다.
