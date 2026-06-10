---
layout: post
title: "Node.js 배포와 DevOps: CI/CD, 클라우드 배포, 모니터링"
description: "Node.js 배포와 DevOps — CI/CD 파이프라인, AWS/GCP 배포 전략 비교, PM2 클러스터 성능 수치, Prometheus + Grafana 모니터링, 무중단 배포와 롤백 전략, Sentry 에러 트래킹, Slack 알림"
date: 2022-08-15 10:00:00 +0900
category: nodejs
tags: [nodejs, javascript, devops, deployment, ci-cd, aws, gcp, monitoring, docker, pm2, sentry, prometheus]
level: advanced
---

Node.js 애플리케이션을 개발하는 것만큼이나 안정적으로 배포하고 운영하는 것도 중요합니다. 이번 강의에서는 CI/CD 파이프라인 구축, 클라우드 배포, 모니터링, 로깅, 그리고 무중단 배포 전략까지 프로덕션 운영의 모든 것을 학습합니다. Node.js 과정의 마지막 강의입니다.

## 수업 목표

- CI/CD 파이프라인을 구축하고 GitHub Actions로 자동화할 수 있습니다.
- AWS Elastic Beanstalk와 GCP Cloud Run의 차이를 이해하고 선택할 수 있습니다.
- PM2 클러스터로 프로덕션 환경을 운영하고 성능을 측정할 수 있습니다.
- Prometheus + Grafana로 모니터링 시스템을 구축할 수 있습니다.
- Winston으로 구조화된 로깅을 구성하고 ELK 스택으로 중앙화할 수 있습니다.
- Blue-Green 배포와 롤링 배포 전략을 이해하고 상황에 맞게 선택할 수 있습니다.
- Sentry 에러 트래킹과 Slack 알림을 설정하여 장애에 대응할 수 있습니다.

## 배포 전략 — 상황별 선택 가이드

무중단 배포 전략을 선택할 때는 서비스의 특성과 팀의 역량을 고려해야 합니다. 각 전략의 장단점을 비교해보겠습니다.

### 배포 전략 비교

| 전략 | 다운타임 | 롤백 속도 | 구현 복잡도 | 리소스 사용량 | 적합한 상황 |
|------|---------|-----------|------------|-------------|-----------|
| **단순 재시작** | 30초~2분 | 빠름 (재배포) | 매우 낮음 | 1배 | 개발/스테이징, 트래픽 無 |
| **롤링 업데이트** | 0초 (순간적) | 느림 (단계적 롤백) | 중간 | 1.5배 | 일반적인 웹 서비스 |
| **Blue-Green** | 0초 | 즉시 (라우터 전환) | 높음 | **2배** | 트래픽이 중요한 서비스 |
| **Canary 배포** | 0초 | 즉시 (트래픽 회수) | 매우 높음 | 2배 + α | 대규모, 점진적 검증 필요 |
| **A/B 테스트** | 0초 | 즉시 | 매우 높음 | 2배 | 기능 실험이 필요한 경우 |

**추천:** 대부분의 서비스는 **Blue-Green 배포**로 시작하고, 서비스가 성장하면 Canary 배포를 도입하는 것이 좋습니다.

### Blue-Green 배포 상세

```bash
#!/bin/bash
# blue-green-deploy.sh

# 현재 활성 환경 확인
CURRENT=$(cat /app/current.env)
echo "현재 환경: $CURRENT"

if [ "$CURRENT" = "blue" ]; then
  NEW="green"
else
  NEW="blue"
fi

echo "새 환경: $NEW 배포 중..."

# 새 버전 배포
docker compose up -d app-$NEW

# 헬스체크 (최대 30초 대기)
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null; then
    echo "$NEW 헬스체크 성공"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "헬스체크 실패 — 배포 중단"
    docker compose stop app-$NEW
    exit 1
  fi
  sleep 1
done

# 커넥션 드레인 (기존 요청 완료 대기)
sleep 5

# Nginx 전환
cp nginx-$NEW.conf /etc/nginx/conf.d/default.conf
nginx -s reload

echo "$NEW 활성화 완료"

# 이전 환경 정리
docker compose stop app-$CURRENT

# 현재 환경 저장
echo "$NEW" > /app/current.env
```

### 배포 전략 선택 의사결정 트리

```
서비스에 다운타임이 허용되는가?
├── YES → 단순 재시작 (가장 간단)
└── NO → 무중단 배포 필요
    ├── 개발 인원이 3인 이하인가?
    │   └── YES → 롤링 업데이트
    └── 개발 인원이 3인 이상인가?
        ├── Blue-Green 배포 (추천)
        └── 트래픽이 일일 100만 건 이상?
            └── YES → Canary 배포
```

## CI/CD 파이프라인

### GitHub Actions 파이프라인 구성

{% raw %}
```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
    - uses: actions/checkout@v3

    - name: Node.js 설정
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: 의존성 설치
      run: npm ci

    - name: 린트 검사
      run: npm run lint

    - name: 타입 체크
      run: npm run typecheck

    - name: 유닛 테스트
      run: npm run test:ci

    - name: 통합 테스트
      run: npm run test:integration
      env:
        MONGODB_URI: mongodb://localhost:27017/test
```
{% endraw %}

### CI/CD 파이프라인 단계별 소요 시간

| 단계 | JavaScript 프로젝트 | TypeScript 프로젝트 | 비고 |
|------|-------------------|-------------------|------|
| 의존성 설치 (npm ci) | 30초 | 35초 | 캐시된 경우 10초 |
| 린트 검사 | 15초 | 20초 | - |
| 타입 체크 (tsc) | 0초 | 25초 | JS 프로젝트는 생략 |
| 유닛 테스트 | 20초 | 22초 | - |
| 통합 테스트 | 40초 | 40초 | MongoDB 컨테이너 대기 포함 |
| Docker 빌드 | 90초 | 100초 | 레이어 캐시 활용 시 30초 |
| 배포 | 60초 | 60초 | SSH 또는 클라우드 API |
| **총 소요 시간** | **~4분** | **~5분** | 병렬 실행 시 3~4분 |

**팁:** `npm ci`가 `npm install`보다 **최대 60% 빠릅니다** (package-lock.json만 사용, 네트워크 요청 최소화). GitHub Actions에서 `actions/cache`로 `node_modules`를 캐시하면 설치 시간을 10초 이하로 단축할 수 있습니다.

### GitHub Actions 캐시 최적화

{% raw %}
```yaml
- name: Cache node_modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ 'package-lock.json' }}
    restore-keys: |
      ${{ runner.os }}-node-
```
{% endraw %}

## 클라우드 배포 — AWS vs GCP 비교

### AWS Elastic Beanstalk

```bash
# EB CLI 설치
npm install -g awsebcli

# 프로젝트 초기화
eb init -p node.js-18 my-app --region ap-northeast-2

# 개발 환경 생성
eb create my-app-dev --single

# 프로덕션 환경 생성
eb create my-app-prod --elb-type application

# 배포
eb deploy my-app-prod

# 환경 변수 설정
eb setenv NODE_ENV=production MONGODB_URI=mongodb://...
```

### GCP Cloud Run

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/myapp', '.']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/myapp']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'myapp'
      - '--image=gcr.io/$PROJECT_ID/myapp'
      - '--region=asia-northeast3'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--memory=512Mi'
      - '--cpu=1'
      - '--min-instances=1'
      - '--max-instances=10'
      - '--concurrency=80'
      - '--timeout=300'
      - '--set-env-vars=NODE_ENV=production'
```

### AWS vs GCP — Node.js 배포 비교

| 항목 | AWS Elastic Beanstalk | GCP Cloud Run |
|------|---------------------|---------------|
| 설정 난이도 | 중간 (EB CLI + 콘솔) | 낮음 (Cloud Run UI + gcloud) |
| 콜드 스타트 | 없음 (EC2 상시 실행) | 1~3초 (최소 인스턴스 설정 시 없음) |
| 오토스케일링 속도 | 2~5분 (EC2 Auto Scaling) | 10~30초 (서버리스) |
| 비용 (저트래픽) | 월 $30~50 (t3a.small 1대) | 월 $5~15 (요청 기반 과금) |
| 비용 (고트래픽) | 월 $200~500 (예측 가능) | 월 $300~800 (요청당 과금, 예측 어려움) |
| 커스터마이징 | 자유로움 (EC2 직접 접근) | 제한적 (컨테이너 설정만 가능) |
| Node.js 버전 관리 | EB CLI로 선택 | Dockerfile로 완전 제어 |
| **추천 대상** | **예측 가능한 트래픽, 커스터마이징 필요** | **변동 트래픽, 빠른 배포, 비용 최적화** |

**실전 조언:** 처음 시작할 때는 **GCP Cloud Run**이 가장 간단합니다. 서버리스이므로 인프라 관리가 거의 필요 없고, 무료 티어(월 200만 요청)로 시작할 수 있습니다. 트래픽이 안정화되고 커스터마이징이 필요해지면 AWS로 마이그레이션하는 것이 일반적인 패턴입니다.

## PM2 프로덕션 운영

### PM2 클러스터 성능

PM2의 클러스터 모드를 사용하면 싱글 스레드 Node.js의 한계를 극복할 수 있습니다.

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'myapp-api',
      script: 'dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/myapp/error.log',
      out_file: '/var/log/myapp/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,
      kill_timeout: 5000,
      listen_timeout: 3000,
    },
  ],
};
```

### CPU 코어 수별 PM2 성능

| CPU 코어 | 프로세스 수 | 초당 요청 처리 (RPS) | 메모리 사용량 | 상대 성능 |
|---------|-----------|-------------------|-------------|---------|
| 1코어 (싱글) | 1 | ~8,000 | 150MB | 1x (기준) |
| 2코어 | 2 | ~15,200 | 280MB | 1.9x |
| 4코어 | 4 | ~30,000 | 520MB | 3.75x |
| 8코어 | 8 | ~54,000 | 1.1GB | 6.75x |
| 16코어 | 16 | ~68,000 | 2.4GB | 8.5x |

**주의:** 코어 수를 늘린다고 선형적으로 성능이 증가하지는 않습니다. 코어 간 컨텍스트 스위칭 오버헤드와 공유 리소스(데이터베이스 연결, Redis 등) 병목으로 인해 **8코어 이후부터는 증가폭이 급격히 감소**합니다. 일반적으로 **4~8코어가 가장 효율적**입니다.

### PM2 프로덕션 명령어

```bash
# PM2 글로벌 설치
npm install -g pm2

# 애플리케이션 시작
pm2 start ecosystem.config.js --env production

# 상태 확인
pm2 list
pm2 show myapp-api
pm2 monit

# 로그 확인
pm2 logs myapp-api --lines 100

# 재시작 (무중단)
pm2 reload all

# 서버 재시작 후 복원
pm2 save
pm2 startup
```

### PM2 클러스터 모드의 동작 원리

PM2 클러스터 모드는 Node.js의 `cluster` 모듈을 기반으로 합니다. 마스터 프로세스가 워커 프로세스를 생성하고, OS 커널이 들어오는 요청을 각 워커에 **라운드 로빈(Round Robin)** 방식으로 분배합니다.

```
클라이언트 요청
    │
    ▼
┌─────────────────────────────┐
│       PM2 마스터 프로세스     │
│  (포트 3000 리스닝, 라우팅)   │
└─────────────────────────────┘
    │         │         │
    ▼         ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐
│워커 1│ │워커 2│ │워커 3│ ... (CPU 코어 수만큼)
│싱글  │ │싱글  │ │싱글  │
│스레드 │ │스레드 │ │스레드 │
└──────┘ └──────┘ └──────┘
    │         │         │
    ▼         ▼         ▼
   DB       Redis    외부 API
```

**PM2가 단순 `cluster` 모듈보다 나은 점:**
- **무중단 reload** (`pm2 reload`) — 워커를 하나씩 재시작하여 다운타임 0
- **자동 재시작** — 워커가 비정상 종료되면 즉시 새 워커 생성
- **메모리 제한** — `max_memory_restart`로 특정 메모리 초과 시 자동 재시작
- **로그 관리** — 로그 로테이션, 날짜 형식, 파일 분리 내장

## 모니터링 — Prometheus + Grafana

### 왜 모니터링이 중요한가?

모니터링이 없으면 프로덕션 문제를 사용자가 먼저 알게 됩니다. 다음은 모니터링이 없었을 때 실제로 발생한 사례입니다:

| 시간 | 상황 | 모니터링 O | 모니터링 X |
|------|------|-----------|-----------|
| 03:00 | 메모리 누수 시작 | Grafana 알람 → 자동 재시작 | 문제 인지 못함 |
| 07:00 | 디스크 90% | PagerDuty → 엔지니어 wake-up | 문제 인지 못함 |
| 09:00 | 서비스 다운 | 이미 해결됨 (SLA 유지) | 사용자 신고로 인지 |
| 09:30 | - | - | 긴급 롤백, 장애 보고서 작성 |
| **총 영향** | **0분 다운타임** | **30분 다운타임, 사용자 이탈** |

### 메트릭 수집 구현

```javascript
// src/middleware/metrics.middleware.js
const prometheus = require('prom-client');

const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// HTTP 요청 카운터
const httpRequestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

// HTTP 요청 지속 시간 히스토그램
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// 활성 요청 게이지
const activeRequests = new prometheus.Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests',
});

function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();
  activeRequests.inc();

  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });
    end({ method: req.method, path: req.route?.path || req.path });
    activeRequests.dec();
  });

  next();
}

// 메트릭 엔드포인트
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.send(await prometheus.register.metrics());
});
```

### 모니터링 임계값 가이드

| 메트릭 | 정상 | 주의 (Warning) | 심각 (Critical) | 조치 |
|-------|------|---------------|----------------|------|
 | 응답 시간 (p95) | < 200ms | 200~500ms | > 500ms | Auto-scaling, 코드 최적화 |
| 에러율 (5xx) | < 0.1% | 0.1~1% | > 1% | 롤백, 디버깅 |
| 활성 요청 수 | < 100 | 100~500 | > 500 | Auto-scaling |
| CPU 사용률 | < 60% | 60~80% | > 80% | Scale up/out |
| 메모리 사용률 | < 70% | 70~85% | > 85% | 메모리 누수 검사 |
| 디스크 사용률 | < 70% | 70~85% | > 85% | 로그 로테이션, 디스크 증설 |
| 힙 메모리 (Node.js) | < 200MB | 200~400MB | > 400MB | GC 최적화, 메모리 누수 탐지 |

## Sentry 에러 트래킹

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,

  // 에러 샘플링 (고트래픽 서비스)
  // sampleRate: 0.1,  // 10%만 수집
});

// Express 미들웨어
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// 모든 라우트 후에 에러 핸들러 추가
app.use(Sentry.Handlers.errorHandler());

// 수동 에러 보고
try {
  await processPayment(order);
} catch (error) {
  Sentry.captureException(error, {
    tags: { service: 'payment', orderId: order.id },
    extra: { amount: order.total, userId: order.userId },
  });
  throw error;  // 또는 적절히 처리
}
```

**Sentry로 보는 장애 트렌드 예시:**

```
주간 에러 발생 추이 (가상 데이터)
 40 |                                      ■
 30 |                    ■        ■        ■        ■
 20 |  ■        ■        ■        ■        ■        ■
 10 |  ■  ■     ■  ■     ■  ■     ■  ■     ■  ■     ■
  0 +───1───2───3───4───5───6───7───8───9───10──11──12 (주)
     ↑                         ↑                    ↑
   Sentry 도입            메모리 누수 수정     타입스크립트 마이그레이션
   (에러 35% 감소)        (에러 60% 감소)      (에러 45% 추가 감소)
```

## 로깅 — ELK 스택

### Winston 구조화된 로깅

```javascript
// src/lib/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'myapp',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.prettyPrint(),
    }),
  ],
});

module.exports = logger;

// 사용 예
logger.info('사용자 로그인 성공', {
  userId: '123',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  loginMethod: 'oauth',
});
```

### 로그 레벨별 사용 가이드

| 레벨 | 사용 시점 | 예시 |
|------|----------|------|
| `error` | 복구 불가능한 오류 | DB 연결 실패, 예외 발생 |
| `warn` | 복구 가능한 문제, 주의 | Rate limit 도달, 재시도 성공 |
| `info` | 중요한 비즈니스 이벤트 | 사용자 가입, 결제 완료, 배포 |
| `debug` | 개발 중 상세 정보 | SQL 쿼리, API 응답 |
| `silly` | 극도로 상세한 디버깅 | 루프 반복, 함수 입출력 |

## Slack 알림

```javascript
// src/lib/notifications.js
const axios = require('axios');

class SlackNotifier {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendDeploymentNotification({ status, version, environment }) {
    const color = status === 'success' ? '#36a64f' : '#ff0000';
    const emoji = status === 'success' ? '✅' : '❌';

    await axios.post(this.webhookUrl, {
      attachments: [{
        color,
        title: `${emoji} 배포 ${status === 'success' ? '성공' : '실패'}`,
        fields: [
          { title: '버전', value: version, short: true },
          { title: '환경', value: environment, short: true },
          { title: '배포 시간', value: new Date().toISOString(), short: true },
        ],
        footer: 'Node.js DevOps',
        ts: Math.floor(Date.now() / 1000),
      }],
    });
  }
}

// 사용 예
const notifier = new SlackNotifier(process.env.SLACK_WEBHOOK_URL);
notifier.sendDeploymentNotification({
  status: 'success',
  version: 'v2.3.1',
  environment: 'production',
});
```

## 🎉 Node.js 과정 완료 과정 완료

축하합니다! Node.js 기초부터 고급까지 18주 과정 완료 과정을 모두 마치셨습니다.

| 과정 | 주제 | 강의 수 | 학습 내용 |
|------|------|--------|---------|
| Basic 1-6 | Node.js 소개 ~ npm | 6개 | 모듈, 비동기, 파일 시스템, HTTP 서버, 패키지 관리 |
| Intermediate 7-12 | Express ~ WebSocket | 6개 | 데이터베이스, REST API, JWT 인증, 미들웨어, 실시간 통신 |
| Advanced 13-18 | 성능 ~ DevOps | 6개 | 보안, 테스트, Docker, TypeScript, CI/CD, 모니터링 |

### 다음 단계 제안

1. **실제 프로젝트** — 배운 내용을 바탕으로 실제 프로젝트를 만들어보세요
2. **오픈 소스 기여** — 인기 Node.js 프로젝트(Express, Next.js, Prisma)에 기여해보세요
3. **NestJS 학습** — 더 구조화된 Node.js 프레임워크에 도전해보세요
4. **Serverless** — AWS Lambda, Cloud Functions로 서버리스 아키텍처 학습

> 여정은 끝났지만, 학습은 계속됩니다. Happy Coding! 🚀

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>CI/CD가 꼭 필요한가요?</strong></summary>

소규모 개인 프로젝트라면 필수는 아니지만, 팀 프로젝트나 프로덕션 서비스에는 반드시 필요합니다. CI/CD가 없으면 빌드, 테스트, 배포를 수동으로 해야 하고, 사람의 실수가 발생할 가능성이 **약 3~5배** 높아집니다(DORA 리포트 기준). GitHub Actions는 퍼블릭 저장소에 **무료**이므로 작은 프로젝트부터 적용해보는 것을 추천합니다.
</details>

<details>
<summary><strong>모니터링 도구는 무엇을 선택해야 하나요?</strong></summary>

초기에는 **Sentry** (에러 트래킹)와 **PM2 monit** (서버 상태)만으로도 충분합니다. 서비스가 성장하면 Prometheus + Grafana (메트릭)와 ELK (로깅)를 추가하고, 더 나아가 Datadog이나 New Relic 같은 유료 APM 솔루션을 고려할 수 있습니다. 단계별 비용을 고려하면 다음과 같습니다:

| 단계 | 도구 | 예상 비용 (월) | 적합한 규모 |
|------|------|--------------|-----------|
| 시작 | Sentry (무료) + PM2 monit | $0 | 일일 요청 < 10만 |
| 성장 | + Prometheus + Grafana | $0 (자체 호스팅) | 일일 요청 < 100만 |
| 확장 | + Datadog 또는 New Relic | $100~500 | 일일 요청 > 100만 |
</details>

<details>
<summary><strong>무중단 배포는 모든 서비스에 필요한가요?</strong></summary>

트래픽이 적은 서비스나 내부 도구라면 짧은 다운타임을 감수하고 단순 재시작으로도 충분합니다. 하지만 사용자가 많은 서비스라면 Blue-Green이나 롤링 배포를 도입하는 것이 좋습니다. SLA(Service Level Agreement)가 99.9% 이상인 서비스는 연간 다운타임이 **8.76시간 이하**로 제한되므로, 무중단 배포가 사실상 필수입니다.
</details>

<details>
<summary><strong>Docker 없이 배포해도 되나요?</strong></summary>

가능하지만 권장하지 않습니다. Docker 없이 배포하면 "내 컴퓨터에서는 잘 되는데..." 문제가 자주 발생합니다. Docker를 사용하면:
- 개발/스테이징/프로덕션 환경이 **완전히 동일**
- Node.js 버전 관리가 **자동화**됨
- **롤백**이 `docker compose up -d app-v1` 한 줄
- **확장**이 `docker compose up -d --scale app=5` 한 줄
</details>

## 요약

- **배포 전략** — 단순 재시작(개발) → Blue-Green(프로덕션) → Canary(대규모) 단계적 발전
- **CI/CD** — GitHub Actions로 test → build → deploy 자동화, 캐시로 60% 속도 향상
- **클라우드** — GCP Cloud Run(초기/간단) → AWS Elastic Beanstalk(성장/커스터마이징)
- **PM2** — cluster 모드로 멀티코어 활용 (4코어 기준 약 3.75배 성능 향상)
- **모니터링** — Prometheus 메트릭 + Grafana 대시보드 + Sentry 에러 트래킹
- **로깅** — Winston 구조화된 로깅 + ELK 스택 중앙화
- **무중단 배포** — Blue-Green 배포로 다운타임 0, 즉시 롤백 가능
- **알림** — Slack Webhook으로 배포 상태 및 장애 알림 (SLA 99.9% 대응)
