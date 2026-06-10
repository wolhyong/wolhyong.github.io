---
layout: post
title: "PHP 제어문과 함수 — 조건문, 반복문, 사용자 정의 함수, 스코프"
description: "PHP의 제어문과 함수를 Zend Engine OPcode 레벨에서 심층 학습합니다. if/else/switch의 조건부 분기와 Zend VM의 JMPZ/JMPNZ OPcode, for/while/foreach의 반복 구조와 foreach가 내부 배열 포인터(internal array pointer)로 동작하는 과정, 사용자 정의 함수의 매개변수 전달 방식(값 전달 vs 참조 전달), 변수 스코프(global 키워드의 $GLOBALS 배열 접근, static 변수의 함수 간 상태 유지), 가변 함수(call_user_func)와 익명 함수(Closure)를 다룹니다."
date: 2023-09-25 10:00:00 +0900
category: php
tags: [php, control-flow, function, scope, closure, foreach]
level: basic
---

PHP는 C 계열 문법을 따르는 제어문과 유연한 함수 시스템을 제공합니다.

> **💡 핵심 정리** · PHP의 `foreach`는 내부 배열 포인터(internal array pointer)를 사용하여 배열을 순회하며, Zend Engine OPcode의 `FE_RESET_R`/`FE_FETCH_R`이 포인터를 이동시킵니다. 함수 스코프에서 `global $var`는 `$GLOBALS['var']`의 참조를 가져와 전역 변수에 접근합니다. `static $count`는 Zend Engine이 함수의 op_array에 static 변수 테이블을 유지하여 함수 호출 간에도 값을 보존합니다.

---

## 📚 수업 목표

- 조건문과 반복문의 OPcode 레벨 동작을 이해합니다.
- foreach의 내부 배열 포인터 동작을 이해합니다.
- 함수의 값 전달과 참조 전달을 이해합니다.
- 변수 스코프 규칙을 이해합니다.
- 익명 함수와 클로저를 이해합니다.

## 조건문

```php
<?php
// if-else
$score = 85;
if ($score >= 90) {
    $grade = "A";
} elseif ($score >= 80) {
    $grade = "B";
} else {
    $grade = "C";
}

// switch
switch ($grade) {
    case "A":
        echo "Excellent!";
        break;
    case "B":
        echo "Good!";
        break;
    default:
        echo "Keep trying!";
}

// match (PHP 8.0+)
$result = match ($grade) {
    "A" => "Excellent!",
    "B" => "Good!",
    default => "Keep trying!",
};
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: foreach에서 &$value를 사용할 때 주의할 점은 무엇인가요?</strong></summary>

`foreach ($array as &$value)`는 배열 요소의 참조를 순회합니다. **루프 종료 후 `$value`가 마지막 요소의 참조를 계속 유지**하므로, 이후 `$value`를 사용하면 의도치 않게 배열의 마지막 요소가 수정될 수 있습니다. 반드시 `unset($value)`로 참조를 해제해야 합니다. PHP 8.0+에서도 이 문제는 해결되지 않았으므로 주의가 필요합니다.
</details>

<details>
<summary><strong>Q: 함수에서 값을 반환할 때 참조를 사용해야 하나요?</strong></summary>

PHP에서는 대부분의 경우 **참조 반환이 필요하지 않습니다**. PHP는 Copy-on-Write로 메모리를 최적화하므로, 값을 반환해도 실제 복사는 수정 시에만 발생합니다. 참조 반환은 배열의 특정 요소를 직접 수정해야 하는 드문 경우에만 사용하세요. 객체는 항상 참조로 전달되므로(객체 식별자), 별도 참조가 필요 없습니다.
</details>

<details>
<summary><strong>Q: global 키워드의 동작 방식은 무엇인가요?</strong></summary>

`global $var`는 `$GLOBALS['var']`의 **참조**를 현재 스코프로 가져옵니다. 즉, `$var = $GLOBALS['var']`가 아니라 `$var = &$GLOBALS['var']`처럼 동작합니다. 따라서 함수 내에서 `$var`를 변경하면 전역 변수도 변경됩니다. `$GLOBALS`는 모든 전역 변수를 담는 연관 배열로, `global` 선언 없이도 접근할 수 있습니다.
</details>

<details>
<summary><strong>Q: 익명 함수에서 외부 변수를 사용하려면 어떻게 해야 하나요?</strong></summary>

익명 함수(Closure)에서 외부 변수를 사용하려면 `use` 키워드로 캡처해야 합니다. `$factor = 2; $multiply = function($n) use ($factor) { return $n * $factor; };`. 기본적으로 값으로 캡처되지만, `use (&$factor)`로 참조 캡처도 가능합니다. PHP 7.4+의 화살표 함수(`fn($n) => $n * $factor`)는 자동으로 외부 변수를 값으로 캡처합니다.
</details>

<details>
<summary><strong>Q: PHP 8의 match 표현식과 switch의 차이는 무엇인가요?</strong></summary>

1) **match는 표현식**(값 반환), switch는 문장. 2) **match는 엄격한 비교**(===), switch는 느슨한 비교(==). 3) **match는 하나의 분기만 실행**(break 불필요), switch는 fall-through(break 필요). 4) **match는 모든 경우를 처리해야 함**(처리되지 않은 경우 UnhandledMatchError). 가독성과 안전성에서 `match`가 `switch`보다 우수합니다.
</details>

---

## 요약

- **foreach**: 내부 배열 포인터, &$value 참조 순회 후 unset() 필수
- **함수**: 값 전달(기본), 참조 전달(&), 기본값, 타입 힌트(PHP 7+)
- **스코프**: 함수 내부 → 전역 접근 불가, `global`/`$GLOBALS`로 접근
- **static 변수**: 함수 호출 간 상태 유지, Zend op_array의 static 테이블
- **Closure**: `use`로 외부 변수 캡처, `fn`(화살표 함수) 자동 캡처
