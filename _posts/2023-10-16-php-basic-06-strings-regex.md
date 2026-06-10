---
layout: post
title: "PHP 문자열과 정규표현식 — 문자열 함수, 패턴 매칭, PCRE 엔진"
description: "PHP의 문자열 처리와 정규표현식을 PCRE(Perl Compatible Regular Expression) 엔진 레벨에서 심층 학습합니다. PHP 문자열이 C 언어의 `char*` 버퍼를 zend_string 구조체(length, hash, val)로 래핑하는 방식, PCRE 엔진의 컴파일(compile) 단계에서 패턴을 내부 바이트코드로 변환하고 실행(match) 단계에서 NFA(Non-deterministic Finite Automaton) 백트래킹으로 매칭하는 과정, preg_match의 PCRE 캡처 그룹 추출, 백트래킹 한계(pcre.backtrack_limit), UTF-8 모드(/u)의 문자 단위 매칭을 다룹니다."
date: 2023-10-16 10:00:00 +0900
category: php
tags: [php, strings, regex, pcre, pattern-matching, utf-8]
level: basic
---

PHP의 문자열과 정규표현식은 C 레벨의 zend_string 구조체와 PCRE(Perl Compatible Regular Expression) 라이브러리를 기반으로 합니다.

> **💡 핵심 정리** · PHP 문자열은 `zend_string` 구조체(`gc` 참조 카운트 + `h` 해시 값(문자열 키 캐시) + `len` 바이트 길이 + `val` C 문자열 버퍼)로 관리됩니다. PCRE 정규표현식 엔진은 `preg_compile()`에서 패턴을 내부 바이트코드(OPCODE 목록)로 변환하고, `pcre_exec()`에서 NFA 백트래킹으로 문자열을 매칭합니다. `pcre.backtrack_limit`(기본 1,000,000)을 초과하면 `preg_last_error() === PREG_BACKTRACK_LIMIT_ERROR`가 발생합니다.

---

## 📚 수업 목표

- PHP 문자열의 zend_string 구조를 이해합니다.
- 주요 문자열 함수의 동작을 이해합니다.
- PCRE 정규표현식 엔진의 동작을 이해합니다.
- UTF-8 문자열 처리를 이해합니다.

## 문자열 기본

```php
<?php
// 문자열 생성
$str1 = "Hello, World!";      // 큰따옴표 (변수 보간)
$str2 = 'Hello, World!';      // 작은따옴표 (리터럴)
$heredoc = <<<EOT
여러 줄 문자열
변수 보간: $str1
EOT;
$nowdoc = <<<'EOT'
여러 줄 문자열
변수 보간 없음: $str1
EOT;

// 주요 문자열 함수
echo strlen("Hello");          // 5 (바이트 수)
echo mb_strlen("안녕", 'UTF-8'); // 2 (문자 수)
echo strpos("Hello World", "World"); // 6 (위치)
echo substr("Hello World", 0, 5); // "Hello"
echo str_replace("World", "PHP", "Hello World"); // "Hello PHP"
echo implode(", ", ["a", "b", "c"]); // "a, b, c"
print_r(explode(",", "a,b,c")); // ["a", "b", "c"]
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: strlen()과 mb_strlen()의 차이는 무엇인가요?</strong></summary>

`strlen()`은 문자열의 **바이트(byte) 수**를 반환합니다. UTF-8에서 한글은 3바이트이므로 `strlen("안녕")`은 6을 반환합니다. `mb_strlen($str, 'UTF-8')`은 **문자(grapheme) 수**를 반환하므로 `mb_strlen("안녕", 'UTF-8')`은 2를 반환합니다. 멀티바이트 문자열을 다룰 때는 항상 `mb_*` 함수를 사용해야 문자열이 깨지지 않습니다. mbstring 확장이 설치되어 있어야 합니다.
</details>

<details>
<summary><strong>Q: preg_match와 preg_match_all의 차이는 무엇인가요?</strong></summary>

`preg_match($pattern, $subject, $matches)`는 첫 번째 일치만 찾고 `$matches[0]`에 저장한 후 1을 반환합니다(일치 없으면 0). `preg_match_all()`은 **모든 일치**를 찾아 `$matches`에 2차원 배열로 저장합니다. 예: 이메일 주소 추출 시 `preg_match_all('/[\\w.]+@[\\w.]+/', $text, $emails)`로 모든 이메일을 찾을 수 있습니다. `PREG_SET_ORDER` 플래그로 결과 배열 구조를 변경할 수 있습니다.
</details>

<details>
<summary><strong>Q: 정규표현식에서 /u 플래그의 역할은 무엇인가요?</strong></summary>

`/u`(UTF-8) 플래그는 PCRE에게 패턴과 대상 문자열이 UTF-8 인코딩임을 알립니다. 이 플래그가 없으면 `.`(점)이 UTF-8 문자를 바이트 단위로 잘못 매칭할 수 있습니다. `/u`를 사용하면 `.`이 UTF-8 문자(멀티바이트)를 하나의 문자로 올바르게 매칭합니다. 또한 유효하지 않은 UTF-8 시퀀스가 있으면 `preg_match()`가 false를 반환하므로 입력 검증에도 유용합니다.
</details>

<details>
<summary><strong>Q: preg_replace의 /e 수정자가 제거된 이유는 무엇인가요?</strong></summary>

`preg_replace`의 `/e`(eval) 수정자는 매칭된 문자열을 PHP 코드로 실행했기 때문에 **심각한 보안 취약점**이었습니다. 사용자 입력이 패턴에 포함되면 임의 코드 실행(RCE)이 가능했습니다. PHP 5.5에서 deprecated, PHP 7.0에서 제거되었습니다. 대신 `preg_replace_callback()`을 사용하세요. 콜백 함수로 안전하게 치환 로직을 구현할 수 있습니다.
</details>

<details>
<summary><strong>Q: preg_match()가 false를 반환하는 이유는 무엇인가요?</strong></summary>

`preg_match()`는 에러 발생 시 `false`를 반환합니다(일치 없음은 0). 주요 원인: 1) **패턴 컴파일 에러** — 잘못된 정규식 문법(PREG_INTERNAL_ERROR, PREG_BAD_REGEX), 2) **백트래킹 한도 초과** — `pcre.backtrack_limit`(기본 1M) 초과(PREG_BACKTRACK_LIMIT_ERROR), 3) **JIT 스택 한도 초과** — `pcre.jit_stack_limit` 초과. `preg_last_error()`로 에러 코드를 확인하고, 항상 `=== false` 또는 `=== 0`으로 반환값을 엄격 비교하세요.
</details>

---

## 요약

- **zend_string 구조**: gc(gc_refcount) + h(해시) + len(길이) + val(버퍼)
- **문자열 함수**: strlen(바이트) vs mb_strlen(문자), str_replace, explode/implode
- **PCRE 엔진**: compile(바이트코드 생성) → match(NFA 백트래킹)
- **패턴**: `/u` UTF-8 모드, 캡처 그룹, `preg_match` vs `preg_match_all`
- **에러 처리**: `preg_last_error()`, 백트래킹 한도, 엄격 비교(===)
