---
layout: post
title: "C# 성능 최적화 — 프로파일러, 메모리 최적화, Span<T>, Memory<T>, 배열 풀링, 비동기 최적화"
description: "C#의 성능 최적화 기법을 시스템 레벨에서 학습합니다. 프로파일러는 Visual Studio Profiler, dotnet-trace로 병목 지점을 식별합니다. 메모리 최적화는 박싱/언박싱 방지, 구조체 사용, ArrayPool<T>로 메모리 할당을 줄입니다. Span<T>와 Memory<T>는 안전한 메모리 슬라이스를 제공하며 unsafe 코드 없이 메모리를 조작할 수 있습니다. 배열 풀링은 ArrayPool<T>, MemoryPool<T>로 배열 재사용을 제공합니다. 비동기 최적화는 ConfigureAwait(false), ValueTask로 비동기 오버헤드를 줄입니다. JIT 컴파일러 최적화와 NGEN(Ahead-of-Time) 컴파일로 시작 시간을 개선합니다."
date: 2025-09-08 10:00:00 +0900
category: csharp
tags: [csharp, performance, profiling, memory-optimization, span, memory-pooling, async-optimization]
level: advanced
---

C#의 성능 최적화는 프로파일링, 메모리 관리, 비동기 최적화 등 다양한 기법을 포함합니다.

> **핵심 정리** · 프로파일러로 병목 지점을 식별합니다. 박싱/언박싱을 방지하고 구조체를 사용합니다. `Span<T>`와 `Memory<T>`로 안전한 메모리 슬라이스를 제공합니다. `ArrayPool<T>`로 배열 재사용을 제공합니다. `ConfigureAwait(false)`와 `ValueTask`로 비동기 오버헤드를 줄입니다.


## 수업 목표

- 프로파일러를 사용할 수 있습니다.
- 메모리 최적화 기법을 이해합니다.
- Span<T>와 Memory<T>를 이해합니다.
- 배열 풀링을 이해합니다.
- 비동기 최적화를 이해합니다.
- JIT 최적화를 이해합니다.

## 프로파일러

```bash
# dotnet-trace 설치
dotnet tool install -g dotnet-trace

# 프로파일링 실행
dotnet-trace collect --process-id <PID> --output trace.netperftrace

# Visual Studio Profiler
# Debug > Performance Profiler
```

프로파일러는 병목 지점을 식별합니다. `dotnet-trace`는 CLI 도구로 CPU, 메모리, GC 이벤트를 추적합니다. Visual Studio Profiler는 GUI로 더 편리한 분석을 제공합니다.

## 메모리 최적화

```csharp
// 박싱 방지
public int Sum(int[] numbers)
{
    int sum = 0;
    foreach (int number in numbers)  // 박싱 없음
    {
        sum += number;
    }
    return sum;
}

// 구조체 사용
public struct Point
{
    public int X;
    public int Y;
}

// 클래스 대신 구조체
public struct SmallStruct
{
    public int Value;
}

// 클래스는 큰 데이터에
public class LargeClass
{
    public byte[] Data;
}
```

박싱/언박싱을 방지하여 성능을 향상합니다. 작은 데이터는 구조체를 사용하고 큰 데이터는 클래스를 사용합니다. 구조체는 스택에 할당되며 복사 비용이 적습니다.

## Span<T>

```csharp
using System;

class Program
{
    static void Main()
    {
        string text = "Hello, World!";

        // Span<char>로 슬라이스
        Span<char> span = text.AsSpan();
        Span<char> hello = span.Slice(0, 5);

        Console.WriteLine(new string(hello));  // Hello

        // Span으로 안전한 수정
        Span<char> mutable = text.ToCharArray().AsSpan();
        mutable[0] = 'h';

        Console.WriteLine(new string(mutable));  // hello
    }
}
```

`Span<T>`는 안전한 메모리 슬라이스를 제공합니다. unsafe 코드 없이 메모리를 조작할 수 있습니다. 스택 할당을 지원하며 GC 압력을 줄입니다. `AsSpan()`, `Slice()`로 슬라이스를 생성합니다.

## Memory<T>

```csharp
using System;
using System.Threading.Tasks;

class Program
{
    static async Task ProcessAsync()
    {
        string text = "Hello, World!";

        // Memory<char>는 비동기에 적합
        Memory<char> memory = text.AsMemory();
        Memory<char> hello = memory.Slice(0, 5);

        await Task.Delay(100);

        Console.WriteLine(new string(hello.Span));  // Hello
    }
}
```

`Memory<T>`는 비동기 작업에 적합한 메모리 슬라이스입니다. `Span<T>`는 스택에 할당되어 비동기에 사용할 수 없습니다. `Memory<T>`는 힙에 할당되어 비동기에 사용할 수 있습니다. `Span` 속성으로 `Span<T>`로 변환할 수 있습니다.

## ArrayPool<T>

```csharp
using System;
using System.Buffers;

class Program
{
    static void ProcessArray()
    {
        // 배열 풀에서 대여
        int[] array = ArrayPool<int>.Shared.Rent(1000);

        try
        {
            // 배열 사용
            for (int i = 0; i < array.Length; i++)
            {
                array[i] = i;
            }
        }
        finally
        {
            // 배열 반환
            ArrayPool<int>.Shared.Return(array);
        }
    }
}
```

`ArrayPool<T>`는 배열 재사용을 제공합니다. `Rent`로 배열을 대여하고 `Return`으로 반환합니다. GC 압력을 줄이며 대용량 배열 처리에 유용합니다. `Shared`는 전역 풀입니다.

## 비동기 최적화

```csharp
// ConfigureAwait(false)
public async Task ProcessAsync()
{
    await Task.Delay(100).ConfigureAwait(false);  // 컨텍스트 캡처 방지
}

// ValueTask
public async ValueTask<int> GetValueAsync()
{
    await Task.Delay(100);
    return 42;
}

// 동기 완료 최적화
public ValueTask<int> GetValueOptimized()
{
    // 동기 완료 시 Task 오버헤드 방지
    return new ValueTask<int>(42);
}
```

`ConfigureAwait(false)`는 컨텍스트 캡처를 방지하여 성능을 향상합니다. `ValueTask<T>`는 동기 완료 시 Task 오버헤드를 방지합니다. 라이브러리 코드에서 사용하는 것이 좋습니다.

## JIT 최적화

```csharp
// 인라이닝
[MethodImpl(MethodImplOptions.AggressiveInlining)]
public int Add(int a, int b)
{
    return a + b;
}

// 인라이닝 방지
[MethodImpl(MethodImplOptions.NoInlining)]
public void Log(string message)
{
    Console.WriteLine(message);
}
```

`MethodImpl` 특성으로 JIT 최적화를 제어합니다. `AggressiveInlining`은 인라이닝을 강제합니다. `NoInlining`은 인라이닝을 방지합니다. 핫 경로에서 인라이닝을 고려합니다.

## NGEN (Ahead-of-Time)

```bash
# NGEN 설치
# Visual Studio Developer Command Prompt

# 어셈블리 NGEN
ngen install MyAssembly.dll

# NGEN 제거
ngen uninstall MyAssembly.dll
```

NGEN은 Ahead-of-Time 컴파일을 제공합니다. JIT 컴파일 오버헤드를 방지하여 시작 시간을 개선합니다. 데스크톱 애플리케이션에 유용합니다. .NET Core/Rust는 CrossGen2를 사용합니다.

## 문자열 최적화

```csharp
using System;
using System.Text;

class Program
{
    static void Main()
    {
        // StringBuilder 사용
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 1000; i++)
        {
            sb.Append(i);
        }
        string result = sb.ToString();

        // string interpolation
        string name = "Wolhyong";
        int age = 30;
        string message = $"Name: {name}, Age: {age}";

        // string.Create (C# 10.0+)
        string created = string.Create(10, (span) =>
        {
            span[0] = 'H';
            span[1] = 'e';
            span[2] = 'l';
            span[3] = 'l';
            span[4] = 'o';
        });
    }
}
```

`StringBuilder`는 문자열 연결을 최적화합니다. 문자열 보간(`$""`)은 컴파일러 최적화를 제공합니다. `string.Create`로 효율적인 문자열 생성이 가능합니다(C# 10.0+).

## 컬렉션 최적화

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        // 용량 지정
        var list = new List<int>(1000);  // 재할당 방지

        // Dictionary 용량 지정
        var dict = new Dictionary<string, int>(1000);

        // HashSet 용량 지정
        var set = new HashSet<int>(1000);

        // Span으로 컬렉션 순회
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
        Span<int> span = CollectionsMarshal.AsSpan(numbers);
        foreach (int n in span)
        {
            Console.WriteLine(n);
        }
    }
}
```

컬렉션 용량을 지정하여 재할당을 방지합니다. `CollectionsMarshal.AsSpan`으로 컬렉션을 `Span<T>`로 변환합니다. 대용량 컬렉션에 유용합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> Span<T>는 언제 사용해야 하나요?</strong></summary>

`Span<T>`는 메모리 슬라이스가 필요할 때 사용합니다. 문자열 파싱, 버퍼 처리, 고성능 알고리즘에 유용합니다. 스택 할당을 지원하며 GC 압력을 줄입니다. 비동기에는 사용할 수 없습니다.
</details>

<details>
<summary><strong>Q> ArrayPool<T>는 언제 사용해야 하나요?</strong></summary>

`ArrayPool<T>`는 대용량 배열을 자주 생성/해제할 때 사용합니다. 이미지 처리, 버퍼링, 임시 배열에 유용합니다. GC 압력을 줄이며 성능을 향상합니다. 반드시 `Return`으로 반환해야 합니다.
</details>

<details>
<summary><strong>Q> ConfigureAwait(false)는 언제 사용해야 하나요?</strong></summary>

`ConfigureAwait(false)`는 라이브러리 코드에서 사용합니다. 컨텍스트 캡처를 방지하여 성능을 향상합니다. UI 애플리케이션에서는 기본 동작을 유지해야 합니다. 데드락 방지에도 사용됩니다.
</details>

<details>
<summary><strong>Q> ValueTask는 언제 사용해야 하나요?</strong></summary>

`ValueTask<T>`는 동기 완료 가능성이 높을 때 사용합니다. 캐시된 결과, 빠른 연산에 유용합니다. 항상 비동기인 작업에는 `Task<T>`를 사용합니다. 라이브러리 코드에서 고려해야 합니다.
</details>

<details>
<summary><strong>Q> NGEN은 언제 사용해야 하나요?</strong></summary>

NGEN은 시작 시간이 중요한 데스크톱 애플리케이션에 사용합니다. JIT 컴파일 오버헤드를 방지합니다. 서버 애플리케이션에는 덜 중요합니다. .NET Core/Rust는 CrossGen2를 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **프로파일러** | 병목 식별 | dotnet-trace |
| **박싱 방지** | 값 타입 사용 | 성능 향상 |
| **구조체** | 스택 할당 | 작은 데이터 |
| **Span<T>** | 메모리 슬라이스 | 스택 할당 |
| **Memory<T>** | 비동기 슬라이스 | 힙 할당 |
| **ArrayPool<T>** | 배열 재사용 | Rent/Return |
| **ConfigureAwait(false)** | 컨텍스트 방지 | 라이브러리 |
| **ValueTask** | 동기 완료 최적화 | Task 오버헤드 방지 |
| **MethodImpl** | JIT 최적화 제어 | 인라이닝 |
| **NGEN** | AOT 컴파일 | 시작 시간 개선 |
| **StringBuilder** | 문자열 연결 최적화 | 재할당 방지 |
| **CollectionsMarshal** | 컬렉션 Span 변환 | AsSpan |


## 다음 수업

다음 글에서는 C# 고급 — 보안, 암호화, 인증, 권한 부여, HTTPS를 배웁니다.
