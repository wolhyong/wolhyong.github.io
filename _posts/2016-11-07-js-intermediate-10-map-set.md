---
layout: post
title: "자바스크립트 Map과 Set - 개념, 활용, 기존 자료구조와 비교"
description: "ES6 Map과 Set의 특징과 사용법을 기존 객체/배열과 비교하며 실전 활용 예제를 학습합니다."
date: 2016-11-07 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, map, set, data-structures, 웹]
---

Map과 Set은 ES6에 도입된 새로운 자료구조입니다. 기존 객체와 배열의 한계를 보완하며, 특정 상황에서 더 효율적이고 안전합니다.

## Map — 키-값 쌍의 순서 보장

```javascript
const map = new Map();

// 설정 — 모든 타입이 키가 될 수 있음
map.set("name", "홍길동");
map.set(42, "숫자 키");
map.set(true, "불리언 키");

// 객체와 달리 객체도 키로 사용 가능
const obj = { id: 1 };
map.set(obj, "객체 키!");

// 읽기
map.get("name");      // "홍길동"
map.get(obj);         // "객체 키!"
map.has("name");      // true
map.size;             // 3

// 삭제
map.delete(42);
map.clear(); // 전체 삭제
```

### Map의 장점

- **모든 타입**이 키가 될 수 있습니다 (객체, 함수 등)
- **삽입 순서**가 보장됩니다
- **`size`** 속성으로 크기를 바로 알 수 있습니다
- **이터러블** — `for...of`, `forEach` 사용 가능

```javascript
// Map 순회
for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
}

// 배열로 변환
const entries = [...map];         // [[key1, val1], [key2, val2]]
const keys = [...map.keys()];    // [key1, key2]
const values = [...map.values()]; // [val1, val2]
```

## Set — 중복 없는 값의 집합

```javascript
const set = new Set([1, 2, 3, 2, 1]);
console.log(set); // Set { 1, 2, 3 } — 중복 자동 제거

set.add(4);
set.has(2);    // true
set.size;      // 4
set.delete(1);
```

### Set 실전 활용

```javascript
// 배열 중복 제거
const arr = [1, 1, 2, 3, 3, 4];
const unique = [...new Set(arr)]; // [1, 2, 3, 4]

// 포함 여부 빠르게 검사 (배열 includes보다 O(1))
const allowed = new Set(["admin", "editor", "viewer"]);
if (allowed.has(userRole)) {
  // 허용된 역할
}

// 교집합, 합집합, 차집합
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);

const intersection = new Set([...setA].filter(x => setB.has(x))); // {2, 3}
const union = new Set([...setA, ...setB]); // {1, 2, 3, 4}
const diff = new Set([...setA].filter(x => !setB.has(x))); // {1}
```

## Map vs 객체

| 기능 | Map | 객체 |
|------|-----|------|
| 키 타입 | 모든 타입 | 문자열, Symbol만 |
| 순서 보장 | ✅ | ❌ (ES2015+ 일부 보장) |
| 크기 | `.size` | `Object.keys().length` |
| 성능 | 대량 삽입/삭제에 유리 | 소규모에 유리 |

## 마무리

- **Map**은 키 타입 제한이 없고 순서가 보장되어 객체보다 유연합니다
- **Set**은 중복 제거와 빠른 포함 검사에 유용합니다
- **배열 중복 제거**는 `new Set()`이 가장 간결합니다
- 키가 문자열이 아니거나, 삽입 순서가 중요하면 **Map**을 선택하세요

다음 수업에서는 옵셔널 체이닝과 널 병합 연산자를 심화 학습합니다!
