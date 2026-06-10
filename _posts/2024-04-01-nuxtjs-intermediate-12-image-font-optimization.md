---


layout: post


title: "Nuxt.js 이미지 최적화와 폰트 — @nuxt/image의 리사이징/WebP 변환과 @nuxtjs/fontaine의 FOUT 방지 과정"


description: "Nuxt.js에서 이미지와 폰트를 최적화하는 과정을 시스템 레벨에서 심층 학습합니다. @nuxt/image 모듈이 NuxtImg 컴포넌트의 src/width/height/quality/fit 옵션을 기반으로 이미지 CDN URL을 생성하고 최적화 파라미터를 쿼리스트링에 추가하는 과정, WebP 변환이 Accept 헤더의 image/webp 지원 여부에 따라 자동으로 이미지 형식을 선택하는 방식, @nuxtjs/fontaine 모듈이 로컬 폰트 파일의 메트릭(유니퍼, 어센더, 디센더)을 추출하여 CSS font-size-adjust로 fallback 폰트의 레이아웃 시프트를 방지하는 원리, Google Fonts의 woff2 파일이 @nuxtjs/google-fonts로 프로젝트에 번들링되어 외부 요청 없이 셀프호스팅되는 과정, 이미지 지연 로딩(loading=lazy)과 preload/preconnect 힌트가 LCP(Largest Contentful Paint)에 미치는 영향을 다룹니다."


date: 2024-04-01 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, image-optimization, fonts, nuxt-image, webp, CLS, performance]


level: intermediate


---





웹 성능 최적화에서 이미지와 폰트는 가장 큰 영향을 미치는 요소입니다. Nuxt.js는 @nuxt/image와 @nuxtjs/fontaine 모듈로 이 문제를 해결합니다.





> **핵심 정리** · `@nuxt/image`는 `NuxtImg` 컴포넌트의 속성을 기반으로 이미지 CDN에 최적화 파라미터를 전달합니다. `@nuxtjs/fontaine`은 폰트 메트릭(유니퍼, 어센더, 디센더)을 추출하여 CSS `font-size-adjust`로 CLS(Cumulative Layout Shift)를 방지합니다. Google Fonts는 `@nuxtjs/google-fonts`로 셀프호스팅하여 외부 요청을 제거합니다.





---





## 수업 목표





- @nuxt/image의 이미지 최적화 파이프라인을 이해합니다.


- NuxtImg 컴포넌트의 속성별 동작을 이해합니다.


- @nuxtjs/fontaine의 FOUT/FOIT 방지 방식을 이해합니다.


- 폰트 최적화가 CLS에 미치는 영향을 이해합니다.





## @nuxt/image 설정





```typescript


// nuxt.config.ts


export default defineNuxtConfig({


  modules: ['@nuxt/image'],


  image: {


    providers: {


      cloudflare: { provider: 'cloudflare', baseURL: 'https://cdn.example.com' }


    },


    presets: {


      thumbnail: { modifiers: { width: 150, height: 150, format: 'webp' } },


      blog_cover: { modifiers: { width: 1200, height: 630, fit: 'cover', format: 'webp' } },


      avatar: { modifiers: { width: 64, height: 64, format: 'webp', quality: 80 } }


    },


    format: ['webp']


  }


})


```





`@nuxt/image` 모듈은 `image.providers`에 정의된 CDN 공급자의 URL 템플릿을 사용하여 최적화된 이미지 URL을 생성합니다. `presets`는 자주 사용하는 이미지 변환을 재사용 가능한 템플릿으로 정의합니다. `format: ['webp']`는 `Accept: image/webp` 헤더를 지원하는 브라우저에 WebP 형식을 우선 제공합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: NuxtImg와 일반 img 태그의 차이는 무엇인가요?</strong></summary>





`<NuxtImg>`는 `<img>` 태그를 확장하여 자동 최적화를 제공합니다: (1) `width`와 `height`를 설정하면 이미지 CDN이 리사이징하여 적절한 크기의 이미지를 제공합니다. (2) `format`을 설정하면 브라우저에 맞는 최신 형식(WebP/AVIF)을 제공합니다. (3) `loading="lazy"`가 기본값으로 설정되어 뷰포트 밖의 이미지는 지연 로딩됩니다. (4) `preset`을 사용하면 미리 정의된 변환 세트를 적용할 수 있습니다. (5) `<picture>` 요소와 `srcset`을 자동 생성하여 반응형 이미지를 지원합니다.


</details>





<details>


<summary><strong>Q: @nuxtjs/fontaine은 CLS를 어떻게 방지하나요?</strong></summary>





웹 폰트가 로드되기 전에 fallback 폰트로 텍스트가 렌더링되는데, 폰트마다 글자 너비가 달라서 레이아웃이 갑자기 바뀌는 현상이 CLS입니다. `@nuxtjs/fontaine`은 각 폰트 파일의 메트릭(유니퍼, 어센더, 디센더)을 추출하여 CSS `font-size-adjust` 속성으로 fallback 폰트의 크기를 조정합니다. 예를 들어 fallback 폰트의 유니퍼가 0.5이고 웹 폰트의 유니퍼가 0.52면 `font-size-adjust: 0.52`를 설정하여 두 폰트의 x-높이를 일치시킵니다. 이렇게 하면 폰트가 교체되어도 텍스트의 높이와 너비가 변하지 않아 레이아웃 시프트가 발생하지 않습니다.


</details>





<details>


<summary><strong>Q: 이미지 CDN을 사용하지 않고 자체 최적화하려면 어떻게 하나요?</strong></summary>





`@nuxt/image`는 `ipx`(Image Proxy)라는 내장 최적화 도구를 제공합니다. `provider: 'ipx'`로 설정하면 Nuxt 서버 자체에서 sharp 라이브러리를 사용하여 이미지를 리사이징하고 변환합니다. `/__ipx/w_400,f_webp/images/photo.jpg` 같은 URL로 접근하면 서버가 이미지를 실시간으로 처리합니다. 프로덕션에서는 CDN 공급자를 사용하는 것이 성능상 유리하지만, 개발 단계나 간단한 프로젝트에서는 ipx로 충분합니다.


</details>





<details>


<summary><strong>Q: Google Fonts를 셀프호스팅하는 이유는 무엇인가요?</strong></summary>





Google Fonts를 셀프호스팅하면: (1) **외부 DNS 조회 제거** — Google Fonts 도메인에 대한 DNS 조회가 필요 없어집니다. (2) **캐싱 제어** — 서비스 워커나 CDN에서 폰트 파일을 직접 캐싱할 수 있습니다. (3) **GDPR 준수** — Google 서버로 사용자 IP가 전송되지 않습니다. (4) **오프라인 지원** — 폰트 파일이 프로젝트에 포함되므로 오프라인에서도 폰트가 표시됩니다. (5) **성능** — HTTP/2 푸시나 preload로 폰트를 더 빠르게 로드할 수 있습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **NuxtImg** | 최적화된 이미지 컴포넌트 | CDN URL 생성 + 리사이징 + 형식 변환 + 지연 로딩 |


| **presets** | 이미지 변환 템플릿 | 재사용 가능한 modifiers 세트 정의 |


| **@nuxtjs/fontaine** | 폰트 메트릭 조정 | 폰트 유니퍼 추출 → font-size-adjust로 CLS 방지 |


| **Google Fonts** | 폰트 셀프호스팅 | woff2 파일 번들링 → 외부 요청 제거 |


| **LCP 최적화** | Largest Contentful Paint | preload/preconnect 힌트로 중요 리소스 우선 로드 |





## 다음 수업





다음 글에서는 캐싱과 성능 최적화 — defineCachedEventHandler와 SWR 전략을 배웁니다.


