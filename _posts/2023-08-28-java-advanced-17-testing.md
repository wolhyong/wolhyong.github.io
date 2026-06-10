---
layout: post
title: "Java 테스팅 — JUnit 5, Mockito, 통합 테스트, Spring Boot Test, TDD"
description: "Java 테스팅 프레임워크를 심층 학습합니다. JUnit 5의 Jupiter 아키텍처(TestEngine → TestTemplate → TestInstanceFactory), Mockito의 mock() 동작(CGLIB/ByteBuddy로 프록시 생성), BDDMockito의 given/willReturn 스타일, Spring Boot Test 슬라이스 테스트(@WebMvcTest/@DataJpaTest)가 특정 Bean만 로딩하는 과정, @SpringBootTest의 전체 컨테이너 통합 테스트, 테스트 컨테이너(Testcontainers)로 실제 DB를 도커 컨테이너로 실행하는 방법을 다룹니다."
date: 2023-08-28 10:00:00 +0900
category: java
tags: [java, junit5, mockito, spring-boot-test, testcontainers, tdd]
level: advanced
---

Java 테스팅은 JUnit, Mockito, Spring Boot Test 등 강력한 도구 생태계를 갖추고 있습니다.

> **💡 핵심 정리** · JUnit 5 Jupiter는 `TestEngine` SPI로 실행되며, `@TestTemplate` 메서드를 `TestInstanceFactory`가 생성한 인스턴스에서 실행합니다. Mockito는 ByteBuddy(Java 9+) 또는 CGLIB로 대상 클래스의 프록시를 생성하여 모든 메서드 호출을 가로챕니다. Spring Boot의 `@WebMvcTest`는 `WebMvcAutoConfiguration`만 활성화하여 컨트롤러 레이어만 슬라이스 테스트합니다.

---

## 📚 수업 목표

- JUnit 5의 아키텍처를 이해합니다.
- Mockito로 의존성을 격리할 수 있습니다.
- Spring Boot 슬라이스 테스트를 이해합니다.
- Testcontainers로 통합 테스트를 작성할 수 있습니다.
- TDD 사이클을 적용할 수 있습니다.

## JUnit 5 기본

```java
import org.junit.jupiter.api.*;

class CalculatorTest {

    @BeforeAll
    static void setupAll() {
        // 모든 테스트 전 1회 실행
    }

    @BeforeEach
    void setup() {
        // 각 테스트 전 실행
    }

    @Test
    @DisplayName("두 수의 덧셈")
    void testAddition() {
        assertEquals(5, calculator.add(2, 3));
        assertTrue(calculator.add(0, 0) == 0);
        assertThrows(IllegalArgumentException.class,
            () -> calculator.add(null, 1));
    }

    @Test
    @ParameterizedTest
    @CsvSource({"1,2,3", "10,20,30", "0,0,0"})
    void testAdditionParameterized(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: JUnit 4와 JUnit 5의 주요 차이는 무엇인가요?</strong></summary>

1) **아키텍처**: JUnit 5는 모듈화(Jupiter + Vintage + Platform), JUnit 4는 단일 jar. 2) **Java 버전**: JUnit 5는 Java 8+, JUnit 4는 Java 5+. 3) **확장**: JUnit 5는 `Extension` 인터페이스(Spring Extension, Mockito Extension), JUnit 4는 `@RunWith`와 `@Rule`. 4) **애너테이션**: JUnit 5는 `@Test`에 옵션 불필요, `@DisplayName`, `@ParameterizedTest` 등 추가. 5) **Assertions**: JUnit 5의 `assertAll()`, `assertThrows()`, `assertTimeout()`.
</details>

<details>
<summary><strong>Q: Mockito의 when()과 doReturn()의 차이는 무엇인가요?</strong></summary>

`when(mock.method()).thenReturn(value)`는 **실제 메서드를 먼저 호출**한 후 스텁을 설정합니다. void 메서드나 spy 객체에서는 문제가 발생할 수 있습니다. `doReturn(value).when(mock).method()`는 **메서드를 호출하지 않고** 스텁을 설정하므로, void 메서드나 spy에서 안전합니다. 실무에서는 `doReturn()`/`doThrow()`/`doAnswer()` 패턴이 더 안전합니다.
</details>

<details>
<summary><strong>Q: @WebMvcTest와 @SpringBootTest의 차이는 무엇인가요?</strong></summary>

**@WebMvcTest**는 웹 레이어(컨트롤러)만 테스트합니다. `@Controller`, `@ControllerAdvice`, `Filter` 등 웹 관련 Bean만 로딩하고, 서비스나 리포지토리는 Mock으로 대체합니다. 실행 속도가 빠릅니다(일부 Bean만 로딩). **@SpringBootTest**는 전체 애플리케이션 컨텍스트를 로딩하여 통합 테스트합니다. 모든 Bean이 로딩되므로 느리지만, 실제 환경과 가장 유사한 테스트가 가능합니다.
</details>

<details>
<summary><strong>Q: Testcontainers를 사용하는 이유는 무엇인가요?</strong></summary>

Testcontainers는 테스트에서 **실제 데이터베이스, Redis, Kafka 등을 Docker 컨테이너로 실행**합니다. H2 같은 인메모리 DB는 실제 DB와 SQL 방언, 트랜잭션 동작, 인덱스 동작이 다를 수 있습니다. Testcontainers는 `@Testcontainers` + `@Container`로 컨테이너 생명주기를 관리하며, 실제 프로덕션 환경과 동일한 조건에서 테스트할 수 있습니다. 단, Docker가 필요하고 테스트 실행이 약간 느려집니다.
</details>

<details>
<summary><strong>Q: TDD에서 테스트를 먼저 작성하는 것이 항상 좋은가요?</strong></summary>

TDD는 **설계 도구**로서 가치가 있습니다. 테스트를 먼저 작성하면: 1) **API 설계**가 명확해짐(사용자 관점에서 인터페이스 결정), 2) **테스트 가능한 코드**가 됨(의존성 분리, 모듈화), 3) **리팩토링 안전망** 확보. 하지만 모든 상황에 TDD가 적합한 것은 아닙니다. 프로토타입, 탐색적 프로그래밍, UI 개발에는 TDD가 오히려 생산성을 떨어뜨릴 수 있습니다.
</details>

---

## 요약

- **JUnit 5**: Jupiter(최신) + Vintage(하위 호환) + Platform(런처), 확장 모듈화
- **Mockito**: ByteBuddy/CGLIB 프록시, when()/doReturn() 스텁, verify() 검증
- **Spring Boot Test**: @WebMvcTest(웹), @DataJpaTest(JPA), @SpringBootTest(전체)
- **Testcontainers**: Docker 컨테이너로 실제 DB/미들웨어 테스트
- **TDD**: Red(실패) → Green(통과) → Refactor(개선) 사이클
