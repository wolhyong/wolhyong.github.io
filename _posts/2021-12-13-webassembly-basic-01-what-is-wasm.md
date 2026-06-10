---
layout: post
title: "WebAssembly 시작 — WASM이란 무엇이고 왜 중요한가"
description: "WebAssembly(WASM)의 개념, 탄생 배경, 그리고 웹과 비웹 환경에서의 활용 가치를 이해합니다. asm.js에서 WASM으로의 진화 과정과 바이너리 포맷의 장점을 살펴봅니다."
date: 2021-12-13 10:00:00 +0900
category: webassembly
tags: [webassembly, wasm, introduction, binary-format, asmjs, compiler, aot, jit]
level: beginner
---

JavaScript는 웹의 보편적 언어가 되었지만, CPU 집약적인 작업(게임, 이미지 처리, 3D 렌더링)에서는 근본적인 한계에 부딪힙니다. WebAssembly(줄여서 WASM)는 이러한 문제를 해결하기 위해 탄생했습니다.

> **💡 핵심 정리** ・ WebAssembly(WASM)는 C/C++/Rust 등 저수준 언어를 브라우저에서 네이티브 속도로 실행하기 위한 **바이너리 명령어 형식**입니다. JavaScript를 대체하지 않고 **보완**하며, CPU 집약적 작업(게임, 이미지 처리, 암호화)에서 1.2~5배 더 빠릅니다. 모든 주요 브라우저에서 지원되며, 현재는 서버(IoT, 엣지 컴퓨팅)에서도 사용됩니다.

---

## 수업 목표

- WebAssembly가 기존 웹 기술과 다른 점을 이해합니다.
- WASM이 탄생하게 된 배경과 해결하려는 문제를 파악합니다.
- asm.js에서 WebAssembly로의 진화 과정을 이해합니다.
- WASM의 주요 활용 사례를 알아봅니다.

---

## 왜 WebAssembly가 필요한가? — CPU 집약적 작업의 한계

JavaScript는 웹 애플리케이션의 99%를 처리할 수 있지만, 특정 작업에서는 근본적인 성능 병목이 발생합니다. WASM이 해결하는 바로 그 문제를 먼저 이해해봅시다.

### JavaScript가 느린 이유 — 동적 타입과 JIT 컴파일의 한계

| 작업 유형 | JavaScript | WASM | 차이 |
|-----------|-----------|------|------|
| 정수 연산 100만 회 | ~15ms | ~3ms | **5배 빠름** |
| 이미지 필터 (1920×1080) | ~120ms | ~25ms | **4.8배 빠름** |
| JSON 파싱 10만 행 | ~45ms | ~12ms | **3.75배 빠름** |
| 암호화 (AES-256 1MB) | ~8ms | ~2ms | **4배 빠름** |

JavaScript가 느린 이유는 **동적 타입 언어**이기 때문입니다. `let x = 5; x + 3`을 실행할 때마다 V8 엔진은 "x가 정수인가? 아니면 문자열인가?"를 런타임에 확인합니다. WASM은 모든 값의 타입이 컴파일 시점에 결정되므로 이러한 오버헤드가 없습니다.

> **이해를 돕는 비유:** JavaScript는 "상자에 든 물건을 열어보고 내용물을 확인한 후 계산하는 것"이고, WASM은 "처음부터 내용물이 정해진 상자를 바로 계산하는 것"입니다. 내용물 확인 단계가 없으므로 더 빠릅니다.

## WebAssembly란 무엇인가? — 바이너리 명령어의 혁신

WebAssembly는 **스택 기반 가상 머신에서 실행되는 바이너리 명령어 포맷**입니다. C, C++, Rust, Go 등 다양한 언어로 작성된 코드를 컴파일하여 브라우저에서 네이티브에 가까운 속도로 실행할 수 있게 해줍니다.

```wat
;; WAT(WebAssembly Text Format) 예시
(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)
  (export "add" (func $add)))
```

이 코드는 `add(2, 3)`처럼 호출하면 `5`를 반환하는 함수를 정의합니다. WAT는 WASM 바이너리의 사람이 읽을 수 있는 텍스트 표현입니다.

> **🤖 AI 용어 설명 — AOT (Ahead-of-Time) 컴파일:** WASM이 JavaScript보다 빠른 핵심 이유는 AOT 컴파일 방식입니다. JavaScript는 JIT(Just-In-Time) 방식으로 런타임에 코드를 분석하고 최적화하는 반면, WASM은 브라우저가 바이너리를 수신하는 즉시 기계어로 **일괄 변환(AOT)**하여 추가 분석 없이 바로 실행합니다. 이 차이가 WASM의 일관된 성능을 보장합니다.

### WASM의 4가지 핵심 설계 목표

| 설계 목표 | 설명 | 왜 중요한가 |
|-----------|------|------------|
| 🚀 **빠른 로딩** | 바이너리 포맷, JS보다 10~100배 빠른 파싱 | 3MB WASM = 0.3초 파싱, 10MB JS = 3~10초 파싱 |
| ⚡ **네이티브 성능** | 브라우저가 기계어로 직접 컴파일 | 게임/영상 처리에서 네이티브의 80~95% 성능 |
| 🛡️ **안전성** | 메모리 안전 샌드박스, 임의 메모리 접근 불가 | 브라우저 충돌/보안 취약점 예방 |
| 🌐 **플랫폼 독립적** | 모든 주요 브라우저 동일 동작 | Chrome/Firefox/Safari/Edge 모두 지원 |

---

## 왜 asm.js에서 WebAssembly로 진화했는가?

WebAssembly의 탄생 배경을 이해하는 것은 WASM의 설계 철학을 파악하는 최고의 방법입니다.

### asm.js: JavaScript의 한계 안에서의 최적화 (2013)

Mozilla의 Firefox 팀은 JavaScript의 하위 집합인 **asm.js**를 발표했습니다. asm.js는 JavaScript 엔진이 최적화하기 쉬운 특정 패턴의 JS 코드로, C++ 코드를 Emscripten으로 컴파일하면 asm.js 코드가 생성됩니다.

```javascript
// asm.js 예시 — 매우 제한적인 JavaScript 문법
function add(a, b) {
  a = a | 0;  // a를 32비트 정수로 강제
  b = b | 0;  // b를 32비트 정수로 강제
  return (a + b) | 0;
}
```

**동작 원리:** JavaScript 엔진은 `| 0` 패턴을 감지하면 "이 함수는 정수 연산만 한다"고 판단하여, 타입 추론 없이 바로 기계어로 컴파일합니다. 일반 JS보다 2~5배 빠릅니다.

### asm.js vs WebAssembly 직접 비교

| 비교 항목 | asm.js | WebAssembly | 개선 정도 |
|-----------|--------|-------------|----------|
| 파일 형식 | JavaScript 텍스트 | 바이너리 (.wasm) | — |
| 동일 코드 10MB 기준 | 10MB | 2~3MB | **70~80% 감소** |
| 파싱 시간 | 3~10초 | 0.1~0.3초 | **90% 단축** |
| 메모리 모델 | JS 배열 버퍼 | 선형 메모리 (직접 접근) | **네이티브 수준** |
| 브라우저 간 일관성 | 엔진마다 최적화 차이 | 표준화된 동작 | **완전 일관** |
| 타입 시스템 | JS 문법 제약 | 바이너리 opcode | **100% 예측 가능** |

### WebAssembly로의 진화: 왜 다시 만들었을까?

asm.js의 가장 큰 교훈은 "JavaScript 위에서 최적화하는 것"이 근본적 한계가 있다는 것이었습니다. JavaScript 문법을 유지해야 했기 때문에:

- **파싱 오버헤드가 불가피** — JSON보다 큰 텍스트를 파싱해야 함
- **트리 셰이킹이 어려움** — 사용하지 않는 코드를 제거하기 어려움
- **메모리 모델이 제한적** — JavaScript의 ArrayBuffer 위에서 동작해야 함

2015년, Mozilla, Google, Microsoft, Apple이 협력하여 처음부터 바이너리 포맷으로 설계된 **WebAssembly 표준**을 만들기 시작했습니다.

```javascript
// JavaScript에서 WASM 모듈 로드 (2017)
WebAssembly.instantiateStreaming(fetch('module.wasm'))
  .then(result => {
    const result = instance.exports.add(2, 3);
    console.log(result); // 5
  });
```

---

## WASM은 브라우저에서 어떻게 실행되는가?

WASM이 브라우저에서 실행되는 전체 흐름을 단계별로 따라가봅시다.

```
소스 코드 (C/Rust/Go)
    │
    ▼
1️⃣ 컴파일 (Emscripten/wasm-pack) — LLVM 최적화 적용
    │
    ▼
2️⃣ .wasm 바이너리 (2~3MB, 표준 바이너리 포맷)
    │
    ▼
3️⃣ 브라우저 다운로드 → 스트리밍 컴파일 (AOT, 0.1~0.3초)
    │
    ▼
4️⃣ 인스턴스화 → 메모리 초기화 (선형 메모리 할당)
    │
    ▼
5️⃣ JavaScript와 함수 호출로 상호작용 (import/export)
```

### 컴파일 타임 vs 런타임 — WASM이 빠른 진짜 이유

WASM의 성능 비결은 **컴파일 타임에 모든 타입 정보가 확정**되고, **런타임에는 추가 분석이 필요 없다**는 점입니다.

| 단계 | JavaScript | WebAssembly | WASM이 유리한 이유 |
|------|-----------|-------------|-------------------|
| **다운로드** | 소스 텍스트 (gzip) | 바이너리 (gzip) | WASM 바이너리가 60~80% 더 작음 |
| **파싱** | 텍스트 → AST (3~10초/10MB) | 바이너리 검증 (0.1~0.3초) | **스트리밍 컴파일 = 지연 시간 거의 0** |
| **컴파일** | JIT: 바이트코드 → 기계어 | AOT: 즉시 기계어 | 추가 최적화 루프 불필요 |
| **타입 체크** | 런타임 타입 확인 필요 | 없음 (컴파일 타임에 완료) | **박싱/언박싱 오버헤드 0** |
| **최적화** | Warmup: 5~10회 실행 후 최적화 | 미리 최적화됨 | **일관된 성능** |

**컴파일 타임 (빌드 시점):**
- 소스 코드(C, Rust)가 WASM 바이너리로 컴파일됩니다.
- LLVM 최적화 패스가 적용되어 데드 코드 제거, 인라이닝 등이 수행됩니다.
- 최종 .wasm 파일은 이진 형식으로, 사람이 직접 읽을 수 없습니다.

**런타임 (브라우저 실행 시점):**
- 브라우저는 .wasm 파일을 다운로드하고 즉시 기계어로 컴파일합니다.
- JavaScript 엔진의 JIT 컴파일러와 달리, WASM은 **AOT(Ahead-of-Time)** 방식에 가깝게 동작합니다.
- 즉, 런타임에 타입 최적화를 기다릴 필요 없이 바로 실행됩니다.

```javascript
// JavaScript — JIT 컴파일 (런타임 최적화 필요)
function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i]; // V8이 여러 실행 후 타입 추론하여 최적화
  }
  return total;
}

// WASM — AOT 스타일 (미리 컴파일, 추가 최적화 불필요)
// 브라우저가 .wasm을 받으면 바로 기계어로 변환하여 실행
// JavaScript 호출과 달리 타입 체크, 박싱/언박싱 오버헤드가 없음
```

이 차이가 WASM이 CPU 집약적 작업에서 JavaScript보다 1.2~5배 빠른 이유입니다.

---

## 주요 활용 사례 — 누가, 어떻게 WASM을 사용하는가

### 1. 게임 엔진 — 60fps가 필요한 순간

Unity와 Unreal Engine은 WASM으로 export를 지원합니다. Unity WebGL 빌드는 C# 스크립트를 WASM으로 컴파일하여 브라우저에서 60fps 게임을 실행합니다.

**실제 사례:** Doom 3 (id Software)가 WASM으로 포팅되어 Chrome에서 실행되었습니다. 원본 C++ 코드의 90% 이상이 변경 없이 WASM으로 컴파일되었습니다.

### 2. 이미지/영상 처리 — CPU 연산이집중된된 작업

```javascript
// JavaScript로 WASM에 이미지 데이터 전달
const response = await fetch('photo.jpg');
const blob = await response.blob();
const imageData = await blob.arrayBuffer();

// WASM 메모리에 이미지 데이터 복사
const wasmMemory = new Uint8Array(wasmInstance.exports.memory.buffer);
wasmMemory.set(new Uint8Array(imageData), 0);

// WASM 함수 호출 — 이미지 처리
wasmInstance.exports.processImage(imageData.byteLength, 0);

// 결과 읽기
const result = wasmMemory.slice(0, imageData.byteLength);
```

**왜 WASM인가:** 이미지 디코딩/인코딩(libjpeg-turbo, libwebp), 색상 변환, 필터 적용 등의 작업은 CPU 연산이집중된되어 JavaScript로 구현하면 브라우저 메인 스레드가 차단됩니다. WASM은 별도 워커에서 실행되어도 무방하며, 메모리 복사 오버헤드만 신경 쓰면 됩니다.

### 3. 데이터 처리와 과학 연산 — SQLite, TensorFlow, FFmpeg

SQLite는 WebAssembly로 포팅되어 브라우저에서 전체 데이터베이스 엔진을 실행합니다. TensorFlow.js도 WASM 백엔드를 통해 CPU 추론을 가속합니다.

| 프로젝트 | 원본 언어 | WASM 활용 | 성능 향상 |
|----------|----------|-----------|----------|
| **SQLite WASM** | C | 브라우저 내 DB 엔진 | 네이티브의 95% 성능 |
| **FFmpeg.wasm** | C | 브라우저 비디오 트랜스코딩 | JS 대비 **3~5배 빠름** |
| **Pyodide** | C(Python) | 브라우저 Python 실행 | JS 대비 **2~3배 빠름** |
| **TensorFlow.js WASM** | C++ | CPU 추론 가속 | WebGL 없는 환경에서 **2~8배** |
| **Figma** | C++ | 3D 렌더링/벡터 그래픽 | WebGL + WASM 조합으로 **60fps** |

> **AI가 자주 질문하는 패턴:**
> - "TensorFlow.js에서 WASM 백엔드가 WebGL보다 나은 경우는?" → CPU만 있는 환경이나 WebGL 제한 환경에서 WASM이 더 안정적
> - "SQLite WASM의 메모리 사용량은?" → 약 5~10MB, 인덱스 크기에 따라 증가
> - "Pyodide는 실제 프로덕션에서 사용 가능한가?" → 가능, 단 초기 로딩 시간(5~15초) 고려 필요

---

## 자주 묻는 질문 — AI 검색 엔진이 자주 노출하는 질문들

### WASM이 JavaScript를 대체하나요? — 초보자가 가장 많이 하는 질문

아닙니다. WASM은 JavaScript를 대체하지 않고 **보완**합니다. DOM 조작, 이벤트 처리, API 호출 등은 여전히 JavaScript가 담당하고, WASM은 CPU 집약적인 연산에 집중합니다. 실제 애플리케이션은 두 기술을 함께 사용합니다.

| 작업 유형 | 적합한 기술 | 이유 |
|-----------|-----------|------|
| DOM 조작, 이벤트 처리 | **JavaScript** | DOM API는 WASM에서 직접 접근 불가 |
| CPU 집약적 연산 | **WASM** | 네이티브 성능, 타입 오버헤드 없음 |
| 네트워크 요청 | **JavaScript** | fetch/XMLHttpRequest는 JS에서 더 편리 |
| 게임 물리 엔진 | **WASM** | 60fps 유지에 필수 |
| UI 렌더링 | **JavaScript + WASM** | JS가 DOM 관리, WASM이 계산 담당 |

### 어떤 언어로 WASM을 개발할 수 있나요? — 언어별 특징과 선택 기준

C, C++, Rust가 가장 성숙한 WASM 타겟입니다. 그 외에도 Go, TypeScript(AssemblyScript), Kotlin, Python(wasmtime), C#, Swift 등 다양한 언어가 WASM을 지원합니다.

| 언어 | 도구 체인 | WASM 성숙도 | 적합 분야 |
|------|---------|-----------|----------|
| **Rust** | wasm-pack, wasm-bindgen | ⭐⭐⭐⭐⭐ | 고성능, 안전, Web/Edge |
| **C/C++** | Emscripten | ⭐⭐⭐⭐⭐ | 레거시 포팅, 게임 엔진 |
| **Go** | Go 1.11+ | ⭐⭐⭐⭐ | 서버/CLI, WASI 환경 |
| **AssemblyScript** | asc | ⭐⭐⭐ | TypeScript 개발자, 빠른 프로토타입 |
| **Python** | pyodide, wasmtime | ⭐⭐⭐ | 데이터 사이언스, 교육 |

### WASM은 어디서 실행되나요? — 브라우저 밖으로의 확장

초기에는 브라우저 전용이었지만, 현재는 **5가지 주요 환경**으로 확장되었습니다.

1. **브라우저** — Chrome/Firefox/Safari/Edge (2017~) — 게임, 이미지 처리
2. **서버 (WASI)** — wasmtime, Wasmer (2019~) — 플러그인 시스템, 엣지 함수
3. **엣지 컴퓨팅** — Cloudflare Workers, Fastly Compute (2020~) — 1ms 콜드 스타트
4. **임베디드/IoT** — WAMR (500KB) — MCU, ESP32, FreeRTOS
5. **블록체인** — Ethereum 스마트 컨트랙트 (eWASM)

### WASM의 메모리 안전성은 어떻게 보장되나요?

WASM의 메모리 모델은 **선형 메모리(Linear Memory)**라는 단순한 배열로 구성됩니다. WASM 모듈은 이 선형 메모리만 읽고 쓸 수 있으며, 호스트 프로세스의 메모리에는 접근할 수 없습니다. C/C++의 `포인터 연산`처럼 임의 주소에 접근하는 행위가 언어 수준에서 차단됩니다. 따라서 **버퍼 오버플로우, Use-After-Free 같은 메모리 취약점이 WASM 경계 내에서는 발생하지 않습니다.**

---

## 요약 — WASM 이해의 핵심

- **정의**: C/C++/Rust 등 저수준 언어를 브라우저에서 실행하는 **바이너리 명령어 포맷**
- **성능**: JavaScript보다 1.2~5배 빠름 (AOT 컴파일, 타입 오버헤드 없음)
- **파싱 속도**: JavaScript의 **1/10** (바이너리 포맷, 스트리밍 컴파일)
- **크기**: 동일 로직 JavaScript의 **20~30%** (10MB vs 2~3MB)
- **역할**: JavaScript를 **대체가 아닌 보완** — DOM/이벤트는 JS, 연산은 WASM
- **실행 환경**: 브라우저 → 서버(WASI) → 엣지 → 임베디드 → 블록체인
- **메모리 안전성**: 선형 메모리 모델로 **버퍼 오버플로우 원천 차단**
