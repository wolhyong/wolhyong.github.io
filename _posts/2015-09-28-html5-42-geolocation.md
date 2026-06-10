---
layout: post
title: "WebSocket — 브라우저에서 실시간 양방향 통신 구현하기"
description: "WebSocket으로 실시간 양방향 통신을 구현하는 방법은? HTTP와 WebSocket의 차이, 연결·메시지·종료 이벤트, JSON 데이터 전송, 재연결 로직, 하트비트 패턴, 채팅 UI 구현 예제까지 다룹니다."
date: 2015-09-28 00:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 39
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

## 핵심

- WebSocket은 한 번 연결하면 양방향으로 실시간 메시지를 주고받을 수 있습니다
- JSON 기반 메시지 타입 프로토콜로 여러 이벤트를 처리합니다
- 지수 백오프(Exponential Backoff)를 사용한 자동 재연결로 안정성을 높입니다
- 25초 주기 하트비트로 방화벽에 의한 연결 끊김을 방지합니다

다음 글에서는 Web Storage API — localStorage와 sessionStorage를 다룹니다.


## 실전 예제로 이해하기

HTML의 WebSocket 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 WebSocket을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSocket 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>WebSocket에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 WebSocket을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. WebSocket 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 WebSocket을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.
