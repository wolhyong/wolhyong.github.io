---
layout: post
title: "PHP 파일 처리 — fopen/fread/fwrite, SplFileObject, 디렉토리 탐색, 파일 잠금"
description: "PHP의 파일 처리 시스템을 OS 시스템 콜 레벨에서 심층 학습합니다. fopen()이 C 라이브러리의 fopen()을 호출하여 내부 FILE* 버퍼(stdio 버퍼, 기본 8KB)를 생성하는 과정, fread()/fwrite()가 버퍼링된 I/O로 read()/write() 시스템 콜을 최소화하는 방식, flock()의 조언적 잠금(advisory locking)이 LOCK_SH(공유)/LOCK_EX(배타적)로 동작하는 원리, SplFileObject의 객체 지향 파일 처리와 CSV 파싱(중첩된 줄바꿈, 인용부호 처리), 디렉토리 탐색(scandir, RecursiveDirectoryIterator)과 GlobIterator를 다룹니다."
date: 2023-11-06 10:00:00 +0900
category: php
tags: [php, file, i-o, stream, flock, splfileobject]
level: intermediate
---

PHP의 파일 처리는 C 표준 라이브러리의 stdio 함수를 기반으로 하며, PHP 스트림 래퍼(stream wrapper)를 통해 다양한 프로토콜(http://, ftp://, php:// 등)을 지원합니다.

> **💡 핵심 정리** · PHP의 `fopen()`은 C의 `fopen()`을 호출하여 FILE* 스트림을 생성하고, 기본 8KB 버퍼를 할당합니다. `flock($fp, LOCK_EX)`은 `flock()` 시스템 콜로 조언적 잠금(advisory lock)을 설정하며, PHP 프로세스가 종료되면 OS가 자동으로 잠금을 해제합니다. `SplFileObject`는 내부적으로 `fgets()`를 C 레벨에서 호출하여 대용량 CSV 파일도 메모리 효율적으로 처리합니다. `RecursiveDirectoryIterator`는 내부적으로 `readdir()` 시스템 콜을 사용하여 디렉토리 트리를 재귀적으로 순회합니다.

---

## 📚 수업 목표

- PHP 파일 I/O의 버퍼링 메커니즘을 이해합니다.
- 파일 잠금(flock)의 동작을 이해합니다.
- SplFileObject의 장점을 이해합니다.
- 디렉토리 탐색 방법을 이해합니다.
- 스트림 래퍼의 개념을 이해합니다.

## 파일 읽기/쓰기

```php
<?php
// 파일 쓰기
$fp = fopen('data.txt', 'w');
if (flock($fp, LOCK_EX)) {  // 배타적 잠금
    fwrite($fp, "Hello, World!\n");
    fwrite($fp, "PHP File Handling\n");
    flock($fp, LOCK_UN);     // 잠금 해제
}
fclose($fp);

// 파일 읽기
$fp = fopen('data.txt', 'r');
if (flock($fp, LOCK_SH)) {  // 공유 잠금
    while (!feof($fp)) {
        $line = fgets($fp);  // 한 줄씩 읽기 (버퍼링됨)
        echo $line;
    }
    flock($fp, LOCK_UN);
}
fclose($fp);

// 간편 함수
file_put_contents('data.txt', "Hello, World!\n", FILE_APPEND | LOCK_EX);
$content = file_get_contents('data.txt');
$lines = file('data.txt');  // 배열로 반환
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: file_get_contents와 fopen+fread의 차이는 무엇인가요?</strong></summary>

`file_get_contents()`는 내부적으로 같은 fopen/fread/fclose를 호출하지만, **전체 파일을 한 번에 메모리에 로드**합니다. 간편하지만 대용량 파일(수백 MB)은 메모리 부족을 일으킬 수 있습니다. `fopen()` + `fread()` 청크 읽기는 **메모리를 제어**할 수 있습니다. PHP 8.1+에서 `file_get_contents()`의 `$offset`과 `$length` 파라미터로 파일의 일부만 읽을 수 있어 유연성이 향상되었습니다.
</details>

<details>
<summary><strong>Q: flock()은 NFS에서도 동작하나요?</strong></summary>

**NFS(Network File System)에서는 flock()이 제대로 동작하지 않을 수 있습니다**. NFS 버전과 구현에 따라 다르지만, 일반적으로 NFS는 lockd(NFS 잠금 데몬)를 통해 잠금을 관리하지만 PHP의 flock()이 이를 항상 올바르게 매핑하지는 않습니다. 네트워크 파일 시스템에서는 데이터베이스 기반 잠금이나 Redis 분산 잠금(Redlock) 같은 대안을 사용하는 것이 안전합니다. 동일 서버의 로컬 파일 시스템에서는 완전히 신뢰할 수 있습니다.
</details>

<details>
<summary><strong>Q: SplFileObject의 장점은 무엇인가요?</strong></summary>

`SplFileObject`는 객체 지향 인터페이스로 파일을 처리합니다: `foreach ($file as $line)` 순회, `fgetcsv()` 내장(CSV 파싱에 인용부호/이스케이프 자동 처리), `seek()`로 임의 위치 이동, `current()/key()`로 Iterator 인터페이스 지원. 대용량 CSV 파일 처리 시 `SplFileObject`의 `setFlags(SplFileObject::READ_CSV)`로 메모리 효율적인 행 단위 CSV 파싱이 가능합니다. 배열보다 직관적이고 일관된 인터페이스를 제공합니다.
</details>

<details>
<summary><strong>Q: PHP 스트림 래퍼(stream wrapper)란 무엇인가요?</strong></summary>

스트림 래퍼는 파일 시스템뿐만 아니라 다양한 프로토콜을 **일관된 fopen/fread/fwrite 인터페이스**로 사용할 수 있게 합니다. 내장 래퍼: `file://`(로컬 파일, 기본), `http://`/`https://`(HTTP 요청), `ftp://`(FTP), `php://`(PHP 내부 I/O — stdin/stdout/stderr, memory/temp), `data://`(인라인 데이터), `compress.zlib://`(압축 파일). `stream_wrapper_register()`로 사용자 정의 래퍼를 구현할 수 있어 클라우드 스토리지(S3)도 동일한 인터페이스로 접근 가능합니다.
</details>

<details>
<summary><strong>Q: include/require와 파일 I/O 함수의 차이는 무엇인가요?</strong></summary>

`include`/`require`는 Zend Engine의 **컴파일 단계**에서 동작합니다. 포함된 파일을 PHP 스크립트로 파싱하고 실행합니다. `fopen`/`file_get_contents`는 **런타임 I/O**로 파일을 데이터로 읽을 뿐 PHP 코드로 실행하지 않습니다. `include`는 파일을 PHP OPcode로 컴파일하여 `op_array`에 추가하고, `file_get_contents`는 단순히 문자열을 반환합니다. 설정 파일에는 `include`(설정을 PHP 코드로 실행)나 `parse_ini_file()`(INI 형식 파싱)을 사용하세요.
</details>

---

## 요약

- **파일 I/O**: fopen(파일 열기) → fread/fwrite(버퍼링 I/O) → fclose(닫기)
- **파일 잠금**: flock(LOCK_SH/LOCK_EX/LOCK_UN), 조언적 잠금, NFS 비호환
- **간편 함수**: file_get_contents(전체 읽기), file_put_contents(전체 쓰기, FILE_APPEND/LOCK_EX)
- **SplFileObject**: 객체 지향 파일 처리, CSV 파싱, Iterator 인터페이스
- **스트림 래퍼**: http://, php://, compress.zlib:// 등 통일된 인터페이스
- **디렉토리**: scandir, GlobIterator, RecursiveDirectoryIterator
