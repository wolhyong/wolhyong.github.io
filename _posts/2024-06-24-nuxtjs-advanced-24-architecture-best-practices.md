---


layout: post


title: "Nuxt.js 아키텍처와 베스트 프랙티스 — 대규모 프로젝트 구조 설계, 성능 최적화, 확장 전략"


description: "Nuxt.js로 대규모 프로젝트를 설계하고 운영하기 위한 아키텍처 패턴과 베스트 프랙티스를 시스템 레벨에서 심층 학습합니다. 도메인 기반 디렉토리 구조가 features/domains/shared 레이어로 프로젝트를 분리하여 관심사를 분리하는 방식, Nitro server/api의 계층화 전략이 repository/service/controller 패턴으로 API 레이어를 분리하는 과정, 컴포넌트 설계 패턴이 Atomic Design(atom/molecule/organism/template/page)으로 재사용성을 극대화하는 방법, 성능 최적화 전략이 lazy loading/defineCachedEventHandler/routeRules prerender/SWR을 조합하여 TTFB(Time to First Byte)를 최소화하는 과정, 모노레포 구성이 pnpm workspace/turborepo로 공유 타입/Zod 스키마/Nuxt 모듈을 패키지로 관리하는 방식을 다룹니다."


date: 2024-06-24 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, architecture, best-practices, monorepo, performance, scalability, project-structure]


level: advanced


---





대규모 Nuxt.js 프로젝트는 체계적인 아키텍처 설계와 베스트 프랙티스가 필요합니다.





> **핵심 정리** · 대규모 Nuxt 프로젝트는 `features/domains/shared` 레이어로 분리합니다. API는 repository/service/controller 패턴으로 계층화합니다. 컴포넌트는 Atomic Design 패턴으로 설계합니다. 성능 최적화는 lazy loading + 캐싱 + prerender를 조합합니다. 모노레포는 pnpm workspace + turborepo로 구성합니다.





---





## 수업 목표





- 도메인 기반 디렉토리 구조를 이해합니다.


- API 계층화 패턴을 이해합니다.


- Atomic Design 컴포넌트 패턴을 이해합니다.


- 성능 최적화 전략을 이해합니다.


- 모노레포 구성 방식을 이해합니다.





## 도메인 기반 디렉토리 구조





```


project/


├── app/                    # Nuxt 4 애플리케이션


│   ├── pages/


│   ├── layouts/


│   ├── components/


│   │   ├── atoms/          # Button, Input, Label


│   │   ├── molecules/     # SearchBar, PostCard


│   │   ├── organisms/     # Header, PostList, CommentSection


│   │   ├── templates/     # BlogLayout, DashboardLayout


│   │   └── pages/         # 완전한 페이지 컴포넌트


│   ├── composables/


│   │   ├── useAuth/


│   │   ├── useBlog/


│   │   └── useUI/


│   └── server/


│       ├── api/


│       │   ├── posts/


│       │   │   ├── controller.ts    # 요청 처리


│       │   │   ├── service.ts       # 비즈니스 로직


│       │   │   └── repository.ts    # 데이터 접근


│       │   └── auth/


│       │       ├── controller.ts


│       │       ├── service.ts


│       │       └── repository.ts


│       └── middleware/


├── shared/                 # 공유 타입, 스키마, 유틸리티


│   ├── types/


│   ├── schemas/


│   └── utils/


└── modules/                # Nuxt 모듈


```





도메인 기반 구조는 `app/`, `shared/`, `modules/` 세 개의 최상위 디렉토리로 구성됩니다. `app/`은 Nuxt 4 애플리케이션 코드(페이지, 컴포넌트, API), `shared/`는 도메인 간 공유 타입과 Zod 스키마, `modules/`는 재사용 가능한 Nuxt 모듈을 포함합니다. Atomic Design의 5단계(atom → molecule → organism → template → page)로 컴포넌트를 계층화하여 재사용성을 극대화합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: 대규모 Nuxt 프로젝트에서 API 레이어를 어떻게 분리하나요?</strong></summary>





API 레이어는 repository/service/controller 패턴으로 분리합니다: (1) **Controller**: `defineEventHandler()`로 요청을 받고, 파라미터를 검증하며, Service를 호출하고, 응답을 반환합니다. HTTP 관련 로직(getQuery/readBody/createError)만 처리합니다. (2) **Service**: 비즈니스 로직을 처리합니다. 데이터 변환, 권한 검사, 이메일 전송 등 순수 함수로 작성하여 테스트 용이성을 확보합니다. (3) **Repository**: 데이터 접근 로직을 추상화합니다. Prisma/DB 호출을 캡슐화하고, 필요한 경우 캐싱을 적용합니다. 이렇게 분리하면 Service와 Repository를 개별적으로 유닛 테스트할 수 있습니다.


</details>





<details>


<summary><strong>Q: Nuxt 프로젝트의 성능을 측정하고 최적화하려면 어떻게 하나요?</strong></summary>





성능 최적화는 측정 → 분석 → 개선의 사이클로 진행합니다: (1) **측정**: Lighthouse(PageSpeed Insights), Web Vitals(LCP/FID/CLS), Nuxt DevTools Performance 탭. (2) **분석**: 가장 느린 페이지 식별, 큰 번들을 구성하는 패키지 확인(`npx nuxi analyze`). (3) **개선**: Lazy 로딩 적용(`LazyComponent`), API 캐싱(`defineCachedEventHandler`), 정적 페이지 prerender(`routeRules.prerender`), 이미지 최적화(`NuxtImg`), 폰트 최적화(`@nuxtjs/fontaine`), 번들 분석 후 불필요한 패키지 제거. 각 개선 후 다시 측정하여 효과를 검증합니다.


</details>





<details>


<summary><strong>Q: 모노레포에서 Nuxt 프로젝트를 어떻게 구성하나요?</strong></summary>





pnpm workspace + turborepo로 구성합니다: `pnpm-workspace.yaml`에 `packages: ['apps/*', 'packages/*']`를 정의합니다. `apps/web/`(Nuxt 애플리케이션), `packages/shared/`(공유 타입/Schema), `packages/ui/`(UI 컴포넌트 모음)으로 분리합니다. `packages/shared`는 Zod 스키마와 TypeScript 타입만 포함하여 모든 앱에서 동일한 타입을 사용합니다. `packages/ui`는 Nuxt 모듈 형태로 패키징하여 `nuxt.config.ts`에서 `modules: ['@project/ui']`로 사용합니다. Turborepo의 캐싱으로 변경된 패키지만 다시 빌드하여 CI 시간을 단축합니다.


</details>





<details>


<summary><strong>Q: 프로덕션에서 자주 발생하는 문제와 해결 방법은 무엇인가요?</strong></summary>





(1) **메모리 누수**: SSR에서 생성된 클로저가 해제되지 않아 메모리가 지속적으로 증가합니다. `defineEventHandler` 내부의 `setInterval`이나 글로벌 변수 사용을 주의하고, 연결 종료 시 정리 로직을 구현합니다. (2) **콜드 스타트 지연**: Serverless 환경에서 첫 요청 시 함수 초기화 시간이 오래 걸립니다. `defineCachedEventHandler`로 인기 있는 API를 캐싱하고, 불필요한 의존성을 제거하며, 번들 크기를 최소화합니다. (3) **SEO 이슈**: SSR이 정상 동작하지 않으면 검색 엔진이 빈 페이지를 인덱싱합니다. `curl http://localhost:3000/page`로 HTML에 실제 콘텐츠가 포함되었는지 확인합니다. (4) **환경 변수 누락**: `.env` 파일이 프로덕션에 복사되지 않으면 `runtimeConfig` 값이 비어 있습니다. 플랫폼의 환경 변수 설정을 확인합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **도메인 구조** | app/shared/modules | 관심사 분리 + Atomic Design 컴포넌트 계층화 |


| **API 계층화** | controller/service/repository | HTTP 로직 / 비즈니스 로직 / 데이터 접근 분리 |


| **성능 최적화** | LCP/FID/CLS 개선 | lazy loading + 캐싱 + prerender + 이미지/폰트 최적화 |


| **모노레포** | pnpm + turborepo | 공유 패키지 → 타입 일관성 + CI 캐싱 |


| **프로덕션 운영** | 메모리/콜드 스타트/SEO | 정리 로직 + 캐싱 + SSR 검증 + 환경 변수 확인 |





---





## 시리즈 완료





축하합니다! 이로써 Nuxt.js의 기초부터 고급 아키텍처까지 24개의 수업을 완료했습니다. 이 시리즈에서는 Nuxt.js의 내부 동작 원리(Vite glob import, Nitro rollup, h3 event handler, SSR hydration, Pinia 직렬화, CSP 파싱 등)를 시스템 레벨에서 학습했습니다. 각 주제의 코드 예제와 함께 내부 동작 방식을 이해함으로써, 단순한 사용법을 넘어 Nuxt.js 애플리케이션을 깊이 있게 설계하고 최적화할 수 있는 능력을 갖추게 되었습니다.


