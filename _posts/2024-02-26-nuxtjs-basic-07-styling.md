---


layout: post


title: "Nuxt.js 스타일링 — CSS Modules, Tailwind CSS, Nuxt UI 컴포넌트의 스타일 격리와 번들링 과정"


description: "Nuxt.js에서 CSS를 적용하는 모든 방법과 내부 동작을 시스템 레벨에서 심층 학습합니다. 전역 CSS가 Vite의 CSS 번들링 파이프라인을 통해 PostCSS 변환과 Autoprefixer 적용 후 단일 CSS 파일로 병합되는 과정, Vue scoped styles가 PostCSS 플러그인으로 각 선택자에 data-v-{hash} 속성 셀렉터를 추가하여 스타일을 컴포넌트로 격리하는 방식, CSS Modules가 Vite의 CSS Modules 플러그인으로 클래스명을 [filename]_[classname]_[hash]로 변환하는 원리, @nuxtjs/tailwindcss 모듈이 Tailwind CSS JIT 엔진을 Vite에 통합하여 사용된 클래스만 추출하는 과정, Nuxt UI 컴포넌트가 Tailwind CSS와 Headless UI의 조합으로 접근성과 스타일링을 제공하는 방식을 다룹니다."


date: 2024-02-26 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, styling, tailwind, nuxt-ui, css, scoped, css-modules]


level: basic


---





Nuxt.js는 전역 CSS, Scoped Styles, CSS Modules, Tailwind CSS, Nuxt UI까지 다양한 스타일링 방법을 지원합니다.





> **핵심 정리** · Nuxt의 CSS 파이프라인은 Vite의 PostCSS 플러그인과 CSS Modules 플러그인으로 구성됩니다. `<style scoped>`는 Vue SFC 컴파일러가 PostCSS 변환에서 각 선택자에 `[data-v-{hash}]` 속성 셀렉터를 추가합니다. `<style module>`은 Vite의 CSS Modules가 클래스명을 해시 처리합니다. `@nuxtjs/tailwindcss`는 Tailwind JIT 엔진을 Vite 플러그인으로 실행하여 템플릿의 클래스명만 추출합니다. Nuxt UI는 Tailwind 유틸리티 클래스로 스타일링된 Headless UI 기반 Vue 컴포넌트입니다.





---





## 수업 목표





- 전역 CSS의 Vite 번들링 과정을 이해합니다.


- scoped styles의 속성 셀렉터 격리 방식을 이해합니다.


- CSS Modules의 클래스명 해싱 방식을 이해합니다.


- Tailwind CSS JIT 엔진의 동작을 이해합니다.


- Nuxt UI 컴포넌트의 구조를 이해합니다.





## 전역 CSS





```typescript


// nuxt.config.ts


export default defineNuxtConfig({


  css: ['~/assets/css/main.css']


})


```





```css


/* assets/css/main.css */


body {


  font-family: 'Noto Sans KR', sans-serif;


  background: #0d1117;


  color: #e6edf3;


}


```





`css: ['~/assets/css/main.css']`로 등록된 파일은 Vite의 CSS 번들링 파이프라인을 통과합니다. Vite는 PostCSS config(`postcss.config.js`)를 읽어 `autoprefixer`, `cssnano` 등의 플러그인을 적용합니다. 최종적으로 모든 CSS는 `@import`를 따라 재귀적으로 병합되고, 단일 CSS 파일(또는 청크 분할 시 여러 CSS 파일)로 번들링되어 `<link rel="stylesheet">`로 HTML `<head>`에 포함됩니다. Nuxt는 이 CSS가 로드되는 동안 FOUC(Flash of Unstyled Content)를 방지하기 위해 Critical CSS를 인라인으로 `<head>`에 포함시킵니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: scoped와 CSS Modules 중 어떤 것을 선택해야 하나요?</strong></summary>





scoped는 **컴포넌트 인스턴스 레벨**에서 스타일을 격리합니다. 같은 컴포넌트가 여러 번 사용되어도 각 인스턴스의 고유 해시로 격리됩니다. CSS Modules는 **클래스명 레벨**에서 격리하며, 클래스명이 해시 처리되어 전역 충돌을 방지합니다. scoped는 `:deep()`으로 자식 컴포넌트 스타일링이 가능하지만, CSS Modules는 자식 컴포넌트에 직접 스타일을 적용할 수 없습니다. 일반적인 Vue 컴포넌트 개발에는 scoped가 더 직관적이고, 라이브러리/공유 컴포넌트 개발에는 CSS Modules가 더 안전합니다.


</details>





<details>


<summary><strong>Q: Tailwind CSS 클래스와 scoped 스타일을 함께 사용할 수 있나요?</strong></summary>





가능합니다. Tailwind 유틸리티 클래스는 전역 CSS로 적용되고, scoped 스타일은 컴포넌트 전용으로 추가됩니다. Tailwind로 레이아웃과 기본 스타일을 정의하고, scoped로 컴포넌트 특화 스타일을 덮어씁니다. scoped 스타일이 Tailwind 클래스보다 CSS 명시도에서 우선하므로, Tailwind의 `!important` 접두사(`!m-0`)로 scoped 스타일을 덮어쓸 수 있습니다.


</details>





<details>


<summary><strong>Q: Nuxt UI 컴포넌트의 스타일을 커스터마이징하려면 어떻게 하나요?</strong></summary>





Nuxt UI 컴포넌트는 `ui.config` prop으로 스타일을 오버라이드할 수 있습니다. 예: {% raw %}`<UButton ui={{ rounded: 'rounded-full', padding: 'p-4' }} />`{% endraw %}. 전역 설정은 `nuxt.config.ts`의 `ui: { button: { rounded: 'rounded-full' } }`로 지정합니다. 컴포넌트의 모든 CSS 클래스는 `@nuxt/ui`의 preset에 정의되어 있으며, `ui.config`로 계층적으로 오버라이드할 수 있습니다.


</details>





<details>


<summary><strong>Q: Global CSS와 component CSS의 로딩 순서는 어떻게 되나요?</strong></summary>





HTML `<head>`에 로딩 순서: (1) Critical CSS 인라인 스타일 `<style>...</style>`. (2) 전역 CSS 파일 `<link rel="stylesheet" href="/assets/css/main.css">`. (3) Vue 컴포넌트의 scoped 스타일은 `useStyle()`을 통해 동적으로 주입됩니다. Vite는 각 컴포넌트의 CSS를 JavaScript 번들에 포함시켜 `injectStyles()` 함수로 `<head>`에 추가합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **전역 CSS** | 공통 스타일시트 | Vite PostCSS 파이프라인 → 단일 CSS 번들 |


| **scoped** | 컴포넌트 단위 격리 | `[data-v-{hash}]` 속성 셀렉터 추가 |


| **CSS Modules** | 클래스명 해시 | `[파일명]_[클래스명]_[해시]` 변환 |


| **Tailwind CSS** | 유틸리티 클래스 | JIT 엔진 → 사용된 클래스만 추출 → CSS 생성 |


| **Nuxt UI** | UI 컴포넌트 라이브러리 | Tailwind 스타일링 + Headless UI 로직 |





## 다음 수업





다음 글에서는 Nuxt.js의 렌더링 모드 — SSR, SSG, SPA, Hybrid 전략을 배웁니다.


