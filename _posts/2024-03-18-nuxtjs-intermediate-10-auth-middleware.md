---


layout: post


title: "Nuxt.js 라우트 미들웨어와 인증 — defineNuxtRouteMiddleware가 JWT, OAuth, API Key 인증을 처리하는 과정"


description: "Nuxt.js의 라우트 미들웨어 시스템이 페이지 접근 제어와 인증을 처리하는 과정을 시스템 레벨에서 심층 학습합니다. defineNuxtRouteMiddleware()가 Vue Router의 네비게이션 가드(beforeEach)에 등록되어 to/from 라우트 객체로 전환을 제어하는 과정, 전역/레이아웃/페이지 미들웨어가 세 단계로 실행되는 순서, navigateTo()와 abortNavigation()이 각각 router.push()와 next(false)로 라우트 전환을 제어하는 방식, 클라이언트 미들웨어와 서버 미들웨어(event.context.auth)의 이중 인증 구조, OAuth 2.0 Authorization Code Flow에서 PKCE(Proof Key for Code Exchange)가 CSRF 공격을 방지하는 원리, API Key 인증이 h3의 getHeader()로 Authorization 헤더를 검증하는 과정을 다룹니다."


date: 2024-03-18 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, middleware, auth, jwt, oauth, route-guard, navigation]


level: intermediate


---





Nuxt.js의 라우트 미들웨어 시스템은 사용자가 특정 페이지에 접근하기 전에 인증, 권한 확인, 리다이렉트 등의 로직을 실행합니다.





> **핵심 정리** · `defineNuxtRouteMiddleware()`로 정의된 미들웨어는 Vue Router의 `beforeEach()` 네비게이션 가드에 등록됩니다. 세 단계로 실행됩니다: 전역 미들웨어(global) → 레이아웃 미들웨어 → 페이지 미들웨어. `navigateTo()`는 라우트 전환을 수행하고, `abortNavigation()`은 전환을 중단합니다. 서버에서는 `server/middleware/auth.ts`가 `event.context`에 JWT 페이로드를 주입하여 API 엔드포인트에서 사용합니다.





---





## 수업 목표





- 라우트 미들웨어의 등록과 실행 순서를 이해합니다.


- navigateTo()와 abortNavigation()의 차이를 이해합니다.


- 클라이언트 미들웨어와 서버 미들웨어의 이중 인증 구조를 이해합니다.


- JWT, OAuth 2.0, API Key 인증의 내부 동작을 이해합니다.





## 기본 인증 미들웨어





```typescript


// middleware/auth.ts


export default defineNuxtRouteMiddleware((to, from) => {


  const token = useCookie('token')


  if (!token.value) {


    return navigateTo('/login')


  }


})


```





```vue


<!-- pages/dashboard.vue -->


<script setup lang="ts">


definePageMeta({


  middleware: ['auth']


})


</script>


```





`defineNuxtRouteMiddleware()`는 Vue Router의 `beforeEach()` 네비게이션 가드에 미들웨어 함수를 등록합니다. `to`는 이동할 라우트의 `RouteLocationNormalized` 객체이고, `from`은 현재 라우트입니다. 미들웨어가 `navigateTo('/login')`을 반환하면 Vue Router는 `router.push('/login')`을 호출하여 로그인 페이지로 리다이렉트합니다. `abortNavigation()`을 반환하면 현재 페이지에 머무르고 `next(false)`가 호출되어 라우트 전환이 취소됩니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: 전역 미들웨어와 페이지 미들웨어의 차이는 무엇인가요?</strong></summary>





전역 미들웨어는 `middleware/` 디렉토리에 `.global.ts` 확장자로 저장되며, 모든 라우트 전환 시 자동으로 실행됩니다. 페이지 미들웨어는 `definePageMeta({ middleware: [...] })`로 각 페이지에서 선택적으로 적용합니다. 전역 미들웨어는 항상 실행되어야 하는 로직(로깅, 분석, 토큰 갱신)에 적합하고, 페이지 미들웨어는 특정 페이지만 보호해야 할 때 사용합니다. 실행 순서는 전역 → 레이아웃 → 페이지 순서입니다.


</details>





<details>


<summary><strong>Q: 미들웨어에서 비동기 작업을 수행할 수 있나요?</strong></summary>





네, 미들웨어 함수는 `async`로 선언할 수 있습니다. `await useFetch('/api/auth/verify')`로 토큰 검증 API를 호출하거나, `await store.fetchUser()`로 Pinia 스토어에서 사용자 정보를 로드할 수 있습니다. 비동기 작업이 완료될 때까지 라우트 전환이 지연되므로, 로딩 상태를 처리해야 할 수 있습니다. SSR에서는 미들웨어가 서버에서 실행되므로, 인증 API 호출이 발생하고 결과가 `__NUXT__`에 포함됩니다.


</details>





<details>


<summary><strong>Q: OAuth 2.0 Authorization Code Flow는 Nuxt에서 어떻게 구현하나요?</strong></summary>





OAuth 2.0 Authorization Code Flow는 세 단계로 동작합니다: (1) 사용자를 인증 서버의 `/authorize` 엔드포인트로 리다이렉트합니다. (2) 인증 서버가 인증 코드(`code`)와 함께 콜백 URL로 리다이렉트합니다. (3) 서버가 `code`와 `client_secret`으로 `/token` 엔드포인트에 POST 요청하여 액세스 토큰을 받습니다. PKCE(Proof Key for Code Exchange)는 CSRF 공격을 방지하기 위해 `code_verifier`와 `code_challenge`를 사용합니다. Nuxt에서는 `server/api/auth/` 디렉토리의 핸들러로 OAuth 콜백을 처리하고, `useCookie()`로 토큰을 저장합니다.


</details>





<details>


<summary><strong>Q: 서버 미들웨어에서 event.context.auth에 접근하려면 어떻게 하나요?</strong></summary>





서버 미들웨어는 `event.context` 객체에 값을 주입할 수 있습니다. 예를 들어 `server/middleware/auth.ts`에서 JWT를 검증한 후 `event.context.auth = { userId: payload.sub, role: payload.role }`을 설정합니다. API 핸들러에서는 `const auth = event.context.auth`로 접근합니다. 타입 안전성을 위해 `event.context`를 확장하는 TypeScript 선언 병합(declaration merging)을 사용할 수 있습니다: `declare module 'h3' { interface H3EventContext { auth?: { userId: number; role: string } } }`.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **defineNuxtRouteMiddleware** | 미들웨어 정의 | Vue Router beforeEach()에 등록 |


| **navigateTo()** | 리다이렉트 | client: router.push(), SSR: 302 redirect |


| **abortNavigation()** | 전환 중단 | next(false) 호출 → 현재 페이지 유지 |


| **useCookie()** | 쿠키 기반 인증 | SSR-safe 쿠키 읽기/쓰기 → httpOnly 옵션 지원 |


| **OAuth 2.0** | 소셜 로그인 | Authorization Code Flow + PKCE |


| **서버 미들웨어** | API 레벨 인증 | event.context.auth 주입 → 핸들러에서 사용 |





## 다음 수업





다음 글에서는 국제화(i18n) — @nuxtjs/i18n 모듈로 다국어 사이트를 구축하는 과정을 배웁니다.


