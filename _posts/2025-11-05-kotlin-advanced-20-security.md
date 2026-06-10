---
layout: post
title: "Kotlin 보안 — 암호화, 인증, 권한 부여, 보안 코딩"
description: "Kotlin의 보안 시스템을 실무 레벨에서 학습합니다. 암호화는 대칭 암호화(AES)와 비대칭 암호화(RSA)로 데이터를 보호합니다. 해시는 SHA-256, MD5로 데이터 무결성을 확인합니다. 인증은 JWT, OAuth2로 사용자를 인증합니다. 권한 부여는 RBAC, ABAC로 접근을 제어합니다. 보안 코딩은 입력 검증, SQL 인젝션 방지, XSS 방지 등을 포함합니다. Kotlin은 Java의 보안 라이브러리를 활용하며 안드로이드 보안을 제공합니다."
date: 2025-11-05 10:00:00 +0900
category: kotlin
tags: [kotlin, security, encryption, authentication, authorization, secure-coding]
level: advanced
---

Kotlin의 보안 시스템은 암호화, 인증, 권한 부여, 보안 코딩 등 다양한 기법을 제공합니다.

> **핵심 정리** · `AES`로 대칭 암호화를 수행합니다. `RSA`로 비대칭 암호화를 수행합니다. `SHA-256`으로 해시를 생성합니다. `JWT`로 토큰 기반 인증을 수행합니다. `RBAC`로 역할 기반 권한 부여를 수행합니다. 입력 검증으로 보안 코딩을 수행합니다.


## 수업 목표

- 암호화를 이해하고 사용할 수 있습니다.
- 해시를 이해합니다.
- 인증을 이해합니다.
- 권한 부여를 이해합니다.
- 보안 코딩을 이해합니다.
- 안드로이드 보안을 이해합니다.

## 대칭 암호화

```kotlin
import javax.crypto.*
import javax.crypto.spec.*
import java.security.*
import java.util.*

// AES 암호화
fun encryptAES(data: String, key: String): String {
    val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
    val secretKey = SecretKeySpec(key.toByteArray(), "AES")
    val iv = IvParameterSpec(ByteArray(16))
    cipher.init(Cipher.ENCRYPT_MODE, secretKey, iv)
    val encrypted = cipher.doFinal(data.toByteArray())
    return Base64.getEncoder().encodeToString(encrypted)
}

// AES 복호화
fun decryptAES(encrypted: String, key: String): String {
    val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
    val secretKey = SecretKeySpec(key.toByteArray(), "AES")
    val iv = IvParameterSpec(ByteArray(16))
    cipher.init(Cipher.DECRYPT_MODE, secretKey, iv)
    val decoded = Base64.getDecoder().decode(encrypted)
    val decrypted = cipher.doFinal(decoded)
    return String(decrypted)
}

val encrypted = encryptAES("Hello, World!", "MySecretKey12345")
val decrypted = decryptAES(encrypted, "MySecretKey12345")
println(decrypted)  // Hello, World!
```

`AES`는 대칭 암호화 알고리즘입니다. 동일한 키로 암호화와 복호화를 수행합니다. `Cipher` 클래스로 암호화를 수행합니다. `SecretKeySpec`으로 키를 설정합니다. `IvParameterSpec`으로 초기화 벡터를 설정합니다.

## 비대칭 암호화

```kotlin
import java.security.*
import java.security.spec.*
import javax.crypto.*
import java.util.*

// 키 쌍 생성
fun generateKeyPair(): KeyPair {
    val keyGen = KeyPairGenerator.getInstance("RSA")
    keyGen.initialize(2048)
    return keyGen.generateKeyPair()
}

// RSA 암호화
fun encryptRSA(data: String, publicKey: PublicKey): String {
    val cipher = Cipher.getInstance("RSA")
    cipher.init(Cipher.ENCRYPT_MODE, publicKey)
    val encrypted = cipher.doFinal(data.toByteArray())
    return Base64.getEncoder().encodeToString(encrypted)
}

// RSA 복호화
fun decryptRSA(encrypted: String, privateKey: PrivateKey): String {
    val cipher = Cipher.getInstance("RSA")
    cipher.init(Cipher.DECRYPT_MODE, privateKey)
    val decoded = Base64.getDecoder().decode(encrypted)
    val decrypted = cipher.doFinal(decoded)
    return String(decrypted)
}

val keyPair = generateKeyPair()
val encrypted = encryptRSA("Hello, World!", keyPair.public)
val decrypted = decryptRSA(encrypted, keyPair.private)
println(decrypted)  // Hello, World!
```

`RSA`는 비대칭 암호화 알고리즘입니다. 공개키로 암호화하고 개인키로 복호화합니다. `KeyPairGenerator`로 키 쌍을 생성합니다. `Cipher` 클래스로 암호화를 수행합니다. 디지털 서명, 키 교환에 사용됩니다.

## 해시

```kotlin
import java.security.*
import java.util.*

// SHA-256 해시
fun hashSHA256(data: String): String {
    val digest = MessageDigest.getInstance("SHA-256")
    val hash = digest.digest(data.toByteArray())
    return Base64.getEncoder().encodeToString(hash)
}

// MD5 해시 (보안에 적합하지 않음)
fun hashMD5(data: String): String {
    val digest = MessageDigest.getInstance("MD5")
    val hash = digest.digest(data.toByteArray())
    return Base64.getEncoder().encodeToString(hash)
}

val sha256Hash = hashSHA256("Hello, World!")
println(sha256Hash)

val md5Hash = hashMD5("Hello, World!")
println(md5Hash)
```

`SHA-256`은 안전한 해시 알고리즘입니다. 데이터 무결성을 확인합니다. `MessageDigest` 클래스로 해시를 생성합니다. `MD5`는 보안에 적합하지 않습니다. 비밀번호 저장에는 bcrypt, Argon2를 사용해야 합니다.

## JWT 인증

```kotlin
import io.jsonwebtoken.*
import java.util.*

// JWT 생성
fun createJWT(subject: String, secret: String): String {
    val now = Date()
    val expiration = Date(now.time + 3600000) // 1시간

    return Jwts.builder()
        .setSubject(subject)
        .setIssuedAt(now)
        .setExpiration(expiration)
        .signWith(SignatureAlgorithm.HS256, secret)
        .compact()
}

// JWT 검증
fun verifyJWT(token: String, secret: String): Claims? {
    return try {
        Jwts.parser()
            .setSigningKey(secret)
            .parseClaimsJws(token)
            .body
    } catch (e: Exception) {
        null
    }
}

val token = createJWT("user123", "mySecretKey")
val claims = verifyJWT(token, "mySecretKey")
println(claims?.subject)  // user123
```

`JWT`는 토큰 기반 인증입니다. `Jwts.builder()`로 토큰을 생성합니다. `setSubject`, `setIssuedAt`, `setExpiration`으로 클레임을 설정합니다. `signWith`로 서명합니다. `parser()`로 토큰을 검증합니다.

## OAuth2

```kotlin
// OAuth2 클라이언트 (개념)
// 1. 사용자를 인증 서버로 리디렉션
// 2. 인증 코드 수신
// 3. 액세스 토큰 요청
// 4. 액세스 토큰으로 API 호출

// 예: Google OAuth2
val authUrl = "https://accounts.google.com/o/oauth2/v2/auth"
val tokenUrl = "https://oauth2.googleapis.com/token"
val clientId = "your-client-id"
val clientSecret = "your-client-secret"
val redirectUri = "http://localhost:8080/callback"

// 실제 구현은 라이브러리 사용 필요
// 예: OAuth2-oidc-sdk, Spring Security OAuth2
```

`OAuth2`는 인증 프로토콜입니다. 제3자 애플리케이션에 안전한 액세스를 제공합니다. 인증 코드, 암시적, 클라이언트 자격증명, 장치 코드 등의 그랜트 타입을 지원합니다. Google, Facebook, GitHub 등에서 사용됩니다.

## RBAC

```kotlin
// 역할 기반 접근 제어
enum class Role {
    ADMIN, USER, GUEST
}

data class User(val id: String, val name: String, val role: Role)

fun hasPermission(user: User, permission: String): Boolean {
    return when (user.role) {
        Role.ADMIN -> true
        Role.USER -> permission in ["read", "write"]
        Role.GUEST -> permission == "read"
    }
}

val admin = User("1", "Admin", Role.ADMIN)
val user = User("2", "User", Role.USER)
val guest = User("3", "Guest", Role.GUEST)

println(hasPermission(admin, "delete"))  // true
println(hasPermission(user, "delete"))  // false
println(hasPermission(guest, "read"))  // true
```

`RBAC`는 역할 기반 접근 제어입니다. 역할에 따라 권한을 할당합니다. 사용자는 하나 이상의 역할을 가질 수 있습니다. 간단하고 관리하기 쉽습니다. 대부분의 애플리케이션에 적합합니다.

## 보안 코딩

```kotlin
// 입력 검증
fun validateInput(input: String): Boolean {
    // 길이 검증
    if (input.length > 100) return false
    
    // 문자열 패턴 검증
    val pattern = Regex("^[a-zA-Z0-9]+$")
    return pattern.matches(input)
}

// SQL 인젝션 방지 (파라미터화된 쿼리)
fun getUserById(id: Int): User? {
    val query = "SELECT * FROM users WHERE id = ?"
    // 파라미터화된 쿼리 사용
    return database.query(query, id)
}

// XSS 방지 (이스케이프)
fun escapeHtml(input: String): String {
    return input.replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("&", "&amp;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;")
}
```

입력 검증으로 악의적인 입력을 방지합니다. 파라미터화된 쿼리로 SQL 인젝션을 방지합니다. 이스케이프로 XSS를 방지합니다. 최소 권한 원칙을 따릅니다. 보안 라이브러리를 사용합니다.

## 안드로이드 보안

```kotlin
// 안드로이드 권한
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

// 권한 요청
fun requestPermission(activity: Activity, permission: String) {
    if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(activity, arrayOf(permission), 1)
    }
}

// 권한 확인
fun checkPermission(activity: Activity, permission: String): Boolean {
    return ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED
}

// 안드로이드 키스토어
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore

val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")

val spec = KeyGenParameterSpec.Builder(
    "MyKey",
    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
 .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
 .build()

keyGenerator.init(spec)
keyGenerator.generateKey()
```

안드로이드 권한으로 리소스 접근을 제어합니다. `Manifest.permission`으로 권한을 선언합니다. `ContextCompat.checkSelfPermission`으로 권한을 확인합니다. `AndroidKeyStore`로 키를 안전하게 저장합니다. 네트워크 보안 설정을 구성합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 대칭 암호화와 비대칭 암호화 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

대칭 암호화는 대량 데이터 암호화에 사용합니다. 빠르고 효율적입니다. 비대칭 암호화는 키 교환, 디지털 서명에 사용합니다. 느리지만 안전합니다. 두 가지를 함께 사용하는 것이 일반적입니다.
</details>

<details>
<summary><strong>Q> SHA-256과 MD5 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`SHA-256`을 사용해야 합니다. 안전한 해시 알고리즘입니다. `MD5`는 보안에 적합하지 않습니다. 충돌 저항성이 낮습니다. 비밀번호 저장에는 bcrypt, Argon2를 사용해야 합니다.
</details>

<details>
<summary><strong>Q> JWT와 OAuth2 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`JWT`는 토큰 기반 인증에 사용합니다. `OAuth2`는 인증 프로토콜입니다. `OAuth2`는 `JWT`와 함께 사용됩니다. 제3자 애플리케이션 인증에 `OAuth2`를 사용합니다.
</details>

<details>
<summary><strong>Q> RBAC와 ABAC 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`RBAC`를 우선 사용해야 합니다. 간단하고 관리하기 쉽습니다. `ABAC`는 복잡한 정책이 필요할 때 사용합니다. 속성 기반으로 더 유연합니다. 대부분의 경우 `RBAC`로 충분합니다.
</details>

<details>
<summary><strong>Q> 보안 코딩은 왜 중요한가요?</strong></summary>

보안 코딩은 취약점을 방지합니다. SQL 인젝션, XSS, CSRF 등을 방지합니다. 데이터 유출, 시스템 해킹을 방지합니다. 보안은 개발 단계에서 고려해야 합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **AES** | 대칭 암호화 | 동일 키 |
| **RSA** | 비대칭 암호화 | 공개키/개인키 |
| **SHA-256** | 안전한 해시 | 무결성 확인 |
| **MD5** | 해시 (보안 부적합) | 충돌 저항성 낮음 |
| **JWT** | 토큰 기반 인증 | Jwts.builder() |
| **OAuth2** | 인증 프로토콜 | 제3자 인증 |
| **RBAC** | 역할 기반 접근 제어 | Role enum |
| **입력 검증** | 악의적 입력 방지 | 패턴 매칭 |
| **SQL 인젝션 방지** | 파라미터화된 쿼리 | ? 사용 |
| **XSS 방지** | 이스케이프 | &lt; 변환 |
| **안드로이드 권한** | 리소스 접근 제어 | Manifest.permission |
| **AndroidKeyStore** | 키 저장 | 안전한 저장 |
| **최소 권한 원칙** | 필요한 권한만 | 보안 원칙 |


## 다음 수업

다음 글에서는 Kotlin 고급 — 아키텍처와 디자인 패턴, 클린 아키텍처, MVVM, MVI를 배웁니다.
