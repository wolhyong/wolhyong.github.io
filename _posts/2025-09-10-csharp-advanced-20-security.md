---
layout: post
title: "C# 보안 — 암호화, 인증, 권한 부여, HTTPS, 데이터 보호, 보안 코딩"
description: "C#의 보안 시스템을 실무 레벨에서 학습합니다. 암호화는 Symmetric(대칭), Asymmetric(비대칭), Hash(해시) 알고리즘을 제공하며 Aes, RSA, SHA256 등을 사용합니다. 인증은 ASP.NET Core Identity로 사용자 인증을 지원하며 JWT, OAuth, OpenID Connect를 지원합니다. 권한 부여는 [Authorize] 특성으로 역할 기반 접근 제어를 제공합니다. HTTPS는 Kestrel로 TLS/SSL을 구성하며 인증서를 사용합니다. 데이터 보호는 IDataProtector로 민감 데이터를 보호합니다. 보안 코딩은 SQL 인젝션, XSS, CSRF 방지를 포함합니다."
date: 2025-09-10 10:00:00 +0900
category: csharp
tags: [csharp, security, encryption, authentication, authorization, https, data-protection]
level: advanced
---

C#의 보안 시스템은 암호화, 인증, 권한 부여 등 다양한 보안 기능을 제공합니다.

> **핵심 정리** · 암호화는 Aes, RSA, SHA256을 사용합니다. ASP.NET Core Identity로 인증을 지원합니다. `[Authorize]`로 권한 부여를 제공합니다. HTTPS로 TLS/SSL을 구성합니다. `IDataProtector`로 데이터를 보호합니다. SQL 인젝션, XSS, CSRF를 방지합니다.


## 수업 목표

- 암호화를 이해하고 사용할 수 있습니다.
- 인증 시스템을 이해합니다.
- 권한 부여를 이해합니다.
- HTTPS를 구성할 수 있습니다.
- 데이터 보호를 이해합니다.
- 보안 코딩을 이해합니다.

## 대칭 암호화

```csharp
using System;
using System.Security.Cryptography;
using System.Text;

class Program
{
    static void Main()
    {
        string plainText = "Hello, World!";
        byte[] key = Encoding.UTF8.GetBytes("1234567890123456");  // 16 bytes
        byte[] iv = Encoding.UTF8.GetBytes("1234567890123456");    // 16 bytes

        // 암호화
        byte[] encrypted = Encrypt(plainText, key, iv);
        Console.WriteLine($"암호화: {Convert.ToBase64String(encrypted)}");

        // 복호화
        string decrypted = Decrypt(encrypted, key, iv);
        Console.WriteLine($"복호화: {decrypted}");
    }

    static byte[] Encrypt(string plainText, byte[] key, byte[] iv)
    {
        using (Aes aes = Aes.Create())
        {
            aes.Key = key;
            aes.IV = iv;

            ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

            using (MemoryStream ms = new MemoryStream())
            {
                using (CryptoStream cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                {
                    using (StreamWriter sw = new StreamWriter(cs))
                    {
                        sw.Write(plainText);
                    }
                    return ms.ToArray();
                }
            }
        }
    }

    static string Decrypt(byte[] cipherText, byte[] key, byte[] iv)
    {
        using (Aes aes = Aes.Create())
        {
            aes.Key = key;
            aes.IV = iv;

            ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

            using (MemoryStream ms = new MemoryStream(cipherText))
            {
                using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                {
                    using (StreamReader sr = new StreamReader(cs))
                    {
                        return sr.ReadToEnd();
                    }
                }
            }
        }
    }
}
```

대칭 암호화는 같은 키로 암호화와 복호화를 수행합니다. `Aes`는 표준 대칭 암호화 알고리즘입니다. 키와 IV(초기화 벡터)가 필요합니다. `CryptoStream`으로 암호화 스트림을 처리합니다.

## 비대칭 암호화

```csharp
using System;
using System.Security.Cryptography;
using System.Text;

class Program
{
    static void Main()
    {
        // 키 쌍 생성
        using (RSA rsa = RSA.Create(2048))
        {
            string plainText = "Hello, World!";

            // 공개 키로 암호화
            byte[] encrypted = Encrypt(plainText, rsa.ExportRSAPublicKey());
            Console.WriteLine($"암호화: {Convert.ToBase64String(encrypted)}");

            // 개인 키로 복호화
            string decrypted = Decrypt(encrypted, rsa.ExportRSAPrivateKey());
            Console.WriteLine($"복호화: {decrypted}");
        }
    }

    static byte[] Encrypt(string plainText, byte[] publicKey)
    {
        using (RSA rsa = RSA.Create())
        {
            rsa.ImportRSAPublicKey(publicKey, out _);
            return rsa.Encrypt(Encoding.UTF8.GetBytes(plainText), RSAEncryptionPadding.OaepSHA256);
        }
    }

    static string Decrypt(byte[] cipherText, byte[] privateKey)
    {
        using (RSA rsa = RSA.Create())
        {
            rsa.ImportRSAPrivateKey(privateKey, out _);
            byte[] decrypted = rsa.Decrypt(cipherText, RSAEncryptionPadding.OaepSHA256);
            return Encoding.UTF8.GetString(decrypted);
        }
    }
}
```

비대칭 암호화는 공개 키로 암호화하고 개인 키로 복호화합니다. `RSA`는 표준 비대칭 암호화 알고리즘입니다. 공개 키와 개인 키 쌍을 사용합니다. 디지털 서명, 키 교환에 사용됩니다.

## 해시

```csharp
using System;
using System.Security.Cryptography;
using System.Text;

class Program
{
    static void Main()
    {
        string password = "mypassword";

        // SHA256 해시
        string sha256Hash = ComputeSha256Hash(password);
        Console.WriteLine($"SHA256: {sha256Hash}");

        // PBKDF2 (비밀번호 해싱)
        string pbkdf2Hash = ComputePbkdf2Hash(password);
        Console.WriteLine($"PBKDF2: {pbkdf2Hash}");
    }

    static string ComputeSha256Hash(string input)
    {
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
            StringBuilder builder = new StringBuilder();
            foreach (byte b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString();
        }
    }

    static string ComputePbkdf2Hash(string password)
    {
        byte[] salt = new byte[16];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }

        using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256))
        {
            byte[] hash = pbkdf2.GetBytes(32);
            return Convert.ToBase64String(hash);
        }
    }
}
```

해시는 단방향 함수로 원본 데이터를 복구할 수 없습니다. `SHA256`은 표준 해시 알고리즘입니다. `PBKDF2`는 비밀번호 해싱에 사용되며 솔트와 반복을 사용합니다. 비밀번호 저장에 필수적입니다.

## ASP.NET Core Identity

```bash
# 패키지 추가
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
```

```csharp
// Models/ApplicationUser.cs
using Microsoft.AspNetCore.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; }
}

// Data/ApplicationDbContext.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }
}

// Program.cs
using Microsoft.AspNetCore.Identity;

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication();
builder.Services.AddAuthorization();
```

ASP.NET Core Identity는 사용자 인증을 지원합니다. `IdentityUser`를 상속하여 사용자 모델을 확장합니다. `IdentityDbContext`로 데이터베이스 컨텍스트를 정의합니다. `AddIdentity`로 서비스를 등록합니다.

## JWT 인증

```bash
# 패키지 추가
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

```csharp
// Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "yourdomain.com",
            ValidAudience = "yourdomain.com",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-secret-key"))
        };
    });

// JWT 생성
public string GenerateJwtToken(ApplicationUser user)
{
    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-secret-key"));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: "yourdomain.com",
        audience: "yourdomain.com",
        claims: claims,
        expires: DateTime.Now.AddHours(1),
        signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

JWT(JSON Web Token)은 상태 비저장 인증을 제공합니다. `JwtBearer` 인증 미들웨어를 사용합니다. `TokenValidationParameters`로 토큰 검증을 구성합니다. 클레임으로 사용자 정보를 포함합니다.

## 권한 부여

```csharp
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    [Authorize]
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("인증된 사용자");
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public IActionResult Post()
    {
        return Ok("관리자만 접근");
    }

    [Authorize(Policy = "ManagerOnly")]
    [HttpPut]
    public IActionResult Put()
    {
        return Ok("매니저만 접근");
    }
}

// Program.cs
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ManagerOnly", policy =>
        policy.RequireRole("Manager"));
});
```

`[Authorize]` 특성으로 인증을 요구합니다. `Roles`로 역할 기반 접근 제어를 제공합니다. `Policy`로 정책 기반 접근 제어를 제공합니다. `AddAuthorization`으로 정책을 구성합니다.

## HTTPS

```csharp
// Program.cs
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5000);
    options.ListenAnyIP(5001, listenOptions =>
    {
        listenOptions.UseHttps("certificate.pfx", "password");
    });
});

// 또는 appsettings.json
{
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://*:5001",
        "Certificate": {
          "Path": "certificate.pfx",
          "Password": "password"
        }
      }
    }
  }
}
```

HTTPS는 TLS/SSL로 통신을 암호화합니다. `ConfigureKestrel`로 HTTPS를 구성합니다. 인증서를 사용하여 암호화를 제공합니다. 개발 환경에서는 자체 서명 인증서를 사용할 수 있습니다.

## 데이터 보호

```csharp
using Microsoft.AspNetCore.DataProtection;

// Program.cs
builder.Services.AddDataProtection();

// 사용
public class DataService
{
    private readonly IDataProtector _protector;

    public DataService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("MyPurpose");
    }

    public string Protect(string input)
    {
        return _protector.Protect(input);
    }

    public string Unprotect(string input)
    {
        return _protector.Unprotect(input);
    }
}
```

`IDataProtector`는 민감 데이터를 보호합니다. `AddDataProtection`으로 서비스를 등록합니다. `CreateProtector`로 보호자를 생성합니다. `Protect`로 암호화하고 `Unprotect`로 복호화합니다.

## 보안 코딩

```csharp
// SQL 인젝션 방지 (EF Core 사용)
var user = await _context.Users
    .Where(u => u.Username == username)
    .FirstOrDefaultAsync();

// XSS 방지 (ASP.NET Core 자동 처리)
// Razor는 자동으로 인코딩

// CSRF 방지
[ValidateAntiForgeryToken]
public IActionResult Post()
{
    // 처리
}

// 입력 검증
public class UserInput
{
    [Required]
    [StringLength(50)]
    [RegularExpression(@"^[a-zA-Z0-9]+$")]
    public string Username { get; set; }
}

// 안전한 문자열 비교
bool success = CryptographicOperations.FixedTimeEquals(
    hash1,
    hash2
);
```

SQL 인젝션은 EF Core를 사용하여 방지합니다. XSS는 Razor가 자동으로 인코딩합니다. CSRF는 `[ValidateAntiForgeryToken]`로 방지합니다. 입력 검증으로 데이터 유효성을 보장합니다. `FixedTimeEquals`로 타이밍 공격을 방지합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 대칭 암호화와 비대칭 암호화 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

대칭 암호화는 대량 데이터 암호화에 사용합니다. 빠르지만 키 관리가 중요합니다. 비대칭 암호화는 키 교환, 디지털 서명에 사용합니다. 느리지만 키 관리가 쉽습니다. 하이브리드 방식으로 두 가지를 결합합니다.
</details>

<details>
<summary><strong>Q> SHA256과 PBKDF2 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`SHA256`은 일반 해싱에 사용합니다. 데이터 무결성 검증에 적합합니다. `PBKDF2`는 비밀번호 해싱에 사용합니다. 솔트와 반복으로 레인보우 테이블 공격을 방지합니다. 비밀번호에는 반드시 `PBKDF2`, `Argon2` 등을 사용해야 합니다.
</details>

<details>
<summary><strong>Q> JWT와 세션 기반 인증 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

JWT는 상태 비저장 인증에 적합합니다. 마이크로서비스, SPA에 유용합니다. 세션 기반은 상태 저장 인증에 적합합니다. 전통적인 웹 애플리케이션에 유용합니다. 요구사항에 따라 선택합니다.
</details>

<details>
<summary><strong>Q> HTTPS는 왜 필수인가요?</strong></summary>

HTTPS는 통신을 암호화하여 중간자 공격을 방지합니다. 민감 데이터 보호에 필수적입니다. SEO, 브라우저 경고, 규정 준수에도 중요합니다. 모든 웹 애플리케이션에서 HTTPS를 사용해야 합니다.
</details>

<details>
<summary><strong>Q> FixedTimeEquals는 언제 사용해야 하나요?</strong></summary>

`FixedTimeEquals`는 암호, 토큰 비교에 사용합니다. 타이밍 공격을 방지합니다. 일반 비교 연산자(`==`)는 타이밍 정보를 노출할 수 있습니다. 보안 민감한 비교에 필수적입니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **대칭 암호화** | 같은 키 암호화/복호화 | Aes |
| **비대칭 암호화** | 공개/개인 키 | RSA |
| **해시** | 단방향 함수 | SHA256 |
| **PBKDF2** | 비밀번호 해싱 | 솔트 + 반복 |
| **Identity** | 사용자 인증 | IdentityUser |
| **JWT** | 상태 비저장 토큰 | JwtBearer |
| **[Authorize]** | 인증 요구 | Roles, Policy |
| **HTTPS** | TLS/SSL 암호화 | Kestrel |
| **IDataProtector** | 데이터 보호 | Protect/Unprotect |
| **SQL 인젝션 방지** | EF Core 사용 | 파라미터화 |
| **XSS 방지** | Razor 자동 인코딩 | 입력 인코딩 |
| **CSRF 방지** | ValidateAntiForgeryToken | 토큰 검증 |
| **FixedTimeEquals** | 타이밍 공격 방지 | 안전한 비교 |


## 다음 수업

다음 글에서는 C# 고급 — 아키텍처와 디자인 패턴, 클린 아키텍처, SOLID, DDD를 배웁니다.
