---


layout: post


title: "Nuxt.js 테스팅 — Vitest로 유닛 테스트, Playwright로 E2E 테스트, @nuxt/test-utils 모듈 활용"


description: "Nuxt.js 애플리케이션의 테스팅 전략을 시스템 레벨에서 심층 학습합니다. @nuxt/test-utils 모듈이 setup() 함수에서 Nuxt 인스턴스를 생성하고 mountSuspended()로 컴포넌트를 마운트하여 useFetch/useState/useRoute 등 Nuxt composable이 정상 동작하는 환경을 제공하는 과정, Vitest의 describe/it/expect API가 Node.js의 assert 모듈과 chai 라이브러리를 기반으로 테스트를 구조화하고 assertion을 수행하는 방식, Playwright의 chromium.launch()로 헤드리스 브라우저를 실행하고 page.goto()로 실제 페이지에 접근하여 DOM 요소를 검증하는 E2E 테스트 과정, mockNuxtImport()로 useFetch 등의 외부 의존성을 가로채어(mock) 테스트 더블을 주입하는 방식을 다룹니다."


date: 2024-05-20 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, testing, vitest, playwright, e2e, unit-test, test-utils]


level: advanced


---





Nuxt.js 애플리케이션의 테스팅은 @nuxt/test-utils로 유닛 테스트, Playwright로 E2E 테스트를 수행합니다.





> **핵심 정리** · `@nuxt/test-utils`는 `mountSuspended()`로 Nuxt composable이 동작하는 환경에서 컴포넌트를 마운트합니다. Vitest는 `describe`/`it`/`expect`로 테스트를 구조화합니다. Playwright는 헤드리스 브라우저로 실제 페이지에 접근하여 E2E를 검증합니다.





---





## 수업 목표





- @nuxt/test-utils의 Nuxt 환경 재현 방식을 이해합니다.


- mountSuspended로 컴포넌트를 테스트하는 방법을 이해합니다.


- Playwright E2E 테스트의 동작을 이해합니다.


- mockNuxtImport로 의존성을 모킹하는 방법을 이해합니다.





## Vitest 유닛 테스트





```typescript


// composables/__tests__/useCounter.spec.ts


import { describe, it, expect } from 'vitest'





describe('useCounter', () => {


  it('초기값이 0이어야 함', () => {


    const counter = useState('counter', () => 0)


    expect(counter.value).toBe(0)


  })





  it('증가 후 값이 1이어야 함', () => {


    const counter = useState('counter', () => 0)


    counter.value++


    expect(counter.value).toBe(1)


  })


})


```





Vitest는 Vite 기반 테스트 러너로, `describe`(테스트 스위트), `it`(개별 테스트), `expect`(assertion) API를 제공합니다. `expect`는 chai 라이브러리의 assertion 스타일을 따르며, `toBe`, `toEqual`, `toContain`, `toBeTruthy`, `toThrow` 등 다양한 매처를 지원합니다.





### @nuxt/test-utils로 컴포넌트 테스트





```typescript


// components/__tests__/PostCard.spec.ts


import { describe, it, expect } from 'vitest'


import { mountSuspended } from '@nuxt/test-utils/runtime'





describe('PostCard', () => {


  it('제목과 내용이 렌더링되어야 함', async () => {


    const wrapper = await mountSuspended(PostCard, {


      props: {


        title: 'Nuxt 시작하기',


        excerpt: 'Vue 풀스택 프레임워크 기초',


        slug: 'nuxt-intro',


        date: '2024-01-15'


      }


    })


    expect(wrapper.text()).toContain('Nuxt 시작하기')


    expect(wrapper.text()).toContain('Vue 풀스택 프레임워크 기초')


    expect(wrapper.find('a').attributes('href')).toBe('/blog/nuxt-intro')


  })


})


```





`mountSuspended()`는 `@nuxt/test-utils/runtime`에서 제공하는 함수로, Nuxt 런타임 컨텍스트(useFetch, useState, useRoute 등)가 활성화된 상태에서 컴포넌트를 마운트합니다. 내부적으로 Vue Test Utils의 `mount()`를 호출하고, Nuxt 플러그인과 auto-imports가 적용된 환경을 제공합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: mountSuspended와 Vue Test Utils의 mount의 차이는 무엇인가요?</strong></summary>





Vue Test Utils의 `mount()`는 순수 Vue 컴포넌트를 마운트합니다. `useFetch()`, `useState()`, `useRoute()` 같은 Nuxt composable은 동작하지 않습니다. `mountSuspended()`는 Nuxt의 런타임 컨텍스트를 설정한 후 컴포넌트를 마운트하므로, Nuxt composable이 정상 동작합니다. Nuxt 플러그인, auto-imports, 레이아웃 시스템도 적용됩니다. `mountSuspended()`는 내부적으로 `createNuxtApp()`을 호출하여 Nuxt 환경을 재현합니다.


</details>





<details>


<summary><strong>Q: Playwright로 E2E 테스트를 작성할 때 주의할 점은 무엇인가요?</strong></summary>





Playwright E2E 테스트는: (1) **실제 서버가 실행 중이어야 합니다** — `nuxi build` 후 `node .output/server/index.mjs`로 프로덕션 서버를 시작하거나, 테스트 코드에서 `startServer()`로 서버를 직접 실행합니다. (2) **셀렉터는 data-testid 속성을 사용**하는 것이 좋습니다 — `page.locator('[data-testid="submit-btn"]')`는 CSS 클래스 변경에 영향을 받지 않습니다. (3) **비동기 작업은 waitFor로 대기**합니다 — `page.waitForResponse(resp => resp.url().includes('/api/posts'))`로 API 응답을 기다립니다. (4) **테스트 간 독립성**을 유지하기 위해 `beforeEach`에서 페이지를 초기화합니다.


</details>





<details>


<summary><strong>Q: mockNuxtImport로 useFetch를 모킹하는 방법은 무엇인가요?</strong></summary>





`mockNuxtImport('useFetch', () => { return () => ({ data: ref(mockData), pending: ref(false), error: ref(null), refresh: () => {} }) })`로 `useFetch`를 모킹합니다. `mockNuxtImport`는 Nuxt auto-import의 import 경로를 가로채어 테스트 더블을 주입합니다. 모든 테스트에서 동일한 모킹이 필요하면 `vitest.config.ts`의 `setupFiles`에서 전역으로 설정할 수 있습니다. 모킹 후에는 `mockNuxtImport`가 반환한 헬퍼로 복원할 수 있습니다.


</details>





<details>


<summary><strong>Q: Vitest 설정에서 Nuxt 환경을 어떻게 구성하나요?</strong></summary>





`vitest.config.ts`에서 `@nuxt/test-utils/config`를 import하여 Nuxt 환경을 설정합니다: `import { defineVitestConfig } from '@nuxt/test-utils/config'`. `export default defineVitestConfig({ test: { environment: 'nuxt', globals: true } })`. `environment: 'nuxt'`는 Nuxt의 런타임 환경을 재현하고, `globals: true`는 `describe`/`it`/`expect`를 import 없이 사용할 수 있게 합니다. Nuxt 모듈의 설정이 필요한 경우 `nuxt.config.ts`의 설정이 자동으로 적용됩니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **Vitest** | 유닛 테스트 러너 | Vite 기반 → describe/it/expect API |


| **mountSuspended** | Nuxt 컴포넌트 마운트 | createNuxtApp() → Nuxt composable 활성화 |


| **Playwright** | E2E 브라우저 테스트 | chromium.launch() → page.goto() → DOM 검증 |


| **mockNuxtImport** | 의존성 모킹 | auto-import 경로 가로채기 → 테스트 더블 주입 |





## 다음 수업





다음 글에서는 배포와 CI/CD — Vercel, Netlify, Docker, GitHub Actions를 배웁니다.


