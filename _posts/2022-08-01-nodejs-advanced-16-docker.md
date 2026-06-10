---
layout: post
title: "Node.js Docker 컨테이너화: Dockerfile, docker-compose, 배포"
description: "Node.js Docker 컨테이너화 — 이미지 레이어 구조와 캐싱 원리, 멀티 스테이지 빌드 최적화, docker-compose 멀티 컨테이너, 프로덕션 배포 전략"
date: 2022-08-01 10:00:00 +0900
category: nodejs
tags: [nodejs, javascript, docker, container, docker-compose, devops, deployment, multi-stage]
level: advanced
---

Docker는 개발 환경과 프로덕션 환경의 차이를 없애주는 컨테이너 기술입니다. Node.js 애플리케이션을 Docker 컨테이너로 패키징하면 **"내 컴퓨터에서는 되는데요?"** 문제가 사라집니다. 이번 강의에서는 Docker의 레이어 캐싱 원리부터 멀티 스테이지 빌드, docker-compose를 활용한 멀티 컨테이너 구성, 프로덕션 배포까지 다룹니다.

## 수업 목표

- Docker 이미지 레이어 구조와 캐싱 원리를 이해합니다.
- 멀티 스테이지 빌드로 이미지 크기를 80% 이상 줄일 수 있습니다.
- docker-compose로 Node.js + MongoDB + Redis 멀티 컨테이너 환경을 구성할 수 있습니다.
- 개발/프로덕션 환경을 Docker로 분리하여 구성할 수 있습니다.
- PID 1 문제, 좀비 프로세스, 헬스체크 등 프로덕션 Docker 이슈를 이해합니다.
- CI/CD 파이프라인에서 Docker 이미지를 빌드하고 배포할 수 있습니다.

## Dockerfile 작성과 레이어 시스템

### Docker 이미지 레이어 구조

Docker 이미지는 여러 개의 읽기 전용 **레이어**로 구성됩니다. 각 Docker 명령어(RUN, COPY, ADD)는 새로운 레이어를 생성하며, 이 레이어들은 Union 파일 시스템으로 병합되어 하나의 컨테이너로 보입니다.

```
┌────────────────────────────────────┐
│ Layer 6: CMD ["node", "app.js"]    │  ← 컨테이너 메타데이터
├────────────────────────────────────┤
│ Layer 5: COPY . .                  │  ← 소스 코드 (자주 변경)
├────────────────────────────────────┤
│ Layer 4: RUN npm ci               │  ← 의존성 (package.json 변경 시)
├────────────────────────────────────┤
│ Layer 3: COPY package*.json ./     │  ← 패키지 파일
├────────────────────────────────────┤
│ Layer 2: WORKDIR /app              │
├────────────────────────────────────┤
│ Layer 1: FROM node:18-alpine       │  ← 베이스 이미지 (~120MB)
└────────────────────────────────────┘
```

**레이어 캐싱 원리:** Docker는 빌드할 때 각 레이어의 캐시를 확인합니다. 이전 빌드와 동일한 명령어와 동일한 파일 내용이면 **캐시된 레이어를 재사용**합니다. 따라서 자주 변경되지 않는 레이어(베이스 이미지 → 패키지 파일 → 의존성 설치)를 먼저 배치하고, 자주 변경되는 레이어(소스 코드)를 나중에 배치해야 합니다.

```dockerfile
# ❌ 비효율적인 Dockerfile — 매 빌드마다 모든 단계 재실행
# 소스 코드가 변경되면 COPY . .로 인해 모든 후속 레이어 캐시 무효화
FROM node:18-alpine
WORKDIR /app
COPY . .                            # ← package.json 변경도 포함되므로
RUN npm ci --only=production        # ← npm ci도 매번 재실행됨!
EXPOSE 3000
CMD ["node", "app.js"]

# ✅ 최적화된 Dockerfile — 변경 빈도가 낮은 순서로 레이어 배치
FROM node:18-alpine

WORKDIR /app

# 1. 패키지 파일만 먼저 복사 (거의 변경되지 않음)
COPY package*.json ./
COPY tsconfig*.json ./

# 2. 의존성 설치 (package.json 변경 시에만 재실행)
RUN npm ci --only=production && \
    npm cache clean --force

# 3. 소스 코드 복사 (자주 변경됨 — 이 레이어는 자주 무효화)
COPY . .

EXPOSE 3000
CMD ["node", "dist/app.js"]
```

**레이어 캐싱 효율 측정:**

```
최적화 전:  소스 1줄 변경 → 전체 빌드 120초 (npm install 포함)
최적화 후:  소스 1줄 변경 → 빌드 2초 (npm install 캐시 히트)
           → 빌드 시간 98% 단축!
```

## 멀티 스테이지 빌드

멀티 스테이지 빌드는 하나의 Dockerfile에서 여러 개의 FROM을 사용하여 **빌드 환경과 실행 환경을 분리**합니다. 빌드에만 필요한 도구(컴파일러, 테스트 도구)는 최종 이미지에 포함되지 않아 이미지 크기가 대폭 줄어듭니다.

### 이미지 크기 비교

| 베이스 이미지 | 용도 | 크기 | 빌드 도구 포함 |
|-------------|------|------|-------------|
| node:18 (slim 아님) | 풀 빌드 환경 | ~945MB | npm, yarn, python, g++, make 등 |
| node:18-slim | 최소 Node 환경 | ~180MB | python 없음, 일부 네이티브 모듈 빌드 불가 |
| node:18-alpine | 초경량 | ~120MB | apk 패키지 매니저, 필요한 도구만 추가 |
| **멀티 스테이지 (최종)** | **실행 전용** | **~140MB** | **빌드 도구 완전 제외** |

```dockerfile
# ============ Build Stage ============
FROM node:18-alpine AS builder

WORKDIR /app

# 1. 의존성 설치 (개발 의존성 포함 — 테스트, 빌드 도구)
COPY package*.json ./
RUN npm ci  # ← devDependencies 포함

# 2. 소스 코드 복사 및 빌드
COPY . .
RUN npm run build           # TypeScript 컴파일 등
RUN npm run test            # 테스트는 빌드 단계에서 실행
RUN npm prune --production  # 프로덕션 의존성만 남기고 devDependencies 제거

# ============ Production Stage ============
FROM node:18-alpine

# PID 1 문제 해결을 위한 tini 설치
RUN apk add --no-cache tini

WORKDIR /app

# 빌드 스테이지에서 필요한 파일만 복사 (Node.js만 있으면 됨)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# 프로덕션 설정
ENV NODE_ENV=production
ENV PORT=3000

# tini로 PID 1 문제 해결
ENTRYPOINT ["/sbin/tini", "--"]

# 보안: root가 아닌 node 사용자로 실행
USER node

EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/app.js"]
```

**멀티 스테이지 빌드 효과:**
```
빌드 스테이지 이미지 크기: ~1.2GB (TypeScript, devDependencies, 테스트 도구 포함)
최종 이미지 크기: ~140MB (실행에 필요한 것만)
→ 이미지 크기 88% 감소!
→ 배포 시간 단축: 1.2GB → 140MB (네트워크 전송 8.5배 빠름)
```

### PID 1 문제란?

Linux에서 PID 1(init 프로세스)은 특별한 역할을 합니다. 일반 프로세스와 달리 PID 1은 기본적으로 **SIGTERM 신호를 무시**하고, 좀비 프로세스를 처리해야 합니다. Docker 컨테이너가 `CMD ["node", "app.js"]`로 시작되면 Node.js 프로세스가 PID 1이 되어, `docker stop` 명령어가 SIGTERM을 보내도 Node.js가 이를 받지 못해 **컨테이너가 정상 종료되지 않고 10초 후 강제 종료(SIGKILL)** 됩니다.

tini는 이 문제를 해결하는 초경량 init 시스템입니다. tini가 PID 1이 되어 SIGTERM을 Node.js에 전달하고, 좀비 프로세스를 자동으로 정리합니다.

```dockerfile
# tini 설치 (약 50KB)
# Alpine에는 apk로 설치 가능
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]

# 또는 --init 플래그로 간단히 해결
# docker run --init myapp
```

## docker-compose — 멀티 컨테이너 오케스트레이션

docker-compose는 여러 Docker 컨테이너를 정의하고 실행하는 도구입니다. Node.js 앱, MongoDB, Redis를 각각 컨테이너로 구성하면 **서비스 간 네트워크 격리, 볼륨 관리, 환경 변수 설정**을 선언적으로 관리할 수 있습니다.

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped
    networks:
      - app-network
    # CPU/메모리 제한 (프로덕션 필수)
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: '256M'
        reservations:
          memory: '128M'

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongodb-data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    networks:
      - app-network

volumes:
  mongodb-data:
  redis-data:
  uploads:

networks:
  app-network:
    driver: bridge
```

### docker-compose 명령어별 동작:

| 명령어 | 동작 | 사용 시점 |
|-------|------|---------|
| `docker compose up -d` | 이미지 빌드 + 컨테이너 생성 및 시작 | 최초 배포 |
| `docker compose down` | 컨테이너 중지 및 네트워크 제거 (볼륨 유지) | 일시 중단 |
| `docker compose down -v` | 볼륨까지 모두 제거 | 완전 초기화 |
| `docker compose logs -f app` | app 컨테이너 로그 실시간 확인 | 디버깅 |
| `docker compose exec app sh` | 실행 중인 컨테이너에 셸 접속 | 문제 진단 |
| `docker compose restart app` | app 컨테이너만 재시작 | 설정 변경 |

### 개발 환경 docker-compose.override.yml

docker-compose는 **자동으로** `docker-compose.override.yml` 파일을 로드합니다. 개발 환경에 필요한 설정(볼륨 마운트, 디버깅, 핫 리로드)은 override 파일에 작성하고 `.gitignore`에 추가하는 것이 좋습니다(팀원마다 설정이 다를 수 있으므로).

```yaml
# docker-compose.override.yml (자동 로드, .gitignore에 추가)
version: '3.8'

services:
  app:
    build:
      target: development
    volumes:
      - .:/app                    # 소스 코드 실시간 동기화
      - /app/node_modules         # 호스트 node_modules는 덮어쓰지 않음
    environment:
      - NODE_ENV=development
      - DEBUG=app:*
      - CHOKIDAR_USEPOLLING=true   # 파일 변경 감지 (Windows/Mac 호환)
    command: npx nodemon src/app.js  # 핫 리로드
    ports:
      - "9229:9229"                # Node.js 디버거 포트 (--inspect)
```

## 프로덕션 Docker 운영

### 헬스체크 엔드포인트

Docker의 HEALTHCHECK는 컨테이너 내부에서 주기적으로 명령어를 실행하여 애플리케이션의 상태를 확인합니다.

```javascript
// src/health.js
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
  };

  // MongoDB 연결 상태 확인
  try {
    const mongoState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    health.mongodb = mongoState === 1 ? 'UP' : 'DOWN';
    if (mongoState !== 1) health.status = 'DEGRADED';
  } catch (err) {
    health.mongodb = 'DOWN';
    health.status = 'DEGRADED';
  }

  const statusCode = health.status === 'UP' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

**Docker HEALTHCHECK 결과와 컨테이너 상태:**

```
healthy      → 헬스체크 성공 (정상)
unhealthy    → 헬스체크 실패 (재시작 필요)
starting     → 아직 첫 헬스체크 전 (start-period 중)
```

### .dockerignore — 빌드 컨텍스트 최적화

```dockerfile
# .dockerignore — 빌드 컨텍스트에서 제외 (빌드 속도 향상)
node_modules        # 호스트 node_modules는 사용하지 않음
npm-debug.log
.git
.gitignore
.env
.env.*
Dockerfile
.dockerignore
README.md
coverage
test
tests
*.test.js
.gitkeep
.vscode
.idea
dist                 # 빌드된 파일도 제외 (Docker 내부에서 다시 빌드)
```

**.dockerignore가 빌드 속도에 미치는 영향:**
```
.dockerignore 없음: 빌드 컨텍스트 약 500MB → Docker 데몬 전송 시간 15~30초
.dockerignore 있음: 빌드 컨텍스트 약 10MB → 전송 시간 0.2~0.5초
→ 빌드 시간 98% 단축!
```

## CI/CD with Docker

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v3

    - name: Docker 로그인
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: 이미지 빌드 및 푸시
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Alpine 이미지와 일반 Node 이미지의 차이는?</strong></summary>

Alpine 이미지는 **약 120MB**로 일반 Node 이미지(~350MB)보다 훨씬 가볍습니다. Alpine은 musl libc 기반이고, 일반 Node 이미지는 glibc 기반입니다. 대부분의 Node.js 앱에서는 차이가 없지만, 일부 네이티브 모듈(bcrypt, sharp, puppeteer)은 glibc에 의존하는 바이너리를 포함할 수 있습니다. 이런 경우 Alpine용 빌드 도구를 추가 설치해야 합니다.
</details>

<details>
<summary><strong>docker compose down -v를 하면 데이터가 모두 삭제되나요?</strong></summary>

네, `-v` 플래그는 **모든 볼륨을 완전 삭제**합니다. MySQL이나 MongoDB 데이터 디렉토리가 통째로 사라지므로, 프로덕션에서는 절대 `docker compose down -v`를 실행하지 마세요. 볼륨을 정리해야 한다면 수동으로 특정 볼륨만 선택적으로 삭제하는 것이 안전합니다.
</details>

<details>
<summary><strong>멀티 스테이지 빌드가 항상 좋은가요?</strong></summary>

아니요. 빌드 단계가 복잡하고 최종 이미지 크기가 중요하지 않은 소규모 프로젝트(예: 단일 서버 내부 서비스)에서는 오버헤드일 수 있습니다. 하지만 Docker Hub나 컨테이너 레지스트리에 푸시해야 하거나(네트워크 전송 비용), 수백 대의 서버에 배포해야 한다면(디스크 공간, 다운로드 시간) 멀티 스테이지 빌드로 이미지 크기를 최소화하는 것이 중요합니다.
</details>

## 요약

- **레이어 시스템** — Dockerfile 명령어마다 레이어 생성, 변경 빈도 낮은 순으로 배치
- **레이어 캐싱** — package.json 먼저 복사 → npm ci → 소스 복사 순서로 빌드 시간 98% 단축
- **멀티 스테이지 빌드** — 빌드 환경(node:18, 945MB)과 실행 환경(node:18-alpine, 140MB) 분리 → 88% 경량화
- **PID 1 문제** — tini init 시스템으로 SIGTERM 정상 처리, 좀비 프로세스 방지
- **docker-compose** — Node.js + MongoDB + Redis 멀티 컨테이너 구성, depends_on + healthcheck로 의존성 관리
- **보안/성능** — USER node로 권한 제한, deploy.resources로 CPU/메모리 제한
- **개발/프로덕션 분리** — docker-compose.override.yml로 개발 환경, target으로 빌드 단계 선택
