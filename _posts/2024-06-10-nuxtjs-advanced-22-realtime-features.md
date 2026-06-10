---


layout: post


title: "Nuxt.js 실시간 기능 — WebSocket 채팅, 실시간 알림, 협업 편집 구현"


description: "Nuxt.js에서 실시간 기능을 구현하는 과정을 시스템 레벨에서 심층 학습합니다. WebSocket 연결이 HTTP Upgrade 요청을 통해 ws/wss 프로토콜로 전환되고 핸드셰이크에서 Sec-WebSocket-Key/Sec-WebSocket-Accept로 연결을 검증하는 과정, Nitro의 defineWebSocketHandler()가 h3의 handleUpgrade()를 통해 WebSocket 이벤트(message/close/error)를 처리하는 방식, BroadcastChannel API가 동일 출처의 여러 탭 간 메시지를 동기화하는 과정, SSE(Server-Sent Events)가 서버에서 클라이언트로 단방향 알림 스트림을 전송하는 방식, CRDT(Conflict-free Replicated Data Type) 기반 협업 편집이 Yjs 라이브러리로 오프라인/온라인 상태에서 동시 편집 충돌을 해결하는 원리를 다룹니다."


date: 2024-06-10 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, websocket, realtime, notification, collaboration, yjs, broadcast]


level: advanced


---





Nuxt.js에서 실시간 기능은 WebSocket, SSE, BroadcastChannel API로 구현합니다.





> **핵심 정리** · WebSocket은 HTTP Upgrade 요청으로 ws 프로토콜로 전환됩니다. Nitro의 `defineWebSocketHandler()`가 `h3.handleUpgrade()`로 WebSocket 이벤트를 처리합니다. BroadcastChannel API는 동일 출처의 여러 탭을 동기화합니다. CRDT 기반 Yjs 라이브러리는 동시 편집 충돌을 해결합니다.





---





## 수업 목표





- WebSocket 핸드셰이크 과정을 이해합니다.


- BroadcastChannel API의 탭 간 동기화를 이해합니다.


- SSE로 실시간 알림을 구현하는 방법을 이해합니다.


- CRDT와 Yjs의 협업 편집 원리를 이해합니다.





## 실시간 알림 (SSE + BroadcastChannel)





```typescript


// server/api/notifications.ts


import { defineEventHandler, setHeader } from 'h3'





interface Notification {


  id: string


  type: 'post' | 'comment' | 'like'


  message: string


  timestamp: string


}





const clients = new Map<string, { send: (data: string) => void }>()





export default defineEventHandler(async (event) => {


  setHeader(event, 'Content-Type', 'text/event-stream')


  setHeader(event, 'Cache-Control', 'no-cache')


  setHeader(event, 'Connection', 'keep-alive')





  const clientId = crypto.randomUUID()





  clients.set(clientId, {


    send: (data: string) => {


      event.node.res.write(`data: ${data}\n\n`)


    }


  })





  // 초기 연결 확인


  event.node.res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`)





  // 연결 종료 시 정리


  event.node.req.on('close', () => {


    clients.delete(clientId)


  })


})





// 다른 API에서 알림 전송


export function sendNotification(notification: Notification) {


  const data = JSON.stringify(notification)


  clients.forEach(client => {


    try { client.send(data) } catch { /* ignore */ }


  })


}


```





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: WebSocket과 SSE 중 실시간 알림에 어떤 것이 더 적합한가요?</strong></summary>





실시간 알림에는 **SSE**가 더 적합합니다. SSE는 서버→클라이언트 단방향 통신이므로 알림 전송에 충분하고, EventSource API가 자동 재연결을 처리하므로 구현이 간단합니다. WebSocket은 양방향 통신이 필요한 실시간 채팅, 게임, 협업 편집에 적합합니다. SSE는 HTTP 프로토콜 위에서 동작하므로 방화벽/프록시에서 차단될 위험이 적고, `last-event-id`로 재연결 시 놓친 이벤트를 자동으로 복구할 수 있습니다.


</details>





<details>


<summary><strong>Q: BroadcastChannel API는 어떤 상황에서 사용하나요?</strong></summary>





BroadcastChannel API는 **동일 출처(same origin)**의 다른 브라우저 탭/윈도우 간 메시지를 동기화합니다. 사용 사례: (1) 사용자가 여러 탭에서 사이트를 보고 있을 때, 한 탭에서 로그아웃하면 모든 탭에서 로그아웃 처리. (2) 한 탭에서 알림을 읽으면 다른 탭의 알림 배지도 업데이트. (3) 한 탭에서 데이터를 변경하면 다른 탭의 캐시를 무효화. WebSocket 연결이 하나의 탭에만 있을 때, BroadcastChannel으로 다른 탭과 상태를 공유할 수 있습니다.


</details>





<details>


<summary><strong>Q: Yjs 라이브러리의 CRDT는 어떻게 동작하나요?</strong></summary>





Yjs는 CRDT(Conflict-free Replicated Data Type)를 사용하여 동시 편집 충돌을 해결합니다. 각 사용자의 편집 작업은 **삽입/삭제 연산**으로 표현되고, 각 연산에는 **고유 ID(클라이언트 ID + 로컬 시퀀스 번호)**가 할당됩니다. 동시에 발생한 편집은 ID를 기준으로 전체 순서(total order)로 정렬됩니다. 두 사용자가 같은 위치에 다른 텍스트를 동시에 삽입하면, 클라이언트 ID가 작은 쪽이 먼저 위치합니다. Yjs는 중앙 서버 없이 P2P로도 동작하며(webrtc/y-websocket), 모든 클라이언트가 동일한 최종 상태에 도달함을 수학적으로 보장합니다.


</details>





<details>


<summary><strong>Q: 실시간 연결을 프로덕션에서 확장하려면 어떻게 해야 하나요?</strong></summary>





단일 서버의 WebSocket 연결 수(Nginx 기본값 1024)를 초과하면 확장이 필요합니다. (1) **Redis Pub/Sub**: 여러 서버 인스턴스가 Redis Pub/Sub 채널을 구독하여 메시지를 브로드캐스트합니다. (2) **Socket.IO**: Redis 어댑터로 여러 서버 인스턴스를 연결하고, 폴백으로 HTTP 롱 폴링을 지원합니다. (3) **WebSocket Proxies**: Nginx/AWS ALB의 WebSocket 지원 프록시를 사용하여 연결을 여러 서버로 분산합니다. (4) **서버리스 WebSocket**: Vercel/Cloudflare의 WebSocket 지원 serverless 함수를 사용합니다. 대규모 실시간 애플리케이션(수만 동시 연결)은 전용 WebSocket 서버(Pusher, Ably, AWS API Gateway WebSocket)를 고려합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **WebSocket** | 양방향 실시간 통신 | HTTP Upgrade → ws/wss 프로토콜 전환 |


| **SSE** | 서버→클라이언트 스트림 | text/event-stream + EventSource 자동 재연결 |


| **BroadcastChannel** | 탭 간 동기화 | 동일 출처 여러 탭 → 메시지 브로드캐스트 |


| **CRDT (Yjs)** | 협업 편집 | 고유 ID 기반 연산 → 충돌 해결 |


| **Redis Pub/Sub** | 수평 확장 | 여러 서버 인스턴스 → 메시지 브로드캐스트 |





## 다음 수업





다음 글에서는 Nuxt 4 심층 분석 — Vite 6, Nitro 3, 새로운 기능을 배웁니다.


