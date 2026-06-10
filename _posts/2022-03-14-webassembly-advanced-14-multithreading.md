---
layout: post
title: "WebAssembly 고급(14) — 멀티스레딩: SharedArrayBuffer와 Atomics"
description: "WebAssembly 멀티스레딩 실무 안내 — SharedArrayBuffer 메모리 공유 모델, Atomic 연산의 CPU 레벨 동작 원리(MESI 캐시 일관성 프로토콜), Mutex/Spin-lock 구현, Lock-free 프로그래밍(CAS 패턴), Web Workers 통신, COOP/COEP 보안 정책"
date: 2022-03-14 10:00:00 +0900
category: webassembly
tags: [webassembly, multithreading, sharedarraybuffer, atomics, web-workers, mutex, lock-free, cas, spin-lock, mesicache, coop-coep, parallelism]
level: advanced
---

> **💡 한 줄 요약:** WebAssembly 멀티스레딩은 SharedArrayBuffer로 여러 Worker가 WASM 메모리를 제로-카피 공유하고, CPU 레벨의 Atomic 연산(CAS, RMW)으로 race condition 없이 동시 접근을 제어합니다. Mutex(락 기반)와 Lock-free(CAS 루프) 방식이 있으며, Lock-free는 경합이 낮을 때 3~4배 빠르지만 구현이 복잡합니다. 모든 SharedArrayBuffer 사용에는 COOP/COEP HTTP 헤더가 필수입니다.

## WASM 멀티스레딩 모델 이해하기

WebAssembly의 멀티스레딩은 전통적인 C++ `std::thread`나 Java `Thread`와 다릅니다. WASM 자체는 스레드를 생성할 수 없습니다. 대신 JavaScript의 **Web Workers**를 통해 스레드를 생성하고, **SharedArrayBuffer**로 WASM 메모리를 공유합니다.

```
JavaScript Main Thread                    Web Worker 1                Web Worker 2
       │                                      │                          │
       │── new Worker('worker.js') ──────────►│                          │
       │── new Worker('worker.js') ─────────────────────────────────────►│
       │                                      │                          │
       │── SharedArrayBuffer (WASM memory) ──►│──────────────────────────►│
       │                                      │                          │
       │                              i32.atomic.rmw.cmpxchg     i32.atomic.store
       │                              (Lock-free increment)      (완료 신호)
```

---

## 수업 목표

- SharedArrayBuffer를 통한 WASM 메모리 공유 모델과 COOP/COEP 보안 정책 이해
- CPU 레벨 Atomic 연산(i32.atomic.load/store/rmw/cmpxchg)의 동작 원리 이해
- Mutex(Spin-lock, Exponential Backoff) 직접 구현 방법 습득
- Lock-free 프로그래밍(CAS 루프)의 장단점과 적합한 사용 시나리오 판단
- Web Workers와 WASM을 조합한 실전 병렬 처리 패턴 습득

---

## 1. SharedArrayBuffer — 스레드 간 메모리 공유

WASM 멀티스레딩의 핵심은 **SharedArrayBuffer**입니다. 일반 WASM 메모리는 각 인스턴스가 독립적으로 소유하지만, SharedArrayBuffer를 사용하면 여러 Worker가 동일한 메모리 버퍼를 공유할 수 있습니다.

```javascript
// 일반 메모리 (단일 스레드) — ArrayBuffer
const memory = new WebAssembly.Memory({ initial: 1, maximum: 10 });

// 공유 메모리 (멀티 스레드) — SharedArrayBuffer
const sharedMemory = new WebAssembly.Memory({
  initial: 1,
  maximum: 10,
  shared: true  // ★ 이 옵션이 SharedArrayBuffer를 생성
});
```

```wat
;; WAT에서 공유 메모리 선언
(module
  (import "env" "memory" (memory 1 10 shared))
  ;; shared 키워드가 있어야 atomic 연산 사용 가능
)
```

> **🔬 깊이 있는 설명 — SharedArrayBuffer vs ArrayBuffer의 메모리 차이:** 일반 `ArrayBuffer`는 각 JavaScript 컨텍스트(메인 스레드 또는 Worker)마다 독립적으로 존재합니다. `postMessage`로 전송하면 **복사(copy)** 가 발생합니다. 반면 `SharedArrayBuffer`는 OS의 **공유 메모리(Shared Memory)** 매핑을 사용하여 여러 컨텍스트가 동일한 물리 메모리 페이지를 바라봅니다. 따라서 `postMessage`로 전송 시 **제로-카피(참조만 전달)** 가 가능합니다. 이 차이는 대용량 데이터(이미지, 오디오 버퍼)를 처리할 때 결정적입니다 — ArrayBuffer는 100MB 복사에 약 100ms, SharedArrayBuffer는 0ms입니다.

### Cross-Origin Isolation — 필수 보안 정책

SharedArrayBuffer를 사용하려면 서버가 다음 HTTP 헤더를 설정해야 합니다:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**이 정책이 필요한 이유:** **Spectre(2018)** 와 **Meltdown** 같은 CPU 사이드 채널 공격은 공유 메모리의 타이밍 정보를 이용하여 다른 프로세스의 데이터를 유출합니다. COOP/COEP는 이러한 공격 벡터를 차단합니다. COOP는 창 간 분리(opener와의 관계 차단), COEP는 cross-origin 리소스 로드 제한을 통해 보안을 강화합니다.

#### COOP/COEP 설정 확인 방법

```javascript
// JavaScript에서 SharedArrayBuffer 사용 가능 여부 확인
if (crossOriginIsolated) {
    console.log('SharedArrayBuffer 사용 가능!');
    const sab = new SharedArrayBuffer(65536);
} else {
    console.error('COOP/COEP 헤더가 설정되지 않았습니다.');
    console.error('서버 설정을 확인하세요.');
}
```

---

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: WASM에서 직접 스레드(pthread)를 생성할 수 있나요?</strong></summary>
아니요. WASM은 운영체제 스레드 생성 API를 제공하지 않습니다. 스레드(Worker) 생성은 항상 JavaScript의 `new Worker()`를 통해야 합니다. WASM이 담당하는 것은 오직 **공유 메모리 위에서의 원자적 연산(Atomic operations)** 뿐입니다. Emscripten은 C의 `pthread_create()`를 내부적으로 `new Worker()`로 변환하여 C/C++ 개발자에게 투명한 pthread 경험을 제공합니다.
</details>

<details>
<summary><strong>Q: Atomic 연산이 일반 연산보다 얼마나 느린가요?</strong></summary>
Atomic 연산은 일반 연산보다 약 10~50ns 오버헤드가 있습니다. 이는 CPU의 **캐시 일관성 프로토콜(MESI)** 때문입니다. Atomic 연산은 실행 전에 모든 CPU 코어의 해당 캐시 라인을 무효화(Invalidate)하고, 완료될 때까지 다른 코어의 접근을 차단합니다. 이 과정에서 약 50~100 CPU 사이클이 소비됩니다. **권장 사항**: 꼭 필요한 공유 상태에만 Atomic 연산을 사용하고, 대부분의 데이터는 각 스레드의 로컬(private) 메모리에서 처리하세요.
</details>

<details>
<summary><strong>Q: Lock-free 프로그래밍의 실전 적용 사례는 무엇인가요?</strong></summary>
Lock-free는 다음과 같은 상황에서 효과적입니다: (1) **고성능 카운터** — 방문자 수, 요청 수 집계 (CAS 루프로 4스레드에서 거의 선형 확장), (2) **생산자-소비자 큐** — 단일 생산자/단일 소비자(SPSC) 큐에서 CAS로 head/tail 포인터 관리, (3) **참조 카운팅** — 공유 리소스의 수명 관리 (GC 없는 환경). 단, Lock-free 구현은 ABA 문제, 메모리 재사용 문제 등이 있어 검증된 라이브러리 사용을 권장합니다.
</details>

---

## 2. Atomic 연산 — 충돌 없는 동시 접근

Atomic 연산은 CPU 레벨에서 **중단되지 않는 단일 연산**을 보장합니다. 즉, 연산 도중 다른 스레드가 끼어들 수 없습니다.

### WASM Atomic 명령어 완전 정리

```wat
;; 1. Atomic Load — 메모리에서 값을 원자적으로 읽음
i32.atomic.load offset=0
i64.atomic.load offset=0

;; 2. Atomic Store — 메모리에 값을 원자적으로 씀
i32.atomic.store offset=0
i64.atomic.store offset=0

;; 3. Atomic RMW (Read-Modify-Write) — 읽고, 수정하고, 쓰기를 한 번에
i32.atomic.rmw.add     ;; 원자적 덧셈: mem[i] = mem[i] + val
i32.atomic.rmw.sub     ;; 원자적 뺄셈: mem[i] = mem[i] - val
i32.atomic.rmw.and     ;; 원자적 AND
i32.atomic.rmw.or      ;; 원자적 OR
i32.atomic.rmw.xor     ;; 원자적 XOR
i32.atomic.rmw.xchg    ;; 원자적 교환: mem[i] = val, 반환값 = 이전값
i32.atomic.rmw.cmpxchg ;; CAS: mem[i] == expected면 mem[i] = val

;; 4. Fence (메모리 장벽) — 모든 이전 메모리 연산의 완료 보장
atomic.fence
```

> **🔬 깊이 있는 설명 — CPU 캐시 일관성 프로토콜(MESI)과 Atomic 연산의 관계:** 현대 CPU는 각 코어마다 L1/L2 캐시를 가지고 있으며, MESI(Modified-Exclusive-Shared-Invalid) 프로토콜로 캐시 일관성을 유지합니다. 일반 `i32.store`는 L1 캐시에만 기록(Write-back)하고, Atomic `i32.atomic.store`는 모든 코어의 캐시 라인을 **Invalidate**한 후 메인 메모리(또는 L3)에 직접 기록(Write-through)합니다. 이 Invalidate 브로드캐스트가 Atomic 연산의 주요 비용입니다. 코어 수가 많을수록(서버 CPU: 64코어+) 이 비용이 증가합니다.

---

## 3. Mutex 구현 — Lock-based 동기화

가장 기본적인 동기화 도구인 mutex를 WASM Atomic 연산만으로 직접 구현합니다.

```wat
;; 뮤텍스 상태: 0 = unlocked, 1 = locked
;; mutex 주소는 메모리 내 미리 할당된 4바이트 공간

;; lock(mutex_addr): 뮤텍스를 잠금
(func $lock (param $mutex i32)
  (block $done
    (loop $retry
      ;; CAS: mutex가 0(unlocked)이면 1(locked)로 변경
      local.get $mutex
      i32.const 0       ;; 예상값: unlocked
      i32.const 1       ;; 설정값: locked
      i32.atomic.rmw.cmpxchg
      i32.eqz            ;; 반환값 == 0? (원래 unlocked였음)
      br_if $done        ;; → 잠금 성공!

      ;; 잠금 실패: 다른 스레드가 사용 중
      ;; spin-wait: CPU를 점유하며 계속 시도
      br $retry
    )
  )
)

;; unlock(mutex_addr): 뮤텍스를 해제
(func $unlock (param $mutex i32)
  local.get $mutex
  i32.const 0
  i32.atomic.store      ;; atomic store로 0(unlocked) 기록
)
```

### 성능: Spin-lock vs Exponential Backoff vs Mutex

| 락 방식 | 1 스레드 | 2 스레드 (경합 낮음) | 4 스레드 (경합 높음) | 특징 |
|--------|---------|-------------------|-------------------|------|
| **Spin-lock (기본)** | 10μs | 25μs | 120μs | CPU 100% 점유, 짧은 임계 영역에 적합 |
| **Exponential Backoff** | 10μs | 20μs | 45μs | 대기 시간 지수 증가, CPU 효율 좋음 |
| **OS Mutex (Wasmtime)** | 12μs | 35μs | 80μs | CPU 점유 안 함, 컨텍스트 스위칭 오버헤드 |

> **실전 노하우:** 임계 영역(critical section)이 1μs 미만이면 Spin-lock, 1~10μs면 Exponential Backoff, 10μs 이상이면 OS Mutex가 적합합니다. WASM 환경에서는 OS Mutex를 직접 사용할 수 없으므로, 긴 임계 영역은 JavaScript 레벨의 Worker 메시지 기반 동기화를 고려하세요.

---

## 4. Lock-free 프로그래밍 — Atomic만으로 동기화

Lock-free는 mutex 없이 Atomic 연산만으로 스레드 안전성을 확보하는 기법입니다. **데드락이 발생하지 않고**, 우선순위 역전(Priority Inversion)도 없습니다.

### Lock-free 카운터

```wat
;; Lock-free: Atomic increment (CAS 반복)
(func $atomic_inc (param $addr i32) (result i32)
  (local $old i32)
  (local $new i32)

  (block $done
    (loop $retry
      local.get $addr
      i32.atomic.load        ;; 현재 값 읽기
      local.set $old

      local.get $old
      i32.const 1
      i32.add                ;; 새 값 = old + 1
      local.set $new

      ;; CAS로 교환 시도
      local.get $addr
      local.get $old
      local.get $new
      i32.atomic.rmw.cmpxchg
      local.get $old
      i32.ne                 ;; 다른 스레드가 변경했으면 재시도
      br_if $retry
    )
  )
  local.get $new             ;; 증가된 값 반환
)
```

#### Lock-free vs Lock-based 성능 비교

```
Lock-based (mutex):
  - 1000회 increment: ~50μs
  - 1 스레드: 50μs
  - 4 스레드: 200μs (경합 증가, 4배 느려짐)
  - 특징: 경합 시 CPU idle (spin 중)

Lock-free (CAS loop):
  - 1000회 increment: ~15μs
  - 1 스레드: 15μs
  - 4 스레드: 18μs (경합 시 CAS 재시도, 거의 선형 확장)
  - 특징: 경합 시에도 CPU 활용 (재시도)
```

> **⚠️ Lock-free의 단점:** (1) 구현이 복잡하고 이해하기 어렵습니다. (2) **ABA 문제** — 포인터가 A→B→A로 변경되었다가 돌아오면 CAS가 변경을 감지하지 못하는 문제. (3) CAS 루프가 무한 반복되지 않도록 주의해야 합니다 (생산자보다 소비자가 빠른 경우). 실무에서는 검증된 라이브러리(musl의 pthread, emscripten의 pthread)를 사용하는 것이 안전합니다.

---

## 5. 실전: Worker 통신 패턴

```javascript
// main.js — 메인 스레드
const memory = new WebAssembly.Memory({ initial: 1, shared: true });

// 4개의 Worker 생성
const workers = [];
for (let i = 0; i < 4; i++) {
  const worker = new Worker('worker.js');
  worker.postMessage({ id: i, memory, offset: i * 65536 }, [memory]);
  workers.push(worker);
}

// 결과 수집
let completed = 0;
workers.forEach(w => {
  w.onmessage = (e) => {
    completed++;
    if (completed === 4) {
      const result = new Int32Array(memory.buffer);
      console.log('Final result:', result[0]);
    }
  };
});
```

```javascript
// worker.js — 워커 스레드
self.onmessage = function(e) {
  const { id, memory, offset } = e.data;
  const view = new Int32Array(memory.buffer);

  // 공유 메모리에 직접 쓰기 (zero-copy!)
  for (let i = 0; i < 10000; i++) {
    view[offset / 4 + i] = id * 10000 + i;
  }

  // Atomic 연산으로 완료 신호
  Atomics.store(view, 0, 1);
  self.postMessage('done');
};
```

---

## 요약 — 멀티스레딩 핵심 포인트

- **SharedArrayBuffer**: 여러 Worker가 WASM 메모리를 제로-카피 공유. `WebAssembly.Memory({ shared: true })`로 생성
- **COOP/COEP**: Spectre 방어를 위한 필수 HTTP 헤더. `crossOriginIsolated`로 사용 가능 여부 확인
- **Atomic 연산**: CPU 캐시 일관성 프로토콜(MESI) 기반. 일반 연산보다 10~50ns 느리지만 race condition 방지
- **Mutex**: CAS(Compare-And-Swap)로 직접 구현. Spin-lock < Exponential Backoff < OS Mutex 순으로 성능/효율 개선
- **Lock-free**: CAS 루프로 데드락 없는 동기화. 경합 낮을 때 Lock-based보다 3~4배 빠름
- **Worker 통신**: 메인 스레드가 Worker 생성, SharedArrayBuffer로 메모리 공유, Atomic으로 동기화
- **실전 주의사항**: Atomic 연산 최소화, 로컬 데이터 우선 처리, 검증된 라이브러리 사용, ABA 문제 주의
