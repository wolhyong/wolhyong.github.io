---
layout: post
title: "PHPUnit 테스팅 — 단위 테스트, 목 객체, 데이터 제공자, 코드 커버리지"
description: "PHPUnit을 사용한 테스팅 전략을 PHPUnit 프레임워크의 내부 동작 레벨에서 심층 학습합니다. PHPUnit이 리플렉션(ReflectionClass)으로 테스트 클래스의 @test 어노테이션 또는 test* 메서드를 수집하고, 각 테스트 메서드마다 새 인스턴스를 생성하여 격리(isolation)하는 과정(setUpBeforeClass → setUp → test → tearDown → tearDownAfterClass), 목 객체(Mock)가 PHPUnit의 MockObject 생성기로 동적 클래스(프록시)를 생성하고 expect 메서드의 매처(matcher)를 등록하는 원리, 데이터 제공자(data provider)가 @dataProvider 어노테이션으로 메서드에서 반환된 배열을 각 테스트 케이스로 분할하는 방식, 코드 커버리지의 Xdebug/PCOV 기반 라인/브랜치 커버리지 측정과 HTML 리포트 생성을 다룹니다."
date: 2023-12-25 10:00:00 +0900
category: php
tags: [php, phpunit, testing, mock, code-coverage, tdd]
level: advanced
---

PHPUnit은 PHP의 사실상 표준 단위 테스트 프레임워크로, 리플렉션 기반의 테스트 수집과 격리 메커니즘을 제공합니다.

> **💡 핵심 정리** · PHPUnit은 `PHPUnit\TextUI\Command::main()`으로 진입하여 CLI 인자를 파싱하고, `TestSuite`가 `ReflectionClass::getMethods()`로 테스트 메서드를 수집합니다. 각 테스트는 새 테스트 객체에서 실행되어 완전한 격리(isolation)를 보장합니다. 목 객체(Mock)는 `getMockBuilder()` 호출 시 `MockObject` 생성기가 소스 코드를 동적으로 생성하고 `eval()`하여 `expects()` 메서드로 등록된 매처(matcher — `any()`/`exactly(2)`/`atLeast()`)에 따라 행동을 검증합니다.

---

## 📚 수업 목표

- PHPUnit의 테스트 격리 메커니즘을 이해합니다.
- 목 객체(Mock)의 동작 원리를 이해합니다.
- 데이터 제공자를 이해합니다.
- 코드 커버리지를 이해합니다.
- TDD(Test-Driven Development) 워크플로우를 이해합니다.

## 기본 테스트

```php
<?php
use PHPUnit\Framework\TestCase;

class UserServiceTest extends TestCase
{
    private UserRepository $repository;
    private UserService $service;

    // 각 테스트 전에 실행
    protected function setUp(): void
    {
        $this->repository = $this->createMock(UserRepository::class);
        $this->service = new UserService($this->repository);
    }

    /** @test */
    public function findUser_returns_user_when_exists(): void
    {
        // Arrange
        $expectedUser = new User(1, 'Alice', 'alice@example.com');
        $this->repository
            ->expects($this->once())
            ->method('findById')
            ->with(1)
            ->willReturn($expectedUser);

        // Act
        $result = $this->service->findUser(1);

        // Assert
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals('Alice', $result->getName());
    }

    /** @dataProvider invalidIdProvider */
    public function test_findUser_throws_exception_for_invalid_id(mixed $id): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->findUser($id);
    }

    public static function invalidIdProvider(): array
    {
        return [
            'negative' => [-1],
            'zero'     => [0],
            'null'     => [null],
            'string'   => ['abc'],
        ];
    }
}
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: createMock과 getMockBuilder의 차이는 무엇인가요?</strong></summary>

`createMock(ClassName::class)`는 기본 설정(모든 메서드가 null 반환, `$this->any()` 매처)으로 빠르게 목을 생성합니다. `getMockBuilder(ClassName::class)`는 더 세밀한 제어가 가능합니다: `disableOriginalConstructor()`(생성자 호출 방지), `setMethods(['method1'])`(특정 메서드만 목킹), `enableProxyingToOriginalMethods()`(기본 메서드는 실제 호출). 대부분의 경우 `createMock()`으로 충분하고, 복잡한 설정이 필요할 때만 `getMockBuilder()`를 사용하세요.
</details>

<details>
<summary><strong>Q: 코드 커버리지 측정 시 Xdebug와 PCOV의 차이는 무엇인가요?</strong></summary>

**Xdebug**는 디버깅과 프로파일링 도구로, 코드 커버리지 기능도 제공합니다. 기능이 풍부하지만 **성능 오버헤드가 큽니다**(테스트 실행 시간 5~10배 증가). **PCOV**(PHP Code Coverage)는 커버리지 측정에 특화된 경량 확장입니다. Xdebug보다 **훨씬 빠르고**(오버헤드 약 2~3배), 메모리 사용량도 적습니다. CI 환경에서 커버리지만 필요하다면 PCOV를 권장합니다. `phpunit --coverage-html coverage/ --coverage-text`로 HTML 리포트와 텍스트 요약을 생성할 수 있습니다.
</details>

<details>
<summary><strong>Q: @test 어노테이션과 test 접두사 중 어떤 것을 사용해야 하나요?</strong></summary>

두 방식 모두 PHPUnit이 지원합니다. `test` 접두사: `public function test_something_works(): void` — 네이티브 PHP 문법으로 IDE 지원이 좋습니다. `@test` 어노테이션: `/** @test */ public function something_works(): void` — 메서드명이 자연어로 읽힙니다. **PHP 8 어트리뷰트**(PHPUnit 10+): `#[Test]` — 가장 현대적인 방식입니다. PHP 8.1+ 프로젝트라면 `#[Test]` 어트리뷰트를 권장합니다. 메서드 시그니처를 자유롭게 작성할 수 있고 타입 안전합니다.
</details>

<details>
<summary><strong>Q: PHPUnit 10에서 변경된 주요 사항은 무엇인가요?</strong></summary>

PHPUnit 10(2023년 2월)은 많은 변경 사항이 있습니다: 1) **어노테이션 → 어트리뷰트**: `@test` → `#[Test]`, `@dataProvider` → `#[DataProvider]`, `@group` → `#[Group]`. 2) **기본 템플릿 제거**: 더 이상 `PHPUnit_Framework_TestCase`가 없습니다. 3) **@deprecated 검증**: `#[Deprecated]` 어트리뷰트로 deprecated 코드 경고 테스트. 4) **정적 분석 개선**: `assertContains()` 등의 반환 타입이 `void`로 고정. 5) **더 엄격한 타입**: 모든 메서드에 `void` 반환 타입 필수. PHPUnit 11에서는 더 많은 어트리뷰트 전환이 진행됩니다.
</details>

<details>
<summary><strong>Q: 테스트를 작성할 때 should와 test 중 어떤 네이밍을 사용해야 하나요?</strong></summary>

두 네이밍 컨벤션이 널리 사용됩니다: **테스트 우선**: `test_` 접두사 + 언더스코어 — `test_find_user_returns_user_when_exists()`(PHP 전통적), **행동 중심**: `should_` — `should_return_user_when_exists()`(BDD 스타일). PHP 커뮤니티에서는 `test_` 접두사가 더 일반적입니다(PHPUnit 기본). 중요한 것은 **일관성**과 **가독성**이며, 메서드명에서 Given_When_Then을 명확히 표현하는 것이 더 중요합니다. 예: `test_it_throws_exception_when_user_not_found()`. PHP 8에서는 `#[\PHPUnit\Framework\Attributes\Test]`와 함께 자연어 메서드명을 사용하는 추세입니다.
</details>

---

## 요약

- **테스트 격리**: 각 테스트마다 새 객체 인스턴스 생성, setUp/tearDown 생명주기
- **Mock 객체**: 동적 프록시 생성, expects() 매처(once, exactly, any)로 행동 검증
- **데이터 제공자**: @dataProvider → 배열을 여러 테스트 케이스로 분할
- **어트리뷰트(PHP 10+)**: `#[Test]`, `#[DataProvider]`, `#[Group]`
- **코드 커버리지**: Xdebug(풍부, 느림) vs PCOV(경량, 빠름)
- **TDD 사이클**: Red(실패 테스트) → Green(최소 구현) → Refactor(개선)
