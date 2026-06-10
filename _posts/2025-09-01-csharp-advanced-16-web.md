---
layout: post
title: "C# 웹 개발 — ASP.NET Core, MVC, Web API, 미들웨어, 라우팅, 컨트롤러"
description: "C#의 웹 개발 프레임워크인 ASP.NET Core를 실무 레벨에서 학습합니다. ASP.NET Core는 크로스 플랫폼 고성능 웹 프레임워크로 MVC(Model-View-Controller) 패턴과 Web API를 지원합니다. MVC는 모델, 뷰, 컨트롤러로 분리하여 웹 애플리케이션을 구조화합니다. Web API는 RESTful 서비스를 구축하며 JSON 직렬화를 자동으로 처리합니다. 미들웨어는 HTTP 요청 파이프라인에 로깅, 인증, CORS 등을 추가합니다. 라우팅은 URL 패턴을 컨트롤러 액션에 매핑하며 특성 기반 라우팅과 규칙 기반 라우팅을 지원합니다. Startup 클래스에서 서비스와 미들웨어를 구성하며 Program.cs에서 호스트를 빌드합니다."
date: 2025-09-01 10:00:00 +0900
category: csharp
tags: [csharp, aspnet-core, mvc, web-api, middleware, routing, controllers]
level: advanced
---

ASP.NET Core는 크로스 플랫폼 고성능 웹 프레임워크로 현대적 웹 애플리케이션을 구축할 수 있습니다.

> **핵심 정리** · ASP.NET Core는 MVC와 Web API를 지원합니다. 미들웨어는 HTTP 파이프라인에 로깅, 인증을 추가합니다. 라우팅은 URL을 컨트롤러에 매핑합니다. Startup에서 서비스와 미들웨어를 구성합니다. RESTful 서비스를 구축할 수 있습니다.


## 수업 목표

- ASP.NET Core의 구조를 이해합니다.
- MVC 패턴을 이해합니다.
- Web API를 구축할 수 있습니다.
- 미들웨어를 이해합니다.
- 라우팅을 이해합니다.
- 컨트롤러를 작성할 수 있습니다.

## 프로젝트 생성

```bash
# MVC 프로젝트 생성
dotnet new mvc -n MyMvcApp

# Web API 프로젝트 생성
dotnet new webapi -n MyWebApi

# 실행
dotnet run
```

ASP.NET Core 프로젝트는 `dotnet new`로 생성합니다. MVC는 웹 페이지를, Web API는 RESTful 서비스를 구축합니다. `dotnet run`으로 애플리케이션을 실행합니다.

## MVC 구조

```csharp
// Models/Person.cs
public class Person
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }
}

// Controllers/PersonController.cs
using Microsoft.AspNetCore.Mvc;

public class PersonController : Controller
{
    public IActionResult Index()
    {
        var people = new List<Person>
        {
            new Person { Id = 1, Name = "Alice", Age = 30 },
            new Person { Id = 2, Name = "Bob", Age = 25 }
        };
        return View(people);
    }

    public IActionResult Details(int id)
    {
        var person = new Person { Id = id, Name = "Charlie", Age = 35 };
        return View(person);
    }
}
```

MVC는 Model-View-Controller 패턴을 따릅니다. Model은 데이터, View는 UI, Controller는 로직을 담당합니다. `Controller`는 `Controller` 기본 클래스를 상속하며 액션 메서드를 정의합니다.

## 뷰

```html
<!-- Views/Person/Index.cshtml -->
@model IEnumerable<Person>

<h1>사람 목록</h1>

<table class="table">
    <thead>
        <tr>
            <th>ID</th>
            <th>이름</th>
            <th>나이</th>
        </tr>
    </thead>
    <tbody>
        @foreach (var person in Model)
        {
            <tr>
                <td>@person.Id</td>
                <td>@person.Name</td>
                <td>@person.Age</td>
            </tr>
        }
    </tbody>
</table>
```

뷰는 Razor 문법을 사용하여 HTML과 C# 코드를 혼합합니다. `@model`로 모델 타입을 지정합니다. `@foreach`로 반복을 수행하며 `@`로 C# 코드를 작성합니다.

## Web API

```csharp
// Controllers/PeopleController.cs
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

[ApiController]
[Route("api/[controller]")]
public class PeopleController : ControllerBase
{
    private static List<Person> _people = new List<Person>
    {
        new Person { Id = 1, Name = "Alice", Age = 30 },
        new Person { Id = 2, Name = "Bob", Age = 25 }
    };

    [HttpGet]
    public ActionResult<IEnumerable<Person>> Get()
    {
        return _people;
    }

    [HttpGet("{id}")]
    public ActionResult<Person> Get(int id)
    {
        var person = _people.FirstOrDefault(p => p.Id == id);
        if (person == null)
        {
            return NotFound();
        }
        return person;
    }

    [HttpPost]
    public ActionResult<Person> Post(Person person)
    {
        person.Id = _people.Max(p => p.Id) + 1;
        _people.Add(person);
        return CreatedAtAction(nameof(Get), new { id = person.Id }, person);
    }

    [HttpPut("{id}")]
    public IActionResult Put(int id, Person person)
    {
        var existing = _people.FirstOrDefault(p => p.Id == id);
        if (existing == null)
        {
            return NotFound();
        }
        existing.Name = person.Name;
        existing.Age = person.Age;
        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var person = _people.FirstOrDefault(p => p.Id == id);
        if (person == null)
        {
            return NotFound();
        }
        _people.Remove(person);
        return NoContent();
    }
}
```

Web API는 `[ApiController]` 특성으로 API 컨트롤러를 표시합니다. `[HttpGet]`, `[HttpPost]`, `[HttpPut]`, `[HttpDelete]`로 HTTP 메서드를 지정합니다. JSON 직렬화가 자동으로 처리됩니다.

## 미들웨어

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// 서비스 추가
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 미들웨어 파이프라인
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

미들웨어는 HTTP 요청 파이프라인에 로깅, 인증, CORS 등을 추가합니다. `Use` 메서드로 미들웨어를 등록하며 순서가 중요합니다. `MapControllers`로 컨트롤러 라우팅을 활성화합니다.

## 라우팅

```csharp
[ApiController]
[Route("api/[controller]")]
public class PeopleController : ControllerBase
{
    [HttpGet]
    [Route("all")]  // api/people/all
    public ActionResult<IEnumerable<Person>> GetAll()
    {
        return _people;
    }

    [HttpGet("{id}")]  // api/people/{id}
    public ActionResult<Person> Get(int id)
    {
        var person = _people.FirstOrDefault(p => p.Id == id);
        if (person == null)
        {
            return NotFound();
        }
        return person;
    }

    [HttpGet("search/{name}")]  // api/people/search/{name}
    public ActionResult<IEnumerable<Person>> Search(string name)
    {
        return _people.Where(p => p.Name.Contains(name)).ToList();
    }
}
```

라우팅은 URL 패턴을 컨트롤러 액션에 매핑합니다. `[Route]` 특성으로 라우트를 지정합니다. `[controller]` 토큰은 컨트롤러 이름으로 대체됩니다. `{id}` 같은 경로 매개변수를 사용할 수 있습니다.

## 의존성 주입

```csharp
// Services/IPersonService.cs
public interface IPersonService
{
    IEnumerable<Person> GetAll();
    Person GetById(int id);
}

// Services/PersonService.cs
public class PersonService : IPersonService
{
    private static List<Person> _people = new List<Person>
    {
        new Person { Id = 1, Name = "Alice", Age = 30 },
        new Person { Id = 2, Name = "Bob", Age = 25 }
    };

    public IEnumerable<Person> GetAll() => _people;

    public Person GetById(int id) => _people.FirstOrDefault(p => p.Id == id);
}

// Program.cs
builder.Services.AddScoped<IPersonService, PersonService>();

// Controllers/PeopleController.cs
public class PeopleController : ControllerBase
{
    private readonly IPersonService _personService;

    public PeopleController(IPersonService personService)
    {
        _personService = personService;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Person>> Get()
    {
        return _personService.GetAll();
    }
}
```

ASP.NET Core는 DI를 기본적으로 지원합니다. `AddScoped`, `AddTransient`, `AddSingleton`으로 서비스를 등록합니다. 생성자 주입으로 서비스를 주입받습니다.

## 모델 바인딩

```csharp
public class Person
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }
}

[HttpPost]
public ActionResult<Person> Post([FromBody] Person person)
{
    person.Id = _people.Max(p => p.Id) + 1;
    _people.Add(person);
    return CreatedAtAction(nameof(Get), new { id = person.Id }, person);
}
```

`[FromBody]` 특성으로 요청 바디를 모델에 바인딩합니다. `[FromQuery]`, `[FromRoute]`, `[FromHeader]` 등도 사용할 수 있습니다. 모델 바인딩은 자동으로 수행됩니다.

## 유효성 검사

```csharp
using System.ComponentModel.DataAnnotations;

public class Person
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string Name { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }
}

[HttpPost]
public ActionResult<Person> Post(Person person)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    person.Id = _people.Max(p => p.Id) + 1;
    _people.Add(person);
    return CreatedAtAction(nameof(Get), new { id = person.Id }, person);
}
```

`[Required]`, `[StringLength]`, `[Range]` 등의 데이터 주석으로 유효성 검사를 수행합니다. `ModelState.IsValid`로 검사 결과를 확인합니다. `BadRequest`로 유효성 검사 실패를 반환합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> MVC와 Web API 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

MVC는 웹 페이지를 렌더링할 때 사용합니다. HTML 뷰를 반환하며 사용자 인터페이스에 적합합니다. Web API는 RESTful 서비스를 구축할 때 사용합니다. JSON/XML 데이터를 반환하며 SPA, 모바일 앱에 적합합니다. 두 패턴을 혼합할 수도 있습니다.
</details>

<details>
<summary><strong>Q> 미들웨어 순서는 왜 중요한가요?</strong></summary>

미들웨어 순서는 요청 파이프라인의 실행 순서를 결정합니다. 예: 인증 미들웨어는 엔드포인트 미들웨어 앞에 있어야 합니다. 순서가 잘못되면 보안 문제나 예상치 못한 동작이 발생할 수 있습니다. 순서를 신중하게 구성해야 합니다.
</details>

<details>
<summary><strong>Q> 특성 기반 라우팅과 규칙 기반 라우팅 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

특성 기반 라우팅은 컨트롤러와 액션에 직접 라우트를 지정합니다. 규칙 기반 라우팅은 중앙에서 라우트를 구성합니다. 특성 기반이 더 명확하며 규칙 기반은 중앙화에 유리합니다. 혼합해서 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q> Scoped 서비스는 언제 사용해야 하나요?</strong></summary>

`Scoped` 서비스는 HTTP 요청 범위에서 같은 인스턴스를 사용할 때 사용합니다. 데이터베이스 컨텍스트, 사용자 세션 등에 적합합니다. 요청 간에 상태를 공유해야 할 때 사용합니다.
</details>

<details>
<summary><strong>Q> IActionResult를 반환하는 이유는 무엇인가요?</strong></summary>

`IActionResult`는 다양한 HTTP 응답 타입을 반환할 수 있습니다. `Ok`, `NotFound`, `BadRequest`, `Created` 등을 사용하여 적절한 HTTP 상태 코드를 반환할 수 있습니다. 유연한 응답 처리를 제공합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **ASP.NET Core** | 웹 프레임워크 | 크로스 플랫폼 |
| **MVC** | Model-View-Controller | 웹 페이지 |
| **Web API** | RESTful 서비스 | JSON 직렬화 |
| **미들웨어** | HTTP 파이프라인 | Use 메서드 |
| **라우팅** | URL 매핑 | Route 특성 |
| **컨트롤러** | 요청 처리 | ControllerBase |
| **DI** | 의존성 주입 | AddScoped 등 |
| **모델 바인딩** | 요청 데이터 매핑 | FromBody 등 |
| **유효성 검사** | 데이터 주석 | ModelState |
| **IActionResult** | HTTP 응답 | Ok, NotFound 등 |
| **Program.cs** | 호스트 구성 | Build 메서드 |


## 다음 수업

다음 글에서는 C# 고급 — 데이터베이스, Entity Framework Core, LINQ to SQL, 마이그레이션을 배웁니다.
