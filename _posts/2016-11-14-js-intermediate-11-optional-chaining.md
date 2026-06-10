---
layout: post
title: "자바스크립트 옵셔널 체이닝과 널 병합 연산자 - ?.과 ?? 완벽 활용"
description: "옵셔널 체이닝(?.)과 널 병합 연산자(??)의 동작 원리, 실전 활용법, 기존 패턴과의 차이를 예제와 함께 설명합니다."
date: 2016-11-14 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, optional-chaining, nullish, 웹]
---

API 응답이나 중첩된 객체에 접근할 때 `Cannot read property of undefined` 에러는 자바스크립트 개발자가 가장 자주 마주하는 문제입니다. 옵셔널 체이닝과 널 병합은 이 문제를 깔끔하게 해결합니다.

## 옵셔널 체이닝 (?.)

```javascript
const user = {
  name: "홍길동",
  address: {
    city: "서울"
  }
};

// null/undefined이면 자동으로 undefined 반환 (에러 없음)
const city = user?.address?.city;       // "서울"
const zip = user?.address?.zipCode;     // undefined
const street = user?.work?.address?.street; // undefined
```

### 다양한 사용법

```javascript
// 함수 호출
user?.getName?.();       // 함수가 없으면 undefined

// 배열 접근
const first = arr?.[0];  // arr이 null/undefined이면 undefined

// 동적 키
const value = obj?.[dynamicKey];
```

## 널 병합 연산자 (??)

```javascript
// ?? : null 또는 undefined일 때만 기본값
const name = null ?? "이름 없음";    // "이름 없음"
const age = 0 ?? 18;                // 0 (0은 null/undefined가 아님)
const empty = "" ?? "기본값";        // "" (빈 문자열도 유지)

// || vs ?? — 중요한 차이
const count = 0 || 10;  // 10 (0은 falsy → 기본값 적용)
const count2 = 0 ?? 10; // 0  (0은 null/undefined 아님 → 그대로)
```

### 실전 활용

```javascript
// API 응답 처리
function getDisplayName(user) {
  return user?.nickname ?? user?.name ?? "게스트";
}

// 설정 병합
const config = {
  timeout: userConfig?.timeout ?? 5000,
  retries: userConfig?.retries ?? 3,
  baseUrl: userConfig?.baseUrl ?? "https://api.example.com"
};
```

## 조합 활용

```javascript
// 복잡한 중첩 구조에서 안전하게 값 추출
const order = getOrder();
const firstItemName = order?.items?.[0]?.name ?? "상품 없음";
const total = order?.payment?.total ?? 0;
```

## 마무리

- **`?.`** 은 null/undefined 체크를 간결하게 만들어줍니다
- **`??`** 는 `||`와 달리 falsy 값(0, "")을 보존합니다
- API 응답 처리, 설정 객체, 복잡한 중첩 구조에서 **반드시 사용**하세요
- 둘을 조합하면 **안전한 코드**를 매우 적은 코드로 작성할 수 있습니다

다음 수업부터는 고급 과정인 this와 컨텍스트를 학습합니다!
