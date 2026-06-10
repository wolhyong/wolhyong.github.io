---
layout: post
title: "PHP REST API 구축 — JSON 응답, API 인증, Rate Limiting, API 버전 관리"
description: "PHP로 RESTful API를 구축하는 방법을 HTTP 프로토콜과 설계 원칙 레벨에서 심층 학습합니다. REST의 6가지 제약 조건(Uniform Interface, Stateless, Cacheable, Layered System, Code on Demand, Client-Server)과 HTTP 메서드(GET/POST/PUT/PATCH/DELETE)의 의미론적 사용, JSON 응답의 Content-Type 헤더와 CORS 설정(Origin, Access-Control-Allow-*), API 인증 방식(Bearer JWT — Header.Payload.Signature 구조, Access Token/Refresh Token 패턴), Rate Limiting의 Token Bucket/Leaky Bucket 알고리즘, API 버전 관리 전략(URI prefix vs Accept 헤더)을 다룹니다."
date: 2023-12-11 10:00:00 +0900
category: php
tags: [php, rest-api, json, jwt, rate-limiting, cors]
level: advanced
---

RESTful API는 HTTP 프로토콜의 원칙을 따르는 웹 API 설계 아키텍처로, PHP는 JSON 처리와 HTTP 헤더 제어에 강점이 있습니다.

> **💡 핵심 정리** · REST API의 무상태(Stateless) 제약은 각 요청이 모든 필요한 정보를 포함해야 함을 의미하며, 서버는 클라이언트의 세션 상태를 저장하지 않습니다. JWT(JSON Web Token) 인증은 `Header(알고리즘)` + `Payload(클레임)` + `Signature(HMAC-SHA256 또는 RSA 서명)`의 3부분을 Base64URL로 인코딩하여 Bearer 토큰으로 전송합니다. Rate Limiting의 Token Bucket 알고리즘은 고정된 속도로 토큰을 추가(bucket capacity + refill rate)하여 초과 요청을 429 Too Many Requests로 응답합니다.

---

## 📚 수업 목표

- REST 제약 조건을 이해합니다.
- JWT 기반 API 인증을 이해합니다.
- Rate Limiting 알고리즘을 이해합니다.
- CORS 설정을 이해합니다.
- API 버전 관리 전략을 이해합니다.

## JSON 응답

```php
<?php
// 간단한 REST API 라우터
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://example.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS 프리플라이트 응답
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// API 라우팅
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// 응답 헬퍼
function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

// 라우트 핸들링 예시
if ($uri === '/api/v1/users' && $method === 'GET') {
    jsonResponse(['users' => [
        ['id' => 1, 'name' => 'Alice'],
        ['id' => 2, 'name' => 'Bob'],
    ]]);
}
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: JWT Access Token과 Refresh Token의 차이는 무엇인가요?</strong></summary>

**Access Token**은 자원 접근 권한을 증명하는 단기 토큰(보통 15분~1시간)입니다. API 요청의 Authorization 헤더에 포함됩니다. 만료되면 더 이상 사용할 수 없습니다. **Refresh Token**은 장기(보통 7일~30일)로 Access Token을 재발급받기 위한 토큰입니다. 서버에 저장되며(DB 또는 Redis), 한 번 사용되면 폐기됩니다(Rotation). Refresh Token도 만료되면 재로그인이 필요합니다. 이 패턴은 Access Token의 노출 위험을 최소화하면서 사용자 경험을 유지합니다.
</details>

<details>
<summary><strong>Q: CORS(Cross-Origin Resource Sharing)는 어떻게 동작하나요?</strong></summary>

CORS는 브라우저가 다른 출처(Origin)의 리소스 요청을 제어하는 보안 메커니즘입니다. **Simple Request**(GET/POST, Content-Type: form-data/text/plain)는 Origin 헤더와 함께 직접 요청됩니다. **Preflight Request**(PUT/DELETE, 커스텀 헤더, application/json)는 실제 요청 전에 OPTIONS 메서드로 서버가 허용하는지 확인합니다. 서버는 `Access-Control-Allow-Origin`(허용 출처), `Access-Control-Allow-Methods`(허용 메서드), `Access-Control-Allow-Headers`(허용 헤더)를 응답해야 합니다.
</details>

<details>
<summary><strong>Q: Rate Limiting의 Token Bucket과 Leaky Bucket의 차이는 무엇인가요?</strong></summary>

**Token Bucket**은 고정된 속도로 버킷에 토큰을 추가하고, 각 요청이 토큰 하나를 소비합니다. 버킷이 비면 요청이 거부됩니다(429). 버스트 트래픽을 허용하지만(버킷 크기만큼), 장기적 평균 속도를 제한합니다. **Leaky Bucket**은 요청을 버킷에 담고 고정된 속도로 처리합니다(큐 방식). 버킷이 가득 차면 요청이 버려집니다. 버스트를 허용하지 않고 처리 속도를 정확히 제어합니다. Token Bucket은 더 유연하고 널리 사용됩니다(RateLimiter 라이브러리, Redis 기반 구현).
</details>

<details>
<summary><strong>Q: API 버전 관리는 어떻게 해야 하나요?</strong></summary>

두 가지 주요 전략이 있습니다: 1) **URI prefix**(`/api/v1/users`, `/api/v2/users`) — 가장 일반적이고 직관적이며, 캐싱과 디버깅이 쉽습니다. 2) **Accept 헤더**(`Accept: application/vnd.myapp.v1+json`) — 더 RESTful하지만 클라이언트 구현이 복잡합니다. URI prefix가 실용적인 선택입니다. 버전은 호환성이 깨지는 변경(breaking change)이 있을 때만 올리세요. 새 필드 추가는 v1에서도 호환 가능하며, 필드 제거나 타입 변경만 major 버전 업데이트가 필요합니다.
</details>

<details>
<summary><strong>Q: API 응답의 표준 형식은 무엇인가요?</strong></summary>

일관된 응답 형식은 클라이언트 개발을 크게 단순화합니다. 표준 형식 예시: 성공 시 `{ "success": true, "data": { ... }, "meta": { "current_page": 1, "per_page": 20, "total": 100 } }`, 실패 시 `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "이메일 형식이 올바르지 않습니다.", "details": { "email": ["올바른 이메일을 입력하세요."] } } }`. HTTP 상태 코드도 일관되게 사용하세요: 200(성공), 201(생성), 400(잘못된 요청), 401(미인증), 403(권한 없음), 404(없음), 422(유효성 검사 실패), 429(속도 제한), 500(서버 에러).
</details>

---

## 요약

- **REST 제약**: 무상태(Stateless), 균일 인터페이스, 캐시 가능
- **JWT**: Header(알고리즘) + Payload(클레임) + Signature(서명), Base64URL 인코딩
- **CORS**: Simple Request vs Preflight(OPTIONS), Access-Control-Allow-* 헤더
- **Rate Limiting**: Token Bucket(버스트 허용) vs Leaky Bucket(균일 처리)
- **버전 관리**: URI prefix(/v1/, /v2/)가 실용적, breaking change 시만 업데이트
- **응답 형식**: 일관된 JSON 구조 + 적절한 HTTP 상태 코드
