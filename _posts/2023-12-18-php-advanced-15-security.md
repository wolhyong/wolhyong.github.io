---
layout: post
title: "PHP 보안 — XSS, CSRF, SQL 인젝션, 파일 업로드 보안, 입력 검증"
description: "PHP 애플리케이션의 보안 취약점과 방어 기법을 웹 보안 표준(OWASP Top 10) 레벨에서 심층 학습합니다. XSS(Cross-Site Scripting)의 Stored/Reflected/DOM 기반 유형과 Content-Security-Policy 헤더, CSRF(Cross-Site Request Forgery)의 동기화 토큰 패턴(Synchronizer Token Pattern)과 SameSite 쿠키, SQL 인젝션의 prepared statement 방어(네트워크 레벨 바이너리 프로토콜), 파일 업로드 보안의 MIME 타입 검증(파일 매직 바이트)과 exec 함수 차단(disable_functions), 비밀번호 해싱의 bcrypt/Argon2 알고리즘과 password_hash()의 salt 자동 생성(cost factor 기본 10)을 다룹니다."
date: 2023-12-18 10:00:00 +0900
category: php
tags: [php, security, xss, csrf, sql-injection, password-hashing, owasp]
level: advanced
---

웹 보안은 PHP 애플리케이션 개발에서 가장 중요한 측면 중 하나입니다. 대부분의 취약점은 입력 검증과 출력 인코딩의 부재에서 발생합니다.

> **💡 핵심 정리** · XSS(Cross-Site Scripting) 방어는 `htmlspecialchars($input, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`로 `<`, `>`, `&`, `"`, `'`를 HTML 엔티티로 변환하고, Content-Security-Policy(CSP) 헤더로 스크립트 실행 출처를 제한합니다. CSRF 방어는 서버가 생성한 랜덤 토큰을 세션에 저장하고 폼에 hidden 필드로 포함시켜, 요청 시 토큰을 비교하는 Synchronizer Token Pattern이 표준입니다. 비밀번호 해싱은 `password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])`가 자동으로 22자리 랜덤 salt를 생성하고, bcrypt의 내부 Blowfish 암호화(72자 제한, cost=12 → ~250ms)로 해싱합니다.

---

## 📚 수업 목표

- XSS 공격 유형과 방어 기법을 이해합니다.
- CSRF 공격과 방어 기법을 이해합니다.
- SQL 인젝션 방어 원리를 이해합니다.
- 비밀번호 해싱 알고리즘을 이해합니다.
- 파일 업로드 보안을 이해합니다.

## XSS 방어

```php
<?php
// 1. 출력 인코딩 (필수)
echo htmlspecialchars($userInput, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

// 2. CSP 헤더
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com");

// CSRF 방어
session_start();
$token = bin2hex(random_bytes(32));
$_SESSION['csrf_token'] = $token;

// 폼에 포함
echo '<input type="hidden" name="csrf_token" value="' . $token . '">';

// 검증
if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'] ?? '')) {
    die('CSRF 토큰 검증 실패');
}

// SQL 인젝션 방어
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
$stmt->execute([':id' => $userId]);

// 비밀번호 해싱
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
if (password_verify($inputPassword, $hash)) {
    // 로그인 성공
}
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Stored XSS, Reflected XSS, DOM-based XSS의 차이는 무엇인가요?</strong></summary>

**Stored XSS**(저장형): 악성 스크립트가 서버 DB에 저장되고(게시글, 댓글), 다른 사용자가 페이지를 방문할 때 실행됩니다. 가장 위험합니다. **Reflected XSS**(반사형): URL 파라미터에 포함된 스크립트가 서버 응답에 그대로 반영되어 실행됩니다. 피싱 링크로 유포됩니다. **DOM-based XSS**(DOM 기반): 서버를 거치지 않고 클라이언트 JavaScript가 URL 해시나 `document.referrer` 등을 innerHTML으로 직접 삽입할 때 발생합니다. Stored XSS 방어는 출력 인코딩 + CSP, Reflected는 입력 필터링 + 인코딩, DOM-based는 innerHTML/textContent 사용과 DOMPurify 라이브러리로 대응합니다.
</details>

<details>
<summary><strong>Q: password_hash는 어떤 알고리즘을 사용하나요?</strong></summary>

PHP 8.0+에서 `password_hash()`의 기본 알고리즘은 `PASSWORD_BCRYPT`입니다(bcrypt, Blowfish 기반). `PASSWORD_ARGON2I`(Argon2i — Argon2의 데이터 독립형, side-channel 방어)와 `PASSWORD_ARGON2ID`(Argon2id — Argon2i + Argon2d 혼합, 가장 안전)도 지원합니다. Argon2id는 2023년 기준 권장됩니다: `password_hash($password, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 3])`. `password_needs_rehash()`로 기존 해시가 더 강력한 알고리즘으로 업그레이드가 필요한지 확인할 수 있습니다.
</details>

<details>
<summary><strong>Q: hash_equals()가 === 비교보다 안전한 이유는 무엇인가요?</strong></summary>

`hash_equals()`는 **타이밍 공격(Timing Attack)을 방어**합니다. 일반 `===` 비교는 첫 번째 다른 바이트에서 즉시 false를 반환하므로, 공격자가 응답 시간을 측정하여 올바른 값을 유추할 수 있습니다. `hash_equals()`는 두 입력의 **모든 바이트를 비교**하고, 비교 대상 문자열의 길이도 고정하여 실행 시간이 항상 일정합니다. CSRF 토큰, HMAC 서명, 비밀번호 확인 등 타이밍 정보가 중요한 비교에는 항상 `hash_equals()`를 사용하세요.
</details>

<details>
<summary><strong>Q: 파일 업로드 보안에서 MIME 타입 검증만으로 충분한가요?</strong></summary>

**MIME 타입 검증만으로는 부족합니다**. 브라우저가 보내는 `Content-Type`은 조작이 가능합니다. 실제 파일 검증은 1) **파일 매직 바이트**(시그니처) 확인 — `finfo_file($finfo, $tmpFile, FILEINFO_MIME_TYPE)`이 실제 파일 내용을 분석, 2) **확장자 화이트리스트** — `['jpg', 'png', 'pdf']`만 허용, 3) **이미지 재압축** — 업로드된 이미지를 GD/ImageMagick으로 다시 인코딩(EICAR/WebShell 실행 방지), 4) **`exif_imagetype()`** — 실제 이미지 파일인지 확인. 또한 `move_uploaded_file()`로 저장할 때는 웹 루트 밖에 저장하고, `disable_functions`에 exec/system/passthrough를 추가하세요.
</details>

<details>
<summary><strong>Q: CSRF 방어에서 SameSite 쿠키만으로 충분한가요?</strong></summary>

**SameSite 쿠키만으로는 완전한 CSRF 방어가 되지 않습니다**. SameSite=Lax는 GET 요청과 Top-level 탐색에서 쿠키를 전송하므로, GET 기반 상태 변경(권장되지 않지만 존재)은 방어할 수 없습니다. SameSite=Strict는 링크 클릭 시에도 쿠키를 전송하지 않아 사용자 경험을 해칠 수 있습니다. 가장 안전한 방법은 **Synchronizer Token Pattern** + **SameSite=Lax**를 함께 사용하는 것입니다. Laravel 등 주요 프레임워크는 자동으로 CSRF 토큰 검증을 수행하므로 프레임워크의 보안 기능을 활용하는 것이 좋습니다.
</details>

---

## 요약

- **XSS 방어**: `htmlspecialchars()`(출력 인코딩) + CSP 헤더(스크립트 출처 제한)
- **CSRF 방어**: Synchronizer Token Pattern + SameSite 쿠키
- **SQL 인젝션 방어**: Prepared statement(네이티브/에뮬레이트), SQL 문법과 데이터 분리
- **비밀번호**: `password_hash()`(bcrypt, Argon2id), 자동 salt 생성, 타이밍 방어 hash_equals
- **파일 업보드**: 매직 바이트 검증 + 확장자 화이트리스트 + 이미지 재압축
- **CSP 헤더**: 2차 방어선, XSS가 있더라도 스크립트 실행 제한
