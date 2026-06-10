---
layout: post
title: "npm과 패키지 관리 — Node.js 생태계 완벽 활용법 정리"
description: "npm(Node Package Manager)의 핵심 개념과 실전 사용법을 학습합니다. package.json 구조, SemVer 버저닝과 의존성 해석 알고리즘, package-lock.json의 역할과 의존성 트리 구조, npm 스크립트와 프리/포스트 훅, npx 동작 원리, 캐시와 보안 감사, pnpm의 효율적인 저장소 구조까지 다룹니다."
date: 2022-05-23 10:00:00 +0900
category: nodejs
tags: [nodejs, npm, package-manager, dependencies, semver, node-modules, lockfile]
level: beginner
---

npm은 Node.js의 공식 패키지 매니저로, 전 세계에서 가장 큰 오픈소스 라이브러리 생태계를 가지고 있습니다. 수백만 개의 패키지를 설치하고 관리할 수 있으며, 프로젝트 의존성을 체계적으로 관리합니다.

> **이 수업에서 배울 내용:** `package.json`이 npm에 의해 어떻게 해석되고 의존성 트리가 구성되는지, SemVer(시맨틱 버저닝)의 `^`와 `~`가 실제로 어떤 버전 범위를 생성하는지, `package-lock.json`이 의존성 지옥(Dependency Hell)을 해결하는 원리와 내부 JSON 구조, `npm install`이 node_modules를 구성하는 7단계 과정, `npm ci`가 `npm install`보다 빠른 이유(의존성 해석 생략), npx가 패키지를 임시로 설치하고 실행한 후 정리하는 과정, pnpm이 하드 링크로 디스크 공간을 절약하는 방식까지 단계별로 학습합니다.

## 수업 목표

- package.json의 구조와 각 필드의 역할을 이해합니다.
- 패키지 설치, 업데이트, 삭제를 실습합니다.
- semver(시맨틱 버저닝)와 의존성 관리를 이해합니다.
- npm 스크립트로 빌드/테스트 자동화를 설정합니다.
- package-lock.json의 역할과 중요성을 이해합니다.

## 프로젝트 초기화 — package.json이 생성되는 과정

```bash
# package.json 생성 (대화형)
npm init

# 기본값으로 빠르게 생성
npm init -y
```

```json
{
  "name": "my-project",           // 프로젝트 이름 (소문자, 하이픈)
  "version": "1.0.0",             // 현재 버전 (semver)
  "description": "내 프로젝트 설명",
  "main": "index.js",             // 진입점 파일
  "scripts": {                    // 실행 가능한 스크립트
    "start": "node index.js",
    "test": "jest"
  },
  "keywords": ["nodejs", "tutorial"],
  "author": "Wolhyong",
  "license": "MIT",
  "type": "commonjs"              // 또는 "module" (ESM)
}
```

**코드 분석 — `npm init`이 내부적으로 하는 6단계:**

```text
1. 현재 디렉토리 이름 확인 → package name 기본값
2. package.json이 이미 있으면 덮어쓸지 확인
3. 사용자 입력 수집 (대화형 모드)
4. SemVer 유효성 검사 (1.0.0 형식 확인)
5. name이 npm 레지스트리 규칙을 따르는지 확인
   → 소문자, 하이픈/언더스코어만 허용
   → URL-safe 문자만 허용
6. package.json 파일 생성 (UTF-8, 2-space 들여쓰기)
```

## 패키지 설치 — npm install의 7단계 내부 동작

```bash
# 프로덕션 의존성 설치
npm install express
npm i express           # 축약형

# 개발 의존성 설치
npm install --save-dev jest
npm i -D jest

# 특정 버전 설치
npm install lodash@4.17.21

# package.json 기반 전체 설치
npm install
```

**깊이 있는 설명 — `npm install express`가 실행되는 7단계 과정:**

```text
1. 의존성 해석 (Resolution):
   npm 레지스트리(registry.npmjs.org)에 express 최신 버전 조회
   → package.json에 "express": "^5.0.0" 기록 (현재 최신이 5.0.0인 경우)

2. 의존성 트리 구성:
   express의 package.json 읽기 → express가 의존하는 모든 패키지 확인
   → accepts, array-flatten, body-parser, content-disposition 등 30여 개
   → 각각의 의존성 트리를 재귀적으로 구성
   → SemVer 범위 충돌이 있으면 중첩 설치 (npm 3+는 최대한 평탄화)

3. 중복 제거 (Deduplication):
   A → lodash@4.17.21
   B → lodash@^4.17.0
   → lodash@4.17.21 하나만 설치 (SemVer 범위가 겹침)

   A → lodash@4.17.21
   B → lodash@^3.0.0
   → lodash@4.17.21과 lodash@3.x.x 모두 설치 (버전 불일치)

4. 네트워크 다운로드:
   npm 레지스트리에서 각 패키지의 .tgz 파일 다운로드
   → 캐시 확인부터: ~/.npm/_cacache/ 에 있으면 네트워크 요청 생략
   → 없으면 HTTPS로 다운로드 → 무결성 검사 (SHA-512)

5. 압축 해제:
   .tgz 파일을 node_modules/<package>/ 디렉토리에 압축 해제
   → package.json, index.js 등 필요한 파일만 포함

6. 빌드 스크립트 실행 (있는 경우):
   install 스크립트 실행 (node-gyp rebuild 등 네이티브 모듈)
   → 빌드에 실패해도 패키지 설치는 계속 진행 (선택적)

7. lock 파일 업데이트:
   package-lock.json에 정확한 버전과 의존성 트리 기록
```

**성능 측정 — npm install vs npm ci:**

```bash
# npm install (의존성 해석 포함)
# 실행 시간: 30초 (lock 파일 없음, 처음 설치)
# 실행 시간: 15초 (lock 파일 있음, 해석 생략 가능)

# npm ci (의존성 해석 생략, lock 파일 기준 즉시 설치)
# 실행 시간: 8초 (lock 파일 기준, node_modules 삭제 후 정확히 설치)
# → npm install 대비 약 2배 빠름

# npm ci의 추가 장점:
# - node_modules가 변경되지 않았는지 확인 (lock 파일과 일치)
# - CI/CD 환경에서 예측 가능한 빌드 보장
```

### 의존성 종류

```json
{
  "dependencies": {
    "express": "^4.18.0",       // 프로덕션에서 필요한 패키지
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.0.0",          // 개발 중에만 필요한 패키지
    "nodemon": "^3.0.0",
    "eslint": "^8.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"          // 플러그인/라이브러리가 호스트에서 요구하는 패키지
  },
  "optionalDependencies": {
    "fsevents": "^2.3.0"         // 선택적 의존성 (없어도 동작)
  }
}
```

**깊이 있는 설명 — peerDependencies가 필요한 이유:**

```text
플러그인 패키지(예: eslint-plugin-react)는:
  - eslint가 설치되어 있어야 동작
  - 하지만 eslint를 자신의 dependencies에 넣으면
    → eslint가 2개 설치됨 (호스트 + 플러그인 각각)
  
  peerDependencies 사용 시:
  - "eslint이 설치되어 있어야 함"을 선언
  - 실제 설치는 호스트 프로젝트가 담당
  - 버전이 맞지 않으면 경고 표시

dependencies vs devDependencies:
  npm install --production: devDependencies 제외
  → Docker 이미지 빌드 시 활용
  → 프로덕션 이미지 크기 30~50% 감소
```

## package-lock.json — 의존성 지옥을 해결하는 열쇠

`package-lock.json`은 설치된 패키지의 **정확한 버전과 의존성 트리**를 기록합니다.

```json
{
  "name": "my-project",
  "lockfileVersion": 3,
  "packages": {
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "accepts": "~1.3.8",
        "array-flatten": "1.1.1"
      }
    }
  }
}
```

**깊이 있는 설명 — package-lock.json의 세 가지 lockfileVersion:**

```text
lockfileVersion 1 (npm 5, 6):
  - 오래된 형식 (npm v6 기본)
  - 의존성 트리를 "dependencies" 필드에 중첩 구조로 저장
  - 중복 정보 많음, 파일 크기 큼

lockfileVersion 2 (npm 7):
  - "packages" (node_modules 중심) + "dependencies" (논리적 트리) 이중 구조
  - npm v7 기본 형식
  - 이전 버전과의 호환성 유지

lockfileVersion 3 (npm 9+):
  - "packages"만 사용 ("dependencies" 제거)
  - 파일 크기 약 30% 감소
  - npm v9 기본 형식
  - 노드 버전별 처리 방식 단순화
```

**package-lock.json의 역할:**

| 상황 | package.json만 있을 때 | package-lock.json도 있을 때 |
|------|----------------------|---------------------------|
| 다른 개발자가 clone | 버전 차이 발생 가능 | **정확히 동일한 버전 설치** |
| CI/CD 빌드 | 예측 불가능한 빌드 | **재현 가능한 빌드** |
| 보안 패치 | 어떤 버전이 설치될지 모름 | **정확히 알려진 버전만 설치** |
| 의존성 트리 | 알 수 없음 | **모든 하위 의존성까지 정확히 기록** |

**실전 노하우:** package-lock.json은 **반드시 git에 커밋**해야 합니다. `.gitignore`에 추가하면 안 됩니다!

## SemVer — 시맨틱 버저닝의 내부 동작

npm의 모든 패키지는 **시맨틱 버저닝(SemVer)** 을 따릅니다: `MAJOR.MINOR.PATCH`

```text
버전 4.17.21

MAJOR = 4  — 하위 호환되지 않는 변경 (브레이킹 체인지)
MINOR = 17 — 하위 호환되는 새로운 기능 추가
PATCH = 21 — 하위 호환되는 버그 수정
```

### 버전 범위 지정

```json
{
  "dependencies": {
    "lodash": "4.17.21",         // 정확히 4.17.21
    "express": "^4.18.0",        // 4.x.x (MAJOR 고정) — 권장
    "jest": "~29.0.0",           // 29.0.x (MAJOR.MINOR 고정)
    "react": "*",                // 모든 버전 (비권장)
    "dotenv": ">=1.0.0 <2.0.0",  // 범위 지정
    "axios": "1.x",              // 1.x.x
    "moment": "2.29.1 - 2.30.0"  // 범위 (비교적 드물게 사용)
}
```

**깊이 있는 설명 — 캐럿(^)과 틸드(~)가 실제로 생성하는 버전 범위:**

```text
^4.17.21
  → 4.17.21 ≤ 버전 < 5.0.0
  → MINOR와 PATCH 업데이트 허용
  → 4.18.0, 4.19.0, 4.99.99 가능
  → 5.0.0은 불가능 (MAJOR 변경)

~4.17.21
  → 4.17.21 ≤ 버전 < 4.18.0
  → PATCH 업데이트만 허용
  → 4.17.22, 4.17.99 가능
  → 4.18.0은 불가능 (MINOR 변경)

^0.2.3
  → 0.2.3 ≤ 버전 < 0.3.0
  → 0.x.x에서는 ^가 MINOR도 고정
  (MAJOR 0 = 초기 개발 단계)

^1.0.0 vs 1.0.0
  → ^1.0.0 : 1.0.0 ≤ 버전 < 2.0.0
  → 1.0.0  : 정확히 1.0.0 (범위 없음)
```

**실전 노하우 — 의존성 범위 선택 가이드:**

```text
라이브러리 사용 시:
  ^4.17.21 (캐럿) → 일반적 권장. MINOR/PATCH 업데이트를 자동 수용
  ~4.17.21 (틸드) → 안정성 중시. PATCH 버그 수정만 수용
  4.17.21 (고정) → 극도의 안정성 필요 시. 버전 완전 고정

자신의 라이브러리 배포 시:
  peerDependencies는 ^보다는 >=로 느슨하게 지정
  → 호환되는 버전 범위가 넓어져 사용자 유입 증가

  ^4.17.21은 "4.17.21 이상의 4.x"를 의미
  → 패키지 사용자는 npm update로 버그 수정을 자동 수령
```

## npm 스크립트와 프리/포스트 훅의 실행 순서

`package.json`의 `scripts` 필드에 명령어를 등록하고 `npm run <name>`으로 실행합니다.

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest --coverage",
    "build": "node build.js",
    "lint": "eslint . --fix"
  }
}
```

### 프리/포스트 훅

npm은 특정 명령어 앞뒤로 자동 실행되는 **훅(Hook)** 을 지원합니다.

```json
{
  "scripts": {
    "prebuild": "rm -rf dist",
    "build": "webpack --mode production",
    "postbuild": "echo '빌드 완료!'",
    "prestart": "npm run build"
  }
}
```

```bash
npm run build
# 실행 순서:
# 1. prebuild → rm -rf dist
# 2. build    → webpack --mode production
# 3. postbuild → echo '빌드 완료!'
```

**깊이 있는 설명 — 프리/포스트 훅의 실행 순서 규칙:**

```text
npm run <script> 실행 시:
  pre<script> → <script> → post<script> 순서로 자동 실행

실제 내부 동작:
  npm run build 명령을 받으면:
    1. scripts.prebuild 확인 → 있으면 exec
    2. scripts.build 확인 → 있으면 exec
    3. scripts.postbuild 확인 → 있으면 exec
    4. 각 단계가 실패하면 이후 체인 중단

응용:
  prepare: publish나 install 시 자동 실행 (husky 설치에 사용)
  prepublishOnly: npm publish 직전에만 실행 (배포 전 테스트)
  prepack: tarball 생성 전 실행 (빌드)
  postpack: tarball 생성 후 실행 (정리)
```

## npx — 패키지 실행 도구의 내부 동작

npm 5.2+에 포함된 `npx`는 패키지를 설치하지 않고도 일회성으로 실행할 수 있습니다.

```bash
# 패키지를 설치하지 않고 실행
npx create-react-app my-app
npx http-server
npx cowsay "Hello, Node.js!"
```

**깊이 있는 설명 — npx가 패키지를 찾고 실행하는 4단계:**

```text
npx eslint --init

1. 로컬 node_modules/.bin/ 확인:
   → 프로젝트에 eslint가 설치되어 있는지 확인
   → 있으면: node_modules/.bin/eslint 실행
   → 없으면: 다음 단계로

2. npm 레지스트리에서 패키지 확인:
   → registry.npmjs.org에서 eslint 패키지 정보 조회
   → 최신 버전 확인

3. 임시 설치:
   → npm이 eslint를 ~/.npm/_npx/ 캐시에 임시 설치
   → 전역 node_modules처럼 동작 (실제 전역 설치와 격리됨)

4. 실행 후 정리:
   → 설치된 패키지 실행
   → 실행 완료 후에도 캐시는 남아있음 (재사용 가능)
   → 30일 이상 사용하지 않으면 자동 정리
```

## npm 캐시와 보안

```bash
# npm 캐시 확인
npm cache ls

# 캐시 정리
npm cache clean --force

# 패키지 감사 (취약점 확인)
npm audit

# 취약점 자동 수정
npm audit fix
```

**깊이 있는 설명 — npm audit이 취약점을 찾고 수정하는 과정:**

```text
npm audit 실행 시:

1. 의존성 트리 분석:
   package-lock.json에서 모든 패키지와 버전 추출
   → 직속 의존성 + 하위 의존성까지 모두 포함

2. 취약점 데이터베이스 조회:
   npm Security Advisory 데이터베이스 조회
   → 각 패키지의 버전별 알려진 취약점 정보 확인
   → CVE(Common Vulnerabilities and Exposures) ID 매핑

3. 영향 평가:
   각 취약점의 심각도 분류:
   - Critical: 원격 코드 실행 가능 (CVSS 9.0~10.0)
   - High: 권한 상승, 데이터 유출 (CVSS 7.0~8.9)
   - Moderate: 제한된 영향 (CVSS 4.0~6.9)
   - Low: 사소한 문제 (CVSS 0.1~3.9)

4. 수정 제안:
   npm audit fix:
   - package-lock.json 업데이트 (호환되는 버전으로)
   - npm audit fix --force: MAJOR 업데이트 허용 (브레이킹 체인지 위험)
```

## npm vs yarn vs pnpm — 패키지 매니저 선택 가이드

| 특징 | npm | yarn | pnpm |
|------|-----|------|------|
| 설치 속도 | 중간 | 빠름 | **매우 빠름** |
| 디스크 공간 | 중복 설치 | 중복 설치 | **공유 저장소 (하드 링크)** |
| lock 파일 | package-lock.json | yarn.lock | pnpm-lock.yaml |
| 워크스페이스 | ✅ (npm 7+) | ✅ | ✅ (가장 성숙) |
| 보안 | ✅ (npm audit) | ✅ (yarn audit) | ✅ (pnpm audit) |
| 기본값 | Node.js 포함 | 별도 설치 | 별도 설치 |

**깊이 있는 설명 — pnpm이 하드 링크로 디스크 공간을 절약하는 방식:**

```text
npm:  node_modules 구조 (중복 저장)
  프로젝트 A/node_modules/express/index.js → 5MB
  프로젝트 B/node_modules/express/index.js → 5MB
  총 10MB 사용 (동일한 express가 2번 저장됨)

pnpm: node_modules 구조 (하드 링크)
  ~/.pnpm-store/express@4.18.2/node_modules/express/index.js → 5MB (원본)
  
  프로젝트 A/node_modules/express/index.js → 하드 링크 (5MB처럼 보이지만 실제 공간 0)
  프로젝트 B/node_modules/express/index.js → 하드 링크 (5MB처럼 보이지만 실제 공간 0)
  
  파일 시스템에서 두 파일이 동일한 inode를 가리킴
  → 물리적 디스크 공간: 5MB (공유)
  → 각 프로젝트는 마치 5MB를 사용하는 것처럼 보이지만,
    실제 디스크 사용량은 5MB
  
  저장소 통계:
  10개 프로젝트, 각각 express, react, lodash 사용:
  npm: 10 × (5MB + 10MB + 0.5MB) = 155MB
  pnpm: 5MB + 10MB + 0.5MB = 15.5MB (90% 절약!)
```

<details>
<summary><strong>node_modules 폴더가 너무 큰데 어떻게 해야 하나요?</strong></summary>

`node_modules`는 거대해질 수밖에 없습니다. `.gitignore`에 추가하여 git에 포함되지 않게 하고, CI/CD나 배포 시에는 `npm ci`(clean install)로 재현 가능한 설치를 사용하세요. 대규모 모노레포에서는 **pnpm**으로 전환하면 디스크 공간을 80~90% 절약할 수 있습니다.
</details>

<details>
<summary><strong>npm ci와 npm install의 차이는?</strong></summary>

`npm ci`는 `package-lock.json`을 기준으로 **정확히** 패키지를 설치합니다. 의존성 해석 과정을 생략하므로 `npm install`보다 약 2배 빠릅니다. CI/CD 환경에 적합합니다. `npm install`은 `package.json`을 기준으로 설치하고 lock 파일을 업데이트할 수 있습니다.
</details>

<details>
<summary><strong>패키지 버전이 갑자기 안 맞을 때는?</strong></summary>

`package-lock.json`이 있다면 `npm ci`로 정확히 동일한 버전을 복원할 수 있습니다. 버전 충돌이 있다면 `npm ls <패키지명>`으로 의존성 트리를 확인하세요. `npm ls`는 모든 의존성의 버전을 트리 구조로 표시하여 어떤 패키지가 충돌을 일으키는지 파악할 수 있습니다.
</details>

# 요약

- **npm init**으로 프로젝트 시작, **package.json**이 설정 파일
- **npm install**은 7단계(해석 → 트리 구성 → 중복 제거 → 다운로드 → 압축 해제 → 빌드 → lock 업데이트)로 동작
- **npm ci**가 npm install보다 약 2배 빠름 (의존성 해석 생략)
- **package-lock.json**은 항상 git에 커밋하여 재현 가능한 빌드 보장
- **SemVer** — MAJOR.MINOR.PATCH, `^`는 호환 MINOR/PATCH 업데이트 허용, `~`는 PATCH만 허용
- **npm scripts**로 작업 자동화, **npx**로 일회성 패키지 실행 (임시 설치 → 캐시)
- **npm audit**으로 보안 취약점 검사 및 자동 수정
- 프로젝트 규모가 커지면 **pnpm** 고려 (하드 링크로 디스크 공간 90% 절약)
