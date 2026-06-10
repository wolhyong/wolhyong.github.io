---
layout: post
title: "C# 예외 처리 — try-catch-finally, 사용자 정의 예외, throw, 예외 필터, using 문"
description: "C#의 예외 처리 시스템을 실무 레벨에서 학습합니다. try-catch-finally로 예외를 포착하고 처리하며 catch 블록에서 특정 예외 타입을 지정할 수 있습니다. finally 블록은 예외 발생 여부와 상관없이 실행되며 리소스 정리에 사용됩니다. throw 키워드로 예외를 발생시키며 throw new Exception(message) 형식을 사용합니다. 사용자 정의 예외는 Exception 클래스를 상속하여 정의하며 커스텀 에러 정보를 제공합니다. 예외 필터(when 절)은 C# 6.0부터 지원되며 catch 블록의 조건을 추가할 수 있습니다. using 문은 IDisposable을 구현한 객체의 자동 리소스 해제를 제공합니다. C#의 예외 처리는 구조화되어 있으며 예외 전파와 스택 트레이스를 제공합니다."
date: 2025-08-18 10:00:00 +0900
category: csharp
tags: [csharp, exceptions, try-catch, custom-exceptions, exception-filters, using, idisposable]
level: intermediate
---

C#의 예외 처리는 구조화된 에러 관리를 제공하며 리소스 정리와 에러 복구를 지원합니다.

> **핵심 정리** · `try-catch-finally`로 예외를 포착하고 처리합니다. `throw`로 예외를 발생시킵니다. 사용자 정의 예외는 `Exception`을 상속하여 정의합니다. 예외 필터(`when`)로 조건부 catch를 지원합니다. `using` 문으로 자동 리소스 해제를 제공합니다.


## 수업 목표

- try-catch-finally를 사용할 수 있습니다.
- 사용자 정의 예외를 정의할 수 있습니다.
- throw로 예외를 발생시킬 수 있습니다.
- 예외 필터를 이해합니다.
- using 문을 이해합니다.
- 예외 전파와 스택 트레이스를 이해합니다.

## try-catch-finally

```csharp
using System;

class Program
{
    static void Main()
    {
        try
        {
            int[] numbers = { 1, 2, 3 };
            Console.WriteLine(numbers[10]);  // IndexOutOfRangeException
        }
        catch (IndexOutOfRangeException ex)
        {
            Console.WriteLine($"인덱스 오류: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"일반 오류: {ex.Message}");
        }
        finally
        {
            Console.WriteLine("정리 작업");
        }
    }
}
```

`try` 블록은 예외가 발생할 수 있는 코드를 포함합니다. `catch` 블록은 특정 예외 타입을 포착합니다. `finally` 블록은 예외 발생 여부와 상관없이 실행됩니다. 리소스 정리에 사용됩니다.

## throw

```csharp
using System;

class Program
{
    static void Divide(int a, int b)
    {
        if (b == 0)
        {
            throw new DivideByZeroException("0으로 나눌 수 없습니다.");
        }
        Console.WriteLine($"결과: {a / b}");
    }

    static void Main()
    {
        try
        {
            Divide(10, 0);
        }
        catch (DivideByZeroException ex)
        {
            Console.WriteLine($"오류: {ex.Message}");
        }
    }
}
```

`throw` 키워드로 예외를 발생시킵니다. `throw new Exception(message)` 형식을 사용합니다. 조건 검사 후 예외를 발생시켜 에러를 명확히 합니다.

## 사용자 정의 예외

```csharp
using System;

class InvalidAgeException : Exception
{
    public InvalidAgeException() : base("나이가 유효하지 않습니다.")
    {
    }

    public InvalidAgeException(string message) : base(message)
    {
    }

    public InvalidAgeException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public Person(string name, int age)
    {
        if (age < 0 || age > 150)
        {
            throw new InvalidAgeException($"나이는 0~150 사이여야 합니다: {age}");
        }
        Name = name;
        Age = age;
    }
}

class Program
{
    static void Main()
    {
        try
        {
            Person person = new Person("Wolhyong", 200);
        }
        catch (InvalidAgeException ex)
        {
            Console.WriteLine($"오류: {ex.Message}");
        }
    }
}
```

사용자 정의 예외는 `Exception` 클래스를 상속하여 정의합니다. 커스텀 에러 정보를 제공하며 도메인 특정 예외를 정의할 수 있습니다. 여러 생성자를 제공하여 유연성을 높입니다.

## 예외 필터 (C# 6.0+)

```csharp
using System;

class Program
{
    static void Process(string input)
    {
        try
        {
            if (string.IsNullOrEmpty(input))
            {
                throw new ArgumentNullException(nameof(input));
            }

            int number = int.Parse(input);
            Console.WriteLine($"숫자: {number}");
        }
        catch (FormatException ex) when (input.Length > 10)
        {
            Console.WriteLine($"긴 문자열 파싱 실패: {ex.Message}");
        }
        catch (FormatException ex)
        {
            Console.WriteLine($"일반 파싱 실패: {ex.Message}");
        }
    }

    static void Main()
    {
        Process("12345678901");  // 긴 문자열 파싱 실패
        Process("abc");           // 일반 파싱 실패
    }
}
```

예외 필터(`when`)은 catch 블록의 조건을 추가합니다. `catch (ExceptionType ex) when (condition)` 형식입니다. 조건이 `true`일 때만 catch 블록이 실행됩니다. 더 세밀한 예외 처리가 가능합니다.

## using 문

```csharp
using System;
using System.IO;

class Program
{
    static void ReadFile(string path)
    {
        using (StreamReader reader = new StreamReader(path))
        {
            string content = reader.ReadToEnd();
            Console.WriteLine(content);
        }  // using 범위 종료 시 자동 Dispose 호출
    }

    static void Main()
    {
        try
        {
            ReadFile("example.txt");
        }
        catch (FileNotFoundException ex)
        {
            Console.WriteLine($"파일을 찾을 수 없음: {ex.Message}");
        }
    }
}
```

`using` 문은 `IDisposable`을 구현한 객체의 자동 리소스 해제를 제공합니다. `using (var resource = new Resource())` 형식입니다. 범위 종료 시 `Dispose()`가 자동으로 호출됩니다. 파일, 데이터베이스 연결 등에 사용됩니다.

## using 선언 (C# 8.0+)

```csharp
using System;
using System.IO;

class Program
{
    static void ReadFile(string path)
    {
        using var reader = new StreamReader(path);
        string content = reader.ReadToEnd();
        Console.WriteLine(content);
        // reader는 메서드 끝에서 자동 Dispose
    }

    static void Main()
    {
        try
        {
            ReadFile("example.txt");
        }
        catch (FileNotFoundException ex)
        {
            Console.WriteLine($"파일을 찾을 수 없음: {ex.Message}");
        }
    }
}
```

`using` 선언은 C# 8.0부터 지원됩니다. `using var resource = new Resource()` 형식입니다. 선언된 범위 끝에서 자동으로 `Dispose()`가 호출됩니다. 더 간결한 코드를 작성할 수 있습니다.

## 예외 전파

```csharp
using System;

class Program
{
    static void Level3()
    {
        throw new Exception("Level 3 오류");
    }

    static void Level2()
    {
        try
        {
            Level3();
        }
        catch (Exception ex)
        {
            throw new Exception("Level 2 오류", ex);  // 내부 예외 포함
        }
    }

    static void Level1()
    {
        try
        {
            Level2();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"예외: {ex.Message}");
            Console.WriteLine($"내부 예외: {ex.InnerException?.Message}");
            Console.WriteLine($"스택 트레이스:\n{ex.StackTrace}");
        }
    }

    static void Main()
    {
        Level1();
    }
}
```

예외는 호출 스택을 따라 전파됩니다. `throw new Exception(message, innerException)`으로 내부 예외를 포함할 수 있습니다. `StackTrace`로 호출 스택을 확인할 수 있습니다. 예외 전파는 에러 추적에 유용합니다.

## 예외 다시 throw

```csharp
using System;

class Program
{
    static void Process()
    {
        try
        {
            throw new Exception("오류 발생");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"로깅: {ex.Message}");
            throw;  // 예외 다시 throw (스택 트레이스 보존)
        }
    }

    static void Main()
    {
        try
        {
            Process();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"최종 처리: {ex.Message}");
        }
    }
}
```

`throw`만 사용하여 예외를 다시 throw할 수 있습니다. 스택 트레이스가 보존되어 원래 발생 위치를 추적할 수 있습니다. 로깅 후 예외를 다시 throw할 때 사용됩니다.

## ArgumentNullException

```csharp
using System;

class Utility
{
    public static void Process(string input)
    {
        if (input == null)
        {
            throw new ArgumentNullException(nameof(input));
        }

        if (string.IsNullOrWhiteSpace(input))
        {
            throw new ArgumentException("입력은 비어있을 수 없습니다.", nameof(input));
        }

        Console.WriteLine($"처리: {input}");
    }
}

class Program
{
    static void Main()
    {
        try
        {
            Utility.Process(null);
        }
        catch (ArgumentNullException ex)
        {
            Console.WriteLine($"null 인자: {ex.ParamName}");
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"잘못된 인자: {ex.ParamName} - {ex.Message}");
        }
    }
}
```

`ArgumentNullException`은 null 인자를 검사할 때 사용합니다. `nameof(input)`으로 매개변수 이름을 자동으로 가져옵니다. `ArgumentException`은 일반적인 인자 유효성 검사에 사용됩니다. 표준 예외를 사용하여 일관성을 유지합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 예외 처리는 언제 사용해야 하나요?</strong></summary>

예외 처리는 복구 가능한 에러에 사용합니다. 파일 없음, 네트워크 오류, 잘못된 입력 등. 프로그램 로직의 정상적인 흐름이 아닌 예외적인 상황에 사용합니다. 제어 흐름으로 예외를 사용해서는 안 됩니다.
</details>

<details>
<summary><strong>Q> finally는 언제 사용해야 하나요?</strong></summary>

`finally`는 리소스 정리가 필요할 때 사용합니다. 파일 닫기, 데이터베이스 연결 해제, 잠금 해제 등. 예외 발생 여부와 상관없이 실행되어야 하는 코드에 사용합니다. `using` 문으로 대체할 수 있습니다.
</details>

<details>
<summary><strong>Q> 사용자 정의 예외는 언제 정의해야 하나요?</strong></summary>

사용자 정의 예외는 도메인 특정 에러가 필요할 때 정의합니다. 비즈니스 로직 에러, 애플리케이션 특정 상태 등. 표준 예외로 표현할 수 없는 에러에 사용합니다. `Exception`을 상속하여 정의합니다.
</details>

<details>
<summary><strong>Q> 예외 필터는 왜 유용한가요?</strong></summary>

예외 필터는 조건부 catch를 지원하여 더 세밀한 예외 처리가 가능합니다. 여러 catch 블록을 중첩하지 않고 조건을 추가할 수 있습니다. 로깅, 재시 로직 등에 유용합니다. C# 6.0부터 지원됩니다.
</details>

<details>
<summary><strong>Q> using 문과 finally 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`using` 문은 `IDisposable`을 구현한 객체에 사용합니다. 더 간결하고 자동으로 `Dispose()`를 호출합니다. `finally`는 더 복잡한 정리 로직이 필요할 때 사용합니다. 대부분의 경우 `using` 문을 사용하는 것이 좋습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **try-catch** | 예외 포착 | 특정 예외 타입 |
| **finally** | 정리 작업 | 항상 실행 |
| **throw** | 예외 발생 | new Exception() |
| **사용자 정의 예외** | Exception 상속 | 도메인 특정 |
| **예외 필터** | when 절 | 조건부 catch |
| **using** | 자동 Dispose | IDisposable |
| **using 선언** | using var | C# 8.0+ |
| **예외 전파** | 스택 전파 | InnerException |
| **다시 throw** | throw | 스택 트레이스 보존 |
| **ArgumentNullException** | null 인자 | nameof() |
| **ArgumentException** | 잘못된 인자 | 유효성 검사 |


## 다음 수업

다음 글에서는 C# 중급 — 비동기 프로그래밍, async/await, Task, CancellationToken을 배웁니다.
