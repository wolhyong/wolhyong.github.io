---
layout: post
title: "PHP 에러 처리 — Exception/Error, try/catch, set_error_handler, 로깅"
description: "PHP의 에러 처리 시스템을 Zend Engine 레벨에서 심층 학습합니다. PHP 7+의 Throwable 인터페이스 계층 구조(Error vs Exception), set_error_handler()가 E_* 에러를 ErrorException으로 변환하여 try/catch로 잡을 수 있게 하는 패턴, set_exception_handler()가 잡히지 않은 예외를 처리하는 최종 방어선, error_reporting(E_ALL)의 비트 마스크 기반 에러 수준 제어, PHP-FPM의 stderr 로깅과 Monolog의 PSR-3 로그 레벨(DEBUG/INFO/WARNING/ERROR/CRITICAL)을 다룹니다."
date: 2023-11-13 10:00:00 +0900
category: php
tags: [php, error-handling, exception, logging, monolog, throwable]
level: intermediate
---

PHP 7+부터 에러 처리가 획기적으로 개선되어, 대부분의 에러를 Exception처럼 try/catch로 잡을 수 있습니다.

> **💡 핵심 정리** · PHP 7+의 `Throwable` 인터페이스는 모든 에러와 예외의 최상위 인터페이스입니다. `Error`(치명적 에러 — TypeError, ParseError, AssertionError)와 `Exception`(애플리케이션 예외 — RuntimeException, LogicException)의 부모입니다. `set_error_handler()`는 `E_*` 에러(경고/통지)를 `ErrorException`으로 변환하여 try/catch로 잡을 수 있게 합니다. `set_exception_handler()`는 잡히지 않은 예외의 최종 핸들러로, HTTP 500 응답을 반환하거나 로그를 기록합니다.

---

## 📚 수업 목표

- Throwable 인터페이스 계층 구조를 이해합니다.
- set_error_handler() 패턴을 이해합니다.
- 예외 처리 모범 사례를 이해합니다.
- PSR-3 로깅 표준을 이해합니다.

## try/catch 기본

```php
<?php
// 기본 예외 처리
try {
    $result = divide(10, 0);
    echo "결과: $result";
} catch (DivisionByZeroError $e) {
    // 특정 에러 타입 캐치
    echo "0으로 나눌 수 없습니다: " . $e->getMessage();
} catch (TypeError $e) {
    // 타입 에러 캐치
    echo "타입 에러: " . $e->getMessage();
} catch (\Throwable $e) {
    // 모든 에러/예외 캐치 (PHP 7+)
    echo "오류 발생: " . $e->getMessage();
    error_log($e->__toString());  // 로그 기록
} finally {
    // 항상 실행
    echo "처리 완료";
}

function divide(int $a, int $b): float
{
    if ($b === 0) {
        throw new \DivisionByZeroError("0으로 나눌 수 없음");
    }
    return $a / $b;
}
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: PHP 7+의 Error 클래스와 Exception 클래스의 차이는 무엇인가요?</strong></summary>

`Error`는 **Zend Engine 레벨의 치명적 오류**를 나타냅니다: TypeError(타입 불일치), ParseError(구문 오류), AssertionError(assert 실패), DivisionByZeroError(0으로 나누기). `Exception`은 **애플리케이션 레벨의 예외**입니다: RuntimeException, LogicException, InvalidArgumentException 등. 둘 다 `Throwable` 인터페이스를 구현하지만, Error는 복구가 어렵고 Exception은 catch로 복구할 수 있습니다. `catch (Throwable $e)`로 둘 다 잡을 수 있습니다.
</details>

<details>
<summary><strong>Q: set_error_handler()의 반환값에 따라 에러 처리 방식이 어떻게 달라지나요?</strong></summary>

`set_error_handler()` 콜백이 `true`를 반환하면 PHP는 **해당 에러를 처리된 것으로 간주**하고 실행을 계속합니다. `false`를 반환하면(또는 핸들러가 설정되지 않은 경우) PHP의 **기본 에러 핸들러**가 실행됩니다. 커스텀 핸들러에서 `return false;`로 특정 에러만 기본 처리에 위임할 수 있습니다. `error_reporting()` 수준과 관계없이 핸들러는 호출되지만, `@` 연산자(에러 제어)로 숨겨진 에러는 `error_reporting()`이 0으로 설정되어 핸들러에 전달되지 않습니다.
</details>

<details>
<summary><strong>Q: PSR-3 로그 레벨은 어떻게 사용하나요?</strong></summary>

PSR-3은 8개 로그 레벨을 정의합니다: **DEBUG**(상세 디버그 정보), **INFO**(일반 정보 — 사용자 로그인 등), **NOTICE**(정상이지만 중요한 상태), **WARNING**(오류는 아니지만 주의 필요), **ERROR**(복구 가능한 오류), **CRITICAL**(복구 불가능한 상태 — 시스템 다운), **ALERT**(즉시 조치 필요), **EMERGENCY**(전체 시스템 사용 불가). Monolog는 `$log->pushHandler(new StreamHandler('app.log', Logger::WARNING))`로 특정 레벨 이상만 기록하도록 필터링할 수 있습니다.
</details>

<details>
<summary><strong>Q: PHP에서 @ 연산자(에러 제어 연산자)를 사용해야 하나요?</strong></summary>

**`@` 연산자 사용은 권장되지 않습니다**. `@`는 해당 표현식의 에러 리포트를 일시적으로 `error_reporting(0)`으로 설정합니다. 성능 저하가 있고(표현식 전/후로 error_reporting을 변경), 실제 에러를 숨겨 디버깅을 어렵게 만듭니다. 대신 적절한 조건 검사로 에러를 방지하거나(`file_exists()`로 확인 후 `fopen()`), try/catch로 명시적 처리하세요. `@`는 `fopen()`의 실패 처리 같은 제한된 상황에서만 사용하세요.
</details>

<details>
<summary><strong>Q: display_errors와 error_reporting의 차이는 무엇인가요?</strong></summary>

`error_reporting`은 **PHP가 어떤 수준의 에러를 감지할지** 지정합니다(비트 마스크). 예: `error_reporting(E_ALL)`은 모든 에러를 감지합니다. `display_errors`는 감지된 에러를 **화면에 출력할지** 결정합니다. 프로덕션에서는 `display_errors = Off`로 설정하고 `log_errors = On`으로 파일에 기록해야 합니다. 개발 환경에서는 `display_errors = On`으로 즉시 확인할 수 있습니다. 두 설정은 독립적이므로, 감지는 하되 화면 출력은 하지 않을 수 있습니다.
</details>

---

## 요약

- **Throwable**: Error(엔진 레벨) + Exception(애플리케이션)의 최상위 인터페이스
- **try/catch/finally**: catch는 Throwable 타입 힌트, finally는 항상 실행
- **set_error_handler()**: E_* 에러를 ErrorException으로 변환
- **set_exception_handler()**: 잡히지 않은 예외의 최종 처리
- **PSR-3 로깅**: 8개 레벨(DEBUG → EMERGENCY), Monolog가 대표 구현
- **프로덕션**: display_errors=Off, log_errors=On, error_reporting=E_ALL
