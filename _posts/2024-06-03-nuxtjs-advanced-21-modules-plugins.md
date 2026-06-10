---


layout: post


title: "Nuxt.js 모듈과 플러그인 — @nuxtjs/ 모듈 생태계와 defineNuxtModule로 커스텀 모듈 개발하기"


description: "Nuxt.js의 모듈 시스템과 플러그인 시스템의 내부 동작을 시스템 레벨에서 심층 학습합니다. defineNuxtModule()이 NuxtKit의 installModule()을 통해 Nuxt 인스턴스의 hooks/options/components/composables를 확장하는 과정, @nuxtjs/ 모듈 생태계가 @nuxtjs/i18n/tailwindcss/image/color-mode 등으로 구성되어 nuxt.config.ts의 modules 배열에서 선언적으로 활성화되는 방식, addPlugin()이 createUnplugin()을 통해 Vite/Rollup 플러그인으로 변환되어 빌드 파이프라인에 통합되는 과정, addImportsSources()가 unplugin-auto-import의 presets을 확장하여 composable을 auto-imports에 등록하는 방식, addComponent()가 unplugin-vue-components의 컴포넌트 맵에 새 컴포넌트를 등록하는 과정을 다룹니다."


date: 2024-06-03 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, modules, plugins, nuxt-module, defineNuxtModule, NuxtKit]


level: advanced


---





Nuxt.js의 모듈 시스템은 `defineNuxtModule()`로 커스텀 모듈을 개발하고 `@nuxtjs/` 생태계를 활용합니다.





> **핵심 정리** · `defineNuxtModule()`은 NuxtKit의 `installModule()`로 Nuxt 인스턴스를 확장합니다. `addPlugin()`은 Vite/Rollup 플러그인으로 변환됩니다. `addImportsSources()`는 auto-imports에 composable을 등록하고, `addComponent()`는 전역 컴포넌트를 등록합니다.





---





## 수업 목표





- defineNuxtModule의 동작 방식을 이해합니다.


- 모듈이 Nuxt 인스턴스를 확장하는 과정을 이해합니다.


- addPlugin/addImportsSources/addComponent의 내부 동작을 이해합니다.





## 커스텀 모듈 개발





```typescript


// modules/color-mode/index.ts


import { defineNuxtModule, addPlugin, addImportsSources, addComponent, createResolver } from '@nuxt/kit'





export default defineNuxtModule({


  meta: {


    name: 'color-mode',


    version: '1.0.0',


    configKey: 'colorMode'


  },


  defaults: {


    preference: 'system',


    fallback: 'dark',


    classPrefix: 'theme-'


  },


  setup(options, nuxt) {


    const resolver = createResolver(import.meta.url)





    // 플러그인 추가


    addPlugin(resolver.resolve('./plugin'))





    // composable auto-import 등록


    addImportsSources({


      from: resolver.resolve('./composables/useColorMode'),


      imports: ['useColorMode']


    })





    // 컴포넌트 등록


    addComponent({


      name: 'ColorScheme',


      filePath: resolver.resolve('./components/ColorScheme.vue')


    })





    // Hooks로 빌드/렌더링 시점에 개입


    nuxt.hook('build:done', () => {


      console.log('Color mode module build complete')


    })


  }


})


```





`defineNuxtModule()`은 NuxtKit의 핵심 함수로, `meta`(모듈 정보), `defaults`(기본 설정), `setup`(초기화 로직)을 인자로 받습니다. `setup(options, nuxt)`에서 `nuxt`는 `Nuxt` 인스턴스로, hooks, options, resolver 등 모듈 개발에 필요한 모든 API에 접근할 수 있습니다. `createResolver()`는 `import.meta.url`을 기준으로 모듈 내 파일 경로를 생성합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Nuxt 모듈과 Vue 플러그인의 차이는 무엇인가요?</strong></summary>





Vue 플러그인(`app.use()`)은 Vue 애플리케이션 인스턴스에만 접근할 수 있습니다. 컴포넌트 등록, 디렉티브 정의, `provide/inject` 설정이 가능합니다. Nuxt 모듈은 `nuxt` 인스턴스에 접근하여 **빌드 타임**에 개입할 수 있습니다: Vite 설정 변경, auto-imports 등록, 라우트 확장, Nitro 서버 설정, hooks로 빌드/렌더링/배포 시점에 로직 실행. Nuxt 모듈은 `addPlugin()`으로 Vue 플러그인을 등록할 수도 있습니다. 즉, Nuxt 모듈이 Vue 플러그인의 상위 개념입니다.


</details>





<details>


<summary><strong>Q: addPlugin으로 추가된 플러그인의 실행 순서는 어떻게 되나요?</strong></summary>





`addPlugin()`으로 등록된 플러그인은 `plugins/` 디렉토리의 플러그인과 동일한 방식으로 실행됩니다. 실행 순서: (1) 파일명 알파벳 순서. (2) `{ order: 0 }` 옵션으로 순서 강제 가능. (3) Nuxt 모듈의 `addPlugin()`은 모듈이 등록된 순서에 따라 실행됩니다. 플러그인의 `mode` 옵션으로 `'client'`(브라우저 전용), `'server'`(서버 전용), `'all'`(기본, 양쪽 모두)를 지정할 수 있습니다.


</details>





<details>


<summary><strong>Q: @nuxtjs/ 모듈 생태계에서 가장 유용한 모듈은 무엇인가요?</strong></summary>





자주 사용되는 모듈: (1) `@nuxtjs/i18n` — 다국어 지원. (2) `@nuxtjs/tailwindcss` — Tailwind CSS 통합. (3) `@nuxt/image` — 이미지 최적화. (4) `@nuxtjs/color-mode` — 다크 모드 지원. (5) `@nuxtjs/sitemap` — 사이트맵 생성. (6) `nuxt-security` — CSP/Helmet 보안 설정. (7) `@nuxt/content` — 마크다운 기반 콘텐츠 관리. (8) `nuxt-icon` — 아이콘 컴포넌트. (9) `@vueuse/nuxt` — VueUse 유틸리티 composables. (10) `@pinia/nuxt` — Pinia 상태 관리.


</details>





<details>


<summary><strong>Q: 커스텀 모듈을 npm에 배포하려면 어떻게 하나요?</strong></summary>





모듈 디렉토리에 `package.json`을 생성하고 `name`을 `nuxt-*` 또는 `@scope/nuxt-*` 형식으로 지정합니다. `main` 필드를 모듈의 진입점(예: `dist/module.mjs`)으로 설정합니다. `exports` 필드에 `.`(모듈 진입점)과 `./*`(composables/컴포넌트 경로)를 정의합니다. `@nuxt/kit`을 `dependencies`에, `nuxt`를 `peerDependencies`에 추가합니다. `build` 스크립트로 `unbuild`를 사용하여 CommonJS와 ESM 모두를 지원하는 번들을 생성합니다. npm 레지스트리에 `npm publish`로 배포합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **defineNuxtModule** | 모듈 정의 | NuxtKit installModule() → setup(nuxt) 콜백 |


| **addPlugin** | Vue 플러그인 등록 | createUnplugin() → Vite/Rollup 플러그인 변환 |


| **addImportsSources** | composable auto-import | unplugin-auto-import presets 확장 |


| **addComponent** | 전역 컴포넌트 등록 | unplugin-vue-components 맵에 추가 |


| **nuxt.hook** | 빌드/렌더링 훅 | Nuxt 생명주기 이벤트 리스너 |





## 다음 수업





다음 글에서는 실시간 기능 — WebSocket 채팅, 실시간 알림, 협업 기능 구현을 배웁니다.


