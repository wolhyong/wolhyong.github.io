---
layout: post
title: "Java 제어문 — 조건문, 반복문, switch, break/continue, 레이블"
description: "Java의 제어문을 바이트코드 레벨에서 심층 학습합니다. if-else의 조건부 분기와 tableswitch/lookupswitch 바이트코드, for/while 반복문의 JVM 프레임 변수 갱신 과정, switch 문의 컴파일러 최적화(tableswitch: O(1) vs lookupswitch: O(log n)), 향상된 for-each의 Iterable/Iterator 프로토콜 사용, break/continue와 레이블을 활용한 중첩 루프 제어를 다룹니다."
date: 2023-05-22 10:00:00 +0900
category: java
tags: [java, control-flow, if-else, switch, for-loop, while, break, continue]
level: basic
---

제어문은 프로그램의 실행 흐름을 결정합니다. Java는 조건문, 반복문, 분기문을 통해 다양한 제어 구조를 제공합니다.

> **💡 핵심 정리** · Java의 `if-else`는 `if_icmpne`, `if_icmplt` 등 조건부 분기 바이트코드로 변환됩니다. `switch`는 값이 연속적이면 `tableswitch`(O(1) 점프 테이블), 불연속적이면 `lookupswitch`(O(log n) 이진 탐색)로 최적화됩니다. `for-each`는 배열의 경우 `iaload` 바이트코드로 직접 접근하고, 컬렉션은 `Iterator.hasNext()`/`next()` 메서드 호출로 변환됩니다.

---

## 📚 수업 목표

- if-else와 switch의 바이트코드 차이를 이해합니다.
- for, while, do-while의 차이점을 이해합니다.
- 향상된 for문의 내부 동작을 이해합니다.
- break와 continue의 차이를 이해합니다.
- 레이블을 사용한 중첩 루프 제어를 이해합니다.

## 조건문

```java
// if-else
int score = 85;
String grade;

if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else {
    grade = "C";
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: if-else와 switch 중 어떤 것이 더 효율적인가요?</strong></summary>

분기 수가 4~5개 이상이면 **switch가 더 효율적**입니다. switch는 바이트코드 레벨에서 점프 테이블(tableswitch/lookupswitch)을 사용하여 O(1) 또는 O(log n)의 시간 복잡도로 분기합니다. if-else 체인은 각 조건을 순차적으로 평가하므로 O(n)입니다. 단, switch는 정수, 문자열(Java 7+), 열거형만 가능하고, 범위 비교는 불가능합니다.
</details>

<details>
<summary><strong>Q: for-each는 모든 상황에서 for보다 빠른가요?</strong></summary>

**배열**의 경우 for-each와 for-index는 거의 동일합니다(컴파일러가 동일한 바이트코드 생성). **ArrayList**도 for-each가 `Iterator`를 사용하지만 내부 최적화로 성능 차이가 거의 없습니다. **LinkedList**에서는 for-index가 매우 느리므로 반드시 for-each를 사용해야 합니다(get(i)가 O(n)이기 때문).
</details>

<details>
<summary><strong>Q: break와 return의 차이는 무엇인가요?</strong></summary>

**break**는 현재 반복문(또는 switch)만 종료하고, 메서드의 나머지 코드는 계속 실행됩니다. **return**은 현재 메서드 자체를 완전히 종료하고 호출자로 값을 반환합니다. 중첩 루프에서 바깥쪽 루프까지 한 번에 빠져나오려면 **레이블(label)**과 함께 `break labelName;`을 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q: switch 문에서 case 값이 겹치면 어떻게 되나요?</strong></summary>

같은 switch 내에서 중복된 case 값은 **컴파일 에러**가 발생합니다. 다른 case 블록에 같은 값을 사용할 수 없습니다. Java 14+의 `switch` 표현식(화살표 `->`)은 더 엄격하게 중복을 검사합니다. 또한 switch 표현식은 모든 경우를 커버해야 하므로 `default`가 필수입니다.
</details>

<details>
<summary><strong>Q: Enhanced switch(Java 14+)의 장점은 무엇인가요?</strong></summary>

Java 14+의 switch 표현식은: 1) 화살표(`->`)로 가독성 향상과 fall-through 방지, 2) 표현식으로 사용 가능(변수에 직접 할당: `String result = switch(x) { case 1 -> "one"; ... }`), 3) `yield` 키워드로 블록에서 값 반환, 4) 패턴 매칭(Java 17+)으로 타입 검사까지 가능합니다. 전통적인 switch는 fall-through가 기본이라 `break` 누수가 흔한 버그였습니다.
</details>

---

## 요약

- **if-else**: 순차적 조건 평가 O(n), 범위/복합 조건에 적합
- **switch**: 점프 테이블 O(1)/O(log n), 정수/문자열/열거형
- **for**: 초기화-조건-증감의 명시적 제어
- **for-each**: 배열/Iterable에 간결한 반복
- **break/continue**: 루프 제어, 레이블로 중첩 루프 탈출 가능
