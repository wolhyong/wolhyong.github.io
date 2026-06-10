---
layout: post
title: "자바스크립트 테스팅 - Jest, 단위 테스트, 모킹, E2E 테스트 정리"
description: "Jest를 활용한 단위 테스트 작성, 테스트 더블(스파이, 모크, 스터브), 테스트 설계 전략을 학습합니다."
date: 2017-01-23 10:00:00 +0900
category: javascript
level: advanced
tags: [javascript, testing, jest, 웹]
---

테스트는 코드의 품질을 보장하고 리팩토링을 안전하게 만드는 핵심 관행입니다. 자바스크립트 테스팅의 기초부터 실전까지 학습합니다.

## Jest 기초

```javascript
// math.js
export function add(a, b) { return a + b; }
export function divide(a, b) {
  if (b === 0) throw new Error("0으로 나눌 수 없습니다");
  return a / b;
}

// math.test.js
import { add, divide } from "./math";

describe("math", () => {
  describe("add", () => {
    test("두 숫자를 더한다", () => {
      expect(add(2, 3)).toBe(5);
    });
    test("음수를 처리한다", () => {
      expect(add(-1, 1)).toBe(0);
    });
  });

  describe("divide", () => {
    test("나눗셈을 수행한다", () => {
      expect(divide(10, 2)).toBe(5);
    });
    test("0으로 나누면 에러", () => {
      expect(() => divide(10, 0)).toThrow("0으로 나눌 수 없습니다");
    });
  });
});
```

## 테스트 더블 (Mocking)

```javascript
// API 호출 테스트
import { fetchUserData } from "./api";

test("사용자 데이터를 가져온다", async () => {
  // Mock 함수 생성
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ name: "홍길동" })
  });

  global.fetch = mockFetch;

  const user = await fetchUserData(1);
  expect(user.name).toBe("홍길동");
  expect(mockFetch).toHaveBeenCalledWith("/api/users/1");
});
```

## 비동기 테스트

```javascript
test("데이터 로딩", async () => {
  const data = await loadData();
  expect(data).toBeDefined();
  expect(data.length).toBeGreaterThan(0);
});

test("타임아웃 에러", async () => {
  await expect(slowOperation()).rejects.toThrow("Timeout");
}, 5000); // 타임아웃 5초
```

## 테스트 케이스 설계 전략

```javascript
// 경계값 테스트
test.each([
  [0, 0, 0],
  [1, 1, 2],
  [-1, -1, -2],
  [Number.MAX_SAFE_INTEGER, 1, Number.MAX_SAFE_INTEGER + 1],
])("add(%i, %i) === %i", (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});

// 에지 케이스
describe("엣지 케이스", () => {
  test("빈 배열 처리", () => {
    expect(getMax([])).toBeUndefined();
  });
  test("undefined 입력", () => {
    expect(formatName(undefined)).toBe("Unknown");
  });
});
```

## 마무리

- **`describe`** 로 관련 테스트를 묶고, **`test`** 로 개별 케이스를 작성하세요
- **모킹**으로 외부 의존성(API, DB)을 격리하여 테스트하세요
- **경계값**과 **엣지 케이스**를 반드시 포함하세요
- 테스트는 "어떻게"가 아닌 "무엇을" 검증하는 데 집중하세요

이로써 자바스크립트 기본~고급 과정을 모두 마쳤습니다! 실전 프로젝트에서 적용하며 실력을 키워나가세요!
