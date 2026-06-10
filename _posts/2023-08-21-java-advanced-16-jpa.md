---
layout: post
title: "Java JPA — 영속성 컨텍스트, 엔티티 매핑, 연관 관계, JPQL, 벌크 연산"
description: "Java JPA(Java Persistence API)를 Hibernate의 내부 구조까지 심층 학습합니다. 영속성 컨텍스트(PersistenceContext)가 1차 캐시로 동작하며 엔티티 스냅샷으로 변경을 감지하는 Dirty Checking 과정, @Entity의 테이블 매핑과 @Id 생성 전략(SEQUENCE/TABLE/IDENTITY), 연관 관계(@OneToMany/@ManyToOne)의 FetchType.LAZY가 프록시 객체를 생성하는 메커니즘, JPQL이 SQL로 변환되어 실행되는 과정, 벌크 연산(@Modifying + @Query)이 영속성 컨텍스트를 무시하는 문제를 다룹니다."
date: 2023-08-21 10:00:00 +0900
category: java
tags: [java, jpa, hibernate, persistence-context, entity-mapping, jpql, dirty-checking]
level: advanced
---

JPA는 Java 객체와 관계형 데이터베이스 간의 매핑을 위한 표준 ORM 명세입니다. Hibernate가 가장 대표적인 구현체입니다.

> **💡 핵심 정리** · JPA 영속성 컨텍스트는 `Map<Class, Map<Id, Entity>>` 구조로 1차 캐시를 유지하며, 엔티티의 스냅샷(로딩 시점의 필드 값)과 현재 값을 비교하여 `flush()` 시점에 변경된 필드만 UPDATE합니다. `FetchType.LAZY`는 Hibernate가 프록시 객체(bytecode instrumented)를 생성하여 실제 데이터 접근 시점에 SQL을 실행합니다. JPQL은 엔티티를 대상으로 하는 객체지향 쿼리로, Hibernate가 `org.hibernate.hql.internal.ast.QueryTranslatorImpl`로 AST 파싱 후 SQL로 변환합니다.

---

## 📚 수업 목표

- 영속성 컨텍스트와 1차 캐시의 동작을 이해합니다.
- 엔티티 매핑과 연관 관계를 설정할 수 있습니다.
- 지연 로딩과 프록시의 동작을 이해합니다.
- JPQL을 작성할 수 있습니다.
- 벌크 연산의 제한사항을 이해합니다.

## 엔티티 매핑

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true)
    private String email;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Post> posts = new ArrayList<>();
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 영속성 컨텍스트의 1차 캐시는 무엇인가요?</strong></summary>

1차 캐시는 트랜잭션 내에서 조회된 엔티티를 저장하는 메모리 맵입니다. 같은 트랜잭션 내에서 같은 ID로 다시 조회하면 SQL 없이 캐시에서 반환합니다. 1차 캐시는 트랜잭션 종료 시 사라지고, 여러 트랜잭션이 공유하지 않습니다. 1차 캐시 덕분에 같은 엔티티를 여러 번 조회해도 SQL이 한 번만 실행됩니다.
</details>

<details>
<summary><strong>Q: CascadeType과 orphanRemoval의 차이는 무엇인가요?</strong></summary>

**CascadeType**은 부모 엔티티의 상태 변화(저장, 삭제 등)를 자식에게 전파합니다. **orphanRemoval=true**는 부모와의 관계가 끊어진 자식 엔티티를 자동으로 삭제합니다(고아 객체 제거). 일반적으로 `CascadeType.PERSIST + CascadeType.MERGE`를 사용하고, 소유 관계가 명확할 때만 `orphanRemoval=true`를 추가하세요. `CascadeType.ALL`은 신중하게 사용해야 합니다.
</details>

<details>
<summary><strong>Q: N+1 문제를 JPQL로 어떻게 해결하나요?</strong></summary>

JPQL에서 **JOIN FETCH**를 사용하세요: `SELECT u FROM User u JOIN FETCH u.posts WHERE u.id = :id`. Fetch Join은 연관된 엔티티를 JOIN으로 한 번에 로딩합니다. `@EntityGraph`도 같은 효과를 냅니다. 주의: Fetch Join을 사용하면 페이징(`setFirstResult`/`setMaxResults`)이 메모리에서 처리되어 성능 문제가 발생할 수 있습니다(Paging with Collection Fetch Join). 이 경우 `@BatchSize`로 처리하세요.
</details>

<details>
<summary><strong>Q: 쓰기 지연(Write-behind)이란 무엇인가요?</strong></summary>

JPA는 엔티티의 변경을 즉시 DB에 반영하지 않고 **트랜잭션 커밋 시점까지 SQL을 모아두었다가 한 번에 실행**합니다. 이를 통해 여러 개의 INSERT/UPDATE를 배치로 처리하여 성능을 향상시킵니다. `hibernate.jdbc.batch_size`로 배치 크기를 설정할 수 있습니다. 쓰기 지연 덕분에 같은 타입의 여러 변경이 하나의 JDBC 배치로 최적화됩니다.
</details>

<details>
<summary><strong>Q: 벌크 연산 후 영속성 컨텍스트를 초기화해야 하는 이유는 무엇인가요?</strong></summary>

JPQL 벌크 연산(`UPDATE ... SET ... WHERE`)은 **영속성 컨텍스트를 거치지 않고 직접 DB에 실행**됩니다. 따라서 영속성 컨텍스트에 있는 기존 엔티티는 DB와 다른 값을 가지게 됩니다(데이터 불일치). 벌크 연산 후에는 반드시 `entityManager.clear()`로 영속성 컨텍스트를 초기화하거나, `@Modifying(clearAutomatically = true)`를 설정해야 합니다.
</details>

---

## 요약

- **영속성 컨텍스트**: 1차 캐시(Map<Class, Map<Id, Entity>>), Dirty Checking(스냅샷 비교)
- **매핑**: @Entity → @Table, @Id → @GeneratedValue, @Column
- **연관 관계**: @ManyToOne(즉시/EAGER), @OneToMany(지연/LAZY), Fetch Join
- **JPQL**: 엔티티 대상 쿼리, AST 파싱 후 SQL 변환
- **벌크 연산**: @Modifying + @Query, 영속성 컨텍스트 무시 → clear 필요
