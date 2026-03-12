---
layout: post
title: "WebSocket 완전 정리 — 브라우저에서 실시간 양방향 통신 구현하기"
description: "WebSocket API로 실시간 양방향 통신을 구현하는 방법을 정리합니다. HTTP와 WebSocket의 차이, 연결·메시지·종료 이벤트, JSON 데이터 전송, 재연결 로직, 하트비트 패턴, 간단한 실시간 채팅 UI 구현 예제까지 다룹니다."
date: 2015-03-06 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 36
tags: [html5, WebSocket, 실시간통신, 채팅, 재연결, 하트비트, JSON]
lang: ko
---

HTTP는 클라이언트가 요청해야만 서버가 응답합니다. 실시간 채팅, 주식 시세, 게임처럼 서버가 먼저 데이터를 보내야 하는 경우에는 WebSocket이 적합합니다.

---

## HTTP vs WebSocket

| 항목 | HTTP | WebSocket |
|------|------|-----------|
| 연결 방식 | 요청-응답 후 연결 종료 | 지속 연결 유지 |
| 방향 | 클라이언트 → 서버 (단방향) | 양방향 |
| 오버헤드 | 요청마다 헤더 전송 | 초기 핸드셰이크 후 최소 헤더 |
| 적합한 용도 | 일반 웹 요청 | 실시간 채팅, 알림, 게임 |

WebSocket은 HTTP 업그레이드 핸드셰이크로 시작합니다. 한 번 연결되면 HTTP 헤더 없이 작은 프레임으로 데이터를 주고받습니다.

---

## WebSocket API 기본

```javascript
// 연결 생성
const ws = new WebSocket('wss://chat.example.com/ws');
// ws:// = 일반, wss:// = TLS 암호화 (프로덕션에서 필수)

// 이벤트 핸들러
ws.addEventListener('open', () => {
  console.log('연결됨:', ws.url);
  console.log('readyState:', ws.readyState); // 1 = OPEN
});

ws.addEventListener('message', (event) => {
  console.log('수신:', event.data);
  // event.data는 문자열 또는 Blob/ArrayBuffer
});

ws.addEventListener('close', (event) => {
  console.log('연결 종료:', event.code, event.reason);
  // 1000 = 정상 종료, 1006 = 비정상 종료
});

ws.addEventListener('error', (error) => {
  console.error('WebSocket 오류:', error);
});
```

---

## readyState 값

| 값 | 상수 | 의미 |
|----|------|------|
| 0 | `CONNECTING` | 연결 시도 중 |
| 1 | `OPEN` | 연결됨, 통신 가능 |
| 2 | `CLOSING` | 연결 종료 중 |
| 3 | `CLOSED` | 연결 종료됨 |

---

## 메시지 전송

```javascript
// 문자열 전송
ws.send('안녕하세요');

// JSON 전송 (구조화된 데이터)
ws.send(JSON.stringify({
  type: 'chat',
  room: 'general',
  message: '안녕하세요!',
  timestamp: Date.now()
}));

// 전송 전 연결 상태 확인
if (ws.readyState === WebSocket.OPEN) {
  ws.send(JSON.stringify({ type: 'ping' }));
}
```

---

## JSON 기반 메시지 프로토콜

실무에서는 메시지 타입을 정의해서 처리합니다.

```javascript
class ChatClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = {};
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.dispatch(msg.type, msg.payload);
      } catch (e) {
        console.error('메시지 파싱 오류:', e);
      }
    });
  }

  // 메시지 타입별 핸들러 등록
  on(type, handler) {
    this.handlers[type] = handler;
    return this; // 체이닝 가능
  }

  dispatch(type, payload) {
    const handler = this.handlers[type];
    if (handler) handler(payload);
    else console.warn('처리되지 않은 메시지 타입:', type);
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  close() {
    this.ws?.close(1000, '사용자 종료');
  }
}

// 사용
const chat = new ChatClient('wss://chat.example.com/ws');
chat
  .on('welcome', (payload) => console.log('환영 메시지:', payload))
  .on('chat', (payload) => appendMessage(payload))
  .on('userJoin', (payload) => console.log(payload.username, '님 입장'))
  .on('error', (payload) => showError(payload.message));

chat.connect();
chat.send('join', { room: 'dev-talk', username: 'wolhyong' });
```

---

## 자동 재연결 로직

네트워크 불안정이나 서버 재시작 시 자동으로 재연결합니다.

```javascript
class ReconnectingWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.maxRetries = options.maxRetries || 5;
    this.retryDelay = options.retryDelay || 1000;
    this.retries = 0;
    this.handlers = {};
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      console.log('연결됨');
      this.retries = 0; // 재시도 카운터 초기화
      this.handlers.open?.();
    });

    this.ws.addEventListener('message', (e) => {
      this.handlers.message?.(JSON.parse(e.data));
    });

    this.ws.addEventListener('close', (e) => {
      if (e.code !== 1000 && this.retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, this.retries); // 지수 백오프
        console.log(`${delay}ms 후 재연결 시도 (${this.retries + 1}/${this.maxRetries})`);
        setTimeout(() => {
          this.retries++;
          this.connect();
        }, delay);
      }
    });
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }
}
```

---

## 하트비트 — 연결 유지

방화벽이나 프록시가 유휴 연결을 끊는 것을 방지합니다.

```javascript
class ChatWithHeartbeat {
  constructor(url) {
    this.url = url;
    this.pingInterval = null;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      this.startHeartbeat();
    });

    this.ws.addEventListener('close', () => {
      this.stopHeartbeat();
    });

    this.ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'pong') return; // 하트비트 응답 무시
      this.handleMessage(msg);
    });
  }

  startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000); // 25초마다 ping
  }

  stopHeartbeat() {
    clearInterval(this.pingInterval);
  }
}
```

---

## 실습: 채팅 UI

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>실시간 채팅</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #0d1117; color: #c9d1d9; font-family: sans-serif; margin: 0; }
    .chat { display: flex; flex-direction: column; height: 100vh; max-width: 600px; margin: 0 auto; }
    .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .msg { padding: 8px 12px; border-radius: 8px; max-width: 80%; }
    .msg.mine { background: #1f6feb; align-self: flex-end; }
    .msg.other { background: #21262d; align-self: flex-start; }
    .msg .name { font-size: 0.75rem; color: #8b949e; margin-bottom: 2px; }
    .input-area { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #30363d; }
    input { flex: 1; background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 8px 12px; color: #c9d1d9; }
    button { background: #238636; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; }
    .status { padding: 8px 16px; font-size: 0.75rem; color: #8b949e; text-align: center; }
  </style>
</head>
<body>
  <div class="chat">
    <div class="status" id="status">연결 중...</div>
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <input id="input" type="text" placeholder="메시지를 입력하세요..." maxlength="200">
      <button id="send-btn">전송</button>
    </div>
  </div>

  <script>
    const myName = '나';
    // 실제 서버 URL로 교체: const ws = new WebSocket('wss://your-server.com/ws');
    // 데모용 에코 서버 사용
    const ws = new WebSocket('wss://echo.websocket.events');
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('input');
    const statusEl = document.getElementById('status');

    ws.addEventListener('open', () => {
      statusEl.textContent = '● 연결됨';
      statusEl.style.color = '#3fb950';
    });

    ws.addEventListener('close', () => {
      statusEl.textContent = '● 연결 끊김';
      statusEl.style.color = '#f85149';
    });

    ws.addEventListener('message', (e) => {
      appendMessage({ name: '상대방', text: e.data, mine: false });
    });

    function sendMessage() {
      const text = inputEl.value.trim();
      if (!text || ws.readyState !== WebSocket.OPEN) return;

      ws.send(text);
      appendMessage({ name: myName, text, mine: true });
      inputEl.value = '';
    }

    function appendMessage({ name, text, mine }) {
      const div = document.createElement('div');
      div.className = `msg ${mine ? 'mine' : 'other'}`;
      div.innerHTML = `<div class="name">${name}</div><div>${text}</div>`;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    document.getElementById('send-btn').addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) sendMessage();
    });
  </script>
</body>
</html>
```

---

## 정리

- WebSocket은 한 번 연결하면 양방향으로 실시간 메시지를 주고받을 수 있습니다
- JSON 기반 메시지 타입 프로토콜로 다양한 이벤트를 처리합니다
- 지수 백오프(Exponential Backoff)를 사용한 자동 재연결로 안정성을 높입니다
- 25초 주기 하트비트로 방화벽에 의한 연결 끊김을 방지합니다

다음 글에서는 Web Storage API — localStorage와 sessionStorage를 다룹니다.