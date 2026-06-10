---
layout: post
title: "C# 비동기 프로그래밍 — async/await, Task, Task<T>, CancellationToken, 비동기 스트림"
description: "C#의 비동기 프로그래밍 시스템을 시스템 레벨에서 학습합니다. async/await 문법은 비동기 코드를 동기 코드처럼 작성할 수 있게 하는 구문 설탕입니다. Task와 Task<T>는 비동기 작업을 나타내며 await로 완료를 기다립니다. CancellationToken은 비동기 작업 취소를 지원하며 CancellationTokenSource로 생성합니다. 비동기 스트림(IAsyncEnumerable)은 비동기 데이터 스트림을 제공하며 await foreach로 순회합니다. ConfigureAwait로 컨텍스트 캡처를 제어할 수 있습니다. C#의 비동기 모델은 상태 머신으로 컴파일되며 블로킹 없이 I/O 바운드 작업을 효율적으로 처리합니다."
date: 2025-08-20 10:00:00 +0900
category: csharp
tags: [csharp, async, await, task, cancellation-token, async-streams, iasyncenumerable]
level: intermediate
---

C#의 비동기 프로그래밍은 I/O 바운드 작업을 효율적으로 처리하며 블로킹 없는 코드를 작성할 수 있게 합니다.

> **핵심 정리** · `async/await`는 비동기 코드를 동기 코드처럼 작성하게 합니다. `Task`와 `Task<T>`는 비동기 작업을 나타냅니다. `CancellationToken`으로 작업 취소를 지원합니다. `IAsyncEnumerable`로 비동기 스트림을 제공합니다. 상태 머신으로 컴파일됩니다.


## 수업 목표

- async/await 문법을 이해합니다.
- Task와 Task<T>를 이해합니다.
- CancellationToken을 사용할 수 있습니다.
- 비동기 스트림을 이해합니다.
- ConfigureAwait를 이해합니다.
- 비동기 모델의 내부 동작을 이해합니다.

## async/await 기본

```csharp
using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        Console.WriteLine("시작");
        
        await DoWorkAsync();
        
        Console.WriteLine("완료");
    }

    static async Task DoWorkAsync()
    {
        Console.WriteLine("작업 시작");
        await Task.Delay(1000);  // 1초 대기
        Console.WriteLine("작업 완료");
    }
}
```

`async` 키워드는 메서드를 비동기로 표시합니다. `await`는 비동기 작업이 완료될 때까지 기다립니다. 비동기 메서드는 `Task` 또는 `Task<T>`를 반환해야 합니다. `Task.Delay`로 비동기 대기를 수행합니다.

## Task와 Task<T>

```csharp
using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        // Task 반환
        await Task.Run(() => Console.WriteLine("작업 1"));

        // Task<T> 반환
        int result = await Task.Run(() => Calculate(10, 20));
        Console.WriteLine($"결과: {result}");

        // 여러 작업 병렬 실행
        Task task1 = Task.Run(() => Console.WriteLine("작업 2"));
        Task task2 = Task.Run(() => Console.WriteLine("작업 3"));
        
        await Task.WhenAll(task1, task2);
        Console.WriteLine("모든 작업 완료");

        // 첫 번째 완료 대기
        Task firstCompleted = await Task.WhenAny(task1, task2);
        Console.WriteLine("첫 작업 완료");
    }

    static int Calculate(int a, int b)
    {
        return a + b;
    }
}
```

`Task`는 값을 반환하지 않는 비동기 작업입니다. `Task<T>`는 값을 반환하는 비동기 작업입니다. `Task.Run`으로 스레드 풀에서 작업을 실행합니다. `Task.WhenAll`로 모든 작업을, `Task.WhenAny`로 첫 번째 완료를 기다립니다.

## CancellationToken

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var cts = new CancellationTokenSource();
        CancellationToken token = cts.Token;

        // 2초 후 취소
        cts.CancelAfter(2000);

        try
        {
            await LongRunningOperation(token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("작업이 취소되었습니다.");
        }
    }

    static async Task LongRunningOperation(CancellationToken token)
    {
        for (int i = 0; i < 10; i++)
        {
            token.ThrowIfCancellationRequested();
            Console.WriteLine($"작업 {i + 1}/10");
            await Task.Delay(1000, token);
        }
    }
}
```

`CancellationToken`은 비동기 작업 취소를 지원합니다. `CancellationTokenSource`로 토큰을 생성합니다. `Cancel()`로 작업을 취소합니다. `ThrowIfCancellationRequested()`로 취소 요청을 확인합니다. `Task.Delay`에 토큰을 전달하여 취소 가능한 대기를 수행합니다.

## 비동기 스트림 (C# 8.0+)

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        Console.WriteLine("비동기 스트림 시작");

        await foreach (int number in GenerateNumbersAsync())
        {
            Console.WriteLine($"받음: {number}");
        }

        Console.WriteLine("완료");
    }

    static async IAsyncEnumerable<int> GenerateNumbersAsync()
    {
        for (int i = 1; i <= 5; i++)
        {
            await Task.Delay(500);
            yield return i;
        }
    }
}
```

`IAsyncEnumerable<T>`는 비동기 스트림을 나타냅니다. `yield return`으로 값을 비동기적으로 생성합니다. `await foreach`로 비동기 스트림을 순회합니다. 대규모 데이터나 무한 스트림에 유용합니다.

## ConfigureAwait

```csharp
using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        Console.WriteLine($"메인 스레드: {Thread.CurrentThread.ManagedThreadId}");

        await DoWorkAsync();

        Console.WriteLine($"완료 스레드: {Thread.CurrentThread.ManagedThreadId}");
    }

    static async Task DoWorkAsync()
    {
        Console.WriteLine($"작업 시작 스레드: {Thread.CurrentThread.ManagedThreadId}");
        
        // ConfigureAwait(false)로 컨텍스트 캡처 방지
        await Task.Delay(1000).ConfigureAwait(false);
        
        Console.WriteLine($"작업 완료 스레드: {Thread.CurrentThread.ManagedThreadId}");
    }
}
```

`ConfigureAwait(false)`는 컨텍스트 캡처를 방지합니다. 기본적으로 `await`는 동기화 컨텍스트를 캡처하여 원래 스레드로 돌아갑니다. `ConfigureAwait(false)`는 스레드 풀 스레드에서 계속 실행합니다. 라이브러리 코드에서 사용하여 성능을 향상합니다.

## 비동기 메서드 모범 사례

```csharp
using System;
using System.IO;
using System.Threading.Tasks;

class FileProcessor
{
    // 비동기 메서드는 Async 접미사 사용
    public static async Task<string> ReadFileAsync(string path)
    {
        using var reader = new StreamReader(path);
        return await reader.ReadToEndAsync();
    }

    // 취소 토큰 지원
    public static async Task ProcessFileAsync(string path, CancellationToken token)
    {
        string content = await ReadFileAsync(path);
        
        token.ThrowIfCancellationRequested();
        
        // 처리 로직
        await Task.Run(() => ProcessContent(content), token);
    }

    private static void ProcessContent(string content)
    {
        Console.WriteLine($"처리: {content.Length} 문자");
    }
}
```

비동기 메서드는 `Async` 접미사를 사용하는 것이 관례입니다. 취소 토큰을 지원하여 작업 취소를 허용합니다. `using` 문으로 리소스를 정리합니다. 비동기 체이닝을 통해 전체 파이프라인을 비동기로 유지합니다.

## 예외 처리

```csharp
using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        try
        {
            await DoWorkAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"오류: {ex.Message}");
        }
    }

    static async Task DoWorkAsync()
    {
        await Task.Delay(100);
        throw new Exception("비동기 오류");
    }
}
```

비동기 메서드의 예외는 `await` 시 전파됩니다. `try-catch`로 예외를 포착할 수 있습니다. 예외는 `Task`의 상태에 저장되며 `await` 시 다시 throw됩니다.

## Task.WhenAll과 Task.WhenAny

```csharp
using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        // WhenAll - 모든 작업 완료 대기
        Task<int> task1 = Task.Run(() => Calculate(10, 20));
        Task<int> task2 = Task.Run(() => Calculate(30, 40));
        Task<int> task3 = Task.Run(() => Calculate(50, 60));

        int[] results = await Task.WhenAll(task1, task2, task3);
        Console.WriteLine($"합계: {string.Join(", ", results)}");

        // WhenAny - 첫 번째 완료 대기
        Task<int> firstTask = await Task.WhenAny(task1, task2, task3);
        Console.WriteLine($"첫 번째 결과: {firstTask.Result}");
    }

    static int Calculate(int a, int b)
    {
        return a + b;
    }
}
```

`Task.WhenAll`은 모든 작업이 완료될 때까지 기다립니다. `Task.WhenAny`는 첫 번째 작업이 완료될 때까지 기다립니다. 병렬 작업에 유용합니다. `WhenAll`은 모든 결과를 배열로 반환합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> async/await는 언제 사용해야 하나요?</strong></summary>

`async/await`는 I/O 바운드 작업에 사용합니다: 파일 I/O, 네트워크 요청, 데이터베이스 쿼리. CPU 바운드 작업에는 `Task.Run`을 사용하여 스레드 풀에서 실행해야 합니다. UI 스레드를 블로킹하지 않기 위해 사용합니다.
</details>

<details>
<summary><strong>Q> Task와 Thread 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Task`를 사용해야 합니다. `Task`는 스레드 풀을 사용하여 효율적이며 `async/await`와 통합됩니다. `Thread`는 저수준 스레드 제어가 필요할 때만 사용합니다. 대부분의 경우 `Task`가 더 좋은 선택입니다.
</details>

<details>
<summary><strong>Q> CancellationToken은 왜 필요한가요?</strong></summary>

`CancellationToken`은 비동기 작업 취소를 지원합니다. 사용자 취소 요청, 타임아웃, 애플리케이션 종료 등에 사용됩니다. 취소 가능한 작업을 구현하여 리소스를 효율적으로 관리합니다. 협력적 취소 모델을 따릅니다.
</details>

<details>
<summary><strong>Q> ConfigureAwait(false)는 언제 사용해야 하나요?</strong></summary>

`ConfigureAwait(false)`는 라이브러리 코드에서 사용합니다. 컨텍스트 캡처를 방지하여 성능을 향상합니다. UI 애플리케이션에서는 기본 동작을 유지해야 합니다. 데드락 방지에도 사용됩니다.
</details>

<details>
<summary><strong>Q> 비동기 메서드는 어떻게 컴파일되나요?</strong></summary>

비동기 메서드는 상태 머신으로 컴파일됩니다. 컴파일러는 `async` 메서드를 상태 머신 클래스로 변환합니다. `await` 지점에서 상태를 저장하고 재개합니다. IL 레벨에서 복잡한 상태 머신으로 구현됩니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **async** | 비동기 메서드 표시 | Task/Task<T> 반환 |
| **await** | 비동기 작업 대기 | 비동기 지점 |
| **Task** | 값 없는 비동기 작업 | void 대응 |
| **Task<T>** | 값 있는 비동기 작업 | 결과 반환 |
| **Task.Run** | 스레드 풀 실행 | CPU 바운드 작업 |
| **CancellationToken** | 작업 취소 | 협력적 취소 |
| **IAsyncEnumerable** | 비동기 스트림 | await foreach |
| **ConfigureAwait** | 컨텍스트 제어 | false로 캡처 방지 |
| **WhenAll** | 모든 작업 대기 | 병렬 실행 |
| **WhenAny** | 첫 작업 대기 | 경쟁 조건 |
| **상태 머신** | 컴파일 변환 | await 지점 저장 |


## 다음 수업

다음 글에서는 C# 중급 — 파일 I/O, Stream, StreamReader/Writer, 직렬화를 배웁니다.
