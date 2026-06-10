---


layout: post


title: "Nuxt.js 데이터 페칭 — useFetch와 useAsyncData가 __NUXT__.payload로 SSR 하이드레이션하는 과정"


description: "Nuxt.js의 데이터 페칭 시스템이 SSR과 CSR에서 데이터 일관성을 유지하는 과정을 시스템 레벨에서 심층 학습합니다. useFetch가 SSR 단계에서 $fetch로 Nitro 서버에 HTTP 요청을 전송하고 응답을 __NUXT__.payload.data에 직렬화하여 HTML script 태그에 인라인으로 포함시키는 과정, useAsyncData가 useFetch의 내부 구현으로 동일한 직렬화/하이드레이션 사이클을 수행하는 원리, 클라이언트 하이드레이션 시 useFetch가 __NUXT__.data에서 캐시된 데이터를 발견하면 네트워크 요청 없이 즉시 반환하는 방식, key 옵션으로 캐시 키를 커스터마이징하여 데이터 중복을 방지하는 방법, lazy: true 옵션으로 SSR 페칭을 건너뛰고 CSR에서만 데이터를 로드하는 방식, transform과 pick 옵션으로 응답 데이터를 가공하는 과정을 다룹니다."


date: 2024-02-12 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, data-fetching, useFetch, useAsyncData, ssr, hydration, payload]


level: basic


---





Nuxt.js의 데이터 페칭 시스템은 SSR과 CSR 환경에서 데이터 일관성을 자동으로 유지합니다. useFetch 하나로 서버와 클라이언트 모두에서 동작하는 데이터 로딩을 구현할 수 있습니다.





> **핵심 정리** · `useFetch()`는 SSR 단계에서 `$fetch()`로 Nitro 서버에 HTTP 요청을 전송합니다. 응답 데이터는 `__NUXT__.payload.data`의 `payload.data[key]`에 직렬화되어 HTML에 인라인으로 포함됩니다. 클라이언트 하이드레이션 시 `useFetch()`는 `__NUXT__.data[key]`에서 캐시를 먼저 확인하여 네트워크 요청을 생략합니다. `useAsyncData()`는 `useFetch()`의 내부 엔진으로, key/transform/pick/lazy 옵션을 직접 제어합니다. `lazy: true`는 SSR 페칭을 건너뛰고 CSR에서만 데이터를 로드합니다.





---





## 수업 목표





- useFetch의 SSR→CSR 하이드레이션 과정을 이해합니다.


- useAsyncData와 useFetch의 관계를 이해합니다.


- key 옵션으로 데이터 캐시를 관리하는 방법을 이해합니다.


- transform과 pick으로 응답 데이터를 가공하는 방법을 이해합니다.


- lazy 모드의 동작 방식을 이해합니다.





## useFetch 기본





```vue


<script setup lang="ts">


const { data: posts, pending, error, refresh } = await useFetch('/api/posts')


const { data: newPost } = await useFetch('/api/posts', { method: 'POST', body: { title: '새 글', content: '내용' } })


const { data: searchResults } = await useFetch('/api/search', { query: { q: 'nuxt', page: 1, limit: 10 } })


</script>


<template>


  <div v-if="pending">로딩 중...</div>


  <div v-else-if="error">에러: {{ error.message }}</div>


  <ul v-else>


    <li v-for="post in posts" :key="post.id">{{ post.title }}</li>


  </ul>


</template>


```





`useFetch()`는 내부적으로 `useAsyncData()`와 `$fetch()`를 조합하여 동작합니다. SSR 단계에서 `useFetch()`가 처음 실행되면 `$fetch()`로 Nitro 서버에 HTTP 요청을 전송합니다. 응답 데이터는 `payload.data[key]`에 저장되고, `payload._errors[key]`에 에러 정보가 저장됩니다. 이 payload 객체는 `JSON.stringify()`로 직렬화되어 HTML의 `<script>window.__NUXT__ = { data: {...}, payload: {...} }</script>`에 인라인으로 포함됩니다. 클라이언트 하이드레이션 시 `useFetch()`는 `__NUXT__.data[key]`에서 키에 해당하는 캐시를 먼저 확인합니다. 캐시가 존재하면 `$fetch()`를 건너뛰고 캐시된 데이터를 즉시 반환하여 SSR과 CSR 간 데이터 일관성을 유지합니다.





`await useFetch(url)`에서 `await` 키워드는 SSR에서만 필요합니다. SSR에서는 `useFetch()`가 완료될 때까지 기다린 후 HTML을 생성해야 합니다. CSR에서는 `useFetch()`가 `Promise`를 반환하지만, `setup()` 함수가 async여도 Vue는 이를 처리할 수 있습니다. Nuxt는 `<script setup>`에서 `await useFetch()`를 감지하면 해당 Promise가 resolve될 때까지 페이지 렌더링을 지연시킵니다.





### pending, error, refresh 활용





```vue


<script setup lang="ts">


const { data: posts, pending, error, refresh, execute } = await useFetch('/api/posts')





async function refreshPosts() {


  await refresh()  // 동일한 URL로 재요청


}





async function searchPosts() {


  await execute({ query: { q: 'nuxt' } })  // 새로운 파라미터로 실행


}


</script>


<template>


  <div>


    <button @click="refreshPosts">새로고침</button>


    <button @click="searchPosts">검색</button>


    <div v-if="pending">


      <p>로딩 중... <progress indeterminate /></p>


    </div>


    <div v-else-if="error">


      <p class="error">에러 발생: {{ error.statusCode }} - {{ error.statusMessage }}</p>


      <button @click="refresh()">재시도</button>


    </div>


    <ul v-else>


      <li v-for="post in posts" :key="post.id">{{ post.title }}</li>


    </ul>


  </div>


</template>


```





`refresh()`는 동일한 URL과 옵션으로 요청을 재실행합니다. 내부적으로 `execute()`를 호출하며, `execute()`는 새로운 URL이나 옵션을 전달할 수 있습니다. `pending`은 요청이 진행 중일 때 `true`가 되는 `Ref<boolean>`입니다. `error`는 H3Error 객체로, `error.statusCode`(404, 500 등)와 `error.statusMessage`를 포함합니다.





## useAsyncData





```vue


<script setup lang="ts">


const { data: posts, pending, error } = await useAsyncData('posts', () => {


  return $fetch('/api/posts', { query: { limit: 10 } })


}, {


  transform: (posts) => posts.map(p => ({


    ...p,


    excerpt: p.content.substring(0, 100),


    createdDate: new Date(p.createdAt).toLocaleDateString('ko-KR')


  })),


  pick: ['id', 'title', 'excerpt', 'createdDate'],


  lazy: true


})


</script>


```





`useAsyncData()`는 `useFetch()`의 저수준 구현입니다. `useFetch()`가 URL과 옵션을 받아 자동으로 `$fetch()`를 호출하는 반면, `useAsyncData()`는 개발자가 직접 `$fetch()` 호출을 제어할 수 있습니다. 첫 번째 인자 `'posts'`는 캐시 키로, `__NUXT__.payload.data['posts']`에 저장됩니다. `transform` 옵션은 데이터가 컴포넌트에 바인딩되기 전에 가공하고, `pick`은 응답 객체에서 특정 속성만 추출하여 payload 크기를 줄입니다.





`transform`은 SSR에서 실행되므로, 클라이언트에는 가공된 데이터만 전달됩니다. 예를 들어 `content` 전체(10KB) 대신 `excerpt`(100자)만 payload에 포함되므로 HTML 크기가 줄어듭니다. `pick`은 `lodash.pick`과 유사하게 동작하며, `transform`보다 먼저 실행됩니다.





### SSR 하이드레이션 상세





```typescript


// SSR 단계에서 생성되는 HTML


// </div>


// <script>window.__NUXT__ = {


//   data: {


//     '/api/posts': [...posts],


//     'posts': [...transformedPosts],


//     '/api/posts/1': { id: 1, title: '...', content: '...' }


//   },


//   payload: {


//     _errors: { '/api/posts': null, 'posts': null }


//   },


//   serverRendered: true,


//   config: { public: { apiBase: '/api', siteUrl: '...' } }


// }</script>


```





Nuxt는 SSR이 완료되면 모든 `useFetch()`와 `useAsyncData()` 호출의 결과를 `__NUXT__` 객체에 수집합니다. `data` 객체는 키-값 쌍으로 저장되며, 각 키는 URL 또는 커스텀 key입니다. `payload._errors`는 각 요청의 에러 상태를 저장합니다. `serverRendered: true`는 클라이언트에게 SSR이 완료되었음을 알립니다. `config.public`은 `runtimeConfig.public`의 값이 클라이언트에 전달됩니다.





클라이언트에서는 `createNuxtApp()`이 `__NUXT__` 객체를 읽어 `nuxtApp.payload`에 저장합니다. 하이드레이션 시 `useFetch()`와 `useAsyncData()`는 `nuxtApp.payload.data[key]`를 먼저 확인합니다. 값이 존재하면 `$fetch()`를 실행하지 않고 캐시된 값을 반환합니다. 이 과정에서 네트워크 요청이 발생하지 않으므로 하이드레이션 속도가 매우 빠릅니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: useFetch와 $fetch의 차이는 무엇인가요?</strong></summary>





`$fetch()`는 Nitro의 HTTP 클라이언트로, 단순히 HTTP 요청을 보내고 응답을 반환합니다. SSR/CSR 구분 없이 항상 네트워크 요청을 실행합니다. `useFetch()`는 `$fetch()`를 래핑한 Nuxt composable로, SSR에서는 `$fetch()`로 데이터를 가져와 `__NUXT__`에 저장하고, CSR에서는 `__NUXT__`의 캐시를 먼저 확인하여 네트워크 요청을 생략합니다. 컴포넌트의 `data` ref가 `__NUXT__`의 값과 자동으로 연결되므로, 별도의 상태 동기화 코드가 필요 없습니다. `$fetch()`는 `useAsyncData()`와 함께 사용하거나, 클라이언트 전용 요청에 사용합니다.


</details>





<details>


<summary><strong>Q: key 옵션은 언제 사용해야 하나요?</strong></summary>





`key` 옵션은 데이터 캐시의 식별자를 직접 지정할 때 사용합니다. 같은 페이지에서 여러 `useFetch()`를 사용할 때 키가 중복되면 데이터가 덮어씌워질 수 있습니다. 이때 `key`를 명시적으로 지정하여 충돌을 방지합니다. 예를 들어 `useFetch('/api/user')`가 여러 번 호출되는 경우 `key: 'user-profile'`과 `key: 'user-settings'`로 구분합니다. 또한 동적 URL(예: `/api/posts/${id}`)의 경우 URL 자체가 고유 키가 되므로 `key`를 명시할 필요가 없습니다.


</details>





<details>


<summary><strong>Q: lazy: true 옵션은 SSR에 어떤 영향을 주나요?</strong></summary>





`lazy: true`는 SSR에서 데이터 페칭을 건너뜁니다. SSR은 HTML을 생성할 때 `useFetch()`가 완료될 때까지 기다리지 않습니다. 따라서 `data.value`는 SSR에서 `null`이고, `pending.value`는 `true`입니다. 클라이언트에서 페이지가 마운트된 후 `useFetch()`가 실행되어 데이터를 가져옵니다. 이 옵션은 SEO가 필요 없는 페이지나 로그인 후에만 표시되는 콘텐츠에 유용합니다. SEO가 중요한 페이지에서는 `lazy: false`(기본값)를 사용하여 SSR에서 데이터를 포함한 완전한 HTML을 생성해야 합니다.


</details>





<details>


<summary><strong>Q: transform 옵션에서 Date 객체를 반환하면 어떻게 되나요?</strong></summary>





`__NUXT__` 객체는 `JSON.stringify()`로 직렬화됩니다. `Date` 객체는 ISO 문자열(`2024-01-15T01:00:00.000Z`)로 변환됩니다. 클라이언트에서 `transform`이 다시 실행되지 않으므로, Date 객체가 필요한 경우 `useAsyncData`의 `transform`에서 문자열로 변환하거나, 클라이언트에서 `new Date()`로 다시 생성해야 합니다. `pick`을 사용하면 속성만 추출하므로 Date 타입이 유지되지만, 직렬화 과정에서 문자열로 변환됩니다.


</details>





<details>


<summary><strong>Q: 여러 개의 useFetch를 병렬로 실행할 수 있나요?</strong></summary>





가능합니다. `Promise.all()`을 사용하여 여러 `useFetch()`를 병렬로 실행할 수 있습니다: `const [posts, users] = await Promise.all([useFetch('/api/posts'), useFetch('/api/users')])`. 모든 요청이 완료될 때까지 기다린 후 HTML을 생성합니다. 각 요청의 결과는 독립적으로 `__NUXT__`에 저장됩니다. `await` 없이 `useFetch()`를 호출하면 요청이 병렬로 시작되지만, `<script setup>`의 실행이 완료될 때까지 모든 Promise가 resolve되지 않으면 페이지가 렌더링되지 않을 수 있습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **useFetch** | SSR-safe HTTP 요청 | SSR: $fetch() → __NUXT__.payload, CSR: 캐시 확인 |


| **useAsyncData** | 저수준 데이터 페칭 | useFetch의 내부 엔진, key/transform/pick 직접 제어 |


| **key** | 캐시 식별자 | __NUXT__.payload.data[key]에 저장 |


| **transform/pick** | 데이터 가공 | SSR에서 실행 → 가공된 결과 payload에 저장 |


| **lazy** | CSR 전용 페칭 | SSR 건너뜀 → CSR에서 마운트 시 실행 |


| **pending/error/refresh** | 상태 관리 | Ref<boolean> / H3Error 객체 / 동일 URL 재요청 |





## 다음 수업





다음 글에서는 Nitro 서버 엔진 — server/api/로 백엔드를 구축하는 과정을 배웁니다.


