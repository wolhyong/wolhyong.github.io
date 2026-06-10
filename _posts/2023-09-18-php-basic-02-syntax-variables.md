---
layout: post
title: "PHP 기본 문법과 변수 — 변수, 상수, 데이터 타입, 문자열, 연산자"
description: "PHP의 기본 문법과 변수 시스템을 Zend Engine 메모리 구조와 함께 심층 학습합니다. PHP 변수가 $ 접두사로 선언되고 zval(Zend Value) 구조체에 저장되는 방식(value + type + refcount + is_ref), 가변 변수($$var)의 동적 이름 해석, 타입 저글링(type juggling)의 자동 형변환 규칙(약타입 언어 특성), 문자열 처리(작은따옴표/큰따옴표의 변수 보간 차이, Heredoc/Nowdoc), 연산자 우선순위와 참조(&)의 메모리 구조를 다룹니다."
date: 2023-09-18 10:00:00 +0900
category: php
tags: [php, variables, data-types, strings, operators, zval, type-juggling]
level: basic
---

PHP는 동적 타입 언어로, 변수의 타입이 실행 중에 결정됩니다. PHP의 변수 시스템은 zval 구조체를 기반으로 합니다.

> **💡 핵심 정리** · PHP 변수는 C 구조체 `zval`(Zend Value)로 관리되며, `zend_value`(실제 데이터 또는 포인터), `u1.type_info`(타입 플래그), `u2.next`(해시 테이블 충돌 체인) 필드를 가집니다. PHP의 타입 저글링은 연산자가 필요로 하는 타입으로 자동 변환하며, 느슨한 비교(`==`)는 타입 변환 후 비교하지만 엄격한 비교(`===`)는 타입까지 검사합니다. 문자열에서 큰따옴표(`"`)는 변수 보간을 수행하지만 작은따옴표(`'`)는 그대로 출력합니다.

---

## 📚 수업 목표

- PHP 변수의 zval 구조를 이해합니다.
- 데이터 타입과 타입 저글링을 이해합니다.
- 문자열 처리의 차이를 이해합니다.
- 연산자와 참조의 동작을 이해합니다.
- 가변 변수와 상수를 이해합니다.

## 변수

```php
<?php
$name = "Alice";        // 문자열
$age = 25;              // 정수
$height = 165.5;        // 실수
$isStudent = true;      // 불리언
$hobbies = ["reading", "coding"];  // 배열
$address = null;        // null

// 가변 변수
$varName = "message";
$$varName = "Hello!";   // $message = "Hello!"와 동일
echo $message;          // Hello!

// 상수
define("SITE_NAME", "My Blog");
const VERSION = "1.0.0";
echo SITE_NAME;
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: PHP에서 느슨한(==) 비교와 엄격한(===) 비교의 차이는 무엇인가요?</strong></summary>

느슨한 비교(`==`)는 타입 저글링 후 값을 비교합니다. `"123" == 123` → true, `0 == false` → true, `"" == false` → true. 엄격한 비교(`===`)는 타입과 값을 모두 비교합니다. `"123" === 123` → false, `0 === false` → false. 대부분의 경우 엄격한 비교(`===`)를 사용하는 것이 안전합니다. in_array()나 array_search()에도 `true` 세 번째 인자로 엄격 모드를 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q: 큰따옴표와 작은따옴표 중 어떤 것이 더 빠른가요?</strong></summary>

**작은따옴표**가 약간 더 빠릅니다. 큰따옴표는 변수 보간을 위해 문자열을 파싱해야 하지만, 작은따옴표는 단순히 문자열을 그대로 사용합니다. 하지만 성능 차이는 미미하므로(수백만 번 반복 시에만 차이 발생), **가독성**을 기준으로 선택하세요. 변수 보간이 필요하면 큰따옴표를, 필요 없으면 작은따옴표를 사용하세요.
</details>

<details>
<summary><strong>Q: 참조(&)는 어떻게 동작하나요?</strong></summary>

PHP의 참조(`&`)는 C의 포인터와 유사하게 변수의 메모리 위치를 공유합니다. `$b = &$a`는 `$b`가 `$a`의 zval을 가리키도록 합니다(`is_ref = true`). 하나의 값을 변경하면 다른 변수도 영향을 받습니다. 함수 인자에 참조를 사용하면(`function foo(&$var)`) 원본 변수를 직접 수정할 수 있습니다. 단, PHP 8+에서는 참조 사용을 최소화하고 명시적 반환을 권장합니다.
</details>

<details>
<summary><strong>Q: null, false, 빈 문자열(""), 0, 빈 배열([])의 차이는 무엇인가요?</strong></summary>

이 네 가지는 모두 느슨한 비교에서 `== false`이지만, 엄격한 비교에서는 모두 다릅니다. **null**: 값이 없음(변수가 선언되지 않았거나 null 할당). **false**: 불리언 거짓. **""**: 빈 문자열. **0**: 숫자 0. **[]**: 빈 배열. `empty()`는 이 모든 값을 true로 반환합니다. `isset()`은 null과 선언되지 않은 변수에만 false를 반환합니다.
</details>

<details>
<summary><strong>Q: define()과 const의 차이는 무엇인가요?</strong></summary>

`define()`은 런타임에 상수를 정의하고, 표현식을 값으로 사용할 수 있습니다. `const`는 컴파일 타임에 정의되며, 클래스 내부에서도 사용할 수 있습니다. `const`는 성능이 약간 더 좋습니다. PHP 8.3+에서는 `define()`에도 배열을 값으로 사용할 수 있습니다. 클래스 상수는 항상 `const`를 사용하세요.
</details>

---

## 요약

- **zval 구조**: zend_value(데이터) + type_info(타입 플래그) + refcount + is_ref
- **타입 저글링**: 자동 형변환, 느슨한 비교(== vs ===)
- **문자열**: 큰따옴표(변수 보간), 작은따옴표(그대로), Heredoc/Nowdoc
- **참조(&)**: zval 공유(Copy-on-Write), is_ref = true
- **상수**: define()(런타임), const(컴파일 타임)
