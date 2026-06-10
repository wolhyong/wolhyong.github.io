---
layout: post
title: "C# LINQ 심화 — 쿼리 식, 그룹화, 조인, 집계, 파티션, 변환, 지연 실행 vs 즉시 실행"
description: "C# LINQ의 고급 기능을 실무 레벨에서 학습합니다. 쿼리 식은 SQL과 유사한 from-where-select 문법을 제공하며 복잡한 쿼리를 가독성 있게 작성할 수 있습니다. 그룹화(group by)는 데이터를 키로 그룹화하며 GroupBy 메서드와 group by 절을 사용합니다. 조인(join)은 두 컬렉션을 결합하며 Join, GroupJoin 메서드와 join 절을 사용합니다. 집계(Aggregate)는 Sum, Average, Count, Max, Min 등을 제공하며 Aggregate 메서드로 커스텀 집계를 수행할 수 있습니다. 파티션(Take, Skip, TakeWhile, SkipWhile)은 컬렉션을 분할합니다. 변환(Select, SelectMany)은 데이터를 변환하며 SelectMany는 중첩 컬렉션을 평탄화합니다. LINQ는 지연 실행을 지원하며 ToList, ToArray 등으로 즉시 실행을 강제할 수 있습니다."
date: 2025-08-27 10:00:00 +0900
category: csharp
tags: [csharp, linq, query-syntax, grouping, joining, aggregation, deferred-execution]
level: intermediate
---

C# LINQ의 고급 기능은 복잡한 데이터 처리를 간결하고 가독성 있게 작성할 수 있게 합니다.

> **핵심 정리** · 쿼리 식은 SQL과 유사한 문법을 제공합니다. `GroupBy`로 그룹화하고 `Join`으로 조인을 수행합니다. `Aggregate`로 집계를 수행합니다. `Take`, `Skip`로 파티션을 수행합니다. `SelectMany`로 중첩 컬렉션을 평탄화합니다. 지연 실행으로 성능을 최적화합니다.


## 수업 목표

- 쿼리 식을 이해하고 사용할 수 있습니다.
- 그룹화를 이해합니다.
- 조인을 이해합니다.
- 집계를 이해합니다.
- 파티션을 이해합니다.
- 지연 실행과 즉시 실행을 이해합니다.

## 쿼리 식

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string City { get; set; }
}

class Program
{
    static void Main()
    {
        List<Person> people = new List<Person>
        {
            new Person { Name = "Alice", Age = 30, City = "Seoul" },
            new Person { Name = "Bob", Age = 25, City = "Busan" },
            new Person { Name = "Charlie", Age = 35, City = "Seoul" },
            new Person { Name = "David", Age = 28, City = "Daegu" }
        };

        // 쿼리 식
        var seoulPeople = from p in people
                          where p.City == "Seoul"
                          orderby p.Age descending
                          select p;

        Console.WriteLine("서울 거주 (나이 내림차순):");
        foreach (var person in seoulPeople)
        {
            Console.WriteLine($"{person.Name}, {person.Age}세");
        }

        // 메서드 구문과 동일
        var seoulPeopleMethod = people
            .Where(p => p.City == "Seoul")
            .OrderByDescending(p => p.Age)
            .Select(p => p);
    }
}
```

쿼리 식은 `from`, `where`, `orderby`, `select` 등의 키워드를 사용합니다. SQL과 유사한 문법으로 복잡한 쿼리를 가독성 있게 작성할 수 있습니다. 메서드 구문과 기능적으로 동일합니다.

## 그룹화

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        List<string> words = new List<string>
        {
            "apple", "banana", "cherry", "date", "elderberry", "fig"
        };

        // 메서드 구문
        var groupedByLength = words.GroupBy(w => w.Length);

        Console.WriteLine("길이별 그룹 (메서드 구문):");
        foreach (var group in groupedByLength)
        {
            Console.WriteLine($"길이 {group.Key}: {string.Join(", ", group)}");
        }

        // 쿼리 식
        var groupedByLengthQuery = from w in words
                                   group w by w.Length into g
                                   select new { Length = g.Key, Words = g };

        Console.WriteLine("\n길이별 그룹 (쿼리 식):");
        foreach (var group in groupedByLengthQuery)
        {
            Console.WriteLine($"길이 {group.Length}: {string.Join(", ", group.Words)}");
        }
    }
}
```

`GroupBy`는 데이터를 키로 그룹화합니다. `group by` 절로 쿼리 식에서도 사용할 수 있습니다. 결과는 `IGrouping<TKey, TElement>`로 반환됩니다. `into` 키워드로 그룹을 계속 쿼리할 수 있습니다.

## 조인

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Person
{
    public string Name { get; set; }
    public int DepartmentId { get; set; }
}

class Department
{
    public int Id { get; set; }
    public string Name { get; set; }
}

class Program
{
    static void Main()
    {
        List<Person> people = new List<Person>
        {
            new Person { Name = "Alice", DepartmentId = 1 },
            new Person { Name = "Bob", DepartmentId = 2 },
            new Person { Name = "Charlie", DepartmentId = 1 }
        };

        List<Department> departments = new List<Department>
        {
            new Department { Id = 1, Name = "Engineering" },
            new Department { Id = 2, Name = "Marketing" }
        };

        // Inner Join
        var innerJoin = from p in people
                        join d in departments on p.DepartmentId equals d.Id
                        select new { p.Name, Department = d.Name };

        Console.WriteLine("Inner Join:");
        foreach (var item in innerJoin)
        {
            Console.WriteLine($"{item.Name} - {item.Department}");
        }

        // Left Join (GroupJoin + SelectMany)
        var leftJoin = from p in people
                       join d in departments on p.DepartmentId equals d.Id into pd
                       from d in pd.DefaultIfEmpty()
                       select new { p.Name, Department = d?.Name ?? "없음" };

        Console.WriteLine("\nLeft Join:");
        foreach (var item in leftJoin)
        {
            Console.WriteLine($"{item.Name} - {item.Department}");
        }
    }
}
```

`Join`은 내부 조인을 수행합니다. `join` 절로 쿼리 식에서도 사용할 수 있습니다. `GroupJoin`과 `DefaultIfEmpty`로 왼쪽 조인을 수행할 수 있습니다. `on equals`로 조인 조건을 지정합니다.

## 집계

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // 기본 집계
        int sum = numbers.Sum();
        double average = numbers.Average();
        int count = numbers.Count();
        int max = numbers.Max();
        int min = numbers.Min();

        Console.WriteLine($"합: {sum}");
        Console.WriteLine($"평균: {average}");
        Console.WriteLine($"개수: {count}");
        Console.WriteLine($"최대: {max}");
        Console.WriteLine($"최소: {min}");

        // 커스텀 집계
        string concatenated = numbers.Aggregate(
            seed: "",
            func: (acc, n) => acc + n,
            resultSelector: acc => acc
        );
        Console.WriteLine($"연결: {concatenated}");

        // 그룹별 집계
        var grouped = numbers.GroupBy(n => n % 2);
        foreach (var group in grouped)
        {
            Console.WriteLine($"나머지 {group.Key}: 합={group.Sum()}, 개수={group.Count()}");
        }
    }
}
```

`Sum`, `Average`, `Count`, `Max`, `Min` 등의 집계 메서드를 제공합니다. `Aggregate`로 커스텀 집계를 수행할 수 있습니다. 그룹화 후 집계를 수행할 수 있습니다.

## 파티션

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // Take - 처음 N개
        var firstThree = numbers.Take(3);
        Console.WriteLine($"처음 3개: {string.Join(", ", firstThree)}");

        // Skip - 처음 N개 건너뜀
        var skipThree = numbers.Skip(3);
        Console.WriteLine($"3개 건너뜀: {string.Join(", ", skipThree)}");

        // TakeWhile - 조건이 true인 동안
        var takeWhile = numbers.TakeWhile(n => n < 5);
        Console.WriteLine($"5 미만: {string.Join(", ", takeWhile)}");

        // SkipWhile - 조건이 true인 동안 건너뜀
        var skipWhile = numbers.SkipWhile(n => n < 5);
        Console.WriteLine($"5 이상: {string.Join(", ", skipWhile)}");

        // Chunk - N개씩 분할 (C# 12.0+)
        var chunks = numbers.Chunk(3);
        Console.WriteLine("\n3개씩 분할:");
        foreach (var chunk in chunks)
        {
            Console.WriteLine(string.Join(", ", chunk));
        }
    }
}
```

`Take`는 처음 N개를, `Skip`은 처음 N개를 건너뜁니다. `TakeWhile`, `SkipWhile`은 조건 기반 파티션을 제공합니다. `Chunk`는 컬렉션을 N개씩 분할합니다(C# 12.0+).

## 변환

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        // Select - 변환
        List<int> numbers = new List<int> { 1, 2, 3 };
        var squared = numbers.Select(n => n * n);
        Console.WriteLine($"제곱: {string.Join(", ", squared)}");

        // SelectMany - 중첩 컬렉션 평탄화
        List<List<int>> nested = new List<List<int>>
        {
            new List<int> { 1, 2 },
            new List<int> { 3, 4 },
            new List<int> { 5, 6 }
        };

        var flattened = nested.SelectMany(list => list);
        Console.WriteLine($"평탄화: {string.Join(", ", flattened)}");

        // Zip - 두 컬렉션 결합
        var names = new List<string> { "Alice", "Bob", "Charlie" };
        var ages = new List<int> { 30, 25, 35 };

        var zipped = names.Zip(ages, (name, age) => $"{name}: {age}세");
        Console.WriteLine($"결합: {string.Join(", ", zipped)}");

        // Cast - 타입 변환
        ArrayList arrayList = new ArrayList { 1, 2, 3 };
        var casted = arrayList.Cast<int>();
        Console.WriteLine($"변환: {string.Join(", ", casted)}");

        // OfType - 특정 타입 필터링
        ArrayList mixed = new ArrayList { 1, "hello", 2, "world", 3 };
        var onlyInts = mixed.OfType<int>();
        Console.WriteLine($"정수만: {string.Join(", ", onlyInts)}");
    }
}
```

`Select`는 각 요소를 변환합니다. `SelectMany`는 중첩 컬렉션을 평탄화합니다. `Zip`은 두 컬렉션을 결합합니다. `Cast`는 타입 변환을, `OfType`은 특정 타입 필터링을 제공합니다.

## 지연 실행 vs 즉시 실행

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // 지연 실행
        var query = numbers.Where(n => n > 3);
        Console.WriteLine("쿼리 정의됨");

        numbers.Add(6);  // 쿼리 정의 후 추가
        numbers.Add(7);

        foreach (int n in query)  // 여기서 실행됨
        {
            Console.WriteLine(n);
        }

        // 즉시 실행
        var immediate = numbers.Where(n => n > 3).ToList();
        Console.WriteLine("\n즉시 실행:");

        numbers.Add(8);  // 이미 실행되었으므로 포함되지 않음

        foreach (int n in immediate)
        {
            Console.WriteLine(n);
        }
    }
}
```

LINQ는 지연 실행을 지원합니다. 쿼리는 정의 시점이 아니라 실제로 결과가 필요할 때 실행됩니다. `ToList`, `ToArray`, `Count` 등은 즉시 실행을 강제합니다. 지연 실행은 성능 최적화와 쿼리 조합에 유용합니다.

## 쿼리 합성

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // 쿼리 합성
        var query = numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .OrderBy(n => n)
            .Take(3);

        Console.WriteLine($"짝수 제곱 정렬 상위 3개: {string.Join(", ", query)}");
    }
}
```

쿼리 합성은 여러 LINQ 연산을 체이닝하는 것입니다. 각 연산은 지연 실행되며 최종적으로 최적화된 쿼리가 생성됩니다. 가독성과 성능을 모두 제공합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 쿼리 식과 메서드 구문 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

쿼리 식은 복잡한 쿼리(조인, 그룹화)에 더 가독성이 좋습니다. 메서드 구문은 간단한 쿼리에 더 간결합니다. 기능적으로 동일하며 선호에 따라 선택합니다. 혼합해서 사용할 수도 있습니다.
</details>

<details>
<summary><strong>Q> 지연 실행은 왜 중요한가요?</strong></summary>

지연 실행은 다음 이점이 있습니다: (1) 성능 최적화: 필요할 때만 실행 (2) 쿼리 조합: 여러 쿼리를 하나로 최적화 (3) 무한 시퀀스: 무한 시퀀스를 표현 가능. 즉시 실행이 필요하면 `ToList`를 사용합니다.
</details>

<details>
<summary><strong>Q> SelectMany는 언제 사용해야 하나요?</strong></summary>

`SelectMany`는 중첩 컬렉션을 평탄화할 때 사용합니다. 예: `List<List<int>>`를 `List<int>`로 변환. 관계형 데이터 조인 후 평탄화에도 사용됩니다. `Select`는 1:1 변환, `SelectMany`는 1:N 변환에 사용합니다.
</details>

<details>
<summary><strong>Q> Join과 GroupJoin의 차이는 무엇인가요?</strong></summary>

`Join`은 내부 조인으로 일치하는 요소만 반환합니다. `GroupJoin`은 왼쪽 요소에 해당하는 오른쪽 요소 그룹을 반환합니다. `GroupJoin` + `SelectMany`로 왼쪽 조인을 구현할 수 있습니다. SQL의 INNER JOIN과 LEFT JOIN과 유사합니다.
</details>

<details>
<summary><strong>Q> LINQ 성능을 어떻게 최적화하나요?</strong></summary>

LINQ 최적화 방법: (1) 지연 실행 활용 (2) 쿼리 합성 (3) 인덱스 활용 (4) 필요한 데이터만 선택 (5) 즉시 실행 최소화. 대용량 데이터 처리에 특히 중요합니다. `AsParallel`로 병렬 처리도 고려할 수 있습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **쿼리 식** | from-where-select | SQL 유사 문법 |
| **그룹화** | GroupBy | group by 절 |
| **조인** | Join, GroupJoin | join 절 |
| **집계** | Sum, Average, Count | Aggregate 커스텀 |
| **파티션** | Take, Skip | TakeWhile, SkipWhile |
| **Chunk** | N개씩 분할 | C# 12.0+ |
| **Select** | 1:1 변환 | 프로젝션 |
| **SelectMany** | 1:N 변환 | 평탄화 |
| **Zip** | 두 컬렉션 결합 | 짝 생성 |
| **지연 실행** | 필요 시 실행 | 성능 최적화 |
| **즉시 실행** | ToList, ToArray | 강제 실행 |
| **쿼리 합성** | 체이닝 | 최적화 |


## 다음 수업

다음 글에서는 C# 고급 — 의존성 주입, DI 컨테이너, IoC 컨테이너를 배웁니다.
