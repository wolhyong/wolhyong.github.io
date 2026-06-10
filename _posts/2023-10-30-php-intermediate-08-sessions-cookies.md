---
layout: post
title: "PHP 세션과 쿠키 — 세션 핸들러, 쿠키 보안, 캐시 제어"
description: "PHP의 세션과 쿠키 시스템을 HTTP 프로토콜과 SAPI 레벨에서 심층 학습합니다. 세션 핸들러(파일/Redis/Memcached)가 session_set_save_handler()로 등록되는 과정과 세션 GC(Garbage Collection)의 확률적 실행(gc_probability / gc_divisor), 세션 고정 공격(Session Fixation) 방지를 위한 session_regenerate_id(), 쿠키의 HttpOnly/Secure/SameSite 플래그가 Set-Cookie 헤더에 설정되는 방식, PHP의 출력 버퍼링과 setcookie() 호출 제약(flush 전에 호출), Cache-Control 헤더를 통한 브라우저 캐시 제어를 다룹니다."
date: 2023-10-30 10:00:00 +0900
category: php
tags: [php, session, cookie, security, cache-control, session-handler]
level: intermediate
---

PHP의 세션과 쿠키는 HTTP의 무상태(stateless) 특성을 보완하여 사용자 상태를 유지하는 핵심 메커니즘입니다.

> **💡 핵심 정리** · PHP 세션은 기본적으로 파일 기반 핸들러(`SessionHandler`)로 `/tmp/sess_{session_id}` 파일에 `serialize()`된 데이터를 저장하고 요청 종료 시 `write()`로 저장합니다. Set-Cookie 응답 헤더는 `session_set_cookie_params()`로 HttpOnly(JavaScript 접근 차단), Secure(HTTPS 전용), SameSite(CSRF 방지) 플래그를 설정합니다. `session_regenerate_id(true)`는 세션 ID를 새로 발급하고 이전 세션을 삭제하여 세션 고정 공격을 방어합니다.

---

## 📚 수업 목표

- 세션 핸들러의 동작을 이해합니다.
- 쿠키 보안 플래그를 이해합니다.
- 세션 고정 공격 방어를 이해합니다.
- 캐시 제어를 이해합니다.
- 사용자 정의 세션 핸들러를 구현합니다.

## 세션 기본

```php
<?php
// 세션 설정
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.gc_maxlifetime', 3600); // 1시간

session_start();

// 세션 데이터
$_SESSION['user_id'] = 42;
$_SESSION['last_access'] = time();

// 세션 ID 갱신 (권한 변경 시)
session_regenerate_id(true);

// 세션 읽기
$userId = $_SESSION['user_id'] ?? null;

// 세션 제거
session_destroy();
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 세션과 쿠키 중 어떤 것을 사용해야 하나요?</strong></summary>

**세션은 서버에 데이터를 저장**하고 클라이언트에는 세션 ID(쿠키)만 전송하므로 보안에 유리합니다. **쿠키는 클라이언트에 직접 데이터를 저장**하므로 용량 제한(4KB)이 있고 위변조 가능성이 있습니다. 민감한 데이터(인증, 사용자 정보)는 세션에 저장하고, 비민감한 설정(언어, 테마)이나 장기 유지가 필요한 정보는 쿠키에 저장하세요. JWT(JSON Web Token)는 쿠키에 저장하면서도 서명으로 위변조를 방지하는 대안입니다.
</details>

<details>
<summary><strong>Q: PHP 세션은 확장 가능한가요?</strong></summary>

기본 파일 기반 세션은 **단일 서버에서만 동작**합니다. 여러 서버로 확장하려면 사용자 정의 세션 핸들러가 필요합니다. `session_set_save_handler()`로 Redis, Memcached, Database 같은 공유 저장소를 사용할 수 있습니다. Redis 세션 핸들러는 `session.save_handler = redis`, `session.save_path = 'tcp://127.0.0.1:6379'`로 설정 가능합니다. Redis는 자동 만료(TTL)를 지원하므로 GC를 별도로 구현할 필요가 없습니다.
</details>

<details>
<summary><strong>Q: SameSite 쿠키의 Strict와 Lax 차이는 무엇인가요?</strong></summary>

**Strict**: 모든 크로스 사이트 요청에서 쿠키가 전송되지 않습니다. 가장 안전하지만 사용자 경험이 나쁠 수 있습니다(타 사이트 링크로 접속 시에도 쿠키 미전송). **Lax**(기본): Top-level GET 요청(링크 클릭, URL 직접 입력)에서는 쿠키가 전송되고, POST/iframe/이미지 등에서는 미전송됩니다. CSRF 방어에 효과적이면서도 사용자 경험을 해치지 않는 균형 잡힌 설정입니다. 민감한 작업(로그인, 결제)에는 추가 CSRF 토큰 검증을 권장합니다.
</details>

<details>
<summary><strong>Q: setcookie()가 session_start()보다 먼저 호출되어야 하나요?</strong></summary>

`setcookie()`는 **출력이 시작되기 전**에 호출되어야 합니다(PHP가 HTTP 헤더를 전송하기 전). `session_start()`도 Set-Cookie 헤더를 전송하므로, 둘 다 HTML 출력보다 먼저 호출되어야 합니다. 출력 버퍼링(output_buffering)이 활성화되어 있으면 출력 후에도 쿠키/세션을 설정할 수 있지만, 의존하지 않는 것이 좋습니다. `session_start()`는 자동으로 쿠키를 설정하므로 일반적으로 `setcookie()`로 세션 ID를 수동 설정할 필요는 없습니다.
</details>

<details>
<summary><strong>Q: 세션 하이재킹을 방지하는 방법은 무엇인가요?</strong></summary>

1) **HttpOnly 쿠키**: JavaScript로 세션 ID 탈취 방지. 2) **Secure 플래그**: HTTPS에서만 쿠키 전송. 3) **SameSite 플래그**: CSRF 방어. 4) **세션 ID 주기적 갱신**: 로그인 후 `session_regenerate_id(true)`로 새 ID 발급. 5) **사용자 에이전트/IP 검증**: 세션에 User-Agent/IP를 저장하고 요청마다 비교(단, IP는 NAT/프록시로 변할 수 있음). 6) **세션 만료**: `session.gc_maxlifetime`을 적절히 설정.
</details>

---

## 요약

- **세션 핸들러**: 파일(기본), Redis, Memcached — `session_set_save_handler()`로 커스텀 가능
- **쿠키 보안**: HttpOnly(JS 차단), Secure(HTTPS), SameSite(CSRF 방어)
- **세션 고정 방어**: `session_regenerate_id(true)`로 권한 변경 시 ID 갱신
- **GC(garbage collection)**: gc_probability/gc_divisor로 확률적 실행(기본 1/1000)
- **확장**: Redis 세션 핸들러로 여러 서버 간 세션 공유
