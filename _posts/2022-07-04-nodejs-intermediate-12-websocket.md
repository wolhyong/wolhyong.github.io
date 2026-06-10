---
layout: post
title: "Node.js 실시간 통신 — WebSocket과 Socket.IO 내부 동작 완전 이해"
description: "Node.js에서 WebSocket과 Socket.IO가 실시간 통신을 구현하는 내부 원리 — HTTP Upgrade 핸드셰이크가 WebSocket 연결로 전환되는 정확한 과정, WebSocket 프레임(Frame) 구조의 비트별 분석, Socket.IO의 Engine.IO가 폴백(fallback) 전송을 처리하는 방식, Socket.IO 패킷 타입 6가지와 내부 프로토콜, 방(Room)이 메모리에 저장되는 구조와 브로드캐스트의 내부 구현, Redis 어댑터가 Pub/Sub으로 여러 서버 인스턴스의 이벤트를 동기화하는 원리, 재연결 전략과 지수 백오프 알고리즘"
date: 2022-07-04 10:00:00 +0900
category: nodejs
tags: [nodejs, websocket, socket-io, realtime, chat, bidirectional, engine-io, long-polling, redis-adapter, pubsub, room, namespace, bidirectional]
level: intermediate
---

실시간 통신은 현대 웹 애플리케이션의 핵심 기능입니다. 하지만 WebSocket이 단순히 "HTTP 연결을 업그레이드해서 양방향 통신을 한다"는 설명만으로는 내부 동작을 이해하기 어렵습니다. **HTTP Upgrade 핸드셰이크의 정확한 과정, WebSocket 프레임의 비트 구조, Socket.IO가 폴백(fallback)을 처리하는 방식**까지 이해해야 진정한 실시간 애플리케이션을 구축할 수 있습니다.

## 수업 목표

- **HTTP → WebSocket으로의 프로토콜 전환(Upgrade)** 과정을 정확히 이해합니다.
- **WebSocket 프레임 구조**를 비트 단위로 분석합니다.
- **Socket.IO의 내부 프로토콜(Engine.IO + Socket.IO 패킷)**을 이해합니다.
- **방(Room)과 네임스페이스(Namespace)**의 메모리 구조를 이해합니다.
- **Redis 어댑터**를 통한 수평 확장 원리를 학습합니다.
- **재연결 전략과 지수 백오프** 알고리즘을 이해합니다.
- SEO/AEO/GEO 최적화된 실시간 통신 애플리케이션 설계를 학습합니다.

---

## WebSocket 기초 — HTTP Upgrade 핸드셰이크

HTTP는 클라이언트가 요청해야 서버가 응답하는 **단방향** 프로토콜입니다. 반면 WebSocket은 한 번 연결이 수립되면 **전이중(Full-duplex)** 통신이 가능합니다.

```text
HTTP (단방향):
클라이언트 ──요청──────→ 서버  (Connection: close 후 연결 종료)
클라이언트 ←──응답─────── 서버  (매 요청마다 TCP 연결 수립/해제 반복)

WebSocket (전이중):
클라이언트 ──HTTP Upgrade──→ 서버  (1. 핸드셰이크)
클라이언트 ←──101 Switching── 서버  (2. 프로토콜 전환)
클라이언트 ←──프레임(Frame)─→ 서버  (3. 이후 양방향 데이터 전송, 연결 유지)
```

> **깊이 있는 설명 — HTTP Upgrade 핸드셰이크의 정확한 과정:**
>
> WebSocket 연결은 일반 HTTP 요청으로 시작됩니다. 클라이언트가 다음과 같은 특별한 헤더를 포함한 HTTP 요청을 보냅니다:
>
> ```http
> GET /chat HTTP/1.1
> Host: server.example.com
> Upgrade: websocket                  ← 프로토콜 전환 요청
> Connection: Upgrade                 ← Upgrade 헤더를 따르겠다는 의미
> Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==  ← 보안 검증용 키 (16바이트 랜덤 Base64)
> Sec-WebSocket-Version: 13           ← WebSocket 프로토콜 버전
> ```
>
> 서버는 이 요청을 받아 `Sec-WebSocket-Key`의 유효성을 확인하고, 특정 GUID(`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)와 연결하여 SHA-1 해시 후 Base64로 인코딩한 값을 `Sec-WebSocket-Accept` 헤더에 담아 응답합니다:
>
> ```http
> HTTP/1.1 101 Switching Protocols
> Upgrade: websocket
> Connection: Upgrade
> Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
> ```
>
> **101 Switching Protocols** 응답을 받은 후, 기존 TCP 연결은 HTTP 프로토콜에서 **WebSocket 프로토콜로 전환**됩니다. 이후부터는 HTTP 헤더 없이 **바이너리 프레임**만 주고받습니다.

---

## WebSocket 프레임 구조 — 비트 단위 분석

WebSocket 연결이 수립된 후의 모든 데이터는 **프레임(Frame)** 단위로 전송됩니다. 각 프레임은 다음과 같은 구조를 가집니다:

```text
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+-------------------------------+
|     Extended payload length continued, if payload len == 127  |
+-------------------------------+-------------------------------+
|               Masking-Key, if MASK set to 1                   |
+-------------------------------+-------------------------------+
|        Payload Data (실제 메시지 내용)                          |
+---------------------------------------------------------------+
```

> **코드 분석 — 각 필드의 의미:**
>
> | 필드 | 비트 수 | 설명 |
> |------|:------:|------|
> | **FIN** | 1 | 마지막 프레임 여부 (1=완료, 0=더 있음, 단편화) |
> | **RSV1~3** | 1×3 | 확장용 (보통 0, 압축 시 RSV1=1) |
> | **opcode** | 4 | 프레임 타입 (0=연속, 1=텍스트, 2=바이너리, 8=종료, 9=Ping, 10=Pong) |
> | **MASK** | 1 | 클라이언트→서버는 항상 1 (마스킹 필수), 서버→클라이언트는 0 |
> | **Payload Len** | 7 | 페이로드 길이 (0~125면 바로 길이, 126이면 다음 2바이트, 127이면 다음 8바이트) |
> | **Masking-Key** | 32 | MASK=1인 경우 4바이트 키 (클라이언트가 보낼 때 데이터를 XOR 마스킹) |
> | **Payload Data** | 가변 | 실제 전송 데이터 (텍스트 또는 바이너리) |
>
> **왜 클라이언트는 데이터를 마스킹해야 할까?**
>
> WebSocket 사양(RFC 6455)은 클라이언트에서 서버로 보내는 모든 프레임에 **마스킹(Masking)**을 요구합니다. 4바이트 키로 데이터를 XOR 연산하는 이유는 **캐시 오염(Cache Poisoning)** 공격을 방지하기 위해서입니다. 초기 HTTP 프록시가 WebSocket 프레임을 HTTP 요청으로 오인하여 캐시에 저장하는 것을 막습니다.
>
> 서버→클라이언트는 마스킹이 필요 없습니다. 서버가 보내는 데이터는 이미 신뢰할 수 있는 출처이기 때문입니다.

---

## Socket.IO 시작하기 — 내부 프로토콜

```bash
npm install socket.io
```

```javascript
// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'] // WebSocket 우선, 폴백으로 polling
});

io.on('connection', (socket) => {
  console.log('새 클라이언트 연결:', socket.id);

  socket.on('disconnect', () => {
    console.log('클라이언트 연결 해제:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Socket.IO 서버: http://localhost:3000');
});
```

> **깊이 있는 설명 — Socket.IO의 내부 프로토콜 계층:**
>
> Socket.IO는 **두 개의 프로토콜 계층**으로 구성됩니다:
>
> ```
> ┌─────────────────────────────────────┐
> │   Socket.IO 프로토콜 (레이어 2)      │ ← 이벤트, 방, 네임스페이스
> │   - Packet type (0-6)              │
> │   - Namespace (/chat, /admin)      │
> │   - Event name + data              │
> ├─────────────────────────────────────┤
> │   Engine.IO 프로토콜 (레이어 1)      │ ← 전송, 재연결, 폴백
> │   - Transport (websocket/polling)  │
> │   - Heartbeat (ping/pong)          │
> │   - Upgrade negotiation            │
> ├─────────────────────────────────────┤
> │   WebSocket / HTTP Long Polling     │ ← 실제 전송 계층
> └─────────────────────────────────────┘
> ```
>
> **Engine.IO**가 전송 계층을 담당합니다. WebSocket을 지원하지 않는 환경(예: 일부 기업 방화벽)에서는 **HTTP Long Polling**으로 자동 폴백합니다. `transports: ['websocket', 'polling']`은 **WebSocket을 먼저 시도하고, 실패하면 Polling**으로 대체한다는 의미입니다.
>
> **Socket.IO 패킷 타입 6가지:**
>
> | 타입 | 코드 | 설명 |
> |:----:|:----:|------|
> | **CONNECT** | 0 | 네임스페이스 연결 요청 |
> | **DISCONNECT** | 1 | 연결 종료 |
> | **EVENT** | 2 | 일반 이벤트 데이터 |
> | **ACK** | 3 | 이벤트에 대한 확인 응답 |
> | **CONNECT_ERROR** | 4 | 연결 실패 |
> | **BINARY_EVENT** | 5 | 바이너리 데이터 이벤트 |
> | **BINARY_ACK** | 6 | 바이너리 데이터 확인 응답 |
>
> 예를 들어 클라이언트가 `socket.emit('chat message', '안녕')`을 보내면 실제로 전송되는 데이터는:
> ```
> 42/chat,["chat message","안녕"]
> ```
> 여기서 `4`는 Engine.IO의 메시지 타입, `2`는 Socket.IO의 EVENT 타입, `/chat`은 네임스페이스, `["chat message","안녕"]`은 JSON 인코딩된 이벤트 배열입니다.

---

## 이벤트 송수신 — 전송 범위 비교

```javascript
// 서버
io.on('connection', (socket) => {
  // 클라이언트로부터 이벤트 수신
  socket.on('chat message', (msg) => {
    console.log('받은 메시지:', msg);

    // 모든 클라이언트에게 브로드캐스트 (보낸 사람 포함)
    io.emit('chat message', {
      userId: socket.id,
      message: msg,
      timestamp: Date.now()
    });
  });

  // 특정 클라이언트에게만 전송
  socket.emit('welcome', '서버에 오신 것을 환영합니다!');

  // 보낸 클라이언트를 제외한 모두에게 전송
  socket.broadcast.emit('user connected', '새 사용자가 접속했습니다');
});
```

> **코드 분석 — 전송 범위의 4가지 수준:**
>
> Socket.IO는 이벤트를 전송할 때 **전송 범위**를 세밀하게 제어할 수 있습니다:
>
> ```javascript
> // 1. 모든 클라이언트 (보낸 사람 포함)
> io.emit('event', data);
>
> // 2. 모든 클라이언트 (보낸 사람 제외)
> socket.broadcast.emit('event', data);
>
> // 3. 특정 방의 모든 클라이언트 (보낸 사람 포함)
> io.to('room1').emit('event', data);
>
> // 4. 특정 방의 모든 클라이언트 (보낸 사람 제외)
> socket.to('room1').emit('event', data);
> ```
>
> **내부적으로, `io.emit()`은 연결된 모든 소켓을 순회하면서 이벤트를 전송**합니다. 방(Room)별 전송은 `io.sockets.adapter.rooms` Map에서 해당 방의 소켓 ID 목록을 가져와 전송합니다. 이 Map의 구조는 다음과 같습니다:
>
> ```
> Rooms Map:
> {
>   "room1" => Set { "socketId1", "socketId2", "socketId3" },
>   "room2" => Set { "socketId2", "socketId4" }
> }
> ```

---

## 방(Room) — 메모리 구조와 브로드캐스트 원리

```javascript
io.on('connection', (socket) => {
  // 방 입장
  socket.on('join room', (roomName) => {
    socket.join(roomName);
    console.log(`${socket.id}님이 ${roomName}방에 입장`);

    socket.to(roomName).emit('notification', {
      message: '새 사용자가 입장했습니다',
      userId: socket.id
    });
  });

  // 방 나가기
  socket.on('leave room', (roomName) => {
    socket.leave(roomName);
    socket.to(roomName).emit('notification', {
      message: '사용자가 퇴장했습니다',
      userId: socket.id
    });
  });

  // 방으로 메시지 전송
  socket.on('room message', ({ room, message }) => {
    io.to(room).emit('room message', {
      userId: socket.id,
      message,
      timestamp: Date.now()
    });
  });
});
```

> **깊이 있는 설명 — 방(Room)이 메모리에 저장되는 방식:**
>
> Socket.IO는 방 정보를 `io.sockets.adapter`에 저장합니다. 메모리 기반 어댑터(기본값)에서는 다음과 같은 JavaScript 객체로 관리됩니다:
>
> ```javascript
> // 서버 메모리 내부 구조 (단순화)
> adapter = {
>   rooms: Map {
>     'socketId1' => Set { 'socketId1' },          // 모든 소켓은 자신의 ID를 가진 방에 자동 입장
>     'socketId2' => Set { 'socketId2' },
>     'general'  => Set { 'socketId1', 'socketId3' },  // 'general' 방
>     'random'   => Set { 'socketId2', 'socketId4' }   // 'random' 방
>   },
>   sids: Map {
>     'socketId1' => Set { 'socketId1', 'general' },    // 소켓 1이 속한 방들
>     'socketId2' => Set { 'socketId2', 'random' },
>     'socketId3' => Set { 'socketId3', 'general' },
>     'socketId4' => Set { 'socketId4', 'random' }
>   }
> }
> ```
>
> **`io.to('general').emit('message', data)`가 실행될 때의 내부 동작:**
>
> 1. `adapter.rooms.get('general')` → `Set { 'socketId1', 'socketId3' }` 방의 소켓 목록 조회
> 2. 각 소켓 ID로 실제 소켓 객체를 찾음
> 3. 각 소켓의 `send()` 메서드 호출 (데이터 직렬화 + 전송)
>
> **대규모 방(수천 명의 사용자)에서 발생하는 문제:**
>
> `io.to('general').emit('data')`는 방에 속한 **모든 소켓을 동기적으로 순회**합니다. 수천 명이 있는 방에서는 이 순회 자체가 **수십 밀리초**가 소요될 수 있습니다. 따라서 방 규모가 클수록 메시지 전송에 **CPU 시간**이 비례하여 증가합니다.

---

## 네임스페이스(Namespace) — 독립적인 통신 공간

```javascript
// 네임스페이스 — 서로 다른 통신 채널
const chatNamespace = io.of('/chat');
const adminNamespace = io.of('/admin');

// /chat 네임스페이스
chatNamespace.on('connection', (socket) => {
  console.log('채팅 네임스페이스 연결:', socket.id);
  socket.on('message', (msg) => chatNamespace.emit('message', msg));
});

// /admin 네임스페이스 (인증 필요)
adminNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token && jwt.verify(token, process.env.JWT_SECRET)) {
    return next();
  }
  next(new Error('인증 실패'));
});

adminNamespace.on('connection', (socket) => {
  console.log('관리자 연결:', socket.id);
  socket.on('get stats', () => {
    socket.emit('stats', {
      totalConnections: io.engine.clientsCount,
      rooms: io.sockets.adapter.rooms.size
    });
  });
});
```

> **깊이 있는 설명 — 네임스페이스와 방의 차이:**
>
> 네임스페이스(Namespace)와 방(Room) 모두 통신 채널을 분리하는 역할을 하지만, **스코프(범위)가 다릅니다**:
>
> | 구분 | 네임스페이스 | 방 |
> |------|-------------|-----|
> | **목적** | 완전히 독립적인 통신 공간 | 같은 공간 내에서의 세부 채널 |
> | **연결 방식** | 클라이언트가 명시적으로 연결 (`io('/chat')`) | 서버가 소켓을 추가 (`socket.join('room')`) |
> | **미들웨어** | 네임스페이스별 독립적 미들웨어 가능 | 없음 |
> | **인증** | 네임스페이스별로 다르게 적용 가능 | 없음 |
> | **메모리** | 독립적인 어댑터 인스턴스 | 같은 어댑터의 Map 엔트리 |
> | **사용 예** | `/chat`(채팅), `/admin`(관리자), `/game`(게임) | 특정 채팅방, 특정 게임 방 |
>
> 네임스페이스는 **완전히 분리된 Socket.IO 인스턴스**와 유사합니다. 각 네임스페이스는 자신의 미들웨어와 이벤트 핸들러를 가지며, 다른 네임스페이스의 이벤트는 절대 전달되지 않습니다.

---

## 실전 채팅 애플리케이션

```javascript
// server/chat.js
const users = new Map(); //  Map<socketId, username>

io.on('connection', (socket) => {
  console.log('사용자 연결:', socket.id);

  socket.on('set username', (username) => {
    users.set(socket.id, username);
    io.emit('user list', Array.from(users.values()));
    socket.broadcast.emit('system message', {
      message: `${username}님이 접속했습니다`,
      type: 'join'
    });
  });

  socket.on('send message', (message) => {
    const username = users.get(socket.id);
    io.emit('new message', {
      id: Date.now(),
      username,
      message,
      timestamp: new Date().toLocaleTimeString(),
      userId: socket.id
    });
  });

  socket.on('private message', ({ to, message }) => {
    const username = users.get(socket.id);
    io.to(to).emit('private message', {
      from: username,
      message,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    io.emit('user list', Array.from(users.values()));
    io.emit('system message', {
      message: `${username}님이 퇴장했습니다`,
      type: 'leave'
    });
  });
});
```

> **실전 노하우 — Map을 사용한 사용자 관리의 한계:**
>
> 위 코드는 `Map<socketId, username>`을 사용하여 메모리에 사용자 정보를 저장합니다. 이 방식의 한계:
>
> - **서버 재시작 시 모든 데이터 소멸** — Redis나 데이터베이스에 저장하는 것이 좋음
> - **한 사용자가 여러 탭을 열면?** — 같은 사용자가 여러 소켓 ID를 가짐 (중복 표시)
> - **연결 해제 시 username이 undefined인 경우?** — username 설정 전에 연결이 끊어지면 `undefined`님이 퇴장
>
> **개선 방안:**
> ```javascript
> // 사용자 ID 기반으로 그룹화
> const users = new Map(); // Map<userId, { username, sockets: Set<socketId> }>
> ```

---

## 연결 관리와 재연결 전략

```javascript
// 클라이언트 — 재연결 설정
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,      // 초기 지연 1초
  reconnectionDelayMax: 5000,   // 최대 지연 5초 (지수 백오프 상한)
  randomizationFactor: 0.5,     // 지연 시간에 랜덤성 추가 (서버 부하 분산)
  timeout: 20000                // 연결 타임아웃 20초
});

socket.on('connect', () => {
  console.log('연결됨:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('연결 해제:', reason); // 'transport close' | 'transport error' | 'io server disconnect'
});

socket.on('connect_error', (error) => {
  console.error('연결 에러:', error.message);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`재연결 시도 ${attemptNumber}회`);
});
```

> **깊이 있는 설명 — 지수 백오프(Exponential Backoff) 알고리즘:**
>
> Socket.IO의 재연결 지연 시간은 **지수 백오프 + 랜덤화**로 계산됩니다:
>
> ```javascript
> // 내부 알고리즘 (단순화)
> function getReconnectionDelay(attempt) {
>   const base = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
>   // attempt=1: 1000ms, attempt=2: 2000ms, attempt=3: 4000ms, attempt=4: 5000ms(max)
>   const randomFactor = 0.5 * Math.random(); // 0 ~ 0.5 사이 랜덤
>   return base * (1 + randomFactor);
> }
> // attempt=3: 4000ms * (1 + 0.23) = 4920ms
> // attempt=3: 4000ms * (1 + 0.47) = 5880ms
> ```
>
> **랜덤화가 중요한 이유:** 수천 개의 클라이언트가 동시에 연결이 끊어졌다가 동시에 재연결을 시도하면 **Thundering Herd(떼까마귀 떼) 현상**이 발생하여 서버가 폭주할 수 있습니다. 랜덤화로 각 클라이언트의 재연결 시간을 분산시킵니다.

---

## 서버 확장 — Redis 어댑터 원리

```bash
npm install @socket.io/redis-adapter ioredis
```

```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('ioredis');

const pubClient = createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

> **깊이 있는 설명 — Redis 어댑터가 여러 서버 인스턴스를 연결하는 방법:**
>
> Redis 어댑터는 **Redis Pub/Sub** 기능을 사용하여 여러 서버 인스턴스 간에 이벤트를 동기화합니다:
>
> ```
>                           ┌───────────┐
>                    ┌────→│ Server A  │
>                    │     └───────────┘
>   ┌──────────┐    │     ┌───────────┐
>   │  Redis   │────┼────→│ Server B  │
>   │  Pub/Sub │    │     └───────────┘
>   └──────────┘    │     ┌───────────┐
>                    └────→│ Server C  │
>                          └───────────┘
> ```
>
> **동작 과정:**
>
> 1. Server A의 `io.to('room1').emit('event', data)` 호출
> 2. A의 Redis 어댑터가 이 이벤트를 **Redis Pub 채널**에 발행
> 3. Redis가 연결된 모든 **Sub 클라이언트**(Server B, Server C의 어댑터)에게 이벤트 전달
> 4. B와 C의 어댑터가 자신의 로컬에 있는 room1의 소켓을 찾아 이벤트 전송
>
> **중요한 점:** Redis 어댑터는 이벤트를 **최대 한 번(at-most-once)** 전달합니다. 이벤트 손실이 발생할 수 있으므로, 중요 메시지는 **데이터베이스에 먼저 저장**하고 이벤트로 알리는 방식을 사용해야 합니다.

---

## 전송 방식 성능 비교

| 방식 | 프로토콜 | 지연 시간 | 서버 부하 | 방화벽 호환성 | 브라우저 지원 |
|------|---------|:--------:|:--------:|:-----------:|:----------:|
| **WebSocket** | ws/wss | **~10ms** | 낮음 | ⚠️ 차단 가능 | 97% |
| **HTTP Long Polling** | http/https | ~200ms | 높음 (지속적 연결) | ✅ 통과 | 100% |
| **Server-Sent Events** | http/https | ~50ms | 낮음 | ✅ 통과 | 96% (IE 제외) |
| **WebRTC DataChannel** | UDP/SCTP | **~5ms** | 중간 | ⚠️ NAT/방화벽 | 95% |

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Socket.IO와 기본 WebSocket의 차이는 무엇인가요?</strong></summary>

Socket.IO는 WebSocket 위에 다음과 같은 기능을 추가한 라이브러리입니다: 자동 재연결, HTTP Long Polling 폴백(WebSocket이 차단된 환경), 방(Room)과 네임스페이스, 이벤트 기반 메시징, ACK(확인 응답), 바이너리 지원. 순수 WebSocket은 더 가볍고 빠르지만, 이러한 기능을 직접 구현해야 합니다.
</details>

<details>
<summary><strong>Socket.IO 서버를 여러 대로 확장하려면 어떻게 하나요?</strong></summary>

Redis 어댑터를 사용하면 됩니다. 각 서버 인스턴스가 Redis Pub/Sub을 통해 이벤트를 공유합니다. 이 때 각 서버 인스턴스의 방(Room) 정보는 Redis에 저장되지 않고 **서버 로컬 메모리**에만 저장되므로, 특정 방의 클라이언트가 여러 서버에 분산되어 있어도 올바르게 이벤트가 전달됩니다.
</details>

<details>
<summary><strong>Socket.IO는 얼마나 많은 동시 연결을 처리할 수 있나요?</strong></summary>

서버 사양에 따라 다르지만, **단일 서버로 약 10,000~20,000개의 동시 연결**을 처리할 수 있습니다. 그 이상은 Redis 어댑터로 수평 확장해야 합니다. 연결 수보다 더 중요한 것은 **메시지 처리량**입니다. 모든 연결이 초당 10개의 메시지를 보내면 10,000 연결 기준으로 초당 100,000개의 메시지를 처리해야 합니다.
</details>

---

## 요약

- **WebSocket 핸드셰이크**는 HTTP Upgrade 헤더로 시작하여 101 Switching Protocols 응답 후 프로토콜이 전환됩니다.
- **WebSocket 프레임**은 FIN/opcode/MASK/Payload 등 비트 단위 필드로 구성되며, 클라이언트 데이터는 반드시 마스킹되어야 합니다.
- **Socket.IO**는 Engine.IO(전송 계층) + Socket.IO(이벤트 계층)의 2계층 프로토콜로 구성됩니다.
- **방(Room)**은 서버 메모리의 `Map<roomName, Set<socketId>>` 구조로 관리됩니다.
- **네임스페이스**는 완전히 독립적인 통신 공간으로, 미들웨어와 이벤트 핸들러를 별도로 가집니다.
- **Redis 어댑터**는 Pub/Sub으로 여러 서버 인스턴스 간 이벤트를 동기화합니다.
- **재연결 전략**은 지수 백오프 + 랜덤화로 Thundering Herd 문제를 방지합니다.
- 실시간 기능이 필요하면 Socket.IO, 최소한의 기능만 필요하면 기본 WebSocket을 선택하세요.
