---
layout: post
title: "C# 언어 소개 — Microsoft가 설계한 객체지향 프로그래밍 언어의 철학과 .NET 생태계"
description: "C# 언어의 탄생 배경과 설계 철학, .NET 생태계를 시스템 레벨에서 학습합니다. Anders Hejlsberg가 2000년에 Microsoft에서 개발한 C#은 .NET 플랫폼의 주력 언어로 객체지향, 타입 안전, 가비지 컬렉션을 제공합니다. C# 컴파일러(csc)는 소스 코드를 IL(Intermediate Language)로 컴파일하며 JIT(Just-In-Time) 컴파일러가 런타임에 네이티브 코드로 변환합니다. CLR(Common Language Runtime)은 메모리 관리, 예외 처리, 스레드 관리를 담당합니다. .NET의 BCL(Base Class Library)은 풍부한 표준 라이브러리를 제공하며 NuGet 패키지 매니저로 의존성을 관리합니다. C#은 진화하는 언어로 최신 버전에서 레코드, 패턴 매칭, 비동기 스트림 등을 지원합니다."
date: 2025-07-28 10:00:00 +0900
category: csharp
tags: [csharp, dotnet, clr, jit, garbage-collection, nuget, microsoft]
level: basic
---

C#은 Microsoft가 개발한 현대적 객체지향 프로그래밍 언어로 .NET 플랫폼의 핵심 언어입니다.

> **핵심 정리** · C#은 Anders Hejlsberg가 2000년에 개발한 객체지향 언어입니다. 소스 코드는 IL로 컴파일되며 JIT가 네이티브 코드로 변환합니다. CLR이 메모리 관리와 예외 처리를 담당합니다. NuGet으로 의존성을 관리하며 BCL이 풍부한 라이브러리를 제공합니다.


## 수업 목표

- C#의 탄생 배경과 설계 철학을 이해합니다.
- .NET 플랫폼과 CLR의 동작을 이해합니다.
- IL과 JIT 컴파일 과정을 이해합니다.
- 가비지 컬렉션의 동작을 이해합니다.
- .NET CLI와 프로젝트 구조를 이해합니다.

## C#의 탄생 배경

C#은 2000년에 Microsoft에서 Anders Hejlsberg(Turbo Pascal, Delphi 설계자)가 주도하여 개발했습니다. Java의 성공에 대응하여 Microsoft는 .NET 플랫폼과 C#을 발표했습니다. C#은 C++의 강력함과 Java의 단순함을 결합하여 엔터프라이즈 개발에 최적화되었습니다.

### 설계 철학

- **타입 안전**: 컴파일 타임에 타입 검사를 수행하여 런타임 에러를 방지합니다.
- **객체지향**: 클래스, 상속, 인터페이스, 다형성을 완벽하게 지원합니다.
- **관리형 코드**: 가비지 컬렉터가 메모리를 자동으로 관리합니다.
- **플랫폼 독립**: IL로 컴파일되어 여러 플랫폼에서 실행됩니다.
- **진화**: 지속적으로 새로운 기능이 추가됩니다(최신 버전: C# 12).

## .NET 플랫폼

```
소스 코드 (.cs)
    ↓
C# 컴파일러 (csc)
    ↓
IL (Intermediate Language) + 메타데이터
    ↓
어셈블리 (.dll, .exe)
    ↓
CLR (Common Language Runtime)
    ↓
JIT (Just-In-Time) 컴파일러
    ↓
네이티브 기계어
```

.NET 플랫폼은 CLR 위에서 동작합니다. 소스 코드는 IL로 컴파일되며, JIT 컴파일러가 런타임에 네이티브 코드로 변환합니다. 이는 플랫폼 독립성과 성능의 균형을 제공합니다.

### CLR (Common Language Runtime)

CLR은 .NET의 실행 환경으로 다음 기능을 제공합니다:
- **메모리 관리**: 가비지 컬렉터로 힙 메모리를 자동으로 관리합니다.
- **예외 처리**: 구조화된 예외 처리로 에러를 관리합니다.
- **스레드 관리**: 스레드 풀과 동기화 프리미티브를 제공합니다.
- **타입 안전**: 타입 검사와 코드 액세스 보안을 수행합니다.
- **코드 로딩**: 어셈블리를 로드하고 실행합니다.

## Hello World

```csharp
using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
            Console.WriteLine("안녕, C#!");
        }
    }
}
```

`using System`은 `System` 네임스페이스를 가져옵니다. `namespace`는 코드를 논리적으로 그룹화합니다. `class`는 객체지향 프로그래밍의 기본 단위입니다. `static void Main`은 프로그램의 진입점입니다. `Console.WriteLine`은 콘솔에 출력합니다.

## .NET CLI

```bash
# 새 프로젝트 생성
dotnet new console -n HelloWorld

# 프로젝트 빌드
dotnet build

# 프로젝트 실행
dotnet run

# 릴리즈 빌드
dotnet build --configuration Release

# 테스트 실행
dotnet test
```

.NET CLI는 크로스 플랫폼 도구 체인입니다. `dotnet new`로 프로젝트 템플릿을 생성합니다. `dotnet build`로 컴파일하고 `dotnet run`으로 실행합니다. `dotnet test`로 테스트를 실행합니다.

## 프로젝트 구조

```
HelloWorld/
├── HelloWorld.csproj    # 프로젝트 파일
├── Program.cs           # 소스 코드
└── obj/                 # 중간 파일 (gitignore)
```

`.csproj` 파일은 프로젝트 설정을 정의합니다. MSBuild 포맷의 XML 파일입니다. `Program.cs`는 소스 코드입니다. `obj/` 디렉토리는 중간 파일을 저장합니다.

### .csproj 파일

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

`OutputType`은 출력 타입을 지정합니다(`Exe`, `Library`, `WinExe`). `TargetFramework`는 타겟 프레임워크를 지정합니다. `ImplicitUsings`는 암시적 using을 활성화합니다. `Nullable`은 nullable 참조 타입을 활성화합니다.

## 가비지 컬렉션

```csharp
class Program
{
    static void Main(string[] args)
    {
        // 객체 생성 (힙 할당)
        var obj = new MyClass();
        obj.DoSomething();

        // obj가 범위를 벗어나면 GC 대상이 됨
    }
}

class MyClass
{
    public void DoSomething()
    {
        Console.WriteLine("Doing something");
    }
}
```

가비지 컬렉터(GC)는 더 이상 참조되지 않는 객체를 자동으로 해제합니다. 개발자는 메모리 해제를 신경 쓸 필요가 없습니다. GC는 세대별(generational) 컬렉션을 사용하여 성능을 최적화합니다.

### GC 세대

- **Generation 0**: 단기 수명 객체. 자주 컬렉션됩니다.
- **Generation 1**: 중기 수명 객체. 0에서 살아남은 객체.
- **Generation 2**: 장기 수명 객체. 1에서 살아남은 객체. 드물게 컬렉션됩니다.

## NuGet 패키지 매니저

```bash
# 패키지 추가
dotnet add package Newtonsoft.Json

# 패키지 제거
dotnet remove package Newtonsoft.Json

# 패키지 나열
dotnet list package
```

NuGet은 .NET의 패키지 매니저입니다. `Newtonsoft.Json`, `Serilog`, `Entity Framework Core` 등 수십만 개의 패키지가 있습니다. `nuget.org`에서 패키지를 검색하고 설치할 수 있습니다.

## BCL (Base Class Library)

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        // 컬렉션
        var list = new List<int> { 1, 2, 3 };
        
        // LINQ
        var filtered = list.Where(x => x > 1);
        
        // 파일 I/O
        var content = await File.ReadAllTextAsync("file.txt");
        
        Console.WriteLine(content);
    }
}
```

BCL은 풍부한 표준 라이브러리를 제공합니다. `System.Collections.Generic`은 제네릭 컬렉션을, `System.Linq`는 LINQ를, `System.IO`는 파일 I/O를, `System.Threading.Tasks`는 비동기 작업을 제공합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> C#과 Java의 차이는 무엇인가요?</strong></summary>

C#과 Java는 유사하지만 차이가 있습니다: (1) **플랫폼**: C#은 .NET, Java는 JVM. (2) **언어 기능**: C#은 더 많은 기능을 제공(프로퍼티, 이벤트, LINQ, async/await). (3) **생태계**: C#은 Microsoft 생태계, Java는 더 광범위한 생태계. (4) **성능**: C#은 더 나은 성능 최적화를 제공할 수 있습니다. (5) **진화 속도**: C#은 더 빠르게 진화합니다.
</details>

<details>
<summary><strong>Q> .NET과 .NET Framework의 차이는 무엇인가요?</strong></summary>

.NET Framework는 Windows 전용이며 더 이상 개발되지 않습니다. .NET(이전 .NET Core)은 크로스 플랫폼이며 오픈 소스입니다. .NET 5+는 통합 플랫폼으로 Windows, Linux, macOS에서 실행됩니다. 새 프로젝트는 .NET을 사용해야 합니다.
</details>

<details>
<summary><strong>Q> JIT 컴파일은 왜 사용하나요?</strong></summary>

JIT 컴파일은 런타임에 IL을 네이티브 코드로 변환합니다. 이는 다음 이점이 있습니다: (1) 플랫폼 독립성: IL은 플랫폼에 독립적입니다. (2) 최적화: 런타임 정보를 활용한 최적화가 가능합니다. (3) 코드 크기: IL은 네이티브 코드보다 작습니다. 단점은 시작 시간이 느릴 수 있습니다(AOT 컴파일로 해결).
</details>

<details>
<summary><strong>Q> 가비지 컬렉터는 언제 실행되나요?</strong></summary>

GC는 다음 조건에서 실행됩니다: (1) 힙 메모리가 부족할 때 (2) `GC.Collect()`로 명시적 호출 시 (3) 시스템 메모리 부족 시. 개발자는 GC 실행 시점을 제어할 수 없으며, `GC.Collect()`는 일반적으로 사용하지 않습니다. GC는 자동으로 최적화됩니다.
</details>

<details>
<summary><strong>Q> nullable 참조 타입은 무엇인가요?</summary></summary>

nullable 참조 타입은 참조 타입이 null일 수 있음을 명시적으로 표현합니다. `string?`는 null 가능한 문자열, `string`은 null 불가능한 문자열입니다. 컴파일러가 null 참조 가능성을 경고하여 `NullReferenceException`을 방지합니다. C# 8.0부터 도입되었습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **C#** | Microsoft 객체지향 언어 | 타입 안전, 관리형 코드 |
| **.NET** | 개발 플랫폼 | CLR, BCL, NuGet |
| **CLR** | 공통 언어 런타임 | 메모리 관리, 예외 처리 |
| **IL** | 중간 언어 | 플랫폼 독립 |
| **JIT** | Just-In-Time 컴파일러 | 런타임 네이티브 변환 |
| **GC** | 가비지 컬렉터 | 자동 메모리 관리 |
| **NuGet** | 패키지 매니저 | 의존성 관리 |
| **BCL** | 기본 클래스 라이브러리 | 풍부한 표준 라이브러리 |
| **.NET CLI** | 명령줄 도구 | dotnet 명령 |


## 다음 수업

다음 글에서는 C# 변수와 데이터 타입 — 값 타입과 참조 타입, 박싱/언박싱, nullable, var를 배웁니다.
