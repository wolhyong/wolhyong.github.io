---
layout: post
title: "C# 클래스와 객체지향 — 클래스, 객체, 생성자, 소멸자, this 키워드, 접근 제어자"
description: "C#의 객체지향 프로그래밍을 시스템 레벨에서 학습합니다. class 키워드로 클래스를 정의하며 new 연산자로 객체를 생성합니다. 생성자는 객체 초기화를 담당하며 매개변수가 있는 생성자, 기본 생성자, 정적 생성자가 있습니다. 소멸자는 객체 해제 시 리소스 정리를 수행하며 ~ClassName 문법을 사용합니다. this 키워드는 현재 인스턴스를 참조하며 생성자 체이닝, 멤버 모호성 해결에 사용됩니다. 접근 제어자(public, private, protected, internal)로 멤버의 가시성을 제어합니다. 프로퍼티는 getter/setter를 캡슐화하며 자동 구현 프로퍼티로 간소화할 수 있습니다. C#은 캡슐화, 상속, 다형성, 추상화를 완벽하게 지원합니다."
date: 2025-08-06 10:00:00 +0900
category: csharp
tags: [csharp, oop, class, constructor, destructor, this, access-modifiers, properties]
level: basic
---

C#은 완벽한 객체지향 프로그래밍 언어로 캡슐화, 상속, 다형성, 추상화를 지원합니다.

> **핵심 정리** · `class`로 클래스를 정의하며 `new`로 객체를 생성합니다. 생성자는 객체 초기화를 담당하며 매개변수, 기본, 정적 생성자가 있습니다. 소멸자는 리소스 정리를 수행합니다. `this`는 현재 인스턴스를 참조합니다. 접근 제어자로 가시성을 제어합니다. 프로퍼티로 getter/setter를 캡슐화합니다.


## 수업 목표

- 클래스와 객체의 개념을 이해합니다.
- 생성자와 소멸자를 이해합니다.
- this 키워드를 사용할 수 있습니다.
- 접근 제어자를 이해합니다.
- 프로퍼티를 사용할 수 있습니다.
- 캡슐화의 중요성을 이해합니다.

## 클래스 정의

```csharp
class Person
{
    // 필드
    private string name;
    private int age;

    // 생성자
    public Person(string name, int age)
    {
        this.name = name;
        this.age = age;
    }

    // 메서드
    public void Introduce()
    {
        Console.WriteLine($"안녕하세요, 저는 {name}이고 {age}살입니다.");
    }

    // 프로퍼티
    public string Name
    {
        get { return name; }
        set { name = value; }
    }

    public int Age
    {
        get { return age; }
        set { age = value; }
    }
}

class Program
{
    static void Main()
    {
        // 객체 생성
        Person person = new Person("Wolhyong", 30);
        
        person.Introduce();
        
        // 프로퍼티 접근
        Console.WriteLine($"이름: {person.Name}");
        Console.WriteLine($"나이: {person.Age}");
    }
}
```

`class`는 객체의 청사진입니다. `new` 연산자로 객체를 생성하며 힙에 할당됩니다. 필드는 데이터를 저장하고 메서드는 동작을 정의합니다. 프로퍼티는 필드에 대한 안전한 접근을 제공합니다.

## 생성자

```csharp
class Rectangle
{
    public double Width { get; set; }
    public double Height { get; set; }

    // 매개변수 있는 생성자
    public Rectangle(double width, double height)
    {
        Width = width;
        Height = height;
    }

    // 기본 생성자
    public Rectangle() : this(0, 0)
    {
    }

    // 정적 생성자
    static Rectangle()
    {
        Console.WriteLine("정적 생성자 호출");
    }
}

class Program
{
    static void Main()
    {
        // 매개변수 있는 생성자
        Rectangle rect1 = new Rectangle(10, 20);
        
        // 기본 생성자
        Rectangle rect2 = new Rectangle();
    }
}
```

생성자는 객체 초기화를 담당합니다. 매개변수 있는 생성자는 인자를 받아 초기화합니다. 기본 생성자는 `this()`로 다른 생성자를 호출할 수 있습니다. 정적 생성자는 클래스가 처음 로드될 때 한 번만 호출됩니다.

## 생성자 체이닝

```csharp
class Animal
{
    public string Name { get; set; }

    public Animal(string name)
    {
        Name = name;
        Console.WriteLine($"Animal 생성자: {name}");
    }
}

class Dog : Animal
{
    public string Breed { get; set; }

    public Dog(string name, string breed) : base(name)
    {
        Breed = breed;
        Console.WriteLine($"Dog 생성자: {breed}");
    }
}

class Program
{
    static void Main()
    {
        Dog dog = new Dog("바둑이", "골든 리트리버");
    }
}
```

`base()`로 기본 클래스 생성자를 호출합니다. 생성자 체이닝은 기본 클래스부터 파생 클래스 순서로 실행됩니다. 초기화 순서를 명확히 하여 버그를 방지합니다.

## 소멸자

```csharp
class ResourceHolder : IDisposable
{
    private IntPtr resource;

    public ResourceHolder()
    {
        resource = AllocateResource();
        Console.WriteLine("리소스 할당");
    }

    ~ResourceHolder()
    {
        Console.WriteLine("소멸자 호출");
        ReleaseResource();
    }

    public void Dispose()
    {
        Console.WriteLine("Dispose 호출");
        ReleaseResource();
        GC.SuppressFinalize(this);
    }

    private IntPtr AllocateResource()
    {
        // 리소스 할당 시뮬레이션
        return new IntPtr(12345);
    }

    private void ReleaseResource()
    {
        // 리소스 해제 시뮬레이션
        resource = IntPtr.Zero;
    }
}

class Program
{
    static void Main()
    {
        using (var holder = new ResourceHolder())
        {
            Console.WriteLine("리소스 사용");
        }
    }
}
```

소멸자(`~ClassName`)는 객체가 가비지 컬렉션될 때 호출됩니다. 비결정적이므로 `IDisposable`을 구현하고 `Dispose()`를 명시적으로 호출하는 것이 좋습니다. `using` 문으로 자동으로 `Dispose()`를 호출합니다.

## this 키워드

```csharp
class Person
{
    private string name;
    private int age;

    public Person(string name, int age)
    {
        this.name = name;  // 필드와 매개변수 구분
        this.age = age;
    }

    public Person SetName(string name)
    {
        this.name = name;
        return this;  // 메서드 체이닝
    }

    public Person SetAge(int age)
    {
        this.age = age;
        return this;
    }
}

class Program
{
    static void Main()
    {
        Person person = new Person("Wolhyong", 30);
        
        // 메서드 체이닝
        person.SetName("Greyhacker").SetAge(31);
    }
}
```

`this`는 현재 인스턴스를 참조합니다. 필드와 매개변수 이름이 같을 때 구분하는 데 사용됩니다. 메서드 체이닝을 위해 `this`를 반환할 수 있습니다.

## 접근 제어자

```csharp
class BankAccount
{
    // private: 클래스 내부만 접근
    private decimal balance;

    // public: 어디서든 접근
    public BankAccount(decimal initialBalance)
    {
        balance = initialBalance;
    }

    // public 메서드
    public void Deposit(decimal amount)
    {
        if (amount <= 0)
        {
            throw new ArgumentException("금액은 양수여야 합니다.");
        }
        balance += amount;
    }

    // public 메서드
    public decimal GetBalance()
    {
        return balance;
    }

    // protected: 파생 클래스에서 접근
    protected void InternalTransfer(decimal amount)
    {
        balance += amount;
    }

    // internal: 같은 어셈블리에서 접근
    internal void LogTransaction()
    {
        Console.WriteLine($"거송 기록: {balance}");
    }

    // protected internal: 같은 어셈블리 또는 파생 클래스
    protected internal void Audit()
    {
        Console.WriteLine("감사");
    }

    // private protected: 파생 클래스이며 같은 어셈블리
    private protected void SecureOperation()
    {
        Console.WriteLine("보안 작업");
    }
}
```

접근 제어자로 멤버의 가시성을 제어합니다. `public`은 어디서든 접근 가능, `private`은 클래스 내부만, `protected`는 파생 클래스, `internal`은 같은 어셈블리, `protected internal`은 같은 어셈블리 또는 파생 클래스, `private protected`는 파생 클래스이며 같은 어셈블리에서 접근 가능합니다.

## 프로퍼티

```csharp
class Person
{
    private string name;
    private int age;

    // 전통적인 프로퍼티
    public string Name
    {
        get { return name; }
        set { name = value; }
    }

    // 읽기 전용 프로퍼티
    public int Age
    {
        get { return age; }
    }

    // 계산된 프로퍼티
    public bool IsAdult
    {
        get { return age >= 18; }
    }

    // 자동 구현 프로퍼티
    public string Email { get; set; }

    public Person(string name, int age, string email)
    {
        this.name = name;
        this.age = age;
        Email = email;
    }
}
```

프로퍼티는 필드에 대한 안전한 접근을 제공합니다. getter와 setter를 캡슐화하여 유효성 검사를 추가할 수 있습니다. 자동 구현 프로퍼티(`{ get; set; }`)는 컴파일러가 백킹 필드를 자동 생성합니다.

## 자동 구현 프로퍼티 (C# 3.0+)

```csharp
class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }

    // 읽기 전용 자동 프로퍼티
    public DateTime CreatedAt { get; } = DateTime.Now;

    // init 전용 속성 (C# 9.0+)
    public string Category { get; init; }
}

class Program
{
    static void Main()
    {
        var product = new Product
        {
            Id = 1,
            Name = "노트북",
            Price = 1500000m,
            Category = "전자기기"
        };

        Console.WriteLine($"{product.Name}: {product.Price:C}");
    }
}
```

자동 구현 프로퍼티는 백킹 필드를 자동 생성합니다. `init` 전용 속성(C# 9.0+)은 객체 초기화 시에만 설정할 수 있어 불변성을 보장합니다.

## 정적 멤버

```csharp
class Counter
{
    private static int count = 0;

    public static int Count
    {
        get { return count; }
    }

    public static void Increment()
    {
        count++;
    }

    public static void Reset()
    {
        count = 0;
    }
}

class Program
{
    static void Main()
    {
        Console.WriteLine(Counter.Count);  // 0
        Counter.Increment();
        Counter.Increment();
        Console.WriteLine(Counter.Count);  // 2
        Counter.Reset();
        Console.WriteLine(Counter.Count);  // 0
    }
}
```

`static` 멤버는 클래스에 속하며 인스턴스 없이 접근할 수 있습니다. 모든 인스턴스가 공유합니다. 유틸리티 메서드, 상수, 팩토리 메서드에 사용됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 클래스와 struct의 차이는 무엇인가요?</strong></summary>

class는 참조 타입으로 힙에 할당되며 상속을 지원합니다. struct는 값 타입으로 스택에 할당되며 상속을 지원하지 않습니다. class는 크고 복잡한 데이터에 적합하고 struct는 작고 단순한 데이터에 적합합니다. class는 참조 비용이 있고 struct는 복사 비용이 있습니다.
</details>

<details>
<summary><strong>Q> 소멸서는 언제 사용해야 하나요?</strong></summary>

소멸서는 비관리 리소스를 해제할 때 사용합니다. 하지만 비결정적이므로 `IDisposable`을 구현하고 `Dispose()`를 명시적으로 호출하는 것이 좋습니다. `using` 문으로 자동으로 `Dispose()`를 호출합니다. 소멸서는 최후의 수단으로 사용해야 합니다.
</details>

<details>
<summary><strong>Q> this 키워드는 언제 사용해야 하나요?</strong></summary>

`this`는 다음 경우에 사용합니다: (1) 필드와 매개변수 이름이 같을 때 구분 (2) 메서드 체이닝을 위해 `this` 반환 (3) 인덱서에서 현재 인스턴스 참조. 불필요한 사용은 피해야 하며 명확성을 높이는 데 사용합니다.
</details>

<details>
<summary><strong>Q> 프로퍼티와 필드 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

프로퍼티를 사용하는 것이 좋습니다: (1) 캡슐화 제공 (2) 유효성 검사 가능 (3) 데이터 바인딩 지원. 필드는 private으로 유지하고 프로퍼티로 노출합니다. 자동 구현 프로퍼티로 간소화할 수 있습니다.
</details>

<details>
<summary><strong>Q> 정적 멤버는 언제 사용해야 하나요?</strong></summary>

정적 멤버는 다음 경우에 사용합니다: (1) 인스턴스 상태와 무관한 동작 (2) 모든 인스턴스가 공유하는 데이터 (3) 유틸리티 메서드. 인스턴스 상태에 의존하지 않는 로직에 적합합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **class** | 참조 타입 청사진 | 힙 할당 |
| **new** | 객체 생성 | 생성자 호출 |
| **생성자** | 객체 초기화 | 매개변수, 기본, 정적 |
| **소멸자** | 리소스 정리 | 비결정적 |
| **this** | 현재 인스턴스 참조 | 모호성 해결 |
| **접근 제어자** | 가시성 제어 | public, private, protected |
| **프로퍼티** | getter/setter 캡슐화 | 유효성 검사 |
| **자동 프로퍼티** | 백킹 필드 자동 생성 | { get; set; } |
| **정적 멤버** | 클래스 소속 | 인스턴스 없이 접근 |
| **IDisposable** | 명시적 리소스 해제 | Dispose 패턴 |
| **using** | 자동 Dispose | 범위 종료 시 호출 |


## 다음 수업

다음 글에서는 C# 상속과 다형성 — 기본 클래스, 파생 클래스, virtual, override, sealed, abstract를 배웁니다.
