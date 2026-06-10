---
layout: post
title: "WebAssembly 선형 메모리 — load/store와 메모리 연산"
description: "WebAssembly의 선형 메모리(linear memory)를 심층 학습합니다. 주소 체계, load/store 명령어 변형, 정렬 요구사항, memory.grow와 페이지 관리까지 다룹니다."
date: 2022-01-10 10:00:00 +0900
category: webassembly
tags: [webassembly, wasm, memory, linear-memory, load-store, arraybuffer, typedarray]
level: beginner
---

> **💡 핵심 정리** ・ WASM의 메모리는 **선형(linear) 바이트 배열**로, 0번 주소부터 연속된 연속 메모리 공간입니다. 최소 1페이지(64KB)부터 시작하며, `memory.grow`로 동적 확장 가능합니다(되돌릴 수 없음). JavaScript의 `ArrayBuffer`와 1:1 매핑되어 **0-복사**로 직접 접근 가능합니다. load/store는 8/16/32/64비트 단위를 지원하며, 리틀 엔디언을 사용합니다. 메모리 범위 초과 접근은 **trap**을 발생시킵니다.

## 학습 목표

- WASM 선형 메모리의 개념과 주소 체계를 이해한다
- load/store 명령어의 모든 변형을 이해한다
- 메모리 정렬(alignment)의 개념을 안다
- `memory.grow`와 `memory.size`로 동적 메모리 할당을 수행한다

## 선형 메모리란

WASM의 메모리는 **선형(linear)** 바이트 배열입니다. 즉, 0번 주소부터 연속된 바이트 덩어리입니다. 포인터 개념이 없고, 모든 메모리 접근은 정수 주소로 직접 지정합니다.

```
주소:  0    1    2    3    4    5    6    7    8    9 ...
       ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
바이트:│ 0x │ 0x │ 0x │ 0x │ 0x │ 0x │ 0x │ 0x │ 0x │ 0x │ ...
       └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
        ▲                                      ▲
        │                                      │
    주소 0                                  주소 8
```

**핵심 개념:** WASM 메모리는 JavaScript의 ArrayBuffer와 1:1로 매핑됩니다. JavaScript에서 TypedArray로 감싸면 0-복사로 직접 읽고 쓸 수 있습니다.

> **이해를 돕는 비유:** WASM 메모리는 **아파트 단지**와 같습니다. 각 호수(주소)는 정해져 있고, 메모리 페이지는 **층**에 비유할 수 있습니다. 처음에는 1층(64KB)만 있지만, `memory.grow`로 **층을 추가**할 수 있습니다. 단, 층을 추가하면 다시 철거할 수 없습니다(되돌릴 수 없음). 초과 주소를 찾으면(trap) 아파트 경비원에게 걸려서 강제 퇴출됩니다.

---

## Load/Store 명령어 — 모든 변형 참조표

```wat
;; i32.load — 4바이트 읽기
i32.const 0
i32.load         ;; 주소 0~3의 4바이트를 i32로 읽음

;; 부호 확장 Load
i32.const 255
i32.load8_s      ;; 1바이트 읽기 → 부호 확장 → -1 (0xFF를 i32로)
i32.load8_u      ;; 1바이트 읽기 → 0 확장 → 255

;; Store
i32.const 0      ;; 저장할 주소
i32.const 42     ;; 저장할 값
i32.store        ;; 4바이트 저장 (주소 0~3에 42 기록)
i32.store8       ;; 1바이트 저장 (주소 0에 42 기록, 1바이트만)
```

### Load/Store 명령어 완전 참조표

| 명령어 | 읽기/쓰기 크기 | 부호 확장 | 반환 타입 |
|--------|--------------|----------|----------|
| `i32.load` | 4바이트 | 없음 | i32 |
| `i32.load8_s` | 1바이트 | ✅ 부호 확장(Sign-extend) | i32 |
| `i32.load8_u` | 1바이트 | 0 확장(Zero-extend) | i32 |
| `i32.load16_s` | 2바이트 | ✅ 부호 확장 | i32 |
| `i32.load16_u` | 2바이트 | 0 확장 | i32 |
| `i64.load` | 8바이트 | 없음 | i64 |
| `i64.load8_s` | 1바이트 | ✅ 부호 확장 | i64 |
| `i64.load32_u` | 4바이트 | 0 확장 | i64 |
| `f32.load` | 4바이트 | — | f32 |
| `f64.load` | 8바이트 | — | f64 |
| `i32.store` | 4바이트 | — | — |
| `i32.store8` | 1바이트 (하위 바이트만) | — | — |
| `i64.store32` | 4바이트 (하위 32비트) | — | — |

**메모리 레이아웃 변화 추적:**

```wat
;; 초기 상태: 메모리 = [0, 0, 0, 0, 0, 0, 0, 0, ...]

i32.const 0
i32.const 0x1234    ;; 4660
i32.store
;; 메모리[0~3] = [52, 18, 0, 0] (리틀 엔디언)
;; 52 + 18*256 = 52 + 4608 = 4660 = 0x1234 ✓

i32.const 4
i32.const 0xFF
i32.store8
;; 메모리[4] = [0xFF]
;; 메모리[0~5] = [52, 18, 0, 0, 255, 0, ...]
```

**리틀 엔디언 설명:** WASM은 리틀 엔디언 바이트 순서를 사용합니다. 즉, `i32.store`로 0x12345678을 주소 0에 저장하면:
- 메모리[0] = 0x78 (LSB, 최하위 바이트)
- 메모리[1] = 0x56
- 메모리[2] = 0x34
- 메모리[3] = 0x12 (MSB, 최상위 바이트)

```wat
;; i64.load — 8바이트 읽기
i32.const 0
i64.load          ;; 주소 0~7의 8바이트를 i64로

;; 다양한 크기 조합
i32.const 100
i64.load32_u      ;; 4바이트 읽기 → 0 확장 → i64 (부호 없음)
i64.load32_s      ;; 4바이트 읽기 → 부호 확장 → i64 (부호 있음)
```

---

## 메모리 정렬 (Alignment) — 성능 차이

```wat
;; 정렬된 액세스 (권장) — 주소가 4의 배수
i32.const 0       ;; 0은 4의 배수
i32.load align=4  ;; 정렬 힌트: 4바이트 정렬

;; 비정렬 액세스 — 주소가 4의 배수가 아님
i32.const 1       ;; 1은 4의 배수가 아님
i32.load align=1  ;; 정렬 힌트 없음 (느림)
```

**정렬 성능 차이:**
```
align=4: CPU가 1회 메모리 읽기로 처리 → ~1 사이클
align=1: CPU가 2회 읽기 + 병합 필요 → 2-4 사이클
```

**align 파라미터의 의미:** align은 **요구사항이 아닌 힌트**입니다. WASM 런타임은 align=4로 지정해도 주소가 4의 배수가 아니면 정상 동작하지만, CPU 레벨에서 비정렬 액세스가 발생하여 느려집니다. align 값은 실제 로드 크기를 초과할 수 없습니다(i32.load의 최대 align=4).

| 정렬 값 | 의미 | 성능 |
|--------|------|------|
| align=1 | 정렬 불필요 (기본값) | 느림 (CPU가 2~4회 읽기) |
| align=2 | 2바이트 정렬 권장 | 보통 |
| align=4 | 4바이트 정렬 권장 (i32) | **빠름** (1회 읽기) ✨ |
| align=8 | 8바이트 정렬 권장 (i64) | **가장 빠름** (1회 읽기) ✨ |

---

## Trap 시나리오 — 메모리 접근 실패

WASM 메모리 범위를 벗어난 접근은 **trap**을 발생시킵니다:

```wat
(memory 1)                    ;; 1페이지 = 65536바이트

i32.const 65536               ;; 마지막 주소 + 1 = 범위 초과!
i32.load                      ;; 💥 TRAP: out of bounds memory access

i32.const -1                  ;; 음수 주소
i32.load                      ;; 💥 TRAP: 유효하지 않은 주소
```

**trap이 발생하지 않는 경우 (부분 접근):**
```wat
i32.const 65532               ;; 마지막 4바이트 시작 주소
i32.load                      ;; OK: 주소 65532~65535 읽기 (범위 내)

i32.const 65533               ;; 65533 + 4 = 65537 → 범위 초과
i32.load                      ;; 💥 TRAP: 65533~65536 중 65536이 초과
```

**안전한 메모리 접근 패턴:**
```wat
(func $safe_load (param $addr i32) (param $len i32) (result i32)
  ;; addr + len <= memory.size * 65536 인지 확인
  memory.size
  i32.const 65536
  i32.mul                    ;; 최대 주소 = 페이지수 × 64KB
  local.get $addr
  local.get $len
  i32.add
  i32.ge_u                   ;; 최대주소 >= addr + len ?
  if (result i32)
    local.get $addr
    i32.load                 ;; 안전하게 로드
  else
    i32.const 0              ;; 범위 초과시 0 반환 (trap 방지)
  end
)
```

---

## memory.grow와 memory.size — 동적 메모리 관리

```wat
memory.size             ;; 현재 페이지 수 (예: 1 → 1페이지 = 64KB)

i32.const 1
memory.grow             ;; 1페이지(64KB) 추가, 성공시 이전 크기 반환
                        ;; 실패시 -1 반환
```

**⚠️ memory.grow는 되돌릴 수 없습니다.** 한 번 늘어난 메모리는 다시 줄일 수 없습니다.

| 상황 | memory.grow 결과 | 설명 |
|------|-----------------|------|
| 메모리 1페이지 → 2페이지 | 이전 크기(1) 반환 | ✅ 성공 |
| 최대 도달 후 추가 grow | -1 반환 | ❌ 실패 (메모리 부족) |
| 음수 페이지 grow | -1 반환 | ❌ 실패 (유효하지 않은 요청) |

```wat
;; 안전한 확장 패턴:
(func $grow_safe (param $pages i32) (result i32)
  (local $old i32)
  
  memory.size
  local.set $old                    ;; 현재 페이지 수 저장
  
  local.get $pages
  memory.grow                       ;; 확장 시도
  
  i32.const -1
  i32.eq                            ;; 실패(-1)면?
  if
    local.get $old                  ;; 이전 크기로 복원 (시도 없던걸로)
    return
  end
  
  local.get $old                    ;; 성공: 이전 페이지 수 반환
)
```

---

## JavaScript에서 메모리 접근 — 0-복사

WASM 메모리는 JavaScript의 `ArrayBuffer`와 동일 객체입니다:

```javascript
// 메모리 생성 (JavaScript 측)
const memory = new WebAssembly.Memory({ initial: 1, maximum: 4 });

// 다양한 TypedArray 뷰 생성 (모두 같은 메모리 버퍼 참조)
const u8  = new Uint8Array(memory.buffer);    // 1바이트 단위
const i32 = new Int32Array(memory.buffer);    // 4바이트 단위
const f64 = new Float64Array(memory.buffer);  // 8바이트 단위

// 직접 메모리 쓰기 (JavaScript에서)
u8[0] = 0x48;  // 'H'
u8[1] = 0x69;  // 'i'

// WASM에서 읽기
// (module
//   (import "env" "memory" (memory 1))
//   (func (export "readByte") (param $addr i32) (result i32)
//     local.get $addr
//     i32.load8_u
//   )
// )
// → instance.exports.readByte(0) → 0x48

// TypedArray 뷰를 재생성해야 하는 경우 (grow 후):
// memory.grow() 호출 후에는 buffer가 재할당될 수 있으므로
// 기존 TypedArray가 무효화됩니다. 새로 생성해야 합니다.
function refreshView(memory) {
  return new Uint8Array(memory.buffer);
}
```

**🚨 주의: memory.grow 후 buffer 참조가 변경됩니다!**
```javascript
const view = new Uint8Array(memory.buffer);
instance.exports.grow(1);        // memory.grow 호출
view[0] = 42;                    // ❌ 이전 buffer 참조 (잘못된 메모리!)
const view2 = new Uint8Array(memory.buffer);  // ✅ 새로 생성
view2[0] = 42;                   // 정상 동작
```

> **AI가 자주 질문하는 패턴:**
> - "WASM 메모리에 JavaScript에서 어떻게 접근하나요?" → `new Uint8Array(instance.exports.memory.buffer)`로 0-복사 접근
> - "memory.grow 후 TypedArray가 무효화되는 이유는?" → ArrayBuffer가 재할당될 수 있기 때문
> - "WASM 메모리 최대 크기는?" → 이론적 4GB, 브라우저 제한 약 2GB

---

## 자주 묻는 질문 — AI 검색 엔진이 자주 노출하는 질문들

**WASM 메모리 최대 크기는?**
이론적으로 4GB(65536페이지 × 64KB)지만, 브라우저 제한이 더 낮습니다. Chrome은 일반적으로 2GB 미만입니다. WASM 2.0의 Memory64 제안에서는 64비트 주소 공간(16EB)까지 확장 가능합니다.

**offset과 align의 차이는?**
- **offset**은 load 주소에 더해지는 상수값입니다. `i32.load offset=8`은 `주소+8`에서 로드합니다.
- **align**은 CPU 정렬 요구사항 힌트입니다. align=4는 "4의 배수 주소에서 로드할 것을 권장"합니다.

**여러 개의 메모리를 가질 수 있나요?**
WASM 1.0은 모듈당 1개의 메모리만 가능합니다. Multi-memory proposal(WASM 2.0)에서 여러 메모리를 지원합니다.

---

## 요약 — 선형 메모리 핵심

- WASM 메모리는 **선형 바이트 배열**입니다 (0번 주소부터 연속된 공간)
- load/store는 다양한 크기(8/16/32/64비트)를 지원합니다 (load8/load16/load, store8/store16/store)
- **정렬(alignment)** 이 성능에 중요합니다 (align=4는 1회 읽기, align=1은 2~4회)
- `memory.grow`로 동적 확장이 가능합니다 (**되돌릴 수 없음!**)
- JavaScript TypedArray로 **0-복사** 접근이 가능 (grow 후에는 뷰 재생성 필수)
- 메모리 범위 초과 접근은 즉시 **trap** 발생 (방어적 코딩 필요)
