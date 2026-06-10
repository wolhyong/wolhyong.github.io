---
layout: post
title: "C# 제네릭 — 제네릭 클래스, 제네릭 메서드, 제네릭 인터페이스, 제네릭 제약, 공변성/반공변성"
description: "C#의 제네릭 시스템을 컴파일러 레벨에서 학습합니다. 제네릭은 타입 매개변수로 코드 재사용성과 타입 안전성을 동시에 제공합니다. 제네릭 클래스는 ClassName<T> 문법으로 정의하며 여러 타입 매개변수를 가질 수 있습니다. 제네릭 메서드는 메서드 수준에서 타입 매개변수를 정의합니다. 제네릭 제약(where 절)은 타입 매개변수에 제약을 추가하여 where T : class, where T : struct, where T : new() 등을 지정합니다. 공변성과 반공변성은 제네릭 타입의 할당 호환성을 제어하며 out과 in 키워드를 사용합니다. C# 제네릭은 컴파일 타임에 구체화되어 런타임 오버헤드가 없습니다."
date: 2025-08-13 10:00:00 +0900
category: csharp
tags: [csharp, generics, generic-constraints, covariance, contravariance, variance]
level: intermediate
---

C#의 제네릭은 타입 안전성과 코드 재사용성을 동시에 제공하는 강력한 기능입니다.

> **핵심 정리** · 제네릭은 타입 매개변수로 코드 재사용성을 제공합니다. `where` 절로 타입 제약을 추가합니다. 공변성과 반공변성으로 할당 호환성을 제어합니다. 컴파일 타임에 구체화되어 런타임 오버헤드가 없습니다.


## 수업 목표

- 제네릭 클래스와 메서드를 이해합니다.
- 제네릭 인터페이스를 이해합니다.
- 제네릭 제약(where 절)을 이해합니다.
- 공변성과 반공변성을 이해합니다.
- 제네릭 컬렉션을 이해합니다.

## 제네릭 클래스

```csharp
class Repository<T>
{
    private List<T> items = new List<T>();

    public void Add(T item)
    {
        items.Add(item);
    }

    public T GetById(int id)
    {
        return items[id];
    }

    public IEnumerable<T> GetAll()
    {
        return items;
    }
}

class Program
{
    static void Main()
    {
        // int용 리포지토리
        Repository<int> intRepo = new Repository<int>();
        intRepo.Add(1);
        intRepo.Add(2);
        Console.WriteLine(intRepo.GetById(0));

        // string용 리포지토리
        Repository<string> stringRepo = new Repository<string>();
        stringRepo.Add("Hello");
        stringRepo.Add("World");
        Console.WriteLine(stringRepo.GetById(0));
    }
}
```

제네릭 클래스는 `ClassName<T>` 문법으로 정의합니다. 타입 매개변수 `T`는 컴파일 타임에 구체적인 타입으로 대체됩니다. 여러 타입에 대해 코드를 재사용할 수 있습니다.

## 제네릭 메서드

```csharp
class Utility
{
    // 제네릭 메서드
    public static T Max<T>(T a, T b) where T : IComparable<T>
    {
        return a.CompareTo(b) > 0 ? a : b;
    }

    // 제네릭 메서드 (여러 타입 매개변수)
    public static TResult Convert<T, TResult>(T value) where T : IConvertible
    {
        return (TResult)Convert.ChangeType(value, typeof(TResult));
    }
}

class Program
{
    static void Main()
    {
        int maxInt = Utility.Max(10, 20);
        Console.WriteLine($"최대값: {maxInt}");

        string maxString = Utility.Max("Apple", "Banana");
        Console.WriteLine($"최대값: {maxString}");

        int converted = Utility.Convert<string, int>("42");
        Console.WriteLine($"변환: {converted}");
    }
}
```

제네릭 메서드는 메서드 수준에서 타입 매개변수를 정의합니다. `MethodName<T>(T param)` 형식입니다. 여러 타입 매개변수를 가질 수 있습니다. 제네릭 메서드는 비제네릭 클래스에서도 정의할 수 있습니다.

## 제네릭 인터페이스

```csharp
interface IRepository<T>
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

제네릭 인터페이스는 타입 매개변수를 가진 인터페이스입니다. `IRepository<T>`는 `T` 타입의 엔티티를 관리하는 계약을 정의합니다. 구현 클래스는 구체적인 타입을 지정합니다.

## 제네릭 제약

```csharp
class Utility
{
    // where T : struct - 값 타입만 허용
    public static T Add<T>(T a, T b) where T : struct
    {
        // 구체적인 구현 필요
        return default;
    }

    // where T : class - 참조 타입만 허용
    public static void PrintName<T>(T obj) where T : class
    {
        Console.WriteLine(obj?.ToString() ?? "null");
    }

    // where T : new() - 매개변수 없는 생성자
    public static T CreateInstance<T>() where T : new()
    {
        return new T();
    }

    // where T : IComparable<T> - 비교 가능
    public static T Max<T>(T a, T b) where T : IComparable<T>
    {
        return a.CompareTo(b) > 0 ? a : b;
    }

    // where T : BaseClass - 특정 기본 클래스
    public static void Process<T>(T obj) where T : Animal
    {
        obj.MakeSound();
    }
}

class Animal
{
    public virtual void MakeSound() => Console.WriteLine("소리");
}

class Dog : Animal
{
    public override void MakeSound() => Console.WriteLine("멍멍");
}

class Program
{
    static void Main()
    {
        // struct 제약
        int result = Utility.Add(1, 2);

        // class 제약
        Utility.PrintName("Hello");

        // new() 제약
        List<string> list = Utility.CreateInstance<List<string>>();

        // IComparable 제약
        int max = Utility.Max(10, 20);

        // 기본 클래스 제약
        Utility.Process(new Dog());
    }
}
```

`where` 절로 타입 제약을 추가합니다. `where T : struct`는 값 타입만, `where T : class`는 참조 타입만, `where T : new()`는 매개변수 없는 생성자를, `where T : IComparable<T>`는 비교 가능을, `where T : BaseClass`는 특정 기본 클래스를 제약합니다. 여러 제약을 결합할 수 있습니다.

## 공변성과 반공변성

```csharp
// 공변성 (out) - 출력만
interface IProducer<out T>
{
    T Produce();
}

// 반공변성 (in) - 입력만
interface IConsumer<in T>
{
    void Consume(T item);
}

class Producer<T> : IProducer<T>
{
    private T item;

    public Producer(T item)
    {
        this.item = item;
    }

    public T Produce()
    {
        return item;
    }
}

class Consumer<T> : IConsumer<T>
{
    public void Consume(T item)
    {
        Console.WriteLine($"소비: {item}");
    }
}

class Program
{
    static void Main()
    {
        // 공변성: 파생 클래스를 기본 클래스에 할당 가능
        IProducer<string> stringProducer = new Producer<string>("Hello");
        IProducer<object> objectProducer = stringProducer;  // 공변성 허용

        // 반공변성: 기본 클래스를 파생 클래스에 할당 가능
        IConsumer<object> objectConsumer = new Consumer<object>();
        IConsumer<string> stringConsumer = objectConsumer;  // 반공변성 허용

        objectProducer.Produce();
        stringConsumer.Consume("World");
    }
}
```

공변성(`out`)은 파생 클래스를 기본 클래스 참조에 할당할 수 있게 합니다. 반공변성(`in`)은 기본 클래스를 파생 클래스 참조에 할당할 수 있게 합니다. 제네릭 인터페이스와 대리자에 적용됩니다.

## 제네릭 컬렉션

```csharp
class Program
{
    static void Main()
    {
        // List<T>
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
        numbers.Add(6);
        int sum = numbers.Sum();
        Console.WriteLine($"합: {sum}");

        // Dictionary<TKey, TValue>
        Dictionary<string, int> ages = new Dictionary<string, int>
        {
            { "Alice", 30 },
            { "Bob", 25 }
        };
        Console.WriteLine($"Alice 나이: {ages["Alice"]}");

        // HashSet<T>
        HashSet<int> uniqueNumbers = new HashSet<int> { 1, 2, 3, 2, 1 };
        Console.WriteLine($"고유 숫자 개수: {uniqueNumbers.Count}");

        // Queue<T>
        Queue<string> queue = new Queue<string>();
        queue.Enqueue("첫 번째");
        queue.Enqueue("두 번째");
        Console.WriteLine(queue.Dequeue());

        // Stack<T>
        Stack<string> stack = new Stack<string>();
        stack.Push("첫 번째");
        stack.Push("두 번째");
        Console.WriteLine(stack.Pop());
    }
}
```

.NET BCL은 풍부한 제네릭 컬렉션을 제공합니다. `List<T>`, `Dictionary<TKey, TValue>`, `HashSet<T>`, `Queue<T>`, `Stack<T>` 등이 있습니다. 타입 안전하며 박싱/언박싱 오버헤드가 없습니다.

## 제네릭 대리자

```csharp
class Program
{
    // 제네릭 대리자
    public delegate T Transformer<T>(T input);

    static void Main()
    {
        // 대리자 인스턴스화
        Transformer<int> doubler = x => x * 2;
        Transformer<string> toUpper = s => s.ToUpper();

        Console.WriteLine(doubler(5));
        Console.WriteLine(toUpper("hello"));
    }
}
```

제네릭 대리자는 타입 매개변수를 가진 대리자입니다. `delegate T Transformer<T>(T input)` 형식입니다. 람다 식과 함께 사용하여 유연한 코드를 작성할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 제네릭은 언제 사용해야 하나요?</strong></summary>

제네릭은 다음 경우에 사용합니다: (1) 타입에 의존하지 않는 로직 (2) 컬렉션 (3) 유틸리티 메서드 (4) 팩토리 패턴. 타입 안전성과 코드 재사용성을 동시에 제공합니다. 비제네릭(object)보다 성능이 좋고 박싱을 피할 수 있습니다.
</details>

<details>
<summary><strong>Q> 제네릭 제약은 왜 필요한가요?</strong></summary>

제네릭 제약은 타입 매개변수에 제약을 추가하여 컴파일 타임에 타입 안전성을 보장합니다. 예: `where T : class`는 참조 타입만 허용, `where T : new()`는 매개변수 없는 생성자를 요구. 제약을 통해 해당 타입의 메서드를 호출할 수 있습니다.
</details>

<details>
<summary><strong>Q> 공변성과 반공변성의 차이는 무엇인가요?</strong></summary>

공변성(`out`)은 파생 클래스를 기본 클래스 참조에 할당할 수 있게 합니다(출력 전용). 반공변성(`in`)은 기본 클래스를 파생 클래스 참조에 할당할 수 있게 합니다(입력 전용). 공변성은 읽기 전용 컬렉션에, 반공변성은 쓰기 전용 컬렉션에 사용됩니다.
</details>

<details>
<summary><strong>Q> 제네릭과 object 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

제네릭을 사용해야 합니다. `object`는 박싱/언박싱 오버헤드가 있고 타입 안전하지 않습니다. 제네릭은 컴파일 타임에 타입을 확인하며 박싱이 없습니다. 타입 안전성과 성능 면에서 제네릭이 우수합니다.
</details>

<details>
<summary><strong>Q> 제네릭의 성능 영향은 무엇인가요?</strong></summary>

제네릭은 컴파일 타임에 구체화되어 런타임 오버헤드가 없습니다. JIT 컴파일러는 각 구체화된 타입에 대해 최적화된 네이티브 코드를 생성합니다. 박싱/언박싱을 피하므로 성능이 향상됩니다. `object`보다 항상 더 좋은 성능을 제공합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **제네릭 클래스** | ClassName<T> | 타입 매개변수 |
| **제네릭 메서드** | Method<T> | 메서드 수준 |
| **제네릭 인터페이스** | IInterface<T> | 계약 정의 |
| **where 절** | 타입 제약 | class, struct, new() |
| **공변성** | out 키워드 | 파생→기본 할당 |
| **반공변성** | in 키워드 | 기본→파생 할당 |
| **제네릭 컬렉션** | List<T>, Dictionary<,> | 타입 안전 |
| **제네릭 대리자** | delegate T | 람다 식과 함께 |
| **박싱 방지** | 타입 안전 | object 대신 제네릭 |
| **구체화** | 컴파일 타임 | 런타임 오버헤드 없음 |


## 다음 수업

다음 글에서는 C# 중급 — 컬렉션, List, Dictionary, LINQ, Enumerable을 배웁니다.
