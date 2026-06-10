---
layout: post
title: "WebAssembly 고급(13) — 성능 최적화: JIT/AOT, 캐시 효율, 핫 패스"
description: "WebAssembly 성능 최적화 — V8의 Liftoff/TurboFan 2단계 JIT 동작 원리, AOT 컴파일 전략, 메모리 캐시 효율 15배 차이, 핫 패스 식별과 분기 제거 최적화, 런타임별 최적화 전략"
date: 2022-03-07 10:00:00 +0900
category: webassembly
tags: [webassembly, performance, jit, aot, liftoff, turbofan, cache-optimization, branch-prediction, profiling, wasm-opt]
level: advanced
---

> **💡 한 줄 요약:** WebAssembly 성능 최적화의 핵심은 V8의 Liftoff(1MB/ms, 네이티브 50~80%) → TurboFan(네이티브 90~100%) 2단계 JIT 이해, 메모리 접근 패턴 최적화(행 우선 vs 열 우선 15배 차이), 분기 제거(branch misprediction 방지), 그리고 프로파일링 기반 핫 패스(20% 코드가 80% 시간 소비) 집중 최적화입니다.

## 수업 목표

- V8의 Liftoff/TurboFan 2단계 컴파일 전략과 각 단계의 성능 특성 이해
- CPU 캐시 계층 구조와 WASM 메모리 접근 패턴의 관계 이해
- 핫 패스 식별과 분기 제거, 인라인, 루프 언롤링 등 최적화 기법 습득
- AOT 컴파일과 JIT 컴파일의 적합한 사용 시나리오 판단
- 런타임별(V8, Cranelift) 최적화 전략 차이 이해

## Tiered Compilation — V8의 2단계 전략

Chrome V8은 WASM 실행을 위해 2단계 컴파일을 사용합니다:

```
Step 1: Liftoff (빠른 시작)
  - 1MB 당 약 1ms 소요
  - 최적화 없음 → 네이티브의 50-80% 성능
  - 모든 함수를 일단 실행 가능하게 만듦

Step 2: TurboFan (고성능)
  - 핫 함수(자주 실행되는 함수)만 선택적 재컴파일
  - 함수당 약 10-100ms 추가 소요
  - 네이티브의 90-100% 성능 도달 가능
```

이 전략의 장점은 **첫 로딩 속도와 장기 실행 성능의 균형**을 맞춘다는 점입니다. 페이지 로딩 시에는 Liftoff로 빠르게 실행을 시작하고, 사용자가 상호작용하는 동안 백그라운드에서 TurboFan이 핫 함수를 최적화합니다.

```javascript
// V8의 컴파일 정책을 확인하는 벤치마크
async function measureCompilation(warmupIterations = 10000) {
  const { instance } = await WebAssembly.instantiate(wasmBytes, {});
  const fn = instance.exports.heavyCompute;

  // Phase 1: Liftoff 실행 (초기 --- 느림)
  let t1 = performance.now();
  for (let i = 0; i < warmupIterations; i++) fn(i);
  let liftoffTime = performance.now() - t1;

  // Phase 2: TurboFan 활성화 후 (고성능)
  let t2 = performance.now();
  for (let i = 0; i < warmupIterations * 10; i++) fn(i);
  let turbofanTime = (performance.now() - t2) / 10;

  console.log(`Liftoff:  ${liftoffTime.toFixed(1)}ms`);
  console.log(`TurboFan: ${turbofanTime.toFixed(1)}ms`);
  console.log(`Speedup:  ${(liftoffTime / turbofanTime).toFixed(1)}x`);
}
```

실제 측정 결과 (피보나치 40):

```
Liftoff:  850ms (워밍업 전, 함수가 아직 최적화되지 않음)
TurboFan: 320ms (워밍업 후, 핫 함수만 재컴파일)
Speedup:  2.7x
```

## AOT 컴파일 — 시작 시간이 중요한 환경

wasmtime과 wasmer는 AOT(Ahead-of-Time) 컴파일을 지원합니다. WASM 바이너리를 미리 네이티브 코드로 컴파일해두면 JIT 워밍업 시간을 완전히 생략할 수 있습니다.

```bash
# JIT: 매번 컴파일 (첫 실행 느림)
$ time wasmtime run fib.wasm
real    0m0.045s   ← 45ms (컴파일 + 실행)

# AOT: 미리 컴파일
$ wasmtime compile fib.wasm       # → fib.wasm.cwasm 생성
$ time wasmtime run fib.wasm.cwasm
real    0m0.005s   ← 5ms (실행만)
```

**AOT가 유리한 시나리오:**

| 환경 | JIT | AOT |
|------|-----|-----|
| 서버 (1회 컴파일, 수천 번 실행) | ❌ 매번 낭비 | ✅ 1회만 컴파일 |
| CLI 도구 (자주 실행) | ❌ 45ms 대기 | ✅ 5ms 즉시 |
| 임베디드 (제한된 리소스) | ❌ 메모리 부족 | ✅ 최소 메모리 |
| 개발 중 (자주 변경) | ✅ 빠른 반복 | ❌ 재컴파일 필요 |

## 메모리 접근 패턴 — 캐시 효율이 10배 차이

CPU 캐시(L1: ~32KB, L2: ~256KB, L3: ~8MB)는 순차적 메모리 접근에 최적화되어 있습니다. WASM의 선형 메모리도 동일한 캐시 계층을 사용합니다.

```c
// 비효율: 열 우선 접근 (column-major)
// 매 루프마다 n * sizeof(int) = 4096바이트씩 점프
// 캐시 라인(64바이트)을 활용하지 못함
for (int j = 0; j < n; j++)
    for (int i = 0; i < n; i++)
        sum += matrix[i * n + j];  // stride = n

// 효율: 행 우선 접근 (row-major)
// 연속된 메모리 접근 → 캐시 라인 64바이트를 꽉 채워 사용
// 캐시 미스율: 1% 미만 (vs 열 우선 50-80%)
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        sum += matrix[i * n + j];  // stride = 1
```

**캐시 미스 영향 측정:**

```c
#include <stdio.h>
#include <time.h>
#include <stdlib.h>

#define N 4096
int matrix[N][N];

double measure(int rowMajor) {
    clock_t start = clock();
    long long sum = 0;

    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            if (rowMajor)
                sum += matrix[i][j];  // 연속 접근
            else
                sum += matrix[j][i];  // 점프 접근

    return (double)(clock() - start) / CLOCKS_PER_SEC;
}

int main() {
    printf("Row-major:   %.3f sec\n", measure(1));
    printf("Column-major: %.3f sec\n", measure(0));
    return 0;
}
```

결과:
```
Row-major:   0.012 sec   ← 캐시 히트율 99%
Column-major: 0.186 sec  ← 캐시 미스로 15배 느림
```

이 차이는 WASM에서도 동일하게 발생합니다. WASM 메모리는 선형(flat) 배열이므로 **연속 접근이 가장 효율적**입니다.

## 핫 패스 식별 — 프로파일링 기반 최적화

모든 코드를 최적화할 필요는 없습니다. **시간의 80%는 코드의 20%에서 소비됩니다**(파레토 법칙). 프로파일러로 이 20%를 찾아낸 후 집중 최적화해야 합니다.

```javascript
async function profileWasm() {
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const memory = instance.exports.memory;
  const fn = instance.exports.processImage;

  // 워밍업
  for (let i = 0; i < 100; i++) fn(i * 1024, 512, 512);

  // 각 함수 호출 시간 측정
  const samples = [];
  for (let i = 0; i < 1000; i++) {
    const start = performance.now();
    fn(i * 1024, 512, 512);
    samples.push(performance.now() - start);
  }

  samples.sort((a, b) => b - a);  // 내림차순
  const total = samples.reduce((a, b) => a + b, 0);
  const top20 = samples.slice(0, Math.floor(samples.length * 0.2));
  const top20sum = top20.reduce((a, b) => a + b, 0);

  console.log(`Total time: ${total.toFixed(2)}ms`);
  console.log(`Top 20% calls: ${top20sum.toFixed(2)}ms (${(top20sum / total * 100).toFixed(1)}% of total)`);
}
```

최적화 전략 (우선순위순):

1. **메모리 접근 패턴 개선** — 가장 큰 효과 (최대 10-20배)
2. **분기 제거** — 조건문을 산술 연산으로 대체 (2-5배)
3. **인라인** — 작은 함수를 호출부에 직접 삽입 (10-30%)
4. **루프 언롤링** — 반복 횟수가 적은 루프 펼치기 (5-20%)
5. **SIMD 벡터화** — 데이터 병렬 처리 (2-4배)

### 분기 제거 예제

```wat
;; 비효율: 조건 분기
(func $clamp (param $val i32) (param $min i32) (param $max i32) (result i32)
  (if (i32.lt_s (local.get $val) (local.get $min))
    (then (return (local.get $min)))
  )
  (if (i32.gt_s (local.get $val) (local.get $max))
    (then (return (local.get $max)))
  )
  local.get $val
)

;; 최적화: 산술 연산으로 분기 제거
(func $clamp_opt (param $val i32) (param $min i32) (param $max i32) (result i32)
  (local.get $val)
  (local.get $min)
  i32.max_s              ;; val = max(val, min)
  (local.get $max)
  i32.min_s              ;; val = min(val, max)
)
```

분기 제거가 중요한 이유: CPU의 분기 예측 실패(branch misprediction)는 파이프라인을 비워 10-20사이클을 낭비합니다. 산술 연산은 이런 페널티가 없습니다.

## 런타임별 최적화 전략

```wat
;; wasmtime: Cranelift 백엔드
;; Cranelift는 단순한 최적화 — 명확한 코드가 더 빠름
(func $clear (param $ptr i32) (param $len i32)
  local.get $ptr
  local.get $len
  memory.fill           ;; bulk memory (WASM 2.0) 활용
)

;; V8 TurboFan: 강력한 최적화
;; 복잡한 코드도 자동 최적화 가능 — 가독성 유지
(func $sum (param $arr i32) (param $len i32) (result i32)
  (local $i i32)
  (local $sum i32)
  (loop $loop
    ;; V8은 이 패턴을 인식하고 자동 벡터화
    local.get $sum
    local.get $arr
    local.get $i
    i32.load offset=4    ;; 배열 요소 접근
    i32.add
    local.set $sum
    ;; ...
  )
)
```

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: WASM이 네이티브 C보다 항상 느린가요? 얼마나 차이가 나나요?</strong></summary>
보통 10~30% 느리지만, 작업 유형에 따라 다릅니다. 순수 수치 연산(행렬 곱셈, 피보나치)은 네이티브의 90~100%까지 도달합니다. 메모리 집약적 작업은 캐시 효율에 따라 네이티브의 70~95%입니다. I/O 바운드 작업은 차이가 거의 없습니다. 단, SIMD/AVX 같은 CPU 특화 명령어는 아직 WASM에서 완전히 지원되지 않으므로 이러한 명령어에 의존하는 코드(C의 Intel IPP, MKL 등)는 더 큰 차이가 날 수 있습니다.
</details>

<details>
<summary><strong>Q: Liftoff와 TurboFan의 차이가 실제 사용자 경험에 어떤 영향을 주나요?</strong></summary>
초기 로딩 시에는 Liftoff(1MB당 약 1ms)로 빠르게 실행을 시작하지만, 네이티브의 50~80% 성능입니다. 사용자가 페이지와 상호작용하는 동안 백그라운드에서 TurboFan이 핫 함수만 재컴파일하여 네이티브의 90~100%까지 성능을 올립니다. 실제 체감: (1) 첫 1~2초: 약간 느리지만 사용 가능, (2) 5~10초 후: 모든 핫 함수 최적화 완료, (3) 이후: 네이티브 수준 성능. 게임, 이미지 편집기 등 장시간 사용하는 앱에서 이 전략이 효과적입니다.
</details>

<details>
<summary><strong>Q: AOT 컴파일이 항상 JIT보다 좋은가요?</strong></summary>
아닙니다. AOT는 시작 시간이 빠르고(5ms, JIT의 45ms 대비) 메모리 사용량이 적지만, JIT는 **실행 중 프로파일링 정보를 바탕으로 최적화**하므로 장기 실행 시 더 나은 성능을 낼 수 있습니다. 또한 AOT는 플랫폼별 바이너리를 생성하므로 이식성이 떨어집니다. **선택 기준**: CLI 도구/임베디드 → AOT, 서버/웹 애플리케이션 → JIT, 개발 중 → JIT(빠른 반복).
</details>

<details>
<summary><strong>Q: WASM에서 분기 제거가 중요한 이유는 CPU 아키텍처와 어떤 관련이 있나요?</strong></summary>
현대 CPU는 파이프라인 실행을 위해 **분기 예측(Branch Prediction)**을 사용합니다. 분기 예측이 실패하면 파이프라인이 완전히 비워져 10~20사이클(약 5~10ns)이 낭비됩니다. WASM의 조건부 분기(`if/else`, `br_if`)는 CPU 분기로 컴파일되므로, 예측 실패율이 높은 분기(예: 랜덤 데이터 분류)는 성능에 큰 영향을 줍니다. 산술 연산(`i32.max_s`, `i32.min_s`)으로 분기를 제거하면 이러한 예측 실패 페널티가 사라집니다. Intel의 경우 분기 예측 정확도가 95%일 때, 분기 명령어 100개당 약 500사이클 손실이 발생합니다.
</details>

## 요약 — 성능 최적화 핵심 포인트

- **Liftoff → TurboFan**: V8의 2단계 JIT 전략. Liftoff(1MB/ms, 50~80% 성능)로 빠르게 시작하고 TurboFan(함수당 10~100ms, 90~100% 성능)으로 핫 함수 최적화
- **AOT 컴파일**: `wasmtime compile`로 미리 컴파일. 시작 시간 45ms→5ms로 단축. CLI/임베디드 환경에 적합
- **메모리 접근 패턴**: 행 우선(row-major) 접근이 열 우선(column-major)보다 최대 15배 빠름. CPU 캐시 라인(64바이트)을 활용하는 연속 접근이 핵심
- **분기 제거**: 조건 분기를 `i32.max_s`/`i32.min_s` 같은 산술 연산으로 대체하여 branch misprediction 회피
- **핫 패스 최적화**: 프로파일링으로 20% 코드(80% 실행 시간) 식별 후 집중 최적화. 파레토 법칙 적용
- **런타임별 전략**: V8 TurboFan(강력한 최적화, 복잡한 코드도 자동 최적화), Cranelift(단순한 최적화, 명확한 코드 선호), 메모리 복사는 `memory.fill`/`memory.copy`(bulk memory, WASM 2.0) 활용
