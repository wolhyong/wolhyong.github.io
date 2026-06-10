---
layout: post
title: "Nuxt.js 보안 — CSP(Content Security Policy), CSRF 토큰, XSS 방어, Helmet 설정"
description: "Nuxt.js 애플리케이션의 보안 전략을 시스템 레벨에서 심층 학습합니다. CSP(Content Security Policy)가 Content-Security-Policy HTTP 헤더를 통해 브라우저가 로드할 수 있는 리소스의 출처를 제한하여 XSS 공격을 방지하는 과정, strict-dynamic 지시자가 인라인 스크립트에 nonce를 할당하고 nonce 값이 일치하는 스크립트만 실행을 허용하는 방식, CSRF(Cross-Site Request Forgery) 토큰이 서버에서 생성한 난수값을 form hidden 필드나 Meta 태그에 포함시켜 POST/PUT/DELETE 요청의 출처를 검증하는 과정, Helmet 미들웨어가 X-Content-Type-Options/X-Frame-Options/Strict-Transport-Security 등 11개의 보안 헤더를 자동 설정하는 방식을 다룹니다."
date: 2024-05-13 10:00:00 +0900
category: nuxtjs
tags: [nuxtjs, security, csp, csrf, xss, helmet, nonce]
level: advanced
---

Nuxt.js 애플리케이션의 보안은 CSP, CSRF, XSS 방어의 세 가지 축으로 구성됩니다.

> **핵심 정리** · CSP(Content Security Policy)는 `Content-Security-Policy` 헤더로 리소스 로딩을 제한합니다. CSRF 토큰은 POST 요청의 출처를 검증합니다. Helmet은 11개의 보안 헤더를 자동 설정합니다. `strict-dynamic`은 인라인 스크립트에 nonce를 할당하여 XSS를 방지합니다.

---

## 수업 목표

- CSP의 지시자별 동작 방식을 이해합니다.
- strict-dynamic과 nonce의 관계를 이해합니다.
- CSRF 토큰의 생성과 검증 과정을 이해합니다.
- Helmet 보안 헤더의 구성을 이해합니다.

## CSP 설정

{% raw %}```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    renderer: './server/renderer.ts'
  },
  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'strict-dynamic'", "'nonce-{{nonce}}'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'https:', 'data:'],
        'connect-src': ["'self'", 'https://api.example.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"]
      }
    }
  }
})
```{% endraw %}



CSP(Content Security Policy)는 브라우저가 로드할 수 있는 리소스의 출처를 제한하는 보안 레이어입니다. `default-src`는 다른 지시자가 설정되지 않은 모든 리소스의 기본 정책입니다. `strict-dynamic`은 `nonce` 또는 `hash`로 허용된 스크립트가 동적으로 로드하는 다른 스크립트도 신뢰하도록 합니다. `'nonce-{{nonce}}'`는 Nuxt가 각 요청에 대해 생성한 고유 nonce 값으로 대체됩니다.

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: CSP의 strict-dynamic은 왜 필요한가요?</strong></summary>

전통적인 CSP는 `'self'`로 동일 출처 스크립트를 허용하지만, 공격자가 동일 출처에 악성 스크립트를 업로드하면 우회될 수 있습니다. `strict-dynamic`은 화이트리스트 방식 대신 **신뢰 체인(trust chain)** 방식으로 동작합니다. `nonce`가 할당된 스크립트(서버가 생성한)만 실행을 허용하고, 그 스크립트가 동적으로 생성한 다른 스크립트도 자동으로 신뢰합니다. 공격자는 nonce 값을 알 수 없으므로 인라인 스크립트를 주입할 수 없습니다. Nuxt는 HTML을 생성할 때 페이지에 포함된 모든 `<script>` 태그에 자동으로 nonce를 할당합니다.
</details>

<details>
<summary><strong>Q: CSRF 공격은 어떻게 동작하고, 어떻게 방어하나요?</strong></summary>

CSRF 공격은 사용자가 로그인된 상태에서 공격자의 사이트에 방문했을 때, 공격자의 사이트가 사용자의 인증 쿠키를 포함한 요청을 대상 서버로 전송하는 방식입니다. 서버는 쿠키가 유효하므로 정상 요청으로 처리합니다. 방어 방법: (1) CSRF 토큰 — 서버가 form에 포함시킨 난수 토큰을 검증합니다. (2) SameSite 쿠키 — 쿠키의 `SameSite=Strict` 또는 `SameSite=Lax` 속성으로 크로스 사이트 요청에서 쿠키가 전송되지 않도록 합니다. (3) Origin/Referer 검증 — 요청의 `Origin` 헤더가 신뢰할 수 있는 출처인지 확인합니다. Nuxt에서는 `useCookie()`의 `sameSite` 옵션으로 SameSite 속성을 설정할 수 있습니다.
</details>

<details>
<summary><strong>Q: Helmet이 설정하는 주요 보안 헤더는 무엇인가요?</strong></summary>

Helmet은 Nitro 서버에 다음 보안 헤더를 자동으로 추가합니다: `X-Content-Type-Options: nosniff`(MIME 타입 스니핑 방지), `X-Frame-Options: DENY`(클릭재킹 방지), `Strict-Transport-Security`(HSTS, HTTPS 강제), `X-DNS-Prefetch-Control: off`, `X-Download-Options: noopen`, `X-Permitted-Cross-Domain-Policies: none`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Referrer-Policy`, `X-XSS-Protection: 0`. Nuxt 4에서는 `nuxt-security` 모듈로 Helmet과 CSP를 함께 관리할 수 있습니다.
</details>

<details>
<summary><strong>Q: XSS 공격을 CSP 외에 방어하는 방법은 무엇인가요?</strong></summary>

(1) **출력 인코딩**: 사용자 입력을 HTML에 출력할 때 `v-html` 대신 {% raw %}`{{ }}`{% endraw %} 머스태시 문법을 사용합니다. Vue는 자동으로 HTML 엔티티 인코딩을 수행합니다. (2) **입력 검증**: 서버에서 `z.string().max(1000).sanitize()`로 입력 길이를 제한하고, DOMPurify로 HTML을 살균합니다. (3) **Content-Type 검증**: 파일 업로드 시 실제 파일 내용(매직 넘버)을 확인하여 MIME 타입을 검증합니다. (4) **쿠키 보안**: `httpOnly: true`, `secure: true`, `sameSite: 'strict'`로 쿠키 속성을 설정합니다.
</details>

---

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **CSP** | 리소스 로딩 제한 | Content-Security-Policy 헤더 → 브라우저에서 출처 검증 |
| **strict-dynamic** | 신뢰 체인 | nonce 기반 인라인 스크립트 허용 |
| **CSRF 토큰** | 요청 출처 검증 | 서버 생성 난수 → form 포함 → POST 검증 |
| **SameSite 쿠키** | 크로스 사이트 쿠키 차단 | Strict/Lax 모드로 외부 사이트 요청 쿠키 전송 제한 |
| **Helmet** | 보안 헤더 자동 설정 | 11개 HTTP 헤더 → 클릭재킹/XSS/HSTS 방어 |

## 다음 수업

다음 글에서는 테스팅 — Vitest와 Playwright로 Nuxt 애플리케이션을 테스트하는 방법을 배웁니다.
