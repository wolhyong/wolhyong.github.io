---


layout: post


title: "Nuxt.js 배포와 CI/CD — Vercel/Netlify/Docker에 배포하고 GitHub Actions로 자동화하는 과정"


description: "Nuxt.js 애플리케이션을 다양한 플랫폼에 배포하고 CI/CD 파이프라인을 구축하는 과정을 시스템 레벨에서 심층 학습합니다. Nitro의 .output/server/index.mjs가 Node.js http.createServer()를 직접 호출하여 독립 실행형 서버로 동작하는 원리, Vercel 배포 시 @vercel/nitro 패키지가 serverless 함수로 변환되어 각 API 엔드포인트가 개별 Lambda로 배포되는 과정, Netlify 배포 시 @netlify/functions로 변환되고 Edge Functions에서 Nitro 핸들러가 실행되는 방식, Docker 배포 시 Node.js Alpine 이미지 위에 .output 디렉토리를 복사하고 CMD로 서버를 시작하는 multi-stage build 과정, GitHub Actions에서 nuxi build와 nuxi generate를 자동 실행하고 S3/SSH로 배포하는 CI/CD 파이프라인을 다룹니다."


date: 2024-05-27 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, deployment, vercel, netlify, docker, cicd, github-actions]


level: advanced


---





Nuxt.js 애플리케이션의 배포는 Nitro 엔진의 플랫폼 독립성 덕분에 다양한 환경에 유연하게 배포할 수 있습니다.





> **핵심 정리** · Nitro는 `.output/server/index.mjs`를 생성하여 Node.js http.createServer()로 독립 실행됩니다. Vercel은 각 API 엔드포인트를 개별 Lambda로, Netlify는 Edge Functions로 변환합니다. Docker는 Node.js Alpine 이미지에 `.output`을 복사하여 실행합니다. GitHub Actions는 `nuxi build`를 자동 실행하고 배포합니다.





---





## 수업 목표





- Nitro의 플랫폼별 출력 형식을 이해합니다.


- Vercel/Netlify/Docker 배포의 차이를 이해합니다.


- GitHub Actions CI/CD 파이프라인을 이해합니다.





## Docker 배포





```dockerfile


# Dockerfile


FROM node:20-alpine AS base


WORKDIR /app





FROM base AS builder


RUN apk add --no-cache libc6-compat


COPY . .


RUN npm ci && npx nuxi build





FROM base AS runner


COPY --from=builder /app/.output /app/.output


EXPOSE 3000


ENV NODE_ENV=production


CMD ["node", "/app/.output/server/index.mjs"]


```





`nuxi build`는 `.output/` 디렉토리에 Nitro 서버 번들과 정적 에셋을 생성합니다. `.output/server/index.mjs`는 Node.js `http.createServer()`를 직접 호출하는 독립 실행형 HTTP 서버입니다. `npm ci`는 `package-lock.json`을 기반으로 정확한 의존성을 설치합니다. Multi-stage build로 최종 이미지에는 `.output/` 디렉토리만 포함되어 이미지 크기를 최소화합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Vercel과 Netlify 중 어떤 플랫폼을 선택해야 하나요?</strong></summary>





Vercel은 Next.js와 Nuxt.js에 최적화된 플랫폼으로, `@vercel/nitro`가 각 API 엔드포인트를 개별 serverless 함수로 변환하여 콜드 스타트가 빠릅니다. Netlify는 Netlify Edge Functions와 Netlify Forms/Identity 등 부가 기능이 풍부합니다. 두 플랫폼 모두 `nuxt.config.ts`의 `nitro.preset`만 변경하면 됩니다: `vercel` 또는 `netlify`. 무료 티어에서는 Vercel이 더 관대한 빌드 시간(100분/월)을 제공합니다. 엔터프라이즈 기능이 필요하면 Netlify가 더 다양한 부가 기능을 제공합니다.


</details>





<details>


<summary><strong>Q: GitHub Actions로 CI/CD를 구성하려면 어떻게 하나요?</strong></summary>





`.github/workflows/deploy.yml`에 워크플로우를 정의합니다: `push` 이벤트에 `main` 브랜치를 트리거로 설정합니다. Ubuntu runner에서 `actions/checkout@v4`로 코드를 체크아웃하고, `actions/setup-node@v4`로 Node.js 20을 설정합니다. `npm ci`로 의존성을 설치하고, `npx nuxi build`로 빌드합니다. 배포 단계에서는 플랫폼에 따라 `vercel deploy --prod`, `netlify deploy --prod`, 또는 S3/SSH로 `.output/`을 전송합니다. 캐시 전략: `~/.npm`을 캐싱하여 CI 속도를 50% 이상 향상할 수 있습니다.


</details>





<details>


<summary><strong>Q: 프로덕션 환경에서 환경 변수는 어떻게 관리하나요?</strong></summary>





환경 변수는 `.env` 파일 대신 플랫폼의 환경 변수 설정을 사용합니다. Vercel: 프로젝트 설정 > Environment Variables. Netlify: Site settings > Build & deploy > Environment variables. Docker: `docker run -e NUXT_API_SECRET=...` 또는 `docker-compose.yml`의 `environment` 섹션. `runtimeConfig`의 `public` 변수는 클라이언트에 노출되므로, 민감한 정보는 절대 `public`에 포함하지 않습니다. 프로덕션에서는 `NUXT_PUBLIC_*`만 클라이언트에서 접근 가능합니다.


</details>





<details>


<summary><strong>Q: 배포 전에 로컬에서 프로덕션 빌드를 테스트하려면 어떻게 하나요?</strong></summary>





`npx nuxi build`로 프로덕션 빌드를 생성하고, `node .output/server/index.mjs`로 서버를 실행합니다. `http://localhost:3000`에서 모든 페이지와 API가 정상 동작하는지 확인합니다. `npx nuxi generate`로 정적 사이트를 생성하고 `npx serve .output/public`으로 테스트합니다. Docker 배포를 계획 중이라면 `docker build -t nuxt-app . && docker run -p 3000:3000 nuxt-app`으로 Docker 이미지를 로컬에서 테스트합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **Docker** | 컨테이너 배포 | node:20-alpine → .output 복사 → CMD 실행 |


| **Vercel** | Serverless 배포 | 각 API → 개별 Lambda, @vercel/nitro 변환 |


| **Netlify** | Edge Functions 배포 | @netlify/functions 변환 → Edge 런타임 |


| **GitHub Actions** | CI/CD 자동화 | push 트리거 → nuxi build → 배포 명령 실행 |





## 다음 수업





다음 글에서는 모듈과 플러그인 — @nuxtjs/ 모듈 생태계와 커스텀 모듈 개발을 배웁니다.


