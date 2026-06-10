---


layout: post


title: "Nuxt.js 국제화(i18n) — @nuxtjs/i18n 모듈이 다국어 라우팅, 번역 파일 로딩, hreflang 메타태그를 생성하는 과정"


description: "Nuxt.js의 국제화 모듈인 @nuxtjs/i18n이 다국어 웹사이트를 구축하는 과정을 시스템 레벨에서 심층 학습합니다. i18n 모듈이 nuxt.config.ts의 lang/locales 설정을 읽어 각 로케일별로 별도의 Vue Router 라우트 트리를 생성하는 과정, /ko/about처럼 로케일 접두사가 URL에 추가되는 원리, 번역 파일(locales/ko.json)이 빌드 타임에 정적 JSON으로 번들링되어 런타임에 lazy-loading되는 방식, useLocalePath()와 switchLocalePath()가 현재 로케일과 대상 로케일의 라우트를 매핑하는 과정, hreflang alternate 링크가 각 로케일의 정규 URL을 가리키도록 생성되어 검색 엔진이 다국어 페이지를 올바르게 인덱싱하는 원리, SEO 최적화를 위해 각 로케일별 sitemap과 canonical URL이 생성되는 과정을 다룹니다."


date: 2024-03-25 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, i18n, internationalization, localization, hreflang, seo, multilanguage]


level: intermediate


---





Nuxt.js의 @nuxtjs/i18n 모듈은 다국어 웹사이트 구축에 필요한 라우팅, 번역, SEO를 모두 처리합니다.





> **핵심 정리** · `@nuxtjs/i18n` 모듈은 `nuxt.config.ts`의 `locales` 설정을 기반으로 각 로케일별 Vue Router 라우트 트리를 생성합니다. `useLocalePath()`는 현재 로케일의 라우트를 반환하고, `switchLocalePath()`는 다른 로케일의 동일 페이지 URL을 반환합니다. 번역 파일은 `locales/ko.json`으로 저장되며, 빌드 타임에 정적 JSON으로 번들링됩니다. `hreflang` 메타태그가 각 로케일 버전의 정규 URL을 가리키도록 생성됩니다.





---





## 수업 목표





- @nuxtjs/i18n 모듈의 라우트 생성 방식을 이해합니다.


- 번역 파일의 로딩과 캐싱 방식을 이해합니다.


- useLocalePath와 switchLocalePath의 동작을 이해합니다.


- hreflang 메타태그의 SEO 최적화를 이해합니다.





## i18n 모듈 설정





```typescript


// nuxt.config.ts


export default defineNuxtConfig({


  modules: ['@nuxtjs/i18n'],


  i18n: {


    locales: [


      { code: 'ko', iso: 'ko-KR', name: '한국어', file: 'ko.json' },


      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },


      { code: 'ja', iso: 'ja-JP', name: '日本語', file: 'ja.json' }


    ],


    defaultLocale: 'ko',


    lazy: true,


    langDir: 'locales/',


    strategy: 'prefix_except_default',


    detectBrowserLanguage: {


      useCookie: true,


      cookieKey: 'i18n_redirected',


      redirectOn: 'root'


    },


    seo: true


  }


})


```





`@nuxtjs/i18n`은 `nuxt.config.ts`의 `i18n` 설정을 읽어 각 로케일별로 개별 Vue Router 라우트 트리를 생성합니다. `strategy: 'prefix_except_default'`는 기본 로케일('ko')에는 URL 접두사를 붙이지 않고(`/about`), 다른 로케일에는 접두사를 붙입니다(`/en/about`, `/ja/about`). `lazy: true`는 각 로케일의 번역 파일을 별도의 청크로 분할하여 필요할 때만 로드합니다. `detectBrowserLanguage`는 브라우저의 `Accept-Language` 헤더를 읽어 사용자의 언어를 자동 감지하고 `i18n_redirected` 쿠키에 저장합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: i18n 라우팅 전략(prefix, prefix_except_default, prefix_and_default)의 차이는 무엇인가요?</strong></summary>





세 가지 전략이 있습니다: (1) `prefix` — 모든 로케일에 URL 접두사가 붙습니다(`/ko/about`, `/en/about`). (2) `prefix_except_default` — 기본 로케일에는 접두사가 없고(`/about`), 다른 로케일에만 접두사가 붙습니다(`/en/about`). SEO와 사용자 경험에 가장 권장되는 전략입니다. (3) `prefix_and_default` — 기본 로케일에도 접두사가 붙지만(`/ko/about`), 접두사 없는 URL(`/about`)도 기본 로케일로 처리됩니다.


</details>





<details>


<summary><strong>Q: 번역 파일의 구조와 로딩 방식은 어떻게 되나요?</strong></summary>





번역 파일은 `locales/` 디렉토리에 JSON 파일로 저장됩니다. 예: `locales/ko.json`, `locales/en.json`. 파일 구조는 중첩된 키-값 쌍입니다: `{ "nav": { "home": "홈", "blog": "블로그" }, "posts": { "readMore": "더 읽기" } }`. `lazy: true`(권장)로 설정하면 각 로케일 파일이 별도의 청크로 분할되어 최초 로딩 시에는 기본 로케일만 로드되고, 사용자가 언어를 전환할 때만 해당 청크가 로드됩니다. `lazy: false`면 모든 로케일이 주 번들에 포함됩니다.


</details>





<details>


<summary><strong>Q: hreflang 메타태그는 자동으로 생성되나요?</strong></summary>





`seo: true`(기본값)로 설정하면 `@nuxtjs/i18n`이 각 페이지에 자동으로 `hreflang` alternate 링크를 생성합니다. 예를 들어 `/blog/nuxt-intro` 페이지의 `<head>`에는 `<link rel="alternate" hreflang="ko" href="https://site.com/blog/nuxt-intro">`, `<link rel="alternate" hreflang="en" href="https://site.com/en/blog/nuxt-intro">`, `<link rel="alternate" hreflang="ja" href="https://site.com/ja/blog/nuxt-intro">`, `<link rel="alternate" hreflang="x-default" href="https://site.com/blog/nuxt-intro">`가 포함됩니다. `x-default`는 기본 로케일을 가리킵니다.


</details>





<details>


<summary><strong>Q: useLocalePath와 switchLocalePath의 차이는 무엇인가요?</strong></summary>





`useLocalePath()`는 현재 로케일을 기준으로 라우트 경로를 반환합니다. 예를 들어 현재 로케일이 'en'일 때 `useLocalePath('/about')`는 `/en/about`을 반환합니다. `switchLocalePath('ja')`는 현재 페이지의 일본어 버전 URL을 반환합니다. 예를 들어 현재 `/en/blog/nuxt-intro` 페이지에서 `switchLocalePath('ja')`는 `/ja/blog/nuxt-intro`를 반환합니다. 언어 스위처 드롭다운에서 `switchLocalePath()`를 사용하여 현재 페이지의 다른 언어 버전으로 이동할 수 있습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **로케일 라우팅** | 다국어 URL 생성 | 각 로케일별 Vue Router 트리 생성 |


| **번역 파일** | 언어별 문자열 저장 | locales/*.json → 빌드 타임 번들링 |


| **useLocalePath** | 현재 로케일 경로 | 기본 로케일: /about, 다른 로케일: /en/about |


| **switchLocalePath** | 다른 로케일 경로 | 현재 페이지의 대상 로케일 URL 반환 |


| **hreflang** | SEO 메타태그 | 자동 생성 → 각 로케일 정규 URL 연결 |


| **언어 감지** | 브라우저 언어 자동 감지 | Accept-Language 헤더 + 쿠키 저장 |





## 다음 수업





다음 글에서는 이미지 최적화와 폰트 — @nuxt/image와 @nuxtjs/fontaine을 배웁니다.


