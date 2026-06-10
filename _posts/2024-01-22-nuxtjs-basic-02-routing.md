---


layout: post


title: "Nuxt.js 파일 기반 라우팅 — pages/ 디렉토리가 vue-router의 RouteRecord로 컴파일되는 과정"


description: "Nuxt.js의 파일 기반 라우팅 시스템이 pages/ 디렉토리 구조를 vue-router의 RouteRecord 배열로 변환하는 과정을 시스템 레벨에서 심층 학습합니다. Vite의 import.meta.glob()이 빌드 시점에 pages/ 디렉토리를 정적 분석하여 .nuxt/paths.mjs에 RouteRecordRaw 타입의 라우트 정의를 생성하는 원리, [id].vue 같은 동적 라우트가 path: '/blog/:id'로 변환되어 Vue Router의 params에서 추출되는 과정, [...slug].vue가 /:pathMatch(.*)* catch-all 라우트로 매핑되는 방식, definePageMeta()가 route.meta에 layout/middleware/validate를 컴파일 타임에 등록하는 과정, NuxtLink가 RouterLink를 확장하여 prefetch와 외부 URL fallback을 처리하는 내부 로직, navigateTo()가 클라이언트에서는 router.push()로 SSR에서는 302 Location 헤더로 동작하는 이중 구현을 다룹니다."


date: 2024-01-22 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, routing, pages, vue-router, dynamic-routes, nested-routes, RouteRecord]


level: basic


---





Nuxt.js의 라우팅은 pages/ 디렉토리 구조를 URL 경로로 자동 변환합니다. 설정 파일을 작성할 필요 없이 .vue 파일을 생성하는 것만으로 라우트가 정의됩니다.





> **핵심 정리** · Nuxt의 파일 기반 라우팅은 Vite의 `import.meta.glob()`을 사용하여 pages/ 디렉토리의 모든 .vue 파일을 스캔하고, 파일 경로를 Vue Router의 `RouteRecordRaw` 타입 배열로 컴파일합니다. `pages/blog/[id].vue`는 `{ path: '/blog/:id', component: () => import('./pages/blog/[id].vue'), props: true }`로, `pages/[...slug].vue`는 `{ path: '/:pathMatch(.*)*', component: ... }`로 변환됩니다. `definePageMeta()`로 정의된 메타데이터는 `.nuxt/pages/` 디렉토리의 별도 청크에 저장되어 `route.meta`로 접근 가능합니다.





---





## 수업 목표





- pages/ 디렉토리 구조가 RouteRecord로 변환되는 과정을 이해합니다.


- 동적 라우트, 중첩 라우트, catch-all 라우트의 URL 매핑 규칙을 이해합니다.


- `<NuxtLink>`의 prefetch와 fallback 동작을 이해합니다.


- `navigateTo()`의 SSR/CSR 이중 구현을 이해합니다.


- 라우트 미들웨어의 실행 순서를 이해합니다.





## 기본 라우트 매핑 규칙





```


pages/


├── index.vue          → path: '/'


├── about.vue          → path: '/about'


├── blog/


│   ├── index.vue      → path: '/blog'


│   └── [id].vue       → path: '/blog/:id'


└── [...slug].vue      → path: '/:pathMatch(.*)*' (catch-all)


```





pages/ 디렉토리의 각 .vue 파일은 Vite의 `import.meta.glob()` 메서드로 빌드 시점에 수집됩니다. `import.meta.glob('/pages/**/*.vue')`는 파일 시스템을 재귀적으로 스캔하여 `Record<string, () => Promise<unknown>>` 타입의 import 맵을 생성합니다. Nuxt는 이 맵을 Vue Router의 `createRouter()`에 전달할 RouteRecordRaw 배열로 변환합니다. 변환 규칙은 다음과 같습니다: (1) `index.vue`는 디렉토리의 기본 라우트가 되어 부모 경로에 매핑됩니다(`/blog/index.vue` → `/blog`). (2) `[param].vue`는 `:param` 형태의 동적 세그먼트로 변환됩니다. (3) `[...param].vue`는 Vue Router의 `/:pathMatch(.*)*` catch-all 파라미터로 변환되어 여러 세그먼트를 한 번에 캡처합니다. 이 매핑은 `.nuxt/paths.mjs` 파일에 정적 RouteRecord 배열로 컴파일되어 런타임 오버헤드 없이 동작합니다.





## 동적 라우트





```vue


<!-- pages/blog/[id].vue -->


<script setup lang="ts">


const route = useRoute()


const { data: post } = await useFetch(`/api/posts/${route.params.id}`)


</script>





<template>


  <article>


    <h1>{{ post.title }}</h1>


    <div v-html="post.content" />


  </article>


</template>


```





`useRoute()`는 Vue Router의 `RouteLocationNormalizedLoaded` 객체를 반환합니다. `route.params.id`의 타입이 `string | string[]`인 이유는 URL 쿼리스트링에서 `?id=1&id=2`처럼 같은 파라미터가 여러 번 전달될 수 있기 때문입니다. `useRoute()`는 `inject()`로 Vue Router 인스턴스의 `currentRoute` ref를 구독하여 반응성을 유지합니다. 페이지 이동 시 `currentRoute.value`가 변경되면 `useRoute()`를 호출한 모든 컴포넌트가 자동으로 리렌더링됩니다.





### 파라미터 유효성 검사





```vue


<script setup lang="ts">


definePageMeta({


  validate: async (route) => {


    if (!/^\d+$/.test(route.params.id as string)) return false


    const { data } = await useFetch(`/api/posts/${route.params.id}/exists`)


    return !!data.value


  }


})


const route = useRoute()


const { data: post } = await useFetch(`/api/posts/${route.params.id}`)


</script>


```





`definePageMeta({ validate })`는 컴파일 타임에 `.nuxt/pages/blog/[id].vue` 파일에 메타데이터로 저장됩니다. validate 함수는 Vue Router의 `beforeRouteEnter` 네비게이션 가드 내에서 실행됩니다. `false`를 반환하면 `abortNavigation()`이 호출되어 404 페이지를 표시합니다. `async` 함수도 지원하므로 DB 조회 후 접근 제어가 가능합니다. validate는 SSR 단계에서도 동일하게 실행되어, 존재하지 않는 페이지가 검색 엔진에 인덱싱되지 않도록 방지합니다.





### 라우트 파라미터 변환 규칙





| 파일 패턴 | URL 패턴 | route.params 타입 |


|----------|---------|------------------|


| `pages/index.vue` | `/` | `{}` |


| `pages/about.vue` | `/about` | `{}` |


| `pages/blog/[id].vue` | `/blog/:id` | `{ id: string }` |


| `pages/blog/[id]/comment/[cid].vue` | `/blog/:id/comment/:cid` | `{ id: string, cid: string }` |


| `pages/[...slug].vue` | `/*` | `{ slug: string[] }` |


| `pages/category/[cat]/[sub].vue` | `/category/:cat/:sub` | `{ cat: string, sub: string }` |





## NuxtLink 컴포넌트의 내부 동작





```vue


<template>


  <nav>


    <NuxtLink to="/">홈</NuxtLink>


    <NuxtLink to="/blog">블로그</NuxtLink>


    <NuxtLink :to="`/blog/${post.id}`">{{ post.title }}</NuxtLink>


    <NuxtLink :to="{ name: 'blog-id', params: { id: 42 } }">포스트 42</NuxtLink>


    <NuxtLink to="/blog" active-class="active-link" prefetch-on="interaction">블로그</NuxtLink>


  </nav>


</template>


```





`<NuxtLink>`는 Vue Router의 `<RouterLink>`를 확장한 컴포넌트입니다. `to` prop이 내부 라우트(현재 origin과 동일)인지 외부 URL인지 확인한 후, 내부 라우트면 `router.push()`로 클라이언트 사이드 전환을 수행하고 외부 URL이면 `<a href="...">`로 fallback합니다. `prefetch-on="interaction"` 속성이 설정되면 IntersectionObserver가 `<NuxtLink>`의 진입을 감지할 때 또는 사용자가 링크 위에 마우스를 올릴 때 해당 페이지의 JavaScript 청크를 `<link rel="prefetch">`로 미리 로드합니다. `active-class`는 현재 라우트와 일치할 때 추가되는 CSS 클래스를 지정합니다.





## 프로그래매틱 네비게이션 — navigateTo()의 이중 구현





```typescript


await navigateTo('/blog')


await navigateTo('/blog', { replace: true })


await navigateTo('https://nuxt.com', { external: true })


await navigateTo({ name: 'blog-id', params: { id: postId } })


```





`navigateTo()`는 Nuxt의 네비게이션 헬퍼로, 실행 환경에 따라 두 가지 방식으로 동작합니다. **클라이언트 환경**에서는 `router.push()` 또는 `router.replace()`를 호출하여 SPA 방식으로 페이지를 전환합니다. **SSR 환경**에서는 H3의 `sendRedirect()`를 호출하여 HTTP 응답에 `302 Location: /blog` 헤더를 설정하고, 브라우저가 새 페이지를 요청하도록 합니다. `{ replace: true }` 옵션은 브라우저 히스토리에 현재 페이지를 남기지 않도록 `router.replace()`를 호출합니다. `{ external: true }`는 외부 URL로의 이동을 허용하며, SSR에서는 `307 Temporary Redirect`를 반환합니다.





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: NuxtLink와 일반 a 태그의 차이는 무엇인가요?</strong></summary>





`<NuxtLink>`는 내부 라우트에 대해 **클라이언트 사이드 네비게이션**을 수행합니다. 즉, 페이지 전체를 새로고침하지 않고 Vue Router가 JavaScript로 DOM을 교체합니다. 반면 `<a href="/blog">`는 브라우저가 새로운 HTML 페이지를 서버에 요청하여 전체 페이지를 다시 로드합니다. NuxtLink는 또한 prefetch 기능(마우스 호버 시 페이지 청크 미리 로드), active-class(현재 라우트 일치 시 스타일 적용), 외부 URL 자동 감지(fallback to `<a>`)를 제공합니다.


</details>





<details>


<summary><strong>Q: 동적 라우트 [id].vue에서 id가 숫자가 아닐 때 어떻게 처리하나요?</strong></summary>





`definePageMeta({ validate })` 함수에서 유효성 검사를 수행합니다. `validate: (route) => /^\d+$/.test(route.params.id as string)`로 숫자만 허용할 수 있습니다. 또한 `abortNavigation()`을 호출하여 404 페이지로 리다이렉트하거나, catch-all 라우트(`[...slug].vue`)가 정의되어 있으면 해당 페이지가 표시됩니다. validate 함수는 SSR 단계에서도 실행되므로, 검색 엔진이 유효하지 않은 URL을 인덱싱하는 것을 방지합니다.


</details>





<details>


<summary><strong>Q: pages/ 디렉토리 구조가 변경되면 어떻게 되나요?</strong></summary>





pages/ 디렉토리에 파일을 추가/삭제/이동하면 Nuxt의 개발 서버가 파일 변경을 감지하고 `.nuxt/paths.mjs`의 RouteRecord 배열을 자동으로 재생성합니다. 프로덕션에서는 `npm run build`로 다시 빌드해야 합니다. Hot Module Replacement(HMR)가 적용되므로 개발 중에는 브라우저 새로고침 없이 라우트 변경이 반영됩니다. 단, `nuxt.config.ts`의 설정과 관련된 라우트 변경은 서버 재시작이 필요할 수 있습니다.


</details>





<details>


<summary><strong>Q: 중첩 라우트(nested routes)는 어떻게 구현하나요?</strong></summary>





중첩 라우트는 디렉토리 구조로 자연스럽게 구현됩니다. 예를 들어 `pages/blog/[id].vue`와 `pages/blog/[id]/comment.vue`가 있을 때, `comment.vue`는 `blog/:id`의 자식 라우트가 아니라 독립적인 `/blog/:id/comment` 라우트로 등록됩니다. 진정한 중첩 라우트(같은 페이지 내에서 children 렌더링)를 구현하려면 `pages/blog/[id].vue`에 `<NuxtChild>` 컴포넌트를 배치하고, `pages/blog/[id]/child.vue`를 생성하면 `<NuxtChild>` 위치에 child 컴포넌트가 렌더링됩니다.


</details>





<details>


<summary><strong>Q: catch-all 라우트([...slug].vue)는 언제 사용하나요?</strong></summary>





catch-all 라우트는 정의된 다른 라우트와 일치하지 않는 모든 URL을 처리합니다. 주 사용처는 (1) **404 페이지**: 커스텀 404 페이지를 표시합니다. (2) **동적 라우트가 많은 경우**: `/docs/[...slug].vue`로 모든 문서 페이지를 단일 컴포넌트에서 처리합니다. (3) **SEO 내부 검색**: `/:search_query`의 형태로 사이트 내 검색을 구현합니다. catch-all은 Vue Router에서 `/:pathMatch(.*)*`로 매핑되며, `route.params.slug`는 URL 세그먼트의 배열(`string[]`)로 전달됩니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **pages/ 디렉토리** | 파일 경로 → URL 변환 | Vite import.meta.glob() → RouteRecordRaw[] |


| **[param].vue** | 동적 파라미터 | `/:param` → route.params.param |


| **[...slug].vue** | Catch-all | `/:pathMatch(.*)*` → 모든 URL 캡처 |


| **NuxtLink** | SPA 네비게이션 | RouterLink 확장 + prefetch + 외부 URL fallback |


| **navigateTo()** | 프로그래매틱 이동 | 클라이언트: router.push(), SSR: 302 redirect |


| **definePageMeta** | 페이지 메타데이터 | route.meta에 layout/middleware/validate 등록 |





## 다음 수업





다음 글에서는 레이아웃 시스템과 SEO 메타데이터 관리를 배웁니다.


