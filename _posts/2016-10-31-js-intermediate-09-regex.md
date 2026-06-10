---
layout: post
title: "자바스크립트 정규표현식 - 패턴 매칭, 캡처 그룹, 실전 활용 정리"
description: "자바스크립트 정규표현식의 문법과 플래그, 주요 메서드, 실전 패턴을 예제와 함께 상세히 설명합니다."
date: 2016-10-31 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, regex, pattern, 웹]
---

정규표현식(RegExp)은 문자열에서 특정 패턴을 찾거나 치환할 때 사용하는 강력한 도구입니다. 이메일, 전화번호, URL 등 다양한 패턴 검증에 활용됩니다.

## 정규표현식 생성

```javascript
// 리터럴 방식 (권장)
const regex = /hello/i;

// 생성자 방식 (동적 패턴)
const dynamic = new RegExp("hello", "i");

// 주요 플래그
// i — 대소문자 무시
// g — 전역 검색 (모든 매칭)
// m — 멀티라인 모드
```

## 핵심 패턴 문법

```javascript
// 문자 매칭
/a/      // "a" 문자
/abc/    // "abc" 문자열

// 점과 와일드카드
/a.c/    // "a" + 임의 문자 + "c" (예: "abc", "a1c")

// 문자 클래스
/[abc]/    // a, b, c 중 하나
/[a-z]/    // a~z 소문자
/[0-9]/    // 숫자
/\d/       // 숫자 (=[0-9])
/\w/       // 단어 문자 (=[a-zA-Z0-9_])
/\s/       // 공백 문자

// Quantifiers
/a+/       // a 1개 이상
/a*/       // a 0개 이상
/a{3}/     // a 정확히 3개
/a{2,4}/   // a 2~4개

// 경계
/^hello/   // 문자열 시작
/world$/   // 문자열 끝
/\bword\b/ // 단어 경계
```

## 주요 메서드

```javascript
const str = "문의: test@example.com 또는 admin@site.com";

// test — 매칭 여부 반환 (가장 자주 사용)
/[\w.]+@[\w.]+/.test(str); // true

// match — 매칭 결과 배열
str.match(/[\w.]+@[\w.]+/g); // ["test@example.com", "admin@site.com"]

// replace — 치환
str.replace(/[\w.]+@[\w.]+/g, "[이메일 숨김]");

// matchAll — 반복자 (캡처 그룹 활용)
const regex = /(\d{3})-(\d{4})-(\d{4})/g;
for (const match of str.matchAll(regex)) {
  console.log(match[0]); // 전체 매칭
  console.log(match[1]); // 첫 번째 캡처 그룹
}
```

## 실전 패턴

```javascript
// 이메일 검증
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 전화번호 검증 (한국)
const phoneRegex = /^0\d{1,2}-\d{3,4}-\d{4}$/;

// URL 검증
const urlRegex = /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;

// HTML 태그 제거
const html = "<p>안녕하세요</p>";
html.replace(/<[^>]+>/g, ""); // "안녕하세요"
```

## 마무리

- **`test()`** 로 간단한 패턴 검증을 하고, **`match()`** 로 상세 결과를 얻습니다
- **캐처 그룹** `()`로 부분 문자열을 추출할 수 있습니다
- 복잡한 정규표현식은 주석을 달아 가독성을 높이세요
- 정규표현식은 **성능에 주의**하세요 (ReDoS 공격 가능)

다음 수업에서는 Map과 Set 자료구조를 학습합니다!
