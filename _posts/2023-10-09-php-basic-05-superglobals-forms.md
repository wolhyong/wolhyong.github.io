---
layout: post
title: "PHP 슈퍼글로벌과 폼 처리 — $_GET, $_POST, $_SERVER, $_SESSION"
description: "PHP의 슈퍼글로벌 변수와 폼 처리를 SAPI 레벨에서 심층 학습합니다. $_GET/$_POST가 SAPI(Server API)에 의해 URL 쿼리 문자열 또는 요청 본문에서 파싱되어 HashTable로 저장되는 과정, $_SERVER의 CGI 환경 변수 매핑, $_SESSION이 파일 기반 세션 핸들러로 serialize/unserialize되어 저장되는 세션 파일 구조, $_COOKIE의 HTTP Cookie 헤더 파싱, 파일 업로드의 $_FILES 구조와 php.ini 설정( upload_max_filesize, post_max_size)을 다룹니다."
date: 2023-10-09 10:00:00 +0900
category: php
tags: [php, superglobals, forms, session, cookie, server-api]
level: basic
---

PHP의 슈퍼글로벌 변수는 모든 스코프에서 접근 가능한 미리 정의된 배열로, SAPI가 요청을 파싱하여 자동으로 채웁니다.

> **💡 핵심 정리** · PHP 슈퍼글로벌은 Zend Engine의 `PG(http_globals)`에 저장되며, `$_GET`은 URL의 쿼리 문자열을 `parse_str()`로 파싱한 결과를, `$_POST`는 HTTP 요청 본문을 Content-Type에 따라 파싱한 결과를 담습니다. `$_SESSION`은 요청 시작 시 `session_start()`가 세션 ID를 쿠키에서 읽어와 저장소(file/redis/memcached)에서 데이터를 역직렬화(unserialize)하여 `$_SESSION`에 로드합니다.

---

## 📚 수업 목표

- 슈퍼글로벌 변수의 종류와 목적을 이해합니다.
- GET/POST 폼 처리 방식을 이해합니다.
- 세션과 쿠키의 동작 과정을 이해합니다.
- 파일 업로드 처리와 설정을 이해합니다.

## GET 폼 처리

```php
<?php
// form.html
?>
<form method="GET" action="search.php">
    <input type="text" name="q" placeholder="검색어">
    <input type="number" name="page" value="1">
    <button type="submit">검색</button>
</form>

<?php
// search.php — URL: search.php?q=php&page=1
$query = $_GET['q'] ?? '';
$page = (int)($_GET['page'] ?? 1);

// 안전한 출력
echo htmlspecialchars($query, ENT_QUOTES, 'UTF-8');
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: GET과 POST의 차이는 무엇인가요?</strong></summary>

**GET**은 URL 쿼리 문자열로 데이터를 전송합니다(예: `?name=value`). 길이 제한(브라우저/서버별 약 2KB~8KB)이 있고 URL에 데이터가 노출됩니다. 캐싱 가능하고 북마크할 수 있습니다. **POST**는 HTTP 요청 본문(body)으로 데이터를 전송합니다. 길이 제한이 사실상 없고(p hp.ini의 `post_max_size`로 제어) URL에 데이터가 노출되지 않습니다. 캐싱되지 않고 북마크할 수 없습니다. 검색/조회는 GET, 데이터 생성/수정/삭제는 POST를 사용하세요.
</details>

<details>
<summary><strong>Q: $_REQUEST는 안전한가요?</strong></summary>

`$_REQUEST`는 `$_GET`, `$_POST`, `$_COOKIE`를 합친 배열입니다. `php.ini`의 `request_order`(기본: GP)로 우선순위를 설정할 수 있습니다. **보안상 `$_REQUEST` 사용은 권장되지 않습니다**. 어떤 HTTP 메서드로 데이터가 왔는지 명확하지 않아 CSRF(Cross-Site Request Forgery)에 취약해질 수 있습니다. 항상 `$_GET`과 `$_POST`를 명시적으로 사용하세요.
</details>

<details>
<summary><strong>Q: 세션은 어떻게 동작하나요?</strong></summary>

1) `session_start()`가 호출되면 PHP는 `PHPSESSID` 쿠키(기본 이름)에서 세션 ID를 읽습니다. 2) 세션 ID가 없으면 새 ID를 생성하고 쿠키로 클라이언트에 전송합니다. 3) 세션 ID에 해당하는 데이터를 저장소(기본: `/tmp/sess_` 파일)에서 읽어 `unserialize()`합니다. 4) 스크립트 종료 시 `$_SESSION`의 내용을 `serialize()`하여 저장소에 씁니다. 세션 데이터는 서버에 저장되고, 클라이언트에는 세션 ID만 쿠키로 저장됩니다.
</details>

<details>
<summary><strong>Q: 파일 업로드 시 주의할 점은 무엇인가요?</strong></summary>

1) `php.ini`의 `upload_max_filesize`(기본 2MB)와 `post_max_size`(기본 8MB)를 확인하세요. 2) `MAX_FILE_SIZE` 히든 필드를 폼에 포함하면 클라이언트 측에서 크기를 제한할 수 있습니다. 3) `$_FILES['file']['error']`로 업로드 에러를 반드시 확인하세요(UPLOAD_ERR_OK = 0). 4) `is_uploaded_file()`과 `move_uploaded_file()`로 안전하게 파일을 이동하세요. 5) 업로드된 파일의 확장자와 MIME 타입을 검증하여 보안 위협을 방지하세요.
</details>

<details>
<summary><strong>Q: htmlspecialchars()를 사용해야 하는 이유는 무엇인가요?</strong></summary>

`htmlspecialchars()`는 `&`, `"`, `'`, `<`, `>` 같은 HTML 특수 문자를 HTML 엔티티로 변환하여 **XSS(Cross-Site Scripting) 공격을 방지**합니다. 사용자 입력을 그대로 HTML에 출력하면 `<script>alert('xss')</script>` 같은 코드가 실행될 수 있습니다. `ENT_QUOTES` 플래그로 작은따옴표도 변환하고, `'UTF-8'`로 인코딩을 명시하는 것이 좋습니다. 모든 사용자 입력 출력 시 필수입니다.
</details>

---

## 요약

- **$_GET**: URL 쿼리 문자열 파싱, 검색/조회용
- **$_POST**: 요청 본문 파싱, 생성/수정용
- **$_SERVER**: CGI 환경 변수, 서버/요청 정보
- **$_SESSION**: 서버 측 세션 저장소, `session_start()`로 초기화
- **$_COOKIE**: HTTP Cookie 헤더 파싱
- **$_FILES**: 파일 업로드 메타데이터
- **보안 필수**: `htmlspecialchars()`, `is_uploaded_file()`, 타입 검증
