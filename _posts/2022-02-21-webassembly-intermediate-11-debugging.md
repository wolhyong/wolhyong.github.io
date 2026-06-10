---
layout: post
title: "WebAssembly 중급(11) — 디버깅(debugging): Chrome DevTools, 소스 맵, DWARF, 브레이크포인트"
description: "WebAssembly 디버깅 실무 안내 — Chrome DevTools WASM 디버깅 설정, 소스 맵(Source Maps)과 DWARF 정보, 브레이크포인트/스텝 실행, 메모리 상태 검사, 프로파일링, 성능 분석"
date: 2022-02-21 10:00:00 +0900
category: webassembly
tags: [webassembly, debugging, chrome-devtools, source-maps, dwarf, breakpoint, profiling, memory-inspector, wasm-debug]
level: intermediate
---

> **💡 한 줄 요약:** WebAssembly 디버깅은 Chrome DevTools의 WASM 지원, 소스 맵(Source Maps)을 통한 원본 소스 매핑, DWARF 디버그 정보를 통한 변수 검사, 그리고 WABT의 바이너리 분석 도구를 조합하여 수행합니다. JavaScript 디버깅보다 제약이 많지만, 최신 도구(Chrome 120+)로 많이 개선되었습니다.

## WebAssembly 디버깅이 어려운 이유

WebAssembly의 디버깅이 JavaScript보다 어려운 데는 세 가지 근본적인 이유가 있습니다:

1. **중간 표현(IR)**: WASM은 고수준 언어(C/Rust)와 기계어 사이의 중간 표현입니다. 원본 변수명, 함수명, 타입 정보가 대부분 사라집니다.
2. **샌드박스**: WASM은 가상 머신에서 실행되므로, 전통적인 GDB/LLDB 같은 네이티브 디버거로 접근할 수 없습니다.
3. **다중 언어**: C++ → Emscripten → WASM 또는 Rust → LLVM → WASM 등 여러 변환 단계를 거치므로, 각 단계에서 정보가 손실됩니다.

이러한 한계를 극복하기 위해 **소스 맵(Source Map)**과 **DWARF(Debugging With Attributed Record Formats)** 정보를 활용합니다.

---

## 수업 목표

- Chrome DevTools에서 WASM 디버깅을 설정하고 사용하는 방법 습득
- 소스 맵과 DWARF 디버그 정보의 역할과 생성 방법 이해
- 브레이크포인트 설정, 스텝 실행, 변수 검사 기술 습득
- WABT를 활용한 바이너리 레벨 분석 방법 이해
- 성능 프로파일링과 메모리 분석 도구 사용법 습득

---

## 1. Chrome DevTools WASM 디버깅

Chrome 120+ 버전부터 WebAssembly 디버깅이 크게 개선되었습니다.

### 1.1 기본 설정

```bash
# Emscripten: DWARF 디버그 정보 포함 빌드
emcc -g4 -O0 source.c -o output.js
# -g4: 전체 DWARF 디버그 정보 + 소스 맵
# -O0: 최적화 없음 (디버깅에 필수)

# wasm-pack: 디버그 빌드
wasm-pack build --debug --target web
# --debug: DWARF 정보 포함, 최적화 없음
```

```javascript
// Chrome DevTools에서 WASM 디버깅 활성화
// 1. F12 → Sources 탭
// 2. Page 탭에서 .wasm 파일 찾기
// 3. 우클릭 → "Add source map..." 선택
// 4. .wasm.map 파일 경로 입력

// 또는 Experiments에서 WASM 디버깅 활성화
// chrome://flags/#enable-webassembly-debugging → Enabled
```

#### 디버그 정보 수준 비교

| 옵션 | 포함 정보 | 바이너리 크기 | 디버깅 가능 |
|------|----------|-------------|-----------|
| `-g0` | 없음 | 100% (기준) | 함수명만 |
| `-g1` | 함수명, 줄 번호 | 110~120% | 소스 라인 추적 |
| `-g2` | + 지역 변수, 타입 | 130~150% | 변수 검사 |
| `-g3` | + 매크로, 인라인 정보 | 150~200% | 전체 디버깅 |
| `-g4` | + DWARF + 소스 맵 | 200~300% | 원본 소스 레벨 디버깅 |

> **🔬 깊이 있는 설명 — DWARF 정보의 구조와 한계:** DWARF(Debugging With Attributed Record Formats)는 원본 소스 코드와 컴파일된 바이너리 간의 매핑 정보를 포함합니다. 변수명, 타입, 함수 시그니처, 소스 라인 번호를 포함합니다. WASM에서 DWARF의 한계: (1) **최적화된 변수**(레지스터에만 존재하는 변수)는 검사할 수 없음, (2) **인라인 함수**의 호출 스택이 원본과 다를 수 있음, (3) DWARF 정보로 인해 WASM 바이너리 크기가 2~3배 증가함. 프로덕션 배포 시에는 `wasm-strip`으로 DWARF 정보를 제거해야 합니다.

---

### 1.2 브레이크포인트와 스텝 실행

```rust
// Rust — 디버깅 예제
#[wasm_bindgen]
pub fn calculate_stats(data: &[i32]) -> Stats {
    // 브레이크포인트를 여기에 설정
    let sum: i32 = data.iter().sum();
    let count = data.len() as i32;
    let mean = sum / count;
    
    // 이 부분을 스텝 오버/스텝 인
    let variance: f64 = data.iter()
        .map(|x| (*x as f64 - mean as f64).powi(2))
        .sum::<f64>() / count as f64;
    
    let std_dev = variance.sqrt();
    
    Stats { sum, mean, std_dev }
}
```

```javascript
// JavaScript — 디버깅 호출
import init, { calculate_stats } from './pkg/stats.js';

await init();
const data = new Int32Array([10, 20, 30, 40, 50]);

// 여기서 breakpoint 설정 후 Step Into
const result = calculate_stats(data);
console.log(result);
```

#### Chrome DevTools WASM 디버깅 단축키

| 동작 | 단축키 | 설명 |
|------|-------|------|
| **계속 실행** | F8 | 다음 브레이크포인트까지 실행 |
| **Step Over** | F10 | 현재 함수 내에서 다음 줄로 (함수 호출은 건너뜀) |
| **Step Into** | F11 | 함수 호출 내부로 진입 |
| **Step Out** | Shift+F11 | 현재 함수 끝까지 실행 후 반환 |
| **브레이크포인트 설정** | 클릭 | 줄 번호 클릭으로 토글 |
| **조건부 브레이크포인트** | 우클릭 | 조건식을 입력 (예: `i > 10`) |

---

## 2. WABT를 활용한 바이너리 분석

WASM 바이너리를 직접 분석해야 할 때는 WABT 도구를 사용합니다.

```bash
# 1. WASM 바이너리를 WAT 텍스트로 변환
wasm2wat module.wasm -o module.wat

# 2. 바이너리 구조 분석
wasm-objdump -x module.wasm

# 출력 예시:
#
# module.wasm:	file format wasm 0x1
#
# Section Details:
# 
# Type[12]:
#  - type[0] (i32) -> (i32)
#  - type[1] (i32, i32) -> (i32)
#  ...
# 
# Function[45]:
#  - func[0] sig=0  <add>
#  - func[1] sig=1  <multiply>
#  ...
# 
# Memory[1]:
#  - memory[0] pages: initial=1 max=256
#
# Table[1]:
#  - table[0] type=funcref initial=10 max=20

# 3. 특정 함수의 WAT 코드만 추출
wasm2wat --enable-all module.wasm | less

# 4. WASM 유효성 검사
wasm-validate module.wasm
# module.wasm: OK

# 5. 디버그 정보 추출
wasm-objdump -d -x module.wasm > module_dump.txt
```

---

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Chrome DevTools에서 WASM 함수에 브레이크포인트를 설정하는 방법은?</strong></summary>
Sources 탭에서 Page → wasm:// 또는 wasm 파일을 찾습니다. WASM 모듈이 로드된 후에야 표시되므로, 페이지를 새로고침해야 할 수 있습니다. WASM 파일을 열면 WAT 디스어셈블리 코드가 표시됩니다. 여기서 원하는 함수나 특정 명령어 줄에 클릭하여 브레이크포인트를 설정합니다. 또는 JavaScript 코드에서 `debugger;`를 WASM 호출 앞에 추가하는 방법도 있습니다.
</details>

<details>
<summary><strong>Q: 소스 맵(Source Map) 없이도 디버깅할 수 있나요?</strong></summary>
네, 가능합니다. 소스 맵 없이도 Chrome DevTools는 WASM 바이너리를 WAT(텍스트 포맷)로 디스어셈블리하여 표시합니다. 함수명(export된 것만)과 WASM 명령어 레벨에서 브레이크포인트를 설정할 수 있습니다. 하지만 변수명은 i32, f64 등 타입만 표시되고, 원본 C/Rust 코드의 변수명은 보이지 않습니다. **권장**: 개발 시에는 소스 맵 포함 빌드를, 프로덕션 배포 시에는 제거하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: 프로덕션 WASM에서 디버그 정보를 제거해야 하나요?</strong></summary>
네, 반드시 제거해야 합니다. DWARF 정보는 WASM 바이너리 크기를 2~3배 증가시키고, 내부 구현 구조를 노출하여 보안 위험이 될 수 있습니다. `wasm-strip` 도구로 디버그 섹션을 제거할 수 있습니다: `wasm-strip module.wasm -o module_stripped.wasm`. 또는 wasm-opt를 사용해도 디버그 정보가 제거됩니다.
</details>

<details>
<summary><strong>Q: Rust의 panic!이나 unwrap()으로 인한 WASM 크래시를 디버깅하는 방법은?</strong></summary>
Rust 코드에서 `console_error_panic_hook` 크레이트를 사용하면 panic 발생 시 JavaScript 콘솔에 스택 트레이스를 출력할 수 있습니다. `wasm-pack new`로 생성된 프로젝트에는 기본 포함되어 있습니다. `#[wasm_bindgen]` 함수 내에서 `set_panic_hook()`을 호출하면 됩니다. 또한 Chrome DevTools의 Console 탭에서 WASM 관련 에러 메시지를 확인할 수 있습니다.
</details>

---

## 3. 성능 프로파일링

### 3.1 Chrome DevTools Performance 탭

```javascript
// JavaScript — WASM 성능 측정
import init, { heavyComputation } from './pkg/perf_test.wasm';

async function benchmark() {
    await init();
    
    console.time('WASM');
    for (let i = 0; i < 1000; i++) {
        heavyComputation(i);
    }
    console.timeEnd('WASM');
    
    // JavaScript 동일 함수와 비교
    console.time('JS');
    for (let i = 0; i < 1000; i++) {
        jsHeavyComputation(i);
    }
    console.timeEnd('JS');
}

// Chrome DevTools > Performance 탭 > Record
// 1. Record 버튼 클릭
// 2. benchmark() 실행
// 3. Stop 버튼 클릭
// 4. Main 스레드 트레이스에서 WASM 실행 구간 확인
// 5. Call Tree 탭에서 WASM 함수별 CPU 시간 확인
```

#### 프로파일링 메트릭

| 메트릭 | 설명 | WASM 우수사례 | JS 우수사례 |
|-------|------|--------------|-----------|
| **CPU 시간** | 함수 실행에 소요된 CPU 시간 | 계산 집약적 작업 >100ms | DOM 조작, I/O |
| **호출 횟수** | 함수가 호출된 총 횟수 | 수학/알고리즘 연산 | 이벤트 핸들러 |
| **Self Time** | 함수 본체 실행 시간 (하위 함수 제외) | 순수 연산 | API 호출 |
| **메모리 할당** | 함수 실행 중 할당된 메모리 | 버퍼 작업 | 객체 생성 |
| **GC 시간** | 가비지 컬렉션에 소요된 시간 | 0 (WASM은 GC 없음) | 변동 큼 |

> **🔬 깊이 있는 설명 — WASM 프로파일링이 JavaScript와 다른 점:** JavaScript 프로파일링은 V8 엔진이 Inline Cache, JIT 컴파일 최적화 등을 동적으로 적용하므로 측정할 때마다 결과가 다를 수 있습니다. 반면 WASM은 **AOT(Ahead-of-Time)** 컴파일되므로 한 번 컴파일된 후에는 실행 시간이 매우 일정합니다. WASM 프로파일링의 핵심은 (1) WASM ↔ JS 간 호출 경계에서의 오버헤드 측정, (2) 메모리 접근 패턴 분석, (3) `memory.grow` 호출 빈도 확인입니다.

---

## 요약 — 디버깅 핵심 포인트

- **Chrome DevTools**: Sources 탭에서 WASM 브레이크포인트/스텝 실행 가능 (소스 맵 필요)
- **DWARF 정보**: `-g4`(Emscripten) 또는 `--debug`(wasm-pack)로 포함, 프로덕션 시 제거
- **WABT**: `wasm2wat`(바이너리→텍스트), `wasm-objdump`(구조 분석), `wasm-validate`(유효성 검사)
- **프로파일링**: Performance 탭에서 WASM 함수별 CPU 시간 측정, GC 없는 WASM의 장점
- **한계 인식**: WASM 디버깅은 JavaScript보다 제약이 많음 → 최적화 없이(-O0) 빌드하고 디버그
- **실전 팁**: `console_error_panic_hook`(Rust)로 패닉 메시지 확인, `debugger;`로 JS 레벨 중단

**다음 강의 예고:** 중급 12강에서는 **WASI(WebAssembly System Interface)** — 파일 시스템, 네트워크, 시계, 난수 생성 등 WASM이 OS 기능에 접근하는 방법을 다룹니다.
