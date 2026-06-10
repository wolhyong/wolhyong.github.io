---
layout: post
title: "C# 인터페이스와 추상화 — 인터페이스 구현, 다중 인터페이스, 명시적 구현, 기본 구현"
description: "C#의 인터페이스와 추상화 시스템을 컴파일러 레벨에서 학습합니다. interface 키워드로 인터페이스를 정의하며 계약을 명시합니다. 클래스는 다중 인터페이스를 구현할 수 있으며 : IInterface1, IInterface2 문법을 사용합니다. 명시적 인터페이스 구현은 인터페이스 멤버를 특정 인터페이스 통해서만 접근 가능하게 하며 이름 충돌을 해결합니다. C# 8.0부터 인터페이스 기본 구현을 지원하며 default 키워드로 기본 메서드를 제공합니다. 제네릭 인터페이스는 타입 매개변수를 가지며 where 절로 제약을 추가할 수 있습니다. 인터페이스는 다형성, 느슨한 결합, 테스트 가능성을 제공하며 SOLID 원칙의 인터페이스 분리 원칙(ISP)을 지원합니다."
date: 2025-08-11 10:00:00 +0900
category: csharp
tags: [csharp, interfaces, abstraction, polymorphism, default-implementation, generic-interfaces]
level: basic
---

C#의 인터페이스는 계약을 정의하며 다형성과 느슨한 결합을 제공하는 추상화의 핵심입니다.

> **핵심 정리** · `interface`로 계약을 정의하며 다중 구현이 가능합니다. 명시적 구현으로 이름 충돌을 해결합니다. C# 8.0부터 기본 구현을 지원합니다. 제네릭 인터페이스로 타입 안전한 계약을 정의합니다. 인터페이스는 SOLID 원칙을 지원합니다.


## 수업 목표

- 인터페이스 정의와 구현을 이해합니다.
- 다중 인터페이스 구현을 이해합니다.
- 명시적 인터페이스 구현을 이해합니다.
- 인터페이스 기본 구현을 이해합니다.
- 제네릭 인터페이스를 이해합니다.
- 인터페이스의 사용 사례를 이해합니다.

## 인터페이스 정의

```csharp
interface IShape
{
    double CalculateArea();
    double CalculatePerimeter();
}

class Circle : IShape
{
    public double Radius { get; set; }

    public Circle(double radius)
    {
        Radius = radius;
    }

    public double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }

    public double CalculatePerimeter()
    {
        return 2 * Math.PI * Radius;
    }
}

class Program
{
    static void Main()
    {
        IShape shape = new Circle(5);
        Console.WriteLine($"넓이: {shape.CalculateArea()}");
        Console.WriteLine($"둘레: {shape.CalculatePerimeter()}");
    }
}
```

`interface`는 계약을 정의합니다. 모든 멤버는 암시적으로 `public abstract`입니다. 구현 클래스는 모든 멤버를 구현해야 합니다. 인터페이스는 다형성을 제공하며 느슨한 결합을 유지합니다.

## 다중 인터페이스

```csharp
interface IWritable
{
    void Write(string text);
}

interface IReadable
{
    string Read();
}

class Document : IWritable, IReadable
{
    private string content = "";

    public void Write(string text)
    {
        content = text;
        Console.WriteLine($"작성: {text}");
    }

    public string Read()
    {
        Console.WriteLine($"읽기: {content}");
        return content;
    }
}

class Program
{
    static void Main()
    {
        Document doc = new Document();
        
        IWritable writer = doc;
        writer.Write("Hello, World!");
        
        IReadable reader = doc;
        reader.Read();
    }
}
```

클래스는 여러 인터페이스를 구현할 수 있습니다. `: IInterface1, IInterface2` 문법을 사용합니다. 다중 상속을 지원하며 서로 다른 인터페이스의 기능을 결합할 수 있습니다.

## 인터페이스 속성과 메서드

```csharp
interface ILogger
{
    // 속성
    string Name { get; }

    // 메서드
    void Log(string message);
    
    // 이벤트
    event EventHandler<string> OnLog;
    
    // 인덱서
    string this[int index] { get; set; }
}

class ConsoleLogger : ILogger
{
    public string Name { get; } = "ConsoleLogger";

    public event EventHandler<string> OnLog;

    private List<string> logs = new List<string>();

    public void Log(string message)
    {
        Console.WriteLine($"[{Name}] {message}");
        logs.Add(message);
        OnLog?.Invoke(this, message);
    }

    public string this[int index]
    {
        get => logs[index];
        set => logs[index] = value;
    }
}
```

인터페이스는 속성, 메서드, 이벤트, 인덱서를 포함할 수 있습니다. 모든 멤버는 구현해야 합니다. 인터페이스는 풍부한 계약을 정의할 수 있습니다.

## 명시적 인터페이스 구현

```csharp
interface IWriter
{
    void Write(string text);
}

interface IFormatter
{
    void Write(string text);
}

class MultiWriter : IWriter, IFormatter
{
    public void Write(string text)
    {
        Console.WriteLine($"일반 작성: {text}");
    }

    // IFormatter 명시적 구현
    void IFormatter.Write(string text)
    {
        Console.WriteLine($"포맷 작성: {text.ToUpper()}");
    }
}

class Program
{
    static void Main()
    {
        MultiWriter writer = new MultiWriter();
        
        writer.Write("Hello");  // 일반 Write 호출
        
        IWriter iWriter = writer;
        iWriter.Write("Hello");  // 일반 Write 호출
        
        IFormatter iFormatter = writer;
        iFormatter.Write("Hello");  // 명시적 IFormatter.Write 호출
    }
}
```

명시적 인터페이스 구현은 인터페이스 멤버를 특정 인터페이스 통해서만 접근 가능하게 합니다. 이름 충돌을 해결하고 구현 세부를 숨길 때 사용됩니다. 인터페이스 타입으로 캐스팅해야 접근할 수 있습니다.

## 인터페이스 기본 구현 (C# 8.0+)

```csharp
interface ILogger
{
    void Log(string message);

    // 기본 구현
    void LogError(string message)
    {
        Log($"[ERROR] {message}");
    }

    void LogWarning(string message)
    {
        Log($"[WARNING] {message}");
    }
}

class SimpleLogger : ILogger
{
    public void Log(string message)
    {
        Console.WriteLine(message);
    }

    // LogError와 LogWarning은 기본 구현 사용
}

class Program
{
    static void Main()
    {
        ILogger logger = new SimpleLogger();
        
        logger.Log("정보");
        logger.LogError("에러");      // 기본 구현 사용
        logger.LogWarning("경고");    // 기본 구현 사용
    }
}
```

C# 8.0부터 인터페이스 기본 구현을 지원합니다. `default` 키워드로 기본 메서드를 제공합니다. 구현 클래스는 선택적으로 재정의할 수 있습니다. 인터페이스 진화를 방지하고 하위 호환성을 유지합니다.

## 제네릭 인터페이스

```csharp
interface IRepository<T> where T : class
{
    T GetById(int id);
    IEnumerable<T> GetAll();
    void Add(T entity);
    void Update(T entity);
    void Delete(int id);
}

class Entity
{
    public int Id { get; set; }
}

class InMemoryRepository<T> : IRepository<T> where T : Entity, new()
{
    private List<T> entities = new List<T>();

    public T GetById(int id)
    {
        return entities.FirstOrDefault(e => e.Id == id);
    }

    public IEnumerable<T> GetAll()
    {
        return entities;
    }

    public void Add(T entity)
    {
        entities.Add(entity);
    }

    public void Update(T entity)
    {
        var existing = GetById(entity.Id);
        if (existing != null)
        {
            entities.Remove(existing);
            entities.Add(entity);
        }
    }

    public void Delete(int id)
    {
        var entity = GetById(id);
        if (entity != null)
        {
            entities.Remove(entity);
        }
    }
}

class Program
{
    static void Main()
    {
        IRepository<Entity> repository = new InMemoryRepository<Entity>();
        
        var entity1 = new Entity { Id = 1 };
        var entity2 = new Entity { Id = 2 };
        
        repository.Add(entity1);
        repository.Add(entity2);
        
        foreach (var entity in repository.GetAll())
        {
            Console.WriteLine($"ID: {entity.Id}");
        }
    }
}
```

제네릭 인터페이스는 타입 매개변수를 가집니다. `where` 절로 타입 제약을 추가할 수 있습니다. 타입 안전한 계약을 정의하며 재사용 가능한 코드를 작성할 수 있습니다.

## 인터페이스 상속

```csharp
interface IAnimal
{
    string Name { get; }
    void MakeSound();
}

interface IDog : IAnimal
{
    void Bark();
}

interface ICat : IAnimal
{
    void Meow();
}

class GoldenRetriever : IDog
{
    public string Name { get; } = "골든 리트리버";

    public void MakeSound()
    {
        Bark();
    }

    public void Bark()
    {
        Console.WriteLine("멍멍!");
    }
}

class Program
{
    static void Main()
    {
        IDog dog = new GoldenRetriever();
        
        Console.WriteLine(dog.Name);
        dog.MakeSound();
        dog.Bark();
    }
}
```

인터페이스도 상속할 수 있습니다. `interface IDerived : IBase` 문법을 사용합니다. 인터페이스 상속은 계약을 확장하고 계층을 구성합니다. 다중 인터페이스 상속도 가능합니다.

## 인터페이스 vs 추상 클래스

| 특징 | 인터페이스 | 추상 클래스 |
|------|-----------|-------------|
| 다중 상속 | 지원 | 지원 안 함 |
| 상태 | 없음 | 있음 |
| 구현 | 기본 구현(C# 8.0+) | 부분 구현 |
| 접근 제어자 | public만 | 모든 접근 제어자 |
| 생성자 | 없음 | 있음 |
| 필드 | 없음 | 있음 |

인터페이스는 계약만 정의하며 다중 상속을 지원합니다. 추상 클래스는 상태와 부분 구현을 제공하지만 단일 상속만 지원합니다. 계약이 중요하면 인터페이스를, 공통 상태와 구현이 필요하면 추상 클래스를 사용합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 인터페이스와 추상 클래스 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

인터페이스는 계약이 중요할 때 사용합니다: 다형성, 느슨한 결합, 다중 상속 필요. 추상 클래스는 공통 상태와 구현이 필요할 때 사용합니다: 기본 구현, 상태 공유, 단일 상속. C# 8.0부터 인터페이스도 기본 구현을 제공할 수 있으므로 인터페이스를 우선 고려합니다.
</details>

<details>
<summary><strong>Q> 명시적 인터페이스 구현은 언제 사용해야 하나요?</strong></summary>

명시적 구현은 다음 경우에 사용합니다: (1) 이름 충돌 해결 (2) 구현 세부 숨기기 (3) 인터페이스 전용 동작 제공. 일반적으로는 암시적 구현을 사용합니다. 인터페이스 타입으로 캐스팅해야 접근할 수 있으므로 사용에 주의가 필요합니다.
</details>

<details>
<summary><strong>Q> 인터페이스 기본 구현은 왜 필요한가요?</strong></summary>

기본 구현은 다음 이유로 필요합니다: (1) 인터페이스 진화 방지 (2) 하위 호환성 유지 (3) 선택적 구현 허용. 새로운 멤버를 추가해도 기존 구현을 깨지 않습니다. C# 8.0부터 지원되며 Java의 default method와 유사합니다.
</details>

<details>
<summary><strong>Q> 제네릭 인터페이스는 언제 사용해야 하나요?</strong></summary>

제네릭 인터페이스는 타입에 의존하지 않는 계약을 정의할 때 사용합니다. `IEnumerable<T>`, `IList<T>`, `IRepository<T>` 등이 예입니다. 타입 안전성과 재사용성을 제공합니다. `where` 절로 타입 제약을 추가할 수 있습니다.
</details>

<details>
<summary><strong>Q> 인터페이스는 SOLID 원칙과 어떤 관계가 있나요?</strong></summary>

인터페이스는 SOLID 원칙을 지원합니다: (1) SRP: 단일 책임 인터페이스 (2) OCP: 개방-폐쇄 원칙 (3) LSP: 리스코프 치환 원칙 (4) ISP: 인터페이스 분리 원칙 (5) DIP: 의존성 역전 원칙. 특히 ISP는 인터페이스를 작고 단일 책임으로 분리하도록 권장합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **interface** | 계약 정의 | 다중 구현 가능 |
| **다중 인터페이스** | 여러 인터페이스 구현 | : I1, I2 문법 |
| **명시적 구현** | 인터페이스 전용 | 이름 충돌 해결 |
| **기본 구현** | default 메서드 | C# 8.0+ |
| **제네릭 인터페이스** | 타입 매개변수 | where 절 |
| **인터페이스 상속** | 인터페이스 확장 | : IBase 문법 |
| **속성** | getter/setter 계약 | 구현 필수 |
| **이벤트** | 이벤트 계약 | 구현 필수 |
| **인덱서** | 인덱서 계약 | 구현 필수 |
| **SOLID** | 설계 원칙 지원 | ISP 특히 중요 |


## 다음 수업

다음 글에서는 C# 중급 — 제네릭, 제네릭 클래스, 제네릭 메서드, 제네릭 제약, 공변성/반공변성을 배웁니다.
