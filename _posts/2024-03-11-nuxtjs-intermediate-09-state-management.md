---


layout: post


title: "Nuxt.js 상태 관리 — useState와 Pinia가 SSR-safe하게 직렬화되고 하이드레이션되는 과정"


description: "Nuxt.js의 상태 관리 시스템이 SSR과 CSR 환경에서 상태 일관성을 유지하는 과정을 시스템 레벨에서 심층 학습합니다. useState가 Nuxt 인스턴스의 _useState 맵에 키-값 쌍을 저장하고 SSR 단계에서 nuxt._payload.data에 직렬화되어 클라이언트 하이드레이션 시 동일한 키로 복원되는 과정, Pinia의 defineStore()가 Setup Store 문법에서 ref/computed/function을 각각 state/getter/action으로 변환하고 $state를 __NUXT__.pinia에 직렬화하는 방식, @pinia/nuxt 모듈이 createPinia()를 Nuxt 플러그인으로 등록하고 SSR 하이드레이션을 자동 처리하는 과정, composable 패턴이 useState나 Pinia 없이도 재사용 가능한 로직을 캡슐화하는 방법을 다룹니다."


date: 2024-03-11 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, state-management, pinia, useState, composable, ssr]


level: intermediate


---





Nuxt.js에서 상태 관리는 SSR 호환성이 핵심입니다. 서버에서 설정한 상태가 클라이언트에 정확히 전달되어야 합니다.





> **핵심 정리** · `useState()`는 Nuxt의 SSR-safe ref로, 키-값 쌍을 `nuxt._useState` 맵에 저장합니다. SSR에서 설정된 값은 `nuxt._payload.data`에 직렬화되고, 클라이언트 하이드레이션 시 같은 키로 복원됩니다. Pinia는 `defineStore()`의 Setup Store에서 `ref` → state, `computed` → getter, `function` → action으로 변환하고, SSR에서 `$state`를 `__NUXT__.pinia`에 직렬화합니다.





---





## 수업 목표





- useState의 SSR-safe 직렬화/하이드레이션 과정을 이해합니다.


- Pinia Setup Store의 state/getter/action 변환을 이해합니다.


- @pinia/nuxt 모듈의 SSR 통합 방식을 이해합니다.


- composable 패턴으로 로직을 캡슐화하는 방법을 이해합니다.





## useState — 기본 상태 관리





```typescript


// composables/useCounter.ts


export const useCounter = () => {


  return useState('counter', () => 0)


}


```





```vue


<script setup lang="ts">


const counter = useCounter()


</script>


<template>


  <div>


    <p>카운트: {{ counter }}</p>


    <button @click="counter++">증가</button>


  </div>


</template>


```





`useState()`는 Nuxt의 `_useState` 맵에 키-값 쌍을 저장합니다. SSR 단계에서 모든 `useState()` 값은 `nuxt._payload.data` 객체에 `{ [key]: serializedValue }` 형태로 수집됩니다. `JSON.stringify()`로 직렬화되어 HTML의 `__NUXT__` 객체에 포함됩니다. 클라이언트 하이드레이션 시 `useState(key)`는 `__NUXT__.data[key]`에서 초기값을 찾습니다. 존재하면 해당 값을 ref의 초기값으로 설정하고, 없으면 팩토리 함수 `() => 0`을 실행하여 초기값을 생성합니다. 동일한 키로 `useState()`를 호출하는 모든 컴포넌트가 같은 ref를 공유하므로, 컴포넌트 간 상태 공유가 가능합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: useState와 Pinia 중 어떤 것을 선택해야 하나요?</strong></summary>





간단한 전역 상태(테마, 로그인 여부)는 `useState()`로 충분합니다. 복잡한 상태(여러 스토어 간 의존성, 비동기 액션, DevTools 디버깅)는 Pinia를 사용합니다. Pinia는 Vue DevTools와 통합되어 상태 변화를 시간순으로 추적할 수 있고, `$subscribe()`로 상태 변경을 감지할 수 있습니다. `$patch()`로 여러 상태를 한 번에 업데이트할 수 있습니다.


</details>





<details>


<summary><strong>Q: Pinia의 $state는 어떻게 SSR에서 직렬화되나요?</strong></summary>





Pinia는 SSR 단계에서 `getActivePinia().state.value`를 읽어 모든 스토어의 상태 객체를 수집합니다. 각 스토어의 상태는 `JSON.parse(JSON.stringify(state))`로 직렬화 가능한 형태로 변환됩니다(Date는 ISO 문자열, Set/Map은 배열로 변환). `__NUXT__.pinia`에는 `{ blog: { posts: [...], loading: false }, cart: { items: [] } }` 형태로 저장됩니다. 클라이언트 하이드레이션 시 `useStore().$state = __NUXT__.pinia[storeId]`로 복원됩니다.


</details>





<details>


<summary><strong>Q: composable에서 useState를 사용하면 상태가 공유되나요?</strong></summary>





`useState()`는 동일한 키로 호출하면 항상 같은 ref를 반환합니다. 따라서 `useCounter()` composable을 여러 컴포넌트에서 호출해도 같은 `counter` 값을 공유합니다. 만약 컴포넌트마다 독립적인 상태가 필요하다면 `useState()`에 고유한 키를 생성해야 합니다(예: `useState('counter-' + useRoute().params.id, () => 0)`).


</details>





<details>


<summary><strong>Q: Pinia 스토어에서 useFetch를 사용할 때 주의할 점은?</strong></summary>





Pinia 스토어 내에서 `useFetch()`를 호출하면 `__NUXT__.payload`에 데이터가 저장되지만, 스토어의 `$state`와는 별도로 관리됩니다. SSR에서 `store.fetchPosts()`가 실행되면 `useFetch()`가 SSR 페칭을 수행하고 데이터는 `__NUXT__.payload`에 저장됩니다. 동시에 `posts.value = data.value`가 실행되므로 `$state`에도 값이 설정됩니다. 클라이언트에서는 `$state`가 복원되므로 `posts` 값이 유지되지만, 추가 데이터는 `useFetch()`가 클라이언트에서 다시 실행될 수 있습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **useState** | SSR-safe ref | `_useState` 맵 → `__NUXT__.data` 직렬화 → 복원 |


| **Pinia Setup Store** | 전역 상태 관리 | ref→state, computed→getter, function→action 변환 |


| **@pinia/nuxt** | Pinia SSR 통합 | createPinia() 플러그인 등록 → `__NUXT__.pinia` 직렬화 |


| **composable** | 로직 재사용 | useState/Pinia 없이도 useXxx() 패턴으로 캡슐화 |





## 다음 수업





다음 글에서는 미들웨어와 인증 — defineNuxtRouteMiddleware와 JWT 토큰 검증을 배웁니다.


