---
layout: post
title: "Kotlin 테스트 — 단위 테스트, 통합 테스트, MockK, JUnit, Kotest"
description: "Kotlin의 테스트 시스템을 실무 레벨에서 학습합니다. JUnit은 표준 테스트 프레임워크로 @Test 어노테이션으로 테스트 메서드를 정의합니다. MockK는 Kotlin 전용 모킹 라이브러리로 mockk(), every(), verify()로 모의 객체를 생성하고 검증합니다. Kotest는 Kotlin 전용 테스트 프레임워크로 should, shouldNot 등의 DSL을 제공합니다. 단위 테스트는 개별 함수/클래스를 테스트하며 통합 테스트는 여러 컴포넌트의 통합을 테스트합니다. 테스트 더블은 Stub, Mock, Fake, Spy로 구현합니다. 테스트는 코드 품질과 유지보수성을 높입니다."
date: 2025-10-31 10:00:00 +0900
category: kotlin
tags: [kotlin, testing, junit, mockk, kotest, unit-testing, integration-testing]
level: advanced
---

Kotlin의 테스트 시스템은 JUnit, MockK, Kotest 등의 라이브러리를 제공하며 풍부한 테스트 기능을 지원합니다.

> **핵심 정리** · `JUnit`은 표준 테스트 프레임워크입니다. `MockK`는 Kotlin 전용 모킹 라이브러리입니다. `Kotest`는 Kotlin 전용 테스트 프레임워크입니다. 단위 테스트는 개별 함수/클래스를 테스트합니다. 통합 테스트는 여러 컴포넌트를 테스트합니다. 테스트 더블로 의존성을 격리합니다.


## 수업 목표

- JUnit을 이해하고 사용할 수 있습니다.
- MockK를 이해하고 사용할 수 있습니다.
- Kotest를 이해합니다.
- 단위 테스트를 이해합니다.
- 통합 테스트를 이해합니다.
- 테스트 더블을 이해합니다.

## JUnit

```kotlin
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class CalculatorTest {
    @Test
    fun `add returns sum of two numbers`() {
        val calculator = Calculator()
        val result = calculator.add(10, 20)
        assertEquals(30, result)
    }

    @Test
    fun `subtract returns difference of two numbers`() {
        val calculator = Calculator()
        val result = calculator.subtract(20, 10)
        assertEquals(10, result)
    }
}

class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    fun subtract(a: Int, b: Int): Int = a - b
}
```

`JUnit`은 표준 테스트 프레임워크입니다. `@Test` 어노테이션으로 테스트 메서드를 정의합니다. `assertEquals`, `assertTrue`, `assertFalse` 등의 어서션을 제공합니다. `@Before`, `@After`로 설정/정리를 수행합니다.

## JUnit 어노테이션

```kotlin
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*

class UserRepositoryTest {
    private lateinit var repository: UserRepository

    @BeforeEach
    fun setUp() {
        repository = UserRepository()
    }

    @AfterEach
    fun tearDown() {
        repository.clear()
    }

    @Test
    fun `save and retrieve user`() {
        val user = User(1, "Wolhyong")
        repository.save(user)

        val retrieved = repository.getById(1)
        assertEquals(user, retrieved)
    }

    @Test
    fun `getById returns null for non-existent user`() {
        val retrieved = repository.getById(999)
        assertNull(retrieved)
    }
}
```

`@BeforeEach`는 각 테스트 전에 실행됩니다. `@AfterEach`는 각 테스트 후에 실행됩니다. `@BeforeAll`, `@AfterAll`은 전체 테스트 전후에 실행됩니다. 테스트 설정/정리를 수행합니다.

## MockK

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class UserServiceTest {
    @Test
    fun `getUserName returns user name`() {
        val repository = mockk<UserRepository>()
        val service = UserService(repository)

        every { repository.getById(1) } returns User(1, "Wolhyong")

        val name = service.getUserName(1)

        assertEquals("Wolhyong", name)
        verify { repository.getById(1) }
    }

    @Test
    fun `getUserName returns null for non-existent user`() {
        val repository = mockk<UserRepository>()
        val service = UserService(repository)

        every { repository.getById(1) } returns null

        val name = service.getUserName(1)

        assertNull(name)
        verify { repository.getById(1) }
    }
}

class UserService(private val repository: UserRepository) {
    fun getUserName(id: Int): String? {
        return repository.getById(id)?.name
    }
}
```

`MockK`는 Kotlin 전용 모킹 라이브러리입니다. `mockk()`로 모의 객체를 생성합니다. `every`로 메서드 호출을 설정합니다. `verify`로 메서드 호출을 검증합니다. Kotlin의 특성을 활용한 간결한 문법을 제공합니다.

## MockK 심화

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class UserServiceTest {
    @Test
    fun `saveUser calls repository save`() {
        val repository = mockk<UserRepository>(relaxed = true)
        val service = UserService(repository)

        service.saveUser(User(1, "Wolhyong"))

        verify { repository.save(any()) }
    }

    @Test
    fun `saveUser throws exception for null user`() {
        val repository = mockk<UserRepository>()
        val service = UserService(repository)

        every { repository.save(any()) } throws IllegalArgumentException("User cannot be null")

        assertThrows<IllegalArgumentException> {
            service.saveUser(null)
        }
    }

    @Test
    fun `getAllUsers returns empty list when repository is empty`() {
        val repository = mockk<UserRepository>()
        val service = UserService(repository)

        every { repository.getAll() } returns emptyList()

        val users = service.getAllUsers()

        assertTrue(users.isEmpty())
    }
}
```

`relaxed = true`로 기본 동작을 설정합니다. `any()`로 모든 인자를 매칭합니다. `throws`로 예외를 설정합니다. `assertThrows`로 예외를 검증합니다. 다양한 모킹 기능을 제공합니다.

## Kotest

```kotlin
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe

class CalculatorTest : StringSpec({
    "add returns sum of two numbers" {
        val calculator = Calculator()
        calculator.add(10, 20) shouldBe 30
    }

    "subtract returns difference of two numbers" {
        val calculator = Calculator()
        calculator.subtract(20, 10) shouldBe 10
    }

    "multiply returns product of two numbers" {
        val calculator = Calculator()
        calculator.multiply(5, 5) shouldBe 25
    }
})

class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    fun subtract(a: Int, b: Int): Int = a - b
    fun multiply(a: Int, b: Int): Int = a * b
}
```

`Kotest`는 Kotlin 전용 테스트 프레임워크입니다. `StringSpec`으로 테스트 스펙을 정의합니다. `shouldBe`, `shouldNotBe` 등의 매처를 제공합니다. 풍부한 DSL로 가독성이 좋은 테스트를 작성할 수 있습니다.

## Kotest 스펙

```kotlin
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe

class UserRepositoryTest : DescribeSpec({
    describe("UserRepository") {
        val repository = UserRepository()

        beforeEach {
            repository.clear()
        }

        describe("save") {
            it("saves user to repository") {
                val user = User(1, "Wolhyong")
                repository.save(user)

                repository.getById(1) shouldBe user
            }
        }

        describe("getById") {
            it("returns user when exists") {
                val user = User(1, "Wolhyong")
                repository.save(user)

                repository.getById(1) shouldBe user
            }

            it("returns null when not exists") {
                repository.getById(999) shouldBe null
            }
        }
    }
})
```

`DescribeSpec`으로 계층 구조의 테스트를 정의합니다. `describe`, `it`으로 테스트를 구성합니다. `beforeEach`로 설정을 수행합니다. BDD 스타일 테스트를 지원합니다.

## 단위 테스트

```kotlin
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class CalculatorTest {
    @Test
    fun `add returns correct sum`() {
        val calculator = Calculator()
        assertEquals(30, calculator.add(10, 20))
    }

    @Test
    fun `add handles negative numbers`() {
        val calculator = Calculator()
        assertEquals(-10, calculator.add(-20, 10))
    }

    @Test
    fun `add handles zero`() {
        val calculator = Calculator()
        assertEquals(10, calculator.add(10, 0))
    }
}
```

단위 테스트는 개별 함수/클래스를 테스트합니다. 의존성을 격리하여 빠르게 실행됩니다. 다양한 케이스를 테스트하여 버그를 방지합니다. 리팩토링 시 안전성을 제공합니다.

## 통합 테스트

```kotlin
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.beans.factory.annotation.Autowired

@SpringBootTest
class UserServiceIntegrationTest {
    @Autowired
    private lateinit var userService: UserService

    @Autowired
    private lateinit var userRepository: UserRepository

    @Test
    fun `create and retrieve user`() {
        val user = User(1, "Wolhyong")
        userService.createUser(user)

        val retrieved = userService.getUser(1)
        assertEquals(user, retrieved)
    }

    @Test
    fun `update user`() {
        val user = User(1, "Wolhyong")
        userService.createUser(user)

        val updated = user.copy(name = "Updated")
        userService.updateUser(updated)

        val retrieved = userService.getUser(1)
        assertEquals("Updated", retrieved?.name)
    }
}
```

통합 테스트는 여러 컴포넌트의 통합을 테스트합니다. 실제 데이터베이스, 네트워크 등을 사용합니다. 시스템이 전체적으로 올바르게 작동하는지 확인합니다. 단위 테스트보다 느리지만 더 포괄적입니다.

## 테스트 더블

```kotlin
// Stub (고정 응답)
class UserRepositoryStub : UserRepository {
    override fun getById(id: Int): User? {
        return User(1, "Wolhyong")
    }
}

// Mock (호출 검증)
val repository = mockk<UserRepository>()
every { repository.getById(1) } returns User(1, "Wolhyong")

// Fake (실제 구현)
class InMemoryUserRepository : UserRepository {
    private val users = mutableMapOf<Int, User>()

    override fun getById(id: Int): User? = users[id]
    override fun save(user: User) { users[user.id] = user }
}

// Spy (부분 모의)
val repository = spyk<UserRepository>()
every { repository.getById(1) } returns User(1, "Wolhyong")
```

테스트 더블은 의존성을 격리합니다. `Stub`은 고정 응답을 반환합니다. `Mock`은 호출을 검증합니다. `Fake`는 실제 구현을 제공합니다. `Spy`는 부분적으로 모의합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> JUnit과 Kotest 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`JUnit`을 우선 사용해야 합니다. 표준 프레임워크로 널리 사용됩니다. `Kotest`는 Kotlin 전용 DSL을 원할 때 사용합니다. 팀 선호도에 따라 선택합니다. 두 가지를 함께 사용할 수도 있습니다.
</details>

<details>
<summary><strong>Q> MockK와 Mockito 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`MockK`를 사용해야 합니다. Kotlin 전용으로 간결하고 표현력이 풍부합니다. `Mockito`는 Java 라이브러리로 Kotlin에서도 사용할 수 있습니다. Kotlin 코드에서는 `MockK`를 우선 사용해야 합니다.
</details>

<details>
<summary><strong>Q> 단위 테스트와 통합 테스트 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

단위 테스트를 우선 사용해야 합니다. 빠르고 격리된 테스트를 제공합니다. 통합 테스트는 시스템 통합을 확인할 때 사용합니다. 피라미드 테스트 전략을 따르는 것이 좋습니다. 단위 테스트 70%, 통합 테스트 20%, E2E 테스트 10%.
</details>

<details>
<summary><strong>Q> 테스트 더블은 언제 사용해야 하나요?</strong></summary>

테스트 더블은 의존성을 격리할 때 사용합니다. 외부 서비스, 데이터베이스 등에 사용합니다. 테스트 속도를 높이고 안정성을 제공합니다. 모든 테스트에 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 테스트 커버리지는 어느 정도여야 하나요?</strong></summary>

테스트 커버리지는 80% 이상을 목표로 해야 합니다. 하지만 커버리지만으로는 충분하지 않습니다. 중요한 로직은 100% 커버리지를 목표로 합니다. 품질 있는 테스트가 더 중요합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **JUnit** | 표준 테스트 프레임워크 | @Test |
| **MockK** | Kotlin 모킹 라이브러리 | mockk(), every() |
| **Kotest** | Kotlin 테스트 프레임워크 | shouldBe, describe |
| **단위 테스트** | 개별 함수/클래스 | 빠름, 격리 |
| **통합 테스트** | 여러 컴포넌트 | 느림, 포괄적 |
| **Stub** | 고정 응답 | 테스트 더블 |
| **Mock** | 호출 검증 | 테스트 더블 |
| **Fake** | 실제 구현 | 테스트 더블 |
| **Spy** | 부분 모의 | 테스트 더블 |
| **@BeforeEach** | 테스트 전 설정 | JUnit |
| **@AfterEach** | 테스트 후 정리 | JUnit |
| **verify** | 호출 검증 | MockK |
| **assertThrows** | 예외 검증 | JUnit |


## 다음 수업

다음 글에서는 Kotlin 고급 — 성능 최적화, 메모리 관리, 프로파일링을 배웁니다.
