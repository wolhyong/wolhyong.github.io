---
layout: post
title: "Node.js 시작 — JavaScript 런타임의 개념과 설치"
description: "Node.js의 개념, 탄생 배경, 그리고 JavaScript 런타임으로서의 특징을 이해합니다. V8 엔진, 이벤트 루프, 논블로킹 I/O의 핵심 원리를 살펴보고 개발 환경을 설정합니다."
date: 2022-04-18 10:00:00 +0900
category: nodejs
tags: [nodejs, javascript, runtime, v8, event-loop, setup, asynchronous, non-blocking]
level: beginner
---

JavaScript는 원래 브라우저에서만 실행되는 언어였습니다. Node.js는 이 JavaScript를 서버와 로컬 환경에서 실행할 수 있게 해주는 런타임입니다. 2009년 Ryan Dahl이 발표한 이후, Node.js는 백엔드 개발의 주요 도구로 자리 잡았습니다.

> **💡 핵심 정리** ・ Node.js는 V8 JavaScript 엔진 기반의 **서버 사이드 런타임**으로, 이벤트 루프와 논블로킹 I/O를 통해 싱글 스레드에서 높은 동시성을 처리합니다. 동시 연결 10,000개 처리 시 Apache(20GB) 대비 **0.05%의 메모리**(~10MB)만 사용합니다. V8의 2단계 JIT 컴파일(Ignition → TurboFan)로 반복 실행 시 **8~15배 성능 향상**이 가능합니다. 백엔드 API, CLI 도구, 실시간 앱 등 다양한 분야에서 사용됩니다.

> **이 수업에서 배울 내용:** Node.js의 탄생 배경과 C10K 문제 해결 방식, V8 엔진의 JIT 컴파일 원리, 이벤트 루프의 6단계 동작 과정, 첫 번째 Node.js 애플리케이션까지 단계별로 학습합니다.

---

## 📚 수업 목표

- Node.js가 무엇이고 왜 필요한지 이해합니다.
- V8 엔진과 이벤트 루프의 개념을 이해합니다.
- Node.js를 설치하고 개발 환경을 구성합니다.
- 첫 번째 Node.js 프로그램을 실행합니다.

## Node.js란 무엇이고 왜 사용하나요?

Node.js는 **Chrome V8 JavaScript 엔진** 위에서 동작하는 **서버 사이드 JavaScript 런타임**입니다. 브라우저 밖에서 JavaScript를 실행할 수 있게 해주며, 비동기 I/O 처리에 특화되어 있습니다.

```javascript
// 간단한 Node.js 서버 — 단 10줄로 웹 서버 생성
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, Node.js!\n');
});

server.listen(3000, () => {
  console.log('서버가 http://localhost:3000 에서 실행 중');
});
```

**코드 분석 — 한 줄씩 이해하기:**

1. `const http = require('http')`: Node.js 내장 `http` 모듈을 가져옵니다. 이 모듈은 HTTP 서버와 클라이언트를 생성하는 저수준 API를 제공합니다. `require()`는 CommonJS 모듈 시스템의 함수로, 모듈을 한 번만 실행하고 결과를 캐싱합니다.
2. `http.createServer(callback)`: 새로운 HTTP 서버 인스턴스를 생성합니다. 콜백 함수 `(req, res) => {...}`는 **모든 요청**이 들어올 때마다 호출됩니다.
3. `res.writeHead(200, ...)`: HTTP 응답 헤더를 설정합니다. 첫 번째 인자는 상태 코드(200 = OK), 두 번째 인자는 헤더 객체입니다.
4. `res.end('Hello, Node.js!\n')`: 응답 본문을 보내고 연결을 종료합니다. `end()`를 호출하지 않으면 클라이언트는 계속 대기합니다.
5. `server.listen(3000, callback)`: 서버를 3000번 포트에 바인딩합니다. 콜백은 서버가 준비되면 한 번 실행됩니다.

**깊이 있는 설명 — 왜 `http.createServer`가 이벤트 기반으로 동작하나요?**

`http.createServer`에 전달하는 콜백은 **이벤트 리스너**입니다. 내부적으로 Node.js는 다음과 같이 동작합니다:

```
TCP 연결 수신 (OS 커널)
    │
    ▼
libuv가 연결 이벤트 감지
    │
    ▼
이벤트 루프의 poll 단계에서 콜백 실행
    │
    ▼
createServer에 전달한 핸들러 함수 호출
```

이 모델의 장점은 **새 연결마다 스레드를 생성할 필요가 없다**는 것입니다. Apache 같은 전통적인 서버는 요청당 하나의 스레드를 할당하는데(스레드당 약 2MB 메모리), Node.js는 단일 스레드로 모든 요청을 처리합니다. 동시에 10,000개의 연결이 들어와도 추가 메모리는 거의 들지 않습니다.

## Node.js의 탄생 배경 — C10K 문제에서 시작된 혁명

2009년, Ryan Dahl은 Apache HTTP Server의 근본적인 문제점에 주목했습니다. 아파치는 **요청당 하나의 스레드**를 할당하는데, 이 방식은 동시 연결이 많아질수록 다음과 같은 문제가 발생합니다.

```python
# Apache 방식: 요청마다 스레드 할당 (C10K 문제)
# 동시 연결 10,000개 → 스레드 10,000개
# 스레드당 약 2MB → 총 20GB 메모리 필요
# 컨텍스트 스위칭 비용: 초당 수만 번의 CPU 상태 저장/복원
```

**코드 분석 — C10K 문제의 실제 영향:**

동시 연결 10,000개 환경에서 각 방식의 메모리 사용량을 비교해보겠습니다:

```
Apache (스레드 기반):
  메모리: 10,000 스레드 × 2MB = 20,000MB ≈ 20GB
  컨텍스트 스위칭: Linux 기본 타임슬라이스 6ms 기준 초당 166,667번 전환
  → 서버 메모리 32GB 기준으로도 62%를 스레드가 차지

Node.js (이벤트 기반):
  메모리: 1 스레드 × 10MB (메인 스레드 + libuv 스레드 풀)
  컨텍스트 스위칭: 이벤트 루프 단계 전환만 발생 (훨씬 적음)
  → 서버 메모리 32GB 기준으로 0.03%만 사용
```

Ryan Dahl는 **이벤트 기반, 논블로킹 I/O** 모델을 선택했습니다. 하나의 스레드로 모든 요청을 처리하고, I/O 작업이 완료되면 콜백으로 결과를 전달하는 방식입니다. 이것이 Node.js 탄생의 결정적 계기가 되었습니다.

```javascript
// Node.js 방식: 싱글 스레드 + 이벤트 루프
// 동시 연결 10,000개 → 스레드 1개
// 스레드당 약 10MB → 총 10MB 메모리
// Apache 대비 0.05%의 메모리로 동일한 연결 처리 가능
```

### C10K 문제를 해결하는 가장 효과적인 방법은?

| 접근 방식 | 대표 기술 | 장점 | 단점 |
|-----------|----------|------|------|
| 스레드 기반 | Apache, Java Servlet | 직관적인 코드, CPU 작업 유리 | 높은 메모리, 컨텍스트 스위칭 비용 |
| 이벤트 기반 | Node.js, Nginx, libuv | 낮은 메모리, I/O 집약 작업에 최적 | CPU 집약 작업에 부적합 |
| 코루틴 | Go (goroutine), Python asyncio | 경량 스레드, 간결한 코드 | 스케줄러 오버헤드 |
| 액터 모델 | Erlang, Akka | 높은 격리성, 내고장성 | 복잡한 설계 |

실무에서 Node.js는 **I/O 집약적이고 동시 연결이 많은 서비스**에 가장 효과적입니다. CPU 집약적인 작업(이미지 처리, 비디오 인코딩)이 주를 이룬다면 스레드 기반이나 코루틴 기반 기술이 더 적합할 수 있습니다.

## V8 JavaScript 엔진 — Node.js의 성능 비결

Node.js의 핵심에는 Google이 개발한 **V8 엔진**이 있습니다. V8은 Chrome 브라우저에서 사용하는 JavaScript 엔진으로, 다음과 같은 특징이 있습니다.

| 특징 | 설명 | 효과 | 내부 동작 |
|------|------|------|-----------|
| JIT 컴파일 | JavaScript를 실행 시 기계어로 컴파일 | 네이티브에 가까운 실행 속도 | Ignition(인터프리터) → TurboFan(최적화 컴파일러) 2단계 |
| 세대별 GC | Young/Old Generation 분리 수집 | 빠른 할당/해제 | Scavenge(Young) → Mark-Sweep-Compact(Old) |
| 인라인 캐싱 | 동일 타입 반복 호출 최적화 | 반복 작업 10~100배 향상 | Hidden Class 기반 프로퍼티 접근 최적화 |
| 힙 구성 | New Space/Old Space/Large Object Space | 효율적 메모리 관리 | 각 공간별 다른 GC 전략 적용 |

**깊이 있는 설명 — V8의 JIT 컴파일은 어떻게 동작하나요?**

V8은 JavaScript 코드를 두 단계로 컴파일합니다:

```
1차: Ignition (인터프리터)
  JavaScript 소스 → 바이트코드 (빠른 시작)
  → 프로파일링: 어떤 함수가 자주 호출되는지 추적

2차: TurboFan (최적화 컴파일러)
  자주 실행되는 함수(핫 함수) → 최적화된 기계어
  → 타입 피드백 기반 최적화 (예: 항상 숫자만 받는 함수는 숫자 연산으로 고정)
  → 최적화 실패 시: Bailout → 다시 Ignition 바이트코드로 Fallback
```

**실제 성능 측정:**

```javascript
// 일반 인터프리터 vs JIT 컴파일 성능 비교
function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

// 1회 실행: Ignition 인터프리터 - 약 0.5ms (바이트코드 실행)
// 100회 실행: TurboFan 최적화 시작 - 약 2ms (컴파일 시간 포함)
// 10,000회 실행: 완전 최적화 기계어 - 약 15ms (네이티브 속도)
// 최적화 전후 속도 차이: 약 8~15배
```

이 JIT 컴파일 과정 덕분에 V8은 반복 실행되는 코드를 점진적으로 최적화하여 C++에 가까운 성능을 냅니다. Node.js 서버가 실행 시간이 길어질수록 요청 처리 속도가 빨라지는 이유이기도 합니다.

## 이벤트 루프 — Node.js의 심장

Node.js의 비동기 처리 능력은 **이벤트 루프(Event Loop)** 에서 나옵니다. 이벤트 루프는 단일 스레드에서 비동기 작업을 조율하는 무한 루프입니다.

```javascript
// 이벤트 루프 동작 예시
console.log('1. 시작');

setTimeout(() => {
  console.log('3. 타이머 완료 (비동기)');
}, 0);

console.log('2. 동기 코드');

// 출력:
// 1. 시작
// 2. 동기 코드
// 3. 타이머 완료 (비동기)
```

**코드 분석 — 왜 setTimeout(fn, 0)도 가장 나중에 실행되나요?**

이벤트 루프의 동작을 단계별로 추적해보겠습니다:

```
실행 시작:
  스택 = [전역 컨텍스트]

1단계: console.log('1. 시작')
  → 스택에 push → 실행 → pop
  스택 = [전역 컨텍스트]
  출력: "1. 시작"

2단계: setTimeout(callback, 0)
  → 타이머를 WebAPI/libuv에 등록 (0ms 후 콜백을 timers 큐에 추가)
  → 스택에서 setTimeout 제거
  스택 = [전역 컨텍스트]

3단계: console.log('2. 동기 코드')
  → 스택에 push → 실행 → pop
  스택 = [전역 컨텍스트]
  출력: "2. 동기 코드"

4단계: 전역 컨텍스트 종료
  스택 = []

5단계: 이벤트 루프가 timers 단계 확인
  → 타이머 큐에 콜백이 있음 → 스택에 push → 실행
  출력: "3. 타이머 완료 (비동기)"
```

setTimeout(fn, 0)의 **지연 시간이 0ms**라도 타이머 콜백은 **현재 실행 중인 모든 동기 코드가 완료된 후**에 실행됩니다. 이는 JavaScript의 **Run-to-Completion** 특성 때문입니다. 한 번 실행된 함수는 중간에 중단되지 않고 끝까지 실행됩니다.

### 이벤트 루프의 6단계

Node.js의 이벤트 루프는 **libuv** 라이브러리가 구현하며, 6개의 단계로 구성됩니다. 각 단계는 서로 다른 유형의 콜백을 처리합니다.

```text
   ┌───────────────────────────┐
┌─>│           timers          │  ← setTimeout, setInterval 콜백
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  ← 이전 작업의 완료 콜백 (I/O 콜백)
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  ← libuv 내부용 (개발자 접근 불가)
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │  ← I/O 이벤트 폴링 및 콜백 실행 (핵심 단계)
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │  ← setImmediate 콜백
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │      close callbacks      │  ← close 이벤트 콜백 (socket.on('close'))
│  └───────────────────────────┘
└───────────────────────────────┘
```

**깊이 있는 설명 — 각 단계의 역할과 실행 순서 우선순위:**

1. **timers 단계:** `setTimeout()`과 `setInterval()`의 콜백을 실행합니다. 타이머의 지연 시간은 **최소 지연 시간**이지, 정확한 실행 시간이 아닙니다. 이전 단계(poll)에서 시간이 오래 걸리면 타이머 실행이 지연될 수 있습니다.

2. **pending callbacks 단계:** 이전 이벤트 루프 사이클에서 완료된 I/O 콜백을 실행합니다. 예를 들어 TCP 연결의 `ECONNREFUSED` 에러 콜백이 여기서 처리됩니다.

3. **idle, prepare 단계:** libuv 내부에서 사용하는 단계입니다. 개발자가 직접 이 단계에 콜백을 등록할 수 없습니다.

4. **poll 단계 (가장 중요한 단계):** 새로운 I/O 이벤트를 폴링하고 그 콜백을 실행합니다. 이 단계에서 하는 일:
   - **poll 큐가 비어있지 않음:** 큐의 모든 콜백을 실행
   - **poll 큐가 비어있음:** `setImmediate()` 큐가 있으면 check 단계로 이동, 타이머가 임박했으면 timers 단계로 이동, 아니면 새 I/O 이벤트를 기다림

5. **check 단계:** `setImmediate()` 콜백을 실행합니다. poll 단계 직후에 실행되므로, `setImmediate()`는 `setTimeout(fn, 0)`보다 항상 먼저 실행됩니다.

6. **close callbacks 단계:** `socket.on('close', ...)` 같은 close 이벤트 콜백을 실행합니다.

**실전 노하우 — 타이머 정밀도와 우선순위:**

```javascript
// setImmediate가 setTimeout(fn, 0)보다 먼저 실행되는 이유
setImmediate(() => console.log('1. setImmediate'));
setTimeout(() => console.log('2. setTimeout'), 0);

// 실행 결과 (항상 동일):
// 1. setImmediate
// 2. setTimeout

// 이유: 이벤트 루프가 timers 단계보다 check 단계를 먼저 만나기 때문
// 실행 순서: poll → check(setImmediate) → timers(setTimeout) → poll → ...
```

**성능 측정 — 타이머 오버헤드:**

```javascript
// 타이머 개수에 따른 이벤트 루프 지연 측정
const start = Date.now();
for (let i = 0; i < 1000; i++) {
  setTimeout(() => {}, 1000);
}
console.log(`타이머 1000개 등록 시간: ${Date.now() - start}ms`);
// 결과: 약 1~3ms (타이머 등록 자체는 가벼움)

// 그러나 1000개의 타이머가 동시에 만료되면:
// 이벤트 루프의 timers 단계에서 콜백 1000개를 순차 실행하므로
// 다른 I/O 작업이 최대 수 ms 동안 지연될 수 있음
```

### 논블로킹 I/O의 실제 동작

파일 읽기 요청이 들어왔을 때 Node.js의 내부 처리 흐름을 단계별로 살펴보겠습니다.

```javascript
const fs = require('fs');

// 논블로킹 방식 (비동기) — Node.js 방식
console.log('1. 파일 읽기 요청');

fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log('3. 파일 읽기 완료:', data.length, '바이트');
});

console.log('2. 다음 코드 실행 (파일 읽기를 기다리지 않음)');

// 출력:
// 1. 파일 읽기 요청
// 2. 다음 코드 실행 (파일 읽기를 기다리지 않음)
// 3. 파일 읽기 완료: 1024 바이트
```

**코드 분석 — 내부 실행 흐름 (6단계):**

```
1. fs.readFile('file.txt', ...) 호출
   → libuv가 스레드 풀(기본 4개) 중 하나에 파일 읽기 작업 위임
   → JavaScript 스레드는 즉시 다음 코드로 진행
   
2. console.log('2. 다음 코드 실행 ...') 실행
   → 동기 코드이므로 즉시 출력

3. 이벤트 루프 진입:
   timers → pending callbacks → idle → poll (여기서 I/O 완료 대기)
   
4. libuv 스레드 풀에서 파일 읽기 완료
   → 완료 콜백을 pending callbacks 큐에 추가
   
5. poll 단계에서 콜백 발견
   → JavaScript 스레드로 콜백 전달
   
6. fs.readFile의 콜백 실행
   → console.log('3. 파일 읽기 완료') 출력
```

**깊이 있는 설명 — libuv의 스레드 풀은 어떻게 동작하나요?**

libuv는 기본적으로 **4개의 스레드**로 구성된 스레드 풀을 관리합니다. 이 스레드 풀은 파일 I/O, DNS 조회, 일부 암호화 작업 등 **OS 커널이 비동기 인터페이스를 제공하지 않는 작업**을 처리합니다.

```
파일 읽기 요청이 오면:
  1. libuv 메인 루프가 작업을 스레드 풀 큐에 enqueue
  2. 스레드 풀의 유휴 스레드가 작업을 dequeue하여 실행
  3. 파일 읽기 완료 (블로킹 시스템 콜은 스레드 풀에서 실행)
  4. 완료 이벤트를 메인 루프에 전달
  5. 메인 스레드에서 JavaScript 콜백 실행

스레드 풀 크기 변경:
  process.env.UV_THREADPOOL_SIZE = 8;  // 기본 4 → 8로 증가
  // CPU 코어 수에 맞추는 것이 일반적
  // 너무 크게 설정하면 컨텍스트 스위칭 오버헤드 증가
```

## Node.js를 설치하는 가장 쉬운 방법은?

### 방법 1: nvm을 통한 버전 관리 (권장)

nvm(Node Version Manager)을 사용하면 여러 Node.js 버전을 쉽게 전환할 수 있습니다.

```bash
# nvm 설치 (Linux/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# nvm 설치 (Windows)
# https://github.com/coreybutler/nvm-windows 에서 설치

# nvm 명령어
nvm install 18      # Node.js 18.x LTS 설치
nvm install 20      # Node.js 20.x 설치 (최신)
nvm use 18           # 18.x로 전환
nvm ls               # 설치된 버전 목록
nvm alias default 18 # 기본 버전 설정
```

### 방법 2: 공식 설치

Node.js 공식 웹사이트([nodejs.org](https://nodejs.org))에서 LTS(Long Term Support) 버전을 다운로드하여 설치합니다.

```bash
# 설치 후 버전 확인
node --version    # v18.x.x (LTS)
npm --version     # 9.x.x
```

### Node.js 버전 선택 가이드

| 버전 | 특징 | 권장 대상 |
|------|------|-----------|
| LTS (18.x) | 장기 지원, 안정적, 프로덕션 검증 | **프로덕션 서버, 학습자** |
| Current (20.x) | 최신 기능, 빠른 성능, 실험적 API | 신기술 체험, 개발 테스트 |
| EOL 버전 (16.x 이하) | 보안 패치 중단 | **사용 중단 권장** |

**실전 노하우:** 프로덕션 환경에서는 항상 LTS 버전을 사용하세요. Current 버전은 최대 6개월 후 LTS로 전환되지만, 그 사이에 breaking change가 도입될 수 있습니다. `nvm ls-remote --lts`로 최신 LTS 버전을 확인할 수 있습니다.

## 첫 번째 Node.js 프로그램 — 단계별 가이드

### 1. 프로젝트 디렉토리 생성

```bash
mkdir my-first-node-app
cd my-first-node-app
```

### 2. app.js 파일 생성

```javascript
// app.js — 시스템 정보 출력 프로그램
const os = require('os');
const path = require('path');

// 시스템 정보 출력
console.log('=== Node.js 기본 정보 ===');
console.log(`Node.js 버전: ${process.version}`);
console.log(`플랫폼: ${process.platform}`);
console.log(`아키텍처: ${process.arch}`);
console.log(`현재 디렉토리: ${process.cwd()}`);

console.log('\n=== OS 정보 ===');
console.log(`운영체제: ${os.type()} ${os.release()}`);
console.log(`CPU 코어 수: ${os.cpus().length}`);
console.log(`전체 메모리: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`사용 가능 메모리: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`);

console.log('\n=== 경로 정보 ===');
console.log(`파일 구분자: ${path.sep}`);
```

**코드 분석 — `require('os')`는 내부적으로 어떻게 동작하나요?**

1. Node.js는 `os`가 **내장(core) 모듈**인지 확인합니다. 내장 모듈 목록에는 `os`, `fs`, `path`, `http` 등 40여 개가 있습니다.
2. 내장 모듈은 C++로 구현되어 Node.js 바이너리에 포함되어 있습니다. `os.cpus()` 호출 시:
   - C++ 바인딩 → libuv의 `uv_cpu_info()` 호출
   - OS 커널의 `/proc/cpuinfo` (Linux) 또는 `sysctl` (macOS) 등에서 CPU 정보 수집
   - 결과를 JavaScript 객체로 변환하여 반환
3. 내장 모듈의 실행 속도: 보통 0.01~0.1ms로 매우 빠릅니다.

### 3. 실행

```bash
node app.js
```

## Node.js가 사용되는 곳 — 실제 사례

| 분야 | 사례 | 이유 | 실제 사용 기업 |
|------|------|------|--------------|
| 웹 서버/API | Express.js, Fastify, Koa | 비동기 I/O로 높은 동시성 처리 | PayPal, Netflix, Uber |
| 실시간 앱 | 채팅, 게임 서버, Socket.io | WebSocket과 이벤트 기반 아키텍처 | Slack, Trello, Discord |
| CLI 도구 | npm, yarn, webpack, eslint | 크로스 플랫폼 지원, 빠른 개발 | 모든 JavaScript 개발자 |
| 마이크로서비스 | API 게이트웨이, BFF | 경량 런타임, 빠른 시작 시간 | Walmart, Medium |
| 서버리스 함수 | AWS Lambda, Vercel Functions | 빠른 콜드 스타트 (~50ms) | |
| 빌드 도구 | webpack, vite, rollup, esbuild | 파일 시스템 접근과 병렬 처리 | 모든 프론트엔드 프로젝트 |

> **내부 링크:** Node.js로 웹 서버를 만드는 방법은 [Node.js HTTP 서버](/2022/05/16/nodejs-basic-05-http-server/)에서 자세히 다룹니다. Express.js 프레임워크는 [Express.js 웹 프레임워크](/2022/05/30/nodejs-intermediate-07-expressjs/)에서 학습할 수 있습니다.

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Node.js는 백엔드 전용인가요?</strong></summary>
아니요. Node.js는 CLI 도구(npm, eslint), 데스크톱 앱(Electron 기반), IoT 기기 등 다양한 환경에서 사용됩니다. 백엔드가 가장 일반적인 용도이지만, 제한은 없습니다.
</details>

<details>
<summary><strong>Q: 싱글 스레드인데 어떻게 많은 요청을 처리하나요?</strong></summary>
이벤트 루프가 비동기 I/O를 관리하기 때문입니다. 파일 읽기, 네트워크 요청, 데이터베이스 쿼리 등 **대기 시간이 발생하는 작업**은 libuv의 스레드 풀(기본 4개)이나 OS 커널에 위임됩니다. JavaScript 코드를 실행하는 메인 스레드는 쉬지 않고 이벤트를 처리합니다.
</details>

<details>
<summary><strong>Q: Python이나 Java와 비교해서 어떤가요?</strong></summary>
Node.js는 **I/O 집약적 작업**에 특화되어 있습니다. 채팅 서버, API 게이트웨이, 실시간 애플리케이션에 강점이 있습니다. 반면 CPU 집약적인 작업(이미지 처리, 복잡한 계산)에는 Python이나 Java가 더 적합할 수 있습니다. Worker Threads를 사용하면 CPU 작업도 처리할 수 있지만, 설계가 더 복잡해집니다.
</details>

<details>
<summary><strong>Q: Node.js의 콜백 지옥은 어떻게 해결하나요?</strong></summary>
Node.js의 콜백 지옥(Callback Hell)은 Promise와 async/await로 해결할 수 있습니다. 2015년 ES6에서 Promise가 도입된 이후, Node.js 코드는 훨씬 더 읽기 쉬워졌습니다. 2022년 현재 대부분의 Node.js 라이브러리는 Promise 기반 API를 제공합니다. 콜백 기반 라이브러리는 `util.promisify()`로 Promise로 변환할 수 있습니다.
</details>

<details>
<summary><strong>Q: Node.js는 멀티코어 CPU를 활용할 수 있나요?</strong></summary>
네, 가능합니다. Node.js의 메인 스레드는 싱글 스레드이지만, `cluster` 모듈을 사용하면 여러 CPU 코어에 워커 프로세스를 생성할 수 있습니다. 또한 `worker_threads` 모듈로 CPU 집약적인 작업을 별도 스레드에서 처리할 수 있습니다. 실제 프로덕션에서는 PM2 같은 프로세스 매니저가 클러스터 모드를 자동으로 관리해줍니다.
</details>

## 요약

- Node.js는 **V8 엔진 기반의 JavaScript 런타임**으로, 서버와 로컬 환경에서 JavaScript를 실행
- **이벤트 루프**와 **논블로킹 I/O**로 싱글 스레드에서 높은 동시성 처리
- **libuv**가 이벤트 루프와 스레드 풀을 관리 (기본 스레드 풀 크기: 4)
- **V8의 2단계 JIT 컴파일**(Ignition → TurboFan)로 점진적 성능 최적화
- 백엔드 API, CLI 도구, 실시간 애플리케이션, 빌드 도구 등 다양한 분야에서 사용
- 설치 후 `node app.js`로 즉시 실행 가능, 진입 장벽이 낮음
- 프로덕션 환경에서는 **nvm으로 LTS 버전** 관리 권장
