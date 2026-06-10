---


layout: post


title: "Nuxt.js Nitro 서버 엔진 — server/api/ 디렉토리가 h3 라우터로 등록되어 요청을 처리하는 과정"


description: "Nuxt.js에 내장된 Nitro 서버 엔진이 server/ 디렉토리의 파일을 h3 라우터에 등록하고 HTTP 요청을 처리하는 과정을 시스템 레벨에서 심층 학습합니다. defineEventHandler()가 h3의 eventHandler()로 래핑되어 Node.js IncomingMessage/ServerResponse를 추상화한 H3Event를 생성하는 원리, 파일명 기반 라우팅이 server/api/users/[id].ts를 /api/users/:id로 매핑하는 방식, getQuery()와 readBody()가 각각 URLSearchParams와 request body 버퍼를 파싱하는 내부 과정, createError()가 H3Error 클래스를 생성하여 sendError()로 적절한 HTTP 상태 코드와 JSON 에러 본문을 응답하는 방식, server/middleware/ 디렉토리의 핸들러가 모든 API 요청보다 먼저 실행되어 event.context에 공통 데이터를 주입하는 과정, runtimeConfig가 .env 파일의 NUXT_ 접두사 환경 변수를 자동 매핑하는 과정을 다룹니다."


date: 2024-02-19 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, nitro, server-routes, api, h3, defineEventHandler, runtimeConfig]


level: basic


---





Nuxt.js는 Nitro 서버 엔진을 내장하고 있어 별도의 Express 서버 없이 server/ 디렉토리에 파일을 생성하는 것만으로 API 엔드포인트를 만들 수 있습니다.





> **핵심 정리** · Nitro는 h3 라이브러리 기반의 유니버설 서버 엔진입니다. `server/api/posts.ts`의 `defineEventHandler()`는 h3 라우터에 `GET /api/posts` 핸들러로 등록됩니다. `getQuery()`는 URLSearchParams를, `readBody()`는 request body 버퍼를 수집하여 JSON/URL-encoded/form-data를 자동 파싱합니다. `createError()`는 H3Error 객체를 생성하여 sendError()로 응답합니다. `runtimeConfig`의 public 변수만 클라이언트 번들에 포함되고, 서버 전용 변수는 `.env`에서 읽힙니다.





---





## 수업 목표





- defineEventHandler가 h3에서 어떻게 래핑되는지 이해합니다.


- 파일명 기반 API 라우팅 규칙을 이해합니다.


- 요청 파라미터, 바디, 헤더를 읽는 방법을 이해합니다.


- 서버 미들웨어의 실행 순서와 event.context 주입을 이해합니다.


- runtimeConfig의 환경 변수 매핑 과정을 이해합니다.





## 기본 API 엔드포인트





```typescript


// server/api/hello.ts → GET /api/hello


export default defineEventHandler(() => {


  return { message: 'Hello from Nitro!' }


})


```





```bash


curl http://localhost:3000/api/hello


# { "message": "Hello from Nitro!" }


```





`defineEventHandler()`는 h3 라이브러리의 `eventHandler()` 팩토리 함수로 전달됩니다. h3는 Node.js HTTP 서버의 `request` 이벤트 리스너에서 `IncomingMessage`와 `ServerResponse`를 받아 `H3Event` 객체로 래핑합니다. `H3Event`는 `event.node.req`(Node.js IncomingMessage)와 `event.node.res`(Node.js ServerResponse)에 접근할 수 있는 추상화 레이어입니다. 반환값이 객체이면 h3는 `JSON.stringify()`로 직렬화하고 `Content-Type: application/json` 헤더를 자동 설정합니다. Promise를 반환하면 resolve될 때까지 기다린 후 응답을 전송합니다.





## HTTP 메서드 핸들링





```typescript


// server/api/posts/index.ts


export default defineEventHandler(async (event) => {


  const method = getMethod(event)


  switch (method) {


    case 'GET': return await getPosts(event)


    case 'POST': return await createPost(event)


    default: throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })


  }


})





async function getPosts(event) {


  const query = getQuery(event)


  const { data: posts } = await db.posts.findMany({


    take: query.limit || 10,


    skip: ((query.page || 1) - 1) * (query.limit || 10)


  })


  return posts


}





async function createPost(event) {


  const body = await readBody(event)


  if (!body.title) {


    throw createError({ statusCode: 400, statusMessage: 'Title is required' })


  }


  const { data: post } = await db.posts.create({ data: body })


  return post


}


```





`getMethod(event)`는 `event.node.req.method`를 읽어 HTTP 메서드를 문자열로 반환합니다. `getQuery(event)`는 `url.parse(req.url, true).query`로 URL 쿼리스트링을 파싱합니다. `readBody(event)`는 `event.node.req`의 `data` 이벤트를 통해 버퍼를 수집하고, `Content-Type` 헤더에 따라 `JSON.parse()`(application/json) 또는 `querystring.parse()`(application/x-www-form-urlencoded)를 호출합니다. `createError()`는 h3의 `H3Error` 클래스 인스턴스를 생성하며, 내부적으로 `Error.captureStackTrace()`로 호출 스택을 캡처합니다. h3는 `sendError()`에서 H3Error의 `statusCode`와 `statusMessage`를 HTTP 응답 상태 코드와 본문으로 설정합니다.





### 요청 처리 유틸리티





| 함수 | 입력 | 출력 | 내부 동작 |


|------|------|------|----------|


| `getMethod(event)` | H3Event | string | event.node.req.method 읽기 |


| `getQuery(event)` | H3Event | object | url.parse().query 파싱 |


| `readBody(event)` | H3Event | Promise<object> | 버퍼 수집 → Content-Type별 파서 |


| `getRouterParam(event, name)` | H3Event, string | string\|undefined | 동적 라우트 파라미터 추출 |


| `getHeader(event, name)` | H3Event, string | string\|undefined | 요청 헤더 읽기 |


| `setHeader(event, name, value)` | H3Event, string, string | void | 응답 헤더 설정 |


| `createError({ statusCode, statusMessage })` | object | H3Error | H3Error 생성 → sendError() |





## 라우트 파라미터





```typescript


// server/api/posts/[id].ts → GET /api/posts/1


export default defineEventHandler(async (event) => {


  const id = getRouterParam(event, 'id')


  const { data: post } = await db.posts.findUnique({ where: { id: Number(id) } })


  if (!post) {


    throw createError({ statusCode: 404, statusMessage: 'Post not found' })


  }


  return post


})


```





`getRouterParam(event, 'id')`는 동적 라우트 `[id]`에서 추출한 URL 파라미터를 반환합니다. Nitro는 파일명의 `[id]`를 Vue Router와 동일한 방식으로 해석하여 `:id` 파라미터로 변환하고, 요청 URL을 `findRoute()`로 매칭하여 `event.context.params`에 저장합니다. 반환값은 `string | undefined`이므로 숫자형 ID는 `Number()`로 명시적 변환해야 합니다. 존재하지 않는 리소스는 404 Not Found로 응답합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Nitro 서버는 Express와 어떻게 다른가요?</strong></summary>





Nitro는 h3 기반의 유니버설 서버 엔진으로 Express와 세 가지 주요 차이가 있습니다: (1) **플랫폼 독립성**: Express는 Node.js에서만 실행되지만, Nitro 핸들러는 Cloudflare Workers, Vercel Edge, Netlify Edge, Lambda@Edge에서 동일한 코드로 실행됩니다. h3가 각 플랫폼의 요청/응답 객체를 H3Event로 추상화합니다. (2) **자동 청크 분할**: server/ 디렉토리의 각 파일이 개별 Rollup 청크로 분할되어 첫 요청 시 lazy-loading됩니다. (3) **내장 캐싱**: `defineCachedEventHandler()`로 SWR 캐싱을 선언적으로 적용할 수 있습니다.


</details>





<details>


<summary><strong>Q: readBody()는 어떤 Content-Type을 지원하나요?</strong></summary>





`readBody()`는 세 가지 Content-Type을 자동 감지하여 파싱합니다: (1) `application/json` — `JSON.parse(buffer)`로 파싱합니다. (2) `application/x-www-form-urlencoded` — `querystring.parse(buffer)`로 파싱합니다. (3) `multipart/form-data` — `busboy` 라이브러리로 파싱하여 FormData 객체를 반환합니다. 지원하지 않는 Content-Type은 빈 객체 `{}`를 반환합니다. 버퍼 수집은 `event.node.req`의 `data`와 `end` 이벤트를 리스닝하여 수행합니다.


</details>





<details>


<summary><strong>Q: 서버 미들웨어와 API 핸들러의 실행 순서는 어떻게 결정되나요?</strong></summary>





실행 순서: (1) `server/middleware/` 디렉토리의 모든 핸들러가 **파일명 알파벳 순서**로 실행됩니다. (2) 이후 요청 URL과 일치하는 API 핸들러가 실행됩니다. 미들웨어가 응답을 반환하거나 에러를 throw하면 이후 API 핸들러는 실행되지 않습니다. 미들웨어는 `event.context`에 데이터를 주입하여 API 핸들러가 사용할 수 있게 합니다(예: `event.context.auth = payload`). Nitro는 요청 URL을 h3의 `matchRoute()`로 매칭하여 가장 구체적인 라우트부터 확인합니다.


</details>





<details>


<summary><strong>Q: runtimeConfig의 public과 private 변수는 어떻게 구분하나요?</strong></summary>





`runtimeConfig.public` 객체에 포함된 변수만 클라이언트 번들에 포함됩니다. 클라이언트에서는 `useRuntimeConfig().public.apiBase`로 접근할 수 있습니다. `runtimeConfig`의 최상위 변수(예: `apiSecret`, `dbUrl`)는 서버 전용입니다. `.env` 파일에서 `NUXT_PUBLIC_*` 접두사는 public에, `NUXT_*`는 최상위에 매핑됩니다. 프로덕션에서는 실제 환경 변수로 값을 설정해야 하며, `.env` 파일은 로컬 개발 전용입니다.


</details>





<details>


<summary><strong>Q: createError()로 생성한 에러는 클라이언트에 어떻게 전달되나요?</strong></summary>





`createError()`로 생성한 H3Error는 h3의 `sendError()` 함수에서 처리됩니다. `sendError()`는 `statusCode`를 HTTP 응답 상태 코드로 설정하고, 응답 본문에 `{ statusCode, statusMessage, data }` 형태의 JSON 객체를 포함합니다. `useFetch()`로 API를 호출한 클라이언트에서는 `error.value`로 이 에러 객체에 접근할 수 있습니다. SSR에서 발생한 에러는 `__NUXT__.payload._errors[key]`에 저장되어 클라이언트에서 접근 가능합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **defineEventHandler** | API 핸들러 정의 | h3 eventHandler() → H3Event 추상화 |


| **getQuery/readBody** | 요청 데이터 읽기 | URLSearchParams 파싱 / 버퍼 수집 + Content-Type 파서 |


| **getRouterParam** | 동적 라우트 파라미터 | event.context.params에서 추출 |


| **createError** | HTTP 에러 응답 | H3Error → sendError() → JSON 에러 본문 |


| **서버 미들웨어** | 공통 전처리 로직 | 모든 요청에 API보다 먼저 실행 → event.context 주입 |


| **runtimeConfig** | 환경 변수 관리 | .env → NUXT_ 매핑, public만 클라이언트 노출 |





## 다음 수업





다음 글에서는 CSS 스타일링 — Tailwind CSS와 Nuxt UI 컴포넌트를 배웁니다.


