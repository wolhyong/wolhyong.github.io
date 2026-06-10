---


layout: post


title: "Nuxt.js 컴포넌트와 auto-imports — components/ 디렉토리가 unplugin-vue-components로 전역 등록되는 과정"


description: "Nuxt.js의 컴포넌트 시스템과 auto-imports의 내부 동작을 시스템 레벨에서 심층 학습합니다. unplugin-vue-components가 components/ 디렉토리를 재귀적으로 스캔하여 파일명을 PascalCase 컴포넌트 이름으로 변환하고 Vite의 transform 훅에서 템플릿 태그명과 매칭시키는 과정, Lazy 접두사가 defineAsyncComponent()로 변환되어 별도의 JavaScript 청크로 분할되는 원리, .client.vue 접미사가 SSR 단계에서 <div> placeholder로 대체되고 하이드레이션 후에만 클라이언트에서 마운트되는 방식, .server.vue가 서버에서만 렌더링되고 클라이언트에는 직렬화된 HTML만 전달되는 과정, Vue의 slot 시스템이 $slots 객체를 통해 VNode 배열을 주입하는 내부 동작을 다룹니다."


date: 2024-02-05 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, components, auto-imports, lazy, unplugin-vue-components, slots]


level: basic


---





Nuxt.js에서 components/ 디렉토리의 모든 .vue 파일은 자동으로 전역 등록되어 import 문 없이 템플릿에서 바로 사용할 수 있습니다.





> **핵심 정리** · Nuxt의 auto-imports는 `unplugin-vue-components` 플러그인이 components/ 디렉토리의 파일명을 PascalCase로 변환하여 전역 컴포넌트 맵에 등록합니다. `Lazy` 접두사는 `defineAsyncComponent()`로 컴포넌트를 래핑하여 주 번들에서 제외하고 요청 시 로드합니다. `.client.vue` 접미사는 SSR에서 `<div>` placeholder만 렌더링하고, `.server.vue`는 서버에서만 렌더링됩니다. Vue의 slot 시스템은 `$slots` 객체에 VNode 배열을 저장하고, `<slot name="header">`는 `this.$slots.header()`로 호출됩니다.





---





## 수업 목표





- components/ 디렉토리의 auto-imports 동작 원리를 이해합니다.


- Lazy 접두사의 청크 분할 방식을 이해합니다.


- .client.vue와 .server.vue의 SSR 동작 차이를 이해합니다.


- slot과 named slots의 VNode 주입 방식을 이해합니다.





## 기본 컴포넌트 사용





```vue


<!-- components/PostCard.vue -->


<script setup lang="ts">


interface Props {


  title: string


  excerpt: string


  date: string


  slug: string


}


defineProps<Props>()


</script>





<template>


  <article class="post-card">


    <h2><NuxtLink :to="`/blog/${slug}`">{{ title }}</NuxtLink></h2>


    <time :datetime="date">{{ date }}</time>


    <p>{{ excerpt }}</p>


  </article>


</template>


```





```vue


<!-- pages/blog/index.vue -->


<template>


  <div class="post-list">


    <PostCard


      v-for="post in posts"


      :key="post.id"


      :title="post.title"


      :excerpt="post.excerpt"


      :date="post.date"


      :slug="post.slug"


    />


  </div>


</template>


```





`components/` 디렉토리의 각 .vue 파일은 `unplugin-vue-components` 플러그인이 빌드 시점에 스캔합니다. 파일 경로 `components/PostCard.vue`에서 디렉토리명과 파일명(확장자 제외)을 추출하여 PascalCase로 결합합니다. `PostCard` 이름으로 전역 컴포넌트 맵에 등록되며, 등록된 컴포넌트는 모든 템플릿에서 `<PostCard />`로 사용 가능합니다. Vite의 `transform` 훅에서 각 .vue 파일의 템플릿을 스캔할 때, `<PostCard>` 태그가 발견되면 해당 컴포넌트의 `import` 문(`import { PostCard } from '~/components/PostCard.vue'`)이 스크립트 상단에 자동 주입됩니다. `defineProps<Props>()`는 TypeScript 인터페이스에서 props 타입을 추론하여 Vue의 런타임 props 옵션으로 변환합니다.





### 중첩 디렉토리와 컴포넌트 이름





```


components/


├── base/


│   ├── Button.vue       → <BaseButton />


│   └── Input.vue        → <BaseInput />


├── blog/


│   └── PostCard.vue     → <BlogPostCard />


└── icons/


    └── GitHub.vue       → <IconsGitHub />


```





중첩 디렉토리의 경우 파일 경로의 각 디렉토리명이 PascalCase 접두사로 추가됩니다. `components/base/Button.vue`는 경로 `base/Button`에서 `base`와 `Button`을 결합하여 `BaseButton`으로 등록됩니다. `components/blog/PostCard.vue`는 `BlogPostCard`로 등록됩니다. 이 규칙을 통해 이름 충돌을 방지하고 디렉토리 구조로 컴포넌트를 논리적으로 그룹화할 수 있습니다.





### 컴포넌트 이름 변환 규칙





| 파일 경로 | 등록된 이름 | 사용 태그 |


|-----------|------------|----------|


| `components/Button.vue` | Button | `<Button />` |


| `components/base/Button.vue` | BaseButton | `<BaseButton />` |


| `components/blog/PostCard.vue` | BlogPostCard | `<BlogPostCard />` |


| `components/icons/GitHub.vue` | IconsGitHub | `<IconsGitHub />` |





## Lazy Loading — `<Lazy>`





```vue


<template>


  <div>


    <!-- 즉시 로딩 -->


    <HeavyChart :data="chartData" />





    <!-- 지연 로딩 (화면에 보일 때 로드) -->


    <LazyHeavyChart :data="chartData" />





    <!-- 조건부 지연 로딩 -->


    <LazyCommentSection v-if="showComments" />


  </div>


</template>


```





`Lazy` 접두사는 unplugin-vue-components가 컴포넌트를 `defineAsyncComponent()`로 래핑하도록 지시합니다. `defineAsyncComponent()`는 Vue 3의 비동기 컴포넌트 팩토리로, 반환된 Promise가 resolve될 때까지 컴포넌트를 렌더링하지 않습니다. `LazyHeavyChart`는 주 JavaScript 번들에서 제외되고 별도의 청크(`HeavyChart.[hash].js`)로 분할됩니다. `<LazyHeavyChart>`가 처음 렌더링될 때(IntersectionObserver로 viewport 진입 감지 또는 조건부 `v-if` 활성화 시), 해당 청크가 동적으로 `import()`됩니다. 청크가 로드되면 `defineAsyncComponent()`가 컴포넌트를 resolve하고 정상 렌더링을 시작합니다.





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Lazy 접두사 없이 컴포넌트를 직접 import하면 어떻게 되나요?</strong></summary>





`import HeavyChart from '~/components/HeavyChart.vue'`로 직접 import하면 해당 컴포넌트가 주 번들에 포함되어 초기 로딩 시간이 증가합니다. `Lazy` 접두사를 사용하면 `defineAsyncComponent()`로 래핑되어 별도의 청크로 분할되고, 필요한 시점에만 로드됩니다. 큰 차트 라이브러리, 맵, 텍스트 에디터 등 무거운 컴포넌트는 항상 Lazy 로딩하는 것이 좋습니다. 조건부 렌더링(`v-if`)과 함께 사용하면 더 효과적입니다.


</details>





<details>


<summary><strong>Q: .client.vue와 .server.vue를 동시에 사용할 수 있나요?</strong></summary>





같은 이름의 .client.vue와 .server.vue를 만들면 Nuxt가 두 파일을 자동으로 병합합니다. 서버에서는 .server.vue가, 클라이언트에서는 .client.vue가 사용됩니다. 이 패턴은 서버에서 정적 HTML을 생성하고 클라이언트에서 JavaScript로 인터랙션을 추가해야 할 때 유용합니다. 예를 들어 서버에서는 SEO를 위해 완전한 HTML을 전송하고, 클라이언트에서는 동적 이벤트를 추가하는 식입니다.


</details>





<details>


<summary><strong>Q: 컴포넌트 이름이 충돌하면 어떻게 되나요?</strong></summary>





동일한 이름의 컴포넌트가 여러 개 있으면 Nuxt는 마지막에 등록된 컴포넌트로 덮어씁니다. 충돌을 방지하려면 컴포넌트를 디렉토리로 그룹화하여 자동 접두사가 추가되도록 하세요. 예를 들어 `components/base/Button.vue`는 `BaseButton`이 되어 충돌하지 않습니다. 특정 디렉토리를 제외하려면 `nuxt.config.ts`에서 `components: { dirs: [{ path: '~/components/shared', global: true }] }`로 커스텀 설정할 수 있습니다.


</details>





<details>


<summary><strong>Q: slot과 props의 차이는 무엇인가요?</strong></summary>





props는 부모가 자식 컴포넌트에 데이터를 전달하는 메커니즘입니다. slot은 부모가 자식 컴포넌트의 특정 위치에 **템플릿 조각(HTML/VNode)을 전달**하는 메커니즘입니다. props는 문자열, 숫자, 객체, 함수 등 모든 JavaScript 값을 전달할 수 있지만, slot은 렌더링될 HTML 조각을 전달합니다. slot은 부모 컨텍스트에서 렌더링되므로 부모의 데이터에 직접 접근할 수 있습니다. props는 자식 컨텍스트에서 사용됩니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **components/** | 전역 컴포넌트 auto-import | unplugin-vue-components → PascalCase 등록 |


| **Lazy** | 지연 로딩 | defineAsyncComponent() → 별도 청크 분할 |


| **.client.vue** | 브라우저 전용 | SSR: <div> placeholder → 하이드레이션 후 마운트 |


| **.server.vue** | 서버 전용 | SSR 렌더링 → 클라이언트에 HTML만 전달 |


| **slot** | 콘텐츠 배포 | $slots 객체 → VNode 배열 주입 → Virtual DOM |





## 다음 수업





다음 글에서는 데이터 페칭 — useFetch와 useAsyncData의 SSR 하이드레이션 과정을 배웁니다.


