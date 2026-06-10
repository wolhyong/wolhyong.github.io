---
layout: post
title: "자바스크립트 개발 도구 - ESLint, Prettier, TypeScript 도입 정리"
description: "ESLint, Prettier 설정과 자동화, TypeScript 점진적 도입, 빌드 도구 비교를 실전 예제와 함께 학습합니다."
date: 2016-12-26 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, eslint, prettier, dev-tools, 웹]
---

올바른 개발 도구는 코드 품질을 유지하고 팀 협업 효율을 높이는 데 필수적입니다. 자바스크립트 프로젝트에서 꼭 알아야 할 도구들을 정리합니다.

## ESLint — 코드 품질 검사

```json
// eslint.config.js
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
      "eqeqeq": "error",
      "prefer-const": "error"
    }
  }
];
```

```bash
npx eslint src/ --fix  # 자동 수정
```

## Prettier — 코드 포맷팅

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2
}
```

ESLint와 Prettier를 함께 사용할 때는 `eslint-config-prettier`로 규칙 충돌을 방지합니다.

## TypeScript 점진적 도입

```bash
npm install -D typescript @types/node
npx tsc --init  # tsconfig.json 생성
```

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

점진적 도입은 `allowJs: true`로 기존 JS 파일부터 시작하고, 파일별로 `.ts`로 확장해 나가는 방식이 효과적입니다.

## 빌드 도구 비교

| 도구 | 특징 | 사용처 |
|------|------|--------|
| Vite | 빠른 HMR, Rollup 기반 | 개발/프로덕션 |
| esbuild | Go 기반, 극속 번들링 | 빌드 속도 중요 시 |
| Webpack | 플러그인 생태계 풍부 | 복잡한 프로젝트 |

## 마무리

- **ESLint**로 코드 품질을, **Prettier**로 일관된 포맷을 유지하세요
- **TypeScript**는 점진적으로 도입하면 기존 프로젝트에서도 부담이 적습니다
- **Vite**는 대부분의 프로젝트에서 빠르고 편리한 선택입니다
- Git hooks(husky, lint-staged)로 커밋 시 자동 검사를 설정하세요

다음 수업에서는 자바스크립트 성능 최적화 기법을 학습합니다!
