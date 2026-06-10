---
layout: post
title: "C# 함수와 메서드 — 매개변수 전달, ref/out/in, 메서드 오버로딩, 선택적 매개변수, 명명된 인자"
description: "C#의 함수와 메서드 시스템을 컴파일러 레벨에서 학습합니다. 메서드는 클래스의 멤버 함수로 static과 인스턴스 메서드로 구분됩니다. 매개변수는 기본적으로 값으로 전달되며 ref로 참조 전달, out으로 출력 매개변수, in으로 읽기 전용 참조를 지원합니다. 메서드 오버로딩은 같은 이름으로 다른 매개변수를 가진 여러 메서드를 정의합니다. 선택적 매개변수는 기본값을 가질 수 있으며 명명된 인자로 순서无关하게 전달할 수 있습니다. 지역 함수는 메서드 내부에 정의된 함수로 외부에서 접근할 수 없습니다. C# 9.0부터 탑 레벨 문으로 클래스 외부에 메서드를 정의할 수 있습니다."
date: 2025-08-04 10:00:00 +0900
category: csharp
tags: [csharp, functions, methods, parameters, overloading, optional-parameters, ref-out]
level: basic
---

C#의 메서드는 클래스의 동작을 정의하며 다양한 매개변수 전달 방식과 오버로딩을 지원합니다.

> **핵심 정리** · 메서드는 static과 인스턴스로 구분됩니다. `ref`로 참조 전달, `out`으로 출력 매개변수, `in`으로 읽기 전용 참조를 지원합니다. 오버로딩으로 같은 이름의 여러 메서드를 정의합니다. 선택적 매개변수와 명명된 인자로 유연한 호출을 지원합니다.


## 수업 목표

- static과 인스턴스 메서드의 차이를 이해합니다.
- ref, out, in 매개변수를 이해합니다.
- 메서드 오버로딩을 사용할 수 있습니다.
- 선택적 매개변수와 명명된 인자를 이해합니다.
- 지역 함수를 사용할 수 있습니다.

## 메서드 정의

```csharp
class Calculator
{
    // 인스턴스 메서드
    public int Add(int a, int b)
    {
        return a + b;
    }

    // static 메서드
    public static int Multiply(int a, int b)
    {
        return a * b;
    }
}

class Program
{
    static void Main()
    {
        Calculator calc = new Calculator();
        
        // 인스턴스 메서드 호출
        int sum = calc.Add(5, 3);
        Console.WriteLine($"합: {sum}");

        // static 메서드 호출
        int product = Calculator.Multiply(5, 3);
        Console.WriteLine($"곱: {product}");
    }
}
```

인스턴스 메서드는 객체를 통해 호출되며 인스턴스 상태에 접근할 수 있습니다. static 메서드는 클래스 이름으로 호출되며 인스턴스 상태에 접근할 수 없습니다.

## 매개변수 전달

```csharp
class Program
{
    // 값 전달 (기본)
    static void ValuePass(int x)
    {
        x = 10;
        Console.WriteLine($"함수 내: {x}");
    }

    // 참조 전달 (ref)
    static void RefPass(ref int x)
    {
        x = 10;
        Console.WriteLine($"함수 내: {x}");
    }

    static void Main()
    {
        int a = 5;
        ValuePass(a);
        Console.WriteLine($"ValuePass 후: {a}");  // 5 (변경 없음)

        int b = 5;
        RefPass(ref b);
        Console.WriteLine($"RefPass 후: {b}");  // 10 (변경됨)
    }
}
```

값 전달은 매개변수의 복사본을 전달하므로 함수 내에서 수정해도 원본에 영향이 없습니다. `ref` 키워드는 참조를 전달하므로 함수 내에서 수정하면 원본도 변경됩니다.

## out 매개변수

```csharp
class Program
{
    static bool TryParseInt(string s, out int result)
    {
        return int.TryParse(s, out result);
    }

    static void Main()
    {
        string input = "42";
        
        if (TryParseInt(input, out int number))
        {
            Console.WriteLine($"파싱 성공: {number}");
        }
        else
        {
            Console.WriteLine("파싱 실패");
        }
    }
}
```

`out` 매개변수는 출력 전용 매개변수입니다. 메서드가 값을 할당해야 합니다. 여러 값을 반환할 때 사용합니다. `int.TryParse` 같은 표준 메서드에서 사용됩니다.

## in 매개변수 (C# 7.2+)

```csharp
class Program
{
    static void Process(in int x)
    {
        Console.WriteLine($"값: {x}");
        // x = 10;  // 컴파일 에러: 읽기 전용
    }

    static void Main()
    {
        int value = 42;
        Process(in value);
    }
}
```

`in` 매개변수는 읽기 전용 참조입니다. 큰 구조체를 복사하지 않고 읽기만 할 때 사용합니다. 성능 최적화에 유용합니다.

## 메서드 오버로딩

```csharp
class Printer
{
    public void Print(int value)
    {
        Console.WriteLine($"정수: {value}");
    }

    public void Print(double value)
    {
        Console.WriteLine($"실수: {value}");
    }

    public void Print(string value)
    {
        Console.WriteLine($"문자열: {value}");
    }

    public void Print(int a, int b)
    {
        Console.WriteLine($"두 정수: {a}, {b}");
    }
}

class Program
{
    static void Main()
    {
        Printer printer = new Printer();
        
        printer.Print(42);        // Print(int)
        printer.Print(3.14);       // Print(double)
        printer.Print("Hello");    // Print(string)
        printer.Print(1, 2);      // Print(int, int)
    }
}
```

메서드 오버로딩은 같은 이름으로 다른 매개변수를 가진 여러 메서드를 정의합니다. 매개변수의 타입, 개수, 순서로 구분됩니다. 컴파일러가 호출 시 적절한 메서드를 선택합니다.

## 선택적 매개변수

```csharp
class Greeter
{
    public void Greet(string name, string greeting = "안녕하세요")
    {
        Console.WriteLine($"{greeting}, {name}!");
    }
}

class Program
{
    static void Main()
    {
        Greeter greeter = new Greeter();
        
        greeter.Greet("Wolhyong");                    // 기본값 사용
        greeter.Greet("Wolhyong", "반갑습니다");     // 명시적 값
    }
}
```

선택적 매개변수는 기본값을 가질 수 있습니다. 호출 시 값을 생략하면 기본값이 사용됩니다. 모든 선택적 매개변수는 필수 매개변수 뒤에 와야 합니다.

## 명명된 인자

```csharp
class Calculator
{
    public int Calculate(int a, int b, int c = 0)
    {
        return a + b + c;
    }
}

class Program
{
    static void Main()
    {
        Calculator calc = new Calculator();
        
        // 위치 인자
        int result1 = calc.Calculate(1, 2, 3);
        
        // 명명된 인자
        int result2 = calc.Calculate(a: 1, b: 2, c: 3);
        
        // 순서 변경 가능
        int result3 = calc.Calculate(c: 3, a: 1, b: 2);
        
        // 선택적 매개변수 건너뜀
        int result4 = calc.Calculate(1, 2);
        
        Console.WriteLine($"{result1}, {result2}, {result3}, {result4}");
    }
}
```

명명된 인자는 매개변수 이름으로 값을 전달합니다. 순서를 변경하거나 특정 매개변수만 전달할 수 있습니다. 선택적 매개변수와 함께 사용하면 더 유연합니다.

## 지역 함수 (C# 7.0+)

```csharp
class Program
{
    static void Main()
    {
        int Add(int a, int b)
        {
            return a + b;
        }

        int result = Add(5, 3);
        Console.WriteLine(result);
    }
}
```

지역 함수는 메서드 내부에 정의된 함수입니다. 외부에서 접근할 수 없으며 캡슐화를 향상합니다. 메서드 내부에서만 사용되는 헬퍼 함수에 적합합니다.

## 탑 레벨 문 (C# 9.0+)

```csharp
// Program.cs 파일 전체
using System;

int Add(int a, int b) => a + b;

Console.WriteLine(Add(5, 3));
```

C# 9.0부터 탑 레벨 문을 지원합니다. 클래스 외부에 메서드를 정의할 수 있습니다. 간단한 스크립트나 교육용 코드에 유용합니다.

## params 키워드

```csharp
class Program
{
    static void PrintNumbers(params int[] numbers)
    {
        foreach (int number in numbers)
        {
            Console.WriteLine(number);
        }
    }

    static void Main()
    {
        PrintNumbers(1, 2, 3, 4, 5);
        PrintNumbers(new int[] { 10, 20, 30 });
    }
}
```

`params` 키워드는 가변 개수의 인자를 받습니다. 내부적으로 배열로 변환됩니다. 마지막 매개변수여야 하며 하나만 사용할 수 있습니다.

## 반환 타입

```csharp
class Program
{
    // 값 반환
    static int Add(int a, int b)
    {
        return a + b;
    }

    // 참조 반환 (C# 7.0+)
    static ref int FindMax(int[] numbers)
    {
        int maxIndex = 0;
        for (int i = 1; i < numbers.Length; i++)
        {
            if (numbers[i] > numbers[maxIndex])
            {
                maxIndex = i;
            }
        }
        return ref numbers[maxIndex];
    }

    // 튜플 반환 (C# 7.0+)
    static (int, int) Divide(int a, int b)
    {
        return (a / b, a % b);
    }

    static void Main()
    {
        // 참조 반환
        int[] numbers = { 1, 5, 3, 9, 2 };
        ref int max = ref FindMax(numbers);
        max = 10;  // 원본 배열 수정
        Console.WriteLine(string.Join(", ", numbers));  // 1, 5, 3, 10, 2

        // 튜플 반환
        var (quotient, remainder) = Divide(10, 3);
        Console.WriteLine($"몫: {quotient}, 나머지: {remainder}");
    }
}
```

C# 7.0부터 참조 반환(`ref return`)을 지원합니다. 튜플 반환으로 여러 값을 반환할 수 있습니다. `ValueTuple`을 사용하며 명명된 튜플도 가능합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> ref와 out의 차이는 무엇인가요?</strong></summary>

`ref`는 참조를 전달하며 입력과 출력 모두에 사용됩니다. 호출 전에 초기화해야 합니다. `out`은 출력 전용이며 호출 전에 초기화할 필요가 없고 메서드 내에서 할당해야 합니다. `ref`는 수정 가능한 참조, `out`은 초기화되지 않은 변수를 반환할 때 사용합니다.
</details>

<details>
<summary><strong>Q> 메서드 오버로딩은 어떻게 동작하나요?</strong></summary>

메서드 오버로딩은 컴파일 타임에 매개변수 타입, 개수, 순서로 적절한 메서드를 선택합니다. 런타임 다형성은 아닙니다(그것은 오버라이딩). 컴파일러가 가장 구체적인 매개변수 타입을 가진 메서드를 선택합니다. 모호할 경우 컴파일 에러가 발생합니다.
</details>

<details>
<summary><strong>Q> 선택적 매개변수는 언제 사용해야 하나요?</strong></summary>

선택적 매개변수는 대부분의 호출에서 기본값을 사용할 때 유용합니다. 메서드 오버로딩 대신 사용하여 코드를 간소화할 수 있습니다. 하지만 너무 많은 선택적 매개변수는 가독성을 떨어뜨립니다. 3-4개 이하로 유지하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 명명된 인자는 언제 사용해야 하나요?</strong></summary>

명명된 인자는 다음 경우에 사용합니다: (1) 매개변수 순서를 기억하기 어려울 때 (2) 특정 매개변수만 전달할 때 (3) 부울 플래그를 전달할 때. 가독성을 높이고 실수를 줄입니다. 선택적 매개변수와 함께 사용하면 더 유연합니다.
</details>

<details>
<summary><strong>Q> 지역 함수는 왜 사용하나요?</strong></summary>

지역 함수는 캡슐화를 향상하고 메서드 내부에서만 사용되는 헬퍼 함수를 정의할 때 사용합니다. 외부에서 접근할 수 없으므로 API를 깔끔하게 유지합니다. 복잡한 로직을 작은 함수로 분리하여 가독성을 높입니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **인스턴스 메서드** | 객체 통해 호출 | 인스턴스 상태 접근 |
| **static 메서드** | 클래스 통해 호출 | 인스턴스 상태 불가 |
| **ref** | 참조 전달 | 수정 가능 |
| **out** | 출력 매개변수 | 할당 필수 |
| **in** | 읽기 전용 참조 | C# 7.2+ |
| **오버로딩** | 같은 이름 다른 매개변수 | 컴파일 타임 선택 |
| **선택적 매개변수** | 기본값 | 필수 뒤에 위치 |
| **명명된 인자** | 이름으로 전달 | 순서 변경 가능 |
| **지역 함수** | 메서드 내부 함수 | 캡슐화 |
| **탑 레벨 문** | 클래스 외부 메서드 | C# 9.0+ |
| **params** | 가변 인자 | 배열로 변환 |
| **ref return** | 참조 반환 | 원본 수정 가능 |
| **튜플 반환** | 여러 값 반환 | ValueTuple |


## 다음 수업

다음 글에서는 C# 클래스와 객체지향 — 클래스, 객체, 생성자, 소멸자, this 키워드를 배웁니다.
