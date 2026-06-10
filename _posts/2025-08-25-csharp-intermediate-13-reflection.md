---
layout: post
title: "C# 리플렉션과 특성 — Reflection, Attribute, 동적 타입, dynamic 키워드, 메타데이터"
description: "C#의 리플렉션과 특성 시스템을 컴파일러 레벨에서 학습합니다. Reflection은 런타임에 타입 정보를 검사하고 동적으로 코드를 실행할 수 있게 합니다. Type 클래스로 타입 정보를 얻으며 MethodInfo, PropertyInfo, FieldInfo 등으로 멤버에 접근합니다. Attribute는 메타데이터를 코드에 추가하며 [AttributeName] 문법을 사용합니다. 사용자 정의 특성은 Attribute 클래스를 상속하여 정의하며 AttributeUsage로 적용 대상을 지정합니다. dynamic 키워드는 동적 타입으로 컴파일 타임 타입 검사를 건너뜁니다. 리플렉션은 DI 컨테이너, ORM, 직렬화 등에 사용되며 강력하지만 성능 오버헤드가 있습니다."
date: 2025-08-25 10:00:00 +0900
category: csharp
tags: [csharp, reflection, attributes, dynamic, metadata, type-system]
level: intermediate
---

C#의 리플렉션은 런타임에 타입 정보를 검사하고 동적으로 코드를 실행할 수 있게 합니다.

> **핵심 정리** · `Reflection`은 런타임 타입 검사를 제공합니다. `Type` 클래스로 타입 정보를 얻습니다. `Attribute`는 메타데이터를 추가합니다. `dynamic`은 동적 타입을 제공합니다. 리플렉션은 DI, ORM 등에 사용되지만 성능 오버헤드가 있습니다.


## 수업 목표

- Reflection의 개념과 사용법을 이해합니다.
- Type 클래스를 이해합니다.
- Attribute를 정의하고 사용할 수 있습니다.
- dynamic 키워드를 이해합니다.
- 리플렉션의 사용 사례를 이해합니다.
- 리플렉션의 성능 영향을 이해합니다.

## Reflection 기본

```csharp
using System;
using System.Reflection;

class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }

    public void Introduce()
    {
        Console.WriteLine($"안녕하세요, 저는 {Name}이고 {Age}살입니다.");
    }
}

class Program
{
    static void Main()
    {
        // Type 얻기
        Type type = typeof(Person);

        Console.WriteLine($"타입: {type.Name}");
        Console.WriteLine($"네임스페이스: {type.Namespace}");
        Console.WriteLine($"어셈블리: {type.Assembly}");

        // 멤버 정보
        PropertyInfo[] properties = type.GetProperties();
        Console.WriteLine("\n프로퍼티:");
        foreach (PropertyInfo prop in properties)
        {
            Console.WriteLine($"  {prop.Name}: {prop.PropertyType}");
        }

        MethodInfo[] methods = type.GetMethods();
        Console.WriteLine("\n메서드:");
        foreach (MethodInfo method in methods)
        {
            Console.WriteLine($"  {method.Name}: {method.ReturnType}");
        }
    }
}
```

`typeof(T)`는 타입의 `Type` 객체를 반환합니다. `Type` 클래스는 타입 정보를 제공합니다. `GetProperties`, `GetMethods`, `GetFields` 등으로 멤버 정보를 얻을 수 있습니다.

## 동적 인스턴스 생성

```csharp
using System;
using System.Reflection;

class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }

    public void Introduce()
    {
        Console.WriteLine($"안녕하세요, 저는 {Name}이고 {Age}살입니다.");
    }
}

class Program
{
    static void Main()
    {
        Type type = typeof(Person);

        // 생성자 얻기
        ConstructorInfo ctor = type.GetConstructor(new[] { typeof(string), typeof(int) });

        // 인스턴스 생성
        object instance = ctor.Invoke(new object[] { "Wolhyong", 30 });

        // 메서드 호출
        MethodInfo method = type.GetMethod("Introduce");
        method.Invoke(instance, null);
    }
}
```

`GetConstructor`로 생성자 정보를 얻습니다. `Invoke`로 동적으로 인스턴스를 생성하고 메서드를 호출합니다. 리플렉션은 동적 코드 실행을 가능하게 합니다.

## 프로퍼티 접근

```csharp
using System;
using System.Reflection;

class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
}

class Program
{
    static void Main()
    {
        Person person = new Person { Name = "Wolhyong", Age = 30 };
        Type type = typeof(Person);

        // 프로퍼티 얻기
        PropertyInfo nameProp = type.GetProperty("Name");
        PropertyInfo ageProp = type.GetProperty("Age");

        // 값 읽기
        string name = (string)nameProp.GetValue(person);
        int age = (int)ageProp.GetValue(person);

        Console.WriteLine($"이름: {name}, 나이: {age}");

        // 값 설정
        nameProp.SetValue(person, "Greyhacker");
        ageProp.SetValue(person, 31);

        Console.WriteLine($"수정 후: {person.Name}, {person.Age}");
    }
}
```

`GetProperty`로 프로퍼티 정보를 얻습니다. `GetValue`로 값을 읽고 `SetValue`로 값을 설정합니다. 리플렉션으로 프로퍼티에 동적으로 접근할 수 있습니다.

## Attribute

```csharp
using System;

[Serializable]
class Person
{
    [Obsolete("이 속성은 더 이상 사용되지 않습니다.")]
    public string Name { get; set; }

    public int Age { get; set; }

    [Conditional("DEBUG")]
    public void DebugLog()
    {
        Console.WriteLine($"디버그: {Name}, {Age}");
    }
}

class Program
{
    static void Main()
    {
        Person person = new Person { Name = "Wolhyong", Age = 30 };
        person.DebugLog();
    }
}
```

`Attribute`는 메타데이터를 코드에 추가합니다. `[Serializable]`, `[Obsolete]`, `[Conditional]` 등의 내장 특성이 있습니다. 컴파일러, 런타임, 도구가 특성을 읽어 동작을 제어합니다.

## 사용자 정의 특성

```csharp
using System;
using System.Reflection;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
class AuthorAttribute : Attribute
{
    public string Name { get; }
    public DateTime Date { get; }

    public AuthorAttribute(string name)
    {
        Name = name;
        Date = DateTime.Now;
    }
}

[Author("Wolhyong")]
[Author("Greyhacker")]
class Calculator
{
    [Author("Alice")]
    public int Add(int a, int b)
    {
        return a + b;
    }

    [Author("Bob")]
    public int Multiply(int a, int b)
    {
        return a * b;
    }
}

class Program
{
    static void Main()
    {
        Type type = typeof(Calculator);

        // 클래스 특성
        AuthorAttribute[] classAttrs = (AuthorAttribute[])type.GetCustomAttributes(typeof(AuthorAttribute), false);
        Console.WriteLine("클래스 작성자:");
        foreach (var attr in classAttrs)
        {
            Console.WriteLine($"  {attr.Name} ({attr.Date.ToShortDateString()})");
        }

        // 메서드 특성
        MethodInfo[] methods = type.GetMethods();
        foreach (MethodInfo method in methods)
        {
            AuthorAttribute[] methodAttrs = (AuthorAttribute[])method.GetCustomAttributes(typeof(AuthorAttribute), false);
            if (methodAttrs.Length > 0)
            {
                Console.WriteLine($"\n메서드 {method.Name} 작성자:");
                foreach (var attr in methodAttrs)
                {
                    Console.WriteLine($"  {attr.Name} ({attr.Date.ToShortDateString()})");
                }
            }
        }
    }
}
```

사용자 정의 특성은 `Attribute` 클래스를 상속하여 정의합니다. `AttributeUsage`로 적용 대상을 지정합니다. `GetCustomAttributes`로 특성을 읽습니다. DI 컨테이너, ORM, 테스트 프레임워크 등에 사용됩니다.

## dynamic 키워드

```csharp
using System;

class Program
{
    static void Main()
    {
        // dynamic 타입
        dynamic obj = "Hello";

        Console.WriteLine(obj.Length);  // 컴파일 타임 검사 없음

        obj = 42;
        Console.WriteLine(obj + 10);  // 런타임에 타입 결정

        // 동적 객체
        dynamic person = new { Name = "Wolhyong", Age = 30 };
        Console.WriteLine(person.Name);

        // COM 상호작용
        // dynamic excel = Application.Excel;
        // excel.Visible = true;
    }
}
```

`dynamic` 키워드는 동적 타입을 정의합니다. 컴파일 타임 타입 검사를 건너뜁니다. 런타임에 타입이 결정되며 DLR(Dynamic Language Runtime)을 사용합니다. COM 상호작용, 동적 언어 상호작용에 사용됩니다.

## 리플렉션 사용 사례

```csharp
using System;
using System.Reflection;

class Program
{
    static void CopyProperties(object source, object destination)
    {
        Type sourceType = source.GetType();
        Type destType = destination.GetType();

        PropertyInfo[] properties = sourceType.GetProperties();
        foreach (PropertyInfo prop in properties)
        {
            PropertyInfo destProp = destType.GetProperty(prop.Name);
            if (destProp != null && destProp.CanWrite)
            {
                destProp.SetValue(destination, prop.GetValue(source));
            }
        }
    }

    static void Main()
    {
        var source = new { Name = "Wolhyong", Age = 30 };
        var dest = new { Name = "", Age = 0 };

        CopyProperties(source, dest);

        Console.WriteLine($"Name: {dest.Name}, Age: {dest.Age}");
    }
}
```

리플렉션은 다음에 사용됩니다: (1) DI 컨테이너 (2) ORM (3) 직렬화 (4) 단위 테스트 (5) 플러그인 시스템. 동적 코드 실행과 메타데이터 기반 프로그래밍을 가능하게 합니다.

## 리플렉션 성능

```csharp
using System;
using System.Diagnostics;
using System.Reflection;

class Program
{
    static void Main()
    {
        var person = new Person { Name = "Wolhyong", Age = 30 };
        Type type = typeof(Person);
        PropertyInfo prop = type.GetProperty("Name");

        // 직접 접근
        var stopwatch = Stopwatch.StartNew();
        for (int i = 0; i < 1000000; i++)
        {
            string name = person.Name;
        }
        stopwatch.Stop();
        Console.WriteLine($"직접 접근: {stopwatch.ElapsedMilliseconds}ms");

        // 리플렉션 접근
        stopwatch = Stopwatch.StartNew();
        for (int i = 0; i < 1000000; i++)
        {
            string name = (string)prop.GetValue(person);
        }
        stopwatch.Stop();
        Console.WriteLine($"리플렉션 접근: {stopwatch.ElapsedMilliseconds}ms");
    }
}

class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
}
```

리플렉션은 성능 오버헤드가 있습니다. 직접 접근보다 훨씬 느립니다. 핫 경로에서는 피하고 캐싱이나 코드 생성을 사용하여 최적화해야 합니다. `Expression` 트리나 소스 생성기를 사용하여 성능을 향상할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 리플렉션은 언제 사용해야 하나요?</strong></summary>

리플렉션은 다음 경우에 사용합니다: (1) 런타임에 타입 정보가 필요할 때 (2) 플러그인 시스템 (3) DI 컨테이너 (4) ORM (5) 직렬화. 하지만 성능 오버헤드가 있으므로 핫 경로에서는 피해야 합니다.
</details>

<details>
<summary><strong>Q> dynamic은 언제 사용해야 하나요?</strong></summary>

`dynamic`은 다음 경우에 사용합니다: (1) COM 상호작용 (2) 동적 언어 상호작용 (3) JSON/XML 역직렬화 (4) 단위 테스트 모킹. 타입 안전성을 희생하므로 신중하게 사용해야 합니다.
</details>

<details>
<summary><strong>Q> Attribute는 언제 사용해야 하나요?</strong></summary>

`Attribute`는 메타데이터가 필요할 때 사용합니다: (1) 직렬화 제어 (2) ORM 매핑 (3) 단위 테스트 (4) 보안 (5) 로깅. 컴파일러와 런타임이 메타데이터를 읽어 동작을 제어합니다.
</details>

<details>
<summary><strong>Q> 리플렉션 성능을 어떻게 최적화하나요?</strong></summary>

리플렉션 최적화 방법: (1) 캐싱: `Type`, `MethodInfo` 등을 캐시 (2) `Expression` 트리: 동적 코드 생성 (3) 소스 생성기: 컴파일 타임 코드 생성 (4) `Delegate.CreateDelegate`: 델리게이트 생성. 핫 경로에서는 직접 접근을 사용합니다.
</details>

<details>
<summary><strong>Q> typeof와 GetType의 차이는 무엇인가요?</strong></summary>

`typeof(T)`는 컴파일 타임에 타입 정보를 얻습니다. `obj.GetType()`은 런타임에 객체의 실제 타입 정보를 얻습니다. `typeof`는 정적 타입, `GetType`은 동적 타입입니다. 다형성이 있을 때 차이가 발생합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Reflection** | 런타임 타입 검사 | Type 클래스 |
| **typeof** | 컴파일 타임 Type | typeof(T) |
| **GetType** | 런타임 Type | obj.GetType() |
| **MethodInfo** | 메서드 정보 | Invoke로 호출 |
| **PropertyInfo** | 프로퍼티 정보 | GetValue/SetValue |
| **Attribute** | 메타데이터 | [Attr] 문법 |
| **사용자 정의 특성** | Attribute 상속 | AttributeUsage |
| **dynamic** | 동적 타입 | 컴파일 타임 검사 없음 |
| **DLR** | 동적 언어 런타임 | dynamic 실행 |
| **성능 오버헤드** | 리플렉션 느림 | 캐싱으로 최적화 |


## 다음 수업

다음 글에서는 C# 중급 — LINQ 심화, 쿼리 식, 그룹화, 조인, 집계를 배웁니다.
