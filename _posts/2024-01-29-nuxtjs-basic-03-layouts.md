---


layout: post


title: "Nuxt.js 레이아웃 시스템 — definePageMeta와 layouts/ 디렉토리가 useHead로 SEO 메타데이터를 주입하는 과정"


description: "Nuxt.js의 레이아웃 시스템과 SEO 메타데이터 관리의 내부 동작을 시스템 레벨에서 심층 학습합니다. layouts/ 디렉토리의 .vue 파일이 Vue Router의 route.meta.layout에 등록되어 페이지 렌더링 시 slot 기반으로 감싸지는 과정, useHead()와 useSeoMeta()가 @unhead/vue 라이브러리를 통해 <head>의 title/meta/script/link 요소를 DOM API로 조작하는 원리, definePageMeta()의 layout/middleware/name/key 프로퍼티가 .nuxt/pages/에 컴파일 타임에 저장되는 방식, 레이아웃 전환 시 Transition 컴포넌트의 enter/leave 애니메이션이 Vue의 <component :is> 동적 컴포넌트 교체로 동작하는 과정을 다룹니다."


date: 2024-01-29 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, layouts, seo, meta, usehead, definePageMeta]


level: basic


---





Nuxt.js의 레이아웃 시스템은 여러 페이지가 공통적인 UI 구조(헤더, 푸터, 사이드바)를 공유할 수 있도록 합니다.





> **핵심 정리** · Nuxt의 레이아웃은 `layouts/` 디렉토리의 .vue 파일로 정의됩니다. `default.vue`가 기본 레이아웃이며, 페이지에서 `definePageMeta({ layout: 'custom' })`로 변경할 수 있습니다. `useHead()`는 `@unhead/vue` 라이브러리를 통해 `<title>`, `<meta>`, `<script>`, `<link>` 태그를 생성/업데이트/제거합니다. `useSeoMeta()`는 Open Graph, Twitter Card, JSON-LD 구조화 데이터를 한 번에 설정합니다. 레이아웃 전환 시 Vue의 `<Transition>` 컴포넌트가 `<component :is="layoutComponent">`의 변경을 감지하여 enter/leave 애니메이션을 실행합니다.





---





## 수업 목표





- layouts/ 디렉토리와 레이아웃 전환 시스템을 이해합니다.


- definePageMeta로 페이지별 레이아웃을 변경하는 방법을 이해합니다.


- useHead와 useSeoMeta의 내부 동작을 이해합니다.


- JSON-LD 구조화 데이터를 생성합니다.


- Open Graph와 Twitter Card 메타데이터를 설정합니다.





## 기본 레이아웃{% raw %}```vue

<!-- layouts/default.vue -->

<template>

  <div class="app-layout">

    <header>

      <NuxtLink to="/">GHW Dev Blog</NuxtLink>

      <nav>

        <NuxtLink to="/blog">Blog</NuxtLink>

        <NuxtLink to="/about">About</NuxtLink>

      </nav>

    </header>

    <main>

      <slot />

    </main>

    <footer>

      <p>&copy; {{ new Date().getFullYear() }} GHW Dev Blog</p>

    </footer>

  </div>

</template>

```{% endraw %}





`layouts/` 디렉토리의 각 .vue 파일은 unplugin-auto-import 방식과 유사하게 Nuxt의 LayoutManager에 등록됩니다. `default.vue`는 기본 레이아웃으로, `definePageMeta({ layout: 'custom' })`가 없는 모든 페이지에 자동 적용됩니다. `<slot />`은 현재 페이지의 Vue 컴포넌트가 렌더링되는 위치입니다. Nuxt는 `<NuxtLayout>` 컴포넌트에서 `route.meta.layout` 값을 읽어 `<component :is="layoutComponent">`로 동적 렌더링합니다. 레이아웃 파일명(`default`, `blog`, `admin`)이 컴포넌트 이름으로 변환되어 `defineAsyncComponent()`로 지연 로딩됩니다.





## 페이지별 레이아웃 설정





```vue


<!-- pages/blog.vue -->


<script setup lang="ts">


definePageMeta({


  layout: 'blog',


  name: 'blog-index',


  key: route => route.fullPath,


  transition: {


    name: 'fade',


    mode: 'out-in'


  }


})


</script>


```





`definePageMeta()`의 프로퍼티들은 Nuxt의 컴파일 타임에 `.nuxt/pages/blog.vue` 메타데이터 파일에 저장됩니다. `layout`은 사용할 레이아웃 파일명을 지정합니다. `name`은 Vue Router의 라우트 이름을 지정하여 `navigateTo({ name: 'blog-index' })`로 이동할 수 있게 합니다. `key` prop은 Vue의 `:key` 바인딩과 동일하게 동작하여, 동일한 컴포넌트에서 다른 파라미터로 이동할 때 컴포넌트를 강제로 다시 마운트합니다. `transition`은 레이아웃 전환 시 Vue `<Transition>`의 props를 설정합니다.





### 레이아웃 전환 옵션





| 옵션 | 타입 | 설명 |


|------|------|------|


| `layout` | string | 사용할 레이아웃 파일명 (layouts/ 디렉토리 기준) |


| `name` | string | Vue Router 라우트 이름 |


| `key` | string \| Function | 컴포넌트 강제 재마운트 키 |


| `transition` | object | Vue `<Transition>` 컴포넌트 props |


| `middleware` | string\|string[] | 적용할 미들웨어 |


| `validate` | function | 라우트 유효성 검사 함수 |





## SEO 메타데이터 — useHead와 useSeoMeta





```vue


<script setup lang="ts">


useHead({


  title: 'Nuxt.js 시작하기',


  titleTemplate: (title) => `${title} | GHW Dev Blog`,


  meta: [


    { name: 'description', content: 'Nuxt.js 기초부터 고급까지' },


    { name: 'keywords', content: 'nuxtjs, vue, ssr' },


    { property: 'og:title', content: 'Nuxt.js 시작하기' },


    { property: 'og:description', content: 'Nuxt.js 기초부터 고급까지' },


    { property: 'og:image', content: '/og-image.png' },


    { name: 'twitter:card', content: 'summary_large_image' },


    { name: 'twitter:title', content: 'Nuxt.js 시작하기' },


  ],


  link: [


    { rel: 'canonical', href: 'https://ghw.dev/nuxtjs-intro' },


    { rel: 'alternate', hreflang: 'ko', href: 'https://ghw.dev/ko/nuxtjs-intro' },


  ],


  script: [


    { type: 'application/ld+json', children: JSON.stringify({ ... }) }


  ]


})


</script>


```





`useHead()`는 `@unhead/vue` 라이브러리의 composable입니다. `@unhead/vue`는 DOM의 `<head>` 요소를 직접 조작하여 title, meta, link, script, style 태그를 생성/업데이트/제거합니다. `titleTemplate` 옵션은 `document.title`이 설정될 때마다 콜백을 실행하여 `{title} | {suffix}` 형식의 템플릿을 적용합니다. `meta` 배열의 각 항목은 `document.createElement('meta')`로 생성되어 `<head>`에 추가됩니다. 동일한 `name` 또는 `property` 속성을 가진 meta 태그가 있으면 중복을 제거하고 업데이트합니다. 페이지가 언마운트되거나 다른 페이지로 이동하면 `onUnmounted()` 훅에서 생성된 태그를 자동으로 제거합니다.





### useSeoMeta로 간편 설정





```vue


<script setup lang="ts">


useSeoMeta({


  title: 'Nuxt.js 시작하기',


  description: 'Nuxt.js 기초부터 고급까지 시스템 레벨 학습',


  ogTitle: 'Nuxt.js 시작하기',


  ogDescription: 'Nuxt.js 기초부터 고급까지 시스템 레벨 학습',


  ogImage: '/og-image.png',


  twitterCard: 'summary_large_image',


  robots: 'index, follow',


  googlebot: 'index, follow',


  keywords: 'nuxtjs, vue, ssr, seo'


})


</script>


```





`useSeoMeta()`는 `useHead()`의 편의 래퍼로, 각 프로퍼티를 자동으로 적절한 Open Graph, Twitter Card, 표준 meta 태그로 변환합니다. 프로퍼티 이름에서 `og` 접두사는 `property="og:..."`로, `twitter` 접두사는 `name="twitter:..."`로 자동 매핑됩니다. 내부적으로는 `useHead({ meta: [...] })`를 호출하므로 동일한 DOM 조작 메커니즘을 사용합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: useHead와 useSeoMeta의 차이는 무엇인가요?</strong></summary>





`useHead()`는 저수준 API로, meta, link, script, style, noscript 등 모든 `<head>` 요소를 직접 제어할 수 있습니다. 배열 형태로 여러 태그를 추가하고, `titleTemplate`으로 title 포맷팅을 지정할 수 있습니다. `useSeoMeta()`는 고수준 편의 API로, SEO에 특화된 Open Graph, Twitter Card, 표준 meta 태그를 프로퍼티 이름 기반으로 자동 생성합니다. 예를 들어 `ogTitle: '제목'`은 `<meta property="og:title" content="제목">`으로 변환됩니다. 내부적으로 `useSeoMeta()`는 `useHead()`를 호출하므로 두 API를 혼용할 수 있습니다.


</details>





<details>


<summary><strong>Q: JSON-LD 구조화 데이터는 어떻게 추가하나요?</strong></summary>





JSON-LD는 `<script type="application/ld+json">` 태그로 추가합니다. `useHead()`의 `script` 배열에 `{ type: 'application/ld+json', children: JSON.stringify(jsonLdObject) }`를 전달합니다. 구조화 데이터의 종류에 따라 `Article`, `BlogPosting`, `Product`, `FAQPage`, `BreadcrumbList`, `Organization`, `Person`, `WebSite`, `WebPage` 등의 Schema.org 타입을 사용합니다. JSON-LD는 검색 엔진이 콘텐츠를 이해하고 리치 스니펫(별점, 가격, FAQ 등)을 표시하는 데 사용됩니다.


</details>





<details>


<summary><strong>Q: 여러 useHead 호출이 충돌하면 어떻게 되나요?</strong></summary>





`@unhead/vue`는 **태그 병합(tag dedup)** 전략을 사용합니다. 동일한 `name`이나 `property`를 가진 meta 태그는 나중에 선언된 값으로 업데이트됩니다. `title`은 가장 마지막에 호출된 `useHead()`의 값으로 설정됩니다. `script`와 `link` 태그는 key 속성으로 중복을 관리합니다. 페이지 레이아웃의 `useHead()`와 페이지 컴포넌트의 `useHead()`가 모두 호출되면, 페이지 컴포넌트의 값이 레이아웃의 값을 덮어씁니다. 이러한 동작 방식 때문에 각 페이지에서 필요한 메타데이터만 설정하면 되고, 공통 메타데이터는 레이아웃에서 한 번만 설정하면 됩니다.


</details>





<details>


<summary><strong>Q: 동적 OG 이미지를 생성하려면 어떻게 해야 하나요?</strong></summary>





`@nuxt/image`와 `@unhead/vue`를 조합하여 동적 OG 이미지를 생성할 수 있습니다. `/server/api/og-image.ts`에서 Satori(satori) 라이브러리로 HTML/CSS를 SVG로 변환하고, sharp로 PNG로 렌더링하여 Base64 또는 CDN URL로 반환합니다. 페이지 컴포넌트에서는 `useSeoMeta({ ogImage: '/api/og-image?title=' + encodeURIComponent(pageTitle) })`로 동적 OG 이미지 URL을 설정합니다. SNS 공유 시 해당 URL로 요청이 전송되고 서버에서 실시간으로 OG 이미지를 생성하여 반환합니다.


</details>





<details>


<summary><strong>Q: 레이아웃 전환 애니메이션은 어떻게 구현하나요?</strong></summary>





`definePageMeta({ transition: { name: 'fade', mode: 'out-in' } })`로 페이지 전환 애니메이션을 설정합니다. `name: 'fade'`는 CSS 클래스 `.fade-enter-active`, `.fade-leave-active`, `.fade-enter-from`, `.fade-leave-to`를 생성합니다. `mode: 'out-in'`은 현재 페이지가 먼저 사라진 후(leave) 새 페이지가 나타납니다(enter). `mode: 'in-out'`은 새 페이지가 나타난 후 현재 페이지가 사라집니다. CSS 전환은 `transition: opacity 0.3s ease`로 정의합니다. 레이아웃 전환 시 Vue의 `<component :is="layoutComponent">`가 변경되면서 `<Transition>`이 enter/leave 훅을 실행합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **layouts/** | 공통 UI 템플릿 | LayoutManager → `<component :is>` 동적 렌더링 |


| **definePageMeta** | 페이지 메타데이터 | `.nuxt/pages/`에 컴파일 타임 저장 → route.meta |


| **useHead** | `<head>` 조작 | @unhead/vue → DOM API로 태그 생성/업데이트/제거 |


| **useSeoMeta** | SEO 메타데이터 | 프로퍼티 → og:/twitter: 자동 매핑 → useHead 호출 |


| **JSON-LD** | 구조화 데이터 | `<script type="application/ld+json">`에 삽입 |





## 다음 수업





다음 글에서는 Nuxt.js의 컴포넌트 시스템과 auto-imports를 배웁니다.


