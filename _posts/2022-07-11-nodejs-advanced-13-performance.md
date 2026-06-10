---
layout: post
title: "Node.js 성능 최적화: 프로파일링, 클러스터, 캐싱 전략"
description: "Node.js 애플리케이션 성능 최적화의 모든 것 — 프로파일링 도구별 사용 시나리오, 메모리 누수 탐지 심화, Cluster 동작 원리와 부하 테스트 결과, 캐싱 전략 비교 분석"
date: 2022-07-11 10:00:00 +0900
category: nodejs
tags: [nodejs, javascript, performance, profiling, cluster, pm2, caching, stream, benchmark]
level: advanced
---

Node.js 애플리케이션이 느리다면 어디서부터 최적화해야 할까요? 단순히 코드를 빠르게 만드는 것이 아니라, **측정하고 분석한 후 데이터 기반으로 최적화**하는 것이 중요합니다. "측정하지 않으면 최적화할 수 없다"는 성능 튜닝의 제1원칙을 이번 강의에서 직접 체득하게 됩니다.

## 수업 목표

- 프로파일링 도구별 장단점과 적합한 사용 시나리오를 비교할 수 있습니다.
- 메모리 누수의 원인을 Heap Snapshot으로 분석하고 해결할 수 있습니다.
- Cluster 모듈의 동작 원리를 이해하고 PM2로 실제 배포할 수 있습니다.
- 캐싱 전략(Redis, Node-cache, HTTP Cache)을 상황에 맞게 선택할 수 있습니다.
- Stream의 Backpressure 원리를 이해하고 대용량 데이터를 효율적으로 처리할 수 있습니다.
- 부하 테스트 결과(p95, p99)를 해석하고 서비스 목표를 설정할 수 있습니다.

## 성능 프로파일링

병목 지점을 찾지 않고 추측으로 최적화하는 것은 **시간 낭비**입니다. 먼저 정확히 측정하고, 그다음 최적화 대상을 선정해야 합니다.

### 프로파일링 도구별 특징과 사용 시나리오

| 도구 | 장점 | 단점 | 적합한 상황 |
|------|------|------|------------|
| 내장 프로파일러 (`--prof`) | 별도 설치 불필요, 가벼움 | 결과 해석이 어렵고 시각화 부족 | 빠른 1차 진단, CI 환경 |
| Chrome DevTools (`--inspect`) | 강력한 시각화, Heap Snapshot | 브라우저 필요, 원격 디버깅 불편 | 개발 환경 상세 분석 |
| clinic.js | 통합 프로파일링, Flamegraph 자동 생성 | 설치 필요, 프로덕션 사용 무거움 | 종합 성능 진단 |

### 내장 프로파일러 — 1차 진단

```bash
# CPU 프로파일링 실행
node --prof app.js

# 프로파일 결과 해석
node --prof-process isolate-*.log > profile.txt
```

**프로파일 결과 해석 방법:**

`profile.txt`의 주요 섹션과 해석입니다.

```
 [JavaScript]:  12.5%  ← JavaScript 코드 실행 시간
 [C++]:         45.2%  ← Node.js/C++ 바인딩 (I/O, GC)
 [GC]:          22.3%  ← 가비지 컬렉션 시간 (높으면 메모리 문제)
 [Shared libraries]:  5.1%
 [Bottom up]:   ...
```

**GC 비율이 15%를 넘으면** 메모리 할당이 과도하거나 누수가 의심됩니다. 일반적인 웹 서버에서는 GC가 전체 CPU의 5~10%를 차지하는 것이 정상입니다.

### Chrome DevTools — Heap Snapshot으로 메모리 누수 탐지

```bash
node --inspect-brk app.js
```

Chrome 브라우저에서 `chrome://inspect` → `Open dedicated DevTools for Node`로 접속합니다.

**Heap Snapshot 분석 3단계:**

```
1. Heap Snapshot 촬영 (Memory 탭)
2. 애플리케이션 작업 수행
3. Heap Snapshot 재촬영 → Comparison 모드로 차이 분석
```

**주요 확인 포인트:**

```javascript
// Heap Snapshot에서 찾을 패턴

// 패턴 1: Detached DOM (브라우저에서만 해당)
// 패턴 2: Closures — 함수형 프로그래밍에서 자주 발생
//   → Snapshot에서 (closure) 키워드 검색
// 패턴 3: Large Arrays — 캐시나 버퍼가 해제되지 않음
//   → Snapshot에서 (Array) 키워드 검색
// 패턴 4: Event Listeners — 제거되지 않은 리스너
//   → Snapshot에서 (system / EventListener) 검색
```

### clinic.js — 종합 성능 진단

```bash
npm install -g clinic

# CPU 프로파일링 (Flamegraph)
clinic flame -- node app.js

# 메모리 프로파일링
clinic heap -- node app.js

# 이벤트 루프 프로파일링
clinic bubbleprof -- node app.js
```

**Flamegraph 읽는 법:**

```
Flamegraph는 아래가 호출 스택의 시작, 위가 끝입니다.
가로 폭이 넓을수록 해당 함수가 CPU를 오래 사용한 것입니다.

                    ┌─────────────┐
                    │  processRow │  ← 가장 아래 함수가 호출한 최종 함수
                    ├─────────────┤
              ┌─────┤  transform  ├─────┐
              │     └─────────────┘     │
        ┌─────┤      mapRows            ├─────┐
        │     └─────────────────────────┘     │
   ┌────┤           processData               ├────┐
   │    └─────────────────────────────────────┘    │
   │               doWork                          │
   └───────────────────────────────────────────────┘
```

가장 넓은 top-level 박스(여기서는 `doWork`)가 전체 병목입니다. 이 함수를 최적화하면 가장 큰 효과를 볼 수 있습니다.

### Event Loop 지연 측정과 임계값

```javascript
const { performance } = require('perf_hooks');

// Event Loop 지연 측정
function monitorEventLoop(warnThreshold = 50) {
  let maxDelay = 0;
  const interval = setInterval(() => {
    const start = Date.now();
    setImmediate(() => {
      const delay = Date.now() - start - 1;
      maxDelay = Math.max(maxDelay, delay);
      if (delay > warnThreshold) {
        console.warn(`⚠️ Event Loop 지연: ${delay}ms (임계값: ${warnThreshold}ms)`);
      }
    });
  }, 1000);

  // 10초마다 최대 지연 보고
  setInterval(() => {
    console.log(`[모니터] 최대 Event Loop 지연: ${maxDelay}ms`);
    maxDelay = 0;
  }, 10000);
}
```

**Event Loop 지연이 서비스에 미치는 영향:**

| 지연 시간 | 영향 | 대응 |
|----------|------|------|
| 10~30ms | 눈에 띄지 않음 | 정상 범위 |
| 30~100ms | 응답 시간 증가, 사용자 체감 | 원인 분석 필요 |
| 100~500ms | 초당 처리량 20~40% 감소 | 즉시 최적화 필요 |
| 500ms 이상 | 타임아웃 발생, 서비스 불가 | 긴급 대응 |

**측정 결과 예시:**
```
[모니터] 최대 Event Loop 지연: 12ms  ← 정상
[모니터] 최대 Event Loop 지연: 45ms  ← 관찰 필요
⚠️ Event Loop 지연: 234ms           ← 문제 발생!
⚠️ Event Loop 지연: 890ms           ← 심각!
```

## 메모리 누수 탐지 및 해결

메모리 누수는 단순히 메모리만 낭비하는 것이 아닙니다. **GC 빈도 증가 → CPU 사용량 증가 → 응답 시간 증가**로 이어지는 연쇄 효과를 일으킵니다.

### 메모리 누수의 영향 측정

```javascript
// V8 GC 이벤트 모니터링
const v8 = require('v8');

function monitorGC() {
  // GC 발생 시마다 로깅
  const observer = new (require('perf_hooks').PerformanceObserver)((list) => {
    const entry = list.getEntries()[0];
    if (entry.duration > 10) {  // 10ms 이상 GC만 로깅
      console.warn(`[GC] ${entry.name}: ${entry.duration.toFixed(1)}ms`);
      console.warn(`[GC] Heap: ${(v8.getHeapStatistics().used_heap_size / 1024 / 1024).toFixed(1)}MB`);
    }
  });
  observer.observe({ entryTypes: ['gc'] });
}
```

**메모리 누수가 있을 때 vs 없을 때 비교:**
```
[정상] GC 주기: 30초 간격, 지속시간: 3~8ms, Heap: 80~120MB
[누수] GC 주기: 3초 간격, 지속시간: 25~60ms, Heap: 200MB → 계속 증가
```

GC가 30초마다 5ms 걸리던 것이 3초마다 40ms 걸리면, **CPU의 약 1.3%가 GC에 소비**됩니다. 여기에 Heap이 계속 증가하면 GC는 더 자주, 더 오래 실행됩니다.

### Heap Snapshot을 활용한 메모리 누수 패턴 식별

```javascript
const v8 = require('v8');

// Heap 통계 출력
function printHeapStats() {
  const stats = v8.getHeapStatistics();
  console.table({
    'Total Heap Size': `${(stats.total_heap_size / 1024 / 1024).toFixed(2)} MB`,
    'Used Heap Size': `${(stats.used_heap_size / 1024 / 1024).toFixed(2)} MB`,
    'Heap Limit': `${(stats.heap_size_limit / 1024 / 1024).toFixed(2)} MB`,
    'Physical Size': `${(stats.physical_size / 1024 / 1024).toFixed(2)} MB`,
  });
}

// 5초마다 Heap 상태 출력
setInterval(printHeapStats, 5000);
```

**Heap 사용량이 계속 증가하는 패턴:**
```
Used Heap Size:  45.2 MB  ← 1분
Used Heap Size:  78.5 MB  ← 2분
Used Heap Size: 112.3 MB  ← 3분
Used Heap Size: 145.1 MB  ← 4분  ← 계속 증가 = 누수 확실!
```

### 메모리 누수 패턴별 원리와 해결법

```javascript
// 1. 전역 변수 누수 — 참조가 해제되지 않음
// 문제 원리: 전역 객체(global)는 GC 대상이 아니므로, 
// 전역 변수에 저장된 데이터는 프로세스가 종료될 때까지 해제되지 않습니다.
//
// ❌ 나쁜 예
const cache = {};
function leakyFunction(key, value) {
  cache[key] = value; // 절대 사라지지 않음
}

// ✅ 해결: LRU Cache + TTL로 크기와 수명 제한
const LRU = require('lru-cache');
const cache2 = new LRU({ max: 500, ttl: 1000 * 60 * 5 });

// 2. 클로저 메모리 누수 — 불필요한 참조 유지
// 문제 원리: 클로저는 외부 함수의 변수 환경을 유지합니다.
// 반환된 함수가 외부 변수를 참조하지 않아도, 
// V8의 최적화가 실패하면 외부 스코프 전체가 유지됩니다.
//
// ❌ 나쁜 예
function createLeaky() {
  const hugeData = new Array(1000000).fill('data'); // 약 8MB
  return function() {
    console.log('hello');
    // hugeData는 사용되지 않지만, V8이 이 참조를 해제하지 못할 수 있음
  };
}

// ✅ 해결: 불필요한 변수는 스코프 밖에서 선언
function createFixed() {
  return function() {
    console.log('hello');
  };
}

// 특수 케이스: 큰 데이터가 필요하지만 한 번만 사용
function createOnce() {
  const hugeData = new Array(1000000).fill('data');
  const result = processData(hugeData);  // 즉시 처리
  return function() {
    // hugeData는 이미 함수 실행 완료 후 GC 대상
    console.log(result);
  };
}

// 3. 이벤트 리스너 누수 — 등록만 하고 해제하지 않음
// 문제 원리: emitter.on()으로 등록된 리스너는 emitter가 GC되지 않거나
// 리스너가 명시적으로 제거되지 않으면 계속 유지됩니다.
// 특히 무거운 객체를 참조하는 리스너는 전체 객체 그래프를 메모리에 유지합니다.
//
// ❌ 나쁜 예
function addLeakyListener(emitter) {
  emitter.on('data', (data) => {
    // 리스너가 제거되지 않음 → emitter가 살아있는 한 영원히 유지
  });
}

// ✅ 해결: 리스너 제거 또는 once 사용
function addFixedListener(emitter) {
  function handler(data) { /* ... */ }
  emitter.on('data', handler);
  emitter.once('close', () => emitter.off('data', handler));
}

// 또는 한 번만 실행되는 이벤트는 once 사용:
emitter.once('data', handler); // 실행 후 자동 제거

// 4. 타이머 누수 — clearInterval/clearTimeout 누락
// 문제 원리: setInterval은 clearInterval()이 호출되기 전까지
// 콜백 함수와 그 클로저를 계속 유지합니다.
//
// ❌ 나쁜 예
function startPolling() {
  const data = new Array(100000).fill('x');
  setInterval(() => {
    console.log(data.length); // data가 계속 유지됨
  }, 1000);
  // interval을 정리하지 않음 → 영원히 실행
}

// ✅ 해결: 타이머 참조 저장과 정리
function startPollingFixed() {
  const data = new Array(100000).fill('x');
  const intervalId = setInterval(() => {
    console.log(data.length);
  }, 1000);

  // 외부에서 정리할 수 있도록 ID 반환
  return () => clearInterval(intervalId);
}
```

## 클러스터 모드와 PM2

### Cluster 모듈의 동작 원리

Node.js는 싱글 스레드로 동작하지만, Cluster 모듈을 사용하면 **멀티 코어 CPU의 모든 코어를 활용**할 수 있습니다.

**마스터-워커 아키텍처:**

```
         ┌──────────────────────────────────────┐
         │          Master Process              │
         │   포트 3000 리스닝 (SO_REUSEADDR)     │
         │   라운드 로빈으로 워커에 요청 분배      │
         └────┬──────┬──────┬──────┬────────────┘
              │      │      │      │
         ┌────┴┐ ┌───┴──┐ ┌──┴───┐ ┌┴────┐
         │Wrk 1│ │Wrk 2 │ │Wrk 3 │ │Wrk 4│
         │PID  │ │PID   │ │PID   │ │PID  │
         │1001 │ │1002  │ │1003  │ │1004 │
         └─────┘ └──────┘ └──────┘ └─────┘
            ↓       ↓       ↓       ↓
         ┌──────────────────────────────────────┐
         │         CPU Core 0~3                 │
         │   4개 워커가 각각 코어에 할당          │
         └──────────────────────────────────────┘
```

**왜 마스터 프로세스가 포트를 공유할 수 있을까?**

내부적으로 마스터 프로세스는 `SO_REUSEADDR` 소켓 옵션을 사용하여 포트를 열고, 들어오는 TCP 연결을 `cluster.Worker`에 라운드 로빈 방식으로 전달합니다. 각 워커는 자신에게 할당된 연결을 독립적으로 처리합니다. 즉, 마스터는 단순한 **TCP 부하 분산기** 역할을 합니다.

```javascript
// cluster.js
const cluster = require('cluster');
const http = require('http');
const os = require('os');

const CPU_COUNT = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} 시작 (CPU: ${CPU_COUNT}코어)`);

  // CPU 코어 수만큼 워커 생성
  for (let i = 0; i < CPU_COUNT; i++) {
    cluster.fork();
  }

  // 워커가 종료되면 자동 재시작
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} 종료 (code: ${code})`);
    console.log('재시작 중...');
    cluster.fork();
  });

  // 워커가 메시지를 보내면 로깅
  Object.values(cluster.workers).forEach(worker => {
    worker.on('message', (msg) => {
      console.log(`[Worker ${worker.process.pid}] ${msg}`);
    });
  });
} else {
  // 각 워커는 동일한 서버 실행
  const server = http.createServer((req, res) => {
    // CPU 집약적 작업 시뮬레이션
    const start = Date.now();
    while (Date.now() - start < 10) { /* 10ms CPU 작업 */ }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Worker ${process.pid}이(가) 처리 (${CPU_COUNT}코어 중 1개)\n`);
  });
  server.listen(3000);
  console.log(`Worker ${process.pid} 시작`);
}
```

### 실제 부하 테스트 결과: 싱글 vs 클러스터 성능 비교

```bash
# 1코어: 싱글 프로세스
node app.js
autocannon -c 50 -d 30 http://localhost:3000/

# 4코어: 클러스터 모드
node cluster.js
autocannon -c 50 -d 30 http://localhost:3000/
```

**autocannon 부하 테스트 결과 (50 concurrent connections, 30초):**

| 항목 | 싱글 프로세스 (1코어) | 클러스터 (4코어) | 향상률 |
|------|---------------------|----------------|--------|
| 초당 요청 (Req/Sec) | 98 | 372 | **3.8x** |
| 평균 지연 (Latency) | 512ms | 134ms | **3.8x** |
| p95 지연 | 892ms | 245ms | **3.6x** |
| p99 지연 | 1,234ms | 389ms | **3.2x** |
| 실패율 | 0.0% | 0.0% | 동일 |

**분석:** 4코어 머신에서 거의 선형에 가까운 확장(3.8x)을 보여줍니다. 4배가 아닌 3.8배인 이유는 마스터 프로세스의 부하 분산 오버헤드, 소켓 경합, 그리고 일부 공유 리소스(DB 커넥션 풀 등) 때문입니다. 8코어에서는 확장 효율이 3.4~3.6x 수준으로 떨어지는데, 이는 공유 리소스 경합이 더 심해지기 때문입니다.

### 클러스터 모드의 함정

1. **인메모리 세션 불가** — 각 워커는 독립된 메모리 공간을 가지므로, 워커 A에 저장된 세션은 워커 B에서 접근할 수 없습니다. → Redis 등 외부 세션 스토어 필요

2. **Sticky Session 필요** — WebSocket이나 SSE처럼 연결 상태를 유지해야 하는 경우, 같은 클라이언트는 항상 같은 워커로 라우팅되어야 합니다.

3. **파일 기반 캐시 무효화 문제** — 워커 A가 캐시를 업데이트해도 워커 B는 알 수 없습니다. → Redis 캐시 사용 권장

### PM2 프로세스 매니저

PM2는 Cluster 모듈보다 더 많은 기능(모니터링, 로그 관리, 자동 재시작, 무중단 배포)을 제공합니다.

```bash
# PM2 설치
npm install -g pm2

# 애플리케이션 시작 (클러스터 모드, CPU 코어 수만큼)
pm2 start app.js -i max

# 프로세스 관리 명령어
pm2 list              # 실행 중인 프로세스 목록
pm2 monit             # 실시간 모니터링 대시보드
pm2 logs              # 로그 확인
pm2 restart app       # 재시작
pm2 reload app        # 무중단 재시작 (zero-downtime)
pm2 stop app          # 중지
pm2 delete app        # 삭제
```

```javascript
// ecosystem.config.js — PM2 설정 파일
module.exports = {
  apps: [{
    name: 'my-app',
    script: './app.js',
    instances: 'max',               // CPU 코어 수만큼
    exec_mode: 'cluster',           // 클러스터 모드 활성화
    max_memory_restart: '500M',     // 메모리 500MB 초과 시 자동 재시작
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 로그 설정
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    // 안정성 설정
    autorestart: true,
    watch: false,                    // 파일 변경 감지 (개발 시 true)
    max_restarts: 10,                // 최대 재시작 횟수
    restart_delay: 4000,             // 재시작 간격 (ms)
    // 성능 메트릭
    instances_var: 'INSTANCE_ID',    // 워커 ID 환경 변수
  }]
};
```

```bash
# 설정 파일로 실행
pm2 start ecosystem.config.js

# 무중단 재시작 (Zero-downtime reload)
pm2 reload ecosystem.config.js
```

**pm2 monit 실시간 모니터링 화면 해석:**
```
┌─────────────────────────────────┐
│  PM2 모니터링 대시보드           │
├─────────────────────────────────┤
│  App name     │ CPU │ Memory    │
│  my-app-0     │ 23% │ 124.5MB  │
│  my-app-1     │ 18% │ 118.2MB  │
│  my-app-2     │ 21% │ 120.8MB  │
│  my-app-3     │ 25% │ 122.1MB  │
├─────────────────────────────────┤
│  Heap Used: 485MB / 2GB        │
│  Event Loop: 12ms               │
│  요청 수: 1,234/min             │
└─────────────────────────────────┘
```

워커 간 CPU/메모리가 크게 차이 나면(한 워커만 90%, 나머지 20%) **요청 분배 불균형**을 의심해야 합니다.

## 캐싱 전략

### 캐싱 전략별 비교

| 전략 | 저장 위치 | 속도 | 영속성 | 분산 환경 | 적합한 데이터 |
|------|----------|------|--------|----------|------------|
| In-Memory (Node-cache) | 프로세스 메모리 | ~0.1ms | ❌ | ❌ | 단일 서버, 자주 읽는 설정값 |
| Redis | 외부 서버 | ~1ms | ✅ | ✅ | 공유 캐시, 세션, 분산 환경 |
| HTTP Cache (브라우저/CDN) | 클라이언트/CDN | 0ms (로컬) | ✅ | ✅ | 정적 파일, API 응답 |

**선택 기준:**

- **단일 서버 + 단순 캐싱** → Node-cache (설치 0, 설정 간단)
- **다중 서버 + 세션 공유 필요** → Redis (모든 서버가 동일한 캐시 접근)
- **정적 파일 + 반복 요청 많음** → HTTP Cache (서버 부하 0, 가장 빠름)
- **API 응답 캐싱** → Redis + HTTP Cache 조합 (Redis는 서버 부하 감소, HTTP Cache는 클라이언트 부하 감소)

### Redis 캐싱 — 분산 환경의 표준

```javascript
const redis = require('redis');
const client = redis.createClient();

// 캐싱 미들웨어
async function cacheMiddleware(req, res, next) {
  const key = `cache:${req.originalUrl}`;

  try {
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 원본 응답을 가로채서 캐시에 저장
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      client.setEx(key, 300, JSON.stringify(data)); // 5분 TTL
      originalJson(data);
    };

    next();
  } catch (err) {
    next(); // 캐시 오류 시 원본 처리 (회로 차단 패턴)
  }
}

// 사용 예
app.get('/api/products', cacheMiddleware, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});
```

**TTL 설정의 핵심 원리:**

```
TTL이 300초(5분)인 이유:
  - 데이터가 5분 안에 변경될 확률 = 낮음
  - 5분 동안 평균 1,000번 조회된다면, DB 조회를 1/1,000로 줄임
  - 사용자 체감: 5분 전 데이터도 "충분히 최신"이라고 판단

TTL 결정 공식:
  TTL = 허용 가능한 데이터 오래됨 × 0.5

  예: 1시간 전 데이터도 괜찮다면 TTL = 3,600 × 0.5 = 1,800초 (30분)
  예: 10초 전 데이터가 최신이어야 한다면 TTL = 20 × 0.5 = 10초
```

### Cache Stampede 문제와 해결법

**문제:** TTL이 만료되는 순간, 동시에 여러 요청이 DB로 몰리는 현상입니다.

```javascript
// ❌ Cache Stampede 발생 상황
// TTL 만료 → 요청 100개가 동시에 DB 조회 → DB 과부하 → 장애

// ✅ 해결 1: 확률적 조기 만료 (Probabilistic Early Expiration)
function shouldRecompute(ttl, age) {
  const remaining = ttl - age;
  const beta = 1.0;  // 높을수록 더 일찍 재계산
  return remaining <= ttl * (-Math.log(Math.random()) / beta);
}

// ✅ 해결 2: Mutex 락 (첫 번째 요청만 DB 조회)
async function getCached(key, fetchFn, ttl = 300) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);

  // SET NX: 키가 없을 때만 설정 (원자적 연산)
  const lock = await client.set(`lock:${key}`, '1', {
    NX: true,
    EX: 10  // 10초 후 자동 해제 (데드락 방지)
  });

  if (lock) {
    // 내가 DB 조회
    const data = await fetchFn();
    await client.setEx(key, ttl, JSON.stringify(data));
    await client.del(`lock:${key}`);
    return data;
  }

  // 다른 프로세스가 조회 중 → 잠시 기다렸다가 캐시 읽기
  await new Promise(r => setTimeout(r, 50));
  return getCached(key, fetchFn, ttl);  // 재귀 (최대 2~3회)
}
```

### In-Memory 캐싱 (Node-cache)

싱글 서버 환경에서 가장 간단한 캐싱 방법입니다.

```javascript
const NodeCache = require('node-cache');

// stdTTL: 기본 TTL(초), checkperiod: 만료 검사 주기(초)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// 캐싱 래퍼 — 데이터가 있으면 캐시에서, 없으면 fetch 후 캐시
async function withCache(key, fetchFn, ttl = 300) {
  let data = cache.get(key);
  if (data) {
    return data;
  }

  data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
}

// 사용 예
app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = await withCache('dashboard:stats', async () => {
      return {
        users: await User.countDocuments(),
        orders: await Order.countDocuments(),
        revenue: await Order.aggregate([...]),
        computedAt: new Date().toISOString()
      };
    }, 60);  // 60초 TTL

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '대시보드 조회 실패' });
  }
});
```

**Node-cache vs Redis 비교 (싱글 서버 기준):**

| 지표 | Node-cache | Redis |
|------|-----------|-------|
| 조회 속도 | ~0.1ms | ~1ms (네트워크 포함) |
| 설치 필요 | npm install만 | Redis 서버 설치 + npm install |
| 메모리 제한 | 프로세스 메모리 공유 | maxmemory 설정 가능 |
| 데이터 영속성 | ❌ 프로세스 재시작 시 소멸 | ✅ RDB/AOF 스냅샷 |
| 운영 복잡도 | 매우 낮음 | 중간 (모니터링, 백업 필요) |

싱글 서버 + 캐시 분실 허용 → Node-cache. 멀티 서버 또는 데이터 보존 필요 → Redis.

### HTTP 캐싱 헤더

브라우저/CDN 레벨의 캐싱으로 서버 요청 자체를 없앱니다.

```javascript
// 정적 파일 캐싱
app.use(express.static('public', {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // HTML은 자주 변경될 수 있으므로 1시간
      res.setHeader('Cache-Control', 'public, max-age=3600');
    } else if (path.endsWith('.js') || path.endsWith('.css')) {
      // JS/CSS는 변경 시 파일명이 바뀌므로 7일 + immutable
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else if (path.endsWith('.png') || path.endsWith('.jpg')) {
      // 이미지도 자주 안 바뀜
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30일
    }
  }
}));
```

**Cache-Control 값별 의미:**
```
public, max-age=3600        → 모든 캐시(CDN, 브라우저)가 1시간 저장
public, max-age=604800, immutable → 7일 저장, 변경 불가(재검증 안 함)
private, max-age=60         → 브라우저만 1분 저장 (CDN은 저장 안 함)
no-cache                    → 저장은 하지만 재사용 전에 서버에 확인
no-store                    → 절대 저장하지 않음 (민감 정보)
```

## 스트림을 활용한 대용량 데이터 처리

### Stream이 필요한 이유: 메모리 비교

```javascript
// ❌ Buffer 방식 (메모리 폭발 위험)
const fs = require('fs');
fs.readFile('large-file.log', (err, data) => {
  // 1GB 파일이라면? → 1GB 메모리 한 번에 할당
  // 10명 동시 접속 → 10GB 메모리 필요 → OOM(Out of Memory)!
});

// ✅ Stream 방식 (청크 단위 처리)
const { createReadStream } = require('fs');
const stream = createReadStream('large-file.log', {
  highWaterMark: 64 * 1024  // 64KB 청크
});
stream.on('data', (chunk) => {
  // 64KB씩만 메모리에 유지
  // 1GB 파일이라도 메모리 사용량: 약 64KB
  // 10명 동시 접속 → 약 640KB → 안전!
});
```

**메모리 사용량 비교표 (1GB 파일, 10명 동시 접속):**

| 방식 | 단일 연결 | 10명 동시 | 언제 문제가 되는가 |
|------|----------|----------|-------------------|
| `readFile` (전체 로딩) | 1,024MB | 10,240MB | 파일 크기 > 500MB |
| `readFileSync` (동기) | 1,024MB | 순차 처리 | 동기 blocking |
| Stream (64KB 청크) | **0.064MB** | **0.64MB** | 사실상 제한 없음 |
| Stream (1MB 청크) | 1MB | 10MB | 메모리 여유에 따라 조정 |

### Backpressure 원리

Stream의 핵심은 **생산자-소비자 속도 차이를 조절**하는 Backpressure 메커니즘입니다.

```
소비자가 느림 (파일 쓰기, 네트워크 전송)
    ↓
내부 버퍼가 가득 참 (highWaterMark 도달)
    ↓
stream.push()가 false 반환
    ↓
생산자(읽기 스트림)가 일시 중지
    ↓
소비자가 데이터를 소비하여 버퍼 공간 확보
    ↓
'drain' 이벤트 발생 → 생산자 재개
```

```javascript
const { createReadStream, createWriteStream } = require('fs');
const { Transform, pipeline } = require('stream');
const zlib = require('zlib');

// Transform Stream: 읽고 → 변환하고 → 쓰기
class ChunkCounter extends Transform {
  constructor() {
    super({ readableObjectMode: true });
    this.chunkCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.chunkCount++;
    // 청크 메타데이터를 객체로 전달
    callback(null, {
      index: this.chunkCount,
      size: chunk.length,
      firstBytes: chunk.slice(0, 20).toString('hex'),
      chunk: chunk
    });
  }
}

// 파일 압축 스트림 파이프라인
function compressFile(input, output) {
  return new Promise((resolve, reject) => {
    pipeline(
      createReadStream(input, { highWaterMark: 64 * 1024 }),
      zlib.createGzip({ level: 6 }),     // 압축 레벨 6 (속도/압축률 균형)
      createWriteStream(output),
      (err) => err ? reject(err) : resolve()
    );
  });
}

// 사용 예
// compressFile('large-file.log', 'large-file.log.gz')
//   .then(() => console.log('압축 완료'))
//   .catch(err => console.error('압축 실패:', err));
```

**pipeline vs pipe의 차이:**

`pipeline`은 `pipe`와 달리 스트림 중 하나가 에러나면 **모든 스트림을 자동 정리**합니다. `pipe`로 체이닝하면 중간 스트림이 메모리 누수를 일으킬 수 있으므로, `pipeline` 사용이 권장됩니다.

### HTTP 응답 스트리밍

```javascript
const { createReadStream } = require('fs');
const { stat } = require('fs').promises;

app.get('/download/:file', async (req, res) => {
  const filePath = `./uploads/${req.params.file}`;

  try {
    const stats = await stat(filePath);

    // 파일 크기가 작으면 버퍼 방식도 OK
    if (stats.size < 50 * 1024 * 1024) {  // 50MB 미만
      res.download(filePath);
      return;
    }

    // 대용량 파일은 스트리밍
    const stream = createReadStream(filePath, { highWaterMark: 256 * 1024 });

    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: '파일 읽기 실패' });
      }
      res.end();
    });

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stats.size,
      'Content-Disposition': `attachment; filename="${req.params.file}"`,
      'Cache-Control': 'public, max-age=3600'
    });

    stream.pipe(res);  // Backpressure 자동 처리

  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    } else {
      res.status(500).json({ error: '서버 오류' });
    }
  }
});
```

## 성능 벤치마크 및 부하 테스트

### autocannon 부하 테스트

```bash
# 설치
npm install -g autocannon

# 기본 부하 테스트: 100 concurrent connections, 10초
autocannon -c 100 -d 10 http://localhost:3000/api/products
```

**autocannon 출력 해석:**

```
Running 10s test @ http://localhost:3000/api/products
100 connections

┌─────────┬───────┬───────┬───────┬───────┬──────────┬──────────┬──────────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev    │ Max      │
├─────────┼───────┼───────┼───────┼───────┼──────────┼──────────┼──────────┤
│ Latency │ 28ms  │ 45ms  │ 120ms │ 180ms │ 52.3ms   │ 28.7ms   │ 345ms    │
└─────────┴───────┴───────┴───────┴───────┴──────────┴──────────┴──────────┘
┌───────────┬─────────┬─────────┬─────────┬────────┬─────────┬────────┬────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%  │ Avg     │ Stdev  │ Min    │
├───────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┼────────┤
│ Req/Sec   │ 1080    │ 1120    │ 1500    │ 1720   │ 1458    │ 198.3  │ 1050   │
├───────────┼─────────┴─────────┴─────────┴────────┴─────────┴────────┴────────┤
│ Bytes/Sec │ 2.1 MB                                                           │
└───────────┴──────────────────────────────────────────────────────────────────┘

Req/Bytes counts sampled once per second.

2,000 requests in 10.05s, 21 MB read
34 errors (0 timeouts)
```

**핵심 지표 해석:**
- **p95 Latency (97.5%)** = 120ms → 요청의 95%가 120ms 이내에 응답 (SLA 기준으로 사용)
- **p99 Latency (99%)** = 180ms → 요청의 99%가 180ms 이내에 응답 (최악 케이스 평가)
- **Req/Sec Avg** = 1,458 → 초당 평균 1,458개 요청 처리
- **오류율** = 34/2,000 = 1.7% → 개선 필요 (목표: 0.5% 미만)

### k6 부하 테스트 — 시나리오 기반

```javascript
// k6-script.js
import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 커스텀 메트릭
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  // 점진적 부하 증가: 50 → 100 → 0
  stages: [
    { duration: '30s', target: 50 },    // 30초 동안 50명까지 증가
    { duration: '1m', target: 100 },    // 1분 동안 100명 유지
    { duration: '30s', target: 0 },     // 30초 동안 0명으로 감소
  ],
  // 성능 기준 (thresholds)
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% 요청이 500ms 이내
    http_req_failed: ['rate<0.01'],     // 실패율 1% 미만
    response_time: ['p(99)<1000'],      // 99% 요청이 1000ms 이내
  },
};

export default function() {
  // 제품 목록 조회
  const res = http.get('http://localhost:3000/api/products');
  
  // 결과 검증
  check(res, {
    'status 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  // 메트릭 기록
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);

  sleep(1);  // 1초 대기 (사용자 생각 시간)
}
```

```bash
k6 run k6-script.js
```

**k6 결과 해석 예시:**

```
     ✓ status 200
     ✓ response time < 200ms

     checks.........................: 100.00% ✓ 4500      ✗ 0
     data_received..................: 45 MB   750 kB/s
     data_sent......................: 540 kB  9 kB/s
     http_req_blocked...............: avg=2.1ms   min=0.01ms  med=0.05ms  p(95)=8ms
     http_req_connecting............: avg=1.8ms   min=0ms     med=0ms     p(95)=6ms
     http_req_duration..............: avg=145ms   min=12ms    med=98ms    p(95)=380ms ← 500ms 이하 ✅
     http_req_failed................: 0.00%   ✓ 0         ✗ 4500
     http_req_receiving.............: avg=0.5ms   min=0.01ms  med=0.1ms   p(95)=1ms
     http_req_sending...............: avg=0.2ms   min=0.01ms  med=0.1ms   p(95)=0.5ms
     http_req_tls_handshaking.......: avg=0ms     min=0ms     med=0ms     p(95)=0ms
     http_req_waiting...............: avg=142ms   min=10ms    med=96ms    p(95)=370ms
     http_reqs......................: 4500    74.7/s
     response_time..................: avg=145ms   min=12ms    med=98ms    p(95)=380ms p(99)=820ms ← 1000ms 이하 ✅
     vus............................: 50      min=10      max=100
```

**SLA (Service Level Agreement) 설정 예시:**
```
목표: p95 < 500ms, p99 < 1,000ms, 에러율 < 1%
→ 현재: p95=380ms ✅, p99=820ms ✅, 에러율=0% ✅
→ 통과! 배포 가능
```

## 통합 실전 예제: Express 앱 성능 최적화

지금까지 배운 모든 기법을 하나의 Express 앱에 적용한 최종 예제입니다.

```javascript
// optimized-app.js
const express = require('express');
const cluster = require('cluster');
const os = require('os');
const compression = require('compression');
const responseTime = require('response-time');
const helmet = require('helmet');
const NodeCache = require('node-cache');
const { performance } = require('perf_hooks');

const cache = new NodeCache({ stdTTL: 300 });

// 클러스터 모드: 프로덕션에서만 활성화
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const cpuCount = os.cpus().length;
  console.log(`[Master] ${cpuCount}개 워커 생성 중...`);
  for (let i = 0; i < cpuCount; i++) cluster.fork();
} else {
  const app = express();

  // 1. 보안 + 압축 + 응답 시간 모니터링
  app.use(helmet());
  app.use(compression({ level: 6, threshold: 1024 }));
  app.use(responseTime((req, res, time) => {
    if (time > 1000) {
      console.warn(`[Slow Request] ${req.method} ${req.originalUrl} (${time.toFixed(0)}ms)`);
    }
  }));

  // 2. GET 요청 In-Memory 캐싱
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = `route:${req.originalUrl}`;
    const cached = cache.get(key);
    if (cached) {
      // 히트 시 Cache-Control 헤더 포함
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // 원본 json() 메서드 캡처
    res.sendResponse = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data);
      res.set('X-Cache', 'MISS');
      res.sendResponse(data);
    };
    next();
  });

  // 3. Event Loop 지연 모니터링
  setInterval(() => {
    const start = Date.now();
    setImmediate(() => {
      const delay = Date.now() - start - 1;
      if (delay > 100) {
        console.warn(`[Event Loop] ${delay}ms 지연 감지!`);
      }
    });
  }, 5000);

  // 4. 라우트
  app.get('/api/products', async (req, res) => {
    const products = [
      { id: 1, name: 'Product A', price: 10000 },
      { id: 2, name: 'Product B', price: 20000 },
    ];
    res.json(products);
  });

  // 5. 서버 시작
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}
```

```bash
# 실행
NODE_ENV=production node optimized-app.js

# 부하 테스트
autocannon -c 50 -d 20 http://localhost:3000/api/products

# 모니터링
pm2 monit
```

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>프로파일링 없이 그냥 코드만 최적화해도 되나요?</strong></summary>

되지 않습니다. "측정하지 않으면 최적화할 수 없습니다"는 성능 튜닝의 제1원칙입니다. 실제 사례를 보면, 100ms가 걸리는 함수를 추측으로 최적화하는 데 3시간을 쏟았지만, 실제 병목은 전혀 다른 곳(DB 쿼리)에 있었습니다. 프로파일링으로 5분 만에 진짜 병목을 찾아 1줄 수정으로 3,000ms를 200ms로 줄일 수 있습니다. 항상 프로파일러로 확인한 후 최적화하세요.
</details>

<details>
<summary><strong>싱글 스레드인데 Cluster는 어떻게 멀티코어를 활용하나요?</strong></summary>

마스터 프로세스가 `SO_REUSEADDR` 옵션으로 포트를 열고, TCP 연결을 라운드 로빈으로 워커에 분배합니다. 각 워커는 독립된 V8 인스턴스에서 실행되므로 각자의 이벤트 루프, GC, 메모리를 가집니다. 단, 인메모리 상태(세션, 캐시)는 공유되지 않으므로, Redis 같은 외부 저장소가 필요합니다.
</details>

<details>
<summary><strong>Redis 캐싱은 항상 효과적인가요?</strong></summary>

아니요. 캐싱은 **자주 조회되지만 자주 변경되지 않는 데이터**에 효과적입니다. 다음과 같은 조건에서는 캐싱이 오히려 독이 됩니다:
- **실시간 데이터** (주식 시세, 채팅) → 캐시 무효화 오버헤드만 증가
- **자주 변경되는 데이터** (1초마다 업데이트) → TTL 설정과 무효화 비용이 이득보다 큼
- **극히 드물게 조회되는 데이터** → 캐시 미스 비용만 발생
</details>

<details>
<summary><strong>캐시 TTL은 어떻게 결정하나요?</strong></summary>

데이터의 변경 빈도와 허용 가능한 오래됨(staleness)을 기준으로 결정합니다. 일반적인 공식은 `TTL = 허용 가능한 최대 오래됨 × 0.5 ~ 0.8`입니다. 예를 들어 10분 전 데이터도 괜찮다면 TTL은 300~480초로 설정합니다. 데이터 변경 주기를 알고 있다면 그 주기의 50~80%로 설정하는 것이 좋습니다.
</details>

## 요약

- **프로파일링** — Chrome DevTools, clinic.js로 CPU/Memory 병목 분석, Flamegraph로 핫 스팟 식별
- **GC 모니터링** — GC 시간이 CPU의 15% 이상이면 메모리 누수 의심
- **메모리 누수** — 전역 변수, 클로저, 이벤트 리스너, 타이머 참조 해제가 핵심
- **Cluster** — SO_REUSEADDR로 포트 공유, CPU 코어 수만큼 거의 선형 확장 (3~4코어에서 ~3.8x)
- **캐싱** — Node-cache(단일 서버) vs Redis(분산) vs HTTP Cache(정적 파일) 상황별 선택
- **Stream** — 64KB 청크 단위 처리로 1GB 파일도 안전하게 처리, Backpressure로 메모리 조절
- **부하 테스트** — autocannon/k6로 p95/p99 측정, SLA 기준 충족 확인 후 배포
