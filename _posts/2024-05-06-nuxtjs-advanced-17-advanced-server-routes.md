---


layout: post


title: "Nuxt.js 고급 서버 라우트 — WebSocket, SSE, 미들웨어 체인, rate limiting 구현"


description: "Nuxt.js의 고급 서버 기능인 WebSocket, SSE, 미들웨어 체인, rate limiting의 내부 동작을 시스템 레벨에서 심층 학습합니다. h3의 handleUpgrade()가 Node.js http.Server의 upgrade 이벤트를 가로채 WebSocket 핸드셰이크를 처리하는 과정, SSE(Server-Sent Events)가 EventSource API로 단방향 텍스트 스트림을 구축하고 setHeader('Content-Type', 'text/event-stream')으로 연결을 유지하는 방식, 미들웨어 체인이 defineEventHandler()에서 return undefined로 next()를 호출하여 순차적으로 실행되는 과정, rate limiting이 Map<IP, { count, resetTime }>으로 메모리 내 토큰 버킷을 구현하고 429 Too Many Requests를 응답하는 방식을 다룹니다."


date: 2024-05-06 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, websocket, sse, middleware, rate-limiting, realtime]


level: advanced


---





Nuxt.js의 Nitro 서버는 기본 HTTP API 외에도 WebSocket, SSE, 복잡한 미들웨어 체인을 지원합니다.





> **핵심 정리** · h3의 `handleUpgrade()`로 WebSocket 핸드셰이크를 처리하고 `EventSource` API로 SSE를 구현합니다. 미들웨어 체인은 `return undefined`로 `next()`를 호출하여 순차 실행됩니다. rate limiting은 `Map<IP, { count, resetTime }>`으로 토큰 버킷을 구현합니다.





---





## 수업 목표





- WebSocket 핸드셰이크 과정을 이해합니다.


- SSE의 EventSource API 동작을 이해합니다.


- 미들웨어 체인의 next() 호출 방식을 이해합니다.


- rate limiting의 토큰 버킷 알고리즘을 이해합니다.





## 서버-Sent Events (SSE)





```typescript


// server/api/events.ts


export default defineEventHandler(async (event) => {


  setHeader(event, 'Content-Type', 'text/event-stream')


  setHeader(event, 'Cache-Control', 'no-cache')


  setHeader(event, 'Connection', 'keep-alive')





  const sendEvent = (data: string, eventType?: string) => {


    if (eventType) event.node.res.write(`event: ${eventType}\n`)


    event.node.res.write(`data: ${data}\n\n`)


  }





  // 초기 데이터 전송


  sendEvent(JSON.stringify({ message: 'Connected' }), 'connected')





  // 5초마다 알림 전송


  const interval = setInterval(() => {


    sendEvent(JSON.stringify({ time: new Date().toISOString() }), 'ping')


  }, 5000)





  // 연결 종료 시 정리


  event.node.req.on('close', () => {


    clearInterval(interval)


  })


})


```





```vue


<script setup lang="ts">


const events = ref<string[]>([])





onMounted(() => {


  const source = new EventSource('/api/events')


  source.addEventListener('connected', (e) => {


    events.value.push(`연결됨: ${e.data}`)


  })


  source.addEventListener('ping', (e) => {


    events.value.push(`핑: ${e.data}`)


  })


  source.onerror = (err) => {


    console.error('SSE 에러:', err)


    source.close()


  }


})





onUnmounted(() => {


  source.close()


})


</script>


```





SSE(Server-Sent Events)는 서버에서 클라이언트로 단방향 텍스트 스트림을 전송하는 프로토콜입니다. `Content-Type: text/event-stream` 헤더로 HTTP 연결을 유지하고, `data: ...` 형식으로 메시지를 전송합니다. EventSource는 자동 재연결을 지원하며, last-event-id 헤더로 중단된 지점부터 재개할 수 있습니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: SSE와 WebSocket의 차이는 무엇인가요?</strong></summary>





SSE는 **서버 → 클라이언트 단방향** 통신입니다. HTTP 프로토콜 위에서 동작하며, EventSource API가 자동 재연결을 처리합니다. 텍스트 데이터만 전송할 수 있습니다. WebSocket은 **양방향 전이중(full-duplex)** 통신입니다. ws/wss 프로토콜로 업그레이드되며, 텍스트와 바이너리 데이터를 모두 전송할 수 있습니다. 실시간 채팅, 게임, 협업 에디터는 WebSocket이 적합하고, 알림, 실시간 업데이트, 주식 시세는 SSE로 충분합니다.


</details>





<details>


<summary><strong>Q: Nitro에서 WebSocket을 사용하려면 어떻게 설정하나요?</strong></summary>





Nitro 3에서는 기본적으로 WebSocket을 지원합니다. `server/api/socket.ts`에서 `defineWebSocketHandler()`를 사용하거나, h3의 `defineEventHandler`에서 `getRequestWebSocket(event)`로 업그레이드 요청을 처리합니다. 클라이언트에서는 `new WebSocket('ws://localhost:3000/_ws')`로 연결합니다. 프로덕션에서는 WebSocket 연결을 지원하는 플랫폼(Vercel Edge, Cloudflare Workers)이 필요할 수 있습니다.


</details>





<details>


<summary><strong>Q: 미들웨어 체인에서 에러가 발생하면 어떻게 되나요?</strong></summary>





미들웨어 체인의 어떤 단계에서 에러가 throw되면, 이후 미들웨어와 API 핸들러는 실행되지 않습니다. 에러는 h3의 `onError` 훅에서 처리되어 `sendError()`로 응답됩니다. 에러를 로깅만 하고 다음 미들웨어로 계속 진행하려면 `try/catch`로 에러를 캡처하고 로깅한 후 `return`(undefined) 해야 합니다. `event.context.errors` 배열에 에러를 저장하여 나중에 일괄 처리할 수도 있습니다.


</details>





<details>


<summary><strong>Q: rate limiting 구현 시 주의할 점은 무엇인가요?</strong></summary>





메모리 내 Map 기반 rate limiting은 단일 서버에서만 유효합니다. 여러 서버 인스턴스가 있는 경우 Redis를 사용하여 IP별 카운터를 공유해야 합니다. 분산 환경에서는 `unstorage`의 Redis 드라이버를 사용하여 `h3-rate-limit` 같은 라이브러리를 활용할 수 있습니다. 또한 프록시(nginx, Cloudflare) 뒤에 있는 경우 `getHeader(event, 'x-forwarded-for')`로 실제 클라이언트 IP를 확인해야 합니다. rate limit에 도달하면 `Retry-After` 헤더를 함께 전송하여 클라이언트가 재시도 시간을 알 수 있게 합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **SSE** | 서버→클라이언트 스트림 | text/event-stream + EventSource API |


| **WebSocket** | 양방향 실시간 통신 | ws 핸드셰이크 + 전이중 메시지 전송 |


| **미들웨어 체인** | 순차적 요청 처리 | return undefined → next() 호출 |


| **rate limiting** | 요청 속도 제한 | 토큰 버킷 / 슬라이딩 윈도우 → 429 응답 |





## 다음 수업





다음 글에서는 보안 — CSP(Content Security Policy), CSRF, XSS 방어 전략을 배웁니다.


