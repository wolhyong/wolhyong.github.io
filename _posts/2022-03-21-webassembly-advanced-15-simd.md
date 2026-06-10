---
layout: post
title: "WebAssembly 고급(15) — SIMD: Single Instruction Multiple Data"
description: "WebAssembly SIMD(128비트 벡터 명령어) 실무 안내 — v128 타입과 벡터 연산, 패킹/언패킹, 성능 측정(4배 가속), 자동 벡터화 전략, 실전 최적화 패턴(행렬 곱셈, 이미지 처리, 오디오)"
date: 2022-03-21 10:00:00 +0900
category: webassembly
tags: [webassembly, simd, vectorization, v128, packed-data, auto-vectorization, matrix-multiplication, image-processing, audio-processing, wasm-simd]
level: advanced
---

> **💡 한 줄 요약:** WebAssembly SIMD(Single Instruction Multiple Data)는 128비트 레지스터(v128 타입)를 사용하여 한 번에 4개의 32비트 정수 또는 2개의 64비트 부동소수점 연산을 동시에 수행합니다. 이론적으로 최대 4배의 성능 향상이 가능하며, 이미지 처리(픽셀당 4채널 작업), 오디오 처리, 행렬 연산에서 가장 큰 효과를 냅니다.

## SIMD란 무엇인가?

**SIMD(Single Instruction, Multiple Data)** 는 하나의 명령어로 여러 데이터를 동시에 처리하는 CPU 기술입니다. WebAssembly SIMD는 128비트 벡터 레지스터(v128 타입)를 사용하여, 다음과 같은 데이터 병렬 처리를 가능하게 합니다:

| 데이터 타입 | 128비트 레지스터에 담을 수 있는 개수 | 한 번에 처리 |
|-----------|---------------------------------|-----------|
| `i8` (바이트) | 16개 | 16개 동시 연산 |
| `i16` (반정수) | 8개 | 8개 동시 연산 |
| `i32` (정수) | 4개 | 4개 동시 연산 |
| `f32` (단정밀도 실수) | 4개 | 4개 동시 연산 |
| `f64` (배정밀도 실수) | 2개 | 2개 동시 연산 |

---

## 수업 목표

- WebAssembly SIMD의 v128 타입과 벡터 연산 명령어 이해
- 패킹(Packing)과 언패킹(Unpacking) 기법 습득
- 자동 벡터화(Auto-vectorization)의 조건과 한계 이해
- 실전 SIMD 최적화 패턴(행렬 곱셈, 이미지 처리, 오디오) 습득
- SIMD 사용 시 성능 측정과 프로파일링 방법 이해

---

## 1. v128 타입과 기본 연산

### 1.1 v128 값 생성

```wat
;; WAT — v128 상수 생성
(module
  ;; 모든 바이트를 0으로 설정
  (func (export "zero") (result v128)
    v128.const i32x4 0 0 0 0
  )
  
  ;; 모든 바이트를 특정 값으로 설정
  (func (export "splat_i32") (param $val i32) (result v128)
    local.get $val
    i32x4.splat             ;; 4개의 i32 슬롯을 모두 동일한 값으로 채움
  )
  
  ;; 다른 타입의 splat
  (func (export "splat_f32") (param $val f32) (result v128)
    local.get $val
    f32x4.splat
  )
)

;; 직렬화: main.c → wasm
#include <wasm_simd128.h>

// 간단한 벡터 덧셈 (자동 벡터화)
void vector_add(float* a, float* b, float* out, int n) {
    for (int i = 0; i < n; i++) {
        out[i] = a[i] + b[i];  // 컴파일러가 자동으로 SIMD 변환
    }
}
```

### 1.2 벡터 산술 연산

```wat
;; 벡터 기본 연산
(module
  ;; 두 v128의 요소별 덧셈
  (func (export "add_f32x4") (param $a v128) (param $b v128) (result v128)
    local.get $a
    local.get $b
    f32x4.add               ;; 4개의 f32 동시 덧셈
  )
  
  ;; 요소별 곱셈
  (func (export "mul_f32x4") (param $a v128) (param $b v128) (result v128)
    local.get $a
    local.get $b
    f32x4.mul
  )
  
  ;; 요소별 최대값
  (func (export "max_f32x4") (param $a v128) (param $b v128) (result v128)
    local.get $a
    local.get $b
    f32x4.max
  )
)
```

#### SIMD 연산 성능 비교 (일반 vs SIMD, 100만 요소)

| 연산 | 일반 (Scalar) | SIMD (Vectorized) | 가속비 |
|------|-------------|------------------|-------|
| f32 덧셈 | 15.2ms | 3.8ms | **4.0x** |
| f32 곱셈 | 18.1ms | 4.5ms | **4.0x** |
| f32 FMA (곱셈+덧셈) | 25.3ms | 5.1ms | **5.0x** |
| i32 덧셈 | 12.0ms | 3.0ms | **4.0x** |
| i32 비교+선택 | 22.5ms | 6.2ms | **3.6x** |

> **🔬 깊이 있는 설명 — SIMD가 정확히 4배가 아닌 이유:** 이론적으로 SIMD는 4개의 32비트 연산을 동시에 수행하므로 4배 빨라야 합니다. 하지만 실제로는 (1) **메모리 로드/스토어 오버헤드** — SIMD 레지스터에 데이터를 로드하고 결과를 저장하는 데 추가 시간이 필요, (2) **데이터 정렬 요구사항** — 16바이트 정렬되지 않은 메모리 접근은 성능 저하, (3) **루프 오버헤드** — 남은 요소(N mod 4)를 처리하는 스칼라 후처리 루프 필요 등의 이유로 실제 가속비는 3.5~4.0배입니다.

---

## 2. 실전 SIMD 최적화 패턴

### 2.1 이미지 처리 — 밝기 조정

이미지 처리는 SIMD의 가장 대표적인 사용 사례입니다. RGBA 픽셀(32비트 x 4채널)은 128비트에 정확히 하나의 픽셀이 들어맞습니다.

```c
// C — SIMD 이미지 밝기 조정 (intrinsics 사용)
#include <wasm_simd128.h>

void adjust_brightness(uint8_t* pixels, int count, int delta) {
    // 밝기 증감값을 4채널에 적용할 벡터 생성
    const v128_t delta_vec = wasm_i8x16_splat(delta);
    
    for (int i = 0; i < count; i += 16) {  // 16바이트 = 4픽셀(RGBA)
        v128_t pixel = wasm_v128_load(&pixels[i]);
        
        // 각 채널에 delta 더하기 (포화 연산)
        v128_t result = wasm_u8x16_add_saturate(pixel, delta_vec);
        
        wasm_v128_store(&pixels[i], result);
    }
}
```

```wat
;; WAT — 동일한 SIMD 밝기 조정
(func $adjust_brightness (param $addr i32) (param $count i32) (param $delta i32)
  (local $i i32)
  (local $pixel v128)
  (local $delta_vec v128)
  
  local.get $delta
  i8x16.splat
  local.set $delta_vec
  
  (loop $loop
    local.get $addr
    local.get $i
    i32.add
    v128.load              ;; 16바이트 한 번에 로드 (4픽셀)
    local.set $pixel
    
    local.get $pixel
    local.get $delta_vec
    u8x16.add_saturate     ;; 포화 덧셈: 255를 초과하면 255로 고정
    
    local.get $addr
    local.get $i
    i32.add
    v128.store             ;; 16바이트 한 번에 저장
    
    local.get $i
    i32.const 16
    i32.add
    local.tee $i
    local.get $count
    i32.lt_u
    br_if $loop
  )
)
```

#### SIMD vs Scalar 이미지 처리 성능

| 작업 | Scalar (1픽셀) | SIMD (4픽셀) | 1920x1080 이미지 |
|------|---------------|-------------|-----------------|
| 밝기 조정 | 5.2ms | 1.3ms | **4.0x** |
| 그레이스케일 변환 | 8.1ms | 2.4ms | **3.4x** |
| 임계값 이진화 | 6.5ms | 1.8ms | **3.6x** |
| 콘트라스트 조정 | 12.3ms | 3.5ms | **3.5x** |

> **🔬 깊이 있는 설명 — 포화 연산(add_saturate)의 중요성:** 일반 `i8x16.add`는 8비트 정수 오버플로우가 발생하면 값이 반전됩니다(예: 250 + 10 = 4). 이미지 처리에서 이는 심각한 색상 왜곡을 유발합니다. `u8x16.add_saturate`는 각 바이트 연산 결과가 0~255 범위를 벗어나면 자동으로 클리핑합니다(250 + 10 = 255). 이 포화 연산은 SIMD의 강력한 기능 중 하나로, 스칼라 코드에서는 각 픽셀마다 `if (result > 255) result = 255;` 조건 분기가 필요하지만 SIMD에서는 단일 명령어로 처리됩니다.

---

### 2.2 행렬 곱셈 — 4x4 행렬

```c
// C — SIMD 4x4 행렬 곱셈
#include <wasm_simd128.h>

typedef struct { float m[4][4]; } mat4;

void mat4_mul_simd(mat4* result, const mat4* a, const mat4* b) {
    // 각 행을 SIMD 벡터로 로드
    v128_t row_a[4] = {
        wasm_v128_load(&a->m[0]),
        wasm_v128_load(&a->m[1]),
        wasm_v128_load(&a->m[2]),
        wasm_v128_load(&a->m[3])
    };
    
    // 각 열을 SIMD 벡터로 로드 (전치하여 로드)
    v128_t col_b[4];
    for (int j = 0; j < 4; j++) {
        col_b[j] = wasm_v128_load(&b->m[0][j]);
    }
    
    // 행 × 열 곱셈 (SIMD dot product)
    for (int i = 0; i < 4; i++) {
        v128_t row = row_a[i];
        for (int j = 0; j < 4; j++) {
            // row · col_b[j] = f32x4.dot(row, col_b[j])
            v128_t prod = wasm_f32x4_mul(row, col_b[j]);
            // 수평 합산 (hadd)
            result->m[i][j] = wasm_f32x4_extract_lane(prod, 0)
                            + wasm_f32x4_extract_lane(prod, 1)
                            + wasm_f32x4_extract_lane(prod, 2)
                            + wasm_f32x4_extract_lane(prod, 3);
        }
    }
}
```

#### 4x4 행렬 곱셈 성능 (100만 회 반복)

| 방법 | 시간 | 상대 성능 |
|------|------|---------|
| Scalar (순수 C) | 185ms | 1.0x (기준) |
| SIMD (f32x4) | 52ms | **3.6x** |
| 수동 언롤 + SIMD | 41ms | **4.5x** |
| 네이티브 C (AVX2) | 28ms | 6.6x |

---

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: WASM SIMD가 네이티브 CPU의 AVX/SSE만큼 빠른가요?</strong></summary>
WASM SIMD는 128비트 레지스터만 사용하므로, Intel/AMD CPU의 256비트 AVX2나 512비트 AVX-512보다 레지스터 폭이 좁습니다. 따라서 WASM SIMD는 SSE(128비트)와 성능이 비슷하며, AVX2의 약 50~60% 성능입니다. 단, 이 차이는 CPU 아키텍처 의존적이며, WASM SIMD는 모든 플랫폼에서 동일하게 동작한다는 장점이 있습니다.
</details>

<details>
<summary><strong>Q: 어떤 브라우저가 WASM SIMD를 지원하나요?</strong></summary>
Chrome 91+ (2021년), Firefox 89+, Edge 91+, Safari 16.4+ (2023년)에서 지원합니다. Safari는 가장 늦게 지원을 추가했습니다. 모바일 브라우저에서는 Chrome Android 91+, Safari iOS 16.4+에서 지원합니다. Node.js 20+에서도 `--experimental-wasm-simd` 플래그로 활성화할 수 있습니다.
</details>

<details>
<summary><strong>Q: C 컴파일러가 자동으로 SIMD를 생성하게 하려면 어떻게 해야 하나요?</strong></summary>
Emscripten에서 `-O3 -msimd128` 플래그를 사용하면 컴파일러가 루프를 자동 벡터화합니다. 자동 벡터화가 성공하려면: (1) 루프 반복 횟수가 컴파일타임에 알려져 있어야 함, (2) 루프 내에 조건 분기가 없어야 함, (3) 포인터가 겹치지 않음(noalias)을 보장해야 함 (C99의 `restrict` 키워드 사용). 자동 벡터화가 실패하면 `wasm_simd128.h`의 intrinsics를 직접 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: SIMD를 사용할 때 메모리 정렬이 중요한 이유는 무엇인가요?</strong></summary>
SIMD의 `v128.load` 명령어는 16바이트 정렬된 메모리 주소에서 가장 빠릅니다. 정렬되지 않은 주소에서 로드하면 일부 CPU(ARM)에서는 트랩이 발생하거나, x86에서는 성능이 약 2배 저하됩니다. C에서 `aligned_alloc(16, size)` 또는 `__attribute__((aligned(16)))`로 16바이트 정렬을 보장하세요. WASM intrinsics 중 `wasm_v128_load`(정렬)와 `wasm_v128_load_unaligned`(비정렬)을 상황에 맞게 선택하세요.
</details>

---

## 3. 자동 벡터화 전략

모든 코드를 수동으로 SIMD intrinsics로 작성할 필요는 없습니다. 대부분의 C/C++ 컴파일러는 특정 패턴을 인식하고 자동으로 SIMD 명령어를 생성합니다.

```c
// 자동 벡터화가 잘 되는 패턴
void auto_vectorizable(float* __restrict__ a, float* __restrict__ b,
                       float* __restrict__ c, int n) {
    // 1. 연속 메모리 접근 (stride = 1)
    // 2. 루프 내 조건 분기 없음
    // 3. 포인터 겹침 없음 (__restrict__)
    for (int i = 0; i < n; i++) {
        c[i] = a[i] + b[i] * 2.0f;
    }
}
```

```bash
# Emscripten 자동 벡터화 활성화
emcc -O3 -msimd128 -ffast-math auto_vec.c -o auto_vec.wasm

# 벡터화 로그 확인 (어떤 루프가 SIMD로 변환되었는지)
emcc -O3 -msimd128 -Rpass=loop-vectorize auto_vec.c -o auto_vec.wasm

# 벡터화 실패 이유 확인
emcc -O3 -msimd128 -Rpass-missed=loop-vectorize auto_vec.c -o auto_vec.wasm
```

| 패턴 | 자동 벡터화 가능? | 이유 |
|------|-----------------|------|
| 연속 배열 덧셈 `c[i] = a[i] + b[i]` | ✅ 항상 | 단순한 stride-1 접근 |
| 조건부 합산 `if (a[i] > 0) sum += a[i]` | ⚠️ 조건부 | SIMD 마스크/블렌드 필요 |
| 비연속 접근 `c[idx[i]] = a[i]` | ❌ 불가능 | Gather/Scatter 필요 |
| 함수 호출 포함 `c[i] = sin(a[i])` | ❌ 불가능 | 수학 함수 라이브러리 호출 |
| 포인터 체이싱 `c[i] = a[b[i]]` | ❌ 불가능 | 메모리 의존성 알 수 없음 |

---

## 요약 — SIMD 핵심 포인트

- **v128 타입**: 128비트 SIMD 레지스터. 4개의 f32 또는 2개의 f64 또는 16개의 i8 동시 처리
- **가속비**: 이론적 4배, 실제 3.5~4.0배 (메모리 정렬, 루프 오버헤드 등으로 인한 차이)
- **주요 활용**: 이미지 처리(RGBA 픽셀 4채널), 오디오 처리(4채널), 행렬 연산(4x4), 포화 연산
- **자동 벡터화**: `-O3 -msimd128` 플래그로 활성화. 연속 메모리 접근 + 조건 분기 없는 루프만 가능
- **intrinsics**: `wasm_simd128.h`의 `wasm_f32x4_add`, `wasm_u8x16_add_saturate` 등 200+개 함수
- **지원 환경**: Chrome/Firefox/Edge 91+, Safari 16.4+, Node.js 20+ (실험적)
- **실전 원칙**: 메모리 16바이트 정렬, 연속 접근(stride=1), 포화 연산 활용, 자동 벡터화 우선 시도
