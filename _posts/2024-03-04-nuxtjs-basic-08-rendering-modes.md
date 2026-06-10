---


layout: post


title: "Nuxt.js 렌더링 모드 — SSR, SSG, SPA, Hybrid 전략의 내부 동작과 routeRules 설정"


description: "Nuxt.js의 네 가지 렌더링 모드(SSR, SSG, SPA, Hybrid)의 내부 동작을 시스템 레벨에서 심층 학습합니다. Universal(SSR) 모드에서 vue/server-renderer의 renderToString()이 Vue 컴포넌트 트리를 직렬화하고 __NUXT__ payload를 HTML에 인라인으로 포함하는 과정, SSG 모드에서 Nitro prerenderer가 routeRules의 prerender:true 페이지를 puppeteer/happy-dom으로 방문하여 정적 HTML을 생성하는 방식, SPA 모드에서 ssr:false가 빌드 타임에 서버 번들을 생성하지 않고 CSR 전용 HTML을 출력하는 원리, Hybrid 모드에서 routeRules의 swr TTL이 Cache-Control 헤더를 설정하고 Stale-While-Revalidate 패턴으로 동작하는 과정, npm run generate가 Nitro 엔진의 정적 사이트 생성 파이프라인을 실행하는 과정을 다룹니다."


date: 2024-03-04 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, ssr, ssg, spa, hybrid, prerender, rendering, routeRules]


level: basic


---





Nuxt.js는 Universal(SSR), Static(SSG), SPA, Hybrid 네 가지 렌더링 모드를 지원합니다.





> **핵심 정리** · Nuxt 4의 렌더링 엔진은 Vue SSR renderer, Nitro prerenderer, CSR html-webpack-plugin의 세 가지로 구성됩니다. `ssr: true`(기본)는 서버에서 `renderToString()`으로 HTML을 생성합니다. `routeRules: { prerender: true }`는 빌드 시 정적 HTML을 생성합니다. `ssr: false`는 CSR 전용 HTML을 출력합니다. Hybrid 모드는 `routeRules`의 `swr`(초 단위 TTL)로 페이지별 캐싱 전략을 설정합니다.





---





## 수업 목표





- 네 가지 렌더링 모드의 내부 동작을 이해합니다.


- routeRules로 페이지별 렌더링 전략을 설정하는 방법을 이해합니다.


- SSR의 HTML 직렬화와 하이드레이션 과정을 이해합니다.


- Prerender와 SWR 캐싱의 차이를 이해합니다.





## 렌더링 모드 비교





| 모드 | 서버 | SEO | HTML 생성 시점 | 데이터 |


|------|------|-----|---------------|--------|


| Universal (SSR) | 필요 | 우수 | 요청 시 서버에서 생성 | 실시간 |


| Static (SSG) | 불필요 | 우수 | 빌드 시 정적 HTML 생성 | 정적 |


| SPA | 불필요 | 낮음 | 빌드 시 빈 HTML + JS 번들 | CSR 전용 |


| Hybrid | 혼합 | 우수 | 페이지별 설정 | 혼합 |





## 전역 렌더링 모드 설정





```typescript


// nuxt.config.ts


export default defineNuxtConfig({


  ssr: true  // Universal (SSR) — 기본값


  // ssr: false  // SPA 모드


})


```





`ssr: true`가 기본값입니다. SSR 모드에서 Nuxt는 서버에서 `vue/server-renderer`의 `createSSRApp()`과 `renderToString()`을 사용하여 Vue 컴포넌트 트리를 HTML 문자열로 직렬화합니다. `renderToString()`은 컴포넌트 트리를 루트부터 재귀적으로 순회하며 각 VNode를 HTML 문자열로 변환합니다. 변환된 HTML은 `__NUXT__` payload(useFetch 데이터, useState 값, route 정보)를 포함하는 `<script>` 태그와 함께 응답으로 전송됩니다.





### renderToString()의 내부 동작





`renderToString()`은 Vue SSR renderer의 핵심 함수입니다. 컴포넌트 트리의 루트부터 시작하여 각 VNode를 방문하면서 HTML 문자열을 생성합니다. 각 컴포넌트의 `setup()` 함수가 실행되고, `render()` 함수가 호출되어 VNode 트리를 생성합니다. 이 VNode 트리는 직렬화되어 `<div>` 등의 HTML 태그로 변환됩니다. `onMounted()`와 같은 클라이언트 전용 라이프사이클 훅은 SSR에서 실행되지 않습니다. 모든 Promise가 resolve될 때까지 기다린 후 최종 HTML 문자열을 반환합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: SSR과 SSG를 같은 프로젝트에서 혼용할 수 있나요?</strong></summary>





네, routeRules로 페이지별로 설정할 수 있습니다. 예를 들어 블로그 글 목록은 SSG(정적 HTML)로, 사용자 대시보드는 SSR(요청 시 HTML 생성)로, 관리자 페이지는 CSR(JavaScript 전용)로 설정할 수 있습니다. `npm run build`로 SSR 모드로 빌드하고, `npm run generate`로 SSG 페이지를 추가 생성합니다. Hybrid 모드에서는 이 모든 전략을 routeRules 하나로 통합 관리합니다.


</details>





<details>


<summary><strong>Q: SWR과 ISR의 차이는 무엇인가요?</strong></summary>





SWR(Stale-While-Revalidate)은 **만료된 캐시를 즉시 반환**하고 백그라운드에서 새 페이지를 생성합니다. 사용자는 항상 즉시 응답을 받습니다(캐시된 데이터가 최신이 아닐 수 있음). ISR(Incremental Static Regeneration)은 **첫 번째 요청에서 새 페이지를 생성**하고 이후 요청부터 캐시를 반환합니다. Nuxt의 routeRules는 SWR 방식을 사용하며, 이는 Next.js의 ISR과 유사하지만 백그라운드 재생성 타이밍에서 차이가 있습니다.


</details>





<details>


<summary><strong>Q: npm run generate와 npm run build의 차이는 무엇인가요?</strong></summary>





`npm run build`는 Nitro 서버 번들과 정적 에셋을 `.output/`에 생성합니다. 서버에서 SSR 모드로 실행하기 위한 파일입니다. `npm run generate`는 routeRules에서 `prerender: true`로 설정된 모든 페이지를 방문하여 정적 HTML을 `.output/public/`에 생성합니다. 이 정적 파일은 nginx, GitHub Pages, Netlify 등에서 추가 서버 없이 서빙 가능합니다. generate는 build의 상위 집합으로, build 후 prerender 단계를 추가로 실행합니다.


</details>





<details>


<summary><strong>Q: 클라이언트 하이드레이션은 어떻게 동작하나요?</strong></summary>





SSR에서 생성된 HTML이 브라우저에 로드되면, Vue는 `createSSRApp()`으로 앱을 생성하고 `app.mount('#__nuxt')`에서 `hydrate()` 메서드를 호출합니다. hydrate()는 기존 DOM 노드를 재사용하며 이벤트 리스너만 연결합니다. 하이드레이션 중에는 `__NUXT__` payload의 데이터가 초기 상태로 사용됩니다. 하이드레이션이 완료되면 페이지는 일반 Vue SPA처럼 동작하며, 이후 라우트 전환은 클라이언트 사이드에서 처리됩니다.


</details>





<details>


<summary><strong>Q: Hybrid 모드에서 routeRules를 어떻게 설정하나요?</strong></summary>





`routeRules`는 `nuxt.config.ts`에서 객체 형태로 설정합니다. 키는 URL 패턴(glob 지원), 값은 렌더링 옵션입니다. `prerender: true`는 빌드 시 정적 HTML을 생성합니다. `swr: 3600`은 3600초 TTL의 SWR 캐싱을 적용합니다. `ssr: false`는 해당 라우트를 CSR로 처리합니다. `redirect: '/other'`는 다른 URL로 리다이렉트합니다. `cors: true`는 CORS 헤더를 추가합니다. 패턴은 `/blog/**`처럼 glob 형식을 지원하며, 구체적인 패턴이 더 높은 우선순위를 가집니다.


</details>





---





## 요약





| 모드 | ssr 설정 | HTML 생성 | 서버 필요 |


|------|---------|----------|---------|


| Universal (SSR) | `true` | 요청 시 서버에서 renderToString() | 필요 |


| Static (SSG) | `true` + prerender | 빌드 시 헤드리스 브라우저로 | 불필요 |


| SPA | `false` | 빈 HTML + JS 번들 | 불필요 |


| Hybrid | routeRules | 페이지별 설정 | 혼합 |





## 다음 수업





다음 글에서는 Nuxt.js의 상태 관리 — useState와 Pinia를 배웁니다.


