---
layout: post
title: "Java 람다와 스트림 — 함수형 인터페이스, Stream API, Optional, 메서드 참조"
description: "Java의 함수형 프로그래밍 요소를 바이트코드와 JVM 레벨에서 심층 학습합니다. 람다 표현식이 invokedynamic(Java 7+)으로 컴파일 타임에 LambdaMetafactory를 통해 함수형 인터페이스 인스턴스로 변환되는 과정, Stream API의 lazy 평가(중간 연산이 최종 연산까지 지연됨)와 파이프라인 구조(Spliterator → Sink 체인), Optional의 값 존재 여부에 따른 분기 처리, 메서드 참조(ClassName::method)의 invokedynamic 최적화를 다룹니다."
date: 2023-07-17 10:00:00 +0900
category: java
tags: [java, lambda, stream, functional-interface, optional, method-reference, invokedynamic]
level: intermediate
---

Java 8에서 도입된 람다와 스트림은 Java에 함수형 프로그래밍 스타일을 가져왔습니다. 컬렉션 처리를 선언적이고 병렬화 가능하게 만듭니다.

> **💡 핵심 정리** · Java 람다는 `invokedynamic` 바이트코드로 변환되며, 첫 호출 시 `LambdaMetafactory`가 `CallSite`에 `MethodHandle`을 생성합니다(이후 호출은 캐싱된 핸들 사용). Stream API의 중간 연산(`filter`, `map`)은 새로운 `Sink`를 체인에 추가만 하고, 최종 연산(`collect`, `forEach`) 시점에 Sink 체인을 순회하며 실제 계산을 수행합니다(lazy evaluation). Optional은 값이 있거나 없거나(`Optional.empty()`)의 두 상태만 가지는 불변 컨테이너입니다.

---

## 📚 수업 목표

- 람다의 invokedynamic 변환 과정을 이해합니다.
- Stream API의 중간 연산과 최종 연산의 차이를 이해합니다.
- Optional을 안전하게 사용할 수 있습니다.
- 메서드 참조의 다양한 형태를 이해합니다.
- 스트림의 병렬 처리 원리를 이해합니다.

## 람다 기본

```java
// 함수형 인터페이스
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b);
}

// 람다 표현식
Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;

System.out.println(add.calculate(3, 4));      // 7
System.out.println(multiply.calculate(3, 4)); // 12
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 람다와 익명 클래스의 차이는 무엇인가요?</strong></summary>

람다는 `invokedynamic`으로 컴파일되어 **익명 클래스보다 성능이 좋고** 바이트코드 크기도 작습니다. 익명 클래스는 컴파일 시마다 별도의 `.class` 파일이 생성되지만, 람다는 `LambdaMetafactory`가 런타임에 동적으로 생성합니다. 또한 람다는 `this`가 람다를 정의한 외부 클래스를 가리키지만, 익명 클래스에서 `this`는 익명 클래스 자신을 가리킵니다.
</details>

<details>
<summary><strong>Q: 스트림에서 중간 연산이 실행되지 않는 이유는 무엇인가요?</strong></summary>

스트림은 **lazy evaluation**을 사용하기 때문입니다. `filter()`, `map()`, `sorted()` 같은 중간 연산은 **파이프라인을 구성만 하고 실제 실행은 하지 않습니다**. `collect()`, `forEach()`, `count()` 같은 **최종 연산**이 호출될 때 모든 중간 연산이 한 번에 실행됩니다. 이를 통해 각 요소를 한 번만 처리하고, 불필요한 연산(예: takeWhile에서 조건 불만족 시 중단)을 건너뛸 수 있습니다.
</details>

<details>
<summary><strong>Q: parallelStream()을 사용하면 항상 더 빠른가요?</strong></summary>

**아니요.** 병렬 스트림이 효과적이려면: 1) 데이터 크기가 충분히 클 것(수천 개 이상), 2) CPU 바운드 작업일 것(I/O 바운드는 오히려 느림), 3) 공유 가변 상태가 없을 것, 4) 순서가 중요하지 않을 것. 작은 데이터셋이나 순서가 중요한 작업에서는 오히려 병렬 처리 오버헤드로 인해 순차 스트림이 더 빠릅니다. `ForkJoinPool.commonPool()`을 사용하므로 다른 병렬 작업과 영향을 주고받을 수 있습니다.
</details>

<details>
<summary><strong>Q: Optional을 사용할 때 자주 하는 실수는 무엇인가요?</strong></summary>

1) **`Optional.get()`을 null 체크 없이 호출** → NoSuchElementException. 2) **필드 타입으로 Optional 사용** → Serializable하지 않고 성능 오버헤드. 3) **메서드 인자로 Optional 사용** → 과도한 Optional 래핑. 4) **isPresent()-get() 패턴** → `ifPresent()`, `orElse()`, `orElseThrow()`로 대체. 5) **기본 타입 Optional 무시** → `OptionalInt`, `OptionalLong`, `OptionalDouble` 사용.
</details>

<details>
<summary><strong>Q: 메서드 참조와 람다 중 어떤 것이 더 좋은가요?</strong></summary>

가능하면 **메서드 참조**가 더 간결하고 가독성이 좋습니다. 바이트코드 레벨에서도 메서드 참조가 람다보다 약간 더 효율적일 수 있습니다. `list.stream().map(String::toUpperCase)`가 `list.stream().map(s -> s.toUpperCase())`보다 명확합니다. 단, 람다가 더 짧거나 메서드 참조가 오히려 복잡해 보인다면 람다를 사용하세요.
</details>

---

## 요약

- **람다**: invokedynamic + LambdaMetafactory, 함수형 인터페이스 인스턴스
- **Stream API**: 중간 연산(lazy) → 최종 연산(eager) 파이프라인
- **Optional**: null 안전성, map/flatMap/filter로 함수형 체이닝
- **메서드 참조**: ClassName::staticMethod, instance::method, ClassName::new
- **병렬 스트림**: ForkJoinPool 기반, 대용량 CPU 작업에 효과적
