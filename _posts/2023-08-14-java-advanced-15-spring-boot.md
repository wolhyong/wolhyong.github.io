---
layout: post
title: "Spring Boot — 의존성 주입, REST API, JPA, AOP, 설정 관리"
description: "Spring Boot 프레임워크를 내부 동작 원리와 함께 심층 학습합니다. IoC 컨테이너의 Bean 생명주기(스캐닝 → Definition → 생성 → 의존성 주입 → 초기화), @Autowired의 필드/생성자/세터 주입 방식과 순환 참조 해결, REST API(@RestController)의 내부에서 HttpMessageConverter가 Java 객체를 JSON으로 변환하는 과정(Jackson ObjectMapper), JPA의 영속성 컨텍스트(1차 캐시, 변경 감지, 지연 로딩), AOP의 프록시 기반 동작(CGLIB/JDK Proxy)을 다룹니다."
date: 2023-08-14 10:00:00 +0900
category: java
tags: [java, spring-boot, dependency-injection, rest-api, jpa, aop, ioc]
level: advanced
---

Spring Boot는 Java 엔터프라이즈 애플리케이션 개발을 혁신적으로 단순화한 프레임워크입니다. 복잡한 설정을 자동화하고 생산성을 극대화합니다.

> **💡 핵심 정리** · Spring IoC 컨테이너는 `@ComponentScan`으로 패키지를 스캔하여 BeanDefinition을 생성하고, `@Autowired`가 달린 생성자/필드/세터를 분석하여 의존성 그래프를 구성합니다. `@RestController` 메서드의 반환값은 `HttpMessageConverter`(보통 `MappingJackson2HttpMessageConverter`)가 `ObjectMapper.writeValue()`로 JSON 직렬화합니다. Spring AOP는 인터페이스가 있으면 JDK Dynamic Proxy(Proxy.newProxyInstance), 없으면 CGLIB Enhancer로 프록시 객체를 생성하여 `@Transactional`, `@Cacheable` 등을 구현합니다.

---

## 📚 수업 목표

- IoC 컨테이너와 의존성 주입의 동작을 이해합니다.
- REST API를 설계하고 구현할 수 있습니다.
- JPA 영속성 컨텍스트를 이해합니다.
- AOP의 프록시 기반 동작을 이해합니다.
- Spring Boot의 자동 설정 원리를 이해합니다.

## Spring Boot 기본

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody UserDto dto) {
        User saved = userService.create(dto);
        return ResponseEntity.created(
            URI.create("/api/users/" + saved.getId())).build();
    }
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 생성자 주입과 필드 주입 중 어떤 것이 더 좋은가요?</strong></summary>

**생성자 주입**이 더 좋습니다. 1) **불변성**: `final` 필드 선언 가능(객체 생성 시점에 의존성이 확정). 2) **테스트 용이성**: Mock 객체를 생성자에 직접 전달 가능(리플렉션 불필요). 3) **순환 참조 감지**: 컴파일 타임에 순환 참조 발견. 4) **Null 안전성**: 필수 의존성이 null인 경우 생성자에서 즉시 실패. Spring 팀도 공식적으로 생성자 주입을 권장합니다.
</details>

<details>
<summary><strong>Q: @Transactional은 어떻게 동작하나요?</strong></summary>

Spring AOP가 프록시 객체를 생성하여 `@Transactional` 메서드 호출을 가로챕니다. 프록시는 메서드 실행 전에 `Connection.setAutoCommit(false)`를 호출하여 트랜잭션을 시작하고, 메서드가 정상 종료되면 `commit()`, 예외가 발생하면 `rollback()`을 호출합니다. **주의**: 같은 클래스 내에서 `@Transactional` 메서드를 직접 호출하면 프록시가 동작하지 않습니다(self-invocation 문제).
</details>

<details>
<summary><strong>Q: JPA의 N+1 문제를 어떻게 해결하나요?</strong></summary>

1) **Fetch Join**: JPQL에 `JOIN FETCH` 사용(한 번의 쿼리로 연관 데이터 로딩). 2) **@EntityGraph**: `@EntityGraph(attributePaths = {"posts"})`로 페치 조인 지정. 3) **BatchSize**: `@BatchSize(size = 10)`로 IN 쿼리로 한 번에 로딩. 4) **Querydsl**: 동적 쿼리로 페치 조인 제어. 가장 간단한 방법은 `spring.jpa.open-in-view=false`로 설정하고 서비스 레이어에서 필요한 데이터를 명시적으로 로딩하는 것입니다.
</details>

<details>
<summary><strong>Q: Spring Boot의 자동 설정은 어떻게 동작하나요?</strong></summary>

`@SpringBootApplication`의 `@EnableAutoConfiguration`이 핵심입니다. `spring.factories` 파일에 등록된 `AutoConfiguration` 클래스를 로딩하고, `@ConditionalOnClass`, `@ConditionalOnProperty`, `@ConditionalOnMissingBean` 등의 조건을 평가하여 필요한 Bean만 등록합니다. 예를 들어, H2 데이터베이스가 classpath에 있으면 자동으로 DataSource를 구성합니다.
</details>

<details>
<summary><strong>Q: AOP의 @Around와 @Before/@After의 차이는 무엇인가요?</strong></summary>

**@Before**는 대상 메서드 실행 전에 실행됩니다(값 변경 불가). **@After**는 대상 메서드 실행 후에 실행됩니다(정상/예외 모두). **@Around**는 대상 메서드의 실행 자체를 제어합니다. `ProceedingJoinPoint.proceed()`로 대상 메서드를 직접 호출하며, 전후 처리, 실행 시간 측정, 반환값 변경, 예외 변환 등이 가능합니다. `@Around`가 가장 강력하지만, 필요한 경우에만 사용하세요(복잡도 증가).
</details>

---

## 요약

- **IoC/DI**: Bean 생성 → 의존성 주입 → 초기화, 생성자 주입 권장
- **REST API**: @RestController, HttpMessageConverter(JSON 직렬화)
- **JPA**: 영속성 컨텍스트(1차 캐시), 변경 감지(Dirty Checking), 지연 로딩
- **AOP**: JDK Proxy / CGLIB, @Transactional/@Cacheable/@Logging
- **자동 설정**: spring.factories + @Conditional 조건 평가
