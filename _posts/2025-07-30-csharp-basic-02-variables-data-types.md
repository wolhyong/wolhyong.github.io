---
layout: post
title: "C# 변수와 데이터 타입 — 값 타입과 참조 타입, 박싱/언박싱, nullable, var 타입 추론"
description: "C#의 변수 시스템과 데이터 타입을 메모리 레벨에서 학습합니다. C#은 값 타입(value type)과 참조 타입(reference type)으로 구분됩니다. 값 타입은 스택에 직접 값을 저장하며 int, float, bool, struct, enum이 포함됩니다. 참조 타입은 힙에 객체를 저장하며 스택에 참조를 저장합니다. string, class, interface, delegate, array가 포함됩니다. 박싱(boxing)은 값 타입을 참조 타입으로 변환하며 언박싱(unboxing)은 그 반대입니다. nullable 타입(T?)은 값 타입에 null을 허용합니다. var 키워드는 컴파일러가 타입을 추론합니다. C#의 타입 시스템은 통합 타입 시스템(unified type system)으로 모든 타입은 object에서 파생됩니다."
date: 2025-07-30 10:00:00 +0900
category: csharp
tags: [csharp, variables, data-types, value-type, reference-type, boxing, nullable]
level: basic
---

C#의 타입 시스템은 값 타입과 참조 타입으로 구분되며 메모리 관리 방식이 다릅니다.

> **핵심 정리** · 값 타입은 스택에 값을 저장하며 int, float, bool, struct가 포함됩니다. 참조 타입은 힙에 객체를 저장하며 string, class, array가 포함됩니다. 박싱은 값 타입을 참조 타입으로 변환합니다. nullable은 값 타입에 null을 허용합니다. var는 타입 추론을 제공합니다.


## 수업 목표

- 값 타입과 참조 타입의 차이를 이해합니다.
- 박싱과 언박싱의 동작을 이해합니다.
- nullable 타입을 사용할 수 있습니다.
- var 키워드와 타입 추론을 이해합니다.
- 통합 타입 시스템을 이해합니다.

## 값 타입과 참조 타입

```csharp
// 값 타입 (스택 할당)
int x = 10;
float y = 3.14f;
bool flag = true;

// 참조 타입 (힙 할당)
string name = "Wolhyong";
int[] numbers = new int[5];
List<string> list = new List<string>();
```

값 타입은 데이터를 직접 저장하며 스택에 할당됩니다. 참조 타입은 힙에 객체를 저장하고 스택에 참조를 저장합니다. 값 타입은 복사 시 값이 복사되고, 참조 타입은 참조가 복사됩니다.

### 값 타입

```csharp
struct Point
{
    public int X;
    public int Y;
    
    public Point(int x, int y)
    {
        X = x;
        Y = y;
    }
}

class Program
{
    static void Main()
    {
        Point p1 = new Point(10, 20);
        Point p2 = p1;  // 값 복사
        
        p2.X = 30;
        
        Console.WriteLine($"p1.X: {p1.X}");  // 10 (변경 없음)
        Console.WriteLine($"p2.X: {p2.X}");  // 30
    }
}
```

struct는 값 타입입니다. 값 복사는 독립적인 복사본을 생성합니다. `p2 = p1`은 `p1`의 값을 `p2`로 복사하므로 `p2`를 수정해도 `p1`에 영향이 없습니다.

### 참조 타입

```csharp
class Person
{
    public string Name { get; set; }
    
    public Person(string name)
    {
        Name = name;
    }
}

class Program
{
    static void Main()
    {
        Person p1 = new Person("Wolhyong");
        Person p2 = p1;  // 참조 복사
        
        p2.Name = "Greyhacker";
        
        Console.WriteLine($"p1.Name: {p1.Name}");  // Greyhacker (변경됨)
        Console.WriteLine($"p2.Name: {p2.Name}");  // Greyhacker
    }
}
```

class는 참조 타입입니다. 참조 복사는 같은 객체를 참조합니다. `p2 = p1`은 `p1`과 `p2`가 같은 객체를 참조하므로 `p2`를 수정하면 `p1`도 영향을 받습니다.

## 기본 데이터 타입

```csharp
// 정수형
byte b = 255;           // 1바이트 (0-255)
sbyte sb = -128;        // 1바이트 (-128~127)
short s = 32767;        // 2바이트
ushort us = 65535;      // 2바이트 (0-65535)
int i = 2147483647;     // 4바이트 (기본)
uint ui = 4294967295u;  // 4바이트 (0~4294967295)
long l = 9223372036854775807L;  // 8바이트
ulong ul = 18446744073709551615UL;  // 8바이트 (0~)

// 부동소수점
float f = 3.14f;        // 4바이트 (단정밀도)
double d = 3.1415926535; // 8바이트 (배정밀도, 기본)
decimal m = 3.14159265358979323846m;  // 16바이트 (금융 계산)

// 문자형
char c = 'A';           // 16비트 유니코드
string s = "Hello";     // 참조 타입

// 불리언
bool flag = true;       // 1바이트
```

C#은 다양한 기본 데이터 타입을 제공합니다. 정수형은 크기와 부호에 따라 세분화됩니다. 부동소수점은 `float`, `double`, `decimal`이 있습니다. `decimal`은 금융 계산에 적합합니다. `char`는 유니코드 문자를, `string`은 문자열을 저장합니다.

## 박싱과 언박싱

```csharp
int value = 42;
object boxed = value;  // 박싱: int -> object

int unboxed = (int)boxed;  // 언박싱: object -> int
```

박싱(boxing)은 값 타입을 참조 타입으로 변환합니다. 힙에 객체를 할당하고 값을 복사합니다. 언박싱(unboxing)은 참조 타입을 값 타입으로 변환합니다. 명시적 캐스팅이 필요하며 타입 불일치 시 런타임 에러가 발생합니다.

### 박싱 오버헤드

```csharp
ArrayList list = new ArrayList();
list.Add(42);      // 박싱 발생
list.Add("hello"); // 박싱 없음 (이미 참조 타입)

int value = (int)list[0];  // 언박싱 발생
```

박싱과 언박싱은 성능 오버헤드를 유발합니다. 힙 할당과 복사가 발생하며 캐스트 검사가 필요합니다. 제네릭을 사용하여 박싱을 피할 수 있습니다.

## Nullable 타입

```csharp
// nullable 값 타입
int? nullableInt = null;
double? nullableDouble = 3.14;
bool? nullableBool = null;

// HasValue와 Value
if (nullableInt.HasValue)
{
    int value = nullableInt.Value;
    Console.WriteLine(value);
}

// null-coalescing 연산자
int value = nullableInt ?? 0;

// null 조건부 연산자 (C# 8.0+)
int? maybeValue = GetValue();
int result = maybeValue ?? throw new InvalidOperationException();
```

nullable 타입(`T?`)은 값 타입에 `null`을 허용합니다. 내부적으로 `Nullable<T>` 구조체로 구현됩니다. `HasValue`로 값이 있는지 확인하고 `Value`로 값을 가져옵니다. `??` 연산자로 null일 때 대체값을 제공합니다.

## var 타입 추론

```csharp
// 컴파일러가 타입 추론
var name = "Wolhyong";        // string
var age = 30;                // int
var numbers = new[] { 1, 2, 3 };  // int[]
var list = new List<string>();  // List<string>

// 읽기 전용 (C# 7.3+)
var (x, y) = (10, 20);       // 튜플 분해
```

`var` 키워드는 컴파일러가 타입을 추론합니다. 타입을 명시적으로 작성하지 않아도 됩니다. 가독성을 높이고 복잡한 타입을 간소화합니다. 컴파일 타임에 타입이 결정되므로 타입 안전성이 보장됩니다.

### var 사용 지침

```csharp
// 좋은 사용
var person = new Person("Wolhyong");
var dictionary = new Dictionary<string, int>();

// 나쁜 사용 (타입이 명확하지 않음)
var result = SomeComplexMethod();  // 반환 타입이 불명확

// 명시적 타입이 나은 경우
int count = GetCount();  // 타입이 명확
```

`var`는 타입이 명확할 때 사용합니다. 복잡한 타입이나 반환 타입이 불명확할 때는 명시적 타입이 더 좋습니다. 일관성을 유지하는 것이 중요합니다.

## 통합 타입 시스템

```csharp
// 모든 타입은 object에서 파생
object obj1 = 42;          // 박싱
object obj2 = "hello";     // 참조
object obj3 = new Point(10, 20);  // 박싱

// 타입 확인
if (obj1 is int)
{
    int value = (int)obj1;  // 언박싱
    Console.WriteLine(value);
}

// 패턴 매칭 (C# 7.0+)
if (obj1 is int intValue)
{
    Console.WriteLine(intValue);
}
```

C#은 통합 타입 시스템(unified type system)을 가집니다. 모든 타입은 `object`에서 파생됩니다. 값 타입도 `object`로 변환할 수 있습니다(박싱). `is` 연산자로 타입을 확인하고 패턴 매칭을 사용할 수 있습니다.

## 문자열 불변성

```csharp
string s1 = "hello";
string s2 = s1;
s2 = "world";  // 새 문자열 생성 (s1은 변경되지 않음)

Console.WriteLine(s1);  // hello
Console.WriteLine(s2);  // world

// 문자열 보간
string name = "Wolhyong";
int age = 30;
string message = $"My name is {name} and I'm {age} years old.";
```

`string`은 불변(immutable) 참조 타입입니다. 문자열을 수정하면 새 문자열이 생성됩니다. 문자열 보간(`$""`)으로 간단하게 문자열을 구성할 수 있습니다.

## 배열

```csharp
// 단일 차원 배열
int[] numbers = new int[5];
int[] initialized = { 1, 2, 3, 4, 5 };

// 다차원 배열
int[,] matrix = new int[3, 3];
int[,] initializedMatrix = { {1, 2, 3}, {4, 5, 6}, {7, 8, 9} };

// 가변 배열 (jagged array)
int[][] jagged = new int[3][];
jagged[0] = new int[2] { 1, 2 };
jagged[1] = new int[3] { 3, 4, 5 };
jagged[2] = new int[4] { 6, 7, 8, 9 };

// 접근
int value = numbers[0];
int matrixValue = matrix[0, 0];
int jaggedValue = jagged[0][0];
```

배열은 고정 크기의 컬렉션입니다. 단일 차원, 다차원, 가변 배열(jagged array)을 지원합니다. 인덱스로 요소에 접근합니다. 배열은 참조 타입이므로 힙에 할당됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 값 타입과 참조 타입 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

값 타입은 작고 단순한 데이터에 적합합니다: 좌표, 색상, 숫자. 스택 할당으로 빠르고 복사 비용이 적습니다. 참조 타입은 크고 복잡한 데이터에 적합합니다: 객체, 컬렉션, 문자열. 힙 할당이 필요하지만 유연하고 공유가 쉽습니다. 일반적으로 struct는 작은 데이터에, class는 큰 데이터에 사용합니다.
</details>

<details>
<summary><strong>Q> 박싱은 왜 피해야 하나요?</strong></summary>

박싱은 성능 오버헤드를 유발합니다: (1) 힙 할당 (2) 값 복사 (3) 캐스트 검사. 반복적인 박싱/언박싱은 성능을 크게 저하합니다. 제네릭을 사용하여 박싱을 피할 수 있습니다: `List<int>` 대신 `ArrayList`를 사용하면 박싱이 발생합니다.
</details>

<details>
<summary><strong>Q> nullable 타입은 언제 사용해야 하나요?</strong></summary>

nullable 타입은 값이 없음을 표현해야 할 때 사용합니다: 데이터베이스의 NULL 값, 선택적 매개변수, 계산 실패. `int?`는 0과 NULL을 구별할 수 있습니다. `bool?`는 true, false, null 세 가지 상태를 표현할 수 있습니다. 데이터베이스와 상호작용할 때 유용합니다.
</details>

<details>
<summary><strong>Q> var는 언제 사용해야 하나요?</strong></summary>

`var`는 타입이 명확할 때 사용합니다: `var person = new Person();`, `var list = new List<int>();`. 타입이 불명확하거나 가독성이 중요할 때는 명시적 타입을 사용합니다: `int count = GetCount();`. 팀 규칙을 따르는 것이 좋습니다. 일관성이 중요합니다.
</details>

<details>
<summary><strong>Q> string은 왜 불변인가요?</strong></summary>

`string`이 불변인 이유: (1) **스레드 안전**: 불변이면 동시 접근이 안전합니다. (2) **해싱**: 불변이면 해시 코드가 일관됩니다. (3) **보안**: 문자열이 수정되지 않음을 보장합니다. 문자열 수정이 필요하면 `StringBuilder`를 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **값 타입** | 스택에 값 저장 | int, float, bool, struct |
| **참조 타입** | 힙에 객체 저장 | string, class, array |
| **박싱** | 값 타입 → 참조 타입 | 힙 할당, 오버헤드 |
| **언박싱** | 참조 타입 → 값 타입 | 명시적 캐스팅 |
| **nullable** | 값 타입에 null 허용 | T? 문법 |
| **var** | 타입 추론 | 컴파일 타임 결정 |
| **통합 타입 시스템** | 모든 타입은 object | 박싱 가능 |
| **string** | 불변 문자열 | 힙 할당 |
| **배열** | 고정 크기 컬렉션 | 참조 타입 |


## 다음 수업

다음 글에서는 C# 제어문 — if/else, switch, for, foreach, while, do-while, break/continue를 배웁니다.
