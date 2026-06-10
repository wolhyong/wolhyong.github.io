---
layout: post
title: "PHP 배포와 성능 최적화 — OPcache, PHP-FPM, CI/CD, 모니터링"
description: "PHP 애플리케이션의 배포와 성능 최적화를 인프라 레벨에서 심층 학습합니다. OPcache가 Zend Engine의 컴파일 단계에서 생성된 OPcode(중간 코드)를 공유 메모리(opcache.memory_consumption, 기본 128MB)에 캐싱하여 요청마다 PHP 소스 코드를 다시 파싱/컴파일하지 않도록 하는 과정, PHP-FPM(FastCGI Process Manager)의 pm(process manager) 설정(dynamic/static/ondemand)이 워커 프로세스 풀을 관리하고 각 워커가 요청을 처리하는 방식, CI/CD 파이프라인(GitHub Actions)의 자동 테스트와 배포, 성능 모니터링(Xdebug 프로파일링, Blackfire.io)과 병목 지점 분석을 다룹니다."
date: 2024-01-08 10:00:00 +0900
category: php
tags: [php, deployment, opcache, php-fpm, cicd, performance, monitoring]
level: advanced
---

PHP 애플리케이션의 프로덕션 배포는 단순히 파일을 업로드하는 것 이상으로, OPcache 최적화, PHP-FPM 튜닝, CI/CD 파이프라인 구축이 필요합니다.

> **💡 핵심 정리** · OPcache는 Zend Engine의 `zend_compile_file()` 후크에서 생성된 OPcode 배열(각 `zend_op`는 opcode(연산 종류), op1/op2(피연산자), result(결과 저장 위치) 필드)을 공유 메모리 세그먼트에 저장합니다. `opcache.validate_timestamps=1`(기본 2초 간격)로 소스 파일 변경을 감지하고, 변경 시 OPcode를 무효화하여 다시 컴파일합니다. PHP-FPM의 `pm = dynamic`은 `pm.max_children`(최대 워커), `pm.start_servers`(시작 워커), `pm.min_spare_servers`/`pm.max_spare_servers`(유휴 워커 범위)로 워커 풀을 동적 관리합니다.

---

## 📚 수업 목표

- OPcache의 OPcode 캐싱 메커니즘을 이해합니다.
- PHP-FPM의 프로세스 관리를 이해합니다.
- CI/CD 파이프라인을 이해합니다.
- 성능 프로파일링 방법을 이해합니다.
- 최적화 설정을 이해합니다.

## PHP-FPM 설정

```ini
; www.conf — PHP-FPM 풀 설정
[www]
user = www-data
group = www-data
listen = /run/php/php8.1-fpm.sock
; listen = 127.0.0.1:9000

; 프로세스 관리
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 1000

; 요청 타임아웃
request_terminate_timeout = 30
request_slowlog_timeout = 5
slowlog = /var/log/php-fpm/slow.log
```

```ini
; php.ini — OPcache 설정
[opcache]
opcache.enable = 1
opcache.memory_consumption = 256
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.revalidate_freq = 2
opcache.validate_timestamps = 0  ; 프로덕션
opcache.enable_cli = 1
opcache.jit = tracing
opcache.jit_buffer_size = 100M
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: OPcache의 validate_timestamps를 프로덕션에서 0으로 설정해야 하는 이유는 무엇인가요?</strong></summary>

`opcache.validate_timestamps = 0`은 OPcache가 **파일 변경을 전혀 확인하지 않도록** 합니다. 배포 시에는 캐시를 수동으로 초기화합니다: `opcache_reset()` 또는 PHP-FPM 재시작. 이 설정의 장점: 불필요한 파일 stat() 호출 제거(성능 향상), 예측 가능한 캐시 상태(파일 업데이트 중 타이밍 이슈 방지). 단점: 배포 시 캐시 초기화가 필요합니다. 일반적인 배포 파이프라인에서는 새 디렉토리에 배포하고 심볼릭 링크를 전환한 후 PHP-FPM을 graceful reload(`SIGUSR2`)하여 OPcache를 초기화합니다.
</details>

<details>
<summary><strong>Q: PHP-FPM의 pm 모드(dynamic/static/ondemand)는 어떻게 선택하나요?</strong></summary>

**`pm = dynamic`**(권장): 워커 수를 자동 조절합니다. `pm.max_children`(최대), `pm.start_servers`(시작), `pm.min/max_spare_servers`(유휴 워커 범위)를 설정합니다. 트래픽이 변동하는 대부분의 사이트에 적합합니다. **`pm = static`**: 고정된 워커 수를 유지합니다. 트래픽이 안정적이거나 서버 리소스가 충분할 때 최고 성능을 냅니다. **`pm = ondemand`**: 요청이 있을 때만 워커를 생성합니다(유휴 워커 없음). 메모리가 제한된 저사양 서버나 트래픽이 매우 적은 사이트에 적합합니다. `pm.max_children`은 서버 메모리 / 각 워커의 평균 메모리 사용량으로 계산하세요.
</details>

<details>
<summary><strong>Q: PHP 8.0+의 JIT(Just-In-Time) 컴파일은 어떻게 동작하나요?</strong></summary>

PHP 8.0의 JIT은 **OPcache의 확장**으로, OPcode를 네이티브 CPU 명령어(기계어)로 컴파일합니다. `opcache.jit = tracing`과 `opcache.jit_buffer_size = 100M`으로 활성화합니다. JIT 모드: **`tracing`**(권장) — 자주 실행되는 Hot Loop를 감지하여 해당 경로(trace)만 네이티브 코드로 컴파일(실행 시간의 90% 이상을 차지하는 10% 코드 최적화). **`function`** — 모든 함수를 JIT 컴파일. 벤치마크에 따라 CPU 집약적 작업에서는 2~8배 성능 향상이 있지만, 일반적인 웹 요청(I/O 바운드)에서는 체감 효과가 적습니다. Laravel 같은 프레임워크에서는 5~15% 정도의 성능 향상이 보고됩니다.
</details>

<details>
<summary><strong>Q: PHP 애플리케이션의 주요 성능 병목 지점은 어디인가요?</strong></summary>

PHP 애플리케이션의 성능 병목은 주로: 1) **데이터베이스 쿼리**(N+1 문제, 느린 쿼리) — 가장 흔한 원인. 2) **외부 API 호출** — 네트워크 지연, 큐(Queue)로 비동기 처리 필요. 3) **파일 I/O** — 세션 파일 저장, 로그 기록. 4) **세션 처리** — 파일 기반 세션은 확장에 불리, Redis로 대체. 5) **템플릿 컴파일** — Blade/Twig 캐싱으로 해결. 6) **PHP 자체** — CPU 바운드 작업(이미지 처리, 암호화). 프로파일링 도구(Blackfire, Xdebug + KCacheGrind)로 실제 병목을 식별하고, OPcache, 캐싱(Redis), 큐(Queue), DB 인덱싱 순으로 최적화하세요.
</details>

<details>
<summary><strong>Q: CI/CD 파이프라인에서 PHP 프로젝트는 어떻게 테스트하나요?</strong></summary>

GitHub Actions 예시: 1) **코드 품질**: PHP CS Fixer(스타일), PHPStan/Psalm(정적 분석, level max). 2) **단위 테스트**: PHPUnit, PCOV 커버리지(최소 80%). 3) **통합 테스트**: Docker Compose로 MySQL/Redis 컨테이너 실행, Pest PHP로 HTTP 테스트. 4) **보안 검사**: Composer 의존성 취약점(`composer audit`). 5) **배포**: Deployer(PHP 배포 도구) 또는 rsync/SSH. `composer install --no-dev --optimize-autoloader`로 프로덕션 의존성만 설치하고, `artisan optimize:clear && artisan optimize`로 캐시를 초기화/재생성합니다.
</details>

---

## 요약

- **OPcache**: OPcode → 공유 메모리 캐싱, JIT(tracing 모드)로 네이티브 코드 컴파일
- **PHP-FPM**: dynamic(동적 조절), static(고정), ondemand(요청 시) 워커 관리
- **JIT 컴파일(PHP 8+)**: Hot Loop Tracing → 네이티브 CPU 명령어, CPU 집약 작업 2~8배 향상
- **CI/CD**: GitHub Actions → PHPStan 정적 분석 → PHPUnit 테스트 → Deployer 배포
- **성능 모니터링**: Blackfire(Xdebug) 프로파일링, slowlog, OPcache 통계
- **최적화 순서**: DB 쿼리(N+1) → 캐싱(Redis) → 큐(비동기) → OPcache/JIT
