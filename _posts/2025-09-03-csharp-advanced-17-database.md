---
layout: post
title: "C# 데이터베이스 — Entity Framework Core, LINQ to SQL, 마이그레이션, DbContext, 모델"
description: "C#의 데이터베이스 접근 기술을 실무 레벨에서 학습합니다. Entity Framework Core는 ORM(Object-Relational Mapper)로 C# 객체와 데이터베이스 테이블을 매핑합니다. DbContext는 데이터베이스 컨텍스트를 나타내며 DbSet<TEntity>로 엔티티를 노출합니다. LINQ to SQL은 LINQ 쿼리를 SQL로 변환하며 Where, Select, OrderBy 등을 지원합니다. 마이그레이션은 데이터베이스 스키마를 버전 관리하며 Add-Migration, Update-Database로 생성하고 적용합니다. 모델은 데이터베이스 테이블을 나타내는 클래스로 [Key], [Required] 등의 데이터 주석으로 매핑을 정의합니다. EF Core는 SQL Server, PostgreSQL, MySQL 등 다양한 데이터베이스를 지원하며 ChangeTracker로 변경 추적을 수행합니다."
date: 2025-09-03 10:00:00 +0900
category: csharp
tags: [csharp, entity-framework-core, database, orm, linq-to-sql, migration, dbcontext]
level: advanced
---

Entity Framework Core는 C# 객체와 데이터베이스를 매핑하는 ORM으로 데이터베이스 접근을 단순화합니다.

> **핵심 정리** · EF Core는 ORM으로 객체와 테이블을 매핑합니다. `DbContext`는 데이터베이스 컨텍스트입니다. `DbSet<TEntity>`로 엔티티를 노출합니다. LINQ to SQL로 쿼리를 SQL로 변환합니다. 마이그레이션으로 스키마를 버전 관리합니다. `ChangeTracker`로 변경 추적을 수행합니다.


## 수업 목표

- Entity Framework Core를 이해합니다.
- DbContext를 사용할 수 있습니다.
- LINQ to SQL을 이해합니다.
- 마이그레이션을 사용할 수 있습니다.
- 모델을 정의할 수 있습니다.
- ChangeTracker를 이해합니다.

## 프로젝트 설정

```bash
# 프로젝트 생성
dotnet new webapi -n EfCoreDemo

# EF Core 패키지 추가
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Tools
```

EF Core 패키지를 추가합니다. `EntityFrameworkCore.SqlServer`는 SQL Server 제공자입니다. `Design`과 `Tools`는 마이그레이션 도구입니다.

## 모델 정의

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("People")]
public class Person
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
```

모델은 데이터베이스 테이블을 나타내는 클래스입니다. `[Table]`로 테이블 이름을 지정합니다. `[Key]`로 기본 키를, `[Required]`로 필수 필드를 지정합니다. `[MaxLength]`, `[Range]`로 제약 조건을 추가합니다.

## DbContext

```csharp
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Person> People { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Person>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Age).IsRequired();
        });
    }
}
```

`DbContext`는 데이터베이스 컨텍스트입니다. `DbSet<TEntity>`로 엔티티를 노출합니다. `OnModelCreating`에서 모델 구성을 정의합니다. `DbContextOptions`로 연결 문자열을 전달합니다.

## 연결 문자열

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=EfCoreDemoDb;Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```

`appsettings.json`에 연결 문자열을 추가합니다. SQL Server LocalDB를 사용하거나 실제 SQL Server를 지정할 수 있습니다. `Trusted_Connection=True`는 Windows 인증을 사용합니다.

## 서비스 등록

```csharp
// Program.cs
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

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

`AddDbContext`로 `DbContext`를 등록합니다. `UseSqlServer`로 SQL Server 제공자를 지정합니다. 연결 문자열을 `GetConnectionString`로 읽습니다.

## 마이그레이션

```bash
# 초기 마이그레이션 생성
dotnet ef migrations add InitialCreate

# 마이그레이션 적용
dotnet ef database update
```

`dotnet ef migrations add`로 마이그레이션을 생성합니다. `dotnet ef database update`로 마이그레이션을 데이터베이스에 적용합니다. 마이그레이션은 자동으로 생성되며 `DbContext`를 기반으로 합니다.

## CRUD 작업

```csharp
[ApiController]
[Route("api/[controller]")]
public class PeopleController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PeopleController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Person>>> Get()
    {
        return await _context.People.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Person>> Get(int id)
    {
        var person = await _context.People.FindAsync(id);
        if (person == null)
        {
            return NotFound();
        }
        return person;
    }

    [HttpPost]
    public async Task<ActionResult<Person>> Post(Person person)
    {
        _context.People.Add(person);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = person.Id }, person);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, Person person)
    {
        if (id != person.Id)
        {
            return BadRequest();
        }

        _context.Entry(person).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.People.Any(e => e.Id == id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var person = await _context.People.FindAsync(id);
        if (person == null)
        {
            return NotFound();
        }

        _context.People.Remove(person);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
```

CRUD 작업은 `DbSet` 메서드로 수행합니다. `ToListAsync`로 모든 엔티티를, `FindAsync`로 ID로 엔티티를 찾습니다. `Add`, `Remove`, `Update`로 엔티티를 추가, 삭제, 수정합니다. `SaveChangesAsync`로 변경을 저장합니다.

## LINQ to SQL

```csharp
[HttpGet("search")]
public async Task<ActionResult<IEnumerable<Person>>> Search(string name)
{
    var people = await _context.People
        .Where(p => p.Name.Contains(name))
        .OrderBy(p => p.Age)
        .ToListAsync();

    return people;
}

[HttpGet("adults")]
public async Task<ActionResult<IEnumerable<Person>>> GetAdults()
{
    var adults = await _context.People
        .Where(p => p.Age >= 18)
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();

    return adults;
}
```

LINQ to SQL은 LINQ 쿼리를 SQL로 변환합니다. `Where`, `OrderBy`, `OrderByDescending` 등을 사용할 수 있습니다. `ToListAsync`로 결과를 비동기적으로 가져옵니다.

## 관계 매핑

```csharp
public class Person
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }

    // 일대다 관계
    public List<Address> Addresses { get; set; } = new();
}

public class Address
{
    public int Id { get; set; }
    public string Street { get; set; }
    public string City { get; set; }
    public int PersonId { get; set; }

    public Person Person { get; set; }
}

public class ApplicationDbContext : DbContext
{
    public DbSet<Person> People { get; set; }
    public DbSet<Address> Addresses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>()
            .HasOne(a => a.Person)
            .WithMany(p => p.Addresses)
            .HasForeignKey(a => a.PersonId);
    }
}
```

EF Core는 관계 매핑을 지원합니다. `HasOne`, `WithMany`, `HasForeignKey`로 관계를 정의합니다. 탐색 속성으로 관련 엔티티에 접근할 수 있습니다.

## ChangeTracker

```csharp
[HttpGet("changes")]
public IActionResult GetChanges()
{
    var changes = _context.ChangeTracker.Entries<Person>()
        .Where(e => e.State != EntityState.Unchanged)
        .Select(e => new
        {
            Entity = e.Entity,
            State = e.State
        })
        .ToList();

    return Ok(changes);
}
```

`ChangeTracker`는 엔티티의 변경을 추적합니다. `Entries`로 모든 추적된 엔티티를 가져옵니다. `State`로 변경 상태를 확인할 수 있습니다. `Unchanged`, `Added`, `Modified`, `Deleted` 상태가 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> EF Core와 ADO.NET 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

EF Core는 ORM으로 객체 지향 데이터베이스 접근을 제공합니다. 대부분의 경우 EF Core를 사용하는 것이 좋습니다. ADO.NET은 성능이 중요하거나 SQL을 직접 제어해야 할 때 사용합니다. EF Core는 생산성을 높이고 ADO.NET은 성능을 높입니다.
</details>

<details>
<summary><strong>Q> 마이그레이션은 언제 사용해야 하나요?</strong></summary>

마이그레이션은 데이터베이스 스키마를 버전 관리할 때 사용합니다. 스키마 변경이 필요할 때마다 마이그레이션을 생성하고 적용합니다. 팀 협업 환경에서 스키마 일관성을 유지하는 데 필수적입니다.
</details>

<details>
<summary><strong>Q> LINQ to SQL과 일반 LINQ의 차이는 무엇인가요?</strong></summary>

LINQ to SQL은 LINQ 쿼리리를 SQL로 변환하여 데이터베이스에서 실행합니다. 일반 LINQ는 메모리 컬렉션에서 실행됩니다. EF Core의 LINQ는 LINQ to SQL입니다. `AsEnumerable`로 메모리로 가져온 후 일반 LINQ를 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q> ChangeTracker는 언게 유지되나요?</strong></summary>

`ChangeTracker`는 컨텍스트 수명 동안 변경을 추적합니다. `Scoped` 컨텍스트는 HTTP 요청 동안 추적합니다. 너무 많은 엔티티를 추적하면 메모리 사용량이 증가합니다. `AsNoTracking`으로 추적을 비활성화할 수 있습니다.
</details>

<details>
<summary><strong>Q> AsNoTracking은 언제 사용해야 하나요?</strong></summary>

`AsNoTracking`은 읽기 전용 쿼리리에 사용합니다. 변경 추적을 비활성화하여 성능을 향상합니다. 쓰기가 필요 없는 조회에 사용합니다. `AsNoTracking` 엔티티는 수정할 수 없습니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **EF Core** | ORM | 객체-테이블 매핑 |
| **DbContext** | 데이터베이스 컨텍스트 | DbSet<TEntity> |
| **DbSet** | 엔티티 노출 | CRUD 메서드 |
| **모델** | 데이터베이스 테이블 | 데이터 주석 |
| **마이그레이션** | 스키마 버전 관리 | Add-Migration |
| **LINQ to SQL** | LINQ → SQL 변환 | Where, Select |
| **관계 매핑** | 엔티티 관계 | HasOne, HasMany |
| **ChangeTracker** | 변경 추적 | State 확인 |
| **AsNoTracking** | 추적 비활성 | 읽기 전용 |
| **SaveChangesAsync** | 변경 저장 | 비동기 저장 |
| **SQL Server** | 데이터베이스 제공자 | UseSqlServer |


## 다음 수업

다음 글에서는 C# 고급 — 테스트, 단위 테스트, 통합 테스트, xUnit, Moq를 배웁니다.
