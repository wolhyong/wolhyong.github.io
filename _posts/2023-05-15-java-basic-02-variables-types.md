---
layout: post
title: "Java 변수와 타입 — 원시 타입, 참조 타입, 형변환, 상수, var"
description: "Java의 변수와 데이터 타입을 메모리 레벨에서 심층 학습합니다. 원시 타입(primitive)이 Stack에 값 자체를 저장하는 방식과 참조 타입(reference)이 Heap의 객체 주소를 저장하는 방식, 자동 형변환( widening)과 명시적 형변환(narrowing)의 데이터 손실 위험, final 상수의 컴파일 타임 상수 풀 최적화, var 키워드의 타입 추론이 컴파일 타임에만 동작하는 원리를 다룹니다."
date: 2023-05-15 10:00:00 +0900
category: java
tags: [java, variables, data-types, primitive, type-casting, var, final]
level: basic
---

Java는 정적 타입 언어로, 모든 변수는 사용 전에 타입이 선언되어야 합니다. 타입은 크게 원시 타입과 참조 타입으로 나뉩니다.

> **💡 핵심 정리** · Java의 원시 타입(`int`, `double`, `boolean` 등 8개)은 Stack 프레임에 값 자체를 저장하며, 참조 타입(`String`, `Integer` 등)은 Heap에 객체를 생성하고 Stack에 4/8바이트 주소를 저장합니다. `final` 키워드는 원시 타입에서 컴파일 타임 상수로 최적화되지만, 참조 타입에서는 참조 불변만 보장합니다. `var`는 컴파일러가 초기화 표현식의 타입을 추론하여 바이트코드에 명시적 타입을 기록하므로 런타임 오버헤드가 없습니다.

---

## 📚 수업 목표

- 8가지 원시 타입의 크기와 범위를 이해합니다.
- 원시 타입과 참조 타입의 메모리 저장 방식을 이해합니다.
- 형변환의 종류와 주의사항을 이해합니다.
- final 키워드의 동작을 이해합니다.
- var의 타입 추론 원리를 이해합니다.

## 원시 타입

```java
// 정수 타입
byte b = 127;           // 1바이트  (-128 ~ 127)
short s = 32767;        // 2바이트  (-32,768 ~ 32,767)
int i = 2147483647;     // 4바이트  (-2.1B ~ 2.1B)
long l = 9223372036854775807L;  // 8바이트 (끝에 L 필수)

// 실수 타입
float f = 3.14f;        // 4바이트  (끝에 f 필수)
double d = 3.14159;     // 8바이트  (기본 실수 타입)

// 논리 타입
boolean bool = true;    // JVM 구현에 따라 1바이트 또는 4바이트

// 문자 타입
char c = 'A';           // 2바이트  (유니코드, 0 ~ 65535)
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: int와 Integer의 차이는 무엇인가요?</strong></summary>

**int**는 원시 타입으로 Stack에 값(4바이트)을 직접 저장합니다. null을 가질 수 없습니다. **Integer**는 참조 타입(래퍼 클래스)으로 Heap에 객체를 생성하고 Stack에 주소(4/8바이트)를 저장합니다. null을 가질 수 있고, 컬렉션(List<Integer>)에 사용할 수 있습니다. Java 5+의 오토박싱/언박싱으로 자동 변환되지만, 루프 안에서는 성능 저하가 발생할 수 있습니다.
</details>

<details>
<summary><strong>Q: float과 double 중 어떤 것을 사용해야 하나요?</strong></summary>

**double**을 기본으로 사용하세요. float은 정밀도가 6~7자리로 제한되어 있어 금융 계산에 부적합하고, 미세한 오차가 누적될 수 있습니다. double은 15~16자리 정밀도를 제공합니다. 메모리가 제한적이거나 대규모 배열을 다룰 때만 float을 고려하세요. 정확한 십진 연산이 필요하면 `BigDecimal`을 사용해야 합니다.
</details>

<details>
<summary><strong>Q: var를 사용해도 타입 안전성이 유지되나요?</strong></summary>

네, `var`는 **컴파일 타입에 타입이 결정**되므로 런타임 타입 안전성을 보장합니다. `var x = "Hello"`는 컴파일러가 `String`으로 추론하고 바이트코드에도 `String`으로 기록됩니다. 하지만 메서드 리턴 타입, 필드, 매개변수에는 사용할 수 없고, 반드시 초기화가 필요합니다. 과도한 `var` 사용은 가독성을 해칠 수 있으므로, 로컬 변수에서 타입이 명확할 때만 사용하세요.
</details>

<details>
<summary><strong>Q: 형변환 시 데이터 손실은 어떻게 확인하나요?</strong></summary>

명시적 형변환(casting)은 더 큰 타입에서 더 작은 타입으로 변환할 때 발생합니다. `int i = 300; byte b = (byte)i;` → b = 44 (300 - 256 = 44, 하위 1바이트만 유지). 실수→정수 변환은 소수점이 버려집니다. `(int)3.99` = 3. `Math.addExact()`나 `Math.toIntExact()` 메서드를 사용하면 오버플로우 시 예외를 발생시켜 안전하게 변환할 수 있습니다.
</details>

<details>
<summary><strong>Q: String은 원시 타입인가요? 왜 특별한가요?</strong></summary>

String은 **참조 타입**이지만, Java에서 특별 대우를 받습니다. 1) **String Pool**: 문자열 리터럴은 Heap 내 String Pool에 저장되어 재사용됩니다(`new String()`은 Pool을 사용하지 않음). 2) **불변(immutable)**: `String` 객체는 생성 후 변경할 수 없습니다(보안, 스레드 안전성, 캐싱). 3) **+ 연산자**: 컴파일러가 `StringBuilder`로 변환하여 최적화합니다.
</details>

---

## 요약

- **원시 타입**: byte(1B), short(2B), int(4B), long(8B), float(4B), double(8B), boolean, char(2B)
- **참조 타입**: Heap에 객체, Stack에 주소(4/8B)
- **형변환**: 자동(작은→큰), 명시적(큰→작은, 데이터 손실 주의)
- **final**: 원시 타입은 컴파일 타임 상수, 참조 타입은 참조 불변
- **var**: 컴파일 타임 타입 추론, 런타임 오버헤드 없음
