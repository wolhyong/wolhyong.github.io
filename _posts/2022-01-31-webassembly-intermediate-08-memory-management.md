---
layout: post
title: "WebAssembly 중급(08) — 메모리 관리 심화: 선형 메모리와 사용자 정의 할당자"
description: "WebAssembly 메모리 관리 심화 — 선형 메모리 구조와 페이지 테이블, Custom Allocator 구현(bump/malloc/free), 메모리 풀 패턴, Grow 동작 원리, 메모리 프로파일링과 최적화, 성능 측정"
date: 2022-01-31 10:00:00 +0900
category: webassembly
tags: [webassembly, memory, allocator, linear-memory, memory-pool, page-table, malloc, free, memory-profiling, grow]
level: intermediate
---

> **💡 한 줄 요약:** WebAssembly의 선형 메모리는 64KB 페이지 단위로 관리되며, 사용자 정의 할당자(Bump Allocator, Free List Allocator)를 직접 구현하지 않으면 메모리 파편화와 비효율적인 Grow 호출로 성능이 저하됩니다. Rust의 `alloc` 크레이트를 사용하면 C의 `malloc`과 유사한 수준의 메모리 관리가 가능합니다.

## WebAssembly의 메모리 모델 이해하기

WebAssembly의 메모리는 JavaScript의 힙과 완전히 분리된 **선형 메모리(Linear Memory)** 라는 단순한 모델을 사용합니다. 이는 연속된 바이트 배열로, JavaScript의 `ArrayBuffer`와 유사하지만 WASM 가상 머신이 직접 관리합니다.

### 선형 메모리가 연속된 배열인 이유

전통적인 운영체제는 가상 메모리를 통해 물리적으로 흩어진 메모리를 연속된 주소 공간처럼 보이게 합니다. WebAssembly도 유사한 접근을 취하지만, 훨씬 단순화했습니다:

- WASM의 모든 메모리 접근은 **단일 연속 배열**에 대해 이루어집니다
- 페이지 테이블이나 TLB(Translation Lookaside Buffer) 같은 복잡한 MMU 하드웨어가 필요 없습니다
- 브라우저는 WASM 메모리를 실제 물리 메모리(또는 가상 메모리)에 매핑하기만 하면 됩니다
- 결과적으로 메모리 접근 속도가 **매우 예측 가능하고 빠릅니다**

---

## 수업 목표

- WebAssembly 선형 메모리의 페이지 기반 구조 이해
- Custom Allocator(Bump, Free List) 구현 방법 습득
- `memory.grow`의 동작 방식과 비용 이해
- 메모리 프로파일링과 누수 탐지 방법 학습
- Rust의 `alloc` 크레이트를 활용한 고수준 메모리 관리 이해

---

## 1. 선형 메모리의 구조

### 1.1 페이지 시스템

WASM 메모리는 **페이지(Page)** 단위로 관리됩니다. 1페이지 = 64KB(65,536바이트)입니다.

```wat
;; WAT — 메모리 선언
(module
  ;; 초기 1페이지 (64KB), 최대 4페이지 (256KB)
  (memory 1 4)
)
```

#### 페이지 단위 메모리 구성

```
메모리 주소: 0x00000 ┌────────────────────────────┐
                     │     Page 0 (64KB)          │  ← 초기 할당
                     │  [0x00000 ~ 0x0FFFF]       │
                     ├────────────────────────────┤
                     │     Page 1 (64KB)          │  ← 필요시 grow
                     │  [0x10000 ~ 0x1FFFF]       │
                     ├────────────────────────────┤
                     │     Page 2 (64KB)          │  ← 필요시 grow
                     │  [0x20000 ~ 0x2FFFF]       │
                     ├────────────────────────────┤
                     │     Page 3 (64KB)          │  ← 최대 크기
                     │  [0x30000 ~ 0x3FFFF]       │
             0x40000 └────────────────────────────┘
```

> **🔬 깊이 있는 설명 — memory.grow의 내부 동작:** `memory.grow(n)`이 호출되면 브라우저는 현재 메모리 끝에 n페이지(64KB × n)를 추가로 할당합니다. 이 과정은 단순히 새 메모리를 할당하고, 기존 메모리 내용을 복사한 후, 기존 `ArrayBuffer`를 **detach**합니다. 이 때문에 `memory.grow` 호출 후에는 이전에 생성한 모든 TypedArray가 유효하지 않게 됩니다. Grow 호출 비용은 **약 5~10μs**로 비교적 저렴하지만, 자주 호출하면 누적 비용이 커집니다. 따라서 초기에 충분한 메모리를 할당하는 것이 성능에 유리합니다.

### 1.2 메모리 접근 명령어

```wat
;; WAT — 다양한 메모리 접근 패턴
(module
  (memory 1)
  
  ;; 1. i32 저장
  (func (export "store_i32") (param $addr i32) (param $val i32)
    local.get $addr
    local.get $val
    i32.store
  )
  
  ;; 2. i32 로드
  (func (export "load_i32") (param $addr i32) (result i32)
    local.get $addr
    i32.load
  )
  
  ;; 3. 오프셋을 포함한 접근 (구조체 필드 접근에 유용)
  (func (export "store_with_offset") (param $base i32) (param $val i32)
    local.get $base
    i32.const 8       ;; offset 8바이트
    i32.add
    local.get $val
    i32.store
  )
  
  ;; 4. 부호 없는 바이트 저장/로드
  (func (export "store_byte") (param $addr i32) (param $val i32)
    local.get $addr
    local.get $val
    i32.store8         ;; 하위 1바이트만 저장
  )
)
```

| 명령어 | 설명 | 바이트 수 | 정렬 요구사항 |
|-------|------|----------|-------------|
| `i32.load` | 4바이트 부호 있는 정수 로드 | 4 | 4바이트 정렬 |
| `i32.store` | 4바이트 정수 저장 | 4 | 4바이트 정렬 |
| `i32.load8_s` | 1바이트 부호 있는 정수 로드 | 1 | 없음 |
| `i32.load8_u` | 1바이트 부호 없는 정수 로드 | 1 | 없음 |
| `i32.load16_s` | 2바이트 부호 있는 정수 로드 | 2 | 2바이트 정렬 |
| `i64.load` | 8바이트 정수 로드 | 8 | 8바이트 정렬 |
| `f32.load` | 4바이트 실수 로드 | 4 | 4바이트 정렬 |
| `f64.load` | 8바이트 실수 로드 | 8 | 8바이트 정렬 |

> **⚠️ 정렬(Aliasing) 주의사항:** WASM에서 정렬되지 않은 메모리 접근은 **트랩(Trap)**을 발생시켜 프로그램이 즉시 중단됩니다. C/C++ 컴파일러는 자동으로 정렬을 맞추지만, 수동으로 WAT 코드를 작성할 때는 정렬 요구사항을 반드시 지켜야 합니다. 예를 들어, 주소가 4의 배수가 아닌 위치에서 `i32.load`를 실행하면 트랩이 발생합니다.

---

## 2. 사용자 정의 할당자(Custom Allocator)

WASM은 내장 `malloc`/`free`가 없습니다. C/Rust의 표준 라이브러리가 의존하는 시스템 콜도 없습니다. 따라서 메모리가 필요하면 직접 할당자를 구현하거나 언어 런타임이 제공하는 할당자를 사용해야 합니다.

### 2.1 Bump Allocator (범프 할당자)

가장 단순한 할당자입니다. 메모리 포인터를 계속 앞으로 밀어가며 할당합니다.

```wat
;; WAT — Bump Allocator
(module
  (memory 1)
  
  ;; 힙 시작 위치 (페이지 0의 1024바이트 이후)
  (global $heap_start i32 (i32.const 1024))
  ;; 다음 할당 위치
  (global $next_free (mut i32) (i32.const 1024))
  
  ;; 할당: 원하는 크기를 전달받아 할당된 주소 반환
  (func (export "malloc") (param $size i32) (result i32)
    (local $addr i32)
    
    ;; 현재 위치 저장
    global.get $next_free
    local.set $addr
    
    ;; 다음 위치 = 현재 위치 + 크기
    global.get $next_free
    local.get $size
    i32.add
    global.set $next_free
    
    local.get $addr
  )
  
  ;; 해제: Bump Allocator는 실제 해제를 하지 않음
  ;; (필요시 포인터를 초기화)
  (func (export "reset")
    global.get $heap_start
    global.set $next_free
  )
)
```

```javascript
// JavaScript — Bump Allocator 사용
const { malloc, reset, memory } = instance.exports;

// 100바이트 할당
const addr1 = malloc(100);
// 추가 200바이트 할당
const addr2 = malloc(200);

// 메모리에 데이터 쓰기
const view = new Uint8Array(memory.buffer);
view[addr1] = 42;
view[addr1 + 1] = 255;

// 모든 메모리 초기화 (해제와 동일)
reset();
```

#### Bump Allocator의 장단점

| 특성 | 평가 | 설명 |
|------|------|------|
| **속도** | ⚡ 매우 빠름 | 할당 = 포인터 증가 단 한 번의 연산 (약 2ns) |
| **구현 복잡도** | 🟢 매우 낮음 | 코드 5줄이면 완성 |
| **메모리 효율** | 🔴 낮음 | 해제 후 재사용 불가, 전체 리셋만 가능 |
| **파편화** | 🟢 없음 | 연속 할당이므로 파편화 발생 안 함 |
| **적합한 사용처** | — | 게임 루프(프레임 단위 할당/해제), 컴파일러의 임시 버퍼 |

> **🔬 깊이 있는 설명 — Bump Allocator가 실제로 유용한 이유:** Bump Allocator는 "할당은 빠르게, 해제는 한 번에"라는 패턴에 최적화되어 있습니다. 게임 개발에서는 매 프레임마다 수많은 임시 객체가 생성되고 프레임 끝에서 모두 폐기됩니다. 이때 Bump Allocator를 사용하면 개별 `free` 호출 없이 `reset()` 한 번으로 모든 메모리를 회수할 수 있습니다. 실제로 많은 게임 엔진(Unity, Unreal Engine)이 프레임 할당자로 Bump Allocator 변형을 사용합니다.

---

### 2.2 Free List Allocator (자유 리스트 할당자)

실제 `malloc`/`free`처럼 동작하는 할당자입니다. 해제된 메모리 블록을 연결 리스트로 관리하여 재사용합니다.

```wat
;; WAT — 간단한 Free List Allocator
(module
  (memory 1)
  
  ;; 메모리 레이아웃:
  ;; [0-1023]: 시스템 영역 (할당자 메타데이터)
  ;; [1024-]: 힙 영역 (사용자 할당)
  
  (global $heap_start i32 (i32.const 1024))
  (global $heap_end i32 (i32.const 65536))  ;; 1페이지 끝
  (global $free_head (mut i32) (i32.const 0))
  
  ;; 초기화: 하나의 큰 자유 블록 생성
  (func (export "init")
    i32.const 1024          ;; 블록 주소 = 힙 시작
    i32.const 64512         ;; 블록 크기 = 64KB - 1024
    i32.store               ;; 블록 크기 저장
    i32.const 0
    i32.const 1024
    i32.const 4
    i32.add
    i32.store               ;; 다음 블록 = null (0)
    i32.const 1024
    global.set $free_head
  )
  
  ;; 할당
  (func (export "malloc") (param $size i32) (result i32)
    (local $prev i32)
    (local $curr i32)
    (local $next i32)
    (local $remaining i32)
    
    global.get $free_head
    local.set $curr
    i32.const 0
    local.set $prev
    
    block $found
    loop $search
      local.get $curr
      i32.eqz
      br_if $found          ;; 자유 블록 없음 → 0 반환
      
      local.get $curr
      i32.load              ;; 현재 블록의 크기
      local.get $size
      i32.ge_u              ;; 충분히 큰가?
      br_if $found
      
      local.get $curr        ;; 다음 블록으로 이동
      local.set $prev
      local.get $curr
      i32.const 4
      i32.add
      i32.load              ;; 다음 블록 포인터
      local.set $curr
      br $search
    end
    end
    
    local.get $curr
    i32.eqz
    if
      i32.const 0
      return                ;; 할당 실패
    end
    
    ;; 블록 분할 (남은 공간이 16바이트 이상이면 분할)
    local.get $curr
    i32.load
    local.get $size
    i32.sub
    local.tee $remaining
    i32.const 16
    i32.ge_u
    if
      ;; 남은 블록을 자유 리스트에 추가
      local.get $curr
      local.get $size
      i32.add
      local.set $next
      
      local.get $next
      local.get $remaining
      i32.const 8
      i32.sub               ;; 메타데이터(크기+다음) 공간 확보
      i32.store
      
      local.get $curr
      i32.const 4
      i32.add
      i32.load
      local.get $next
      i32.const 4
      i32.add
      i32.store
      
      ;; 현재 블록 크기 조정
      local.get $curr
      local.get $size
      i32.store
    end
    
    local.get $curr
    i32.const 8
    i32.add                  ;; 메타데이터 이후의 주소 반환
  )
  
  ;; 해제
  (func (export "free") (param $ptr i32)
    (local $block i32)
    
    local.get $ptr
    i32.const 8
    i32.sub                   ;; 메타데이터 위치로 이동
    local.set $block
    
    ;; 자유 리스트의 헤드에 추가
    local.get $block
    global.get $free_head
    i32.const 4
    i32.add
    i32.store                 ;; 다음 = 기존 헤드
    
    local.get $block
    global.set $free_head     ;; 헤드 = 이 블록
  )
)
```

#### 할당자 성능 비교

| 할당자 유형 | 할당 속도 | 해제 속도 | 메모리 오버헤드 | 파편화 | 구현 복잡도 |
|------------|----------|----------|---------------|-------|-----------|
| **Bump** | 2ns (최고) | 1ns (전체 리셋) | 0% | 없음 | ⭐ |
| **Free List** | 50~500ns | 50ns | 8~16바이트/블록 | 중간 | ⭐⭐⭐ |
| **Buddy System** | 100ns | 100ns | 4~8바이트/블록 | 낮음 | ⭐⭐⭐⭐ |
| **Slab** (고정 크기) | 10ns | 10ns | 객체당 4바이트 | 매우 낮음 | ⭐⭐⭐⭐⭐ |
| **dlmalloc**(C 기본) | 50~200ns | 50~200ns | 4~16바이트 | 낮음 | ⭐⭐⭐⭐⭐⭐ |

---

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: WASM에서 메모리 누수가 발생할 수 있나요?</strong></summary>
네, 가능합니다. WASM의 선형 메모리는 JavaScript의 가비지 컬렉터가 관리하지 않습니다. 따라서 `malloc`으로 할당한 메모리를 `free`로 해제하지 않으면 WASM 내에서 메모리 누수가 발생합니다. 다만 WASM 인스턴스가 종료되면 모든 메모리는 브라우저에 의해 회수됩니다. 장기 실행 애플리케이션(웹 서버, 게임)에서는 반드시 메모리 프로파일링 도구를 사용해 누수를 모니터링해야 합니다.
</details>

<details>
<summary><strong>Q: memory.grow를 너무 자주 호출하면 어떤 문제가 생기나요?</strong></summary>
`memory.grow`는 약 5~10μs가 소요되며, 호출할 때마다 기존 `ArrayBuffer`가 detach됩니다. detach되면 JavaScript에서 생성한 모든 TypedArray가 무효화되므로 다시 생성해야 합니다. 또한 grow는 OS로부터 메모리를 할당받는 시스템 콜을 유발할 수 있습니다. **권장 사항**: 초기에 예상 최대 메모리의 70~80%를 할당하고, grow는 최후의 수단으로만 사용하세요.
</details>

<details>
<summary><strong>Q: Rust의 alloc 크레이트는 내부적으로 어떤 할당자를 사용하나요?</strong></summary>
Rust의 `alloc` 크레이트는 기본적으로 **dlmalloc**을 사용합니다. `wasm-pack`으로 빌드하면 자동으로 dlmalloc이 포함되어 `Box`, `Vec`, `String` 등의 표준 컬렉션이 정상 작동합니다. 또는 `wee_alloc`(작은 WASM 바이너리에 최적화된 경량 할당자)로 교체할 수 있습니다. `wee_alloc`은 dlmalloc보다 코드 크기가 약 5KB 작지만 할당 속도가 약 2배 느립니다.
</details>

---

## 3. 실전 메모리 관리 패턴

### 3.1 메모리 풀 (Object Pool)

고정 크기 객체를 미리 할당해두고 재사용하는 패턴입니다. 게임의 입자(Particle), 네트워크 패킷 버퍼 등에 적합합니다.

```wat
;; WAT — 간단한 객체 풀
(module
  (memory 1)
  
  ;; 풀 설정: 최대 100개의 객체, 각 32바이트
  (global $pool_start i32 (i32.const 1024))
  (global $pool_end i32 (i32.const 4224))  ;; 1024 + 100 * 32
  (global $pool_count (mut i32) (i32.const 0))
  
  ;; 풀에서 객체 가져오기
  (func (export "pool_alloc") (result i32)
    (local $addr i32)
    
    global.get $pool_count
    i32.const 100
    i32.lt_u
    if
      global.get $pool_start
      global.get $pool_count
      i32.const 32
      i32.mul
      i32.add
      local.set $addr
      
      global.get $pool_count
      i32.const 1
      i32.add
      global.set $pool_count
      
      local.get $addr
      return
    end
    
    i32.const 0  ;; 풀 소진
  )
  
  ;; 풀에 객체 반환
  (func (export "pool_free") (param $addr i32)
    ;; 실제로는 객체를 초기화하거나 반환 리스트에 추가
    global.get $pool_count
    i32.const 0
    i32.gt_u
    if
      global.get $pool_count
      i32.const 1
      i32.sub
      global.set $pool_count
    end
  )
)
```

> **🔬 깊이 있는 설명 — 메모리 풀이 할당자보다 빠른 이유:** 메모리 풀은 모든 객체가 동일한 크기(32바이트)이므로 **파편화가 전혀 발생하지 않고**, 할당/해제가 단순한 인덱스 증감만으로 처리됩니다. Free List Allocator가 블록을 검색하고 분할/병합하는 복잡한 연산을 수행하는 반면, 풀은 고정 크기이므로 이러한 오버헤드가 없습니다. 결과적으로 풀 할당은 **약 2~5ns**로 Free List보다 10~100배 빠릅니다.

---

### 실전 노하우 — WASM 메모리 최적화 5계명

1. **초기 메모리 계획**: 예상 사용량의 1.5배를 초기 메모리로 설정하고 grow는 최소화
2. **메모리 풀 활용**: 동일 크기 객체는 풀을 사용하여 할당/해제 오버헤드 제거
3. **프로파일링 습관화**: Chrome DevTools > Memory > WASM 탭에서 힙 상태 주기적 확인
4. **메모리 정렬**: 구조체는 8바이트 정렬로 시작하여 캐시 효율 극대화
5. **Rust alloc 크레이트 활용**: 복잡한 할당자는 직접 구현하지 말고 `wasm-pack`의 dlmalloc 사용

---

## 요약 — 메모리 관리 핵심 포인트

- **선형 메모리**: WebAssembly의 메모리는 64KB 페이지 단위의 연속 배열 (ArrayBuffer)
- **페이지 시스템**: `(memory init max)`로 선언, `memory.grow`로 확장 (1회 grow = 5~10μs)
- **Custom Allocator**: Bump(초고속/제한적), Free List(범용/중간 속도), Pool(고정 크기/최적)
- **메모리 누수**: WASM 메모리는 GC가 관리하지 않음 → 명시적 해제 필수
- **Rust alloc**: dlmalloc(기본) 또는 wee_alloc(경량)을 `wasm-pack`이 자동 포함
- **성능 원칙**: 초기 메모리 충분히 할당, 풀 패턴 사용, TypedArray detach 주의

**다음 강의 예고:** 중급 09강에서는 **테이블(Tables)과 함수 포인터(Function Pointers)** — 간접 호출, Call_indirect, 함수 테이블 동적 조작, C++ 가상 함수와의 연관성을 다룹니다.
