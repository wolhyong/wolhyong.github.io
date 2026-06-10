---
layout: post
title: "PHP MVC 패턴 — 라우팅, 컨트롤러, 모델, 뷰, 프론트 컨트롤러"
description: "PHP의 MVC(Model-View-Controller) 패턴을 아키텍처 레벨에서 심층 학습합니다. 프론트 컨트롤러 패턴(index.php)이 모든 요청을 .htaccess(ModRewrite) 또는 Nginx 설정으로 단일 진입점으로 라우팅하는 과정, 디스패처가 URL을 파싱하여 컨트롤러/액션을 결정하고 ReflectionMethod로 invoke하는 원리, PSR-4 오토로딩이 Composer의 ClassLoader(파일 맵 기반)로 클래스 파일을 지연 로딩하는 방식, 서비스 컨테이너가 컨트롤러의 생성자 타입 힌트를 ReflectionClass로 분석하여 의존성을 자동 주입하는 과정, 템플릿 엔진(Twig/Blade)의 컴파일과 캐싱을 다룹니다."
date: 2023-11-27 10:00:00 +0900
category: php
tags: [php, mvc, routing, controller, model, view, front-controller]
level: intermediate
---

MVC(Model-View-Controller)는 PHP 웹 애플리케이션의 가장 널리 사용되는 아키텍처 패턴으로, 대부분의 PHP 프레임워크(Laravel, Symfony, CodeIgniter)의 기반입니다.

> **💡 핵심 정리** · PHP MVC의 프론트 컨트롤러(`public/index.php`)는 모든 HTTP 요청을 단일 진입점으로 받아들이고, URL을 파싱하여 라우터가 컨트롤러 클래스와 액션 메서드를 결정합니다. 디스패처는 `ReflectionMethod::invokeArgs()`로 컨트롤러 메서드를 호출하고, 서비스 컨테이너는 `ReflectionClass`의 생성자 파라미터를 분석하여 필요한 의존성을 자동 주입합니다. PSR-4 오토로딩은 Composer의 `ClassLoader`가 클래스명을 파일 경로로 변환(`App\ → src/`)하여 `require_once`로 지연 로딩합니다.

---

## 📚 수업 목표

- 프론트 컨트롤러 패턴을 이해합니다.
- URL 라우팅과 디스패치 과정을 이해합니다.
- PSR-4 오토로딩을 이해합니다.
- 서비스 컨테이너와 DI를 이해합니다.
- 템플릿 엔진의 동작을 이해합니다.

## 프론트 컨트롤러

```php
<?php
// public/index.php — 프론트 컨트롤러
require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Core\Request;
use App\Core\Container;

$container = new Container();
$router = new Router();

// 라우트 등록
$router->get('/users', 'UserController@index');
$router->get('/users/{id}', 'UserController@show');
$router->post('/users', 'UserController@store');

// 요청 처리
$request = new Request();
$response = $router->dispatch($request, $container);
$response->send();
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 프론트 컨트롤러 패턴의 장점은 무엇인가요?</strong></summary>

1) **중앙 집중식 요청 처리**: 모든 요청이 단일 진입점(index.php)을 통과하므로 인증, 로깅, 세션, CORS 등 공통 로직을 한 곳에서 처리할 수 있습니다. 2) **URL 디자인 자유로움**: 디렉토리 구조에 종속되지 않고 RESTful URL을 자유롭게 설계할 수 있습니다. 3) **보안**: 직접 접근 가능한 PHP 파일이 없어지고, 모든 요청이 컨트롤러를 통하므로 접근 제어가 명확해집니다. 4) **테스트 용이성**: 각 컴포넌트를 독립적으로 테스트할 수 있습니다. 단점은 모든 요청이 index.php를 통과하므로 .htaccess/Nginx 설정이 필요합니다.
</details>

<details>
<summary><strong>Q: PSR-4 오토로딩의 동작 방식은 무엇인가요?</strong></summary>

PSR-4는 **클래스명(namespace)을 파일 경로로 매핑**합니다. `App\Controller\UserController` 클래스를 찾으면 namespace 접두사 `App\`을 등록된 디렉토리 `src/`로 매핑하여 `src/Controller/UserController.php`를 로드합니다. Composer의 ClassLoader는 `spl_autoload_register()`로 등록되며, `vendor/composer/autoload_psr4.php`에 매핑 정보가 저장됩니다. 클래스가 처음 사용되는 시점에 `require_once`로 지연 로딩되어 불필요한 파일 로딩을 방지합니다.
</details>

<details>
<summary><strong>Q: Blade와 Twig의 차이는 무엇인가요?</strong></summary>

**Blade**(Laravel)는 PHP 코드를 템플릿에 직접 허용하고(`@php` 지시어), 상속은 `@extends`/`@section`/`@yield`로 합니다. 런타임에 템플릿을 컴파일하여 `storage/framework/views/`에 캐싱합니다. **Twig**(Symfony)는 보안 중심으로 설계되어 PHP 코드 실행을 완전히 차단하고, {% raw %}`{% %}` / `{{ }}`{% endraw %} / `{# #}`의 자체 문법을 사용합니다. 더 엄격한 샌드박스와 이스케이프를 제공합니다. Blade는 Laravel 생태계에 더 친화적이고, Twig는 Symfony와 독립적으로 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q: 컨트롤러가 무거워지는 것을 방지하는 방법은 무엇인가요?</strong></summary>

**Fat Controller 안티패턴**을 피하려면: 1) **Service Layer 도입** — 비즈니스 로직을 서비스 클래스로 분리하고 컨트롤러는 요청/응답 처리만 담당. 2) **Form Request** — 유효성 검사를 별도 Request 클래스로 분리. 3) **Action 클래스** — 하나의 액션만 담당하는 단일 메서드 컨트롤러(PSR-15의 핸들러와 유사). 4) **Repository 패턴** — DB 쿼리 로직을 Repository로 분리. 컨트롤러는 "HTTP 요청을 받아 서비스에 위임하고 응답을 반환"하는 얇은 레이어로 유지하세요.
</details>

<details>
<summary><strong>Q: RESTful 라우팅의 모범 사례는 무엇인가요?</strong></summary>

RESTful 라우팅은 **리소스(명사) 기반**으로 설계합니다: `GET /users`(목록), `GET /users/{id}`(조회), `POST /users`(생성), `PUT/PATCH /users/{id}`(수정), `DELETE /users/{id}`(삭제). 중첩 리소스는 `/users/{userId}/posts`로 표현합니다. URL에 동작(동사)을 포함하지 않고(`getUsers` → `GET /users`), HTTP 메서드로 동작을 표현합니다. 페이지네이션은 쿼리 파라미터로(`?page=1&per_page=20`), 버전 관리는 접두사로(`/api/v1/users`) 처리합니다.
</details>

---

## 요약

- **프론트 컨트롤러**: 단일 진입점, .htaccess/Nginx ModRewrite 필요
- **라우팅**: URL 패턴 매칭 → 컨트롤러@액션 결정
- **PSR-4 오토로딩**: namespace → 파일 경로 매핑, 지연 로딩
- **DI 컨테이너**: ReflectionClass로 의존성 분석, 자동 주입
- **템플릿 엔진**: Blade(PHP 허용) vs Twig(보안 중심), 컴파일 + 캐싱
- **MVC 계층 분리**: Controller(요청/응답) → Service(비즈니스) → Model(데이터) → View(표시)
