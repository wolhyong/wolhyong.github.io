---


layout: post


title: "Nuxt.js 캐싱과 성능 최적화 — defineCachedEventHandler와 SWR 전략이 Nitro 서버에서 동작하는 과정"


description: "Nuxt.js의 서버 사이드 캐싱 시스템이 Nitro 엔진에서 동작하는 과정을 시스템 레벨에서 심층 학습합니다. defineCachedEventHandler()가 unstorage 어댑터로 캐시 저장소(메모리/Redis/파일시스템)를 추상화하고 응답을 직렬화하여 TTL만큼 보관하는 과정, SWR(Stale-While-Revalidate) 전략에서 캐시가 만료된 후 첫 요청에는 만료된 캐시를 반환하고 백그라운드에서 새 응답을 생성하는 방식, defineCachedEventHandler와 defineEventHandler의 응답 처리 파이프라인 차이, Nitro의 routeRules swr 옵션이 페이지 레벨 캐싱에 Cache-Control 헤더를 설정하는 과정, unstorage의 다양한 드라이버(redis/fs/cloudflare-kv)가 추상화 레이어를 통해 일관된 API로 동작하는 원리를 다룹니다."


date: 2024-04-08 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, caching, performance, swr, nitro, unstorage, redis]


level: intermediate


---





Nuxt.js의 캐싱 시스템은 Nitro 서버에서 defineCachedEventHandler와 routeRules로 구성됩니다.





> **핵심 정리** · `defineCachedEventHandler()`는 unstorage를 사용하여 응답을 직렬화하고 TTL만큼 캐시합니다. `swr: 3600`은 Cache-Control 헤더에 `s-maxage=3600, stale-while-revalidate`를 설정합니다. SWR 전략에서 캐시가 만료된 후 첫 요청에는 만료된 캐시를 반환하면서 백그라운드에서 새 응답을 생성합니다.





---





## 수업 목표





- defineCachedEventHandler의 캐싱 파이프라인을 이해합니다.


- SWR 전략과 TTL의 차이를 이해합니다.


- routeRules로 페이지 레벨 캐싱을 설정하는 방법을 이해합니다.


- unstorage의 드라이버 추상화 방식을 이해합니다.





## defineCachedEventHandler





```typescript


// server/api/posts.ts


export default defineCachedEventHandler(async (event) => {


  const posts = await db.posts.findMany()


  return posts


}, {


  base: 'posts',


  name: 'all',


  swr: true,


  maxAge: 300,  // 5분 TTL


  staleMaxAge: 600  // 10분 후에도 stale 데이터 허용


})


```





`defineCachedEventHandler()`는 unstorage의 `getItem()`과 `setItem()`을 사용하여 응답을 캐시합니다. 첫 번째 요청이 들어오면 핸들러 함수가 실행되고, 반환값은 JSON.stringify()로 직렬화되어 캐시 저장소에 저장됩니다. 이후 동일한 요청이 TTL(maxAge) 이내에 들어오면 캐시된 값을 즉시 반환합니다. SWR 모드에서는 TTL이 만료된 후에도 stale 데이터를 반환하면서 백그라운드에서 핸들러를 다시 실행하여 캐시를 갱신합니다.





### 캐시 키 생성 방식





```typescript


defineCachedEventHandler(handler, {


  getKey: (event) => {


    const query = getQuery(event)


    return `posts:${query.page || 1}:${query.limit || 10}`


  },


  maxAge: 300


})


```





기본 캐시 키는 `base:name` 형식(`posts:all`)입니다. `getKey()` 옵션을 제공하면 요청의 파라미터에 따라 동적으로 캐시 키를 생성할 수 있습니다. 예를 들어 페이지네이션이 있는 API에서 페이지별로 다른 캐시를 저장하려면 `getKey`로 URL 쿼리를 키에 포함시킵니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: defineCachedEventHandler와 defineEventHandler의 차이는 무엇인가요?</strong></summary>





`defineEventHandler()`는 모든 요청에 대해 핸들러 함수를 실행합니다. `defineCachedEventHandler()`는 캐시 저장소를 확인하여 동일한 키의 캐시가 있으면 핸들러를 실행하지 않고 캐시된 응답을 반환합니다. 캐시 키는 `base`, `name`, `getKey` 옵션으로 구성됩니다. 캐시 저장소는 기본적으로 메모리(in-memory)를 사용하며, unstorage 어댑터로 Redis, 파일시스템, Cloudflare KV 등으로 변경할 수 있습니다.


</details>





<details>


<summary><strong>Q: SWR 모드에서 stale 데이터는 언제까지 반환되나요?</strong></summary>





SWR(Stale-While-Revalidate) 모드에서 `staleMaxAge`는 stale 데이터를 반환할 수 있는 최대 시간을 지정합니다. `maxAge: 300`(5분) + `staleMaxAge: 600`(10분)으로 설정하면: 0~5분: 신선한 캐시 반환. 5~15분: 만료된 캐시를 반환하면서 백그라운드에서 새 데이터 생성. 15분 이후: 캐시가 완전히 제거되고, 다음 요청에서 새로 데이터를 생성합니다. `staleMaxAge`를 생략하면 `maxAge`의 2배가 기본값으로 설정됩니다.


</details>





<details>


<summary><strong>Q: 캐시 저장소를 Redis로 변경하려면 어떻게 하나요?</strong></summary>





`nuxt.config.ts`의 `nitro.storage` 옵션으로 캐시 저장소를 설정합니다: `nitro: { storage: { redis: { driver: 'redis', host: 'localhost', port: 6379 } } }`. 그리고 `defineCachedEventHandler`의 `base`와 일치시킵니다. unstorage는 다양한 드라이버를 추상화 레이어로 제공하므로, 코드 변경 없이 저장소를 교체할 수 있습니다. 지원 드라이버: redis, fs(파일시스템), cloudflare-kv, vercel-kv, azure-storage-blob, aws-s3 등.


</details>





<details>


<summary><strong>Q: routeRules의 swr 옵션과 defineCachedEventHandler는 어떤 차이가 있나요?</strong></summary>





`routeRules.swr`는 **페이지 레벨 캐싱**(전체 HTML 응답)을 설정합니다. Nitro 라우터가 응답을 생성하기 전에 Cache-Control 헤더를 설정하고, CDN이나 리버스 프록시(nginx, Cloudflare)에서 이 헤더를 읽어 캐싱합니다. `defineCachedEventHandler`는 **API 엔드포인트 레벨 캐싱**(JSON 응답)을 설정합니다. 서버 내부의 unstorage 저장소에 데이터를 캐시하므로, CDN이 개입하지 않아도 캐싱이 동작합니다. 페이지는 routeRules로, API는 defineCachedEventHandler로 캐싱하는 것이 일반적인 패턴입니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **defineCachedEventHandler** | API 응답 캐싱 | unstorage getItem/setItem → TTL 기반 캐시 |


| **SWR** | Stale-While-Revalidate | 만료된 캐시 즉시 반환 + 백그라운드 갱신 |


| **maxAge** | TTL (초) | 신선한 캐시 유지 시간 |


| **staleMaxAge** | Stale 유지 시간 | 만료 후 stale 데이터 허용 시간 |


| **routeRules.swr** | 페이지 레벨 캐싱 | Cache-Control 헤더 → CDN 캐싱 |


| **unstorage** | 추상화 스토리지 | Redis/fs/CF-KV 등 통합 API |





## 다음 수업





다음 글에서는 폼과 유효성 검사 — HTML5 폼, VeeValidate, Zod 스키마 검증을 배웁니다.


