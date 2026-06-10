---
layout: post
title: "C# 상속과 다형성 — 기본 클래스, 파생 클래스, virtual, override, sealed, abstract"
description: "C#의 상속과 다형성 시스템을 컴파일러 레벨에서 학습합니다. class는 : 기본클래스 문법으로 상속하며 단일 상속만 지원합니다. virtual 키워드는 파생 클래스에서 재정의할 수 있는 메서드를 정의하며 override로 재정의합니다. sealed 키워드는 상속이나 재정의를 방지합니다. abstract 키워드는 추상 클래스와 추상 메서드를 정의하며 인스턴스화할 수 없습니다. 인터페이스는 다중 상속을 지원하며 계약을 정의합니다. 다형성은 기본 클래스 참조로 파생 클래스 객체를 처리하며 런타임에 적절한 메서드가 호출됩니다. C#은 is와 as 연산자로 타입 확인과 변환을 수행합니다."
date: 2025-08-08 10:00:00 +0900
category: csharp
tags: [csharp, inheritance, polymorphism, virtual, override, sealed, abstract, interface]
level: basic
---

C#의 상속과 다형성은 코드 재사용성과 유연성을 제공하는 객체지향 프로그래밍의 핵심입니다.

> **핵심 정리** · `:`로 기본 클래스를 상속하며 단일 상속만 지원합니다. `virtual`로 재정의 가능한 메서드를 정의하고 `override`로 재정의합니다. `sealed`는 상속이나 재정의를 방지합니다. `abstract`는 추상 클래스와 메서드를 정의합니다. 인터페이스는 다중 상속을 지원합니다. 다형성으로 런타임에 적절한 메서드가 호출됩니다.


## 수업 목표

- 상속의 개념과 사용법을 이해합니다.
- virtual과 override를 이해합니다.
- sealed와 abstract를 이해합니다.
- 인터페이스를 사용할 수 있습니다.
- 다형성의 동작을 이해합니다.
- is와 as 연산자를 사용할 수 있습니다.

## 상속 기본

```csharp
class Animal
{
    public string Name { get; set; }

    public Animal(string name)
    {
        Name = name;
    }

    public void Eat()
    {
        Console.WriteLine($"{Name}이(가) 먹고 있습니다.");
    }

    public void Sleep()
    {
        Console.WriteLine($"{Name}이(가) 자고 있습니다.");
    }
}

class Dog : Animal
{
    public string Breed { get; set; }

    public Dog(string name, string breed) : base(name)
    {
        Breed = breed;
    }

    public void Bark()
    {
        Console.WriteLine($"{Name}이(가) 멍멍!");
    }
}

class Program
{
    static void Main()
    {
        Dog dog = new Dog("바둑이", "골든 리트리버");
        
        dog.Eat();    // 기본 클래스 메서드
        dog.Sleep();  // 기본 클래스 메서드
        dog.Bark();   // 파생 클래스 메서드
    }
}
```

`class 파생클래스 : 기본클래스` 문법으로 상속합니다. 파생 클래스는 기본 클래스의 모든 public/protected 멤버를 상속받습니다. C#은 단일 상속만 지원하며 다중 상속은 인터페이스로 구현합니다.

## virtual과 override

```csharp
class Animal
{
    public string Name { get; set; }

    public Animal(string name)
    {
        Name = name;
    }

    // virtual 메서드
    public virtual void MakeSound()
    {
        Console.WriteLine($"{Name}이(가) 소리를 냅니다.");
    }
}

class Dog : Animal
{
    public Dog(string name) : base(name) { }

    // override 메서드
    public override void MakeSound()
    {
        Console.WriteLine($"{Name}이(가) 멍멍!");
    }
}

class Cat : Animal
{
    public Cat(string name) : base(name) { }

    public override void MakeSound()
    {
        Console.WriteLine($"{Name}이(가) 야옹!");
    }
}

class Program
{
    static void Main()
    {
        Animal dog = new Dog("바둑이");
        Animal cat = new Cat("나비");
        
        dog.MakeSound();  // Dog.MakeSound() 호출
        cat.MakeSound();  // Cat.MakeSound() 호출
    }
}
```

`virtual`은 파생 클래스에서 재정의할 수 있는 메서드를 정의합니다. `override`는 기본 클래스의 virtual 메서드를 재정의합니다. 런타임에 객체의 실제 타입에 따라 적절한 메서드가 호출됩니다(다형성).

## sealed

```csharp
class Animal
{
    public virtual void MakeSound()
    {
        Console.WriteLine("소리를 냅니다.");
    }
}

class Dog : Animal
{
    // sealed로 재정의 방지
    public sealed override void MakeSound()
    {
        Console.WriteLine("멍멍!");
    }
}

// 컴파일 에러: Dog.MakeSound는 sealed이므로 재정의 불가
class Puppy : Dog
{
    // public override void MakeSound() { }
}
```

`sealed`는 상속이나 재정의를 방지합니다. `sealed class`는 상속을 방지하고, `sealed override`는 특정 메서드의 재정의를 방지합니다. 디자인 의도를 명확히 하고 성능 최적화에 도움이 됩니다.

## abstract

```csharp
// 추상 클래스
abstract class Shape
{
    public string Name { get; set; }

    public Shape(string name)
    {
        Name = name;
    }

    // 추상 메서드 (구현 없음)
    public abstract double CalculateArea();

    // 일반 메서드
    public void Display()
    {
        Console.WriteLine($"{Name}: 넓이 = {CalculateArea()}");
    }
}

class Circle : Shape
{
    public double Radius { get; set; }

    public Circle(double radius) : base("원")
    {
        Radius = radius;
    }

    public override double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }
}

class Rectangle : Shape
{
    public double Width { get; set; }
    public double Height { get; set; }

    public Rectangle(double width, double height) : base("직사각형")
    {
        Width = width;
        Height = height;
    }

    public override double CalculateArea()
    {
        return Width * Height;
    }
}

class Program
{
    static void Main()
    {
        // Shape shape = new Shape("도형");  // 컴파일 에러: 추상 클래스는 인스턴스화 불가
        
        Shape circle = new Circle(5);
        Shape rectangle = new Rectangle(10, 20);
        
        circle.Display();
        rectangle.Display();
    }
}
```

`abstract class`는 추상 클래스로 인스턴스화할 수 없습니다. `abstract method`는 구현이 없으며 파생 클래스에서 반드시 재정의해야 합니다. 추상 클래스는 공통 인터페이스와 부분 구현을 제공합니다.

## 인터페이스

```csharp
interface IShape
{
    double CalculateArea();
    double CalculatePerimeter();
}

interface IMovable
{
    void Move(double x, double y);
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

class Rectangle : IShape, IMovable
{
    public double Width { get; set; }
    public double Height { get; set; }
    public double X { get; private set; }
    public double Y { get; private set; }

    public Rectangle(double width, double height)
    {
        Width = width;
        Height = height;
    }

    public double CalculateArea()
    {
        return Width * Height;
    }

    public double CalculatePerimeter()
    {
        return 2 * (Width + Height);
    }

    public void Move(double x, double y)
    {
        X += x;
        Y += y;
        Console.WriteLine($"이동: ({X}, {Y})");
    }
}

class Program
{
    static void Main()
    {
        IShape circle = new Circle(5);
        IShape rectangle = new Rectangle(10, 20);
        
        Console.WriteLine($"원 넓이: {circle.CalculateArea()}");
        Console.WriteLine($"직사각형 넓이: {rectangle.CalculateArea()}");
        
        IMovable movable = (Rectangle)rectangle;
        movable.Move(5, 5);
    }
}
```

인터페이스는 계약을 정의하며 다중 상속을 지원합니다. 모든 멤버는 암시적으로 `public abstract`입니다. 구현 클래스는 모든 멤버를 구현해야 합니다. 명명 충돌을 피하기 위해 명시적 인터페이스 구현을 사용할 수 있습니다.

## 다형성

```csharp
abstract class Animal
{
    public string Name { get; set; }

    public Animal(string name)
    {
        Name = name;
    }

    public abstract void MakeSound();
}

class Dog : Animal
{
    public Dog(string name) : base(name) { }

    public override void MakeSound()
    {
        Console.WriteLine("멍멍!");
    }
}

class Cat : Animal
{
    public Cat(string name) : base(name) { }

    public override void MakeSound()
    {
        Console.WriteLine("야옹!");
    }
}

class Program
{
    static void MakeAnimalSound(Animal animal)
    {
        animal.MakeSound();  // 다형성: 실제 타입에 따라 메서드 호출
    }

    static void Main()
    {
        Animal[] animals = {
            new Dog("바둑이"),
            new Cat("나비"),
            new Dog("점순이")
        };

        foreach (Animal animal in animals)
        {
            MakeAnimalSound(animal);
        }
    }
}
```

다형성은 기본 클래스 참조로 파생 클래스 객체를 처리합니다. 런타임에 객체의 실제 타입에 따라 적절한 메서드가 호출됩니다. 코드 유연성을 높이고 확장성을 제공합니다.

## is와 as

```csharp
class Animal
{
    public virtual void MakeSound() => Console.WriteLine("소리");
}

class Dog : Animal
{
    public override void MakeSound() => Console.WriteLine("멍멍");
    public void Bark() => Console.WriteLine("짖기!");
}

class Program
{
    static void Main()
    {
        Animal animal = new Dog();

        // is 연산자: 타입 확인
        if (animal is Dog)
        {
            Console.WriteLine("Dog 타입입니다.");
        }

        // as 연산자: 안전한 캐스팅
        Dog? dog = animal as Dog;
        if (dog != null)
        {
            dog.Bark();
        }

        // 패턴 매칭 (C# 7.0+)
        if (animal is Dog d)
        {
            d.Bark();
        }
    }
}
```

`is` 연산자는 타입 확인을 수행합니다. `as` 연산자는 안전한 캐스팅을 수행하며 실패 시 `null`을 반환합니다. 패턴 매칭으로 타입 확인과 캐스팅을 동시에 수행할 수 있습니다.

## 명시적 인터페이스 구현

```csharp
interface IWriter
{
    void Write(string text);
}

class Logger : IWriter
{
    public void Write(string text)
    {
        Console.WriteLine($"로그: {text}");
    }

    // 명시적 인터페이스 구현
    void IWriter.Write(string text)
    {
        Console.WriteLine($"IWriter: {text}");
    }
}

class Program
{
    static void Main()
    {
        Logger logger = new Logger();
        
        logger.Write("메시지");  // Logger.Write 호출
        
        IWriter writer = logger;
        writer.Write("메시지");  // IWriter.Write 호출
    }
}
```

명시적 인터페이스 구현은 인터페이스 멤버를 특정 인터페이스 통해서만 접근 가능하게 합니다. 이름 충돌을 해결하고 구현 세부를 숨길 때 사용됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 상속과 컴포지션 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

상속은 "is-a" 관계에 적합합니다: Dog is an Animal. 컴포지션은 "has-a" 관계에 적합합니다: Car has an Engine. 상속은 코드 재사용에 유용하지만 강한 결합을 유발합니다. 컴포지션은 더 유연하며 우선시 고려해야 합니다. "상속보다 컴포지션을 우선하라"는 원칙이 있습니다.
</details>

<details>
<summary><strong>Q> virtual 메서드는 언제 사용해야 하나요?</strong></summary>

`virtual` 메서드는 파생 클래스에서 재정의를 허용할 때 사용합니다. 기본 구현을 제공하며 파생 클래스에서 동작을 변경할 수 있게 합니다. 다형성이 필요할 때 사용합니다. 재정의가 필요 없으면 `virtual`을 사용하지 않는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> abstract class와 interface 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`abstract class`는 부분 구현과 공통 상태가 필요할 때 사용합니다. `interface`는 계약만 정의하며 다중 상속이 필요할 때 사용합니다. 버전 호환성이 중요하면 `interface`를, 공통 구현이 필요하면 `abstract class`를 사용합니다. C# 8.0부터 인터페이스도 기본 구현을 제공할 수 있습니다.
</details>

<details>
<summary><strong>Q> sealed는 언제 사용해야 하나요?</strong></summary>

`sealed`는 다음 경우에 사용합니다: (1) 상속을 방지하고 싶을 때 (2) 재정의를 방지하고 싶을 때 (3) 성능 최적화(vtable 조회 방지). 디자인 의도를 명확히 하고 실수를 방지합니다. 불변 클래스나 유틸리티 클래스에 사용됩니다.
</details>

<details>
<summary><strong>Q> 다형성은 어떻게 동작하나요?</strong></summary>

다형성은 런타임에 객체의 실제 타입에 따라 메서드를 호출합니다. 기본 클래스 참조로 파생 클래스 객체를 처리할 때 발생합니다. vtable(가상 메서드 테이블)을 사용하여 적절한 메서드 포인터를 찾습니다. 오버라이드된 메서드만 다형성이 적용됩니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **상속** | : 기본클래스 | 단일 상속 |
| **virtual** | 재정의 가능 메서드 | 파생 클래스에서 override |
| **override** | 메서드 재정의 | virtual 메서드 재정 |
| **sealed** | 상속/재정의 방지 | 디자인 의도 명확화 |
| **abstract class** | 추상 클래스 | 인스턴스화 불가 |
| **abstract method** | 추상 메서드 | 구현 없음, 재정의 필수 |
| **interface** | 계약 정의 | 다중 상속 지원 |
| **다형성** | 런타임 메서드 호출 | 기본 참조로 파생 처리 |
| **is** | 타입 확인 | bool 반환 |
| **as** | 안전한 캐스팅 | 실패 시 null |
| **명시적 구현** | 인터페이스 전용 | 이름 충돌 해결 |


## 다음 수업

다음 글에서는 C# 인터페이스와 추상화 — 인터페이스 구현, 다중 인터페이스, 명시적 구현, 기본 구현을 배웁니다.
