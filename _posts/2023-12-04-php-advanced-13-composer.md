---
layout: post
title: "PHP Composer와 의존성 관리 — autoload, 패키지 버전 관리, 사용자 정의 명령"
description: "PHP Composer의 의존성 관리 시스템을 내부 동작 레벨에서 심층 학습합니다. Composer가 composer.json을 읽어 Packagist API로 패키지 메타데이터를 가져오고, SAT(Satisfiability) 솔버로 의존성 그래프를 해결하는 과정(버전 충돌 시 업데이트 불가), 설치된 패키지의 정확한 버전을 composer.lock에 잠금(lock)하고 설치 시 lock 파일의 버전을 우선 사용하는 원리, PSR-4/PSR-0 오토로딩을 위한 vendor/composer/autoload_classmap.php의 클래스 맵 생성, 사용자 정의 Composer 명령(플러그인)의 CommandProvider 등록 과정, 스크립트 훅(pre/post-update-cmd)의 이벤트 시스템을 다룹니다."
date: 2023-12-04 10:00:00 +0900
category: php
tags: [php, composer, dependency-management, packagist, autoloading, sat-solver]
level: advanced
---

Composer는 PHP의 사실상 표준 의존성 관리 도구로, Packagist 저장소에서 패키지를 관리하고 PSR-4 오토로딩을 제공합니다.

> **💡 핵심 정리** · Composer의 의존성 해결(SAT solving)은 각 패키지의 모든 버전을 노드로, 의존성 관계를 엣지로 하는 그래프를 구성하고, SAT 솔버가 모든 제약 조건을 만족하는 버전 조합을 찾습니다(실패 시 업데이트 불가 메시지). `composer.lock`은 해결된 버전을 JSON으로 잠금(lock)하여 모든 환경에서 동일한 버전이 설치되도록 보장합니다. PSR-4 오토로딩 최적화는 `composer dump-autoload -o`로 모든 클래스를 classmap에 등록하여 파일 시스템 탐색 없이 O(1) 조회를 가능하게 합니다.

---

## 📚 수업 목표

- Composer의 의존성 해결(SAT solving) 과정을 이해합니다.
- composer.lock의 역할을 이해합니다.
- PSR-4 오토로딩 최적화를 이해합니다.
- Composer 스크립트 훅을 이해합니다.
- 사용자 정의 패키지를 배포하는 방법을 이해합니다.

## Composer 기본

```json
{
    "name": "myapp/blog",
    "description": "Personal blog application",
    "type": "project",
    "require": {
        "php": ">=8.1",
        "laravel/framework": "^10.0",
        "laravel/sanctum": "^3.0",
        "spatie/laravel-permission": "^5.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "mockery/mockery": "^1.5"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/",
            "Database\\Factories\\": "database/factories/"
        }
    },
    "scripts": {
        "post-update-cmd": [
            "@php artisan optimize"
        ]
    }
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: composer install과 composer update의 차이는 무엇인가요?</strong></summary>

`composer install`은 **composer.lock 파일을 읽어** 정확히 그 버전의 패키지를 설치합니다. lock 파일이 없으면 `composer.lock`을 생성합니다. 프로덕션 배포 시 사용합니다. `composer update`는 composer.json의 버전 제약 조건 내에서 **가장 최신 버전으로 업데이트**하고, 새로운 composer.lock을 생성합니다. 개발 중에만 사용하고, 업데이트 후 lock 파일을 커밋해야 합니다. `composer update vendor/package`로 특정 패키지만 업데이트할 수도 있습니다.
</details>

<details>
<summary><strong>Q: Composer의 버전 제약 조건 ^(캐럿)과 ~(틸다)의 차이는 무엇인가요?</strong></summary>

**캐럿(`^`)**은 하위 호환성이 보장되는 범위 내에서 업데이트를 허용합니다. `^1.2.3`은 `>=1.2.3 <2.0.0`, `^0.3.4`는 `>=0.3.4 <0.4.0`(0.x는 다음 주요 버전이 0.x+1)입니다. **틸다(`~`)**는 패치 버전까지만 업데이트를 허용합니다. `~1.2.3`은 `>=1.2.3 <1.3.0`, `~1.2`는 `>=1.2.0 <2.0.0`입니다. 현대 PHP 프로젝트는 일반적으로 캐럿(`^`)을 사용하고, 틸다는 패치 버전만 업데이트하고 싶을 때 사용합니다.
</details>

<details>
<summary><strong>Q: 오토로딩 최적화(dump-autoload -o)는 무엇을 하나요?</strong></summary>

`composer dump-autoload -o`(optimize)는 **모든 클래스 파일을 vendor/composer/autoload_classmap.php에 미리 등록**합니다. 일반 PSR-4는 클래스를 처음 사용할 때 파일 시스템에서 클래스 파일을 찾지만(class_exists 탐색), 최적화되면 classmap에서 O(1)로 즉시 로드합니다. 프로덕션에서는 항상 최적화를 실행하세요: `composer install --optimize-autoloader` 또는 `--no-dev --optimize-autoloader`. 단점은 classmap을 재생성해야 새로운 클래스가 반영되므로 개발 중에는 사용하지 않는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: Packagist에 패키지를 등록하려면 어떻게 해야 하나요?</strong></summary>

1) Packagist.org에 GitHub 계정으로 가입합니다. 2) 저장소의 composer.json에 `name`, `description`, `type`, `require`, `autoload`를 올바르게 설정합니다. 3) GitHub 저장소에 **태그(version tag)**를 생성합니다: `git tag v1.0.0`; `git push --tags`. 4) Packagist에서 "Submit" 버튼으로 저장소 URL을 등록합니다. 5) GitHub 서비스 훅(Packagist Webhook)을 설정하면 푸시와 태그가 자동으로 Packagist에 반영됩니다. 안정적인 첫 버전은 `v1.0.0`으로 태그하고, `0.x`는 안정적이지 않은 것으로 간주됩니다.
</details>

<details>
<summary><strong>Q: Composer 플러그인은 어떻게 동작하나요?</strong></summary>

Composer 플러그인은 `Composer\Plugin\PluginInterface`를 구현하는 클래스입니다. `activate()` 메서드에서 Composer의 이벤트 디스패처에 이벤트 리스너를 등록하거나, `CommandProvider` 인터페이스로 사용자 정의 명령을 추가합니다. 플러그인은 `composer.json`의 `type: composer-plugin`과 `extra.class`에 플러그인 클래스를 지정해야 합니다. 예: `composer-plugin` 타입의 `hirak/prestissimo`(병렬 다운로드), `kint-php/kint`(디버거) 등이 있습니다. 플러그인은 `require`에 추가하고 `composer plugins:install`로 활성화합니다.
</details>

---

## 요약

- **SAT solving**: 의존성 그래프 해결 → 모든 버전 제약을 만족하는 조합 탐색
- **lock 파일**: composer.lock으로 버전 고정, install은 lock 우선
- **캐럿(^) vs 틸다(~)**: ^(하위 호환 업데이트) vs ~(패치만 업데이트)
- **오토로딩 최적화**: classmap 생성 → O(1) 클래스 로딩
- **스크립트 훅**: pre/post-update-cmd, pre/post-install-cmd
- **Packagist 등록**: 태그 기반 버전 관리, Webhook 자동 업데이트
