---
layout: post
title: "C# 제어문 — if/else, switch 패턴 매칭, for, foreach, while, do-while, break/continue"
description: "C#의 제어문을 컴파일러 레벨에서 학습합니다. if/else는 조건문으로 불리언 표현식을 평가하며 중첩 가능합니다. switch는 패턴 매칭을 지원하며 case, when, default를 사용합니다. for는 초기화, 조건, 반복자, 본문으로 구성된 반복문입니다. foreach는 컬렉션을 순회하며 IEnumerable을 구현한 타입에 사용됩니다. while은 조건이 true인 동안 반복하며 do-while은 최소 한 번 실행 후 조건을 확인합니다. break는 루프를 탈출하고 continue는 다음 반복으로 건너뜁니다. goto는 특정 라벨로 점프하며 사용을 피해야 합니다. C# 8.0부터 switch 식으로 값을 반환할 수 있습니다."
date: 2025-08-01 10:00:00 +0900
category: csharp
tags: [csharp, control-flow, if-else, switch, for, foreach, while, pattern-matching]
level: basic
---

C#의 제어문은 프로그램의 실행 흐름을 제어하며 다양한 패턴 매칭과 반복문을 제공합니다.

> **핵심 정리** · `if/else`는 조건문으로 불리언을 평가합니다. `switch`는 패턴 매칭을 지원하며 `case`, `when`을 사용합니다. `for`는 전통적인 반복문이며 `foreach`는 컬렉션 순회에 사용됩니다. `while`과 `do-while`은 조건 기반 반복입니다. `break`와 `continue`로 루프를 제어합니다.


## 수업 목표

- if/else 조건문을 사용할 수 있습니다.
- switch와 패턴 매칭을 이해합니다.
- for, foreach, while, do-while을 사용할 수 있습니다.
- break와 continue를 이해합니다.
- switch 식을 사용할 수 있습니다.

## if/else

```csharp
int score = 85;

if (score >= 90)
{
    Console.WriteLine("A");
}
else if (score >= 80)
{
    Console.WriteLine("B");
}
else if (score >= 70)
{
    Console.WriteLine("C");
}
else
{
    Console.WriteLine("F");
}
```

`if`는 조건이 `true`일 때 블록을 실행합니다. `else if`는 다른 조건을 검사하고 `else`는 모든 조건이 `false`일 때 실행됩니다. 중첩 가능하며 복잡한 조건을 표현할 수 있습니다.

### 조건부 연산자

```csharp
int age = 20;
string message = age >= 18 ? "성인" : "미성년자";

Console.WriteLine(message);
```

조건부 연산자(`?:`)는 간단한 if/else를 대체할 수 있습니다. `condition ? trueValue : falseValue` 형식입니다. 가독성을 위해 복잡한 로직에는 사용하지 않는 것이 좋습니다.

## switch

```csharp
int day = 3;
string dayName;

switch (day)
{
    case 1:
        dayName = "월요일";
        break;
    case 2:
        dayName = "화요일";
        break;
    case 3:
        dayName = "수요일";
        break;
    default:
        dayName = "알 수 없음";
        break;
}

Console.WriteLine(dayName);
```

`switch`는 변수의 값에 따라 다른 코드를 실행합니다. `case`는 값을 매칭하고 `break`로 switch를 종료합니다. `default`는 매칭되는 case가 없을 때 실행됩니다.

### switch 패턴 매칭

```csharp
object obj = 42;

switch (obj)
{
    case int i when i > 0:
        Console.WriteLine($"양수: {i}");
        break;
    case int i when i < 0:
        Console.WriteLine($"음수: {i}");
        break;
    case int i:
        Console.WriteLine($"영수: {i}");
        break;
    case string s:
        Console.WriteLine($"문자열: {s}");
        break;
    default:
        Console.WriteLine("알 수 없는 타입");
        break;
}
```

C# 7.0부터 패턴 매칭을 지원합니다. `when` 절로 추가 조건을 지정할 수 있습니다. 타입 패턴, 상수 패턴, var 패턴 등을 사용할 수 있습니다.

### switch 식 (C# 8.0+)

```csharp
int score = 85;
string grade = score switch
{
    >= 90 => "A",
    >= 80 => "B",
    >= 70 => "C",
    _ => "F"
};

Console.WriteLine(grade);
```

switch 식은 값을 반환합니다. `_`는 와일드카드 패턴입니다. 더 간결하고 함수형 스타일의 코드를 작성할 수 있습니다.

## for

```csharp
// 기본 for 루프
for (int i = 0; i < 5; i++)
{
    Console.WriteLine(i);
}

// 역순
for (int i = 5; i > 0; i--)
{
    Console.WriteLine(i);
}

// 여러 초기화
for (int i = 0, j = 10; i < 5 && j > 5; i++, j--)
{
    Console.WriteLine($"i={i}, j={j}");
}
```

`for`는 초기화, 조건, 반복자, 본문으로 구성됩니다. `for (initialization; condition; iterator)` 형식입니다. 인덱스 기반 반복에 적합합니다.

## foreach

```csharp
// 배열 순회
int[] numbers = { 1, 2, 3, 4, 5 };

foreach (int number in numbers)
{
    Console.WriteLine(number);
}

// 리스트 순회
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };

foreach (string name in names)
{
    Console.WriteLine(name);
}

// 문자열 순회
string text = "Hello";

foreach (char c in text)
{
    Console.WriteLine(c);
}
```

`foreach`는 컬렉션을 순회합니다. `IEnumerable`을 구현한 타입에 사용됩니다. 인덱스 없이 요소에 접근하며 컬렉션 수정은 불가능합니다.

## while

```csharp
int count = 0;

while (count < 5)
{
    Console.WriteLine(count);
    count++;
}
```

`while`은 조건이 `true`인 동안 반복합니다. 조건이 처음부터 `false`면 루프가 실행되지 않습니다. 반복 횟수가 미리 알려지지 않을 때 사용합니다.

## do-while

```csharp
int count = 0;

do
{
    Console.WriteLine(count);
    count++;
} while (count < 5);
```

`do-while`은 최소 한 번 실행 후 조건을 확인합니다. 조건이 `false`여도 최소 한 번은 실행됩니다. 사용자 입력 유효성 검사에 유용합니다.

## break와 continue

```csharp
// break
for (int i = 0; i < 10; i++)
{
    if (i == 5)
    {
        break;  // 루프 탈출
    }
    Console.WriteLine(i);
}

// continue
for (int i = 0; i < 10; i++)
{
    if (i % 2 == 0)
    {
        continue;  // 다음 반복으로 건너뜀
    }
    Console.WriteLine(i);
}
```

`break`는 루프를 탈출합니다. `continue`는 다음 반복으로 건너뜁니다. 중첩 루프에서 특정 루프를 탈출하려면 라벨을 사용할 수 있습니다.

### 라벨과 break

```csharp
outer:
for (int i = 0; i < 3; i++)
{
    for (int j = 0; j < 3; j++)
    {
        if (i == 1 && j == 1)
        {
            Console.WriteLine($"Breaking at i={i}, j={j}");
            break outer;  // 외부 루프 탈출
        }
        Console.WriteLine($"i={i}, j={j}");
    }
}
```

라벨을 사용하여 중첩 루프에서 특정 루프를 탈출할 수 있습니다. `label:`로 라벨을 정의하고 `break label;`로 탈출합니다.

## goto

```csharp
int i = 0;

start:
Console.WriteLine(i);
i++;

if (i < 5)
{
    goto start;
}
```

`goto`는 특정 라벨로 점프합니다. 사용을 피해야 합니다. 코드를 읽기 어렵게 만들고 구조적 프로그래밍 원칙을 위반합니다. 특수한 경우(상태 머신 등)에만 사용합니다.

## 예외 처리와 제어문

```csharp
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
```

`try-catch-finally`로 예외를 처리합니다. `try`에서 예외가 발생하면 `catch`로 이동합니다. `finally`는 예외 발생 여부와 상관없이 실행됩니다. 리소스 정리에 사용됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> switch와 if-else 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`switch`는 단일 변수를 여러 값과 비교할 때 사용합니다. 더 읽기 쉽고 컴파일러러 최적화가 가능합니다. `if-else`는 복잡한 조건이 필요할 때 사용합니다. 패턴 매칭이 필요하면 `switch`가 더 강력합니다. C# 8.0부터 switch 식으로 값을 반환할 수 있습니다.
</details>

<details>
<summary><strong>Q> for와 foreach 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`for`는 인덱스가 필요하거나 반복 횟수가 명확할 때 사용합니다. `foreach`는 컬렉션 순회에 사용하며 인덱스가 필요 없을 때 더 간결합니다. `foreach`는 `IEnumerable`을 구현한 타입에 사용할 수 있습니다. 성능 차이는 미미하며 가독성을 우선합니다.
</details>

<details>
<summary><strong>Q> while과 do-while의 차이는 무엇인가요?</strong></summary>

`while`은 조건이 먼저 검사되므로 조건이 `false`면 실행되지 않습니다. `do-while`은 최소 한 번 실행 후 조건을 검사합니다. 사용자 입력 유효성 검사 같이 최소 한 번 실행해야 할 때 `do-while`를 사용합니다.
</details>

<details>
<summary><strong>Q> goto는 왜 피해야 하나요?</strong></summary>

`goto`는 코드를 읽기 어렵게 만들고 흐름을 추적하기 어렵습니다. 구조적 프로그래밍 원칙을 위반하며 스파게티 코드를 유발합니다. 대부분의 경우 `if`, `for`, `while`로 대체할 수 있습니다. 특수한 경우(상태 머신, 에러 복구)에만 사용합니다.
</details>

<details>
<summary><strong>Q> switch 식은 언제 사용해야 하나요?</strong></summary>

switch 식은 값을 반환해야 할 때 사용합니다. 더 간결하고 함수형 스타일의 코드를 작성할 수 있습니다. 복잡한 로직이 필요하면 전통적인 switch 문이 더 적합할 수 있습니다. C# 8.0부터 지원됩니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **if/else** | 조건문 | 중첩 가능 |
| **조건부 연산자** | ?: 삼항 연산자 | 간단한 if/else |
| **switch** | 다중 분기 | 패턴 매칭 지원 |
| **switch 식** | 값 반환 | C# 8.0+ |
| **for** | 인덱스 기반 반복 | 초기화/조건/반복자 |
| **foreach** | 컬렉션 순회 | IEnumerable |
| **while** | 조건 기반 반복 | 조건 먼저 검사 |
| **do-while** | 조건 기반 반복 | 최소 한 번 실행 |
| **break** | 루프 탈출 | 라벨 지원 |
| **continue** | 다음 반복 | 현재 반복 건너뜀 |
| **goto** | 라벨 점프 | 사용 피해야 함 |
| **try-catch** | 예외 처리 | finally로 정리 |


## 다음 수업

다음 글에서는 C# 함수와 메서드 — 매개변수, 반환값, ref/out, 오버로딩, 선택적 매개변수를 배웁니다.
