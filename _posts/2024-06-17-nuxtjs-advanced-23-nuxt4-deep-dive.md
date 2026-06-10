---


layout: post


title: "Nuxt 4 심층 분석 — Vite 6 통합, Nitro 3 엔진, 새로운 API와 마이그레이션"


description: "Nuxt 4의 주요 변경 사항과 업그레이드된 내부 엔진을 시스템 레벨에서 심층 학습합니다. Vite 6의 Module Runner API가 vite/runtime 패키지에서 import되는 새로운 청크 로딩 시스템으로 빌드 성능을 20% 향상시키는 과정, Nitro 3의 Edge SSR 최적화가 WinterCG 호환 런타임에서 H3Event를 효율적으로 처리하는 방식, Nuxt 4의 새로운 app/ 디렉토리 구조가 기존 pages/server/layouts/components를 통합하는 방식과 app/router.options.ts로 Vue Router 옵션을 직접 제어할 수 있는 기능, nuxi upgrade 명령어와 마이그레이션 가이드를 사용하여 Nuxt 3에서 Nuxt 4로 업그레이드하는 과정을 다룹니다."


date: 2024-06-17 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, nuxt4, vite6, nitro3, migration, upgrade, new-features]


level: advanced


---





Nuxt 4는 Vite 6과 Nitro 3을 기반으로 성능과 개발 경험을 크게 향상시켰습니다.





> **핵심 정리** · Nuxt 4는 Vite 6(Module Runner API → 빌드 속도 20% 향상)과 Nitro 3(Edge SSR 최적화, WinterCG 호환)을 사용합니다. `app/` 디렉토리가 pages/server/layouts를 통합하고, `app/router.options.ts`로 Vue Router 옵션을 직접 제어할 수 있습니다.





---





## 수업 목표





- Vite 6의 Module Runner API를 이해합니다.


- Nitro 3의 Edge SSR 최적화를 이해합니다.


- Nuxt 4의 새로운 디렉토리 구조를 이해합니다.


- Nuxt 3에서 Nuxt 4로 마이그레이션하는 방법을 이해합니다.





## Nuxt 4 디렉토리 구조





```typescript


// nuxt.config.ts


export default defineNuxtConfig({


  compatibilityDate: '2024-07-01',


  future: {


    compatibilityVersion: 4


  }


})


```





Nuxt 4는 `future.compatibilityVersion: 4`로 옵트인할 수 있습니다. 새로운 `app/` 디렉토리 구조: `app/pages/`(기존 pages/), `app/layouts/`(기존 layouts/), `app/components/`(기존 components/), `app/composables/`(기존 composables/), `app/router.options.ts`(Vue Router 옵션 직접 설정). 기존 구조도 계속 지원되므로, 마이그레이션은 점진적으로 진행할 수 있습니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Nuxt 3에서 Nuxt 4로 마이그레이션하는 방법은 무엇인가요?</strong></summary>





(1) `npx nuxi upgrade`로 Nuxt 4로 업그레이드합니다. (2) `nuxt.config.ts`에 `compatibilityDate: '2024-07-01'`을 추가합니다. (3) `future.compatibilityVersion: 4`를 설정하여 Nuxt 4 기능을 활성화합니다. (4) 선택적으로 디렉토리 구조를 `app/`로 마이그레이션합니다. (5) `npx nuxi build`로 빌드가 정상 동작하는지 확인합니다. (6) `npx nuxi dev`로 개발 서버를 테스트합니다. 대부분의 코드는 수정 없이 그대로 동작하지만, 일부 실험적 API의 변경 사항이 있을 수 있으므로 릴리스 노트를 확인합니다.


</details>





<details>


<summary><strong>Q: Vite 6의 Module Runner API는 무엇인가요?</strong></summary>





Vite 6의 Module Runner API는 Vite Dev Server와 클라이언트 간의 청크 로딩 방식을 개선합니다. 기존 Vite 5는 각 모듈을 개별 ESM 파일로 제공했지만, Vite 6은 `vite/runtime` 패키지에서 import되는 새로운 런타임 모듈 시스템을 도입하여 청크 간 의존성 그래프를 더 효율적으로 관리합니다. 실제 빌드 성능은 약 20% 향상되고, HMR(Hot Module Replacement) 속도는 기존 ~200ms에서 ~50ms로 4배 빨라졌습니다. SSR에서도 동일한 Module Runner를 사용하여 서버와 클라이언트의 청크 구조를 일치시킵니다.


</details>





<details>


<summary><strong>Q: Nitro 3의 Edge SSR 최적화는 무엇이 다른가요?</strong></summary>





Nitro 3는 Edge 런타임(Cloudflare Workers, Vercel Edge, Deno)에서의 SSR 성능을 크게 개선했습니다: (1) **WinterCG 호환성**: `Web Standard API`(Request/Response/ReadableStream)만 사용하도록 코어를 재작성하여 모든 Edge 런타임에서 동일하게 동작합니다. (2) **번들 크기 감소**: 불필요한 Node.js API 폴리필을 제거하여 Edge 함수의 콜드 스타트 시간을 50% 단축했습니다. (3) **네이티브 WebSocket**: `defineWebSocketHandler()`가 Edge 런타임에서도 WebSocket을 네이티브로 지원합니다. (4) **정적 사이트 생성 최적화**: `nuxi generate`가 병렬 prerender를 지원하여 빌드 시간을 단축합니다.


</details>





<details>


<summary><strong>Q: Nuxt 4의 compatibilityDate 기능은 무엇인가요?</strong></summary>





`compatibilityDate`는 Nuxt 4의 새로운 설정으로, 프로젝트가 특정 날짜의 Nuxt 동작과 호환되도록 고정합니다. Nuxt 4는 내부 동작이 변경되어도 `compatibilityDate`가 설정되면 이전 동작을 유지합니다. 예를 들어 `compatibilityDate: '2024-07-01'`은 2024년 7월 1일 시점의 Nuxt 4 동작을 보장합니다. 새 프로젝트는 현재 날짜로 설정하고, 기존 프로젝트는 마이그레이션 날짜로 설정합니다. 이 기능 덕분에 Nuxt 업데이트 시 예상치 못한 동작 변경을 방지할 수 있습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **Vite 6** | 빌드 도구 업그레이드 | Module Runner API → 빌드 20% 향상, HMR 4배 향상 |


| **Nitro 3** | 서버 엔진 업그레이드 | Edge SSR 최적화, WinterCG 호환, 번들 크기 50% 감소 |


| **app/ 디렉토리** | 새 구조 | pages/layouts/components/composables 통합 |


| **compatibilityDate** | 호환성 고정 | 특정 날짜 동작 유지 → 업데이트 안전성 |





## 다음 수업





다음 글에서는 아키텍처와 베스트 프랙티스 — 프로젝트 구조 설계와 확장 전략을 배웁니다.


