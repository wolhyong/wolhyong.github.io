---


layout: post


title: "Nuxt.js 에러 핸들링과 로깅 — Vue 에러 바운더리, 서버 오류 처리, Winston/Pino 로깅 전략"


description: "Nuxt.js에서 클라이언트와 서버의 에러를 체계적으로 처리하고 로깅하는 과정을 시스템 레벨에서 심층 학습합니다. Vue 3의 onErrorCaptured() 라이프사이클 훅이 컴포넌트 트리에서 발생한 에러를 캡처하여 에러 바운더리 컴포넌트로 전파하는 과정, NuxtErrorBoundary 컴포넌트가 provide/inject로 하위 컴포넌트의 에러를 수집하고 fallback UI로 대체하는 방식, 서버에서 createError()로 발생시킨 H3Error가 sendError()를 통해 statusCode/statusMessage/data로 직렬화되어 클라이언트에 JSON으로 응답되는 과정, useFetch의 error.value가 H3Error 객체를 통해 서버 에러를 클라이언트에 전달하는 방식, Pino 로거가 JSON 형식으로 구조화된 로그를 출력하고 니어-실시간으로 모니터링 시스템에 전송하는 과정을 다룹니다."


date: 2024-04-29 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, error-handling, logging, error-boundary, pino, monitoring]


level: intermediate


---





Nuxt.js에서는 Vue의 에러 바운더리와 Nitro의 에러 핸들링이 결합되어 클라이언트와 서버 모두에서 체계적인 에러 처리가 가능합니다.





> **핵심 정리** · Vue 3의 `onErrorCaptured()` 훅이 컴포넌트 에러를 캡처하고, `NuxtErrorBoundary`가 fallback UI를 표시합니다. 서버에서는 `createError()`로 H3Error를 생성하고 `sendError()`로 JSON 응답합니다. Pino 로거는 JSON 형식으로 구조화된 로그를 출력합니다.





---





## 수업 목표





- onErrorCaptured와 NuxtErrorBoundary의 동작을 이해합니다.


- 서버 에러의 직렬화와 클라이언트 전달 과정을 이해합니다.


- Pino 로거의 구조화된 로깅을 이해합니다.





## NuxtErrorBoundary





```vue


<template>


  <NuxtErrorBoundary @error="logError">


    <NuxtPage />


    <template #error="{ error, clearError }">


      <div class="error-page">


        <h1>문제가 발생했습니다</h1>


        <p>{{ error.message }}</p>


        <pre>{{ error.stack }}</pre>


        <button @click="clearError">다시 시도</button>


      </div>


    </template>


  </NuxtErrorBoundary>


</template>


```





`NuxtErrorBoundary`는 Vue 3의 `onErrorCaptured()`를 기반으로 합니다. 하위 컴포넌트 트리에서 발생한 모든 에러를 `provide`된 에러 수집 함수로 전달받습니다. `#error` 슬롯은 에러 발생 시 fallback UI를 렌더링합니다. `clearError()`는 에러 상태를 초기화하고 컴포넌트를 다시 렌더링합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: onErrorCaptured와 window.onerror의 차이는 무엇인가요?</strong></summary>





`onErrorCaptured()`는 Vue 컴포넌트 트리 내에서 발생한 에러만 캡처합니다. Vue의 라이프사이클 훅, 이벤트 핸들러, `watch` 콜백, `computed` getter에서 발생한 에러를 잡을 수 있습니다. `window.onerror`(또는 `window.addEventListener('error')`)는 JavaScript 실행 중 발생하는 모든 **처리되지 않은(unhandled) 에러**를 캡처합니다. 여기에는 Vue 외부의 스크립트 에러, 리소스 로딩 실패, Promise rejection도 포함됩니다. 둘을 함께 사용하여 Vue 내부 에러는 `NuxtErrorBoundary`로, Vue 외부 에러는 `window.onerror`로 처리하는 것이 좋습니다.


</details>





<details>


<summary><strong>Q: 서버에서 발생한 에러는 클라이언트에 어떻게 전달되나요?</strong></summary>





서버 API 핸들러에서 `createError({ statusCode: 500, statusMessage: 'Server Error', data: { detail: '...' } })`를 throw하면 h3가 `sendError()`에서 응답을 직렬화합니다. 클라이언트의 `useFetch()`는 `error.value`로 이 응답에 접근합니다: `error.value.statusCode`(500), `error.value.statusMessage`('Server Error'), `error.value.data`(`{ detail: '...' }`). SSR 페이지에서 발생한 에러는 `nuxt`의 `vueApp.config.errorHandler`에서 캡처되어 `__NUXT__.payload._errors[route]`에 저장됩니다.


</details>





<details>


<summary><strong>Q: Pino 로거를 Nuxt 서버에 어떻게 통합하나요?</strong></summary>





`server/utils/logger.ts`에서 Pino 인스턴스를 생성합니다: `export const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', transport: { target: 'pino-pretty' } })`. API 핸들러에서 `logger.info({ method, url, duration }, 'Request processed')`로 로깅합니다. 서버 미들웨어에서 모든 요청에 대해 자동 로깅할 수 있습니다. 프로덕션에서는 pino-pretty 없이 JSON 로그를 출력하고, Datadog이나 ELK 스택으로 전송합니다.


</details>





<details>


<summary><strong>Q: 클라이언트 에러를 서버로 전송하려면 어떻게 하나요?</strong></summary>





`onErrorCaptured()`에서 캡처된 에러를 서버 API로 전송하는 에러 리포팅 시스템을 구축할 수 있습니다. `useFetch('/api/log/error', { method: 'POST', body: { message: error.message, stack: error.stack, url: window.location.href, userAgent: navigator.userAgent } })`로 전송합니다. Sentry나 Bugsnag 같은 서비스를 사용하면 @sentry/nuxt 모듈로 자동 통합됩니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **onErrorCaptured** | Vue 에러 캡처 | 컴포넌트 트리 에러 → 부모로 전파 |


| **NuxtErrorBoundary** | fallback UI | provide/inject 에러 수집 → #error 슬롯 렌더링 |


| **createError** | 서버 에러 생성 | H3Error → sendError() → JSON 응답 |


| **Pino** | 구조화된 로깅 | JSON 로그 출력 + pino-pretty 개발 포맷팅 |





## 다음 수업





다음 글에서는 고급 서버 라우트 — WebSocket, SSE(Server-Sent Events), 미들웨어 체인을 배웁니다.


