---
layout: post
title: "PHP 소개 — PHP란? 설치, 기본 문법, 개발 환경, 태그"
description: "PHP 프로그래밍의 기초를 시스템 레벨에서 심층 학습합니다. PHP가 서버 사이드 스크립트로 동작하며 HTML에 삽입되는 CGI/FastCGI/SAPI 모듈 기반 처리 과정, Zend Engine이 소스 코드를 OPcode(op_array)로 컴파일하고 실행하는 과정, PHP 태그(<?php ?>)의 동작 원리와 short_open_tag와의 차이, echo/print가 출력 버퍼를 통해 HTTP 응답으로 전송되는 과정을 다룹니다."
date: 2023-09-11 10:00:00 +0900
category: php
tags: [php, introduction, zend-engine, opcode, xampp, server-side]
level: basic
---

PHP는 서버 사이드 웹 개발을 위해 설계된 스크립트 언어입니다. 동적 웹 페이지 생성을 위해 HTML에 직접 삽입할 수 있습니다.

> **💡 핵심 정리** · PHP는 Zend Engine이 소스 코드를 AST(Abstract Syntax Tree)로 파싱한 후 OPcode(op_array)로 컴파일하고, Zend VM이 OPcode를 실행하여 출력 버퍼에 결과를 씁니다. `<?php ?>` 태그는 Zend Engine의 파서가 `INLINE_HTML` 토큰과 `OPEN_TAG` 토큰을 구분하여 PHP 코드만 해석하도록 합니다. PHP는 Apache 모듈(mod_php), FastCGI(FPM), CLI의 세 가지 SAPI(Server API)로 실행됩니다.

---

## 📚 수업 목표

- PHP의 동작 원리와 Zend Engine을 이해합니다.
- PHP 개발 환경(XAMPP, Docker)을 설정할 수 있습니다.
- 기본 PHP 문법을 이해합니다.
- echo, print, var_dump의 차이를 이해합니다.
- PHP와 HTML의 혼용 방식을 이해합니다.

## Hello World

```php
<?php
echo "Hello, PHP!";
print "Hello again!";

$name = "World";
echo "Hello, $name!";   // 변수 보간: Hello, World!
echo 'Hello, $name!';   // 작은따옴표: Hello, $name! (보간 없음)
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: PHP는 어떻게 웹 서버에서 실행되나요?</strong></summary>

PHP는 세 가지 방식으로 실행됩니다: 1) **Apache 모듈(mod_php)**: Apache 프로세스 내에서 PHP가 직접 실행. 2) **PHP-FPM(FastCGI Process Manager)**: 별도 PHP 프로세스가 요청을 처리(Nginx와 함께 주로 사용). 3) **CLI(Command Line Interface)**: 터미널에서 직접 실행. 웹 요청이 들어오면 SAPI가 PHP 파일을 로딩하고, Zend Engine이 컴파일과 실행을 수행한 후 결과를 웹 서버로 반환합니다.
</details>

<details>
<summary><strong>Q: <?php와 <?=의 차이는 무엇인가요?</strong></summary>

`<?php`는 정식 오픈 태그로 항상 사용 가능합니다. `<?=`(short echo tag)는 `<?php echo`의 축약형으로 PHP 5.4+에서 항상 사용 가능합니다. `<?`(short open tag)는 `short_open_tag` 설정이 필요하고 권장되지 않습니다. `<?=`은 템플릿에서 값을 출력할 때 많이 사용됩니다: `<?= $user->name ?>`.
</details>

<details>
<summary><strong>Q: echo와 print의 차이는 무엇인가요?</strong></summary>

**echo**는 언어 구조(함수가 아님)로, 반환값이 없고 콤마로 여러 인자를 출력할 수 있습니다: `echo "Hello", " ", "World";`. **print**는 항상 1을 반환하므로 표현식에서 사용 가능합니다. 대부분의 경우 echo가 약간 더 빠르고 더 자주 사용됩니다. `print_r()`과 `var_dump()`는 배열/객체의 구조를 출력하는 함수입니다.
</details>

<details>
<summary><strong>Q: PHP와 HTML은 어떻게 혼용되나요?</strong></summary>

PHP 파일 내에서 PHP 코드와 HTML을 자유롭게 혼용할 수 있습니다. `<?php ?>` 태그 밖의 모든 내용은 그대로 HTML로 출력됩니다. 제어문과 함께 혼용할 때는 콜론 문법(`:`, `endforeach`, `endif`)이 유용합니다. 대규모 프로젝트에서는 템플릿 엔진(Twig, Blade)을 사용하여 PHP와 HTML을 분리하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: PHP 8의 주요 새 기능은 무엇인가요?</strong></summary>

PHP 8.x의 주요 기능: 1) **JIT(Just-In-Time) 컴파일**: OPcode를 네이티브 코드로 컴파일하여 성능 향상. 2) **Named Arguments**: `array_fill(start_index: 0, num: 5, value: 0)`. 3) **Attributes(애너테이션)**: `#[Route("/api/users")]`. 4) **Union Types**: `int|string $value`. 5) **Match Expression**: switch의 개선된 버전. 6) **Nullsafe Operator**: `$user?->address?->city`. 7) **Enum**(PHP 8.1). 8) **Readonly Properties**(PHP 8.1).
</details>

---

## 요약

- **PHP**: 서버 사이드 스크립트, HTML에 삽입, 동적 웹 페이지 생성
- **Zend Engine**: 소스 → AST → OPcode → 실행(출력 버퍼)
- **SAPI**: Apache(mod_php), FPM(FastCGI), CLI
- **태그**: `<?php ?>`(정식), `<?=`(echo 축약), `<?`(비권장)
- **출력**: echo(언어 구조), print(함수), var_dump(디버깅)
