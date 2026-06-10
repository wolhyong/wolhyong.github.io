---
layout: post
title: "C# 의존성 주입 — DI 컨테이너, IoC 컨테이너, 서비스 수명 주기, Microsoft.Extensions.DependencyInjection"
description: "C#의 의존성 주입 시스템을 실무 레벨에서 학습합니다. 의존성 주입(DI)은 객체의 의존성을 외부에서 주입하여 결합도를 낮추고 테스트 가능성을 높입니다. IoC(Inversion of Control) 컨테이너는 객체 생성과 수명 주기를 관리하며 Microsoft.Extensions.DependencyInjection이 표준 DI 컨테이너입니다. 서비스 수명 주기는 Transient(매번 새 인스턴스), Scoped(요청 범위), Singleton(애플리케이션 전체)로 구분됩니다. AddTransient, AddScoped, AddSingleton으로 서비스를 등록하며 IServiceProvider로 서비스를 해결합니다. 생성자 주입, 메서드 주입, 속성 주입을 지원하며 ILogger, IConfiguration 등의 내장 서비스를 제공합니다."
date: 2025-08-29 10:00:00 +0900
category: csharp
tags: [csharp, dependency-injection, ioc-container, service-lifetime, microsoft-extensions-dependencyinjection]
level: advanced
---

C#의 의존성 주입은 느슨한 결합과 테스트 가능성을 제공하는 핵심 디자인 패턴입니다.

> **핵심 정리** · DI는 의존성을 외부에서 주입하여 결합도를 낮춥니다. IoC 컨테이너는 객체 생성과 수명 주기를 관리합니다. `Transient`, `Scoped`, `Singleton` 수명 주기를 제공합니다. `AddTransient`, `AddScoped`, `AddSingleton`으로 서비스를 등록합니다. `IServiceProvider`로 서비스를 해결합니다.


## 수업 목표

- 의존성 주입의 개념을 이해합니다.
- IoC 컨테이너를 이해합니다.
- 서비스 수명 주기를 이해합니다.
- Microsoft.Extensions.DependencyInjection을 사용할 수 있습니다.
- 생성자 주입을 이해합니다.
- 내장 서비스를 이해합니다.

## 의존성 주입 기본

```csharp
using System;

// 인터페이스
interface ILogger
{
    void Log(string message);
}

// 구현
class ConsoleLogger : ILogger
{
    public void Log(string message)
    {
        Console.WriteLine($"[LOG] {message}");
    }
}

class FileLogger : ILogger
{
    public void Log(string message)
    {
        File.AppendAllText("log.txt", $"{DateTime.Now}: {message}\n");
    }
}

// 의존성 주입
class UserService
{
    private readonly ILogger _logger;

    // 생성자 주입
    public UserService(ILogger logger)
    {
        _logger = logger;
    }

    public void CreateUser(string name)
    {
        _logger.Log($"사용자 생성: {name}");
        Console.WriteLine($"사용자 {name} 생성됨");
    }
}

class Program
{
    static void Main()
    {
        // 수동 DI
        ILogger logger = new ConsoleLogger();
        UserService userService = new UserService(logger);
        userService.CreateUser("Wolhyong");
    }
}
```

의존성 주입은 객체의 의존성을 외부에서 주입합니다. 생성자 주입이 가장 일반적입니다. 인터페이스를 통해 구현을 교체할 수 있어 테스트 가능성이 높아집니다.

## IoC 컨테이너

```csharp
using System;
using Microsoft.Extensions.DependencyInjection;

interface ILogger
{
    void Log(string message);
}

class ConsoleLogger : ILogger
{
    public void Log(string message)
    {
        Console.WriteLine($"[LOG] {message}");
    }
}

class UserService
{
    private readonly ILogger _logger;

    public UserService(ILogger logger)
    {
        _logger = logger;
    }

    public void CreateUser(string name)
    {
        _logger.Log($"사용자 생성: {name}");
        Console.WriteLine($"사용자 {name} 생성됨");
    }
}

class Program
{
    static void Main()
    {
        // 서비스 컨테이너 생성
        var serviceProvider = new ServiceCollection()
            .AddTransient<ILogger, ConsoleLogger>()
            .AddTransient<UserService>()
            .BuildServiceProvider();

        // 서비스 해결
        var userService = serviceProvider.GetRequiredService<UserService>();
        userService.CreateUser("Wolhyong");
    }
}
```

IoC 컨테이너는 객체 생성과 수명 주기를 관리합니다. `ServiceCollection`에 서비스를 등록하고 `BuildServiceProvider`로 컨테이너를 생성합니다. `GetRequiredService`로 서비스를 해결합니다.

## 서비스 수명 주기

```csharp
using System;
using Microsoft.Extensions.DependencyInjection;

interface ITransientService
{
    Guid Id { get; }
}

interface IScopedService
{
    Guid Id { get; }
}

interface ISingletonService
{
    Guid Id { get; }
}

class TransientService : ITransientService
{
    public Guid Id { get; } = Guid.NewGuid();
}

class ScopedService : IScopedService
{
    public Guid Id { get; } = Guid.NewGuid();
}

class SingletonService : ISingletonService
{
    public Guid Id { get; } = Guid.NewGuid();
}

class Program
{
    static void Main()
    {
        var serviceProvider = new ServiceCollection()
            .AddTransient<ITransientService, TransientService>()
            .AddScoped<IScopedService, ScopedService>()
            .AddSingleton<ISingletonService, SingletonService>()
            .BuildServiceProvider();

        Console.WriteLine("Transient: 매번 새 인스턴스");
        var t1 = serviceProvider.GetRequiredService<ITransientService>();
        var t2 = serviceProvider.GetRequiredService<ITransientService>();
        Console.WriteLine($"t1: {t1.Id}");
        Console.WriteLine($"t2: {t2.Id}");

        Console.WriteLine("\nScoped: 요청 범위");
        using (var scope = serviceProvider.CreateScope())
        {
            var s1 = scope.ServiceProvider.GetRequiredService<IScopedService>();
            var s2 = scope.ServiceProvider.GetRequiredService<IScopedService>();
            Console.WriteLine($"s1: {s1.Id}");
            Console.WriteLine($"s2: {s2.Id}");
        }

        using (var scope = serviceProvider.CreateScope())
        {
            var s3 = scope.ServiceProvider.GetRequiredService<IScopedService>();
            Console.WriteLine($"s3: {s3.Id}");
        }

        Console.WriteLine("\nSingleton: 애플리케이션 전체");
        var sg1 = serviceProvider.GetRequiredService<ISingletonService>();
        var sg2 = serviceProvider.GetRequiredService<ISingletonService>();
        Console.WriteLine($"sg1: {sg1.Id}");
        Console.WriteLine($"sg2: {sg2.Id}");
    }
}
```

`Transient`는 매번 새 인스턴스를 생성합니다. `Scoped`는 요청 범위 내에서 같은 인스턴스를 반환합니다. `Singleton`은 애플리케이션 전체에서 같은 인스턴스를 반환합니다. `CreateScope`로 새 범위를 생성합니다.

## ASP.NET Core 통합

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading.Tasks;

interface ILogger
{
    void Log(string message);
}

class ConsoleLogger : ILogger
{
    public void Log(string message)
    {
        Console.WriteLine($"[LOG] {message}");
    }
}

class UserService
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

class Program
{
    static async Task Main(string[] args)
    {
        var host = Host.CreateDefaultBuilder(args)
            .ConfigureServices((context, services) =>
            {
                services.AddTransient<ILogger, ConsoleLogger>();
                services.AddTransient<UserService>();
            })
            .Build();

        var userService = host.Services.GetRequiredService<UserService>();
        userService.CreateUser("Wolhyong");

        await host.RunAsync();
    }
}
```

ASP.NET Core는 DI를 기본적으로 지원합니다. `ConfigureServices`에서 서비스를 등록합니다. `IHostBuilder`로 호스트를 구성합니다. `host.Services`로 서비스를 해결합니다.

## 팩토리 패턴

```csharp
using System;
using Microsoft.Extensions.DependencyInjection;

interface ILogger
{
    void Log(string message);
}

class ConsoleLogger : ILogger
{
    public void Log(string message)
    {
        Console.WriteLine($"[LOG] {message}");
    }
}

class FileLogger : ILogger
{
    public void Log(string message)
    {
        Console.WriteLine($"[FILE] {message}");
    }
}

interface ILoggerFactory
{
    ILogger CreateLogger();
}

class LoggerFactory : ILoggerFactory
{
    private readonly string _type;

    public LoggerFactory(string type)
    {
        _type = type;
    }

    public ILogger CreateLogger()
    {
        return _type switch
        {
            "console" => new ConsoleLogger(),
            "file" => new FileLogger(),
            _ => new ConsoleLogger()
        };
    }
}

class UserService
{
    private readonly ILogger _logger;

    public UserService(ILoggerFactory factory)
    {
        _logger = factory.CreateLogger();
    }

    public void CreateUser(string name)
    {
        _logger.Log($"사용자 생성: {name}");
    }
}

class Program
{
    static void Main()
    {
        var serviceProvider = new ServiceCollection()
            .AddTransient<ILoggerFactory>(sp => new LoggerFactory("console"))
            .AddTransient<UserService>()
            .BuildServiceProvider();

        var userService = serviceProvider.GetRequiredService<UserService>();
        userService.CreateUser("Wolhyong");
    }
}
```

팩토리 패턴은 복잡한 객체 생성을 캡슐화합니다. `AddTransient`에서 람다 식으로 팩토리를 등록할 수 있습니다. 조건부 로직이 필요할 때 유용합니다.

## 옵션 패턴

```csharp
using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

class EmailSettings
{
    public string SmtpServer { get; set; }
    public int Port { get; set; }
    public string From { get; set; }
}

class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public void SendEmail(string to, string subject, string body)
    {
        Console.WriteLine($"SMTP: {_settings.SmtpServer}:{_settings.Port}");
        Console.WriteLine($"From: {_settings.From}");
        Console.WriteLine($"To: {to}");
        Console.WriteLine($"Subject: {subject}");
        Console.WriteLine($"Body: {body}");
    }
}

class Program
{
    static void Main()
    {
        var serviceProvider = new ServiceCollection()
            .Configure<EmailSettings>(options =>
            {
                options.SmtpServer = "smtp.example.com";
                options.Port = 587;
                options.From = "noreply@example.com";
            })
            .AddTransient<EmailService>()
            .BuildServiceProvider();

        var emailService = serviceProvider.GetRequiredService<EmailService>();
        emailService.SendEmail("user@example.com", "테스트", "테스트 이메일");
    }
}
```

`IOptions<T>`는 설정을 주입합니다. `Configure<T>`로 설정을 등록합니다. 설정을 캡슐화하고 테스트 가능성을 높입니다. `IOptionsSnapshot`, `IOptionsMonitor`로 설정 변경을 감지할 수 있습니다.

## 내장 서비스

```csharp
using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

class Program
{
    static void Main()
    {
        var serviceProvider = new ServiceCollection()
            .AddLogging()
            .AddSingleton<IConfiguration>(sp =>
            {
                var builder = new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string>
                    {
                        { "App:Name", "MyApp" },
                        { "App:Version", "1.0.0" }
                    });
                return builder.Build();
            })
            .BuildServiceProvider();

        // ILogger 사용
        var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("애플리케이션 시작");

        // IConfiguration 사용
        var config = serviceProvider.GetRequiredService<IConfiguration>();
        Console.WriteLine($"앱 이름: {config["App:Name"]}");
        Console.WriteLine($"버전: {config["App:Version"]}");
    }
}
```

`ILogger`는 로깅을 제공합니다. `IConfiguration`은 설정을 제공합니다. `IServiceProvider` 자체도 서비스로 등록됩니다. 내장 서비스는 추가 의존성 없이 사용할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 의존성 주입은 왜 필요한가요?</strong></summary>

의존성 주입은 다음 이유로 필요합니다: (1) 결합도 감소 (2) 테스트 가능성 향상 (3) 유지보수성 향상 (4) 수명 주기 관리. 직접 의존성을 제거하고 인터페이스를 통해 구현을 교체할 수 있습니다.
</details>

<details>
<summary><strong>Q> Transient, Scoped, Singleton 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Transient`는 상태가 없는 서비스에 사용합니다. `Scoped`는 요청 범위 상태가 필요할 때 사용합니다(웹 요청). `Singleton`은 전역 상태나 비용 있는 초기화가 필요할 때 사용합니다. 스레드 안전성을 고려해야 합니다.
</details>

<details>
<summary><strong>Q> 생성자 주입과 속성 주입 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

생성자 주입을 우선 사용해야 합니다. 필수 의존성은 생성자 주입으로, 선택적 의존성은 속성 주입으로 주입합니다. 생성자 주입은 불변성을 보장하고 의존성을 명확하게 만듭니다.
</details>

<details>
<summary><strong>Q> 서비스 로케이터 패턴은 언제 사용해야 하나요?</strong></summary>

서비스 로케이터는 서비스 해결을 캡슐화할 때 사용합니다. `IServiceProvider`를 직접 사용하는 것을 피하고 로케이터를 통해 해결합니다. 서비스 로케이터 패턴은 복잡한 의존성 그래프를 관리할 때 유용합니다.
</details>

<details>
<summary><strong>Q> DI 컨테이너는 언제 사용해야 하나요?</strong></summary>

DI 컨테이너는 대규모 애플리케이션에서 사용합니다. 작은 애플리케이션에서는 수동 DI로 충분합니다. ASP.NET Core는 DI를 기본적으로 지원하므로 사용하는 것이 좋습니다. 복잡한 수명 주기가 필요할 때 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **DI** | 의존성 주입 | 결합도 감소 |
| **IoC 컨테이너** | 객체 생성 관리 | ServiceCollection |
| **Transient** | 매번 새 인스턴스 | 상태 없는 서비스 |
| **Scoped** | 요청 범위 인스턴스 | 웹 요청 |
| **Singleton** | 전체 인스턴스 | 전역 상태 |
| **생성자 주입** | 생성자 주입 | 필수 의존성 |
| **팩토리 패턴** | 객체 생성 캡슐화 | 복잡한 생성 |
| **IOptions<T>** | 설정 주입 | Configure<T> |
| **ILogger** | 로깅 서비스 | 내장 서비스 |
| **IConfiguration** | 설정 서비스 | 내장 서비스 |
| **CreateScope** | 새 범위 생성 | Scoped 서비스 |


## 다음 수업

다음 글에서는 C# 고급 — 웹 개발, ASP.NET Core, MVC, Web API, 미들웨어를 배웁니다.
