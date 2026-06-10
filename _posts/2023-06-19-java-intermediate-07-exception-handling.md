---
layout: post
title: "Java 예외 처리 — try/catch/finally, throws, 사용자 정의 예외, try-with-resources"
description: "Java의 예외 처리 시스템을 JVM 레벨에서 심층 학습합니다. try/catch/finally의 Exception Table 구조(try 시작/종료/핸들러 PC), checked/unchecked 예외의 차이와 throws 선언이 컴파일러에게 주는 의미, 사용자 정의 예외 작성 패턴과 예외 체이닝(initCause()), try-with-resources가 AutoCloseable의 close()를 호출하는 Suppressed 예외 처리 과정, 다중 catch 블록의 정밀한 예외 처리와 멀티 catch(|)를 다룹니다."
date: 2023-06-19 10:00:00 +0900
category: java
tags: [java, exception, try-catch, finally, throws, try-with-resources, custom-exception]
level: intermediate
---

예외 처리는 안정적인 Java 애플리케이션의 필수 요소입니다. Java의 예외 시스템은 checked와 unchecked로 구분됩니다.

> **💡 핵심 정리** · Java의 try 블록은 JVM의 Exception Table(시작 PC, 종료 PC, 핸들러 PC, catch 타입)에 매핑됩니다. 예외 발생 시 JVM은 현재 메서드의 Exception Table을 탐색하여 일치하는 핸들러를 찾습니다. checked 예외(`Exception`의 서브클래스, `RuntimeException` 제외)는 컴파일러가 처리(throws 또는 catch)를 강제합니다. try-with-resources는 컴파일러가 각 리소스의 `close()`를 finally 블록에서 호출하는 코드로 변환하며, 닫기 중 발생한 예외는 `addSuppressed()`로 원본 예외에 첨부됩니다.

---

## 📚 수업 목표

- checked와 unchecked 예외의 차이를 이해합니다.
- try/catch/finally의 JVM Exception Table을 이해합니다.
- 사용자 정의 예외를 작성할 수 있습니다.
- try-with-resources의 동작을 이해합니다.
- 예외 체이닝과 suppresed 예외를 이해합니다.

## 예외 기본

```java
try {
    int result = 10 / 0;  // ArithmeticException 발생
    System.out.println("이 코드는 실행되지 않음");
} catch (ArithmeticException e) {
    System.out.println("0으로 나눌 수 없습니다: " + e.getMessage());
} finally {
    System.out.println("항상 실행됩니다");
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: checked 예외와 unchecked 예외의 차이는 무엇인가요?</strong></summary>

**Checked 예외**(IOException, SQLException)는 `Exception`의 서브클래스이지만 `RuntimeException`은 아닙니다. 컴파일러가 처리(throws 또는 catch)를 강제합니다. **Unchecked 예외**(NullPointerException, IllegalArgumentException)는 `RuntimeException`의 서브클래스로, 컴파일러가 처리를 강제하지 않습니다. 일반적으로 복구 가능한 예외는 checked로, 프로그래밍 오류는 unchecked로 만듭니다.
</details>

<details>
<summary><strong>Q: try-with-resources가 finally보다 더 안전한 이유는 무엇인가요?</strong></summary>

try-with-resources는 **모든 리소스가 자동으로 닫힘**을 보장합니다. 반면 finally 블록에서는 각 리소스의 `close()`를 직접 호출해야 하고, finally 자체에서 예외가 발생하면 try 블록의 원본 예외가 사라질 수 있습니다(예외 대체). try-with-resources는 `addSuppressed()` 메커니즘으로 원본 예외와 리소스 닫기 예외를 모두 보존합니다.
</details>

<details>
<summary><strong>Q: 예외를 로깅할 때 stack trace를 포함해야 하나요?</strong></summary>

**네, 항상 포함해야 합니다.** `e.printStackTrace()` 대신 **로깅 프레임워크**(SLF4J + Logback)를 사용하세요. `logger.error("메시지", e)`처럼 예외 객체를 두 번째 인자로 전달하면 stack trace가 포함됩니다. 단순히 `e.getMessage()`만 기록하면 문제의 정확한 위치를 알 수 없어 디버깅이 어렵습니다.
</details>

<details>
<summary><strong>Q: 예외를 무시(try-catch 비우기)해도 되나요?</strong></summary>

**절대 안 됩니다.** 빈 catch 블록은 예외를 숨겨 디버깅을 불가능하게 만듭니다. 최소한 로그를 기록하거나(`logger.error()`) 주석으로 무시하는 이유를 명확히 남기세요. 정말로 무시해야 하는 예외(예: 파일 닫기 실패)라도 `logger.trace()`나 `logger.debug()` 레벨로 기록하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: 예외 체이닝을 사용해야 하는 이유는 무엇인가요?</strong></summary>

예외 체이닝은 **저수준 예외를 고수준 예외로 변환**할 때 원인을 보존합니다. 데이터베이스 오류(SQLException)를 애플리케이션 예외(DatabaseException)로 변환할 때, 원본 SQLException을 `initCause()`로 전달하면 최종 사용자에게는 의미 있는 메시지를 보여주면서, 디버깅 시에는 원인을 추적할 수 있습니다.
</details>

---

## 요약

- **Checked**: IOException, SQLException — 컴파일러가 처리 강제
- **Unchecked**: NullPointerException, IllegalArgumentException
- **Exception Table**: try 시작/종료/핸들러 PC 매핑, JVM이 예외 발생 시 탐색
- **try-with-resources**: AutoCloseable, Suppressed 예외 자동 처리
- **사용자 정의 예외**: Exception 상속(checked) 또는 RuntimeException 상속(unchecked)
