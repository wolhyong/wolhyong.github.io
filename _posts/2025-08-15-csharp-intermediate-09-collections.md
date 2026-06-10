---
layout: post
title: "C# 컬렉션 — List, Dictionary, HashSet, Queue, Stack, LINQ, Enumerable, 쿼리 식"
description: "C#의 컬렉션 시스템을 실무 레벨에서 학습합니다. List<T>는 동적 배열로 Add, Remove, Contains 등의 메서드를 제공합니다. Dictionary<TKey, TValue>는 키-값 쌍을 저장하며 해시 테이블로 구현되어 O(1) 평균 조회 시간을 제공합니다. HashSet<T>는 중복 없는 집합으로 Union, Intersect, Except 등의 집합 연산을 제공합니다. Queue<T>는 FIFO(선입선출) 큐로 Enqueue, Dequeue 메서드를 제공합니다. Stack<T>는 LIFO(후입선출) 스택으로 Push, Pop 메서드를 제공합니다. LINQ(Language Integrated Query)는 컬렉션 쿼리를 위한 통합 쿼리 언어로 Where, Select, OrderBy, GroupBy 등의 메서드를 제공합니다. LINQ는 메서드 구문과 쿼리 구문 두 가지 형식을 지원하며 지연 실행을 통해 성능을 최적화합니다."
date: 2025-08-15 10:00:00 +0900
category: csharp
tags: [csharp, collections, linq, list, dictionary, hashset, enumerable, linq-queries]
level: intermediate
---

C#의 컬렉션과 LINQ는 데이터 처리를 위한 강력하고 타입 안전한 도구를 제공합니다.

> **핵심 정리** · `List<T>`는 동적 배열입니다. `Dictionary<TKey, TValue>`는 키-값 쌍을 저장합니다. `HashSet<T>`는 중복 없는 집합입니다. `Queue<T>`는 FIFO 큐입니다. `Stack<T>`는 LIFO 스택입니다. LINQ는 통합 쿼리 언어로 컬렉션을 쿼리합니다. 지연 실행으로 성능을 최적화합니다.


## 수업 목표

- List<T>의 사용법을 이해합니다.
- Dictionary<TKey, TValue>의 사용법을 이해합니다.
- HashSet<T>의 사용법을 이해합니다.
- Queue<T>와 Stack<T>를 이해합니다.
- LINQ 메서드 구문을 이해합니다.
- LINQ 쿼리 구문을 이해합니다.
- 지연 실행을 이해합니다.

## List

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        // List 생성
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // 요소 추가
        numbers.Add(6);
        numbers.AddRange(new[] { 7, 8, 9 });

        // 요소 접근
        Console.WriteLine(numbers[0]);  // 1

        // 요소 제거
        numbers.Remove(5);
        numbers.RemoveAt(0);

        // 포함 여부 확인
        bool contains = numbers.Contains(3);
        Console.WriteLine($"3 포함: {contains}");

        // 검색
        int index = numbers.IndexOf(4);
        Console.WriteLine($"4의 인덱스: {index}");

        // LINQ 쿼리
        var evens = numbers.Where(n => n % 2 == 0);
        Console.WriteLine($"짝수: {string.Join(", ", evens)}");

        // 정렬
        numbers.Sort();
        Console.WriteLine($"정렬: {string.Join(", ", numbers)}");
    }
}
```

`List<T>`는 동적 배열로 크기가 자동으로 조절됩니다. `Add`, `Remove`, `Contains`, `IndexOf` 등의 메서드를 제공합니다. LINQ와 함께 사용하여 강력한 쿼리를 수행할 수 있습니다.

## Dictionary

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        // Dictionary 생성
        Dictionary<string, int> ages = new Dictionary<string, int>
        {
            { "Alice", 30 },
            { "Bob", 25 },
            { "Charlie", 35 }
        };

        // 요소 추가
        ages["David"] = 28;

        // 요소 접근
        Console.WriteLine($"Alice 나이: {ages["Alice"]}");

        // 키 존재 여부 확인
        bool hasKey = ages.ContainsKey("Alice");
        Console.WriteLine($"Alice 존재: {hasKey}");

        // 키와 값 순회
        foreach (var kvp in ages)
        {
            Console.WriteLine($"{kvp.Key}: {kvp.Value}");
        }

        // 키만 순회
        foreach (string name in ages.Keys)
        {
            Console.WriteLine(name);
        }

        // 값만 순회
        foreach (int age in ages.Values)
        {
            Console.WriteLine(age);
        }

        // 요소 제거
        ages.Remove("Bob");
    }
}
```

`Dictionary<TKey, TValue>`는 키-값 쌍을 저장합니다. 해시 테이블로 구현되어 O(1) 평균 조회 시간을 제공합니다. `Add`, `Remove`, `ContainsKey`, `TryGetValue` 등의 메서드를 제공합니다. 키는 중복될 수 없습니다.

## HashSet

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        // HashSet 생성
        HashSet<int> set1 = new HashSet<int> { 1, 2, 3, 4, 5 };
        HashSet<int> set2 = new HashSet<int> { 4, 5, 6, 7, 8 };

        // 요소 추가
        set1.Add(6);

        // 포함 여부 확인
        bool contains = set1.Contains(3);
        Console.WriteLine($"3 포함: {contains}");

        // 합집합 (Union)
        var union = set1.Union(set2);
        Console.WriteLine($"합집합: {string.Join(", ", union)}");

        // 교집합 (Intersect)
        var intersect = set1.Intersect(set2);
        Console.WriteLine($"교집합: {string.Join(", ", intersect)}");

        // 차집합 (Except)
        var except = set1.Except(set2);
        Console.WriteLine($"차집합: {string.Join(", ", except)}");

        // 대칭 차 (SymmetricExceptWith)
        var symmetricExcept = set1.SymmetricExceptWith(set2);
        Console.WriteLine($"대칭 차: {string.Join(", ", symmetricExcept)}");
    }
}
```

`HashSet<T>`는 중복 없는 집합입니다. `Union`, `Intersect`, `Except`, `SymmetricExceptWith` 등의 집합 연산을 제공합니다. 중복을 방지하고 멤버십 테스트에 유용합니다.

## Queue

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        // Queue 생성
        Queue<string> queue = new Queue<string>();

        // Enqueue (입력)
        queue.Enqueue("첫 번째");
        queue.Enqueue("두 번째");
        queue.Enqueue("세 번째");

        // Peek (맨 앞 요소 확인)
        Console.WriteLine($"맨 앞: {queue.Peek()}");

        // Dequeue (출력)
        while (queue.Count > 0)
        {
            string item = queue.Dequeue();
            Console.WriteLine($"처리: {item}");
        }
    }
}
```

`Queue<T>`는 FIFO(First-In-First-Out) 큐입니다. `Enqueue`로 뒤에 추가하고 `Dequeue`로 앞에서 제거합니다. `Peek`로 맨 앞 요소를 확인합니다. 작업 스케줄링, BFS 탐색 등에 사용됩니다.

## Stack

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        // Stack 생성
        Stack<string> stack = new Stack<string>();

        // Push (입력)
        stack.Push("첫 번째");
        stack.Push("두 번째");
        stack.Push("세 번째");

        // Peek (맨 위 요소 확인)
        Console.WriteLine($"맨 위: {stack.Peek()}");

        // Pop (출력)
        while (stack.Count > 0)
        {
            string item = stack.Pop();
            Console.WriteLine($"처리: {item}");
        }
    }
}
```

`Stack<T>`는 LIFO(Last-In-First-Out) 스택입니다. `Push`로 위에 추가하고 `Pop`으로 위에서 제거합니다. `Peek`로 맨 위 요소를 확인합니다. 함수 호출 스택, DFS 탐색 등에 사용됩니다.

## LINQ 메서드 구문

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // Where - 필터링
        var evens = numbers.Where(n => n % 2 == 0);
        Console.WriteLine($"짝수: {string.Join(", ", evens)}");

        // Select - 변환
        var squared = numbers.Select(n => n * n);
        Console.WriteLine($"제곱: {string.Join(", ", squared)}");

        // OrderBy - 정렬
        var sorted = numbers.OrderByDescending(n => n);
        Console.WriteLine($"내림차순: {string.Join(", ", sorted)}");

        // GroupBy - 그룹화
        var grouped = numbers.GroupBy(n => n % 2);
        foreach (var group in grouped)
        {
            Console.WriteLine($"나머지 {group.Key}: {string.Join(", ", group)}");
        }

        // Take - 처음 N개
        var firstThree = numbers.Take(3);
        Console.WriteLine($"처음 3개: {string.Join(", ", firstThree)}");

        // Skip - 처음 N개 건너뜀
        var skipThree = numbers.Skip(3);
        Console.WriteLine($"3개 건너뜀: {string.Join(", ", skipThree)}");

        // First - 첫 번째
        int first = numbers.First();
        Console.WriteLine($"첫 번째: {first}");

        // FirstOrDefault - 첫 번째 또는 기본값
        int firstOrDefault = numbers.FirstOrDefault(n => n > 100);
        Console.WriteLine($"100 초과 첫 번째: {firstOrDefault}");

        // Any - 조건 만족하는지
        bool anyEven = numbers.Any(n => n % 2 == 0);
        Console.WriteLine($"짝수 존재: {anyEven}");

        // All - 모두 조건 만족하는지
        bool allPositive = numbers.All(n => n > 0);
        Console.WriteLine($"모두 양수: {allPositive}");

        // Count - 개수
        int count = numbers.Count(n => n % 2 == 0);
        Console.WriteLine($"짝수 개수: {count}");

        // Sum - 합계
        int sum = numbers.Sum();
        Console.WriteLine($"합계: {sum}");

        // Average - 평균
        double average = numbers.Average();
        Console.WriteLine($"평균: {average}");
    }
}
```

LINQ 메서드 구문은 체이닝을 지원합니다. `Where`, `Select`, `OrderBy`, `GroupBy`, `Take`, `Skip`, `First`, `Any`, `All`, `Count`, `Sum`, `Average` 등의 메서드를 제공합니다. 지연 실행으로 성능을 최적화합니다.

## LINQ 쿼리 구문

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

        // 쿼리 구문
        var seoulPeople = from p in people
                          where p.City == "Seoul"
                          orderby p.Age descending
                          select p;

        Console.WriteLine("서울 거주 (나이 내림차순):");
        foreach (var person in seoulPeople)
        {
            Console.WriteLine($"{person.Name}, {person.Age}세");
        }

        // 그룹화 쿼리
        var groupedByCity = from p in people
                           group p by p.City into g
                           select new { City = g.Key, Count = g.Count() };

        Console.WriteLine("\n도시별 인원:");
        foreach (var group in groupedByCity)
        {
            Console.WriteLine($"{group.City}: {group.Count}명");
        }

        // 조인 쿼리
        var cities = new[] { "Seoul", "Busan", "Daegu" };
        var peopleInCities = from p in people
                              join c in cities on p.City equals c
                              select p;

        Console.WriteLine("\n해당 도시 거주:");
        foreach (var person in peopleInCities)
        {
            Console.WriteLine($"{person.Name} ({person.City})");
        }
    }
}
```

LINQ 쿼리 구문은 SQL과 유사한 구문을 제공합니다. `from`, `where`, `orderby`, `select`, `group by`, `join` 등의 키워드를 사용합니다. 메서드 구문과 쿼리 구문은 기능적으로 동일하며 가독성에 따라 선택할 수 있습니다.

## 지연 실행

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        int[] numbers = { 1, 2, 3, 4, 5 };

        // 지연 실행 - 쿼리는 실제로 필요할 때 실행됨
        var query = numbers.Where(n => n > 3);

        Console.WriteLine("쿼리 정의됨");

        // foreach에서 실제로 실행됨
        foreach (int n in query)
        {
            Console.WriteLine(n);
        }

        // 즉시 실행 - ToList, ToArray 등
        var immediate = numbers.Where(n => n > 3).ToList();
        Console.WriteLine($"즉시 실행: {string.Join(", ", immediate)}");
    }
}
```

LINQ는 지연 실행을 지원합니다. 쿼리를 정의할 때 즉시 실행되지 않으며 실제로 결과가 필요할 때 실행됩니다. `ToList`, `ToArray`, `Count` 등의 메서드는 즉시 실행을 강제합니다. 지연 실행은 성능 최적화와 쿼리 조합에 유용합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> List와 배열 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`List<T>`는 동적 크기가 필요할 때 사용합니다. 크기가 런타임에 변경될 수 있으며 `Add`, `Remove` 등의 메서드를 제공합니다. 배열은 고정 크기가 필요할 때 사용합니다. 더 빠르지만 크기가 고정됩니다. 대부분의 경우 `List<T>`를 사용하는 것이 편리합니다.
</details>

<details>
<summary><strong>Q> Dictionary와 List 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Dictionary<TKey, TValue>`는 키-값 쌍이 필요할 때 사용합니다. 키로 빠르게 값을 조회할 수 있습니다. `List<T>`는 순서가 중요하거나 인덱스로 접근할 때 사용합니다. 키 조회가 필요하면 `Dictionary`, 순서가 필요하면 `List`를 사용합니다.
</details>

<details>
<summary><strong>Q> LINQ 메서드 구문과 쿼리 구문 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

메서드 구문은 체이닝에 적합하며 간단한 쿼리에 좋습니다. 쿼리 구문은 복잡한 쿼리(조인, 그룹화)에 더 가독성이 좋습니다. 기능적으로 동일하며 선호에 따라 선택합니다. 혼합해서 사용할 수도 있습니다.
</details>

<details>
<summary><strong>Q> 지연 실행은 왜 중요한가요?</strong></summary>

지연 실행은 다음 이점이 있습니다: (1) 성능 최적화: 필요할 때만 실행 (2) 쿼리 조합: 여러 쿼리를 하나로 최적화 (3) 무한 시퀀스: 무한 시퀀스를 표현 가능. 즉시 실행이 필요하면 `ToList`, `ToArray`를 사용합니다.
</details>

<details>
<summary><strong>Q> HashSet과 List 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`HashSet<T>`는 중복을 방지하고 멤버십 테스트가 필요할 때 사용합니다. `List<T>`는 순서가 중요하거나 중복을 허용할 때 사용합니다. 중복을 방지하려면 `HashSet`, 순서를 유지하려면 `List`를 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **List<T>** | 동적 배열 | Add, Remove, LINQ |
| **Dictionary<K,V>** | 키-값 쌍 | O(1) 조회 |
| **HashSet<T>** | 중복 없는 집합 | Union, Intersect |
| **Queue<T>** | FIFO 큐 | Enqueue, Dequeue |
| **Stack<T>** | LIFO 스택 | Push, Pop |
| **LINQ** | 통합 쿼리 언어 | 메서드/쿼리 구문 |
| **Where** | 필터링 | 조건 만족 |
| **Select** | 변환 | 프로젝션 |
| **OrderBy** | 정렬 | 순서 변경 |
| **GroupBy** | 그룹화 | 집계 |
| **지연 실행** | 필요 시 실행 | 성능 최적화 |


## 다음 수업

다음 글에서는 C# 중급 — 예외 처리, try-catch-finally, 사용자 정의 예외, throw, 예외 필터를 배웁니다.
