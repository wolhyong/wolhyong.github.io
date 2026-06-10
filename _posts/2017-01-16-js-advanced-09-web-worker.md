---
layout: post
title: "자바스크립트 Web Worker - 멀티스레드 프로그래밍, 메시지 패싱 정리"
description: "Web Worker로 메인 스레드를 블로킹하지 않는 무거운 작업을 처리하는 방법과 메시지 패싱 패턴을 학습합니다."
date: 2017-01-16 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, web-worker, concurrency, 웹]
---

자바스크립트는 싱글 스레드이지만, Web Worker를 사용하면 별도 스레드에서 무거운 작업을 수행할 수 있습니다. 메인 스레드의 UI 응답성을 유지하면서 동시에 작업을 처리할 수 있습니다.

## Web Worker 기본 사용법

```javascript
// worker.js — 별도 스레드에서 실행
self.onmessage = function(e) {
  const { numbers } = e.data;
  const sum = numbers.reduce((a, b) => a + b, 0);
  self.postMessage({ sum });
};

// main.js — 메인 스레드
const worker = new Worker("./worker.js");

worker.postMessage({ numbers: Array.from({ length: 1000000 }, (_, i) => i) });

worker.onmessage = function(e) {
  console.log("결과:", e.data.sum);
};
```

## 메시지 패싱 패턴

```javascript
// 구조화된 메시지로 작업 관리
class TaskRunner {
  constructor(workerPath) {
    this.worker = new Worker(workerPath);
    this.taskId = 0;
    this.pending = new Map();
  }

  run(taskType, data) {
    return new Promise((resolve, reject) => {
      const id = this.taskId++;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, taskType, data });
    });
  }

  init() {
    this.worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const task = this.pending.get(id);
      if (task) {
        this.pending.delete(id);
        error ? task.reject(new Error(error)) : task.resolve(result);
      }
    };
  }
}

// 사용
const runner = new TaskRunner("./worker.js");
runner.init();
const sum = await runner.run("sum", [1, 2, 3, 4, 5]);
```

## SharedArrayBuffer와 Atomics

```javascript
// 공유 메모리로 스레드 간 데이터 교환
const buffer = new SharedArrayBuffer(1024);
const arr = new Int32Array(buffer);

// 메인 스레드
arr[0] = 42;
worker.postMessage(buffer);

// Worker 스레드에서 읽기 가능
Atomics.add(arr, 0, 1); // 원자적 연산
```

##언제 사용하나 Web Worker

- 대용량 데이터 처리 (정렬, 파싱, 이미지 처리)
- 복잡한 수학 연산
- 암호화/복호화
- 무거운 JSON 파싱

## 마무리

- **Web Worker**는 메인 스레드를 블로킹하지 않고 무거운 작업을 처리합니다
- Worker와의 통신은 **`postMessage`/`onmessage`** 로 이루어집니다
- Worker는 DOM에 직접 접근할 수 없으므로, 결과를 메시지로 전달합니다
- 간단한 작업에는 **`requestIdleCallback`** 이 더 효율적일 수 있습니다

다음 수업에서는 자바스크립트 테스팅을 학습합니다!
