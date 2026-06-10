---
layout: post
title: "C# 테스트 — 단위 테스트, 통합 테스트, xUnit, Moq, 테스트 더블, 테스트 필터"
description: "C#의 테스트 시스템을 실무 레벨에서 학습합니다. 단위 테스트는 개별 메서드나 클래스를 테스트하며 xUnit, NUnit, MSTest 프레임워크를 사용합니다. 통합 테스트는 여러 컴포넌트가 함께 작동하는지 테스트하며 TestServer로 ASP.NET Core를 테스트합니다. Moq는 모의 객체(mock)를 생성하여 의존성을 격리합니다. 테스트 더블은 여러 데이터 집합으로 테스트를 반복하며 [Theory], [InlineData] 특성을 사용합니다. 테스트 필터는 특정 테스트만 실행하며 [Trait], [Category] 특성을 사용합니다. 테스트는 AAA(Arrange-Act-Assert) 패턴을 따르며 FluentAssertions로 가독성 있는 어설션을 작성할 수 있습니다."
date: 2025-09-05 10:00:00 +0900
category: csharp
tags: [csharp, testing, unit-tests, integration-tests, xunit, moq, test-doubles]
level: advanced
---

C#의 테스트 프레임워크는 단위 테스트와 통합 테스트를 지원하며 풍부한 기능을 제공합니다.

> **핵심 정리** · 단위 테스트는 개별 메서드를 테스트합니다. xUnit, NUnit, MSTest 프레임워크를 사용합니다. 통합 테스트는 컴포넌트 통합을 테스트합니다. Moq로 모의 객체를 생성합니다. 테스트 더블로 데이터 집합을 반복합니다. 테스트 필터로 특정 테스트만 실행합니다.


## 수업 목표

- 단위 테스트를 작성할 수 있습니다.
- 통합 테스트를 작성할 수 있습니다.
- Moq로 모의 객체를 생성할 수 있습니다.
- 테스트 더블을 이해합니다.
- 테스트 필터를 이해합니다.
- AAA 패턴을 이해합니다.

## 프로젝트 설정

```bash
# xUnit 테스트 프로젝트 생성
dotnet new xunit -n MyProject.Tests

# 테스트 프로젝트에 프로젝트 참조 추가
cd MyProject.Tests
dotnet add reference ../MyProject

# 테스트 실행
dotnet test
```

xUnit은 .NET 표준 테스트 프레임워크입니다. `dotnet new xunit`로 테스트 프로젝트를 생성합니다. 프로젝트 참조를 추가하여 테스트 대상 코드에 접근합니다.

## 단위 테스트

```csharp
using Xunit;

public class CalculatorTests
{
    [Fact]
    public void Add_TwoNumbers_ReturnsSum()
    {
        // Arrange
        var calculator = new Calculator();
        int a = 5;
        int b = 3;

        // Act
        int result = calculator.Add(a, b);

        // Assert
        Assert.Equal(8, result);
    }

    [Theory]
    [InlineData(1, 2, 3)]
    [InlineData(5, 3, 8)]
    [InlineData(-1, 1, 0)]
    public void Add_WithInlineData_ReturnsSum(int a, int b, int expected)
    {
        // Arrange
        var calculator = new Calculator();

        // Act
        int result = calculator.Add(a, b);

        // Assert
        Assert.Equal(expected, result);
    }
}

public class Calculator
{
    public int Add(int a, int b)
    {
        return a + b;
    }
}
```

`[Fact]`는 매개변수 없는 테스트를 정의합니다. `[Theory]`와 `[InlineData]`는 매개변수 있는 테스트를 정의합니다. AAA(Arrange-Act-Assert) 패턴을 따르는 것이 좋습니다.

## Moq

```bash
# Moq 패키지 추가
dotnet add package Moq
```

```csharp
using Moq;
using Xunit;

public interface ILogger
{
    void Log(string message);
}

public class UserService
{
    private readonly ILogger _logger;

    public UserService(ILogger logger)
    {
        _logger = logger;
    }

    public void CreateUser(string name)
    {
        _logger.Log($"사용자 생성: {name}");
    }
}

public class UserServiceTests
{
    [Fact]
    public void CreateUser_LogsMessage()
    {
        // Arrange
        var mockLogger = new Mock<ILogger>();
        var userService = new UserService(mockLogger.Object);

        // Act
        userService.CreateUser("Wolhyong");

        // Assert
        mockLogger.Verify(l => l.Log("사용자 생성: Wolhyong"), Times.Once);
    }
}
```

Moq는 모의 객체를 생성합니다. `Mock<T>`로 인터페이스 모의를 생성합니다. `Object`로 모의 객체를 가져옵니다. `Verify`로 메서드 호출을 검증합니다.

## 통합 테스트

```bash
# Microsoft.AspNetCore.Mvc.Testing 패키지 추가
dotnet add package Microsoft.AspNetCore.Mvc.Testing
```

```csharp
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using MyWebApi;

public class PeopleControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public PeopleControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_ReturnsPeople()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/people");

        // Assert
        response.EnsureSuccessStatusCode();
    }
}
```

`WebApplicationFactory`는 통합 테스트를 위한 팩토리를 제공합니다. `CreateClient`로 HTTP 클라이언트를 생성합니다. 실제 ASP.NET Core 호스트에서 테스트를 실행합니다.

## 테스트 더블

```csharp
public class CalculatorTests
{
    [Theory]
    [MemberData(nameof(GetAddData))]
    public void Add_WithMemberData_ReturnsSum(int a, int b, int expected)
    {
        // Arrange
        var calculator = new Calculator();

        // Act
        int result = calculator.Add(a, b);

        // Assert
        Assert.Equal(expected, result);
    }

    public static TheoryData<int, int, int> GetAddData()
    {
        return new TheoryData<int, int, int>
        {
            { 1, 2, 3 },
            { 5, 3, 8 },
            { -1, 1, 0 }
        };
    }
}
```

`[MemberData]`는 메서드에서 데이터를 가져옵니다. `TheoryData<T1, T2, T3>`로 데이터를 정의합니다. 복잡한 데이터 집합에 유용합니다.

## 테스트 필터

```csharp
[Trait("Category", "Unit")]
public class CalculatorTests
{
    [Fact]
    public void Add_TwoNumbers_ReturnsSum()
    {
        // 테스트 코드
    }
}

[Trait("Category", "Integration")]
public class PeopleControllerTests
{
    [Fact]
    public async Task Get_ReturnsPeople()
    {
        // 테스트 코드
    }
}
```

`[Trait]`로 테스트에 메타데이터를 추가합니다. `dotnet test --filter "Category=Unit"`로 특정 테스트만 실행할 수 있습니다. 카테고리화에 유용합니다.

## FluentAssertions

```bash
# FluentAssertions 패키지 추가
dotnet add package FluentAssertions
```

```csharp
using FluentAssertions;
using Xunit;

public class CalculatorTests
{
    [Fact]
    public void Add_TwoNumbers_ReturnsSum()
    {
        var calculator = new Calculator();
        int result = calculator.Add(5, 3);

        result.Should().Be(8);
        result.Should().BeGreaterThan(5);
        result.Should().BeLessThan(10);
    }
}
```

FluentAssertions는 가독성 있는 어설션을 제공합니다. `Should().Be()`, `Should().BeGreaterThan()` 등으로 자연스러운 어설션을 작성할 수 있습니다.

## 비동기 테스트

```csharp
public class AsyncServiceTests
{
    [Fact]
    public async Task GetDataAsync_ReturnsData()
    {
        // Arrange
        var service = new AsyncService();

        // Act
        string result = await service.GetDataAsync();

        // Assert
        result.Should().NotBeNullOrEmpty();
    }
}

public class AsyncService
{
    public async Task<string> GetDataAsync()
    {
        await Task.Delay(100);
        return "Hello, World!";
    }
}
```

비동기 테스트는 `async Task`를 반환합니다. `await`로 비동기 작업을 기다립니다. 비동기 코드를 테스트할 때 필수적입니다.

## 예외 테스트

```csharp
public class CalculatorTests
{
    [Fact]
    public void Divide_ByZero_ThrowsException()
    {
        var calculator = new Calculator();

        Action act = () => calculator.Divide(10, 0);

        act.Should().Throw<DivideByZeroException>();
    }
}

public class Calculator
{
    public int Divide(int a, int b)
    {
        if (b == 0)
        {
            throw new DivideByZeroException();
        }
        return a / b;
    }
}
```

예외 테스트는 `Assert.Throws` 또는 `Should().Throw()`로 수행합니다. 예외 타입과 메시지를 검증할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> xUnit, NUnit, MSTest 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

xUnit은 .NET 표준이며 ASP.NET Core 팀이 사용합니다. NUnit은 더 많은 기능을 제공합니다. MSTest는 Visual Studio에 통합되어 있습니다. 팀 표준을 따르는 것이 좋습니다. 대부분의 경우 xUnit이 충분합니다.
</details>

<details>
<summary><strong>Q> 단위 테스트와 통합 테스트 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

단위 테스트는 개별 메서드/클래스를 테스트합니다. 빠르고 격리되어야 합니다. 통합 테스트는 컴포넌트 통합을 테스트합니다. 느리지만 실제 환경에 가깝습니다. 두 가지 모두 필요하며 비율을 잘 조절해야 합니다.
</details>

<details>
<summary><strong>Q> Moq는 언제 사용해야 하나요?</strong></summary>

Moq는 의존성을 격리할 때 사용합니다. 외부 서비스, 데이터베이스, 파일 시스템 등을 모의할 때 유용합니다. 단위 테스트에서 필수적입니다. 실제 구현을 사용하면 테스트가 느려지고 불안정해집니다.
</details>

<details>
<summary><strong>Q> 테스트 더블은 언제 사용해야 하나요?</strong></summary>

테스트 더블은 여러 데이터 집합으로 테스트를 반복할 때 사용합니다. 경계 값, 다양한 입력을 테스트할 때 유용합니다. `[InlineData]`는 간단한 데이터에, `[MemberData]`는 복잡한 데이터에 사용합니다.
</details>

<details>
<summary><strong>Q> AAA 패턴은 왜 중요한가요?</strong></summary>

AAA(Arrange-Act-Assert) 패턴은 테스트를 구조화합니다. Arrange는 테스트 설정, Act는 테스트 실행, Assert는 결과 검증입니다. 가독성을 높이고 테스트를 이해하기 쉽게 만듭니다. 모든 테스트에 적용하는 것이 좋습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **단위 테스트** | 개별 메서드 테스트 | 빠르고 격리 |
| **통합 테스트** | 컴포넌트 통합 테스트 | 실제 환경 |
| **xUnit** | .NET 표준 프레임워크 | [Fact], [Theory] |
| **Moq** | 모의 객체 생성 | Mock<T> |
| **WebApplicationFactory** | 통합 테스트 팩토리 | ASP.NET Core |
| **테스트 더블** | 데이터 집합 반복 | [InlineData] |
| **테스트 필터** | 특정 테스트 실행 | [Trait] |
| **AAA 패턴** | Arrange-Act-Assert | 구조화 |
| **FluentAssertions** | 가독성 있는 어설션 | Should().Be() |
| **비동기 테스트** | async Task 반환 | await 필요 |
| **예외 테스트** | 예외 검증 | Throws() |


## 다음 수업

다음 글에서는 C# 고급 — 성능 최적화, 프로파일러, 메모리 최적화, Span<T>, Memory<T>를 배웁니다.
