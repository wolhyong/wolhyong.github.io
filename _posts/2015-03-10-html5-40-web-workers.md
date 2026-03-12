---
layout: post
title: "Web Workers 완전 정리 — 무거운 작업을 백그라운드 스레드로 처리하기"
description: "Web Workers로 JavaScript의 단일 스레드 한계를 극복하는 방법을 정리합니다. Dedicated Worker 생성과 메시지 통신, 데이터 직렬화, Transferable Objects로 성능 최적화, SharedArrayBuffer를 사용한 공유 메모리, 실전 이미지 처리·검색 인덱싱 예제까지 다룹니다."
date: 2015-03-10 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 40
tags: [html5, WebWorkers, 멀티스레딩, 백그라운드처리, Transferable, SharedArrayBuffer, 성능최적화]
lang: ko
---

JavaScript는 기본적으로 단일 스레드입니다. 무거운 계산을 메인 스레드에서 실행하면 UI가 멈춥니다. Web Workers를 사용하면 별도 스레드에서 연산을 처리하고 결과만 메인 스레드로 전달할 수 있습니다.

---

## Web Workers가 필요한 상황

- 이미지 필터·압축·변환
- 대용량 데이터 정렬·검색·통계 계산
- 암호화·해시 계산
- JSON 파싱 (수 MB 이상의 큰 데이터)
- 실시간 WebSocket 메시지 처리

이런 작업을 메인 스레드에서 실행하면 사용자 클릭, 스크롤이 버벅입니다.

---

## Dedicated Worker 기본

```javascript
// main.js (메인 스레드)
const worker = new Worker('/workers/calc.js');

// 워커에게 메시지 전송
worker.postMessage({ type: 'calculate', data: [1, 2, 3, 4, 5] });

// 워커로부터 메시지 수신
worker.addEventListener('message', (event) => {
  console.log('계산 결과:', event.data.result);
});

// 오류 처리
worker.addEventListener('error', (error) => {
  console.error('Worker 오류:', error.message, error.filename, error.lineno);
});

// 워커 종료
// worker.terminate();
```

```javascript
// workers/calc.js (워커 스레드)
// 워커 안에서는 window, document에 접근할 수 없음
// fetch, setTimeout, WebSocket 등은 사용 가능

self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'calculate') {
    // 무거운 계산 (메인 스레드 차단 없음)
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = sum / data.length;

    // 결과를 메인 스레드로 전송
    self.postMessage({ type: 'result', result: { sum, avg } });
  }
});
```

---

## ES 모듈 Workers

```javascript
// workers/search.js
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7/dist/fuse.mjs';

let fuse;

self.addEventListener('message', ({ data }) => {
  if (data.type === 'init') {
    fuse = new Fuse(data.posts, {
      keys: ['title', 'content', 'tags'],
      threshold: 0.3,
    });
    self.postMessage({ type: 'ready' });
  }

  if (data.type === 'search') {
    const results = fuse.search(data.query).slice(0, 10);
    self.postMessage({ type: 'results', results });
  }
});
```

```javascript
// main.js
const searchWorker = new Worker('/workers/search.js', { type: 'module' });

// 게시물 데이터로 워커 초기화
searchWorker.postMessage({ type: 'init', posts: allPosts });

searchWorker.addEventListener('message', ({ data }) => {
  if (data.type === 'results') {
    renderSearchResults(data.results);
  }
});

// 검색창 입력 시
searchInput.addEventListener('input', (e) => {
  searchWorker.postMessage({ type: 'search', query: e.target.value });
});
```

---

## 데이터 전송 방식

**복사 (기본)**: 데이터가 직렬화되어 복사됩니다. 큰 데이터는 느립니다.

```javascript
const bigArray = new Float64Array(10_000_000);
worker.postMessage(bigArray); // 복사 — 메인 스레드에 원본 남아있음
```

**이전 (Transferable)**: 소유권이 워커로 이전됩니다. 복사 없이 매우 빠릅니다. 이전 후 메인 스레드에서는 접근 불가.

```javascript
const bigArray = new Float64Array(10_000_000);
worker.postMessage(bigArray, [bigArray.buffer]); // 이전 — 메인 스레드에서 사라짐
```

이미지 픽셀 데이터(`ImageData`), 오디오 버퍼 같은 대용량 데이터를 처리할 때 Transferable을 사용하면 성능이 크게 향상됩니다.

---

## 실전: 이미지 그레이스케일 변환

```javascript
// workers/image-filter.js
self.addEventListener('message', ({ data }) => {
  const { imageData } = data;
  const pixels = imageData.data; // Uint8ClampedArray [R,G,B,A, R,G,B,A, ...]

  for (let i = 0; i < pixels.length; i += 4) {
    const gray = pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114;
    pixels[i] = pixels[i+1] = pixels[i+2] = gray;
  }

  // 처리된 imageData를 Transferable로 반환
  self.postMessage({ imageData }, [imageData.data.buffer]);
});
```

```javascript
// main.js
const worker = new Worker('/workers/image-filter.js');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

async function applyGrayscale(imgElement) {
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;
  ctx.drawImage(imgElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    worker.onmessage = ({ data }) => {
      ctx.putImageData(data.imageData, 0, 0);
      resolve();
    };
    // ImageData는 Transferable이 아니므로 복사 전송
    worker.postMessage({ imageData });
  });
}
```

---

## Worker Pool — 여러 워커 관리

무거운 작업이 여러 개일 때 워커 풀을 만들어 병렬 처리합니다.

```javascript
class WorkerPool {
  constructor(workerUrl, poolSize = navigator.hardwareConcurrency || 4) {
    this.workers = Array.from({ length: poolSize },
      () => ({ worker: new Worker(workerUrl), busy: false }));
    this.queue = [];
  }

  run(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      const freeWorker = this.workers.find(w => !w.busy);

      if (freeWorker) {
        this.execute(freeWorker, task);
      } else {
        this.queue.push(task);
      }
    });
  }

  execute(workerObj, task) {
    workerObj.busy = true;
    workerObj.worker.onmessage = ({ data }) => {
      task.resolve(data);
      workerObj.busy = false;
      if (this.queue.length) {
        this.execute(workerObj, this.queue.shift());
      }
    };
    workerObj.worker.onerror = (e) => task.reject(e);
    workerObj.worker.postMessage(task.data);
  }
}

// 사용
const pool = new WorkerPool('/workers/calc.js');
const results = await Promise.all(chunks.map(chunk => pool.run(chunk)));
```

---

## 정리

- Web Workers는 메인 스레드와 분리된 별도 스레드에서 실행됩니다
- `postMessage` / `addEventListener('message')`로 양방향 통신합니다
- Transferable Objects를 사용하면 대용량 데이터를 복사 없이 전달합니다
- 이미지 처리, 검색 인덱싱, 암호화 등 무거운 작업에 활용합니다

다음 글에서는 Drag and Drop API — 드래그 가능한 UI 구현을 다룹니다.