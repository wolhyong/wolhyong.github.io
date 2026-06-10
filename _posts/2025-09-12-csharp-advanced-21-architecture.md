---
layout: post
title: "C# 아키텍처와 디자인 패턴 — 클린 아키텍처, SOLID, DDD, 레이어드 아키텍처, 마이크로서비스"
description: "C#의 아키텍처와 디자인 패턴을 실무 레벨에서 학습합니다. 클린 아키텍처는 의존성 규칙으로 내부 레이어가 외부 레이어에 의존하지 않도록 합니다. SOLID 원칙은 단일 책임, 개방-폐쇄, 리스코프 치환, 인터페이스 분리, 의존성 역전 원칙입니다. DDD(Domain-Driven Design)는 도메인 중심 설계로 엔티티, 값 객체, 애그리거트, 리포지토리를 정의합니다. 레이어드 아키텍처는 프레젠테이션, 비즈니스, 데이터 액세스 레이어로 분리합니다. 마이크로서비스는 독립 배포 가능한 서비스로 분산 시스템을 구축합니다. 디자인 패턴은 싱글톤, 팩토리, 전략, 옵저버 등을 포함합니다."
date: 2025-09-12 10:00:00 +0900
category: csharp
tags: [csharp, architecture, clean-architecture, solid, ddd, layered-architecture, microservices, design-patterns]
level: advanced
---

C#의 아키텍처와 디자인 패턴은 유지보수 가능하고 확장 가능한 시스템을 구축하는 데 필수적입니다.

> **핵심 정리** · 클린 아키텍처는 의존성 규칙을 따릅니다. SOLID 원칙으로 코드 품질을 높입니다. DDD로 도메인 중심 설계를 수행합니다. 레이어드 아키텍처로 레이어를 분리합니다. 마이크로서비스로 분산 시스템을 구축합니다. 디자인 패턴으로 재사용 가능한 솔루션을 제공합니다.


## 수업 목표

- 클린 아키텍처를 이해합니다.
- SOLID 원칙을 이해합니다.
- DDD를 이해합니다.
- 레이어드 아키텍처를 이해합니다.
- 마이크로서비스를 이해합니다.
- 디자인 패턴을 이해합니다.

## 클린 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                        UI                               │
├─────────────────────────────────────────────────────────┤
│                      Application                        │
├─────────────────────────────────────────────────────────┤
│                       Domain                           │
├─────────────────────────────────────────────────────────┤
│                    Infrastructure                       │
└─────────────────────────────────────────────────────────┘
```

클린 아키텍처는 의존성 규칙을 따릅니다. 내부 레이어는 외부 레이어에 의존하지 않습니다. 도메인은 비즈니스 로직을 포함하며 가장 안쪽 레이어입니다. 인프라스트럭처는 데이터베이스, 외부 API 등을 포함합니다.

## SOLID 원칙

```csharp
// SRP: 단일 책임 원칙
public class UserValidator
{
    public bool Validate(User user)
    {
        return !string.IsNullOrEmpty(user.Name) && user.Age > 0;
    }
}

public class UserRepository
{
    public void Save(User user)
    {
        // 저장 로직
    }
}

// OCP: 개방-폐쇄 원칙
public interface IShape
{
    double CalculateArea();
}

public class Circle : IShape
{
    public double Radius { get; set; }
    public double CalculateArea() => Math.PI * Radius * Radius;
}

public class Rectangle : IShape
{
    public double Width { get; set; }
    public double Height { get; set; }
    public double CalculateArea() => Width * Height;
}

// LSP: 리스코프 치환 원칙
public class Bird
{
    public virtual void Fly()
    {
        Console.WriteLine("날다");
    }
}

public class Sparrow : Bird
{
    public override void Fly()
    {
        Console.WriteLine("참새가 날다");
    }
}

// ISP: 인터페이스 분리 원칙
public interface IPrinter
{
    void Print(string content);
}

public interface IScanner
{
    void Scan(string content);
}

public class MultiFunctionPrinter : IPrinter, IScanner
{
    public void Print(string content) => Console.WriteLine($"인쇄: {content}");
    public void Scan(string content) => Console.WriteLine($"스캔: {content}");
}

// DIP: 의존성 역전 원칙
public interface IMessageService
{
    void SendMessage(string message);
}

public class EmailService : IMessageService
{
    public void SendMessage(string message)
    {
        Console.WriteLine($"이메일 전송: {message}");
    }
}

public class NotificationService
{
    private readonly IMessageService _messageService;

    public NotificationService(IMessageService messageService)
    {
        _messageService = messageService;
    }

    public void Notify(string message)
    {
        _messageService.SendMessage(message);
    }
}
```

SOLID 원칙은 코드 품질을 높이는 5가지 원칙입니다. SRP는 단일 책임, OCP는 개방-폐쇄, LSP는 리스코프 치환, ISP는 인터페이스 분리, DIP는 의존성 역전입니다. 유지보수 가능한 코드를 작성하는 데 필수적입니다.

## DDD (Domain-Driven Design)

```csharp
// 엔티티
public class User
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Email { get; private set; }

    public User(string name, string email)
    {
        Id = Guid.NewGuid();
        Name = name;
        Email = email;
    }

    public void ChangeName(string name)
    {
        if (string.IsNullOrEmpty(name))
            throw new ArgumentException("이름은 비워둘 수 없습니다.");
        Name = name;
    }
}

// 값 객체
public class Address
{
    public string Street { get; }
    public string City { get; }
    public string ZipCode { get; }

    public Address(string street, string city, string zipCode)
    {
        Street = street;
        City = city;
        ZipCode = zipCode;
    }

    public override bool Equals(object obj)
    {
        if (obj is Address other)
        {
            return Street == other.Street && City == other.City && ZipCode == other.ZipCode;
        }
        return false;
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Street, City, ZipCode);
    }
}

// 애그리거트
public class Order
{
    public Guid Id { get; private set; }
    public List<OrderItem> Items { get; private set; }
    public decimal Total => Items.Sum(i => i.Price * i.Quantity);

    public Order()
    {
        Id = Guid.NewGuid();
        Items = new List<OrderItem>();
    }

    public void AddItem(OrderItem item)
    {
        Items.Add(item);
    }
}

public class OrderItem
{
    public string ProductName { get; }
    public decimal Price { get; }
    public int Quantity { get; }

    public OrderItem(string productName, decimal price, int quantity)
    {
        ProductName = productName;
        Price = price;
        Quantity = quantity;
    }
}

// 리포지토리
public interface IUserRepository
{
    User GetById(Guid id);
    void Save(User user);
}

public class UserRepository : IUserRepository
{
    public User GetById(Guid id)
    {
        // 데이터베이스 조회
        return new User("Wolhyong", "wolhyong@example.com");
    }

    public void Save(User user)
    {
        // 데이터베이스 저장
    }
}
```

DDD는 도메인 중심 설계입니다. 엔티티는 식별자와 비즈니스 로직을 포함합니다. 값 객체는 속성으로 식별되며 불변입니다. 애그리거트는 관련 엔티티를 그룹화합니다. 리포지토리는 도메인 객체를 영구화합니다.

## 레이어드 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│              Presentation Layer (API/MVC)                │
├─────────────────────────────────────────────────────────┤
│              Application Layer (Services)                │
├─────────────────────────────────────────────────────────┤
│                 Domain Layer (Entities)                 │
├─────────────────────────────────────────────────────────┤
│            Infrastructure Layer (Database)               │
└─────────────────────────────────────────────────────────┘
```

레이어드 아키텍처는 레이어를 분리합니다. 프레젠테이션 레이어는 API/MVC를 포함합니다. 애플리케이션 레이어는 서비스를 포함합니다. 도메인 레이어는 엔티티를 포함합니다. 인프라스트럭처 레이어는 데이터베이스를 포함합니다.

## 마이크로서비스

```csharp
// 마이크로서비스 구조
├── Services/
│   ├── UserService/
│   │   ├── API/
│   │   ├── Application/
│   │   ├── Domain/
│   │   └── Infrastructure/
│   ├── OrderService/
│   │   ├── API/
│   │   ├── Application/
│   │   ├── Domain/
│   │   └── Infrastructure/
│   └── ProductService/
│       ├── API/
│       ├── Application/
│       ├── Domain/
│       └── Infrastructure/
├── API Gateway/
└── Shared/
```

마이크로서비스는 독립 배포 가능한 서비스입니다. 각 서비스는 자체 데이터베이스를 가집니다. API Gateway로 요청을 라우팅합니다. 서비스 간 통신은 HTTP/gRPC를 사용합니다. 확장성과 유지보수성을 높입니다.

## 디자인 패턴

```csharp
// 싱글톤 패턴
public class Singleton
{
    private static Singleton _instance;
    private static readonly object _lock = new object();

    private Singleton()
    {
    }

    public static Singleton Instance
    {
        get
        {
            if (_instance == null)
            {
                lock (_lock)
                {
                    if (_instance == null)
                    {
                        _instance = new Singleton();
                    }
                }
            }
            return _instance;
        }
    }
}

// 팩토리 패턴
public interface IProductFactory
{
    IProduct CreateProduct(string type);
}

public class ProductFactory : IProductFactory
{
    public IProduct CreateProduct(string type)
    {
        return type switch
        {
            "A" => new ProductA(),
            "B" => new ProductB(),
            _ => throw new ArgumentException("잘못된 타입")
        };
    }
}

// 전략 패턴
public interface IPaymentStrategy
{
    void ProcessPayment(decimal amount);
}

public class CreditCardPayment : IPaymentStrategy
{
    public void ProcessPayment(decimal amount)
    {
        Console.WriteLine($"신용카드 결제: {amount}");
    }
}

public class PayPalPayment : IPaymentStrategy
{
    public void ProcessPayment(decimal amount)
    {
        Console.WriteLine($"PayPal 결제: {amount}");
    }
}

public class PaymentProcessor
{
    private readonly IPaymentStrategy _strategy;

    public PaymentProcessor(IPaymentStrategy strategy)
    {
        _strategy = strategy;
    }

    public void Process(decimal amount)
    {
        _strategy.ProcessPayment(amount);
    }
}

// 옵저버 패턴
public interface IObserver
{
    void Update(string message);
}

public interface ISubject
{
    void Attach(IObserver observer);
    void Detach(IObserver observer);
    void Notify(string message);
}

public class NewsPublisher : ISubject
{
    private readonly List<IObserver> _observers = new List<IObserver>();

    public void Attach(IObserver observer)
    {
        _observers.Add(observer);
    }

    public void Detach(IObserver observer)
    {
        _observers.Remove(observer);
    }

    public void Notify(string message)
    {
        foreach (var observer in _observers)
        {
            observer.Update(message);
        }
    }
}

public class NewsSubscriber : IObserver
{
    private readonly string _name;

    public NewsSubscriber(string name)
    {
        _name = name;
    }

    public void Update(string message)
    {
        Console.WriteLine($"{_name} 받음: {message}");
    }
}
```

디자인 패턴은 재사용 가능한 솔루션을 제공합니다. 싱글톤은 단일 인스턴스를 보장합니다. 팩토리는 객체 생성을 캡슐화합니다. 전략은 알고리즘을 교체 가능하게 합니다. 옵저버는 상태 변경을 알립니다.

## CQRS (Command Query Responsibility Segregation)

```csharp
// Command
public class CreateUserCommand
{
    public string Name { get; set; }
    public string Email { get; set; }
}

// Query
public class GetUserQuery
{
    public Guid Id { get; set; }
}

// Command Handler
public class CreateUserCommandHandler
{
    private readonly IUserRepository _repository;

    public CreateUserCommandHandler(IUserRepository repository)
    {
        _repository = repository;
    }

    public void Handle(CreateUserCommand command)
    {
        var user = new User(command.Name, command.Email);
        _repository.Save(user);
    }
}

// Query Handler
public class GetUserQueryHandler
{
    private readonly IUserRepository _repository;

    public GetUserQueryHandler(IUserRepository repository)
    {
        _repository = repository;
    }

    public User Handle(GetUserQuery query)
    {
        return _repository.GetById(query.Id);
    }
}
```

CQRS는 명령과 쿼리를 분리합니다. 명령은 상태를 변경하고 쿼리는 상태를 조회합니다. 복잡한 도메인에 적합합니다. 성능 최적화와 확장성을 제공합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 클린 아키텍처와 레이어드 아키텍처 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

클린 아키텍처는 복잡한 도메인에 적합합니다. 의존성 규칙을 엄격히 따르며 테스트 가능성이 높습니다. 레이어드 아키텍처는 간단한 애플리케이션에 적합합니다. 구현이 쉽고 이해하기 쉽습니다. 프로젝트 복잡도에 따라 선택합니다.
</details>

<details>
<summary><strong>Q> 마이크로서비스와 모놀리식 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

마이크로서비스는 대규모 팀, 복잡한 도메인에 적합합니다. 독립 배포와 확장이 가능합니다. 모놀리식은 소규모 팀, 간단한 도메인에 적합합니다. 구현이 쉽고 통합이 간단합니다. 초기에는 모놀리식으로 시작하여 필요 시 마이크로서비스로 전환합니다.
</details>

<details>
<summary><strong>Q> DDD는 언제 사용해야 하나요?</strong></summary>

DDD는 복잡한 비즈니스 도메인에 사용합니다. 도메인 로직이 중요하고 복잡할 때 유용합니다. 단순 CRUD 애플리케이션에는 과도할 수 있습니다. 도메인 전문가와 협업이 필요합니다.
</details>

<details>
<summary><strong>Q> CQRS는 언제 사용해야 하나요?</strong></summary>

CQRS는 복잡한 도메인, 높은 트래픽에 사용합니다. 읽기와 쓰기 패턴이 다를 때 유용합니다. 구현 복잡도가 높으므로 신중하게 사용해야 합니다. 이벤트 소싱과 함께 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q> 싱글톤 패턴은 언제 사용해야 하나요?</strong></summary>

싱글톤은 전역 상태, 리소스 공유에 사용합니다. 로거, 캐시, 설정 등에 적합합니다. 과도한 사용은 테스트를 어렵게 만듭니다. DI 컨테이너의 싱글톤 수명 주기를 사용하는 것이 좋습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **클린 아키텍처** | 의존성 규칙 | 내부→외부 의존 |
| **SOLID** | 5가지 원칙 | 코드 품질 |
| **SRP** | 단일 책임 | 하나의 이유로 변경 |
| **OCP** | 개방-폐쇄 | 확장 가능, 수정 불가 |
| **LSP** | 리스코프 치환 | 서브타입 대체 |
| **ISP** | 인터페이스 분리 | 작은 인터페이스 |
| **DIP** | 의존성 역전 | 추상화 의존 |
| **DDD** | 도메인 중심 설계 | 엔티티, 값 객체 |
| **레이어드 아키텍처** | 레이어 분리 | 프레젠테이션/앱/도메인/인프라 |
| **마이크로서비스** | 독립 서비스 | 분산 시스템 |
| **디자인 패턴** | 재사용 솔루션 | 싱글톤, 팩토리 |
| **CQRS** | 명령/쿼리 분리 | 복잡 도메인 |


## C# 수업 완료

C# 기본부터 고급까지 21개 수업을 완료했습니다. 다음은 Kotlin 수업을 생성합니다.


## 다음 수업

다음 글에서는 Kotlin 언어 소개 — Kotlin의 철학, JVM, Kotlin/Native, Kotlin/JS를 배웁니다.
